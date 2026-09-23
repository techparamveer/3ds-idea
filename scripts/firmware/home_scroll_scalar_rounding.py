"""Bounded original-ARM scroll-scalar rounding; firmware/results stay private."""
from pathlib import Path
import argparse,hashlib,json,math,struct
from capstone import Cs,CS_ARCH_ARM,CS_MODE_ARM
from unicorn import Uc,UC_ARCH_ARM,UC_MODE_ARM,UC_HOOK_CODE
from unicorn.arm_const import *
p=argparse.ArgumentParser();p.add_argument('--code',type=Path,required=True);p.add_argument('--output',type=Path,required=True);opt=p.parse_args()
CODE=opt.code.read_bytes();SHA=hashlib.sha256(CODE).hexdigest()
assert SHA=='243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
OUT=opt.output;OUT.mkdir(parents=True,exist_ok=True)
S,STACK,END=0x8000000,0x8100000,0x8200000

def w(u,a,n):u.mem_write(a,struct.pack('<I',n&0xffffffff))
def word(u,a):return struct.unpack('<I',u.mem_read(a,4))[0]
def f(u,a,n):u.mem_write(a,struct.pack('<f',n))
def fl(u,a):return struct.unpack('<f',u.mem_read(a,4))[0]
def f32(n):return struct.unpack('<f',struct.pack('<f',n))[0]
def bits(n):return struct.unpack('<I',struct.pack('<f',n))[0]
def s0(u):return struct.unpack('<f',struct.pack('<I',u.reg_read(UC_ARM_REG_S0)))[0]
def set_s0(u,n):u.reg_write(UC_ARM_REG_S0,bits(n))
def ret(u):u.reg_write(UC_ARM_REG_PC,u.reg_read(UC_ARM_REG_LR))
def machine():
 u=Uc(UC_ARCH_ARM,UC_MODE_ARM);u.mem_map(0x100000,0x300000);u.mem_write(0x100000,CODE)
 for a in [S,STACK,END]:u.mem_map(a,0x10000)
 u.reg_write(UC_ARM_REG_C1_C0_2,0xf<<20);u.reg_write(UC_ARM_REG_FPEXC,0x40000000)
 return u
def run(u,start,end=END):
 u.emu_start(start,end,count=100000);assert u.reg_read(UC_ARM_REG_PC)==end

def prepare(u):u.reg_write(UC_ARM_REG_SP,STACK+0x8000);u.reg_write(UC_ARM_REG_LR,END)
helpers=[]
# Include exact integers, fractional neighbours, signed zero and a value for
# which binary32 has no fractional bits. No NaN/subnormal policy is inferred.
values=[-8388608,-17.25,-17,-1,-0.25,-0.0,0.0,0.25,1,16.8,17,struct.unpack('<f',struct.pack('<I',0x41880001))[0],8388608]
for target,name,expected in [(0x208688,'ceil',math.ceil),(0x208760,'floor',math.floor)]:
 for value in values:
  value=f32(value);u=machine();prepare(u);set_s0(u,value);run(u,target);actual=s0(u)
  assert actual==expected(value)
  if value==0:assert u.reg_read(UC_ARM_REG_S0)==bits(value)
  helpers.append({'helper':hex(target),'operation':name,'input':value,'inputBits':hex(bits(value)),'output':actual,'outputBits':hex(u.reg_read(UC_ARM_REG_S0))})

