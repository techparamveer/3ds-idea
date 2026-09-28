"""Original-ARM ordinary HOME direction masks and grid/toolbar boundaries."""
from pathlib import Path
import argparse,hashlib,json,struct
from capstone import Cs,CS_ARCH_ARM,CS_MODE_ARM
from unicorn import Uc,UC_ARCH_ARM,UC_MODE_ARM,UC_HOOK_CODE,UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
p=argparse.ArgumentParser();p.add_argument('--code',type=Path,required=True);p.add_argument('--output',type=Path,required=True);opt=p.parse_args()
OUT=opt.output;OUT.mkdir(parents=True,exist_ok=True);CODE=opt.code.read_bytes()
assert hashlib.sha256(CODE).hexdigest()=='243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9'
OBJ,STACK,END=0x8000000,0x8100000,0x8200000
REGS=[UC_ARM_REG_R0,UC_ARM_REG_R1,UC_ARM_REG_R2,UC_ARM_REG_R3]
def w(u,a,n):u.mem_write(a,struct.pack('<I',n&0xffffffff))
def word(u,a):return struct.unpack('<I',u.mem_read(a,4))[0]
def byte(u,a):return u.mem_read(a,1)[0]
def b(u,a,n):u.mem_write(a,bytes([n&255]))
def f(u,a,n):u.mem_write(a,struct.pack('<f',n))
def fl(u,a):return struct.unpack('<f',u.mem_read(a,4))[0]
def args(u):return [u.reg_read(r) for r in REGS]
def ret(u,n=None):
 if n is not None:u.reg_write(UC_ARM_REG_R0,n)
 u.reg_write(UC_ARM_REG_PC,u.reg_read(UC_ARM_REG_LR))
def machine():
 u=Uc(UC_ARCH_ARM,UC_MODE_ARM);u.mem_map(0x100000,0x300000);u.mem_write(0x100000,CODE)
 for a in [OBJ,STACK,END]:u.mem_map(a,0x10000)
 u.reg_write(UC_ARM_REG_C1_C0_2,0xf<<20);u.reg_write(UC_ARM_REG_FPEXC,0x40000000)
 return u
def run(u,a,z=END):
 try:u.emu_start(a,z,count=100000)
 except Exception:print('FAULT',hex(u.reg_read(UC_ARM_REG_PC)),[hex(x) for x in args(u)]);raise
 assert u.reg_read(UC_ARM_REG_PC)==z,hex(u.reg_read(UC_ARM_REG_PC))
def call(u,a,values=()):
 u.reg_write(UC_ARM_REG_SP,STACK+0x8000);u.reg_write(UC_ARM_REG_LR,END)
 for r,v in zip(REGS,values):u.reg_write(r,v&0xffffffff)
 run(u,a)
def cword(a):return struct.unpack_from('<I',CODE,a-0x100000)[0]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def h(u,a,n):u.mem_write(a,struct.pack('<H',n&0xffff))
def half(u,a):return struct.unpack('<h',u.mem_read(a,2))[0]
CURSOR=OBJ+0x7100;LOOP=OBJ+0x7200;SCALE=OBJ+0x7300;WIDGET=OBJ+0x7400
ROWS=[1,2,3,4,5,6];FROWS=[1,1,2,3,4,5];COLS=[3,3,5,7,9,10]
assert [cword(0x1e3a90+i*4) for i in [0,3]]==[0x1e3e34,0x1e3ecc]

def snap(u):
 return {'selected':half(u,OBJ+0x1178),'left':half(u,OBJ+0x1172),'target':half(u,OBJ+0x1174),'mode':byte(u,OBJ+0x3a80),'counter':word(u,OBJ+0x3c98),'duration':word(u,OBJ+0x11a8),'elapsed':word(u,OBJ+0x11a4),'step':fl(u,LOOP+0x10),'phase':fl(u,LOOP+0xc),'directionFlags':[byte(u,OBJ+x) for x in [0x3cab,0x3cac]],'pendingFlags':[byte(u,OBJ+x) for x in [0x3cad,0x3cae]],'toolbar':byte(u,OBJ+0x3ca8),'focus':half(u,OBJ+0x3c8c),'previousFocus':half(u,OBJ+0x3c90),'savedColumn':word(u,OBJ+0x3c94),'scaleFrame':fl(u,SCALE+0xc)}

