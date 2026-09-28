import test from 'node:test';
import assert from 'node:assert/strict';
import { apps } from '../src/os/apps.ts';
import { installedTitles, getAppModule, initialAppLayout, isPreviousDefaultAppLayout } from '../src/os/app-registry.ts';
import { createAppRuntime, startApplication, openApplet, dispatchRuntime, activeInstance, runtimeView, showRuntimeHome, resumeRuntimeApplication, closeApplication, deliverCapabilityResult, setRuntimeSleeping, acknowledgeEffects, isRuntimeEffectCurrent } from '../src/os/app-host.ts';
import { createPortfolioState, tickSystem, reduceSystem, touchSystem, dispatchSystemEvent, getActiveAppView, restoreSettings, saveSettings, setSystemSleeping, releaseSystemInputs, resolveSystemCapability, restoreRuntimeData } from '../src/os/system.ts';
import { createInputLatch, latchInput, repeatInput } from '../src/os/app-input.ts';
import { getHomeNavigationView, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
const event=(r,id,value)=>dispatchRuntime(r,{type:'action',id,value},1000);
const home=()=>tickSystem(createPortfolioState(),3001);
const titleSlot=id=>Number(Object.entries(initialAppLayout()).find(([,title])=>title===id)[0]);
const previousDefault=()=>Object.fromEntries([
 'work','projects','hobbies','life','hackuk','nvidia','about','contact',
 'system-settings','health-safety','camera','sound','eshop','nintendo-zone',
].map((id,slot)=>[slot,id]));
test('default selected Settings reaches the captured lower-right HOME position',()=>{
 const initial=createPortfolioState(), layout=initial.system.layout;
 assert.equal(layout[7],'sound');assert.equal(layout[9],'system-settings');
 assert.equal(new Set(Object.values(layout)).size,Object.values(layout).length);
 const selected=settleHomeNavigation(selectHomeSlot(initial,titleSlot('system-settings')));
 const view=getHomeNavigationView(selected);
 assert.equal(view.currentLeftSlot,4);
 assert.deepEqual([view.slots[titleSlot('sound')].x,view.slots[titleSlot('sound')].y],[160,166]);
 assert.deepEqual([view.slots[titleSlot('system-settings')].x,view.slots[titleSlot('system-settings')].y],[244,166]);
});
test('only the exact previous default migrates its selected Settings viewport and keeps preferences',()=>{
 const saved=JSON.parse(saveSettings(home()));
 saved.layout=previousDefault();saved.homeView.rootView={selectedSlot:8,currentLeftSlot:6,targetLeftSlot:6,density:1};
 saved.theme='blue';saved.volume=.7;
 assert.equal(isPreviousDefaultAppLayout(saved.layout),true);
 const migrated=restoreSettings(createPortfolioState(),JSON.stringify(saved));
 assert.deepEqual(migrated.system.layout,initialAppLayout());
 assert.deepEqual(migrated.system.homeNavigation.rootView,{selectedSlot:9,currentLeftSlot:4,targetLeftSlot:4,density:1});
 assert.equal(getHomeNavigationView(migrated).slots[9].x,244);
 assert.equal(migrated.theme,'blue');assert.equal(migrated.system.volume,.7);
 assert.equal(saveSettings(restoreSettings(createPortfolioState(),saveSettings(migrated))),saveSettings(migrated));
});
test('legacy default selection follows each swapped title identity',()=>{
 const saved=JSON.parse(saveSettings(home()));saved.layout=previousDefault();
 for(const [oldSlot,newSlot] of [[7,11],[8,9],[9,8],[11,7]]){
  saved.homeView.rootView={selectedSlot:oldSlot,currentLeftSlot:6,targetLeftSlot:6,density:1};
  const restored=restoreSettings(createPortfolioState(),JSON.stringify(saved));
  assert.equal(restored.system.homeNavigation.rootView.selectedSlot,newSlot);
  assert.equal(restored.system.layout[newSlot],saved.layout[oldSlot]);
 }
});
test('rearranged titles and folder history keep their saved slots and view',()=>{
 const base=JSON.parse(saveSettings(home()));base.layout=previousDefault();
 base.homeView.rootView={selectedSlot:8,currentLeftSlot:6,targetLeftSlot:6,density:1};
 for(const edit of [
  value=>{[value.layout[0],value.layout[1]]=[value.layout[1],value.layout[0]];},
  value=>{value.folders={40:'Saved'};},
  value=>{value.nextFolderNumber=2;},
 ]){
  const saved=structuredClone(base);edit(saved);
  const restored=restoreSettings(createPortfolioState(),JSON.stringify(saved));
  assert.deepEqual(restored.system.layout,saved.layout);
  assert.deepEqual(restored.system.homeNavigation.rootView,saved.homeView.rootView);
 }
 assert.equal(isPreviousDefaultAppLayout({...previousDefault(),40:'work'}),false);
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

test('foreground modules receive raw press, release, repeat and analog without duplicate navigation',()=>{
 const module=getAppModule('system-settings'),original=module.reduce,seen=[];
 module.reduce=(state,event,context)=>{seen.push(event);return original(state,event,context);};
 try{
  let s=home();s={...s,selected:titleSlot('system-settings')};s=tickSystem(reduceSystem(s,'open',4000),6200);
  s=dispatchSystemEvent(s,{type:'action',id:'other'},6200);
  s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'down',source:'dpad'},6201);
  s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'down',source:'keyboard'},6202);
  assert.equal(getActiveAppView(s).selection,1);
  s=tickSystem(s,6650);assert.equal(getActiveAppView(s).selection,2);
  s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'up',source:'dpad'},6651);
  s=dispatchSystemEvent(s,{type:'button',command:'down',phase:'up',source:'keyboard'},6652);
  s=dispatchSystemEvent(s,{type:'analog',source:'circle',x:.8,y:0},6700);
  assert.deepEqual(seen.filter(e=>e.type==='button').map(e=>e.phase),['down','down','repeat','up','up']);
  assert.equal(seen.find(e=>e.type==='button'&&e.source==='keyboard').activate,false);
  assert.ok(seen.some(e=>e.type==='analog'&&e.x===.8));assert.equal(s.system.input.held.dpad,undefined);
 }finally{module.reduce=original;}
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

