"""Bounded original-ARM settled-grid stylus lifecycle. Firmware/output stay private."""
from pathlib import Path
import hashlib,json,struct
from native import decode_animation,decode_layout,sections
SELF=Path(__file__)
BASE_FIXTURE=SELF.with_name('home_primary_cursor_boundaries.py')
source=BASE_FIXTURE.read_text()
assert hashlib.sha256(source.encode()).hexdigest()=='c1d11e146e3fd3413acce21114474d7e6b18f5e8592171c8cd8c7f5d7b6ac62c'
prefix=source.split('\nentries=[]\n',1)[0]
prefix=prefix.replace("opt=p.parse_args()", "p.add_argument('--resources',type=Path,required=True);opt=p.parse_args()")
prefix=prefix.replace("0x269430:'cursor-loop'", "0x269430:'controller-update'")
prefix=prefix.replace("0x269430:'loop-update'", "0x269430:'controller-update'")
prefix=prefix.replace("'name':SINKS[a],'caller':hex(caller)",
 "'name':SINKS[a],'caller':hex(caller),'args':args(u)")
prefix=prefix.replace("'caller':hex(u.reg_read(UC_ARM_REG_LR)-4),**primary(u)",
 "'caller':hex(u.reg_read(UC_ARM_REG_LR)-4),'controller':hex(args(u)[0]) if a==0x269430 else None,**primary(u)")
exec(compile(prefix,str(BASE_FIXTURE),'exec'),globals())
WIDGET=DATA+0xb0000;CONFIG=WIDGET+0x100;TILE=WIDGET+0x200
SELECT=WIDGET+0x400;DECIDE=WIDGET+0x800
PRIMARY_SELECT=WIDGET+0xc00;PRIMARY_DECIDE=WIDGET+0xe00
POSE=WIDGET+0xa000;LINKS=WIDGET+0x1c00
resources={};animations={}
for name in ['LncIconDist_01_Select','LncIconDist_01_Decide','LncCsr_00_Scale','LncCsr_00_Select','LncCsr_00_Decide']:
 raw=(opt.resources/'anim'/f'{name}.bclan').read_bytes()
 animations[name]=decode_animation(raw)
 resources[name+'.bclan']={'sha256':hashlib.sha256(raw).hexdigest(),'decoded':animations[name]}
 animations[name]['pai']=next(r.data for tag,r in sections(raw,b'CLAN')[1] if tag=='pai1')
raw=(opt.resources/'blyt/LncIconDist_01.bclyt').read_bytes()
layout=decode_layout(raw)
resources['LncIconDist_01.bclyt']={'sha256':hashlib.sha256(raw).hexdigest(),'groups':layout['groups']}
def walk(items):
 for item in items:
  yield item
  yield from walk(item['children'])
pane=next(p for p in walk(layout['roots']) if p['name']=='P_IconBtnDmy_00')
resources['LncIconDist_01.bclyt']['pressedPane']={k:pane[k] for k in ['name','translation','scale','size']}
resources['LncIconDist_01.bclyt']['pressedPane']['children']=[c['name'] for c in pane['children']]
assert {k:v['sha256'] for k,v in resources.items()}=={
 'LncIconDist_01_Select.bclan':'910b1250e61df47525826a0e5fbcc0901d2dabfb96582a9cdcd2251e95c65eb6',
 'LncIconDist_01_Decide.bclan':'9d151d49dbc67c68c9ea0c029551c2601c3bcf7906c7fc5bd50eeca223072129',
 'LncCsr_00_Scale.bclan':'74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd',
 'LncCsr_00_Select.bclan':'ecdf8761f6e0c07c9405dc12f9d4d65f1b97b4c70bb110da4a0afc52fdc46e02',
 'LncCsr_00_Decide.bclan':'f4e9629915edb668c9e93d3e734ee5e2247c372d8a0dcdedb0abc72ca936f89d',
 'LncIconDist_01.bclyt':'125fd2772c35f967f596b0fbd8692a7d13d78a425eaccc72e85d46528507f76d'}

