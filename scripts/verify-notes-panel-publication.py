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
call(0x17bde4, 0x1455a4, 'picture constructor constructs original material')
word(0x145c38, 0x1b784c, 'material constructor vtable literal')
word(0x1b7860, 0x17c8bc, 'material +14 enabled-link apply traversal')
word(0x1b786c, 0x17c860, 'material +20 enable/disable method')
word(0x1b7864, 0x17c858, 'material +18 lookup used by enable method')
word(0x17c87c, 0x15c0100e, 'material enable only writes link disable flag')
word(0x17c8d0, 0xe5d4000e, 'material apply tests link disable flag')
word(0x17c8e8, 0xe592300c, 'material apply dispatches animation +c')
word(0x1b74d8, 0x179764, 'animation +c material sampler')
word(0x17980c, 0xed908a04, 'material sampler reads stored animation frame')
call(0x179838, 0x1463c4, 'material sampler evaluates source key values')
for name, vt, target in [('pan1',0x1b753c,0x1981e4), ('wnd1',0x1b7634,0x1983c0), ('pic1',0x1b76bc,0x199234), ('txt1',0x1b773c,0x1996b8), ('bnd1',0x1b77c4,0x1981e4)]:
    word(vt+0x68, target, name+' concrete render leaf')
word(0x1981e4, 0xe1a00001, 'plain/bounds render leaf returns incoming command pointer')
word(0x199240, 0xe590213c, 'picture render reads current material pointer')
call(0x199248, 0x140458, 'picture render emits current material state')
word(0x199744, 0xe5943100, 'text render reads current material pointer')
call(0x199754, 0x17a970, 'text render dispatches current text geometry')
word(0x13bccc, 0xe3a01000, 'nonzero entry initializes list selection')
word(0x13d9c4, 0xe5900150, 'list entry state checks note-context status +150')
word(0x13d9cc, 0x05c5606a, 'status zero enables list input')
word(0x13d9d0, 0x01c791b0, 'status zero chooses list state zero')
word(0x13db24, 0xe2801103, 'return marker compare first constant operation')
word(0x13db28, 0xe251160a, 'return marker compare second operation; bits40a00000 means frame5')
call(0x13db44, 0x1523f8, 'return frame5 starts list controller +f80 slot1')
call(0x13db50, 0x150bb4, 'return gate waits list +f80 slot1')
call(0x13db70, 0x150bb4, 'return gate waits selected note slot3')
call(0x13db88, 0x150bb4, 'return gate waits list +fa0 slot11')
word(0x13dbcc, 0xe5c5606a, 'all return gates passed: re-enable list input')
word(0x13dbd0, 0xe1c791b0, 'all return gates passed: list state zero')
call(0x1654a8, 0x150bb4, 'write scene return separately waits lower slot2')
call(0x1654c4, 0x151c78, 'write scene queues draw disable after lower return')
call(0x1654dc, 0x151ca4, 'write scene queues update disable after lower return')

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
 ('material-constructor',0x1455a4,0x1455ec),('material-link-enable',0x17c858,0x17c884),
 ('material-apply',0x17c8bc,0x17c908),('material-sampling',0x179764,0x179ab4),
 ('picture-render-leaf',0x199234,0x19944c),('text-render-leaf',0x1996b8,0x19975c),
 ('window-render-prefix',0x1983c0,0x198590),('list-initial-ready-gate',0x13d9b4,0x13daa0),
 ('list-return-gate',0x13db0c,0x13dbd8),('write-return-disable',0x1654a0,0x1654ec),
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
                            materialApplication='enabled-link traversal in update; enable only changes link flag',
                            matrixPublication='draw-time root virtual +5c', remaining='complete render-helper graph and composed scene gates/initial property state'))
(a.artifact_dir / 'source-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {len(checks)} publication/source checks and {len(records)} hashed source ranges')
