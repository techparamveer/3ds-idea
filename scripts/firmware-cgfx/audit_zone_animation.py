"""Bounded source audit of the fully decoded Zone common CGFX curve segments.

Input models and firmware remain private. The fixture contains derived segment
counts, frame boundaries and a canonical key digest, not texture or CGFX bytes.
"""

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path

from audit_stock_2d import rgba_png_alpha
from audit_zone_common import CBMD_SHA, COMMON_SHA, SELECTED_SHA


def inspect(common_source: Path, common_dir: Path, selected_dir: Path) -> dict:
    if hashlib.sha256(common_source.read_bytes()).hexdigest() != COMMON_SHA:
        raise ValueError('Unexpected Zone common CGFX identity')
    common = json.loads((common_dir / 'model.json').read_text())
    selected = json.loads((selected_dir / 'model.json').read_text())
    if common['sourceSha256'] != COMMON_SHA or common['animationStatus'] != 'parsed segments; native playback unverified':
        raise ValueError('Unexpected Zone full conversion status')
    if len(common['models']) != 1 or common['models'][0]['name'] != 'COMMON' or len(common['models'][0]['meshes']) != 4:
        raise ValueError('Unexpected Zone common model')
    if [(item['Name'], item['FramesCount']) for item in common['skeletalAnimations']] != [('COMMON', 600)]:
        raise ValueError('Unexpected Zone skeletal clip')
    if [(item['Name'], item['FramesCount']) for item in common['materialAnimations']] != [('COMMON', 600)]:
        raise ValueError('Unexpected Zone material clip')
    cbmd = selected['cbmd']
    if (cbmd['cbmdSha256'], cbmd['cgfxSha256'], cbmd['language'], cbmd['usedCommon']) != (CBMD_SHA, SELECTED_SHA, 'eur-en', False):
        raise ValueError('Unexpected Zone selected CGFX')
    if selected['models'] or [texture['name'] for texture in selected['textures']] != ['JPN_JP']:
        raise ValueError('Unexpected Zone selected model or texture')
    texture = selected['textures'][0]
    if rgba_png_alpha(selected_dir / texture['url'], texture['width'], texture['height'])[0] != 0:
        raise ValueError('Zone selected replacement is no longer transparent')

    groups = common['sourceCurveGroups']
    if len(groups) != 37 or len({group['Offset'] for group in groups}) != 37:
        raise ValueError('Unexpected Zone curve groups')
    counts, flags = Counter(), Counter()
    key_count = 0
    timeline = []
    for group in groups:
        segments = group['Segments']
        counts[len(segments)] += 1
        previous_end = -math.inf
        entries = []
        for segment in segments:
            start, end, flag = segment['StartFrame'], segment['EndFrame'], segment['FormatFlags']
            keys = segment['Keys']
            if not (math.isfinite(start) and math.isfinite(end) and start >= previous_end and end >= start and keys):
                raise ValueError('Invalid Zone segment boundary')
            if any(not (math.isfinite(key['Frame']) and math.isfinite(key['Value']) and
                            start - .001 <= key['Frame'] <= end + .001) for key in keys):
                raise ValueError('Invalid Zone segment key')
            frames = [key['Frame'] for key in keys]
            if frames != sorted(frames):
                raise ValueError('Unordered Zone segment keys')
            previous_end = end
            flags[flag] += 1
            key_count += len(keys)
            entries.append([start, end, flag, len(keys)])
        timeline.append({'offset': hex(group['Offset']), 'count': len(entries),
                         'start': entries[0][0], 'end': entries[-1][1]})
    if counts != Counter({1: 15, 2: 7, 4: 3, 7: 4, 9: 2, 10: 4, 16: 2}):
        raise ValueError('Zone segment count distribution changed')
    if flags != Counter({1: 38, 8: 54, 104: 1, 192: 48, 196: 18}):
        raise ValueError('Zone curve format distribution changed')
    anchor = next(group for group in groups if group['Offset'] == 0x6a44)
    if [key['Frame'] for key in anchor['Segments'][2]['Keys']] != [80, 280, 480, 600]:
        raise ValueError('Zone local-to-global frame conversion changed')
    canonical = json.dumps(groups, sort_keys=True, separators=(',', ':')).encode()
    return {'cbmdSha256': CBMD_SHA, 'commonCgfxSha256': COMMON_SHA,
            'selectedCgfxSha256': SELECTED_SHA, 'model': 'COMMON',
            'skeletalClip': 'COMMON', 'materialClip': 'COMMON', 'clipFrames': 600,
            'curveGroups': len(groups), 'segments': sum(count * frequency for count, frequency in counts.items()),
            'keys': key_count, 'segmentCountDistribution': {str(key): value for key, value in sorted(counts.items())},
            'formatFlagDistribution': {str(key): value for key, value in sorted(flags.items())},
            'canonicalSegmentSha256': hashlib.sha256(canonical).hexdigest(),
            'groups': timeline,
            'localFrameAnchor': {'offset': '0x6a44', 'segmentFrames':
                                 [[segment['StartFrame'], segment['EndFrame']] for segment in anchor['Segments']],
                                 'thirdSegmentKeys': [key['Frame'] for key in anchor['Segments'][2]['Keys']]},
            'selectedTexture': 'JPN_JP', 'selectedVisiblePixels': 0,
            'scope': 'Full source segment decode and texture-name identity; H3D flattening does not prove native playback or LCD pixels'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--common-source', required=True, type=Path)
    parser.add_argument('--common-dir', required=True, type=Path)
    parser.add_argument('--selected-dir', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(inspect(args.common_source, args.common_dir, args.selected_dir), indent=2) + '\n')
