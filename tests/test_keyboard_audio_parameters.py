"""Opt-in original-code wave/CSND boundaries; no firmware data in this test."""
import math
import os
from pathlib import Path
import struct
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
SOURCE = os.environ.get('KEYBOARD_AUDIO_EXTRACTED')


def f32(value): return struct.unpack('<f', struct.pack('<f', value))[0]
def floats(words): return [struct.unpack('<f', bytes.fromhex(w)[::-1])[0] for w in words]
def commands(case, command): return [c['words'] for c in case['commands'] if c['id'] == command]


@unittest.skipUnless(SOURCE and os.environ.get('KEYBOARD_AUDIO_PARAMETERS'), 'Private original-code parameter probes require opt-in and Unicorn')
class OwnerKeyboardParameterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from firmware.keyboard_audio_parameters import collect
        cls.report = collect(SOURCE)
        cls.cues = [c for c in cls.report['cases'] if c['kind'] == 'native-cue']
        cls.resources = [c for c in cls.report['cases'] if c['kind'] == 'resource-prepare']
        cls.controlled = [c for c in cls.report['cases'] if c['kind'] == 'controlled-parameters']

    def test_native_request_preserves_descriptor_parameters_and_orders_start(self):
        self.assertEqual(len(self.cues), 17)
        self.assertEqual(self.cues[0]['commands'], [])
        self.assertEqual(self.cues[0]['voiceFlags'], [0, 0, 0])
        for case in self.cues[1:]:
            with self.subTest(cue=case['cueId']):
                self.assertEqual(case['voiceParameterWords'], self.report['cues'][case['cueId']]['parameterWords'][:3])
                self.assertTrue({0x156300, 0x1174e8, 0x197fb4, 0x1310d0, 0x135874, 0x1385b4,
                                 0x117530, 0x12c228, 0x12f228, 0x129d74}.issubset(case['instructionAddresses']))
                self.assertEqual(case['flagsBeforeUpdate'], [1, 1, 0])
                self.assertEqual(case['voiceFlags'], [1, 0, 1])
                self.assertEqual([c['id'] for c in case['commands'] if c['phase'] == 'first-service-update'], [9, 1])
                self.assertFalse(any(c['id'] in (0, 1) for c in case['commands'] if c['phase'] == 'request'))
                self.assertEqual(commands(case, 14)[0][1:3], [0, 0])
                self.assertEqual(commands(case, 1), [[7, 1, 0, 0, 0, 0]])

    def test_cue_timer_uses_float32_and_channel_gain_uses_native_pan_table(self):
        table = floats(self.report['panTable']['words'])
        clock = floats([self.report['timerClockFloatWord']])[0]
        self.assertEqual(clock, 67027964)
        self.assertEqual((table[0], table[128], table[256]), (1, f32(2**-.5), 0))
        self.assertEqual([i for i,v in enumerate(table) if v != f32(math.sqrt((256-i)/256))], [2])
        by_name = {c['member']: c['source'] for c in self.resources}
        for case in self.cues[1:]:
            with self.subTest(cue=case['cueId']):
                gain, pan, pitch = floats(case['voiceParameterWords'])
                self.assertEqual(pan, 0)
                rate = by_name[case['member']]['sampleRate']
                expected_timer = int(f32(clock/f32(rate*pitch)))
                self.assertEqual(commands(case, 8)[-1][1], expected_timer)
                expected_gain = int(f32(f32(gain*table[128])*32768))
                self.assertEqual(case['requestedChannelVolumes'], [expected_gain]*2)
                self.assertEqual(commands(case, 9)[0][1], expected_gain | expected_gain << 16)
        # Pitch is reciprocal in the timer; no rounding to nearest or rate-name inference.
        self.assertEqual({c['cueId']: commands(c, 8)[-1][1] for c in self.cues if c['cueId'] in (2,3,9)},
                         {2: 2560, 3: 1137, 9: 4762})

    def test_all_resources_byte_counts_encoding_interpolation_and_initial_state(self):
        self.assertEqual(len(self.resources), 15)
        odd_ima = 0
        for case in self.resources:
            with self.subTest(member=case['member']):
                meta = case['source']; ima = meta['encoding'] == 'IMA_ADPCM'
                config = commands(case, 14)[0]; flags = config[0]
                self.assertEqual((flags & 31, (flags >> 12) & 3, (flags >> 10) & 3, (flags >> 6) & 1, (flags >> 14) & 1),
                                 (7, 2 if ima else 1, 1 if meta['loop']['enabled'] else 2, 1, 0))
                self.assertEqual(config[5], meta['samples']//2 if ima else meta['samples']*2)
                self.assertEqual(config[1:3], [0,0])
                self.assertEqual(config[4], 0)
                if ima:
                    state = meta['imaState']['initial']
                    self.assertEqual(commands(case, 11), [[7, state['history'] & 0xffffffff, state['index'], 0,0,0]])
                    odd_ima += meta['samples'] % 2
                else: self.assertEqual(commands(case, 11), [])
        self.assertGreater(odd_ima, 0)

    def test_loop_second_buffer_offsets_lengths_states_and_command_order(self):
        loops = []
        for case in self.resources:
            meta = case['source']
            if not meta['loop']['enabled']:
                self.assertFalse(commands(case, 0) or commands(case, 3) or commands(case, 12)); continue
            loops.append(case)
            start, end = meta['loop']['start'], meta['loop']['endExclusive']
            config, block = commands(case, 14)[0], commands(case, 3)[0]
            self.assertEqual(block, [7, config[3]+start//2, (end-start)//2, 0,0,0])
            state = meta['imaState']['loop']
            self.assertEqual(commands(case, 12), [[7, state['history'] & 0xffffffff, state['index'], 0,0,0]])
            self.assertEqual([c['id'] for c in case['commands']], [11,14,8,0,3,12,8,9,1])
            self.assertEqual(commands(case, 0), [[7,1,0,0,0,0]])
            self.assertNotIn(case['member'], [c['member'] for c in self.cues])
        self.assertEqual(len(loops), 2)
        self.assertEqual([(c['source']['sampleRate'],commands(c,3)[0][2]) for c in loops], [(16000,2552),(32020,802)])

    def test_controlled_pan_clamps_mono_force_center_and_nonpositive_pitch(self):
        self.assertEqual(len(self.controlled), 7)
        expected = [(32768,0), (0,32768), (20066,25905), (0,32768), (0,0), (0,32768), (23170,23170)]
        for case, pair in zip(self.controlled, expected):
            with self.subTest(parameters={k:case[k] for k in ('gain','pan','pitch','stereo','forceCenter')}):
                self.assertEqual(case['requestedChannelVolumes'], list(pair))
                output = pair if case['stereo'] else (sum(pair)//2,)*2
                self.assertEqual(commands(case,9)[0][1], output[0] | output[1] << 16)
                self.assertEqual(commands(case,8)[-1][1], 55856 if case['pitch'] <= 0 else 5585)

    def test_source_mutation_unknown_code_and_sequence_fail_closed(self):
        from firmware.keyboard_audio_parameters import Probe
        from firmware.keyboard_audio import ARCHIVE
        from unpack_home_resources import prepare
        code = (Path(SOURCE)/'exefs/code.bin').read_bytes()
        members, _ = prepare((Path(SOURCE)/'romfs'/ARCHIVE).read_bytes())
        with self.assertRaisesRegex(ValueError, 'Unexpected keyboard executable'): Probe(b'unknown', members)
        probe = Probe(code, members)
        for cue in (-1,19,6,7):
            with self.assertRaises(ValueError): probe.request(cue)
        self.assertEqual(probe.commands, [])
        probe.write(0x1a00a8, 0)
        with self.assertRaisesRegex(ValueError, 'Undeclared original-image mutation'): probe.evidence()


if __name__ == '__main__': unittest.main()
