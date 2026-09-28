#!/usr/bin/env python3
"""Execute original Camera style-width and signed cursor-advance consumers.

Requires private unicorn==2.1.4; no firmware files are published or modified.
Font selection/metrics are supplied endpoints. Layout creation, glyph GPU draw,
full message resolution, input and complete scene scheduling are not executed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

CODE_SHA = '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c'


def replay(code_path, pack_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    pack = json.loads(pack_path.read_text())
    bank = pack['messages']['P']
    message = bank['messages'][bank['labels']['Finder_Pho_00_00']]
    assert message['styleIndex'] == 110
    style = pack['styles'][bank['styleTable']]['styles'][110]
    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, 0x500000)
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x100000)
    machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    word = lambda p, v: machine.mem_write(p, struct.pack('<I', v))
    putf = lambda p, v: machine.mem_write(p, struct.pack('<f', v))
    real = lambda p: struct.unpack('<f', machine.mem_read(p, 4))[0]
    pane, record, owner, font, vtable, context, writer, tag, rect = range(0x1000000, 0x1009000, 0x1000)
    word(owner + 0x3c, pane)
    word(pane + 0xe0, font)
    word(font, vtable)
    word(vtable + 8, 0x100f000)
    word(vtable + 12, 0x100f004)
    for offset, value in style['unresolvedWords'].items(): word(record + int(offset), value)
    for offset, value in [(0x18, style['fontScale'][1]), (0x1c, style['fontScale'][0]),
                          (0x20, style['lineSpacing']), (0x24, style['characterSpacing'])]: putf(record + offset, value)
    leaves = []

    def external(m, address, size, user):
        if address not in (0x1cde1c, 0x100f000, 0x100f004): return
        if address == 0x1cde1c:
            leaves.append({'kind': 'fontSelection', 'fontResource': m.reg_read(UC_ARM_REG_R1)})
        else:
            leaves.append({'kind': 'fontWidth' if address == 0x100f000 else 'fontHeight', 'value': 23})
            m.reg_write(UC_ARM_REG_R0, 23)
        m.reg_write(UC_ARM_REG_PC, m.reg_read(UC_ARM_REG_LR))
    machine.hook_add(UC_HOOK_CODE, external)

    def call(address, *args):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args): machine.reg_write(reg, value)
        machine.reg_write(UC_ARM_REG_SP, 0x10fd000)
        machine.reg_write(UC_ARM_REG_LR, 0x10ff000)
        machine.emu_start(address, 0x10ff000, count=100000)
        assert machine.reg_read(UC_ARM_REG_PC) == 0x10ff000

    widths = []
    for width in (style['unresolvedWords']['0'], 172, 200):
        putf(pane + 0x48, 172)
        word(record, width)
        call(0x21d95c, owner, record)
        result = {'styleWidth': width, 'paneWidth': real(pane + 0x48),
                  'fontSize': [real(pane + 0xe4), real(pane + 0xe8)]}
        assert result['paneWidth'] == width and result['fontSize'] == [23, 23]
        widths.append(result)
    word(context, writer)
    advances = []
    for amount in (2, -2, 0, 32767, -32768):
        machine.mem_write(tag, struct.pack('<4H', 2, 0, 2, amount & 0xffff))
        putf(writer + 0x2c, 22)
        call(0x2717c8, 0x100a000, tag, context)
        drawn = real(writer + 0x2c)
        putf(writer + 0x2c, 22)
        call(0x271a8c, 0x100a000, rect, tag, context)
        measured = real(writer + 0x2c)
        assert drawn == measured == 22 + amount
        if amount: assert [real(rect), real(rect + 8)] == sorted([22, 22 + amount])
        advances.append({'argument': amount, 'beforeX': 22, 'drawX': drawn, 'measureX': measured})
    return {'sourceSha256': CODE_SHA, 'styleWidthCases': widths, 'cursorAdvanceCases': advances,
            'sourceMessage': message, 'suppliedLeaves': leaves,
            'entrypoints': {'styleOwner': '0x21d95c', 'styleInstall': '0x21f7ec',
                           'drawTag': '0x2717c8', 'measureTag': '0x271a8c'},
            'scope': 'Original style install and group2/type0 draw/measure arithmetic only. '
                     'Font selection/metrics are supplied leaves; scene scheduling and GPU are unexecuted.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'pack', 'output'): parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    assert all(path.is_absolute() for path in vars(args).values())
    result = replay(args.code, args.pack)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({key: result[key] for key in ('styleWidthCases', 'cursorAdvanceCases')}, indent=2))
