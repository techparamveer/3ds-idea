"""Replay Health article touch drag/release and SlideBar thumb/groove input.

Continues replay_health_live_scroll.py. Each frame executes, in the original
schedule order, HID sampling 0x13a5d0, the control manager 0x1015d4 (Down, Up,
G_Touch, SlideBar) and scene update 0x157c88. The G_Touch control 0x154560 and
scrollbar 0x155664 run their original state machines; their hit tests execute
group lookup 0x112630, 0x128378, matrix inverse 0x110c08 and pane rect 0x158ef0
against panes carrying the converted SafeText_D_00/SlideBar translations, sizes
and origins.

Fixtures are explicit: the HID service readers 0x10b1c8 (no pad update) and
0x10b0e0 (supplies raw touch x/y/pressed), key bits written to the pad block,
pane objects from the converted layouts, pane global matrices recomputed from
translations after each frame (the layouts contain no rotation or scale), group
objects in the converted member order, the SlideBar wrapper fields set by
constructor 0x1334f8 (+0x60 = 1, instruction 0x133558), a recording
SlideBar_Select animation object, allocation/free, and sound dispatch. No
native frame, rasterised pixel, browser output or wall-clock timing is claimed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from replay_health_scroll import CODE_SHA
from replay_health_live_scroll import Machine

SAFEHEALTH_SHA = '68df4cb47eb3f07728f81213b19ee821dce7d7c8bf407bade57e8151dc4efb6f'
SLIDEBAR_SHA = '00e2ce3b1842c271db2100fe5fb8ac5cf0e3ce73683fef05967032e027040eb0'
BOUNDING_TYPE = 0x181b68
HID = 0x174a88
GATE = 0x174848
REGISTRY = 0x1bd0cc
TOUCH_POINT = 0x174aac


def pane_tree(layout, offset=(0.0, 0.0)):
    """Name -> (source pane, global translation) for a translation-only layout."""
    out = {}

    def walk(p, base):
        t, s, r = p['translation'], p['scale'], p['rotation']
        assert s == [1.0, 1.0] and r == [0.0, 0.0, 0.0], p['name']
        g = (base[0] + t[0], base[1] + t[1])
        out[p['name']] = (p, g, base)
        for c in p.get('children', []): walk(c, g)
    for root in layout['roots']: walk(root, offset)
    return out


class Scene:
    def __init__(self, code, safetext, slidebar, rows):
        self.m = m = Machine(code)
        self.code = code
        attach = pane_tree(safetext)['N_SlideBar_00'][1]
        self.tree = {**pane_tree(safetext), **pane_tree(slidebar, attach)}
        self.slidebar_names = set(pane_tree(slidebar))
        self.panes, self.events, self.sounds, self.anim = {}, [], [], []
        thunk = 0x1ff1000
        bounding_vt, other_vt = m.alloc(0x20), m.alloc(0x20)
        other_type, pane_type = m.alloc(8), m.alloc(8)
        m.put(other_type, pane_type); m.put(pane_type, 0)
        m.put(bounding_vt + 8, thunk); m.hook(thunk, lambda mm: BOUNDING_TYPE)
        m.put(other_vt + 8, thunk + 4); m.hook(thunk + 4, lambda mm: other_type)
        self.vt = {'bnd1': bounding_vt}
        self.other_vt = other_vt
        # Recording SlideBar_Select animation: +0x28 direction, +0x10 restart/play (0x16c76c).
        anim_vt, self.anim_obj = m.alloc(0x40), m.alloc(0x40)
        m.put(self.anim_obj, anim_vt)
        m.put(anim_vt + 0x28, thunk + 8); m.hook(thunk + 8, lambda mm: self.anim.append(('direction', mm.arg(1))) or True)
        m.put(anim_vt + 0x10, thunk + 12); m.hook(thunk + 12, lambda mm: self.anim.append(('play',)) or True)
        assert [m.word(0x16c76c + o) for o in (0x10, 0x28)] == [0x155fbc, 0x1530d4]
        m.hook(0x139598, lambda mm: mm.alloc(mm.arg(0)))
        m.hook(0x139588, lambda mm: True)
        resources = m.alloc(0x100)
        m.hook(0x127eb4, lambda mm: 0)
        m.hook(0x127ec0, lambda mm: resources)
        m.hook(0x1290c8, lambda mm: self.pane(self.cstr(mm.arg(1))))
        m.hook(0x1332e8, lambda mm: self.anim_obj)
        self.safetext = self.wrapper(['G_Touch'], safetext)
        self.slidebar = self.wrapper(['G_Slide'], slidebar)
        assert struct.unpack_from('<2I', code, 0x133554 - 0x100000) == (0xe3a01001, 0xe5c01060)
        m.hook(0x1334f8, lambda mm: self.slidebar)
        m.hook(0x1333bc, lambda mm: True)
        m.hook(0x123f8c, lambda mm: True)
        m.hook(0x12f4f8, lambda mm: self.sounds.append((mm.arg(0), mm.arg(1))) or True)
        m.hook(0x157df0, lambda mm: self.events.append((mm.arg(0), mm.arg(1), mm.arg(2))) or False)
        # HID services: no pad update; touch from the fixture.
        self.touch = None
        self.touch_block = m.alloc(0x10)
        m.put(HID + 0x18, self.touch_block)
        m.hook(0x10b1c8, lambda mm: 0)
        m.hook(0x10b0e0, self._touch_service)
        self.keys = m.alloc(0x40)
        m.put(HID + 0x10, self.keys)
        m.m.mem_write(HID, bytes(3))
        # Startup 0x1009e8 (called at 0x1007e4) writes the sound-id table read by controller 0x153d78.
        m.m.emu_start(0x100aec, 0x100b10)
        m.put(REGISTRY, 0); m.put(REGISTRY + 4, REGISTRY + 4); m.put(REGISTRY + 8, REGISTRY + 4)
        m.put(0x1c2020, 0); m.put(0x1c2024, 0x1c2024); m.put(0x1c2028, 0x1c2024)
        self.scene = scene = m.alloc(0x400)
        self.rows = rows
        m.put(scene + 0x7c, self.safetext); m.put(scene + 0xcc, rows); m.putf(scene + 0x158, 21)
        m.call(0x15724c, scene)
        m.call(0x157684, scene)
        m.call(0x1573ec, scene)
        m.call(0x127d7c, 0x157df0, scene)
        self.bar, self.touchc = m.word(scene + 0x8c), m.word(scene + 0x90)
        self.up, self.down, self.ctrl = m.word(scene + 0x94), m.word(scene + 0x98), m.word(scene + 0x9c)
        self.names = {self.bar: 'scrollbar', self.touchc: 'touch', self.up: 'up', self.down: 'down'}
        self.update_globals()

    def cstr(self, p):
        out = bytearray()
        while self.m.byte(p + len(out)): out.append(self.m.byte(p + len(out)))
        return out.decode('latin1')

    def pane(self, name):
        m = self.m
        if name not in self.panes:
            src, g, base = self.tree[name]
            p = m.alloc(0x200)
            m.put(p, self.vt.get(src['kind'], self.other_vt))
            for i, v in enumerate(src['translation']): m.putf(p + 0x28 + 4 * i, v)
            m.putf(p + 0x48, src['size'][0]); m.putf(p + 0x4c, src['size'][1])
            m.m.mem_write(p + 0xb6, bytes([src['origin'], src['flags']]))
            self.panes[name] = p
        return self.panes[name]

    def wrapper(self, groups, layout):
        """Layout wrapper with +0x3c group list (0x112630 layout) and +0x60 = 1."""
        m = self.m
        w, glist = m.alloc(0x100), m.alloc(0x10)
        head = glist + 4
        m.put(head, head); m.put(head + 4, head)
        members = {g['name']: g['panes'] for g in layout['groups'][0]['children']}
        prev = head
        for name in groups:
            g = m.alloc(0x40)
            m.m.mem_write(g + 0x18, name.encode() + b'\0')
            m.put(prev, g + 4); m.put(g + 4, head)
            sentinel, last = g + 0x10, g + 0x10
            for pane_name in members[name]:
                node = m.alloc(0x10)
                m.put(node + 8, self.pane(pane_name))
                m.put(last, node); last = node
            m.put(last, sentinel)
            prev = g + 4
        m.put(w + 0x3c, glist)
        m.m.mem_write(w + 0x60, b'\x01')
        return w

    def update_globals(self):
        """Global = parent global + local translation (no rotation or scale in either layout)."""
        m = self.m
        for name, p in self.panes.items():
            src, g, base = self.tree[name]
            parent = base
            if name in ('SBBtn', 'SBBtnShdw', 'SBBtnFrame', 'SBBtnEmb'):
                n = self.panes.get('N_Slide_00')
                parent = (self.tree['N_Slide_00'][2][0] + (m.real(n + 0x28) if n else 0),
                          self.tree['N_Slide_00'][2][1] + (m.real(n + 0x2c) if n else 0))
            x, y = parent[0] + m.real(p + 0x28), parent[1] + m.real(p + 0x2c)
            m.m.mem_write(p + 0x80, struct.pack('<12f', 1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, 0))

    def _touch_service(self, mm):
        if self.touch is None:
            mm.m.mem_write(self.touch_block, struct.pack('<HHB', 0, 0, 0))
        else:
            mm.m.mem_write(self.touch_block, struct.pack('<HHB', self.touch[0], self.touch[1], 1))
        return 1

    def frame(self, touch=None, held=0, pressed=0, released=0):
        m = self.m
        self.touch = touch
        m.put(self.keys, held); m.put(self.keys + 4, pressed); m.put(self.keys + 8, released)
        self.events.clear()
        m.call(0x13a5d0, 0)
        m.put(GATE + 0x14, 0)
        m.call(0x1015d4, 0)
        m.call(0x157c88, self.scene)
        self.update_globals()
        return self.state()

    def state(self):
        m, t, b, c = self.m, self.touchc, self.bar, self.ctrl
        return {
            'paneY': m.real(self.pane('N_TextArea') + 0x2c),
            'point': [m.real(TOUCH_POINT), m.real(TOUCH_POINT + 4)],
            'touch': {'state': m.byte(t + 0xd), 'owns': m.byte(t + 0xc), 'velocityY': m.real(t + 0x54),
                      'accumulated': m.real(t + 0x58)},
            'bar': {'state': m.byte(b + 0xd), 'owns': m.byte(b + 0xc), 'thumbY': m.real(self.pane('B_Slide_00') + 0x2c),
                    'grab': m.real(b + 0x1c), 'target': m.real(b + 0x20)},
            'controller': {'state': m.word(c), 'row': m.word(c + 0x7c), 'residual': m.real(c + 0x90)},
            'events': [(self.names.get(e[0], hex(e[0])), e[1], e[2]) for e in self.events],
            'busy': m.byte(GATE),
        }


def f32(v): return struct.unpack('<f', struct.pack('<f', v))[0]


def construction(s):
    m, t, b, c = s.m, s.touchc, s.bar, s.ctrl
    order, node = [], m.word(REGISTRY + 4)
    while node != REGISTRY + 4:
        order.append(s.names[node - 4]); node = m.word(node)
    assert order == ['down', 'up', 'touch', 'scrollbar']
    assert [m.word(0x16c638 + 4 * i) for i in (2, 7, 8, 9, 10, 11, 12)] == [0x128160, 0x1540a0, 0x154284, 0x1282a4, 0x1543a4, 0x154104, 0x154100]
    assert m.word(0x16c714 + 8) == 0x155420
    descriptor = [m.real(t + o) for o in (0x1c, 0x20, 0x24, 0x28, 0x2c)]
    assert descriptor == [0.0, 1.0, f32(0.95), 4.5, f32(4.275)] and [m.byte(t + o) for o in (0x30, 0x31, 0x32)] == [0, 0, 1]
    assert s.cstr(t + 0x34) == 'G_Touch' and s.cstr(b + 0x70) == 'G_Slide'
    assert [m.byte(c + o) for o in (0x1c, 0x1d, 0x1e)] == [0, 1, 1]
    assert [m.word(0x174af8 + 4 * i) for i in range(3)] == [0x1000011, 0x1000012, 0x1000013] and m.word(c + 0x78) == 0x1000013
    size = lambda n: [m.real(s.pane(n) + 0x48), m.real(s.pane(n) + 0x4c)]
    geometry = {n: size(n) for n in ('B_Slide_00', 'SBBtn', 'SBBtnShdw', 'SBBtnFrame', 'B_Groove_00', 'SBBaseWndw', 'SBBaseLine_00')}
    assert geometry == {'B_Slide_00': [24, 22], 'SBBtn': [22, 22], 'SBBtnShdw': [22, 22], 'SBBtnFrame': [22, 22],
                        'B_Groove_00': [16, 176], 'SBBaseWndw': [16, 176], 'SBBaseLine_00': [8, 152]}
    assert m.real(b + 0x10) == 154 and m.real(b + 0x14) == 0 and m.real(s.pane('B_Slide_00') + 0x2c) == 77
    assert m.real(c + 0x8c) == (s.rows - 8) * 21 and m.real(c + 0x24) == 21
    return {'registeredUpdateOrder': order,
            'touchDescriptor': {'dragThreshold': 0.0, 'releaseVelocityScale': 1.0, 'inertiaDecay': descriptor[2], 'inertiaStopSpeed': 4.5,
                                'scrollToSnapDistance': descriptor[4], 'requireFreeOwner': 0, 'axisX': 0, 'axisY': 1},
                                'controllerFlags': {'+0x1c': 0, '+0x1d': 1, '+0x1e': 1},
            'boundarySoundId': hex(m.word(c + 0x78)), 'slideBarGeometry': geometry, 'thumbTravel': 154, 'thumbRestY': 77,
            'extent': m.real(c + 0x8c)}


def ys(frames): return [f['paneY'] for f in frames]


def ev(frames): return [f['events'] for f in frames]


def touch_scenarios(new):
    out = {}
    s = new()
    ticks = []

    def ticked(*args):
        before = len(s.sounds)
        f = s.frame(*args)
        if len(s.sounds) > before: ticks.append(len(ticks_seen))
        ticks_seen.append(f)
        return f
    ticks_seen = []
    drag = [ticked((150, y)) for y in (120, 120, 110, 100, 90, 80, 70, 60)]
    assert ys(drag) == [0, 0, 10, 20, 30, 40, 50, 60]
    assert ev(drag)[0] == [] and all(e == [('touch', 1, 0)] for e in ev(drag)[1:])
    assert [f['touch']['state'] for f in drag[:2]] == [1, 2] and drag[0]['touch']['owns'] == 0 and drag[1]['touch']['owns'] == 1
    release, velocity, expected = [], 10.0, [70.0]
    while True:
        f = ticked(); release.append(f)
        if f['events'] == [('touch', 1, 2)]: break
        assert f['events'] == [('touch', 1, 1)]
    position = 70.0
    while True:
        velocity = f32(velocity * f32(0.95))
        if velocity * velocity < 20.25: break
        position = f32(position + velocity); expected.append(position)
    # Controller row/residual arithmetic regroups the sum; compare to float32 tolerance.
    assert len(release) == len(expected) + 1 and all(abs(a - b) < 1e-3 for a, b in zip(ys(release), expected + [expected[-1]]))
    assert release[-1]['touch'] == {'state': 0, 'owns': 1, 'velocityY': 0.0, 'accumulated': 0.0}
    rest = [s.frame(), s.frame()]
    assert rest[0]['touch']['owns'] == 0 and rest[0]['busy'] == 1 and rest[1]['busy'] == 0 and ys(rest) == [release[-1]['paneY']] * 2
    # Row-change tick 0x128e0c -> 0x153b0c, gated on updates since the previous tick (+0x98).
    assert ticks == [5, 9, 14, 21] and set(s.sounds) == {(0x1c2240, 0x1000012)}
    out['dragAndRelease'] = {'input': 'press (150,120), hold, then 10px/frame upward to y=60, release', 'paneY': ys(drag),
                             'releaseAndInertiaPaneY': ys(release), 'inertiaFramesAfterRelease': len(release) - 1,
                             'restingPaneY': release[-1]['paneY'], 'restingResidual': release[-1]['controller']['residual'],
                             'rowTickSoundFramesFromPress': ticks, 'rowTickSoundId': '0x1000012'}
    s = new()
    tap = [s.frame((150, 120)), s.frame((150, 120)), s.frame(), s.frame()]
    assert ys(tap) == [0] * 4 and ev(tap) == [[], [('touch', 1, 0)], [('touch', 1, 1)], [('touch', 1, 2)]]
    out['tap'] = {'paneY': ys(tap), 'events': ev(tap)}
    s = new()
    for y in (120, 120, 100, 80, 60): s.frame((150, y))
    coast = [s.frame() for _ in range(3)]
    catch = [s.frame((150, 60)) for _ in range(3)]
    after = [s.frame(), s.frame()]
    assert ys(coast) == [80, 99, f32(117.05)] and ys(catch) == [f32(117.05)] * 3 and ys(after) == [f32(117.05)] * 2
    assert catch[0]['touch']['state'] == 2 and catch[0]['events'] == [('touch', 1, 0)]
    assert ev(after) == [[('touch', 1, 1)], [('touch', 1, 2)]]
    out['inertiaCatch'] = {'coastPaneY': ys(coast), 'pressDuringInertia': 'same-frame stop, drag state 2, zero velocity', 'afterRelease': ys(after)}
    s = new()
    edge = [s.frame((150, y)) for y in (60, 60, 80, 100, 120, 140)] + [s.frame() for _ in range(6)]
    assert ys(edge) == [0] * 12 and s.sounds == [(0x1c2240, 0x1000013)]
    out['topBoundary'] = {'paneY': ys(edge), 'soundCalls': [[hex(a), hex(b)] for a, b in s.sounds],
                          'rule': 'one boundary sound per contact; re-armed only after an update with no scroll request'}
    s = new()
    jitter = [s.frame(p) for p in ((150, 120), (150, 120), (150, 119), (150, 118), (151, 118), (150, 117), (150, 115), (150, 112))]
    assert [f['point'] for f in jitter] == [[-10, 0], [-10, 0], [-10, 0], [-10, 2], [-9, 2], [-9, 2], [-10, 5], [-10, 8]]
    assert ys(jitter) == [0, 0, 0, 2, 2, 2, 5, 8]
    out['samplerJitterFilter'] = {'raw': [[150, 120], [150, 120], [150, 119], [150, 118], [151, 118], [150, 117], [150, 115], [150, 112]],
                                  'sampled': [f['point'] for f in jitter], 'paneY': ys(jitter),
                                  'rule': 'layout point (x-160, 120-y); move <1.5px from the filtered point creeps 10%; truncated to integers'}
    s = new()
    misses = []
    for p in ((150, 225), (0, 120), (296, 120), (150, 29), (150, 211)):
        misses.append(s.frame(p)); misses.append(s.frame(p)); s.frame(); s.frame()
    assert all(f['touch']['state'] == 0 and f['bar']['state'] == 0 and f['paneY'] == 0 for f in misses)
    hits = []
    for p in ((1, 30), (295, 210)):
        hits.append(s.frame(p)); s.frame(p); s.frame(); s.frame(); s.frame()
    assert all(f['touch']['state'] == 1 for f in hits)
    out['articleHitArea'] = {'screenBounds': 'x 1..295, y 30..210 inclusive (B_Touch 294x180 at [-12,0])', 'misses': [[150, 225], [0, 120], [296, 120], [150, 29], [150, 211]]}
    return out


def bar_scenarios(new):
    out = {}
    s = new()
    thumb = [s.frame((308, y)) for y in (43, 43, 45, 50, 60, 80, 80, 200, 239, 239)]
    thumb_y = [f['bar']['thumbY'] for f in thumb]
    assert thumb_y == [77, 77, 75, 70, 60, 40, 40, -77, -77, -77]
    assert all(abs(f['paneY'] - f32(f32((77 - y) / 154) * 6846)) < 1e-2 for f, y in zip(thumb, thumb_y))
    assert ev(thumb)[0] == [] and all(e == [('scrollbar', 1, 0)] for e in ev(thumb)[1:]) and s.anim == [('direction', 0), ('play',)]
    rel = [s.frame(), s.frame(), s.frame()]
    assert ev(rel) == [[], [], []] and s.anim[2:] == [('direction', 1), ('play',)] and rel[0]['bar']['owns'] == 1 and rel[1]['bar']['owns'] == 0 and rel[2]['busy'] == 0
    out['thumbDrag'] = {'screenY': [43, 43, 45, 50, 60, 80, 80, 200, 239, 239], 'thumbY': thumb_y, 'paneY': ys(thumb),
                        'rule': 'thumbY = clamp(touchY - grab, -77, 77); paneY = (77 - thumbY) / 154 * extent; drag continues off the bar',
                        'animation': ['press: SlideBar_Select forward', 'release: SlideBar_Select reverse, no controller event']}
    s = new()
    groove = [s.frame((308, 150)) for _ in range(17)]
    gy = [f['bar']['thumbY'] for f in groove]
    assert gy[:15] == [77, 69, 61, 53, 45, 37, 29, 21, 13, 5, -3, -11, -19, -27, -30] and gy[15:] == [-30, -30]
    assert [f['bar']['state'] for f in groove[:16]] == [2] * 14 + [1, 1] and s.anim == [('direction', 0), ('play',)]
    s.frame(); s.frame()
    out['groovePressHeld'] = {'screen': [308, 150], 'thumbY': gy, 'rule': '8px per update toward the stylus, then thumb drag with SlideBar_Select forward'}
    s = new()
    early = [s.frame((308, 150)) for _ in range(3)] + [s.frame() for _ in range(14)]
    ey = [f['bar']['thumbY'] for f in early]
    assert ey[:15] == gy[:15] and ey[15:] == [-30, -30] and [f['bar']['state'] for f in early[14:]] == [0, 0, 0] and s.anim == []
    out['groovePressReleasedEarly'] = {'thumbY': ey, 'rule': 'continues to the last stylus target, then idles without the Select animation'}
    for rows, extent in ((95, 1827), (208, 4200)):
        s = new(rows)
        f = [s.frame((308, 43)), s.frame((308, 43)), s.frame((308, 239))][-1]
        assert f['paneY'] == extent and f['bar']['thumbY'] == -77
        out['thumbBottom_%d' % rows] = extent
    return out


def overlap_scenarios(new):
    out = {}
    s = new()
    same = [s.frame((150, 120), 0x80, 0x80), s.frame((150, 110), 0x80), s.frame((150, 100), 0x80)] + [s.frame(None, 0x80) for _ in range(16)]
    assert all(('down', 1, 0) not in f['events'] for f in same) and ys(same)[:3] == [0, 0, 10]
    out['keyAndTouchSameFrame'] = 'the key press is ignored while the stylus is down; holding it afterwards does not start it'
    s = new()
    key = [s.frame(None, 0x80, 0x80), s.frame(None, 0x80), s.frame(None, 0x80)]
    both = [s.frame((150, y), 0x80) for y in (120, 120, 110, 100)]
    tail = [s.frame(None, 0x80) for _ in range(19)]
    assert ys(key) == [4, 8, 12] and ys(both) == [12, 12, 22, 32]
    assert all(('down', 1, 0) not in f['events'] for f in both)
    assert all(f['events'] == [('down', 1, 0), ('touch', 1, 1)] for f in tail[:16]) and tail[16]['events'] == [('down', 1, 0), ('touch', 1, 2)]
    assert tail[16]['paneY'] == tail[15]['paneY'] and ys(tail)[17:] == [tail[16]['paneY'] + 4 * i for i in (1, 2)]
    out['keyOwnedThenTouch'] = {'paneY': ys(key + both + tail),
                                'rule': 'key pauses while the stylus is down; after release touch inertia wins each update (later in manager order) until it stops, then the key resumes'}
    s = new()
    blocked = [s.frame(None, 0x80, 0x80)] + [s.frame((308, 43), 0x80) for _ in range(3)]
    assert ys(blocked) == [4, 4, 4, 4] and all(f['bar']['state'] == 0 for f in blocked)
    out['keyOwnedThenThumb'] = 'scrollbar update is skipped while another control owns; key pauses while the stylus is down'
    return out


def teardown_scenarios(new):
    out = {}
    for name, frames in (('duringInertia', [((150, y),) for y in (120, 120, 100, 80, 60)] + [(None,)]),
                         ('duringThumbDrag', [((308, y),) for y in (43, 43, 60)])):
        s = new()
        for f in frames: s.frame(*f)
        m = s.m
        m.put(s.scene + 0x88, 0)  # SlideBar wrapper is a fixture; its destructor is not replayed
        m.call(0x1575a8, s.scene)
        after = []
        for _ in range(3):
            s.events.clear(); s.touch = (308, 80); m.call(0x13a5d0, 0); m.put(GATE + 0x14, 0); m.call(0x1015d4, 0)
            after.append((list(s.events), m.byte(GATE), m.word(REGISTRY)))
        assert after == [([], 0, 0)] * 3
        out[name] = 'teardown 0x1575a8 empties the registry; no further control events or busy state'
    return out


def select_animation(code):
    """Execute SlideBar_Select reset/advance on an animation object shaped by 0x124e24/0x12522c."""
    m = Machine(code)
    assert struct.unpack_from('<I', code, 0x1252ec - 0x100000)[0] == 0x3f800000  # step 1.0
    assert struct.unpack_from('<2I', code, 0x1252dc - 0x100000) == (0xeeb80a40, 0xe3a01000)  # end = frames-1, one-shot
    # Per-update pass 0x10190c calls every registered wrapper's +8 (0x155ce0), passing priority < 9999.
    assert struct.unpack_from('<I', code, 0x1019fc - 0x100000)[0] == 0x270f and Machine(code).word(0x16c754 + 8) == 0x155ce0
    assert [Machine(code).word(0x16c76c + o) for o in (0x08, 0x0c)] == [0x153298, 0x155ff0]
    frames = {}
    for direction in (0, 1):
        a = m.alloc(0x40)
        m.putf(a + 4, 1.0); m.putf(a + 8, 0.0); m.putf(a + 0x10, 1.0); m.put(a + 0x18, direction)
        m.call(0x153298, a); m.put(a + 0x14, 1)
        seq = []
        for _ in range(3):
            seq.append((m.real(a + 0xc), m.word(a + 0x14)))
            m.call(0x1530e4, a)
        frames['forward' if direction == 0 else 'reverse'] = seq
    assert frames == {'forward': [(0.0, 1), (1.0, 1), (1.0, 2)], 'reverse': [(1.0, 1), (0.0, 1), (0.0, 2)]}
    return {'appliedFramePerUpdate': frames, 'rule': 'wrapper update 0x10190c applies the current frame, then advances by 1.0; '
            'press shows frame 0 for one update and frame 1 afterwards; release shows frame 1 for one update, then frame 0'}


def trace_inputs():
    """Per-frame (stylus, key mask) sequences for the browser model cross-check."""
    N = None
    hold = lambda p, n: [(p, 0)] * n
    idle = lambda n, keys=0: [(N, keys)] * n
    drag = lambda x, ys, keys=0: [((x, y), keys) for y in ys]
    thumb_bottom = drag(308, (43, 43, 239)) + idle(3)
    return {
        'drag-release': (334, drag(150, [120, 120] + list(range(110, 50, -10))) + idle(22)),
        'flick-up-then-down': (334, drag(150, (200, 200, 160, 120, 80, 40)) + idle(30) + drag(150, (40, 40, 90, 140, 190)) + idle(40)),
        'slow-jitter': (334, [((150, 120), 0), ((150, 120), 0), ((150, 119), 0), ((151, 118), 0), ((150, 118), 0), ((150, 117), 0),
                               ((149, 115), 0), ((150, 112), 0), ((150, 112), 0), ((150, 113), 0)] + idle(6)),
        'tap': (334, drag(150, (120, 120)) + idle(4)),
        'catch': (334, drag(150, (120, 120, 100, 80, 60)) + idle(3) + drag(100, (150, 150, 150, 140)) + idle(20)),
        'press-outside-during-inertia': (334, drag(150, (120, 120, 100, 80, 60)) + idle(2) + drag(150, (225, 225)) + idle(20)),
        'top-boundary': (334, drag(150, (60, 60, 80, 100, 120, 140)) + idle(8)),
        'bottom-boundary': (334, thumb_bottom + drag(150, (150, 150, 120, 90, 60)) + idle(20)),
        'hit-edges': (334, [((x, y), 0) for x, y in ((0, 120), (0, 120))] + idle(2) + drag(1, (30, 30, 20)) + idle(20)
                      + [((296, 120), 0)] * 2 + idle(2) + [((295, 210), 0)] * 3 + idle(20) + [((150, 211), 0)] * 2 + idle(2)),
        'thumb-drag': (334, drag(308, (43, 43, 45, 50, 60, 80, 80, 200, 239, 239)) + idle(4)),
        'thumb-off-bar': (334, [((308, 43), 0), ((308, 43), 0), ((200, 70), 0), ((20, 100), 0), ((20, 100), 0)] + idle(4)),
        'thumb-quick-tap': (334, drag(308, (43,)) + idle(4)),
        'groove-held': (334, hold((308, 150), 20) + idle(4)),
        'groove-early-release': (334, hold((308, 150), 3) + idle(18)),
        'groove-above-thumb': (334, drag(308, (43, 43, 180)) + idle(3) + hold((308, 60), 16) + idle(4)),
        'groove-slide-out': (334, hold((308, 150), 4) + hold((200, 150), 12) + idle(6)),
        'down-hold': (334, idle(12, 0x80) + idle(3)),
        'up-at-top': (334, idle(5, 0x40) + idle(2)),
        'both-keys': (334, idle(6, 0xc0) + idle(2)),
        'down-then-up': (334, idle(3, 0x80) + idle(3, 0xc0) + idle(3, 0x40) + idle(3)),
        'key-release-while-stylus': (334, idle(3, 0x80) + [((150, 225), 0x80)] * 2 + [((150, 225), 0)] * 2 + idle(4)),
        'key-press-while-stylus': (334, hold((150, 225), 2) + [((150, 225), 0x80)] * 3 + idle(4, 0x80) + idle(2)),
        'key-and-article-press-same-frame': (334, drag(150, (120, 110, 100), 0x80) + idle(18, 0x80) + idle(2)),
        'key-and-outside-press-same-frame': (334, [((150, 225), 0x80)] * 3 + idle(4, 0x80) + idle(2)),
        'key-during-drag': (334, drag(150, (120, 120, 110)) + drag(150, (100, 90), 0x80) + idle(20, 0x80) + idle(2)),
        'key-then-touch': (334, idle(3, 0x80) + drag(150, (120, 120, 110, 100), 0x80) + idle(20, 0x80) + idle(2)),
        'key-then-thumb': (334, idle(1, 0x80) + drag(308, (43, 43, 43), 0x80) + idle(3)),
        'article-1-bottom-key': (95, drag(308, (43, 43, 200)) + idle(2) + idle(20, 0x80) + idle(2)),
        'article-3-flick': (208, drag(150, (205, 205, 165, 125, 85, 45)) + idle(40) + idle(4, 0x40)),
    }


def traces(code, safetext, slidebar):
    out = {}
    for name, (rows, frames) in trace_inputs().items():
        s, previous, rows_out = Scene(code, safetext, slidebar, rows), 0, []
        for stylus, keys in frames:
            calls = len(s.anim)
            f = s.frame(stylus, keys, keys & ~previous, previous & ~keys)
            previous = keys
            rows_out.append({'stylus': list(stylus) if stylus else None, 'keys': keys, 'paneY': f['paneY'], 'thumbY': f['bar']['thumbY'],
                             'select': ['forward' if c[1] == 0 else 'reverse' for c in s.anim[calls:] if c[0] == 'direction']})
        out[name] = {'rows': rows, 'frames': rows_out}
    return out


def replay(code_path, safehealth_path, slidebar_path):
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    sh, sb = safehealth_path.read_bytes(), slidebar_path.read_bytes()
    assert hashlib.sha256(sh).hexdigest() == SAFEHEALTH_SHA and hashlib.sha256(sb).hexdigest() == SLIDEBAR_SHA
    safetext = json.loads(sh)['layouts']['SafeText_D_00']
    slidebar = json.loads(sb)['layouts']['SlideBar']
    new = lambda rows=334: Scene(code, safetext, slidebar, rows)
    return {'traces': traces(code, safetext, slidebar), 'codeSha256': CODE_SHA, 'safehealthSha256': SAFEHEALTH_SHA, 'slidebarSha256': SLIDEBAR_SHA,
            'construction': construction(new()), 'touch': touch_scenarios(new), 'scrollbar': bar_scenarios(new),
            'overlap': overlap_scenarios(new), 'teardown': teardown_scenarios(new), 'selectAnimation': select_animation(code),
            'scope': ('Original HID sampler, G_Touch/SlideBar/key controls, manager, controller and scene update per frame with source-geometry panes. '
                      'Not claimed: native frames, rasterised pixels, the Back control, HOME suspension, wall-clock timing or boundary-sound audio.')}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'safehealth', 'slidebar', 'output', 'traces'): p.add_argument('--' + name, type=Path, required=True)
    args = p.parse_args()
    assert all(path.is_absolute() for path in (args.code, args.safehealth, args.slidebar, args.output, args.traces))
    result = replay(args.code, args.safehealth, args.slidebar)
    fixture = {'source': 'scripts/replay_health_touch_scroll.py', 'codeSha256': CODE_SHA, 'scenarios': result.pop('traces')}
    args.traces.write_text(json.dumps(fixture, separators=(',', ':')) + '\n')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print('Health touch drag/release and SlideBar replay passed')
