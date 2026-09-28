"""Bounded original-ARM primary cursor at mode3 boundaries. Firmware/output stay private."""
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

# Enable previously separate grid/primary-position helpers. Keep resource lookup
# and scroll notification at explicit endpoints; execute the VFP geometry math.
for target in [0x1d7b50,0x1d7d00,0x1d7eac,0x297b20]:SINKS.pop(target,None)
HOME_KEEP.add(0x1d914c)
SINKS[0x1eb4cc]='scroll-layout-notification'
ROOT=DATA+0x90000;ICON=DATA+0x90100;E0=DATA+0x91000;E1=DATA+0x92000

def primary(u):
 selected=half(u,OBJ+0x1178)
 return {**snapshot(u),'request':byte(u,OBJ+0x3a88),'shown':byte(u,OBJ+0x3a4e),'visible':byte(u,CURSOR+0x60),
 'position':list(struct.unpack('<3f',u.mem_read(ROOT+0x28,12))),'scroll':fl(u,OBJ+0x3a28),
 'selectedGrid':[fl(u,OBJ+0x1868+4*selected),fl(u,OBJ+0x1e08+4*selected)],
 'left':half(u,OBJ+0x1172),'target':half(u,OBJ+0x1174),'overlay':bool(word(u,OBJ+0x3fd0))}

def primary_setup(selected=2,folder=-1,density=0,shown=1,counter=5,left=0):
 u,tr,sk,pi,ev=request_setup(selected,folder);pe=[]
 w(u,CURSOR+0x38,ROOT);b(u,ROOT+0xb7,255)
 for offset,obj in [(0x824,E0),(0x828,E1)]:w(u,OBJ+offset,obj);w(u,obj+0x38,obj+0x200)
 for offset in [0x118c,0x1190]:w(u,OBJ+offset,density)
 for offset in [0x1194,0x1198,0x119c]:f(u,OBJ+offset,density)
 w(u,OBJ+0x1810,60 if folder>=0 else 300);w(u,OBJ+0x3c98,counter)
 b(u,OBJ+0x3a88,0);b(u,OBJ+0x3a4e,shown);b(u,CURSOR+0x60,shown)
 h(u,OBJ+0x1172,left);h(u,OBJ+0x1174,left);h(u,OBJ+0x117c,selected-left)
 def phook(u,a,size,_):
  if a==0x2292e4:
   name=bytes(u.mem_read(args(u)[1],64)).split(b'\0')[0].decode();assert name=='N_IconPos_00'
   sk.append({'target':hex(a),'kind':'resource-pane-local-y0','name':name,'caller':hex(u.reg_read(UC_ARM_REG_LR)-4)});ret(u,ICON)
  elif a in [0x1d914c,0x103df8,0x269430]:
   pe.append({'kind':{0x1d914c:'position-helper',0x103df8:'2d-entry',0x269430:'loop-update'}[a],'pass':pi[0],'pc':hex(a),'caller':hex(u.reg_read(UC_ARM_REG_LR)-4),**primary(u)})
 def pwrites(u,access,address,size,value,_):
  if address in [OBJ+0x3a88,OBJ+0x3a4e,CURSOR+0x60,ROOT+0x28,ROOT+0x2c,ROOT+0x30]:
   pe.append({'kind':'primary-write','pc':hex(u.reg_read(UC_ARM_REG_PC)),'pass':pi[0],'address':hex(address),'value':value,'mode':byte(u,OBJ+0x3a80)})
 u.hook_add(UC_HOOK_CODE,phook);u.hook_add(UC_HOOK_MEM_WRITE,pwrites)
 u.reg_write(UC_ARM_REG_SP,STACK+0x8000);run(u,0x2f4124,0x2f43f8)
 call(u,0x1d7eac,[OBJ])
 f(u,OBJ+0x3a28,fl(u,OBJ+0x1868+left*4)-fl(u,OBJ+0x1868));call(u,0x297b20,[OBJ]);call(u,0x1d914c,[OBJ])
 pe.clear();tr.clear();sk.clear();ev.clear()
 return u,tr,sk,pi,ev,pe


