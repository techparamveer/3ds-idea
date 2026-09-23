"""Pinned original keyboard SSEQ orchestration through native wave commands.

Private evidence only; no firmware service or hardware decoder executes.
"""
import argparse
from pathlib import Path
import struct
import unicorn
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2,
    UC_ARM_REG_R3, UC_ARM_REG_R5, UC_ARM_REG_R7, UC_ARM_REG_SP, UC_ARM_REG_LR,
    UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2)
from firmware.keyboard_audio_parameters import (Probe as Base, RANGES as WAVE_RANGES,
    PLAYER, MANAGER, SCHEDULER, HANDLE, CHANNEL, RAW, STOP)
from firmware.keyboard_audio import ARCHIVE, ARCHIVE_SHA256, json_bytes, sha, source_tables
from firmware.keyboard_sequence import interpret
from unpack_home_resources import prepare
SEQUENCE_RANGES=[(0x111dd8,0x111e64),(0x18a9dc,0x18a9e0),(0x167cc0,0x167cd0),(0x15c79c,0x15c9b0),(0x116ee0,0x117008),(0x117680,0x11768c),(0x12b5a0,0x12b61c),(0x12b620,0x12b838),
(0x12b844,0x12b8dc),(0x12b8dc,0x12bd34),(0x12bd40,0x12be60),(0x12be60,0x12bf30),
(0x1300dc,0x1310c8),(0x1354b8,0x135648),(0x135648,0x1357d4),(0x1357e0,0x135870),
(0x138908,0x138b54),(0x138bf8,0x139248),(0x166048,0x166070),(0x1660a0,0x166224),
(0x1697f8,0x169b24),(0x169b2c,0x169b80),(0x16a8c4,0x16a8f4),
(0x14f774,0x14f8d0),(0x14f908,0x14fa40),(0x18bd9c,0x18bdec),
(0x18bf8c,0x18bfa8),(0x18bfa8,0x18c08c),(0x18c090,0x18c18c),(0x197fc4,0x197fe4),
(0x15afe0,0x15b04c),(0x151f0c,0x152018),(0x1516a8,0x151750),(0x165f8c,0x166040)]
ENGINE=0x1c3d70;BACKEND=PLAYER+0x62c
class Probe(Base):
    def __init__(self,code,members):
        self.quantum=0;self.frames=0;self.events=[];self.mutations=set();self.alive=set();self.boundaries=[];self.trace=[]
        super().__init__(code,members)
        self.write(MANAGER+0x14,0x1b7adc)
        self.write(BACKEND,0x1ad6e0);self.write(BACKEND+0x24,PLAYER);self.write(BACKEND+0x28,MANAGER)
        for i in range(17):
            p=PLAYER+i*0x5c;self.run(0x18c008,p);self.write(p+0x50,PLAYER)
            self.write(p,PLAYER+((i-1)%17)*0x5c);self.write(p+4,PLAYER+((i+1)%17)*0x5c)
        self.write(PLAYER+0x624,PLAYER);self.write(PLAYER+0x628,0)
        self.uc.mem_write(PLAYER+0x620,b"\x01")
        self.uc.hook_add(UC_HOOK_MEM_WRITE,self.memhook)
        self.run(0x116ee0,BACKEND)
    def memhook(self,uc,access,address,size,value,data):
        if 0x100000<=address<0x100000+len(self.code):self.mutations.update(range(address,address+size))
    def hook(self,uc,a,size,data):
        if a==STOP:uc.emu_stop();return
        self.executed.add(a);args=[self.r(r) for r in (UC_ARM_REG_R0,UC_ARM_REG_R1,UC_ARM_REG_R2,UC_ARM_REG_R3)]
        if a==0x12bd40:self.quantum+=1
        if a==0x130238:
            ptr=args[1];track=self.r(UC_ARM_REG_R7);self.events.append({'serviceQuantum':self.quantum,'event':'opcode','track':track,'offset':ptr-(RAW+15*0x10000),'opcode':uc.mem_read(ptr,1)[0]})
        if a in (0x1354b8,0x169b2c,0x135570,0x18c0ac,0x151f0c,0x18a9dc,0x197fc4):
            self.events.append({'serviceQuantum':self.quantum,'event':hex(a),'args':args,'floatWords':[self.r(r) for r in (UC_ARM_REG_S0,UC_ARM_REG_S1,UC_ARM_REG_S2)]})
        if a==0x18c0ac:
            self.events[-1]['backendParameterWords'] = dict(zip(
                ('gain','pitch','pan'),self.events[-1]['floatWords']))
        if a==0x1354b8:
            track=self.r(UC_ARM_REG_R7);address=self.r(UC_ARM_REG_R5)
            self.events[-1]['note']={'track':track,'key':args[1],'velocity':args[2],'duration':args[3],
                'program':struct.unpack('<H',uc.mem_read(address+2,2))[0], 'volume':uc.mem_read(address+4,1)[0],
                'pan':struct.unpack('<b',uc.mem_read(address+8,1))[0], 'adsr':list(uc.mem_read(address+0xe,4))}
        if a in (0x151544,0x1382a0,0x134ed4,0x129da8,0x14fa8c,0x1697b8,0x115118,0x129b94):
            self.boundaries.append({'serviceQuantum':self.quantum,'address':a,'args':args})
        if a in (0x115118,0x129b94):self.ret(0);return
        if a==0x151544:
            uc.mem_write(args[0],bytes([args[2]&255])*args[1]);self.ret(args[0]);return
        if a==0x1382a0:
            i=(args[1]-PLAYER)//0x5c
            if not 0<=i<17 or (args[1]-PLAYER)%0x5c: raise ValueError('Unexpected wave voice allocator input')
            channel=CHANNEL+i*0x40;uc.mem_write(channel+8,bytes([i,i]));self.alive.add(channel);self.ret(channel);return
        if a==0x134ed4:self.alive.discard(args[0]);self.ret(1);return
        if a==0x129da8:
            uc.mem_write(args[0]+0xc,bytes([args[0] in self.alive]));self.ret(args[0]+0xc);return
        if a==0x151b48:
            self.commands.append({'serviceQuantum':self.quantum,'frame':self.frames,'id':args[0],'words':args[1:]+[self.read(self.r(UC_ARM_REG_SP)+i*4) for i in range(3)]});self.ret(1);return
        if a in (0x14fa8c,0x1697b8):self.ret(args[0]+0x10000000 if a==0x14fa8c else 1);return
        if not any(lo<=a<hi for lo,hi in WAVE_RANGES+SEQUENCE_RANGES):raise ValueError(f'unexpected {a:#x} lr={self.r(UC_ARM_REG_LR):#x}')
    def request(self,cue):
        if cue not in (6,7): raise ValueError('Only source sequence cues 6 and 7 are supported')
        self.run(0x156300,SCHEDULER,cue,HANDLE,0)
    def frame(self):
        self.frames+=1;self.run(0x111dd8,PLAYER)
        self.trace.append({'frame':self.frames,'serviceQuantum':self.quantum,
            'sequenceFlags':list(self.uc.mem_read(ENGINE+0x240,1)), 'allocatedWaveChannels':sorted(self.alive),
            'sequenceSlots':[self.read(0x1b863c+i*4) for i in range(2)]})

    def evidence(self):
        allowed = [(0x1b8630,0x1b864c),(0x1b8fb8,0x1b8fc4),(0x1b8fc8,0x1b8fd0)]
        if any(not any(lo <= a < hi for lo,hi in allowed) for a in self.mutations):
            raise ValueError('Undeclared original-image write')
        image = bytearray(self.uc.mem_read(0x100000,len(self.code)))
        for lo,hi in allowed+[(0x1b7ae0+i*8,0x1b7ae4+i*8) for i in range(16)]:
            image[lo-0x100000:hi-0x100000] = self.code[lo-0x100000:hi-0x100000]
        if image != self.code: raise ValueError('Undeclared original-image mutation')
        return {'events':self.events,'commands':self.commands,'frames':self.trace,
                'stubCalls':self.boundaries,'instructionAddresses':sorted(self.executed),
                'changedImageAddresses':sorted(self.mutations),'allowedMutableImageRanges':allowed,
                'finalHandle':self.read(HANDLE),'finalActiveVoices':len(self.alive)}


