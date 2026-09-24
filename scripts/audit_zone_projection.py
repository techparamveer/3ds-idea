"""Read-only Nintendo Zone banner/camera audit; does not select a runtime camera."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys
import xml.etree.ElementTree as ET
sys.path.insert(0, str(Path(__file__).resolve().parent))
from firmware.build import decompress, unpack_archive
from firmware.native import decode_animation, decode_layout

BASE = 0x100000
CODE_SHA256 = '6f250e8b33361a4a3f418ec778055f0056a1a11fd70bae6dcf3e9b6a3fe4395c'
RANGES = {
    'bundled-banner-fallback': (0x18766c, 0x187710),
    'html-layout-resource-load': (0x218cf8, 0x219010),
    'html-layout-position': (0x23c990, 0x23cb0c),
    'upper-target-setup': (0x1075f0, 0x107710),
    'candidate-perspective-setup': (0x21fecc, 0x220010),
}

def panes(roots):
    for pane in roots:
        yield pane
        yield from panes(pane['children'])

def inspect(code, romfs):
    if hashlib.sha256(code).hexdigest() != CODE_SHA256:
        raise ValueError('Unexpected Nintendo Zone code image')
    archive_path = romfs/'www/included_html/3dbanner_EU.nwcla'
    raw = archive_path.read_bytes()
    members = unpack_archive(decompress(raw))
    descriptor = ET.fromstring(members['index.nwlx'])
    layout = decode_layout(members['blyt/U_top.bclyt'])
    clip = decode_animation(members['anim/U_top_Loop_anim.bclan'])
    all_panes = list(panes(layout['roots']))
    ground = next(p for p in all_panes if p['name'] == 'BG_grid')
    depth = [p for p in all_panes if p['translation'][2] != 0]
    floats = lambda addresses: [struct.unpack_from('<f', code, a-BASE)[0] for a in addresses]
    return {
        'codeSha256': CODE_SHA256, 'archiveSha256': hashlib.sha256(raw).hexdigest(),
        'members': {name: hashlib.sha256(members[name]).hexdigest() for name in
                    ('index.nwlx', 'blyt/U_top.bclyt', 'anim/U_top_Loop_anim.bclan')},
        'descriptor': {'attributes': descriptor.attrib,
                       'startAnimation': descriptor.findtext('startAnimation')},
        'canvas': layout['canvas'], 'paneCount': len(all_panes),
        'ground': {key: ground[key] for key in ('name', 'origin', 'translation', 'rotation', 'scale', 'size', 'picture')},
        'groundMaterial': layout['materials'][ground['picture']['material']],
        'depthPanes': [{'name': p['name'], 'z': p['translation'][2]} for p in depth],
        'clip': {'frames': clip['frames'], 'loop': clip['loop'],
                 'depthTracks': [t for t in clip['tracks'] if t['property'] == 'translation.z']},
        'upperTargetConstants': dict(zip(('y', 'x', 'height', 'width'), floats(range(0x1078a4, 0x1078b4, 4)))),
        'unboundCameraCandidate': {
            'routine': '0x21fecc', 'confirmedBannerCamera': False,
            'fovyNearFarHalfAngle': floats(range(0x21fff4, 0x220004, 4)),
            'eyeExpression': '(rectangle height / 2) / tan(22.5 degrees)',
            'limits': ['U_top draw path to this routine is unproven',
                       'Rectangle identity, stereo selection, scissor and depth state are unproven']},
        'ranges': {name: {'start': hex(a), 'endExclusive': hex(b),
            'sha256': hashlib.sha256(code[a-BASE:b-BASE]).hexdigest()} for name,(a,b) in RANGES.items()},
        'decision': 'Audit only: retain explicit unverified projection diagnostic; no camera inferred from layout dimensions',
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'romfs', 'report'): parser.add_argument('--'+name, required=True, type=Path)
    args = parser.parse_args()
    if not all(p.is_absolute() for p in (args.code, args.romfs, args.report)):
        parser.error('Use absolute paths')
    result = inspect(args.code.read_bytes(), args.romfs)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps({'report': str(args.report), 'cameraProven': False,
                      'depthPanes': len(result['depthPanes']), 'depthTracks': len(result['clip']['depthTracks'])}))

if __name__ == '__main__': main()
