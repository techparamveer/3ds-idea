#!/usr/bin/env python3
"""Bounded original-ARM replay of Settings HOME type-1 worker handoffs.

The injected returns stand for OS/resource operations; their effects are reported
as fixture inputs. Supply the private HOME code.bin through an absolute path.
No firmware bytes are emitted.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path

from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_SP

BASE = 0x100000
MANAGER = 0x32ebf4
CODE_SHA = '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'


def read32(uc, address):
    return struct.unpack('<I', uc.mem_read(address, 4))[0]


def write32(uc, address, value):
    uc.mem_write(address, struct.pack('<I', value))


def run(code, *, entry, stop, stubs, setup=None):
    uc = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    uc.mem_map(BASE, 0x300000)
    uc.mem_write(BASE, code)
    uc.mem_map(0x500000, 0x20000)
    uc.mem_map(0x600000, 0x1000)
    uc.mem_map(0x700000, 0x1000)
    uc.reg_write(UC_ARM_REG_SP, 0x600800)
    uc.reg_write(UC_ARM_REG_LR, 0x700000)
    uc.reg_write(UC_ARM_REG_R0, 0x500000)
    events = []
    if setup:
        setup(uc)

    def hook(uc, address, size, _):
        if address in stop:
            events.append(['stop', hex(address)])
            uc.emu_stop()
        elif address in stubs:
            result = stubs[address](uc) if callable(stubs[address]) else stubs[address]
            events.append(['stub', hex(address), result])
            uc.reg_write(UC_ARM_REG_R0, result & 0xffffffff)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))

    uc.hook_add(UC_HOOK_CODE, hook)
    uc.emu_start(entry, 0x700004, count=1000)
    assert events and events[-1][0] == 'stop', events
    return uc, events


def stage4(code, *, completed=True, resource_ok=True, launch_ok=True, retarget=False,
           alternate_global=0):
    def setup(uc):
        uc.mem_write(0x34c008, bytes([resource_ok]))
        uc.mem_write(MANAGER + 3, b'\x01')  # ordinary type 1
        uc.mem_write(MANAGER + 6, b'\x01')
        uc.mem_write(MANAGER + 4, b'\x01' if retarget else b'\x00')
        write32(uc, MANAGER + 0x50, 0x500100)
        write32(uc, MANAGER + 0xcc, 0x500200)
        write32(uc, MANAGER + 0xc0, 4)
        write32(uc, read32(uc, 0x249e78), alternate_global)

    stubs = {0x1f9174: 0 if completed else 1, 0x1f914c: 0,
             0x220aa4: 0, 0x24def0: 0, 0x244ec8: 0,
             0x2357ac: 0 if launch_ok else 0x80000001,
             0x23573c: 0}
    stubs.update({0x2291d4: 0, 0x1f9e8c: 0})
    uc, events = run(code, entry=0x249bf4, stop={0x249d48, 0x249e4c}, stubs=stubs, setup=setup)
    return {'state': read32(uc, MANAGER + 0xc0), 'stop': events[-1][1],
            'prepared': any(e[1] == '0x24def0' for e in events if e[0] == 'stub'),
            'presentationWorkerLaunched': any(e[1] == '0x2357ac' for e in events if e[0] == 'stub'),
            'requestedType': uc.mem_read(MANAGER + 6, 1)[0]}


def stage5(code, *, completed=True, pending=True, retarget=False, current_type=1, eligible=True):
    calls = []

    def visibility(uc):
        calls.append([hex(uc.reg_read(UC_ARM_REG_R0)), uc.reg_read(UC_ARM_REG_R1)])
        return 0

    def setup(uc):
        key = struct.pack('<IIB', 0x22000, 0x40010, 0)
        uc.mem_write(0x34c240, key)
        uc.mem_write(0x34c250, struct.pack('<I', 0x22001) + key[4:] if retarget else key)
        uc.mem_write(MANAGER + 3, b'\x01')
        uc.mem_write(MANAGER + 6, bytes([current_type]))
        uc.mem_write(MANAGER + 4, bytes([pending]))
        write32(uc, MANAGER + 0x50, 0x500100)
        write32(uc, MANAGER + 0x54, 0x500200)
        write32(uc, MANAGER + 0x58, 0x500100 if eligible else 0x500300)
        write32(uc, MANAGER + 0xc0, 5)

    stubs = {0x1f9174: 0 if completed else 1, 0x1f914c: 0,
             0x220aa4: 0, 0x1f9e64: visibility}
    uc, events = run(code, entry=0x24a5f0, stop={0x24a6b4, 0x24a758}, stubs=stubs, setup=setup)
    return {'state': read32(uc, MANAGER + 0xc0), 'stop': events[-1][1], 'visibilityRequests': calls}


def acknowledge_show(code, *, retarget=False, changed_type=False, primary=True):
    """Execute the common post-state-5 acknowledgement, with scene service stubbed."""
    calls = []

    def visibility(uc):
        calls.append([hex(uc.reg_read(UC_ARM_REG_R0)), uc.reg_read(UC_ARM_REG_R1)])
        return 0

    def setup(uc):
        key = struct.pack('<IIB', 0x22000, 0x40010, 0)
        uc.mem_write(0x34c240, key)
        uc.mem_write(0x34c250, struct.pack('<I', 0x22001) + key[4:] if retarget else key)
        uc.mem_write(MANAGER + 3, b'\x01')
        uc.mem_write(MANAGER + 6, bytes([7 if changed_type else 1]))
        uc.mem_write(MANAGER + 4, b'\x01')
        write32(uc, MANAGER + 0x50, 0x500100 if primary else 0)
        write32(uc, MANAGER + 0x54, 0x500200)

    uc, events = run(code, entry=0x1f91c0, stop={0x700000},
                     stubs={0x1feb04: 0, 0x1f9e64: visibility}, setup=setup)
    return {'requestPending': uc.mem_read(MANAGER + 4, 1)[0],
            'visibilityRequests': calls, 'stop': events[-1][1]}


def title_open_failure(code, *, archive_open=True):
    def setup(uc):
        # Stack-frame prologue expects a process-header pointer; archive open is
        # the first externally supplied result and is forced to fail below.
        write32(uc, 0x31f31c, 0x510030)
        write32(uc, 0x510000, 0)
        write32(uc, 0x31f328, 0)
        uc.mem_write(0x500000, b'\x01')
        uc.mem_write(0x500008, struct.pack('<IIB', 0x22000, 0x40010, 0))

    stubs = {0x161e14: 0 if archive_open else 0x80000001,
             0x22bd38: 0x80000001}
    uc, events = run(code, entry=0x24c930, stop={0x24c988}, stubs=stubs, setup=setup)
    return {'completionByte': uc.mem_read(0x500000, 1)[0], 'stop': events[-1][1],
            'archiveOpenCalled': any(e[1] == '0x161e14' for e in events if e[0] == 'stub'),
            'archiveReadCalled': any(e[1] == '0x22bd38' for e in events if e[0] == 'stub')}


def title_resource_path(code, *, common_size=0x100, selected_size=0x100):
    """Bounded success-path control flow; external archive/decode results are supplied."""
    decoded = []
    allocations = iter((0x500400, 0x500500))
    objects = iter((0x500600, 0x500700))

    def setup(uc):
        write32(uc, 0x31f31c, 0x510030)
        write32(uc, 0x510000, 0)
        write32(uc, 0x31f328, 0)
        uc.mem_write(0x500008, struct.pack('<IIB', 0x22000, 0x40010, 0))
        write32(uc, MANAGER + 0xd8, 0x508000)
        write32(uc, MANAGER + 0xcc, 0x50a000)
        write32(uc, MANAGER + 0xd0, 0x50c000)
        write32(uc, 0x508000, 0x444d4243)  # CBMD marker only; data operations are stubs.
        write32(uc, 0x508008, 0x20)
        write32(uc, 0x50800c, 0x40)

    def read_length(uc):
        stack = uc.reg_read(UC_ARM_REG_SP)
        write32(uc, stack + 0x20, 0x100)
        return 0

    def read_container(uc):
        write32(uc, uc.reg_read(UC_ARM_REG_R1), 0x100)
        return 0

    def decode(uc):
        decoded.append([hex(uc.reg_read(UC_ARM_REG_R0)), hex(uc.reg_read(UC_ARM_REG_R1))])
        return 0

    lengths = iter((common_size, selected_size))
    stubs = {0x161e14: 0, 0x22bd38: read_length, 0x22650c: 0,
             0x23546c: lambda uc: next(allocations), 0x2360f4: 0,
             0x1fa0fc: lambda uc: next(objects), 0x22bca8: read_container,
             0x244ff8: 1, 0x2201cc: lambda uc: next(lengths),
             0x220070: decode, 0x22bc68: 0}
    uc, events = run(code, entry=0x24c930, stop={0x700000}, stubs=stubs, setup=setup)
    return {'completionByte': uc.mem_read(0x500000, 1)[0],
            'commonCandidate': hex(read32(uc, MANAGER + 0x50)),
            'selectedCandidate': hex(read32(uc, MANAGER + 0x54)),
            'decodeCalls': decoded, 'stop': events[-1][1]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--code', type=Path, required=True)
    args = parser.parse_args()
    if not args.code.is_absolute():
        parser.error('--code must be absolute')
    code = args.code.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    result = {
        'firmware': 'EUR HOME 10.7.0-32E', 'titleId': '0004001000022000',
        'codeSha256': CODE_SHA,
        'titleWorkerOpenFailure': title_open_failure(code, archive_open=False),
        'titleWorkerReadFailure': title_open_failure(code),
        'titleWorkerSuppliedResources': title_resource_path(code),
        'state4': {
            'workerPending': stage4(code, completed=False),
            'resourceReady': stage4(code),
            'resourceFlagClear': stage4(code, resource_ok=False),
            'resourceFlagClearAlternative': stage4(code, resource_ok=False, alternate_global=1),
            'presentationLaunchFailure': stage4(code, launch_ok=False),
            'retargetBeforePresentation': stage4(code, retarget=True),
        },
        'state5': {
            'workerPending': stage5(code, completed=False),
            'matchingRequest': stage5(code),
            'retargetedTitle': stage5(code, retarget=True),
            'changedType': stage5(code, current_type=7),
            'ineligiblePrimary': stage5(code, eligible=False),
            'noPendingRequest': stage5(code, pending=False, retarget=True),
        },
        'postState5Acknowledgement': {
            'matchingRequest': acknowledge_show(code),
            'retargetedTitle': acknowledge_show(code, retarget=True),
            'changedType': acknowledge_show(code, changed_type=True),
            'missingPrimary': acknowledge_show(code, primary=False),
        },
        'method': 'Original ARM title-worker control flow, stage-4/stage-5 branches and common post-state-5 acknowledgement with synthetic manager memory. Archive I/O, allocation, constructors, CBMD read/decode, OS readiness/join, controller preparation, visibility calls and worker launch are explicit stubs. The supplied-resource path verifies two decode call sites and the completion-byte store, not real-resource success. Stage-5 replay stops before its tail; acknowledgement is replayed independently. No presentation-worker body, scene/GPU execution or title clip timing.',
    }
    assert result['titleWorkerOpenFailure']['completionByte'] == 0
    assert result['titleWorkerReadFailure']['completionByte'] == 0
    assert result['titleWorkerSuppliedResources']['completionByte'] == 1
    assert len(result['titleWorkerSuppliedResources']['decodeCalls']) == 2
    assert result['state4']['workerPending']['state'] == 4
    assert result['state4']['resourceReady']['state'] == 5
    assert result['state4']['presentationLaunchFailure']['state'] == 4
    assert result['state4']['resourceFlagClear']['state'] == 6
    assert result['state4']['resourceFlagClearAlternative']['requestedType'] == 13
    assert result['state4']['retargetBeforePresentation']['state'] == 5
    assert result['state5']['workerPending']['visibilityRequests'] == []
    for name in ('matchingRequest', 'noPendingRequest'):
        assert [request[1] for request in result['state5'][name]['visibilityRequests']] == [1, 1]
    for name in ('retargetedTitle', 'changedType', 'ineligiblePrimary'):
        assert [request[1] for request in result['state5'][name]['visibilityRequests']] == [0, 0]
    acknowledgement = result['postState5Acknowledgement']
    assert acknowledgement['matchingRequest']['requestPending'] == 0
    assert [request[1] for request in acknowledgement['matchingRequest']['visibilityRequests']] == [1, 1]
    for name in ('retargetedTitle', 'changedType'):
        assert acknowledgement[name]['requestPending'] == 1
        assert acknowledgement[name]['visibilityRequests'] == []
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
