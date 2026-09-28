#!/usr/bin/env python3
"""Hash-pinned source replay of Camera guide modal initialization, fade and draw.

Uses a synthetic dialog and a 20-frame probe duration (not a claim about native
opening timing). Runs real constructor/interpolator; records GPU/body call
boundaries, without executing graphics services or the Welcome controller.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from audit_camera_grid import CODE_SHA


def audit(path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R4,
        UC_ARM_REG_R8, UC_ARM_REG_S0, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    cpu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    cpu.mem_map(0x100000, 0x420000)
    cpu.mem_write(0x100000, code)
    parent, stack, end = 0x1000000, 0x100f000, 0x100fff0
    obj = parent + 0x188
    cpu.mem_map(parent, 0x10000)
    cpu.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    cpu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    put = lambda p, v: cpu.mem_write(p, struct.pack('<I', v))
    word = lambda p: struct.unpack('<I', cpu.mem_read(p, 4))[0]
    bits = lambda f: struct.unpack('<I', struct.pack('<f', f))[0]

    def run(address, registers=None, stop=end):
        cpu.reg_write(UC_ARM_REG_SP, stack)
        cpu.reg_write(UC_ARM_REG_LR, end)
        for register, value in (registers or {}).items():
            cpu.reg_write(register, value)
        cpu.emu_start(address, stop, count=10000)
        assert cpu.reg_read(UC_ARM_REG_PC) == stop

    run(0x31a540, stop=0x31a56c)
    assert list(cpu.mem_read(0x44015a, 4)) == [0, 0, 0, 128]
    # Exact guide child copy from the initialized shared color.
    run(0x2736e4, {UC_ARM_REG_R8: 0x44015a, UC_ARM_REG_R1: parent}, 0x2736ec)
    assert word(parent + 0x181) == 0x80000000
    run(0x22026c, {UC_ARM_REG_R0: obj})
    # Same subtype installed by dialog constructor 0x21c374–0x21c378.
    put(obj, 0x41e638)
    put(parent + 0x800, 0)
    put(parent + 0x804, word(parent + 0x181))
    run(0x256584, {UC_ARM_REG_R0: obj, UC_ARM_REG_R1: parent + 0x800,
                    UC_ARM_REG_R2: parent + 0x804, UC_ARM_REG_S0: bits(20)})
    assert word(obj + 0x9a) == 0 and word(obj + 0x9e) == 0x80000000
    alphas = []
    for _ in range(22):
        put(obj + 0x38, bits(1))
        run(0x26de78, {UC_ARM_REG_R0: obj})
        alphas.append(word(obj + 0xa4) >> 24)
    assert alphas[-3:] == [128, 128, 128]
    cpu.mem_write(parent + 0x33, b'\x08')
    run(0x301050, {UC_ARM_REG_R4: parent}, 0x301068)
    cpu.mem_write(parent + 0x808, b'\x08')
    calls = []

    def boundary(machine, address, _size, _data):
        if address == 0x10d9cc:
            calls.append({'kind': 'modal', 'rgba': list(machine.mem_read(machine.reg_read(UC_ARM_REG_R0), 4)),
                          'r1': machine.reg_read(UC_ARM_REG_R1), 'r2': machine.reg_read(UC_ARM_REG_R2)})
        elif address == 0x26d67c:
            calls.append({'kind': 'dialog-layout'})
        else:
            return
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))

    cpu.hook_add(UC_HOOK_CODE, boundary)
    run(0x300e70, {UC_ARM_REG_R0: parent, UC_ARM_REG_R1: parent + 0x808})
    assert calls == [{'kind': 'modal', 'rgba': [0, 0, 0, 128], 'r1': 1, 'r2': 0}, {'kind': 'dialog-layout'}]
    return {'codeSha256': CODE_SHA, 'sharedColor': [0, 0, 0, 128],
            'probeDuration': 20, 'alphaByProbeFrame': alphas, 'calls': calls,
            'scope': 'Real modal constructor/interpolator/draw with synthetic parent and GPU/layout boundaries; not full Welcome state or timing.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(audit(args.code), indent=2))