# The actual metadata bits, callback, widget, controller and host bodies run.
# Special-title classification and opening handoffs stay explicit endpoints.
for target in [0x1de7fc,0x1a3610]:SINKS.pop(target,None)
SINKS.update({0x1e0e28:'special-title-classification',
 0x1e0e00:'special-title-classification',0x1feb1c:'special-title-classification',
 0x1d3e80:'ordinary-open-handoff',0x200d60:'cartridge-state-query',0x1e0f44:'banner-request-resolution'})

def ctrl(u,a):
 return {'current':fl(u,a+12),'applied':fl(u,word(u,a+0x28)+0x10),
  'step':fl(u,a+0x10),'state':word(u,a+0x14),'mode':word(u,a+0x18)}

def init_controller(u,a,name,index):
 transform=WIDGET+0x1000+index*0x200;group=transform+0x80;raw=WIDGET+0x3000+index*0x1000
 data=animations[name]['pai'];assert len(data)<0x1000
 call(u,0x1a198c,[transform]);u.mem_write(raw,bytes(data));w(u,transform+0xc,raw);f(u,transform+0x10,-999)
 w(u,group+0x10,group+0x10);w(u,group+0x14,group+0x10)
 if a in [SELECT,DECIDE]:
  # Supply one parsed group member and storage, then execute native binding.
  node=group+0x30;w(u,node,group+0x10);w(u,node+4,group+0x10);w(u,node+8,POSE)
  w(u,group+0x10,node);w(u,group+0x14,node)
  w(u,transform+0x18,LINKS+index*0x10);h(u,transform+0x1c,1)
  call(u,0x1a11f4,[transform,POSE,0,1])
  assert word(u,LINKS+index*0x10+8)==transform and byte(u,LINKS+index*0x10+0xe)==1
 call(u,0x11eb44,[a,transform,group])

def attach(u,owner,controllers):
 nodes=[a+0x20 for a in controllers];sentinel=owner+0x18
 w(u,owner+0x14,len(nodes));w(u,sentinel,nodes[0]);w(u,sentinel+4,nodes[-1])
 for i,node in enumerate(nodes):
  w(u,node,nodes[i+1] if i+1<len(nodes) else sentinel)
  w(u,node+4,nodes[i-1] if i else sentinel)

def state(u):
 return {**primary(u),'widgetState':word(u,WIDGET+0x10),'capture':byte(u,WIDGET+0xc),
  'globalCapture':byte(u,G),'enabled':byte(u,WIDGET+0x14),'heldCount':word(u,WIDGET+0x74),
  'candidateFolder':struct.unpack('<b',u.mem_read(OBJ+0x117e,1))[0],
  'candidateSlot':half(u,OBJ+0x1180),'tileStatus':word(u,TILE+0x5c),
  'select':ctrl(u,SELECT),'decide':ctrl(u,DECIDE),'scale':ctrl(u,SCALE),
  'primarySelect':ctrl(u,PRIMARY_SELECT),'primaryDecide':ctrl(u,PRIMARY_DECIDE),
  'tilePoseY':fl(u,POSE+0x2c),'tileBindingDisabled':[byte(u,LINKS+0xe),byte(u,LINKS+0x1e)]}

