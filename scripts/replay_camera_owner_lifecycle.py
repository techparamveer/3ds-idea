"""Hash-pinned Camera mode, image-helper and ring-routing source replay.

Requires private unicorn==2.1.4. Synthetic objects and explicit external service
stubs are described in camera-owner-lifecycle-source-audit.md. Not a renderer,
full decoder, full input-owner replay or native screenshot comparison.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from audit_camera_grid import CODE_SHA


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2,
        UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x420000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x40000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    byte = lambda p: m.mem_read(p, 1)[0]
    half = lambda p: struct.unpack('<H', m.mem_read(p, 2))[0]
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    puth = lambda p, v: m.mem_write(p, struct.pack('<H', v))
    putf = lambda p, v: m.mem_write(p, struct.pack('<f', v))
    f_reg = lambda r: struct.unpack('<f', struct.pack('<I', m.reg_read(r)))[0]
    stack, sentinel = 0x103d000, 0x103f000
    mode, log, service_status = '', [], 0

    def service(machine, address, size, data):
        nonlocal log
        regs = [machine.reg_read(r) for r in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        handled = False
        if mode == 'initialize' and address in (0x260458, 0x2eebe4):
            log.append({'call': hex(address), 'args': regs})
            if address == 0x260458:
                machine.reg_write(UC_ARM_REG_R0, 0x1020000)
            handled = True
        elif mode == 'poll' and address in (0x20b068, 0x1f5de0, 0x1f5c6c):
            log.append(hex(address))
            if address == 0x20b068:
                machine.reg_write(UC_ARM_REG_R0, service_status)
            handled = True
        elif mode == 'ring' and address == 0x2d804c:
            sp = machine.reg_read(UC_ARM_REG_SP)
            log.append({'mappedControl': regs[2], 'paddedValid': bool(regs[3]),
                        'realItem': bool(word(sp)), 'ready': bool(word(sp + 4)),
                        'relativeIndex': struct.unpack('<i', m.mem_read(sp + 8, 4))[0],
                        'position': [f_reg(UC_ARM_REG_S0), f_reg(UC_ARM_REG_S1), f_reg(UC_ARM_REG_S2)]})
            handled = True
        if handled:
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))

    m.hook_add(UC_HOOK_CODE, service)

    def call(address, r0=0, r1=0, r2=0, r3=0, extras=()):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), (r0, r1, r2, r3)):
            m.reg_write(reg, value)
        for i, value in enumerate(extras):
            put(stack + i * 4, value)
        m.reg_write(UC_ARM_REG_SP, stack)
        m.reg_write(UC_ARM_REG_LR, sentinel)
        m.emu_start(address, sentinel, count=100000)
        assert m.reg_read(UC_ARM_REG_PC) == sentinel, hex(m.reg_read(UC_ARM_REG_PC))

    owner, control, manager = 0x1000000, 0x1002000, 0x1003000
    put(owner + 0x12b8, control)
    put(word(0x212f38), manager)
    original = [0x1111, 0x2222, 0x3333, 0x4444, 0x5555, 0x6666]
    for i, value in enumerate(original): put(manager + 0x2a8 + i * 4, value)
    puth(control + 0x30, 0xa5ff)
    modes = []
    for value, flags, clear_mask in [(1, 0xa5e1, 0x4100), (0, 0xa5ff, 0x4000), (1, 0xa5e1, 0x4100)]:
        call(0x210ce4, owner, value)
        assert byte(owner + 0x530) == value and half(control + 0x30) == flags
        assert [word(manager + 0x2a8 + i * 4) for i in range(4)] == [clear_mask, 0xff000000] * 2
        assert [word(manager + 0x2b8 + i * 4) for i in range(2)] == original[4:]
        assert byte(owner + 0xce8) == 6
        assert [word(owner + 0xcec + i * 4) for i in range(4)] == original[:4]
        modes.append({'mode': value, 'controlFlags': hex(flags), 'renderMask': hex(clear_mask), 'rgba': '000000ff'})
    call(0x212ed4, owner + 0xce8)
    assert [word(manager + 0x2a8 + i * 4) for i in range(6)] == original
    assert byte(owner + 0xce8) == 0

    helper, image = 0x1004000, 0x1005000
    put(helper, image)
    mode = 'initialize'
    call(0x2ee83c, helper, 0)
    assert byte(helper + 0xe0) == 1 and word(helper + 0xdc) == 0x1020000
    assert len(log) == 2 and log[0]['call'] == '0x260458' and log[1]['call'] == '0x2eebe4'
    assert byte(image + 0xb4) == 0  # not changed to image-ready by initialization
    initialization = list(log)
    call(0x2ee83c, helper, 0)
    assert log == initialization  # already initialized: no allocation/configuration

    # Poll original worker-state branch. Services are synthetic statuses, not
    # actual I/O/decoding. Completion state3 selects the finalize callback;
    # failure states0/4 release requests and select failure callback.
    mode = 'poll'
    polls = []
    for function, pending, finalize in [(0x2ef070, 0x2ef070, 0x2ef0d0), (0x2ef5f8, 0x2ef5f8, 0x2ef658)]:
        for service_status in range(5):
            put(image + 0xb8, pending)
            put(image + 0xbc, 0)
            put(image + 0xc4, 17)
            log = []
            call(function, image)
            expected = finalize if service_status == 3 else 0x2eeed4 if service_status in (0, 4) else pending
            assert word(image + 0xb8) == expected
            assert word(image + 0xc4) == (0xffffffff if service_status in (0, 4) else 17)
            polls.append({'poll': hex(function), 'workerStatus': service_status,
                          'nextCallback': hex(expected), 'calls': list(log)})
    mode = ''
    call(0x2eeed4, image)
    assert byte(image + 0xb4) == 3
    call(0x2eebd8, image)
    assert byte(image + 0xb4) == 1
    put(image + 0xb8, 0x2ef758)
    put(image + 0xbc, 0)
    m.mem_write(image + 0x48, b'\x01')
    call(0x2eea50, helper)
    assert word(image + 0xb8) == 0x2ef758 and byte(image + 0xb4) == 1
    m.mem_write(image + 0x48, b'\x00')  # synthetic upload completion
    call(0x2eea50, helper)
    assert word(image + 0xb8) == 0x2ef43c and byte(image + 0xb4) == 1
    call(0x2eea50, helper)
    assert byte(image + 0xb4) == 2

    # Native per-slot ring presentation consumes a separately populated mapping
    # table; a synthetic modulo18 table is supplied, not claimed as allocation.
    renderer, browse, mapping, translations = 0x1007000, 0x1008000, 0x1010000, 0x1011000
    put(renderer + 0x16c, browse)
    put(renderer + 0x18, mapping)
    m.mem_write(browse + 0x2244, struct.pack('<fff', 0, 13, 0))
    m.mem_write(browse + 0x2268, struct.pack('<ff', 228, 132))
    for i in range(64): puth(mapping + i * 8 + 2, i % 18)
    put(renderer + 0x80, 0xffffffff)
    put(renderer + 0x84, 0xffffffff)
    mode = 'ring'
    ring_cases = []
    for count, page, offset in [(7, 1, -86), (7, 2, -248), (80, 11, -2480)]:
        puth(browse + 0x36, count)
        for logical_page in range(page - 1, page + 2):
            m.mem_write(translations + logical_page % 3 * 12,
                        struct.pack('<fff', logical_page * 248 + offset, 0, 0))
        log = []
        for slot in range(18):
            call(0x2d92ac, renderer, 0, 0, slot, (page, translations, 0))
        assert len(log) == 18
        for slot, result in enumerate(log):
            index = (page - 1) * 6 + slot
            assert result['mappedControl'] == (index & 63) % 18
            assert result['paddedValid'] == (index < ((max(count, 1) + 5) // 6) * 6)
            assert result['realItem'] == (index < count)
            assert result['ready'] == (index < count)
            if result['paddedValid']:
                expected = [(index // 6) * 248 + offset + (index % 3 - 1) * 76,
                            13 + (33 if index % 6 < 3 else -33), 0]
                assert result['position'] == expected, (index, result, expected)
        ring_cases.append({'count': count, 'page': page, 'offset': offset,
                           'validSlots': sum(v['paddedValid'] for v in log),
                           'realSlots': sum(v['realItem'] for v in log),
                           'first': log[0], 'last': log[-1]})
    # A real photo with its mapped ready bit cleared stays valid but unready.
    put(renderer + 0x80, 0)
    puth(browse + 0x36, 7)
    log = []
    call(0x2d92ac, renderer, 0, 0, 6, (1, translations, 0))
    assert log[0]['paddedValid'] and log[0]['realItem'] and not log[0]['ready']
    # Mapping sentinel64 suppresses the final control writer entirely.
    puth(mapping + 6 * 8 + 2, 64)
    log = []
    call(0x2d92ac, renderer, 0, 0, 6, (1, translations, 0))
    assert not log
    return {'codeSha256': CODE_SHA, 'modeSwitches': modes,
            'renderConfigurationRestored': True, 'initializationCalls': initialization,
            'workerPolls': polls, 'ringRouting': ring_cases,
            'limits': 'No full allocator, decoder, thumbnail rebinding, owner arbitration, rendering or browser timing replay.'}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--code', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    args = p.parse_args()
    assert args.code.is_absolute() and args.output.is_absolute()
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(f'Camera owner lifecycle replay passed: {args.output}')


if __name__ == '__main__':
    main()
