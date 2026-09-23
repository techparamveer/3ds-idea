"""Bounded original-ARM normal-close restoration and primary footer; data stays private."""
from pathlib import Path
import hashlib,json,struct
SELF=Path(__file__)
BASE_FIXTURE=SELF.with_name('home_primary_cursor_boundaries.py')
source=BASE_FIXTURE.read_text()
assert hashlib.sha256(source.encode()).hexdigest()=='c1d11e146e3fd3413acce21114474d7e6b18f5e8592171c8cd8c7f5d7b6ac62c'
# Reuse only the frozen fixture setup, not its scenarios/report generation.
# Restoration additionally looks up two non-primary root background panes.
prefix=source.split('\nentries=[]\n',1)[0]
assert prefix.count("assert name=='N_IconPos_00'")==1
prefix=prefix.replace("assert name=='N_IconPos_00'", "assert name in ['N_IconPos_00','W_Plt_00','W_Shdw_00']")
prefix=prefix.replace("'kind':'resource-pane-local-y0'", "'kind':'named-pane-placeholder'")
exec(compile(prefix,str(BASE_FIXTURE),'exec'),globals())
FOLDER=DATA+0x94000;FOLDER_ROOT=DATA+0x94200;CLOSE_CTRL=DATA+0x94400
WIDGET=DATA+0x95000;VT=DATA+0x95100;GRID_ITEMS=DATA+0xa0000
# The restore body, history helpers and widget dispatch execute. Icon container
# reparenting and widget leaf operations are explicit endpoints.
for target in [0x1de8ec,0x1e0cb4]:SINKS.pop(target,None)
SINKS.update({0x1eb39c:'widget-enable',0x1ebe2c:'density-widgets',0x1eb2b4:'widget-refresh',0x1e0cec:'upper-widget-disable',0x1df8d4:'footer-widget-reset',0x2a1854:'icon-container-reparent',0x1f5cf4:'icon-animation',0x2453b8:'icon-container-finalize'})
# Leave presentation service leaves explicit; original1e2180 control flow runs.
SINKS.update({0x2a73c0:'icon-effect-visibility',0x2a74dc:'icon-presentation-refresh',0x2aa22c:'icon-presentation-refresh',0x2a1c70:'icon-presentation-refresh',0x1e8c50:'icon-visibility',0x1d9b08:'icon-active',0x1e8c20:'icon-state',0x1d9c68:'icon-state',0x209af0:'icon-style',0x1e89f8:'icon-metadata',0x1d9738:'icon-scale',0x1f5f38:'icon-color'})

def close_setup(rootSelected=6,counter=5):
 u,tr,sk,pi,ev,pe=primary_setup(selected=1,folder=2,density=2,shown=1,counter=counter,left=0)
 w(u,OBJ+0xac0,FOLDER);w(u,FOLDER+0x38,FOLDER_ROOT);w(u,OBJ+0xe30,CLOSE_CTRL)
 for off,value in [(4,18),(8,0),(12,18)]:f(u,CLOSE_CTRL+off,value)
 w(u,CLOSE_CTRL+0x14,1)
 b(u,OBJ+0x3a80,44);b(u,OBJ+0x3a81,44);b(u,OBJ+0x3a88,2)
 # Root history: current/target left3, supplied selection, relative slot and
 # native integer density0. The actual restore helper copies these fields.
 for off,value in [(0,3),(2,3),(4,rootSelected),(6,rootSelected-3)]:h(u,OBJ+0x11bc+off,value)
 w(u,OBJ+0x11bc+8,0)
 w(u,WIDGET,VT)
 for off in [8,0x10,0x14,0x18]:w(u,VT+off,END+0x200)
 for off in [0x1084,0x1088,0x108c,0x1090,0xf30]:w(u,OBJ+off,WIDGET)
 for slot in range(80):
  item=GRID_ITEMS+slot*0x400
  w(u,OBJ+0x830+slot*4,item);w(u,item,VT);w(u,item+0x38,item+0x100)
  w(u,OBJ+0xf44+slot*4,item+0x200);w(u,item+0x200,VT)
  w(u,OBJ+0x970+slot*4,item+0x300)
 # Both child and root maps are vacancy maps. Record metadata is supplied by
 # the inherited fixture; no firmware resource/renderer lifecycle is run.
 rootmap=DB+0x39bd0-0x2d2
 for slot in range(300):h(u,rootmap+slot*2,slot)
 stages=[]
 def hook(u,a,size,_):
  if a==END+0x200:sk.append({'target':hex(a),'kind':'widget-virtual','caller':hex(u.reg_read(UC_ARM_REG_LR)-4)});ret(u)
  elif a in [0x232214,0x217d20,0x21ba0c,0x217ec4]:
   sk.append({'target':hex(a),'kind':'supplied-secondary-state' if a==0x232214 else 'supplied-root-metadata','caller':hex(u.reg_read(UC_ARM_REG_LR)-4)})
   if a==0x217ec4:w(u,DB+0x44508,rootmap)
   ret(u,{0x232214:0,0x217d20:300,0x21ba0c:DB,0x217ec4:0}[a])
  elif a in [0x2b021c,0x2b03f4,0x29f130,0x2a3600,0x29a184,0x1e2180]:
   stages.append({'pc':hex(a),'pass':pi[0],**primary(u)})
 u.hook_add(UC_HOOK_CODE,hook)
 return u,tr,sk,pi,ev,pe,stages
