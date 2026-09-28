"""Camera property publication source boundary."""
import importlib.util
import os
from pathlib import Path
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('camera_property_publication', ROOT / 'scripts/replay_camera_property_publication.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CameraPropertyPublication(unittest.TestCase):
    def test_rejects_unrelated_executable_before_unicorn_import(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'code.bin'
            path.write_bytes(b'not Camera')
            with self.assertRaisesRegex(ValueError, 'Unexpected Camera executable'):
                module.replay(path)

    @unittest.skipUnless(os.environ.get('FIRMWARE_CAMERA_CODE'), 'private Camera executable not configured')
    def test_complete_writer_without_pixel_claim(self):
        report = module.replay(Path(os.environ['FIRMWARE_CAMERA_CODE']))
        self.assertEqual([row['storedLength'] for row in report['cases']], [0, 4])
        self.assertEqual(report['cases'][0]['executedHelpers'], ['0x256ca8'])
        self.assertEqual(report['cases'][1]['executedHelpers'], ['0x256ca8', '0x26250c'])
        self.assertEqual(report['cases'][0]['downstreamLeaves'], [])
        leaf, = report['cases'][1]['downstreamLeaves']
        self.assertEqual(leaf['address'], '0x2567cc')
        self.assertEqual(leaf['storedLengthAtDispatch'], 4)
        self.assertEqual(leaf['storedBytesAtDispatch'], list(b'ABCD\0'))
        self.assertFalse(report['liveGate']['permitted'])


if __name__ == '__main__':
    unittest.main()
