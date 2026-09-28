"""Pin the static source evidence for the bounded Language thumb-drag adapter.

Reads executable bytes as data. Does not execute firmware or establish native
frame/input timing. Pass absolute --code, --published and --report paths.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

CODE_SHA256 = '1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5'
WORDS = {
    0x1F394C: 0xEE012A43,  # vmls.f32 lower clamp: midpoint - travel * .5
    0x1F3950: 0xEE300A63,  # vsub.f32 pointer y - captured grab offset
    0x1F39A0: 0xED840A06,  # vstr applied slider y to +0x18
    0x1F03FC: 0xEE201A01,  # vmul.f32 ratio * list pixel range
    0x1F0400: 0xEE810A20,  # vdiv.f32 by row pitch
    0x1F0404: 0xEBFD21BD,  # bl 0x138b00 (integer/fraction split)
    0x1F0430: 0xEEB40AC1,  # compare residual with half row
    0x1F043C: 0xEE300A60,  # residual -= pitch
    0x1F0440: 0xE2800001,  # top += 1
    0x1F0478: 0x03A00005,  # inactive slider -> list mode 5
    0x1F01EC: 0xEE700A81,  # negative residual += step
    0x1F0204: 0xEE700AC1,  # positive residual -= step
    0x1F02A8: 0x41000000,  # float 8
    0x22CF70: 0xEBFDC833,  # scene type-2 event -> list dispatcher 0x19f044
}
RANGES = {
    'callback_registration': (0x197650, 0x1976c8),
    'widget_callback': (0x206f0c, 0x20708c),
    'callback_trampoline': (0x1d28c4, 0x1d28e4),
    'numeric_split': (0x138b00, 0x138b9c),
    'slider_dispatch': (0x1F3B90, 0x1F3CBC),
    'thumb_drag': (0x1F38C0, 0x1F39C0),
    'groove_motion_not_ported': (0x1F39C0, 0x1F3B4C),
    'thumb_ratio': (0x1F3CBC, 0x1F3CEC),
    'list_drag': (0x1F03D8, 0x1F048C),
    'list_snap': (0x1F01C8, 0x1F02AC),
    'language_dispatch': (0x22CE1C, 0x22CFA8),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'published', 'report'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    assert all(path.is_absolute() for path in (args.code, args.published, args.report))
    code = args.code.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA256
    for address, expected in WORDS.items():
        assert struct.unpack_from('<I', code, address - 0x100000)[0] == expected, hex(address)
    def branch_target(address):
        word = struct.unpack_from('<I', code, address-0x100000)[0]
        assert word & 0xff000000 == 0xeb000000
        delta = word & 0xffffff
        return address + 8 + (delta - 0x1000000 if delta & 0x800000 else delta) * 4
    assert branch_target(0x1976a8) == 0x1f375c
    assert struct.unpack_from('<I', code, 0x1976c8-0x100000)[0] == 0x206f0c
    assert struct.unpack_from('<I', code, 0x22c9b0-0x100000)[0] == 0xe5840018
    assert struct.unpack_from('<I', code, 0x206fc8-0x100000)[0] == 0xe3a01002
    assert struct.unpack_from('<6I', code, 0x198394 - 0x100000) == (
        0x1984A4, 0x1983AC, 0x1983C0, 0x1983D4, 0x198434, 0x19849C)
    pack = json.loads((args.published / 'button.json').read_text())
    def flatten(panes):
        return [item for pane in panes for item in (pane, *flatten(pane['children']))]
    panes = {pane['name']: pane for pane in flatten(pack['layouts']['R_SlideBar']['roots'])}
    assert panes['B_Groove_00']['size'] == [24, 144]
    assert panes['B_Slide_00']['size'] == [24, 24]  # resized to 104 by traced constructor
    assert panes['B_Up_00']['translation'][:2] == [0, 84]
    assert panes['B_Dw_00']['translation'][:2] == [0, -84]
    report = {'passed': True, 'codeSha256': CODE_SHA256,
              'words': {hex(a): hex(v) for a, v in WORDS.items()},
              'ranges': {name: {'start': hex(start), 'end': hex(end),
                                'sha256': hashlib.sha256(code[start-0x100000:end-0x100000]).hexdigest()}
                         for name, (start, end) in RANGES.items()},
              'limits': ['Static source evidence; native/browser drag comparison unavailable.',
                         'D-pad focus, arrow press/repeat and groove paging are not implemented.',
                         'Browser pointer samples and nominal 60Hz snap clock are adaptations.']}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print('Language input source audit passed.')


if __name__ == '__main__':
    main()
