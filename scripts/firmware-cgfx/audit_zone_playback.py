"""Compare pinned raw Zone segments with decoded keys and current browser sampling.

This is a source/runtime compatibility audit, not a native 3DS playback trace.
It checks segment interiors to avoid making an unsupported boundary tie-break
claim. Raw CGFX and full converted JSON stay in private artifact storage.
"""

import argparse
import hashlib
import json
import math
import struct
from pathlib import Path

from audit_zone_common import COMMON_SHA


ANCHORS = {
    0x4e84: ('skeletalAnimations', 0, 'RotationX', [0, 75, 300, 599]),
    0x5258: ('materialAnimations', 6, 'X', [50.5, 118.5, 119.5, 120.5, 239.5, 359.5, 360.5, 480.5]),
    0x6a44: ('materialAnimations', 11, 'Y', [81, 279, 280.5, 480.5, 599]),
    0x7128: ('materialAnimations', 16, 'X', [94.5, 95.5, 279.5, 280.5, 479.5, 480.5, 598.5]),
}


def raw_group(data: bytes, offset: int) -> list[dict]:
    count, = struct.unpack_from('<I', data, offset)
    if count < 1 or count > 64:
        raise ValueError('Invalid pinned raw group count')
    segments = []
    for index in range(count):
        pointer = offset + 4 + index * 4
        at = pointer + struct.unpack_from('<i', data, pointer)[0]
        start, end, flags = struct.unpack_from('<ffI', data, at)
        if flags == 1:
            value, = struct.unpack_from('<f', data, at + 12)
            keys = [{'Frame': start, 'Value': value, 'InSlope': 0, 'OutSlope': 0}]
        else:
            key_count, = struct.unpack_from('<I', data, at + 12)
            cursor = at + 20
            keys = []
            for _ in range(key_count):
                if flags == 8:
                    frame, value, incoming, outgoing = struct.unpack_from('<ffff', data, cursor)
                    cursor += 16
                elif flags == 104:
                    frame, value, incoming = struct.unpack_from('<fff', data, cursor)
                    outgoing = incoming
                    cursor += 12
                elif flags in (192, 196):
                    frame, value = struct.unpack_from('<ff', data, cursor)
                    incoming = outgoing = 0
                    cursor += 8
                else:
                    raise ValueError(f'Unverified raw anchor format {flags:#x}')
                keys.append({'Frame': start + frame, 'Value': value,
                             'InSlope': incoming, 'OutSlope': outgoing})
        segments.append({'StartFrame': start, 'EndFrame': end,
                         'FormatFlags': flags, 'Keys': keys})
    return segments


def sample_keys(keys: list[dict], frame: float, mode: str) -> float:
    if frame <= keys[0]['Frame']:
        return keys[0]['Value']
    if frame >= keys[-1]['Frame']:
        return keys[-1]['Value']
    left, right = keys[0], keys[1]
    for item in keys[1:]:
        right = item
        if frame <= right['Frame']:
            break
        left = right
    span = right['Frame'] - left['Frame']
    if span <= 0:
        raise ValueError('Ambiguous duplicate key at sampled frame')
    t = (frame - left['Frame']) / span
    if mode == 'Step':
        return left['Value']
    if mode == 'Linear':
        return left['Value'] + (right['Value'] - left['Value']) * t
    return ((2*t*t*t - 3*t*t + 1) * left['Value'] +
            (t*t*t - 2*t*t + t) * span * left['OutSlope'] +
            (-2*t*t*t + 3*t*t) * right['Value'] +
            (t*t*t - t*t) * span * right['InSlope'])


def source_sample(segments: list[dict], frame: float) -> float:
    candidates = [segment for segment in segments if segment['StartFrame'] < frame < segment['EndFrame']]
    if len(candidates) != 1:
        # Start/end samples are only used for the single-segment skeletal curve.
        if len(segments) != 1 or not (segments[0]['StartFrame'] <= frame <= segments[0]['EndFrame']):
            raise ValueError('Ambiguous source segment at sampled frame')
        candidates = segments
    segment = candidates[0]
    flags = segment['FormatFlags']
    mode = 'Linear' if flags == 196 else 'Step' if flags in (1, 192) else 'Hermite'
    return sample_keys(segment['Keys'], frame, mode)


