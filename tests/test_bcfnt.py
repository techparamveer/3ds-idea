"""Synthetic format fixtures only: no Nintendo data in the test suite."""
import importlib.util
from pathlib import Path
import struct
import unittest

spec = importlib.util.spec_from_file_location('bcfnt', Path(__file__).resolve().parents[1] / 'scripts/convert_bcfnt.py')
bcfnt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bcfnt)


def fixture(method=0):
    mapping = [struct.pack('<H', 0), struct.pack('<HH', 0, 0xffff), struct.pack('<HHH', 1, 65, 0)][method]
    # Header 20, FINF 32, TGLP 32, CWDH 19, CMAP 20 + payload.
    sheet_at = 123 + len(mapping)
    header = struct.pack('<4sHHIII', b'CFNT', 0xfeff, 20, 0x3000000, sheet_at + 32, 4)
    finf = struct.pack('<4sIBBHbBBBIIIBBBB', b'FINF', 32, 1, 4, 0, -1, 2, 3, 1, 60, 92, 111, 3, 2, 2, 0)
    tglp = struct.pack('<4sIBBBBIHHHHHHI', b'TGLP', 32, 2, 3, 2, 3, 32, 1, 11, 2, 2, 8, 8, sheet_at)
    cwdh = struct.pack('<4sIHHIbBB', b'CWDH', 19, 0, 0, 0, -1, 2, 3)
    cmap = struct.pack('<4sIHHHHI', b'CMAP', 20 + len(mapping), 65, 66, method, 0, 0) + mapping
    return header + finf + tglp + cwdh + cmap + bytes([0xf0] * 32)


class FontTests(unittest.TestCase):
    def test_mapping_methods_and_signed_bearings(self):
        for method in range(3):
            manifest, sheets = bcfnt.convert(fixture(method))
            self.assertEqual(manifest['glyphs']['65'], dict(sheet=0, sourceSheet=0, x=1, y=1, width=2, height=3, left=-1, advance=3))
            self.assertEqual('66' in manifest['glyphs'], method == 0)
            self.assertTrue(sheets[0].startswith(b'\x89PNG\r\n\x1a\n'))
            self.assertEqual(len(manifest['sourceSha256']), 64)

    def test_morton_pixels_and_nibble_order(self):
        a4 = bcfnt.decode_sheet(bytes([0xf0] * 32), 8, 8, 11)
        self.assertEqual(a4[3], 0)
        self.assertEqual(a4[7], 255)
        a8 = bcfnt.decode_sheet(bytes(range(128)), 16, 8, 8)
        self.assertEqual(a8[(1 * 16 + 2) * 4 + 3], 6)
        self.assertEqual(a8[(0 * 16 + 8) * 4 + 3], 64)

    def test_rejects_truncation_encrypted_data_cycles_and_unknown_formats(self):
        for data in (fixture()[:-1], b'\0' * 160):
            with self.assertRaises(ValueError):
                bcfnt.convert(data)
        data = bytearray(fixture())
        struct.pack_into('<I', data, 96, 92)  # CWDH next pointer loops to itself.
        with self.assertRaisesRegex(ValueError, 'Cyclic'):
            bcfnt.convert(data)
        data = bytearray(fixture())
        struct.pack_into('<H', data, 70, 12)
        with self.assertRaisesRegex(ValueError, 'Unsupported'):
            bcfnt.convert(data)

    def test_small_blocks_cannot_borrow_neighboring_bytes(self):
        for at in (24, 56, 88, 107):
            data = bytearray(fixture())
            struct.pack_into('<I', data, at, 8)
            with self.assertRaises(ValueError):
                bcfnt.convert(data)

    def test_second_sheet_mapping_and_default_widths(self):
        data = bytearray(fixture())
        # Two sheets, direct mapping starts at glyph index 4 (second sheet).
        struct.pack_into('<H', data, 68, 2)
        struct.pack_into('<H', data, 123, 4)
        data.extend(bytes([0xff] * 32))
        struct.pack_into('<I', data, 12, len(data))
        manifest, sheets = bcfnt.convert(data)
        self.assertEqual(len(sheets), 2)
        self.assertEqual(manifest['glyphs']['65']['sheet'], 1)
        self.assertEqual(manifest['glyphs']['65']['left'], -1)
        self.assertEqual(manifest['glyphs']['66']['x'], 4)

    def test_compaction_preserves_original_sheet_identity_and_pixels(self):
        data = bytearray(fixture())
        # Map A/B across the first/second sheet boundary; fallback is on sheet 1.
        struct.pack_into('<H', data, 68, 2)
        struct.pack_into('<H', data, 123, 3)
        struct.pack_into('<H', data, 30, 4)
        data.extend(bytes([0xff] * 32))
        struct.pack_into('<I', data, 12, len(data))
        native, _ = bcfnt.convert(data)
        packed, sheets = bcfnt.convert(data, compact=True)
        self.assertEqual(packed['sourceSheetCount'], 2)
        self.assertEqual(len(sheets), 1)
        for key, source_sheet in [('65', 0), ('66', 1)]:
            original, delivered = native['glyphs'][key], packed['glyphs'][key]
            self.assertEqual(original['sourceSheet'], source_sheet)
            self.assertEqual(delivered['sourceSheet'], source_sheet)
            self.assertEqual(delivered, {**original, 'sheet': 0, 'x': original['x'] + 8 * source_sheet})
        self.assertEqual(packed['fallback'], packed['glyphs']['66'])
        # Compaction copies whole source sheets, retaining their exact RGBA values.
        first = bcfnt.decode_sheet(bytes([0xf0] * 32), 8, 8, 11)
        second = bcfnt.decode_sheet(bytes([0xff] * 32), 8, 8, 11)
        rgba = b''.join(first[y*32:(y+1)*32] + second[y*32:(y+1)*32] for y in range(8))
        self.assertEqual(sheets[0], bcfnt.png(16, 8, rgba))

    def test_fallback_sentinel_and_unsupported_revision(self):
        data = bytearray(fixture())
        struct.pack_into('<H', data, 30, 0xffff)
        self.assertIsNone(bcfnt.convert(data)[0]['fallback'])
        struct.pack_into('<I', data, 8, 0x04000000)
        with self.assertRaisesRegex(ValueError, 'version 3'):
            bcfnt.convert(data)


if __name__ == '__main__':
    unittest.main()
