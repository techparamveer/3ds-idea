"""Source-bound sequence timeline and native orchestration regression checks."""
import os
from pathlib import Path
import sys
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from firmware.keyboard_sequence import interpret


class SequenceSourceBindingTests(unittest.TestCase):
    def test_unknown_sequence_cannot_be_interpreted_as_original(self):
        for raw in (b'',b'SSEQ'+bytes(124),b'unknown'):
            with self.assertRaisesRegex(ValueError,'Unexpected keyboard sequence'): interpret(raw)


SOURCE = os.environ.get('KEYBOARD_AUDIO_EXTRACTED')


@unittest.skipUnless(SOURCE and os.environ.get('KEYBOARD_SEQUENCE_NATIVE'), 'Private keyboard and native sequence replay require opt-in and Unicorn')
class OwnerKeyboardSequenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from firmware.keyboard_sequence_native import collect
        cls.report = collect(SOURCE)
        cls.natural,cls.cancel,cls.stopped = cls.report['cases']

    def test_bank_original_getter_and_both_cues_have_identical_wave_contract(self):
        self.assertEqual([(b['resourceId'],b['rootKey'],b['adsr']) for b in self.report['bank']],
                         [(13,72,[127]*4),(14,69,[123,112,0,127])])
        self.assertEqual(self.natural['commands'],self.cancel['commands'])
        self.assertEqual(self.natural['events'],self.cancel['events'])
        self.assertEqual([e['args'][1] for e in self.natural['events'] if e['event']=='0x197fc4'],
                         [14,14,13,14,13,14,14,13,14,13])
        for case in (self.natural,self.cancel):
            self.assertEqual(case['initialState'], {'sequenceId':0,'sequenceFlags':[3],
                'trackIds':[0,1,2,3]+[255]*12,'masterVolume':110,'tempoWord':120,'tempoScaleWord':256})
            self.assertTrue({0x156300,0x138ad4,0x1697f8,0x1300dc,0x135648,0x1354b8,0x12b8dc,
                             0x18c0ac,0x197fc4,0x18bd9c,0x1385b4,0x138bf8,0x111dd8}.issubset(case['instructionAddresses']))

    def test_independent_interpreter_matches_notes_controls_and_track_completion(self):
        sequence = self.report['sequence']
        self.assertEqual(sequence['allocatedTrackIds'],[0,1,2,3])
        self.assertEqual(len(sequence['events']),40)
        self.assertEqual({e['opcode'] for e in sequence['events']},
                         {0x93,0x81,0xd0,0xd1,0xd2,0xd3,0xc1,0x49,0x42,0xc0,0x80,0xff})
        expected = [(0,0,73,116,1,0),(0,1,66,116,1,0),(0,2,66,60,0,-32),
                    (20,0,73,20,1,32),(20,2,66,50,0,-8),(23,1,66,20,1,-32),
                    (40,0,73,10,1,32),(40,2,66,30,0,8),(43,1,66,10,1,-32),(60,2,66,20,0,36)]
        self.assertEqual([tuple(n[k] for k in ('tick','track','key','velocity','program','pan')) for n in sequence['notes']],expected)
        self.assertTrue(all(n['duration']==20 for n in sequence['notes']))
        self.assertEqual(sequence['trackEnds'],[{'tick':60,'track':0},{'tick':63,'track':1},{'tick':80,'track':2}])
        self.assertEqual(sequence['completionTick'],80)
        # collect() compares every opcode and every note-control field independently.
        self.assertEqual(len([e for e in self.natural['events'] if 'note' in e]),10)

    def test_original_fixed_step_and_deferred_wave_start(self):
        case = self.natural
        self.assertEqual(self.report['nativeClock'],{'playerStepWord':'41855555','serviceStepWord':'40a00000'})
        self.assertEqual([f['serviceQuantum'] for f in case['frames'][:6]],[3,6,9,13,16,19])
        notes = [e for e in case['events'] if 'note' in e]
        starts = [e for e in case['events'] if e['event']=='0x18c0ac']
        self.assertEqual([e['serviceQuantum'] for e in notes],[1,1,1,41,41,47,81,81,87,121])
        self.assertEqual([e['serviceQuantum'] for e in starts],[2,2,2,42,42,48,82,82,88,122])
        self.assertEqual([e['backendParameterWords']['pitch'] for e in starts],[1067533592,1062683901,1060439283,
            1067533592,1060439283,1062683901,1067533592,1060439283,1062683901,1060439283])
        first_starts = [c for c in case['commands'] if c['id']==1][:3]
        self.assertEqual([(c['serviceQuantum'],c['frame']) for c in first_starts],[(3,1)]*3)

    def test_sequence_completion_keeps_release_tails_then_stops_all_loop_channels(self):
        case = self.natural
        self.assertEqual([e['serviceQuantum'] for e in case['events'] if e['event']=='0x18a9dc'],[161])
        after = next(f for f in case['frames'] if f['serviceQuantum']>=161)
        self.assertEqual(after['sequenceFlags'],[2])
        self.assertGreater(len(after['allocatedWaveChannels']),0)
        stops = [c for c in case['commands'] if c['id']==0 and c['words'][1]==0]
        self.assertEqual([c['serviceQuantum'] for c in stops],[42,42,82,88,122,128,189,220,233,252])
        self.assertEqual(len({c['words'][0] for c in stops}),10)
        self.assertEqual((case['finalActiveVoices'],case['finalHandle']),(0,0))
        self.assertEqual(case['frames'][-1]['sequenceSlots'],[0,0])
        self.assertEqual(case['frames'][-1]['frame'],77)
        configs = [c for c in case['commands'] if c['id']==14]
        self.assertEqual(len(configs),10)
        self.assertTrue(all((c['words'][0]>>10)&3==1 for c in configs))
        self.assertEqual(len([c for c in case['commands'] if c['id']==12]),10)

    def test_explicit_sequence_stop_releases_without_scheduling_more_notes(self):
        case = self.stopped
        self.assertEqual([e['serviceQuantum'] for e in case['events'] if e['event']=='explicit-stop'],[33])
        self.assertEqual([e['serviceQuantum'] for e in case['events'] if e['event']=='0x18a9dc'],[33])
        self.assertEqual(len([e for e in case['events'] if 'note' in e]),3)
        self.assertEqual([c['serviceQuantum'] for c in case['commands'] if c['id']==0 and c['words'][1]==0],[35,36,187])
        self.assertEqual(case['finalActiveVoices'],0)
        self.assertTrue({0x12b844,0x165f8c,0x14f774,0x151f0c,0x15171c,0x152018}.issubset(case['instructionAddresses']))

    def test_private_source_and_original_image_guards(self):
        from firmware.keyboard_sequence_native import Probe
        from firmware.keyboard_audio import ARCHIVE
        from unpack_home_resources import prepare
        code=(Path(SOURCE)/'exefs/code.bin').read_bytes()
        members,_=prepare((Path(SOURCE)/'romfs'/ARCHIVE).read_bytes())
        changed=bytearray(members['common_back.sseq']);changed[53]^=1
        with self.assertRaisesRegex(ValueError,'Unexpected keyboard sequence'):interpret(changed)
        probe=Probe(code,members);probe.write(0x1a00a8,0)
        with self.assertRaisesRegex(ValueError,'Undeclared original-image mutation'):probe.evidence()


if __name__=='__main__':unittest.main()
