#!/usr/bin/env python3
"""Bounded original-HOME Settings COMMON clock and scene-list replay.

The supplied controller and descriptor are synthetic. The executed instructions
include the native scene list walker, frame clock and conditional start pose
callback. This does not execute CGFX binding, a visible pose submission, or
actual HOME title scheduling.
"""

import argparse
import hashlib
import json
import struct
from pathlib import Path

from unicorn import Uc, UC_ARCH_ARM, UC_HOOK_CODE, UC_MODE_ARM
from unicorn.arm_const import UC_ARM_REG_FPEXC, UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_R0, UC_ARM_REG_S2, UC_ARM_REG_SP

CODE_SHA = '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
MODEL_SHA = '96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d'
BASE, SCENE, CONTROLLER, STACK, END = 0x100000, 0x800000, 0x801000, 0x810000, 0x820000
VTABLE = 0x321138  # skeletal controller constructed by 0x25000c
DESCRIPTOR, DESCRIPTOR_VTABLE, TYPE_STUB, SUBMIT_STUB, MODEL = (
    0x830000, 0x831000, 0x832000, 0x833000, 0x834000)


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
            'execution': ['0x10b3d0', '0x24ff10', '0x1bbd94', '0x24fe18', '0x24ff78'], 'rows': rows,
            'scope': 'Synthetic Settings-labeled 600-frame looping controller in original scene-list walker; attachment is supplied directly. A supplied descriptor receives one start pose callback, and two later attached scene passes advance the clock without another pose callback. Native title-driven attachment/hide/retarget, visible pose submission, and pixels are not executed.'}


def first_start_submission(code):
    """Execute the native controller's virtual +0x10 start into its pose callback."""
    u = machine(code)
    for address in (DESCRIPTOR, DESCRIPTOR_VTABLE, TYPE_STUB, SUBMIT_STUB, MODEL):
        u.mem_map(address, 0x1000)
    put32(u, CONTROLLER + 0x28, MODEL)
    put32(u, CONTROLLER + 0x2c, DESCRIPTOR)
    put32(u, DESCRIPTOR, DESCRIPTOR_VTABLE)
    put32(u, DESCRIPTOR_VTABLE + 8, TYPE_STUB)
    put32(u, DESCRIPTOR + 0x48, SUBMIT_STUB)
    put32(u, DESCRIPTOR + 0x4c, 0x835000)
    put_float(u, DESCRIPTOR + 0x40, 0.0)
    put_float(u, DESCRIPTOR + 0x44, 600.0)
    put32(u, MODEL + 0x238, 0xffffffff)  # no model-channel write before callback
    captured = []
    submit_call_reached = []

    def hook(uc, address, size, _):
        if address == 0x24ffec:
            submit_call_reached.append(address)
        elif address == TYPE_STUB:
            uc.reg_write(UC_ARM_REG_R0, 0x33d638)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
        elif address == SUBMIT_STUB:
            captured.append({'submitAddress': hex(address),
                             'sourceCall': '0x24ffec',
                             'submittedFrame': struct.unpack('<f', struct.pack('<I',
                                 uc.reg_read(UC_ARM_REG_S2) & 0xffffffff))[0],
                             'currentFrame': get_float(uc, CONTROLLER + 0xc)})
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))

    u.hook_add(UC_HOOK_CODE, hook)
    u.reg_write(UC_ARM_REG_R0, CONTROLLER)
    u.emu_start(0x24fe18, END, count=1000)
    assert captured == [{'submitAddress': hex(SUBMIT_STUB), 'sourceCall': '0x24ffec',
                         'submittedFrame': 0.0, 'currentFrame': 0.0}], captured
    assert submit_call_reached == [0x24ffec]
    assert u.reg_read(UC_ARM_REG_PC) == END
    # The native scene-list virtual update (+0xc) only calls the frame clock.
    # Keep the descriptor callback installed to check whether these updates
    # actually submit poses, rather than assuming that a frame is rendered.
    set_membership(u, True)
    for _ in range(2):
        scene_pass(u)
    assert get_float(u, CONTROLLER + 0xc) == 2.0
    assert len(captured) == 1, captured
    set_membership(u, False)
    scene_pass(u)
    assert len(captured) == 1, captured
    return {**captured[0], 'attachedScenePasses': 2,
            'frameAfterAttachedPasses': get_float(u, CONTROLLER + 0xc),
            'poseCallbacksAfterAttachedPasses': 0}


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
    result = run(code)
    result['firstStartSubmission'] = first_start_submission(code)
    print(json.dumps(result, indent=2) + '\n', end='')


if __name__ == '__main__':
    main()
