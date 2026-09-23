"""Bounded original-ARM stationary hold entry. Firmware/output stay private."""
from pathlib import Path
import hashlib,json,struct

AUDIT_SELF=Path(__file__)
STYLUS_FIXTURE=AUDIT_SELF.with_name('home_grid_stylus.py')
stylus_source=STYLUS_FIXTURE.read_text()
STYLUS_SHA=hashlib.sha256(stylus_source.encode()).hexdigest()
assert STYLUS_SHA=='12ba8151881fdff12f0edf8bc14bfe14dd031bb4cc7642ee3bad6e9cc6b76c78'
stylus_prefix=stylus_source.split('\ncases=[]\n',1)[0]
# The frozen base normally treats secondary visibility as an endpoint. Permit
# the supplied pickup layout's actual visibility setter in this NEW fixture.
needle="exec(compile(prefix,str(BASE_FIXTURE),'exec'),globals())"
assert stylus_prefix.count(needle)==1
stylus_prefix=stylus_prefix.replace(needle,
 "prefix=prefix.replace('args(u)[0]!=CURSOR:', 'args(u)[0] not in [CURSOR,DATA+0xc0000]:')\n"+needle)
exec(compile(stylus_prefix,str(STYLUS_FIXTURE),'exec'),globals())
SELF=AUDIT_SELF
PICKUP=DATA+0xc0000;PICKUP_SCALE=PICKUP+0x200
assert cword(0x33c634)==20

name='LncIconPickUp_00_Scale'
raw=(opt.resources/'anim'/f'{name}.bclan').read_bytes()
animations[name]=decode_animation(raw)
resources[name+'.bclan']={'sha256':hashlib.sha256(raw).hexdigest(),'decoded':animations[name]}
animations[name]['pai']=next(r.data for tag,r in sections(raw,b'CLAN')[1] if tag=='pai1')
raw=(opt.resources/'blyt/LncIconPickUp_00.bclyt').read_bytes()
pickup_layout=decode_layout(raw)
resources['LncIconPickUp_00.bclyt']={'sha256':hashlib.sha256(raw).hexdigest(),'groups':pickup_layout['groups']}
assert resources['LncIconPickUp_00_Scale.bclan']['sha256']=='c4138973ce034f02f6e5049f945f3a69446f40a9b95d60ef3d0c4481d0343cce'
assert resources['LncIconPickUp_00.bclyt']['sha256']=='6ec30917cd9ed047ce5e9937a4e776456696a265490fc5267cda5960f6341ca2'
assert CODE[0x2b33e4-0x100000:].split(b'\0',1)[0]==b'LncIconPickUp_00.bclyt'
assert CODE[0x2b33fc-0x100000:].split(b'\0',1)[0]==b'LncIconPickUp_00_Scale.bclan'

ordinary_state=state
def state(u):
 return {**ordinary_state(u),'longPressFlag':byte(u,WIDGET+0x7d),
  'chosenPickup':word(u,OBJ+0xaec),'chosenPickupScale':word(u,OBJ+0xe5c),
  'pickupVisible':byte(u,PICKUP+0x60),'pickupPriority':word(u,PICKUP+0x58),
  'pickupScale':ctrl(u,PICKUP_SCALE) if word(u,PICKUP_SCALE+0x28) else None}

ENTRY_MARKERS={0x253200:'increment-held',0x25320c:'compare-threshold',
 0x1f7078:'reverse-select',0x2a52a4:'callback3-handler',0x2a5348:'select-candidate',
 0x2a5534:'pickup-chosen',0x1f5a9c:'pickup-priority',0x232234:'visibility',
 0x2693fc:'controller-start',0x1bbd8c:'controller-seek',0x1e801c:'pickup-resource-handoff',
 0x2a570c:'callback4-handler',0x1d4cc4:'release-resource-handoff'}

def hold_setup(folder,same,occupied):
 data=stylus_setup(folder,3,3 if same else 4,occupied)
 u,tr,sk,pi,ev,pe,events,hit,opening=data
 init_controller(u,PICKUP_SCALE,'LncIconPickUp_00_Scale',5)
 call(u,0x1bbd7c,[PICKUP_SCALE,5])
 w(u,PICKUP,0x321650);b(u,PICKUP+0x60,0)
 attach(u,PICKUP,[PICKUP_SCALE]);call(u,0x11eae8,[PICKUP])
 w(u,OBJ+0xaf4,PICKUP);w(u,OBJ+0xe60,PICKUP_SCALE)
 handoff=[];entry=[]
 def hook(u,a,size,_):
  if a in ENTRY_MARKERS or a in [0x233a4c,0x233a6c]:
   if a==0x232234 and args(u)[0]!=PICKUP:return
   if a in [0x2693fc,0x1bbd8c] and args(u)[0]!=PICKUP_SCALE:return
   entry_args=sk[-1]['args'] if a in SINKS and sk and sk[-1].get('target')==hex(a) else args(u)
   row={'kind':ENTRY_MARKERS.get(a,'callback' if a==0x233a4c else 'sound'),
    'pc':hex(a),'caller':hex(u.reg_read(UC_ARM_REG_LR)-4),
    'pass':pi[0],'args':entry_args,**state(u)}
   if a==0x1bbd8c:row['s0']=struct.unpack('<f',struct.pack('<I',u.reg_read(UC_ARM_REG_S0)))[0]
   entry.append(row)
   if a in [0x1e801c,0x1d4cc4]:
    handoff.append(row);u.reg_write(UC_ARM_REG_PC,END)
 u.hook_add(UC_HOOK_CODE,hook)
 events.clear();tr.clear();sk.clear();ev.clear();pe.clear()
 return data,entry,handoff

