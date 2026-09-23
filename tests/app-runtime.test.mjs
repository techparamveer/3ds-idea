import test from 'node:test';
import assert from 'node:assert/strict';
import { apps } from '../src/os/apps.ts';
import { installedTitles, getAppModule, initialAppLayout } from '../src/os/app-registry.ts';
import { createAppRuntime, startApplication, openApplet, dispatchRuntime, activeInstance, runtimeView, showRuntimeHome, resumeRuntimeApplication, closeApplication, deliverCapabilityResult, setRuntimeSleeping, acknowledgeEffects, isRuntimeEffectCurrent } from '../src/os/app-host.ts';
import { createPortfolioState, tickSystem, reduceSystem, touchSystem, dispatchSystemEvent, getActiveAppView, restoreSettings, setSystemSleeping, releaseSystemInputs, resolveSystemCapability, restoreRuntimeData } from '../src/os/system.ts';
import { createInputLatch, latchInput, repeatInput } from '../src/os/app-input.ts';
const event=(r,id,value)=>dispatchRuntime(r,{type:'action',id,value},1000);
const home=()=>tickSystem(createPortfolioState(),3001);
const titleSlot=id=>Number(Object.entries(initialAppLayout()).find(([,title])=>title===id)[0]);
test('registry preserves portfolio positions, distinguishes applets, and excludes removed portfolio titles',()=>{
 assert.deepEqual(Object.values(initialAppLayout()).slice(0,8),apps.map(app=>app.id));
 assert.ok(installedTitles.some(t=>t.id==='camera-applet'&&t.kind==='system-applet'));
 assert.ok(installedTitles.some(t=>t.id==='keyboard'&&t.kind==='library-applet'));
 for(const id of ['face-raiders','ar-games','activity-log','download-play','mii-maker','streetpass']){
  assert.equal(getAppModule(id),undefined);assert.ok(!Object.values(initialAppLayout()).includes(id));
 }
 for(const title of installedTitles){const module=getAppModule(title.id),ctx={now:0,shared:createAppRuntime().shared};const view=module.view(module.create({},null,ctx),ctx);assert.equal(view.appId,title.id);assert.ok(Array.isArray(view.rows));}
});
test('system applets preserve the suspended portfolio and library results return to the caller',()=>{
 let r=startApplication(createAppRuntime(),'work',0);r=dispatchRuntime(r,{type:'command',command:'down'},10);r=showRuntimeHome(r,20);
 r=openApplet(r,'friends','toolbar',{},30);const friends=r.active;
 r=event(r,'message');assert.equal(activeInstance(r).appId,'keyboard');
 r=dispatchRuntime(r,{type:'text',value:'Hello!'},40);r=event(r,'submit');assert.equal(r.active,friends);assert.equal(activeInstance(r).state.message,'Hello!');
 r=event(r,'back');assert.equal(r.active,null);assert.equal(r.instances[r.application].state.item,1);
 r=resumeRuntimeApplication(r,50);assert.equal(activeInstance(r).appId,'work');assert.equal(activeInstance(r).state.item,1);
});
test('nested library applets restore parent state and HOME resumes the innermost active applet',()=>{
 let r=startApplication(createAppRuntime(),'system-settings',0);r=event(r,'profile');r=event(r,'nickname');const keyboard=r.active;
 r=dispatchRuntime(r,{type:'text',value:'Ada'},1);r=openApplet(r,'error','error',{message:'Test'},2);
 r=event(r,'ok');assert.equal(r.active,keyboard);assert.equal(activeInstance(r).state.draft,'Ada');
 r=showRuntimeHome(r,3);r=resumeRuntimeApplication(r,4);assert.equal(r.active,keyboard);
 r=event(r,'submit');assert.equal(activeInstance(r).appId,'system-settings');assert.equal(r.shared.settings.nickname,'Ada');
 assert.ok(r.effects.some(e=>e.effect.type==='storage'&&e.effect.key==='@shared'));
});
test('closing an application clears child applets and emits capability release for every instance',()=>{
 let r=startApplication(createAppRuntime(),'camera',0);r=event(r,'preview');const application=r.application;
 r=openApplet(r,'keyboard','name',{},1);const keyboard=r.active;
 r=closeApplication(r,2);assert.deepEqual(r.instances,{});assert.equal(r.application,null);
 for(const owner of [application,keyboard])assert.ok(r.effects.some(e=>e.owner===owner&&e.effect.type==='release-capabilities'));
});
test('late capability responses cannot write to closed, suspended or sleeping apps',()=>{
 let r=event(startApplication(createAppRuntime(),'camera',0),'capture');const owner=r.active,request=r.effects.find(e=>e.effect.type==='capability'),result={type:'capability-result',requestId:'capture',requestToken:request.id,ok:true,value:{id:'photo',name:'Private photo'}};
 const suspended=showRuntimeHome(r,10);assert.equal(deliverCapabilityResult(suspended,owner,result,11),suspended);
 const closed=closeApplication(r,10);assert.equal(deliverCapabilityResult(closed,owner,result,11),closed);
 const sleeping=setRuntimeSleeping(r,true,10);assert.equal(deliverCapabilityResult(sleeping,owner,result,11),sleeping);
 r=deliverCapabilityResult(r,owner,result,11);assert.equal(r.shared.photos[0].id,'photo');
});
test('note strokes preserve pointer movement and save through the shared local notebook',()=>{
 let r=openApplet(createAppRuntime(),'game-notes','notes',{},0);r=event(r,'0');
 for(const [phase,x,y]of [['down',10,60],['move',20,70],['up',30,80]])r=dispatchRuntime(r,{type:'touch',phase,x,y},100);
 assert.equal(activeInstance(r).state.strokes[0].points.length,3);r=event(r,'back');
 assert.equal(r.shared.notes[0].slot,0);assert.equal(r.shared.notes[0].strokes[0].points.length,3);r=event(r,'0');assert.equal(activeInstance(r).state.strokes.length,1);
});
test('button releases, analog dead zone and multiple sources do not duplicate or stick input',()=>{
 let {latch,commands}=latchInput(createInputLatch(),{type:'button',source:'a',command:'right',phase:'down'},0);assert.deepEqual(commands,['right']);
 ({latch,commands}=latchInput(latch,{type:'button',source:'b',command:'right',phase:'down'},5));assert.deepEqual(commands,[]);
 ({latch,commands}=repeatInput(latch,420));assert.deepEqual(commands,['right']);
 ({latch}=latchInput(latch,{type:'button',source:'a',command:'right',phase:'up'},421));
 ({latch}=latchInput(latch,{type:'button',source:'b',command:'right',phase:'up'},422));assert.deepEqual(repeatInput(latch,999).commands,[]);
 ({latch,commands}=latchInput(latch,{type:'analog',source:'circle',x:.8,y:0},1000));assert.deepEqual(commands,['right']);
 ({latch}=latchInput(latch,{type:'analog',source:'circle',x:0,y:0},1001));assert.deepEqual(repeatInput(latch,2000).commands,[]);
});
test('toolbar launches actual applets and rich inputs operate shared keyboard state',()=>{
 let s=touchSystem(home(),60,16,4000);assert.equal(getActiveAppView(s).appId,'game-notes');assert.equal(s.system.app,null);
 s=reduceSystem(s,'back',4001);assert.equal(s.system.phase,'home');
 s={...s,selected:8};s=reduceSystem(s,'open',4002);s=tickSystem(s,6000);assert.equal(getActiveAppView(s).appId,'system-settings');
 s=dispatchSystemEvent(s,{type:'action',id:'profile'},6001);s=dispatchSystemEvent(s,{type:'action',id:'nickname'},6002);
 s=dispatchSystemEvent(s,{type:'text',value:'Sam'},6003);s=dispatchSystemEvent(s,{type:'action',id:'submit'},6004);
 assert.equal(s.system.runtime.shared.settings.nickname,'Sam');assert.equal(getActiveAppView(s).appId,'system-settings');
});
test('legacy eight-app layout migrates without destroying custom positions or folders',()=>{
 const layout=Object.fromEntries(apps.map((app,i)=>[i===0?30:i,app.id]));
 const restored=restoreSettings(home(),JSON.stringify({layout,folders:{8:'Docs'}}));
 assert.equal(restored.system.layout[30],'work');assert.equal(restored.folders[8],'Docs');
 assert.ok(Object.values(restored.system.layout).includes('system-settings'));assert.equal(new Set(Object.values(restored.system.layout)).size,Object.values(restored.system.layout).length);
});
test('removed titles migrate out of old root and folder layouts without moving retained content',()=>{
 const layout={...initialAppLayout(),40:'activity-log',41:'download-play',42:'mii-maker',43:'streetpass'};
 delete layout[0];layout[30]='work';
 const restored=restoreSettings(home(),JSON.stringify({version:4,layout,folders:{50:'Saved'},folderLayouts:{50:{2:'activity-log',3:'streetpass'}},nextFolderNumber:8}));
 assert.equal(restored.system.layout[30],'work');assert.equal(restored.folders[50],'Saved');
 assert.deepEqual(restored.system.folderLayouts[50],{});
 for(const slot of [40,41,42,43])assert.equal(restored.system.layout[slot],undefined);
 for(const [slot,id]of Object.entries(layout))if(!['activity-log','download-play','mii-maker','streetpass'].includes(id))assert.equal(restored.system.layout[slot],id);
});
test('effect acknowledgement is selective and preserves newly queued effects',()=>{
 let r=startApplication(createAppRuntime(),'camera',0);const ids=r.effects.map(e=>e.id);r=event(r,'preview');const after=acknowledgeEffects(r,ids);
 assert.ok(after.effects.every(e=>!ids.includes(e.id)));assert.ok(after.effects.some(e=>e.effect.type==='capability'));
});
test('foreground modules receive raw press, release, repeat and analog without duplicate navigation',()=>{
 const module=getAppModule('system-settings'),original=module.reduce,seen=[];
 module.reduce=(state,event,context)=>{seen.push(event);return original(state,event,context);};
 try{
  let s=home();s={...s,selected:8};s=tickSystem(reduceSystem(s,'open',4000),6000);
  s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'down',source:'dpad'},6001);
  s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'down',source:'keyboard'},6002);
  assert.equal(getActiveAppView(s).selection,1);
  s=tickSystem(s,6450);assert.equal(getActiveAppView(s).selection,2);
  s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'up',source:'dpad'},6451);
  s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'up',source:'keyboard'},6452);
  s=dispatchSystemEvent(s,{type:'analog',source:'circle',x:.8,y:0},6500);
  assert.deepEqual(seen.filter(e=>e.type==='button').map(e=>e.phase),['down','down','repeat','up','up']);
  assert.equal(seen.find(e=>e.type==='button'&&e.source==='keyboard').activate,false);
  assert.ok(seen.some(e=>e.type==='analog'&&e.x===.8));assert.equal(s.system.input.held.dpad,undefined);
 }finally{module.reduce=original;}
});
test('an application can close itself during suspend without resurrecting a stale owner',()=>{
 const module=getAppModule('camera'),original=module.reduce;
 module.reduce=(state,event,context)=>event.type==='lifecycle'&&event.phase==='suspend'?{state,effects:[{type:'close'}]}:original(state,event,context);
 try{
  let r=startApplication(createAppRuntime(),'camera',0);const owner=r.application;
  r=showRuntimeHome(r,1);assert.equal(r.instances[owner],undefined);assert.equal(r.application,null);assert.equal(r.homeReturn,null);
  r=startApplication(r,'camera',2);r=openApplet(r,'keyboard','test',{},3);
  assert.equal(activeInstance(r).appId,'keyboard');assert.equal(activeInstance(r).caller,null);
 }finally{module.reduce=original;}
});

