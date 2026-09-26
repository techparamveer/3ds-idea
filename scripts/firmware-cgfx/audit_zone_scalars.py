"""Verify restored Zone scalar bindings against independently decoded source keys."""
import argparse
import hashlib
import json
import math
from pathlib import Path
from audit_zone_common import COMMON_SHA
from audit_zone_playback import raw_group

BINDINGS = {
    0x5054: ('mainmat', 'MaterialTexCoord1Rot'),
    0x50a8: ('wgnmat', 'MaterialTexCoord0Rot'),
    0x5154: ('COMMON3', 'MaterialTexCoord1Rot'),
    0x51a8: ('COMMON4', 'MaterialTexCoord0Rot'),
}

def inspect(source, converted):
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != COMMON_SHA:
        raise ValueError('Unexpected Zone common source')
    model = json.loads(converted.read_text())
    if model['sourceSha256'] != COMMON_SHA:
        raise ValueError('Unexpected converted source')
    elements = model['materialAnimations'][0]['Elements']
    bound = []
    segment_count = key_count = 0
    for kind in ('skeletalAnimations', 'materialAnimations'):
        for element in model[kind][0]['Elements']:
            for channel, curve in element['Content'].items():
                if not isinstance(curve, dict) or 'SourceSegments' not in curve:
                    continue
                offset = curve['SourceGroupOffset']
                source_segments = raw_group(raw, offset)
                if len(source_segments) != len(curve['SourceSegments']):
                    raise ValueError('Bound segment count differs from source')
                for expected, actual in zip(source_segments, curve['SourceSegments']):
                    if expected['FormatFlags'] != actual['FormatFlags'] or any(
                            not math.isclose(expected[k], actual[k], rel_tol=1e-6, abs_tol=1e-5)
                            for k in ('StartFrame', 'EndFrame')):
                        raise ValueError('Bound segment header differs from source')
                    if len(expected['Keys']) != len(actual['Keys']):
                        raise ValueError('Bound key count differs from source')
                    for left, right in zip(expected['Keys'], actual['Keys']):
                        if any(not math.isclose(left[k], right[k], rel_tol=1e-6, abs_tol=1e-5)
                               for k in ('Frame', 'Value', 'InSlope', 'OutSlope')):
                            raise ValueError('Bound key differs from source')
                    segment_count += 1
                    key_count += len(expected['Keys'])
                bound.append(offset)
    if bound and (len(bound) != 37 or len(set(bound)) != 37 or
                  set(bound) != {g['Offset'] for g in model['sourceCurveGroups']}):
        raise ValueError('Source group binding is incomplete or duplicated')
    rows = []
    for offset, (name, target) in BINDINGS.items():
        matches = [e for e in elements if e['Name'] == name and e['TargetType'] == target]
        if len(matches) != 1:
            raise ValueError('Scalar binding missing or ambiguous')
        curve = matches[0]['Content']['Value']
        segments = raw_group(raw, offset)
        if len(segments) != 1 or segments[0]['FormatFlags'] != 196:
            raise ValueError('Unexpected scalar interpolation')
        expected = segments[0]['Keys']
        if curve['InterpolationType'] != 'Linear' or len(curve['KeyFrames']) != len(expected):
            raise ValueError('Scalar keys or interpolation missing')
        for a, b in zip(expected, curve['KeyFrames']):
            if any(not math.isclose(a[k], b[k], abs_tol=1e-6) for k in ('Frame', 'Value', 'InSlope', 'OutSlope')):
                raise ValueError('Scalar key differs from source')
        rows.append({'offset': hex(offset), 'material': name, 'target': target, 'keys': len(expected)})
    return {'sourceSha256': COMMON_SHA, 'restoredScalars': rows,
            'boundGroups': len(bound), 'boundSegments': segment_count, 'boundKeys': key_count,
            'scope': 'Scalar source bindings only; mixed segment playback and native pixels remain open'}

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', required=True, type=Path)
    p.add_argument('--converted', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    a = p.parse_args()
    a.output.write_text(json.dumps(inspect(a.source, a.converted), indent=2) + '\n')
