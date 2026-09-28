"""Verify Sound's two source record instances without executing firmware."""
import argparse
import hashlib
import json
import struct
from pathlib import Path

CODE_SHA256 = '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9'
BASE = 0x100000


def audit(code):
    assert hashlib.sha256(code).hexdigest() == CODE_SHA256, 'Wrong Sound executable'
    word = lambda address: struct.unpack_from('<I', code, address - BASE)[0]
    string = lambda address: code[address-BASE:].split(b'\0', 1)[0].decode('ascii')
    assert word(0x1c3c48) == 0x2fcca0
    assert string(0x2fcca0) == 'S_BG-Record'
    assert string(0x2fcc98) == 'S_BG'
    assert string(word(0x1c3c4c)) == 'U_Default'
    assert string(word(0x1c3c54)) == 'Default'
    # Argument setup, retained instance slots and source clipping/animation calls.
    expected = {
        0x1c3b4c: 0xe59f20f4,  # ldr r2, record literal
        0x1c3b50: 0xe3a00006,  # upper registration channel
        0x1c3b5c: 0xe2421008,  # archive = record string - 8
        0x1c3b6c: 0xe58400bc,  # upper instance
        0x1c3b70: 0xe59f00d4,  # U_Default literal
        0x1c3bc8: 0xe59f2078,  # same record layout
        0x1c3bdc: 0xe3a00008,  # lower registration channel
        0x1c3be4: 0xe2421008,
        0x1c3bf0: 0xe58400c0,  # lower instance
        0x1c3bf8: 0xe59f0054,  # Default literal
    }
    for address, instruction in expected.items():
        assert word(address) == instruction, f'Changed instruction {address:#x}'
    calls = {0x1c3b64: 0x1e5b90, 0x1c3bec: 0x1e5b90,
             0x1c3b9c: 0x20b894, 0x1c3c1c: 0x20b894,
             0x1c3bc0: 0x208c80, 0x1c3c3c: 0x208c80}
    for address, target in calls.items():
        instruction = word(address)
        assert instruction >> 24 == 0xeb
        displacement = instruction & 0xffffff
        if displacement & 0x800000: displacement -= 0x1000000
        assert address + 8 + displacement * 4 == target
    return {'schema': 1, 'titleId': '0004001000022500', 'codeSha256': CODE_SHA256,
            'constructor': '0x1c3b40', 'archive': 'S_BG', 'layout': 'S_BG-Record',
            'instances': [{'slot': 'app+0xbc', 'channel': 6, 'clip': 'U_Default'},
                          {'slot': 'app+0xc0', 'channel': 8, 'clip': 'Default'}],
            'checkedInstructions': len(expected) + len(calls),
            'scope': 'construction and initial clip binding; not owner visibility or runtime timing'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    result = audit(args.code.read_bytes())
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
