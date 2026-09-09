"""Entirely synthetic archives; no Nintendo assets are embedded."""
import importlib.util
from pathlib import Path
import struct
import unittest

spec = importlib.util.spec_from_file_location('resources', Path(__file__).resolve().parents[1] / 'scripts/unpack_home_resources.py')
resources = importlib.util.module_from_spec(spec)
spec.loader.exec_module(resources)


def archive(name='item.bclyt', content=b'fixture'):
    names = b'\0\0' + 'blyt\0'.encode('utf-16-le') + (name + '\0').encode('utf-16-le')
    payload = 28 + 36 + len(names)
    return (struct.pack('<4sHHIIIII', b'darc', 0xfeff, 28, 0x1000000, payload + len(content), 28, 36 + len(names), payload)
            + struct.pack('<III', 0x1000000, 0, 3)
            + struct.pack('<III', 0x1000002, 0, 3)
            + struct.pack('<III', 12, payload, len(content)) + names + content)


def literal(data, kind=0x11):
    return bytes([kind]) + len(data).to_bytes(3, 'little') + b''.join(b'\0' + data[i:i + 8] for i in range(0, len(data), 8))


class ResourceTests(unittest.TestCase):
    def test_literal_compression_and_archive_pipeline(self):
        for kind in (0x10, 0x11):
            data = archive()
            self.assertEqual(resources.decompress(literal(data, kind)), data)
            files, manifest = resources.prepare(literal(data, kind))
            self.assertEqual(files, {'blyt/item.bclyt': b'fixture'})
            self.assertEqual(manifest['resources']['blyt/item.bclyt']['kind'], 'unknown')

    def test_overlapping_backreferences_all_length_forms(self):
        # One literal A followed by a distance-one run; flags 01000000.
        for kind, token, length in [(0x10, b'\x20\0', 5), (0x11, b'\x40\0', 5),
                                    (0x11, b'\0\0\0', 17), (0x11, b'\x10\0\0\0', 273)]:
            data = bytes([kind]) + (length + 1).to_bytes(3, 'little') + b'\x40A' + token
            self.assertEqual(resources.decompress(data), b'A' * (length + 1))

    def test_extended_lz11_header(self):
        self.assertEqual(resources.decompress(b'\x11\0\0\0\x01\0\0\0\0X'), b'X')

    def test_invalid_lz_rejected(self):
        for data in [b'\x11', b'\x10\x01\0\0', b'\x11\x03\0\0\x80\x20\0', b'\x11\x02\0\0\x40A\x20\0']:
            with self.assertRaises(ValueError):
                resources.decompress(data)
        with self.assertRaises(ValueError):
            resources.decompress(literal(b'abc'), limit=2)

    def test_unsafe_names_rejected(self):
        for name in ['..', '../escape', '/absolute', 'a\\b', 'C:drive']:
            with self.assertRaises(ValueError):
                resources.unpack_darc(archive(name))

    def test_bad_directory_and_payload_rejected(self):
        for at, value in [(48, 4), (56, 0), (24, 0)]:
            data = bytearray(archive())
            struct.pack_into('<I', data, at, value)
            with self.assertRaises(ValueError):
                resources.unpack_darc(data)

    def test_layout_section_inventory(self):
        layout = struct.pack('<4sHHIIHH', b'CLYT', 0xfeff, 20, 0x2020000, 32, 1, 0) + b'pan1\x0c\0\0\0TEST'
        info = resources.inspect_resource(layout)
        self.assertEqual(info['sections'], [{'tag': 'pan1', 'offset': 20, 'size': 12}])
        self.assertEqual(info['kind'], 'layout')
        broken = bytearray(layout)
        struct.pack_into('<I', broken, 24, 100)
        with self.assertRaises(ValueError):
            resources.inspect_resource(broken)


if __name__ == '__main__':
    unittest.main()
