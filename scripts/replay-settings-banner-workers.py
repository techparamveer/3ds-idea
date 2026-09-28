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
from unicorn.arm_const import UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_R6, UC_ARM_REG_R7, UC_ARM_REG_SP

BASE = 0x100000
MANAGER = 0x32ebf4
CODE_SHA = '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
CAMERA_CBMD_SHA = 'e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280'
CAMERA_COMMON_SHA = '068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d'
CAMERA_EUR_SHA = '21f8723b955b36b9575d0a92b942889bd978f868163c9b75063528f561105ccb'


def read32(uc, address):
    return struct.unpack('<I', uc.mem_read(address, 4))[0]


def write32(uc, address, value):
    uc.mem_write(address, struct.pack('<I', value))


def run(code, *, entry, stop, stubs, setup=None, count=1000, observe=()):
    uc = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    uc.mem_map(BASE, 0x300000)
    uc.mem_write(BASE, code)
    uc.mem_map(0x500000, 0x20000)
    uc.mem_map(0x600000, 0x1000)
    uc.mem_map(0x700000, 0x1000)
    uc.mem_map(0x800000, 0x300000)
    uc.reg_write(UC_ARM_REG_SP, 0x600800)
    uc.reg_write(UC_ARM_REG_LR, 0x700000)
    uc.reg_write(UC_ARM_REG_R0, 0x500000)
    events = []
    if setup:
        setup(uc)

    def hook(uc, address, size, _):
        if address in observe:
            events.append(['visit', hex(address)])
        if address in stop:
            events.append(['stop', hex(address)])
            uc.emu_stop()
        elif address in stubs:
            result = stubs[address](uc) if callable(stubs[address]) else stubs[address]
            events.append(['stub', hex(address), result])
            uc.reg_write(UC_ARM_REG_R0, result & 0xffffffff)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))

    uc.hook_add(UC_HOOK_CODE, hook)
    try:
        uc.emu_start(entry, 0x700004, count=count)
    except Exception as exc:
        raise RuntimeError(f'ARM replay stopped at {uc.reg_read(UC_ARM_REG_PC):#x}; recent endpoints {events[-8:]}') from exc
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


def camera_resource_path(code, banner):
    """Execute the native size and LZ11 routines on the real pinned Camera CBMD."""
    assert hashlib.sha256(banner).hexdigest() == CAMERA_CBMD_SHA
    common_offset = struct.unpack_from('<I', banner, 8)[0]
    selected_offset = struct.unpack_from('<I', banner, 12)[0]
    assert common_offset == 0x88 and selected_offset > common_offset
    allocs = iter((0x500400, 0x500500))
    objects = iter((0x500600, 0x500700))
    requested_keys = []

    def setup(uc):
        write32(uc, 0x31f31c, 0x510030)
        write32(uc, 0x510000, 0)
        write32(uc, 0x31f328, 0)
        uc.mem_write(0x500008, struct.pack('<IIB', 0x22400, 0x40010, 0))
        write32(uc, MANAGER + 0xd8, 0x800000)
        write32(uc, MANAGER + 0xcc, 0x900000)
        write32(uc, MANAGER + 0xd0, 0x980000)

    def read_length(uc):
        write32(uc, uc.reg_read(UC_ARM_REG_R1), len(banner))
        write32(uc, uc.reg_read(UC_ARM_REG_R1) + 4, 0)
        return 0

    def open_archive(uc):
        requested_keys.append([hex(uc.reg_read(UC_ARM_REG_R2)),
                               hex(uc.reg_read(UC_ARM_REG_R3)), uc.reg_read(UC_ARM_REG_R1)])
        return 0

    def read_container(uc):
        uc.mem_write(0x800000, banner)
        write32(uc, uc.reg_read(UC_ARM_REG_R1), len(banner))
        return 0

    stubs = {0x161e14: open_archive, 0x22bd38: read_length, 0x22650c: 0,
             0x23546c: lambda uc: next(allocs), 0x2360f4: 0,
             0x1fa0fc: lambda uc: next(objects), 0x22bca8: read_container,
             0x244ff8: 1, 0x22bc68: 0}
    uc, events = run(code, entry=0x24c930, stop={0x700000}, stubs=stubs,
                     setup=setup, count=2_000_000, observe={0x2201cc, 0x220070, 0x24cba8})
    common_size = struct.unpack_from('<I', banner, common_offset)[0] >> 8
    selected_size = struct.unpack_from('<I', banner, selected_offset)[0] >> 8
    common_hash = hashlib.sha256(uc.mem_read(0x900000, common_size)).hexdigest()
    selected_hash = hashlib.sha256(uc.mem_read(0x980000, selected_size)).hexdigest()
    assert common_hash == CAMERA_COMMON_SHA and selected_hash == CAMERA_EUR_SHA
    assert requested_keys == [['0x22400', '0x40010', 0]]
    return {'cbmdSha256': CAMERA_CBMD_SHA, 'commonOffset': common_offset,
            'archiveTitleKey': requested_keys[0],
            'selectedOffset': selected_offset, 'commonSize': common_size,
            'selectedSize': selected_size, 'commonSha256': common_hash,
            'selectedSha256': selected_hash,
            'completionByte': uc.mem_read(0x500000, 1)[0],
            'commonCandidate': hex(read32(uc, MANAGER + 0x50)),
            'selectedCandidate': hex(read32(uc, MANAGER + 0x54)),
            'nativeSizeCalls': sum(e == ['visit', '0x2201cc'] for e in events),
            'nativeDecodeCalls': sum(e == ['visit', '0x220070'] for e in events),
            'completionStoreReached': ['visit', '0x24cba8'] in events,
            'stop': events[-1][1]}


