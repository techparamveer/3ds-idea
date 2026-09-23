"""Focused HOME adapter tests. Run with HOME_AUDIO_RENDERER set to the pinned checkout."""
import hashlib
import importlib
import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from firmware import home_audio_math as math
from firmware.home_audio_clock import NativeSequenceClock
from firmware import home_audio_voice as native
from firmware.home_audio_dsp import CaptureDsp
from firmware.home_audio_loop_state import snapshot, differences
from firmware.home_audio_profile import PROFILE, isolated_renderer, validate_source, validate_archive


def scratch_root():
    value = os.environ.get('HOME_AUDIO_SCRATCH')
    if not value:
        raise RuntimeError('Set HOME_AUDIO_SCRATCH to an SSD scratch directory')
    root = Path(value).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


class ArithmeticTests(unittest.TestCase):
    def test_quantized_curve(self):
        self.assertEqual(math.pan_gains(0, 0), (0.7071067690849304,) * 2)
        self.assertEqual(math.pan_gains(-1, 0), (1, 0))
        self.assertEqual(math.pan_gains(1, 0), (0, 1))
        self.assertEqual(math.pan_gains(4, 0), (0, 1))
        self.assertEqual(math.pan_gains(0, 0.001), math.pan_gains(0, 0))
        self.assertEqual(math.PAN_LUT[2], 0.9960861206054688)
        packed = struct.pack('<257f', *math.PAN_LUT)
        self.assertEqual(hashlib.sha256(packed).hexdigest(), PROFILE['nativePanLutSha256'])

    def test_capture_is_not_clamped_early(self):
        captured = math.capture_pan(127, 127)
        self.assertEqual(captured, 2)
        self.assertEqual(math.pan_gains(captured, math.live_pan(-63)), (0, 1))
        self.assertNotEqual(math.pan_gains(captured, math.live_pan(-63)), math.pan_gains(1, -1))
        self.assertEqual(math.live_pan(-64), -1)

    def test_linear_sends(self):
        for raw, expected in ((0, 0), (30, 30 / 127), (127, 1)):
            self.assertAlmostEqual(math.send_gain(raw), expected, places=7)
        self.assertEqual(math.send_gain(30, -1), 0)
        self.assertEqual(math.send_gain(127, 1), 1)

    def test_native_gain_connections(self):
        self.assertEqual(native.decibel_gain(-100), 0)
        self.assertEqual(native.decibel_gain(0), 1)
        self.assertEqual(native.decibel_gain(-10), 0.3162277638912201)
        self.assertEqual(native.note_gain(127, 0), 0)
        self.assertEqual(native.note_gain(127, 127), 0.9999999403953552)
        self.assertEqual(native.track_gain(127, 127, 127, .5), 0.4999999403953552)
        self.assertAlmostEqual(native.note_gain(64, 100), (64 / 127) ** 2 * (100 / 127), places=7)
        self.assertAlmostEqual(native.track_gain(64, 100, 96, .5), (64 * 100 * 96 / 127 ** 3) ** 2 * .5, places=7)

    def test_span_requires_stereo(self):
        self.assertEqual(math.stereo_span(0), 0)
        self.assertAlmostEqual(math.stereo_span(64), 64 / 63, delta=1e-7)
        with self.assertRaisesRegex(ValueError, 'stereo'):
            math.stereo_span(64, output_mode=2)

    def test_source_fails_closed(self):
        with tempfile.TemporaryDirectory(dir=scratch_root()) as temp:
            path = Path(temp) / 'bad.bcsar'
            path.write_bytes(b'not the allowlisted HOME archive')
            with self.assertRaisesRegex(ValueError, 'archive'):
                validate_source(path, PROFILE['sourceRecord'])


