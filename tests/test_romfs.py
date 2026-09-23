"""Read-only RomFS recovery, including empty files and damaged containers."""
import hashlib
from pathlib import Path
import struct
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from firmware.romfs import members


def container(payload):
    # Three 512-byte levels: data at 0x200, hashes at 0x400/0x600.
    data = payload.ljust(512, b'\0')
    hash1 = hashlib.sha256(data).digest().ljust(512, b'\0')
    hash0 = hashlib.sha256(hash1).digest().ljust(512, b'\0')
    header = bytearray(512); header[:4] = b'IVFC'
    struct.pack_into('<II', header, 4, 0x10000, 32)
    for i, size in enumerate((32, 32, len(payload))):
        struct.pack_into('<QQI', header, 12 + i * 24, i * 512, size, 9)
    struct.pack_into('<I', header, 0x54, 0x5c)
    header[0x60:0x80] = hashlib.sha256(hash0).digest()
    return bytes(header) + data + hash0 + hash1


def filesystem(name='empty', file_offset=0, parent=0):
    # Root plus one file; zero-byte payload is intentional (Camera has one).
    encoded = name.encode('utf-16-le')
    entry = struct.pack('<IIQQII', parent, 0xffffffff, file_offset, 0, 0xffffffff, len(encoded)) + encoded
    entry += bytes((-len(entry)) % 4)
    end = (72 + len(entry) + 15) // 16 * 16
    header = struct.pack('<10I', 40, 40, 4, 44, 24, 68, 4, 72, len(entry), end)
    root = struct.pack('<6I', 0, 0xffffffff, 0xffffffff, 0, 0xffffffff, 0)
    return (header + bytes(4) + root + bytes(4) + entry).ljust(end, b'\0')


class RomfsTests(unittest.TestCase):
    def test_empty_member_is_preserved(self):
        self.assertEqual(members(container(filesystem())), {'empty': b''})

    def test_corrupt_data_or_hash_level_is_rejected(self):
        for offset in (0x60, 0x210, 0x400, 0x600):
            raw = bytearray(container(filesystem())); raw[offset] ^= 1
            with self.subTest(offset=offset), self.assertRaisesRegex(ValueError, 'hash mismatch'):
                members(bytes(raw))

    def test_path_escape_missing_parent_and_file_overflow_rejected(self):
        for payload, error in [(filesystem('../escape'), 'Unsafe'),
                               (filesystem(parent=99), 'Missing RomFS parent'),
                               (filesystem(file_offset=1), 'outside container')]:
            with self.subTest(error=error), self.assertRaisesRegex(ValueError, error):
                members(container(payload))

    def test_truncation_and_unbounded_block_size_rejected(self):
        raw = container(filesystem())
        for size in (0, 90, 512, len(raw) - 1):
            with self.subTest(size=size), self.assertRaises(ValueError): members(raw[:size])
        bad = bytearray(raw); struct.pack_into('<I', bad, 28, 63)
        with self.assertRaisesRegex(ValueError, 'block size'): members(bytes(bad))


if __name__ == '__main__': unittest.main()
