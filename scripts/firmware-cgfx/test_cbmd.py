"""Synthetic CBMD selection/boundary tests; no Nintendo data is embedded."""

import importlib.util
from pathlib import Path
import struct
import unittest

spec = importlib.util.spec_from_file_location('cbmd', Path(__file__).with_name('cbmd.py'))
cbmd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cbmd)


def lz11_literal(data):
    return b'\x11' + len(data).to_bytes(3, 'little') + b''.join(
        b'\0' + data[i:i + 8] for i in range(0, len(data), 8))


def banner(common=True, french=True):
    data = bytearray(0x88)
    data[:4] = b'CBMD'
    if common:
        struct.pack_into('<I', data, 8, len(data))
        data += lz11_literal(b'CGFXcommon')
    if french:
        struct.pack_into('<I', data, 0x10, len(data))
        data += lz11_literal(b'CGFXfrench')
    struct.pack_into('<I', data, 0x84, len(data))
    data += b'CWAVtest'
    return bytes(data)


class CBMDTests(unittest.TestCase):
    def test_language_override_and_common_fallback(self):
        data = banner()
        english, english_info = cbmd.extract_cbmd(data)
        french, french_info = cbmd.extract_cbmd(data, 'eur-fr')
        self.assertEqual(english, b'CGFXcommon')
        self.assertEqual(french, b'CGFXfrench')
        self.assertTrue(english_info['usedCommon'])
        self.assertFalse(french_info['usedCommon'])
        self.assertEqual(french_info['modelEnd'], len(data) - len(b'CWAVtest'))
        self.assertEqual(cbmd.extract_cbmd(data, 'usa-en')[0], english)

    def test_absent_model_and_invalid_header_rejected(self):
        for data in (b'', b'CGFX', banner(False, True)[:0x88], b'CBMD' + b'\0' * 8):
            with self.assertRaises(ValueError):
                cbmd.extract_cbmd(data)
        with self.assertRaises(ValueError):
            cbmd.extract_cbmd(banner(), 'invalid')

    def test_offsets_audio_and_decode_are_bounded(self):
        original = banner()
        for offset, value in ((8, 0x80), (0x10, len(original)), (0x84, 0x87)):
            data = bytearray(original)
            struct.pack_into('<I', data, offset, value)
            with self.assertRaises(ValueError):
                cbmd.extract_cbmd(bytes(data), 'eur-fr' if offset == 0x10 else 'eur-en')
        data = bytearray(original)
        data[0x88] = 0x10
        with self.assertRaises(ValueError):
            cbmd.extract_cbmd(bytes(data))
        data = bytearray(original)
        data[0x89:0x8c] = (0x80001).to_bytes(3, 'little')
        with self.assertRaises(ValueError):
            cbmd.extract_cbmd(bytes(data))


if __name__ == '__main__':
    unittest.main()
