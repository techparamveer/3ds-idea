"""Bounded Camera renderer reuse check; private executable is optional."""
import importlib.util
import os
from pathlib import Path
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('camera_scene_generation', ROOT / 'scripts/replay_camera_scene_generation.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CameraSceneGeneration(unittest.TestCase):
    def test_rejects_unrelated_executable(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'code.bin'
            path.write_bytes(b'not Camera')
            with self.assertRaisesRegex(ValueError, 'Unexpected Camera executable'):
                module.replay(path)

    @unittest.skipUnless(os.environ.get('FIRMWARE_CAMERA_CODE'), 'private Camera executable not configured')
    def test_synthetic_same_address_reuse(self):
        report = module.replay(Path(os.environ['FIRMWARE_CAMERA_CODE']))
        reuse = report['syntheticReuse']
        self.assertEqual(report['scriptVersion'], 5)
        self.assertEqual(reuse['staleBeforeConstructor'], reuse['staleAfterConstructor'])
        self.assertEqual(reuse['staleBeforeConstructor']['consumer'][0], '0x4')
        self.assertEqual(reuse['afterReset']['consumer'], ['0x0', '0x0'])
        self.assertEqual(reuse['afterReset']['resource'], ['0x0', '0x0'])
        self.assertEqual(reuse['setupRecordIterations'], 64)
        self.assertEqual(reuse['postResetStopBefore'], '0x2d7490')
        self.assertEqual(reuse['postResetCalls'], [{
            'address': '0x254504', 'target': '0x10010d8', 'count': 64, 'value': 5,
        }])
        self.assertEqual([row['address'] for row in reuse['setupServiceLeaves']], ['0x25e6d8'])
        self.assertEqual(reuse['bufferAllocations'][0]['address'], '0x260458')
        self.assertEqual(reuse['bufferAllocations'][0]['bytes'], 0x12008)
        self.assertNotEqual(reuse['boundBuffer'], '0x0')
        self.assertEqual(report['sceneBrowseStaticRefs']['constructorDirectBL'], [])
        self.assertEqual(report['sceneBrowseStaticRefs']['destructorDirectBL'], ['0x28d7e8'])
        self.assertFalse(report['liveGate']['permitted'])


if __name__ == '__main__':
    unittest.main()
