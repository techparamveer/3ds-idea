"""Execute Camera's final cell writer through retained native pane writes.

Private EUR code is hash-pinned. Only child attachment (0x25e6d8) and layout
binding (0x231500) are recorded leaves. Synthetic nodes/owners are not a GPU
renderer, a native screenshot or permission to connect live strip paging.
Requires unicorn==2.1.4; input/output paths must be absolute.
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
        UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2, UC_ARM_REG_SP,
    )
    cases = [
        {'name': 'unready', 'ready': 0},
        {'name': 'ready', 'ready': 1},
        {'name': 'left-boundary', 'ready': 1, 'x': -192.0},
        {'name': 'right-boundary', 'ready': 1, 'x': 192.0},
        {'name': 'past-left', 'ready': 1, 'x': -192.01},
        {'name': 'past-right', 'ready': 1, 'x': 192.01},
        {'name': 'attached-cell-leaves-right', 'ready': 1, 'x': 193.0, 'attached': True},
        {'name': 'padded-blank', 'ready': 0, 'real': 0},
        {'name': 'outside-buffer', 'ready': 0, 'valid': 0},
        {'name': 'current-owner-disabled', 'ready': 0, 'x': 99.0, 'owners': [0, 1], 'previous': True},
        {'name': 'previous-owner-disabled', 'ready': 0, 'x': 99.0, 'owners': [1, 0], 'previous': True},
        {'name': 'current-owner-reenabled', 'ready': 1, 'x': 99.0, 'owners': [1, 1], 'previous': True},
    ]
    reports = []
    for case in cases:
        machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        machine.mem_map(0x100000, 0x420000)
        machine.mem_write(0x100000, code)
        machine.mem_map(0x1000000, 0x400000)
        machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
        machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        target, owner, old_owner = 0x1001000, 0x1010000, 0x1020000
        records, holder, controls = 0x1030000, 0x1040000, 0x1041000
        current_node, previous_node = 0x1050000, 0x1051000
        active, staged = 0x1060000, 0x1070000
        stack, stop = 0x13FD000, 0x13FF000
        control, record = 2, records + 2 * 0x2C
        calls, entered = [], []
        word = lambda a: struct.unpack('<I', machine.mem_read(a, 4))[0]
        byte = lambda a: machine.mem_read(a, 1)[0]
        put = lambda a, value: machine.mem_write(a, struct.pack('<I', value & 0xFFFFFFFF))
        put_float = lambda a, value: machine.mem_write(a, struct.pack('<f', value))
        f32 = lambda value: struct.unpack('<f', struct.pack('<f', value))[0]
        for offset, pointer in ((0x108, records), (0x120, owner), (0x118, old_owner),
                                (0x11C, 1), (0x18, holder), (0xE0, active), (0xF4, staged)):
            put(target + offset, pointer)
        flags = case.get('owners', [1, 1])
        machine.mem_write(owner + 0x2237, bytes([flags[0]]))
        machine.mem_write(old_owner + 0x2237, bytes([flags[1]]))
        machine.mem_write(owner + 0x220C, b'\x01')
        put_float(owner + 0x221C, 1.0)  # supplied settled transition fraction
        machine.mem_write(target + 0x114, struct.pack('<H', 0xFF7F))
        put(holder, controls)
        put(controls + control * 4, current_node)
        for pointer, node in ((active, current_node), (staged, previous_node)):
            for index in range(3):
                put(pointer + control * 0x2C + index * 4, node)
            for index in range(3):
                put(node + 0xB0 + index * 4, node + 0x200 + index * 0x200)
            put(node + 0xAC, 3)
        for offset in (8, 12, 16):
            put(target + offset, 0x1120000 + offset * 0x100)
        put(target + 4, 0x1110000)
        for offset in (0x350, 0x358):
            put_float(owner + 0x2000 + offset, 62.0)
            put_float(owner + 0x2000 + offset + 4, 48.0)
        if case.get('previous'):
            machine.mem_write(record + 0x14, struct.pack('<fff', 12.0, 22.0, 1.0))
            machine.mem_write(record + 0x20, b'\x01\x01\x00')
            machine.mem_write(record + 0x24, struct.pack('<H', 5))
        if case.get('attached'):
            put(target + 0x24, 1 << control)
            put(current_node + 0x34, 0x1234)
            put(current_node + 0x10, 0x1080000)
            machine.mem_write(0x1080030, struct.pack('<H', 0x200))
        initial_record = bytes(machine.mem_read(record, 0x2C))
        put(stack, case.get('real', 1))
        put(stack + 4, case['ready'])
        put(stack + 8, 69)
        for register, value in ((UC_ARM_REG_R0, target), (UC_ARM_REG_R1, 0),
                                (UC_ARM_REG_R2, control), (UC_ARM_REG_R3, case.get('valid', 1)),
                                (UC_ARM_REG_SP, stack), (UC_ARM_REG_LR, stop)):
            machine.reg_write(register, value)
        for register, value in ((UC_ARM_REG_S0, case.get('x', 0.0)),
                                (UC_ARM_REG_S1, 33.0), (UC_ARM_REG_S2, 1.0)):
            machine.reg_write(register, struct.unpack('<I', struct.pack('<f', value))[0])

        def hook(current, address, size, data):
            del current, size, data
            if address in (0x2D804C, 0x2D7E68, 0x1FB100, 0x1FD060, 0x1FD178, 0x1FB3EC):
                entered.append(hex(address))
            if address in (0x25E6D8, 0x231500):
                calls.append({'address': hex(address), 'args': [hex(machine.reg_read(register))
                              for register in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2)]})
                machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))

        machine.hook_add(UC_HOOK_CODE, hook)
        machine.emu_start(0x2D804C, stop, count=100000)
        assert machine.reg_read(UC_ARM_REG_PC) == stop, 'Cell writer did not return'
        position = list(struct.unpack('<ff', machine.mem_read(current_node + 0x9C, 8)))
        active_bits, previous_bits = word(target + 0x24), word(target + 0x2C)
        final_record = bytes(machine.mem_read(record, 0x2C))
        expected_x = 12.0 if not all(flags) else f32(case.get('x', 0.0))
        expected_y = 22.0 if not all(flags) else 33.0
        valid = bool(case.get('valid', 1) and case.get('real', 1))
        attached = valid and abs(expected_x) <= 192.0
        assert position == [expected_x, expected_y]
        assert bool(active_bits & (1 << control)) == attached
        assert previous_bits == 0
        assert byte(current_node + 0xA5) == 1
        if case.get('attached') and not attached:
            assert word(current_node + 0x34) == 0
            assert struct.unpack('<H', machine.mem_read(current_node + 0x30, 2))[0] & 0x80
            assert not struct.unpack('<H', machine.mem_read(0x1080030, 2))[0] & 0x200
        if not all(flags):
            assert initial_record == final_record
        reports.append({'name': case['name'], 'input': case, 'completeCellWriter': True,
                        'currentControlPosition': position, 'currentControlDirty': True,
                        'currentControlAttached': attached, 'previousControlAttached': False,
                        'recordChanged': final_record != initial_record,
                        'currentReady': byte(record + 0x21), 'previousReady': byte(record + 0xD),
                        'paneSize': list(struct.unpack('<ff', machine.mem_read(current_node + 0x200 + 0x48, 8))),
                        'serviceLeaves': calls, 'enteredFunctions': entered})
    return {'ok': True, 'scriptVersion': 1, 'codeSha256': CODE_SHA, 'cases': reports,
            'sourceScope': 'Complete final cell writer plus original coordinate/visibility/pane helpers; synthetic retained nodes and settled fraction=1.',
            'recordedLeaves': {'0x25e6d8': 'child attachment', '0x231500': 'layout resource binding'},
            'liveGate': {'permitted': False, 'missing': [
                'Complete SceneBrowse retirement/new generation and control setup in one source execution',
                'New-owner worker completion and two-pass publication joined to this cell writer',
                'Actual layout resource binding, photo material upload and composed lower LCD pixels',
                'Matched native/browser folder, photo, paging and re-entry timing']}}


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
    print(json.dumps({'ok': result['ok'], 'cases': len(result['cases']), 'liveGate': result['liveGate']}))


if __name__ == '__main__':
    main()