SINKS={0x1d7d00:'grid-coordinate-generation',0x297b20:'selection-status',0x1de8ec:'widget-input-setup',0x1de858:'cursor-select-effect'}

HELPERS={0x1d8468:'right',0x1d85f8:'left',0x1d874c:'down',0x1d88ec:'up',0x1d8a94:'enter-toolbar'}

def setup(folder=False,density=0,selected=2,left=0,counter=0,step=1,mode=0):
 u=machine();trace=[];tick=[-1];sinks=[]
 b(u,OBJ+0x1170,0 if folder else 255)
 for off,n in [(0x1178,selected),(0x1172,left),(0x1174,left),(0x117c,selected-left),(0x1180,-1),(0x3c8c,-1),(0x3c90,-1),(0x3c2a,-1)]:h(u,OBJ+off,n)
 for off,n in [(0x118c,density),(0x1190,density),(0x1810,60 if folder else 300),(0x3c94,-1),(0x3c98,counter),(0x3aa0,OBJ+0x5000),(0x1164,OBJ+0x6000),(0xab4,OBJ+0x7000),(0x820,CURSOR),(0xe24,SCALE),(0xf3c,WIDGET+0x100),(0xf40,WIDGET+0x200),(0x1188,WIDGET+0x300),(0xf44,WIDGET)]:w(u,OBJ+off,n)
 w(u,OBJ+0x5000,OBJ+0x5800);w(u,OBJ+0x583c,END+0x100)
 f(u,OBJ+0x7000+0xc8,1);b(u,OBJ+0x3a80,mode)
 w(u,CURSOR+0x8c,LOOP);w(u,CURSOR+0x80,SCALE)
 for c in [LOOP,SCALE]:w(u,c,0x321828)
 f(u,LOOP+0x10,step);f(u,LOOP+0xc,17.25)
 def hook(u,a,size,_):
  if a in HELPERS:trace.append({'kind':'helper','name':HELPERS[a],'args':args(u),**snap(u)})
  if a==0x1da050:trace.append({'kind':'scale','bits':u.reg_read(UC_ARM_REG_S0),**snap(u)})
  if a in SINKS:
   sinks.append({'address':hex(a),'name':SINKS[a],'args':args(u)});trace.append({'kind':'endpoint','name':SINKS[a],'args':args(u),**snap(u)});ret(u,0)
  elif a==0x1e8f38:trace.append({'kind':'state-call','tick':tick[0],'newMode':args(u)[1],'callerReturn':hex(u.reg_read(UC_ARM_REG_LR)),**snap(u)})
  elif a==0x2a3600:trace.append({'kind':'mode3-entry','tick':tick[0],**snap(u)})
  elif a in [0x233a6c,0x2947f8]:
   trace.append({'kind':'sound' if a==0x233a6c else 'input','tick':tick[0],'args':args(u),**snap(u)})
   if a==0x233a6c:ret(u)
 def whook(u,access,address,size,value,_):
  if address in [OBJ+0x3c98,LOOP+0x10,LOOP+0xc]:trace.append({'kind':'write','tick':tick[0],'address':hex(address),'pc':hex(u.reg_read(UC_ARM_REG_PC)),'value':value,'size':size})
 u.hook_add(UC_HOOK_CODE,hook);u.hook_add(UC_HOOK_MEM_WRITE,whook)
 return u,trace,tick,sinks

def direction(u,key,event=4):call(u,0x2968fc,[OBJ,event,key])

MASKS=[0x10,0x20,0x40,0x80,0x30,0xc0,0x50,0x90,0x60,0xa0,0xf0]
CONFIGS=[(False,0),(False,2),(False,5),(True,0),(True,2),(True,5)]
def record(u,tr,sk,**metadata):
 return {**metadata,'after':snap(u),'helpers':[x['name'] for x in tr if x['kind']=='helper'],'cues':[hex(x['args'][1]) for x in tr if x['kind']=='sound'],'trace':tr,'endpoints':sk}
