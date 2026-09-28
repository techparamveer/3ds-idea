"""Bounded original-ARM HOME host ordering. Firmware/output stay private."""
from pathlib import Path
import argparse,hashlib,json,struct
from capstone import Cs,CS_ARCH_ARM,CS_MODE_ARM
from unicorn import Uc,UC_ARCH_ARM,UC_MODE_ARM,UC_HOOK_CODE
from unicorn.arm_const import *
p=argparse.ArgumentParser();p.add_argument('--code',type=Path,required=True);p.add_argument('--output',type=Path,required=True);opt=p.parse_args()
CODE=opt.code.read_bytes();OUT=opt.output;OUT.mkdir(parents=True,exist_ok=True)
SHA=hashlib.sha256(CODE).hexdigest();assert SHA=='243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
OBJ,STACK,END=0x8000000,0x8100000,0x8200000
REGS=[UC_ARM_REG_R0,UC_ARM_REG_R1,UC_ARM_REG_R2,UC_ARM_REG_R3]
UPPER=OBJ+0x5000;T6=OBJ+0x6000;T7=OBJ+0x6800;FACTORY=OBJ+0x7000
CURSOR=OBJ+0x7200;LOOP=OBJ+0x7400;TRANS=OBJ+0x7600;SCALE=OBJ+0x7800
BANNER=OBJ+0x8000;CLIP=OBJ+0x8200;RESOURCE=OBJ+0x8400;BTRANS=OBJ+0x8600
CLIP_OWNER=OBJ+0x8800
SAMPLE=OBJ+0xa000;G=0x32e78c;M=0x32ebf4;HOST=0x32e688;TASKS=0x344fa0

def w(u,a,n):u.mem_write(a,struct.pack('<I',n&0xffffffff))
def word(u,a):return struct.unpack('<I',u.mem_read(a,4))[0]
def b(u,a,n):u.mem_write(a,bytes([n&255]))
def byte(u,a):return u.mem_read(a,1)[0]
def h(u,a,n):u.mem_write(a,struct.pack('<H',n&0xffff))
def half(u,a):return struct.unpack('<h',u.mem_read(a,2))[0]
def f(u,a,n):u.mem_write(a,struct.pack('<f',n))
def fl(u,a):return struct.unpack('<f',u.mem_read(a,4))[0]
def s0(u,n):u.reg_write(UC_ARM_REG_S0,struct.unpack('<I',struct.pack('<f',n))[0])
def args(u):return [u.reg_read(r) for r in REGS]
def ret(u,n=None):
 if n is not None:u.reg_write(UC_ARM_REG_R0,n&0xffffffff)
 u.reg_write(UC_ARM_REG_PC,u.reg_read(UC_ARM_REG_LR))
def machine():
 u=Uc(UC_ARCH_ARM,UC_MODE_ARM);u.mem_map(0x100000,0x300000);u.mem_write(0x100000,CODE)
 for a in [OBJ,STACK,END]:u.mem_map(a,0x10000)
 u.reg_write(UC_ARM_REG_C1_C0_2,0xf<<20);u.reg_write(UC_ARM_REG_FPEXC,0x40000000)
 return u
def run(u,a,z=END):
 try:u.emu_start(a,z,count=300000)
 except Exception:print('FAULT',hex(u.reg_read(UC_ARM_REG_PC)),[hex(x) for x in args(u)],'LR',hex(u.reg_read(UC_ARM_REG_LR)));raise
 assert u.reg_read(UC_ARM_REG_PC)==z,hex(u.reg_read(UC_ARM_REG_PC))
def call(u,a,values=()):
 u.reg_write(UC_ARM_REG_SP,STACK+0x8000);u.reg_write(UC_ARM_REG_LR,END)
 for r,v in zip(REGS,values):u.reg_write(r,v&0xffffffff)
 run(u,a)
def cword(a):return struct.unpack_from('<I',CODE,a-0x100000)[0]
def direct_call(caller,target):
 if not 0x100000<=caller<0x100000+len(CODE)-3:return False
 ins=cword(caller)
 if ins&0x0f000000!=0x0b000000:return False
 offset=ins&0xffffff
 if offset&0x800000:offset-=0x1000000
 return caller+8+4*offset==target
