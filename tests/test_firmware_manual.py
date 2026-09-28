"""Nested Manual.bcma validation and deterministic English index/page-0 output.

Synthetic archives embed no Nintendo data. The real-input class runs only when
the private extracted Settings content 1 is available.
"""
import json
import os
from pathlib import Path
import struct
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.build import Builder, SETTINGS, digest, encode
from firmware import manual_bcma
from firmware.manual_bcma import convert, open_outer, open_inner, nested_members, publish

PRIVATE_MANUAL = Path(os.environ.get('FIRMWARE_MANUAL_BCMA',
    '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/multicontent/'
    'verified/extracted/settings/contents/0001-00000038/romfs/Manual.bcma'))
SELECTION = {'EUR_en_index.arc': ('blyt/Index.bclyt',)}
TEXTURES = ('EUR_en_texture.arc', 'Common_texture.arc')


def darc(files):
    """Minimal DARC with root files and one directory level."""
    tree = {}
    for path, data in sorted(files.items()):
        folder, _, name = path.rpartition('/')
        tree.setdefault(folder, []).append((name, data))
    names = bytearray(b'\0\0'); entries = [[1, 0, 0, None, None]]
    def name_at(text):
        offset = len(names); names.extend((text+'\0').encode('utf-16-le')); return offset
    for folder in sorted(tree):
        if folder: directory = len(entries); entries.append([1, name_at(folder), 0, None, None])
        for name, data in tree[folder]: entries.append([0, name_at(name), None, len(data), data])
        if folder: entries[directory][3] = len(entries)
    entries[0][3] = len(entries)
    table_size = len(entries)*12+len(names); payload = (28+table_size+31) & ~31
    body = bytearray(); cursor = payload
    for entry in entries:
        if entry[0] == 0:
            entry[2] = cursor; body += entry[4]+bytes((-len(entry[4])) % 4); cursor = payload+len(body)
    table = b''.join(struct.pack('<III', kind << 24 | name, offset, length) for kind, name, offset, length, _ in entries)
    size = payload+len(body)
    header = struct.pack('<4sHHIIIII', b'darc', 0xfeff, 28, 0x1000000, size, 28, table_size, payload)
    return header+table+bytes(names)+bytes(payload-28-table_size)+bytes(body)


def lz(data, kind=0x10):
    return bytes([kind])+len(data).to_bytes(3, 'little')+b''.join(b'\0'+data[i:i+8] for i in range(0, len(data), 8))


def layout(textures=()):
    lyt1 = struct.pack('<4sIIff', b'lyt1', 20, 1, 320.0, 240.0)
    strings = b''.join(t.encode()+b'\0' for t in textures)
    offsets, at = [], len(textures)*4
    for t in textures: offsets.append(at); at += len(t)+1
    body = struct.pack('<I', len(textures))+b''.join(struct.pack('<I', o) for o in offsets)+strings
    body += bytes((-(8+len(body))) % 4)
    txl1 = struct.pack('<4sI', b'txl1', 8+len(body))+body
    sections = lyt1+txl1
    return struct.pack('<4sHHIIHH', b'CLYT', 0xfeff, 20, 0x2020000, 20+len(sections), 2, 0)+sections


def clim():
    return bytes([0xf0])*32+struct.pack('<4sHHIIHH4sIHHII', b'CLIM', 0xfeff, 20, 0x2020000, 72, 1, 0, b'imag', 16, 8, 8, 13, 32)


def manual(**overrides):
    members = {
        'EUR_en_index.arc': lz(darc({'blyt/Index.bclyt': layout(['tex.bclim'])})),
        'EUR_en_texture.arc': lz(darc({'timg/other.bclim': clim()})),
        'Common_texture.arc': lz(darc({'timg/tex.bclim': clim()})),
        'EUR_de_index.arc': lz(darc({'blyt/Index.bclyt': layout()})),
    }
    members.update(overrides)
    return darc({k: v for k, v in members.items() if v is not None})


