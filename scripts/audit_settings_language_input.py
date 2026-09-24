"""Trace Language page D-pad, hold/repeat and drag as Settings source data.

Reads the original EUR 10.7.0-32E Settings code image without executing it.
It pins the Language event handler, list dispatcher codes, update-state jump
table, slide-bar touch states and HID bit tests that the read-only adapter
may implement. Untraced paths stay unnamed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct

from audit_settings_data_lists import CODE_BASE, CODE_SHA256, digest
from audit_settings_language import vldr_literal

LANGUAGE_VT = 0x28c1e8
RANGES = {
    'language-event': (0x22ce1c, 0x22cfa8),
    'language-setup': (0x22c748, 0x22c7d0),
    'eu-constructor': (0x22c7d0, 0x22cb78),
    'list-dispatch': (0x19f044, 0x19f170),
    'list-set-item': (0x19f170, 0x19f204),
    'list-update': (0x198358, 0x198564),
    'slidebar-frame': (0x1f3b90, 0x1f3cec),
    'slidebar-ratio': (0x1f3cbc, 0x1f3ce4),
    'base-event': (0x195358, 0x195500),
    'list-drag-a': (0x1f01c8, 0x1f02ac),
    'list-drag-b': (0x1f02ac, 0x1f03d8),
    'list-drag-c': (0x1f03d8, 0x1f05f4),
    'list-drag-d': (0x1f05f4, 0x1f0700),
    'slidebar-drag-a': (0x1f38c0, 0x1f39c0),
    'slidebar-drag-b': (0x1f39c0, 0x1f3b7c),
    'thumb-from-touch': (0x19fe7c, 0x19ff20),
}


def word_at(code: bytes, address: int) -> int:
    return struct.unpack_from('<I', code, address - CODE_BASE)[0]


def bl_target(word: int, address: int) -> int | None:
    if word >> 28 == 0xf or word & 0x0f000000 != 0x0b000000:
        return None
    offset = word & 0xffffff
    return address + 8 + ((offset - 0x1000000 if offset & 0x800000 else offset) << 2)


def b_target(word: int, address: int) -> int | None:
    if word >> 28 == 0xf or word & 0x0f000000 != 0x0a000000:
        return None
    offset = word & 0xffffff
    return address + 8 + ((offset - 0x1000000 if offset & 0x800000 else offset) << 2)


def mov_imm(word: int) -> tuple[int, int] | None:
    if word >> 28 == 0xf or word & 0x0fe00000 != 0x03a00000:
        return None
    rd = (word >> 12) & 0xf
    rotate, imm8 = (word >> 8) & 0xf, word & 0xff
    imm = ((imm8 >> 2 * rotate) | (imm8 << (32 - 2 * rotate))) & 0xffffffff if rotate else imm8
    return rd, imm


def cmp_imm(word: int) -> tuple[int, int] | None:
    if word >> 28 == 0xf or word & 0x0fe00000 != 0x03500000:
        return None
    rn = (word >> 16) & 0xf
    rotate, imm8 = (word >> 8) & 0xf, word & 0xff
    imm = ((imm8 >> 2 * rotate) | (imm8 << (32 - 2 * rotate))) & 0xffffffff if rotate else imm8
    return rn, imm


def and_imm(word: int) -> tuple[int, int] | None:
    if word >> 28 == 0xf or word & 0x0fe00000 != 0x02000000:
        return None
    rotate, imm8 = (word >> 8) & 0xf, word & 0xff
    imm = ((imm8 >> 2 * rotate) | (imm8 << (32 - 2 * rotate))) & 0xffffffff if rotate else imm8
    return (word >> 12) & 0xf, imm


def ldr_imm(word: int) -> tuple[int, int, int] | None:
    if word >> 28 == 0xf or word & 0x0c500000 != 0x04100000:
        return None
    rd, rn, imm = (word >> 12) & 0xf, (word >> 16) & 0xf, word & 0xfff
    if not (word & 0x00800000):
        imm = -imm
    return rd, rn, imm


def strb_imm(word: int) -> tuple[int, int, int] | None:
    if word >> 28 == 0xf or word & 0x0c500000 != 0x04400000:
        return None
    rd, rn, imm = (word >> 12) & 0xf, (word >> 16) & 0xf, word & 0xfff
    if not (word & 0x00800000):
        imm = -imm
    return rd, rn, imm


def c_string(code: bytes, address: int) -> str | None:
    start = address - CODE_BASE
    if start < 0 or start >= len(code):
        return None
    end = code.find(b'\0', start, start + 96)
    if end <= start:
        return None
    raw = code[start:end]
    if all(32 <= b < 127 or b in (9, 10) for b in raw) and len(raw) >= 2:
        return raw.decode('ascii')
    return None


def xrefs_to(code: bytes, target: int) -> list[int]:
    hits = []
    for off in range(0, len(code) - 3, 4):
        address = CODE_BASE + off
        dest = bl_target(word_at(code, address), address)
        if dest == target:
            hits.append(address)
    return hits


def range_facts(code: bytes, start: int, end: int) -> dict:
    words, calls, branches, immediates, compares = {}, [], [], [], []
    address = start
    while address < end:
        word = word_at(code, address)
        words[hex(address)] = f'{word:08x}'
        dest = bl_target(word, address)
        if dest is not None:
            calls.append({'at': hex(address), 'target': hex(dest), 'string': c_string(code, dest)})
        dest = b_target(word, address)
        if dest is not None:
            branches.append({'at': hex(address), 'cond': word >> 28, 'target': hex(dest)})
        imm = mov_imm(word)
        if imm:
            immediates.append({'at': hex(address), 'rd': imm[0], 'value': imm[1], 'hex': hex(imm[1])})
        cmpv = cmp_imm(word)
        if cmpv:
            compares.append({'at': hex(address), 'rn': cmpv[0], 'value': cmpv[1], 'hex': hex(cmpv[1])})
        address += 4
    return {'start': hex(start), 'endExclusive': hex(end),
            'sha256': digest(code[start - CODE_BASE:end - CODE_BASE]),
            'calls': calls, 'branches': branches, 'immediates': immediates, 'compares': compares,
            'words': words}


def vtable(code: bytes, address: int, count: int = 24) -> list[dict]:
    rows = []
    for i in range(count):
        target = word_at(code, address + 4 * i)
        rows.append({'slot': i, 'offset': hex(4 * i), 'target': hex(target),
                     'string': c_string(code, target)})
    return rows


def hid_sites(code: bytes) -> list[dict]:
    """AND/CMP against 3DS digital direction bits inside list/language ranges."""
    masks = {0x10: 'right', 0x20: 'left', 0x40: 'up', 0x80: 'down'}
    sites = []
    for name, (start, end) in RANGES.items():
        address = start
        while address < end:
            word = word_at(code, address)
            if word >> 28 != 0xf and word & 0x0fe00000 == 0x02000000:
                rotate, imm8 = (word >> 8) & 0xf, word & 0xff
                imm = ((imm8 >> 2 * rotate) | (imm8 << (32 - 2 * rotate))) & 0xffffffff if rotate else imm8
                if imm in masks:
                    sites.append({'range': name, 'at': hex(address), 'mask': hex(imm),
                                  'direction': masks[imm], 'word': f'{word:08x}'})
            address += 4
    return sites


def literal_pool(code: bytes, address: int) -> dict | None:
    target = vldr_literal(word_at(code, address), address)
    if target is None:
        return None
    return {'instruction': hex(address), 'literal': hex(target),
            'value': struct.unpack_from('<f', code, target - CODE_BASE)[0]}


def inspect(code: bytes) -> dict:
    if digest(code) != CODE_SHA256:
        raise ValueError('Unexpected Settings code image')
    ranges = {name: range_facts(code, start, end) for name, (start, end) in RANGES.items()}
    # Jump table after `cmp r0, #6; ldrlo pc, [pc, r0, lsl #2]` at 0x198388/0x19838c.
    table = [hex(word_at(code, 0x198394 + 4 * i)) for i in range(6)]
    slide_table = [hex(word_at(code, 0x1f3bc4 + 4 * i)) for i in range(5)]
    dispatch_xrefs = [hex(a) for a in xrefs_to(code, 0x19f044)]
    setitem_xrefs = [hex(a) for a in xrefs_to(code, 0x19f170)]
    setpos_xrefs = [hex(a) for a in xrefs_to(code, 0x1a07b8)]
    language_calls_dispatch = [hex(a) for a in xrefs_to(code, 0x19f044) if 0x22ce1c <= a < 0x22cfa8]
    language_calls_setitem = [hex(a) for a in xrefs_to(code, 0x19f170) if 0x22ce1c <= a < 0x22cfa8]
    # Exact words the later tests pin. These are the Language event-handler facts.
    words = {
        0x22ce74: ('ebfda137', 'bl 0x195358  base event first'),
        0x22ce78: ('e3500002', 'cmp r0, #2'),
        0x22ce7c: ('0a000008', 'beq selection-or-decide path'),
        0x22ce8c: ('e3560002', 'cmp r6, #2  event kind 2'),
        0x22ce90: ('0a000035', 'beq list dispatch'),
        0x22ce94: ('e3560000', 'cmp r6, #0'),
        0x22ce98: ('03540001', 'cmpeq r4, #1'),
        0x22cebc: ('e2441002', 'sub r1, r4, #2  slot to row'),
        0x22cec8: ('e5900054', 'ldr r0, [r0, #0x54]  list top'),
        0x22cedc: ('ebfdc8a3', 'bl 0x19f170  setItem'),
        0x22cf6c: ('e1a01004', 'mov r1, r4'),
        0x22cf70: ('ebfdc833', 'bl 0x19f044  list dispatch(r1=event code)'),
        0x19f074: ('e3510000', 'cmp r1, #0  arrow 0 / up'),
        0x19f07c: ('e3510001', 'cmp r1, #1  arrow 1 / down'),
        0x19f084: ('e3510002', 'cmp r1, #2'),
        0x19f090: ('e3510003', 'cmp r1, #3'),
        0x19f0c4: ('e3a00003', 'mov r0, #3  state after arrow 0'),
        0x19f0f0: ('e3a00004', 'mov r0, #4  state after arrow 1'),
        0x19f088: ('03a00001', 'moveq r0, #1  state after code 2'),
        0x19f164: ('e3a00002', 'mov r0, #2  state after code 3'),
        0x198388: ('e3500006', 'cmp r0, #6  list update states'),
        0x1f3bb8: ('e3500005', 'cmp r0, #5  slide-bar frame states'),
    }
    pinned = {hex(address): {'expected': expected, 'actual': f'{word_at(code, address):08x}',
                             'ok': f'{word_at(code, address):08x}' == expected, 'meaning': meaning}
              for address, (expected, meaning) in words.items()}
    literals = {
        'slidebar-ratio-half': literal_pool(code, 0x1f3cc4),
        'slidebar-ratio-one': literal_pool(code, 0x1f3cc8),
    }
    strings = {}
    for address in (0x19f8d0, 0x19f8e0, 0x19f914, 0x19f924, 0x19f530, 0x19f538, 0x19f544):
        strings[hex(address)] = c_string(code, address)
    return {
        'codeSha256': CODE_SHA256,
        'languageVtable': vtable(code, LANGUAGE_VT, 20),
        'ranges': ranges,
        'listUpdateJumpTable': table,
        'slidebarFrameJumpTable': slide_table,
        'xrefs': {
            'listDispatch': dispatch_xrefs,
            'setItem': setitem_xrefs,
            'setPos': setpos_xrefs,
            'languageEventDispatch': language_calls_dispatch,
            'languageEventSetItem': language_calls_setitem,
        },
        'pinnedWords': pinned,
        'hidAndSites': hid_sites(code),
        'literals': literals,
        'constructorStrings': strings,
        'unproven': [
            'Pressed-arrow Select/Invalid clip bind and release timing',
            'D-pad row Select clip (T_SB_Select) dispatch and entry cursor',
            'Hold delay/interval distinct from clip-gated redispatch',
            'List-body drag vs thumb-only drag ownership',
            'Language confirmation / CFG write from setItem',
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', required=True, type=Path)
    parser.add_argument('--report', required=True, type=Path)
    args = parser.parse_args()
    if not args.code.is_absolute() or not args.report.is_absolute():
        raise SystemExit('Expected absolute --code and --report paths')
    report = inspect(args.code.read_bytes())
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    failed = [k for k, v in report['pinnedWords'].items() if not v['ok']]
    print(f"Language input audit: {len(failed)} word mismatches; "
          f"{len(report['xrefs']['listDispatch'])} dispatch xrefs; "
          f"{len(report['hidAndSites'])} HID AND sites in scoped ranges")


if __name__ == '__main__':
    main()
