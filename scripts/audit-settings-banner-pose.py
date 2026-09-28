#!/usr/bin/env python3
"""Bounded static Settings HOME primary audit. Supply absolute private/public paths.

Run with a Python environment containing Capstone. No firmware bytes are emitted.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import UC_ARM_REG_LR, UC_ARM_REG_R0, UC_ARM_REG_SP

BASE = 0x100000
CODE_SHA = '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
BANNER_SHA = '5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac'
MODEL_SHA = '96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d'
CAMERA_SHA = '19d1009bc472a34626a10ec903d689fbd4b3b6951addc28beaa4f155db9bf897'
ANCHORS = {
    0x24ca24: 'bl #0x1fa0fc',  # type-1 worker constructs the generic primary
    0x1fa110: 'str r1, [r0]',  # its vtable is installed
    0x24c264: 'blx r1',       # common manager dispatches primary virtual +0x14
    0x1fa490: 'b #0x24e0c0',  # visibility handler continues into common pose
    0x24e0ec: 'cmp r0, #0x258',  # yaw period 600
    0x24e424: 'str r0, [r1, #0x5c]',  # primary outer X
    0x24e42c: 'vstr s0, [r1, #0x6c]',  # displacement + offset Y
    0x249c8c: 'bl #0x24def0',  # title presentation prepares COMMON
    0x24dfdc: 'bl #0x1f8028',  # skeletal controller lookup
    0x249d18: 'bl #0x2357ac',  # presentation worker launch
    0x249d44: 'strge r0, [r5, #0xc0]',  # state 5 only if worker launch succeeded
    0x24a5f8: 'bl #0x1f9174',  # state 5 waits for worker
    0x24a654: 'bl #0x1f90cc',  # current-request predicate
    0x24a668: 'movne r1, #1',  # true: visibility 1
    0x24a66c: 'blne #0x1f9e64',  # true: request show
    0x24a690: 'movne r1, #0',  # false: visibility 0
    0x24a694: 'blne #0x1f9e64',  # false: request hide
    0x24a6b0: 'str r0, [r4, #0xc0]',  # then state 6
    0x1f90ec: 'eor r3, r3, r5',  # title-key comparison
    0x1f9118: 'cmp r0, r1',      # requested/current native type comparison
    0x1f9124: 'bl #0x1f8fd0',   # primary pointer eligibility
    0x1f9134: 'cmp r0, #0',      # manager flag +5
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def execute_show_predicate(code, mutation=None):
    """Execute only original 0x1f90cc with synthetic manager/key memory."""
    uc = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    uc.mem_map(0x100000, 0x300000)
    uc.mem_write(BASE, code)
    for address in (0x500000, 0x600000, 0x700000):
        uc.mem_map(address, 0x1000)
    title_key = struct.pack('<IIB', 0x22000, 0x40010, 0)
    uc.mem_write(0x34c240, title_key)
    uc.mem_write(0x34c250, title_key)
    manager = 0x32ebf4
    uc.mem_write(manager + 3, b'\x01')
    uc.mem_write(manager + 6, b'\x01')
    uc.mem_write(manager + 0x50, struct.pack('<I', 0x500000))
    uc.mem_write(manager + 0x58, struct.pack('<I', 0x500000))
    if mutation:
        mutation(uc)
    uc.reg_write(UC_ARM_REG_SP, 0x600800)
    uc.reg_write(UC_ARM_REG_LR, 0x700000)
    uc.emu_start(0x1f90cc, 0x700000, count=200)
    return uc.reg_read(UC_ARM_REG_R0)


def main():
    parser = argparse.ArgumentParser()
    for name in ('code', 'banner', 'model', 'camera'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    paths = {name: getattr(args, name) for name in ('code', 'banner', 'model', 'camera')}
    if any(not path.is_absolute() for path in paths.values()):
        parser.error('all input paths must be absolute')
    code = args.code.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    assert digest(args.banner) == BANNER_SHA
    model = json.loads(args.model.read_text())
    camera = json.loads(args.camera.read_text())
    assert model['sourceSha256'] == MODEL_SHA
    assert camera['sourceSha256'] == CAMERA_SHA
    cs = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    instructions = {}
    for address, expected in ANCHORS.items():
        decoded = list(cs.disasm(code[address-BASE:address-BASE+4], address))
        actual = decoded[0].mnemonic + ' ' + decoded[0].op_str if len(decoded) == 1 else None
        assert actual == expected, (hex(address), actual, expected)
        instructions[hex(address)] = actual
    u32 = lambda address: int.from_bytes(code[address-BASE:address-BASE+4], 'little')
    assert u32(0x1fa188) == 0x3210f0
    assert u32(0x3210f0 + 0x14) == 0x1fa344
    assert u32(0x3210f0 + 0x18) == 0x24e498
    selected = model['models']
    assert len(selected) == 1 and selected[0]['name'] == 'COMMON' and len(selected[0]['meshes']) == 12
    clips = model['skeletalAnimations']
    assert len(clips) == 1 and clips[0]['Name'] == 'COMMON' and clips[0]['FramesCount'] == 600
    assert 'IsLooping' in clips[0]['AnimationFlags'] and not model['materialAnimations']
    cameras = camera['cameras']
    assert len(cameras) == 1 and cameras[0]['name'] == 'BannerCamera'
    assert cameras[0]['position'] == [0, 1, 44.7859992980957]
    assert cameras[0]['aimTarget'] == [0, 1, 0]
    predicate_cases = {
        'matching_current_request': (None, 1),
        'retargeted_title_key': (lambda uc: uc.mem_write(0x34c250, struct.pack('<I', 0x22001)), 0),
        'retargeted_native_type': (lambda uc: uc.mem_write(0x32ebf4 + 6, b'\x07'), 0),
        'ineligible_primary_pointer': (lambda uc: uc.mem_write(0x32ebf4 + 0x58, struct.pack('<I', 0x500004)), 0),
        'manager_flag_set': (lambda uc: uc.mem_write(0x32ebf4 + 5, b'\x01'), 0),
    }
    executed = {}
    for name, (mutation, expected) in predicate_cases.items():
        actual = execute_show_predicate(code, mutation)
        assert actual == expected, (name, actual, expected)
        executed[name] = actual
    result = {
        'firmware': 'EUR HOME 10.7.0-32E', 'titleId': '0004001000022000',
        'codeSha256': CODE_SHA, 'bannerSha256': BANNER_SHA,
        'modelSourceSha256': MODEL_SHA, 'cameraSourceSha256': CAMERA_SHA,
        'genericPrimaryVtable': '0x3210f0', 'managerVisibilityHandler': '0x1fa344',
        'commonPoseHandler': '0x24e0c0', 'titleSkeletalClip': 'COMMON',
        'titleSkeletalFrames': 600, 'titleMaterialClip': None,
        'camera': {key: cameras[0][key] for key in ('name', 'position', 'aimTarget', 'perspectiveFovRadians', 'aspect', 'near', 'far')},
        'executedShowPredicate': executed,
        'instructions': instructions,
        'method': 'Static ARM instructions, vtable pointers, hashes and converted resource metadata; bounded original ARM execution of 0x1f90cc with synthetic manager/key memory; no worker, GPU or native display execution.',
    }
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
