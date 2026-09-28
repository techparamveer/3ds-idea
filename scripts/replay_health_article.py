"""Replay Health article parsing/buffer construction with converted source tokens.

Private Unicorn2.1.4; allocation, message lookup, layout lookup and text assignment
are fixtures. Warning measurement is logged, not replaced with guessed glyph widths.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from replay_health_scroll import CODE_SHA


def encoded(tokens):
    result = bytearray()
    for token in tokens:
        if 'text' in token:
            result.extend(token['text'].encode('utf-16le'))
        else:
            result.extend(struct.pack('<HHH', token['control'], token['group'], token['type']))
            if token['control'] == 14:
                args = bytes.fromhex(token['arguments'])
                result.extend(struct.pack('<H', len(args)))
                result.extend(args)
    return bytes(result)


def replay(code_path, pack_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_S0, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    pack_bytes = pack_path.read_bytes()
    bank = json.loads(pack_bytes)['messages']['safe_msbt_LZ']
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x200000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x200000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    real = lambda p: struct.unpack('<f', m.mem_read(p, 4))[0]
    putf = lambda p, v: m.mem_write(p, struct.pack('<f', v))
    scene, pane, vtable, message = 0x1000000, 0x1001000, 0x1002000, 0x1004000
    stack, stop = 0x11fd000, 0x11ff000
    heap = 0x1020000
    raw, icons, assignments, line_calls = b'', [], [], []
    switch_mode = False
    text_parent = 0x1010000
    pane_table = word(0x157d44)
    source_names = [word(pane_table + i * 4) for i in range(5)]
    panes = [0x1011000 + i * 0x1000 for i in range(5)]

    def external(machine, address, size, data):
        nonlocal heap
        a, b, c, d = [machine.reg_read(r) for r in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        result = None
        if address == 0x153868 and switch_mode: pass  # isolate existing offset
        elif address == 0x133154: result = message
        elif address == 0x12e658: result = len(raw) // 2
        elif address == 0x127eb4: result = 0
        elif address == 0x13864c:
            result = heap
            heap += (a + 15) & ~15
        elif address == 0x133ed8: m.mem_write(a, bytes(m.mem_read(b, c)))
        elif address == 0x1338e0: m.mem_write(a, bytes(b))
        elif address == 0x1290c8:
            if switch_mode:
                result = panes[source_names.index(b)] if b in source_names else text_parent
            else: result = pane
        elif address == 0x1385d4: pass
        elif address == 0x13317c:
            assignments.append({'nameAddress': c, 'textPointer': d})
        elif address == 0x156db0:
            # Full icon writer needs the actual native font measurement state.
            # Capture the exact prefix and cumulative y supplied by the parser.
            units = []
            while True:
                unit = struct.unpack('<H', m.mem_read(c + len(units) * 2, 2))[0]
                if unit == 0: break
                units.append(unit)
            icons.append({'index': b, 'heightBeforeMarker': struct.unpack('<f', struct.pack('<I', machine.reg_read(UC_ARM_REG_S0)))[0],
                          'prefixUnits': units})
        elif address == 0x1570f4:
            line_calls.append({'hasControl': b, 'endUnit': c, 'length': d,
                               'active': list(m.mem_read(scene + 0x14c, 5))})
            return  # execute the original complete buffer writer
        else: return
        if result is not None: machine.reg_write(UC_ARM_REG_R0, result)
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
    m.hook_add(UC_HOOK_CODE, external)

    def call(address, *args):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args): m.reg_write(reg, value)
        m.reg_write(UC_ARM_REG_SP, stack)
        m.reg_write(UC_ARM_REG_LR, stop)
        m.emu_start(address, stop, count=3000000)
        assert m.reg_read(UC_ARM_REG_PC) == stop

    def reference(tokens):
        # Independent token walk, float32 at every source arithmetic operation.
        f = lambda v: struct.unpack('<f', struct.pack('<f', v))[0]
        height, line_height, icon_heights = 18.0, 18.0, []
        for token in [{'text': '\n'}, *tokens, {'text': '\n\n'}]:
            if 'text' in token:
                for ch in token['text']:
                    if ch == '\n': height = f(f(height + line_height) + 3)
                    elif ch == '△': icon_heights.append(height)
            elif token['control'] == 15: line_height = 18.0
            elif len(bytes.fromhex(token['arguments'])) == 2:
                scale = int.from_bytes(bytes.fromhex(token['arguments']), 'little')
                line_height = f(f(scale * f(.01)) * 18)
        return height, int(f(height / 21)) + 1, icon_heights

    articles = []
    for label in ('article_1', 'article_2', 'article_3'):
        tokens = bank['messages'][bank['labels'][label]]['tokens']
        raw = encoded(tokens)
        m.mem_write(scene, bytes(0x400))
        m.mem_write(pane, bytes(0x200))
        m.mem_write(message, raw + b'\0\0')
        put(scene, vtable)
        put(vtable + 0x40, 0x156db0)
        put(vtable + 0x4c, 0x1570f4)
        # Source SafeText_D_00 template:18px height,3px line spacing.
        # Message/style installation into the pane is outside this replay.
        putf(pane + 0xe8, 18)
        putf(pane + 0xec, 3)
        putf(scene + 0x158, 21)
        heap = 0x1020000
        icons, assignments, line_calls = [], [], []
        call(0x157724, scene, 0)
        height, rows, icon_heights = reference(tokens)
        assert word(scene + 0xcc) == rows, (label, word(scene + 0xcc), rows)
        assert [x['heightBeforeMarker'] for x in icons] == icon_heights
        assert word(scene + 0x154) == len(icon_heights)
        assert len(assignments) == (5 if rows > 200 else 1)
        for number, line in enumerate(line_calls, 1):
            assert line['active'] == [int(((number + 50 - slot * 200) & 0xffffffff) <= 300) for slot in range(5)]
        # Independently rebuild all five buffers from source line callbacks:
        # formatting lines always copied; inactive plain lines retain newline.
        main = bytes(m.mem_read(word(scene + 0x120), len(raw) + 8))
        buffers = []
        for slot in range(5):
            expected = bytearray()
            for line in line_calls:
                start = line['endUnit'] - line['length'] + 1
                expected.extend(main[start * 2:(line['endUnit'] + 1) * 2]
                                if line['hasControl'] or line['active'][slot] else b'\n\0')
            length = word(scene + 0x138 + slot * 4)
            actual = bytes(m.mem_read(word(scene + 0x124 + slot * 4), length * 2))
            assert actual == expected
            buffers.append({'slot': slot, 'units': length, 'sha256': hashlib.sha256(actual).hexdigest(),
                            'copiedPlainLineNumbers': [i + 1 for i, line in enumerate(line_calls) if line['active'][slot] and not line['hasControl']]})
        articles.append({'article': label, 'rows': rows, 'height': height, 'lineCount': len(line_calls),
                         'iconInputs': icons, 'bufferCountAssigned': len(assignments), 'buffers': buffers})
    # Execute the complete running update with the controller update held still.
    # This isolates pane switching from already separately replayed arithmetic.
    switch_mode = True
    put(scene + 0xcc, 901)
    put(scene + 0x15c, 0)
    putf(scene + 0x158, 21)
    for i, target in enumerate(panes): m.mem_write(target + 0xb7, bytes([0x80 | int(i == 0)]))
    switches = []
    for position, expected in [(0, 0), (4199, 0), (4200, 1), (8399, 1),
                               (8400, 2), (12600, 3), (16800, 4), (4199, 0)]:
        putf(text_parent + 0x2c, position)
        call(0x157c88, scene)
        visible = [i for i, target in enumerate(panes) if m.mem_read(target + 0xb7, 1)[0] & 1]
        assert visible == [expected] and word(scene + 0x15c) == expected
        assert all(m.mem_read(target + 0xb7, 1)[0] & 0x80 for target in panes)
        switches.append({'position': position, 'visibleBuffer': expected})
    return {'codeSha256': CODE_SHA, 'packSha256': hashlib.sha256(pack_bytes).hexdigest(),
            'paneMetricFixture': {'fontHeight': 18, 'lineSpacing': 3, 'linePitch': 21}, 'articles': articles, 'bufferSwitches': switches,
            'scope': 'Parser and buffer writer original ARM; message tokens from converted source; icon measurement intercepted. Not full font geometry, scheduler, rendering or UI equivalence.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--code', type=Path, required=True)
    p.add_argument('--pack', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    args = p.parse_args()
    assert all(path.is_absolute() for path in (args.code, args.pack, args.output))
    report = replay(args.code, args.pack)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print('Health article parser and buffer replay passed')
