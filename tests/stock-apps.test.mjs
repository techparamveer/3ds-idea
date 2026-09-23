import test from 'node:test';
import assert from 'node:assert/strict';
import { createStockModule,initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle,stockTitles,getAppModule } from '../src/os/app-registry.ts';
import { portfolioMedia } from '../src/os/portfolio-media.ts';
import { apps } from '../src/os/apps.ts';
import { createAppRuntime,startApplication,dispatchRuntime,showRuntimeHome,resumeRuntimeApplication,closeApplication,activeInstance,setRuntimeSleeping } from '../src/os/app-host.ts';
const ctx={now:0,shared:initialSharedData()};
const media={folders:[{id:'test',title:'Test fixture',photos:[{id:'a',title:'A',src:'/fixture/a.jpg'},{id:'b',title:'B',src:'/fixture/b.jpg'}]}],tracks:[{id:'a',title:'A',src:'/fixture/a.mp3',duration:100},{id:'b',title:'B',src:'/fixture/b.mp3',duration:200},{id:'c',title:'C',src:'/fixture/c.mp3',duration:300}]};
const setup=(id,data=media)=>{const module=createStockModule(getTitle(id),data);return{module,state:module.create({},null,ctx)};};
const action=(module,state,id,value)=>module.reduce(state,{type:'action',id,value},ctx);

