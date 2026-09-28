"""Replay Camera's final property setter without pretending to render pixels.

Original 0x25a618 runs through return against synthetic records. Downstream
material/graphics calls are recorded leaves. Requires unicorn==2.1.4 and the
hash-pinned EUR Camera executable. Input/output paths must be absolute.
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
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (
        UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC, UC_ARM_REG_LR, UC_ARM_REG_PC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_SP,
    )

    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, 0x420000)
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x100000)
    machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    target, source, chars, object_ptr = 0x1001000, 0x1002000, 0x1003000, 0x1004000
    stack, sentinel = 0x10FD000, 0x10FF000
    put = lambda address, value: machine.mem_write(address, struct.pack('<I', value))
    word = lambda address: struct.unpack('<I', machine.mem_read(address, 4))[0]
    leaves = []
    entered = []

    def hook(current, address, size, data):
        del current, size, data
        if address in (0x256CA8, 0x26250C):
            entered.append(hex(address))
        if address in (0x2567CC, 0x256660, 0x256B8C, 0x256A34):
            leaves.append({'address': hex(address),
                           'args': [machine.reg_read(register) for register in
                                    (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)],
                           'storedLengthAtDispatch': word(target + 0x18),
                           'storedBytesAtDispatch': list(machine.mem_read(target + 0x1C, 5))})
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))

    machine.hook_add(UC_HOOK_CODE, hook)
    cases = []
    for name, contents in (('empty', b''), ('four-byte-property', b'ABCD')):
        leaves.clear()
        entered.clear()
        machine.mem_write(target, bytes(0x100))
        machine.mem_write(source, bytes(0x100))
        machine.mem_write(chars, contents + b'\0')
        put(target + 4, object_ptr)
        put(target + 8, 0x1005000)
        put(source + 4, chars)
        put(source + 8, len(contents))
        machine.reg_write(UC_ARM_REG_R0, target)
        machine.reg_write(UC_ARM_REG_R1, source)
        machine.reg_write(UC_ARM_REG_R2, 1)  # skip prior-value comparison
        machine.reg_write(UC_ARM_REG_SP, stack)
        machine.reg_write(UC_ARM_REG_LR, sentinel)
        machine.emu_start(0x25A618, sentinel, count=200000)
        assert machine.reg_read(UC_ARM_REG_PC) == sentinel
        assert machine.reg_read(UC_ARM_REG_R0) == 1
        assert word(target + 0x18) == len(contents)
        assert bytes(machine.mem_read(target + 0x1C, len(contents) + 1)) == contents + b'\0'
        assert entered == (['0x256ca8', '0x26250c'] if contents else ['0x256ca8'])
        assert [leaf['address'] for leaf in leaves] == (['0x2567cc'] if contents else [])
        if contents:
            assert leaves[0]['args'][:3] == [object_ptr, target + 0x10, 0x1005000]
            assert leaves[0]['storedLengthAtDispatch'] == len(contents)
            assert leaves[0]['storedBytesAtDispatch'] == list(contents + b'\0')
        cases.append({'name': name, 'storedLength': word(target + 0x18),
                      'storedBytes': list(machine.mem_read(target + 0x1C, len(contents) + 1)),
                      'executedHelpers': list(entered),
                      'downstreamLeaves': list(leaves)})
    return {'ok': True, 'codeSha256': CODE_SHA, 'sourceEntry': '0x25a618',
            'completePropertyWriter': True, 'cases': cases,
            'recordedLeaves': ['0x2567cc material/graphics application'],
            'liveGate': {'permitted': False, 'missing': [
                'SceneBrowse replacement caller and complete new control setup before presentation',
                'Property downstream material service, photo upload and composed lower LCD pixels',
                'Native/browser paging and re-entry timing comparison']}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if not args.code.is_absolute() or not args.output.is_absolute():
        parser.error('--code and --output must be absolute')
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'ok': result['ok'], 'cases': len(result['cases']),
                      'liveGate': result['liveGate']}))


if __name__ == '__main__':
    main()
