"""Health key descriptors/held input and isolated GPU rectangle consumer replay.

Private Unicorn2.1.4 and hash-pinned executable. Allocation and control creation
are intercepted during descriptor capture. HID objects are synthetic. No claim
of complete control traversal, article-specific clip binding or native frames.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from replay_health_scroll import CODE_SHA


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_R5, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x200000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x40000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    byte = lambda p: m.mem_read(p, 1)[0]
    scene, key, other, hid = 0x1000000, 0x1001000, 0x1002000, 0x1003000
    stack, stop = 0x103d000, 0x103f000
    mode, heap = 'construct', 0x1010000
    descriptors, touch_descriptors, events = [], [], []

    def external(machine, address, size, data):
        nonlocal heap
        value = None
        if mode == 'construct' and address in (0x127eb4, 0x127ec0): value = 0
        elif mode == 'construct' and address == 0x139598:
            value = heap
            heap += 0x1000
        elif mode == 'construct' and address == 0x154b48:
            descriptors.append(bytes(m.mem_read(machine.reg_read(UC_ARM_REG_R1), 0x48)))
            return_value = machine.reg_read(UC_ARM_REG_R0)
            value = return_value
        elif mode == 'construct' and address == 0x154560:
            touch_descriptors.append(bytes(m.mem_read(machine.reg_read(UC_ARM_REG_R1), 0x24)))
            value = machine.reg_read(UC_ARM_REG_R0)
        elif mode == 'construct' and address == 0x153c9c: value = machine.reg_read(UC_ARM_REG_R0)
        elif address == 0x1020000:
            events.append({'control': machine.reg_read(UC_ARM_REG_R0),
                           'event': machine.reg_read(UC_ARM_REG_R1),
                           'argument': machine.reg_read(UC_ARM_REG_R2)})
        elif mode == 'clip' and address == 0x1154bc:
            machine.emu_stop()
            return
        else: return
        if value is not None: machine.reg_write(UC_ARM_REG_R0, value)
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
    m.hook_add(UC_HOOK_CODE, external)

    def call(address, *args):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args): m.reg_write(reg, value)
        m.reg_write(UC_ARM_REG_SP, stack)
        m.reg_write(UC_ARM_REG_LR, stop)
        m.emu_start(address, stop, count=1000000)
        assert m.reg_read(UC_ARM_REG_PC) == stop, hex(m.reg_read(UC_ARM_REG_PC))

    call(0x1573ec, scene)
    call(0x157684, scene)
    assert len(touch_descriptors) == 1
    assert len(descriptors) == 2
    descriptor_report = []
    for expected_mask, descriptor in zip((0x40, 0x80), descriptors):
        values = [struct.unpack_from('<I', descriptor, off)[0] for off in (0x34, 0x3c, 0x40)]
        assert values == [expected_mask, 0, 1]
        descriptor_report.append({'mask': expected_mask, 'delayUpdates': values[1], 'repeatUpdates': values[2]})

    mode = 'keys'
    hid_globals = word(0x156734)
    owner_globals = word(0x128368)
    busy_global = word(0x1282a0)
    # Empty owner registry: callback routing is supplied explicitly below.
    registry = word(0x128258)
    put(registry + 4, registry + 4)
    put(hid_globals + 0x10, hid)
    put(owner_globals + 8, 0x1020000)
    put(owner_globals + 0x10, scene)
    for ptr, descriptor in zip((key, other), descriptors):
        put(ptr, 0x16c674)
        m.mem_write(ptr + 0x30, descriptor)
        put(ptr + 0x18, ptr + 0x30)
        m.mem_write(ptr + 0x14, b'\x01')

    def sample(held=0, pressed=0, released=0, touch=False):
        put(hid, held)
        put(hid + 4, pressed)
        put(hid + 8, released)
        m.mem_write(hid_globals + 1, bytes([int(touch)]))
        m.mem_write(hid_globals + 2, bytes([int(touch)]))
        for offset in (4, 8, 10): m.mem_write(hid_globals + offset, b'\0\0')

    samples = []
    sample(0x40, 0x40)
    call(0x154a6c, key)
    assert len(events) == 1 and events[-1]['event'] == 1
    assert word(key + 0x10) == 1 and byte(key + 0xc) == 1 and byte(busy_global) == 1
    for i in range(1, 9):
        sample(0x40)
        call(0x154a6c, key)
        assert len(events) == i + 1 and word(key + 0x78) == i
        samples.append({'heldUpdate': i, 'eventsIncludingPress': len(events)})
    # A non-owning second key cannot dispatch while the first owns the gate.
    sample(0xc0, 0x80)
    call(0x154a6c, other)
    assert len(events) == 9 and word(other + 0x10) == 0
    sample(0, 0, 0x40)
    call(0x154a6c, key)
    assert len(events) == 9 and word(key + 0x10) == 3
    assert word(key + 0x78) == 0 and byte(key + 0xc) == 0 and byte(busy_global) == 0
    sample()
    call(0x154a6c, key)
    assert word(key + 0x10) == 0
    sample(0x80, 0x80)
    call(0x154a6c, other)
    assert len(events) == 10 and events[-1]['control'] == other
    # A disabled owning control is skipped; disabling alone does not release it.
    m.mem_write(other + 0x14, b'\0')
    sample()
    call(0x154a6c, other)
    assert byte(other + 0xc) == 1 and byte(busy_global) == 1 and len(events) == 10

    # A prescribed ongoing-key/accepted-touch sequence, not initial hit-test or
    # traversal proof. Key update pauses while stylus held if key has no pane.
    m.mem_write(other + 0x14, b'\x01')
    sample(0x80, touch=True)
    call(0x154a6c, other)
    assert len(events) == 10 and byte(other + 0xc) == 1
    touch = 0x1004000
    m.mem_write(touch + 0x10, touch_descriptors[0])
    assert struct.unpack('<f', m.mem_read(touch + 0x1c, 4))[0] == 0
    assert byte(touch + 0x31) == 0 and byte(touch + 0x32) == 1
    m.mem_write(touch + 0xd, b'\x01')  # accepted hit, awaiting movement threshold
    coordinate = word(0x128374)
    m.mem_write(coordinate, bytes(8))
    call(0x154284, touch)
    assert byte(touch + 0xd) == 2 and byte(touch + 0xc) == 1
    assert len(events) == 11 and events[-1]['control'] == touch
    assert byte(other + 0xc) == 1 and byte(busy_global) == 1
    call(0x154530, touch)
    assert byte(touch + 0xd) == 0 and byte(touch + 0xc) == 1 and byte(busy_global) == 1

    # Isolated register65/66/67 rectangle consumer. These input rectangles are
    # fixtures, not evidence of the rectangle selected by the Health article.
    mode = 'clip'
    state, commands = 0x1021000, 0x1023000
    command_current, command_end = word(0x116338), word(0x11633c)
    clips = []
    for enabled, rect in [(True, (0, 28, 320, 186)), (True, (-10, -5, 40, 30)), (False, (0, 0, 0, 0))]:
        m.mem_write(state + 0x648, bytes([int(enabled)]))
        for i, value in enumerate(rect): put(state + 0x5e4 + i * 4, value)
        put(state + 0x698, 320)
        put(state + 0x69c, 240)
        put(command_current, commands)
        put(command_end, commands + 256)
        m.reg_write(UC_ARM_REG_R5, state)
        m.emu_start(0x1153b8, stop, count=10000)
        assert m.reg_read(UC_ARM_REG_PC) == 0x1154bc
        assert word(command_current) == commands + 24
        words = [word(commands + i * 4) for i in range(6)]
        assert words[1::2] == [0xf0065, 0xf0066, 0xf0067]
        expected = [3, 28 << 16, 319 | (213 << 16)] if rect == (0, 28, 320, 186) else [3, 0, 29 | (24 << 16)] if enabled else [0, 0, 319 | (239 << 16)]
        assert words[::2] == expected, words
        clips.append({'enabled': enabled, 'inputRectangle': rect, 'registerValues': [hex(v) for v in words[::2]]})
    return {'codeSha256': CODE_SHA, 'sourceDescriptors': descriptor_report,
            'heldSamples': samples, 'events': events,
            'ownership': {'nonOwnerBlocked': True, 'releaseClearsGate': True, 'disableAloneRetainsGate': True},
            'touchDescriptor': {'movementThreshold': 0, 'xEnabled': False, 'yEnabled': True},
            'prescribedKeyTouchSequence': {'keyPausedDuringStylus': True, 'touchThresholdClaimsDespiteBusy': True, 'resetAloneRetainsOwnerFlags': True},
            'isolatedRectangleConsumer': clips,
            'scope': 'Original descriptor setup, key dispatcher/held/release/global gate and isolated rectangle consumer. Synthetic HID and registry; event sink intercepted. Full touch traversal, article clip producer and live frame not established.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--code', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    args = p.parse_args()
    assert args.code.is_absolute() and args.output.is_absolute()
    report = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print('Health key ownership and rectangle-consumer replay passed')