def inspect(source: Path, converted: Path) -> dict:
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != COMMON_SHA:
        raise ValueError('Unexpected Zone common CGFX identity')
    model = json.loads(converted.read_text())
    if model['sourceSha256'] != COMMON_SHA or model['animationStatus'] != 'parsed segments; native playback unverified':
        raise ValueError('Unexpected full Zone conversion')
    decoded = {group['Offset']: group['Segments'] for group in model['sourceCurveGroups']}
    report = []
    for offset, (clip_type, element_index, channel, frames) in ANCHORS.items():
        source_segments = raw_group(raw, offset)
        actual_segments = decoded[offset]
        if len(source_segments) != len(actual_segments):
            raise ValueError(f'{offset:#x}: segment count differs from raw source')
        for expected, actual in zip(source_segments, actual_segments):
            if (expected['StartFrame'], expected['EndFrame'], expected['FormatFlags']) != (
                    actual['StartFrame'], actual['EndFrame'], actual['FormatFlags']):
                raise ValueError(f'{offset:#x}: decoded segment header differs from raw source')
            if len(expected['Keys']) != len(actual['Keys']):
                raise ValueError(f'{offset:#x}: decoded key count differs from raw source')
            for left, right in zip(expected['Keys'], actual['Keys']):
                if any(not math.isclose(left[field], right[field], rel_tol=1e-6, abs_tol=1e-5)
                       for field in ('Frame', 'Value', 'InSlope', 'OutSlope')):
                    raise ValueError(f'{offset:#x}: decoded key differs from raw source')
        curve = model[clip_type][0]['Elements'][element_index]['Content'][channel]
        samples = []
        for frame in frames:
            source_value = source_sample(source_segments, frame)
            browser_value = sample_keys(curve['KeyFrames'], frame, curve['InterpolationType'])
            samples.append({'frame': frame, 'source': round(source_value, 6),
                            'flattenedBrowser': round(browser_value, 6),
                            'difference': round(browser_value - source_value, 6)})
        report.append({'groupOffset': hex(offset), 'clip': clip_type, 'element':
                       model[clip_type][0]['Elements'][element_index]['Name'],
                       'channel': channel, 'browserInterpolation': curve['InterpolationType'],
                       'segments': len(source_segments), 'samples': samples})
    # SPICA's scalar vector overload assigns a local parameter. These four
    # source groups vanish from its H3D result, so browser playback lacks them.
    missing_offsets = [0x5054, 0x50a8, 0x5154, 0x51a8]
    for offset in missing_offsets:
        if len(raw_group(raw, offset)) != 1 or len(decoded[offset]) != 1:
            raise ValueError('Unmatched scalar group changed')
    browser_curves = [value for clip_type in ('skeletalAnimations', 'materialAnimations')
                      for element in model[clip_type][0]['Elements']
                      for value in element['Content'].values()
                      if isinstance(value, dict) and value.get('KeyFrames')]
    if len(browser_curves) != 33:
        raise ValueError('Unexpected H3D curve count')
    for offset in missing_offsets:
        keys = [key for segment in decoded[offset] for key in segment['Keys']]
        if any(len(curve['KeyFrames']) == len(keys) and all(
                math.isclose(left['Frame'], right['Frame'], abs_tol=1e-5) and
                math.isclose(left['Value'], right['Value'], abs_tol=1e-5)
                for left, right in zip(curve['KeyFrames'], keys)) for curve in browser_curves):
            raise ValueError('Previously lost scalar group now appears in H3D conversion')
    values = {row['groupOffset']: {sample['frame']: sample['difference'] for sample in row['samples']}
              for row in report}
    if (abs(values['0x4e84'][300]) > .00001 or abs(values['0x6a44'][280.5]) > .00001 or
            abs(values['0x5258'][119.5] - 14.5) > .00001 or
            abs(values['0x7128'][279.5] - 72.5) > .00001):
        raise ValueError('Representative Zone browser/source mismatch changed')
    return {'commonCgfxSha256': COMMON_SHA, 'scope': 'Pinned raw bytes versus decoded segments and current browser curve sampler; no native pose/pixel claim',
            'comparisons': report, 'lostScalarGroupOffsets': [hex(value) for value in missing_offsets]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--converted', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(inspect(args.source, args.converted), indent=2) + '\n')
