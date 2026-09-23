"""Bounded original ARM keyboard cue probes with declared synthetic boundaries.

Requires Unicorn. No firmware services or audio engine execute. Results stop at
the native cue-request boundary; touch/animation/text acceptance are stub inputs.
"""
import argparse
from pathlib import Path
import struct
import unicorn

from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_R4, UC_ARM_REG_R5, UC_ARM_REG_R7, UC_ARM_REG_R8, UC_ARM_REG_R10, UC_ARM_REG_R11, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC
from firmware.keyboard_audio import CODE_SHA256, json_bytes, sha, source_tables

OBJ, CONFIG, PARENT, LABEL, STACK, STOP = 0x300000, 0x301000, 0x302000, 0x303000, 0x808000, 0x30fff0
RANGES = [(0x1014f0, 0x101538), (0x13fcec, 0x13fd20), (0x13f974, 0x13f9a8),
          (0x1401a0, 0x1401f8), (0x1404cc, 0x14052c), (0x14059c, 0x140748),
          (0x1409d8, 0x140d40), (0x155ed8, 0x155f20), (0x17ea98, 0x17eaf0),
          (0x17de3c, 0x17df0c), (0x182eec, 0x1830dc), (0x183b04, 0x183d50),
          (0x185b64, 0x185c3c), (0x17f774, 0x1800a8),
          (0x191b98, 0x191bb4)]


