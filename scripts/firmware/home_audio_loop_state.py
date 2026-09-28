"""Exact repeat-state diagnostics for the guarded HOME sequencer/DSP model.

Absolute sample positions and offline stopping/reporting fields are excluded.
No state used to produce audio is deliberately normalized or reset. Native
loop commands preserve this state; this helper only copies it for comparison.
"""
import hashlib
import json
import struct
import numpy as np


def _plain(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, (list, tuple)):
        return [_plain(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _plain(item) for key, item in value.items()}
    if isinstance(value, np.generic):
        return value.item()
    if value is None or isinstance(value, (int, float, str, bool)):
        return value
    raise TypeError(f'Unsupported audio state: {type(value).__name__}')


def digest(value):
    encoded = json.dumps(_plain(value), sort_keys=True, separators=(',', ':'), allow_nan=False)
    return hashlib.sha256(encoded.encode()).hexdigest()


def snapshot(player, wave_hashes=None):
    """Copy the boundary after timer() and before generate(160)."""
    wave_hashes = {} if wave_hashes is None else wave_hashes
    tracks = []
    for track in player.tracks:
        row = {key: _plain(value) for key, value in vars(track).items()
               if key not in ('ply', 'stack', 'visited', 'passes_left', 'loopCount')}
        if hasattr(track, 'stack'):
            # The loop tuple's third field is a sample timestamp used only for
            # export metadata; finite loop counts and return positions remain.
            row['stack'] = [[entry[0], entry[1], entry[3]] if entry[0] == 'loop'
                            else list(entry) for entry in track.stack]
        tracks.append(row)
    voices = []
    for voice in player.voices:
        if voice.state == 0:
            # kill() fixes allocation-relevant state; stale DSP/wave fields are
            # overwritten at note_on and are not part of an inactive voice.
            voices.append({key: getattr(voice, key) for key in
                           ('state', 'trackId', 'prio', 'vol', 'noteLength')})
            continue
        row = {key: _plain(getattr(voice, key)) for key in voice.__slots__
               if key not in ('samples', 'envelope', 'sweep', 'lfo', 'dsp', 'pos', 'dead_wrap')
               and hasattr(voice, key)}
        identity = id(voice.samples)
        if identity not in wave_hashes:
            wave_hashes[identity] = hashlib.sha256(np.asarray(voice.samples, dtype='<i2').tobytes()).hexdigest()
        row['waveSha256'] = wave_hashes[identity]
        row['waveSamples'] = len(voice.samples)
        for key in ('envelope', 'sweep', 'lfo', 'dsp'):
            obj = getattr(voice, key)
            row[key] = {field: _plain(getattr(obj, field)) for field in obj.__slots__ if field != 'samples'}
        voices.append(row)
    state = {
        'player': {key: _plain(getattr(player, key)) for key in
                   ('rate', 'channel_prio', 'base_gain', 'tempo', 'tempo_ratio', 'timebase',
                    'masterVol', 'active', 'variables')},
        'clock': {'fraction': player.sequence_clock.remaining_fraction,
                  'fractionBits': struct.pack('<f', player.sequence_clock.remaining_fraction).hex()},
        'rng': vars(player.rng).copy(),
        'tracks': tracks,
        'voices': voices,
        'auxReturns': player.aux_returns.copy(),
    }
    return {'sample': player.now_sample, 'state': state, 'stateSha256': digest(state),
            'componentSha256': {key: digest(value) for key, value in state.items()},
            'activeVoiceMultisetSha256': digest(sorted(digest(voice) for voice in voices if voice['state'] != 0))}


def differences(left, right, prefix=''):
    """Every differing leaf, with values retained for a reviewable counterexample."""
    if type(left) is not type(right):
        return [{'path': prefix, 'left': left, 'right': right}]
    if isinstance(left, dict):
        rows = []
        for key in sorted(left.keys() | right.keys()):
            path = prefix + '.' + key if prefix else key
            if key not in left or key not in right:
                rows.append({'path': path, 'left': left.get(key), 'right': right.get(key)})
            else:
                rows.extend(differences(left[key], right[key], path))
        return rows
    if isinstance(left, list):
        if len(left) != len(right):
            return [{'path': prefix + '.length', 'left': len(left), 'right': len(right)}]
        return [row for index, (a, b) in enumerate(zip(left, right))
                for row in differences(a, b, f'{prefix}[{index}]')]
    return [] if left == right else [{'path': prefix, 'left': left, 'right': right}]