class NativeVoiceTests(unittest.TestCase):
    def test_every_native_table_byte(self):
        for name, table, fmt in (
            ('attack', native.ATTACK_LUT, 'f'), ('pitchSemitone', native.PITCH_SEMITONE, 'f'),
            ('pitchFraction', native.PITCH_FRACTION, 'f'), ('gain', native.GAIN_LUT, 'f'),
            ('sustain', native.SUSTAIN_LUT, 'h'), ('sine', native.SINE_LUT, 'b'),
        ):
            with self.subTest(table=name):
                packed = struct.pack('<' + str(len(table)) + fmt, *table)
                self.assertEqual(hashlib.sha256(packed).hexdigest(),
                                 PROFILE['voiceArithmetic']['nativeTableSha256'][name])

    def test_attack_reset_threshold_and_no_carry(self):
        env = native.NativeEnvelope(64, 3, 100, 96, 100)
        self.assertEqual(env.level, -904)
        self.assertEqual(env.db(), math.f32(-90.4))
        self.assertEqual(env.attack, 0.9431020021438599)
        env.attack = 1.0
        env.level = -0.03125
        env.update()
        self.assertEqual(env.state, env.ATTACK)  # Equality does not transition.
        env.level = -0.03124999813735485
        env.update()
        self.assertEqual((env.state, env.level, env.remaining), (env.HOLD, 0, 4))
        env.update()
        self.assertEqual(env.remaining, 0)
        self.assertEqual(env.state, env.DECAY)
        self.assertEqual(env.level, -env.decay)  # Only one leftover hold unit.

    def test_decay_equality_and_release_crossing(self):
        env = native.NativeEnvelope(127, 0, 127, 0, 126)
        self.assertEqual(env.db(), 0)  # Zero attack getter before first update.
        env.update()
        self.assertEqual((env.state, env.level), (env.HOLD, 0))
        env.state, env.level, env.decay = env.DECAY, -722.0, 1.0
        env.update(1)
        self.assertEqual((env.state, env.level), (env.DECAY, -723))
        env.update(1)
        self.assertEqual((env.state, env.level), (env.SUSTAIN, -723))
        env.state, env.level = env.RELEASE, -904.0
        self.assertFalse(env.expired())
        self.assertEqual(native.decibel_gain(env.db()), 0)
        env.update()
        self.assertEqual(env.level, -1024)
        self.assertTrue(env.expired())
        self.assertEqual(native.fall_rate(0), math.f32(1 / 640))
        self.assertEqual(native.fall_rate(126), 24)
        self.assertEqual(native.fall_rate(127), 65535)

    def test_sweep_units_and_explicit_without_portamento(self):
        sweep = native.NativeSweep(-1.5, False, 60, 74, 0, 3)
        self.assertEqual(sweep.value(), -1.5)
        sweep.advance()
        self.assertEqual(sweep.counter, 0)
        sweep.advance(sequence_tick=True)
        self.assertEqual(sweep.value(), -1)
        sweep = native.NativeSweep(0, True, 64, 74, 8, 10)
        self.assertEqual(sweep.duration, 100)
        sweep.advance(sequence_tick=True)
        self.assertEqual(sweep.counter, 0)
        sweep.advance()
        self.assertEqual(sweep.value(), -9.5)
        self.assertEqual(native.NativeSweep(3, False, 60, 60, 0, -1).value(), 0)

    def test_signed_pitch_quantization(self):
        self.assertEqual(native.pitch_ratio(12), 2)
        self.assertEqual(native.pitch_ratio(-12), .5)
        self.assertEqual(native.pitch_ratio(-.001), 1)  # Truncation toward zero.
        self.assertEqual(native.pitch_ratio(.001), 1)
        self.assertEqual(native.pitch_ratio(1), native.PITCH_SEMITONE[1])
        self.assertEqual(native.pitch_bend(-127, 2), -1.984375)

    def test_lfo_delay_phase_and_float32_order(self):
        lfo = native.NativeLfo()
        lfo.parameters(128, 128, 1, 1)
        lfo.update()
        self.assertEqual((lfo.elapsed, lfo.phase, lfo.value()), (5, 0, 0))
        lfo.update()
        self.assertEqual(lfo.speed, 50)
        self.assertEqual(lfo.phase, math.f32(50 * math.f32(math.f32(5) * math.f32(.001))))
        lfo.phase = .25
        self.assertEqual(lfo.value(), 1)
        lfo.phase = .75
        self.assertEqual(lfo.value(), -1)
        lfo.parameters(0, 1, 0, 1)
        lfo.update()
        self.assertGreater(lfo.phase, .75)  # Depth zero does not freeze phase.


