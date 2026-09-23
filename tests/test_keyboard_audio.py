"""BCWAV validation and independent, opt-in original-resource sample comparison."""
import io
import os
from pathlib import Path
import struct
import sys
import tempfile
import unittest
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from firmware.keyboard_audio import decode_bcwav, export, source_tables, wav_bytes


def cwav(codec=3, samples=3, payload=b'\xf7\x01', loop=0, loop_start=0, history=1000, index=0):
    info_size = 96 if codec == 3 else 64
    data = 64+info_size
    raw = bytearray(data+32+len(payload))
    struct.pack_into('<4sHHIIHH', raw, 0, b'CWAV', 0xfeff, 64, 0x02010000, len(raw), 2, 0)
    struct.pack_into('<HHII', raw, 20, 0x7000, 0, 64, info_size)
    struct.pack_into('<HHII', raw, 32, 0x7001, 0, data, len(raw)-data)
    struct.pack_into('<4sIBBHIIIII', raw, 64, b'INFO', info_size, codec, loop, 0, 32728, loop_start, samples, 0, 1)
    struct.pack_into('<HHI', raw, 96, 0x7100, 0, 12)
    struct.pack_into('<HHIHHII', raw, 104, 0x1f00, 0, 24, 0x0301 if codec == 3 else 0, 0,
                     20 if codec == 3 else 0xffffffff, 0)
    if codec == 3: struct.pack_into('<hHhH', raw, 124, history, index, -12, 4)
    struct.pack_into('<4sI', raw, data, b'DATA', len(raw)-data)
    raw[data+32:] = payload
    return raw


class KeyboardAudioTests(unittest.TestCase):
    def test_ima_low_nibble_first_history_rounding_and_odd_sample_count(self):
        meta, pcm = decode_bcwav(cwav())
        self.assertEqual(struct.unpack('<3h', pcm), (1011, 981, 993))
        self.assertEqual(meta['imaState']['initial'], {'history': 1000, 'index': 0})
        self.assertEqual(meta['samples'], 3)

    def test_ima_saturation_and_index_limits(self):
        _, pcm = decode_bcwav(cwav(history=32760, index=88, payload=b'\xf7\x0f'))
        self.assertEqual(struct.unpack('<3h', pcm), (32767, -28669, -32768))
        _, pcm = decode_bcwav(cwav(history=0, index=0, payload=b'\x00\x00'))
        self.assertEqual(pcm, bytes(6))

    def test_pcm_and_wav_preserve_signed_samples_and_rate(self):
        pcm = struct.pack('<3h', -32768, 0, 32767)
        meta, actual = decode_bcwav(cwav(codec=1, payload=pcm))
        self.assertEqual(actual, pcm)
        with wave.open(io.BytesIO(wav_bytes(meta, actual))) as wav:
            self.assertEqual((wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getnframes()), (1, 2, 32728, 3))
            self.assertEqual(wav.readframes(3), pcm)

    def test_loop_metadata_preserved_without_rendering_repeats(self):
        meta, pcm = decode_bcwav(cwav(loop=1, loop_start=1))
        self.assertEqual(meta['loop'], {'enabled': True, 'start': 1, 'endExclusive': 3})
        self.assertEqual(meta['imaState']['loop'], {'history': -12, 'index': 4})
        self.assertEqual(len(pcm), 6)

    def test_invalid_headers_sections_refs_state_and_sample_bounds_fail(self):
        changes = [(4, '<H', 0xfffe), (8, '<I', 0), (12, '<I', 0), (16, '<H', 3),
                   (24, '<I', 0), (28, '<I', 9999), (36, '<I', 64), (68, '<I', 8),
                   (72, '<B', 2), (72, '<B', 0), (73, '<B', 2), (76, '<I', 0),
                   (80, '<I', 3), (84, '<I', 9999), (92, '<I', 2), (96, '<H', 0),
                   (100, '<I', 0xffffffff), (108, '<I', 9999), (112, '<H', 0),
                   (116, '<I', 0xfffffff0), (126, '<H', 89), (130, '<H', 89)]
        for offset, fmt, value in changes:
            with self.subTest(offset=offset, value=value):
                raw = cwav(); struct.pack_into(fmt, raw, offset, value)
                with self.assertRaises(ValueError): decode_bcwav(raw)
        for length in (0, 16, 63, 150, 193):
            with self.subTest(length=length), self.assertRaises(ValueError): decode_bcwav(cwav()[:length])

    def test_unknown_executable_cannot_supply_guessed_cue_mapping(self):
        with self.assertRaisesRegex(ValueError, 'Unexpected keyboard executable'): source_tables(b'unknown')


