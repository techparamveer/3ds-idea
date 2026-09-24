"""Replay the Health article glyph stream, lower-screen composition and held-input frames.

Resolves the three gates left by the rich-style/cancellation audit:

1. Glyph stream: the original rebuild 0x14b3ec runs with the Health tag
   processor (0x127afc), the renderer constructor 0x10d4c4 and cache constructor
   0x152e60, through 0x1629fc and command-stream builder 0x152638, for every
   English article and every native buffer produced by original parser
   0x157724/0x1570f4. The emitted PICA words are decoded.
2. Clip/composition: a census of every executable site that can write scissor,
   stencil, depth/colour-mask or viewport registers, every store to the GL
   scissor/stencil state, the executed lower-screen pass setup 0x13978c and
   viewport 0x13a104, and the executed sorted layout registration 0x114230.
3. Held input: the real scrollbar, touch, key and controller constructors run,
   then each frame executes the control manager 0x1015d4 and scene update
   0x157c88 through press, hold, release, stylus overlap, clamps, a live buffer
   switch and the article-close teardown phases.

Fixtures are explicit: decoded shared-font metrics and a converted 1024px atlas
(UVs and texture identities are not native), synthetic HID memory in place of
HID sampling 0x13a5d0, zeroed pane objects returned by the layout-name lookup,
allocation/free, and an unbuilt SlideBar layout wrapper. No native frame,
rasterised pixel, browser output or wall-clock measurement is claimed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from replay_health_scroll import CODE_SHA
from replay_health_article import encoded

FONT_JSON_SHA = 'd48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27'
PACK_SHA = 'cb2cb2c1b396c80c9ccfed2352f0e8082f05a51f94e6091a4a1c83ae4ad5b5e1'
# Native buffers from original 0x157724/0x1570f4, as pinned by the rich-text audit.
BUFFER_SHA = {
    'article_1': ['84892ac4374b', '67a732fcb4a3', '67a732fcb4a3', '67a732fcb4a3', '67a732fcb4a3'],
    'article_2': ['a6858fd398bb', '538e7692cfe0', 'f997b0b2481b', 'f997b0b2481b', 'f997b0b2481b'],
    'article_3': ['42add9a84c93', '8076cdf12e05', '304e38233e39', '304e38233e39', '304e38233e39'],
}
CLIP_REGISTERS = {0x41, 0x42, 0x43, 0x44, 0x47, 0x48, 0x65, 0x66, 0x67, 0x68, 0x105, 0x106, 0x107, 0x114, 0x115}
# Every word in the executable shaped like a command header touching the registers above.
CLIP_WRITER_SITES = {
    **dict.fromkeys((0x107380, 0x107384, 0x107388), 'scissor consumer copy 0x1063f8; mode from GL state +0x648'),
    **dict.fromkeys((0x116340, 0x116344, 0x116348), 'scissor consumer 0x11537c; mode from GL state +0x648'),
    **dict.fromkeys((0x11a5e0, 0x11a5e4, 0x11a610), 'GL viewport flush'),
    **dict.fromkeys((0x132a10, 0x132a14, 0x132a3c), 'GL framebuffer bind 0x1326ec viewport'),
    0x132a44: 'GL framebuffer bind 0x1326ec depth/colour mask',
    **dict.fromkeys((0x132cf8, 0x132d00), 'GL stencil flush 0x1326ec; enabled only by GL state +0x64f'),
    **dict.fromkeys((0x13efb0, 0x13efb8, 0x13efc4, 0x13efc8, 0x13efcc, 0x13f004, 0x13f008),
                    'global default state 0x13e768 (scissor mode 0, stencil off)'),
    **dict.fromkeys((0x164078, 0x164090), 'viewport setter 0x13a124 template'),
    **dict.fromkeys((0x1640a8, 0x1640b0, 0x1640d0, 0x1640e8), 'lower/upper layout pass 0x13978c template'),
}
NOT_GPU_SITES = {0x13ff50: 'IPC header stored to the thread command buffer before svc 0x32 at 0x13ff2c',
                 0x175cf8: 'unreferenced UTF-16 data run'}


def decode(words):
    out, i = [], 0
    while i + 1 < len(words):
        value, header = words[i], words[i + 1]
        reg, extra, seq = header & 0x3ff, (header >> 20) & 0xff, header >> 31
        for k, v in enumerate([value] + words[i + 2:i + 2 + extra]):
            out.append((reg + (k if seq else 0), v, (header >> 16) & 0xf))
        n = 2 + extra
        i += n + (n & 1)
    return out


class Machine:
    def __init__(self, code):
        from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
        from unicorn import arm_const as a
        self.a, self.hook_kind = a, UC_HOOK_CODE
        self.m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        self.m.mem_map(0x100000, 0x200000)
        self.m.mem_write(0x100000, code)
        self.m.mem_map(0x1000000, 0x2000000)
        self.m.reg_write(a.UC_ARM_REG_C1_C0_2, 15 << 20)
        self.m.reg_write(a.UC_ARM_REG_FPEXC, 0x40000000)
        self.heap, self.stack, self.stop = 0x1100000, 0x10fd000, 0x10ff000
        self.args = (a.UC_ARM_REG_R0, a.UC_ARM_REG_R1, a.UC_ARM_REG_R2, a.UC_ARM_REG_R3)

    def hook(self, address, fn):
        a = self.a

        def run(m, pc, size, data):
            result = fn(self)
            if result is False: return
            if result is not True and result is not None: m.reg_write(a.UC_ARM_REG_R0, result & 0xffffffff)
            m.reg_write(a.UC_ARM_REG_PC, m.reg_read(a.UC_ARM_REG_LR))
        self.m.hook_add(self.hook_kind, run, begin=address, end=address)

    def put(self, p, v): self.m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    def putf(self, p, v): self.m.mem_write(p, struct.pack('<f', v))
    def word(self, p): return struct.unpack('<I', self.m.mem_read(p, 4))[0]
    def real(self, p): return struct.unpack('<f', self.m.mem_read(p, 4))[0]
    def byte(self, p): return self.m.mem_read(p, 1)[0]
    def arg(self, i): return self.m.reg_read(self.args[i])

    def alloc(self, size, zero=True):
        p = self.heap
        self.heap += (size + 31) & ~31
        if zero: self.m.mem_write(p, bytes(size))
        return p

    def call(self, address, *args, count=400000000):
        a = self.a
        for reg, value in zip(self.args, args): self.m.reg_write(reg, value & 0xffffffff)
        self.m.reg_write(a.UC_ARM_REG_SP, self.stack)
        self.m.reg_write(a.UC_ARM_REG_LR, self.stop)
        self.m.emu_start(address, self.stop, count=count)
        assert self.m.reg_read(a.UC_ARM_REG_PC) == self.stop, hex(self.m.reg_read(a.UC_ARM_REG_PC))
        return self.m.reg_read(a.UC_ARM_REG_R0)


def bl_target(code, address):
    w = struct.unpack_from('<I', code, address - 0x100000)[0]
    assert (w & 0x0f000000) == 0x0b000000, hex(address)
    offset = w & 0xffffff
    return address + 8 + ((offset - 0x1000000 if offset & 0x800000 else offset) << 2)


def census(code):
    """Whole-executable census of clip-related register writers and GL state stores."""
    sites = {}
    for off in range(0, len(code) - 3, 4):
        w = struct.unpack_from('<I', code, off)[0]
        b = struct.pack('<I', w)
        if b[1] == 0 and b[3] == 0 and 32 <= b[0] < 127 and 32 <= b[2] < 127: continue  # UTF-16 text
        mask, extra, reg = (w >> 16) & 0xf, (w >> 20) & 0xff, w & 0x3ff
        if w & 0x7000fc00 or mask not in (0xf, 0x3, 0x1) or extra > 0x10: continue
        span = range(reg, reg + (extra + 1 if w >> 31 else 1))
        if CLIP_REGISTERS.intersection(span):
            sites[0x100000 + off] = w
    assert set(sites) == set(CLIP_WRITER_SITES) | set(NOT_GPU_SITES), sorted(hex(s) for s in set(sites) ^ (set(CLIP_WRITER_SITES) | set(NOT_GPU_SITES)))
    # Immediate-offset stores into GL scissor enable/rect and stencil enable.
    stores = []
    for off in range(0, len(code) - 3, 4):
        w = struct.unpack_from('<I', code, off)[0]
        if (w & 0x0e100000) == 0x04000000 and (w & 0x01800000) == 0x01800000 and not (w & 0x00200000):
            if (w & 0xfff) in (0x648, 0x5e4, 0x5e8, 0x5ec, 0x5f0, 0x64f):
                stores.append((0x100000 + off, w & 0xfff, (w >> 12) & 0xf))
    assert [s[0] for s in stores] == [0x119550, 0x119554, 0x11955c, 0x119560, 0x119564, 0x1195a8], stores
    assert {s[2] for s in stores} == {4}
    assert not any(struct.unpack_from('<I', code, off)[0] == 0xc11 for off in range(0, len(code) - 3, 4))  # GL_SCISSOR_TEST
    return {'clipRegisterWriterLiterals': {hex(k): v for k, v in sorted(CLIP_WRITER_SITES.items())},
            'excludedNonGpuWords': {hex(k): v for k, v in NOT_GPU_SITES.items()},
            'glScissorStencilStores': [hex(s[0]) for s in stores]}


def gl_reset_zero(m):
    """Execute the complete GL-state reset, the only writer of scissor/stencil state."""
    state = m.alloc(0x900)
    m.m.mem_write(state, b'\xa5' * 0x900)
    m.call(0x1192f0, state)
    assert m.word(0x1751b4) == state
    return {hex(o): m.byte(state + o) if o in (0x648, 0x64f) else m.word(state + o)
            for o in (0x648, 0x5e4, 0x5e8, 0x5ec, 0x5f0, 0x64f)}


def pass_setup(m, code):
    packets = []

    def submit(mm):
        p, n = mm.arg(0), mm.arg(1)
        packets.append(list(struct.unpack('<%dI' % (n // 4), mm.m.mem_read(p, n))))
        return True
    m.hook(0x138164, submit)
    result = {}
    for screen in (0, 1):
        packets.clear()
        m.call(0x13978c, screen)
        regs = {r: v for p in packets for r, v, mask in decode(p)}
        assert regs[0x65] == 0 and regs[0x105] == 0 and regs[0x107] & 1 == 0 and regs[0x40] == 0
        assert regs[0x114] == 0 and regs[0x115] == 0 and regs[0x112] == 0xf and regs[0x113] == 0xf
        result[screen] = {hex(r): hex(v) for r, v in sorted(regs.items())}
    packets.clear()
    m.call(0x13a104)
    view = {r: v for p in packets for r, v, mask in decode(p)}
    assert view[0x68] == 0 and view[0x41] != 0 and view[0x43] != 0
    # 0x13a104 supplies w=320, h=240 at (0,0); 0x13ade4 supplies 400x240 for the upper screen.
    assert struct.unpack_from('<4I', code, 0x13a10c - 0x100000) == (0xe3a01000, 0xe8bd4010, 0xe3a030f0, 0xe3a02d05)
    # Frame routine: lower viewport, then both lower registered-layout passes.
    assert bl_target(code, 0x100c90) == 0x13a104
    assert bl_target(code, 0x100ca0) == 0x13a820 and bl_target(code, 0x100cb0) == 0x13a820
    assert bl_target(code, 0x13a8f0) == 0x13978c
    return {'layoutPassState': result, 'lowerViewport': {hex(r): hex(v) for r, v in sorted(view.items())}}


def registration(m, code):
    """Execute sorted registration 0x114230 and pin Health layout priorities/order."""
    lists = 0x1c1c7c
    for i in range(2):
        head = lists + i * 12 + 4
        m.put(lists + i * 12, 0); m.put(head, head); m.put(head + 4, head)
    wrappers = []
    for priority in (500, 500, 3, 9999, 500):
        w = m.alloc(0x80)
        m.put(w + 0x54, 0); m.put(w + 0x58, priority)
        m.call(0x114230, w)
        wrappers.append(w)
    order, node = [], m.word(lists + 4)
    while node != lists + 4:
        order.append(wrappers.index(node - 4)); node = m.word(node)
    assert order == [3, 0, 1, 4, 2], order  # descending priority, stable for equal priority
    # Health priorities (mov r2,#imm before 0x1334f8) and screens (r1).
    prio = {'SafeText_D_00': 0x1571cc, 'BtmBtn_White': 0x156f34, 'Bg_D_00': 0x157fe0, 'SlideBar': 0x157288}
    assert struct.unpack_from('<I', code, 0x1571cc - 0x100000)[0] == 0xe3a02f7d  # mov r2,#0x1f4
    assert struct.unpack_from('<I', code, 0x156f34 - 0x100000)[0] == 0xe3a02f7d
    assert struct.unpack_from('<I', code, 0x157fe0 - 0x100000)[0] == 0xe3a02f7d
    assert m.word(0x157288 + 8 + 0xd8) == 0x270f and m.word(0x13aaa4) == 0x2706
    # Scene create 0x157b44: vtable+0x34 (article init builds SafeText first) then +0x58 (BtmBtn_White).
    assert struct.unpack_from('<I', code, 0x157b50 - 0x100000)[0] == 0xe5901034
    assert struct.unpack_from('<I', code, 0x157b60 - 0x100000)[0] == 0xe5901058
    assert m.word(0x16cb34 + 0x34) == 0x157e88 and m.word(0x16cb34 + 0x38) == 0x157190 and m.word(0x16cb34 + 0x58) == 0x156ef8
    assert struct.unpack_from('<I', code, 0x157e94 - 0x100000)[0] == 0xe5901038
    return {'registrationOrderForPriorities[500,500,3,9999,500]': order,
            'healthPriorities': {'SafeText_D_00': 500, 'BtmBtn_White': 500, 'Bg_D_00': 500, 'SlideBar': 9999},
            'drawSkipsPriorityAtLeast': 0x2706,
            'lowerScreenOrder': ['Bg_D_00 (background scene, earlier)', 'SafeText_D_00', 'BtmBtn_White']}


class Writer:
    def __init__(self, m, font):
        self.m, self.font = m, font
        fvt, self.sheets, texvt, texobj = m.alloc(0x100), m.alloc(0x20 * 8), m.alloc(0x100), m.alloc(0x20)
        self.fontobj, self.proc, self.pane = m.alloc(0x20), m.alloc(0x80), m.alloc(0x200)
        self.rend, self.cache, self.text = m.alloc(0x800), m.alloc(0x800000, False), m.alloc(0x10000)
        thunk = 0x1ff0000
        for off in (8, 12, 16, 0x24, 0x38, 0x40, 0x48, 0x4c):
            m.put(fvt + off, thunk + off); m.hook(thunk + off, self._font(off))
        m.put(self.fontobj, fvt)
        m.put(texobj, texvt); m.put(texvt + 0x64, thunk + 0x100); m.hook(thunk + 0x100, lambda mm: 0)
        for k in range(len(font['sheets'])):
            s = self.sheets + k * 0x20
            m.put(s + 4, texobj); m.put(s + 8, 0x18000000 + k * 0x80000)
            m.put(s + 0xc, (1024 << 16) | 1024); m.m.mem_write(s + 0x10, bytes([font['textureFormat']]))
        m.call(0x127afc, self.proc)
        assert m.word(self.proc) == 0x16c734
        # Renderer Initialize fixes uniform indices 0/6/0x20/0x40 (0x113dbc..0x113df0).
        assert [m.word(a) for a in (0x113dbc, 0x113dd8, 0x113de0, 0x113df0)] == [0xe3a00102, 0xe3a0011a, 0xe3a00182, 0xe2800020]
        self.glyphs = []

    def _font(self, off):
        def run(m):
            f = self.font
            fixed = {8: f['width'], 12: f['height'], 16: f['ascent'], 0x24: f['lineFeed'], 0x48: 1, 0x4c: f['baseline']}
            if off in fixed: return fixed[off]
            if off == 0x38: return f['glyphs'].get(str(m.arg(1)), f['fallback'])['advance']
            ptr, ch = m.arg(1), m.arg(2)
            g = f['glyphs'].get(str(ch), f['fallback'])
            d = bytearray(24)
            struct.pack_into('<bbbB', d, 4, g['left'], g['width'], g['advance'], g['height'])
            struct.pack_into('<4H', d, 8, 1024, 1024, g['x'], g['y'])
            struct.pack_into('<I', d, 20, self.sheets + g['sheet'] * 0x20)
            m.m.mem_write(ptr, bytes(d))
            self.glyphs.append(ch)
            return True
        return run

    def run(self, raw, capacity=16384):
        m = self.m
        self.glyphs = []
        m.m.mem_write(self.rend, bytes(0x800))
        m.call(0x10d4c4, self.rend)
        for off, index in ((0x28, 0x80000000), (0x88, 0x80000006), (0x238, 0x80000020), (0x448, 0x80000040)):
            m.put(self.rend + off, index); m.put(self.rend + off + 4, 0xf02c0)
        m.m.mem_write(self.cache, bytes(0x40))
        m.call(0x152e60, self.cache, capacity)
        m.m.mem_write(self.text, raw + b'\0\0')
        p = self.pane
        m.m.mem_write(p, bytes(0x200))
        m.put(p + 0xd4, self.text); m.m.mem_write(p + 0xfa, struct.pack('<H', len(raw) // 2))
        m.put(p + 0xe0, self.fontobj); m.putf(p + 0xe4, 15); m.putf(p + 0xe8, 18)
        m.putf(p + 0xec, 3); m.putf(p + 0xf0, 0); m.putf(p + 0x48, 284)
        m.put(p + 0xf4, self.proc); m.m.mem_write(p + 0xfd, b'\x04')
        m.put(p + 0xd8, 0xff323232); m.put(p + 0xdc, 0xff323232)
        m.put(p + 0x104, self.cache)
        m.call(0x14b3ec, p, self.rend)
        count = struct.unpack('<H', m.m.mem_read(self.cache + 4, 2))[0]
        assert count == len(self.glyphs) and m.byte(self.cache + 8) == 1 and m.byte(p + 0xfd) & 4 == 0
        words, base = m.word(self.cache + 0x14), m.word(self.cache + 0x10)
        stream = list(struct.unpack('<%dI' % words, m.m.mem_read(base, words * 4)))
        records = [struct.unpack('<4f2I4fI', m.m.mem_read(self.cache + 0x20 + i * 44, 44)) for i in range(count)]
        return stream, records


def parse(m, bank, label):
    tokens = bank['messages'][bank['labels'][label]]['tokens']
    raw = encoded(tokens)
    scene, pane, vtable, message = m.alloc(0x400), m.alloc(0x200), m.alloc(0x100), m.alloc(len(raw) + 16)
    m.m.mem_write(message, raw + b'\0\0')
    state = {'raw': raw, 'message': message, 'pane': pane}
    m.put(scene, vtable); m.put(vtable + 0x40, 0x156db0); m.put(vtable + 0x4c, 0x1570f4)
    m.putf(pane + 0xe8, 18); m.putf(pane + 0xec, 3); m.putf(scene + 0x158, 21)
    PARSER_STATE.update(state)
    m.call(0x157724, scene, 0)
    buffers = []
    for slot in range(5):
        n = m.word(scene + 0x138 + slot * 4)
        b = bytes(m.m.mem_read(m.word(scene + 0x124 + slot * 4), n * 2))
        assert hashlib.sha256(b).hexdigest()[:12] == BUFFER_SHA[label][slot], (label, slot)
        buffers.append(b)
    return buffers, m.word(scene + 0xcc)


PARSER_STATE = {}


def install_parser_services(m):
    m.hook(0x133154, lambda mm: PARSER_STATE['message'])
    m.hook(0x12e658, lambda mm: len(PARSER_STATE['raw']) // 2)
    m.hook(0x127eb4, lambda mm: 0)
    m.hook(0x1290c8, lambda mm: PARSER_STATE['pane'])
    m.hook(0x13864c, lambda mm: mm.alloc(mm.arg(0)))
    m.hook(0x133ed8, lambda mm: mm.m.mem_write(mm.arg(0), bytes(mm.m.mem_read(mm.arg(1), mm.arg(2)))) or True)
    m.hook(0x1338e0, lambda mm: mm.m.mem_write(mm.arg(0), bytes(mm.arg(1))) or True)
    m.hook(0x1385d4, lambda mm: True)
    m.hook(0x13317c, lambda mm: True)
    m.hook(0x156db0, lambda mm: True)


def glyph_streams(m, font, bank):
    install_parser_services(m)
    w = Writer(m, font)
    report = {}
    allowed = {0x6f, 0x80, 0x82, 0x83, 0x85, 0x8e, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xf0, 0xf1, 0xf2, 0xf3, 0xf4,
               0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0x100, 0x101, 0x104, 0x111, 0x227, 0x228, 0x22e, 0x231, 0x245,
               0x253, 0x25e, 0x2b1, 0x2c0, 0x2c1}
    for label in ('article_1', 'article_2', 'article_3'):
        buffers, rows = parse(m, bank, label)
        tokens = bank['messages'][bank['labels'][label]]['tokens']
        U = lambda s: s.encode('utf-16le')
        document = (U('\n') + encoded(tokens) + U('\n\n')).replace(U('△'), U('\u3000'))
        assert buffers[0] == document or len(buffers[0]) < len(document)
        stream, full = w.run(document)
        writes = decode(stream)
        registers = {r for r, v, mask in writes}
        assert registers <= allowed and not registers & CLIP_REGISTERS, sorted(hex(r) for r in registers)
        assert all(v == 0x3000000 or r != 0x126 for r, v, mask in writes)
        max_right = max(r[2] + r[0] for r in full)
        assert max_right < 284  # no width wrap: every line fits the 284px pane width
        max_scroll = max(rows - 8, 0) * 21
        slots = []
        for j, buffer in enumerate(buffers):
            low = 4200 * j
            if low > max_scroll: break
            high = min(4200 * j + 4199, max_scroll)
            band = (low - 30, high + 212)
            buffer_stream, records = w.run(buffer)
            assert not {r for r, v, mask in decode(buffer_stream)} & CLIP_REGISTERS
            inside = lambda rs: sorted(r for r in rs if band[0] <= r[3] <= band[1])
            assert inside(records) == inside(full), (label, j)
            slots.append({'buffer': j, 'scrollRange': [low, high], 'glyphsInVisibleBand': len(inside(records))})
        report[label] = {'rows': rows, 'maxScroll': max_scroll, 'documentGlyphs': len(full),
                         'documentStreamWords': len(stream), 'registers': [hex(r) for r in sorted(registers)],
                         'maxGlyphRight': max_right, 'buffersIdenticalToDocumentInVisibleBand': slots,
                         'firstGlyphs': [{'size': r[:2], 'origin': r[2:4], 'colors': [hex(r[4]), hex(r[5])]} for r in full[:3]]}
    return report


def frames(m):
    """Real scrollbar/touch/key/controller construction, then manager + scene update per frame."""
    panes = {}

    def cstr(p):
        out = bytearray()
        while m.byte(p + len(out)): out.append(m.byte(p + len(out)))
        return out.decode('latin1')

    def lookup(mm):
        name = cstr(mm.arg(1))
        if name not in panes:
            panes[name] = mm.alloc(0x200)
            mm.m.mem_write(panes[name] + 0xb7, b'\x81')
        return panes[name]
    resources = m.alloc(0x100)
    freed = []
    m.hook(0x139598, lambda mm: mm.alloc(mm.arg(0)))
    m.hook(0x139588, lambda mm: freed.append(mm.arg(0)) or True)
    m.hook(0x127eb4, lambda mm: 0)
    m.hook(0x127ec0, lambda mm: resources)
    m.hook(0x1290c8, lookup)
    m.hook(0x1332e8, lambda mm: mm.alloc(0x100))
    m.hook(0x1334f8, lambda mm: mm.arg(0))
    m.hook(0x1333bc, lambda mm: True)
    m.hook(0x123f8c, lambda mm: True)
    empty_group = m.alloc(0x40)
    m.put(empty_group + 0x10, empty_group + 0x10)
    m.hook(0x112630, lambda mm: empty_group)  # held stylus resolves no article pane (stylus elsewhere)
    sounds = []
    m.hook(0x12f4f8, lambda mm: sounds.append(mm.arg(1)) or True)
    events = []
    m.hook(0x157df0, lambda mm: events.append((mm.arg(0), mm.arg(1))) or False)
    registry, gate, hid_globals = 0x1bd0cc, 0x174848, 0x174a88
    assert m.word(0x156734) == hid_globals and m.word(0x154f90) == hid_globals + 0x10
    m.put(registry, 0); m.put(registry + 4, registry + 4); m.put(registry + 8, registry + 4)
    m.put(0x1c2020, 0); m.put(0x1c2024, 0x1c2024); m.put(0x1c2028, 0x1c2024)
    scene, layout = m.alloc(0x400), m.alloc(0x200)
    rows = 334
    m.put(scene + 0x7c, layout); m.put(scene + 0xcc, rows); m.putf(scene + 0x158, 21)
    m.call(0x15724c, scene)   # scrollbar control 0x155664 (SlideBar layout build is a fixture)
    m.call(0x157684, scene)   # G_Touch control 0x154560
    m.call(0x1573ec, scene)   # Up/Down keys 0x154b48 and controller 0x153c9c
    m.call(0x127d7c, 0x157df0, scene)  # scene-create tail installs the event callback
    controller = m.word(scene + 0x9c)
    names = {m.word(scene + 0x8c): 'scrollbar', m.word(scene + 0x90): 'touch', m.word(scene + 0x94): 'up', m.word(scene + 0x98): 'down'}

    def registered():
        out, node = [], m.word(registry + 4)
        while node != registry + 4:
            out.append(names.get(node - 4, hex(node - 4))); node = m.word(node)
        return out
    order = registered()
    assert order == ['down', 'up', 'touch', 'scrollbar'], order
    assert [m.word(controller + o) for o in (4, 8, 0xc)] == [rows, 8, 0] and m.real(controller + 0x24) == 21
    down, up = m.word(scene + 0x98), m.word(scene + 0x94)
    assert [m.word(down + 0x6c), m.word(down + 0x70), m.word(down + 0x64)] == [0, 1, 0x80]
    hid = m.alloc(0x40)
    m.put(hid_globals + 0x10, hid)
    text = panes['N_TextArea']

    def frame(held=0, pressed=0, released=0, stylus=0):
        m.put(hid, held); m.put(hid + 4, pressed); m.put(hid + 8, released)
        m.m.mem_write(hid_globals + 1, bytes([stylus]))
        m.put(gate + 0x14, 0)
        events.clear()
        m.call(0x1015d4, 0)
        exit_requested = m.call(0x157c88, scene)
        return {'paneY': m.real(text + 0x2c), 'events': [(names.get(c, hex(c)), e) for c, e in events],
                'busy': m.byte(gate), 'downOwns': m.byte(down + 0xc), 'exit': exit_requested}
    log = []
    held = [frame(0x80, 0x80)] + [frame(0x80) for _ in range(9)] + [frame(0, 0, 0x80), frame()]
    assert [f['paneY'] for f in held] == [4.0 * i for i in range(1, 11)] + [40.0, 40.0]
    assert all(f['events'] == [('down', 1)] for f in held[:10]) and held[10]['events'] == [] and held[11]['busy'] == 0
    log.append({'scenario': 'Down press, 9 held frames, release, idle', 'paneY': [f['paneY'] for f in held]})
    stylus = [frame(0x80, 0x80), frame(0x80, stylus=1), frame(0x80, stylus=1), frame(0x80), frame(0, 0, 0x80)]
    assert [f['paneY'] for f in stylus] == [44.0, 44.0, 44.0, 48.0, 48.0]
    assert stylus[1]['downOwns'] == 1 and stylus[1]['busy'] == 1 and stylus[1]['events'] == []
    log.append({'scenario': 'Down held with stylus held outside the article on frames 2-3 (key pauses, ownership retained)',
                'paneY': [f['paneY'] for f in stylus]})
    top = [frame(0x40, 0x40)] + [frame(0x40) for _ in range(15)] + [frame(0, 0, 0x40)]
    assert top[11]['paneY'] == 0.0 and top[-1]['paneY'] == 0.0
    log.append({'scenario': 'Up held from 48px to the top clamp', 'paneY': [f['paneY'] for f in top]})
    visible = lambda: [n for n in ('TextArea_00', 'TextArea_01') if n in panes and m.byte(panes[n] + 0xb7) & 1]
    series, switched = [frame(0x80, 0x80)], None
    while True:
        f = frame(0x80)
        series.append(f)
        if switched is None and f['paneY'] >= 4200: switched = (f['paneY'], visible())
        if len(series) > 3 and series[-1]['paneY'] == series[-2]['paneY']: break
    frame(0, 0, 0x80)
    end = series[-1]['paneY']
    assert end == (rows - 8) * 21 and switched[0] == 4200.0 and switched[1] == ['TextArea_01'], (end, switched)
    log.append({'scenario': 'Down held to the bottom clamp', 'frames': len(series), 'bufferSwitchAt': switched[0],
                'visibleAfterSwitch': switched[1], 'clamp': end})
    frame(0x40, 0x40)
    before = frame(0x40)
    assert before['downOwns'] == 0 and m.byte(up + 0xc) == 1 and before['busy'] == 1
    m.put(scene + 0x88, 0)  # SlideBar layout wrapper was never built in this replay
    m.call(0x1575a8, scene)  # teardown phase vtable+0x64: scrollbar, touch, keys, controller
    assert registered() == [] and m.word(registry) == 0
    after = []
    for _ in range(2):
        m.put(hid, 0x40); m.put(gate + 0x14, 0); events.clear()
        m.call(0x1015d4, 0)
        after.append((m.byte(gate), list(events)))
    # With no owner left, the manager forwards the held button as generic event 5 with no control;
    # the scene callback returns at 0x157df4 for every event other than 1.
    assert after == [(0, [(0, 5)]), (0, [(0, 5)])], after
    assert struct.unpack('<2I', m.m.mem_read(0x157df0, 8)) == (0xe3510001, 0x1a000008)
    log.append({'scenario': 'Up held, then article teardown 0x1575a8', 'registeredAfter': [], 'busyAfterNextScan': 0,
                'controlEventsAfterClose': 0, 'genericHeldButtonEventIgnoredByCallback': 5})
    return {'registeredUpdateOrder': order, 'controller': {'rows': rows, 'viewportRows': 8, 'extraRows': 0, 'linePitch': 21},
            'keyRepeat': {'delayUpdates': 0, 'intervalUpdates': 1, 'mask': '0x80'}, 'scenarios': log,
            'digitalDisplacementPerUpdate': 4, 'soundCalls': len(sounds)}


def replay(code_path, font_path, pack_path):
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    font_bytes, pack_bytes = font_path.read_bytes(), pack_path.read_bytes()
    assert hashlib.sha256(font_bytes).hexdigest() == FONT_JSON_SHA
    assert hashlib.sha256(pack_bytes).hexdigest() == PACK_SHA
    font = json.loads(font_bytes)
    bank = json.loads(pack_bytes)['messages']['safe_msbt_LZ']
    report = {'codeSha256': CODE_SHA, 'fontJsonSha256': FONT_JSON_SHA, 'packSha256': PACK_SHA}
    report['census'] = census(code)
    m = Machine(code)
    report['glStateResetValues'] = gl_reset_zero(m)
    assert all(v == 0 for v in report['glStateResetValues'].values())
    report['passSetup'] = pass_setup(m, code)
    report['registration'] = registration(Machine(code), code)
    report['glyphStreams'] = glyph_streams(Machine(code), font, bank)
    report['frames'] = frames(Machine(code))
    report['frameSchedule'] = {
        'mainLoop': '0x1007f0: update 0x100d34 then render 0x100bf8, repeated',
        'update': ['0x13a5d0 HID sample', '0x1028a8', '0x1015d4 control manager', '0x102f4c scene update (state6 vtable+0x20 = 0x157c88)'],
        'render': ['0x13ade4 upper viewport', 'upper layouts', '0x13a104 lower viewport 320x240', '0x13a820 lower layouts (priority>=5000, then <5000)',
                   '0x100ef8 -> 0x13a7dc(0x402) -> 0x110b40 waits until both LCD VBlank counters advance'],
    }
    for address, target in ((0x1007f4, 0x100d34), (0x10081c, 0x100bf8), (0x100d44, 0x13a5d0), (0x100d5c, 0x1015d4),
                            (0x100d68, 0x102f4c), (0x100cc8, 0x100ef8), (0x13a7e8, 0x110b40)):
        assert bl_target(code, address) == target, hex(address)
    report['scope'] = ('Original glyph emission for all English article buffers with decoded font metrics and converted atlas UVs; '
                       'whole-executable clip-register and GL scissor/stencil store census; executed lower-pass setup, viewport and sorted registration; '
                       'integrated real control construction, manager traversal and scene update with synthetic HID. '
                       'Not claimed: native sheet texture identity, vertex-shader rasterisation, native frames, touch release/inertia, '
                       'scrollbar thumb geometry or drag, wall-clock timing under load, browser output.')
    return report


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'font', 'pack', 'output'): p.add_argument('--' + name, type=Path, required=True)
    args = p.parse_args()
    assert all(path.is_absolute() for path in (args.code, args.font, args.pack, args.output))
    result = replay(args.code, args.font, args.pack)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print('Health live-scroll glyph stream, composition and held-input replay passed')