class CaptureDspTests(unittest.TestCase):
    def test_initial_dequeue_and_pcm_history_are_retained(self):
        source = CaptureDsp([1000] * 100, False, 0)
        self.assertEqual(source.frame(1).tolist(), [0] * 160)
        self.assertEqual((source.cursor, source.fraction), (0, 0))
        self.assertEqual(source.frame(1).tolist(), [0, 0] + [1000] * 98 + [0] * 60)
        self.assertTrue(source.enabled)  # Source status changes on the next frame.
        self.assertEqual(source.frame(1).tolist(), [0] * 160)
        self.assertFalse(source.enabled)

    def test_rate_and_loop_history_against_pinned_cpp_digest(self):
        # Independently generated by the unchanged pinned interpolate.cpp.
        source = CaptureDsp([(i * 977) % 65536 - 32768 for i in range(321)], True, 17)
        rows = []
        for rate in [1, .25, .9991, 1.3333333, 3.75, .1, 2.1, 1] * 3:
            pcm = source.frame(rate)
            rows.append([*pcm, *source.history, source.fraction,
                         len(source.samples) - source.cursor, int(source.enabled)])
        digest = hashlib.sha256(np.asarray(rows, dtype='<i8').tobytes()).hexdigest()
        self.assertEqual(digest, '1f468b4dd9859646d93e7baaa1f3c9d2d4f10a819cde577e7af7a158ab7a6495')

    def test_gain_ramps_and_per_bus_truncation_against_cpp_digest(self):
        # Independently generated by the unchanged pinned Source::MixInto.
        source = CaptureDsp([(i * 977) % 65536 - 32768 for i in range(321)], True, 17)
        digest = hashlib.sha256()
        for frame, rate in enumerate([1, .25, .9991, 1.3333333, 3.75, .1, 2.1, 1] * 3):
            target = np.array([[.70710677, .125], [0, .23622048],
                               [.33333334, -.1]], dtype=np.float32) * np.float32((frame % 5) / 4)
            digest.update(source.mix(rate, target).astype('<i8').tobytes())
        self.assertEqual(digest.hexdigest(), '519b2190f1c741c7ab5d50ee30b72f80e2f8c4f57b17393917c2ec59bc8c852d')

    def test_saturated_difference_and_negative_fraction(self):
        source = CaptureDsp([-32768, 32767] * 100, False, 0)
        source.frame(.5)
        # History zeros, then saturated +/-32768 subtraction, not a full-range lerp.
        self.assertEqual(source.frame(.5)[:9].tolist(),
                         [0, 0, 0, -16384, -32768, -16385, 32767, 16383, -32768])

    def test_invalid_source_and_rate_fail_closed(self):
        for samples, loop, start in [([], False, 0), ([32768], False, 0), ([0], True, 1)]:
            with self.assertRaises(ValueError):
                CaptureDsp(samples, loop, start)
        for rate in (0, -1, float('nan'), float('inf')):
            with self.assertRaises(ValueError):
                CaptureDsp([0], False, 0).frame(rate)


