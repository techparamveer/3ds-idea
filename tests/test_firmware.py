"""Converter unit tests plus optional checks against the owner's private dump.

Set FIRMWARE_ARTIFACTS to the assets artifact directory to run private fixtures.
No raw firmware is committed to tests.
"""
import hashlib
import json
import os
from pathlib import Path
import struct
import sys
import tempfile
import unittest
import zlib

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.texture import decode_texture, decode_bclim, png
from firmware.native import decode_layout, decode_animation, decode_msbt, decode_mstl
from firmware.build import EXCLUDED, TITLES, HOME, Builder, cia_metadata, public_path, digest, encode
from firmware.audit import audit, compare_delivery
from convert_bcfnt import convert, decode_sheet
from unpack_home_resources import unpack_darc, decompress


def decode_png(raw):
    width, height = struct.unpack_from('>II', raw, 16)
    at, data = 8, b''
    while at < len(raw):
        size = struct.unpack_from('>I', raw, at)[0]; tag = raw[at+4:at+8]
        if tag == b'IDAT': data += raw[at+8:at+8+size]
        at += size+12
    rows = zlib.decompress(data)
    assert all(rows[y*(width*4+1)] == 0 for y in range(height))
    return width, height, b''.join(rows[y*(width*4+1)+1:(y+1)*(width*4+1)] for y in range(height))


class TextureTests(unittest.TestCase):
    def test_packed_channels_replicate_bits(self):
        # Values chosen where rounded 0..255 scaling differs from native bits.
        for value in range(32):
            expected = (value << 3) | (value >> 2)
            raw = struct.pack('<H', value << 11)*64
            self.assertEqual(decode_texture(raw, 8, 8, 3)[:4], bytes([expected, 0, 0, 255]))
            self.assertEqual(decode_texture(raw, 8, 8, 2)[:4], bytes([expected, 0, 0, 0]))
            block = ((value << 59) | (1 << 33)).to_bytes(8, 'little')
            self.assertEqual(decode_texture(block*4, 8, 8, 12)[0], min(255, expected+2))
        for value in range(64):
            raw = struct.pack('<H', value << 5)*64
            self.assertEqual(decode_texture(raw, 8, 8, 3)[1], (value << 2) | (value >> 4))
        self.assertEqual(decode_texture(bytes([3, 10])*64, 8, 8, 6)[:4], bytes([10, 3, 0, 255]))

    def test_channel_orders_and_nibbles(self):
        self.assertEqual(decode_texture(bytes([4, 3, 2, 1])*64, 8, 8, 0)[:4], bytes([1, 2, 3, 4]))
        self.assertEqual(decode_texture(bytes([3, 2, 1])*64, 8, 8, 1)[:4], bytes([1, 2, 3, 255]))
        self.assertEqual(decode_texture(bytes([0, 0xf8])*64, 8, 8, 3)[:4], bytes([255, 0, 0, 255]))
        self.assertEqual(decode_texture(bytes([0xa3])*64, 8, 8, 9)[:4], bytes([170, 170, 170, 51]))
        self.assertEqual(decode_texture(bytes([0xa3])*32, 8, 8, 11)[:8], bytes([255, 255, 255, 51, 255, 255, 255, 170]))

    def test_morton_rectangular_order(self):
        pixels = decode_texture(bytes(range(128)), 16, 8, 7)
        self.assertEqual(pixels[(1*16+2)*4], 6)
        self.assertEqual(pixels[8*4], 64)
        self.assertEqual(pixels[(7*16+15)*4], 127)

    def test_etc_individual_differential_alpha_and_blocks(self):
        raw = bytes(8)*4
        self.assertEqual(decode_texture(raw, 8, 8, 12), bytes([2, 2, 2, 255])*64)
        # Red base=31, green/blue=0, differential deltas=0, modifier +2.
        red = ((31<<59) | (1<<33)).to_bytes(8, 'little')
        self.assertEqual(decode_texture(red*4, 8, 8, 12)[:4], bytes([255, 2, 2, 255]))
        pixels = decode_texture((bytes([0xf0])*8 + red)*4, 8, 8, 13)
        self.assertEqual(pixels[3], 0)
        self.assertEqual(pixels[(1*8)*4+3], 255)

    def test_font_la4_preserves_luminance(self):
        self.assertEqual(decode_sheet(bytes([0xa3])*64, 8, 8, 9), bytes([170, 170, 170, 51])*64)

    def test_clim_mapping_and_bounds(self):
        payload = bytes([0xf0])*32
        footer = struct.pack('<4sHHIIHH4sIHHII', b'CLIM', 0xfeff, 20, 0x2020000, 72, 1, 0, b'imag', 16, 8, 8, 13, 32)
        meta, rgba = decode_bclim(payload+footer)
        self.assertEqual(meta['picaFormat'], 11)
        self.assertEqual(rgba[3:8:4], bytes([0, 255]))
        for raw in (payload[:-1]+footer, bytes(40)):
            with self.assertRaises(ValueError): decode_bclim(raw)
        with self.assertRaises(ValueError): decode_texture(bytes(30), 8, 8, 11)

    def test_png_pixels_round_trip(self):
        rgba = bytes(range(256))*4
        self.assertEqual(decode_png(png(16, 16, rgba)), (16, 16, rgba))


