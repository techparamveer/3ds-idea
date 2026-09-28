"""Hash-pinned Camera cache validation/release and isolated touch ancestry replay.

Requires unicorn==2.1.4 and private executable. Service states and memory objects
are fixtures; not a decoder, complete owner frame, renderer or live UI adapter.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from audit_camera_grid import CODE_SHA


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2,
        UC_ARM_REG_R3, UC_ARM_REG_R4, UC_ARM_REG_R6, UC_ARM_REG_R7,
        UC_ARM_REG_R10, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x420000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x40000)
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    half = lambda p, v: m.mem_write(p, struct.pack('<H', v))
    stack, stop = 0x103d000, 0x103f000
    status, log = 2, []
    ancestry_mode = False
    drain_mode = False
    status_by_identity = {}

    def service(machine, address, size, data):
        if drain_mode and address == 0x2d4b74:
            machine.emu_stop()
        if ancestry_mode and address in (0x2d5984, 0x2d5ab4):
            machine.emu_stop()
        if address in (0x1fd598, 0x1fd428):
            log.append({'call': hex(address), 'identity': machine.reg_read(UC_ARM_REG_R1)})
            if address == 0x1fd598:
                machine.reg_write(UC_ARM_REG_R0, status_by_identity.get(machine.reg_read(UC_ARM_REG_R1), status))
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
    m.hook_add(UC_HOOK_CODE, service)

    def call(address, *args):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            m.reg_write(reg, value)
        m.reg_write(UC_ARM_REG_SP, stack)
        m.reg_write(UC_ARM_REG_LR, stop)
        m.emu_start(address, stop, count=100000)
        assert m.reg_read(UC_ARM_REG_PC) == stop
        return m.reg_read(UC_ARM_REG_R0)

    cache, context, mapping, order = 0x1000000, 0x1001000, 0x1002000, 0x1003000
    items, photos, identities, descriptors = 0x1004000, 0x1005000, 0x1006000, 0x1007000
    output, queue = 0x1009000, 0x100a000
    put(cache + 0x14, mapping)
    put(cache + 0x164, context)
    put(cache + 0x120, descriptors)
    put(context + 0x24, order)
    put(context + 0x18, items)
    put(context + 8, photos)
    put(context + 12, 0x1010000)
    put(photos + 0x18, identities)
    requested, control = 69, 2  # collides with logical5 in the64-slot table
    record = mapping + (requested & 63) * 8
    half(record + 2, control)
    # Item0 refers to photo3: use distinct identity from the old binding(photo1).
    half(items + 8, 3)
    lookup = []
    for status, tag, has_output, initial_ready in [
        (2, 69, True, True), (2, 5, True, True),
        (3, 5, True, True), (2, 69, False, True),
        (2, 69, True, False),
    ]:
        half(record, tag)
        put(record + 4, 1)
        put(cache + 0x7c, (1 << control) if initial_ready else 0)
        m.mem_write(output, b'\xff')
        log.clear()
        result = call(0x2cc654, cache, requested, 1, output if has_output else 0)
        ready = tag == requested and has_output and initial_ready
        assert result == 1
        assert bool(word(cache + 0x7c) & (1 << control)) == ready
        if has_output: assert m.mem_read(output, 1)[0] == int(ready)
        assert log == [{'call': '0x1fd598', 'identity': identities + 3 * 8}]
        lookup.append({'status': status, 'tag': tag, 'requested': requested,
                       'hasOutput': has_output, 'initialReady': initial_ready,
                       'finalReady': ready, 'queryIdentity': identities + 3 * 8})

    releases = []
    for status, tag, clear_ready in [(2, 69, 1), (3, 69, 1), (3, 5, 1), (3, 69, 0)]:
        half(record, tag)
        put(record + 4, 1)
        put(cache + 0x7c, 1 << control)
        put(cache + 4, queue)
        put(cache + 8, queue)
        put(cache + 12, queue + 16)
        log.clear()
        result = call(0x1fd6a8, cache, requested, 1, clear_ready)
        assert struct.unpack('<H', m.mem_read(record + 4, 2))[0] == 0xff7f
        assert bool(word(cache + 0x7c) & (1 << control)) == (tag != requested or not clear_ready)
        assert log[0] == {'call': '0x1fd598', 'identity': identities + 8}
        if status == 2:
            assert word(cache + 8) == queue + 4 and word(queue) == identities + 8
            assert len(log) == 1 and result == 0
        else:
            assert word(cache + 8) == queue and log[1]['call'] == '0x1fd428'
            assert result == 1
        releases.append({'status': status, 'tag': tag, 'clearReady': clear_ready,
                         'deferredCount': (word(cache + 8) - queue) // 4,
                         'finalReady': bool(word(cache + 0x7c) & (1 << control)),
                         'calls': list(log)})

    # Original deferred-release loop, with its entry registers supplied.
    # This does not reproduce preceding scene callbacks.
    drain_cases = []
    drain_mode = True
    for states in [(2, 2, 2), (3, 3, 3), (3, 2, 3), (2, 3, 2)]:
        entries = [identities + i * 8 for i in range(3)]
        status_by_identity = dict(zip(entries, states))
        put(cache + 4, queue)
        put(cache + 8, queue + 12)
        for i, entry in enumerate(entries): put(queue + i * 4, entry)
        m.reg_write(UC_ARM_REG_R4, queue)
        m.reg_write(UC_ARM_REG_R6, cache)
        m.reg_write(UC_ARM_REG_SP, stack)
        log.clear()
        m.emu_start(0x2d4a88, stop, count=10000)
        assert m.reg_read(UC_ARM_REG_PC) == 0x2d4b74
        remaining = [word(p) for p in range(queue, word(cache + 8), 4)]
        assert remaining == [entry for entry, state in zip(entries, states) if state == 2]
        released = [event['identity'] for event in log if event['call'] == '0x1fd428']
        assert released == [entry for entry, state in zip(entries, states) if state != 2]
        drain_cases.append({'states': states, 'remaining': remaining, 'released': released})
    drain_mode = False
    status_by_identity = {}

    # Isolated original ancestry basic block only. Hit geometry and earlier
    # owner gates are preconditions, not claimed verified by this entry point.
    manager, eligible, active, ancestor = 0x1011000, 0x1012000, 0x1013000, 0x1014000
    ancestry = []
    ancestry_mode = True
    for label, owner, parent, upper, accepted in [
        ('no-active-owner', 0, 0, 0, True),
        ('direct-child', active, eligible, 0, True),
        ('nested-child', active, ancestor, eligible, True),
        ('unrelated', active, ancestor, 0, False),
        ('active-is-eligible', eligible, 0, 0, False),
    ]:
        put(manager + 0x25c, owner)
        put(active + 0x10, parent)
        put(ancestor + 0x10, upper)
        put(eligible + 0x10, 0)
        m.reg_write(UC_ARM_REG_R7, manager)
        m.reg_write(UC_ARM_REG_R10, eligible)
        # Hook stops before executing either accept/reject destination.
        m.emu_start(0x2d5960, stop, count=100)
        pc = m.reg_read(UC_ARM_REG_PC)
        if not accepted:
            assert pc == 0x2d5ab4, hex(pc)
        else:
            assert pc == 0x2d5984, hex(pc)
        ancestry.append({'case': label, 'acceptedByAncestryGate': accepted})
    return {'sha256': CODE_SHA, 'cacheValidation': lookup, 'bindingRelease': releases,
            'deferredReleaseLoop': drain_cases, 'isolatedAncestry': ancestry,
            'scope': 'Original complete cache routines; synthetic worker status/release services. Isolated queue drain and ancestry blocks only. No full owner ordering, decode, draw or live UI claim.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert args.code.is_absolute() and args.output.is_absolute()
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print('Camera cache validation, release and ancestry replay passed')
