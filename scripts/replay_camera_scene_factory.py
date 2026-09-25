"""Bound the EUR Camera SceneBrowse factory dispatch; no scene owner is replaced.

The original dispatcher is executed until the SceneBrowse constructor entry.
The allocator supplies synthetic memory. Requires unicorn==2.1.4.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from audit_camera_grid import CODE_SHA


def replay(code_path):
    code = code_path.read_bytes()
    if hashlib.sha256(code).hexdigest() != CODE_SHA:
        raise ValueError('Unexpected Camera executable')
    from unicorn import Uc, UC_ARCH_ARM, UC_HOOK_CODE, UC_MODE_ARM
    from unicorn.arm_const import (UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_R0,
                                   UC_ARM_REG_R1, UC_ARM_REG_SP)

    word = lambda address: struct.unpack_from('<I', code, address - 0x100000)[0]
    # App initialization installs a one-method factory interface. Method +8
    # points to the seven-way dispatcher, whose index 2 is SceneBrowse.
    assert word(0x10F60C) == 0x41FDBC
    assert word(0x41FDBC) == 0x311AF4
    assert word(0x311B0C) == 0x311B58
    assert word(0x311B70) == 0xEAFDEDB1  # tail branch to 0x28d23c

    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, 0x420000)
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x10000)
    events = []

    def hook(current, address, size, data):
        del current, size, data
        if address == 0x260440:
            requested = machine.reg_read(UC_ARM_REG_R0)
            events.append({'kind': 'allocation', 'size': requested})
            machine.reg_write(UC_ARM_REG_R0, 0x1001000)
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
        elif address == 0x311B58:
            events.append({'kind': 'sceneCase', 'entry': hex(address)})

    machine.hook_add(UC_HOOK_CODE, hook)
    machine.reg_write(UC_ARM_REG_R0, 0x1002000)
    machine.reg_write(UC_ARM_REG_R1, 2)
    machine.reg_write(UC_ARM_REG_SP, 0x100F000)
    machine.reg_write(UC_ARM_REG_LR, 0x100FF00)
    machine.emu_start(0x311AF4, 0x28D23C, count=100)
    assert machine.reg_read(UC_ARM_REG_PC) == 0x28D23C
    assert machine.reg_read(UC_ARM_REG_R0) == 0x1001000
    assert events == [{'kind': 'sceneCase', 'entry': '0x311b58'},
                      {'kind': 'allocation', 'size': 0x1400}]
    return {'sourceSha256': CODE_SHA, 'factoryInterfaceLiteral': '0x10f60c',
            'factoryMethodSlot': '0x41fdbc', 'dispatch': '0x311af4',
            'sceneCase': '0x311b58', 'constructorEntry': '0x28d23c',
            'caseIndex': 2, 'events': events,
            'scope': 'Executed original factory dispatch through allocation and tail branch. '
                     'Constructor body, replacement caller, control setup, request and pixels remain open.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if not args.code.is_absolute() or not args.output.is_absolute():
        parser.error('--code and --output must be absolute paths')
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(f'Camera factory dispatch replay passed: {args.output}')
