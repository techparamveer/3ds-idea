"""Focused HOME adapter tests. Run with HOME_AUDIO_RENDERER set to the pinned checkout."""
import hashlib
import importlib
import json
import os
from pathlib import Path
import struct
import sys
import tempfile
from types import SimpleNamespace
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from firmware import home_audio_math as math
from firmware.home_audio_profile import PROFILE, isolated_renderer, validate_source, validate_archive


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

    def test_span_requires_stereo(self):
        self.assertEqual(math.stereo_span(0), 0)
        self.assertAlmostEqual(math.stereo_span(64), 64 / 63, delta=1e-7)
        with self.assertRaisesRegex(ValueError, 'stereo'):
            math.stereo_span(64, output_mode=2)

    def test_source_fails_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'bad.bcsar'
            path.write_bytes(b'not the allowlisted HOME archive')
            with self.assertRaisesRegex(ValueError, 'archive'):
                validate_source(path, PROFILE['sourceRecord'])


class SequencerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        renderer = os.environ.get('HOME_AUDIO_RENDERER')
        if not renderer:
            raise RuntimeError('Set HOME_AUDIO_RENDERER to run the patched sequencer checks')
        cls.context = isolated_renderer(Path(renderer))
        cls.provenance = cls.context.__enter__()
        cls.seq = importlib.import_module('dualrip.engine.ctr.sequencer')
        cls.prims = importlib.import_module('dualrip.engine.ctr.cprims')

    @classmethod
    def tearDownClass(cls):
        cls.context.__exit__(None, None, None)

    def player(self, blob=b'\xff', region_pan=64):
        region = SimpleNamespace(org_key=60, volume=127, pan=region_pan, pitch=1,
                                 attack=127, decay=127, sustain=127, release=127)
        wave = SimpleNamespace(samples=[1000] * 100, rate=32728, loop=False, loop_start=0)
        player = self.seq.CseqPlayer(blob, lambda *args: (region, wave), 32728)
        player.setup(0)
        return player

    def test_overlap_and_initial_pan_command(self):
        # New initial-pan command must not change an overlapping existing note.
        player = self.player(bytes([0xdc, 127, 0xff]))
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
                player = self.player(bytes([0xdb, main, 0xd9, aux_a, 0xda, aux_b, 0xff]))
                track = player.tracks[0]
                voice = track.note_on(60, 127, 10)
                track.run()
                player.update_voice(voice)
                channels = player.generate(1)
                expected = 1000 * math.PAN_LUT[128] * sum(math.send_gain(v) for v in (main, aux_a, aux_b))
                self.assertAlmostEqual(channels[0][0], expected)
                self.assertAlmostEqual(channels[1][0], expected)
                self.assertEqual(player.unapplied, {})
                self.assertEqual(player.handled_commands, {'mainsend': 1, 'fxsend_a': 1, 'fxsend_b': 1})
                self.assertEqual(player.effects, {})

    def test_span_is_retained_but_does_not_change_stereo(self):
        samples = []
        for raw in (0, 64, 127):
            player = self.player(bytes([0xd7, raw, 0xff]))
            track = player.tracks[0]
            voice = track.note_on(60, 127, 10)
            track.run()
            player.update_voice(voice)
            samples.append(player.generate(1))
            self.assertEqual(voice.span, math.stereo_span(raw))
            self.assertEqual(player.handled_commands, {'span_stereo_no_effect': 1})
        self.assertEqual(samples[0], samples[1])
        self.assertEqual(samples[1], samples[2])

    def test_provenance_includes_reproducible_patch(self):
        p = self.provenance
        self.assertEqual(p['nativeOutputMode']['value'], 1)
        self.assertFalse(p['nativeOutputMode']['referenceModeVerified'])
        self.assertTrue(p['remainingGaps'])
        self.assertEqual(p['runtimeAssumptions']['auxReturnA'], 1)
        self.assertNotEqual(p['originalFiles']['dualrip/engine/ctr/sequencer.py'],
                            p['patchedFiles']['dualrip/engine/ctr/sequencer.py'])

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
