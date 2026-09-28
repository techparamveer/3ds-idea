"""Settings Language audit decodes source operands without firmware inputs."""
from pathlib import Path
import struct
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from audit_settings_language import bclyt_pane_size, mov_immediate, thumb_height, vldr_literal


class VldrLiteralTest(unittest.TestCase):
    def test_positive_offset_from_aligned_pc(self):
        self.assertEqual(vldr_literal(0xed9f1a23, 0x1f381c), 0x1f38b0)

    def test_negative_offset(self):
        self.assertEqual(vldr_literal(0xed1f0a02, 0x100000), 0x100000)

    def test_other_instructions_are_not_literals(self):
        for word in (0xed970a13, 0xe28f1f7e, 0xfd9f1a23):
            self.assertIsNone(vldr_literal(word, 0x100000))


class MovImmediateTest(unittest.TestCase):
    def test_register_and_value(self):
        self.assertEqual(mov_immediate(0xe3a0300a, 3), 10)
        self.assertIsNone(mov_immediate(0xe3a0100a, 3))
        self.assertIsNone(mov_immediate(0xe3a03f0a, 3))


class ThumbHeightTest(unittest.TestCase):
    def test_hidden_rows_shrink_to_the_minimum(self):
        self.assertEqual(thumb_height(144, 8, 4, 24, 4, 22), 104)
        self.assertEqual(thumb_height(144, 40, 4, 24, 4, 22), 22)


class PaneSizeTest(unittest.TestCase):
    def test_named_pane_record(self):
        pane = b'pan1' + struct.pack('<I', 0x4c) + bytes(4) + b'B_Groove_00'.ljust(16, b'\0') + bytes(8 + 32)
        pane += struct.pack('<2f', 24, 144)
        self.assertEqual(bclyt_pane_size(bytes(8) + pane + bytes(8), 'B_Groove_00'), [24, 144])
        with self.assertRaises(ValueError):
            bclyt_pane_size(bytes(8) + pane + bytes(8), 'B_Slide_00')


if __name__ == '__main__':
    unittest.main()