test('production gallery exactly reuses existing unique portfolio images and songs are not invented',()=>{
 const expected=[...new Set(apps.flatMap(app=>app.entries.flatMap(entry=>entry.images??[])))];
 assert.deepEqual(portfolioMedia.folders.flatMap(folder=>folder.photos.map(photo=>photo.src)),expected);
 assert.equal(expected.length,5);assert.deepEqual(portfolioMedia.tracks,[]);
 for(const folder of portfolioMedia.folders)assert.ok(apps.some(app=>app.entries.some(entry=>entry.title===folder.title)));
});
test('read-only gallery navigates folders/photos and returns through parent screens',()=>{
 let {module,state}=setup('camera');assert.equal(module.view(state,ctx).rows[0].id,'folder:test');
 state=action(module,state,'folder:test').state;state=action(module,state,'photo:a').state;assert.equal(module.view(state,ctx).data.photo.src,'/fixture/a.jpg');
 state=action(module,state,'next').state;assert.equal(state.photoId,'b');state=action(module,state,'next').state;assert.equal(state.photoId,'a');
 state=action(module,state,'previous').state;assert.equal(state.photoId,'b');state=action(module,state,'back').state;assert.equal(state.screen,'gallery');
 state=action(module,state,'back').state;assert.equal(state.screen,'main');assert.deepEqual(action(module,state,'capture'),{state});
});
test('native-layout touch targets open Settings and gallery entries directly',()=>{
 let {module,state}=setup('system-settings');state=module.reduce(state,{type:'touch',phase:'up',x:200,y:160},ctx).state;assert.equal(state.screen,'other');
 ({module,state}=setup('camera'));state=module.reduce(state,{type:'touch',phase:'up',x:50,y:60},ctx).state;assert.equal(state.folderId,'test');
 state=module.reduce(state,{type:'touch',phase:'up',x:50,y:60},ctx).state;assert.equal(state.photoId,'a');
});
test('all stock screen actions remain navigation only, without text/media/save side effects',()=>{
 const forbidden=new Set(['capability','shared','save','invoke','link']);
 const shared={...initialSharedData(),settings:{nickname:'Ada'},notes:[{slot:0,strokes:[{points:[[1,2]]}]}],notifications:[{id:'n',title:'Old notice',message:'Saved text'}]};
 const context={now:1,shared},before=structuredClone(shared);
 for(const descriptor of stockTitles) {
  const module=createStockModule(descriptor,{folders:[],tracks:[]}),queue=[module.create({},null,context)],seen=new Set();
  while(queue.length){const state=queue.shift(),key=JSON.stringify(state);if(seen.has(key))continue;seen.add(key);assert.ok(seen.size<100);
   const view=module.view(state,context);
   for(const id of [...view.rows.map(row=>row.id),'capture','preview','import','record-start','record-stop','rename','delete','submit','key:a','address','register','bookmark','clear-history','back']) {
    const out=module.reduce(state,{type:'action',id,value:'Changed'},context);assert.ok(!(out.effects??[]).some(effect=>forbidden.has(effect.type)),descriptor.id+':'+id);
    if(out.state!==state)queue.push(out.state);
   }
   for(const event of [{type:'text',value:'Changed'},{type:'applet-result',requestId:'nickname',value:'Changed',cancelled:false},{type:'capability-result',requestId:'capture',requestToken:1,ok:true,value:{id:'x',name:'X'}}])assert.deepEqual(module.reduce(state,event,context),{state});
  }
 }
 assert.deepEqual(shared,before);
});
test('notes display existing strokes without drawing or saving and notifications remain unread',()=>{
 const context={now:0,shared:{...initialSharedData(),notes:[{slot:0,strokes:[{points:[[1,2]]}]}],notifications:[{id:'a',title:'A',message:'Existing',read:false}]}};
 const module=createStockModule(getTitle('game-notes'));let state=module.create({},null,context);
 state=module.reduce(state,{type:'action',id:'0'},context).state;const before=structuredClone(state);
 for(const phase of ['down','move','up'])state=module.reduce(state,{type:'touch',phase,x:160,y:100},context).state;
 assert.deepEqual(state,before);assert.deepEqual(module.reduce(state,{type:'lifecycle',phase:'close'},context),{state});
 const notifications=createStockModule(getTitle('notifications'));state=notifications.create({},null,context);state=notifications.reduce(state,{type:'action',id:'a'},context).state;
 assert.equal(notifications.view(state,context).text[0],'Existing');assert.equal(context.shared.notifications[0].read,false);
});
test('music selection emits ordered load/play and pause/play/seek use a fresh revision',()=>{
 let {module,state}=setup('sound'),out=action(module,state,'track:a');state=out.state;
 assert.deepEqual(out.effects,[{type:'music',command:'load',trackId:'a',revision:1,src:'/fixture/a.mp3',position:0},{type:'music',command:'play',trackId:'a',revision:1}]);
 out=action(module,state,'play');state=out.state;assert.equal(state.playing,false);assert.equal(out.effects[0].command,'pause');assert.equal(state.revision,2);
 state=action(module,state,'play').state;out=action(module,state,'seek',500);assert.equal(out.state.position,100);assert.equal(out.effects[0].command,'seek');
 assert.equal(action(module,out.state,'seek',NaN).state,out.state);
});
test('music progress accepts only the current track/revision and stale ended/error cannot change tracks',()=>{
 let {module,state}=setup('sound');state=action(module,state,'track:a').state;const old={trackId:'a',revision:state.revision};state=action(module,state,'track:b').state;
 // Selection is only offered from main; next switches the playback track.
 state=action(module,state,'next').state;
 for(const id of ['music-time','music-ended','music-error'])assert.equal(action(module,state,id,{...old,position:88,duration:100}).state,state);
 state=action(module,state,'music-time',{trackId:state.trackId,revision:state.revision,position:42,duration:202}).state;assert.equal(state.position,42);assert.equal(state.duration,202);
 const paused=action(module,state,'play').state;assert.equal(action(module,paused,'music-time',{trackId:paused.trackId,revision:paused.revision,position:99}).state,paused);
});
test('music end/repeat/previous/next/shuffle traverse a deterministic queue without skips',()=>{
 let {module,state}=setup('sound');state=action(module,state,'track:c').state;let out=action(module,state,'music-ended',{trackId:'c',revision:state.revision});assert.equal(out.state.playing,false);assert.equal(out.state.trackId,'c');
 const restarted=action(module,out.state,'play');assert.equal(restarted.state.position,0);assert.equal(restarted.effects[0].command,'load');
 state=action(module,state,'repeat').state;out=action(module,state,'music-ended',{trackId:'c',revision:state.revision});state=out.state;assert.equal(state.trackId,'a');assert.equal(state.playing,true);
 state=action(module,state,'repeat').state;state=action(module,state,'music-ended',{trackId:'a',revision:state.revision}).state;assert.equal(state.trackId,'a');assert.equal(state.position,0);
 state=action(module,state,'shuffle').state;const visited=[];for(let i=0;i<3;i++){visited.push(state.trackId);state=action(module,state,'next').state;}assert.equal(new Set(visited).size,3);assert.equal(state.trackId,visited[0]);
 state=action(module,state,'previous').state;assert.equal(state.trackId,visited[2]);
});
test('music lifecycle pauses without resuming automatically; close pause survives host closing guard',()=>{
 const registered=getAppModule('sound'),original={...registered};Object.assign(registered,createStockModule(getTitle('sound'),media));
 try {
  let runtime=startApplication(createAppRuntime(),'sound',0);runtime=dispatchRuntime(runtime,{type:'action',id:'track:a'},1);
  runtime=showRuntimeHome(runtime,2);assert.equal(runtime.instances[runtime.application].state.playing,false);assert.equal(runtime.effects.at(-2).effect.command,'pause');
  runtime=resumeRuntimeApplication(runtime,3);assert.equal(activeInstance(runtime).state.playing,false);
  runtime=dispatchRuntime(runtime,{type:'action',id:'play'},4);runtime=setRuntimeSleeping(runtime,true,5);assert.equal(activeInstance(runtime).state.playing,false);
  runtime=setRuntimeSleeping(runtime,false,6);runtime=dispatchRuntime(runtime,{type:'action',id:'play'},7);const before=runtime.effectSequence;
  runtime=closeApplication(runtime,8);assert.ok(runtime.effects.some(e=>e.id>before&&e.effect.type==='music'&&e.effect.command==='pause'));assert.deepEqual(runtime.instances,{});
 } finally {Object.assign(registered,original);}
});
test('empty media and injected saved screens never create hidden playback/capture state',()=>{
 for(const id of ['camera','sound']){const {module}=setup(id,{folders:[],tracks:[]});const state=module.create({screen:'record',playing:true},{screen:'playback',playing:true},ctx);assert.equal(state.screen,'main');assert.equal(module.view(state,ctx).rows.length,0);assert.equal(action(module,state,'play').state,state);}
});
