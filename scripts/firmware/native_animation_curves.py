"""Original CTR Hermite sampler and keyboard opening pane/material submissions.

Runs bounded original ARM/VFP against source key bytes and synthetic target
objects. No firmware services, matrices, GPU or timing are simulated.
"""
import argparse,hashlib,json,struct
from pathlib import Path
from unicorn import Uc,UC_ARCH_ARM,UC_MODE_ARM,UC_HOOK_CODE
from unicorn.arm_const import *
from firmware.native import sections,decode_animation
SHA={'keyboard':'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0','home':'243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'}
SAMPLER={'keyboard':0x141f2c,'home':0x209cd0}
PANE_APPLY={'keyboard':0x175a68,'home':0x1a137c}
MATERIAL_APPLY={'keyboard':0x175cf4,'home':0x1a1608}
PANE_BYTE={'keyboard':0x1767e4,'home':0x1a2074}
MATERIAL_BYTE={'keyboard':0x179340,'home':0x209c90}
START,OBJECT,PANE,VTABLE,STACK,END=0x1000000,0x1100000,0x1101000,0x1102000,0x1200000,0x12ff000

def sha(b):return hashlib.sha256(b).hexdigest()
def bits(f):return struct.unpack('<I',struct.pack('<f',f))[0]
def f32(f):return struct.unpack('<f',struct.pack('<f',f))[0]
class Replay:
 def __init__(self,code,title):
  assert sha(code)==SHA[title];self.code=code;self.title=title;self.u=Uc(UC_ARCH_ARM,UC_MODE_ARM);u=self.u
  u.mem_map(0x100000,0x400000);u.mem_write(0x100000,code);u.mem_map(START,0x300000)
  u.reg_write(UC_ARM_REG_C1_C0_2,0xf<<20);u.reg_write(UC_ARM_REG_FPEXC,0x40000000)
  self.ranges=[(SAMPLER[title],SAMPLER[title]+0x174)]
  self.ranges += [(PANE_APPLY[title],PANE_APPLY[title]+0x27c),(MATERIAL_APPLY[title],MATERIAL_APPLY[title]+0x2d8),(PANE_BYTE[title],PANE_BYTE[title]+0x1c),(MATERIAL_BYTE[title],MATERIAL_BYTE[title]+0x40)]
  u.hook_add(UC_HOOK_CODE,self.hook)
 def hook(self,u,a,size,data):
  if not any(lo<=a<hi for lo,hi in self.ranges):raise ValueError(f'Unexpected original execution {a:x}')
 def write(self,a,*values):self.u.mem_write(a,struct.pack('<'+'I'*len(values),*values))
 def call(self,a,*args):
  for reg,value in zip([UC_ARM_REG_R0,UC_ARM_REG_R1,UC_ARM_REG_R2],args):self.u.reg_write(reg,value)
  self.u.reg_write(UC_ARM_REG_SP,STACK);self.u.reg_write(UC_ARM_REG_LR,END);self.u.emu_start(a,END,count=20000)
  assert self.u.reg_read(UC_ARM_REG_PC)==END,'Instruction budget exceeded'
 def sample(self,keys,count,frame):
  self.u.mem_write(START,keys);self.u.reg_write(UC_ARM_REG_S0,bits(frame));self.call(SAMPLER[self.title],START,count)
  return struct.unpack('<f',struct.pack('<I',self.u.reg_read(UC_ARM_REG_S0)))[0]
 def apply(self,pai,frame,index,binding):
  self.u.mem_write(START,pai);self.u.mem_write(PANE,bytes(0x200));self.write(OBJECT+0xc,START,bits(frame))
  self.write(PANE,VTABLE);self.write(VTABLE+0x18,PANE_BYTE[self.title])
  self.call(PANE_APPLY[self.title] if binding=='pane' else MATERIAL_APPLY[self.title],OBJECT,index,PANE)
  return {'translation':list(struct.unpack('<3f',self.u.mem_read(PANE+0x28,12))),
          'alpha':self.u.mem_read(PANE+0xb4,1)[0]} if binding=='pane' else {'colors':list(self.u.mem_read(PANE+0x10,28))}
 def check(self):assert bytes(self.u.mem_read(0x100000,len(self.code)))==self.code,'Original image mutated'

