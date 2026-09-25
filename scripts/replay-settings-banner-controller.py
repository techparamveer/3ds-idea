#!/usr/bin/env python3
"""Bounded original-HOME Settings COMMON clock and scene-list replay.

The supplied controller is synthetic. The executed instructions are the native
scene list walker, skeletal controller virtual update, and frame clock. This
does not execute CGFX binding, pose submission, or actual HOME title scheduling.
"""

import argparse
import hashlib
import json
import struct
from pathlib import Path

from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import UC_ARM_REG_FPEXC, UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_R0, UC_ARM_REG_SP

CODE_SHA = '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
MODEL_SHA = '96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d'
BASE, SCENE, CONTROLLER, STACK, END = 0x100000, 0x800000, 0x801000, 0x810000, 0x820000
VTABLE = 0x321138  # skeletal controller constructed by 0x25000c


def put32(u, address, value):
    u.mem_write(address, struct.pack('<I', value))


def get32(u, address):
    return struct.unpack('<I', u.mem_read(address, 4))[0]


def put_float(u, address, value):
    u.mem_write(address, struct.pack('<f', value))


def get_float(u, address):
    return struct.unpack('<f', u.mem_read(address, 4))[0]


def machine(code):
    u = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    u.mem_map(BASE, (len(code) + 0xfff) & ~0xfff)
    u.mem_write(BASE, code)
    assert get32(u, VTABLE + 0xc) == 0x24ff10
    assert get32(u, VTABLE + 0x10) == 0x24fe18
    for address in (SCENE, CONTROLLER, STACK, END):
        u.mem_map(address, 0x1000)
    u.reg_write(UC_ARM_REG_SP, STACK + 0x800)
    u.reg_write(UC_ARM_REG_LR, END)
    u.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    # Source constructor 0x25000c installs this vtable. The selected Settings
    # CGFX supplies a 600-frame IsLooping COMMON skeletal animation.
    put32(u, CONTROLLER, VTABLE)
    put_float(u, CONTROLLER + 4, 600.0)  # end
    put_float(u, CONTROLLER + 8, 0.0)  # start
    put_float(u, CONTROLLER + 0xc, 0.0)  # current
    put_float(u, CONTROLLER + 0x10, 1.0)  # step
    put32(u, CONTROLLER + 0x14, 1)  # playing
    put32(u, CONTROLLER + 0x18, 2)  # loop mode
    return u


def sample(u, label, membership):
    return {'sample': label, 'titleId': '0004001000022000',
            'requestIdentity': '0004001000022000:COMMON',
            'sceneMember': membership, 'currentFrame': get_float(u, CONTROLLER + 0xc),
            'state': get32(u, CONTROLLER + 0x14), 'mode': get32(u, CONTROLLER + 0x18)}


def set_membership(u, attached):
    head = SCENE + 0x10
    node = CONTROLLER + 0x20
    put32(u, head, node if attached else head)
    put32(u, node, head)


def scene_pass(u):
    u.reg_write(UC_ARM_REG_R0, SCENE)
    u.reg_write(UC_ARM_REG_LR, END)
    u.emu_start(0x10b3d0, END, count=1000)
    assert u.reg_read(UC_ARM_REG_PC) == END


def run(code):
    u = machine(code)
    rows = []
    set_membership(u, False)
    rows.append(sample(u, 'constructed-before-attachment', False))
    scene_pass(u)
    rows.append(sample(u, 'detached-pass', False))
    set_membership(u, True)
    for number in range(1, 601):
        scene_pass(u)
        if number in (1, 2, 598, 599, 600):
            rows.append(sample(u, f'attached-pass-{number}', True))
    set_membership(u, False)
    scene_pass(u)
    rows.append(sample(u, 'hide-detached-pass', False))
    # Retarget is represented by detachment only. The manager's identity and
    # visibility request branches have a separate executed worker fixture.
    rows.append({**sample(u, 'retargeted-away', False),
                 'requestIdentity': 'different-title'})
    assert [row['currentFrame'] for row in rows] == [0, 0, 1, 2, 598, 599, 0, 0, 0]
    return {'homeCodeSha256': CODE_SHA, 'settingsSelectedCgfxSha256': MODEL_SHA,
            'execution': ['0x10b3d0', '0x24ff10', '0x1bbd94'], 'rows': rows,
            'scope': 'Synthetic Settings-labeled 600-frame looping controller in original scene-list walker; attachment is supplied directly. Current-frame clock only: initial skeletal pose submission, native title-driven attachment/hide/retarget, and pixels are not executed.'}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--code', type=Path, required=True)
    p.add_argument('--model', type=Path, required=True)
    args = p.parse_args()
    if not args.code.is_absolute() or not args.model.is_absolute():
        p.error('--code and --model must be absolute')
    code = args.code.read_bytes()
    if hashlib.sha256(code).hexdigest() != CODE_SHA:
        p.error('HOME code.bin hash mismatch')
    model = json.loads(args.model.read_text())
    if (model.get('sourceSha256') != MODEL_SHA or
            [(clip['Name'], clip['FramesCount'], clip['AnimationFlags'])
             for clip in model['skeletalAnimations']] != [('COMMON', 600, 'IsLooping')]):
        p.error('Settings COMMON model or clip mismatch')
    print(json.dumps(run(code), indent=2) + '\n', end='')


if __name__ == '__main__':
    main()