cases=[]
for folder,density in CONFIGS:
 R=(FROWS if folder else ROWS)[density];C=COLS[density];N=60 if folder else 300
 positions=[('interior',R+min(1,R-1),0),('top',R,0),('bottom',2*R-1,0),
 ('viewport-right',(C-1)*R+min(1,R-1),0),('viewport-left',R+min(1,R-1),R),
 ('absolute-left',min(1,R-1),0),('absolute-right',N-R+min(1,R-1),max(0,N-C*R)),
 ('upper-left',0,0),('lower-right',N-1,max(0,N-C*R))]
 for label,selected,left in positions:
  for event in [4,6]:
   for mask in MASKS:
    u,tr,t,sk=setup(folder,density,selected,left,counter=4);before=snap(u);direction(u,mask,event)
    cases.append(record(u,tr,sk,folder=folder,density=density,R=R,C=C,N=N,position=label,event=event,mask=hex(mask),before=before))

def grid_focus(folder,density,column):return struct.unpack_from('<h',CODE,(0x314eec if folder else 0x314e74)-0x100000+density*20+column*2)[0]
def toolbar_column(folder,density,focus):return cword((0x315024 if folder else 0x314f64)+density*32+focus*4)
toolbarCases=[]
for folder,density in CONFIGS:
 R=(FROWS if folder else ROWS)[density];C=COLS[density]
 for focus in [0,3,7]:
  for saved in [-1,2]:
   for event in [4,6]:
    for mask in MASKS:
     u,tr,t,sk=setup(folder,density,selected=R+min(1,R-1),left=R,counter=4)
     b(u,OBJ+0x3ca8,1);h(u,OBJ+0x3c8c,focus);w(u,OBJ+0x3c94,saved)
     before=snap(u);direction(u,mask,event)
     toolbarCases.append(record(u,tr,sk,folder=folder,density=density,R=R,C=C,event=event,mask=hex(mask),before=before))

# Validate directional order, state, viewport entry and requested cue order.
DIRECTIONS={0x10:(None,'right'),0x20:(None,'left'),0x40:('up',None),0x80:('down',None),0x50:('up','right'),0x90:('down','right'),0x60:('up','left'),0xa0:('down','left')}
for c in cases:
 mask=int(c['mask'],16);before=c['before'];after=c['after'];R=c['R'];P=before['selected'];V=before['left'];target=V;helpers=[];cues=[];entered=False;mode=0;focus=-1;pending=[0,0];flags=[0,0];saved=0xffffffff
 vertical,horizontal=DIRECTIONS.get(mask,(None,None))
 if vertical:
  helpers.append(vertical)
  entered=P%R==0 if vertical=='up' else (P+1)%R==0
  if entered:
   helpers.append('enter-toolbar');saved=(P-V)//R;focus=grid_focus(c['folder'],c['density'],saved)
  else:P+=-1 if vertical=='up' else 1
 if horizontal and not entered:
  helpers.append(horizontal);candidate=P+(R if horizontal=='right' else -R)
  if candidate<0 or candidate>=c['N']:
   if c['event']==4:cues.append('0x100002e')
  else:
   P=candidate
   if P<V or P>=V+c['C']*R:
    mode=3;target=V+(R if horizontal=='right' else -R);flags=[int(horizontal=='left'),int(horizontal=='right')]
 if entered:cues.append('0x100003f')
 elif P!=before['selected']:cues.append('0x100002c')
 assert c['helpers']==helpers and c['cues']==cues,(c,helpers,cues)
 assert after['selected']==P and after['target']==target and after['toolbar']==int(entered) and after['focus']==focus and after['savedColumn']==saved,c
 assert after['mode']==mode and after['counter']==4+int(mode==3) and after['directionFlags']==flags and after['pendingFlags']==pending,c
 if mode==3:assert after['duration']==10 and after['elapsed']==0
 assert after['step']==1 and after['phase']==17.25,c

