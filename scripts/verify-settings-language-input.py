"""Verify bounded Language input routing against private EUR Settings code.

Static reads only; no firmware is executed or copied into delivery assets.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

BASE = 0x100000
SHA256 = '1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5'
RANGES = {
    'scene-event-classification': (0x195358, 0x1953ac),
    'language-event-handler': (0x22ce1c, 0x22cfa8),
    'list-event-dispatch': (0x19f044, 0x19f170),
    'thumb-to-list': (0x1f03d8, 0x1f048c),
    'list-offset-settle': (0x1f01c8, 0x1f02ac),
    'thumb-drag': (0x1f38c0, 0x1f39c0),
    'slidebar-state-dispatch': (0x1f3b90, 0x1f3cb8),
}
WORDS = {
    0x22ce8c: 0xe3560002,  # cmp event type, 2
    0x22cebc: 0xe2441002,  # accepted slot - 2
    0x22cecc: 0xe0800001,  # plus current top
    0x22cf6c: 0xe1a01004,  # pass event code
    0x19f084: 0xe3510002,  # code 2
    0x19f088: 0x03a00001,  # list state 1
    0x19f164: 0xe3a00002,  # code 3 reaches list state 2
    0x19f168: 0xe5c40000,  # state byte publication
    0x1f042c: 0xe5840054,  # thumb-derived top
    0x1f0444: 0xe5840054,  # nearest-row adjustment
    0x1f0478: 0x03a00005,  # inactive thumb -> settle state 5
    0x1f047c: 0x05c40000,
    0x1f0270: 0xe5c41000,  # settling done -> list state 0
    0x1f027c: 0xe3530003,  # conditionally clear slidebar state 3
    0x1f0280: 0x05c2100e,
}
CALLS = {
    0x22ce74: 0x195358, 0x22cedc: 0x19f170,
    0x22cf14: 0x198be0, 0x22cf54: 0x198618, 0x22cf60: 0x197724,
    0x22cf70: 0x19f044, 0x22cf9c: 0x197530,
    0x1f03ec: 0x1f3cbc, 0x1f0404: 0x138b00,
}

def verify(code):
    if hashlib.sha256(code).hexdigest() != SHA256:
        raise ValueError('Unexpected EUR Settings code image')
    word = lambda a: struct.unpack_from('<I', code, a - BASE)[0]
    for address, expected in WORDS.items():
        assert word(address) == expected, hex(address)
    for address, target in CALLS.items():
        value = word(address)
        assert value & 0xff000000 == 0xeb000000, hex(address)
        delta = value & 0xffffff
        if delta & 0x800000:
            delta -= 0x1000000
        assert address + 8 + delta * 4 == target, hex(address)
    assert word(0x28c1f0) == 0x22ce1c, 'Language event vtable'
    assert struct.unpack_from('<f', code, 0x1f0488 - BASE)[0] == 0.5
    assert struct.unpack_from('<f', code, 0x1f02a8 - BASE)[0] == 8.0
    return {'passed': True, 'codeSha256': SHA256, 'checks': len(WORDS) + len(CALLS) + 3,
            'ranges': {name: {'start': hex(start), 'endExclusive': hex(end),
                             'sha256': hashlib.sha256(code[start-BASE:end-BASE]).hexdigest()}
                       for name, (start, end) in RANGES.items()},
            'limits': ['No input producer/focus/repeat equivalence proven.',
                       'No browser or native execution performed.']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if not args.code.is_absolute() or not args.report.is_absolute():
        parser.error('Use absolute paths')
    report = verify(args.code.read_bytes())
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(f"PASS: {report['checks']} original code checks, {len(RANGES)} hashed ranges")
