"""Plaintext CIA boundaries/provenance and opt-in private content extraction."""
import json
import os
from pathlib import Path
import struct
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.build import (Builder, HOME, TITLES, EXCLUDED, cia_metadata, extract,
                            convert_title, converter_provenance, digest, encode)
from firmware.cia import content_directory, content_provenance
from firmware.audit import audit

SETTINGS = '0004001000022000'
KEYBOARD = '000400300000d002'


def ncch(title=SETTINGS, executable=True, kind=0):
    data = bytearray(0x1000)
    data[0x100:0x104] = b'NCCH'
    struct.pack_into('<IQ', data, 0x104, len(data)//512, int(title, 16) if executable else 0x400000ff3ff00)
    struct.pack_into('<H', data, 0x112, 2 if executable else 0)
    struct.pack_into('<Q', data, 0x118, int(title, 16))
    data[0x150:0x15a] = b'CTR-N-TEST'
    struct.pack_into('<I', data, 0x180, 0x400 if executable else 0)
    data[0x18c] = 1; data[0x18d] = (3 if executable else 1) | (kind << 2); data[0x18f] = 4
    if executable: struct.pack_into('<II', data, 0x1a0, 5, 1)
    struct.pack_into('<II', data, 0x1b0, 6 if executable else 1, 2 if executable else 7)
    return bytes(data)


def cia(contents=None, title=SETTINGS):
    # Out-of-order/nonzero indices ensure selection is metadata-based and not
    # the first TMD entry or a hard-coded content zero.
    contents = contents or [(9, 0x38, ncch(executable=False, kind=2)), (4, 0x3d, ncch())]
    tmd_size = 0x140 + 0x9c4 + 48*len(contents)
    tmd_at = 0x2040; base = tmd_at + 0x140
    content_at = (tmd_at+tmd_size+63)&~63
    data = bytearray(content_at + sum(len(raw) for _, _, raw in contents))
    struct.pack_into('<IHHIIIIQ', data, 0, 0x2020, 0, 0, 0, 0, tmd_size, 0, len(data)-content_at)
    struct.pack_into('>I', data, tmd_at, 0x10004)
    data[base+0x4c:base+0x54] = bytes.fromhex(title)
    struct.pack_into('>H', data, base+0x9e, len(contents))
    at = content_at
    for i, (index, cid, raw) in enumerate(contents):
        data[32+index//8] |= 0x80 >> (index%8)
        record = base+0x9c4+48*i
        struct.pack_into('>IHHQ', data, record, cid, index, 0, len(raw))
        data[record+16:record+48] = bytes.fromhex(digest(raw))
        data[at:at+len(raw)] = raw; at += len(raw)
    return data, base, content_at


class CiaTests(unittest.TestCase):
    def test_metadata_selects_executable_not_table_order_or_zero(self):
        raw, _, _ = cia(); metadata = cia_metadata(raw, SETTINGS)
        self.assertEqual(metadata['resourceContentIndex'], 4)
        self.assertEqual([(c['index'], c['id'], c['ncch']['contentType']) for c in metadata['contents']],
                         [(9, '00000038', 2), (4, '0000003d', 0)])
        self.assertEqual(metadata['contentSha256'], metadata['contents'][1]['sha256'])
        self.assertEqual(metadata['contents'][0]['ncch']['programId'], SETTINGS)
        self.assertNotEqual(metadata['contents'][0]['ncch']['partitionId'], SETTINGS)

    def test_truncation_sections_bitmap_and_record_bounds(self):
        raw, base, content_at = cia()
        for end in [0, 31, 0x201f, 0x2043, base+0x9c3, len(raw)-1]:
            with self.subTest(end=end), self.assertRaises(ValueError): cia_metadata(raw[:end], SETTINGS)
        mutations = [('header', 0, '<I', 0x2000), ('type', 4, '<H', 1), ('version', 6, '<H', 255),
                     ('cert', 8, '<I', len(raw)), ('tmd', 16, '<I', 0x140),
                     ('footer', 20, '<I', len(raw)), ('content', 24, '<Q', len(raw)),
                     ('count', base+0x9e, '>H', 65535), ('zero-count', base+0x9e, '>H', 0),
                     ('record-length', base+0x9c4+8, '>Q', 513),
                     ('record-overrun', base+0x9c4+8, '>Q', len(raw)*512),
                     ('encrypted', base+0x9c4+6, '>H', 1),
                     ('duplicate-index', base+0x9c4+48+4, '>H', 9),
                     ('duplicate-id', base+0x9c4+48, '>I', 0x38)]
        for name, offset, fmt, value in mutations:
            bad = raw.copy(); struct.pack_into(fmt, bad, offset, value)
            with self.subTest(name=name), self.assertRaises(ValueError): cia_metadata(bad, SETTINGS)
        for bitmap in [bytes(8192), b'\xff'*8192]:
            bad = raw.copy(); bad[32:0x2020] = bitmap
            with self.subTest(bitmap=bitmap[0]), self.assertRaises(ValueError): cia_metadata(bad, SETTINGS)
        with self.assertRaises(ValueError): cia_metadata(raw, HOME)
        with self.assertRaises(ValueError): cia_metadata(raw+b'not-padding', SETTINGS)
        # An enlarged content section must not hide undeclared content bytes.
        bad = raw + bytes(512); struct.pack_into('<Q', bad, 24, len(bad)-content_at)
        with self.assertRaisesRegex(ValueError, 'does not match'): cia_metadata(bad, SETTINGS)

    def test_ncch_identity_encryption_hash_and_internal_bounds(self):
        original = ncch()
        mutations = [('magic', 0x100, b'FAIL'), ('encrypted', 0x18f, b'\0'),
                     ('length', 0x104, struct.pack('<I', 9)), ('program', 0x118, bytes(8)),
                     ('partition', 0x108, bytes(8)), ('version', 0x112, b'\x01\0'),
                     ('block', 0x18e, b'\x01'), ('form', 0x18d, b'\0'),
                     ('exheader', 0x180, bytes(4)), ('overlap', 0x1b0, struct.pack('<I', 5)),
                     ('romfs-overrun', 0x1b4, struct.pack('<I', 100)),
                     ('protected-overrun', 0x1a8, struct.pack('<I', 2))]
        for name, offset, value in mutations:
            modified = bytearray(original); modified[offset:offset+len(value)] = value
            bad, _, _ = cia([(0, 1, modified)])
            with self.subTest(name=name), self.assertRaises(ValueError): cia_metadata(bad, SETTINGS)
        bad, base, at = cia([(0, 1, original)]); bad[at+0xfff] ^= 1
        with self.assertRaisesRegex(ValueError, 'hash mismatch'): cia_metadata(bad, SETTINGS)
        bad, base, _ = cia([(0, 1, original)]); bad[base+0x9c4+16] ^= 1
        with self.assertRaisesRegex(ValueError, 'hash mismatch'): cia_metadata(bad, SETTINGS)
        bad, _, at = cia(); bad[at+0xfff] ^= 1
        with self.assertRaisesRegex(ValueError, 'hash mismatch'): cia_metadata(bad, SETTINGS)

    def test_ambiguous_or_absent_application_rejected(self):
        for contents in [[(0, 1, ncch()), (1, 2, ncch())],
                         [(0, 1, ncch(executable=False)), (1, 2, ncch(executable=False, kind=2))]]:
            raw, _, _ = cia(contents)
            with self.assertRaisesRegex(ValueError, 'unique executable'): cia_metadata(raw, SETTINGS)
        raw, _, _ = cia([(0, 1, ncch(executable=False))])
        self.assertEqual(cia_metadata(raw, SETTINGS)['resourceContentIndex'], 0)

    def test_extraction_uses_native_index_and_keeps_single_cache(self):
        raw, _, _ = cia(); metadata = cia_metadata(raw, SETTINGS)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); package = root/'settings.cia'; package.write_bytes(raw)
            def run(argv, **kwargs):
                index = int(next(a.split('=')[1] for a in argv if a.startswith('--ncch=')))
                self.assertIn('--quiet', argv); self.assertIn('--plain', argv)
                for name in ['romfs', *(['exefs'] if index == 4 else [])]:
                    Path(next(a.split('=', 1)[1] for a in argv if a.startswith('--'+name+'dir='))).mkdir()
                return type('Result', (), {'returncode': 0, 'stdout': '', 'stderr': ''})()
            with patch('firmware.build.subprocess.run', side_effect=run) as mocked:
                romfs, _ = extract(Path('/unused'), package, root/'out', metadata)
                self.assertEqual(romfs, root/'out/contents/0004-0000003d/romfs')
                self.assertEqual(mocked.call_count, 2)
                extract(Path('/unused'), package, root/'out', metadata)
                self.assertEqual(mocked.call_count, 2)
            romfs.rmdir()
            with self.assertRaisesRegex(ValueError, 'Incomplete cached'):
                extract(Path('/unused'), package, root/'out', metadata)
            package.write_bytes(raw+b'changed')
            with self.assertRaises(ValueError): extract(Path('/unused'), package, root/'out', metadata)
            single, _, _ = cia([(0, 1, ncch())]); metadata = cia_metadata(single, SETTINGS)
            package.write_bytes(single); cache = root/'legacy'; cache.mkdir()
            (cache/'source.json').write_bytes(encode({k: v for k, v in metadata.items() if k not in ('contents', 'resourceContentIndex')}))
            (cache/'romfs').mkdir(); (cache/'exefs').mkdir()
            with patch('firmware.build.subprocess.run') as mocked:
                self.assertEqual(extract(Path('/unused'), package, cache, metadata), (cache/'romfs', cache/'exefs'))
                mocked.assert_not_called()

    def test_content_namespaces_and_audit_do_not_alias_same_named_resources(self):
        raw, _, _ = cia(); metadata = cia_metadata(raw, SETTINGS)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); output = root/'public'; scratch = root/'extracted/settings'; scratch.mkdir(parents=True)
            (scratch/'source.json').write_bytes(encode(metadata)); builder = Builder(output); urls = []
            for content in metadata['contents']:
                folder = content_directory(scratch, metadata, content['index'])/'romfs'; folder.mkdir(parents=True)
                # Minimal valid, different CLYT versions under the same name.
                layout = struct.pack('<4sHHIIHH', b'CLYT', 0xfeff, 20, content['index'], 20, 0, 0)
                (folder/'same.bclyt').write_bytes(layout)
                url, _ = builder.pack({'same.bclyt': layout}, 'same', SETTINGS, 'RomFS', content['sha256'], content_provenance(metadata, content['index']))
                urls.append(url)
            self.assertNotEqual(*urls)
            manifest = {'schema': 1, 'firmware': '10.7.0-32E', 'sources': {SETTINGS: {**metadata, 'file': 'settings.cia'}},
                        'titles': {}, 'fonts': {}, 'home': {}, 'resources': builder.records,
                        'converter': {'version': 'test', 'scripts': {'test.py': 'test'}, 'extractor': {'name': 'test'}}}
            def check():
                (output/'manifest.json').write_bytes(encode(manifest))
                return audit(output, root)
            self.assertEqual(check()['errors'], [])
            source = manifest['resources'][urls[0]]['sources'][0]
            original = source.copy(); source.pop('contentIndex')
            self.assertIn('Unknown content index', ' '.join(check()['errors']))
            source.update(original); source['contentId'] = '00000000'
            self.assertIn('content identity', ' '.join(check()['errors']))
            source.update(original); source['contentIndex'] = 4; source['contentId'] = '0000003d'
            self.assertIn('private source hash mismatch', ' '.join(check()['errors']))
            source.update(original); manifest['sources'][SETTINGS]['resourceContentIndex'] = 9
            self.assertIn('ambiguous resource content', ' '.join(check()['errors']))

    def test_scope_keeps_transfer_update_and_six_exclusions(self):
        self.assertIn('0004001000022a00', TITLES); self.assertIn('0004001000022f00', TITLES)
        self.assertEqual(len(EXCLUDED), 6); self.assertTrue(EXCLUDED.isdisjoint(TITLES))
        self.assertIn('000400300000d102', TITLES)


