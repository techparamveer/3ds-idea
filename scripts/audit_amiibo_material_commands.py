"""Pin amiibo's native material command evidence; never execute firmware.

This audit decodes two PICA command templates, not a complete material shader.
It intentionally does not make the unsupported FLYT resources publishable.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

BASE = 0x100000
CODE_SHA256 = '316c8a1cb37c2aab7813a5546f355ab0bdd3f635fe56b606abf91bb191a1d2d9'
RANGES = {
    'material-constructor': (0x1cfdb0, 0x1d0984),
    'material-dispatch': (0x1ca314, 0x1ca6e8),
    'two-texture-command-builder': (0x1cb42c, 0x1cb6bc),
    'coordinate-dispatch': (0x1dc71c, 0x1dcd74),
    'projection-matrix': (0x1c85c8, 0x1c89dc),
    'texture-matrix': (0x1cfcec, 0x1cfdb0),
}
TEMPLATES = {
    'first-texture': (0x1ed5bc, [0x00030003, 0x804f00c0, 0, 0, 0xffffffff, 0]),
    'color-0': (0x1ed5d4, [0x00f404f4, 0x804f00c8, 0x200, 4, 0xffffffff, 0]),
    'color-1': (0x1ed5ec, [0x00f400f4, 0x804f00c8, 0, 1, 0xffffffff, 0]),
}
SOURCES = {0: 'primary', 3: 'texture0', 4: 'texture1', 5: 'texture2',
           13: 'previous-buffer', 14: 'constant', 15: 'previous'}
OPERATIONS = {0: 'replace', 1: 'modulate', 2: 'add', 4: 'interpolate'}


def decode_template(words, alpha_mode=None):
    source, header, operand, operation, constant, scale = words
    assert header >> 31 == 1 and (header >> 20) & 0x7ff == 4
    assert (header >> 16) & 15 == 15
    # The builder patches stage one's alpha operation after copying the template.
    if alpha_mode is not None:
        assert alpha_mode in (0, 1)
        operation |= (1 if alpha_mode == 1 else 2) << 16
    return {
        'firstRegister': hex(header & 0xffff),
        'sourceWords': [hex(x) for x in words],
        'color': {'sources': [SOURCES[(source >> (4*i)) & 15] for i in range(3)],
                  'operands': [(operand >> (4*i)) & 15 for i in range(3)],
                  'operation': OPERATIONS[operation & 15]},
        'alpha': {'sources': [SOURCES[(source >> (16+4*i)) & 15] for i in range(3)],
                  'operands': [(operand >> (12+4*i)) & 7 for i in range(3)],
                  'operation': OPERATIONS[(operation >> 16) & 15]},
        'constant': hex(constant), 'scale': scale,
    }


def audit(code):
    assert hashlib.sha256(code).hexdigest() == CODE_SHA256, 'Unexpected amiibo code image'
    read = lambda address, size: code[address-BASE:address-BASE+size]
    templates = {}
    for name, (address, expected) in TEMPLATES.items():
        words = list(struct.unpack('<6I', read(address, 24)))
        assert words == expected, 'Changed command template: '+name
        templates[name] = {'address': hex(address), 'unpatched': decode_template(words)}
        if name != 'first-texture':
            templates[name]['alpha0'] = decode_template(words, 0)
            templates[name]['alpha1'] = decode_template(words, 1)
    # Source-four jump table target and calls pin the independently traced path.
    assert struct.unpack('<I', read(0x1dc7e8, 4))[0] == 0x1dcc58
    assert struct.unpack('<I', read(0x1dcc78, 4))[0] == 0xebffae52  # bl 0x1c85c8
    return {
        'codeSha256': CODE_SHA256,
        'ranges': {name: {'start': hex(a), 'endExclusive': hex(b),
                          'sha256': hashlib.sha256(read(a,b-a)).hexdigest()}
                   for name,(a,b) in RANGES.items()},
        'templates': templates,
        'projectionSource4': {'dispatch': '0x1dcc58', 'matrixRoutine': '0x1c85c8',
                              'optionRead': '0x1c8684', 'paneSizeRead': '0x1c86b4',
                              'adjustedPaneMatrixBranch': '0x1c8854'},
        'limits': [
            'Command-template interpretation only; subsequent stages and framebuffer state are not validated.',
            'Texture metadata codes 1/13 patch RGB sources; their mapping to public texture metadata is unresolved.',
            'Projection depends on matrix composition, pane transforms, texture extent and source texture matrix.',
            'No native execution, native LCD comparison, network, account or NFC operation.',
            'Header and PortalBtnSub remain unsupported and unpublished.',
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', required=True, type=Path)
    parser.add_argument('--report', required=True, type=Path)
    args = parser.parse_args()
    if not args.code.is_absolute() or not args.report.is_absolute():
        parser.error('Use absolute code/report paths')
    report = audit(args.code.read_bytes())
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'codeSha256': report['codeSha256'], 'ranges': len(RANGES),
                      'templates': len(TEMPLATES), 'report': str(args.report)}))


if __name__ == '__main__':
    main()