test('capability tokens reject unsolicited, superseded, duplicate and resumed-owner callbacks',()=>{
 let r=startApplication(createAppRuntime(),'camera',0),owner=r.active;
 const result={type:'capability-result',requestId:'capture',ok:true,value:{id:'photo',name:'Photo'}};
 assert.equal(deliverCapabilityResult(r,owner,result,1),r);
 r=event(r,'capture');const first=r.effects.find(e=>e.effect.type==='capability');
 r=event(r,'capture');const second=r.effects.at(-1);
 assert.equal(isRuntimeEffectCurrent(r,first),false);assert.equal(isRuntimeEffectCurrent(r,second),true);
 assert.equal(deliverCapabilityResult(r,owner,{...result,requestToken:first.id},1),r);
 r=deliverCapabilityResult(r,owner,{...result,requestToken:second.id},1);assert.equal(r.shared.photos.length,1);
 assert.equal(deliverCapabilityResult(r,owner,{...result,requestToken:second.id},2),r);
 r=event(r,'capture');const stale=r.effects.at(-1);r=resumeRuntimeApplication(showRuntimeHome(r,3),4);
 assert.equal(deliverCapabilityResult(r,owner,{...result,requestToken:stale.id},5),r);
 assert.equal(isRuntimeEffectCurrent(r,stale),false);
});
test('normalized touch keeps one stylus and forwards pointer identity through up/cancel',()=>{
 const module=getAppModule('game-notes'),original=module.reduce,seen=[];
 module.reduce=(s,e,c)=>{if(e.type==='touch')seen.push(e);return original(s,e,c);};
 try{
  let s=touchSystem(home(),60,16,4000);
  s=dispatchSystemEvent(s,{type:'touch',phase:'up',x:10,y:50,pointerId:7},4001);assert.equal(seen.length,0);
  for(const e of [{phase:'down',pointerId:7},{phase:'down',pointerId:8},{phase:'move',pointerId:8},{phase:'cancel',pointerId:8},{phase:'move',pointerId:7},{phase:'up',pointerId:7}])s=dispatchSystemEvent(s,{type:'touch',x:10,y:50,...e},4002);
  assert.deepEqual(seen.map(e=>[e.phase,e.pointerId]),[['down',7],['move',7],['up',7]]);
  s=dispatchSystemEvent(s,{type:'touch',phase:'down',x:10,y:50,pointerId:9},4003);s=releaseSystemInputs(s,4004);
  assert.equal(seen.at(-1).phase,'cancel');assert.equal(s.system.input.touch,null);
 }finally{module.reduce=original;}
});
test('opening an applet resets held input and raw analog coordinates are finite and clamped',()=>{
 let s={...home(),selected:8};s=tickSystem(reduceSystem(s,'open',4000),6000);
 s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'down',source:'dpad'},6001);
 s=dispatchSystemEvent(s,{type:'action',id:'profile'},6002);s=dispatchSystemEvent(s,{type:'action',id:'nickname'},6003);
 assert.deepEqual(s.system.input.held,{});
 const module=getAppModule('keyboard'),original=module.reduce,seen=[];
 module.reduce=(state,event,context)=>{seen.push(event);return original(state,event,context);};
 try{
  s=dispatchSystemEvent(s,{type:'analog',x:20,y:-3,source:'pad'},6004);
  assert.deepEqual(seen.find(e=>e.type==='analog'),{type:'analog',x:1,y:-1,source:'pad'});
  const count=seen.length;s=dispatchSystemEvent(s,{type:'analog',x:NaN,y:0,source:'pad'},6005);assert.equal(seen.length,count);
 }finally{module.reduce=original;}
});
test('power and preferences suspend device requests, resume on cancel, and sleep releases input',()=>{
 let s={...home(),selected:titleSlot('camera')};s=tickSystem(reduceSystem(s,'open',4000),6000);
 s=dispatchSystemEvent(s,{type:'action',id:'preview'},6001);const owner=s.system.runtime.active,request=s.system.runtime.effects.at(-1);
 s=reduceSystem(s,'power',6002);assert.equal(s.system.phase,'power');assert.equal(s.system.runtime.active,null);assert.equal(isRuntimeEffectCurrent(s.system.runtime,request),false);
 s=reduceSystem(s,'back',6003);assert.equal(s.system.phase,'app');assert.equal(s.system.runtime.active,owner);
 s=reduceSystem(s,'preferences',6004);assert.equal(s.system.runtime.active,null);s=tickSystem(s,7000);assert.equal(s.system.phase,'app');
 s=reduceSystem(s,'back',7001);assert.equal(s.system.runtime.active,owner);
 s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'down',source:'keyboard'},7002);s=setSystemSleeping(s,true,7003);
 assert.deepEqual(s.system.input.held,{});assert.equal(s.system.runtime.sleeping,true);
 s=setSystemSleeping(s,false,8000);assert.equal(s.system.runtime.active,owner);
});

test('late capability callbacks cannot dismiss overlays or replace running state',()=>{
 let s={...home(),selected:titleSlot('camera')};s=tickSystem(reduceSystem(s,'open',4000),6000);const owner=s.system.runtime.active;
 s=dispatchSystemEvent(s,{type:'action',id:'capture'},6001);const request=s.system.runtime.effects.at(-1);
 s=reduceSystem(s,'power',6002);assert.equal(resolveSystemCapability(s,owner,{type:'capability-result',requestId:'capture',requestToken:request.id,ok:true},6003),s);
 assert.equal(restoreRuntimeData(s,{},{}),s);
});
