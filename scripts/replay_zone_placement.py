"""Pinned source viewport and conditional HTML-root placement replay.

Unicorn 2.1.4; only mutex lock/unlock calls are intercepted. The DOM element,
paint origin, view-buffer viewport and zoom inputs are explicitly synthetic.
They are not an observed native HTML layout. No device services execute.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from audit_zone_projection import CODE_SHA256, arm_bl_target


def replay(code_path):
    code = code_path.read_bytes()
    if hashlib.sha256(code).hexdigest() != CODE_SHA256:
        raise ValueError('Unexpected Nintendo Zone code image')
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_R4,
        UC_ARM_REG_R5, UC_ARM_REG_R7, UC_ARM_REG_R8)
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x300000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x30000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    putf = lambda p, v: m.mem_write(p, struct.pack('<f', v))
    words = lambda p, n: list(struct.unpack('<'+'i'*n, m.mem_read(p, n*4)))
    floats = lambda p, n: list(struct.unpack('<'+'f'*n, m.mem_read(p, n*4)))
    sentinel, sp = 0x102f000, 0x102e000
    mutex_calls = []

    def mutex(machine, address, size, data):
        if address in (0x205a40, 0x2059f8):
            mutex_calls.append(hex(address))
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))

    m.hook_add(UC_HOOK_CODE, mutex)

    def call(start, args=(), stack=(), end=sentinel, stack_pointer=sp):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            m.reg_write(reg, value)
        for i, value in enumerate(stack):
            put(stack_pointer+i*4, value)
        m.reg_write(UC_ARM_REG_SP, stack_pointer)
        m.reg_write(UC_ARM_REG_LR, sentinel)
        m.emu_start(start, end, count=100000)
        if m.reg_read(UC_ARM_REG_PC) != end:
            raise AssertionError('Original source routine did not complete')

    bounds = 0x1000000
    viewports = []
    for screen in (0, 1):
        call(0x277c74, (0, screen, bounds, bounds+4), (bounds+8, bounds+12))
        rect = words(bounds, 4)
        viewports.append({'screen': screen, 'bounds': rect,
            'documentDimensions': [rect[2]-rect[0], rect[3]-rect[1]]})

    doc, element, paint, archive, layout, root, app, views, view = [0x1001000+i*0x1000 for i in range(9)]
    call(0x26d720, (doc+0x248,))
    scroll_initial = {'zoom': floats(doc+0x250, 1)[0],
        'scroll': floats(doc+0x254, 2), 'flags': words(doc+0x25c, 1)[0]}
    target, target_buffer = 0x100b000, 0x100c000
    put(target, target_buffer)
    put(target_buffer+0x90, 400)
    put(target_buffer+0x94, 220)
    call(0x268fe4, (element+0x2ec, 0x23c990, element))
    put(element+4, doc)
    put(element+0x344, archive)
    put(archive+0x24, layout)
    put(layout+0x4c, root)
    put(doc+0x2e4, 400)
    put(doc+0x2e8, 220)
    put(doc+0x2f4, 0x800000)  # Original document flag selects upper.
    put(0x2e57e0, app)
    put(app+0x38+0x4c, views)
    put(views, view)
    samples = []
    cases = [
        {'element': [0, 0, 400, 220], 'paintOrigin': [0, 0], 'viewport': [0, 20, 400, 240], 'zoom': None},
        {'element': [12, 8, 400, 220], 'paintOrigin': [12, 8], 'viewport': [0, 20, 400, 240], 'zoom': None},
        {'element': [12, 8, 400, 220], 'paintOrigin': [0, 0], 'viewport': [0, 20, 400, 240], 'zoom': None},
        {'element': [0, 0, 400, 220], 'paintOrigin': [0, 0], 'viewport': [0, 30, 400, 250], 'zoom': None},
        {'element': [0, 0, 400, 220], 'paintOrigin': [0, 0], 'viewport': [0, 20, 400, 240], 'zoom': 1.5},
    ]
    for case in cases:
        for i, value in enumerate(case['element']):
            put(element+0x38+i*4, value)
        for i, value in enumerate(case['paintOrigin']):
            putf(doc+0x254+i*4, value)
        # Execute the original paint-context setup, using document scroll fields.
        # The synthetic surface dimensions are 400x220; no DOM layout is run.
        for reg, value in ((UC_ARM_REG_R4, doc), (UC_ARM_REG_R5, 0),
                           (UC_ARM_REG_R7, target), (UC_ARM_REG_R8, 0)):
            m.reg_write(reg, value)
        call(0x1c12b4, end=0x1c12f8, stack_pointer=paint)
        for i, value in enumerate(case['viewport']):
            put(view+0x80+i*4, value)
        put(doc+0x25c, int(case['zoom'] is not None))
        putf(doc+0x250, case['zoom'] or 1)
        call(0x1bab2c, (element+0x2ec, target, paint, 2))
        samples.append({'syntheticInputs': case, 'rootTranslation': floats(root+0x28, 3)})
    return {'codeSha256': CODE_SHA256, 'nativeCapture': False,
        'actualResolvedHtmlInputsProven': False, 'viewports': viewports,
        'viewportCallbackPointer': hex(struct.unpack_from('<I', code, 0x2d5fd8-0x100000)[0]),
        'documentConstructorCall': hex(arm_bl_target(code, 0x225b4c)),
        'scrollConstructor': scroll_initial, 'paintDispatcher': '0x1bab2c',
        'conditionalRootSamples': samples, 'interceptedFunctions': sorted(set(mutex_calls)),
        'limits': ['Viewport callback constants are source-backed.',
            'DOM/paint/view-buffer/zoom input state is synthetic, not actual final placement.',
            'No renderer or GPU state is executed by this fixture.']}


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
    print(json.dumps({'output': str(args.output), 'actualResolvedHtmlInputsProven': False}))


if __name__ == '__main__':
    main()