def empty(u,base):w(u,base,0);w(u,base+4,base+4);w(u,base+8,base+4)
def tasks(u):
 out=[];node=word(u,TASKS+4)
 while node!=TASKS+4:
  obj=node-4;out.append({'object':hex(obj),'id':word(u,obj+0x60)});node=word(u,node);assert len(out)<10
 return out

# Registration and actual factory dispatch run. Constructor endpoints only
# install identity; lower constructor's native child-registration fragment runs.
def registration():
 u=machine();trace=[];frames=[];empty(u,TASKS);w(u,0x32e84c,FACTORY);w(u,FACTORY,FACTORY+0x100);w(u,FACTORY+0x108,0x27b624)
 destinations={1:OBJ,5:UPPER,6:T6,7:T7}
 def hook(u,a,size,_):
  if a in [0x236128,0x116fd8,0x235494]:ret(u,0)
  elif a==0x23546c:
   ident=u.reg_read(UC_ARM_REG_R5);trace.append({'kind':'allocation','id':ident,'bytes':args(u)[0]});ret(u,destinations[ident])
  elif a==0x2b9b68:
   frames.append((u.reg_read(UC_ARM_REG_LR),u.reg_read(UC_ARM_REG_R4)))
   w(u,OBJ,0x322364);u.reg_write(UC_ARM_REG_R4,OBJ);u.reg_write(UC_ARM_REG_PC,0x2baadc)
  elif a==0x2bab30:
   lr,r4=frames.pop();u.reg_write(UC_ARM_REG_R4,r4);u.reg_write(UC_ARM_REG_LR,lr);ret(u,OBJ)
  elif a in [0x287f64,0x27c808,0x292bc8]:
   w(u,args(u)[0],0x3221a0 if a==0x287f64 else FACTORY+0x200);ret(u)
  elif a==0x117598:trace.append({'kind':'init-endpoint','object':hex(args(u)[0]),'list':tasks(u)});ret(u)
 u.hook_add(UC_HOOK_CODE,hook);call(u,0x230780,[1]);order=tasks(u)
 assert [r['id'] for r in order]==[6,7,5,1],order
 assert word(u,OBJ+0x3aa0)==UPPER and word(u,0x344fac+5*4)==UPPER and word(u,0x344fac+4)==OBJ
 return {'order':order,'trace':trace}
registrationResult=registration()

# Subsystem endpoint returns are explicit. HOME/upper update bodies execute;
# unrelated called services/visual helpers are intercepted at their entry.
HOME_KEEP={0x2a1bbc,0x1e8f38,0x232234,0x2968fc}
UPPER_KEEP={0x28574c,0x285ab0}
SINKS={0x102d4c:'host-statistics',0x10dcb8:'sample-acquisition',0x104830:'host-service',0x105860:'host-service',0x104ee8:'host-final-status',0x236128:'allocation-context',0x235510:'graphics-context',0x1a3610:'layout-apply',0x11bc20:'layout-matrices',0x1d7b50:'grid-interpolation',0x1d7d00:'grid-coordinates',0x297b20:'selection-status',0x1de8ec:'widget-setup',0x1e0cb4:'footer-exit',0x1de858:'cursor-effect',0x1da050:'scale-seek',0x233a6c:'selection-sound',0x285520:'held-manager',0x1152a8:'music-queue',0x115ad4:'sound-manager',0x115a38:'sound-manager',0x11296c:'archive-player',0x10a324:'3d-scene-calculation',0x10b770:'3d-scene-output'}
SINKS.update({cword(0x3221a0+0x3c):'upper-input-virtual',0x2686ac:'selection-query',0x1e0d28:'selection-query',0x21ba4c:'manager-query',0x1ee174:'manager-update',0x1d7eac:'idle-grid-refresh',0x22914c:'manager-query',0x1edd48:'idle-transition-query',0x295544:'widget-refresh',0x2ebdb8:'selection-query',0x1e0f44:'manager-selection-update',0x29af68:'idle-layout-update',0x1d61d4:'idle-footer-update',0x1de7fc:'selection-refresh',0x285680:'release-manager',0x1d45a0:'release-manager',0x1d4578:'release-manager',0x1d7178:'edge-visual',0x1d9f58:'edge-visual'})

