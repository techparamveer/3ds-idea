"""Replay Health style installation and prefix measurement using source font data.

The original ARM arithmetic runs with font virtual calls supplied from decoded
source font metadata. This does not execute font loading, GPU clipping or input.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from replay_health_scroll import CODE_SHA


def replay(code_path, font_path, pack_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    font = json.loads(font_path.read_text())
    pack = json.loads(pack_path.read_text())
    style = pack['styles']['message/EU_English/RI_mstl_LZ.bin']['styles'][2]
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x200000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x40000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    putf = lambda p, v: m.mem_write(p, struct.pack('<f', v))
    real = lambda p: struct.unpack('<f', m.mem_read(p, 4))[0]
    float_reg = lambda r: struct.unpack('<f', struct.pack('<I', m.reg_read(r)))[0]
    pane, style_obj, native_font, font_vtable = 0x1000000, 0x1001000, 0x1002000, 0x1003000
    pane_vtable, text, writer = 0x1004000, 0x1005000, 0x1006000
    stack, stop = 0x103d000, 0x103f000
    virtual = {offset: 0x1010000 + offset for offset in (8, 12, 0x24, 0x38, 0x48)}
    for offset, target in virtual.items(): put(font_vtable + offset, target)
    put(native_font, font_vtable)
    put(pane, pane_vtable)
    put(pane + 0xe0, native_font)
    put(pane_vtable + 0x70, 0x1010100)
    put(pane_vtable + 0x7c, 0x1010104)
    putf(style_obj + 0x18, style['fontScale'][1])
    putf(style_obj + 0x1c, style['fontScale'][0])
    putf(style_obj + 0x20, style['lineSpacing'])
    putf(style_obj + 0x24, style['characterSpacing'])
    prefix = ' ' * 14 + '△'
    m.mem_write(text, prefix.encode('utf-16le') + b'\0\0')
    advances = []
    scene, icon_pane = 0x1007000, 0x1008000

    def external(machine, address, size, data):
        value = None
        if address == 0x1290c8:
            ptr = machine.reg_read(UC_ARM_REG_R1)
            name = bytearray()
            while m.mem_read(ptr + len(name), 1)[0]: name.extend(m.mem_read(ptr + len(name), 1))
            value = icon_pane if name.startswith(b'SafeIcon_') else pane
        elif address == 0x12e6a8: value = style_obj
        elif address == 0x12e658: value = len(prefix)
        elif address == virtual[8]: value = font['width']
        elif address == virtual[12]: value = font['height']
        elif address == virtual[0x24]: value = font['lineFeed']
        elif address == virtual[0x48]: value = 1  # source UTF-16 encoding
        elif address == virtual[0x38]:
            ch = machine.reg_read(UC_ARM_REG_R1)
            value = font['glyphs'].get(str(ch), font['fallback'])['advance']
            advances.append({'codePoint': ch, 'advance': value})
        elif address in (0x1010100, 0x1010104): pass  # capacity/text setters
        else: return
        if value is not None: machine.reg_write(UC_ARM_REG_R0, value)
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
    m.hook_add(UC_HOOK_CODE, external)

    def call(address, *args, extras=(), floats=()):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args): m.reg_write(reg, value)
        for reg, value in zip((UC_ARM_REG_S0, UC_ARM_REG_S1), floats): m.reg_write(reg, struct.unpack('<I', struct.pack('<f', value))[0])
        for i, value in enumerate(extras): put(stack + i * 4, value)
        m.reg_write(UC_ARM_REG_SP, stack)
        m.reg_write(UC_ARM_REG_LR, stop)
        m.emu_start(address, stop, count=1000000)
        assert m.reg_read(UC_ARM_REG_PC) == stop

    # Original style install; external calls supply style and font metadata.
    putf(pane + 0xe4, 99)
    putf(pane + 0xe8, 88)
    call(0x113e6c, 0, 0, pane, text, extras=(0, 0, 0))
    installed = {'fontSize': [real(pane + 0xe4), real(pane + 0xe8)],
                 'lineSpacing': real(pane + 0xec), 'characterSpacing': real(pane + 0xf0)}
    assert abs(installed['fontSize'][0] - 15) < 0.00001
    assert installed['fontSize'][1] == 18 and installed['lineSpacing'] == 3
    assert installed['characterSpacing'] == 0
    assert m.mem_read(pane + 0xfd, 1)[0] & 4

    # Original writer initialization and scale conversion. Then execute the
    # complete native width path13f268->12c7b8->12c160, including UTF-16 iterator.
    call(0x13398c, writer)
    put(writer + 0x3c, native_font)
    call(0x12cdc8, writer, floats=installed['fontSize'])
    putf(writer + 0x50, installed['characterSpacing'])
    putf(writer + 0x54, installed['lineSpacing'])
    putf(writer + 0x4c, 284)
    call(0x13f268, writer, text, len(prefix))
    width = float_reg(UC_ARM_REG_S0)
    assert [event['codePoint'] for event in advances] == [ord(ch) for ch in prefix]
    f = lambda v: struct.unpack('<f', struct.pack('<f', v))[0]
    expected = 0
    for ch in prefix: expected = f(expected + f(font['glyphs'][str(ord(ch))]['advance'] * real(writer + 0x24)))
    assert width == expected, (width, expected)
    call(0x156c80, scene, 0)
    assert real(scene + 0x158) == 21
    putf(pane + 0x48, 284)
    icon_positions = []
    for index, height in [(0, 39), (0, 375), (1, 1049.7001953125)]:
        m.mem_write(icon_pane + 0xb7, b'\xb0')
        call(0x156db0, scene, index, text, floats=(height,))
        x, y = real(icon_pane + 0x28), real(icon_pane + 0x2c)
        assert x == f(width - 161) and y == f(102 - height)
        assert m.mem_read(icon_pane + 0xb7, 1)[0] == 0x81
        assert word(scene + 0xd0 + index * 16) == icon_pane
        icon_positions.append({'height': height, 'index': index, 'position': [x, y]})
    return {'codeSha256': CODE_SHA, 'fontSourceSha256': font['sourceSha256'],
            'fontJsonSha256': hashlib.sha256(font_path.read_bytes()).hexdigest(),
            'packSha256': hashlib.sha256(pack_path.read_bytes()).hexdigest(),
            'installedStyle': installed, 'writerScale': [real(writer + 0x24), real(writer + 0x28)],
            'prefixWidth': width, 'warningLocalX': f(width - 161), 'iconPositions': icon_positions, 'linePitch': real(scene + 0x158), 'fontCalls': advances,
            'scope': 'Original style setter, line pitch, writer init/scale, complete prefix measurement and icon writer; decoded source font virtual calls and style lookup are fixtures. No resource loader, clip, draw or input ownership replay.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'font', 'pack', 'output'): p.add_argument('--' + name, type=Path, required=True)
    args = p.parse_args()
    assert all(path.is_absolute() for path in (args.code, args.font, args.pack, args.output))
    report = replay(args.code, args.font, args.pack)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print('Health style and warning-prefix measurement replay passed')
