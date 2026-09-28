#!/usr/bin/env python3
"""Original keyboard ARM global lower first-paint schedule, immediate-ready resources.

Pass the private global-first-paint directory. Sibling support fixtures implement
explicit resource/font/binding/world/GPU endpoints; originals remain frozen.
Produces private journals plus assertions. Does not boot or render firmware.
"""
from pathlib import Path
import json,struct,importlib.util,sys
D=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).parent;spec=importlib.util.spec_from_file_location('q',D/'qwerty-first-paint.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q);m=q.m
class Global(q.Qwerty):
 def __init__(self,text='Ada'):
  super().__init__();self.initial=text;self.text=text;self.app=self.alloc(0x400);self.page=self.alloc(0x400);self.phase='setup';self.active={};self.trace=[];self.breakpoint=None;self.globalEvents=[];self.frame=-1;self.captureState=None;self.captureAfter=None;self.registered=[];self.linked=set()
  self.w(self.app,0x1ad738)
  for i in range(2):
   a=0x1be7f8+i*12;self.w(a,0);self.w(a+4,a+4);self.w(a+8,a+4)
  self.w(0x1b776c,self.buf);self.w(0x1b7774,0);self.u.mem_write(0x1b775d,b'\0');self.w(0x1b77f8,0)
  shared=self.word(0x1b7760);self.u.mem_write(shared,text.encode('utf-16le')+b'\0\0')
  self.hooks.update({0x1561dc:self.archive,0x13e264:lambda:0,0x18b820:lambda:0,0x18b7c4:lambda:0,0x13f794:lambda:self.app if self.r(0)==1 else 0,0x17ae78:self.captureAllocate,0x15bf30:self.callerTexture,0x183a50:lambda:0,0x178004:self.layoutAnimate,0x107848:lambda:0,0x15af44:lambda:0,0x10209c:lambda:0,0x1056e0:lambda:0,0x15b618:lambda:0,0x15b284:lambda:0,0x15b464:lambda:0,0x141da0:lambda:0})
  renderer=self.alloc(0x80);vt=self.alloc(0x40);self.w(renderer,vt);self.w(vt+0x10,self.endpoint('rendererEnd',lambda:0));self.w(0x1b7774,0);self.w(0x1b7734,renderer);self.w(0x1b780c+0x18,renderer)
 def group(self):return self.groupMaps[self.r(0)].get(self.string(self.r(1)),0)
 def rtti(self):
  return 0x1b8dec if self.panes[self.r(0)]['kind']=='bnd1' else super().rtti()
 def archive(self):
  p=self.alloc(0x40);vt=self.alloc(0x40);self.w(p,vt);self.w(vt+0x1c,self.endpoint('archiveReady',lambda:1));return p
 def captureAllocate(self):
  p=self.r(0);desc=self.alloc(0x20);self.w(desc,0xcafecafe);self.w(p+4,desc);self.w(p+0xc,0x1234);return 0
 def callerTexture(self):
  p=self.alloc(0x20);self.w(p,0xcaca0000+self.r(0));return p
 def call(self,a,args=(),stage=''):
  self.phase=stage
  try:super().call(a,args,stage)
  except Exception:
   print('TRACE',[hex(x) for x in self.trace]);raise
 def linked_append(self,head,item,count):
  prev=self.word(head+4);self.w(item,head);self.w(item+4,prev);self.w(head+4,item);self.w(prev,item);self.w(count,self.word(count)+1)
 def load(self):
  obj=self.r(0);v=super().load();
  for p in self.layouts[obj]['map'].values():self.w(self.panes[p]['materialPtr']+0x34,self.alloc(0x20))
  self.registered.append(obj);self.w(obj+0x48,0x1be810+self.word(obj+0x54)*0x8c);self.u.reg_write(m.UC_ARM_REG_R0,obj);self.u.reg_write(m.UC_ARM_REG_PC,0x116e38);return 'tail'
 def multicontrollers(self):
  obj=self.r(0);before=set(self.controllers);n=super().multicontrollers()
  for p in self.controllers:
   if p in before:continue
   self.linked_append(obj+0x18,p+0x20,obj+0x14);self.linked.add(p)
  return n
 def animationEnable(self):
  pane,anim,enabled=[self.r(i) for i in range(3)];self.active[(pane,anim)]=enabled;self.events.append({'op':'bindingEnable','pane':self.panes[pane]['id'],'anim':anim,'enabled':enabled});return 0
 def applyPane(self,pane):
  for (p,a),enabled in list(self.active.items()):
   if p==pane and enabled:
    c=next(c for c in self.controllers.values() if c['anim']==a);self.globalEvents.append({'phase':self.phase,'op':'paneAnimationSubmission','pane':self.panes[pane]['id'],'clip':c['clip'],'frame':self.fs(a+0x10,1)[0]})
 def layoutAnimate(self):
  obj=self.r(0)-0x28
  for p,n in self.panes.items():
   par=p
   while par and par!=self.word(obj+0x38):par=self.word(par+0xc)
   if par:self.applyPane(p)
  return 0
 def paint(self):
  obj=self.r(1)-0x28;self.globalEvents.append({'phase':self.phase,'op':'draw','layout':self.layouts[obj]['name'],'object':hex(obj),'visible':self.u.mem_read(obj+0x60,1)[0]});return 0
 def hook(self,u,a,size,x):
  self.trace.append(a);self.trace=self.trace[-30:]
  if a in [0x191f00,0x192060,0x1938e8,0x102e84,0x17af5c,0x17ae04,0x13e1d0,0x1931c8,0x18bb78]:self.globalEvents.append({'phase':self.phase,'op':'nativeCall','address':hex(a),'arg1':self.r(1)})
  if a==0x17af5c:self.captureState=self.checkpoint()
  if a==0x17afbc:self.captureAfter=self.checkpoint()
  if a==0x191fb8:self.globalEvents.append({'phase':self.phase,'op':'retainedTextureBind','pane':'P_Aplt_00','texture':hex(self.word(self.word(self.r(0)+4)))})
  if a in [0x18a870,0x17b114] and self.r(0) in self.controllers and self.controllers[self.r(0)]['clip']=='DecorCursor_blink.bclan':self.globalEvents.append({'phase':self.phase,'op':'cursorResetOrStart','address':hex(a),'caller':hex(u.reg_read(m.UC_ARM_REG_LR))})
  if a==0x116ed8:
   p=self.r(0)
   if p in self.controllers and p not in self.linked:
    obj=self.controllers[p]['layout'];self.linked_append(obj+0x18,p+0x20,obj+0x14);self.linked.add(p)
  if a==0x102eb4:self.globalEvents.append({'phase':self.phase,'op':'rootVisit','object':hex(u.reg_read(m.UC_ARM_REG_R4)-4)})
  if a==0x18a8a4 and self.r(0) in self.controllers:
   p=self.r(0);c=self.controllers[p];self.globalEvents.append({'phase':self.phase,'op':'controllerUpdate','clip':c['clip'],'layout':self.layouts[c['layout']]['name'],'pane':c.get('pane'),'group':c.get('group'),'state':self.word(p+0x14),'current':self.fs(p+0xc,1)[0],'speed':self.fs(p+0x10,1)[0]})
  if a==self.breakpoint:u.emu_stop();return
  # Permit the real common layout update; older bounded fixture stops here.
  if a==0x187868:return
  super().hook(u,a,size,x)
 def bounded(self,a,z,args,phase):
  old=self.stop;self.stop=z;self.breakpoint=z
  try:self.call(a,args,stage=phase)
  except Exception:
   print('TRACE',[hex(x) for x in self.trace]);raise
  finally:self.stop=old;self.breakpoint=None
 def snapshot(self):
  out=[]
  for i in range(2):
   head=0x1be7f8+i*12+4;item=self.word(head);rows=[]
   while item!=head:
    p=item-4;rows.append({'layout':self.layouts[p]['name'],'object':hex(p),'priority':self.word(p+0x58),'visible':self.u.mem_read(p+0x60,1)[0]});item=self.word(item)
   out.append(rows)
  return out
 def checkpoint(self):
  page=self.word(self.app+0x70);text=self.word(self.app+0x8c)
  selected=[p for p,n in self.panes.items() if n['layout']==text and (n['name'] in ['N_decor','N_transDecor','N_input'] or n['name'].startswith('T_input')) or n['name'] in ['N_decorCursor','P_decorCursorMS','WaitIcon_00','N_arwL_00','N_arwR_00']]
  return {'modelLength':self.word(self.model+8),'cursor':self.word(self.model+0x14),'text':self.wide(self.buf,self.word(self.model+8)),
   'footerWidgetStates':[self.word(self.word(self.app+0xa4+4*i)+0x10) if self.word(self.app+0xa4+4*i) else None for i in range(3)],
   'mode':self.word(page+0x78) if page else None,
   'modeWidgetStates':[self.word(self.word(page+0x90+4*i)+0x10) for i in range(4)] if page else [],
   'controllers':[{'layout':self.layouts[c['layout']]['name'],'clip':c['clip'],'group':c.get('group'),'pane':c.get('pane'),'end':self.fs(p+4,1)[0],'start':self.fs(p+8,1)[0],'mode':self.word(p+0x18),'state':self.word(p+0x14),'current':self.fs(p+0xc,1)[0],'submitted':self.fs(c['anim']+0x10,1)[0]} for p,c in self.controllers.items() if self.word(p+0x14) or 'KeytopModeSelect' in c['clip'] or 'Btm3Btn' in c['clip']],
   'panes':[{'layout':self.layouts[self.panes[p]['layout']]['name'],'name':self.panes[p]['name'],'position':self.fs(p+0x28,3),'alpha':self.u.mem_read(p+0xb4,1)[0],'flags':self.u.mem_read(p+0xb7,1)[0]} for p in selected]}
 def run(self):
  self.call(0x192970,[self.app],stage='ownerConstructor')
  self.call(0x1958f4,[self.app,1],stage='ownerTaskId')
  self.call(0x109c40,[self.app],stage='ownerResourceLoad')
  head=0x1beba0;self.w(head,head);self.w(head+4,head);self.w(head-4,0);self.linked_append(head,self.app+4,head-4)
  factory=self.alloc(0x20);vt=self.alloc(0x20);self.w(factory,vt);self.w(vt+8,0x190f1c);self.w(0x1b7844,factory)
  frames=[]
  for i in range(17):
   self.frame=i
   self.call(0x1054e0,[0],stage=f'frame{i}:tasks')
   self.w(self.para+0x10,1) # Decoded single-line paragraph-cache endpoint.
   self.call(0x102e84,[0],stage=f'frame{i}:roots')
   self.call(0x15ba28,[0,1,0],stage=f'frame{i}:drawHigh');self.call(0x15ba28,[0,0,0],stage=f'frame{i}:drawLow')
   frames.append({'frame':i,'ownerState':self.u.mem_read(self.app+0x5c,1)[0],'prepared':self.u.mem_read(self.app+0x1d6,1)[0],'settled':self.u.mem_read(self.app+0x1d8,1)[0], 'roots':self.snapshot(),'checkpoint':self.checkpoint() if i in [0,1,15,16] else None})
  return {'input':self.initial,'captureBeforeRootUpdate':self.captureState,'captureAfterRootUpdate':self.captureAfter,'frames':frames,'roots':self.snapshot(),'events':self.globalEvents,'propertyWrites':self.events}
def verify(r):
 live=['BG.bclyt','Btm2Btn.bclyt','TextArea_02.bclyt','KeytopModeSelect.bclyt','Keytop_qwerty.bclyt','LncArw_00.bclyt','WaitIcon.bclyt']
 events=r['events'];draw=lambda phase:[e['layout'] for e in events if e['op']=='draw' and e['phase']==phase]
 assert draw('frame1:tasks')==live
 assert draw('frame1:drawLow')==['ApltFade_D_00.bclyt']
 assert draw('frame16:drawLow')==live
 assert all(not draw(f'frame{i}:drawHigh') for i in range(17))
 assert [f['frame'] for f in r['frames'] if f['settled']]==[16]
 assert r['frames'][0]['prepared']==0 and all(f['prepared']==1 for f in r['frames'][1:])
 before,after=r['captureBeforeRootUpdate'],r['captureAfterRootUpdate']
 assert before['text']==after['text']==r['input']
 expectedX={'':0.,'Ada':51.,'ABCDEFGHIJ':168.11111450195312}[r['input']]
 assert next(p['position'] for p in after['panes'] if p['name']=='N_decorCursor')==[expectedX,3.,0.]
 assert after['mode']==0 and after['modeWidgetStates']==[4,0,0,0]
 assert after['footerWidgetStates']==[0,None,5 if not r['input'] else 0]
 assert [(c['submitted'],c['state']) for c in after['controllers'] if c['clip']=='Keytop_qwerty_i0.bclan']==[(1,2)]*5
 assert [e['texture'] for e in events if e['op']=='retainedTextureBind']==['0xcafecafe']
 calls=[e['address'] for e in events if e['op']=='nativeCall' and e['phase']=='frame1:tasks']
 assert calls[:9]==['0x191f00','0x13e1d0','0x192060','0x18bb78','0x192060','0x18bb78','0x1938e8','0x17af5c','0x102e84']
 footer=[(e['phase'],e['frame']) for e in events if e['op']=='paneAnimationSubmission' and e['clip']=='Btm3Btn_i0.bclan']
 assert footer==([('frame1:tasks',0)]*5+[('frame16:roots',1)]*5 if not r['input'] else [])
 assert len([e for e in events if e['op']=='nativeCall' and e['address']=='0x17af5c'])==1
 cursor=[e['current'] for e in events if e['op']=='controllerUpdate' and e['clip']=='DecorCursor_blink.bclan'];assert cursor==[0]+[0 if r['input'] else 1]*17
 return {'input':r['input'],'passed':True,'frames':17,'captureFrame':1,'firstCapturedDisplay':1,'firstLiveSettledDisplay':16,'footerWidgetStates':after['footerWidgetStates'],'capturePainterOrder':live}
if __name__=='__main__':
 results=[Global(t).run() for t in ['', 'Ada','ABCDEFGHIJ']]
 (D/'global-schedule.json').write_text(json.dumps(results,indent=2)+'\n')
 checks=[verify(r) for r in results];(D/'schedule-checks.json').write_text(json.dumps(checks,indent=2)+'\n');print(json.dumps(checks,indent=2))