test('registry retains portfolio and remaining title identities and excludes keyboard and removed apps',()=>{
 assert.deepEqual(new Set(Object.values(initialAppLayout()).filter(id=>apps.some(app=>app.id===id))),new Set(apps.map(app=>app.id)));
 assert.equal(titleSlot('sound'),7);assert.equal(titleSlot('system-settings'),9);
 for(const id of ['face-raiders','ar-games','activity-log','download-play','mii-maker','streetpass','keyboard']) {
  assert.equal(getAppModule(id),undefined); assert.ok(!Object.values(initialAppLayout()).includes(id));
 }
 assert.equal(getAppModule('sound').descriptor.titleId,'0004001000022500');
 assert.equal(getAppModule('camera').descriptor.titleId,'0004001000022400');
 for(const descriptor of installedTitles){const module=getAppModule(descriptor.id),ctx={now:0,shared:createAppRuntime().shared};assert.equal(module.view(module.create({},null,ctx),ctx).appId,descriptor.id);}
});
test('stock applets preserve a suspended portfolio and HOME resumes it without text entry',()=>{
 let r=startApplication(createAppRuntime(),'work',0);r=dispatchRuntime(r,{type:'command',command:'down'},10);r=showRuntimeHome(r,20);
 r=openApplet(r,'friends','toolbar',{},30);const friends=r.active;
 r=event(r,'profile');r=event(r,'message');r=dispatchRuntime(r,{type:'text',value:'Hello'},40);
 assert.equal(r.active,friends);assert.equal(r.libraryApplet,null);assert.equal(r.shared.settings.nickname,'Player');
 r=event(r,'back');r=event(r,'back');r=event(r,'back');r=resumeRuntimeApplication(r,50);
 assert.equal(activeInstance(r).appId,'work');assert.equal(activeInstance(r).state.item,1);
});
test('nested read-only library applets restore their caller and cannot open keyboard',()=>{
 let r=startApplication(createAppRuntime(),'system-settings',0);r=event(r,'other');r=event(r,'profile');const settings=r.active;
 assert.equal(openApplet(r,'keyboard','nickname',{},1),r);
 r=openApplet(r,'mii-selector','mii',{},2);const selector=r.active;r=openApplet(r,'error','error',{message:'Test'},3);
 r=event(r,'ok');assert.equal(r.active,selector);r=showRuntimeHome(r,4);r=resumeRuntimeApplication(r,5);assert.equal(r.active,selector);
 r=event(r,'back');assert.equal(r.active,settings);assert.equal(activeInstance(r).state.screen,'profile');
});
test('stock lifecycle preserves existing saves and shared data without storage writes',()=>{
 const shared={settings:{nickname:'Ada'},photos:[{id:'old',name:'Saved photo'}],notes:[{slot:0,strokes:[{points:[[1,2]]}]}]},saves={friends:{version:1,data:{message:'Old message'}}};
 let r=createAppRuntime(shared,saves);const original=structuredClone(r.shared);
 for(const descriptor of installedTitles.filter(t=>t.source==='firmware')) {
  r=descriptor.kind==='application'?startApplication(r,descriptor.id,1):openApplet(r,descriptor.id,'preview',{},1);
  r=dispatchRuntime(r,{type:'tick',elapsedMs:1000},2);r=showRuntimeHome(r,3);r=closeApplication(r,4);
 }
 assert.deepEqual(r.shared,original);assert.deepEqual(r.saves,saves);
 assert.ok(!r.effects.some(item=>['storage','capability'].includes(item.effect.type)));
});
test('closing applications clears child applets and releases every owner',()=>{
 let r=startApplication(createAppRuntime(),'camera',0);const application=r.application;r=openApplet(r,'error','test',{},1);const child=r.active;
 r=closeApplication(r,2);assert.deepEqual(r.instances,{});
 for(const owner of [application,child])assert.ok(r.effects.some(e=>e.owner===owner&&e.effect.type==='release-capabilities'));
});
test('late unsolicited capability responses cannot write to stock apps or overlays',()=>{
 let r=startApplication(createAppRuntime(),'camera',0);const owner=r.active;
 const result={type:'capability-result',requestId:'capture',requestToken:1,ok:true,value:{id:'photo',name:'Photo'}};
 assert.equal(deliverCapabilityResult(r,owner,result,1),r);
 for(const next of [showRuntimeHome(r,2),closeApplication(r,2),setRuntimeSleeping(r,true,2)])assert.equal(deliverCapabilityResult(next,owner,result,3),next);
});
test('generic host request tokens still reject superseded, duplicate and resumed completions',()=>{
 // A synthetic module exercises the host guard; production stock apps request no devices.
 const module=getAppModule('camera'),original=module.reduce;
 module.reduce=(state,e)=>e.type==='action'&&e.id==='test-request'?{state,effects:[{type:'capability',capability:'camera',requestId:'test',intent:'user'}]}:e.type==='capability-result'?{state:{...state,count:Number(state.count??0)+1}}:{state};
 try {
  let r=event(startApplication(createAppRuntime(),'camera',0),'test-request'),owner=r.active,first=r.effects.at(-1);
  r=event(r,'test-request');const second=r.effects.at(-1),reply={type:'capability-result',requestId:'test',ok:true};
  assert.equal(isRuntimeEffectCurrent(r,first),false);assert.equal(isRuntimeEffectCurrent(r,second),true);
  assert.equal(deliverCapabilityResult(r,owner,{...reply,requestToken:first.id},2),r);
  r=deliverCapabilityResult(r,owner,{...reply,requestToken:second.id},3);assert.equal(activeInstance(r).state.count,1);
  assert.equal(deliverCapabilityResult(r,owner,{...reply,requestToken:second.id},4),r);
  r=event(r,'test-request');const stale=r.effects.at(-1);r=resumeRuntimeApplication(showRuntimeHome(r,5),6);
  assert.equal(deliverCapabilityResult(r,owner,{...reply,requestToken:stale.id},7),r);
 } finally {module.reduce=original;}
});
test('a module closing itself during suspend is not resurrected as an applet caller',()=>{
 const module=getAppModule('camera'),original=module.reduce;
 module.reduce=(state,e,c)=>e.type==='lifecycle'&&e.phase==='suspend'?{state,effects:[{type:'close'}]}:original(state,e,c);
 try {
  let r=startApplication(createAppRuntime(),'camera',0),owner=r.application;r=showRuntimeHome(r,1);
  assert.equal(r.instances[owner],undefined);assert.equal(r.homeReturn,null);
  r=startApplication(r,'camera',2);r=openApplet(r,'error','test',{},3);
  assert.equal(activeInstance(r).appId,'error');assert.equal(activeInstance(r).caller,null);
 } finally {module.reduce=original;}
});
test('effect acknowledgement consumes only specified effects',()=>{
 let r=startApplication(createAppRuntime(),'work',0),ids=r.effects.map(e=>e.id);r=showRuntimeHome(r,1);const after=acknowledgeEffects(r,ids);
 assert.ok(after.effects.every(e=>!ids.includes(e.id)));assert.ok(after.effects.some(e=>e.effect.type==='release-capabilities'));
});
test('system Settings touches navigate without editing the saved profile',()=>{
 let s={...home(),selected:titleSlot('system-settings')};s=tickSystem(reduceSystem(s,'open',4000),6000);
 s=dispatchSystemEvent(s,{type:'action',id:'other'},6001);s=dispatchSystemEvent(s,{type:'action',id:'profile'},6002);s=dispatchSystemEvent(s,{type:'action',id:'nickname'},6003);
 s=dispatchSystemEvent(s,{type:'text',value:'Changed'},6004);s=dispatchSystemEvent(s,{type:'action',id:'submit'},6005);
 assert.equal(getActiveAppView(s).appId,'system-settings');assert.equal(s.system.runtime.shared.settings.nickname,'Player');assert.equal(s.system.runtime.libraryApplet,null);
});
