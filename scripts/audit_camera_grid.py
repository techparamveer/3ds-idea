"""Reproduce Camera's settled large-grid geometry from private code and resources.

Only JSON evidence is written. Firmware is never copied into the repository.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

CODE_SHA = '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c'


def pane(layout, name):
    def walk(panes):
        for item in panes:
            if item['name'] == name:
                return item
            result = walk(item.get('children', []))
            if result:
                return result
    result = walk(layout['roots'])
    assert result, name
    return result


def audit(code_path, pack_path):
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA, 'unexpected Camera executable'
    pack = json.loads(pack_path.read_text())
    assert pack['titleId'] == '0004001000022400'
    u32 = lambda address: struct.unpack_from('<I', code, address - 0x100000)[0]
    f32 = lambda address: struct.unpack_from('<f', code, address - 0x100000)[0]
    text = lambda address: code[address - 0x100000:].split(b'\0', 1)[0].decode('ascii')
    assert u32(0x2de63c) == 0x347fc8
    density = [list(struct.unpack_from('<III', code, a - 0x100000)) for a in [0x347fc8, 0x347fd4, 0x347fe0]]
    assert density == [[3, 2, 6], [4, 3, 12], [5, 4, 20]]
    assert f32(0x2de640) == 2.0 and f32(0x2de644) == 0.5
    assert [text(u32(a)) for a in [0x440268, 0x44026c, 0x440270]] == ['PicPosRengeL', 'PicPosRengeM', 'PicPosRengeS']
    assert [text(u32(a)) for a in [0x440274, 0x440278, 0x44027c]] == ['PageRengeL', 'PageRengeM', 'PageRengeS']
    layouts = pack['layouts']
    mount = pane(layouts['P_BrwsPhoMntBase'], '-PhoMntPos')
    area = pane(layouts['P_BrwsPhoMntData'], 'PicPosRengeL')
    page = pane(layouts['P_BrwsPhoMntData'], 'PageRengeL')
    assert mount['translation'][:2] == [0, 13]
    assert area['translation'][:2] == [0, 0] and area['size'] == [228, 132]
    assert page['size'] == [248, 146]
    for layout in ['P_BrwsPic', 'P_BrwsFld']:
        hit = pane(layouts[layout], 'BB-Thmb')
        assert hit['translation'][:2] == [0, 0] and hit['size'] == [62, 48]
    cols, rows, count = density[0]
    # 0x2de5b0–0x2de630: integer-truncate horizontal width to a multiple
    # of columns; distribute cell centres around the mounted range centre.
    width = int(area['size'][0]) // cols * cols
    height = area['size'][1]
    x0, y0 = mount['translation'][:2]
    centres = [[160 + x0 + (i % cols + .5) * width / cols - width / 2,
                120 - (y0 + height / 2 - (i // cols + .5) * height / rows)] for i in range(count)]
    assert centres == [[84, 74], [160, 74], [236, 74], [84, 140], [160, 140], [236, 140]]
    return {'ok': True, 'codeSha256': CODE_SHA, 'packSha256': hashlib.sha256(pack_path.read_bytes()).hexdigest(),
            'gridFunction': '0x2de524', 'densityTable': density, 'largeCentres': centres,
            'largeTouchSize': [62, 48], 'pageStride': page['size'][0],
            'scope': 'Settled large-grid placement; no native capture, animation, or page-drag acceptance.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--pack', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    for value in [args.code, args.pack, args.output]:
        assert value.is_absolute(), 'paths must be absolute'
    result = audit(args.code, args.pack)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
