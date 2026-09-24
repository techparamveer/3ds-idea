#!/usr/bin/env python3
"""Hash-pinned static Sound guide-owner audit. No emulation or firmware writes.

Pass private code.bin, romfs/res/Guide.gbin and full converted English messages.
The report records proven descriptor/control facts, not native timing or pixels.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM

BASE = 0x100000
HASHES = {
    'code': '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9',
    'guide': 'c84d03b655156c81196341a613a855ce7544820a530cabe1099a697dc9e2f021',
    'messages': '183ed6a820f36d2bcb4fb11dcec604746951822dde2bebe2b2db82ac1dd3b863',
}


def audit(code, guide, messages):
    for name, data in [('code', code), ('guide', guide), ('messages', messages)]:
        if hashlib.sha256(data).hexdigest() != HASHES[name]:
            raise ValueError(f'unexpected Sound {name} SHA-256')
    md = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    facts = []

    def fact(group, address, expected):
        instruction = next(md.disasm(code[address - BASE:address - BASE + 4], address))
        actual = f'{instruction.mnemonic} {instruction.op_str}'
        assert actual == expected, f'{address:#x}: {actual!r} != {expected!r}'
        facts.append({'group': group, 'address': hex(address), 'instruction': actual})

    # GBIN's record traversal and page lookup establish the variable record shape.
    for address, instruction in [
        (0x2c1e00, 'add r0, pc, #0xd4'), (0x2c1e1c, 'bl #0x2c90f4'),
        (0x206020, 'add r0, r0, #8'), (0x20602c, 'mov ip, #0x30'),
        (0x206030, 'ldr r3, [r0, #4]'), (0x20603c, 'add r3, r3, r3, lsl #2'),
        (0x206040, 'add r3, ip, r3, lsl #2'), (0x206044, 'add r0, r0, r3'),
        (0x28f398, 'ldrne r2, [r0, #4]'), (0x28f3a0, 'addhi r1, r1, r1, lsl #2'),
        (0x28f3a4, 'addhi r0, r0, #0x30'), (0x28f3a8, 'addhi r0, r0, r1, lsl #2'),
        (0x182318, 'ldr r0, [r4, #0x10]'), (0x18231c, 'str r0, [r5, #0x64]'),
    ]:
        fact('descriptor', address, instruction)
    assert code[0x2c1edc - BASE:0x2c1edc - BASE + 15] == b'res/Guide.gbin\0'
    assert guide[:4] == b'GBIN'
    records, offset = [], 8
    for _ in range(struct.unpack_from('<I', guide, 4)[0]):
        assert guide[offset:offset + 4] == b'GUID'
        count = struct.unpack_from('<I', guide, offset + 4)[0]
        title = guide[offset + 0x20:offset + 0x30].split(b'\0')[0].decode('ascii')
        pages = []
        for index in range(count):
            start = offset + 0x30 + index * 0x14
            label = guide[start:start + 0x10].split(b'\0')[0].decode('ascii')
            mode = struct.unpack_from('<I', guide, start + 0x10)[0]
            pages.append({'label': label, 'mode': mode})
        records.append({'offset': hex(offset), 'title': title, 'pages': pages})
        offset += 0x30 + count * 0x14
    assert offset == len(guide)
    assert len(records) == 91
    welcome = records[0]
    assert welcome == {'offset': '0x8', 'title': 'T_001', 'pages': [
        {'label': 'D_001_0', 'mode': 2}, {'label': 'D_001_1', 'mode': 3},
        {'label': 'D_001_2', 'mode': 4},
    ]}

    bank = json.loads(messages)['messages']['S_tips']

    def message(label):
        return bank['messages'][bank['labels'][label]]

    def string(address):
        start = address - BASE
        return code[start:code.index(b'\0', start)].decode('ascii')

    modes = []
    for index in range(5):
        layout, left, right, label0, label1 = struct.unpack_from('<5I', code, 0x2f6d38 - BASE + index * 20)
        labels = [string(pointer) for pointer in [label0, label1] if pointer]
        modes.append({'mode': index, 'layoutIndex': layout, 'actionIds': [left, right],
                      'labels': labels, 'text': [message(label)['text'] for label in labels]})
    assert [modes[index]['text'] for index in [2, 3, 4]] == [['Next'], ['Back', 'Next'], ['Back', 'OK']]
    for address, instruction in [
        (0x181864, 'push {r4, r5, r6, lr}'), (0x18187c, 'str r5, [r4, #8]'),
        (0x181880, 'bl #0x182264'), (0x18189c, 'str r0, [r4, #0x39c]'),
        (0x1818b0, 'bl #0x181294'), (0x1818b4, 'ldr r1, [r4, #0x394]'),
        (0x1818bc, 'bl #0x1813d4'), (0x1812e0, 'ldr r0, [r4, #8]'),
        (0x1812e4, 'add r2, r0, #1'), (0x1812ec, 'str r2, [r4, #0x480]'),
        (0x1813fc, 'str r1, [r0, #0x47c]'), (0x181414, 'str sb, [r5, #0x50]'),
        (0x28f3b4, 'cmp r1, #2'), (0x28f3b8, 'addlo r0, r0, r1, lsl #2'),
        (0x28f3bc, 'movhs r0, #0'), (0x28f3c0, 'ldrlo r0, [r0, #4]'),
        (0x181944, 'cmp r0, #4'), (0x18194c, 'beq #0x1819f0'),
        (0x181a00, 'ldr r0, [r4, #8]'), (0x181a04, 'ldr r1, [r4, #0x394]'),
        (0x181a08, 'add r0, r0, #1'), (0x181a10, 'bgt #0x181a98'),
        (0x181a38, 'ldr r0, [r4, #8]'), (0x181a40, 'subgt r0, r0, #1'),
        (0x181a44, 'bgt #0x181a98'), (0x181a54, 'strbne r7, [r4, #4]'),
        (0x181a68, 'ldr r0, [r4, #8]'), (0x181a70, 'add r0, r0, #1'),
        (0x181a78, 'bgt #0x181a98'), (0x181a80, 'bl #0x2051c8'),
        (0x181a90, 'strb r8, [r4, #4]'), (0x181a98, 'str r0, [r4, #8]'),
        (0x181aa0, 'bl #0x180ea8'), (0x2051d0, 'ldrb r0, [r0, #0x475]'),
        (0x2051d4, 'cmp r0, #2'), (0x2051e8, 'bl #0x1814b8'),
        (0x1825e8, 'bl #0x181864'), (0x18278c, 'bl #0x181928'),
        (0x1827dc, 'blne #0x180398'), (0x1827f8, 'blne #0x180378'),
        (0x180510, 'bl #0x17fb18'), (0x17fb50, 'str r1, [r0, r3, lsl #2]'),
    ]:
        fact('page-control', address, instruction)
    assert struct.unpack_from('<I', code, 0x31f8b8 - BASE)[0] == 0x28f3b4
    assert message('Guide_D_00_00')['tokens'][-1] == {'arguments': '0000', 'control': 14, 'group': 3, 'type': 39}
    assert message('Guide_D_00_01')['tokens'][0] == {'arguments': '0100', 'control': 14, 'group': 3, 'type': 39}

    for address, instruction in [
        (0x18244c, 'mov r2, #1'), (0x182450, 'mov r1, #4'),
        (0x182458, 'bl #0x17e8a8'), (0x182478, 'add r4, r5, #0x44'),
        (0x1812b4, 'add r1, r0, #0x40'), (0x1812bc, 'bl #0x180c0c'),
        (0x180c38, 'add r0, pc, #0x24c'), (0x180c58, 'bl #0x17c9c8'),
        (0x180c94, 'bl #0x180a14'), (0x180adc, 'mov r0, #0xac'),
        (0x180b24, 'bl #0x20bb38'), (0x180b50, 'str r5, [r4, #0x3ac]'),
        (0x180bbc, 'bl #0x20bd3c'), (0x180bf0, 'bl #0x20b730'),
        (0x239028, 'bl #0x181b8c'),
    ]:
        fact('guide-owner', address, instruction)
    assert string(0x180e8c) == 'GuideU'
    token = message('D_001_2')['tokens'][0]
    assert (token['control'], token['group'], token['type']) == (14, 4, 1)
    encoded = bytes.fromhex(token['arguments'])
    assert int.from_bytes(encoded[:2], 'little') == len(encoded[2:])
    assert encoded[2:].decode('utf-16le') == 'S_Guid03_U'
    return {'schema': 1, 'title': '0004001000022500', 'hashes': HASHES,
            'facts': facts, 'guideRecordCount': len(records), 'welcome': welcome,
            'buttonModes': modes, 'illustration': 'S_Guid03_U',
            'gate': 'Static descriptor/controller facts only. Launch selection, persisted seen state, upper title/body owner and native rendered transitions remain unresolved.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['code', 'guide', 'messages', 'report']:
        parser.add_argument('--' + name, type=Path, required=True)
    options = parser.parse_args()
    report = audit(options.code.read_bytes(), options.guide.read_bytes(), options.messages.read_bytes())
    options.report.parent.mkdir(parents=True, exist_ok=True)
    options.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'facts': len(report['facts']), 'guideRecords': report['guideRecordCount'], 'welcome': report['welcome']}))


if __name__ == '__main__':
    main()