def record(data,entry,handoff,before,rows,**labels):
 u,tr,sk,pi,ev,pe,events,hit,opening=data
 phase=before['loopCurrent']
 for row in rows:
  assert row['mode']==0 and row['request']==0 and row['shown']==row['visible']==1
  assert row['scale']==before['scale']
  assert row['primarySelect']==before['primarySelect'] and row['primaryDecide']==before['primaryDecide']
  if (handoff and row['pass']==handoff[0]['pass']) or (opening and row['pass']==opening[0]['pass']):
   assert row['loopCurrent']==phase
  else:
   assert row['loopSubmitted']==phase
   phase=advance_loop(phase,1);assert row['loopCurrent']==phase
 assert not any(e['kind']=='primary-scale-seek' for e in events)
 assert not any(e['kind']=='primary-write' and int(e['address'],16)==OBJ+0x3a88 for e in pe)
 return {**labels,'before':before,'rows':rows,'entryEvents':entry,'events':events,
  'primaryEvents':pe,'hostTrace':tr,'endpoints':sk,'handoff':handoff,'opening':opening}

holds=[]
for folder in [-1,2]:
 for same in [False,True]:
  for occupied in [False,True]:
   data,entry,handoff=hold_setup(folder,same,occupied)
   u,tr,sk,pi,ev,pe,events,hit,opening=data
   before=state(u);rows=[step(data,1,0)]
   rows += [step(data,1,1) for _ in range(21)]
   target=3 if same else 4
   assert callbacks(events)==[0,3] and not opening
   assert [r['heldCount'] for r in rows]==list(range(21))+[0]
   assert all(r['widgetState']==1 and r['capture']==1 for r in rows)
   assert [r['longPressFlag'] for r in rows]==[0]*21+[1]
   assert all(r['selected']==3 for r in rows[:21])
   assert all(r['candidateSlot']==(target if occupied else -1) for r in rows)
   assert all(r['candidateFolder']==(folder if occupied else -1) for r in rows)
   assert rows[19]['select']['state']==0 and rows[19]['tilePoseY']==-2
   assert rows[20]['select']=={'current':0.0,'applied':1.0,'step':1.0,'state':1,'mode':1}
   assert rows[20]['tilePoseY']==-2 and rows[20]['tileBindingDisabled']==[0,1]
   assert all(r['decide']==before['decide'] for r in rows)
   assert bool(handoff)==occupied
   assert [e['args'][1] for e in events if e['kind']=='sound']==[0x0100002b]
   if occupied:
    assert rows[21]['selected']==target and rows[21]['position']==before['position']
    assert rows[21]['select']==rows[20]['select'] and rows[21]['tilePoseY']==-2
    assert rows[21]['chosenPickup']==PICKUP and rows[21]['chosenPickupScale']==PICKUP_SCALE
    assert rows[21]['pickupVisible']==1 and rows[21]['pickupPriority']==0x177
    assert rows[21]['pickupScale']['current']==2 and rows[21]['pickupScale']['state']==1
    assert rows[21]['pickupScale']['mode']==5 and rows[21]['pickupScale']['applied']==-999
    last=[e['kind'] for e in entry if e['pass']==21]
    assert last==['increment-held','compare-threshold','callback','callback3-handler',
     'select-candidate','pickup-chosen','pickup-priority','visibility','controller-start',
     'controller-seek','pickup-resource-handoff'],last
    phases=[e['phase'] for e in tr if e['pass']==21]
    assert phases==['host','input-producer','input-callback'],phases
    assert handoff[0]['pc']=='0x1e801c'
   else:
    assert rows[21]['selected']==3 and rows[21]['chosenPickup']==0
    assert rows[21]['select']['applied']==0 and rows[21]['select']['state']==2
    assert rows[21]['tilePoseY']==0
    # Continue only the no-pickup case through release, then capture cleanup.
    rows += [step(data,0,1),step(data,0,0),step(data,0,0)]
    assert callbacks(events)==[0,3,4] and not handoff and not opening
    assert rows[22]['widgetState']==0 and rows[22]['longPressFlag']==0
    assert [r['capture'] for r in rows[22:]]==[1,0,0]
    assert [r['globalCapture'] for r in rows[22:]]==[1,1,0]
    assert rows[22]['select']['state']==0 and rows[22]['tileBindingDisabled']==[1,1]
    assert all(r['selected']==3 and r['decide']==before['decide'] for r in rows)
    assert not any(e['kind']=='supplied-hit' and e['pass']>=22 for e in events)
   holds.append(record(data,entry,handoff,before,rows,folder=folder,sameSlot=same,occupied=occupied))

