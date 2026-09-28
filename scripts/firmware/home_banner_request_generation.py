"""Bounded original-ARM HOME banner request generation. Firmware/output stay private."""
from pathlib import Path
import argparse,hashlib,json,struct
from capstone import Cs,CS_ARCH_ARM,CS_MODE_ARM
from unicorn import Uc,UC_ARCH_ARM,UC_MODE_ARM,UC_HOOK_CODE,UC_HOOK_MEM_WRITE
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
HOME_KEEP={0x2a1bbc,0x1e8f38,0x232234,0x2968fc,0x2960ec,0x29f0a4}
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


# This audit keeps the host ordering but records the manager's request state at
# its entry instead of running resource/visibility work. Actual lower idle,
# mode3/idle-entry and request resolution/setter paths remain executable.
for target in [0x1e0f44,0x21ba4c]:SINKS.pop(target,None)
SINKS.update({0x1d8fb4:'startup-query',0x1ee408:'idle-service',0x29b8b0:'idle-service',0x2a0040:'idle-transition-query',0x1d9e88:'special-handoff-query',0x1d8c38:'system-transition-query',0x1f8c3c:'request-bookkeeping',0x1d45d8:'close-theme-update'})
DATA=0x8300000;DB=DATA;RECORDS=DATA+0x50000;CONTAINER=DATA+0x70000;CART=DATA+0x78000;INIT=DATA+0x80000;THEME=DATA+0x82000

def reqstate(u):return {'type':byte(u,M+6),'pending':byte(u,M+4),'wait':word(u,M+0xc8),'key':[word(u,0x34c250),word(u,0x34c254),byte(u,0x34c258)]}
def request_setup(selected=0,folder=-1,mode=0):
 u,tr,sk,pi=setup(mode=mode);events=[];u.mem_map(DATA,0x100000)
 w(u,0x344fac+4,OBJ);w(u,0x344fac+20,UPPER);b(u,UPPER+0x2fc,1)
 w(u,OBJ+0x3aac,DB);w(u,DB+0x398f8,RECORDS);w(u,CONTAINER+0x4f08,DB);h(u,CART+0x3e,-2)
 w(u,0x32f5d0,INIT);b(u,INIT+0xe3,1);w(u,THEME+0x14,THEME+0x1000)
 slotmap=DB+0x39bd0+folder*0x2d2;w(u,DB+0x44508,slotmap)
 for slot in range(300):
  h(u,slotmap+2*slot,slot);record=RECORDS+560*slot
  w(u,record,-1);w(u,record+4,-1);b(u,record+0x10,255)
 h(u,OBJ+0x3c2a,-1);h(u,OBJ+0x1178,selected);h(u,OBJ+0x117c,selected);h(u,OBJ+0x3c34,selected);h(u,OBJ+0x3c36,-1);b(u,OBJ+0x3c39,1)
 b(u,OBJ+0x1170,folder);w(u,M+0xc8,99);b(u,M+6,1)
 for p,v in [(0x34c250,123),(0x34c254,0x40000)]:w(u,p,v)
 b(u,0x34c258,1)
 def hook(u,a,size,_):
  if a in [0x2960ec,0x1e0f44,0x1d71c0,0x1ed6ec,0x24c0ac]:
   row={'kind':{0x2960ec:'idle-update',0x1e0f44:'resolve',0x1d71c0:'category',0x1ed6ec:'setter',0x24c0ac:'manager'}[a],'pc':hex(a),'caller':hex(u.reg_read(UC_ARM_REG_LR)-4),'selected':half(u,OBJ+0x1178),'mode':byte(u,OBJ+0x3a80),'folder':struct.unpack('<b',u.mem_read(OBJ+0x1170,1))[0],'toolbarActive':bool(byte(u,OBJ+0x3ca8)),'focus':half(u,OBJ+0x3c8c),'pass':pi[0],'args':args(u),**reqstate(u)}
   if a==0x1d71c0:row['category']=args(u)[2]
   if a==0x1e0f44:
    pointer=word(u,u.reg_read(UC_ARM_REG_SP));row['selectionPointer']=hex(pointer);row['resolvedSlot']=half(u,pointer)
   events.append(row)
  if a==0x24c0ac:ret(u,0)
  elif a==0x1feb04:ret(u,{1:OBJ,5:UPPER}.get(args(u)[0],0))
  elif a==0x232250:ret(u,5)
  elif a==0x21ba4c:ret(u,INIT)
  elif a==0x21ba3c:ret(u,CART)
  elif a==0x22645c:ret(u,CONTAINER)
  elif a==0x21ba70:ret(u,0)
  elif a==0x1e6604:ret(u,-2)
  elif a==0x1c212c:ret(u,0)
  elif a==0x217a90:ret(u,THEME)
  elif a==0x2e8980:ret(u,0)
  elif a==0x1ff868:ret(u,1)
  elif a==0x1ed874:
   events.append({'kind':'label-branch-omitted','pc':hex(a)});u.reg_write(UC_ARM_REG_PC,0x1ed920)
 def writes(u,access,address,size,value,_):
  if address in [M+4,M+6,M+0xc8]:events.append({'kind':'request-write','pc':hex(u.reg_read(UC_ARM_REG_PC)),'address':hex(address),'value':value,'selected':half(u,OBJ+0x1178),'mode':byte(u,OBJ+0x3a80),'pass':pi[0]})
 u.hook_add(UC_HOOK_CODE,hook);u.hook_add(UC_HOOK_MEM_WRITE,writes)
 return u,tr,sk,pi,events