def snapshot(u):
 return {'selected':half(u,OBJ+0x1178),'mode':byte(u,OBJ+0x3a80),'scrollElapsed':word(u,OBJ+0x11a4),'scrollDuration':word(u,OBJ+0x11a8),'scrollCounter':word(u,OBJ+0x3c98),'loopCurrent':fl(u,LOOP+0xc),'loopSubmitted':fl(u,TRANS+0x10),'loopStep':fl(u,LOOP+0x10),'bannerCounter':word(u,BANNER+0x70),'clipCurrent':fl(u,CLIP+0xc),'hostPasses':word(u,HOST+0x10),'repeatCounter':word(u,G+0xc),'audioCounter':word(u,0x32e864+0x24)}

MARKERS={0x102288:'host',0x1039d0:'input-producer',0x2947f8:'input-callback',0x1067dc:'tasks',0x286e74:'upper-task',0x24c0ac:'banner-manager',0x249164:'folder-update',0x2b56e8:'lower-task',0x2a1bbc:'mode3-tick',0x103808:'3d-pass',0x24ff10:'3d-clip',0x103df8:'2d-pass',0x269430:'cursor-loop',0x1046bc:'audio-wrapper',0x10c508:'audio-manager'}
MARKERS.update({0x1e8f38:'mode-setter',0x2a3600:'mode3-entry'})

