"""Bounded original-ARM stationary pickup entry; all firmware/output private."""
from pathlib import Path
import hashlib,json,struct

PICKUP_SELF=Path(__file__)
ENTRY_FIXTURE=PICKUP_SELF.with_name('home_grid_long_press.py')
entry_source=ENTRY_FIXTURE.read_text()
ENTRY_SHA=hashlib.sha256(entry_source.encode()).hexdigest()
assert ENTRY_SHA=='47c32cb2d07a1bd368a7f1d16565707838d389dad390a27b842359ca089d4be4'
entry_prefix=entry_source.split('\nholds=[]\n',1)[0]
assert entry_prefix.count('if a in [0x1e801c,0x1d4cc4]:')==1
assert entry_prefix.count('args(u)[0] not in [CURSOR,DATA+0xc0000]:')==1
entry_prefix=entry_prefix.replace('if a in [0x1e801c,0x1d4cc4]:','if a==0x1d4cc4:')
entry_prefix=entry_prefix.replace('args(u)[0] not in [CURSOR,DATA+0xc0000]:','False:')
exec(compile(entry_prefix,str(ENTRY_FIXTURE),'exec'),globals())
SELF=PICKUP_SELF
BLANK=PICKUP+0x1000;BLANK_SCALE=BLANK+0x200;PICKUP_ROOT=PICKUP+0x800;BLANK_ROOT=BLANK+0x800
FOOTER=PICKUP+0x2000;GESTURE=FOOTER+0x100;OTHER_CONTROL=FOOTER+0x200
TOUCH=FOOTER+0x300;UPPER_CTRL=FOOTER+0x400
GRID=DATA+0xd0000

name='LncIconPickUpBlank_00_Scale'
raw=(opt.resources/'anim'/f'{name}.bclan').read_bytes()
animations[name]=decode_animation(raw)
resources[name+'.bclan']={'sha256':hashlib.sha256(raw).hexdigest(),'decoded':animations[name]}
animations[name]['pai']=next(r.data for tag,r in sections(raw,b'CLAN')[1] if tag=='pai1')
raw=(opt.resources/'blyt/LncIconPickUpBlank_00.bclyt').read_bytes()
resources['LncIconPickUpBlank_00.bclyt']={'sha256':hashlib.sha256(raw).hexdigest(),'groups':decode_layout(raw)['groups']}
assert resources['LncIconPickUpBlank_00_Scale.bclan']['sha256']=='d4f4523ac19b8c780b899ff4eafc248ea23ca87940d7ec2221643a10acd57cc0'
assert resources['LncIconPickUpBlank_00.bclyt']['sha256']=='87ed044fca821a0f9adc98e9ab7c4367ccea1ac02d22d04b2ee4c89fee2de1ca'
assert cword(0x1e3ac8)==0x1e40e8 and cword(0x1de940)==0x1df684 and cword(0x2b6ea0)==0x2b716c

for a in [0x1de8ec,0x1e0cb4]:SINKS.pop(a,None)
HOME_KEEP.update([0x1e2180,0x29f6f0,0x224814])
# Explicit unrelated theme/title rendering boundaries. Native field/control,
# mapping, blank placement and pickup position code around them still runs.
SINKS.update({0x217d20:'grid-capacity-supplied',0x2a63a8:'pickup-blank-theme',0x1f5cf4:'tile-material-state',
 0x1e8c20:'tile-material-mode',0x2576f4:'tile-content-binding',0x257508:'tile-content-binding',
 0x1d9c68:'tile-material-copy',0x1f5f38:'tile-alpha-propagation',
 0x2a73c0:'grid-overlay-refresh',0x2a74dc:'grid-icon-animation',
 0x2aa22c:'grid-service-refresh',0x2a1c70:'grid-service-refresh',0x2453b8:'icon-container-finalize'})

