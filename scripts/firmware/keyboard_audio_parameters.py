"""Original keyboard ARM wave parameters through the CSND command boundary.

Private, opt-in evidence only. Synthetic voice allocation, physical mapping and
stereo query; no firmware service, CSND decoder or host audio execution.
"""
import argparse
from pathlib import Path
import struct
import unicorn
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2,
    UC_ARM_REG_R3, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC,
    UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC, UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2)
from firmware.keyboard_audio import (ARCHIVE, ARCHIVE_SHA256, CODE_SHA256,
    decode_bcwav, json_bytes, sha, source_tables)
from unpack_home_resources import prepare

PLAYER, VOICE, CHANNEL, HANDLE, MANAGER, SCHEDULER = (0x300000, 0x301000, 0x302000, 0x303000, 0x304000, 0x305000)
RAW, STACK, STOP = 0x400000, 0x808000, 0x30fff0
RANGES = [(0x156300, 0x1563c8), (0x1174e8, 0x117680), (0x197fb4, 0x197fc4),
          (0x1310d0, 0x1312a8), (0x135874, 0x135988), (0x1385b4, 0x1387d0),
          (0x138814, 0x138854), (0x165a10, 0x165bc8), (0x165e10, 0x165f80),
          (0x138b5c, 0x138b68), (0x152018, 0x15204c), (0x12c228, 0x12c404),
          (0x12f228, 0x12f2fc), (0x129d74, 0x129da8)]


def float_word(value): return struct.unpack('<I', struct.pack('<f', value))[0]


