"""Optional owner-supplied source regressions for Data Management motion audit."""
import os
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from audit_settings_data_motion import inspect

@unittest.skipUnless(os.environ.get('FIRMWARE_SETTINGS_CONTENT'), 'Original Settings content is required')
class SourceMotionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root=Path(os.environ['FIRMWARE_SETTINGS_CONTENT'])
        cls.code=(cls.root/'exefs/code.bin').read_bytes()
        cls.report=inspect(cls.code,cls.root/'romfs')
    def test_loading_state_dispatch_and_resource_names(self):
        self.assertEqual(self.report['stateDispatch'][1:4],['0x20d65c','0x20d980','0x20da50'])
        self.assertEqual(self.report['sites']['0x20dd38']['value'],'N_WaitIcon_00')
        self.assertEqual(self.report['entryNames'][:6],['SceneIn_00.bclan','SceneIn_01.bclan']*3)
    def test_wait_is_fade_plus_material_loop_not_a_continuous_pane_rotation(self):
        r=self.report['resources']
        fade=r['button_LZ.bin/anim/WaitIcon_WIconIn.bclan']
        loop=r['button_LZ.bin/anim/WaitIcon_WIconLoop.bclan']
        self.assertEqual((fade['frames'],fade['loop'],fade['groups']),(21,False,['Group_01']))
        self.assertEqual([(k['frame'],k['value']) for k in fade['tracks'][0]['keys']],[(0,0),(20,255)])
        self.assertEqual((loop['frames'],loop['loop'],loop['groups']),(32,True,['Group_00']))
        self.assertEqual([t['property'] for t in loop['tracks']],['materialColor.6.3','texture.rotation','texture.rotation'])
    def test_loading_text_and_button_clips_have_separate_source_groups(self):
        r=self.report['resources'];prefix='layout_LZ.bin/anim/SMngCTRData_D_00_'
        self.assertEqual(r[prefix+'TextIn.bclan']['groups'],['Group_03'])
        self.assertEqual(r[prefix+'BtnIn.bclan']['groups'],['Group_05'])
        for name in ['SceneIn_00','SceneIn_01','TextIn','BtnIn']:
            self.assertEqual(r[prefix+name+'.bclan']['frames'],21)
            self.assertEqual(r[prefix+name+'.bclan']['unsupported'],[])
    def test_other_code_is_rejected_before_resource_access(self):
        with self.assertRaisesRegex(ValueError,'Unexpected Settings code'):
            inspect(self.code[:-1],Path('/does-not-exist'))

if __name__=='__main__': unittest.main()
