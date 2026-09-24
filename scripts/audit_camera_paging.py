"""Check source Camera paging inputs and clip identity; no motion is inferred."""
import argparse
import json
from pathlib import Path
from audit_camera_grid import audit as audit_grid


def audit(code, pack):
    grid = audit_grid(code, pack)
    source = json.loads(pack.read_text())
    clips = source['animations']
    cursor = clips['P_BrwsCursor_D_CurDefault']
    assert cursor['frames'] == 188 and cursor['loop']
    assert len(cursor['tracks']) == 1
    track = cursor['tracks'][0]
    assert (track['target'], track['property']) == ('Cursor', 'texture.rotation')
    assert [(k['frame'], k['value']) for k in track['keys']] == [(0, 0), (188, -360)]
    for name in ['PicL2M', 'PicM2L', 'PicM2S', 'PicS2M']:
        clip = clips['P_BrwsCursor_D_' + name]
        assert clip['frames'] == 9 and not clip['loop']
        assert any(t['property'] == 'size.width' for t in clip['tracks'])
    # 0x1fd910 sets the generic scroll lattice from native page/range sizes.
    stride = int(grid['pageStride'])
    pitch = 228 // 3
    margin = (stride - pitch * 3) // 2
    # 0x1fdd90: per-cycle anchor is stride; nonzero within-cycle anchors add margin.
    lattice = [(i // 3) * stride + (margin + (i % 3) * pitch if i % 3 else 0) for i in range(10)]
    assert lattice == [0, 86, 162, 248, 334, 410, 496, 582, 658, 744]
    return {'ok': True, 'codeSha256': grid['codeSha256'], 'largeSnapLattice': lattice,
            'largeStride': stride, 'largeColumnPitch': pitch, 'largeMargin': margin,
            'cursorIdle': {'frames': 188, 'loop': True, 'property': 'texture.rotation'},
            'scope': 'Source lattice and clip identity only. Controller tick, easing, input and lifecycle cadence unverified.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--pack', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert all(p.is_absolute() for p in [args.code, args.pack, args.output])
    result = audit(args.code, args.pack)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