def payload(u,tr,sk,ev,pe,**extra):
 return {**extra,'final':primary(u),'events':pe,'requestEvents':ev,'hostTrace':tr,'endpoints':sk}
def f32(n):return struct.unpack('<f',struct.pack('<f',n))[0]
def advance_loop(n,step):
 n=f32(n+step)
 while n>=60:n=f32(n-60)
 return n
entries=[]
for folder,density,selected,left,direction,counter,shown in [
 (-1,0,2,0,0x10,0,1),(-1,0,2,0,0x10,5,0),
 (-1,2,12,0,0x10,5,1),(2,2,2,2,0x20,5,1)]:
 u,tr,sk,pi,ev,pe=primary_setup(selected,folder,density,shown,counter,left)
 before=primary(u);inputBoundary=[]
 def input_hook(u,a,size,_):
  if a==0x1067dc and pi[0]==0:inputBoundary.append(primary(u))
 u.hook_add(UC_HOOK_CODE,input_hook)
 rows=[];phase=before['loopCurrent'];duration=10 if counter<5 else 5;step=1 if counter<5 else 3
 for i in range(duration):
  # Actual producer/callback inside the same host pass: press first, then held.
  w(u,SAMPLE+8,direction);w(u,SAMPLE+0xc,direction if i==0 else 0);w(u,SAMPLE+0x10,0)
  hostpass(u,pi);row=primary(u);rows.append(row)
  assert row['shown']==row['visible']==1 and row['request']==0
  assert row['loopSubmitted']==phase;phase=advance_loop(phase,step);assert row['loopCurrent']==phase
  if i<duration-1:assert row['mode']==3 and row['position']==before['position']
  else:assert row['mode']==0 and row['position']==[f32(row['selectedGrid'][0]-row['scroll']),row['selectedGrid'][1],0]
 afterInput=inputBoundary[0]
 assert afterInput['mode']==3 and afterInput['request']==0 and afterInput['shown']==shown and afterInput['visible']==shown
 assert afterInput['position']==before['position'] and afterInput['loopCurrent']==before['loopCurrent']
 assert afterInput['scrollElapsed']==0 and rows[0]['scrollElapsed']==1
 assert len([e for e in pe if e['kind']=='loop-update'])==duration
 entries.append(payload(u,tr,sk,ev,pe,kind='direction-entry-through-completion',folder=folder,density=density,direction=direction,counter=counter,initialShown=shown,before=before,afterInput=afterInput,rows=rows))
completions=[]
for overlay in [False,True]:
 for replay in [False,True]:
  for shown in [0,1]:
   u,tr,sk,pi,ev,pe=primary_setup()
   call(u,0x2968fc,[OBJ,4,0x10])
   for _ in range(4):hostpass(u,pi)
   if replay:call(u,0x2968fc,[OBJ,6,0x10])
   # Prior visibility is explicitly supplied at the mature completion boundary;
   # this does not model the event/lifecycle that hid the cursor.
   b(u,OBJ+0x3a4e,shown);b(u,CURSOR+0x60,shown)
   pe.clear();tr.clear();sk.clear();ev.clear();before=primary(u)
   def boundary_hook(u,a,size,_):
    if a==0x2b709c:
     if overlay:w(u,OBJ+0x3fd0,DATA+0x95000)
     pe.append({'kind':'completion-boundary','pass':pi[0],**primary(u)})
    elif a==0x2b70bc:pe.append({'kind':'idle-return-before-replay','pass':pi[0],**primary(u)})
   u.hook_add(UC_HOOK_CODE,boundary_hook);hostpass(u,pi);after=primary(u)
   assert after['request']==0 and after['overlay']==overlay
   assert after['shown']==after['visible']==(shown if overlay else 1)
   assert after['selected']==(4 if replay and not overlay else 3)
   assert after['mode']==(3 if replay and not overlay else 0)
   assert byte(u,OBJ+0x3cac)==byte(u,OBJ+0x3cae)==0
   assert [e['resolvedSlot'] for e in ev if e['kind']=='resolve']==[3]
   updates=[e for e in pe if e['kind']=='loop-update'];assert len(updates)==after['visible']
   if after['visible']:assert after['loopSubmitted']==before['loopCurrent'] and after['loopCurrent']==advance_loop(before['loopCurrent'],before['loopStep'])
   else:assert after['loopSubmitted']==before['loopSubmitted'] and after['loopCurrent']==before['loopCurrent']
   positions=[e for e in pe if e['kind']=='position-helper'];assert len(positions)==int(not overlay)
   primaryWrites=[e for e in pe if e['kind']=='primary-write' and int(e['address'],16) in [ROOT+0x28,ROOT+0x2c,ROOT+0x30]]
   assert bool(primaryWrites)==(not overlay and not replay)
   completions.append(payload(u,tr,sk,ev,pe,kind='completion-boundary',overlayAtCompletion=overlay,pendingReplay=replay,priorShown=shown,before=before))
