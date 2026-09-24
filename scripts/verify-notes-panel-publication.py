#!/usr/bin/env python3
"""Verify original Notes animation-application vs matrix-publication dispatch."""
import argparse
import hashlib
import json
import struct
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
for name in ('code', 'listing', 'asset-root', 'artifact-dir'):
    p.add_argument('--' + name, type=Path, required=True)
a = p.parse_args()
assert all(path.is_absolute() for path in vars(a).values())
b = a.code.read_bytes()
assert hashlib.sha256(b).hexdigest() == '8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6'
checks = []
def word(address, expected, meaning):
    actual = struct.unpack_from('<I', b, address - 0x100000)[0]
    assert actual == expected, (hex(address), hex(actual), hex(expected))
    checks.append(dict(address=hex(address), value=hex(expected), meaning=meaning))
def call(address, expected, meaning):
    op = struct.unpack_from('<I', b, address - 0x100000)[0]
    assert op & 0x0f000000 == 0x0b000000
    delta = op & 0xffffff
    if delta & 0x800000:
        delta -= 0x1000000
    assert address + 8 + delta * 4 == expected
    checks.append(dict(address=hex(address), target=hex(expected), meaning=meaning))

call(0x168884, 0x14f148, 'scene 3 constructs base layout scene')
call(0x14f158, 0x17b738, 'base scene constructs wrapper at scene +dc')
word(0x17b76c, 0x1b75e8, 'concrete wrapper vtable')
word(0x1b7628, 0x17b58c, 'wrapper virtual +40 pane factory')
call(0x167770, 0x14f970, 'ImageScreenUp layout parsed into scene wrapper')
word(0x14fad4, 0xe590c040, 'layout parser dispatches factory +40')
word(0x14faf8, 0x058b0010, 'first created pane becomes wrapper root +10')
word(0x17b710, 0x0009f2f9, 'factory pan1 discriminator difference from wnd1')
assert 0x31646e77 + 0x9f2f9 == int.from_bytes(b'pan1', 'little')
word(0x17b61c, 0xeaff2987, 'pan1 branch tail-calls constructor 145c40')
word(0x145d6c, 0x1b753c, 'plain pane constructor vtable')
word(0x14f7dc, 0xe5922034, 'wrapper update dispatches root +34')
word(0x14f7f8, 0xe592205c, 'wrapper matrix dispatches root +5c')

for name, vt in [('pan1',0x1b753c), ('wnd1',0x1b7634), ('pic1',0x1b76bc), ('txt1',0x1b773c), ('bnd1',0x1b77c4)]:
    for offset, target, meaning in [(0x34,0x17a5d4,'recursive animation apply'), (0x38,0x179dec,'local animation apply'), (0x54,0x17a3fc,'link enable/disable'), (0x5c,0x179ec4,'matrix/alpha recursion')]:
        word(vt + offset, target, name + ' ' + meaning)

word(0x17a5e4, 0xe5902038, 'recursive apply invokes local virtual +38')
word(0x17a620, 0xe5912034, 'recursive apply visits child virtual +34')
word(0x179e04, 0xe5d4000e, 'local apply reads animation link disable flag')
word(0x179e1c, 0xe5923008, 'enabled link invokes animation virtual +8')
word(0x1b74d4, 0x179488, 'bound animation concrete sampling method')
word(0x179520, 0xed909a04, 'pane transform sampling reads stored animation frame')
call(0x17954c, 0x1463c4, 'pane transform evaluates original animation keys')
word(0x17955c, 0xed800a00, 'sampled value writes pane property')
word(0x17a428, 0x15c0100e, 'enable helper writes link disabled flag only')
word(0x14e864, 0xed848a04, 'forward reset writes animation frame zero')
word(0x14e884, 0xed840a04, 'reverse reset writes animation last frame')
call(0x1673ac, 0x14efec, 'late event9 only starts/reset-enables selected HUD controller')
word(0x1673b8, 0xea00007d, 'software event9 exits directly after controller start')
call(0x1687f0, 0x14f7cc, 'dirty update tail applies root animations')
call(0x168814, 0x14f7cc, 'active update tail applies root animations')
word(0x167ba0, 0xe5840358, 'W_TextPanel retained in scene +358')
word(0x168828, 0xe5940358, 'idle update tail still applies W_TextPanel subtree')
call(0x14e0d8, 0x14f7e8, 'draw calculates matrices before render submission')
call(0x179f20, 0x134ee0, 'matrix method combines local/parent matrices')
word(0x17a190, 0xe5c400b5, 'matrix method publishes derived alpha')
word(0x17a1ec, 0xe591205c, 'matrix traversal invokes child +5c')
word(0x198170, 0xe590c068, 'later render traversal invokes leaf +68, distinct from apply')
call(0x13d948, 0x150e10, 'list update clears input if scene flags disallow it')
word(0x13c88c, 0xe3560000, 'accepted note index must be nonnegative')
word(0x13c894, 0xe3560010, 'accepted note index below 16')
word(0x13c8a4, 0xe5c5806a, 'accepted open disables list input flag +6a')
word(0x13c96c, 0xe3a00003, 'accepted open chooses list state 3')

