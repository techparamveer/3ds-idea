"""Execute Health's generic glyph emitter and outer control manager.

Uses source decoded font metrics, a repacked atlas-coordinate fixture, and the
original default tab/newline tag processor. Does NOT claim Health's rich-style
processor installation or GPU command generation/composition. Outer manager
callbacks are sinks; registration, ownership scan and teardown execute natively.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from replay_health_scroll import CODE_SHA


def replay(code_path, font_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    font = json.loads(font_path.read_text())
    assert font['sourceSha256'] == '95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581'
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x200000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x40000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    putf = lambda p, v: m.mem_write(p, struct.pack('<f', v))
    real = lambda p: struct.unpack('<f', m.mem_read(p, 4))[0]
    f32 = lambda v: struct.unpack('<f', struct.pack('<f', v))[0]
    writer, native_font, vtable, tag, text, cache = [0x1000000 + i * 0x1000 for i in range(6)]
    stack, stop = 0x103d000, 0x103f000
    virtual = {off: 0x1020000 + off for off in (8, 12, 16, 0x24, 0x38, 0x40, 0x48, 0x4c)}
    for off, target in virtual.items(): put(vtable + off, target)
    put(native_font, vtable)
    glyph_calls = []
    owner_mode, owner_calls, control_names = False, [], {}

    def external(machine, address, size, data):
        if owner_mode:
            if address in (0x1022000, 0x1022004):
                owner_calls.append(('update' if address == 0x1022000 else 'destroy', control_names[machine.reg_read(UC_ARM_REG_R0)]))
            elif address in (0x106068, 0x1398e8):
                machine.reg_write(UC_ARM_REG_R0, 1)
            else:
                return
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
            return
        values = {8: font['width'], 12: font['height'], 16: font['ascent'],
                  0x24: font['lineFeed'], 0x48: 1, 0x4c: font['baseline']}
        if address not in virtual.values(): return
        off = address - 0x1020000
        if off in values:
            machine.reg_write(UC_ARM_REG_R0, values[off])
        elif off == 0x38:
            ch = machine.reg_read(UC_ARM_REG_R1)
            machine.reg_write(UC_ARM_REG_R0, font['glyphs'].get(str(ch), font['fallback'])['advance'])
        elif off == 0x40:
            ptr, ch = machine.reg_read(UC_ARM_REG_R1), machine.reg_read(UC_ARM_REG_R2)
            glyph = font['glyphs'].get(str(ch), font['fallback'])
            # Native24-byte glyph result with decoded metrics. UV fixture uses
            # converted1024px atlas coordinates, not original native sheet layout.
            data = bytearray(24)
            struct.pack_into('<bbbB', data, 4, glyph['left'], glyph['width'], glyph['advance'], glyph['height'])
            struct.pack_into('<4H', data, 8, 1024, 1024, glyph['x'], glyph['y'])
            struct.pack_into('<I', data, 20, 0x1021000 + glyph['sheet'] * 4)
            machine.mem_write(ptr, bytes(data))
            glyph_calls.append(ch)
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
    m.hook_add(UC_HOOK_CODE, external)

    def call(address, *args, floats=()):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args): m.reg_write(reg, value)
        for reg, value in zip((UC_ARM_REG_S0, UC_ARM_REG_S1), floats): m.reg_write(reg, struct.unpack('<I', struct.pack('<f', value))[0])
        m.reg_write(UC_ARM_REG_SP, stack)
        m.reg_write(UC_ARM_REG_LR, stop)
        m.emu_start(address, stop, count=3000000)
        assert m.reg_read(UC_ARM_REG_PC) == stop, hex(m.reg_read(UC_ARM_REG_PC))

    call(0x1631a0, tag)  # original default processor constructor
    results = []
    for name, string, capacity in [('line-break', 'A\nB', 1000), ('width-wrap', 'A' * 30, 1000),
                                   ('cache-capacity', 'ABC', 1), ('default-not-rich', '\x0e\x00\x02\x02(A', 1000)]:
        call(0x13398c, writer)
        put(writer + 0x3c, native_font)
        put(writer + 0x60, tag)
        call(0x12cdc8, writer, floats=(15, 18))
        putf(writer + 0x4c, 284)
        putf(writer + 0x54, 3)
        put(writer + 0x44, cache)
        put(cache, capacity)
        call(0x152364, writer)
        m.mem_write(text, string.encode('utf-16le') + bytes(2))
        glyph_calls.clear()
        call(0x1629fc, writer, text, len(string))
        count = struct.unpack('<H', m.mem_read(cache + 4, 2))[0]
        records = []
        for i in range(count):
            ptr = cache + 0x20 + i * 44
            records.append({'size': [real(ptr), real(ptr + 4)], 'origin': [real(ptr + 8), real(ptr + 12)]})
        if name == 'line-break':
            assert glyph_calls == [65, 66] and count == 2
            assert records[0]['origin'] == [0, 0] and records[1]['origin'] == [f32(font['glyphs']['66']['left'] * f32(.6)), 21], records
            assert records[0]['size'] == [f32(17 * f32(.6)), -18]
        elif name == 'width-wrap':
            assert glyph_calls == [65] * 30 and count == 30
            assert [r['origin'][1] for r in records] == [0] * 27 + [21] * 3
            assert records[27]['origin'][0] == 0
        elif name == 'cache-capacity':
            assert glyph_calls == [65, 66, 67] and count == 1
        else:
            # Default handler consumes no rich-control payload. Its printable
            # words are emitted as glyphs; it cannot replace Health's binding.
            assert glyph_calls == [40, 65]
        results.append({'fixture': name, 'glyphCodePoints': list(glyph_calls), 'cachedCount': count,
                        'records': records, 'finalPen': [real(writer + 0x2c), real(writer + 0x30)]})
    # Execute registration, outer manager scan/dispatch and teardown. Control
    # update/destructor bodies are explicit sinks; system eligibility is true.
    owner_mode = True
    registry, gate, enabled = 0x1bd0cc, 0x174848, 0x174d70
    head = registry + 4
    put(registry, 0)
    put(head, head)
    put(head + 4, head)
    controls, owner_vtable = [0x1010000 + i * 0x100 for i in range(3)], 0x1011000
    put(owner_vtable + 8, 0x1022000)
    put(owner_vtable + 4, 0x1022004)
    for ptr, name in zip(controls, ('up', 'down', 'touch')):
        control_names[ptr] = name
        put(ptr, owner_vtable)
        call(0x155034, ptr)
    # Source inserts before first node; iteration order is reverse registration.
    m.mem_write(controls[0] + 0xc, b'\x01')
    put(gate + 0x14, 0)
    call(0x1015d4, 0)
    assert owner_calls == [('update', 'touch'), ('update', 'down'), ('update', 'up')]
    assert m.mem_read(gate, 1)[0] == 1
    scan_order = list(owner_calls)
    # With a nonzero owner suspension field no control callbacks run, but the
    # initial ownership scan still reconstructs the busy byte.
    owner_calls.clear()
    put(gate + 0x14, 1)
    m.mem_write(gate, b'\x00')
    call(0x1015d4, 0)
    assert owner_calls == [] and m.mem_read(gate, 1)[0] == 1
    put(gate + 0x14, 0)
    call(0x1015d4, 1)  # source suppression mask0x107
    assert owner_calls == []
    m.mem_write(controls[0] + 0xc, b'\x00')
    call(0x1015d4, 0)
    assert m.mem_read(gate, 1)[0] == 0
    owner_calls.clear()
    for offset in (8, 0x10, 0x14): put(gate + offset, 123)
    m.mem_write(gate, b'\x01')
    m.mem_write(enabled, b'\x01')
    call(0x10154c)
    assert owner_calls == [('destroy', 'touch'), ('destroy', 'up'), ('destroy', 'down')], owner_calls
    assert struct.unpack('<3I', m.mem_read(registry, 12)) == (0, head, head)
    assert m.mem_read(gate, 1)[0] == 0 and m.mem_read(enabled, 1)[0] == 1
    assert all(struct.unpack('<I', m.mem_read(gate + off, 4))[0] == 0 for off in (8, 0x10, 0x14))
    owner_report = {'reverseRegistrationOrder': scan_order, 'suspensionSkipsCallbacksButScansOwnership': True,
                    'inputMaskSuppression': '0x107', 'teardownOrder': list(owner_calls),
                    'teardownUnlinksAllAndClearsGlobalCallbackContextGate': True}
    return {'codeSha256': CODE_SHA, 'fontJsonSha256': hashlib.sha256(font_path.read_bytes()).hexdigest(),
            'cases': results, 'outerOwnerManager': owner_report, 'scope': 'Original1629fc/162a58 UTF16 iteration, width wrap, default tab/newline processor, baseline handling,1524b0/15207c cached record writer. Font virtual methods use decoded metrics and adapted UV fixtures. Original outer registration/owner scan/control iteration and teardown with callback sinks. No Health style binding, GPU upload, composition, actual touch/control bodies or scene-specific cancellation scheduling.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'font', 'output'): p.add_argument('--' + name, type=Path, required=True)
    args = p.parse_args()
    assert all(path.is_absolute() for path in (args.code, args.font, args.output))
    result = replay(args.code, args.font)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print('Health generic glyph-cache and outer owner-manager replay passed')