def stylus_setup(folder=-1,selected=3,target=4,occupied=True,enabled=True,captured=False):
 u,tr,sk,pi,ev,pe=primary_setup(selected,folder,2,1,0,0)
 events=[];hit=[True];opening=[]
 def hook(u,a,size,_):
  if a==0x224814:
   name=bytes(u.mem_read(args(u)[1],32)).split(b'\0')[0].decode()
   events.append({'kind':'supplied-hit','name':name,'inside':hit[0],'pass':pi[0]});ret(u,int(hit[0]))
  elif a==0x1a3610:
   if args(u)[0]==TILE+0x28:
    events.append({'kind':'tile-apply','pass':pi[0],**state(u)})
    # Skip only profiler/platform wrapper; actual pane apply, AnimLinks,
    # transform application and original Hermite sampler execute.
    u.reg_write(UC_ARM_REG_R0,POSE);u.reg_write(UC_ARM_REG_PC,0x1a23b4)
   else:sk.append({'target':hex(a),'kind':'other-layout-apply','args':args(u)});ret(u)
  elif a in [0x224e10,0x1a137c]:
   events.append({'kind':'binding-enable' if a==0x224e10 else 'native-pose-apply',
    'pass':pi[0],'args':args(u),'select':ctrl(u,SELECT),'decide':ctrl(u,DECIDE)})
  elif a in [0x233a4c,0x2947f8,0x2a4994,0x1de858,0x1da050,0x1d3e80,0x1e8f38,0x2558ac,0x233a6c]:
   # Earlier frozen setup hooks may already have returned a fixed endpoint;
   # retain its entry arguments, before the supplied return modifies r0.
   entry_args=sk[-1]['args'] if a in SINKS and sk and sk[-1].get('target')==hex(a) else args(u)
   events.append({'kind':{0x233a4c:'widget-callback',0x2947f8:'HOME-callback',0x2a4994:'tile-dispatch',
    0x1de858:'departed-effect',0x1da050:'primary-scale-seek',0x1d3e80:'open-handoff',
    0x1e8f38:'mode-entry',0x2558ac:'widget-update',0x233a6c:'sound'}[a],
    'pc':hex(a),'args':entry_args,'pass':pi[0]})
   if a==0x1d3e80:
    opening.append({'kind':'ordinary','pass':pi[0],**state(u)})
    # End at the handoff; do not claim subsequent opening visibility/lifecycle.
    u.reg_write(UC_ARM_REG_PC,END)
  elif a==0x21ba1c:ret(u,0)
  elif a==0x208530:ret(u,INIT)
  elif a==0x1ffe1c:ret(u,DATA+0x83000)
  elif a==0x1067dc:events.append({'kind':'after-input','pass':pi[0],**state(u)})
  elif a==END+0x400:events.append({'kind':'other-widget-reset-endpoint','pass':pi[0]});ret(u)
 u.hook_add(UC_HOOK_CODE,hook)
 w(u,POSE,0x320238);empty(u,POSE+0x10);empty(u,POSE+0x1c);b(u,POSE+0xb7,1)
 u.mem_write(POSE+0xb8,b'P_IconBtnDmy_00\0')
 def pose_writes(u,access,address,size,value,_):
  if address==POSE+0x2c:
   events.append({'kind':'pose-write','pc':hex(u.reg_read(UC_ARM_REG_PC)),'pass':pi[0],
    'value':struct.unpack('<f',struct.pack('<I',value))[0]})
 u.hook_add(UC_HOOK_MEM_WRITE,pose_writes)
 for a,name,index in [(SELECT,'LncIconDist_01_Select',0),(DECIDE,'LncIconDist_01_Decide',1),(SCALE,'LncCsr_00_Scale',2),
  (PRIMARY_SELECT,'LncCsr_00_Select',3),(PRIMARY_DECIDE,'LncCsr_00_Decide',4)]:
  init_controller(u,a,name,index)
 call(u,0x1bbd7c,[SCALE,5]);call(u,0x2693fc,[SCALE]);s0(u,2);call(u,0x1bbd8c,[SCALE])
 w(u,CURSOR+0x84,PRIMARY_SELECT);w(u,CURSOR+0x88,PRIMARY_DECIDE)
 attach(u,CURSOR,[SCALE,PRIMARY_SELECT,PRIMARY_DECIDE,LOOP]);attach(u,TILE,[SELECT,DECIDE])
 w(u,TILE,0x321650);w(u,TILE+0x38,TILE+0x100);w(u,TILE+0x5c,1);b(u,TILE+0x60,1)
 call(u,0x11eae8,[TILE])
 call(u,0x22a60c,[CONFIG]);w(u,CONFIG,TILE);w(u,CONFIG+4,cword(0x32f1ac+8))
 w(u,CONFIG+8,SELECT);w(u,CONFIG+0x10,DECIDE);w(u,CONFIG+0x20,0x0100002b);w(u,CONFIG+0x2c,0x0100002c)
 w(u,CONFIG+0x34,1)
 # Native base construction registers the widget in the host's input list.
 b(u,0x32f118,1);call(u,0x2532c0,[WIDGET,CONFIG]);call(u,0x2501f8,[WIDGET,int(enabled)])
 assert word(u,0x344b98)==WIDGET+4
 assert word(u,WIDGET)==0x321440 and word(u,WIDGET+0x38)==SELECT and word(u,WIDGET+0x40)==DECIDE
 assert bytes(u.mem_read(WIDGET+0x1c,16)).split(b'\0')[0]==b'G_Scale_00'
 w(u,OBJ+0xf44,WIDGET);h(u,OBJ+0x14a0,target);w(u,OBJ+0x830,TILE)
 h(u,RECORDS+560*target+0x36,3 if occupied else 0)
 b(u,OBJ+0x117e,255);h(u,OBJ+0x1180,-1);h(u,OBJ+0xbd6,-1)
 # The cartridge reference maps away from the tested slots via its native helper.
 h(u,CART+0x3e,0);h(u,DB+0x4450e,-1)
 if captured:
  other=WIDGET+0x9000;w(u,other,0x321440);b(u,other+0xc,1);b(u,other+0x14,0)
  call(u,0x255a1c,[other])
 # Warm the real primary Scale transform before the recorded gesture.
 call(u,0x103df8,[0])
 events.clear();tr.clear();sk.clear();ev.clear();pe.clear()
 return u,tr,sk,pi,ev,pe,events,hit,opening

