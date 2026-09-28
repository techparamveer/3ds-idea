#!/usr/bin/env python3
"""Bounded original-HOME Settings COMMON clock and scene-list replay.

The supplied controller and descriptor are synthetic. The executed instructions
include the native scene list walker, frame clock, conditional start pose and
indirect visibility callback and scene-list insertion. This does not execute
CGFX binding, a submitted visible pose, or actual HOME title scheduling.
"""

import argparse
import hashlib
import json
import struct
from pathlib import Path

from unicorn import Uc, UC_ARCH_ARM, UC_HOOK_CODE, UC_MODE_ARM
from unicorn.arm_const import UC_ARM_REG_FPEXC, UC_ARM_REG_LR, UC_ARM_REG_PC, UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_S0, UC_ARM_REG_S2, UC_ARM_REG_SP

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


def visibility_transition(code):
    """Run the native requested->actual visibility callback with bounded attach stubs.

    The Settings-labeled primary is synthetic. The native scene attach/detach
    helpers are entered but stubbed because their real graph and GPU owner are
    absent; the original request setter, update and indirect callback execute.
    """
    u = machine(code)
    primary = 0x840000
    u.mem_map(primary, 0x2000)
    put32(u, primary + 0x24, primary + 0x1000)  # supplied model owner
    put32(u, primary + 0x38, 1)  # scene 1
    events = []

    def hook(uc, address, size, _):
        if address in (0x1f7c78, 0x24f170, 0x24f3b0):
            events.append({'address': hex(address),
                           'actualVisibleBefore': uc.mem_read(primary + 0x3c, 1)[0],
                           'requestedVisible': uc.mem_read(primary + 0x9c, 1)[0]})
        if address in (0x24f170, 0x24f3b0):
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
        elif address == 0x1f8450:
            uc.reg_write(UC_ARM_REG_R0, primary + 0x200)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
        elif address == 0x24e0c0:
            # The common outer pose is separate from the visibility callback.
            uc.emu_stop()

    u.hook_add(UC_HOOK_CODE, hook)

    def request(value):
        u.reg_write(UC_ARM_REG_R0, primary)
        u.reg_write(UC_ARM_REG_R1, value)
        u.reg_write(UC_ARM_REG_LR, END)
        u.emu_start(0x1f9e64, END, count=100)
        assert u.reg_read(UC_ARM_REG_PC) == END

    def update(label):
        u.reg_write(UC_ARM_REG_R0, primary)
        u.reg_write(UC_ARM_REG_S0, 0x3f800000)
        u.reg_write(UC_ARM_REG_LR, END)
        u.emu_start(0x1fa344, END, count=1000)
        assert u.reg_read(UC_ARM_REG_PC) == 0x24e0c0
        return {'sample': label,
                'actualVisible': u.mem_read(primary + 0x3c, 1)[0],
                'requestedVisible': u.mem_read(primary + 0x9c, 1)[0],
                'transitionStep': get32(u, primary + 0xa0),
                'events': events.copy()}

    request(1)
    rows = [update('first-show-update')]
    request(0)
    rows.extend(update(f'hide-update-{i}') for i in range(1, 3))
    assert [row['actualVisible'] for row in rows] == [1, 1, 0]
    assert [event['address'] for event in events] == [
        '0x1f7c78', '0x24f170', '0x1f7c78', '0x24f3b0']
    return {'titleId': '0004001000022000', 'sceneIndex': 1, 'rows': rows,
            'scope': 'Native visibility setter 0x1f9e64, generic update 0x1fa344, and indirect callback 0x1f7c78 execute on one synthetic Settings-labeled primary. Native attach 0x24f170 and detach 0x24f3b0 are entered but stubbed; source scene membership, CGFX binding, pose submission, and pixels are unobserved.'}


