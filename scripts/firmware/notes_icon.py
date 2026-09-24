"""Game Notes' SMDH large-icon tile expansion, without executing ARM code.

EUR Notes 0x106258..0x1066a0 copies 48x48 into 64x64 storage and duplicates
its right/bottom edges. Bytes the native routine never writes are transparent
in delivery, never captured from its uninitialized scratch memory. P_Icon_00
samples UV 0..0.75; source-material tests verify that its icon mask prevents
undefined texels from affecting the composited image.
"""
import argparse
import hashlib
import json
import re
import struct
from pathlib import Path

try:
    from .texture import decode_texture, png, MORTON
except ImportError:
    from texture import decode_texture, png, MORTON

CODE_SHA256 = '8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6'
# 0x1aa000 + 0x00/0x20: rightmost-column/bottom-row Morton offsets.
RIGHT = (21, 23, 29, 31, 53, 55, 61, 63)
BOTTOM = (42, 43, 46, 47, 58, 59, 62, 63)
# Large-icon table slices +0x40/+0x88 and +0x58/+0xa0 respectively.
RIGHT_SOURCE = (5, 11, 17, 23, 29, 35)
RIGHT_TARGET = (6, 14, 22, 30, 38, 46)
BOTTOM_SOURCE = (30, 31, 32, 33, 34, 35)
BOTTOM_TARGET = (48, 49, 50, 51, 52, 53)


def expand_large(smdh):
    if len(smdh) < 0x36c0 or smdh[:4] != b'SMDH':
        raise ValueError('Expected a complete SMDH icon payload')
    raw = smdh[0x24c0:0x36c0]
    expanded, known = bytearray(0x2000), bytearray(0x2000)

    def write(at, data):
        expanded[at:at+len(data)] = data
        known[at:at+len(data)] = b'\1'*len(data)

    # 0x10626c..0x1062a0: six rows of six 8x8 RGB565 tiles;
    # right-side two tiles are filled with 0xff before edge copying.
    for row in range(6):
        write(row*0x400, raw[row*0x300:(row+1)*0x300])
        write(row*0x400+0x300, b'\xff'*0x100)
    # 0x10639c..0x106410: 0x7ac relative to combined output,
    # hence -0x54 relative to the large-icon buffer at +0x800.
    for src, dst in zip(BOTTOM_SOURCE, BOTTOM_TARGET):
        for offset in BOTTOM:
            read_at = (offset+src*64)*2
            write((offset+dst*64)*2-0x54, raw[read_at:read_at+2])
    # 0x106508..0x106584: analogous right-edge copies, 0x7d6 - 0x800.
    for src, dst in zip(RIGHT_SOURCE, RIGHT_TARGET):
        for offset in RIGHT:
            read_at = (offset+src*64)*2
            write((offset+dst*64)*2-0x2a, raw[read_at:read_at+2])
    return bytes(expanded), bytes(known)


def notes_icon_png(smdh):
    expanded, known = expand_large(smdh)
    rgba = bytearray(decode_texture(expanded, 64, 64, 3))
    for y in range(64):
        for x in range(64):
            at = ((y//8)*8+x//8)*64+MORTON[x%8]+2*MORTON[y%8]
            if not known[at*2]: rgba[(y*64+x)*4:(y*64+x+1)*4] = bytes(4)
    return png(64, 64, rgba)


def conversion():
    return {'name': 'notes-smdh-large-icon', 'version': 1,
            'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'codeSha256': CODE_SHA256, 'routineStart': '0x106258', 'routineEndExclusive': '0x1066a4',
            'undefinedTexels': 'transparent-native-uninitialized-masked-region', 'width': 64, 'height': 64}


def verify_source(code):
    if hashlib.sha256(code).hexdigest() != CODE_SHA256:
        raise ValueError('Unexpected Game Notes executable identity')
    for offset, values in [(0, RIGHT), (0x20, BOTTOM), (0x40, RIGHT_SOURCE),
                           (0x88, RIGHT_TARGET), (0x58, BOTTOM_SOURCE), (0xa0, BOTTOM_TARGET)]:
        if struct.unpack_from('<'+'I'*len(values), code, 0xaa000+offset) != values:
            raise ValueError('Source icon table mismatch')


def publish(manifest, icons, output):
    updates = []
    for title_id, path in icons.items():
        if not re.fullmatch('[0-9a-f]{16}', title_id): raise ValueError('Invalid title identity')
        title = manifest['titles'][title_id]
        sources = manifest['resources'][title['icon']]['sources']
        matches = [s for s in sources if s.get('titleId') == title_id and s.get('path') == 'ExeFS/icon']
        raw = Path(path).read_bytes()
        if len(matches) != 1 or hashlib.sha256(raw).hexdigest() != matches[0]['sha256']:
            raise ValueError('SMDH does not match its published icon provenance')
        data = notes_icon_png(raw); url = f'icons/notes/{title_id}.png'
        updates.append((title, url, data, dict(matches[0])))
    for title, url, data, source in updates:
        target = Path(output)/url; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
        manifest['resources'][url] = {'kind': 'title-icon', 'sha256': hashlib.sha256(data).hexdigest(), 'size': len(data), 'sources': [source]}
        title.update(notesIcon=url, notesIconConversion=conversion())
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--source-code', type=Path, required=True)
    parser.add_argument('--icon', action='append', required=True, metavar='TITLE_ID=ABSOLUTE_PATH')
    args = parser.parse_args()
    if not args.manifest.is_absolute() or not args.source_code.is_absolute(): parser.error('paths must be absolute')
    verify_source(args.source_code.read_bytes())
    icons = {}
    for entry in args.icon:
        title_id, path = entry.split('=', 1)
        if not Path(path).is_absolute() or title_id in icons: parser.error('icon paths must be absolute with unique title IDs')
        icons[title_id] = path
    manifest = publish(json.loads(args.manifest.read_text()), icons, args.manifest.parent)
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=True, sort_keys=True, separators=(',', ':'), allow_nan=False)+'\n')
    print(f'Published {len(icons)} source Notes icons; original HOME icons unchanged.')


if __name__ == '__main__': main()
