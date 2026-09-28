"""Hash-pinned Camera factory branch check; private executable is optional."""
import os
from pathlib import Path
import sys
import tempfile
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from replay_camera_scene_factory import replay


class CameraSceneFactory(unittest.TestCase):
    def test_rejects_unrelated_executable(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'code.bin'
            source.write_bytes(b'not Camera')
            with self.assertRaisesRegex(ValueError, 'Unexpected Camera executable'):
                replay(source)

    @unittest.skipUnless(os.environ.get('FIRMWARE_CAMERA_CODE'), 'private Camera executable not configured')
    def test_scene_case_reaches_constructor(self):
        result = replay(Path(os.environ['FIRMWARE_CAMERA_CODE']))
        self.assertEqual(result['caseIndex'], 2)
        self.assertEqual(result['constructorEntry'], '0x28d23c')
        self.assertEqual(result['events'][1], {'kind': 'allocation', 'size': 0x1400})


if __name__ == '__main__':
    unittest.main()