hold_state=state
def position(u,p):return list(struct.unpack('<3f',u.mem_read(p+0x28,12)))
def state(u):
 return {**hold_state(u),'oldMode':byte(u,OBJ+0x3a81),
  'blankVisible':byte(u,BLANK+0x60),'blankPriority':word(u,BLANK+0x58),
  'blankScale':ctrl(u,BLANK_SCALE) if word(u,BLANK_SCALE+0x28) else None,
  'pickupPosition':position(u,PICKUP_ROOT),'blankPosition':position(u,BLANK_ROOT),
  'pickupRootScale':[fl(u,PICKUP_ROOT+0x40),fl(u,PICKUP_ROOT+0x44)],
  'pickupSizeFactor':fl(u,OBJ+0x3ad8),'touch':[fl(u,TOUCH+0x10),fl(u,TOUCH+0x14)],
  'anchor':[fl(u,OBJ+0x1848),fl(u,OBJ+0x184c)],
  'hoverSlot':half(u,OBJ+0x3acc),'footerFlags':list(u.mem_read(FOOTER+0x46,3)),
  'footerShown':byte(u,OBJ+0x3a4c),'footerFocus':half(u,OBJ+0x3c8e),
  'gestureState':byte(u,GESTURE+0xd),'gestureCapture':byte(u,GESTURE+0xc),
  'otherEnabled':byte(u,OTHER_CONTROL+0x14),'otherCapture':byte(u,OTHER_CONTROL+0xc),
  'densityGestures':[byte(u,word(u,OBJ+off)+0x86) if word(u,OBJ+off) else None for off in [0xf3c,0xf40]],
  'tileVisible':byte(u,TILE+0x60),'tileContentShown':byte(u,TILE+0xde),
  'mappedSlot':half(u,OBJ+0x14a0+2*(3 if half(u,OBJ+0x1180)==3 else 4)),
  'hoverGate':byte(u,OBJ+0x3ad6),
  'upperControlFlags':list(u.mem_read(UPPER+0x464,10))}