# Keep every firmware/source excerpt private. The repository contains only
# this bounded executable harness and its prose evidence note.
cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True
ranges=[(0x102288,0x10232c),(0x2b709c,0x2b7148),(0x2b8490,0x2b856c),
 (0x2a3600,0x2a3700),(0x29a184,0x29a2b8),(0x29a3e0,0x29a4e0),
 (0x1d914c,0x1d928c),(0x1d9f38,0x1d9f58),(0x1d7b50,0x1d7c74),
 (0x1d7d00,0x1d7f3c),(0x297b20,0x297bdc),(0x1e3a38,0x1e3a70),
 (0x2f4124,0x2f43f8),(0x103df8,0x104074),(0x1f58e4,0x1f59b4),
 (0x269430,0x269498),(0x1bbd94,0x1bbf30),(0x2968fc,0x296940),
 (0x29703c,0x297044),(0x232234,0x23224c)]
excerpts=[]
for start,end in ranges:
 raw=CODE[start-0x100000:end-0x100000]
 rendered='\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n'
 path=OUT/f'proof-{start:x}-{end:x}.asm';path.write_text(rendered)
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
report={'sourceSHA256':SHA,'fixtureSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
 'baseRequestFixtureSHA256':'7b1be990ca14d0a5b650f8260647d64c4682e02a793f0fb8bbcfa597fb5d6b23',
 'resourceProvenance':{'priorToolbarReportSHA256':'05b378c0534019c8ea8d22a966d23ea3bdfd1ac265d8b70d07fc21308f6eaa86','baseLayoutSHA256':'787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf','pane':'N_IconPos_00','suppliedLocalY':0},
 'registration':registrationResult,'entries':entries,'completions':completions,'excerpts':excerpts,
 'fixedEndpoints':{hex(k):v for k,v in sorted(SINKS.items())},
 'scope':'Original ARM host producer/callback, mature task update, mode3 entry/tick/idle/replay, common visibility/position footer, native grid constants/coordinates/transition arrays/interpolation, primary pane setter, global2D eligibility and Loop submission/advance execute. Primary/effect objects are supplied; effects stay hidden and their trigger remains a visual endpoint. Named resource-pane lookup supplies original N_IconPos_00 localY0, checked in prior toolbar resource audit. Platform/services, unrelated HOME/upper direct callees, banner manager entry, widget/layout notification, rendering/audio and label formatting retain explicit recorded endpoints. Completion overlay is injected at2b709c after earlier HOME services; prior shown/actual-visibility flags are supplied together, not derived from a hide lifecycle. No full overlay lifecycle, toolbar feature audit, raster visibility, viewport clipping or fixedHz claim.'}
(OUT/'checked.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'entrySequences':len(entries),'completionCases':len(completions),'sourceExcerpts':len(excerpts),'fixtureSHA256':report['fixtureSHA256'],'resultSHA256':hashlib.sha256((OUT/'checked.json').read_bytes()).hexdigest()},indent=2))