class ContainerTests(unittest.TestCase):
    def test_home_style_axes_spacing_and_unresolved_words(self):
        # Distinct horizontal/vertical values catch the native Y-before-X order.
        record = struct.pack('<6I4fI', 256, 3, 10, 11, 12, 13, .5, .75, -2, .25, 4)
        result = decode_mstl(struct.pack('<I', 1)+record)
        self.assertEqual(result['recordSize'], 44)
        self.assertEqual(result['styles'], [{'fontScale': [.75, .5], 'lineSpacing': -2,
            'characterSpacing': .25, 'unresolvedWords': {'0': 256, '4': 3, '8': 10,
            '12': 11, '16': 12, '20': 13, '40': 4}}])
        self.assertEqual(result['unsupported'][0]['offsets'], [0, 4, 8, 12, 16, 20, 40])
        for raw in (b'', struct.pack('<I', 2)+record, struct.pack('<I', 1)+record+b'\0',
                    struct.pack('<I', 1)+record[:24]+struct.pack('<f', float('nan'))+record[28:]):
            with self.subTest(raw=raw), self.assertRaises(ValueError): decode_mstl(raw)

    def test_message_style_indices_attributes_and_control_arguments(self):
        def section(tag, payload):
            raw = struct.pack('<4sI8x', tag, len(payload))+payload
            return raw + bytes((-len(raw))%16)
        first = 'A'.encode('utf-16-le')+struct.pack('<4H', 14, 1, 2, 2)+b'xy'+b'\0\0'
        second = 'B\0'.encode('utf-16-le')
        txt = struct.pack('<III', 2, 12, 12+len(first))+first+second
        blocks = section(b'TSY1', struct.pack('<ii', 28, -1))
        blocks += section(b'ATR1', struct.pack('<II', 2, 2)+b'\x01\x02\x03\x04')
        blocks += section(b'TXT2', txt)
        header = bytearray(32); header[:8] = b'MsgStdBn'
        struct.pack_into('<H', header, 8, 0xfeff)
        struct.pack_into('<BBH', header, 12, 1, 3, 3)
        struct.pack_into('<I', header, 18, len(header)+len(blocks))
        result = decode_msbt(header+blocks)
        self.assertEqual([m['styleIndex'] for m in result['messages']], [28, None])
        self.assertEqual(result['attributes']['records'], ['0102', '0304'])
        self.assertEqual(result['messages'][0]['tokens'], [{'text': 'A'}, {'control': 14, 'group': 1, 'type': 2, 'arguments': '7879'}])
        self.assertEqual(result['unsupported'], [])
        # Same basename in two directories must remain two independent tables.
        styles = struct.pack('<I', 29)+struct.pack('<6I4fI', 0, 0, 0, 0, 0, 0, .5, .75, 0, 1, 4)*29
        with tempfile.TemporaryDirectory() as temp:
            builder = Builder(Path(temp))
            url, pack = builder.pack({'message/EU_English/menu_msbt_LZ.bin': header+blocks,
                'message/EU_English/RI_mstl_LZ.bin': styles,
                'message_hud/EU_English/hud_msbt_LZ.bin': header+blocks,
                'message_hud/EU_English/RI_mstl_LZ.bin': styles,
                'unknown/RI_mstl_LZ.bin': styles}, 'test', HOME, 'RomFS', 'source')
            self.assertEqual(len(pack['styles']), 2)
            for folder, name in [('message', 'menu'), ('message_hud', 'hud')]:
                table = f'{folder}/EU_English/RI_mstl_LZ.bin'
                self.assertEqual(pack['messages'][name+'_msbt_LZ']['styleTable'], table)
                self.assertEqual(pack['resourceSources']['styles'][table]['sha256'], digest(styles))
            self.assertEqual([entry['path'] for entry in pack['unsupported']], ['unknown/RI_mstl_LZ.bin'])
            manifest = {'schema': 1, 'firmware': '10.7.0-32E', 'sources': {HOME: {'titleId': HOME, 'file': 'home.cia'}},
                        'fonts': {}, 'titles': {}, 'home': {'messages': url}, 'resources': builder.records,
                        'converter': {'version': 'test', 'scripts': {'test.py': 'test'}, 'extractor': {'name': 'test'}}}
            (Path(temp)/'manifest.json').write_bytes(encode(manifest))
            self.assertEqual(audit(temp)['errors'], [])
            # Update integrity metadata so the audit must check the relationship,
            # rather than detecting only an unrelated file-hash change.
            pack['messages']['menu_msbt_LZ']['messages'][0]['styleIndex'] = 29
            broken = encode(pack); (Path(temp)/url).write_bytes(broken)
            manifest['resources'][url].update(sha256=digest(broken), size=len(broken))
            (Path(temp)/'manifest.json').write_bytes(encode(manifest))
            self.assertIn('style index out of bounds', ' '.join(audit(temp)['errors']))

    def test_window_fixed_point_inflation_and_integer_frame_sizes(self):
        section = bytearray(128)
        struct.pack_into('<4sI', section, 0, b'wnd1', len(section))
        struct.pack_into('<4H4HBBHII', section, 76, 16, 24, 32, 48, 3, 4, 5, 6, 0, 0, 0, 104, 124)
        header = struct.pack('<4sHHIIHH', b'CLYT', 0xfeff, 20, 0x2020000, 20+len(section), 1, 0)
        window = decode_layout(header+section)['roots'][0]['window']
        self.assertEqual(window['inflation'], [1, 1.5, 2, 3])
        self.assertEqual(window['frameSize'], [3, 4, 5, 6])

    def test_delivery_paths_and_duplicate_content_are_checked_before_writing(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); builder = Builder(root)
            for url in ('/escape.json', '../escape.json', 'a/../b.json', 'a//b.json', 'a\\b.json', 'https://a.json', 'a.json?x'):
                with self.subTest(url=url), self.assertRaises(ValueError): public_path(root, url)
            builder.write('test.json', b'first', {}, 'pack')
            with self.assertRaisesRegex(ValueError, 'Conflicting'): builder.write('test.json', b'second', {}, 'pack')
            self.assertEqual((root/'test.json').read_bytes(), b'first')

    def test_audit_detects_tampered_delivery_and_missing_references(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            manifest = {'schema': 1, 'firmware': '10.7.0-32E', 'sources': {}, 'fonts': {}, 'titles': {},
                        'home': {}, 'converter': {'version': '1', 'scripts': {'test.py': 'test'}, 'extractor': {'name': 'test'}},
                        'resources': {'test.json': {'kind': 'metadata', 'size': 3, 'sha256': digest(b'{}\n'), 'sources': []}}}
            (root/'test.json').write_bytes(b'{}\n'); (root/'manifest.json').write_bytes(encode(manifest))
            self.assertTrue(audit(root)['ok'])
            (root/'test.json').write_bytes(b'changed')
            self.assertIn('hash/size mismatch', ' '.join(audit(root)['errors']))
            manifest['home']['missing'] = 'missing.json'; (root/'manifest.json').write_bytes(encode(manifest))
            self.assertIn('missing resource record', ' '.join(audit(root)['errors']))

    def test_rebuild_comparison_checks_actual_bytes_and_file_sets(self):
        with tempfile.TemporaryDirectory() as temp:
            a, b = Path(temp)/'a', Path(temp)/'b'; a.mkdir(); b.mkdir()
            for root in (a, b): (root/'data.json').write_bytes(b'{}\n')
            self.assertTrue(compare_delivery(a, b)['equal'])
            (b/'data.json').write_bytes(b'{"changed":true}\n')
            (b/'extra.png').write_bytes(b'extra')
            result = compare_delivery(a, b)
            self.assertFalse(result['equal'])
            self.assertEqual(result['changed'], ['data.json'])
            self.assertEqual(result['onlyRight'], ['extra.png'])

    def test_clan_group_names_use_twenty_byte_records(self):
        groups = [b'G_First', b'G_Second']
        section = struct.pack('<4sIHHIIhhB3x', b'pat1', 76, 1, 2, 28, 36, 0, 10, 1)
        section += b'Select\0\0' + b''.join(name.ljust(20, b'\0') for name in groups)
        header = struct.pack('<4sHHIIHH', b'CLAN', 0xfeff, 20, 0x2020000, 20+len(section), 1, 0)
        animation = decode_animation(header+section)
        self.assertEqual(animation['groups'], ['G_First', 'G_Second'])
        self.assertEqual(animation['name'], 'Select')
        self.assertTrue(animation['childBinding'])

    def test_empty_native_dot_wrapper(self):
        header = struct.pack('<4sHHIIIII', b'darc', 0xfeff, 28, 0x1000000, 58, 28, 30, 64)
        entries = struct.pack('<IIIIII', 0x1000000, 0, 2, 0x1000002, 0, 2)
        self.assertEqual(unpack_darc(header+entries+b'\0\0.\0\0\0'), {})
        bad = bytearray(header+entries+b'\0\0.\0\0\0'); struct.pack_into('<I', bad, 44, 1)
        with self.assertRaises(ValueError): unpack_darc(bad)

    def test_public_title_allowlist_excludes_requested_apps(self):
        self.assertFalse(EXCLUDED.intersection(TITLES))
        self.assertNotIn('face-raiders', [v[0] for v in TITLES.values()])

    def test_cia_parser_rejects_malformed_container(self):
        for raw in (b'', bytes(256)):
            with self.assertRaises(ValueError): cia_metadata(raw, '0004003000009802')


ARTIFACTS = Path(os.environ['FIRMWARE_ARTIFACTS']) if 'FIRMWARE_ARTIFACTS' in os.environ else None


@unittest.skipUnless(ARTIFACTS, 'Owner assets are opt-in private fixtures')
class OwnerResources(unittest.TestCase):
    def test_home_style_records_and_message_links(self):
        romfs = ARTIFACTS/'extracted/home/romfs'
        for folder, name, count in [('message', 'menu', 679), ('message_hud', 'hud', 7)]:
            base = romfs/folder/'EU_English'
            raw = decompress((base/'RI_mstl_LZ.bin').read_bytes())
            table = decode_mstl(raw)
            self.assertEqual(len(table['styles']), count)
            self.assertEqual(len(raw), 4+44*count)
            messages = decode_msbt(decompress((base/(name+'_msbt_LZ.bin')).read_bytes()))
            for message in messages['messages']:
                if message['styleIndex'] is not None:
                    self.assertGreaterEqual(message['styleIndex'], 0)
                    self.assertLess(message['styleIndex'], count)
            if name == 'hud':
                self.assertEqual(table['styles'][2]['fontScale'], [.5, .5])
                self.assertEqual(table['styles'][2]['lineSpacing'], 0)
                self.assertEqual(table['styles'][2]['characterSpacing'], 0)

    def test_home_animation_groups_and_targets_resolve(self):
        def flatten(nodes):
            for node in nodes:
                yield node
                yield from flatten(node['children'])

        checked = 0
        for package in (ARTIFACTS/'extracted/home/romfs').rglob('*_LZ.bin'):
            raw = decompress(package.read_bytes())
            if raw[:4] != b'darc': continue
            resources = unpack_darc(raw)
            layouts = {Path(name).stem: decode_layout(data) for name, data in resources.items() if data[:4] == b'CLYT'}
            for name, data in resources.items():
                if data[:4] != b'CLAN': continue
                clip = Path(name).stem
                candidates = [key for key in layouts if clip.startswith(key+'_')]
                self.assertTrue(candidates, clip)
                layout = layouts[max(candidates, key=len)]
                groups = {node['name'] for node in flatten(layout['groups'])}
                panes = {node['name'] for node in flatten(layout['roots'])}
                materials = {material['name'] for material in layout['materials']}
                animation = decode_animation(data)
                for group in animation['groups']:
                    self.assertIn(group, groups, clip)
                for track in animation['tracks']:
                    self.assertIn(track['target'], materials if track['binding'] == 'material' else panes, clip)
                checked += 1
        # 641 root archives plus 25 English theme-introduction clips.
        self.assertEqual(checked, 666)

    def test_every_home_resource_and_english_message_decodes(self):
        romfs = ARTIFACTS/'extracted/home/romfs'; counts = {'layout': 0, 'animation': 0, 'texture': 0}
        for p in romfs.glob('*_LZ.bin'):
            data = decompress(p.read_bytes())
            if data[:4] != b'darc': continue
            for path, raw in unpack_darc(data).items():
                if raw[:4] == b'CLYT':
                    layout = decode_layout(raw); self.assertTrue(layout['canvas']); counts['layout'] += 1
                elif raw[:4] == b'CLAN':
                    animation = decode_animation(raw); self.assertGreater(animation['frames'], 0); counts['animation'] += 1
                    self.assertFalse([v for v in animation['unsupported'] if v.get('kind') == 'curve'])
                elif raw[-40:-36] == b'CLIM':
                    meta, rgba = decode_bclim(raw); self.assertEqual(len(rgba), meta['width']*meta['height']*4); counts['texture'] += 1
        self.assertEqual(counts, {'layout': 177, 'animation': 641, 'texture': 499})
        messages = decode_msbt(decompress((romfs/'message/EU_English/menu_msbt_LZ.bin').read_bytes()))
        self.assertEqual(len(messages['messages']), 558)
        self.assertEqual(messages['messages'][0]['text'], 'HOME Menu')
        self.assertEqual(messages['attributes'], {'count': 558, 'recordSize': 0, 'records': [], 'stringTable': ''})
        self.assertEqual(sum(m['styleIndex'] is None for m in messages['messages']), 22)
        self.assertEqual(max(m['styleIndex'] for m in messages['messages'] if m['styleIndex'] is not None), 670)
        self.assertEqual(messages['unsupported'], [])

    def test_original_fonts_pack_without_changing_glyph_pixels(self):
        for folder, filename in [('home', 'font/Hud_JP.bcfnt'), ('shared-font', 'cbf_std.bcfnt.lz')]:
            raw = (ARTIFACTS/'extracted'/folder/'romfs'/filename).read_bytes()
            if raw[:1] == b'\x11': raw = decompress(raw)
            manifest, sheets = convert(raw, compact=True)
            self.assertLessEqual(len(sheets), 6)
            images = [decode_png(s) for s in sheets]
            self.assertTrue(manifest['glyphs'])
            for glyph in manifest['glyphs'].values():
                width, height, _ = images[glyph['sheet']]
                self.assertLessEqual(glyph['x']+glyph['width'], width)
                self.assertLessEqual(glyph['y']+glyph['height'], height)
            self.assertEqual(manifest['sourceSha256'], hashlib.sha256(raw).hexdigest())
            tglp = struct.unpack_from('<I', raw, 36)[0]
            cw, ch, baseline, _, size, count, fmt, cols, rows, sw, sh, at = struct.unpack_from('<BBBBIHHHHHHI', raw, tglp)
            columns, per_atlas = 1024//sw, (1024//sw)*(1024//sh)
            for index in range(count):
                original = decode_sheet(raw[at+index*size:at+(index+1)*size], sw, sh, fmt)
                destw, _, atlas = images[index//per_atlas]
                x, y = (index%per_atlas%columns)*sw, (index%per_atlas//columns)*sh
                restored = b''.join(atlas[((y+row)*destw+x)*4:((y+row)*destw+x+sw)*4] for row in range(sh))
                self.assertEqual(original, restored, f'{filename}: sheet {index}')
            self.assertEqual(manifest['cellWidth'], cw)
            self.assertEqual(manifest['cellHeight'], ch)
            self.assertEqual(manifest['width'], raw[49])
            self.assertEqual(manifest['height'], raw[48])
            self.assertEqual(manifest['ascent'], raw[50])
            # Independently read every CWDH record; recover source glyph indices
            # from packed rectangles and verify signed bearing/width/advance.
            widths = {}; cursor = struct.unpack_from('<I', raw, 40)[0]
            while cursor:
                first, last, next_block = struct.unpack_from('<HHI', raw, cursor)
                for index in range(first, last+1): widths[index] = struct.unpack_from('<bBB', raw, cursor+8+(index-first)*3)
                cursor = next_block
            fallback_widths = struct.unpack_from('<bBB', raw, 32)
            for glyph in [*manifest['glyphs'].values(), manifest['fallback']]:
                if glyph is None: continue
                source_sheet = glyph['sheet']*per_atlas + (glyph['y']//sh)*columns + glyph['x']//sw
                index = source_sheet*cols*rows + ((glyph['y']%sh-1)//(ch+1))*cols + (glyph['x']%sw-1)//(cw+1)
                self.assertEqual((glyph['left'], glyph['width'], glyph['advance']), widths.get(index, fallback_widths))

    def test_delivery_integrity_and_private_provenance(self):
        result = audit(ROOT/'public/os/firmware/10.7.0-32E', ARTIFACTS, ROOT)
        self.assertEqual(result['errors'], [])
        self.assertEqual(result['counts']['animations'], 666)
        self.assertEqual(result['counts']['layouts'], 184)
        self.assertEqual(result['counts']['fontAtlases'], 7)
        self.assertEqual(result['counts']['styles'], 2)
        self.assertEqual(result['counts']['messageStyles'], 686)
        skipped = [issue for issue in result['warnings'] if issue['kind'] == 'unallocatedTextureMatrix']
        self.assertEqual(len(skipped), 351)
        self.assertEqual(sum(issue['nonIdentity'] for issue in skipped), 15)
        self.assertTrue(all(issue['behavior'] == 'nativeSkip' for issue in skipped))
        self.assertGreater(result['privateSourcesChecked'], 1800)


if __name__ == '__main__': unittest.main()