def pickup_setup(folder,same):
 data,entry,handoff=hold_setup(folder,same,True)
 u,tr,sk,pi,ev,pe,events,hit,opening=data
 transform=BLANK+0x400;group=transform+0x80;raw=BLANK+0x3000
 call(u,0x1a198c,[transform]);u.mem_write(raw,bytes(animations['LncIconPickUpBlank_00_Scale']['pai']))
 w(u,transform+0xc,raw);f(u,transform+0x10,-999)
 w(u,group+0x10,group+0x10);w(u,group+0x14,group+0x10)
 call(u,0x11eb44,[BLANK_SCALE,transform,group])
 call(u,0x1bbd7c,[BLANK_SCALE,5])
 # Supplied resource roots and native registered blank Scale layout.
 w(u,PICKUP+0x38,PICKUP_ROOT);b(u,PICKUP_ROOT+0xb7,255)
 w(u,BLANK,0x321650);w(u,BLANK+0x38,BLANK_ROOT);b(u,BLANK_ROOT+0xb7,255)
 w(u,BLANK+0x58,0x19b) # Source constructor priority at 2b35f4.
 attach(u,BLANK,[BLANK_SCALE]);call(u,0x11eae8,[BLANK])
 w(u,OBJ+0xb18,BLANK);w(u,OBJ+0xe84,BLANK_SCALE)
 # Mature controls use their source constructor vtables; leaf setters execute.
 w(u,OBJ+0x1084,FOOTER);u.mem_write(FOOTER+0x46,bytes([0,1,1]))
 w(u,OBJ+0x1088,GESTURE);w(u,GESTURE,0x3212a8);b(u,GESTURE+0x10,1)
 w(u,OBJ+0xf30,OTHER_CONTROL);w(u,OTHER_CONTROL,0x3214b0)
 b(u,OTHER_CONTROL+0x14,1);b(u,OTHER_CONTROL+0xc,1)
 for off in [0xf3c,0xf40]:
  a=FOOTER+0x500+(off-0xf3c)*0x40;w(u,OBJ+off,a);b(u,a+0x86,1)
 w(u,OBJ+0x1094,TOUCH)
 w(u,UPPER_CTRL,0x321828);w(u,UPPER+0x2bc,UPPER_CTRL)
 for off in range(0x464,0x46e):b(u,UPPER+off,1)
 target=3 if same else 4
 # Populate stable viewport widget/layout slots. Only the held widget is
 # registered for producer updates; other mature objects supply idle identity.
 for i in range(80):
  layout=GRID+i*0x500;widget=layout+0x200;pane=layout+0x300
  if i==target:layout=TILE;widget=WIDGET;pane=TILE+0x100
  w(u,OBJ+0x830+4*i,layout);w(u,OBJ+0xf44+4*i,widget);h(u,OBJ+0x14a0+2*i,i)
  for off in [0x38,0x80,0x84,0x88]:w(u,layout+off,pane)
  b(u,pane+0xb4,255)
  b(u,layout+0xde,1);b(u,layout+0x8c,5);w(u,widget,0x321440)
  w(u,OBJ+0x970+4*i,GRID+0x1a000+i*0x80)
 # Selected held tile is an ordinary occupied tile, not a missing-icon state.
 b(u,TILE+0x8c,0);b(u,OBJ+0x1814,1)
 h(u,OBJ+0x1184,-1);b(u,OBJ+0x1182,255)
 w(u,OBJ+0xb1c,GRID+0x1d000);w(u,OBJ+0xb50,GRID+0x1d100);w(u,OBJ+0xb54,GRID+0x1d200)
 for a in [GRID+0x1d100,GRID+0x1d200]:w(u,a+0x80,a+0x800)
 # Stationary supplied touch in HOME coordinates, with a small nonzero anchor
 # to distinguish both summands. No coordinate-event derivation is claimed.
 f(u,TOUCH+0x10,fl(u,OBJ+0x1868+target*4)+3)
 f(u,TOUCH+0x14,fl(u,OBJ+0x1e08+target*4)-4)
 f(u,OBJ+0x1848,-3);f(u,OBJ+0x184c,4)
 extended=[];writes=[]
 markers={0x1e801c:'content-installation-endpoint',0x1e8f38:'mode-setter',0x29fa6c:'mode14-entry',
  0x1de8ec:'control-setup',0x1df684:'mode14-controls',0x1e0cb4:'footer-reset',
  0x1df8d4:'footer-reset-leaf',0x1e0cec:'upper-disable',0x251f24:'gesture-enable',
  0x2501f8:'widget-enable',0x2b716c:'mode14-lower-body',0x1e2180:'grid-and-pickup-update',
  0x1e2538:'candidate-blank-branch',0x1e35c0:'pickup-position-section',
  0x1d9640:'pickup-scale-follow',0x1d9f38:'pane-position',0x1d9cdc:'candidate-comparison',
  0x232234:'layout-visibility',0x1e8c50:'tile-content-visibility',
  0x2693fc:'controller-start',0x1bbd8c:'controller-seek',
  0x232214:'compound-layout-visibility',0x103df8:'2d-pass',0x269430:'controller-update',
  0x1a3610:'layout-apply',0x233a6c:'sound',0x1067dc:'after-input',0x2b8448:'lower-footer'}
 def hook(u,a,size,_):
  if a in markers:
   entry_args=sk[-1]['args'] if a in SINKS and sk and sk[-1].get('target')==hex(a) else args(u)
   row={'kind':markers[a],'pc':hex(a),'caller':hex(u.reg_read(UC_ARM_REG_LR)-4),
    'args':entry_args,'pass':pi[0],**state(u)}
   if a==0x1bbd8c:row['s0']=struct.unpack('<f',struct.pack('<I',u.reg_read(UC_ARM_REG_S0)))[0]
   extended.append(row)
  if a==0x1e801c:ret(u,0)
  elif a==0x1e2180 and byte(u,OBJ+0x3a80)!=14:ret(u,0)
  elif a==0x1bbd8c and args(u)[0]==UPPER_CTRL:ret(u)
  elif a==0x224814 and bytes(u.mem_read(args(u)[1],16)).split(b'\0')[0]==b'G_Out_00':
   # Frozen hook already supplies true; the stationary child hold is not over
   # the separate G_Out_00 region. Restore its supplied miss explicitly.
   events[-1]['inside']=False;ret(u,0)
 tracked={OBJ+off for off in [0x1178,0x117c,0x117e,0x1180,0x1848,0x184c,0x3a80,0x3a81,0x3a88,0x3a4e,0x3acc,0x3ad0,0x3ad4,0x3ad6,0x3ad8,0x3adc]}
 tracked.update({PICKUP_ROOT+off for off in [0x28,0x2c,0x30,0x40,0x44,0xb7]})
 tracked.update({BLANK_ROOT+off for off in [0x28,0x2c,0x30,0xb7]})
 tracked.update([CURSOR+0x60,TILE+0x60,TILE+0xde,PICKUP+0x60,BLANK+0x60,
  WIDGET+0xc,WIDGET+0x10,WIDGET+0x14,WIDGET+0x74,WIDGET+0x7d])
 def written(u,access,address,size,value,_):
  if address in tracked:writes.append({'pc':hex(u.reg_read(UC_ARM_REG_PC)),
   'address':hex(address),'size':size,'value':value,'pass':pi[0]})
 u.hook_add(UC_HOOK_CODE,hook)
 u.hook_add(UC_HOOK_MEM_WRITE,written)
 events.clear();tr.clear();sk.clear();ev.clear();pe.clear();entry.clear()
 return data,entry,handoff,extended,writes

