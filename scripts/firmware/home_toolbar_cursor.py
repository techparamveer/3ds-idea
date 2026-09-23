#!/usr/bin/env python3
"""Original-ARM toolbar/grid cursor positions, controllers and visibility.

Resource lookup, binding enable, layout apply/matrices, status/widgets and sound
are explicit endpoints. No emulator boot, GPU raster or wall-clock claim.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
from home_blank_slot_alpha import SOURCE_SHA256, HEAP, STACK, END, machine, call, put, get, byte, octet, returned
from native import decode_layout, decode_animation, sections

p = argparse.ArgumentParser()
p.add_argument('--code', type=Path, required=True)
p.add_argument('--resources', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
opt = p.parse_args()
code = opt.code.read_bytes()
assert hashlib.sha256(code).hexdigest() == SOURCE_SHA256
opt.output.mkdir(parents=True, exist_ok=True)
S, C, E0, E1 = [HEAP + x for x in (0, 0x8000, 0x9000, 0xa000)]
REGS = [UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3]


def sha(data): return hashlib.sha256(data).hexdigest()
def f(u, a, n): u.mem_write(a, struct.pack('<f', n))
def fl(u, a): return struct.unpack('<f', u.mem_read(a, 4))[0]
def h(u, a, n): u.mem_write(a, struct.pack('<H', n & 65535))
def half(u, a): return struct.unpack('<h', u.mem_read(a, 2))[0]
def args(u): return [u.reg_read(r) for r in REGS]
def s0(u, n): u.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', n))[0])
def string(u, a): return bytes(u.mem_read(a, 64)).split(b'\0')[0].decode()
def cword(a): return struct.unpack_from('<I', code, a - 0x100000)[0]
def walk(items):
    for item in items:
        yield item
        yield from walk(item['children'])


resources = {}
layouts = {}
animations = {}
for name in ['LncBase_D_01', 'LncCsr_00', 'LncCsrEfct_00']:
    path = opt.resources / 'blyt' / (name + '.bclyt')
    data = path.read_bytes()
    layouts[name] = decode_layout(data)
    resources[path.name] = {'sha256': sha(data), 'groups': layouts[name]['groups']}
for name in ['LncCsr_00_' + x for x in ['Scale', 'Select', 'Decide', 'Loop']] + ['LncCsrEfct_00_Scale', 'LncCsrEfct_00_DisAppear']:
    path = opt.resources / 'anim' / (name + '.bclan')
    data = path.read_bytes()
    animations[name] = decode_animation(data)
    resources[path.name] = {'sha256': sha(data), 'frames': animations[name]['frames'],
                           'loop': animations[name]['loop'], 'groups': animations[name]['groups'],
                           'childBinding': animations[name]['childBinding']}
    animations[name]['pai'] = next(r.data for tag, r in sections(data, b'CLAN')[1] if tag == 'pai1')
panes = {x['name']: x for x in walk(layouts['LncBase_D_01']['roots'])}
names = [code[cword(0x308938 + i * 4) - 0x100000:].split(b'\0')[0].decode() for i in range(8)]
positions = [panes[name]['translation'][:2] for name in names]
controller_specs = [(C, 0x80, 'LncCsr_00_Scale'), (C, 0x84, 'LncCsr_00_Select'),
                    (C, 0x88, 'LncCsr_00_Decide'), (C, 0x8c, 'LncCsr_00_Loop')]
controller_specs += [(effect, offset, 'LncCsrEfct_00_' + name) for effect in (E0, E1)
                     for offset, name in [(0x80, 'Scale'), (0x84, 'DisAppear')]]


def snap(u, controller):
    return {'current': fl(u, controller + 0xc), 'applied': fl(u, get(u, controller + 0x28) + 0x10),
            'step': fl(u, controller + 0x10), 'state': get(u, controller + 0x14),
            'mode': get(u, controller + 0x18)}


def position(u, layout): return list(struct.unpack('<3f', u.mem_read(get(u, layout + 0x38) + 0x28, 12)))
def effect(u, layout):
    return {'visible': octet(u, layout + 0x60), 'position': position(u, layout),
            'slot': struct.unpack('<i', u.mem_read(layout + 0x88, 4))[0],
            'scale': snap(u, get(u, layout + 0x80)), 'disappear': snap(u, get(u, layout + 0x84))}


def setup(folder=False, density=2, selected=3):
    u = machine(code)
    events = []
    endpoints = {0x224e10: 'binding-enable', 0x1a3610: 'apply-animation', 0x11bc20: 'calculate-matrices',
                 0x297b20: 'selection-status', 0x1de7fc: 'selection-flags', 0x1de8ec: 'widget-setup',
                 0x1e89f8: 'selection-manager', 0x233a6c: 'sound'}

    def hook(u, a, _size, _data):
        if a in endpoints:
            events.append({'endpoint': endpoints[a], 'args': args(u)})
            returned(u)
        elif a == 0x2292e4:
            name = string(u, u.reg_read(UC_ARM_REG_R1))
            item = panes[name]
            pane = HEAP + 0xc000 + (names + ['N_IconPos_00']).index(name) * 0x100
            u.mem_write(pane + 0x28, struct.pack('<3f', *item['translation']))
            events.append({'endpoint': 'resource-pane', 'name': name})
            returned(u, pane)
        elif a == 0x2660a0:
            events.append({'effect': args(u)[0], 'position': list(struct.unpack('<2f', u.mem_read(args(u)[1], 8))),
                           'scaleFrame': args(u)[2], 'slot': args(u)[3]})
    u.hook_add(UC_HOOK_CODE, hook)
    # Execute the exact constant-table initialization fragment, including all VFP loads.
    call(u, 0x2f4124, until=0x2f43f8)
    for base in [0x344bfc, 0x344c08]:
        put(u, base, 0); put(u, base + 4, base + 4); put(u, base + 8, base + 4)
    for layout, vtable in [(C, 0x321650), (E0, 0x321740), (E1, 0x321740)]:
        put(u, layout, vtable); put(u, layout + 0x38, layout + 0x200)
        byte(u, layout + 0x60, int(layout == C)); byte(u, layout + 0x200 + 0xb7, 255)
        call(u, 0x11eae8, [layout])
    for index, (layout, offset, name) in enumerate(controller_specs):
        a = HEAP + 0x14000 + index * 0x400
        transform, group, raw = a + 0x100, a + 0x180, HEAP + 0x20000 + index * 0x3000
        pai = animations[name]['pai']; assert len(pai) < 0x3000
        u.mem_write(raw, bytes(pai)); put(u, transform + 0xc, raw); f(u, transform + 0x10, -999)
        put(u, group + 0x10, group + 0x10); put(u, group + 0x14, group + 0x10)
        call(u, 0x11eb44, [a, transform, group]); put(u, layout + offset, a)
        if name.endswith('_Scale'):
            call(u, 0x1bbd7c, [a, 5]); call(u, 0x2693fc, [a])
        elif name.endswith('_Loop'): call(u, 0x2693fc, [a])
    for layout in (C, E0, E1):
        nodes = [get(u, layout + offset) + 0x20 for owner, offset, _ in controller_specs if owner == layout]
        sentinel = layout + 0x18
        put(u, layout + 0x14, len(nodes)); put(u, sentinel, nodes[0]); put(u, sentinel + 4, nodes[-1])
        for index, node in enumerate(nodes):
            put(u, node, nodes[index + 1] if index + 1 < len(nodes) else sentinel)
            put(u, node + 4, nodes[index - 1] if index else sentinel)
    for offset, value in [(0x820, C), (0x824, E0), (0x828, E1), (0x118c, density), (0x1190, density),
                          (0x3aa0, HEAP + 0x5000), (0x1164, HEAP + 0x6000), (0x1810, 60 if folder else 300)]:
        put(u, S + offset, value)
    byte(u, S + 0x1170, 0 if folder else 255)
    for offset, value in [(0x1178, selected), (0x117c, selected), (0x3c8c, -1), (0x3c90, -1)]: h(u, S + offset, value)
    put(u, S + 0x3c94, -1)
    # Original names/table loop; only the resource parser/lookup is supplied.
    u.reg_write(UC_ARM_REG_R4, S)
    call(u, 0x2b1528, until=0x2b1570)
    assert [list(struct.unpack('<2f', u.mem_read(S + 0x3c4c + i * 8, 8))) for i in range(8)] == positions
    call(u, 0x1d7d00, [S, S + 0x1868, S + 0x1e08, density])
    scale = get(u, C + 0x80); loop = get(u, C + 0x8c)
    s0(u, density); call(u, 0x1da050, [C])
    s0(u, 17.25); call(u, 0x1bbd8c, [loop])
    call(u, 0x103df8, [0])
    events.clear()
    return u, events


toolbar = []
for focus in range(8):
    u, events = setup()
    loop = get(u, C + 0x8c); scale = get(u, C + 0x80)
    before = snap(u, loop)
    call(u, 0x1d8a94, [S, focus]); call(u, 0x1d914c, [S])
    sought = snap(u, scale)
    expected = 10 if focus == 0 else 12 if focus in (6, 7) else 11
    assert position(u, C) == positions[focus] + [0]
    assert sought['current'] == expected and sought['applied'] == 2
    assert snap(u, loop) == before and octet(u, C + 0x60) == 1
    call(u, 0x103df8, [0])
    assert snap(u, scale)['applied'] == expected and snap(u, scale)['current'] == expected
    toolbar.append({'focus': focus, 'pane': names[focus], 'nativePosition': positions[focus],
                    'lcdCenter': [160 + positions[focus][0], 120 - positions[focus][1]],
                    'beforeUpdate': sought, 'afterUpdate': snap(u, scale), 'loopBefore': before, 'loopAfter': snap(u, loop)})

grid = []
for folder in (False, True):
    for density in range(6):
        for selected in (0, 7, 59):
            u, _ = setup(folder, density, selected)
            f(u, S + 0x3a28, 13.25)
            before = snap(u, get(u, C + 0x8c))
            call(u, 0x1d914c, [S])
            target = [fl(u, S + 0x1868 + selected * 4) - 13.25, fl(u, S + 0x1e08 + selected * 4), 0]
            assert position(u, C) == target and snap(u, get(u, C + 0x8c)) == before
            grid.append({'folder': folder, 'density': density, 'selected': selected, 'position': target})

# Execute ordinary event4 dispatcher through common effect, not just the endpoint.
departures = []
for old_focus, key in [(i, key) for i in range(8) for key in (0x10, 0x20, 0x40, 0x80)] + [(-1, 0x10), (-1, 0x40)]:
    u, events = setup(selected=3)
    if old_focus >= 0: call(u, 0x1d8a94, [S, old_focus])
    old_position = positions[old_focus] if old_focus >= 0 else [fl(u, S + 0x1868 + 3 * 4), fl(u, S + 0x1e08 + 3 * 4)]
    before_loop = snap(u, get(u, C + 0x8c))
    call(u, 0x2968fc, [S, 4, key])
    records = [x for x in events if 'effect' in x]
    assert len(records) == 1 and records[0]['effect'] == E0
    assert records[0]['position'] == old_position
    expected_scale = (10 if old_focus == 0 else 12 if old_focus in (6, 7) else 11) if old_focus >= 0 else 2
    assert effect(u, E0)['slot'] == (-1 if old_focus >= 0 else 3)
    assert effect(u, E0)['scale']['current'] == expected_scale
    assert effect(u, E0)['scale']['applied'] == -999
    assert effect(u, E0)['disappear']['current'] == 0 and effect(u, E0)['disappear']['applied'] == -999
    assert snap(u, get(u, C + 0x8c)) == before_loop
    events_before = list(events)
    call(u, 0x1d914c, [S]); new_position = position(u, C)
    call(u, 0x103df8, [0])
    assert effect(u, E0)['scale']['applied'] == expected_scale and effect(u, E0)['disappear']['applied'] == 0
    departures.append({'oldFocus': old_focus, 'key': key, 'newFocus': half(u, S + 0x3c8c), 'newSlot': half(u, S + 0x1178),
                       'newPrimaryPosition': new_position, 'effect': effect(u, E0), 'events': events_before})

u, events = setup()
alternation = []
for focus in (0, 3, 6, 7):
    call(u, 0x1de858, [S, focus, 10 if focus == 0 else 12 if focus >= 6 else 11, 1])
    alternation.append({'indexAfter': get(u, S + 0x3a50), 'effect0': effect(u, E0), 'effect1': effect(u, E1)})
assert [x['effect'] for x in events if 'effect' in x] == [E0, E1, E0, E1]
lifecycle = []
for tick in range(24):
    call(u, 0x103df8, [0]); lifecycle.append({'tick': tick, **effect(u, E0)})
assert [x['disappear']['applied'] for x in lifecycle[:21]] == list(range(21))
assert lifecycle[20]['visible'] == 1 and lifecycle[20]['disappear']['state'] == 2
assert lifecycle[21]['visible'] == 0 and lifecycle[21]['disappear']['state'] == 0
u, _ = setup()
call(u, 0x1de858, [S, 0, 10, 1])
for _ in range(10): call(u, 0x103df8, [0])
before_restart = effect(u, E0)
put(u, S + 0x3a50, 0); call(u, 0x1de858, [S, 7, 12, 1])
after_restart = effect(u, E0)
assert after_restart['scale']['current'] == 12 and after_restart['scale']['applied'] == 10
assert after_restart['disappear']['current'] == 0 and after_restart['disappear']['applied'] == 9
call(u, 0x103df8, [0]); restart_applied = effect(u, E0)
assert restart_applied['scale']['applied'] == 12 and restart_applied['disappear']['applied'] == 0
restart = {'before': before_restart, 'afterStart': after_restart, 'afterUpdate': restart_applied}

# In mode3 a departed grid effect follows live coordinates and scroll. Toolbar
# effects carry slot-1 and stay anchored; primary root is not changed here.
u, _ = setup()
call(u, 0x1de858, [S, 3, 2, 0]); call(u, 0x1de858, [S, 6, 12, 1])
call(u, 0x1d914c, [S]); primary_before = position(u, C); toolbar_before = position(u, E1)
byte(u, S + 0x3a80, 3); f(u, S + 0x1868 + 12, 104.5); f(u, S + 0x1e08 + 12, 61.25); f(u, S + 0x3a28, 31.75)
call(u, 0x1d914c, [S])
assert position(u, E0) == [72.75, 61.25, 0] and position(u, E1) == toolbar_before
assert position(u, C) == primary_before
mode3_positions = {'primary': primary_before, 'gridEffect': effect(u, E0), 'toolbarEffect': effect(u, E1)}

# Accepted touch-selection fragment, before the viewport-correction branch.
# Earlier hit/manager gates are outside this bounded fixture.
touch = []
for old_focus in (-1, 0, 3, 6, 7):
    u, events = setup(selected=3)
    if old_focus >= 0: call(u, 0x1d8a94, [S, old_focus])
    stack = STACK + 0x8000
    for reg, value in [(UC_ARM_REG_R4, S), (UC_ARM_REG_R5, 0), (UC_ARM_REG_R8, S + 0x1100), (UC_ARM_REG_FP, S + 0x1000)]:
        u.reg_write(reg, value)
    for offset, value in [(0x28, S + 0x3fd0), (0x2c, S + 0x3c00), (0x30, HEAP + 0xe000),
                          (0x34, S + 0x3ca8), (0x38, S + 0x3c94)]: put(u, stack + offset, value)
    h(u, S + 0x14a0, 8)
    call(u, 0x2a4bb8, until=0x2a4d28)
    records = [x for x in events if 'effect' in x]
    assert len(records) == 1 and half(u, S + 0x1178) == 8
    expected_position = positions[old_focus] if old_focus >= 0 else [fl(u, S + 0x1868 + 12), fl(u, S + 0x1e08 + 12)]
    assert records[0]['position'] == expected_position and effect(u, E0)['slot'] == (-1 if old_focus >= 0 else 3)
    assert octet(u, S + 0x3ca8) == 0 and half(u, S + 0x3c8c) == -1
    touch.append({'oldFocus': old_focus, 'newSlot': 8, 'events': events, 'effect': effect(u, E0)})

visibility = []
for focus in (-1, 0, 6, 7):
    for request in (0, 1, 2):
        for previous in (0, 1):
            u, _ = setup()
            if focus >= 0: call(u, 0x1d8a94, [S, focus])
            byte(u, S + 0x3a88, request); byte(u, S + 0x3a4e, previous); byte(u, C + 0x60, previous)
            old = snap(u, get(u, C + 0x8c))
            call(u, 0x295b60, [S])
            assert octet(u, C + 0x60) == int(request != 2)
            assert snap(u, get(u, C + 0x8c)) == old
            visibility.append({'focus': focus, 'request': request, 'previous': previous, 'visible': octet(u, C + 0x60)})

gates = []
for gate in ('overlay', 'secondary-overlay', 'mode185', 'mode186'):
    u, _ = setup(); byte(u, S + 0x3a88, 2); byte(u, S + 0x3a4e, 1)
    if gate == 'overlay': put(u, S + 0x3fd0, 1)
    elif gate == 'secondary-overlay': put(u, S + 0x3fd4, 1)
    else: byte(u, S + 0x3a80, int(gate.removeprefix('mode')))
    call(u, 0x295b60, [S]); assert octet(u, C + 0x60) == 1
    gates.append({'gate': gate, 'visible': 1})
focus_visibility = []
for focus in range(8):
    u, _ = setup(); byte(u, C + 0x60, 0)
    loop_before = snap(u, get(u, C + 0x8c))
    call(u, 0x1d8a94, [S, focus]); call(u, 0x1d914c, [S]); call(u, 0x103df8, [0])
    assert octet(u, C + 0x60) == 0 and snap(u, get(u, C + 0x8c)) == loop_before
    assert snap(u, get(u, C + 0x80))['applied'] == 2
    focus_visibility.append({'focus': focus, 'visible': 0, 'scale': snap(u, get(u, C + 0x80))})

excerpts = []
cs = Cs(CS_ARCH_ARM, CS_MODE_ARM); cs.skipdata = True
for start, end in [(0x2b1528, 0x2b1570), (0x2f4124, 0x2f4400), (0x1d7d00, 0x1d7eac), (0x1d914c, 0x1d928c),
                   (0x1d9f38, 0x1d9f58), (0x1da024, 0x1da060), (0x1d8a94, 0x1d8af8), (0x2968fc, 0x297070),
                   (0x1de858, 0x1de8ec), (0x2660a0, 0x2661e8), (0x1f58ac, 0x1f59a8), (0x2693fc, 0x2694a4),
                   (0x295b60, 0x295c68), (0x1ebdcc, 0x1ebe2c), (0x2a4bb8, 0x2a4d80), (0x2b1ca8, 0x2b1d48)]:
    raw = code[start - 0x100000:end - 0x100000]
    text = '\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw, start)) + '\n'
    path = opt.output / f'proof-{start:x}-{end:x}.asm'; path.write_text(text)
    excerpts.append({'path': path.name, 'bytesSHA256': sha(raw), 'textSHA256': sha(text.encode())})
decoded_path = opt.output / 'decoded-resources.json'
decoded_path.write_text(json.dumps({'layouts': layouts, 'animations': {name: {k: v for k, v in item.items() if k != 'pai'}
                                                                   for name, item in animations.items()}}, indent=2) + '\n')
report = {'sourceSHA256': SOURCE_SHA256, 'fixtureSHA256': sha(Path(__file__).read_bytes()), 'resources': resources,
          'decodedResourcesSHA256': sha(decoded_path.read_bytes()),
          'toolbar': toolbar, 'grid': grid, 'departures': departures, 'alternation': alternation, 'lifecycle': lifecycle,
          'touch': touch, 'restart': restart, 'mode3Positions': mode3_positions, 'visibility': visibility,
          'visibilityGates': gates, 'hiddenFocus': focus_visibility, 'excerpts': excerpts,
          'scope': __doc__, 'limits': 'Synthetic scene/layout records. Original controller constructors/resource readers/seek/start/update execute; binding enable and pane application/matrices are recorded endpoints. No full native boot, GPU raster, pixel match, toolbar feature activation, or wall-clock assertion.'}
path = opt.output / 'checked.json'; path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'passed': True, 'toolbar': len(toolbar), 'grid': len(grid), 'departures': len(departures),
                  'touch': len(touch), 'visibility': len(visibility), 'gates': len(gates), 'hiddenFocus': len(focus_visibility),
                  'excerpts': len(excerpts), 'fixtureSHA256': report['fixtureSHA256'],
                  'resultSHA256': sha(path.read_bytes())}, indent=2))
