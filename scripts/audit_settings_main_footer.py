"""Pin the EUR Settings main footer to its original scene, code and layout.

This reads private firmware only when explicitly given absolute paths. It never
copies raw executable or RomFS bytes into the repository or report.
"""
import argparse
import json
from pathlib import Path
import struct

from unpack_home_resources import decompress, unpack_darc
from audit_settings_data_lists import CODE_BASE, CODE_SHA256, TABLE_SHA256, digest

TOP4BTN_SHA256 = 'fea73c10a5e76b2ca9ff8463acd42f3afbdb70802630a9784d3636636e49e872'
TOPBASE_SHA256 = '21a2935b586913c21017f79967fbed9b1a825ec2a05d9f9069e2e0ce7852b399'
CAPTURE_SHA256 = 'a02c3924'  # Checked as a prefix; report retains the full digest.
FOOTER_TABLE = 0x2987bc


def panes(items):
    for pane in items:
        yield pane
        yield from panes(pane['children'])


def audit(romfs: Path, code_path: Path, published: Path, capture: Path):
    code = code_path.read_bytes()
    if digest(code) != CODE_SHA256:
        raise ValueError('Unexpected Settings executable')
    table_raw = (romfs / 'table_LZ.bin').read_bytes()
    if digest(table_raw) != TABLE_SHA256:
        raise ValueError('Unexpected Settings scene table')
    scene = unpack_darc(decompress(table_raw))['top4btn.bin']
    if digest(scene) != TOP4BTN_SHA256 or scene[0] != 6:
        raise ValueError('Unexpected top4btn scene or footer kind')
    pointer = struct.unpack_from('<I', code, FOOTER_TABLE - CODE_BASE + 6 * 4)[0]
    if pointer != 0x28f340 or code[pointer - CODE_BASE:pointer - CODE_BASE + 13] != b'TopBase_D_00\0':
        raise ValueError('Footer kind 6 does not select TopBase_D_00')

    source = unpack_darc(decompress((romfs / 'base_LZ.bin').read_bytes()))
    member = source['blyt/TopBase_D_00.bclyt']
    pack = json.loads((published / 'base.json').read_text())
    provenance = pack['resourceSources']['layouts']['TopBase_D_00']
    if digest(member) != TOPBASE_SHA256 or provenance['sha256'] != TOPBASE_SHA256:
        raise ValueError('Delivered TopBase layout differs from original EUR source')
    layout = pack['layouts']['TopBase_D_00']
    index = {pane['name']: pane for pane in panes(layout['roots'])}
    bounds = index['Bounding_00']
    if bounds['size'] != [320.0, 32.0] or bounds['translation'][:2] != [0.0, -104.0]:
        raise ValueError('Unexpected full-width footer hit rectangle')
    if index['BaseBtnLC_00']['size'] != [256.0, 38.0]:
        raise ValueError('Unexpected footer center texture geometry')
    if any(name.startswith('TopBase_D_00_') for name in pack['animations']):
        raise ValueError('TopBase acquired an animation; reassess settled pose')

    messages = json.loads((published / 'message_EU.json').read_text())['messages']['mset']
    label = messages['messages'][messages['labels']['top_btm_text']]
    if label['text'] != '\ue071 Close' or label['styleIndex'] != 576:
        raise ValueError('Unexpected original English Close message')
    capture_hash = digest(capture.read_bytes())
    if not capture_hash.startswith(CAPTURE_SHA256):
        raise ValueError('Unexpected native main capture')
    return {
        'source': {'codeSha256': CODE_SHA256, 'tableSha256': TABLE_SHA256,
                   'top4btnSha256': TOP4BTN_SHA256, 'footerKind': scene[0],
                   'footerTableAddress': hex(FOOTER_TABLE), 'footerPointer': hex(pointer),
                   'layoutMember': provenance['path'], 'layoutSha256': TOPBASE_SHA256},
        'layout': {'canvas': layout['canvas'], 'bounds': {'translation': bounds['translation'],
                   'size': bounds['size']}, 'centerTextureSize': index['BaseBtnLC_00']['size'],
                   'animation': None},
        'message': {'label': 'top_btm_text', 'text': label['text'], 'styleIndex': label['styleIndex']},
        'nativeCapture': {'path': str(capture), 'sha256': capture_hash},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('romfs', 'code', 'published', 'native-capture', 'report'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    paths = (args.romfs, args.code, args.published, args.native_capture, args.report)
    if any(not path.is_absolute() for path in paths):
        raise SystemExit('All paths must be absolute')
    report = audit(args.romfs, args.code, args.published, args.native_capture)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print('Settings main footer kind 6 -> TopBase_D_00, native capture pinned')


if __name__ == '__main__':
    main()