def step(data,current,previous,inside=True):
 u,tr,sk,pi,ev,pe,events,hit,opening=data
 hit[0]=inside;b(u,0x32e9e1,current);b(u,0x32e9e2,previous)
 hostpass(u,pi)
 return {'pass':pi[0]-1,'current':current,'previous':previous,'inside':inside,**state(u)}

def callbacks(events):return [e['args'][2] for e in events if e['kind']=='widget-callback']
def checked_case(data,before,rows,**labels):
 u,tr,sk,pi,ev,pe,events,hit,opening=data
 assert not any(e['kind']=='primary-scale-seek' for e in events)
 assert not any(e['kind']=='primary-write' and int(e['address'],16)==OBJ+0x3a88 for e in pe)
 phase=before['loopCurrent']
 for row in rows:
  assert row['mode']==0 and row['request']==0 and row['shown']==row['visible']==1
  assert row['scale']==before['scale']
  assert row['primarySelect']==before['primarySelect'] and row['primaryDecide']==before['primaryDecide']
  if opening and row['pass']==opening[0]['pass']:
   # Handoff ends before lower/footer/2D, so Loop has not advanced this pass.
   assert row['loopCurrent']==phase
  else:
   assert row['loopSubmitted']==phase
   phase=advance_loop(phase,1);assert row['loopCurrent']==phase
 return {**labels,'before':before,'rows':rows,'events':events,'primaryEvents':pe,
  'hostTrace':tr,'endpoints':sk,'opening':opening}

cases=[]
for folder in [-1,2]:
 for same in [False,True]:
  for occupied in [False,True]:
   data=stylus_setup(folder,3,3 if same else 4,occupied)
   u,tr,sk,pi,ev,pe,events,hit,opening=data
   before=state(u)
   rows=[step(data,1,0),step(data,1,1),step(data,0,1)]
   for _ in range(5):
    if opening:break
    rows.append(step(data,0,0))
   assert callbacks(events)==[0,1]
   assert [r['widgetState'] for r in rows[:6]]==[1,1,2,2,2,0]
   assert [r['decide']['state'] for r in rows[2:6]]==[1,2,0,0]
   assert [r['decide']['applied'] for r in rows[2:6]]==[0,1,1,1]
   assert rows[0]['select']['applied']==0 and rows[1]['select']['applied']==1
   assert [r['tilePoseY'] for r in rows[:6]]==[0,-2,-2,0,0,0]
   assert [r['tileBindingDisabled'] for r in rows[:6]]==[[0,1],[0,1],[1,0],[1,0],[1,1],[1,1]]
   assert all(r['selected']==3 and r['position']==before['position'] for r in rows[:5])
   assert rows[0]['candidateSlot']==((3 if same else 4) if occupied else -1)
   assert rows[5]['candidateSlot']==-1
   assert rows[5]['selected']==(3 if same else 4)
   assert bool(opening)==(same and occupied)
   effects=[e for e in events if e['kind']=='departed-effect']
   assert len(effects)==1 and effects[0]['pass']==5 and effects[0]['args'][1]==3
   accepted=opening[0] if opening else next(e for e in events if e['kind']=='after-input' and e['pass']==5)
   assert accepted['position']==before['position']
   if not opening:
    assert rows[5]['position']==[rows[5]['selectedGrid'][0],rows[5]['selectedGrid'][1],0]
    assert rows[6]['capture']==0 and rows[6]['globalCapture']==1 and rows[7]['globalCapture']==0
    phases=[e['phase'] for e in tr if e['pass']==5]
    order=['input-callback','tasks','upper-task','banner-manager','lower-task','2d-pass']
    assert [phases.index(p) for p in order]==sorted(phases.index(p) for p in order)
   cases.append(checked_case(data,before,rows,kind='accepted',folder=folder,sameSlot=same,occupied=occupied))