releases=[]
for folder in [-1,2]:
 for same in [False,True]:
  for count in [19,20]:
   data,entry,handoff=hold_setup(folder,same,True)
   u,tr,sk,pi,ev,pe,events,hit,opening=data
   before=state(u);rows=[step(data,1,0)]
   rows += [step(data,1,1) for _ in range(count)]
   rows.append(step(data,0,1))
   for _ in range(3):rows.append(step(data,0,0))
   assert callbacks(events)==[0,1] and not handoff
   assert all(r['longPressFlag']==0 and r['chosenPickup']==0 for r in rows)
   assert rows[count+1]['widgetState']==2 and rows[count+1]['decide']['applied']==0
   assert rows[count+1]['tilePoseY']==-2
   writes=[e['value'] for e in events if e['kind']=='pose-write' and e['pass']==count+1]
   assert writes==([0.0,-2.0] if count==20 else [-2.0]),writes
   assert rows[-1]['widgetState']==0 and rows[-1]['selected']==(3 if same else 4)
   assert rows[-1]['candidateSlot']==-1 and rows[-1]['candidateFolder']==-1
   assert bool(opening)==same
   assert [e['args'][1] for e in events if e['kind']=='sound']==([0x0100002b,0x0100001e] if same else [0x0100002b])
   releases.append(record(data,entry,handoff,before,rows,folder=folder,sameSlot=same,releaseAfterHeldCount=count))

cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True;excerpts=[]
for start,end in [(0x253054,0x2532e8),(0x2558ac,0x255984),(0x1f7048,0x1f7098),
 (0x1f7160,0x1f7394),(0x2a4994,0x2a4af0),(0x2a52a4,0x2a57c8),
 (0x2eb710,0x2eb78c),(0x1e89b4,0x1e89f8),(0x1e0dd0,0x1e0e00),
 (0x1d5fa8,0x1d6044),(0x2b302c,0x2b3078),(0x2b33e4,0x2b3418),
 (0x1f5a9c,0x1f5ad0),(0x232234,0x232250),(0x2693e0,0x2694a8),
 (0x1bbd7c,0x1bbf84),(0x1e801c,0x1e80a0),(0x1e8f38,0x1e8f70)]:
 raw=CODE[start-0x100000:end-0x100000]
 rendered='\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n'
 path=OUT/f'proof-{start:x}-{end:x}.asm';path.write_text(rendered)
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),
  'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
for value in resources.values():
 if 'decoded' in value:value['decoded']={k:v for k,v in value['decoded'].items() if k!='pai'}
report={'sourceSHA256':SHA,'fixtureSHA256':hashlib.sha256(SELF.read_bytes()).hexdigest(),
 'stylusFixtureSHA256':STYLUS_SHA,'threshold':{'address':'0x33c634','value':20},
 'resources':resources,'holds':holds,'releases':releases,'excerpts':excerpts,
 'fixedEndpoints':{hex(k):v for k,v in sorted(SINKS.items())},
 'scope':'16 bounded sequences: eight stationary holds through H21 in root/child, same/different, eligible ordinary/vacant slots; four vacant cases continue through callback4 and capture cleanup; eight eligible releases after H19/H20 retain ordinary acceptance. Reuses frozen ordinary registered-widget fixture and endpoints. First pickup-resource handoff 1e801c stops eligible H21 in input before task traversal and global2D. Ordinary application handoff 1d3e80 stops same-slot acceptance. No occupied post-handoff release, mode14 body, drag, movement/drop, folder hover, scroll, raster or broad lifecycle. The pickup layout identity and raw Scale controller are supplied preloaded, its group is inert and no pickup pane/raster is applied. Native layout registration, priority reorder, visibility setter and Scale start/seek execute. Constructor resource names and later mode14 are static evidence only. Default sound table and sound service are not reconstructed.'}
(OUT/'checked.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'cases':len(holds)+len(releases),'excerpts':len(excerpts),
 'fixtureSHA256':report['fixtureSHA256'],'resultSHA256':hashlib.sha256((OUT/'checked.json').read_bytes()).hexdigest()}))