def setup(flags=0,mode=3,upperLifecycle=6,lowerLifecycle=6,producerPause=0,ready1=1,ready2=1,upperPaused=0,managerEnabled=1,managerPaused=0,globalManagerPaused=0,clipGate1=0,clipGate2=0,layoutVisible=1,layoutStatus=0,audioOuter=1,audioInner=1,lowerOverlay=0):
 u=machine();trace=[];sinks=[];passIndex=[0]
 # Supplied mature task objects use order proved by ordinary registration.
 empty(u,TASKS)
 for obj,vt,ident,status in [(UPPER,0x3221a0,5,upperLifecycle),(OBJ,0x322364,1,lowerLifecycle)]:
  w(u,obj,vt);w(u,obj+0x60,ident);b(u,obj+0x5c,status)
  call(u,0x230710,[TASKS,TASKS+4,obj+4])
 w(u,OBJ+0x3aa0,UPPER);w(u,OBJ+0x1164,OBJ+0x9c00);b(u,OBJ+0x1170,255)
 h(u,OBJ+0x1178,2);h(u,OBJ+0x117c,2);h(u,OBJ+0x1180,-1);h(u,OBJ+0x3c8c,-1);h(u,OBJ+0x3c90,-1);w(u,OBJ+0x3c94,-1)
 w(u,OBJ+0x1810,300);b(u,OBJ+0x3a80,mode);w(u,OBJ+0x11a8,10);w(u,OBJ+0x3c98,5)
 w(u,OBJ+0x820,CURSOR);w(u,OBJ+0xe24,SCALE);w(u,SCALE,0x321828);w(u,OBJ+0xab4,OBJ+0x9d00);f(u,OBJ+0x9dc8,1)
 # The HOME visibility-policy byte requests visible1 or hidden2; supply a
 # matching existing visibility so this gate case stays stable through HOME.
 b(u,OBJ+0x3a4e,layoutVisible);b(u,OBJ+0x3a88,1 if layoutVisible else 2)
 w(u,OBJ+0x3fe0,OBJ+0x9e00 if lowerOverlay else 0)
 w(u,CURSOR,0x321650);w(u,CURSOR+0x80,SCALE);w(u,CURSOR+0x8c,LOOP);w(u,CURSOR+0x58,0x196);w(u,CURSOR+0x5c,layoutStatus);b(u,CURSOR+0x60,layoutVisible)
 w(u,LOOP,0x321828);f(u,LOOP+4,60);f(u,LOOP+8,0);f(u,LOOP+0xc,17.25);f(u,LOOP+0x10,1);w(u,LOOP+0x14,1);w(u,LOOP+0x18,2);w(u,LOOP+0x28,TRANS)
 w(u,CURSOR+0x18,LOOP+0x20);w(u,CURSOR+0x1c,LOOP+0x20);w(u,LOOP+0x20,CURSOR+0x18);w(u,LOOP+0x24,CURSOR+0x18)
 empty(u,0x344bfc);empty(u,0x344c08);call(u,0x11eae8,[CURSOR])
 # Real hidden folder update and an independent supplied attached-controller
 # owner test the two update domains. This does not attach a hidden folder or
 # claim to execute its rendering/attachment lifecycle.
 b(u,UPPER+0x30f,upperPaused);b(u,UPPER+0x30e,1);b(u,UPPER+0x45e,1)
 b(u,M+0xe,managerEnabled);b(u,M+0xb,managerPaused);w(u,M+0x50,BANNER)
 w(u,BANNER,0x3210b8);b(u,BANNER+0x68,1);b(u,BANNER+0x3c,0);b(u,BANNER+0x9c,0)
 empty(u,0x344b44);call(u,0x230710,[0x344b44,0x344b48,CLIP_OWNER+4])
 w(u,CLIP_OWNER+0x10,CLIP+0x20);w(u,CLIP_OWNER+0x14,CLIP+0x20);w(u,CLIP+0x20,CLIP_OWNER+0x10);w(u,CLIP+0x24,CLIP_OWNER+0x10)
 w(u,CLIP,0x321138);f(u,CLIP+4,150);f(u,CLIP+8,0);f(u,CLIP+0xc,11);f(u,CLIP+0x10,1);w(u,CLIP+0x14,1);w(u,CLIP+0x18,2);w(u,CLIP+0x2c,RESOURCE)
 w(u,RESOURCE+0x48,END+0x104)
 b(u,0x32e739,clipGate1);b(u,0x32e73a,clipGate2);w(u,0x32e75c,OBJ+0x9000);w(u,OBJ+0x9000,OBJ+0x9100);w(u,OBJ+0x9114,END+0x108)
 w(u,0x32e7c4,OBJ+0xb000);w(u,OBJ+0xb0ac,OBJ+0xb100)
 w(u,0x32e9fc,SAMPLE);empty(u,0x344b94);w(u,G+0x14,producerPause);h(u,G+2,0xc0f0)
 w(u,HOST+4,flags);b(u,HOST+1,0);b(u,0x32e854,audioOuter);b(u,0x32e864,audioInner)
 call(u,0x1df888,[0x2947f8,OBJ])
 # Exact additional endpoint bodies reached directly from HOME/upper frame
 # methods are recorded; only their caller's original control flow executes.
 def hook(u,a,size,_):
  lr=u.reg_read(UC_ARM_REG_LR);caller=lr-4
  if a in MARKERS:trace.append({'phase':MARKERS[a],'pass':passIndex[0],'args':args(u),**snapshot(u)})
  if a==END+0x104:u.reg_write(UC_ARM_REG_S0,u.reg_read(UC_ARM_REG_S2));ret(u)
  elif a==END+0x108:sinks.append({'target':hex(a),'kind':'3d-scene-virtual'});ret(u)
  elif a==0x235fa8:ret(u,globalManagerPaused)
  elif a==0x10dc20:ret(u,ready1)
  elif a==0x10cd20:ret(u,ready2)
  elif a in [0x235994,0x10ee70]:ret(u,0)
  elif a in [0x222764,0x2226d0]:ret(u)
  elif a==0x232234 and args(u)[0]!=CURSOR:
   sinks.append({'target':hex(a),'kind':'secondary-layout-visibility','caller':hex(caller)});ret(u,0)
  elif a in SINKS:
   sinks.append({'target':hex(a),'name':SINKS[a],'caller':hex(caller)})
   ret(u,flags if a in [0x10dcb8,0x104830,0x105860,0x104ee8] else 0)
  elif direct_call(caller,a) and 0x2b56e8<=caller<0x2b887c and not 0x2b56e8<=a<0x2b887c and a not in HOME_KEEP:
   sinks.append({'target':hex(a),'kind':'HOME-callee','caller':hex(caller)});ret(u,0)
  elif direct_call(caller,a) and 0x286e74<=caller<0x287634 and not 0x286e74<=a<0x287634 and a not in UPPER_KEEP:
   sinks.append({'target':hex(a),'kind':'upper-callee','caller':hex(caller)});ret(u,0)
 u.hook_add(UC_HOOK_CODE,hook)
 return u,trace,sinks,passIndex

