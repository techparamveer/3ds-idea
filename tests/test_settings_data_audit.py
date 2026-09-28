"""Settings Data Management audit decodes source operands without firmware inputs."""
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from audit_settings_data_lists import classify_missing, pc_relative, scene_record


class PcRelativeTest(unittest.TestCase):
    def test_add_with_rotated_immediate(self):
        self.assertEqual(pc_relative(0xe28f1f7e, 0x197978), 0x197b78)

    def test_conditional_add_keeps_its_target(self):
        self.assertEqual(pc_relative(0x128f1f91, 0x20d0d8), 0x20d0d8 + 8 + 0x244)

    def test_subtract_from_pc(self):
        self.assertEqual(pc_relative(0xe24f1f81, 0x218414), 0x218218)

    def test_other_instructions_are_not_operands(self):
        for word in (0xe1a06000, 0xe5859048, 0xe28d0004, 0xf28f1f7e):
            self.assertIsNone(pc_relative(word, 0x100000))


class SceneRecordTest(unittest.TestCase):
    def test_header_bytes_and_newline_fields(self):
        raw = bytes([1, 0x19]) + bytes(0x21) + bytes([4]) + b'\n\nbase_2b_back\nSMngCTRData_D_00DataMng\n\0'
        record = scene_record(raw)
        self.assertEqual((record['footer'], record['state']), (1, 4))
        self.assertEqual(record['strings'], ['', '', 'base_2b_back', 'SMngCTRData_D_00DataMng', ''])


class ClassifyMissingTest(unittest.TestCase):
    def test_sd_error_labels_do_not_block_the_accessible_state(self):
        result = classify_missing(['dat_no_sd_u', 'dat_sd_u', 'layout.json/SMngCTRData_D_00', 'dat_writeprotect'])
        self.assertEqual(result['missingForSelectedState'], ['dat_sd_u', 'layout.json/SMngCTRData_D_00'])
        self.assertEqual(result['unpublishedAlternativeStates'], ['dat_no_sd_u', 'dat_writeprotect'])


if __name__ == '__main__':
    unittest.main()
