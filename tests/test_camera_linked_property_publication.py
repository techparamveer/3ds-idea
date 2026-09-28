"""The Camera two-pass replay executes the source property setter in place."""
import importlib.util
import os
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location(
    'camera_rebind_order', ROOT / 'scripts/replay_camera_rebind_order.py'
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CameraLinkedPropertyPublication(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('FIRMWARE_CAMERA_CODE'), 'private Camera executable not configured')
    def test_property_copy_precedes_mock_material_service_in_first_pass(self):
        report = module.replay(Path(os.environ['FIRMWARE_CAMERA_CODE']))
        presentation = report['presentationPublication']
        self.assertEqual([row['storedBytes'] for row in presentation['propertyDispatches']], [
            list(b'PicL\0'), list(b'PicL\0'), list(b'PicL_Op\0')
        ])
        self.assertEqual([row['pass'] for row in presentation['propertyDispatches']], [1, 1, 1])
        self.assertEqual([row['ready'] for row in
                          (presentation['firstPassSelectedCell'], presentation['secondPassSelectedCell'])],
                         [False, True])
        self.assertEqual(len(presentation['materialServiceLeaves']), 9)


if __name__ == '__main__':
    unittest.main()
