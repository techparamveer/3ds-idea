"""Execute Camera input/blank-selection routines against synthetic HID snapshots.

Private tooling dependency: unicorn==2.1.4. This is not a native screen capture.
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
        UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R4, UC_ARM_REG_R5,
        UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2,
        UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC,
    )
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, max(0x420000, (len(code) + 4095) // 4096 * 4096))
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x20000)
    machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    word = lambda address: struct.unpack('<I', machine.mem_read(address, 4))[0]
    half = lambda address: struct.unpack('<H', machine.mem_read(address, 2))[0]
    byte = lambda address: machine.mem_read(address, 1)[0]
    put = lambda address, value: machine.mem_write(address, struct.pack('<I', value))
    sentinel = 0x101f000
    assert word(0x420af4 + 0x34) == 0x271ff0  # root: producer, then children
    assert word(0x42044c + 0x34) == 0x270cc4  # SceneBrowse traversal
    assert word(0x42044c + 0x38) == 0x270f10  # no-op before children
    assert word(0x42044c + 0x3c) == 0x2d5740  # browse input after children

    def call(start, r0, r1=0):
        machine.reg_write(UC_ARM_REG_R0, r0)
        machine.reg_write(UC_ARM_REG_R1, r1)
        machine.reg_write(UC_ARM_REG_SP, 0x101e000)
        machine.reg_write(UC_ARM_REG_LR, sentinel)
        machine.emu_start(start, sentinel, count=10000)
        assert machine.reg_read(UC_ARM_REG_PC) == sentinel

    provider, keys, touch = 0x1000000, 0x1001000, 0x1002000
    put(word(0x2752c4), provider)
    put(word(0x2750f0), provider)

    def translate(raw):
        # Entry after successful native PadReader read: retain the provider's
        # release-required mask at +0x50, and execute the actual mapping.
        put(provider + 0x40, raw)
        machine.reg_write(UC_ARM_REG_R4, 0)
        machine.reg_write(UC_ARM_REG_R5, provider)
        machine.emu_start(0x10e334, 0x10e3e0, count=1000)
        assert machine.reg_read(UC_ARM_REG_PC) == 0x10e3e0
        return word(provider + 0x54)

    # A held input at a newly reset producer is excluded until released.
    assert translate(0x10) == 0
    assert translate(0) == 0
    assert translate(0x10) == 0x80
    mappings = []
    for raw, expected in [(0x10, 0x80), (0x20, 0x100), (0x40, 0x200), (0x80, 0x400)]:
        translate(0)
        actual = translate(raw)
        assert actual == expected
        mappings.append({'rawMask': hex(raw), 'cameraMask': hex(actual)})

    call(0x128508, keys)
    assert (word(keys + 0x10), word(keys + 0x14)) == (20, 4)
    translate(0)
    emitted = []
    for update in range(1, 31):
        translate(0x10)
        call(0x275230, keys)
        if word(keys + 0xc):
            emitted.append(update)
    assert emitted == [1, 21, 25, 29]
    # A new direction emits its edge alone and restarts the shared delay.
    translate(0x10 | 0x40)
    call(0x275230, keys)
    assert word(keys + 0xc) == 0x200 and word(keys + 0x18) == 20
    translate(0x40)
    call(0x275230, keys)
    assert word(keys + 8) == 0x80 and word(keys + 0xc) == 0
    translate(0)
    call(0x275230, keys)
    assert word(keys) == 0 and word(keys + 0xc) == 0 and word(keys + 0x18) == 0

    def sample(x, y, held):
        machine.mem_write(provider + 0x58, struct.pack('<HH', x, y | (0x8000 if held else 0)))
        call(0x274f0c, touch)
        return {'press': byte(touch + 0x78), 'release': byte(touch + 0x79),
                'move4': byte(touch + 0x7a), 'drag12': byte(touch + 0x7b),
                'move64': byte(touch + 0x7c),
                'distance': struct.unpack('<f', machine.mem_read(touch + 0x100, 4))[0]}

    samples = [sample(100, 100, True), sample(101, 100, True),
               sample(105, 100, True), sample(113, 100, True),
               sample(165, 100, True), sample(165, 100, False)]
    assert samples[0]['press'] == 1
    assert samples[1]['distance'] == 0  # sub-1.1px step is not accumulated
    assert samples[2]['move4'] == 1 and samples[2]['drag12'] == 0
    assert samples[3]['drag12'] == 1 and samples[3]['distance'] == 12
    assert samples[4]['move64'] == 1 and samples[4]['distance'] == 64
    assert samples[5]['release'] == 1 and samples[5]['drag12'] == 0

    # Execute the whole selection commit for an in-page blank cell. Neither
    # file enumeration nor the real-photo branch is stubbed or entered.
    owner, metadata_owner = 0x1004000, 0x100b000
    put(word(0x1fcec8), metadata_owner)
    machine.mem_write(owner + 0x36, struct.pack('<H', 7))
    machine.mem_write(owner + 0x2232, struct.pack('<H', 6))
    machine.mem_write(metadata_owner + 0x3ae8, b'\xff' * 20)
    call(0x1fccf4, owner, 9)
    assert half(owner + 0x2232) == 9
    assert byte(owner + 0x2234) == 1 and byte(owner + 0x2236) == 1
    metadata = bytes(machine.mem_read(metadata_owner + 0x3ae8, 20))
    # The packed metadata contains a padding byte; verify only source-written
    # fields, not stack padding whose previous contents are immaterial.
    assert metadata[:5] == bytes(5), metadata.hex()
    assert metadata[6:] == bytes(14), metadata.hex()
    # The coordinate getter retains a position for the blank index. This
    # does not establish final cursor visibility, which has separate writers.
    renderer = 0x1010000
    put(renderer + 0x16c, owner)
    machine.mem_write(owner + 0x2244, struct.pack('<fff', 0, 13, 0))
    machine.mem_write(owner + 0x2268, struct.pack('<ff', 228, 132))
    for register, value in [(UC_ARM_REG_S0, -86), (UC_ARM_REG_S1, 0), (UC_ARM_REG_S2, 248)]:
        machine.reg_write(register, struct.unpack('<I', struct.pack('<f', value))[0])
    machine.reg_write(UC_ARM_REG_R2, 0)
    call(0x2db78c, renderer, 9)
    x = struct.unpack('<f', struct.pack('<I', machine.reg_read(UC_ARM_REG_S0)))[0]
    y = struct.unpack('<f', struct.pack('<I', machine.reg_read(UC_ARM_REG_S1)))[0]
    assert (160 + x, 120 - y) == (246, 140)
    return {'ok': True, 'codeSha256': CODE_SHA, 'rawMappings': mappings,
            'heldDirectionEmissionUpdates': emitted, 'repeatDelay': 20, 'repeatInterval': 4,
            'releaseRequiredOnProducerReset': True, 'touchSamples': samples,
            'blankSelection': {'itemCount': 7, 'index': 9, 'changed': 1, 'type': 1,
                               'selectedItemMetadataCleared': True,
                               'screenCentreAtOffsetMinus86': [246, 140]},
            'scope': 'Original ARM producer/repeat/touch and blank-commit routines with synthetic state. Scene routing, full renderer lifecycle and physical wall-clock acceptance are not claimed.'}


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