for c in toolbarCases:
 mask=int(c['mask'],16);before=c['before'];after=c['after'];R=c['R'];focus=before['focus'];saved=before['savedColumn'];P=before['selected'];helpers=[];cues=[]
 vertical,horizontal=DIRECTIONS.get(mask,(None,None))
 if horizontal:
  helpers.append(horizontal);focus=(focus+(1 if horizontal=='right' else -1))%8;saved=0xffffffff
 if vertical:
  helpers.append(vertical);column=toolbar_column(c['folder'],c['density'],focus) if saved==0xffffffff else saved
  P=before['target']+column*R+(R-1 if vertical=='up' else 0);previousFocus=focus;focus=-1;saved=0xffffffff;cues=['0x100002c']
 elif horizontal:cues=['0x100003f']
 assert c['helpers']==helpers and c['cues']==cues,c
 assert after['selected']==P and after['focus']==focus and after['savedColumn']==saved and after['toolbar']==int(not vertical),c
 if vertical:assert after['previousFocus']==previousFocus,c
 assert after['mode']==0 and after['counter']==4 and after['directionFlags']==[0,0] and after['pendingFlags']==[0,0],c

# Native round trips across every visible column in representative densities.
# Table restoration, remembered-focus override and native Scale seek run.
roundTrips=[]
for folder,density in CONFIGS:
 R=(FROWS if folder else ROWS)[density];C=COLS[density]
 for column in range(C):
  for outMask in [0x40,0x80]:
   for backMask in [0x40,0x80]:
    initial=R+column*R+(0 if outMask==0x40 else R-1)
    u,tr,t,sk=setup(folder,density,initial,R,counter=4);direction(u,outMask);entered=snap(u);split=len(tr)
    assert entered['toolbar']==1 and entered['savedColumn']==column and entered['focus']==grid_focus(folder,density,column)
    direction(u,backMask);restored=snap(u)
    assert restored['toolbar']==0 and restored['selected']==R+column*R+(R-1 if backMask==0x40 else 0)
    assert restored['previousFocus']==entered['focus'] and restored['savedColumn']==0xffffffff
    # Moving out again at the corresponding row edge must reuse last focus.
    direction(u,0x80 if backMask==0x40 else 0x40);again=snap(u)
    assert again['toolbar']==1 and again['focus']==entered['focus'] and again['savedColumn']==column
    roundTrips.append(record(u,tr,sk,folder=folder,density=density,column=column,outMask=hex(outMask),backMask=hex(backMask),entered=entered,restored=restored))
remembered=[]
for folder,density in CONFIGS:
 R=(FROWS if folder else ROWS)[density]
 for key,selected in [(0x40,0),(0x80,R-1)]:
  u,tr,t,sk=setup(folder,density,selected,counter=4);h(u,OBJ+0x3c90,3);direction(u,key)
  assert half(u,OBJ+0x3c8c)==3 and word(u,OBJ+0x3c94)==0 and byte(u,OBJ+0x3ca8)==1
  remembered.append(record(u,tr,sk,folder=folder,density=density,mask=hex(key)))

gates=[]
for gate in ['overlay','missing-manager','manager-inhibit','scene-inhibit','busy-mode3']:
 for event in [4,6]:
  for mask in [0x30,0xc0,0x50,0x90,0x60,0xa0,0xf0]:
   u,tr,t,sk=setup(False,2,selected=4,counter=4)
   if gate=='overlay':w(u,OBJ+0x3fd0,OBJ+0x9500)
   elif gate=='missing-manager':w(u,OBJ+0x3aa0,0)
   elif gate=='manager-inhibit':b(u,OBJ+0x5000+0x469,1)
   elif gate=='scene-inhibit':b(u,OBJ+0x3fb7,1)
   elif gate=='busy-mode3':b(u,OBJ+0x3a80,3)
   before=snap(u);direction(u,mask,event);case=record(u,tr,sk,gate=gate,event=event,mask=hex(mask),before=before)
   assert case['after']==before and case['helpers']==[] and case['cues']==[],case
   gates.append(case)

