"""Replay hash-pinned Camera photo-fit arithmetic without decoder or UI stubs.

Private code.bin stays outside the repository. Requires unicorn==2.1.4.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from audit_camera_grid import CODE_SHA


def replay(path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_S0, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, 0x420000)
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x40000)
    machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    fbits = lambda f: struct.unpack('<I', struct.pack('<f', f))[0]
    fvalue = lambda u: struct.unpack('<f', struct.pack('<I', u))[0]
    # Browse 0x284c50 reads this literal for the stereo margin argument.
    assert struct.unpack_from('<f', code, 0x284f1c - 0x100000)[0] == 40
    results = []
    cases = [
        ('portfolio-mono', 2000, 1500, 2000, 1500, 2, 0, .16),
        ('native-jpeg-mono', 640, 480, 640, 480, 2, 0, .5),
        ('small-mono', 100, 60, 100, 60, 2, 0, 1),
        ('portrait-mono', 600, 1200, 600, 1200, 2, 0, .2),
        ('stereo-MPO-fixture', 640, 480, 640, 480, 2, 1, .75),
        ('stereo-mode-one', 640, 480, 640, 480, 1, 1, .75),
        ('stereo-other-mode', 640, 480, 640, 480, 0, 1, .5),
        ('stereo-too-wide', 1000, 480, 1000, 480, 2, 1, .4),
        ('stereo-small-source', 320, 240, 320, 240, 2, 1, 1),
    ]
    for name, width, height, original_width, original_height, mode, stereo, expected in cases:
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3),
                              (width, height, original_width, original_height)):
            machine.reg_write(reg, value)
        machine.mem_write(0x103d000, struct.pack('<II', mode, stereo))
        machine.reg_write(UC_ARM_REG_S0, fbits(40))
        machine.reg_write(UC_ARM_REG_SP, 0x103d000)
        machine.reg_write(UC_ARM_REG_LR, 0x103f000)
        machine.emu_start(0x210230, 0x103f000, count=1000)
        assert machine.reg_read(UC_ARM_REG_PC) == 0x103f000
        actual = fvalue(machine.reg_read(UC_ARM_REG_S0))
        assert abs(actual-expected) < 1e-6, (name, actual, expected)
        results.append(dict(name=name, decoded=[width, height], original=[original_width, original_height],
                            mode=mode, stereo=bool(stereo), scale=actual))
    return dict(codeSha256=CODE_SHA, function='0x210230', stereoMargin=40, cases=results,
                scope='Unpatched arithmetic only; no external calls intercepted, no image decoder or native pixel acceptance.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(replay(args.code), indent=2))