class RendererInterfaceTests(unittest.TestCase):
    def test_cue_delivery_defaults_and_explicit_music_diagnostics(self):
        from render_firmware_audio import cue_names
        expected = ['select', 'open', 'back', 'home', 'power', 'touch', 'grab', 'drop', 'folder-open', 'folder-close']
        self.assertEqual(cue_names(), expected)
        self.assertEqual(cue_names(['home', 'select']), ['home', 'select'])
        self.assertEqual(cue_names(pack='diagnostic'), ['music', 'music-resume', *expected])
        self.assertEqual(cue_names(['music'], 'diagnostic'), ['music'])
        for names in ([], ['select', 'select'], ['unknown']):
            with self.subTest(names=names), self.assertRaisesRegex(ValueError, 'allowlisted'):
                cue_names(names)
        with self.assertRaisesRegex(ValueError, 'pack'):
            cue_names(pack='unknown')

    def test_cue_delivery_rejects_music_before_reading_or_writing(self):
        from render_firmware_audio import render
        with tempfile.TemporaryDirectory(dir=scratch_root()) as temp:
            root = Path(temp)
            for names in (['music'], ['music-resume'], ['select', 'music']):
                with self.subTest(names=names), self.assertRaisesRegex(ValueError, '--pack diagnostic'):
                    render(root / 'missing-source', root / 'output', root / 'missing-renderer',
                           root / 'missing-record', names, scratch=root / 'scratch')
                self.assertEqual(list(root.iterdir()), [])

    def test_cli_rejects_music_in_default_cue_pack(self):
        script = Path(__file__).resolve().parent.parent / 'render_firmware_audio.py'
        with tempfile.TemporaryDirectory(dir=scratch_root()) as temp:
            root = Path(temp)
            command = [sys.executable, str(script), str(root / 'missing-source'), str(root / 'output'),
                       '--renderer', str(root / 'missing-renderer'), '--scratch', str(root / 'scratch'),
                       '--source-record', str(root / 'missing-record'), '--only', 'music']
            result = subprocess.run(command, text=True, capture_output=True)
            self.assertEqual(result.returncode, 2)
            self.assertIn('--pack diagnostic', result.stderr)
            self.assertEqual(list(root.iterdir()), [])

    def test_actual_cue_pack_metadata_and_no_music_files(self):
        source = os.environ.get('HOME_AUDIO_SOURCE')
        if not source:
            self.skipTest('Set HOME_AUDIO_SOURCE for actual cue emission')
        from render_firmware_audio import render
        with tempfile.TemporaryDirectory(dir=scratch_root()) as temp:
            root = Path(temp)
            record = root / 'source.json'
            record.write_text(json.dumps(PROFILE['sourceRecord']))
            result = render(Path(source), root / 'output', Path(os.environ['HOME_AUDIO_RENDERER']),
                            record, ['select'], scratch=scratch_root())
            self.assertEqual(result['pack'], 'cues')
            self.assertEqual(result['converter']['version'], 8)
            self.assertEqual(set(result['cues']), {'select'})
            cue = result['cues']['select']
            self.assertEqual((cue['name'], cue['archiveId']), ('SE_CTR_HOME_ICON_SELECT', 0x0100002c))
            self.assertEqual((cue['loopStart'], cue['loopEnd']), (None, None))
            self.assertEqual(cue['sha256'], '79cce738dbe8e64e5b86a626c238c31ff97c1ccae9ea576592329d8612e22c9c')
            self.assertEqual(sorted(p.name for p in (root / 'output').iterdir()), ['audio.json', 'select.wav'])
            self.assertEqual(json.loads((root / 'output/audio.json').read_text()), result)

    def test_api_rejects_alternate_rates_before_reading_or_writing(self):
        from render_firmware_audio import render
        with tempfile.TemporaryDirectory(dir=scratch_root()) as temp:
            root = Path(temp)
            for rate in (32000, 44100, 48000):
                with self.subTest(rate=rate), self.assertRaisesRegex(ValueError, 'only 32728 Hz'):
                    render(root / 'missing-source', root / 'output', root / 'missing-renderer',
                           root / 'missing-record', ['select'], rate, root / 'scratch')
                self.assertEqual(list(root.iterdir()), [])

    def test_cli_advertises_native_rate_and_rejects_other_rates(self):
        script = Path(__file__).resolve().parent.parent / 'render_firmware_audio.py'
        help_text = subprocess.check_output([sys.executable, str(script), '--help'], text=True)
        self.assertIn('--rate {32728}', help_text)
        with tempfile.TemporaryDirectory(dir=scratch_root()) as temp:
            root = Path(temp)
            for rate in (32000, 44100, 48000):
                command = [sys.executable, str(script), str(root / 'missing-source'), str(root / 'output'),
                           '--renderer', str(root / 'missing-renderer'), '--scratch', str(root / 'scratch'),
                           '--source-record', str(root / 'missing-record'), '--rate', str(rate)]
                result = subprocess.run(command, text=True, capture_output=True)
                self.assertEqual(result.returncode, 2)
                self.assertIn('invalid choice', result.stderr)
                self.assertIn('32728', result.stderr)
                self.assertEqual(list(root.iterdir()), [])


class ClockTests(unittest.TestCase):
    def test_fixed_149_and_fractional_carry(self):
        clock = NativeSequenceClock()
        events = []
        for frame in range(1024):
            clock.advance(lambda: (149, 96, 1.0), lambda: events.append(frame))
        # ceil(1024 * 1310720000 / trunc_f32(268111856 / rate149))
        self.assertEqual(len(events), 1194)
        self.assertEqual(events[:8], [0, 0, 1, 2, 3, 4, 5, 6])
        self.assertGreater(clock.remaining_fraction, 0)
        self.assertLess(clock.remaining_fraction, 1)

    def test_exact_budget_boundary_waits_until_next_frame(self):
        clock = NativeSequenceClock()
        clock.remaining_fraction = struct.unpack('<f', struct.pack('<I', 0x3ef04a28))[0]
        events = []
        self.assertEqual(clock.advance(lambda: (120, 48, 1.0), lambda: events.append(1)), 0)
        self.assertEqual(clock.remaining_fraction, 0)
        self.assertEqual(clock.advance(lambda: (120, 48, 1.0), lambda: events.append(1)), 1)
        self.assertEqual(len(events), 1)
        below = NativeSequenceClock()
        below.remaining_fraction = struct.unpack('<f', struct.pack('<I', 0x3ef04a27))[0]
        self.assertEqual(below.advance(lambda: (120, 48, 1.0), lambda: None), 1)

    def test_tempo_change_recomputes_period_inside_frame(self):
        clock = NativeSequenceClock()
        values = [120, 48, 1.0]
        def tick():
            values[:] = [60000, 1, 1.0]
        self.assertEqual(clock.advance(lambda: values, tick), 5)

    def test_zero_tempo_preserves_fraction(self):
        clock = NativeSequenceClock()
        clock.remaining_fraction = 0.25
        self.assertEqual(clock.advance(lambda: (0, 48, 1.0), lambda: self.fail('frozen tick')), 0)
        self.assertEqual(clock.remaining_fraction, 0.25)
        self.assertEqual(clock.advance(lambda: (120, 48, 1.0), lambda: None), 1)


class SequencerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        renderer = os.environ.get('HOME_AUDIO_RENDERER')
        if not renderer:
            raise RuntimeError('Set HOME_AUDIO_RENDERER to run the patched sequencer checks')
        cls.context = isolated_renderer(Path(renderer), scratch_root())
        cls.provenance = cls.context.__enter__()
        cls.seq = importlib.import_module('dualrip.engine.ctr.sequencer')
        cls.prims = importlib.import_module('dualrip.engine.ctr.cprims')
        assert Path(cls.seq.__file__).is_relative_to(scratch_root())

    @classmethod
    def tearDownClass(cls):
        cls.context.__exit__(None, None, None)

    def player(self, blob=b'\xff', region_pan=64, base_vol=127):
        region = SimpleNamespace(org_key=60, volume=127, pan=region_pan, pitch=1,
                                 attack=127, hold=0, decay=127, sustain=127, release=127,
                                 ignore_note_off=False, interp=0)
        wave = SimpleNamespace(samples=[1000] * 100, rate=32728, loop=False, loop_start=0)
        player = self.seq.CseqPlayer(blob, lambda *args: (region, wave), 32728,
                                     base_vol=base_vol)
        player.setup(0)
        return player

    def test_overlap_and_initial_pan_command(self):
        # New initial-pan command must not change an overlapping existing note.
        player = self.player(bytes([0xdc, 127, 0x80, 100]))
        track = player.tracks[0]
        first = track.note_on(60, 127, 10)
        track.run()
        second = track.note_on(61, 127, 10)
        self.assertIsNot(first, second)
        self.assertEqual(first.pan, 0)
        self.assertEqual(second.pan, 1)
        self.assertEqual(player.handled_commands, {'init_pan': 1})
        self.assertEqual(player.unapplied, {})
        # Live pan still affects both existing notes.
        track.pan = -63
        track.push_params()
        self.assertEqual((first.ext_pan, second.ext_pan), (-1, -1))
        self.assertEqual((first.pan, second.pan), (0, 1))

    def test_tie_preserves_capture_and_fallback_captures(self):
        player = self.player()
        track = player.tracks[0]
        track.initial_pan = 0
        first = track.note_on_tie(60, 127, 10)
        captured = first.pan
        track.initial_pan = 127
        reused = track.note_on_tie(62, 127, 10)
        self.assertIs(first, reused)
        self.assertEqual(reused.pan, captured)
        self.assertEqual(reused.key, 62)
        first.kill()
        new = track.note_on_tie(64, 127, 10)
        self.assertEqual(new.pan, 1)

    def test_sends_work_without_effects(self):
        for main, aux_a, aux_b in ((127, 0, 0), (0, 0, 0), (127, 30, 0), (0, 127, 0), (0, 0, 127)):
            with self.subTest(main=main, a=aux_a, b=aux_b):
                player = self.player(bytes([0xdb, main, 0xd9, aux_a, 0xda, aux_b, 0x80, 100]))
                track = player.tracks[0]
                voice = track.note_on(60, 127, 10)
                track.run()
                player.update_voice(voice)
                self.assertEqual(player.generate(160), ([0] * 160, [0] * 160))
                channels = player.generate(160)
                expected = sum(int(math.f32(1000 * math.f32(math.PAN_LUT[128] * math.send_gain(v))))
                               for v in (main, aux_a, aux_b))
                self.assertEqual(channels[0][2], expected)
                self.assertEqual(channels[1][2], expected)
                self.assertEqual(player.unapplied, {})
                self.assertEqual(player.handled_commands, {'mainsend': 1, 'fxsend_a': 1, 'fxsend_b': 1})
                self.assertEqual(player.effects, {})

    def test_voice_sustain_and_region_use_distinct_gains(self):
        for region_volume in (0, 64, 127):
            with self.subTest(region_volume=region_volume):
                player = self.player()
                lookup = player.bank_lookup
                def changed_region(*args):
                    region, wave = lookup(*args)
                    region.volume = region_volume
                    return region, wave
                player.bank_lookup = changed_region
                voice = player.tracks[0].note_on(60, 127, 10)
                voice.state = self.prims.CS_SUSTAIN
                voice.envelope.state = native.NativeEnvelope.SUSTAIN
                voice.envelope.level = -49.0  # Native sustain raw 96: -4.9 dB.
                player.update_voice(voice)
                expected = native.decibel_gain(math.f32(-49 * math.f32(.1))) * region_volume / 127 * math.PAN_LUT[128]
                self.assertAlmostEqual(voice.vol_l, expected, delta=2e-7)
                self.assertAlmostEqual(voice.vol_r, expected, delta=2e-7)
                self.assertEqual(voice.region_vol, region_volume)

    def test_archive_volume_is_linear_and_separate_from_track_curve(self):
        for volume in (0, 30, 48, 96, 127):
            with self.subTest(volume=volume):
                player = self.player(base_vol=volume)
                track = player.tracks[0]
                track.vol = 64
                voice = track.note_on(60, 127, 10)
                player.update_voice(voice)
                # Native track product is squared in linear amplitude, before the envelope.
                expected = (64 / 127) ** 2 * (volume / 127) * math.PAN_LUT[128]
                self.assertAlmostEqual(voice.vol_l, expected, places=7)
                self.assertAlmostEqual(voice.vol_r, expected, places=7)
        self.assertEqual(math.archive_gain(-1), 0)
        self.assertEqual(math.archive_gain(254), 2)

    def test_span_is_retained_but_does_not_change_stereo(self):
        samples = []
        for raw in (0, 64, 127):
            player = self.player(bytes([0xd7, raw, 0x80, 100]))
            track = player.tracks[0]
            voice = track.note_on(60, 127, 10)
            track.run()
            player.update_voice(voice)
            player.generate(160)
            samples.append(player.generate(160))
            self.assertEqual(voice.span, math.stereo_span(raw))
            self.assertEqual(player.handled_commands, {'span_stereo_no_effect': 1})
        self.assertEqual(samples[0], samples[1])
        self.assertEqual(samples[1], samples[2])
        self.assertGreater(sum(samples[0][0]), 0)

    def test_provenance_includes_reproducible_patch(self):
        p = self.provenance
        self.assertEqual(p['nativeOutputMode']['value'], 1)
        self.assertTrue(p['nativeOutputMode']['referenceModeVerified'])
        self.assertFalse(p['captureSemantics']['hostVolumeSliderApplied'])
        self.assertFalse(p['captureSemantics']['hostTimeStretchApplied'])
        self.assertEqual(p['renderTimeline']['startupTrimSamples'], 0)
        self.assertFalse(p['renderTimeline']['nativeOnsetVerified'])
        self.assertTrue(p['remainingGaps'])
        self.assertEqual(p['runtimeAssumptions']['auxReturnA'], 1)
        self.assertFalse(p['captureDsp']['hardwareVerified'])
        self.assertEqual(p['captureDsp']['fractionalBits'], 24)
        self.assertEqual(p['dspSha256'], hashlib.sha256(
            Path(__file__).with_name('home_audio_dsp.py').read_bytes()).hexdigest())
        self.assertNotEqual(p['originalFiles']['dualrip/engine/ctr/sequencer.py'],
                            p['patchedFiles']['dualrip/engine/ctr/sequencer.py'])

    def test_repeat_snapshot_excludes_reporting_but_keeps_native_loop_count(self):
        player = self.player()
        track = player.tracks[0]
        track.stack = [('loop', 12, 1000, 3), ('call', 24)]
        before = snapshot(player)
        player.now_sample += 3515200
        player.loop_start_sample = 1000
        player.loop_end_sample = 3516200
        track.visited = {12: player.now_sample}
        track.passes_left -= 1
        track.stack[0] = ('loop', 12, 3516200, 3)
        after = snapshot(player)
        self.assertEqual(before['stateSha256'], after['stateSha256'])
        track.stack[0] = ('loop', 12, 3516200, 2)
        self.assertNotEqual(after['stateSha256'], snapshot(player)['stateSha256'])

    def test_repeat_snapshot_copies_clock_history_and_gains_without_aliasing(self):
        player = self.player()
        voice = player.tracks[0].note_on(60, 127, 10)
        player.update_voice(voice)
        before = snapshot(player)
        player.sequence_clock.remaining_fraction = 0.25
        voice.dsp.fraction = 1
        voice.dsp.history[0] = -123
        voice.dsp.gains[0, 0] = 0.5
        after = snapshot(player)
        paths = {row['path'] for row in differences(before['state'], after['state'])}
        self.assertIn('clock.fraction', paths)
        self.assertIn('voices[0].dsp.fraction', paths)
        self.assertIn('voices[0].dsp.history[0]', paths)
        self.assertIn('voices[0].dsp.gains[0][0]', paths)
        self.assertEqual(before['state']['voices'][0]['dsp']['gains'][0][0], 0)
        self.assertNotEqual(before['activeVoiceMultisetSha256'], after['activeVoiceMultisetSha256'])

    def test_startup_preserves_generated_sample_origin(self):
        from dualrip.engine.ctr.render import render_entry
        player = self.player()
        channels, _, _ = render_entry(bytes([60, 127, 4, 255]), 0, player.bank_lookup, 32728, 64)
        self.assertEqual(channels[0][:162], [0] * 162)
        self.assertEqual(channels[1][:162], [0] * 162)
        self.assertEqual(channels[0][162:260], [707] * 98)
        self.assertEqual(channels[0][260:320], [0] * 60)

    def test_zero_gate_keeps_loop_and_fin_forces_release_detach(self):
        player = self.player()
        track = player.tracks[0]
        voice = track.note_on(60, 127, 0)
        voice.loop = True
        voice.dsp.loop = True
        self.assertEqual(voice.noteLength, -1)
        player.update_voice(voice)
        player.generate(160)
        player.generate(160)
        self.assertNotEqual(voice.state, self.prims.CS_NONE)
        voice.ignore_note_off = True
        voice.noteLength = 1
        track.tick_lengths()
        self.assertNotEqual(voice.state, self.prims.CS_RELEASE)
        voice.sweep = importlib.import_module('dualrip.engine.ctr.home_audio_voice').NativeSweep(4, False, 60, 60, 0, 10)
        track.finish()
        self.assertEqual((voice.state, voice.trackId), (self.prims.CS_RELEASE, -1))
        track.run()
        self.assertEqual(voice.sweep.counter, 0)  # Detached manual sweep freezes.
        player.update_voice(voice)
        self.assertNotEqual(voice.state, self.prims.CS_NONE)  # Crossing frame retained.
        self.assertEqual(voice.vol_l, 0)
        player.update_voice(voice)
        self.assertEqual(voice.state, self.prims.CS_NONE)

    def test_multiple_ticks_before_first_voice_update(self):
        player = self.player(bytes([60, 127, 1, 0x80, 10]))
        player.tempo, player.timebase = 149, 96  # Two ticks in the first native frame.
        player.timer()
        voice = next(v for v in player.voices if v.state != self.prims.CS_NONE)
        self.assertEqual(voice.noteLength, 0)
        self.assertEqual(voice.state, self.prims.CS_RELEASE)
        self.assertEqual(voice.vol_l, 0)

    def test_explicit_sweep_command_does_not_enable_portamento(self):
        player = self.player(bytes([0xe3, 0xff, 0xa0, 74, 127, 10]))
        track = player.tracks[0]
        track.run()
        voice = next(v for v in player.voices if v.state != self.prims.CS_NONE)
        self.assertFalse(track.state[self.prims.TS_PORTA])
        self.assertEqual(voice.sweep.pitch, -1.5)
        self.assertEqual(voice.sweep.duration, 10)

    def test_bank_defaults_and_ignore_noteoff_field(self):
        from dualrip.formats.ctr.cseq import Cbnk
        bank = object.__new__(Cbnk)
        bank.waves = [(0, 0)]
        bank.data = struct.pack('<II', 0, 0)
        region = bank._read_vel_region(0)
        self.assertEqual((region.attack, region.hold, region.decay, region.sustain, region.release), (0,) * 5)
        self.assertFalse(region.ignore_note_off)
        bank.data = struct.pack('<III', 0, 1 << 4, 0x00010001)
        region = bank._read_vel_region(0)
        self.assertTrue(region.ignore_note_off)
        self.assertEqual(region.interp, 1)

    def test_loop_at_sequence_origin_keeps_complete_period(self):
        from dualrip.engine.ctr.render import render_entry
        player = self.player()
        # Infinite loop at sample zero, each note waits 48 ticks at tempo 120.
        # The second repeat is tick 96, in native frame 204: 32640 samples.
        channels, loop, _ = render_entry(
            bytes([0xd4, 0, 60, 127, 48, 0xfc, 0xff]),
            0, player.bank_lookup, 32728, 64, loop_passes=2)
        self.assertEqual(loop, (0, 32640))
        self.assertEqual(channels[0][:162], [0] * 162)
        self.assertEqual(channels[0][162:260], [707] * 98)

    def test_actual_music_native_loop_period(self):
        source = os.environ.get('HOME_AUDIO_SOURCE')
        if not source:
            self.skipTest('Set HOME_AUDIO_SOURCE for native PCM-backed loop-period check')
        from dualrip.formats.ctr.archive import CtrArchive
        from dualrip.formats.ctr import cseq
        archive = CtrArchive(Path(source).read_bytes(), [], 'test')
        sound = next(s for s in archive.sounds if s.name == 'BGM_CTR_HOME')
        blob, _ = cseq.parse_cseq(archive.ctx.file_bytes(sound.file_id, 'seq'))
        player = self.seq.CseqPlayer(blob, archive.ctx.make_lookup(sound.bank_ids),
                                     32728, sound.channel_prio, loop_passes=2, base_vol=sound.volume)
        player.setup(sound.start_offset)
        for _ in range(30000):
            player.timer()
            if player.all_tracks_ended():
                break
            # Diagnostic only: advance voices without PCM work. Timing does not
            # depend on those samples for this exact HOME music sequence.
            for voice in player.voices:
                if voice.state == self.prims.CS_NONE or voice.inc <= 0:
                    continue
                voice.pos += 160 * voice.inc
                if voice.pos >= len(voice.samples):
                    if voice.loop:
                        voice.pos = voice.loop_start + (voice.pos - len(voice.samples)) % (len(voice.samples) - voice.loop_start)
                    else:
                        voice.kill()
            player.now_sample += 160
        else:
            self.fail('native frame limit')
        # Independently measured from three native PCM waveform windows.
        self.assertEqual(player.loop_end_sample - player.loop_start_sample, 3515200)

    def test_actual_archive_guards(self):
        source = os.environ.get('HOME_AUDIO_SOURCE')
        if not source:
            self.skipTest('Set HOME_AUDIO_SOURCE for exact-source archive validation')
        from dualrip.formats.ctr.archive import CtrArchive
        data = Path(source).read_bytes()
        validate_source(Path(source), PROFILE['sourceRecord'])
        archive = CtrArchive(data, [], 'test')
        names = list(PROFILE['soundOptions'])
        metadata, waves = validate_archive(archive, names)
        self.assertEqual(len(metadata), 12)
        self.assertEqual(len(waves), 33)
        with self.assertRaisesRegex(ValueError, 'allowlisted'):
            validate_archive(archive, ['UNKNOWN'])
        target = next(s for s in archive.sounds if s.name in names)
        original = target.volume
        target.volume = original - 1
        with self.assertRaisesRegex(ValueError, 'options'):
            validate_archive(archive, names)
        target.volume = original
        with self.assertRaisesRegex(ValueError, 'title/version'):
            validate_source(Path(source), {**PROFILE['sourceRecord'], 'version': 1})
        # Change one actual raw CWAV channel-count field, preserving its container.
        # The validation must reject before DualRip silently folds stereo to mono.
        from dualrip.formats.ctr.csar import nw4c_sections
        from dualrip.formats.ctr.cseq import parse_cwar
        original_bytes = archive.ctx.file_bytes
        def stereo_wave(file_id, description):
            raw = original_bytes(file_id, description)
            if raw[:4] == b'CWAR':
                wav = parse_cwar(raw)[0]
                info, _ = nw4c_sections(wav, b'CWAV')[0x7000]
                changed = bytearray(raw)
                struct.pack_into('<I', changed, raw.index(wav) + info + 0x1c, 2)
                return bytes(changed)
            return raw
        archive.ctx.file_bytes = stereo_wave
        with self.assertRaisesRegex(ValueError, 'stereo sources'):
            validate_archive(archive, names)


if __name__ == '__main__':
    unittest.main()