BASE_PHASES=['host','input-producer','tasks','upper-task','banner-manager','folder-update','lower-task','mode3-tick','3d-pass','3d-clip','2d-pass','cursor-loop','audio-wrapper','audio-manager']
def result(u,tr,sk,**metadata):
 return {**metadata,'final':snapshot(u),'trace':tr,'sinks':sk}
def press(u,current=0x10,previous=0):
 w(u,SAMPLE+8,current);w(u,SAMPLE+0xc,current&~previous);w(u,SAMPLE+0x10,previous&~current)

u,tr,sk,pi=setup();call(u,0x102288)
assert [x['phase'] for x in tr]==BASE_PHASES
assert snapshot(u)=={'selected':2,'mode':3,'scrollElapsed':1,'scrollDuration':10,'scrollCounter':5,'loopCurrent':18.25,'loopSubmitted':17.25,'loopStep':1.0,'bannerCounter':1,'clipCurrent':12.0,'hostPasses':1,'repeatCounter':0,'audioCounter':1}
baseline=result(u,tr,sk)

u,tr,sk,pi=setup(mode=0);press(u);call(u,0x102288)
assert tr[4]['phase']=='mode3-entry'
assert half(u,OBJ+0x1178)==3 and byte(u,OBJ+0x3a80)==3
assert word(u,OBJ+0x11a4)==1 and word(u,OBJ+0x11a8)==5 and fl(u,LOOP+0xc)==20.25 and fl(u,TRANS+0x10)==17.25 and fl(u,LOOP+0x10)==3
pressed=result(u,tr,sk)

gates=[]
for name,options in [
 ('producer-pause',{'producerPause':1}),('producer-readiness1',{'ready1':0}),('producer-readiness2',{'ready2':0}),
 ('upper-lifecycle0',{'upperLifecycle':0}),('lower-lifecycle0',{'lowerLifecycle':0}),('lower-overlay',{'lowerOverlay':1}),
 ('upper-paused',{'upperPaused':1}),('banner-disabled',{'managerEnabled':0}),('banner-paused',{'managerPaused':1}),('banner-global-pause',{'globalManagerPaused':1}),
 ('3d-gate1',{'clipGate1':1}),('3d-gate2',{'clipGate2':1}),('layout-hidden',{'layoutVisible':0}),('layout-status2',{'layoutStatus':2}),
 ('audio-outer-disabled',{'audioOuter':0}),('audio-inner-disabled',{'audioInner':0})]:
 u,tr,sk,pi=setup(**options);call(u,0x102288);gates.append(result(u,tr,sk,name=name,options=options))


# Each gate suppresses its own update domain; remaining domains still run.
for case in gates:
 name=case['name'];phases=[x['phase'] for x in case['trace']];actual=case['final'];expected=dict(baseline['final'])
 if name in ['upper-lifecycle0','upper-paused','banner-disabled','banner-paused','banner-global-pause']:expected['bannerCounter']=0
 if name in ['lower-lifecycle0','lower-overlay']:expected['scrollElapsed']=0
 if name in ['3d-gate1','3d-gate2']:expected['clipCurrent']=11.0
 if name in ['layout-hidden','layout-status2']:expected.update(loopCurrent=17.25,loopSubmitted=0.0)
 if name.startswith('audio-'):expected['audioCounter']=0
 assert actual==expected,(name,actual,expected)
 assert phases.count('host')==1 and phases.count('input-producer')==1 and phases.count('tasks')==1
 assert ('mode3-tick' in phases)==(expected['scrollElapsed']==1)
 assert ('folder-update' in phases)==(expected['bannerCounter']==1)
 assert ('3d-clip' in phases)==(expected['clipCurrent']==12)
 assert ('cursor-loop' in phases)==(expected['loopCurrent']==18.25)
 audioTargets=[x['target'] for x in case['sinks'] if x.get('name') in ['music-queue','sound-manager','archive-player']]
 assert audioTargets==(['0x1152a8','0x115ad4','0x115a38','0x11296c'] if expected['audioCounter'] else [])