SOURCE = os.environ.get('FIRMWARE_CIA_SOURCE')
CTRTOOL = os.environ.get('FIRMWARE_CTRTOOL')
ARTIFACTS = os.environ.get('FIRMWARE_MULTICONTENT_ARTIFACTS')


@unittest.skipUnless(SOURCE and CTRTOOL and ARTIFACTS, 'Owner CIA inputs/extractor/SSD output are opt-in')
class OwnerCiaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(ARTIFACTS).resolve()
        if cls.root.is_relative_to(ROOT): raise ValueError('Private output must be outside repository')
        cls.root.mkdir(parents=True, exist_ok=True)
        packages = {p.stem.lower(): p for p in Path(SOURCE).glob('*.cia')}
        cls.packages = {t: packages[t] for t in [HOME, KEYBOARD, SETTINGS]}
        cls.metadata = {t: cia_metadata(p.read_bytes(), t) for t, p in cls.packages.items()}
        for title, package in cls.packages.items():
            extract(Path(CTRTOOL), package, cls.root/'extracted'/TITLES[title][0], cls.metadata[title])

    def test_real_content_selection_and_hashes(self):
        for title, metadata in self.metadata.items():
            self.assertEqual(metadata['resourceContentIndex'], 0)
            self.assertEqual(len(metadata['contents']), 2 if title == SETTINGS else 1)
            for content in metadata['contents']:
                self.assertEqual(content['sha256'], content['tmdSha256'])
                self.assertEqual(content['ncch']['programId'], title)
        settings = self.metadata[SETTINGS]['contents']
        self.assertEqual([(c['id'], c['ncch']['formType'], c['ncch']['contentType']) for c in settings],
                         [('0000003d', 3, 0), ('00000038', 1, 2)])
        home = self.root/'extracted/home/exefs/code.bin'
        self.assertEqual(digest(home.read_bytes()), '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9')

    def test_private_conversion_provenance_and_single_content_compatibility(self):
        output = self.root/'public'; builder = Builder(output); home = {}; titles = {}
        for title, metadata in self.metadata.items():
            titles[title] = convert_title(builder, title, metadata, self.root/'extracted'/TITLES[title][0], home)
        manifest = {'schema': 1, 'firmware': '10.7.0-32E', 'region': 'EUR', 'locale': 'EU_English',
                    'sources': {t: {**m, 'file': self.packages[t].name} for t, m in self.metadata.items()},
                    'titles': titles, 'home': home, 'fonts': {'hud': titles[HOME]['fonts']['Hud_JP.bcfnt']},
                    'resources': builder.records, 'unsupported': builder.unsupported,
                    'converter': converter_provenance(Path(CTRTOOL)), 'excludedTitles': sorted(EXCLUDED)}
        (output/'manifest.json').write_bytes(encode(manifest))
        result = audit(output, self.root, ROOT)
        (self.root/'audit.json').write_bytes(encode(result))
        (self.root/'metadata.json').write_bytes(encode(self.metadata))
        # Keep the full audit red for these unestablished native bindings.
        # This boundary tests resource provenance, not guessed title rendering.
        expected_errors = [f'packs/keyboard/swkbd_common.json/Dlg_A_D_02_{clip}: no parent layout'
                           for clip in ['Decide', 'FadeIn', 'FadeOut00', 'FadeOut01', 'Invalid', 'Select']]
        context = 'packs/settings/contents/0000-0000003d/layout.json/AnalogPad_D_00_Rotate_00'
        expected_errors.append(context+': missing group Group_01')
        expected_errors += [context+': missing target '+target for target in
                            ['Null_01', *[f'AnaSti_{i:02d}' for i in range(5) for _ in range(2)], 'ArwCrcl_00']]
        self.assertCountEqual(result['errors'], expected_errors)
        self.assertFalse(result['ok'])
        self.assertGreater(result['privateSourcesChecked'], 4000)
        old_root = ROOT/'public/os/firmware/10.7.0-32E'
        old = json.loads((old_root/'manifest.json').read_text())
        self.assertEqual(titles[HOME], old['titles'][HOME])
        self.assertEqual(home, old['home'])
        for key in ['contentSha256', 'sourceSha256', 'size', 'version', 'productCode']:
            self.assertEqual(self.metadata[HOME][key], old['sources'][HOME][key])
        for url, record in builder.records.items():
            if record['sources'][0]['titleId'] == HOME:
                self.assertEqual((output/url).read_bytes(), (old_root/url).read_bytes(), url)
        self.assertTrue(titles[KEYBOARD]['packs'])
        self.assertTrue(titles[SETTINGS]['packs'])
        for url in titles[SETTINGS]['packs']:
            pack = json.loads((output/url).read_text())
            self.assertIn(pack['contentIndex'], (0, 1))
            self.assertIn('/contents/', url)
        # Settings' secondary manual is physically extracted independently even
        # when its native manual container cannot yet be converted.
        manual = content_directory(self.root/'extracted/settings', self.metadata[SETTINGS], 1)/'romfs'
        self.assertTrue(any(p.is_file() for p in manual.rglob('*')))


if __name__ == '__main__': unittest.main()