def hostpass(u,pi):
 call(u,0x102288);pi[0]+=1

def record(u,tr,sk,events,**extra):return {**extra,'final':snapshot(u),'request':reqstate(u),'events':events,'trace':tr,'endpoints':sk}
scenarios=[]
for folder in [-1,2]:
 for event in [4,6]:
  for selected in [0,2]:
   u,tr,sk,pi,ev=request_setup(selected,folder);call(u,0x2968fc,[OBJ,event,0x10]);afterInput=snapshot(u)
   assert not ev and afterInput['selected']==selected+1
   passes=5 if selected==2 else 1
   for i in range(passes):hostpass(u,pi)
   resolves=[x for x in ev if x['kind']=='resolve'];writes=[x for x in ev if x['kind']=='request-write']
   assert len(resolves)==1 and resolves[0]['resolvedSlot']==selected+1 and resolves[0]['selectionPointer']==hex(OBJ+0x1178)
   assert resolves[0]['caller']==('0x29a4dc' if selected==2 else '0x296468') and resolves[0]['pass']==passes-1
   assert ev[0]['kind']=='manager' and ev[0]['type']==1 and reqstate(u)['type']==7 and writes[-1]['pc']=='0x1ed870'
   scenarios.append(record(u,tr,sk,ev,kind='direction',folder=folder,event=event,selected=selected,afterInput=afterInput))
# Completion resolves the pre-replay selection, then replays one pending move.
u,tr,sk,pi,ev=request_setup(2);call(u,0x2968fc,[OBJ,4,0x10]);call(u,0x2968fc,[OBJ,6,0x10])
for i in range(5):hostpass(u,pi)
assert half(u,OBJ+0x1178)==4 and byte(u,OBJ+0x3a80)==3 and word(u,OBJ+0x11a4)==0
assert [x['resolvedSlot'] for x in ev if x['kind']=='resolve']==[3]
scenarios.append(record(u,tr,sk,ev,kind='deferred-replay'))
# Tile widget callback1, without relying on touch hit-testing services.
for selected in [1,4]:
 u,tr,sk,pi,ev=request_setup(0);widget=OBJ+0x9f00;w(u,OBJ+0xf44,widget);h(u,OBJ+0x14a0,selected)
 call(u,0x2a3db8,[OBJ,widget,1]);afterInput=snapshot(u)
 assert afterInput['selected']==selected and not ev
 passes=5 if selected==4 else 1
 for i in range(passes):hostpass(u,pi)
 assert [x['resolvedSlot'] for x in ev if x['kind']=='resolve']==[selected]
 scenarios.append(record(u,tr,sk,ev,kind='touch-tile',selected=selected,afterInput=afterInput))