cases=[]
for folder in [-1,2]:
 for same in [False,True]:
  data,entry,handoff,extended,writes=pickup_setup(folder,same)
  u,tr,sk,pi,ev,pe,events,hit,opening=data
  before=state(u);rows=[step(data,1,0)]
  rows += [step(data,1,1) for _ in range(22)]
  target=3 if same else 4
  assert callbacks(events)==[0,3] and not handoff and not opening
  assert all(r['mode']==0 and r['request']==0 and r['shown']==r['visible']==1 for r in rows[:21])
  assert [r['heldCount'] for r in rows]==list(range(21))+[0,0]
  assert all(r['capture']==r['enabled']==1 and r['widgetState']==1 for r in rows)
  assert rows[20]['loopCurrent']==39.25 and rows[20]['tilePoseY']==-2
  assert all(r['candidateFolder']==folder and r['candidateSlot']==target for r in rows)
  assert [r['selected'] for r in rows]==[3]*21+[target,target]
  assert all(r['position']==before['position'] for r in rows)
  for r in rows[21:]:
   assert r['mode']==14 and r['oldMode']==0 and r['request']==2 and r['shown']==r['visible']==0
   assert r['loopCurrent']==rows[20]['loopCurrent'] and r['loopSubmitted']==rows[20]['loopSubmitted']
   assert r['longPressFlag']==1 and r['globalCapture']==1
   assert r['tileVisible']==r['tileContentShown']==0 and r['tilePoseY']==-2
   assert r['tileBindingDisabled']==[0,1] and r['mappedSlot']==target
   assert r['select']==rows[20]['select'] and r['decide']==before['decide']
   assert r['scale']==before['scale'] and r['primarySelect']==before['primarySelect'] and r['primaryDecide']==before['primaryDecide']
   assert r['pickupVisible']==r['blankVisible']==1 and r['pickupPriority']==0x177 and r['blankPriority']==0x19b
   for key in ['pickupScale','blankScale']:
    assert r[key]=={'current':2.0,'applied':2.0,'step':1.0,'state':1,'mode':5}
   assert r['pickupPosition']==[r['touch'][0]+r['anchor'][0],r['touch'][1]+r['anchor'][1],0]
   assert r['blankPosition']==[r['selectedGrid'][0]-r['scroll'],r['selectedGrid'][1],0]
   assert r['pickupRootScale']==[1,1] and r['pickupSizeFactor']==1 and r['hoverSlot']==-1
   assert r['footerFlags']==[1,0,0] and r['gestureState']==5 and r['gestureCapture']==0
   assert r['footerShown']==0 and r['footerFocus']==-1
   assert r['otherEnabled']==r['otherCapture']==0 and r['densityGestures']==[0,0]
   assert r['upperControlFlags']==[0,0,0,0,0,0,1,1,1,0]
  assert [(e['pass'],e['args'][1],e['caller']) for e in extended if e['kind']=='sound']==[
   (0,0x0100002b,'0x1f71b4'),(21,0x0100002f,'0x29fbc8')]
  installs=[e for e in extended if e['kind']=='content-installation-endpoint']
  assert [(e['pass'],e['caller']) for e in installs]==[(21,'0x2a55b0'),(21,'0x1e3638'),(22,'0x1e3638')]
  assert all(e['args'][:3]==[OBJ,PICKUP,(target<<16)|(folder&255)] for e in installs)
  after_input=next(e for e in extended if e['kind']=='after-input' and e['pass']==21)
  assert after_input['mode']==14 and after_input['request']==2 and after_input['visible']==1
  assert after_input['pickupScale']['applied']==after_input['blankScale']['applied']==-999
  assert after_input['tileVisible']==1 and after_input['blankVisible']==0
  key_order=[('content-installation-endpoint',0x1e801c),('gesture-enable',0x251f24),
   ('mode-setter',0x1e8f38),('mode14-entry',0x29fa6c),('control-setup',0x1de8ec),
   ('sound',0x233a6c),('after-input',0x1067dc),('mode14-lower-body',0x2b716c),
   ('grid-and-pickup-update',0x1e2180),('candidate-blank-branch',0x1e2538),
   ('pickup-position-section',0x1e35c0),('2d-pass',0x103df8)]
  indices=[next(i for i,e in enumerate(extended) if e['pass']==21 and e['kind']==kind and e['pc']==hex(pc)) for kind,pc in key_order]
  assert indices==sorted(indices)
  assert not any(w['address'] in [hex(OBJ+0x1848),hex(OBJ+0x184c)] for w in writes)
  for p in [21,22]:
   order=['input-callback','tasks','upper-task','banner-manager','lower-task','2d-pass']
   if p==22:order=order[1:]
   phases=[e['phase'] for e in tr if e['pass']==p]
   assert [phases.index(n) for n in order]==sorted(phases.index(n) for n in order)
   controllers=[e['args'][0] for e in extended if e['kind']=='controller-update' and e['pass']==p]
   assert controllers==[BLANK_SCALE,PICKUP_SCALE],controllers
   assert not any(e['kind']=='pose-write' and e['pass']==p for e in events)
  assert not any(e['kind']=='supplied-hit' and e['name']=='G_Scale_00' and e['pass']==22 for e in events)
  cases.append({'folder':folder,'sameSlot':same,'before':before,'rows':rows,
   'entryEvents':entry,'extendedEvents':extended,'events':events,'primaryEvents':pe,
   'hostTrace':tr,'endpoints':sk,'handoff':handoff,'opening':opening,'writes':writes})

cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True;excerpts=[]
for start,end in [(0x2a5534,0x2a56a0),(0x1e8f38,0x1e8f70),(0x1e40e8,0x1e40f8),
 (0x29fa6c,0x29fbe4),(0x1df684,0x1df6f0),(0x1df7b8,0x1df7c0),
 (0x1e0cb4,0x1e0d28),(0x1df8d4,0x1df8ec),(0x251ef4,0x251f40),(0x2501f8,0x250208),
 (0x2b716c,0x2b721c),(0x2b8448,0x2b858c),(0x1e2180,0x1e225c),
 (0x1e2370,0x1e2468),(0x1e2538,0x1e25fc),(0x1e34fc,0x1e363c),
 (0x1e363c,0x1e37a8),(0x1e38fc,0x1e3a38),(0x1e8c50,0x1e8c84),
 (0x1d9640,0x1d9738),(0x1d9cdc,0x1d9e24),(0x1d9f38,0x1d9f58),
 (0x232214,0x232250),(0x1f58e4,0x1f59a8),(0x2693fc,0x2694a8),(0x1bbd7c,0x1bbf84),
 (0x2b35cc,0x2b364c),(0x2b39bc,0x2b39fc),(0x2b4204,0x2b422c),(0x2b4694,0x2b46c8),
 (0x1e801c,0x1e842c),(0x1e84f8,0x1e8904),(0x2a73c0,0x2a74dc)]:
 raw=CODE[start-0x100000:end-0x100000]
 rendered='\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n'
 path=OUT/f'proof-{start:x}-{end:x}.asm';path.write_text(rendered)
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),
  'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
for value in resources.values():
 if 'decoded' in value:value['decoded']={k:v for k,v in value['decoded'].items() if k!='pai'}
report={'sourceSHA256':SHA,'fixtureSHA256':hashlib.sha256(SELF.read_bytes()).hexdigest(),
 'entryFixtureSHA256':ENTRY_SHA,'resources':resources,'cases':cases,'excerpts':excerpts,
 'fixedEndpoints':{hex(k):v for k,v in sorted(SINKS.items())},
 'additionalBoundaries':{'0x1e801c':'supplied completion; content textures/UV/materials not installed; r0 return is not used by continuation',
  '0x1e2180':'mode0 remains frozen endpoint; mode14 full outer grid/pickup function executes with listed rendering/service endpoints',
  'upper-controller-seek':'native upper flag clear runs; its controller seek0 is recorded then returned without an upper animation resource',
  '0x224814':'G_Scale_00 hit true; child G_Out_00 miss false; coordinate testing not executed',
  'mature-objects':'preloaded layout/pane/widget identities; inert pickup/blank groups; one aliased inert pane for each noncandidate tile; actual native original-tile pose links retained',
  'coordinates':'stationary touch XY and nonzero anchor supplied; source root-position addition executes; no claim about anchor acquisition'},
 'scope':'Four eligible ordinary root/child same/different holds from P to completed H21 and one unchanged H22. Actual callback3 continuation, mode14 setter/entry/control leaves/lower branch, grid and pickup mapping/placement/visibility code and later primary visibility footer execute. Original-tile native pose binding persists but its hidden layout stops updates; original Select frame0 is not submitted. Pickup and blank raw Scale controllers submit density frame2 with inert groups, not rendered resource pixels. No movement, release/drop, folder-icon/hover, scroll, platform services or broad lifecycle. Default sound table remains uninitialized; sound calls are endpoints.'}
(OUT/'checked.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'cases':len(cases),'excerpts':len(excerpts),'fixtureSHA256':report['fixtureSHA256'],
 'resultSHA256':hashlib.sha256((OUT/'checked.json').read_bytes()).hexdigest()}))