class Probe:
    def __init__(self, code):
        if sha(code) != CODE_SHA256: raise ValueError('Unexpected keyboard executable')
        self.code = code; self.uc = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        self.uc.mem_map(0x100000, 0x100000); self.uc.mem_write(0x100000, code)
        self.uc.mem_map(0x300000, 0x10000); self.uc.mem_map(0x800000, 0x10000)
        self.uc.mem_write(LABEL, b'fixture\0')
        self.events = []; self.calls = []; self.executed = set()
        self.accepted = True; self.held = False; self.hit = True; self.end = STOP
        self.previous = None
        self.uc.hook_add(UC_HOOK_CODE, self.hook)
        self.run(0x1014f0, end=0x101538)
        self.calls.clear(); self.executed.clear()

    def write(self, address, value): self.uc.mem_write(address, struct.pack('<I', value & 0xffffffff))
    def read(self, address): return struct.unpack('<I', self.uc.mem_read(address, 4))[0]
    def r(self, register): return self.uc.reg_read(register)
    def ret(self, value=None):
        if value is not None: self.uc.reg_write(UC_ARM_REG_R0, value)
        self.uc.reg_write(UC_ARM_REG_PC, self.r(UC_ARM_REG_LR))

    def hook(self, uc, address, size, _):
        if address == self.end:
            uc.emu_stop(); return
        self.executed.add(address)
        branch_address, self.previous = self.previous, address
        args = [self.r(r) for r in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        if address == 0x156300:
            self.events.append({'cueId': args[1], 'requestAddress': address, 'branchAddress': branch_address})
            self.ret(); return
        if address == 0x159cb8:
            self.events.append({'callbackPhase': args[1], 'callbackValue': args[2], 'branchAddress': branch_address})
            self.ret(); return
        if address in (0x15c6d4, 0x15bff0, 0x15b9bc, 0x1029bc, 0x13fb74, 0x13fb60,
                       0x1562e4, 0x1563c8, 0x15af80, 0x111d04, 0x1401f8, 0x140050,
                       0x13f418, 0x13f708, 0x183f2c):
            self.calls.append({'address': address, 'args': args})
            if address == 0x15c6d4: uc.mem_write(args[0], bytes(uc.mem_read(args[1], args[2])))
            elif address == 0x15bff0: uc.mem_write(args[0], bytes(args[1]))
            elif address == 0x15b9bc: uc.mem_write(args[0], b'fixture\0')
            elif address in (0x1401f8, 0x140050): self.ret(int(self.accepted)); return
            elif address == 0x15af80: self.ret(int(self.held)); return
            elif address == 0x1563c8: self.ret(int(self.hit)); return
            elif address in (0x1562e4, 0x111d04): self.ret(1); return
            self.ret(); return
        if not any(start <= address < end for start, end in RANGES):
            raise ValueError(f'Unexpected original-code boundary {address:#x}')

    def run(self, address, *args, end=STOP, registers=None):
        self.end = end
        self.uc.reg_write(UC_ARM_REG_SP, STACK); self.uc.reg_write(UC_ARM_REG_LR, STOP)
        for register, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            self.uc.reg_write(register, value)
        for register, value in (registers or {}).items(): self.uc.reg_write(register, value)
        self.uc.emu_start(address, STOP+4, count=20000)
        if self.r(UC_ARM_REG_PC) != end: raise ValueError('Probe instruction budget exhausted')

    def construct(self, kind, dialog_flag=None):
        self.run(0x140bdc if kind in (1, 3) else 0x140ccc, CONFIG)
        self.write(CONFIG+4, LABEL)
        if dialog_flag is None:
            self.uc.mem_write(STACK+0xc10, bytes(self.uc.mem_read(CONFIG, 0xa0)))
            self.run(0x17ea98, end=0x17eaf0, registers={UC_ARM_REG_R7: kind})
            self.uc.mem_write(CONFIG, bytes(self.uc.mem_read(STACK+0xc10, 0xa0)))
        else:
            self.uc.mem_write(PARENT+0x11a, bytes([dialog_flag]))
            self.run(0x191b98, end=0x191bb4, registers={UC_ARM_REG_R10: PARENT,
                     UC_ARM_REG_R5: 0, UC_ARM_REG_R11: 8})
            self.write(CONFIG+0x2c, self.read(STACK+0x7c))
        ctor = 0x14059c if kind in (4, 5) else 0x140aac if kind in (1, 3) else 0x140c68 if kind in (0, 2) else 0x1409d8
        self.run(ctor, OBJ, CONFIG)
        return [self.read(OBJ+offset) for offset in (0x50, 0x54, 0x58, 0x5c, 0x60)]

    def qwerty_callback(self, key_index, accepted=True, phase=1):
        self.accepted = accepted
        self.write(PARENT+0x610, 52); self.write(PARENT+0x110+key_index*4, OBJ)
        self.write(PARENT+4+key_index*4, CONFIG)
        self.write(CONFIG+0x174, LABEL+0x40); self.write(CONFIG+0x8c, 0)
        self.uc.mem_write(LABEL+0x40, b'a\0')
        # Isolate ordinary text mode and no automatic modifier-reset state.
        self.write(self.read(0x17ffc0), LABEL+0x80)
        self.write(self.read(0x17ffc8)+8, 0)
        self.write(self.read(0x17ffcc), 0)
        self.run(0x17f774, PARENT, OBJ, phase, 0)

    def evidence(self):
        image = bytearray(self.uc.mem_read(0x100000, len(self.code)))
        # The image includes writable data. Only this declared text-object
        # pointer is populated by the fixture; every other original byte stays.
        image[0xb777c:0xb7780] = self.code[0xb777c:0xb7780]
        if image != self.code: raise ValueError('Probe modified an undeclared original image byte')
        return {'events': self.events, 'stubCalls': self.calls,
                'textObjectPointer': {'address': 0x1b777c, 'value': self.read(0x1b777c)},
                'instructionAddresses': sorted(self.executed)}

    def control_phase(self, slot):
        self.run(self.read(self.read(OBJ)+slot), OBJ)


def collect(code):
    _, cues = source_tables(code)
    cases = []
    for name, kind, index in [('character', 0, 0), ('space', 1, 45), ('backspace', 3, 46), ('enter', 2, 47)]:
        for accepted in (True, False):
            p = Probe(code); fields = p.construct(kind)
            p.control_phase(0x28)
            p.qwerty_callback(index, accepted)
            p.control_phase(0x2c)
            cases.append({'name': name, 'accepted': accepted, 'configuredSoundFields': fields, **p.evidence()})
    for flag in (0, 1):
        p = Probe(code); fields = p.construct(9, flag)
        p.control_phase(0x28); p.control_phase(0x2c)
        cases.append({'name': 'dialog-decision', 'sourceButtonFlag': flag, 'configuredSoundFields': fields, **p.evidence()})
    for kind, name in ((4, 'caps'), (5, 'shift')):
        for state in (0, 1):
            p = Probe(code); p.construct(kind)
            p.run(0x1404cc, OBJ, state)
            fields = [p.read(OBJ+offset) for offset in (0x50, 0x54, 0x58, 0x5c, 0x60)]
            p.control_phase(0x28); p.control_phase(0x2c)
            cases.append({'name': name, 'state': state,
                          'resultState': p.uc.mem_read(OBJ+0x214, 1)[0], 'configuredSoundFields': fields, **p.evidence()})
    p = Probe(code); p.construct(0); p.qwerty_callback(0, phase=0)
    cases.append({'name': 'non-decision-callback-phase', 'phase': 0, **p.evidence()})
    excerpts = []
    addresses = sorted({a for case in cases for a in case['instructionAddresses']
                        if any(start <= a < end for start, end in RANGES)})
    for address in addresses:
        if excerpts and excerpts[-1]['end'] == address: excerpts[-1]['end'] += 4
        else: excerpts.append({'start': address, 'end': address+4})
    for excerpt in excerpts:
        excerpt['sha256'] = sha(code[excerpt['start']-0x100000:excerpt['end']-0x100000])
    return {'schema': 1, 'codeSha256': sha(code), 'cues': cues, 'cases': cases,
            'executedSourceExcerpts': excerpts, 'unicornVersion': unicorn.__version__,
            'helpers': {name: sha((Path(__file__).parent/name).read_bytes())
                        for name in ('keyboard_audio.py', 'keyboard_audio_events.py')},
            'limits': ['Synthetic touch/hit/release and text-acceptance boundaries',
                       'Animation and callback side effects are captured, not rendered',
                       'No native audio engine, host timing, gain or SSEQ execution']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--code', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(Path(__file__).resolve().parents[2]) or args.output.exists():
        raise ValueError('Output must be a new private file outside the repository')
    report = collect(args.code.read_bytes())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(json_bytes(report))
    print(f'{len(report["cases"])} bounded keyboard cue cases: {args.output}')
