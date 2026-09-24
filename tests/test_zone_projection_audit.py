"""Owner-supplied source checks; these do not validate a native rendered camera."""
import json
import os
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from audit_zone_projection import inspect

class FailClosedTests(unittest.TestCase):
    def test_unpinned_executable_is_rejected_before_resource_access(self):
        with self.assertRaisesRegex(ValueError, 'Unexpected Nintendo Zone code'):
            inspect(b'not firmware', Path('/does-not-exist'))

@unittest.skipUnless(os.environ.get('FIRMWARE_ZONE_CONTENT'), 'Original Nintendo Zone content is required')
class SourceProjectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(os.environ['FIRMWARE_ZONE_CONTENT'])
        cls.report = inspect((root/'exefs/code.bin').read_bytes(), root/'romfs')
        cls.pack = json.loads((ROOT/'public/os/firmware/10.7.0-32E/packs/nintendo-zone/www-included_html-3dbanner_EU-nwcla.json').read_text())

    def test_descriptor_identifies_fullscreen_banner_and_loop(self):
        self.assertEqual(self.report['descriptor'], {'attributes': {'version': '1.1', 'layoutName': 'U_top', 'fullscreen': 'true'}, 'startAnimation': 'Loop_anim'})
        self.assertEqual(self.report['canvas'], self.pack['layouts']['U_top']['canvas'])
        self.assertEqual(self.report['upperTargetConstants'], {'x': 0, 'y': -10, 'width': 400, 'height': 220})

    def test_actual_ground_retains_projective_and_alpha_requirements(self):
        ground = self.report['ground']
        self.assertEqual(ground['size'], [800, 300])
        self.assertEqual(ground['rotation'], [-80, 0, 0])
        self.assertEqual(ground['translation'], [-1, -145, 0])
        self.assertEqual([c[3] for c in ground['picture']['colors']], [0, 0, 255, 255])
        self.assertEqual(ground['picture']['uvSets'], [[0, 0, 1, 0, 0, .75, 1, .75]])
        self.assertEqual(self.report['groundMaterial'], self.pack['layouts']['U_top']['materials'][12])

    def test_actual_depth_tracks_are_preserved_in_delivery(self):
        clip = self.report['clip']
        self.assertEqual((clip['frames'], clip['loop']), (800, True))
        self.assertEqual(len(self.report['depthPanes']), 38)
        self.assertEqual(len(clip['depthTracks']), 37)
        self.assertEqual(clip['depthTracks'], [t for t in self.pack['animations']['U_top_Loop_anim']['tracks'] if t['property'] == 'translation.z'])

    def test_camera_candidate_is_not_promoted_to_banner_evidence(self):
        camera = self.report['unboundCameraCandidate']
        self.assertFalse(camera['confirmedBannerCamera'])
        self.assertEqual(camera['fovyNearFarHalfAngle'], [45, 0.05000000074505806, 10000, 22.5])

if __name__ == '__main__': unittest.main()
