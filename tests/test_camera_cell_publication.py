"""Private-source verification for the complete Camera cell writer.

Run with FIRMWARE_CAMERA_CODE=/absolute/private/code.bin in an interpreter that
has unicorn==2.1.4. A normal checkout deliberately skips the private source test.
"""
import importlib.util
import os
from pathlib import Path
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location('camera_cell_publication', SCRIPTS / 'replay_camera_cell_publication.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CameraCellPublication(unittest.TestCase):
    def test_rejects_unrelated_executable(self):
        # No source data is written. Temporary storage location can be controlled
        # with TMPDIR by the coordinator.
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'not-camera.bin'
            path.write_bytes(b'not firmware')
            with self.assertRaisesRegex(ValueError, 'Unexpected Camera executable'):
                module.replay(path)

    @unittest.skipUnless(os.environ.get('FIRMWARE_CAMERA_CODE'), 'private Camera executable not configured')
    def test_complete_writer_and_its_exact_remaining_gate(self):
        report = module.replay(Path(os.environ['FIRMWARE_CAMERA_CODE']))
        self.assertEqual(len(report['cases']), 12)
        cases = {row['name']: row for row in report['cases']}
        for name in ('left-boundary', 'right-boundary'):
            self.assertTrue(cases[name]['currentControlAttached'])
        for name in ('past-left', 'past-right', 'attached-cell-leaves-right', 'padded-blank', 'outside-buffer'):
            self.assertFalse(cases[name]['currentControlAttached'])
        for name in ('current-owner-disabled', 'previous-owner-disabled'):
            self.assertFalse(cases[name]['recordChanged'])
            self.assertEqual(cases[name]['currentControlPosition'], [12.0, 22.0])
            self.assertEqual(cases[name]['currentReady'], 1)
        self.assertEqual(cases['current-owner-reenabled']['currentControlPosition'], [99.0, 33.0])
        # Native readiness alone does not change the attachment/layout request in
        # this bounded settled case; the photo material publication is separate.
        self.assertEqual(cases['unready']['serviceLeaves'], cases['ready']['serviceLeaves'])
        self.assertFalse(report['liveGate']['permitted'])
        self.assertEqual(set(report['recordedLeaves']), {'0x25e6d8', '0x231500'})


if __name__ == '__main__':
    unittest.main()
