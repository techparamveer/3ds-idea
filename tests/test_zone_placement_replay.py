"""Source viewport constants and conditional placement; not native DOM state."""
import os
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from replay_zone_placement import replay


class PinTests(unittest.TestCase):
    def test_rejects_wrong_image_before_emulation(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'code.bin'
            path.write_bytes(b'wrong')
            with self.assertRaisesRegex(ValueError, 'Unexpected Nintendo Zone'):
                replay(path)


@unittest.skipUnless(os.environ.get('FIRMWARE_ZONE_CONTENT'), 'Private original source required')
class SourcePlacementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = replay(Path(os.environ['FIRMWARE_ZONE_CONTENT'])/'exefs/code.bin')

    def test_bound_callback_returns_actual_upper_and_lower_document_viewports(self):
        self.assertEqual(self.report['viewportCallbackPointer'], '0x277c74')
        self.assertEqual(self.report['documentConstructorCall'], '0x2625ac')
        self.assertEqual(self.report['viewports'], [
            {'screen': 0, 'bounds': [0, 20, 400, 240], 'documentDimensions': [400, 220]},
            {'screen': 1, 'bounds': [0, 0, 320, 212], 'documentDimensions': [320, 212]}])

    def test_root_callback_preserves_dependency_on_unobserved_inputs(self):
        self.assertEqual([s['rootTranslation'] for s in self.report['conditionalRootSamples']],
                         [[0, 0, 0], [0, 0, 0], [12, -8, 0], [0, -10, 0], [100, -55, 0]])
        self.assertEqual(self.report['interceptedFunctions'], ['0x2059f8', '0x205a40'])
        self.assertFalse(self.report['actualResolvedHtmlInputsProven'])
        self.assertFalse(self.report['nativeCapture'])


if __name__ == '__main__':
    unittest.main()
