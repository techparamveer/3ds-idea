"""Replay EUR Health and Safety's scroll controller against private source code.

Requires unicorn==2.1.4. Synthetic layout resolution replaces only 0x1290c8;
0x12f4f8 sound dispatch is intercepted. All motion arithmetic, event mapping,
scrollbar setters/getters and pane writes execute original instructions. This is
not a rendered article, HID scheduler, or native timing/fidelity comparison.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

CODE_SHA = '74c813cc1f00a67c06ad85e10723b1440949b2d448e2e1f5532d2a61fb57600c'


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (
        UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC, UC_ARM_REG_R0, UC_ARM_REG_R1,
        UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_S0, UC_ARM_REG_SP,
        UC_ARM_REG_LR, UC_ARM_REG_PC,
    )
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA, 'Unexpected source code'
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x200000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x20000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    real = lambda p: struct.unpack('<f', m.mem_read(p, 4))[0]
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    putf = lambda p, v: m.mem_write(p, struct.pack('<f', v))
    scene, ctrl, bar, touch, up, down = [0x1000000 + i * 0x1000 for i in range(6)]
    text_pane, thumb_pane, hit_pane, hid = [0x1006000 + i * 0x1000 for i in range(4)]
    sentinel = 0x101f000
    sound_events = []

    def external(machine, address, size, data):
        if address == 0x1290c8:
            name = machine.reg_read(UC_ARM_REG_R1)
            if name == bar + 0x81:
                pane = thumb_pane
            elif name == bar + 0x92:
                pane = hit_pane
            elif name == 0x157568:
                pane = text_pane
            else:
                raise AssertionError(f'Unexpected pane resolver input {name:x}')
            machine.reg_write(UC_ARM_REG_R0, pane)
        elif address == 0x12f4f8:
            sound_events.append(machine.reg_read(UC_ARM_REG_R1))
        else:
            return
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))

    m.hook_add(UC_HOOK_CODE, external)

    def call(start, r0=0, r1=0, r2=0, r3=0, s0=None):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), (r0, r1, r2, r3)):
            m.reg_write(reg, value)
        if s0 is not None:
            m.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', s0))[0])
        m.reg_write(UC_ARM_REG_SP, 0x101e000)
        m.reg_write(UC_ARM_REG_LR, sentinel)
        m.emu_start(start, sentinel, count=100000)
        assert m.reg_read(UC_ARM_REG_PC) == sentinel, hex(m.reg_read(UC_ARM_REG_PC))

    def snapshot():
        call(0x1555a4, bar)
        ratio = struct.unpack('<f', struct.pack('<I', m.reg_read(UC_ARM_REG_S0)))[0]
        return {'state': word(ctrl), 'row': word(ctrl + 0x7c),
                'residual': real(ctrl + 0x90), 'paneY': real(text_pane + 0x2c),
                'scrollbarRatio': round(ratio, 7)}

    def setup(row=10, residual=0):
        for ptr in (scene, ctrl, bar, touch, up, down, text_pane, thumb_pane, hit_pane, hid):
            m.mem_write(ptr, bytes(0x200))
        for offset, value in [(0x8c, bar), (0x90, touch), (0x94, up), (0x98, down), (0x9c, ctrl)]:
            put(scene + offset, value)
        # 100 synthetic measured rows, 8-row viewport, 20px synthetic pitch.
        # Source scene's flags19/1a map to controller flags1d/1e after memcpy+4.
        for offset, value in [(4, 100), (8, 8), (0x10, 1), (0x3c, bar),
                              (0x40, touch), (0x44, up), (0x48, down),
                              (0x54, 0x157568), (0x7c, row), (0x80, row),
                              (0x88, row), (0x78, 123), (0x9c, 1)]:
            put(ctrl + offset, value)
        m.mem_write(ctrl + 0x1d, b'\x01\x01')
        putf(ctrl + 0x24, 20)
        putf(ctrl + 0x8c, 92 * 20)
        putf(ctrl + 0x90, residual)
        putf(text_pane + 0x2c, row * 20 + residual)
        putf(bar + 0x10, 100)  # synthetic travel; source ratio code uses it
        putf(bar + 0x14, 0)
        put(word(0x154f90), hid)
        call(0x1290dc, bar, s0=(row * 20 + residual) / 1840)

    def activate(control):
        call(0x157df0, control, 1, 0, scene)
        return word(ctrl)

    mappings = []
    for control, expected in [(bar, 1), (touch, 2), (up, 5), (down, 6)]:
        setup()
        assert activate(control) == expected
        mappings.append(expected)

    samples = []
    for label, control, circle_y, expected in [
        ('up digital', up, 0, -4), ('down digital', down, 0, 4),
        ('up circle40', up, 40, -2), ('up circle81', up, 81, -8.1),
        ('down circle-40', down, -40, 2), ('down circle-81', down, -81, 8.1),
    ]:
        setup()
        m.mem_write(hid + 0xe, struct.pack('<h', circle_y))
        activate(control)
        call(0x153868, ctrl)
        result = snapshot()
        assert abs(result['paneY'] - (200 + expected)) < 0.0001, result
        assert result['state'] == 0  # source requires new activation while held
        samples.append({'input': label, **result})

    # Direct G_Touch sample: actual axis gate and delta path; no synthetic easing.
    setup()
    m.mem_write(touch + 0x31, b'\x00\x01')
    putf(touch + 0x54, -7)
    activate(touch)
    call(0x153868, ctrl)
    drag = snapshot()
    assert drag['paneY'] == 193 and drag['state'] == 0, drag

    # Native normalized scrollbar -> nearest row + signed fractional residual.
    setup()
    call(0x1290dc, bar, s0=0.375)
    activate(bar)
    call(0x153868, ctrl)
    scrollbar = snapshot()
    assert scrollbar['row'] == 35 and scrollbar['residual'] == -10, scrollbar
    assert scrollbar['paneY'] == 690 and scrollbar['state'] == 0, scrollbar

    # Explicit repeated callbacks, NOT a claim about OS/browser repeat cadence.
    setup()
    for _ in range(8):
        activate(down)
        call(0x153868, ctrl)
    repeated = snapshot()
    assert repeated['paneY'] == 232 and repeated['row'] == 12, repeated
    assert repeated['residual'] == -8, repeated

    bounds = []
    for row, control in [(0, up), (92, down)]:
        setup(row)
        activate(control)
        call(0x153868, ctrl)
        result = snapshot()
        assert result['paneY'] == row * 20 and result['residual'] == 0, result
        bounds.append(result)

    # State9 drains residual by exactly8px per update; initial interior state
    # deliberately injected to isolate this source path, not asserted user input.
    setup(10, 19)
    put(ctrl, 9)
    settle = []
    for _ in range(4):
        call(0x153868, ctrl)
        settle.append(snapshot())
    assert [s['residual'] for s in settle] == [11, 3, 0, 0], settle
    assert settle[-1]['state'] == 0
    return {'codeSha256': CODE_SHA, 'eventStates': mappings, 'movement': samples,
            'drag': drag, 'scrollbar': scrollbar, 'eightExplicitDownCallbacks': repeated,
            'bounds': bounds, 'settle': settle, 'interceptedSoundCalls': len(sound_events),
            'scope': 'Synthetic controller replay only; no scheduler, rich text, rendering or wall-clock fidelity claim.'}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--code', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    args = p.parse_args()
    assert args.code.is_absolute() and args.output.is_absolute()
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(f'Health scroll source replay passed: {args.output}')


if __name__ == '__main__':
    main()
