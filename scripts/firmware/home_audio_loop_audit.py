"""Audit complete music boundary state and unmodified PCM at a fixed pass count."""
from pathlib import Path
import argparse
import hashlib
import inspect
import json
import sys
import wave
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from firmware.home_audio_profile import isolated_renderer, validate_source, validate_archive
from firmware.home_audio_loop_state import snapshot, differences
from render_firmware_audio import CUES


def audit(source, output, renderer, scratch, source_record, alias, passes=12, write_pcm=False):
    if alias not in ('music', 'music-resume') or not 4 <= passes <= 32:
        raise ValueError('Audit requires a music entry and a fixed 4..32 pass count')
    if output.exists() or (write_pcm and output.with_suffix('.wav').exists()):
        raise ValueError('Use a new audit output path')
    title = json.loads(source_record.read_text())
    validate_source(source, title)
    with isolated_renderer(renderer, scratch) as profile:
        from dualrip.formats.ctr.archive import CtrArchive
        from dualrip.formats.ctr.cseq import parse_cseq
        from dualrip.engine.ctr.sequencer import CseqPlayer
        archive = CtrArchive(source.read_bytes(), [], source.name)
        validate_archive(archive, [CUES[alias]])
        sound = next(sound for sound in archive.sounds if sound.name == CUES[alias])
        blob, _ = parse_cseq(archive.ctx.file_bytes(sound.file_id, 'seq'))
        # Stop externally at the chosen nonterminating boundary. An offline
        # pass-limit mutation must never contaminate a repeat-state snapshot.
        player = CseqPlayer(blob, archive.ctx.make_lookup(sound.bank_ids), 32728,
                            sound.channel_prio, loop_passes=passes + 2, base_vol=sound.volume)
        pending = []
        def mark(start, end):
            track = inspect.currentframe().f_back.f_locals['self']
            if track.num == 0:
                pending.append((start, end))
        player.mark_loop = mark
        player.setup(sound.start_offset)
        boundaries, periods, pass_records = [], [], []
        pcm_hash, pass_hash = hashlib.sha256(), hashlib.sha256()
        period_hashes, wave_hashes = {}, {}
        max_voices = 0
        output.parent.mkdir(parents=True, exist_ok=True)
        wav = wave.open(str(output.with_suffix('.wav')), 'wb') if write_pcm else None
        if wav:
            wav.setparams((2, 2, 32728, 0, 'NONE', 'not compressed'))
        try:
            for _ in range((passes + 2) * 12000):
                player.timer()
                if player.all_tracks_ended():
                    raise RuntimeError('Unexpected offline sequence termination before audit boundary')
                first_start = (not boundaries and any(entry[0] == 'loop' and entry[3] == 0
                                                     for entry in player.tracks[0].stack))
                if first_start or pending:
                    if len(pending) > 1:
                        raise RuntimeError('Multiple music boundaries in one frame')
                    index = len(boundaries)
                    copied = snapshot(player, wave_hashes)
                    copied['index'] = index
                    boundaries.append(copied)
                    if index:
                        pass_records.append({'from': index - 1, 'to': index,
                                             'samples': copied['sample'] - boundaries[index - 1]['sample'],
                                             'pcmSha256': pass_hash.hexdigest()})
                        pass_hash = hashlib.sha256()
                    for start in list(period_hashes):
                        if index == start + 2:
                            periods.append({'from': start, 'to': index,
                                            'samples': copied['sample'] - boundaries[start]['sample'],
                                            'pcmSha256': period_hashes.pop(start).hexdigest()})
                    pending.clear()
                    if index == passes:
                        break
                    period_hashes[index] = hashlib.sha256()
                    print(f'{alias} boundary {index}: sample {copied["sample"]}, '
                          f'clock {copied["state"]["clock"]["fractionBits"]}', flush=True)
                channels = player.generate(160)
                pcm = np.clip(np.asarray(channels).T, -32768, 32767).astype('<i2').tobytes()
                pcm_hash.update(pcm)
                if boundaries:
                    pass_hash.update(pcm)
                    for hasher in period_hashes.values():
                        hasher.update(pcm)
                if wav:
                    wav.writeframesraw(pcm)
                max_voices = max(max_voices, sum(voice.state != 0 for voice in player.voices))
            else:
                raise RuntimeError('Audit frame cap reached')
        finally:
            if wav:
                wav.close()
        pairs = []
        for index in range(len(boundaries) - 2):
            a, b = boundaries[index], boundaries[index + 2]
            pairs.append({'from': index, 'to': index + 2,
                          'samples': b['sample'] - a['sample'],
                          'exactStateEqual': a['stateSha256'] == b['stateSha256'],
                          'componentsEqual': {key: a['componentSha256'][key] == b['componentSha256'][key]
                                              for key in a['componentSha256']},
                          'voiceMultisetEqual': a['activeVoiceMultisetSha256'] == b['activeVoiceMultisetSha256'],
                          'differences': differences(a['state'], b['state'])})
        report = {'schema': 1, 'cue': alias, 'passes': passes, 'profile': profile,
                  'auditSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  'stateHelperSha256': hashlib.sha256(Path(__file__).with_name('home_audio_loop_state.py').read_bytes()).hexdigest(),
                  'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                  'samples': player.now_sample, 'pcmSha256': pcm_hash.hexdigest(),
                  'maximumActiveVoices': max_voices, 'boundaries': boundaries,
                  'singlePassPcm': pass_records, 'twoPassPcm': periods, 'correspondingPairs': pairs,
                  'allExactBoundaryMatches': [[a['index'], b['index']] for i, a in enumerate(boundaries)
                                              for b in boundaries[i + 1:] if a['stateSha256'] == b['stateSha256']],
                  'snapshotPhase': 'after full sequence/voice timer, before 160-sample DSP generation',
                  'excluded': ['absolute sample count', 'offline pass budget and loop/report counters',
                               'loop export timestamps', 'visited addresses used for offline loop detection',
                               'legacy unused voice pos/dead_wrap fields', 'inactive overwritten wave/DSP fields'],
                  'limits': 'Finite audit of the pinned source-backed model; no proof that arbitrarily distant exact repeats are impossible; no seam processing or native runtime capture'}
        output.write_text(json.dumps(report, indent=2) + '\n')
        return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--renderer', type=Path, required=True)
    parser.add_argument('--scratch', type=Path, required=True)
    parser.add_argument('--source-record', type=Path, required=True)
    parser.add_argument('--cue', choices=['music', 'music-resume'], required=True)
    parser.add_argument('--passes', type=int, default=12)
    parser.add_argument('--write-pcm', action='store_true')
    args = parser.parse_args()
    audit(args.source, args.output, args.renderer, args.scratch, args.source_record,
          args.cue, args.passes, args.write_pcm)
