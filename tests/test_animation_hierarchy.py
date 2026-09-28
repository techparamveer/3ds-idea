import pathlib
import struct
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts/firmware'))
from animation_hierarchy import decode_animation_hierarchy
from native import decode_animation


def section(records=(('Source', 'Group'),)):
    data = b''.join(a.encode().ljust(17, b'\0') + b.encode().ljust(17, b'\0') + b'\0\0' for a, b in records)
    return bytearray(struct.pack('<4sIIHH', b'pah1', 16+len(data), 16, len(records), 0) + data)


def clan(*items):
    data = b''.join(items)
    return struct.pack('<4sHHIIHH', b'CLAN', 0xfeff, 20, 0x2020000, 20+len(data), len(items), 0) + data


class AnimationHierarchyTests(unittest.TestCase):
    def test_names_are_17_bytes_and_records_36(self):
        data = section((('SixteenCharsName', '0123456789abcdef'), ('Pane', 'Next')))
        self.assertEqual(decode_animation_hierarchy(data), [
            {'sourcePane': 'SixteenCharsName', 'targetGroup': '0123456789abcdef'},
            {'sourcePane': 'Pane', 'targetGroup': 'Next'}])

    def test_empty_and_zero_padding_before_array(self):
        self.assertEqual(decode_animation_hierarchy(section(())), [])
        data = section(); data[16:16] = b'\0'*4
        struct.pack_into('<II', data, 4, len(data), 20)
        self.assertEqual(decode_animation_hierarchy(data)[0]['sourcePane'], 'Source')

    def test_bad_bounds_and_reserved_fields_are_errors(self):
        mutations = [(0, b'nope'), (4, struct.pack('<I', 999)), (8, struct.pack('<I', 12)),
                     (8, struct.pack('<I', 17)), (8, struct.pack('<I', 0xfffffff0)),
                     (12, b'\xff\xff'), (14, b'\x01'), (50, b'\x01')]
        for at, value in mutations:
            with self.subTest(at=at, value=value):
                data=section(); data[at:at+len(value)] = value
                with self.assertRaises(ValueError): decode_animation_hierarchy(data)
        for size in (0, 8, 15, 16, 51):
            with self.assertRaises(ValueError): decode_animation_hierarchy(section()[:size])
        data=section();data.extend(b'\0'*4);struct.pack_into('<I',data,4,len(data))
        with self.assertRaises(ValueError): decode_animation_hierarchy(data)

    def test_unterminated_empty_non_ascii_and_nonzero_name_tail_rejected(self):
        for raw in (b'x'*17, b'\0'*17, b'\xff'+b'\0'*16, b'A\0B'+b'\0'*14):
            for at in (16,33):
                data=section();data[at:at+17]=raw
                with self.assertRaises(ValueError):decode_animation_hierarchy(data)

    def test_real_decode_animation_dispatches_helper_and_keeps_unknown_sections(self):
        result=decode_animation(clan(section()))
        self.assertEqual(result['shares'], [{'sourcePane':'Source','targetGroup':'Group'}])
        self.assertEqual(result['unsupported'], [])
        with self.assertRaisesRegex(ValueError,'Duplicate pah1'):decode_animation(clan(section(),section()))
        self.assertNotIn('shares',decode_animation(clan()))
        self.assertEqual(decode_animation(clan(b'abcd\x08\0\0\0'))['unsupported'][0]['tag'],'abcd')


if __name__ == '__main__': unittest.main()