def native_scene_insertion(code):
    """Run original attach and global scene traversal with supplied title graph.

    The primary at manager +0x50 and its controller are synthetic. The source
    list insertion and global traversal execute, while unrelated allocators,
    scene service, render graph and GPU calls are explicit stubs/stops.
    """
    u = machine(code)
    primary = 0x840000
    u.mem_map(0x344000, 0x1000)  # HOME global scene-list header
    u.mem_map(primary, 0x9000)
    put32(u, 0x32ebf4 + 0x50, primary)  # supplied Settings title candidate
    put32(u, primary + 0x24, primary + 0x1000)  # model owner
    put32(u, primary + 0x38, 1)  # scene index
    put32(u, primary + 0x44, primary + 0x500)
    put32(u, primary + 0x48, primary + 0x500)  # no model children
    put32(u, 0x344b44, 0)
    put32(u, 0x344b48, 0x344b48)
    put32(u, 0x344b4c, 0x344b48)
    put32(u, 0x32e788, primary + 0x2000)  # supplied scene service
    put32(u, primary + 0x2000, primary + 0x3000)
    put32(u, primary + 0x3000 + 0x10, primary + 0x4000)
    put32(u, 0x32e760, primary + 0x6000)
    put32(u, 0x32e758, primary + 0x7000)
    # This primary's controller list is traversed by the real global pass.
    put32(u, primary + 0x10, CONTROLLER + 0x20)
    put32(u, CONTROLLER + 0x20, primary + 0x10)
    put32(u, CONTROLLER + 0x24, primary + 0x10)
    visited = []
    external_stubs = {0x236128, 0x235510, 0x1f7360, 0x18ba88,
                      0x18a6ec, 0x18a6e0, 0x1f7508, primary + 0x4000}

    def hook(uc, address, size, _):
        if address in (0x1f9e64, 0x1fa344, 0x1f7c78, 0x24f170,
                       0x24f30c, 0x230710, 0x24e0c0, 0x103808,
                       0x10b3d0, 0x24ff10, 0x1038c0):
            visited.append(hex(address))
        if address in external_stubs:
            uc.reg_write(UC_ARM_REG_R0, 0)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
        elif address == 0x1f8450:
            uc.reg_write(UC_ARM_REG_R0, primary + 0x200)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
        elif address == 0x24e0c0:
            uc.emu_stop()
        elif address == 0x1038c0:
            # Scene-1 render dispatch is reached, but no real render owner or
            # selected Settings model is present to yield visible pixels.
            uc.emu_stop()

    u.hook_add(UC_HOOK_CODE, hook)
    u.reg_write(UC_ARM_REG_R0, get32(u, 0x32ebf4 + 0x50))
    u.reg_write(UC_ARM_REG_R1, 1)
    u.emu_start(0x1f9e64, END, count=100)
    assert u.reg_read(UC_ARM_REG_PC) == END
    u.reg_write(UC_ARM_REG_R0, primary)
    u.reg_write(UC_ARM_REG_S0, 0x3f800000)
    u.reg_write(UC_ARM_REG_LR, END)
    u.emu_start(0x1fa344, END, count=10000)
    assert u.reg_read(UC_ARM_REG_PC) == 0x24e0c0
    assert u.mem_read(primary + 0x3c, 1)[0] == 1
    assert get32(u, 0x344b44) == 1
    assert get32(u, 0x344b48) == primary + 4
    assert get32(u, 0x344b4c) == primary + 4
    frames = []
    for _ in range(2):
        u.reg_write(UC_ARM_REG_SP, STACK + 0x800)
        u.reg_write(UC_ARM_REG_LR, END)
        u.emu_start(0x103808, END, count=10000)
        assert u.reg_read(UC_ARM_REG_PC) == 0x1038c0
        frames.append(get_float(u, CONTROLLER + 0xc))
    assert frames == [1.0, 2.0]
    assert visited == ['0x1f9e64', '0x1fa344', '0x1f7c78',
                       '0x24f170', '0x24f30c', '0x230710', '0x24e0c0',
                       '0x103808', '0x10b3d0', '0x24ff10', '0x1038c0',
                       '0x103808', '0x10b3d0', '0x24ff10', '0x1038c0']
    return {'titleId': '0004001000022000', 'candidatePointerSource':
            'synthetic manager +0x50', 'sceneIndex': 1, 'listCount': 1,
            'insertedNode': hex(primary + 4), 'actualVisibleByte': 1,
            'renderDispatchStop': '0x1038c0',
            'controllerFramesAtRenderDispatch': frames, 'visited': visited,
            'scope': 'Original visibility setter, generic update and indirect callback enter original 0x24f170/0x230710, inserting a supplied primary into the global scene list and setting its actual-visible byte. Original 0x103808 reaches it twice, calls 0x10b3d0/0x24ff10, and reaches scene-1 render dispatch. Candidate, model children, scene service and controller are synthetic; external allocators/services are stubbed; CGFX binding, submitted visible pose and pixels are not observed.'}


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
    result['visibilityTransition'] = visibility_transition(code)
    result['nativeSceneInsertion'] = native_scene_insertion(code)
    print(json.dumps(result, indent=2) + '\n', end='')


if __name__ == '__main__':
    main()