# The resolver is called even when selection is unchanged. Native setter
# deduplication leaves pending/type/wait untouched for the same target/options.
u,tr,sk,pi,ev=request_setup(0);hostpass(u,pi);b(u,M+4,0);w(u,M+0xc8,9);start=len(ev)
hostpass(u,pi);call(u,0x2968fc,[OBJ,6,0x10]);hostpass(u,pi)
later=ev[start:]
assert len([x for x in later if x['kind']=='resolve'])==2 and len([x for x in later if x['kind']=='setter'])==2
assert not any(x['kind']=='request-write' for x in later) and reqstate(u)['wait']==9 and reqstate(u)['pending']==0
scenarios.append(record(u,tr,sk,ev,kind='vacancy-dedup',laterEventsStart=start))
# Present-but-unavailable is a different request from vacancy even though both
# targets use the canonical empty key. Record-bit predicates execute natively.
u,tr,sk,pi,ev=request_setup(1);h(u,RECORDS+560+0x36,1);w(u,RECORDS+560,0x12345678);w(u,RECORDS+560+4,0x40000);b(u,RECORDS+560+8,1)
hostpass(u,pi);assert reqstate(u)['type']==13 and reqstate(u)['key']==[0xffffffff,0xffffffff,0]
scenarios.append(record(u,tr,sk,ev,kind='unavailable-clear'))
gates=[]
for gate in ['upper-not-ready','vacancy-before-init','manager-uninitialized','lower-ineligible','lower-overlay','idle-overlay']:
 u,tr,sk,pi,ev=request_setup(1)
 if gate=='upper-not-ready':b(u,UPPER+0x2fc,0)
 elif gate=='vacancy-before-init':b(u,INIT+0xe3,0)
 elif gate=='manager-uninitialized':b(u,M+0xe,0)
 elif gate=='lower-ineligible':b(u,OBJ+0x5c,0)
 elif gate=='lower-overlay':w(u,OBJ+0x3fe0,OBJ+0x9e00)
 elif gate=='idle-overlay':
  w(u,OBJ+0x3fd0,DATA+0x95000);b(u,OBJ+0x3a86,1);b(u,OBJ+0x3a87,1)
 if gate=='idle-overlay':call(u,0x2960ec,[OBJ])
 else:hostpass(u,pi)
 assert not any(x['kind']=='setter' or x['kind']=='request-write' for x in ev),(gate,ev)
 assert reqstate(u)['type']==1 and reqstate(u)['wait']==99
 gates.append(record(u,tr,sk,ev,gate=gate))


transitions=[]
# Native normal-close request subsection; its preceding animation/layout work
# is covered separately. Prefix register values are supplied; stop before UI.
u,tr,sk,pi,ev=request_setup(1,folder=2,mode=44)
u.reg_write(UC_ARM_REG_SP,STACK+0x8000);u.reg_write(UC_ARM_REG_R4,OBJ);u.reg_write(UC_ARM_REG_R6,0);u.reg_write(UC_ARM_REG_R7,0xffffffff)
run(u,0x1de4c8,0x1de550)
assert reqstate(u)['type']==13 and [x['category'] for x in ev if x['kind']=='category']==[3]
assert not any(x['kind']=='resolve' or x['kind']=='manager' for x in ev)
b(u,OBJ+0x5c,0);hostpass(u,pi)
assert next(x for x in ev if x['kind']=='manager')['type']==13
transitions.append(record(u,tr,sk,ev,kind='normal-close-request-fragment'))
# Root history/context already supplied; only whole restoration is an endpoint.
for selected,left in [(3,3),(2,3),(6,3)]:
 u,tr,sk,pi,ev=request_setup(selected,mode=44);h(u,OBJ+0x1172,left);h(u,OBJ+0x1174,left);h(u,OBJ+0x117c,selected-left)
 anim=DATA+0x90000;pane=DATA+0x90100;w(u,OBJ+0xe30,anim);w(u,OBJ+0xac0,pane);w(u,pane+0x38,DATA+0x90200)
 f(u,anim+4,16);f(u,anim+8,0);f(u,anim+0xc,0);w(u,anim+0x14,0)
 def restored_hook(u,a,size,_):
  if a==0x2b021c:ev.append({'kind':'supplied-root-restore','selected':half(u,OBJ+0x1178),'pass':pi[0]});ret(u)
 u.hook_add(UC_HOOK_CODE,restored_hook)
 hostpass(u,pi);immediate=[x for x in ev if x['kind']=='resolve']
 if selected==3:assert len(immediate)==1
 else:
  assert not immediate and byte(u,OBJ+0x3a80)==3
  for _ in range(5):hostpass(u,pi)
 resolves=[x for x in ev if x['kind']=='resolve'];assert len(resolves)==1 and resolves[0]['resolvedSlot']==selected and resolves[0]['caller']=='0x29a4dc'
 assert resolves[0]['pass']==(0 if selected==3 else 5)
 transitions.append(record(u,tr,sk,ev,kind='root-ready',restoredSlot=selected,restoredLeft=left))