pack = json.loads((a.asset_root / 'packs/game-notes/memo-ImageScreenUp-arc-l.json').read_text())
layout = pack['layouts']['ImageScreenUp']
assert pack['sourceSha256'] == '8001ff24296fc5c1a627c238c1bf8e4682102cb66882411cae32362e2c442d7a'
assert len(layout['roots']) == 1
assert (layout['roots'][0]['kind'], layout['roots'][0]['name']) == ('pan1', 'RootPane')
def walk(pane):
    yield pane
    for child in pane['children']:
        yield from walk(child)
panes = list(walk(layout['roots'][0]))
assert set(pane['kind'] for pane in panes) == {'pan1','pic1','txt1','wnd1'}
panel = next(pane for pane in panes if pane['name'] == 'W_TextPanel')
assert [pane['name'] for pane in panel['children']] == ['P_Icon_00','T_TextTitle','P_ObjIcn','P_ObjIcnUp00','P_ObjIcnDown00']
checks.append(dict(resource='ImageScreenUp', root='pan1 RootPane', selectiveTitleRoot='W_TextPanel'))

ranges = [
 ('wrapper-construction',0x14f148,0x14f18c),('wrapper-vtable',0x17b738,0x17b774),
 ('layout-parser-root',0x14fac8,0x14fb18),('pane-factory',0x17b58c,0x17b718),
 ('pane-constructor',0x145c40,0x145d78),('wrapper-dispatch',0x14f7cc,0x14f804),
 ('recursive-apply',0x17a5d4,0x17a640),('local-apply',0x179dec,0x179ea4),
 ('animation-property-write',0x179488,0x179584),('link-enable',0x17a3fc,0x17a4c4),
 ('frame-reset',0x14e830,0x14e894),('matrix-alpha-recursion',0x179ec4,0x17a278),
 ('scene-apply-tail',0x1687dc,0x168868),('title-pane-selection',0x167b84,0x167bcc),
 ('late-hud-start',0x167368,0x1673bc),('scene-draw',0x14e030,0x14e144),
 ('render-traversal',0x198144,0x1981c8),('list-input-gate',0x13d8f4,0x13d9ac),
 ('list-accepted-open',0x13c888,0x13c980),
]
a.artifact_dir.mkdir(parents=True, exist_ok=True)
listing = a.listing.read_text().splitlines(True)
records = []
for name, start, end in ranges:
    selected = ''.join(line for line in listing if start <= int(line[:8],16) < end)
    assert selected
    (a.artifact_dir / (name + '.txt')).write_text(selected)
    records.append(dict(name=name, start=hex(start), endExclusive=hex(end), sha256=hashlib.sha256(b[start-0x100000:end-0x100000]).hexdigest()))
report = dict(passed=True, method='Static original-byte/resource verification; no firmware execution or raster claim', checks=checks, ranges=records,
              contract=dict(animationApplication='scene3 update tail', lateEvent9='controller reset/enable only; no immediate property sampling',
                            matrixPublication='draw-time root virtual +5c', remaining='render-leaf +68 audit and composed scene gates/initial property state'))
(a.artifact_dir / 'source-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {len(checks)} publication/source checks and {len(records)} hashed source ranges')
