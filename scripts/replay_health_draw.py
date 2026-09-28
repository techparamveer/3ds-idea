"""Replay Health screen command setup, pane traversal and text draw dispatch.

Requires private Unicorn and the hash-pinned executable plus converted safehealth
pack. GPU submission and pane draw callbacks are intercepted. This is source
control-flow/transform evidence, not a native raster or complete scene replay.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from replay_health_scroll import CODE_SHA


def replay(code_path, pack_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    pack_bytes = pack_path.read_bytes()
    assert hashlib.sha256(pack_bytes).hexdigest() == 'ca9646e2d7f8630f256d87761d171ceee458efe6ee1607a52bfa98dd87671c5b'
    layout = json.loads(pack_bytes)['layouts']['SafeText_D_00']
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x200000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x40000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    stack, stop = 0x103d000, 0x103f000
    mode, packets, order, events, names = 'screen', [], [], [], {}

    def external(machine, address, size, data):
        if mode == 'screen' and address == 0x138164:
            pointer, length = machine.reg_read(UC_ARM_REG_R0), machine.reg_read(UC_ARM_REG_R1)
            packets.append(list(struct.unpack('<' + 'I' * (length // 4), machine.mem_read(pointer, length))))
        elif mode == 'tree' and address == 0x1020000:
            order.append(names[machine.reg_read(UC_ARM_REG_R0)])
        elif mode == 'text' and address in (0x12aad4, 0x14b3ec, 0x149ef4):
            events.append({0x12aad4: 'flush-quads', 0x14b3ec: 'rebuild-cache', 0x149ef4: 'draw-text-stream'}[address])
        else:
            return
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
    m.hook_add(UC_HOOK_CODE, external)

    def call(address, *args):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            m.reg_write(reg, value)
        m.reg_write(UC_ARM_REG_SP, stack)
        m.reg_write(UC_ARM_REG_LR, stop)
        m.emu_start(address, stop, count=1000000)
        assert m.reg_read(UC_ARM_REG_PC) == stop, hex(m.reg_read(UC_ARM_REG_PC))

    screens = []
    for screen, width in ((0, 320), (1, 400)):
        packets.clear()
        call(0x13978c, screen)
        assert [len(p) for p in packets] == [10, 18]
        assert packets[0][:4] == [0, 0x802f0065, 0, ((width - 1) << 16) | 239]
        screens.append({'screenArgument': screen, 'width': width, 'register65Mode': packets[0][0],
                        'packedStart': hex(packets[0][2]), 'packedEnd': hex(packets[0][3]),
                        'commandPacketBytes': [len(p) * 4 for p in packets]})

    mode = 'tree'
    heap, vtable = 0x1000000, 0x1010000
    put(vtable + 0x68, 0x1020000)
    panes, addresses = {}, {}

    def make_node(pane):
        nonlocal heap
        ptr = heap
        heap += 0x200
        names[ptr], addresses[pane['name']], panes[pane['name']] = pane['name'], ptr, pane
        put(ptr, vtable)
        m.mem_write(ptr + 0xb7, bytes([pane['flags']]))
        children = [make_node(child) for child in pane['children']]
        head = ptr + 0x14
        put(head, children[0] + 4 if children else head)
        for i, child in enumerate(children):
            put(child + 4, children[i + 1] + 4 if i + 1 < len(children) else head)
        return ptr

    root = make_node(layout['roots'][0])
    call(0x158fac, root, 0x1011000, 0x1012000)
    source_order = list(order)
    assert source_order[:7] == ['RootPane', 'N_TextArea'] + [f'TextArea_{i:02}' for i in range(5)]
    assert not any(name.startswith('SafeIcon_') for name in source_order)
    assert 'P_Bg_D_01' not in source_order
    # Prescribed article fixture: source updater selects one buffer; warning writer
    # may enable an icon. This replay tests traversal, not either updater again.
    for i in range(5): m.mem_write(addresses[f'TextArea_{i:02}'] + 0xb7, bytes([int(i == 2)]))
    m.mem_write(addresses['SafeIcon_01'] + 0xb7, b'\x01')
    order.clear()
    call(0x158fac, root, 0x1011000, 0x1012000)
    article_order = list(order)
    assert article_order[:4] == ['RootPane', 'N_TextArea', 'TextArea_02', 'SafeIcon_01']
    assert article_order.index('W_TextFrame_00') > article_order.index('SafeIcon_01')
    assert article_order.index('TitleBG_00') > article_order.index('W_TextFrame_00')
    order.clear()
    m.mem_write(addresses['N_TextArea'] + 0xb7, b'\x00')
    call(0x158fac, root, 0x1011000, 0x1012000)
    assert 'TextArea_02' not in order and 'SafeIcon_01' not in order

    mode = 'text'
    pane, renderer, cache = 0x1014000, 0x1015000, 0x1016000
    text_cases = []
    for name, length, font, buffer, pending, dirty, ready, expected in [
        ('empty', 0, 1, 1, 1, 4, 0, []),
        ('missing-font', 1, 0, 1, 1, 4, 0, []),
        ('missing-buffer', 1, 1, 0, 1, 4, 0, []),
        ('dirty-with-pending-quads', 1, 1, 1, 1, 4, 1, ['flush-quads', 'rebuild-cache', 'draw-text-stream']),
        ('cold-cache', 1, 1, 1, 0, 0, 0, ['rebuild-cache', 'draw-text-stream']),
        ('ready-cache', 1, 1, 1, 0, 0, 1, ['draw-text-stream']),
    ]:
        m.mem_write(pane + 0xfa, struct.pack('<H', length))
        put(pane + 0xe0, font)
        put(pane + 0x100, buffer)
        put(pane + 0x104, cache)
        m.mem_write(pane + 0xfd, bytes([dirty]))
        m.mem_write(renderer + 0x24, bytes([pending]))
        m.mem_write(cache + 8, bytes([ready]))
        events.clear()
        call(0x15a234, pane, 0x1017000, renderer)
        assert events == expected, (name, events)
        text_cases.append({'fixture': name, 'calls': list(events)})

    # Run complete source local text transform and its two origin helpers. Supply
    # an identity world matrix plus the resource's translated pane; parent scroll
    # displacement is a fixture, not a replay of world-matrix construction.
    mode = 'transform'
    article_pane = panes['TextArea_00']
    assert article_pane['origin'] == 1 and article_pane['text']['alignment'] == 0
    transform_cases = []
    for scroll in (0, 21, 4200):
        world = [1., 0., 0., -10., 0., 1., 0., 92. + scroll, 0., 0., 1., 0.]
        m.mem_write(pane + 0x80, struct.pack('<12f', *world))
        m.mem_write(pane + 0x48, struct.pack('<2f', *article_pane['size']))
        m.mem_write(pane + 0xb6, bytes([article_pane['origin']]))
        m.mem_write(pane + 0xfc, bytes([article_pane['text']['alignment']]))
        call(0x15a168, pane, renderer)
        matrix = list(struct.unpack('<12f', m.mem_read(renderer, 48)))
        assert matrix == [1., -0., 0., -152., 0., -1., 0., 92. + scroll, 0., -0., 1., 0.], matrix
        transform_cases.append({'suppliedParentY': scroll, 'matrix': matrix})
    return {'codeSha256': CODE_SHA, 'packSha256': hashlib.sha256(pack_bytes).hexdigest(),
            'screenCommandSetup': screens, 'sourceResourcePaneOrder': source_order,
            'prescribedArticlePaneOrder': article_order, 'hiddenParentSkipsDescendants': True,
            'textDispatchCases': text_cases, 'textLocalTransforms': transform_cases,
            'scope': 'Original screen setup, pane traversal, text dispatch and local transform. GPU submission, pane draw bodies and text downstream calls intercepted. World matrices/visibility are fixtures. No raster, article scissor or owner cancellation proof.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--code', type=Path, required=True)
    p.add_argument('--pack', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    args = p.parse_args()
    assert all(path.is_absolute() for path in (args.code, args.pack, args.output))
    report = replay(args.code, args.pack)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print('Health screen setup, traversal, text dispatch and local transform replay passed')
