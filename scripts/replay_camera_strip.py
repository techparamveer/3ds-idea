"""Replay Camera browse strip configuration, key selection and preview deferral.

Requires unicorn==2.1.4 and the hash-pinned private EUR Camera code.bin.
Original instructions run unpatched. Intercepts are limited to the sound-effect
request, item lookup, the owner's virtual event dispatcher and the thumbnail
cell writer; each is recorded in the report. This is not a renderer, decoder,
wall-clock or native screen capture.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from audit_camera_grid import CODE_SHA

LEFT, RIGHT, UP, DOWN = 0x100, 0x80, 0x200, 0x400
SE, LOOKUP, EVENT, WRITER = 0x220898, 0x1fd048, 0x1030000, 0x2d804c


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (
        UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC, UC_ARM_REG_R0, UC_ARM_REG_R1,
        UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_R4, UC_ARM_REG_SP,
        UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_FP, UC_ARM_REG_S0,
        UC_ARM_REG_S16, UC_ARM_REG_S17,
    )
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x420000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x40000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    word = lambda a: struct.unpack('<I', m.mem_read(a, 4))[0]
    half = lambda a: struct.unpack('<H', m.mem_read(a, 2))[0]
    byte = lambda a: m.mem_read(a, 1)[0]
    real = lambda a: struct.unpack('<f', m.mem_read(a, 4))[0]
    put = lambda a, v: m.mem_write(a, struct.pack('<I', v & 0xffffffff))
    put_half = lambda a, v: m.mem_write(a, struct.pack('<H', v & 0xffff))
    put_real = lambda a, v: m.mem_write(a, struct.pack('<f', v))
    stop = 0x103f000
    log = []
    folder_items = set()

    def hook(machine, address, size, data):
        # Intercepted leaf services return immediately to their caller.
        if address == SE:
            log.append(('se',))
        elif address == LOOKUP:
            index = machine.reg_read(UC_ARM_REG_R1)
            machine.reg_write(UC_ARM_REG_R0, 0x1020000 + (index & 0xff) * 16)
        elif address == EVENT:
            sp = machine.reg_read(UC_ARM_REG_SP)
            event = struct.unpack('<I', machine.mem_read(machine.reg_read(UC_ARM_REG_R1) + 4, 4))[0]
            log.append(('event', event, machine.reg_read(UC_ARM_REG_R2)))
            del sp
        elif address == WRITER:
            sp = machine.reg_read(UC_ARM_REG_SP)
            real_item, ready, _ = struct.unpack('<III', machine.mem_read(sp, 12))
            log.append(('cell', machine.reg_read(UC_ARM_REG_R2), machine.reg_read(UC_ARM_REG_R3), real_item, ready))
        else:
            return
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
    m.hook_add(UC_HOOK_CODE, hook)

    def call(address, *args, stack=()):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            m.reg_write(reg, value & 0xffffffff)
        sp = 0x103e000
        for i, value in enumerate(stack):
            put(sp + 4 * i, value)
        m.reg_write(UC_ARM_REG_SP, sp)
        m.reg_write(UC_ARM_REG_LR, stop)
        m.emu_start(address, stop, count=500000)
        assert m.reg_read(UC_ARM_REG_PC) == stop

    # Object graph: BrowseThumbnail T, browse wrapper B=T+0x64 (0x2d1274 tail
    # call), LytSlider S=B+0x30, owner O=T+0x60=T+0x11c=T+0x28c (constructor
    # 0x2d612c stores the same owner), metadata owner from literal 0x1fcec8.
    T, S, O, META, KEYS, VT = 0x1000000, 0x1002000, 0x1004000, 0x100b000, 0x1010000, 0x1011000
    B = T + 0x64
    for offset in (0x60, 0x11c, 0x28c):
        put(T + offset, O)
    put(B + 0x30, S)
    put(T + 0x138, 0x1024000)  # renderer (T+0x120) mapping table, empty
    put(T, VT)
    put(VT + 0x58, EVENT)
    put(word(0x1fcec8), META)
    put(0x42d748, KEYS)  # input manager global read by 0x2ce810
    assert word(0x2cea00) == 0x42d748 and word(0x2cea04) == 0x2232
    for i in range(256):
        put_half(0x1020000 + i * 16 + 8, 0x8000 if i in folder_items else 0)
        put_half(0x1021000 + i * 2, i)

    def configure(count):
        pages = max(1, (count + 5) // 6)
        m.mem_write(S, bytes(0x300))
        m.mem_write(O, bytes(0x6000))
        m.mem_write(T + 0x3a0, bytes(0x100))
        for offset in (0x60, 0x11c, 0x28c):
            put(T + offset, O)
        m.mem_write(O + 0x34, struct.pack('<HHH', count, count, 0))
        put_half(O + 0x2232, 0)
        put(O + 0x223c, 0)  # large density
        # Item order (+0x24, halfwords) and 16-byte item records (+0x18);
        # record +8 bit 15 distinguishes folders. Identity order, photos only.
        put(O + 0x24, 0x1021000)
        put(O + 0x18, 0x1020000)
        # Photo metadata containers (+8, +0x30): 8-byte records at +0x18.
        put(O + 8, 0x1022000)
        put(O + 0x30, 0x1022000)
        put(0x1022000 + 0x18, 0x1023000)
        put_real(O + 0x2500, 248.0)  # PageRengeL width used by 0x1fda24
        put_real(O + 0x2268, 228.0)  # PicPosRengeL width
        call(0x1fd910, B, 0, pages, 0)
        return pages

    configs = []
    for count in (1, 6, 7, 12, 13, 30):
        pages = configure(count)
        bounds = [real(S + 0x64), real(S + 0x68), real(S + 0x6c), real(S + 0x70)]
        configs.append({'itemCount': count, 'pages': pages, 'dragBounds': bounds[:2],
                        'anchorBounds': bounds[2:], 'pageWidth': word(S + 0x80),
                        'margin': word(S + 0x84), 'pitch': word(S + 0x88),
                        'maxAnchor': word(S + 0x8c), 'fraction': real(S + 0xb8),
                        'threshold': real(S + 0xbc)})
        assert bounds[1] == bounds[3] == (pages - 1) * 248 and bounds[0] == bounds[2] == 0
        assert (word(S + 0x80), word(S + 0x84), word(S + 0x88)) == (248, 10, 76)
        assert word(S + 0x8c) == (pages - 1) * 3

    def update(held_before, held):
        """One native key-manager update followed by the Camera key handler."""
        press = held & ~held_before
        state = updates['keys']
        if not held:
            emission, state['countdown'] = 0, 0
        elif press:
            emission, state['countdown'] = press, 20
        elif state['countdown']:
            state['countdown'] -= 1
            emission = held if state['countdown'] == 0 else 0
            if state['countdown'] == 0:
                state['countdown'] = 4
        else:
            emission = 0
        put(KEYS + 4, held)
        put(KEYS + 0x10, emission)
        log.clear()
        call(0x2ce810, T)
        return {'held': hex(held), 'emission': hex(emission), 'selection': half(O + 0x2232),
                'target': real(S + 0x78), 'pending': byte(T + 0x448),
                'events': [hex(e[1]) for e in log if e[0] == 'event'],
                'sound': sum(1 for e in log if e[0] == 'se')}

    # LytSlider output smoothing on the configured slider (0x26fd18..0x26fd70,
    # before the bounds helper), for every adjacent anchor move used below.
    bits = lambda value: struct.unpack('<I', struct.pack('<f', value))[0]
    configure(30)

    def smooth(current, target):
        m.reg_write(UC_ARM_REG_R4, S)
        m.reg_write(UC_ARM_REG_S16, bits(current))
        m.reg_write(UC_ARM_REG_S17, bits(target))
        m.emu_start(0x26fd18, 0x26fd70, count=100)
        assert m.reg_read(UC_ARM_REG_PC) == 0x26fd70
        return real(S + 0x4c), word(S + 0x48)

    smoothing = []
    for start, target, reverse_after in [(0, 86, None), (86, 0, None), (86, 162, None), (162, 248, None),
                                         (248, 334, None), (0, 248, None), (0, 86, 2)]:
        current, floats, pixels = float(start), [], []
        for tick in range(1, 41):
            goal = 0.0 if reverse_after is not None and tick > reverse_after else float(target)
            current, pixel = smooth(current, goal)
            floats.append(current)
            pixels.append(pixel)
            if current == goal and tick > (reverse_after or 0):
                break
        smoothing.append({'from': start, 'to': target, 'reverseToZeroAfter': reverse_after,
                          'floatBits': [hex(bits(v)) for v in floats], 'pixels': pixels})
    assert smoothing[0]['pixels'][:5] == [26, 44, 57, 65, 72] and len(smoothing[0]['pixels']) == 20
    assert smoothing[-1]['pixels'][2] == 31

    sequences = {}
    for label, count, script in [
        # A tap: press for one update then release.
        ('seven-right-taps', 7, [RIGHT, 0] * 8),
        ('seven-down-then-right', 7, [RIGHT, 0] * 6 + [DOWN, 0, RIGHT, 0, RIGHT, 0]),
        ('thirty-held-right', 30, [RIGHT] * 45 + [0]),
        ('thirty-left-back', 30, [RIGHT] * 45 + [0] + [LEFT] * 30 + [0]),
        ('priority-left-over-right', 12, [RIGHT, 0, LEFT | RIGHT, 0]),
        ('priority-right-over-down', 12, [RIGHT | DOWN, 0]),
        ('priority-up-over-down', 12, [UP | DOWN, 0]),
    ]:
        configure(count)
        updates = {'keys': {'countdown': 0}}
        held, steps = 0, []
        for mask in script:
            steps.append(update(held, mask))
            held = mask
        sequences[label] = {'itemCount': count, 'steps': steps}

    taps = sequences['seven-right-taps']['steps']
    # Presses commit selection and move the model; notifications wait for release.
    assert [s['selection'] for s in taps[0::2]] == [1, 2, 3, 4, 5, 6, 7, 8]
    assert all(s['events'] == [] and s['pending'] == 1 for s in taps[0::2])
    assert [s['events'] for s in taps[1::2]][:6] == [['0x1d']] * 6
    assert taps[13]['events'] == ['0x22'] and taps[15]['events'] == ['0x22']
    assert [s['target'] for s in taps[0::2]] == [0, 0, 0, 0, 0, 86, 162, 248]
    held_right = sequences['thirty-held-right']['steps']
    moved = [i + 1 for i, s in enumerate(held_right[:-1]) if s['emission'] != '0x0']
    assert moved == [1, 21, 25, 29, 33, 37, 41, 45]
    assert all(s['events'] == [] for s in held_right[:-1]) and held_right[-1]['events'] == ['0x1d']
    assert sequences['priority-left-over-right']['steps'][2]['selection'] == 0
    assert sequences['priority-right-over-down']['steps'][0]['selection'] == 1
    assert sequences['priority-up-over-down']['steps'][0]['selection'] == 3

    # Visibility helper lattice, executed through 0x2d1274 for every padded
    # index from each possible settled anchor: records the resulting model
    # target (immediate setter 0x21fd40, original code).
    lattice = []
    for count in (7, 13, 30):
        pages = configure(count)
        padded = pages * 6
        for anchor in range(0, (pages - 1) * 3 + 1):
            for index in range(padded):
                configure(count)
                start = (anchor // 3) * 248 + (10 + 76 * (anchor % 3) if anchor % 3 else 0)
                start = min(start, (pages - 1) * 248)
                m.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', start))[0])
                m.reg_write(UC_ARM_REG_R0, S + 0x50)
                m.reg_write(UC_ARM_REG_R1, 1)
                m.reg_write(UC_ARM_REG_SP, 0x103e000)
                m.reg_write(UC_ARM_REG_LR, stop)
                m.emu_start(0x21fd40, stop, count=10000)
                assert real(S + 0x78) == start
                log.clear()
                call(0x2d1274, T, index, 0)
                lattice.append([count, start, index, half(O + 0x2232), real(S + 0x78)])
    lattice_rows = {}
    for count, start, index, selected, target in lattice:
        assert selected == index
        lattice_rows.setdefault(str(count), []).append([start, index, target])

    # Ring router: mapping records carry a full logical tag, but the router
    # passes the mapped control's bitset bit without comparing that tag.
    renderer, mapping = 0x1014000, 0x1016000
    m.mem_write(renderer, bytes(0x200))
    put(renderer + 0x18, mapping)
    put(renderer + 0x16c, O)
    configure(7)
    put_half(mapping + 6 * 8, 69)      # stale tag in slot 6
    put_half(mapping + 6 * 8 + 2, 2)   # control 2
    put(renderer + 4 + 0x7c, 1 << 2)
    geometry = 0x1017000
    m.mem_write(geometry, struct.pack('<9f', 0, 13, 0, 248, 13, 0, 496, 13, 0))
    put_real(O + 0x2244, 0.0)
    put_real(O + 0x2248, 13.0)
    put_real(O + 0x2268, 228.0)
    put_real(O + 0x226c, 132.0)
    log.clear()
    call(0x2d92ac, renderer, 0, 0, 6, stack=(1, geometry, 0))
    router = [e for e in log if e[0] == 'cell']
    assert router and router[0][1] == 2 and router[0][4] == 1
    ring = {'globalIndex': 6, 'mappingTag': 69, 'control': router[0][1],
            'readyPassedToWriter': router[0][4], 'realItem': router[0][3]}

    # End of 0x2cea0c: after drawing, the bitset is cleared and set for every
    # real item inside the three-page window, keyed by mapping control only.
    X = 0x1019000
    m.mem_write(X, bytes(0x300))
    put(X + 0x60, O)
    put(X + 0x28c, O)
    put(X + 0x138, mapping)
    put(X + 0x70, 1)
    m.mem_write(mapping, bytes(64 * 8))
    for index in range(18):
        put_half(mapping + index * 8, 100 + index)  # deliberately stale tags
        put_half(mapping + index * 8 + 2, index)
    put_half(mapping + 20 * 8 + 2, 40)
    put(X + 0x1a0, 0xffffffff)
    put(X + 0x1a4, 0xffffffff)
    m.mem_write(O + 0x34, struct.pack('<HHH', 7, 7, 0))
    m.reg_write(UC_ARM_REG_R4, X)
    m.reg_write(UC_ARM_REG_FP, 1)  # 0x2cea60 sets fp=1; callees preserve it
    m.reg_write(UC_ARM_REG_SP, 0x103e000)
    put(0x103e000 + 0xc, 0)  # density index in the caller frame
    m.emu_start(0x2cf0dc, 0x2cf1bc, count=10000)
    assert m.reg_read(UC_ARM_REG_PC) == 0x2cf1bc
    rewritten = word(X + 0x1a0) | (word(X + 0x1a4) << 32)
    assert rewritten == 0x7f, hex(rewritten)
    bitset = {'currentPage': 1, 'itemCount': 7, 'staleTagsPresent': True,
              'bitsAfterRewrite': hex(rewritten)}

    return {'ok': True, 'codeSha256': CODE_SHA, 'configurations': configs,
            'smoothing': smoothing, 'sequences': sequences, 'visibilityLattice': lattice_rows,
            'ringRouterTagCheck': ring, 'readyBitsetRewrite': bitset,
            'intercepts': ['0x220898 sound request', '0x1fd048 item lookup (photo records)',
                           'owner vtable +0x58 event dispatch', '0x2d804c cell writer'],
            'scope': 'Original configuration, key handler, selection commit, visibility helper and immediate setter; '
                     'synthetic objects. No renderer, decoder, touch, wall-clock or native screen equivalence.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--fixture', type=Path, help='absolute path for the derived test oracle')
    args = parser.parse_args()
    assert args.code.is_absolute() and args.output.is_absolute()
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    if args.fixture:
        assert args.fixture.is_absolute()
        # Derived numbers only; no executable bytes are copied.
        oracle = {'provenance': {'title': '0004001000022400', 'content': '0000-0000001a',
                                 'codeSha256': CODE_SHA, 'script': 'scripts/replay_camera_strip.py',
                                 'masks': {'left': LEFT, 'right': RIGHT, 'up': UP, 'down': DOWN}},
                  'configurations': result['configurations'], 'smoothing': result['smoothing'],
                  'sequences': {name: {'itemCount': value['itemCount'],
                                       'steps': [[int(step['held'], 16), step['selection'], step['target'],
                                                  step['pending'], step['events']] for step in value['steps']]}
                                for name, value in result['sequences'].items()},
                  'visibilityLattice': result['visibilityLattice'],
                  'ringRouterTagCheck': result['ringRouterTagCheck'],
                  'readyBitsetRewrite': result['readyBitsetRewrite']}
        args.fixture.write_text(json.dumps(oracle, separators=(',', ':')) + '\n')
    print('Camera browse strip replay passed:', args.output)