SOURCE = os.environ.get('KEYBOARD_AUDIO_EXTRACTED')
REFERENCE = os.environ.get('KEYBOARD_AUDIO_REFERENCE')


@unittest.skipUnless(SOURCE and REFERENCE, 'Private keyboard extraction and built vgmstream-cli are opt-in')
class OwnerKeyboardAudioTests(unittest.TestCase):
    def test_all_original_wave_samples_match_primary_decoder(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)/'export'
            manifest = export(SOURCE, output, REFERENCE)
            waves = [r for r in manifest['resources'].values() if r['kind'] == 'wave']
            self.assertEqual(len(waves), 15)
            self.assertEqual(sum(r['encoding'] == 'IMA_ADPCM' for r in waves), 14)
            self.assertTrue(all(r['referencePcmEqual'] for r in waves))
            self.assertEqual(sum(r['loop']['enabled'] for r in waves), 2)
            kalimba = manifest['resources']['kalimba_loop.32000.an4.imaadpcm.bcwav']
            self.assertEqual((kalimba['sampleRate'], kalimba['samples'], kalimba['loop']['start']), (32020, 5210, 3606))
            self.assertEqual(manifest['cues'][10]['member'], 'key_input.32728.imaadpcm.bcwav')
            self.assertEqual(manifest['cues'][6]['member'], 'common_back.sseq')
            self.assertFalse(manifest['resources']['common_back.sseq']['supported'])
            self.assertEqual(len(list(output.rglob('*.wav'))), 15)
            with self.assertRaisesRegex(ValueError, 'new private directory'): export(SOURCE, output, REFERENCE)


@unittest.skipUnless(SOURCE and os.environ.get('KEYBOARD_AUDIO_EVENTS'), 'Original-code probes require opt-in and Unicorn')
class OwnerKeyboardEventTests(unittest.TestCase):
    def test_native_callback_cues_and_release_suppression(self):
        from firmware.keyboard_audio_events import collect
        report = collect((Path(SOURCE)/'exefs/code.bin').read_bytes())
        self.assertEqual(len(report['cases']), 15)
        for case in report['cases']:
            with self.subTest(name=case['name'], accepted=case.get('accepted'), state=case.get('state')):
                cues = [e['cueId'] for e in case['events'] if 'cueId' in e]
                phases = [e['callbackPhase'] for e in case['events'] if 'callbackPhase' in e]
                if case['name'] in ('character', 'space', 'enter', 'backspace'):
                    expected = {'character': [10, 11], 'space': [10, 11], 'enter': [13], 'backspace': [12]}
                    self.assertEqual(cues, expected[case['name']] if case['accepted'] else [15])
                    self.assertEqual(phases, [1])
                    self.assertIn(0x17f774, case['instructionAddresses'])
                elif case['name'] == 'dialog-decision':
                    self.assertEqual(cues, [1, 8 if case['sourceButtonFlag'] else 9])
                    self.assertEqual(phases, [1])
                    self.assertIn(0x183c78, case['instructionAddresses'])
                elif case['name'] in ('caps', 'shift'):
                    self.assertEqual(cues, [1, 18 if case['state'] else 17])
                    self.assertEqual(case['resultState'], 1-case['state'])
                    self.assertEqual(phases, [1])
                    self.assertIn(0x185b64, case['instructionAddresses'])
                else:
                    self.assertEqual(case['name'], 'non-decision-callback-phase')
                    self.assertEqual(case['events'], [])


if __name__ == '__main__': unittest.main()
