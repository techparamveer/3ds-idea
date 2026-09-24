#!/usr/bin/env python3
"""Static audit of the Sound (EUR 10.7.0-32E) lower playback panels and visualiser models.

Checks instruction facts in the original executable with Capstone; nothing is emulated
or rasterised. Pass the private `code.bin`, `romfs/res/S.pack` and the converted
`lyt-S_Play_D-arc-LZ.json`; the report is written outside the repository.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM

CODE_SHA256 = '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9'
PACK_SHA256 = '05550cfa807aa19cd27347e1b309a60aed7f20cf208be13ea2bab1bc942f161d'
LAYOUT_SOURCE_SHA256 = '56f103796b2c1fc9a1f17fbc2d7f506bfae2d73f20044b9c658727017be2ef20'
BASE = 0x100000

p = argparse.ArgumentParser()
p.add_argument('--code', type=Path, required=True)
p.add_argument('--pack', type=Path, required=True)
p.add_argument('--layouts', type=Path, required=True)
p.add_argument('--report', type=Path, required=True)
opt = p.parse_args()
code, pack = opt.code.read_bytes(), opt.pack.read_bytes()
assert hashlib.sha256(code).hexdigest() == CODE_SHA256, 'unexpected Sound code.bin'
assert hashlib.sha256(pack).hexdigest() == PACK_SHA256, 'unexpected Sound S.pack'
md = Cs(CS_ARCH_ARM, CS_MODE_ARM)


def word(a): return struct.unpack_from('<I', code, a - BASE)[0]


def cstring(a):
    o = a - BASE
    return code[o:code.index(b'\0', o)].decode('ascii')


def ins(a):
    x = next(md.disasm(code[a - BASE:a - BASE + 4], a))
    text = f'{x.mnemonic} {x.op_str}'
    if x.mnemonic in ('add', 'sub') and ', pc, #' in x.op_str:
        imm = int(x.op_str.split('#')[1], 0)
        return text, cstring(a + 8 + (imm if x.mnemonic == 'add' else -imm))
    if x.mnemonic == 'ldr' and '[pc, #' in x.op_str:
        literal = word(a + 8 + int(x.op_str.split('#')[1].rstrip(']'), 0))
        try: return text, cstring(literal)
        except (UnicodeDecodeError, ValueError): return text, hex(literal)
    return text, None


facts = []


def fact(group, a, instruction, resolved=None):
    text, value = ins(a)
    assert text == instruction, f'{a:#x}: {text!r} != {instruction!r}'
    assert resolved is None or value == resolved, f'{a:#x}: {value!r} != {resolved!r}'
    facts.append({'group': group, 'address': f'{a:#x}', 'instruction': text, **({'resolves': value} if resolved else {})})


# Scene constructor 0x23c50c: seven S_Play_D sublayouts; bits 0x1e are the four per-object
# disable flags the engine tests (0xc2/0xc4/0xc8/0xd0). Only CtrPanel1 is enabled here.
for adr, name, store, flags, op in [
    (0x23c52c, 'S_Play_D-CtrPanel1', 0x23c550, 0x23c570, 'bic r1, r1, #0x1e'),
    (0x23c57c, 'S_Play_D-CtrPanel2', 0x23c598, 0x23c5bc, 'orr r1, r1, #0x1e'),
    (0x23c5c8, 'S_Play_D-CtrPanel3', 0x23c5e4, 0x23c604, 'orr r1, r1, #0x1e'),
    (0x23c610, 'S_Play_D-Effect', 0x23c62c, 0x23c64c, 'orr r1, r1, #0x1e'),
    (0x23c754, 'S_Play_D-Filter', 0x23c770, 0x23c790, 'orr r1, r1, #0x1e'),
]:
    fact('constructor', adr, ins(adr)[0], name)
    field = {0x23c550: 0x254, 0x23c598: 0x258, 0x23c5e4: 0x25c, 0x23c62c: 0x260, 0x23c770: 0x264}[store]
    fact('constructor', store, f'str r0, [r4, #{field:#x}]')
    fact('constructor', flags, op)
fact('constructor', 0x23c644, 'add sl, pc, #0x2d4', 'S_Play_D-PullBtn')
fact('constructor', 0x23c728, 'str r0, [r4, #0x268]')
fact('constructor', 0x23c748, 'orr r1, r1, #0x1e')
fact('constructor', 0x23c788, 'add sl, pc, #0x1c8', 'Graph_D-Plate')
fact('constructor', 0x23c86c, 'str r0, [r4, #0x26c]')
fact('constructor', 0x23c884, 'orr r1, r1, #0x1e')
fact('visibility', 0x1e5ca4, 'bic r1, r1, #0x1e')
for a, mask in [(0x176184, '#0xc2'), (0x1770c4, '#0xc4'), (0x17cb10, '#0xc8'), (0x17eae8, '#0xd0')]:
    fact('visibility', a, f'tst r1, {mask}' if a != 0x17eae8 else f'tst r2, {mask}')

# Effect buttons: registered with the playback controller beside the transport, and in the
# scene's sorted button map with handlers that open mode 4 (Graph_D-Plate) or 5 (Filter).
for a, name in [(0x230118, '-B-Big3L_P0'), (0x23012c, '-O-C-Big3C_P0'), (0x23013c, '-B-Big3R_P0'), (0x23014c, '-O-C-MiniP0'), (0x23015c, '-B-EjyP0'), (0x23016c, '-B-EjyP1')]:
    fact('controller', a, ins(a)[0], name)
fact('buttons', 0x23cacc, 'ldr r1, [pc, #0x354]', '-B-EjyP0')
handlers = struct.unpack_from('<6Q', code, 0x2faa80 - BASE)
assert [h & 0xffffffff for h in handlers[:2]] == [0x23ce54, 0x23cea0]
for a, mode in [(0x23ce68, 4), (0x23ceb4, 5)]:
    fact('buttons', a, f'mov r0, #{mode}')
    fact('buttons', a + 4, 'strb r0, [r4, #0x28a]')

# Closing a mode (0x23ceec) calls the 0x23d180 switch; its cases 4 and 5 restore the resting
# panel: Effect In, PullBtn PullIn and the plate or filter Out.
fact('rest', 0x23ceec, 'ldrb r1, [r0, #0x28a]')
fact('rest', 0x23cf00, 'bl #0x23d180')
assert struct.unpack_from('<6I', code, 0x23d1b0 - BASE) == (0x23d1fc, 0x23d1c8, 0x23d208, 0x23d248, 0x23d318, 0x23d400)
for base, closed, out_call in [(0x23d318, 0x26c, 'bl #0x2b1c34'), (0x23d400, 0x264, 'bl #0x1ebfec')]:
    fact('rest', base + 0x24, ins(base + 0x24)[0], 'In')
    fact('rest', base + 0x38, 'ldr r1, [r4, #0x260]')
    fact('rest', base + 0x48, 'bl #0x1ebda0')
    fact('rest', base + 0x5c, ins(base + 0x5c)[0], 'PullIn')
    fact('rest', base + 0x6c, 'ldr r1, [r4, #0x268]')
    fact('rest', base + 0x8c, ins(base + 0x8c)[0], 'Out')
    fact('rest', base + 0xa4, f'ldr r1, [r4, #{closed:#x}]')
    fact('rest', base + 0xb0, out_call)
# Leaving playback (case 3) plays Out on Effect, CtrPanel3 and PullOut on the cord together.
fact('exit', 0x23d288, 'ldr r1, [r4, #0x260]')
fact('exit', 0x23d2bc, 'ldr r1, [r4, #0x25c]')
fact('exit', 0x23d2dc, 'add r1, pc, #0x214', 'PullOut')

layouts = json.loads(opt.layouts.read_text())
assert layouts['sourceSha256'] == LAYOUT_SOURCE_SHA256
effect = layouts['layouts']['S_Play_D-Effect']
root = effect['roots'][0]
buttons = {c['name']: c['translation'][:2] for c in root['children']}
assert buttons == {'-B-EjyP0': [-54.0, 27.0], '-B-EjyP1': [54.0, 27.0]}
pull = layouts['layouts']['S_Play_D-PullBtn']
pull_tev = {m['name']: len(m['tevStages']) for m in pull['materials']}

entries = []
for i in range(0, len(pack), 0x40):
    name = pack[i:i + 0x38].split(b'\0')[0]
    if not name: break
    offset, size = struct.unpack_from('<II', pack, i + 0x38)
    payload = pack[offset:offset + size]
    entries.append({'name': name.decode(), 'offset': offset, 'size': size, 'lz11': payload[0] == 0x11,
                    'lz11DeclaredSize': int.from_bytes(payload[1:4], 'little'), 'sha256': hashlib.sha256(payload).hexdigest()})
assert [e['name'] for e in entries][1:] and all(e['lz11'] for e in entries)
referenced = [e['name'] for e in entries if ('res/S--' + e['name'].removesuffix('.LZ')).encode() in code]

report = {
    'schema': 1, 'title': '0004001000022500', 'firmware': '10.7.0-32E',
    'sources': {'codeSha256': CODE_SHA256, 'packSha256': PACK_SHA256, 'playLayoutSourceSha256': LAYOUT_SOURCE_SHA256},
    'facts': facts,
    'conclusion': {
        'restingLowerPanel': 'S_Play_D-Effect (-B-EjyP0 IconGraph at 106,93; -B-EjyP1 IconFilter at 214,93) with PullBtn in PullIn; Graph_D-Plate and Filter are Out while mode 0x28a is 0.',
        'effectButtonsOpen': {'-B-EjyP0': 'mode 4 Graph_D-Plate', '-B-EjyP1': 'mode 5 S_Play_D-Filter'},
        'pullButtonMaterials': pull_tev,
    },
    'visualiserModels': entries, 'visualiserModelsReferencedByExecutable': referenced,
    'gaps': [
        'The first-entry call that brings CtrPanel3/Effect in was not traced; rest state is proven from the mode-close path and shared controller registration.',
        'PullBtn uses a custom class (0x31fce0) and a two-stage TEV material; its pulled behaviour was not traced.',
        'S.pack visualisers are LZ11 CGFX models for the upper screen; no stock-screen CGFX path exists and their animation drivers were not traced.',
        'Graph_D-Plate and Filter alter playback speed, pitch or filtering; no audio behaviour is reconstructed.',
    ],
}
opt.report.parent.mkdir(parents=True, exist_ok=True)
opt.report.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'facts': len(facts), 'visualiserModels': len(entries), 'referenced': len(referenced)}))