shared=[]
for mode in [3,5]:
 for start,end,elapsed,duration in [(0,65,0,4),(0,64,0,4),(0,-65,0,4),(0,-64,0,4),(-1,1,1,4),(0,84,0,5),(0,84,4,5)]:
  u=machine();events=[];weight=f32((elapsed+1)/duration)
  u.mem_write(S+0x3a80,bytes([mode]));w(u,S+0x11a4,elapsed);w(u,S+0x11a8,duration)
  f(u,S+0x3a28,start);f(u,S+0x3a2c,start);f(u,S+0x3a30,end)
  f(u,S+0x23a8,10.25);f(u,S+0x2ee8,14.75)
  f(u,S+0x2948,-8.25);f(u,S+0x3488,-3.25)
  f(u,S+0x1198,1);f(u,S+0x119c,3)
  def hook(u,a,size,_):
   if a==0x1d7f3c:
    events.append({'kind':'grid-metrics-endpoint'});ret(u)
   elif a==0x1eb4cc:
    events.append({'kind':'scroll-notification-endpoint','oldScroll':s0(u),'newScroll':struct.unpack('<f',struct.pack('<I',u.reg_read(UC_ARM_REG_S1)))[0]});ret(u)
   elif a in [0x208688,0x208760]:events.append({'kind':'round','helper':hex(a),'input':s0(u),'inputBits':hex(u.reg_read(UC_ARM_REG_S0))})
  u.hook_add(UC_HOOK_CODE,hook);prepare(u)
  if mode==3:
   u.reg_write(UC_ARM_REG_R0,S);run(u,0x2a1bbc)
  else:
   # Exact density caller with its already calculated weight supplied. This
   # does not reconstruct density entry, controller updates or weight curve.
   f(u,S+0x11a0,weight);u.reg_write(UC_ARM_REG_R5,S+0x1000);u.reg_write(UC_ARM_REG_R6,S)
   run(u,0x1d31a4,0x1d31b4)
  raw=f32(f32(f32(1-weight)*start)+f32(weight*end))
  rounded=math.ceil(raw) if raw>0 else math.floor(raw)
  assert fl(u,S+0x3a28)==rounded
  assert fl(u,S+0x1868)==f32(10.25+f32(weight*f32(14.75-10.25)))
  assert fl(u,S+0x1e08)==f32(-8.25+f32(weight*f32(-3.25+8.25)))
  assert fl(u,S+0x1194)==f32(1+f32(weight*2))
  rounds=[e for e in events if e['kind']=='round'];assert len(rounds)==1 and rounds[0]['inputBits']==hex(bits(raw))
  assert rounds[0]['helper']==('0x208688' if raw>0 else '0x208760')
  assert sum(e['kind']=='scroll-notification-endpoint' for e in events)==int(mode==3)
  shared.append({'mode':mode,'startScroll':start,'targetScroll':end,'elapsedBefore':elapsed,'duration':duration,'weight':weight,
   'rawScroll':raw,'roundedScroll':fl(u,S+0x3a28),'slot0XY':[fl(u,S+0x1868),fl(u,S+0x1e08)],'densityValue':fl(u,S+0x1194),'events':events})
cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True;excerpts=[]
for start,end in [(0x1d7b50,0x1d7c74),(0x208688,0x208718),(0x208760,0x2087fc),(0x2a1bbc,0x2a1c04),(0x1d2fac,0x1d300c),(0x1d31a4,0x1d31b4)]:
 raw=CODE[start-0x100000:end-0x100000]
 rendered='\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n'
 path=OUT/f'proof-{start:x}-{end:x}.asm';path.write_text(rendered)
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
report={'sourceSHA256':SHA,'fixtureSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'helperCases':helpers,'sharedCases':shared,'excerpts':excerpts,
 'scope':'Original ceil/floor helpers and shared1d7b50 interpolation/rounding execute. Mode3 cases execute original tick/division2a1bbc; mode5 cases execute caller fragment1d31a4..1d31b4 with stored weight supplied. Grid metrics1d7f3c and scroll notification1eb4cc are recording endpoints. Synthetic scalar/coordinate inputs establish arithmetic behavior, not negative-offset reachability in ordinary HOME. Finite normal values/exact integers/signed zeros only; no NaN, subnormal, exception-mode or full density lifecycle claim.'}
path=OUT/'checked.json';path.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'helperCases':len(helpers),'sharedCases':len(shared),'sourceExcerpts':len(excerpts),'fixtureSHA256':report['fixtureSHA256'],'resultSHA256':hashlib.sha256(path.read_bytes()).hexdigest()},indent=2))