class NestedManualTests(unittest.TestCase):
    def run_convert(self, raw, root, **options):
        return convert(raw, Builder(Path(root)), options.get('selection', SELECTION), TEXTURES, None)

    def test_selected_layout_and_texture_keep_nested_provenance(self):
        raw = manual()
        with tempfile.TemporaryDirectory() as temp:
            url, pack = self.run_convert(raw, temp)
            self.assertEqual(url, 'packs/settings/contents/0001-00000038/manual-EUR_en.json')
            self.assertEqual(list(pack['layouts']), ['Index'])
            source = pack['resourceSources']['layouts']['Index']
            self.assertEqual(source, {'titleId': SETTINGS, 'contentIndex': 1, 'contentId': '00000038',
                                      'path': 'Manual.bcma/EUR_en_index.arc/blyt/Index.bclyt', 'sha256': digest(layout(['tex.bclim']))})
            texture = pack['resourceSources']['textures']['tex.bclim']
            self.assertEqual(texture['path'], 'Manual.bcma/Common_texture.arc/timg/tex.bclim')
            self.assertEqual(texture['sha256'], digest(clim()))
            archive = pack['nesting']['archives']['EUR_en_index.arc']
            packed = open_outer(raw)['EUR_en_index.arc']
            self.assertEqual((archive['compression'], archive['sha256']), ('lz10', digest(packed)))
            self.assertEqual(archive['decodedSha256'], digest(darc({'blyt/Index.bclyt': layout(['tex.bclim'])})))
            self.assertEqual(pack['nesting']['container']['sha256'], digest(raw))
            self.assertEqual(pack['manualSelection']['omittedArchives'], ['EUR_de_index.arc'])
            self.assertEqual(json.loads((Path(temp)/url).read_bytes()), pack)
            self.assertEqual(sorted(p.relative_to(temp).as_posix() for p in Path(temp).rglob('*') if p.is_file()),
                             sorted([url, pack['textures']['tex.bclim']['url']]))

    def test_neighbor_preview_is_separate_and_narrowly_allowlisted(self):
        raw = manual(**{'EUR_en_small.arc': lz(darc({
            **{f'blyt/Page_001_small_{part}.bclyt': layout() for part in ('0', 'bg', 'info')},
            'blyt/Page_002_small_0.bclyt': layout(),
        }))})
        with tempfile.TemporaryDirectory() as temp:
            url, pack = convert(raw, Builder(Path(temp)), expected_sha=None, neighbor_preview=True)
            self.assertTrue(url.endswith('/manual-EUR_en-neighbor.json'))
            self.assertEqual(sorted(pack['layouts']), ['Page_001_small_0', 'Page_001_small_bg', 'Page_001_small_info'])
            self.assertEqual(pack['manualSelection']['pages'], [1])
            self.assertEqual(pack['manualSelection']['layoutVariants'], ['small'])
            self.assertEqual(pack['textures'], {})

    def test_output_is_byte_deterministic(self):
        raw = manual()
        with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b:
            self.run_convert(raw, a); self.run_convert(raw, b)
            files = lambda root: {p.relative_to(root).as_posix(): p.read_bytes() for p in Path(root).rglob('*') if p.is_file()}
            self.assertEqual(files(a), files(b))

    def test_malformed_nesting_and_unsafe_names_fail(self):
        cases = {
            'raw inner DARC': manual(**{'EUR_en_index.arc': darc({'blyt/Index.bclyt': layout()})}),
            'LZ11 inner': manual(**{'EUR_en_index.arc': lz(darc({'blyt/Index.bclyt': layout()}), 0x11)}),
            'not DARC': manual(**{'EUR_en_index.arc': lz(b'CLYT'+bytes(60))}),
            'excess nesting': manual(**{'EUR_en_index.arc': lz(darc({'blyt/Index.bclyt': darc({'a.bin': b'x'})}))}),
            'compressed leaf': manual(**{'EUR_en_index.arc': lz(darc({'blyt/Index.bclyt': lz(layout())}))}),
            'unexpected inner path': manual(**{'EUR_en_index.arc': lz(darc({'other/Index.bclyt': layout()}))}),
            'unexpected outer name': manual(**{'Payload.bin': b'x'}),
            'outer directory': manual(**{'sub/EUR_en_index.arc': lz(darc({'blyt/Index.bclyt': layout()}))}),
            'missing archive': manual(**{'EUR_en_index.arc': None}),
            'missing texture': manual(**{'Common_texture.arc': lz(darc({'timg/else.bclim': clim()}))}),
            'ambiguous texture': manual(**{'EUR_en_texture.arc': lz(darc({'timg/tex.bclim': clim()}))}),
            'compressed outer': lz(manual()),
        }
        for label, raw in cases.items():
            with self.subTest(label), tempfile.TemporaryDirectory() as temp:
                with self.assertRaises(ValueError): self.run_convert(raw, temp)
                self.assertFalse(any(Path(temp).rglob('*.json')))
        with tempfile.TemporaryDirectory() as temp, self.assertRaisesRegex(ValueError, 'source hash'):
            convert(manual(), Builder(Path(temp)))
        with tempfile.TemporaryDirectory() as temp, self.assertRaisesRegex(ValueError, 'Missing selected'):
            self.run_convert(manual(), temp, selection={'EUR_en_index.arc': ('blyt/Page_000_large_0.bclyt',)})

    def test_nested_members_resolve_every_inner_path(self):
        members = nested_members(open_outer(manual()))
        self.assertEqual(members['EUR_en_index.arc/blyt/Index.bclyt'], layout(['tex.bclim']))
        self.assertIn('EUR_de_index.arc/blyt/Index.bclyt', members)

    def test_publish_is_idempotent_and_refuses_conflicts(self):
        raw = manual()
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); source = root/'Manual.bcma'; source.write_bytes(raw); out = root/'public'; out.mkdir()
            manifest = {'schema': 1, 'firmware': '10.7.0-32E', 'resources': {},
                        'sources': {SETTINGS: {'contents': [{'index': 0, 'id': '0000003d'}, {'index': 1, 'id': '00000038'}]}},
                        'titles': {SETTINGS: {'version': 9220, 'packs': ['packs/settings/contents/0000-0000003d/base.json']}}}
            (out/'manifest.json').write_bytes(encode(manifest))
            options = dict(expected_sha=None, selection=SELECTION, texture_archives=TEXTURES)
            result = publish(source, out, **options)
            first = (out/'manifest.json').read_bytes()
            self.assertEqual(json.loads(first)['titles'][SETTINGS]['packs'][-1], result['pack'])
            publish(source, out, **options)
            self.assertEqual((out/'manifest.json').read_bytes(), first)
            (out/result['pack']).write_bytes(b'{}')
            with self.assertRaisesRegex(ValueError, 'Conflicting existing manual bytes'): publish(source, out, **options)
            self.assertEqual((out/'manifest.json').read_bytes(), first)
            wrong = dict(manifest); wrong['titles'] = {SETTINGS: {'version': 9221, 'packs': []}}
            (out/'manifest.json').write_bytes(encode(wrong))
            with self.assertRaisesRegex(ValueError, 'Settings version'): publish(source, out, **options)


