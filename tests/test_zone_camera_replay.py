"""Executed source matrix fixtures; not native LCD fidelity acceptance."""
import os
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from replay_zone_camera import replay


class PinTests(unittest.TestCase):
    def test_rejects_wrong_source_before_emulator_import(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'code.bin'
            path.write_bytes(b'wrong')
            with self.assertRaisesRegex(ValueError, 'Unexpected Nintendo Zone'):
                replay(path)


@unittest.skipUnless(os.environ.get('FIRMWARE_ZONE_CONTENT'), 'Private original source required')
class SourceCameraTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = replay(Path(os.environ['FIRMWARE_ZONE_CONTENT'])/'exefs/code.bin')

    def test_actual_stereo_reconstruction_is_identical_for_both_eyes(self):
        expected = [0, 2.4142136573791504, 0, 0, -1.8106600046157837, 0, 0, 0,
                    0, 0, 1.0000050067901611, 0.05000025033950806, 0, 0, -1, 0]
        expected_view = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -289.70562744140625]
        for sample in self.report['zeroStereoSamples']:
            self.assertEqual(sample['leftProjection'], expected)
            self.assertEqual(sample['rightProjection'], expected)
            self.assertEqual(sample['leftView'], expected_view)
            self.assertEqual(sample['rightView'], expected_view)
        self.assertEqual(self.report['beforeStereo']['projection'][1], 2.4142134189605713)
        self.assertNotEqual(self.report['beforeStereo']['projection'], expected)

    def test_pass_entry_reset_disables_depth_test_with_color_depth_writes_enabled(self):
        reset = self.report['passEntryReset']
        state = int(reset['depthColorShadow'], 16)
        self.assertEqual(state & 1, 0)
        self.assertEqual(state & 0x1f00, 0x1f00)
        self.assertEqual(reset['commands'], ['0x0', '0xf0040', '0x1ffe', '0x10107',
            '0x0', '0x10105', '0x1ffe', '0x20107', '0x1ffe', '0x20107',
            '0x0', '0x10062', '0x0', '0x10118'])
        self.assertFalse(self.report['rasterValidated'])
        self.assertFalse(self.report['nativeCapture'])


if __name__ == '__main__':
    unittest.main()