cases=[]
for selected in [3,2,6]:
 for counter in [0,5]:
  u,tr,sk,pi,ev,pe,stages=close_setup(selected,counter)
  before=primary(u);hostpass(u,pi);hidden=primary(u)
  assert hidden['mode']==44 and hidden['shown']==hidden['visible']==0
  assert hidden['loopCurrent']==before['loopCurrent']
  w(u,CLOSE_CTRL+0x14,0);hostpass(u,pi)
  rows=[primary(u)]
  for _ in range(10 if counter<5 else 5):
   if rows[-1]['mode']==0:break
   hostpass(u,pi);rows.append(primary(u))
  duration=10 if counter<5 else 5
  offscreen=selected!=3
  assert len(rows)==(duration+1 if offscreen else 1)
  assert byte(u,OBJ+0x1170)==255 and word(u,OBJ+0x118c)==0
  restored=[s for s in stages if s['pc']=='0x2b03f4'];assert len(restored)==1
  assert restored[0]['mode']==44 and restored[0]['selected']==selected
  assert restored[0]['position']==before['position'] and restored[0]['scroll']==252
  assert restored[0]['request']==2 and restored[0]['shown']==restored[0]['visible']==0
  assert any(s['pc']=='0x1e2180' for s in stages)
  # The saved child history itself is written by original21b044.
  assert half(u,OBJ+0x11c8+2*12+4)==1
  phase=hidden['loopCurrent'];step=3 if offscreen and counter>=5 else 1
  for i,row in enumerate(rows):
   assert row['request']==0 and row['shown']==row['visible']==1
   assert row['loopSubmitted']==phase;phase=advance_loop(phase,step)
   assert row['loopCurrent']==phase and row['loopStep']==step
   if offscreen and i<duration:
    assert row['mode']==3 and row['position']==before['position']
    assert row['scrollElapsed']==i
   else:
    assert row['mode']==0
    assert row['position']==[f32(row['selectedGrid'][0]-row['scroll']),row['selectedGrid'][1],0]
  rootWrites=[e for e in pe if e['kind']=='primary-write' and int(e['address'],16) in [ROOT+0x28,ROOT+0x2c,ROOT+0x30]]
  assert len(rootWrites)==3 and all(e['pass']==len(rows) and e['mode']==0 for e in rootWrites)
  assert len([e for e in pe if e['kind']=='loop-update'])==len(rows)
  resolves=[e for e in ev if e['kind']=='resolve']
  assert len(resolves)==1 and resolves[0]['pass']==len(rows) and resolves[0]['resolvedSlot']==selected
  cases.append(payload(u,tr,sk,ev,pe,rootSelected=selected,counter=counter,before=before,hidden=hidden,stages=stages,rows=rows))
cs=Cs(CS_ARCH_ARM,CS_MODE_ARM);cs.skipdata=True;excerpts=[]
for start,end in [(0x1de574,0x1de590),(0x29f0a4,0x29f380),(0x2b021c,0x2b041c),
 (0x21b044,0x21b124),(0x1d9ea0,0x1d9f58),(0x1de8ec,0x1de90c),(0x1df708,0x1df7c0),
 (0x1e0cb4,0x1e0cec),(0x1e2180,0x1e3a38),(0x2a1854,0x2a1ad0),
 (0x2a3600,0x2a3700),(0x29a184,0x29a2b8),(0x2b8490,0x2b856c),(0x1d914c,0x1d928c)]:
 raw=CODE[start-0x100000:end-0x100000]
 rendered='\n'.join(f'{i.address:08x} {bytes(i.bytes).hex():8s} {i.mnemonic:10s} {i.op_str}' for i in cs.disasm(raw,start))+'\n'
 path=OUT/f'proof-{start:x}-{end:x}.asm';path.write_text(rendered)
 excerpts.append({'path':path.name,'start':hex(start),'endExclusive':hex(end),'bytesSHA256':hashlib.sha256(raw).hexdigest(),'textSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
report={'sourceSHA256':SHA,'fixtureSHA256':hashlib.sha256(SELF.read_bytes()).hexdigest(),
 'baseFixtureSHA256':hashlib.sha256(source.encode()).hexdigest(),'registration':registrationResult,
 'cases':cases,'excerpts':excerpts,'fixedEndpoints':{hex(k):v for k,v in sorted(SINKS.items())},
 'scope':'Six supplied mature normal-close boundaries: child2 density2 slot1, restored root density0 left3 with slot3/2/6, counters0/5. Mode44 and request2 are supplied; one active-controller host pass executes hide footer, then controller status0 is supplied for restoration. Actual29f0a4, 2b021c body, child-history save21b044, root-history copy1d9ea0, widget dispatch1de8ec, footer-exit1e0cb4, grid generation, scroll offset, icon-update1e2180 control flow, mode0/3 entry, ordinary footer and same-pass2D Loop execute. Icon reparent2a1854, widget/icon service leaves and final footer-layout1d61d4 retain explicit endpoints; root capacity300/context-map switch and hidden secondary-layout queries are supplied. N_IconPos_00 localY0 retains earlier provenance; W_Plt_00/W_Shdw_00 use inert placeholders. No full resource/rendering/overlay/pickup/special-close lifecycle or elapsed18 animation derivation. Restoration rows are R+0 onward; prior close proof maps R to C+18. These are layout eligibility/position writes, not raster clipping or occlusion.'}
(OUT/'checked.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'cases':len(cases),'sourceExcerpts':len(excerpts),'fixtureSHA256':report['fixtureSHA256'],'resultSHA256':hashlib.sha256((OUT/'checked.json').read_bytes()).hexdigest()}))
