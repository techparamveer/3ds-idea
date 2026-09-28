"""Audit source Camera browse controls without publishing excluded actions."""
import argparse
import hashlib
import json
from pathlib import Path
import struct


def panes(items):
    for item in items:
        yield item
        yield from panes(item.get('children', []))


def audit(source, code):
    data = code.read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    assert sha == '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c'
    word = lambda a: struct.unpack_from('<I', data, a - 0x100000)[0]
    text = lambda a: data[a - 0x100000:].split(b'\0', 1)[0].decode('ascii')
    load = lambda name: json.loads((source / name).read_text())
    browse = load('lyt-P_Brws_D-arc-LZ.json')
    tape = load('lyt-P_Tape-arc-LZ.json')
    hud = load('lyt-C-Hud.json')
    messages = load('msg-EU_English.json')['messages']['P']
    menu = {p['name']: p for p in panes(browse['layouts']['P_BrwsMenu_D']['roots'])}
    expected = {'TxtSShow': ('Brws_02', 'Slideshow'), 'TxtShoot': ('Brws_03', 'Shoot'), 'TxtSet': ('setting', 'Settings')}
    for name, (label, value) in expected.items():
        assert menu[name]['metadata'] == [{'name': 'MSG', 'type': 0, 'value': 'P/' + label}]
        assert messages['messages'][messages['labels'][label]]['text'] == value
    assert menu['BtnMov1']['translation'][:2] == [-47, -105]
    assert menu['-B-Set']['translation'][:2] == [115, -105]
    assert menu['BB-Shoot']['size'] == [226, 30]
    assert menu['BB-Set']['size'] == [90, 30]
    assert set(p['kind'] for p in panes(tape['layouts']['P_Tape']['roots'])) == {'pic1', 'pan1'}
    assert set(hud['layouts']) == {'C_HudBut_B'}
    assert all(n.startswith('HudBat') for n in hud['layouts']['C_HudBut_B']['textures'])
    assert text(word(0x440840)) == 'Pop'
    assert text(word(0x440844)) == 'Flat'
    assert text(word(0x440848)) == 'Wide'
    assert data[0x2d265c - 0x100000:0x2d2663 - 0x100000] == b'-L-Tape'
    return {'ok': True, 'codeSha256': sha,
            'menuMessages': {k: list(v) for k, v in expected.items()},
            'footerBounds': {'Shoot': [0, 210, 226, 30], 'Settings': [230, 210, 90, 30]},
            'tapeStates': ['Pop', 'Flat', 'Wide'], 'tapeContainsButtonsOrText': False,
            'hudIsBattery': True,
            'decision': 'Audit only: no source Back/Open browse footer; native controls exceed read-only gallery scope; Tape colour binding remains untraced.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True, help='Private Camera converted pack directory')
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert all(p.is_absolute() for p in [args.source, args.code, args.output])
    result = audit(args.source, args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
