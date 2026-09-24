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
    'bound-page-perspective-setup': (0x21fecc, 0x220010),
    'service12-upper-draw': (0x249004, 0x249104),
    'page-draw-wrapper': (0x1cbfa8, 0x1cbfe8),
    'page-stereo-traversal': (0x220198, 0x2202a4),
    'registered-root-attachment': (0x253f08, 0x253f64),
    'pane-matrix-calculation': (0x20c484, 0x20c654),
    'picture-matrix-and-vertex-submit': (0x271ffc, 0x2721dc),
    'picture-batch-flush': (0x1cee90, 0x1cf028),
}

def arm_bl_target(code, address):
    """Decode a direct ARM BL edge, rejecting other opcodes (including BLX)."""
    word = struct.unpack_from('<I', code, address-BASE)[0]
    if word >> 24 != 0xeb:
        raise ValueError(f'Expected unconditional ARM BL at {address:#x}')
    displacement = word & 0xffffff
    if displacement & 0x800000:
        displacement -= 0x1000000
    return address + 8 + displacement * 4


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
    page_raw = (romfs/'layout.nwcx').read_bytes()
    page_members = unpack_archive(decompress(page_raw) if page_raw[0] in (16, 17) else page_raw)
    page_bytes = page_members['blyt/page_transition.bclyt']
    page = decode_layout(page_bytes)
    page_panes = {p['name']: p for p in panes(page['roots'])}
    edges = (0x249040, 0x249090, 0x1cbfcc, 0x1cbfe0, 0x21ff30,
             0x21ff58, 0x220200, 0x220248, 0x220270, 0x220280, 0x253f40)
    words = lambda addresses: [struct.unpack_from('<I', code, a-BASE)[0] for a in addresses]
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
        'upperPageCamera': {
            'routine': '0x21fecc', 'confirmedPageBinding': True,
            'rasterValidated': False,
            'fovyNearFarHalfAngle': floats(range(0x21fff4, 0x220004, 4)),
            'eyeExpression': '(page_transition height / 2) / tan(22.5 degrees)',
            'pageLayoutSha256': hashlib.sha256(page_bytes).hexdigest(),
            'pageCanvas': page['canvas'],
            'upperParent': {key: page_panes['N_ScreenU_P'][key] for key in
                            ('name', 'flags', 'translation', 'rotation', 'scale')},
            'upperPictureSize': page_panes['N_ScreenU']['size'],
            'aspectCorrection': floats((0x1026c4, 0x1026c8)),
            'stereoScaleAndConvergence': floats((0x220298, 0x22029c)),
            'service12VtableUpperCallbacks': [hex(v) for v in words((0x2d6500, 0x2d6504))],
            'callEdges': {hex(a): hex(arm_bl_target(code, a)) for a in edges},
            'limits': ['Final HTML root offset and fullscreen scissor are not resolved',
                       'Stereo-zero final matrix, GPU depth state and projective interpolation need validation']},
        'ranges': {name: {'start': hex(a), 'endExclusive': hex(b),
            'sha256': hashlib.sha256(code[a-BASE:b-BASE]).hexdigest()} for name,(a,b) in RANGES.items()},
        'decision': 'Audit only: upper page camera is bound, but scissor/depth/raster gates remain open',
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
    print(json.dumps({'report': str(args.report), 'pageCameraBound': True, 'rasterValidated': False,
                      'depthPanes': len(result['depthPanes']), 'depthTracks': len(result['clip']['depthTracks'])}))

if __name__ == '__main__': main()
