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
import unittest
import zlib

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from firmware.texture import decode_texture, decode_bclim, png
from firmware.native import decode_layout, decode_animation, decode_msbt
from firmware.build import EXCLUDED, TITLES, cia_metadata
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
            original = decode_sheet(raw[at:at+size], sw, sh, fmt)
            destw, _, atlas = images[0]
            self.assertEqual(original, b''.join(atlas[y*destw*4:y*destw*4+sw*4] for y in range(sh)))


if __name__ == '__main__': unittest.main()
