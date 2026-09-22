import test from 'node:test';
import assert from 'node:assert/strict';
import { apps } from '../src/os/apps.ts';
import { installedTitles, getAppModule, initialAppLayout } from '../src/os/app-registry.ts';
import { createAppRuntime, startApplication, openApplet, dispatchRuntime, activeInstance, runtimeView, showRuntimeHome, resumeRuntimeApplication, closeApplication, deliverCapabilityResult, setRuntimeSleeping, acknowledgeEffects } from '../src/os/app-host.ts';
import { createPortfolioState, tickSystem, reduceSystem, touchSystem, dispatchSystemEvent, getActiveAppView, restoreSettings } from '../src/os/system.ts';
import { createInputLatch, latchInput, repeatInput } from '../src/os/app-input.ts';
const event=(r,id,value)=>dispatchRuntime(r,{type:'action',id,value},1000);
const home=()=>tickSystem(createPortfolioState(),3001);
test('registry preserves portfolio positions, distinguishes applets, and excludes AR/Face games',()=>{
 assert.deepEqual(Object.values(initialAppLayout()).slice(0,8),apps.map(app=>app.id));
 assert.ok(installedTitles.some(t=>t.id==='camera-applet'&&t.kind==='system-applet'));
 assert.ok(installedTitles.some(t=>t.id==='keyboard'&&t.kind==='library-applet'));
 assert.ok(!installedTitles.some(t=>/face-raiders|ar-games/.test(t.id)));
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
 let r=startApplication(createAppRuntime(),'mii-maker',0);r=event(r,'new');r=event(r,'name');const keyboard=r.active;
 r=dispatchRuntime(r,{type:'text',value:'Ada'},1);r=openApplet(r,'error','error',{message:'Test'},2);
 r=event(r,'ok');assert.equal(r.active,keyboard);assert.equal(activeInstance(r).state.draft,'Ada');
 r=showRuntimeHome(r,3);r=resumeRuntimeApplication(r,4);assert.equal(r.active,keyboard);
 r=event(r,'submit');assert.equal(activeInstance(r).appId,'mii-maker');assert.equal(activeInstance(r).state.fields.name,'Ada');
 r=event(r,'save');assert.equal(r.shared.miis[0].name,'Ada');assert.ok(r.effects.some(e=>e.effect.type==='storage'&&e.effect.key==='@shared'));
});
test('closing an application clears child applets and emits capability release for every instance',()=>{
 let r=startApplication(createAppRuntime(),'camera',0);r=event(r,'preview');const application=r.application;
 r=openApplet(r,'keyboard','name',{},1);const keyboard=r.active;
 r=closeApplication(r,2);assert.deepEqual(r.instances,{});assert.equal(r.application,null);
 for(const owner of [application,keyboard])assert.ok(r.effects.some(e=>e.owner===owner&&e.effect.type==='release-capabilities'));
});
test('late capability responses cannot write to closed, suspended or sleeping apps',()=>{
 let r=startApplication(createAppRuntime(),'camera',0);const owner=r.active,result={type:'capability-result',requestId:'capture',ok:true,value:{id:'photo',name:'Private photo'}};
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
test('effect acknowledgement is selective and preserves newly queued effects',()=>{
 let r=startApplication(createAppRuntime(),'camera',0);const ids=r.effects.map(e=>e.id);r=event(r,'preview');const after=acknowledgeEffects(r,ids);
 assert.ok(after.effects.every(e=>!ids.includes(e.id)));assert.ok(after.effects.some(e=>e.effect.type==='capability'));
});