# One common selection effect follows the final requested selection cue.
# An invalid horizontal move alone has no common effect; diagonal partial
# movement still does. Scale's actual seek writes the requested frame.
for c in cases+toolbarCases:
 sounds=[i for i,x in enumerate(c['trace']) if x['kind']=='sound']
 effects=[i for i,x in enumerate(c['trace']) if x['kind']=='endpoint' and x['name']=='cursor-select-effect']
 changed=c['before']['selected']!=c['after']['selected'] or c['before']['focus']!=c['after']['focus']
 assert len(effects)==int(changed),c
 if effects:assert sounds and effects[0]>sounds[-1],c
 scales=[x['bits'] for x in c['trace'] if x['kind']=='scale']
 if scales:assert c['after']['scaleFrame']==struct.unpack('<f',struct.pack('<I',scales[-1]))[0],c
 if c['after']['mode']==3:
  entry=next(i for i,x in enumerate(c['trace']) if x['kind']=='mode3-entry')
  assert entry<sounds[-1],c

cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True;excerpts=[]
for start,end in [(0x2968fc,0x297070),(0x1d8468,0x1d8af8),(0x1e8f38,0x1e8f60),(0x2a3600,0x2a3700),(0x1da050,0x1da060),(0x1bbd8c,0x1bbd94)]:
 raw=CODE[start-0x100000:end-0x100000];path=OUT/f'proof-{start:x}-{end:x}.asm'
 path.write_text('\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n')
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':sha(path)})
sourceTables={}
for label,start,fmt,count in [('scale-seek-virtual',0x321828+0x2c,'I',1),('root-grid-focus',0x314e74,'h',60),('folder-grid-focus',0x314eec,'h',60),('root-toolbar-column',0x314f64,'i',48),('folder-toolbar-column',0x315024,'i',48),('root-rows',0x308778,'i',6),('folder-rows',0x3087a8,'i',6),('root-columns',0x308760,'i',6),('folder-columns',0x308790,'i',6)]:
 raw=CODE[start-0x100000:start-0x100000+struct.calcsize(fmt)*count]
 values=list(struct.unpack('<'+str(count)+fmt,raw));sourceTables[label]={'address':hex(start),'values':values,'bytesSHA256':hashlib.sha256(raw).hexdigest()}
 path=OUT/f'table-{label}.json';path.write_text(json.dumps(sourceTables[label],indent=2)+'\n');excerpts.append({'path':path.name,'start':hex(start),'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':sha(path)})
assert sourceTables['root-rows']['values']==ROWS and sourceTables['folder-rows']['values']==FROWS
assert sourceTables['root-columns']['values']==COLS and sourceTables['folder-columns']['values']==COLS
report={'sourceSHA256':hashlib.sha256(CODE).hexdigest(),'fixtureSHA256':sha(Path(__file__)),'gridCases':cases,'toolbarCases':toolbarCases,'roundTrips':roundTrips,'rememberedFocus':remembered,'gates':gates,'sourceTables':sourceTables,'excerpts':excerpts,'endpoints':{hex(k):v for k,v in SINKS.items()},'scope':'Original ordinary event4/6 dispatcher, directional helpers, focus table copies, viewport state setter/mode3 entry and cue requests execute. Supplied scene records; grid-coordinate generation, selection status, widget setup, cursor effect and sound requests are recording endpoints. Native Scale seek runs. No producer analog quantization, host timing, full toolbar activation features or rendered/audio result claimed. Numeric result matrices, source table payloads and firmware excerpts remain private.'}
(OUT/'checked.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'gridCases':len(cases),'toolbarCases':len(toolbarCases),'roundTrips':len(roundTrips),'rememberedFocus':len(remembered),'gates':len(gates),'sourceExcerpts':len(excerpts),'fixtureSHA256':report['fixtureSHA256'],'resultSHA256':sha(OUT/'checked.json')},indent=2))
