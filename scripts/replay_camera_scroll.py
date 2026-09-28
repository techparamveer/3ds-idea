"""Replay bounded Camera ARM routines; this is not a native UI/timing capture.

Requires unicorn==2.1.4 in a private tooling environment. No firmware is emitted.
The untouched executable is hash checked before its instructions are executed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from audit_camera_grid import CODE_SHA


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
    from unicorn.arm_const import (
        UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC, UC_ARM_REG_R0,
        UC_ARM_REG_R1, UC_ARM_REG_R4, UC_ARM_REG_S16, UC_ARM_REG_S17,
        UC_ARM_REG_SP, UC_ARM_REG_PC,
    )

    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, (len(code) + 4095) // 4096 * 4096)
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x10000)
    machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    bits = lambda value: struct.unpack('<I', struct.pack('<f', value))[0]
    word = lambda address: struct.unpack('<I', machine.mem_read(address, 4))[0]
    scalar = lambda address: struct.unpack('<f', machine.mem_read(address, 4))[0]
    put = lambda address, value: machine.mem_write(address, struct.pack('<I', value))

    # SceneBrowse fetches '-S-' and checks this native LytSlider type. Its
    # virtual type getter (+8) and update (+0x34) identify the concrete routine.
    assert word(0x440250) == 0x423fff
    assert bytes(machine.mem_read(0x423fff, 4)) == b'-S-\0'
    assert word(0x41e9f8) == 0x3106e0
    assert word(0x3106e8) == word(0x2d2648) == 0x4401c0
    assert word(0x41ea24) == 0x26f8d0
    assert word(0x41e9ec) == 0x41b334 and word(0x41b338) == 0x41b9e5
    type_name = b'N5notes3lyt9LytSliderE\0'
    assert bytes(machine.mem_read(0x41b9e5, len(type_name))) == type_name
    fraction, threshold = scalar(0x1fdc08), scalar(0x1fdc0c)
    assert (fraction, threshold) == (bits_to_float(bits(.3)), bits_to_float(bits(.1)))
    assert scalar(0x26fe2c) == .5

    controller = 0x1000000
    machine.reg_write(UC_ARM_REG_R4, controller)
    machine.mem_write(controller + 0xb8, struct.pack('<ff', fraction, threshold))

    def step(current, target):
        machine.reg_write(UC_ARM_REG_R4, controller)
        machine.reg_write(UC_ARM_REG_S16, bits(current))
        machine.reg_write(UC_ARM_REG_S17, bits(target))
        # Execute the original smoothing/rounding instructions, stopping before
        # the bounds/notification helper. Inputs here stay inside [0, 496].
        machine.emu_start(0x26fd18, 0x26fd70, count=100)
        assert machine.reg_read(UC_ARM_REG_PC) == 0x26fd70
        return scalar(controller + 0x4c), word(controller + 0x48)

    traces = []
    for initial, target in [(0, 86), (86, 0), (86, 162), (162, 248)]:
        current, outputs = initial, []
        for tick in range(1, 65):
            current, pixel = step(current, target)
            outputs.append(pixel)
            if current == target:
                break
        assert current == target and tick == 20
        traces.append({'from': initial, 'to': target, 'integerOutputs': outputs,
                       'updatesUntilFloatSettles': tick})
    assert traces[0]['integerOutputs'][:5] == [26, 44, 57, 65, 72]
    # A target change starts from the existing float, not the previous anchor.
    current, _ = step(0, 86)
    current, _ = step(current, 86)
    _, reversed_pixel = step(current, 0)
    assert reversed_pixel == 31
    assert step(85.95, 86) == (86.0, 86)

    # Run the original key-candidate handler up to its selection-helper call.
    # The masks are internal; no claim about physical HID mapping/repeat rate.
    scene, owner, input_state = 0x1002000, 0x1003000, 0x1006000
    put(scene + 0x60, owner)
    put(0x42d748, input_state)
    put(owner + 0x223c, 0)  # large density
    cases = []
    for count, selection, mask, expected in [
        (12, 0, 0x100, 65535), (12, 5, 0x80, 6),
        (12, 0, 0x200, 3), (12, 3, 0x200, 0),
        (12, 0, 0x400, 3), (12, 3, 0x400, 0),
        (7, 6, 0x400, 9), (7, 11, 0x80, 12),
    ]:
        machine.mem_write(owner + 0x34, struct.pack('<HHH', count, count, 0))
        machine.mem_write(owner + 0x2232, struct.pack('<H', selection))
        put(input_state + 4, mask)
        put(input_state + 0x10, mask)
        machine.reg_write(UC_ARM_REG_R0, scene)
        machine.reg_write(UC_ARM_REG_SP, 0x100f000)
        machine.emu_start(0x2ce810, 0x2d1274, count=10000)
        assert machine.reg_read(UC_ARM_REG_PC) == 0x2d1274
        candidate = machine.reg_read(UC_ARM_REG_R1)
        assert candidate == expected, (count, selection, mask, candidate)
        # 0x2d12c8 rejects candidates outside whole padded pages. Actual
        # item availability/folder behavior is a later part of the UI flow.
        cases.append({'itemCount': count, 'selection': selection,
                      'internalMask': hex(mask), 'candidate': candidate,
                      'insidePaddedPages': candidate < ((max(count, 1) + 5) // 6) * 6})

    return {'ok': True, 'codeSha256': CODE_SHA,
            'controller': 'notes::lyt::LytSlider', 'updateAddress': '0x26f8d0',
            'executedSmoothingRange': ['0x26fd18', '0x26fd70 (exclusive)'],
            'fraction': fraction, 'snapThreshold': threshold,
            'syntheticUpdateTraces': traces, 'keyCandidateCases': cases,
            'scope': 'Original ARM routine replay with synthetic state; no wall-clock cadence, HID mapping, stylus lifecycle or native screen acceptance.'}


def bits_to_float(value):
    return struct.unpack('<f', struct.pack('<I', value))[0]


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert args.code.is_absolute() and args.output.is_absolute()
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