# Input inhibition checked with an actual pending directional edge. Lifecycle0
# tasks isolate host event flags from unrelated task teardown/transition code.
inputGates=[]
for name,options in [('enabled',{}),('pause',{'producerPause':1}),('readiness1',{'ready1':0}),('readiness2',{'ready2':0})]+[(f'flags-{v:x}',{'flags':v,'upperLifecycle':0,'lowerLifecycle':0}) for v in [1,2,4,0x100]]:
 u,tr,sk,pi=setup(**options);press(u);w(u,G+4,0x20);call(u,0x102288)
 callbacks=[x['args'][1:3] for x in tr if x['phase']=='input-callback']
 assert bool(callbacks)==(name=='enabled'),(name,callbacks)
 if name in ['pause','readiness1','readiness2']:assert word(u,G+4)==0
 elif name.startswith('flags'):assert word(u,G+4)==0x20
 assert fl(u,LOOP+0xc)==18.25 and fl(u,CLIP+0xc)==12 and word(u,0x32e888)==1
 inputGates.append(result(u,tr,sk,name=name,options=options,callbacks=callbacks,candidate=word(u,G+4)))

# Original main loop fragment. Lifecycle/services/presentation are endpoints;
# no fixture-generated scene or layout calls are inserted between host passes.
def main_loop(samples):
 u,tr,sk,pi=setup(mode=0);w(u,OBJ+0x3c98,0);rows=[];mainTrace=[];previous=[0]
 def main_hook(u,a,size,_):
  if a==0x102520:
   press(u,samples[len(rows)],previous[0]);previous[0]=samples[len(rows)]
   pi[0]=len(rows);mainTrace.append({'phase':'lifecycle-endpoint','pass':pi[0]});ret(u,0)
  elif a in [0x101d54,0x102108]:
   mainTrace.append({'phase':'main-service-endpoint' if a==0x101d54 else 'presentation-endpoint','pass':pi[0]});ret(u,0)
  elif a==0x101b44:
   rows.append(snapshot(u));mainTrace.append({'phase':'normal-backedge','pass':pi[0]})
   if len(rows)==len(samples):u.reg_write(UC_ARM_REG_PC,END)
 u.hook_add(UC_HOOK_CODE,main_hook)
 u.reg_write(UC_ARM_REG_R4,0x32e6d4);call(u,0x101a9c)
 for phase in ['host','input-producer','tasks','upper-task','lower-task','3d-pass','2d-pass','audio-wrapper','audio-manager']:
  assert sum(x['phase']==phase for x in tr)==len(samples),phase
 assert sum(x['phase']=='presentation-endpoint' for x in mainTrace)==len(samples)
 assert rows[-1]['hostPasses']==len(samples) and rows[-1]['audioCounter']==len(samples)
 return result(u,tr,sk,samples=samples,rows=rows,mainTrace=mainTrace)
mainResult=main_loop([0]+[0x10]*76+[0])

assert [x['pass'] for x in mainResult['trace'] if x['phase']=='mode3-entry']==[1,21,30,41,50,61,65,71,75]
assert [x['pass'] for x in mainResult['trace'] if x['phase']=='input-callback' and x['args'][1]==6]==list(range(21,77,5))
assert mainResult['rows'][61]['loopStep']==3 and mainResult['rows'][77]['loopStep']==1
assert mainResult['rows'][30]['scrollElapsed']==0 and mainResult['rows'][31]['scrollElapsed']==1
assert mainResult['final']['scrollCounter']==0 and mainResult['final']['scrollElapsed']==2
for i in range(78):
 phases=[x['phase'] for x in mainResult['trace'] if x['pass']==i]
 expected=[p for p in BASE_PHASES if p not in ['mode3-tick']]
 assert [p for p in phases if p in expected]==expected,(i,phases)

