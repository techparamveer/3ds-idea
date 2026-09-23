"""Archive readers reject malformed metadata before exposing member bytes."""
from pathlib import Path
import struct
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from firmware.archives import unpack_sarc, unpack_stock_table


def sarc(name=b'main.bclyt', order='<'):
    result = bytearray(132)
    result[:4] = b'SARC'
    struct.pack_into(order+'HHIIHH', result, 4, 20, 0xfeff, 132, 128, 0x100, 0)
    result[20:24] = b'SFAT'; struct.pack_into(order+'HHI', result, 24, 12, 1, 101)
    hashed = 0
    for char in name: hashed = (hashed * 101 + char) & 0xffffffff
    struct.pack_into(order+'4I', result, 32, hashed, 0x1000000, 0, 4)
    result[48:52] = b'SFNT'; struct.pack_into(order+'HH', result, 52, 8, 0)
    result[56:56+len(name)] = name; result[128:132] = b'CLYT'
    return result


def table(name=b'RI.mstl'):
    result = bytearray(132); result[:len(name)] = name
    struct.pack_into('<II', result, 56, 128, 4); result[128:] = b'data'
    return result


class ArchiveTests(unittest.TestCase):
    def test_both_sarc_byte_orders_preserve_member_bytes(self):
        for order in ('<', '>'):
            self.assertEqual(unpack_sarc(bytes(sarc(order=order))), {'main.bclyt': b'CLYT'})

    def test_sarc_rejects_hash_path_range_and_anonymous_entries(self):
        cases = []
        bad = sarc(); bad[32] ^= 1; cases.append(bad)
        bad = sarc(); struct.pack_into('<I', bad, 44, 1000); cases.append(bad)
        bad = sarc(); struct.pack_into('<I', bad, 36, 0); cases.append(bad)
        cases.append(sarc(b'../escape'))
        for bad in cases:
            with self.assertRaises(ValueError): unpack_sarc(bytes(bad))

    def test_truncated_sarc_never_returns_partial_members(self):
        for size in (0, 20, 31, 48, 55, 128, 131):
            with self.subTest(size=size), self.assertRaises(ValueError): unpack_sarc(bytes(sarc()[:size]))

    def test_stock_table_preserves_members_and_rejects_bad_directory(self):
        self.assertEqual(unpack_stock_table(bytes(table())), {'RI.mstl': b'data'})
        bad = table(); struct.pack_into('<I', bad, 60, 500)
        with self.assertRaises(ValueError): unpack_stock_table(bytes(bad))
        bad = table(); bad[64:128] = bad[:64]
        with self.assertRaises(ValueError): unpack_stock_table(bytes(bad))
        with self.assertRaises(ValueError): unpack_stock_table(bytes(table(b'../escape')))


if __name__ == '__main__': unittest.main()