for folder in [-1,2]:
 for occupied in [False,True]:
  for route in ['release-outside','leave-then-release','leave-reenter-release','quick-release']:
   data=stylus_setup(folder,3,4,occupied);u,tr,sk,pi,ev,pe,events,hit,opening=data
   before=state(u);rows=[step(data,1,0)]
   if route=='release-outside':rows.append(step(data,0,1,False))
   elif route=='leave-then-release':rows += [step(data,1,1,False),step(data,0,1,False)]
   elif route=='leave-reenter-release':rows += [step(data,1,1,False),step(data,1,1,True),step(data,0,1,True)]
   else:rows.append(step(data,0,1))
   rows += [step(data,0,0) for _ in range(5)]
   cancels=route in ['release-outside','leave-then-release']
   assert callbacks(events)==([0,2] if cancels else [0,2,1] if route=='leave-reenter-release' else [0,1])
   assert rows[-1]['selected']==(3 if cancels else 4) and not opening
   if route!='quick-release':assert all(r['candidateSlot']==-1 for r in rows[1:])
   if route!='quick-release':
    assert rows[1]['widgetState']==3 and rows[1]['select']['mode']==1
    assert rows[1]['select']['applied']==1 and rows[1]['tilePoseY']==-2
    assert rows[2]['tilePoseY']==0
   if route in ['quick-release','leave-reenter-release']:
    release=1 if route=='quick-release' else 3
    applied=[e['args'][0] for e in events if e['kind']=='native-pose-apply' and e['pass']==release]
    assert applied==[WIDGET+0x1000,WIDGET+0x1200]
    assert rows[release]['tileBindingDisabled']==[0,0] and rows[release]['tilePoseY']==-2
   if cancels:
    assert all(r['position']==before['position'] for r in rows)
    assert not any(e['kind']=='departed-effect' for e in events)
   cases.append(checked_case(data,before,rows,kind=route,folder=folder,occupied=occupied))

gates=[]
for gate in ['disabled','another-capture','hit-miss','no-new-press','producer-paused']:
 data=stylus_setup(enabled=gate!='disabled',captured=gate=='another-capture')
 u,tr,sk,pi,ev,pe,events,hit,opening=data;before=state(u)
 if gate=='producer-paused':w(u,G+0x14,1)
 rows=[step(data,1,1 if gate=='no-new-press' else 0,gate!='hit-miss')]
 assert callbacks(events)==[] and rows[0]['selected']==3 and rows[0]['widgetState']==0
 assert rows[0]['position']==before['position']
 assert any(e['kind']=='supplied-hit' for e in events)==(gate=='hit-miss')
 gates.append(checked_case(data,before,rows,kind=gate))

# A completed first tap followed by a second tap tests equality to current
# selection; no supplied timing-window/double-click classifier is involved.
secondTaps=[]
for folder in [-1,2]:
 for occupied in [False,True]:
  data=stylus_setup(folder,3,4,occupied);u,tr,sk,pi,ev,pe,events,hit,opening=data
  before=state(u);rows=[]
  for tap in range(2):
   rows += [step(data,1,0),step(data,0,1)]
   for _ in range(6):
    if opening:break
    rows.append(step(data,0,0))
   assert half(u,OBJ+0x1178)==4
   if tap==0:assert not opening
  assert callbacks(events)==[0,1,0,1] and bool(opening)==occupied
  assert rows[8]['tileBindingDisabled']==[0,1] and rows[8]['tilePoseY']==0
  assert [e['args'][0] for e in events if e['kind']=='native-pose-apply' and e['pass']==8]==[WIDGET+0x1000]
  secondTaps.append(checked_case(data,before,rows,kind='second-tap',folder=folder,occupied=occupied))

