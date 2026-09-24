"""Replay pinned Nintendo Zone camera math and pass-entry reset in Unicorn 2.1.4.

Synthetic memory contains the proven 320x240 parent canvas and explicit slider
inputs. No camera instructions are replaced; no service, device or GPU executes.
This is a source arithmetic fixture, not a native screenshot or full render pass.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from audit_zone_projection import CODE_SHA256


def replay(code_path):
    code = code_path.read_bytes()
    if hashlib.sha256(code).hexdigest() != CODE_SHA256:
        raise ValueError('Unexpected Nintendo Zone code image')
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x300000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x30000)
    m.mem_map(0x1ff81000, 0x1000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v))
    putf = lambda p, v: m.mem_write(p, struct.pack('<f', v))
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    floats = lambda p, n: list(struct.unpack('<' + 'f'*n, m.mem_read(p, 4*n)))
    page, context, sentinel, sp = 0x1000000, 0x1001000, 0x102f000, 0x102e000
    draw_info = context + 0x2e0
    put(0x2e69fc, context)
    putf(page + 4 + 0x18, 320)
    putf(page + 4 + 0x1c, 240)

    def call(start, args=(), fp_args=(), stack=(), end=sentinel):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            m.reg_write(reg, value)
        for reg, value in zip((UC_ARM_REG_S0, UC_ARM_REG_S1), fp_args):
            m.reg_write(reg, struct.unpack('<I', struct.pack('<f', value))[0])
        for i, value in enumerate(stack):
            put(sp + 4*i, value)
        m.reg_write(UC_ARM_REG_SP, sp)
        m.reg_write(UC_ARM_REG_LR, sentinel)
        m.emu_start(start, end, count=100000)
        if m.reg_read(UC_ARM_REG_PC) != end:
            raise AssertionError('Original source routine did not complete')

    call(0x21fecc, (page,))
    before = {'projection': floats(draw_info + 4, 16), 'view': floats(draw_info + 0x44, 12)}
    camera_frustum = floats(page + 0x40, 24)
    lp, lv, rp, rv = 0x1002000, 0x1002100, 0x1002200, 0x1002300
    samples = []
    # Positive finite calibration values are synthetic, not a claimed CFG block.
    # At slider zero, varying them must leave the returned matrices identical.
    for display_width, separation in ((100, 5), (200, 10), (400, 0)):
        for slider, status in ((0, 0), (1, 1)):
            putf(0x3ee734 + 0xc, display_width)
            putf(page + 0x40 + 0x48, separation)
            putf(0x1ff81080, slider)
            m.mem_write(0x1ff81084, bytes((status,)))
            call(0x1a8d68, (page + 0x40, lp, lv, rp),
                 (289.84271240234375, 1), (rv, 1))
            samples.append({'syntheticDisplayWidth': display_width, 'syntheticSeparation': separation,
                'slider': slider, 'sliderDisabledStatus': status,
                'leftProjection': floats(lp, 16), 'rightProjection': floats(rp, 16),
                'leftView': floats(lv, 12), 'rightView': floats(rv, 12),
                'leftProjectionBits': [hex(v) for v in struct.unpack('<16I', m.mem_read(lp, 64))]})

    # Execute only the bounded GL reset body, excluding query/context setup and
    # later render scheduling. Force cached-state writes so the packet is visible.
    ctx, buffer = 0x1004000, 0x1005000
    put(0x2e79e0, ctx)
    put(0x2e79d4, buffer)
    put(0x2e79d8, buffer + 0x2000)
    put(0x2e79e8, 0x1fff)
    m.mem_write(ctx + 0xc, b'\x01')
    call(0x122730, end=0x12277c)
    end = word(0x2e79d4)
    packet = list(struct.unpack('<' + 'I'*((end-buffer)//4), m.mem_read(buffer, end-buffer)))
    return {'codeSha256': CODE_SHA256, 'nativeCapture': False, 'rasterValidated': False,
        'beforeStereo': before, 'cameraFrustum': camera_frustum, 'zeroStereoSamples': samples,
        'passEntryReset': {'depthColorShadow': hex(word(0x2e79e8)),
            'commands': [hex(v) for v in packet], 'scope': '0x122730..0x12277c only'},
        'limits': ['Calibration memory is synthetic; zero-slider invariance is tested.',
            'Ordered service state and framebuffer-readback synchronization after pass entry are not replayed.',
            'HTML root placement, final scissor and picture shader raster remain unresolved.']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    if not args.code.is_absolute() or not args.output.is_absolute():
        parser.error('Use absolute paths')
    report = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'output': str(args.output), 'samples': len(report['zeroStereoSamples']),
                      'rasterValidated': False}))


if __name__ == '__main__':
    main()