# Normal open-completion's idle-entry branch. Child context and selected slot
# are preapplied; the asset/controller completion predicate is not run here.
u,tr,sk,pi,ev=request_setup(1,folder=2,mode=43)
u.reg_write(UC_ARM_REG_SP,STACK+0x8000);u.reg_write(UC_ARM_REG_R4,OBJ);run(u,0x29bb54,0x29bb60)
resolves=[x for x in ev if x['kind']=='resolve'];assert len(resolves)==1 and resolves[0]['resolvedSlot']==1 and byte(u,OBJ+0x1170)==2
assert resolves[0]['caller']=='0x29a4dc' and reqstate(u)['type']==7
transitions.append(record(u,tr,sk,ev,kind='open-completion-idle-fragment'))
# Page and density original lower bodies with mature motion state supplied.
# Visual interpolation helpers are endpoints; clocks/completion/idle execute.
HOME_KEEP.update([0x29bc40,0x1d2fac])
SINKS.update({0x1d9fa4:'density-component-scale',0x2453b8:'density-component-layout',0x1da024:'toolbar-scale'})
for mode in [2,5]:
 for elapsed in [0,9]:
  u,tr,sk,pi,ev=request_setup(1,mode=mode);w(u,OBJ+0x11a4,elapsed);w(u,OBJ+0x3ca4,-1)
  hostpass(u,pi);resolves=[x for x in ev if x['kind']=='resolve']
  assert len(resolves)==(1 if elapsed==9 else 0),(mode,elapsed,resolves)
  assert byte(u,OBJ+0x3a80)==(0 if elapsed==9 else mode)
  if resolves:assert resolves[0]['caller']=='0x29a4dc' and resolves[0]['resolvedSlot']==1 and ev[0]['kind']=='manager'
  transitions.append(record(u,tr,sk,ev,kind='motion-completion',initialMode=mode,initialElapsed=elapsed))
# At the function boundary S+3fd0 suppresses idle-update but not mode0 entry.
# Do not model the full overlay lifecycle with an incomplete supplied object.
u,tr,sk,pi,ev=request_setup(1,mode=3);w(u,OBJ+0x11a4,9);w(u,OBJ+0x3fd0,DATA+0x95000)
call(u,0x1e8f38,[OBJ,0]);resolves=[x for x in ev if x['kind']=='resolve']
assert len(resolves)==1 and resolves[0]['caller']=='0x29a4dc' and reqstate(u)['type']==7
transitions.append(record(u,tr,sk,ev,kind='idle-entry-with-overlay'))
# Category selection for toolbar focus runs; category dispatch is the endpoint
# in these cases, avoiding title/service assets outside this bounded audit.
toolbar=[]
for focus in range(8):
 u,tr,sk,pi,ev=request_setup(1);b(u,OBJ+0x3ca8,1);h(u,OBJ+0x3c8c,focus)
 def toolbar_hook(u,a,size,_):
  if a==0x1d71c0:ret(u,0)
 u.hook_add(UC_HOOK_CODE,toolbar_hook);hostpass(u,pi)
 resolves=[x for x in ev if x['kind']=='resolve'];categories=[x['category'] for x in ev if x['kind']=='category']
 assert len(resolves)==1 and resolves[0]['focus']==focus and resolves[0]['toolbarActive'] and resolves[0]['resolvedSlot']==1
 assert categories==[[2],[5],[4],[6],[7],[8],[2],[2]][focus]
 toolbar.append(record(u,tr,sk,ev,kind='toolbar-category',focus=focus))