def presentation_worker_gate(code, *, retarget=False):
    """Execute the early no-active-effect branch of presentation worker 0x2492d8."""
    service = []

    def setup(uc):
        key = struct.pack('<IIB', 0x22400, 0x40010, 0)
        uc.mem_write(0x34c240, key)
        uc.mem_write(0x34c250, struct.pack('<I', 0x22500) + key[4:] if retarget else key)
        uc.mem_write(MANAGER + 4, b'\x01')
        uc.mem_write(MANAGER + 0xa, b'\x00')
        uc.mem_write(MANAGER + 0xf, b'\x00')
        uc.mem_write(0x34c020, b'\x01\x00')

    def request_service(uc):
        service.append(hex(uc.reg_read(UC_ARM_REG_R0)))
        return 0

    uc, events = run(code, entry=0x2492d8, stop={0x700000},
                     stubs={0x1f9e8c: request_service}, setup=setup)
    return {'serviceArguments': service, 'stop': events[-1][1]}


def retarget_state6(code):
    """Execute pending title mismatch through native hide/state-2 transition."""
    visibility = []

    def setup(uc):
        key = struct.pack('<IIB', 0x22400, 0x40010, 0)
        uc.mem_write(0x34c240, key)
        uc.mem_write(0x34c250, struct.pack('<I', 0x22500) + key[4:])
        uc.mem_write(MANAGER + 3, b'\x01')
        uc.mem_write(MANAGER + 6, b'\x01')
        uc.mem_write(MANAGER + 4, b'\x01')
        write32(uc, MANAGER + 0x50, 0x500100)
        write32(uc, MANAGER + 0x54, 0x500200)
        write32(uc, MANAGER + 0x58, 0x500100)
        write32(uc, MANAGER + 0xc0, 6)
        uc.reg_write(UC_ARM_REG_R6, MANAGER)
        uc.reg_write(UC_ARM_REG_R7, 0)

    def hide(uc):
        visibility.append([hex(uc.reg_read(UC_ARM_REG_R0)), uc.reg_read(UC_ARM_REG_R1)])
        return 0

    uc, events = run(code, entry=0x24c184, stop={0x24c23c},
                     stubs={0x1f9e64: hide, 0x22b070: 0, 0x235540: 0}, setup=setup)
    return {'requestPending': uc.mem_read(MANAGER + 4, 1)[0],
            'state': read32(uc, MANAGER + 0xc0), 'visibilityRequests': visibility,
            'stop': events[-1][1]}


def retarget_state2(code, *, actually_visible):
    def setup(uc):
        uc.reg_write(UC_ARM_REG_R6, MANAGER)
        write32(uc, MANAGER + 0x50, 0x500100)
        write32(uc, MANAGER + 0xc0, 2)
        uc.mem_write(0x50013c, bytes([actually_visible]))

    uc, events = run(code, entry=0x24c128, stop={0x24c23c, 0x24c248},
                     stubs={}, setup=setup)
    return {'state': read32(uc, MANAGER + 0xc0), 'stop': events[-1][1]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--camera-banner', type=Path,
                        help='Absolute private Camera exefs/banner.bin; enables real CBMD native LZ11 replay')
    args = parser.parse_args()
    if not args.code.is_absolute():
        parser.error('--code must be absolute')
    if args.camera_banner and not args.camera_banner.is_absolute():
        parser.error('--camera-banner must be absolute')
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
        'presentationWorkerEarlyGate': {
            'matchingRequest': presentation_worker_gate(code),
            'retargetedTitle': presentation_worker_gate(code, retarget=True),
        },
        'retargetState6': retarget_state6(code),
        'retargetState2': {
            'stillVisible': retarget_state2(code, actually_visible=True),
            'hidden': retarget_state2(code, actually_visible=False),
        },
        'method': 'Original ARM title worker, stage-4/5 branches, post-state-5 acknowledgement, presentation-worker early gate and retarget state-6/2 fragments with supplied manager memory. Archive I/O, allocations, constructors, controller preparation, visibility and thread services are explicit stubs. Optional pinned Camera CBMD runs the original size and LZ11 routines and checks both CGFX output hashes. No full presentation-worker render path, uninterrupted retarget cycle, scene/GPU execution or title clip timing.',
    }
    if args.camera_banner:
        result['cameraTitleWorker'] = camera_resource_path(code, args.camera_banner.read_bytes())
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
    assert result['presentationWorkerEarlyGate']['matchingRequest']['serviceArguments'] == ['0x34c020']
    assert result['presentationWorkerEarlyGate']['retargetedTitle']['serviceArguments'] == ['0x0']
    assert result['retargetState6']['requestPending'] == 0
    assert result['retargetState6']['state'] == 2
    assert [request[1] for request in result['retargetState6']['visibilityRequests']] == [0, 0]
    assert result['retargetState2']['stillVisible']['state'] == 2
    assert result['retargetState2']['hidden']['state'] == 1
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
