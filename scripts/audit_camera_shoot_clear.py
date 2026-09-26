#!/usr/bin/env python3
"""Replay the pinned Camera shoot clear-pair writer and submission adapter.

Synthetic object only. This does not execute the full constructor, render graph,
GPU clear consumer, modal attenuation, or Welcome controller. Requires Unicorn.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from audit_camera_grid import CODE_SHA


def audit(path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_R0, UC_ARM_REG_R1,
        UC_ARM_REG_R2, UC_ARM_REG_R5, UC_ARM_REG_R6,
        UC_ARM_REG_LR)
    code = path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    cpu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    cpu.mem_map(0x100000, (len(code) + 4095) & ~4095)
    cpu.mem_write(0x100000, code)
    obj = 0x1000000
    cpu.mem_map(obj, 4096)
    word = lambda p: struct.unpack('<I', cpu.mem_read(p, 4))[0]
    # R5 contributes pre-existing upper bits; prove all are overwritten.
    for noise in [0, 0xffffffff, 0x12345678]:
        cpu.mem_write(obj, bytes(0x188))
        cpu.reg_write(UC_ARM_REG_R5, noise)
        cpu.reg_write(UC_ARM_REG_R6, obj)
        cpu.emu_start(0x2a5e60, 0x2a5eac, count=100)
        assert word(obj + 0x40) == 0x4100
        assert list(cpu.mem_read(obj + 0x44, 4)) == [233, 224, 208, 255]
        assert cpu.mem_read(obj + 0x3d, 1) == b'\x01'
    calls = []

    def boundary(machine, address, _size, _data):
        if address == 0x10d9cc:
            calls.append({
                'rgba': list(machine.mem_read(machine.reg_read(UC_ARM_REG_R0), 4)),
                'r1': machine.reg_read(UC_ARM_REG_R1),
                'r2': machine.reg_read(UC_ARM_REG_R2),
            })
            machine.emu_stop()

    cpu.hook_add(UC_HOOK_CODE, boundary)
    cpu.reg_write(UC_ARM_REG_R0, 0)
    cpu.reg_write(UC_ARM_REG_R1, obj + 0x40)
    cpu.reg_write(UC_ARM_REG_LR, obj + 0xff0)
    cpu.emu_start(0x25fff8, obj + 0xff0, count=100)
    assert calls == [{'rgba': [233, 224, 208, 255], 'r1': 0, 'r2': 1}]
    return {'codeSha256': CODE_SHA, 'writer': '0x2a5e60–0x2a5eac',
            'flags': '0x4100', 'rgba': [233, 224, 208, 255],
            'submission': {'adapter': '0x25fff8', 'boundary': '0x10d9cc', 'calls': calls},
            'scope': 'Exact source pair writer and adapter only; no settled Welcome, GPU or modal-mask replay.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(audit(args.code), indent=2))