class Probe:
    def __init__(self, code, members, stereo=True):
        if sha(code) != CODE_SHA256: raise ValueError('Unexpected keyboard executable')
        self.code = code; self.uc = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        for address, length in [(0x100000, 0x100000), (0x300000, 0x10000), (RAW, 0x100000), (0x800000, 0x10000)]:
            self.uc.mem_map(address, length)
        self.uc.mem_write(0x100000, code)
        self.uc.reg_write(UC_ARM_REG_C1_C0_2, 0xf << 20)
        self.uc.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        self.stereo = stereo; self.commands = []; self.stubs = []; self.executed = set(); self.phase = 'request'
        self.addresses = {}; names, self.cues = source_tables(code)
        for i, name in enumerate(names):
            address = RAW+i*0x10000
            raw = members[name]
            if len(raw) >= 0x10000: raise ValueError('Resource exceeds fixture slot')
            self.uc.mem_write(address, raw); self.write(0x1b7adc+i*8+4, address)
            self.addresses[name] = address
        self.write(PLAYER+0x61c, MANAGER); self.write(PLAYER+0x624, VOICE)
        self.write(VOICE, VOICE); self.write(VOICE+4, VOICE); self.write(VOICE+0x50, PLAYER)
        self.uc.mem_write(CHANNEL+8, b'\x07')
        # Original table vtable: +0 resource getter, +4 cue getter 0x197fb4.
        self.write(MANAGER, 0x1ad6d0); self.write(MANAGER+0xc, 0x1b7b5c)
        self.write(MANAGER+0x10, 19); self.write(SCHEDULER, PLAYER)
        self.uc.hook_add(UC_HOOK_CODE, self.hook)

    def write(self, address, value): self.uc.mem_write(address, struct.pack('<I', value & 0xffffffff))
    def read(self, address): return struct.unpack('<I', self.uc.mem_read(address, 4))[0]
    def r(self, register): return self.uc.reg_read(register)
    def ret(self, value):
        self.uc.reg_write(UC_ARM_REG_R0, value)
        self.uc.reg_write(UC_ARM_REG_PC, self.r(UC_ARM_REG_LR))

    def hook(self, uc, address, size, _):
        if address == STOP: uc.emu_stop(); return
        self.executed.add(address)
        args = [self.r(r) for r in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        if address == 0x151b48:
            self.commands.append({'phase': self.phase, 'id': args[0], 'words': args[1:]+[self.read(self.r(UC_ARM_REG_SP)+i*4) for i in range(3)]})
            self.ret(1); return
        if address in (0x1382a0, 0x14fa8c, 0x1697b8):
            value = CHANNEL if address == 0x1382a0 else int(self.stereo) if address == 0x1697b8 else args[0]+0x10000000
            self.stubs.append({'address': address, 'args': args, 'return': value})
            self.ret(value); return
        if not any(lo <= address < hi for lo, hi in RANGES):
            raise ValueError(f'Unexpected original-code boundary {address:#x}')

    def run(self, address, *args):
        self.uc.reg_write(UC_ARM_REG_SP, STACK); self.uc.reg_write(UC_ARM_REG_LR, STOP)
        self.write(STACK, 0)
        for register, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            self.uc.reg_write(register, value)
        self.uc.emu_start(address, STOP+4, count=20000)
        if self.r(UC_ARM_REG_PC) != STOP: raise ValueError('Probe instruction budget exhausted')

    def request(self, cue):
        if not 0 <= cue < len(self.cues): raise ValueError('Cue outside source table')
        if self.cues[cue]['kindWord'] != 0: raise ValueError('SSEQ playback unsupported')
        self.run(0x156300, SCHEDULER, cue, HANDLE, 0)

    def resource(self, name, gain=1, pan=0, pitch=1):
        for register, value in zip((UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2), (gain, pan, pitch)):
            self.uc.reg_write(register, float_word(value))
        self.run(0x135874, VOICE, HANDLE, self.addresses[name])
        if self.r(UC_ARM_REG_R0) != 1: raise ValueError('Wave prepare failed')
        self.run(0x13597c, VOICE)

    def update(self):
        self.phase = 'first-service-update'; self.run(0x117530, VOICE)

    def evidence(self):
        image = bytearray(self.uc.mem_read(0x100000, len(self.code)))
        for i in range(16):
            offset = 0xb7ae0+i*8
            image[offset:offset+4] = self.code[offset:offset+4]
        if image != self.code: raise ValueError('Undeclared original-image mutation')
        return {'commands': self.commands, 'stubCalls': self.stubs, 'instructionAddresses': sorted(self.executed),
                'voiceParameterWords': [f'{self.read(VOICE+offset):08x}' for offset in (0x18, 0x1c, 0x20)],
                'voiceFlags': list(self.uc.mem_read(VOICE+0x54, 3)),
                'requestedChannelVolumes': [self.read(VOICE+0x3c), self.read(VOICE+0x40)]}


def collect(extracted):
    extracted = Path(extracted)
    code = (extracted/'exefs/code.bin').read_bytes()
    raw = (extracted/'romfs'/ARCHIVE).read_bytes()
    if sha(raw) != ARCHIVE_SHA256: raise ValueError('Unexpected keyboard sound archive')
    members, _ = prepare(raw); names, cues = source_tables(code)
    if set(members) != set(names): raise ValueError('Source table/archive mismatch')
    cases = []
    for cue in cues:
        if cue['kindWord'] == 1: continue
        p = Probe(code, members); p.request(cue['id'])
        before = list(p.uc.mem_read(VOICE+0x54, 3)); p.update()
        cases.append({'kind': 'native-cue', 'cueId': cue['id'], 'member': cue['member'],
                      'flagsBeforeUpdate': before, **p.evidence()})
    for name in names:
        if name.endswith('.sseq'): continue
        p = Probe(code, members); p.resource(name); p.update()
        meta, _ = decode_bcwav(members[name])
        cases.append({'kind': 'resource-prepare', 'member': name, 'source': meta, **p.evidence()})
    # Controlled inputs exercise original arithmetic, not additional native cues.
    name = names[12]
    for gain, pan, pitch, stereo, force_center in [
        (1,-1,1,True,False), (1,1,1,True,False), (1,.25,1,True,False),
        (2,2,0,True,False), (-1,-2,-1,True,False),
        (1,1,1,False,False), (1,1,1,True,True)]:
        p = Probe(code, members, stereo); p.resource(name,gain,pan,pitch)
        p.uc.mem_write(PLAYER+0x622, bytes([force_center])); p.update()
        cases.append({'kind': 'controlled-parameters', 'gain': gain, 'pan': pan, 'pitch': pitch,
                      'stereo': stereo, 'forceCenter': force_center, **p.evidence()})
    excerpts = []
    for address in sorted({a for c in cases for a in c['instructionAddresses'] if any(lo <= a < hi for lo, hi in RANGES)}):
        if excerpts and excerpts[-1]['end'] == address: excerpts[-1]['end'] += 4
        else: excerpts.append({'start': address, 'end': address+4})
    for item in excerpts: item['sha256'] = sha(code[item['start']-0x100000:item['end']-0x100000])
    return {'schema': 1, 'codeSha256': sha(code), 'archiveSha256': sha(raw), 'cases': cases,
            'cues': cues, 'unsupportedCueIds': [6,7], 'executedSourceExcerpts': excerpts,
            'panTable': {'address': 0x1a00a8, 'words': [f'{v:08x}' for v in struct.unpack_from('<257I', code, 0xa00a8)]},
            'timerClockFloatWord': f'{struct.unpack_from("<I", code, 0x65bc8)[0]:08x}',
            'unicornVersion': unicorn.__version__,
            'helpers': {name: sha((Path(__file__).parent/name).read_bytes()) for name in ('keyboard_audio.py', 'keyboard_audio_parameters.py')},
            'limits': ['Synthetic initialized manager, one free voice and one channel; no voice stealing',
                       'Allocator, virtual-to-physical mapping, stereo setting and CSND submission stubbed',
                       'Only first service update; no host timing, fade scheduling, mixing or hardware decoding',
                       'All 15 wave resources exercised directly; two loop resources have no direct wave cue',
                       'SSEQ cues 6 and 7 rejected; sequence use of the loop resources remains unresolved']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--extracted', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or args.output.resolve().is_relative_to(Path(__file__).resolve().parents[2]):
        raise ValueError('Output must be a new private file outside the repository')
    report = collect(args.extracted)
    args.output.parent.mkdir(parents=True, exist_ok=True); args.output.write_bytes(json_bytes(report))
    print(f'{len(report["cases"])} wave parameter cases: {args.output}')
