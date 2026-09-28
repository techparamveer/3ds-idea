"""Replay original keyboard capture allocation, descriptor binding and UV generation.

GPU/resource allocation endpoints return opaque identities. No pixel, clock,
matrix or UV arithmetic is replaced. Output is private evidence, not firmware.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path

from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
from firmware.native import decode_layout

CODE_SHA = 'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0'
BASE, OBJECT, MATERIAL, STORAGE, UV, OUTPUT, STACK, END = (
    0x1000000, 0x1001000, 0x1002000, 0x1003000,
    0x1004000, 0x1005000, 0x1100000, 0x11ff000)


class CaptureReplay:
    def __init__(self, code):
        assert hashlib.sha256(code).hexdigest() == CODE_SHA
        self.code = code
        self.u = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        self.u.mem_map(0x100000, 0x400000)
        self.u.mem_write(0x100000, code)
        self.u.mem_map(BASE, 0x200000)
        self.u.reg_write(UC_ARM_REG_C1_C0_2, 0xf << 20)
        self.u.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        self.events = []
        self.ranges = [(0x199030, 0x19905c), (0x17ae04, 0x17af50),
                       (0x17b488, 0x17b4b4), (0x141da0, 0x141f2c),
                       (0x13d6bc, 0x13db2c), (0x19725c, 0x197270),
                       (0x1972fc, 0x197324), (0x1084d8, 0x108740),
                       (0x15bf30, 0x15bf70)]
        self.u.hook_add(UC_HOOK_CODE, self.hook)

    def word(self, address):
        return struct.unpack('<I', self.u.mem_read(address, 4))[0]

    def write(self, address, *words):
        self.u.mem_write(address, struct.pack('<' + 'I' * len(words), *words))

    def hook(self, u, address, size, data):
        endpoints = {0x17b4b4: ('allocateTexture', 0x7001),
                     0x17b420: ('allocateFramebuffer', 0x7002),
                     0x155420: ('selectTextureResource', 0),
                     0x155040: ('lookupTextureResource', 0),
                     0x15503c: ('texturePhysicalAddress', 0x7003),
                     0x15bd88: ('allocateDescriptor', BASE + 0x100),
                     0x155c5c: ('allocateCallerTextures', 0),
                     0x155260: ('importCallerTexture', 0)}
        if address in endpoints:
            name, result = endpoints[address]
            args = [u.reg_read(r) for r in [UC_ARM_REG_R0, UC_ARM_REG_R1,
                                          UC_ARM_REG_R2, UC_ARM_REG_R3]]
            self.events.append({'endpoint': name, 'args': args})
            if address == 0x155040:
                self.write(args[2], 0x7004)
            if address == 0x155c5c:
                assert args[0] == 3
                self.write(args[1], 0x8001, 0x8002, 0x8003)
            u.reg_write(UC_ARM_REG_R0, result)
            u.reg_write(UC_ARM_REG_PC, u.reg_read(UC_ARM_REG_LR))
            return
        if not any(start <= address < end for start, end in self.ranges):
            raise ValueError(f'Unexpected original execution {address:x}')

    def call(self, address, *args):
        for reg, value in zip([UC_ARM_REG_R0, UC_ARM_REG_R1,
                               UC_ARM_REG_R2, UC_ARM_REG_R3], args):
            self.u.reg_write(reg, value)
        self.u.reg_write(UC_ARM_REG_SP, STACK)
        self.u.reg_write(UC_ARM_REG_LR, END)
        self.u.emu_start(address, END, count=20000)
        assert self.u.reg_read(UC_ARM_REG_PC) == END, 'Instruction budget exceeded'

    def run(self, layout):
        # Execute the original static initializer, not invented dimensions.
        self.call(0x199030)
        dimensions = list(struct.unpack('<4H', self.u.mem_read(0x1b8468, 8)))
        self.call(0x17ae78, OBJECT, 0x7005)
        descriptor = self.word(OBJECT + 4)
        assert dimensions == [320, 240, 512, 256]
        assert list(struct.unpack('<4H', self.u.mem_read(descriptor + 8, 8))) == dimensions
        assert self.u.mem_read(descriptor + 0x10, 1)[0] == 5
        assert self.events[0]['args'] == [512, 256, 0, 0]

        # One sampler, one texture matrix and one coordinate generator. Original
        # getters use these counts to locate each runtime allocation section.
        self.write(MATERIAL + 0x2c, 0x15, 0x15, STORAGE)
        self.write(STORAGE + 0x10, 0xa5a50a80)
        self.u.mem_write(MATERIAL + 0x4d, b'\xff')
        self.call(0x17ae04, OBJECT, MATERIAL)
        bound = list(struct.unpack('<4H', self.u.mem_read(STORAGE + 8, 8)))
        assert bound == dimensions
        assert self.word(STORAGE) == 0x7001 and self.word(STORAGE + 4) == 0x7003
        assert self.word(STORAGE + 0x10) == 0xa5a50580
        assert self.u.mem_read(MATERIAL + 0x4d, 1)[0] == 0xfb

        pane = next(p for p in layout['roots'][0]['children'] if p['name'] == 'P_Aplt_00')
        material = layout['materials'][pane['picture']['material']]
        matrix = material['textureMatrices'][0]
        assert matrix == {'translation': [0., 0.], 'rotation': 0., 'scale': [1., 1.]}
        self.u.mem_write(STORAGE + 32, struct.pack('<5f', *matrix['translation'],
                                                  matrix['rotation'], *matrix['scale']))
        self.u.mem_write(STORAGE + 52, bytes(4))
        source_uv = pane['picture']['uvSets'][0]
        self.u.mem_write(UV, struct.pack('<8f', *source_uv))
        # Initialized static texture pivot for this no-rotation/no-scale branch.
        self.write(0x1b8f90, 1)
        self.call(0x13d6bc, 0, MATERIAL, UV, OUTPUT)
        emitted = list(struct.unpack('<4f', self.u.mem_read(OUTPUT, 16)))
        emitted += list(struct.unpack('<4f', self.u.mem_read(OUTPUT + 0x30, 16)))
        assert emitted == [0., 1., .625, .0625, 0., .0625, .625, 1.]
        capture = {'logicalSize': dimensions[:2], 'allocationSize': dimensions[2:],
                'descriptorFormat': 5, 'picaFormat': self.word(STORAGE + 0x1c),
                'textureSizeWord': self.word(STORAGE + 0x18),
                'sourceUV': source_uv, 'emittedUVOrderTLBRBLTR': emitted,
                'coordinateMode': self.u.reg_read(UC_ARM_REG_R0),
                'endpoints': list(self.events)}
        caller = []
        for platform_format in range(5):
            # Explicit platform handoff inputs: capture available, mono upper,
            # buffer base and source format. These are not an observed boot.
            self.u.mem_write(0x1b7708 + 8, b'\1')
            self.u.mem_write(0x1bc320 + 0x21, b'\1')
            self.write(0x1bd3c8 + 8, 0x8000000)
            self.write(0x1bd3c8 + 0x3c, platform_format)
            self.write(0x1bd3c8 + 0x48, platform_format)
            before = len(self.events)
            self.call(0x1084d8)
            self.call(0x15bf30, 0, 1)
            descriptor = self.u.reg_read(UC_ARM_REG_R0)
            assert descriptor == 0x1bc36c
            size = list(struct.unpack('<4H', self.u.mem_read(descriptor + 8, 8)))
            assert size == [256, 512, 256, 512]
            fmt = self.u.mem_read(descriptor + 0x10, 1)[0]
            assert fmt == [6, 6, 5, 7, 8][platform_format]
            caller.append({'platformFormat': platform_format, 'descriptorFormat': fmt,
                           'logicalAndAllocationSize': size, 'endpoints': self.events[before:]})
        # Reuse the proven common descriptor copy for this UV-only probe;
        # actual caller-owner copy is a separate call site and not replayed.
        self.write(OBJECT + 4, 0x1bc36c)
        self.call(0x17ae04, OBJECT, MATERIAL)
        caller_pane = next(p for p in layout['roots'][0]['children'] if p['name'] == 'P_App_00')
        source_uv = caller_pane['picture']['uvSets'][0]
        self.u.mem_write(UV, struct.pack('<8f', *source_uv))
        self.call(0x13d6bc, 0, MATERIAL, UV, OUTPUT)
        emitted = list(struct.unpack('<4f', self.u.mem_read(OUTPUT, 16)))
        emitted += list(struct.unpack('<4f', self.u.mem_read(OUTPUT + 0x30, 16)))
        assert emitted == [.9375, 1., 0., .375, 0., 1., .9375, .375]
        assert bytes(self.u.mem_read(0x100000, 0xa0000)) == self.code[:0xa0000]
        return {'capture': capture, 'callerCases': caller,
                'callerSourceUV': source_uv, 'callerEmittedUVOrderTLBRBLTR': emitted}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['code', 'layout', 'output']:
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    assert not args.output.resolve().is_relative_to(Path(__file__).resolve().parents[2])
    raw = args.layout.read_bytes()
    result = CaptureReplay(args.code.read_bytes()).run(decode_layout(raw))
    report = {'schema': 1, 'codeSha256': CODE_SHA,
              'layoutSha256': hashlib.sha256(raw).hexdigest(), **result,
              'unverified': ['GPU pixels and padding clear value',
                             'caller platform format/content in a real boot',
                             'caller owner material-copy call site',
                             'browser sample-grid and filtering equivalence']}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'capture': result['capture'], 'callerCases': len(result['callerCases']),
                      'callerUV': result['callerEmittedUVOrderTLBRBLTR']}))


if __name__ == '__main__':
    main()