def collect(extracted):
    extracted = Path(extracted)
    code = (extracted/'exefs/code.bin').read_bytes()
    raw = (extracted/'romfs'/ARCHIVE).read_bytes()
    if sha(raw) != ARCHIVE_SHA256: raise ValueError('Unexpected keyboard archive')
    members,_ = prepare(raw); names,cues = source_tables(code)
    if set(members) != set(names): raise ValueError('Source table/archive mismatch')
    parsed = interpret(members['common_back.sseq'])
    bank = []
    for index in range(2):
        resource,root,*adsr = struct.unpack_from('<IIBBBB',code,0xb7d70+index*12)
        bank.append({'program':index,'resourceId':resource,'member':names[resource],
                     'rootKey':root,'adsr':adsr,'recordAddress':0x1b7d70+index*12})
    cases = []
    for cue,stop_frame in [(6,None),(7,None),(6,10)]:
        p = Probe(code,members);p.request(cue)
        initial = {'sequenceId':p.read(PLAYER+0x65c),
                   'sequenceFlags':list(p.uc.mem_read(ENGINE+0x240,1)),
                   'trackIds':list(p.uc.mem_read(ENGINE+0x248,16)),
                   'masterVolume':p.uc.mem_read(ENGINE+0x245,1)[0],
                   'tempoWord':struct.unpack('<H',p.uc.mem_read(ENGINE+0x258,2))[0],
                   'tempoScaleWord':struct.unpack('<H',p.uc.mem_read(ENGINE+0x25a,2))[0]}
        for _ in range(120):
            p.frame()
            if p.frames == stop_frame:
                p.events.append({'serviceQuantum':p.quantum,'event':'explicit-stop','frame':p.frames,'sequenceId':initial['sequenceId']})
                p.run(0x12b844,initial['sequenceId'])
            if not (p.uc.mem_read(ENGINE+0x240,1)[0]&1) and not p.alive:
                count = len(p.commands); p.frame()
                if len(p.commands) != count: raise ValueError('Commands remain after completion')
                break
        else: raise ValueError('Sequence completion budget exhausted')
        evidence = p.evidence()
        if stop_frame is None:
            if any(e['serviceQuantum'] % 2 != 1 for e in p.events if e['event']=='opcode'):
                raise ValueError('Opcode executed between native sequence ticks')
            actual = [{'tick':(e['serviceQuantum']-1)//2,'track':e['track'],'offset':e['offset'],'opcode':e['opcode']}
                      for e in p.events if e['event']=='opcode']
            if actual != parsed['events']: raise ValueError('Independent interpreter/native opcode timeline mismatch')
            actual_notes = [dict(tick=(e['serviceQuantum']-1)//2, **e['note']) for e in p.events if 'note' in e]
            expected_notes = [{k:v for k,v in n.items() if k!='offset'} for n in parsed['notes']]
            if actual_notes != expected_notes: raise ValueError('Independent interpreter/native note controls mismatch')
        cases.append({'cueId':cue,'stopAfterFrame':stop_frame,'initialState':initial,**evidence})
    excerpts = []
    for address in sorted({a for c in cases for a in c['instructionAddresses'] if any(lo <= a < hi for lo,hi in WAVE_RANGES+SEQUENCE_RANGES)}):
        if excerpts and excerpts[-1]['end']==address: excerpts[-1]['end']+=4
        else: excerpts.append({'start':address,'end':address+4})
    for item in excerpts:item['sha256']=sha(code[item['start']-0x100000:item['end']-0x100000])
    return {'schema':1,'codeSha256':sha(code),'archiveSha256':sha(raw),'sequence':parsed,'bank':bank,
            'nativeClock':{'playerStepWord':f'{struct.unpack_from("<I",code,0x11e64)[0]:08x}',
                           'serviceStepWord':f'{struct.unpack_from("<I",code,0x17010)[0]:08x}'},
            'cues':[cues[6],cues[7]],'cases':cases,'executedSourceExcerpts':excerpts,
            'unicornVersion':unicorn.__version__,
            'helpers':{name:sha((Path(__file__).parent/name).read_bytes()) for name in
                       ('keyboard_audio.py','keyboard_audio_parameters.py','keyboard_sequence.py','keyboard_sequence_native.py')},
            'limits':['Initialized synthetic 17-voice player with original backend vtable; native manager constructor omitted',
                      'Memory fill, channel allocate/free/status, physical mapping, stereo, queue/cache status and CSND submission are stub boundaries',
                      'Loop channels stay active until native stop; no hardware decoder, interpolation, queue execution or wall-clock timing',
                      'Native sequence parsing, envelope arithmetic, pitch math, wave lookup and wave command construction execute',
                      'Isolated Python interpreter covers source track controls only; native envelopes are fixtures, not a Python synthesizer',
                      'Concurrent sequence requests and host lifecycle interruption are outside these cases']}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--extracted',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if args.output.exists() or args.output.resolve().is_relative_to(Path(__file__).resolve().parents[2]):
        raise ValueError('Output must be a new private file outside the repository')
    report=collect(args.extracted)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_bytes(json_bytes(report))
    print(f'{len(report["cases"])} native keyboard sequence cases: {args.output}')
