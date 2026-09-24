#!/usr/bin/env python3
"""Static Notes ordering evidence. Reads bytes; never executes firmware."""
import argparse
import hashlib
import json
import struct
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
for name in ('code', 'listing', 'asset-root', 'artifact-dir'):
    parser.add_argument('--' + name, type=Path, required=True)
args = parser.parse_args()
for value in vars(args).values():
    if not value.is_absolute():
        parser.error('All paths must be absolute')
code = args.code.read_bytes()
assert hashlib.sha256(code).hexdigest() == '8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6'
base = 0x100000
checks = []
def word(address, expected, meaning):
    actual = struct.unpack_from('<I', code, address - base)[0]
    assert actual == expected, (hex(address), hex(actual), hex(expected))
    checks.append(dict(address=hex(address), word=hex(expected), meaning=meaning))
def call(address, target, meaning):
    op = struct.unpack_from('<I', code, address - base)[0]
    assert op & 0x0f000000 == 0x0b000000
    offset = op & 0xffffff
    if offset & 0x800000:
        offset -= 0x1000000
    assert address + 8 + offset * 4 == target
    checks.append(dict(address=hex(address), target=hex(target), meaning=meaning))

word(0x1b6a50, 0x162c28, 'active manager state virtual +0x2c initialization')
word(0x1b6928, 0x13d8f4, 'scene 1 virtual +0x24 update')
word(0x1b6964, 0x13bc64, 'scene 1 virtual +0x60 event')
word(0x1b6dac, 0x168454, 'scene 3 virtual +0x24 update')
word(0x1b6de0, 0x1675dc, 'scene 3 virtual +0x58 draw')
call(0x104778, 0x15e9e4, 'new manager state initializes before pending flags and scene update')
word(0x15e9f8, 0xe590102c, 'initialization loads virtual +0x2c')
word(0x15ea04, 0xe12fff11, 'tail dispatch initializer')
word(0x162c50, 0xe3a02006, 'list scene priority 6')
word(0x162c60, 0xe3a02004, 'capture/title scene priority 4')
word(0x162c70, 0xe3a02003, 'write scene priority 3')
word(0x104a40, 0xe3a06000, 'update traversal starts priority 0')
word(0x104acc, 0xe2866001, 'update priority increases by 1')
word(0x104ad0, 0xe3560009, 'update traversal stops before priority 9')
call(0x162e18, 0x14f78c, 'initialization sends scene 3 event immediately')
word(0x162e10, 0xe3a02000, 'initial scene 3 event 0')
word(0x162e14, 0xe3a01003, 'initial event target scene 3')
call(0x1675a8, 0x14efec, 'nonzero initial context with software starts title slot 0')
call(0x13d9a4, 0x13bea0, 'list update state 0 calls selected-note input routine')
call(0x13c968, 0x14f78c, 'selected note dispatches capture HUD forward')
word(0x13c960, 0xe3a02009, 'open HUD event 9')
word(0x13c964, 0xe3a01003, 'open HUD target scene 3')
call(0x1673ac, 0x14efec, 'HUD forward starts selected slot')
word(0x167394, 0xe3a01000, 'HUD forward direction argument 0')
call(0x167330, 0x14efec, 'HUD reverse starts selected slot')
word(0x167318, 0xe3a01001, 'HUD reverse direction argument 1')
call(0x168790, 0x152508, 'title advancement inside scene 3 update')
call(0x1687a8, 0x152508, 'HUD/switch advancement inside same scene 3 update')
word(0x168870, 0x3f800000, 'title/HUD source update delta is float 1.0')
word(0x1aa96c, 0x167634, 'captured-software pre-draw callback')
word(0x1aa970, 0, 'pre-draw callback has no object adjustment')
call(0x13b8e0, 0x151cd0, 'scene 9 state 0 starts intro slot 0')
call(0x13bbec, 0x152508, 'scene 9 intro advances independently')
word(0x13b93c, 0xe5c01069, 'intro completion directly clears scene 9 draw flag')
word(0x13bc10, 0x3f800000, 'scene 9 update delta is float 1.0')

ranges = [
 ('manager-state-init',0x1046f4,0x1047ac),('initialize-virtual',0x15e9e4,0x15ea08),
 ('manager-priority-update',0x104a40,0x104ad8),('priority-and-events',0x162c28,0x1630bc),
 ('list-event',0x13bc64,0x13bce4),('list-update-dispatch',0x13d8f4,0x13d9b4),
 ('list-selected-dispatch',0x13c888,0x13c974),('hud-event-dispatch',0x1672ec,0x1673e8),
 ('title-initial-start',0x167518,0x1675c0),('title-hud-step',0x168698,0x1687b8),
 ('capture-layout-update',0x1687dc,0x168868),('capture-draw',0x1675dc,0x16766c),
 ('intro-event',0x13b454,0x13b538),('intro-start-and-complete',0x13b860,0x13b964),
 ('intro-step',0x13bbe4,0x13bc14),('write-return',0x165228,0x1652c8),
]
args.artifact_dir.mkdir(parents=True, exist_ok=True)
lines = args.listing.read_text().splitlines(True)
records = []
for name, start, end in ranges:
    selected = ''.join(line for line in lines if start <= int(line[:8],16) < end)
    assert selected
    (args.artifact_dir / (name + '.txt')).write_text(selected)
    records.append(dict(name=name, start=hex(start), endExclusive=hex(end),
                        sha256=hashlib.sha256(code[start-base:end-base]).hexdigest()))
pack = json.loads((args.asset_root / 'packs/game-notes/memo-ImageScreenUp-arc-l.json').read_text())
for name, frames in [('TextPanelInOut',21),('TextPanelStay',121),('HudDoubleInOut',21),('HudUpInOut',21),('HudDownInOut',21)]:
    clip = pack['animations']['ImageScreenUp_' + name]
    assert clip['frames'] == frames and clip['loop'] is False
    assert clip['groups'] == (['G_Panel_01'] if name.startswith('Text') else ['G_Panel_00','G_Panel_01'])
    checks.append(dict(clip=name, frames=frames, groups=clip['groups']))
report = dict(passed=True, method='static original-byte assertions; no firmware execution or native timing claim',
              assertions=checks, ranges=records)
(args.artifact_dir / 'source-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {len(checks)} source/resource assertions and {len(records)} bounded source range hashes')
