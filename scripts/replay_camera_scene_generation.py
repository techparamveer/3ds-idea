"""Bound Camera renderer construction, readiness reset and control retirement.

Uses original instructions from the hash-pinned private EUR executable. Synthetic
objects and an allocator stand in for native services; no GPU or LCD pixels are
produced. This deliberately does not claim a complete SceneBrowse replacement.
Requires unicorn==2.1.4. Output and private input paths must be absolute.
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
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE, UC_HOOK_MEM_WRITE
    from unicorn.arm_const import (
        UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC, UC_ARM_REG_LR, UC_ARM_REG_PC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_R6, UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2, UC_ARM_REG_SP,
    )
    source_word = lambda a: struct.unpack_from('<I', code, a - 0x100000)[0]

    def branch_target(address):
        word = source_word(address)
        assert word & 0x0E000000 == 0x0A000000
        immediate = word & 0xFFFFFF
        if immediate & 0x800000:
            immediate -= 0x1000000
        return address + 8 + immediate * 4

    # Address-adjustment/dispatch evidence is separate from executed stages.
    direct_calls = {0x28B69C: 0x2D5CAC, 0x2D5D14: 0x2DE648,
                    0x2D23B4: 0x2D6CE0, 0x2D6570: 0x2DE714,
                    0x2DE7E8: 0x2CDED4, 0x2CDEE0: 0x2D8B94,
                    0x2D8BA8: 0x2D6B00, 0x2D9430: 0x2D804C}
    for address, target in direct_calls.items():
        assert branch_target(address) == target
    assert source_word(0x41F8B8) == 0x28D7F4
    assert source_word(0x42044C) == 0x2D6420
    assert source_word(0x2D23AC) == 0xE2850F59  # add r0,r5,#0x164

    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, 0x420000)
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x400000)
    machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    base, stack, sentinel = 0x1001000, 0x13FD000, 0x13FF000
    next_allocation = 0x1100000
    allocations, releases, writes, entered = [], [], [], []
    setup_records = []
    setup_services = []
    phase = ''
    word = lambda a: struct.unpack('<I', machine.mem_read(a, 4))[0]
    put = lambda a, n: machine.mem_write(a, struct.pack('<I', n & 0xFFFFFFFF))
    put_half = lambda a, n: machine.mem_write(a, struct.pack('<H', n & 0xFFFF))
    byte = lambda a: machine.mem_read(a, 1)[0]

    def hook(current, address, size, data):
        nonlocal next_allocation
        del current, size, data
        if address in (0x2DE648, 0x2CDE50, 0x2D659C, 0x2D89E8,
                       0x2DE714, 0x2CDED4, 0x2D8B94, 0x2D6B00, 0x2D666C):
            entered.append({'phase': phase, 'address': hex(address)})
        if phase == 'synthetic-reuse-setup' and address == 0x2D7104:
            setup_records.append(word(machine.reg_read(UC_ARM_REG_R6) + 0x108))
        if address in (0x262340, 0x260440):
            size = machine.reg_read(UC_ARM_REG_R0)
            assert 0 < size < 0x100000
            pointer = next_allocation
            next_allocation += (size + 15) & ~15
            assert next_allocation < 0x1300000
            machine.mem_write(pointer, b'\xCC' * size)
            allocations.append({'phase': phase, 'pointer': hex(pointer), 'bytes': size})
            machine.reg_write(UC_ARM_REG_R0, pointer)
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
        elif address == 0x262338:
            releases.append({'phase': phase, 'pointer': hex(machine.reg_read(UC_ARM_REG_R0)),
                             'count': machine.reg_read(UC_ARM_REG_R1)})
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
        elif phase == 'synthetic-reuse-setup' and address == 0x25E6D8:
            setup_services.append({'address': hex(address),
                                   'parent': hex(machine.reg_read(UC_ARM_REG_R0)),
                                   'child': hex(machine.reg_read(UC_ARM_REG_R1))})
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))

    def memory_write(current, access, address, size, value, data):
        del current, access, data
        if base <= address < base + 0x1A8:
            writes.append({'phase': phase, 'pc': hex(machine.reg_read(UC_ARM_REG_PC)),
                           'offset': hex(address - base), 'bytes': size, 'value': hex(value)})

    machine.hook_add(UC_HOOK_CODE, hook)
    machine.hook_add(UC_HOOK_MEM_WRITE, memory_write)

    def call(address, *args, end=sentinel):
        for register, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            machine.reg_write(register, value)
        machine.reg_write(UC_ARM_REG_SP, stack)
        machine.reg_write(UC_ARM_REG_LR, sentinel)
        machine.emu_start(address, end, count=1000000)
        assert machine.reg_read(UC_ARM_REG_PC) == end, 'Instruction bound reached'

    def readiness():
        return {'resource': [hex(word(base + 0x60)), hex(word(base + 0x64))],
                'consumer': [hex(word(base + 0x80)), hex(word(base + 0x84))]}

    constructors = []
    for poison in (0xA5, 0x5A):
        phase = f'constructor-{poison:02x}'
        machine.mem_write(base, bytes([poison]) * 0x200)
        before = readiness()
        first_write = len(writes)
        call(0x2DE648, base, 0)
        assert machine.reg_read(UC_ARM_REG_R0) == base
        after = readiness()
        assert before == after
        affected = [w for w in writes[first_write:] if int(w['offset'], 16) in (0x60, 0x64, 0x80, 0x84)]
        assert not affected
        poses = word(base + 0x44 + 0x108)
        assert bytes(machine.mem_read(poses, 64 * 0x2C)) == bytes(64 * 0x2C)
        constructors.append({'poisonByte': poison, 'before': before, 'after': after,
                             'readyWrites': affected, 'zeroPoseRecords': 64})

    phase = 'setup-reset-fragment'
    before = readiness()
    machine.reg_write(UC_ARM_REG_R6, base + 0x44)
    call(0x2D73BC, end=0x2D73F4)
    after = readiness()
    assert all(value == '0x0' for values in after.values() for value in values)
    setup = {'entry': '0x2d73bc', 'stopBefore': '0x2d73f4', 'before': before, 'after': after,
             'scope': 'Original reset stores only. Earlier 64-control setup and its reachability are not replayed.'}

    # The native cell routine first snapshots the old pose, then accepts this
    # pass's ready/valid/relative values only when BOTH model owners are active.
    cells = []
    current_owner, previous_owner, records = 0x1030000, 0x1033000, 0x1040000
    control = 2
    record = records + control * 0x2C
    for owner_flags in ((1, 1), (0, 1), (1, 0)):
        for ready in (0, 1):
            phase = f'cell-prefix-{owner_flags[0]}-{owner_flags[1]}-{ready}'
            target = base + 0x44
            put(target + 0x120, current_owner)
            put(target + 0x118, previous_owner)
            put(target + 0x108, records)
            machine.mem_write(current_owner + 0x2237, bytes([owner_flags[0]]))
            machine.mem_write(previous_owner + 0x2237, bytes([owner_flags[1]]))
            machine.mem_write(record, bytes(0x2C))
            machine.mem_write(record + 0x14, struct.pack('<fff', 11.0, 22.0, 1.0))
            machine.mem_write(record + 0x20, bytes([1, 1, 1]))
            put_half(record + 0x24, 5)
            machine.mem_write(record + 0x28, b'\x01')
            original = bytes(machine.mem_read(record, 0x2C))
            put(stack, 1)  # real item
            put(stack + 4, ready)
            put(stack + 8, 69)
            for register, value in ((UC_ARM_REG_S0, 33.0), (UC_ARM_REG_S1, 44.0), (UC_ARM_REG_S2, 1.0)):
                machine.reg_write(register, struct.unpack('<I', struct.pack('<f', value))[0])
            call(0x2D804C, target, 0, control, 1, end=0x2D810C)
            actual = bytes(machine.mem_read(record, 0x2C))
            if all(owner_flags):
                assert actual[:0x14] == original[0x14:0x28]
                assert actual[0x21] == ready and actual[0x22] == 1 and actual[0x28] == 0
                assert struct.unpack_from('<H', actual, 0x24)[0] == 69
            else:
                assert actual == original
            cells.append({'ownerFlags': list(owner_flags), 'incomingReady': ready,
                          'historyAdvanced': actual != original, 'previousReady': actual[0xD],
                          'currentReady': actual[0x21], 'relativeIndex': struct.unpack_from('<H', actual, 0x24)[0]})

    # Execute complete embedded renderer destruction. Populate only the external
    # control/descriptor graph needed by the source cleanup. This is NOT an
    # actual constructed SceneBrowse or a worker-request cancellation test.
    phase = 'renderer-destruction'
    target = base + 0x44
    holder, controls, objects, parents = 0x1050000, 0x1051000, 0x1052000, 0x1062000
    active_records, staged_records, retained = 0x1070000, 0x1071000, 0x1072000
    put(holder, controls)
    put(target + 0x18, holder)
    put(target + 0x11C, 1)  # direct detachment route, not a fabricated scene pointer
    put(target + 0x14, 0)
    for offset in (0x24, 0x2C):
        put(target + offset, 1 << control)
        put(target + offset + 4, 0)
    for offset, pointer in ((0xE0, active_records), (0xF4, staged_records)):
        put(target + offset, pointer)
        put(target + offset + 4, pointer + 64 * 0x2C)
        put(target + offset + 8, pointer + 64 * 0x2C)
    put(target + 0xD4, retained)
    put(target + 0xD8, retained + 64 * 4)
    put(target + 0xDC, retained + 64 * 4)
    for index in range(64):
        obj, parent = objects + index * 0x100, parents + index * 0x100
        put(controls + index * 4, obj)
        put(obj + 0x10, parent)
        put(obj + 0x34, 0x1234)
        put_half(parent + 0x30, 0x200)
        for pointer in (active_records, staged_records):
            for slot in range(3):
                put(pointer + index * 0x2C + slot * 4, obj)
    before = readiness()
    call(0x2DE714, base)
    assert machine.reg_read(UC_ARM_REG_R0) == base
    obj, parent = objects + control * 0x100, parents + control * 0x100
    assert word(obj + 0x34) == 0
    assert struct.unpack('<H', machine.mem_read(obj + 0x30, 2))[0] & 0x80
    assert not struct.unpack('<H', machine.mem_read(parent + 0x30, 2))[0] & 0x200
    assert word(target + 0x24) == 0 and word(target + 0x2C) == 0
    assert bytes(machine.mem_read(retained, 64 * 4)) == bytes(64 * 4)
    released = {r['pointer'] for r in releases if r['phase'] == phase}
    assert {hex(active_records), hex(staged_records), hex(retained), hex(records)} <= released
    destruction = {'entry': '0x2de714', 'control': control,
                   'detachedControl': True, 'parentDirtyCleared': True,
                   'activeControlBits': [word(target + 0x24), word(target + 0x2C)],
                   'beforeReady': before, 'afterReady': readiness(),
                   'releasedPointers': sorted(released),
                   'scope': 'Complete embedded renderer destructor with synthetic descriptors and control graph; no SceneBrowse replacement caller.'}
    # Exercise the three known stages on one reused address. The caller that
    # decides to replace SceneBrowse remains outside this fixture, but this
    # catches the dangerous assumption that construction itself clears a prior
    # generation's consumer-ready bit.
    phase = 'synthetic-reuse-constructor'
    machine.mem_write(base, b'\x00' * 0x200)
    put(base + 0x60, 1 << control)
    put(base + 0x80, 1 << control)
    stale_before = readiness()
    call(0x2DE648, base, 0)
    stale_after_constructor = readiness()
    assert stale_after_constructor == stale_before
    phase = 'synthetic-reuse-setup'
    put(base + 0x44 + 0x120, current_owner)
    call(0x2D6CE0, base + 0x44, 0x1080000, end=0x2D73F4)
    cleared_after_reset = readiness()
    assert all(value == '0x0' for values in cleared_after_reset.values() for value in values)
    assert len(setup_records) == 64
    assert len(setup_services) == 1
    reuse = {'sequence': ['complete embedded destructor', 'same-address embedded constructor',
                          'control setup through 64-record loop and readiness reset'],
             'staleBeforeConstructor': stale_before,
             'staleAfterConstructor': stale_after_constructor,
             'afterReset': cleared_after_reset,
             'setupRecordIterations': len(setup_records),
             'setupServiceLeaves': setup_services,
             'scope': 'Synthetic address reuse and original setup prefix through reset; no SceneBrowse replacement caller, setup tail, worker completion or pixels.'}
    return {'ok': True, 'codeSha256': CODE_SHA, 'scriptVersion': 3,
            'directCalls': {hex(a): hex(b) for a, b in direct_calls.items()},
            'constructors': constructors, 'setupReset': setup, 'cellPrefix': cells,
            'destruction': destruction, 'syntheticReuse': reuse, 'enteredFunctions': entered,
            'allocatorLeaves': ['0x262340/0x260440 allocate', '0x262338 free'],
            'allocations': allocations, 'releases': releases, 'rendererWrites': writes,
            'liveGate': {'permitted': False,
                         'missing': ['SceneBrowse retirement/replacement caller and new setup tail',
                                     'linked request/rebind/two-pass publication under replacement owner',
                                     'remaining cell writer, property upload and lower LCD pixels',
                                     'native/browser re-entry timing comparison']}}


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
    print(json.dumps({key: result[key] for key in ('ok', 'codeSha256', 'syntheticReuse', 'liveGate')}))


if __name__ == '__main__':
    main()