# Static direct branch references corroborate the manager wrapper boundary;
# they do not rule out vtable calls. Special helper1e1988 explicitly invokes
# upper and lower task virtual updates and is outside the ordinary scenarios.
xrefs={}
for target,expected in [(0x24c0ac,[0x2857e0]),(0x28574c,[0x286f30,0x287840])]:
 refs=[]
 for offset in range(0,len(CODE)-3,4):
  ins=struct.unpack_from('<I',CODE,offset)[0]
  if ins&0x0e000000!=0x0a000000:continue
  delta=ins&0xffffff
  if delta&0x800000:delta-=0x1000000
  if 0x100000+offset+8+4*delta==target:refs.append(0x100000+offset)
 assert refs==expected,(hex(target),refs)
 xrefs[hex(target)]=[hex(a) for a in refs]

# Source and rendered instruction excerpts remain private, never in git.
cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True
ranges=[(0x102288,0x10232c),(0x1067dc,0x106930),(0x286e74,0x286fc4),
 (0x28574c,0x285850),(0x2b56e8,0x2b58b0),(0x2b6e4c,0x2b716c),
 (0x2b72e0,0x2b7308),(0x2960ec,0x2966d4),(0x2967dc,0x2968fc),
 (0x2968fc,0x2976a0),(0x1de858,0x1de8ec),(0x2660a0,0x2661bc),
 (0x29a184,0x29a5ac),(0x29a5ac,0x29a5d4),(0x1e0f44,0x1e1988),
 (0x1d71c0,0x1d7740),(0x1ed6ec,0x1ed950),(0x1e1988,0x1e1a80),
 (0x2a3db8,0x2a3fb0),(0x2a1bbc,0x2a1c6c),(0x29bc40,0x29c3a4),
 (0x1d2fac,0x1d3270),(0x1de4c8,0x1de550),(0x29f0a4,0x29f4ac),
 (0x29bb54,0x29bb64)]
excerpts=[]
for start,end in ranges:
 raw=CODE[start-0x100000:end-0x100000]
 rendered='\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n'
 path=OUT/f'proof-{start:x}-{end:x}.asm';path.write_text(rendered)
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
report={'sourceSHA256':SHA,'fixtureSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
 'registration':registrationResult,'scenarios':scenarios,'gates':gates,'transitions':transitions,'toolbar':toolbar,
 'directBranchReferences':xrefs,'excerpts':excerpts,'fixedEndpoints':{hex(k):v for k,v in sorted(SINKS.items())},
 'scope':'Original ARM ordinary host ordering, mature grid/tile handlers, idle update/entry, mode2/3/5 completion, resolver/classification and setter key/type/pending/wait branches execute with supplied state and explicit endpoints. Banner manager entry records request state but returns without resource, active-instance, wait or visibility work. Complete task construction, service initialization, available-application metadata, overlay lifecycle, folder creation/open/close prefixes and label formatting are excluded. Root history/context restoration is an endpoint. Open/close fragments and direct overlay function entries are labeled separately; they are not full host passes. Toolbar cases stop at category dispatch. Direct branch scanning cannot exclude indirect calls; special1e1988 manually calls task update vtables outside tested routes. No hardware capture, fixedHz, universal manager frequency or request-per-selection inference.'}
(OUT/'checked.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'scenarios':len(scenarios),'gates':len(gates),'transitions':len(transitions),'toolbarCases':len(toolbar),'sourceExcerpts':len(excerpts),'fixtureSHA256':report['fixtureSHA256'],'resultSHA256':hashlib.sha256((OUT/'checked.json').read_bytes()).hexdigest()},indent=2))