def collect(keyboard_code,home_code,members,home_animations):
 code={k:p.read_bytes() for k,p in [('keyboard',keyboard_code),('home',home_code)]};machines={k:Replay(v,k) for k,v in code.items()}
 sampler=code['keyboard'][0x41f2c:0x420a0]
 assert code['home'][0x109cd0:0x109e44]==sampler,'HOME sampler differs'
 curves={};sources={};applications=[]
 paths=[members/'swkbd_common_LZ.bin/anim'/f'ApltFade_{screen}_00_{direction}.bclan' for screen in ['D','U'] for direction in ['SceneIn','SceneOut']]
 paths += sorted((members/'swkbd_qwerty_LZ.bin/anim').glob('Keytop_qwerty*.bclan'))
 paths += [home_animations/(name+'.bclan') for name in ['LncIconFolderInT_00_PicToggle','LncFolder_00_FadeIn','LncCsrEfct_00_DisAppear','LncIconDist_01_Select','LncIconDist_01_Decide']]
 for path in paths:
  raw=path.read_bytes();name=str(path.relative_to(members)) if path.is_relative_to(members) else 'home/'+path.name;sources[name]=sha(raw);decoded=decode_animation(raw)
  pai=next(r for tag,r in sections(raw,b'CLAN')[1] if tag=='pai1')
  count,table=pai.read('HI',14)
  for i in range(count):
   base=pai.u32(table+i*4);n=pai.read('B',base+20)[0]
   for j in range(n):
    info=base+pai.u32(base+24+j*4)
    for k in range(pai.read('B',info+4)[0]):
     track=info+pai.u32(info+8+k*4);curve=pai.read('B',track+2)[0]
     if curve!=2:continue
     key_count=pai.read('H',track+4)[0];at=track+pai.u32(track+8);key_bytes=bytes(pai.data[at:at+key_count*12]);identity=sha(key_bytes)
     source={'file':name,'content':i,'target':pai.string(base,20),'kind':pai.string(info,4),'component':pai.read('B',track+1)[0]}
     if identity in curves:curves[identity]['sources'].append(source);continue
     keys=[dict(zip(['frame','value','slope'],struct.unpack_from('<3f',key_bytes,q*12))) for q in range(key_count)]
     frames={f32(v) for q in keys for v in [q['frame']-.002,q['frame']-.0005,q['frame']-.000001,q['frame'],q['frame']+.000001,q['frame']+.0005,q['frame']+.002]}
     frames.update(f32(v/2) for v in range(2*decoded['frames']+1))
     samples=[]
     for frame in sorted(frames):
      values={t:r.sample(key_bytes,key_count,frame) for t,r in machines.items()};assert bits(values['home'])==bits(values['keyboard'])
      samples.append([frame,values['keyboard']])
     curves[identity]={'keys':keys,'sources':[source],'samples':samples}
  targets={'LncFolder_00_FadeIn':{'N_Dlg_00','N_BlankAnime_00'},'LncCsrEfct_00_DisAppear':{'W_CsrEfct_00'}}.get(path.stem)
  if path.stem.startswith('ApltFade_') or targets:
   for frame in ([8] if path.stem=='LncFolder_00_FadeIn' else [10] if targets else [0,.5,1,2,7.5,14,14.9995,15]):
    rows=[]
    for i,c in enumerate(decoded['contents']):
     if targets and c['target'] not in targets:continue
     outputs={t:r.apply(bytes(pai.data),frame,i,c['binding']) for t,r in machines.items()}
     assert outputs['home']==outputs['keyboard'],'HOME animation submission differs'
     rows.append({'target':c['target'],'binding':c['binding'],**outputs['keyboard']})
    applications.append({'file':name,'frame':frame,'panes':rows})
 for m in machines.values():m.check()
 return {'schema':1,'sourceCodeSha256':SHA,'samplerBytesSha256':sha(sampler),'sourceHashes':sources,'curves':list(curves.values()),'applications':applications}

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 for n in ['keyboard-code','home-code','members','home-animations','output']:p.add_argument('--'+n,type=Path,required=True)
 p.add_argument('--golden',type=Path);a=p.parse_args()
 assert not a.output.resolve().is_relative_to(Path(__file__).resolve().parents[2]),'Write private reports outside repository'
 out=collect(a.keyboard_code,a.home_code,a.members,a.home_animations)
 if a.golden:assert out==json.loads(a.golden.read_text())
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(out,separators=(',',':'))+'\n')
 print(json.dumps({'curves':len(out['curves']),'samples':sum(len(c['samples']) for c in out['curves']),'applications':len(out['applications']),'goldenCompared':bool(a.golden)}))