@unittest.skipUnless(PRIVATE_MANUAL.is_file(), 'private Settings Manual.bcma unavailable')
class RealManualTests(unittest.TestCase):
    def test_real_english_index_and_first_page(self):
        raw = PRIVATE_MANUAL.read_bytes()
        self.assertEqual(digest(raw), manual_bcma.SOURCE_SHA)
        with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b:
            url, pack = convert(raw, Builder(Path(a))); convert(raw, Builder(Path(b)))
            files = lambda root: {p.relative_to(root).as_posix(): p.read_bytes() for p in Path(root).rglob('*') if p.is_file()}
            self.assertEqual(files(a), files(b))
        self.assertEqual(sorted(pack['layouts']), ['BcmaInfo', 'Index', *(f'Page_000_{v}_{p}' for v in ('large', 'small') for p in ('0', 'bg', 'info'))])
        self.assertEqual(list(pack['textures']), ['exclamation.bclim'])
        titles = [p for p in pack['layouts']['Index']['roots'][0]['children'] if p['name'].startswith('PageTitle_')]
        self.assertEqual(len(titles), 32)
        omitted = pack['manualSelection']['omittedArchives']
        self.assertTrue(all(not name.startswith('EUR_en_') for name in omitted))
        self.assertEqual(len(omitted)+len(pack['nesting']['archives']), 38)
        members = nested_members(open_outer(raw))
        for bucket in ('layouts', 'textures'):
            for key, source in pack['resourceSources'][bucket].items():
                self.assertEqual(digest(members[source['path'].removeprefix('Manual.bcma/')]), source['sha256'], key)
        text = json.dumps(pack)
        for locale in ('EUR_de', 'EUR_fr', 'EUR_es', 'EUR_it', 'EUR_nl', 'EUR_pt', 'EUR_ru'):
            self.assertNotIn(locale+'_index.arc/', text)
            self.assertNotIn(locale+'_large.arc/', text)


if __name__ == '__main__': unittest.main()