waiting=[]
for probe in ['new-stroke','direction-edge','selection-now-target','selection-now-other',
 'mapping-now-other','record-now-vacant','disable-reenable','reset-leaf','grid-reset-helper','synthetic-context-change']:
 selected=4 if probe=='record-now-vacant' else 3
 data=stylus_setup(-1,selected,4,True);u,tr,sk,pi,ev,pe,events,hit,opening=data
 before=state(u);rows=[step(data,1,0),step(data,0,1)];mutation={'afterPass':1}
 if probe=='selection-now-target':h(u,OBJ+0x1178,4);h(u,OBJ+0x117c,4)
 elif probe=='selection-now-other':h(u,OBJ+0x1178,5);h(u,OBJ+0x117c,5)
 elif probe=='mapping-now-other':h(u,OBJ+0x14a0,5)
 elif probe=='record-now-vacant':h(u,RECORDS+560*4+0x36,0)
 elif probe=='disable-reenable':call(u,0x2501f8,[WIDGET,0])
 elif probe=='reset-leaf':call(u,0x250194,[WIDGET,0])
 elif probe=='grid-reset-helper':
  dummy=WIDGET+0xb000;vt=dummy+0x100;w(u,dummy,vt);w(u,vt+0x20,END+0x400)
  for i in range(1,80):w(u,OBJ+0xf44+i*4,dummy)
  for off in range(0xf18,0xf3c,4):w(u,OBJ+off,dummy)
  call(u,0x1eb2b4,[OBJ])
 elif probe=='synthetic-context-change':
  # Deliberate field-only mutation: this does NOT model native context entry.
  slotmap=DB+0x39bd0+2*0x2d2
  for i in range(60):h(u,slotmap+2*i,i)
  w(u,DB+0x44508,slotmap);b(u,OBJ+0x1170,2);w(u,OBJ+0x1810,60)
 mutation['state']=state(u)
 if probe=='new-stroke':
  rows += [step(data,1,0,False),step(data,0,1,False),step(data,0,0,False)]
 elif probe=='direction-edge':
  rows += [step(data,0,0),step(data,0,0)]
  w(u,SAMPLE+8,0x10);w(u,SAMPLE+0xc,0x10)
  rows.append(step(data,0,0))
 else:
  for _ in range(4):
   if opening:break
   rows.append(step(data,0,0))
 if probe=='disable-reenable':
  assert callbacks(events)==[0] and rows[-1]['widgetState']==2 and rows[-1]['decide']['state']==0
  call(u,0x2501f8,[WIDGET,1]);rows.append(step(data,0,0))
 if probe in ['reset-leaf','grid-reset-helper']:
  assert callbacks(events)==[0] and rows[-1]['widgetState']==0 and rows[-1]['selected']==3
  assert mutation['state']['tilePoseY']==0 and mutation['state']['tileBindingDisabled']==[1,1]
 else:assert callbacks(events)==[0,1]
 if probe=='new-stroke':
  assert len([e for e in events if e['kind']=='supplied-hit'])==2
 if probe=='direction-edge':
  assert not any(e['kind']=='HOME-callback' and e['args'][1] in [4,5,6] for e in events)
 assert bool(opening)==(probe=='selection-now-target')
 if probe=='mapping-now-other':assert rows[-1]['selected']==5
 elif probe not in ['reset-leaf','grid-reset-helper']:assert rows[-1]['selected']==4
 if probe=='selection-now-other':
  assert next(e for e in events if e['kind']=='departed-effect')['args'][1]==5
 waiting.append(checked_case(data,before,rows,kind=probe,mutation=mutation))

cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True;excerpts=[]
for start,end in [(0x2b46d0,0x2b4770),(0x22a60c,0x22a658),(0x22a658,0x22a72c),
 (0x1f6854,0x1f6948),(0x1f6f58,0x1f6f90),(0x1f7048,0x1f7098),(0x1f7160,0x1f7394),
 (0x253054,0x2532e8),(0x255824,0x255984),(0x255a1c,0x255a34),(0x1039d0,0x103c94),
 (0x2947f8,0x2951e0),(0x2a3db8,0x2a3e04),(0x2a4954,0x2a4ef8),(0x2a4f20,0x2a51fc),
 (0x2a5290,0x2a52a4),(0x2eb710,0x2eb78c),(0x1e89f8,0x1e8a34),(0x1e6b44,0x1e6b88),
 (0x1de7fc,0x1de810),(0x1d914c,0x1d928c),(0x2b8490,0x2b856c),
 (0x2693e0,0x2694a8),(0x1bbd7c,0x1bbf84),(0x1f58e4,0x1f59a8),
 (0x1a11f4,0x1a15fc),(0x1a1b24,0x1a1bdc),(0x1a2090,0x1a20a0),
 (0x1a2164,0x1a222c),(0x1a23b4,0x1a2420),(0x1a4d28,0x1a4d68),
 (0x224e10,0x224e88),(0x209cd0,0x209f00),(0x250194,0x250208),(0x2292f8,0x2293cc),
 (0x1eb2b4,0x1eb39c),(0x1de8ec,0x1decc0),(0x1ded90,0x1dedd0),(0x1df440,0x1df480),
 (0x1df708,0x1df7c0)]:
 raw=CODE[start-0x100000:end-0x100000]
 rendered='\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n'
 path=OUT/f'proof-{start:x}-{end:x}.asm';path.write_text(rendered)
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),
  'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})

# Keep source resources private; JSON records hashes, structural facts and numeric traces only.
for value in resources.values():
 if 'decoded' in value:value['decoded']={k:v for k,v in value['decoded'].items() if k!='pai'}
report={'sourceSHA256':SHA,'fixtureSHA256':hashlib.sha256(SELF.read_bytes()).hexdigest(),
 'baseFixtureSHA256':hashlib.sha256(source.encode()).hexdigest(),'registration':registrationResult,
 'resources':resources,'cases':cases,'gates':gates,'secondTaps':secondTaps,
 'waiting':waiting,'excerpts':excerpts,'fixedEndpoints':{hex(k):v for k,v in sorted(SINKS.items())},
 'addedSuppliedServices':{'0x224814':'group hit boolean; no hit geometry/raster',
  '0x208530':'inert manager object INIT','0x1ffe1c':'inert auxiliary manager',
  '0x21ba1c':'special-title context placeholder; classification leaves return0',
  '0x1a3610':'tile profiler wrapper replaced with native pane application; other layout applications remain endpoints'},
 'scope':'43 bounded cases: 24 root/child settled gesture sequences, 5 raw gates, 4 first/second taps, 10 waiting-state probes. Real registered tile widget, host producer/callback, lower/footer/global2D, raw Select/Decide controllers, group binding enable and pane/Hermite writes execute. Hit geometry, device sampling, task/service readiness and supplied mature metadata are explicit. The single tile pane, its parsed group and AnimLink storage are supplied; native binding and ordered traversal run. Matrices, GPU raster, icon child propagation and unrelated visuals are not executed. Primary Scale/Select/Decide controllers are real but their binding groups are inert; no starts/seeks occur during ordinary gestures. Open1d3e80 stops execution before lower/footer/2D on that acceptance pass. Waiting selection/mapping/record/context mutations are artificial field-only probes, not complete native UI transition lifecycles. Native reset leaf and grid reset helper execute; no general context guard or browser pointercancel equivalence is inferred. No drag/longpress/toolbar gestures/viewport correction/special title execution is tested.'}
(OUT/'checked.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'cases':len(cases)+len(gates)+len(secondTaps)+len(waiting),'excerpts':len(excerpts),'fixtureSHA256':report['fixtureSHA256'],
 'resultSHA256':hashlib.sha256((OUT/'checked.json').read_bytes()).hexdigest()}))