# Direct ARM branch word references are corroborating static evidence, not a
# proof that no indirect call exists. Inline data may decode as instructions.
xrefs={}
for target,expected in [(0x102288,[0x101aac]),(0x1039d0,[0x1022c0]),(0x1067dc,[0x1022cc]),(0x103808,[0x1022d4]),(0x103df8,[0x1022dc,0x1b573c]),(0x10c508,[0x1046d0])]:
 refs=[]
 for offset in range(0,len(CODE)-3,4):
  ins=struct.unpack_from('<I',CODE,offset)[0]
  if ins&0x0e000000!=0x0a000000:continue
  delta=ins&0xffffff
  if delta&0x800000:delta-=0x1000000
  if 0x100000+offset+8+4*delta==target:refs.append(0x100000+offset)
 assert refs==expected,(hex(target),refs)
 xrefs[hex(target)]=[hex(a) for a in refs]

# Source excerpts stay beside private results; repository contains no binary
# firmware or disassembly. Hash both original bytes and rendered text.
cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True
ranges=[(0x101a9c,0x101b48),(0x102288,0x10232c),(0x1067dc,0x106930),
 (0x10e180,0x10e228),(0x10e228,0x10e340),(0x230710,0x230810),
 (0x27b624,0x27b89c),(0x27bf54,0x27bf74),(0x2baadc,0x2bab30),
 (0x2dc940,0x2dc948),(0x286e74,0x286fc4),(0x28574c,0x285850),
 (0x24c0ac,0x24c2e0),(0x249164,0x2491ac),(0x1fa344,0x1fa3b0),
 (0x24e0c0,0x24e1cc),(0x2b56e8,0x2b58b0),(0x2b5f40,0x2b6060),
 (0x2b6e4c,0x2b7148),(0x2a1bbc,0x2a1c04),(0x2b84c4,0x2b856c),
 (0x103808,0x1039d0),(0x10b3d0,0x10b458),(0x24ff10,0x24ff74),
 (0x103df8,0x104074),(0x1f58e4,0x1f59b4),(0x269430,0x269498),
 (0x1bbd94,0x1bbf30),(0x1046bc,0x1046e4),(0x10c508,0x10c574),
 (0x1039d0,0x103ca8),(0x1b56f4,0x1b5774)]
excerpts=[]
for start,end in ranges:
 raw=CODE[start-0x100000:end-0x100000]
 rendered='\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n'
 path=OUT/f'proof-{start:x}-{end:x}.asm';path.write_text(rendered)
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
for start,end in [(0x3221a0,0x3221e4),(0x322364,0x3223a8),(0x3210b8,0x3210d4),(0x321138,0x32114c),(0x321650,0x321660),(0x321828,0x32183c)]:
 raw=CODE[start-0x100000:end-0x100000]
 path=OUT/f'words-{start:x}-{end:x}.txt';path.write_text('\n'.join(f'{a:08x}: {cword(a):08x}' for a in range(start,end,4))+'\n')
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
report={'sourceSHA256':SHA,'fixtureSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
 'registration':registrationResult,'baseline':baseline,'directionalPress':pressed,'domainGates':gates,'inputGates':inputGates,'mainLoop':mainResult,'directBranchReferences':xrefs,'excerpts':excerpts,
 'fixedEndpoints':{hex(k):v for k,v in sorted(SINKS.items())},
 'scope':'Original ARM main backedge and host wrapper, producer/callback, task walker and mature dispatch, selected upper/banner and lower/mode3 paths, attached 3D controller, visible 2D Loop and audio wrapper execute. Platform acquisition/readiness, lifecycle edge helper, presentation, UI/output/audio manager callees are explicit endpoints; dynamic HOME/upper direct-callee endpoints are recorded per case. Main services have no simulated latency. Registration runs factory/list code with constructor endpoints and the native lower child-registration fragment, not complete construction. Supplied state is not a hardware capture; hidden folder yaw and independent attached controller are different objects. No fixed Hz, physical timing, threading, full lifecycle or missed-frame catch-up claim.'}
(OUT/'checked.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'registrationOrder':[x['id'] for x in registrationResult['order']],'domainGates':len(gates),'inputGates':len(inputGates),'mainPasses':len(mainResult['rows']),'sourceExcerpts':len(excerpts),'fixtureSHA256':report['fixtureSHA256'],'resultSHA256':hashlib.sha256((OUT/'checked.json').read_bytes()).hexdigest()},indent=2))
