import test from 'node:test';
import assert from 'node:assert/strict';
import { createStockModule,initialSharedData,sourceNotificationProfile } from '../src/os/stock-apps.ts';
import { getTitle,stockTitles,getAppModule } from '../src/os/app-registry.ts';
import { portfolioMedia } from '../src/os/portfolio-media.ts';
import { apps } from '../src/os/apps.ts';
import { HEALTH_VBLANK_HZ } from '../src/os/stock-health-scroll.ts';
import { CAMERA_BROWSE_UPDATE_MS, cameraStripOffset } from '../src/os/camera-browse.ts';
import { cameraBrowseCellRect, stockScreenTargets } from '../src/os/stock-screen-layout.ts';
import { createAppRuntime,startApplication,dispatchRuntime,showRuntimeHome,resumeRuntimeApplication,closeApplication,activeInstance,setRuntimeSleeping } from '../src/os/app-host.ts';
const ctx={now:0,shared:initialSharedData()};
const media={folders:[{id:'test',title:'Test fixture',photos:[{id:'a',title:'A',src:'/fixture/a.jpg'},{id:'b',title:'B',src:'/fixture/b.jpg'}]}],tracks:[{id:'a',title:'A',src:'/fixture/a.mp3',duration:100},{id:'b',title:'B',src:'/fixture/b.mp3',duration:200},{id:'c',title:'C',src:'/fixture/c.mp3',duration:300}]};
// Gallery tests enter after the five-page welcome route. Dedicated tests below cover cold entry.
const setup=(id,data=media)=>{const module=createStockModule(getTitle(id),data);let state=module.create({},null,ctx);if(id==='camera')for(let page=0;page<5;page++)state=module.reduce(state,{type:'action',id:'guide-next'},ctx).state;return{module,state};};
const action=(module,state,id,value)=>module.reduce(state,{type:'action',id,value},ctx);

test('dated Camera fixture keeps the native date cell before two selectable photos',()=>{
 const dated={folders:[{id:'hni',title:'View Photos/Videos',photos:[1,2].map(number=>({id:`HNI_000${number}`,title:`HNI_000${number}`,src:`/fixture/${number}.jpg`,capturedAt:'2026-09-25T22:19:00'}))}],tracks:[]};
 const {module,state}=setup('camera',dated);
 const gallery=action(module,state,'folder:hni').state;
 assert.deepEqual(module.view(gallery,ctx).rows.map(item=>item.id),['camera-date-group','photo:HNI_0001','photo:HNI_0002']);
 assert.equal(gallery.selection,1);
 assert.equal(module.view(gallery,ctx).rows[0].label,'2026-09-25');
 const second=module.reduce(gallery,{type:'command',command:'right'},ctx).state;
 assert.equal(second.selection,2);
 assert.equal(action(module,second,'photo:HNI_0002').state.photoId,'HNI_0002');
});

test('isolated Notifications profile opens with the source order and eight unread rows',()=>{
 const shared=initialSharedData(),before=structuredClone(shared.notifications);
 assert.deepEqual(shared.notifications,sourceNotificationProfile);
 const module=createStockModule(getTitle('notifications')),state=module.create({},null,{now:0,shared});
 const view=module.view(state,{now:0,shared});
 assert.deepEqual(view.rows.slice(0,4).map(({label,value})=>[label,value]),[
  ['HOME Menu Settings',''],['Touching and Sliding','New'],['Sleep Mode','New'],['HOME Menu Functionality','New'],
 ]);
 assert.equal(view.rows.filter(row=>row.value==='New').length,8);
 assert.equal(view.footer.right,undefined);
 assert.equal(view.data.selectionActive,false,'settled native list enters without a tinted row');
 const focused=module.reduce(state,{type:'command',command:'down'},{now:0,shared}).state;
 assert.equal(module.view(focused,{now:0,shared}).data.selectionActive,true);
 assert.deepEqual(module.reduce(state,{type:'action',id:'news053'},{now:0,shared}).state,state);
 assert.deepEqual(shared.notifications,before,'opening remains read-only');
});

test('Health enters with no highlighted precaution button',()=>{
 const {module,state}=setup('health-safety');
 assert.equal(state.selectionActive,false);
 assert.equal(module.view(state,ctx).data.selectionActive,false);
 const focused=module.reduce(state,{type:'command',command:'up'},ctx).state;
 assert.equal(focused.selection,0);
 assert.equal(module.view(focused,ctx).data.selectionActive,true);
});

test('Settings cold entry is visually unfocused but A retains the Internet target',()=>{
 const {module,state}=setup('system-settings');
 assert.equal(state.selection,0);
 assert.equal(module.view(state,ctx).data.selectionActive,false);
 assert.equal(module.reduce(state,{type:'command',command:'open'},ctx).state.screen,'internet');
 const focused=module.reduce(state,{type:'command',command:'left'},ctx).state;
 assert.equal(focused.selection,0);
 assert.equal(module.view(focused,ctx).data.selectionActive,true);
});

test('Data and Internet enter without yellow Select; first D-pad restores focus',()=>{
 const {module,state}=setup('system-settings');
 for(const screen of ['data','internet']){
  const entered=action(module,state,screen).state;
  assert.equal(entered.screen,screen);
  assert.equal(entered.selection,0);
  assert.equal(entered.selectionActive,false);
  assert.equal(module.view(entered,ctx).data.selectionActive,false);
  const focused=module.reduce(entered,{type:'command',command:'up'},ctx).state;
  assert.equal(focused.selection,0);
  assert.equal(focused.selectionActive,true);
  assert.equal(module.view(focused,ctx).data.selectionActive,true);
 }
});

test('Reset blocked-user settings is Invalid and inert when the list is empty',()=>{
 const {module,state}=setup('system-settings');
 const data=action(module,state,'data').state;
 const row=module.view(data,ctx).rows.find(item=>item.id==='blocked-users');
 assert.equal(row.disabled,true);
 assert.deepEqual(action(module,data,'blocked-users'),{state:data});
 const focused=module.reduce(data,{type:'command',command:'down'},ctx).state;
 const onReset=module.reduce(focused,{type:'command',command:'down'},ctx).state;
 assert.equal(module.view(onReset,ctx).rows[onReset.selection].id,'blocked-users');
 assert.equal(module.reduce(onReset,{type:'command',command:'open'},ctx).state,onReset);
 assert.equal(module.view(onReset,ctx).footer.right,undefined);
});

test('Back from Nintendo 3DS restores Data focus on that tile',()=>{
 const {module,state}=setup('system-settings');
 const data=action(module,state,'data').state;
 const child=action(module,data,'data-3ds').state;
 const back=action(module,child,'back').state;
 assert.equal(back.screen,'data');
 assert.equal(module.view(back,ctx).rows[back.selection].id,'data-3ds');
 assert.equal(back.selectionActive,true);
});

test('production gallery exactly reuses existing unique portfolio images and songs are not invented',()=>{
 const expected=[...new Set(apps.flatMap(app=>app.entries.flatMap(entry=>entry.images??[])))];
 assert.deepEqual(portfolioMedia.folders.flatMap(folder=>folder.photos.map(photo=>photo.src)),expected);
 assert.equal(expected.length,5);assert.deepEqual(portfolioMedia.tracks,[]);
 for(const folder of portfolioMedia.folders)assert.ok(apps.some(app=>app.entries.some(entry=>entry.title===folder.title)));
});
test('Camera View Photos route presents the five existing portfolio images in one native six-cell page',()=>{
 for(const id of ['camera','camera-applet']){
  const {module,state}=setup(id,portfolioMedia);
  const entry=module.view(state,ctx).rows[0];
  assert.equal(entry.label,'View Photos/Videos');
  const gallery=action(module,state,entry.id).state,view=module.view(gallery,ctx);
  assert.equal(gallery.screen,'gallery');assert.equal(view.rows.length,6);
  assert.equal(view.rows[0].id,'camera-date-group');assert.equal(view.footer.right?.action,'photo:'+portfolioMedia.folders[0].photos[0].id);
  assert.deepEqual(view.data.photos.map(photo=>photo.src),portfolioMedia.folders.flatMap(folder=>folder.photos.map(photo=>photo.src)));
  assert.deepEqual(stockScreenTargets(view).filter(target=>target.row!==undefined).map(target=>target.row),[0,1,2,3,4,5]);
  assert.equal(action(module,gallery,'camera-date-group').state,gallery,'undated source group is display-only');
  assert.ok(module.view(action(module,gallery,'back').state,ctx).rows.some(row=>row.id==='folder:buildings'),'project folders remain reachable');
 }
});
test('read-only gallery navigates folders/photos and returns through parent screens',()=>{
 let {module,state}=setup('camera');assert.equal(module.view(state,ctx).rows[0].id,'folder:test');
 state=action(module,state,'folder:test').state;state=action(module,state,'photo:a').state;assert.equal(module.view(state,ctx).data.photo.src,'/fixture/a.jpg');
 state=action(module,state,'next').state;assert.equal(state.photoId,'b');state=action(module,state,'next').state;assert.equal(state.photoId,'a');
 state=action(module,state,'previous').state;assert.equal(state.photoId,'b');state=action(module,state,'back').state;assert.equal(state.screen,'gallery');
 state=action(module,state,'back').state;assert.equal(state.screen,'main');assert.deepEqual(action(module,state,'capture'),{state});
});
test('Camera gallery advances through padded pages and paints moving source cell positions',()=>{
 const photos=Array.from({length:7},(_,index)=>({id:String(index),title:String(index),src:`/fixture/${index}.jpg`}));
 let {module,state}=setup('camera',{folders:[{id:'seven',title:'Seven',photos}],tracks:[]});
 state=action(module,state,'folder:seven').state;
 for(let i=0;i<6;i++)state=module.reduce(state,{type:'command',command:'right'},ctx).state;
 assert.equal(state.selection,6);
 let view=module.view(state,ctx),targets=stockScreenTargets(view);
 assert.equal(cameraStripOffset(view.data.cameraBrowse.output),0,'input commits before child slider update');
 assert.equal(targets.some(item=>item.row===6),false);
 state=module.reduce(state,{type:'tick',elapsedMs:CAMERA_BROWSE_UPDATE_MS*5},ctx).state;
 view=module.view(state,ctx);targets=stockScreenTargets(view);
 const offset=cameraStripOffset(view.data.cameraBrowse.output),cell=cameraBrowseCellRect(6,offset);
 assert.ok(offset>0&&offset<86);
 assert.ok(targets.some(item=>item.row===6&&item.x===Math.max(46,cell[0])));
 const tapped=module.reduce(state,{type:'touch',phase:'up',x:targets.find(item=>item.row===6).x+5,y:74},ctx).state;
 assert.deepEqual([tapped.screen,tapped.photoId],['photo','6']);
 state=module.reduce(state,{type:'tick',elapsedMs:CAMERA_BROWSE_UPDATE_MS*25},ctx).state;
 assert.equal(cameraStripOffset(module.view(state,ctx).data.cameraBrowse.output),86);
 const held=module.reduce(state,{type:'button',command:'right',phase:'down',source:'pad'},ctx).state;
 assert.equal(held.selection,7,'the final page has padded blank slots');
 assert.equal(module.view(held,ctx).footer.right,undefined);
 assert.equal(module.reduce(held,{type:'action',id:'photo:missing'},ctx).state,held);
 const cancelled=module.reduce(held,{type:'lifecycle',phase:'suspend'},ctx).state;
 assert.deepEqual(cancelled.cameraBrowse.held,{});
});
test('native-layout touch targets open Settings and gallery entries directly',()=>{
 let {module,state}=setup('system-settings');state=module.reduce(state,{type:'touch',phase:'up',x:200,y:160},ctx).state;assert.equal(state.screen,'other');
 ({module,state}=setup('camera'));state=module.reduce(state,{type:'touch',phase:'up',x:84,y:74},ctx).state;assert.equal(state.folderId,'test');
 state=module.reduce(state,{type:'touch',phase:'up',x:84,y:74},ctx).state;assert.equal(state.photoId,'a');
});
test('touching the opened photo cannot activate removed arrows; physical navigation and Back remain',()=>{
 for(const id of ['camera','camera-applet']){
  let {module,state}=setup(id);
  state=action(module,state,'folder:test').state;state=action(module,state,'photo:a').state;
  for(const [x,y] of [[32,115],[287,115]])for(const phase of ['down','move','up']){
   const out=module.reduce(state,{type:'touch',phase,x,y},ctx);
   assert.equal(out.state,state);assert.equal(out.effects,undefined);
  }
  state=module.reduce(state,{type:'command',command:'right'},ctx).state;assert.equal(state.photoId,'b');
  state=module.reduce(state,{type:'command',command:'left'},ctx).state;assert.equal(state.photoId,'a');
  state=module.reduce(state,{type:'touch',phase:'up',x:75,y:227},ctx).state;assert.equal(state.screen,'gallery');
 }
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
 assert.deepEqual(out.effects,[{type:'music',command:'load',trackId:'a',revision:1,src:'/fixture/a.mp3',position:0},{type:'music',command:'play',trackId:'a',revision:1,src:'/fixture/a.mp3',position:0}]);
 out=action(module,state,'play');state=out.state;assert.equal(state.playing,false);assert.equal(out.effects[0].command,'pause');assert.equal(state.revision,2);
 out=action(module,state,'play');state=out.state;assert.equal(out.effects[0].src,'/fixture/a.mp3');assert.equal(out.effects[0].position,0);out=action(module,state,'seek',500);assert.equal(out.state.position,100);assert.equal(out.effects[0].command,'seek');
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
  const current=activeInstance(runtime).state;runtime=dispatchRuntime(runtime,{type:'action',id:'music-time',value:{trackId:current.trackId,revision:current.revision,position:42}},1.5);
  runtime=showRuntimeHome(runtime,2);assert.equal(runtime.instances[runtime.application].state.playing,false);assert.equal(runtime.effects.at(-2).effect.command,'pause');
  runtime=resumeRuntimeApplication(runtime,3);assert.equal(activeInstance(runtime).state.playing,false);
  runtime=dispatchRuntime(runtime,{type:'action',id:'play'},4);assert.deepEqual(runtime.effects.at(-1).effect,{type:'music',command:'play',trackId:'a',revision:3,src:'/fixture/a.mp3',position:42});runtime=setRuntimeSleeping(runtime,true,5);assert.equal(activeInstance(runtime).state.playing,false);
  runtime=setRuntimeSleeping(runtime,false,6);runtime=dispatchRuntime(runtime,{type:'action',id:'play'},7);const before=runtime.effectSequence;
  runtime=closeApplication(runtime,8);assert.ok(runtime.effects.some(e=>e.id>before&&e.effect.type==='music'&&e.effect.command==='pause'));assert.deepEqual(runtime.instances,{});
 } finally {Object.assign(registered,original);}
});
test('single playback-mode control cycles the four source loop icons and stays inert without a track',()=>{
 let {module,state}=setup('sound');assert.equal(action(module,state,'mode').state,state);
 state=action(module,state,'track:a').state;
 const modes=[];for(let i=0;i<5;i++){modes.push([state.repeat,state.shuffle,module.view(state,ctx).rows.find(r=>r.id==='mode').value]);state=action(module,state,'mode').state;}
 assert.deepEqual(modes,[['off',false,'no-loop'],['all',false,'folder'],['one',false,'single'],['off',true,'random'],['off',false,'no-loop']]);
 assert.deepEqual(module.view(state,ctx).rows.map(r=>r.id),['play','previous','next','mode']);
 // Touching the source CB-MiniP0 panel and pressing the transport reach the same actions.
 state=module.reduce(state,{type:'touch',phase:'up',x:275,y:224},ctx).state;assert.equal(state.repeat,'one');
 const paused=module.reduce(state,{type:'touch',phase:'up',x:160,y:208},ctx);assert.equal(paused.state.playing,false);assert.equal(paused.effects[0].command,'pause');
 const sought=module.reduce(action(module,paused.state,'play').state,{type:'touch',phase:'up',x:90,y:159},ctx);assert.equal(sought.state.position,25);assert.equal(sought.effects[0].command,'seek');
});
test('the source Could-not-play dialog blocks transport until OK, B or the shared Back closes it',()=>{
 let {module,state}=setup('sound');state=action(module,state,'track:a').state;
 state=action(module,state,'music-error',{trackId:'a',revision:state.revision}).state;
 const view=module.view(state,ctx);assert.equal(state.mediaError,true);assert.equal(state.playing,false);assert.deepEqual(view.text,['Could not play.']);assert.deepEqual(view.footer.right,{label:'OK',action:'error-ok'});
 for(const id of ['play','next','previous','mode','seek'])assert.equal(action(module,state,id,id==='seek'?10:undefined).state,state);
 for(const [x,y] of [[160,232],[275,224],[45,225],[160,159]])assert.equal(module.reduce(state,{type:'touch',phase:'up',x,y},ctx).state,state);
 assert.equal(module.reduce(state,{type:'touch',phase:'up',x:160,y:204},ctx).state.mediaError,false);
 const viaB=module.reduce(state,{type:'button',command:'back',phase:'down'},ctx).state;assert.equal(viaB.mediaError,false);assert.equal(viaB.screen,'playback');assert.equal(viaB.trackId,'a');
 const viaA=module.reduce(state,{type:'button',command:'open',phase:'down'},ctx).state;assert.equal(viaA.mediaError,false);assert.equal(viaA.playing,false);
 const resumed=action(module,viaA,'play');assert.equal(resumed.state.mediaError,false);assert.equal(resumed.effects[0].command,'play');
});
test('empty media and injected saved screens never create hidden playback/capture state',()=>{
 for(const id of ['camera','sound']){const {module}=setup(id,{folders:[],tracks:[]});const state=module.create({screen:'record',playing:true},{screen:'playback',playing:true},ctx);assert.equal(state.screen,'guide');assert.equal(module.view(state,ctx).rows.length,0);assert.equal(action(module,state,'play').state,state);}
});

test('Camera folder directions follow three columns and bound incomplete rows',()=>{
 const photos=Array.from({length:8},(_,i)=>({id:String(i),title:String(i),src:`/fixture/${i}.jpg`}));
 const folders=photos.map(photo=>({id:photo.id,title:photo.title,photos}));
 for(const id of ['camera','camera-applet'])for(const screen of ['main']){
  const {module}=setup(id,{folders,tracks:[]});let state={...module.create({},null,ctx),screen,folderId:'0'};
  const move=command=>{state=module.reduce(state,{type:'command',command},ctx).state;return state.selection;};
  assert.equal(move('left'),0);assert.equal(move('up'),0);assert.equal(move('right'),1);assert.equal(move('right'),2);assert.equal(move('right'),2);
  assert.equal(move('down'),5);assert.equal(move('down'),8); // the primary View Photos entry adds a ninth source-grid cell
  assert.equal(move('down'),8);assert.equal(move('right'),8);assert.equal(move('left'),7);assert.equal(move('left'),6);assert.equal(move('up'),3);assert.equal(move('up'),0);
  state=module.reduce(state,{type:'button',command:'right',phase:'down',source:'pad'},ctx).state;assert.equal(state.selection,1);
  const released=module.reduce(state,{type:'button',command:'right',phase:'up',source:'pad'},ctx).state;assert.equal(released,state);
  const opened=module.reduce(state,{type:'command',command:'open'},ctx).state;
  assert.equal(opened[screen==='main'?'folderId':'photoId'],'0');
 }
});
test('Notes directions follow the displayed four-by-four grid without wrapping edges',()=>{
 for(const id of ['game-notes','memo']){
  let {module,state}=setup(id);const move=command=>{state=module.reduce(state,{type:'command',command},ctx).state;return state.selection;};
  assert.equal(move('right'),1);assert.equal(move('down'),5);assert.equal(move('down'),9);assert.equal(move('down'),13);assert.equal(move('down'),13);
  assert.equal(move('right'),14);assert.equal(move('right'),15);assert.equal(move('right'),15);assert.equal(move('up'),11);assert.equal(move('left'),10);
  state=module.reduce(state,{type:'command',command:'open'},ctx).state;assert.equal(state.slot,10);
 }
});
test('Settings directions follow tile geometry and its full-width NNID bar',()=>{
 let {module,state}=setup('system-settings');const move=command=>{state=module.reduce(state,{type:'command',command},ctx).state;return module.view(state,ctx).rows[state.selection].id;};
 assert.equal(move('left'),'internet');assert.equal(move('right'),'parental');assert.equal(move('down'),'other');assert.equal(move('down'),'other');
 assert.equal(move('left'),'data');assert.equal(move('up'),'internet');assert.equal(move('up'),'nnid');assert.equal(move('up'),'nnid');assert.equal(move('right'),'nnid');assert.equal(move('down'),'internet');
});
test('photo and playback left/right still browse media instead of moving row selection',()=>{
 let {module,state}=setup('camera');state=action(module,state,'folder:test').state;state=action(module,state,'photo:a').state;
 state=module.reduce(state,{type:'command',command:'right'},ctx).state;assert.equal(state.photoId,'b');assert.equal(state.selection,0);
 ({module,state}=setup('sound'));state=action(module,state,'track:a').state;
 state=module.reduce(state,{type:'command',command:'right'},ctx).state;assert.equal(state.trackId,'b');assert.equal(state.selection,0);
 state=module.reduce(state,{type:'command',command:'left'},ctx).state;assert.equal(state.trackId,'a');
});

test('Health articles scroll continuously through the replayed VBlank input model',()=>{
 const {module}=setup('health-safety');const main=module.create({},null,ctx);const frame=1000/HEALTH_VBLANK_HZ;
 const tick=(state,count=1)=>{for(let i=0;i<count;i++)state=module.reduce(state,{type:'tick',elapsedMs:frame},ctx).state;return state;};
 const article=state=>module.view(state,ctx).data.article;
 const touch=(state,phase,x,y)=>module.reduce(state,{type:'touch',phase,x,y},ctx).state;
 assert.deepEqual(module.view(main,ctx).rows.map(({id,label})=>[id,label]),[['3d','3D Display Precautions'],['general','General Precautions'],['usage','Usage Precautions']]);
 let state=action(module,main,'general').state;
 assert.deepEqual(article(state),{paneY:0,thumbY:77,selectFrame:0});
 assert.deepEqual(module.view(state,ctx).footer,{left:{label:'Back',action:'back'}},'no pagination controls remain');
 assert.equal(module.view(state,ctx).data.scroll,undefined,'the private input model is not part of the view');
 state=module.reduce(state,{type:'button',command:'down',phase:'down',source:'keyboard:ArrowDown'},ctx).state;
 state=tick(state,3);assert.equal(article(state).paneY,12,'held Down moves 4px per update from the press update');
 state=module.reduce(state,{type:'button',command:'down',phase:'repeat',source:'keyboard:ArrowDown'},ctx).state;
 state=module.reduce(state,{type:'button',command:'down',phase:'up',source:'keyboard:ArrowDown'},ctx).state;
 state=tick(state,3);assert.equal(article(state).paneY,12,'host repeats are ignored and release stops the key');
 state=module.reduce(state,{type:'command',command:'down'},ctx).state;state=tick(state,3);assert.equal(article(state).paneY,16,'a discrete command is one update');
 for(const command of ['left','right','open'])assert.equal(module.reduce(state,{type:'command',command},ctx).state,state);
 state=touch(state,'down',150,120);state=tick(state,2);
 for(const y of [110,100,90]){state=touch(state,'move',150,y);state=tick(state);}
 assert.equal(article(state).paneY,46,'the article follows the stylus 1:1');
 state=touch(state,'up',150,90);state=tick(state);assert.equal(article(state).paneY,56,'release reapplies the last drag delta');
 state=tick(state,30);assert.ok(Math.abs(article(state).paneY-(46+111.9746551513672))<1e-3,'inertia coasts as replayed from a 10px release, then stops');
 assert.equal(tick(state,5).scroll.touch.state,0);
 state=touch(state,'down',308,Math.round(120-article(state).thumbY));state=tick(state);assert.equal(article(state).selectFrame,0);
 state=touch(state,'move',308,239);state=tick(state);assert.equal(article(state).selectFrame,1,'SlideBar_Select reaches frame 1 one update after the press');
 assert.equal(article(state).thumbY,-77);assert.equal(article(state).paneY,6846,'the thumb maps travel to the full extent');
 state=touch(state,'up',308,239);state=tick(state,3);assert.equal(article(state).selectFrame,0);
 state=touch(state,'down',150,150);state=tick(state,2);state=touch(state,'move',150,226);state=tick(state);state=touch(state,'up',150,226);
 assert.equal(state.screen,'document','a drag released over Back does not activate it');
 state=tick(state,120);const settled=article(state).paneY;
 state=module.reduce(state,{type:'button',command:'up',phase:'down',source:'dpad'},ctx).state;state=tick(state,2);
 assert.equal(article(state).paneY,settled-8);
 state=module.reduce(state,{type:'lifecycle',phase:'suspend'},ctx).state;
 assert.equal(article(tick(state,10)).paneY,settled-8,'suspension releases the held key');
 state=touch(state,'down',160,226);state=touch(state,'up',160,226);assert.equal(state.screen,'main','the full-width Back bar returns to the menu');
 assert.equal(state.scroll,undefined,'closing the article discards its controls');
 state=action(module,state,'usage').state;assert.deepEqual(article(state),{paneY:0,thumbY:77,selectFrame:0});
 assert.equal(module.reduce(state,{type:'command',command:'back'},ctx).state.screen,'main');
 assert.equal(action(module,main,'privacy').state,main);assert.equal(action(module,main,'next').state,main);
});

test('Browser native menu destinations are read-only and preserve existing URL/bookmark/history data',()=>{
 const context={now:0,shared:{...initialSharedData(),browser:{bookmarks:[{title:'Saved',url:'https://example.com'}],history:[{title:'Earlier',url:'https://example.org'}]}}};
 const {module}=setup('browser'),main=module.create({}, {url:'https://saved.example'},context),before=structuredClone(context.shared);
 assert.deepEqual(module.view(main,context).rows.map(({id,label})=>[id,label]),[['search','Enter search text'],['bookmarks','Bookmarks'],['add-bookmark','Add'],['settings','Settings'],['page-info','Page Info'],['address','Enter URL']]);
 for(const row of module.view(main,context).rows){
  const result=module.reduce(main,{type:'action',id:row.id},context);assert.equal(result.state.screen,row.id);assert.deepEqual(result.effects??[],[]);
  assert.equal(module.reduce(result.state,{type:'text',value:'Changed'},context).state,result.state);
  assert.equal(module.reduce(result.state,{type:'command',command:'back'},context).state.screen,'main');
 }
 assert.equal(module.save(main).url,'https://saved.example');assert.deepEqual(context.shared,before);
});
test('Miiverse source toolbar rows open local details without remote/account effects',()=>{
 const {module,state}=setup('miiverse');const view=module.view(state,ctx);
 assert.deepEqual(view.rows.map(({id,label})=>[id,label]),[['communities','Communities'],['activity','Activity Feed'],['profile','My Menu'],['notifications','Notifications']]);
 for(const row of view.rows){const out=action(module,state,row.id);assert.equal(out.state.screen,'detail');assert.equal(out.state.field,row.id);assert.deepEqual(out.effects??[],[]);assert.equal(action(module,out.state,'back').state.screen,'main');}
});

test('Settings exposes source-labelled Internet/Data/Profile branches and returns to immediate parents',()=>{
 const {module}=setup('system-settings'),main=module.create({},null,ctx);
 const cases=[
  [['internet'],['connections','spotpass','ds-connections','internet-info']],
  [['internet','connections'],['connection-1','connection-2','connection-3','new-connection']],
  [['data'],['data-3ds','data-dsi','streetpass','blocked-users']],
  [['data','data-3ds'],['software','extra-data','add-on-content','backup']],
  [['other','profile'],['nickname','birthday','region','ds-profile']],
  [['other','clock'],['date','time']],
 ];
 for(const [path,ids] of cases){
  let state=main;for(const id of path)state=action(module,state,id).state;
  assert.deepEqual(module.view(state,ctx).rows.map(row=>row.id),ids);
  const back=module.reduce(state,{type:'command',command:'back'},ctx).state;
  assert.equal(back.screen,path.length===1?'main':path.at(-2));
  assert.equal(module.view(back,ctx).rows[back.selection].id,path.at(-2)==='other'?'profile':path.at(-1));
 }
});
test('Data Management Software and Extra Data are read-only accessible-empty-SD leaves',()=>{
 const {module}=setup('system-settings'),before=structuredClone(ctx.shared);
 let menu=module.create({},null,ctx);for(const id of ['data','data-3ds'])menu=action(module,menu,id).state;
 for(const [id,text] of [['software','There is no accessible software data.'],['extra-data','There is no extra data.']]){
  const out=action(module,menu,id),view=module.view(out.state,ctx);
  assert.equal(out.state.screen,'detail');assert.equal(view.data.field,id);assert.equal(view.data.parent,'data-3ds');
  assert.deepEqual(view.rows,[]);assert.deepEqual(view.text,[text]);assert.equal(view.footer.left.action,'back');
  const open=module.reduce(out.state,{type:'command',command:'open'},ctx);
  assert.deepEqual(open.effects??[],[]);assert.deepEqual(open.state,out.state);
  const back=module.reduce(out.state,{type:'command',command:'back'},ctx);
  assert.deepEqual(back.effects??[],[]);assert.equal(back.state.screen,'data-3ds');
  assert.equal(module.view(back.state,ctx).rows[back.state.selection].id,id);
 }
 assert.deepEqual(ctx.shared,before);
});
test('Parental Set follows source explanation and PIN notice without entering configuration',()=>{
 const {module}=setup('system-settings'),before=structuredClone(ctx.shared);
 let state=action(module,module.create({},null,ctx),'parental').state;
 assert.deepEqual(module.view(state,ctx).rows.map(row=>[row.id,row.label]),[['next','Set'],['back','Back']]);
 state=action(module,state,'next').state;assert.equal(state.screen,'parental-explain');
 assert.deepEqual(module.view(state,ctx).rows.map(row=>[row.id,row.label]),[['next','Next'],['back','Back']]);
 const explanation=state;
 state=module.reduce(state,{type:'command',command:'open'},ctx).state;assert.equal(state.screen,'parental-pin-notice');
 assert.deepEqual(module.view(state,ctx).rows.map(row=>[row.id,row.label]),[['back','OK']]);
 assert.ok(module.view(state,ctx).text[0].includes('master key'));
 for(const id of ['next','set','change-pin','restrictions','submit','rating'])assert.deepEqual(action(module,state,id),{state});
 // A/source OK is a documented portfolio dismissal boundary, never PIN setup.
 const dismiss=module.reduce(state,{type:'command',command:'open'},ctx);
 assert.deepEqual(dismiss.effects??[],[]);assert.deepEqual(dismiss.state,explanation);
 const back=module.reduce(state,{type:'command',command:'back'},ctx);
 assert.deepEqual(back.state,explanation);assert.deepEqual(back.effects??[],[]);
 const intro=action(module,explanation,'back').state;
 assert.equal(intro.screen,'parental');assert.equal(module.view(intro,ctx).rows[intro.selection].label,'Set');
 assert.deepEqual(module.save(state),{});assert.deepEqual(ctx.shared,before);
});
test('Other Settings pages bound directions and restore source focus after Profile and Date & Time Back',()=>{
 const {module}=setup('system-settings');let state=action(module,module.create({},null,ctx),'other').state;
 const expected=[['profile','clock','touch'],['calibration-3d','sound','mic'],['outer-cameras','circle-pad','transfer'],['language','update','format']];
 assert.equal(module.reduce(state,{type:'command',command:'left'},ctx).state,state);
 for(let page=0;page<4;page++){
  const view=module.view(state,ctx);assert.equal(view.data.page,page);assert.equal(view.data.pageCount,4);assert.deepEqual(view.rows.map(row=>row.id),expected[page]);
  for(const row of view.rows){
   const result=action(module,state,row.id);
   if(['transfer','update'].includes(row.id)){assert.equal(result.effects[0].type,'launch');continue;}
   const back=action(module,result.state,'back').state;assert.equal(back.screen,'other');assert.equal(back.page,page);
   if(page===0&&['profile','clock'].includes(row.id)){
    assert.equal(back.selection,0);assert.equal(back.selectionActive,false);
    const down=module.reduce(back,{type:'command',command:'down'},ctx).state;
    assert.equal(module.view(down,ctx).rows[down.selection].id,'clock');assert.equal(down.selectionActive,true);
   }else assert.equal(module.view(back,ctx).rows[back.selection].id,row.id);
  }
  const next=module.reduce(state,{type:'command',command:'right'},ctx).state;
  if(page===3)assert.equal(next,state);else assert.equal(next.page,page+1);state=next;
 }
 state=action(module,state,'settings-previous').state;assert.equal(state.page,2);
 state=action(module,state,'settings-page-0').state;assert.equal(state.page,0);
 state=action(module,state,'settings-page-3').state;assert.equal(state.page,3);
 assert.equal(action(module,state,'settings-page-4').state,state);
 assert.equal(action(module,state,'back').state.screen,'main');
});
test('Language is a read-only leaf that passes the configured English value and returns to Other page 4',()=>{
 const {module}=setup('system-settings'),before=structuredClone(ctx.shared);
 let state=action(module,module.create({},null,ctx),'other').state;
 for(let page=0;page<3;page++)state=action(module,state,'settings-next').state;
 const leaf=action(module,state,'language').state,view=module.view(leaf,ctx);
 assert.equal(view.screen,'detail');assert.equal(view.data.field,'language');assert.equal(view.data.parent,'other');
 assert.equal(view.data.settings.language,'English');assert.deepEqual(view.text,['English']);
 assert.deepEqual(view.rows,[]);assert.equal(view.footer.left.action,'back');assert.equal(view.footer.right,undefined);
 assert.equal(module.reduce(leaf,{type:'text',value:'Deutsch'},ctx).state,leaf);
 const back=action(module,leaf,'back').state;assert.equal(back.screen,'other');assert.equal(back.page,3);
 assert.equal(module.view(back,ctx).rows[back.selection].id,'language');assert.deepEqual(ctx.shared,before);
});
test('Language arrow touches reveal all eight rows without changing locale and clamp at both ends',()=>{
 const {module}=setup('system-settings'),before=structuredClone(ctx.shared);
 let state={screen:'detail',field:'language',parent:'other',page:3,selection:0};
 assert.equal(action(module,state,'language-up').state,state);
 for(let top=1;top<=4;top++){
  const out=module.reduce(state,{type:'touch',phase:'up',x:304,y:185},ctx);
  assert.equal(out.state.languageTop,top-1);assert.equal(out.effects,undefined);state=module.reduce(out.state,{type:'tick',elapsedMs:50},ctx).state;assert.equal(state.languageTop,top);
  assert.equal(module.view(state,ctx).data.settings.language,'English');
 }
 assert.equal(action(module,state,'language-down').state,state);
 for(const phase of ['down','move','cancel'])assert.equal(module.reduce(state,{type:'touch',phase,x:304,y:17},ctx).state,state);
 for(let top=3;top>=0;top--){state=module.reduce(state,{type:'touch',phase:'up',x:304,y:17},ctx).state;state=module.reduce(state,{type:'tick',elapsedMs:50},ctx).state;assert.equal(state.languageTop,top);}
 assert.equal(action(module,state,'language-up').state,state);
 for(const id of ['eu_german','language-select','ok'])assert.equal(action(module,state,id).state,state);
 const parent=action(module,state,'back').state;assert.equal(parent.screen,'other');assert.equal(parent.page,3);
 assert.equal(action(module,parent,'language-down').state,parent);
 const reopened=action(module,parent,'language').state;assert.equal(reopened.languageTop,undefined);
 assert.deepEqual(module.save(state),{});assert.deepEqual(ctx.shared,before);
});
test('Settings leaves expose only supplied values and every reachable detail has readable content',()=>{
 const {module}=setup('system-settings'),context={now:0,shared:{...initialSharedData(),settings:{nickname:'Ada',birthday:'14 March',region:'United Kingdom',language:'English',sound:'Mono'}}},before=structuredClone(context.shared);
 const run=(state,id)=>module.reduce(state,{type:'action',id},context);
 const main=module.create({},null,context),other=run(main,'other').state,profile=run(other,'profile').state;
 for(const field of ['nickname','birthday','region']){
  const state=run(profile,field).state;assert.deepEqual(module.view(state,context).text,[context.shared.settings[field]]);
  assert.equal(module.reduce(state,{type:'text',value:'Changed'},context).state,state);
 }
 const queue=[main],seen=new Set();
 while(queue.length){
  const state=queue.shift(),key=JSON.stringify(state);if(seen.has(key))continue;seen.add(key);assert.ok(seen.size<160);
  const view=module.view(state,context);
  if(state.screen==='detail')assert.ok(view.text.some(text=>text.trim()),String(state.field));
  for(const id of [...view.rows.map(row=>row.id),'settings-next','settings-previous','back']){
   const result=run(state,id);assert.ok((result.effects??[]).every(effect=>['launch','home'].includes(effect.type)));
   if(result.state!==state)queue.push(result.state);
  }
 }
 assert.deepEqual(context.shared,before);assert.ok(seen.size>45);
 const emptyContext={now:0,shared:{settings:{}}},leaf=run(profile,'nickname').state;
 assert.deepEqual(module.view(leaf,emptyContext).text,['Not set in this portfolio.']);
});

test('Data Management directions follow the two upper tiles then the full-width rows',()=>{
 const {module}=setup('system-settings');let state=action(module,module.create({},null,ctx),'data').state;
 const move=command=>{state=module.reduce(state,{type:'command',command},ctx).state;return module.view(state,ctx).rows[state.selection].id;};
 assert.equal(move('right'),'data-dsi');assert.equal(move('right'),'data-dsi');assert.equal(move('down'),'streetpass');assert.equal(move('down'),'blocked-users');assert.equal(move('up'),'streetpass');assert.equal(move('up'),'data-3ds');
});

test('Friend profile is a read-only card and retains existing nickname/message without opening editors',()=>{
 const {module}=setup('friends'),context={now:0,shared:{...initialSharedData(),settings:{nickname:'Ada'}}};
 let state=module.create({}, {message:'Existing status',miiId:'existing'},context);
 state=module.reduce(state,{type:'action',id:'profile'},context).state;
 const view=module.view(state,context);assert.equal(view.screen,'profile');assert.deepEqual(view.rows,[]);assert.equal(view.footer.right,undefined);
 assert.equal(view.data.settings.nickname,'Ada');assert.equal(view.data.message,'Existing status');
 for(const id of ['name','message','edit','register','favorite'])assert.equal(module.reduce(state,{type:'action',id},context).state,state);
 assert.equal(module.reduce(state,{type:'text',value:'Changed'},context).state,state);
 const result=module.reduce(state,{type:'command',command:'back'},context);assert.equal(result.state.screen,'main');assert.deepEqual(result.effects??[],[]);
 assert.deepEqual(module.save(result.state),{message:'Existing status',miiId:'existing'});
});

test('selected notes preserve saved strokes and return to the selected grid cell without editing effects',()=>{
 const strokes=[{color:'red',points:[[20,40],[30,60]]}],context={now:0,shared:{...initialSharedData(),notes:[{slot:15,strokes}]}},before=structuredClone(context.shared);
 const {module}=setup('game-notes');let state=module.create({},null,context);
 state=module.reduce(state,{type:'action',id:'15'},context).state;
 assert.equal(state.screen,'drawing');assert.deepEqual(module.view(state,context).data.strokes,strokes);
 for(const id of ['black','red','blue','eraser','clear','export','save'])assert.deepEqual(module.reduce(state,{type:'action',id},context),{state});
 for(const phase of ['down','move','up'])assert.deepEqual(module.reduce(state,{type:'touch',phase,x:160,y:100},context),{state});
 const result=module.reduce(state,{type:'command',command:'back'},context);assert.equal(result.state.screen,'main');assert.equal(result.state.selection,15);assert.deepEqual(result.effects??[],[]);assert.deepEqual(context.shared,before);
});

test('Browser settings expose read-only pages and restore the selected option on Back',()=>{
 const {module}=setup('browser'),main=module.create({}, {url:'https://saved.example'},ctx);
 let state=action(module,main,'settings').state;
 const ids=['auto-wrap','search-engine','delete-cookies','clear-history','network','proxy','version','reset'];
 assert.deepEqual(module.view(state,ctx).rows.map(row=>row.id),ids);
 for(let i=0;i<ids.length;i++){
  const view=module.view({...state,selection:i},ctx);assert.equal(view.data.page,Math.floor(i/4));assert.equal(view.data.pageCount,2);
  const detail=action(module,state,ids[i]);assert.equal(detail.state.screen,'detail');assert.equal(detail.state.field,ids[i]);assert.deepEqual(detail.effects??[],[]);
  assert.ok(module.view(detail.state,ctx).text[0]);
  const back=action(module,detail.state,'back').state;assert.equal(back.screen,'settings');assert.equal(back.selection,i);assert.equal(back.url,main.url);
  assert.deepEqual(action(module,detail.state,'confirm'),{state:detail.state});
 }
 for(let i=0;i<4;i++)state=module.reduce(state,{type:'command',command:'down'},ctx).state;
 assert.equal(module.view(state,ctx).data.page,1);
 assert.equal(action(module,state,'back').state.screen,'main');
});
test('Browser saved entries expose only existing context and Back restores the bookmark/history list',()=>{
 const {module}=setup('browser'),context={now:0,shared:{...initialSharedData(),browser:{bookmarks:[{title:'Saved title',url:'https://saved.example'},{title:'Second',url:'https://second.example'}],history:[{title:'Earlier',url:'https://earlier.example'}]}}},before=structuredClone(context.shared);
 for(const parent of ['bookmarks','history']){
  const initial={...module.create({}, {url:'https://existing.example'},context),screen:parent};
  const index=parent==='bookmarks'?1:0;
  const page=module.reduce(initial,{type:'action',id:String(index)},context);
  assert.deepEqual(page.effects??[],[]);assert.equal(page.state.screen,'page');assert.equal(page.state.url,'https://existing.example');
  assert.deepEqual(module.view(page.state,context).data.entry,context.shared.browser[parent][index]);
  assert.ok(module.view(page.state,context).text.includes(context.shared.browser[parent][index].url));
  const back=module.reduce(page.state,{type:'command',command:'back'},context).state;assert.equal(back.screen,parent);assert.equal(back.selection,index);
 }
 assert.deepEqual(context.shared,before);
});
test('Browser empty and unavailable interiors always provide visible content without actions or data changes',()=>{
 const {module}=setup('browser'),main=module.create({},null,ctx),before=structuredClone(ctx.shared);
 for(const id of ['bookmarks','search','address','page-info','add-bookmark']){
  const result=action(module,main,id);assert.deepEqual(result.effects??[],[]);assert.ok(module.view(result.state,ctx).text.some(text=>text.trim()));
  assert.deepEqual(module.view(result.state,ctx).rows,[]);assert.equal(module.reduce(result.state,{type:'text',value:'changed'},ctx).state,result.state);
  assert.equal(action(module,result.state,'submit').state,result.state);
 }
 assert.deepEqual(ctx.shared,before);assert.deepEqual(module.save(main),{url:''});
});

test('helper initial and one-step views always have readable content and only read-only navigation',()=>{
 const ids=['nnid-settings','system-updater','system-transfer','amiibo-settings','extrapad','manual','mii-selector','photo-selector','sound-selector'];
 const before=structuredClone(ctx.shared);
 for(const id of ids){
  const {module,state}=setup(id),main=module.view(state,ctx);assert.ok(main.text.some(text=>text.trim()),id);assert.equal(main.data.readOnly,true);
  if(id==='nnid-settings'||id==='system-updater'){
   assert.deepEqual(main.rows,[]);assert.equal(main.footer.right,undefined);
   for(const actionId of ['sign-in','create','information','update','confirm'])assert.deepEqual(action(module,state,actionId),{state});
  }
  for(const [index,row] of main.rows.entries()){
   const detail=action(module,state,row.id);assert.deepEqual(detail.effects??[],[]);assert.ok(module.view(detail.state,ctx).text.some(text=>text.trim()),id+':'+row.id);
   for(const actionId of ['confirm','submit','connect','update','format','delete','scan'])assert.deepEqual(action(module,detail.state,actionId),{state:detail.state});
   assert.deepEqual(module.reduce(detail.state,{type:'text',value:'Changed'},ctx),{state:detail.state});
   const back=action(module,detail.state,'back');assert.equal(back.state.screen,'main');assert.equal(back.state.selection,index);assert.deepEqual(back.effects??[],[]);
  }
 }
 assert.deepEqual(ctx.shared,before);
});
test('selectors project existing item identity without fabricating media, choosing a result, or editing',()=>{
 const context={now:0,shared:{...initialSharedData(),miis:[{id:'m',name:'Existing Mii',secret:'not projected'}],photos:[{id:'p',title:'Existing Photo',src:'unloaded.jpg'}],sounds:[{id:'s',name:'Existing Sound',src:'unplayed.mp3'}]}},before=structuredClone(context.shared);
 for(const [id,expected] of [['mii-selector',{id:'m',name:'Existing Mii'}],['photo-selector',{id:'p',title:'Existing Photo'}],['sound-selector',{id:'s',name:'Existing Sound'}]]){
  const {module}=setup(id);const initial=module.create({},null,context),main=module.view(initial,context);assert.equal(main.rows.length,1);
  const result=module.reduce(initial,{type:'action',id:'0'},context);assert.deepEqual(result.effects??[],[]);
  const view=module.view(result.state,context);assert.deepEqual(view.data.entry,expected);assert.ok(view.text[0]);assert.deepEqual(view.rows,[]);
  assert.deepEqual(module.reduce(result.state,{type:'action',id:'select'},context),{state:result.state});
  const missing=module.view({...result.state,field:'99'},context);assert.equal(missing.data.entry,null);assert.ok(missing.text[0]);
 }
 assert.deepEqual(context.shared,before);
});

test('Helper module main Back delegates navigation to its host',()=>{
 // The pure module emits home; app-host restores a retained Settings caller.
 // The integrated parent/page contract is covered in settings-helper-return.test.mjs.
 for(const id of ['nnid-settings','system-updater','system-transfer']){
  const {module,state}=setup(id);assert.deepEqual(action(module,state,'back'),{state,effects:[{type:'home'}]});
 }
});

test('Parental intro and explanation footers follow their horizontal Back and forward arrangement',()=>{
 for(const screen of ['parental','parental-explain']){
 const {module}=setup('system-settings');let state={screen,selection:0};
 assert.equal(module.view(state,ctx).rows[0].label,screen==='parental'?'Set':'Next');
 const move=command=>{state=module.reduce(state,{type:'command',command},ctx).state;return module.view(state,ctx).rows[state.selection].id;};
 assert.equal(move('left'),'back');assert.equal(move('up'),'back');assert.equal(move('right'),'next');assert.equal(move('down'),'next');
 }
});


test('Sound SD-absent entry is read-only and its disabled Back does not exit',()=>{
 const {module,state:created}=setup('sound',{folders:[],tracks:[]});
 const state={...created,screen:'main'};
 const view=module.view(state,ctx);
 assert.deepEqual(view.footer,{});
 assert.deepEqual(view.text,['No songs available.']);
 for(const id of ['record','streetpass','settings','open','add','back']){
  const result=action(module,state,id);assert.equal(result.state,state);assert.equal(result.effects,undefined);
 }
});

test('Sound welcome uses three source pages and enters the empty Record & Edit Sounds screen',()=>{
 const {module,state:initial}=setup('sound',{folders:[],tracks:[]});
 assert.equal(initial.screen,'guide');assert.equal(initial.guidePage,0);
 let state=module.reduce(initial,{type:'command',command:'open'},ctx).state;
 assert.equal(state.guidePage,1);assert.deepEqual(module.view(state,ctx).footer,{left:{label:'Back',action:'back'},right:{label:'Next',action:'guide-next'}});
 state=module.reduce(state,{type:'command',command:'back'},ctx).state;assert.equal(state.guidePage,0);
 state=module.reduce(state,{type:'touch',phase:'up',x:200,y:205},ctx).state;assert.equal(state.guidePage,1);
 state=module.reduce(state,{type:'command',command:'open'},ctx).state;assert.equal(state.guidePage,2);
 assert.equal(module.view(state,ctx).footer.right.label,'OK');
 state=module.reduce(state,{type:'command',command:'open'},ctx).state;assert.equal(state.screen,'main');
 assert.deepEqual(module.view(state,ctx).footer,{});assert.deepEqual(module.view(state,ctx).text,['No songs available.']);
});


test('Camera welcome follows five source pages before entering read-only folders',()=>{
 const module=createStockModule(getTitle('camera'),media);
 let state=module.create({},null,ctx);
 assert.equal(state.screen,'guide');assert.equal(state.guidePage,0);
 assert.equal(module.view(state,ctx).footer.left,undefined);
 assert.equal(module.reduce(state,{type:'command',command:'back'},ctx).state.guidePage,0);
 state=module.reduce(state,{type:'touch',phase:'up',x:160,y:204},ctx).state;
 assert.equal(state.guidePage,1);
 state=module.reduce(state,{type:'touch',phase:'up',x:112,y:204},ctx).state;
 assert.equal(state.guidePage,0);
 for(let i=0;i<4;i++)state=module.reduce(state,{type:'command',command:'open'},ctx).state;
 assert.equal(state.guidePage,4);assert.equal(module.view(state,ctx).footer.right.label,'OK');
 assert.equal(module.reduce(state,{type:'action',id:'shoot'},ctx).state,state);
 const sleeping=module.reduce(state,{type:'lifecycle',phase:'sleep'},ctx).state;
 assert.equal(sleeping.guidePage,4);
 state=module.reduce(state,{type:'touch',phase:'up',x:208,y:204},ctx).state;
 assert.equal(state.screen,'main');assert.equal(state.guidePage,undefined);
 assert.equal(module.view(state,ctx).rows[0].id,'folder:test');
 assert.deepEqual(module.save(state),{},'native first-run save semantics remain unported');
 assert.equal(module.create({},module.save(state),ctx).screen,'guide');
 const applet=createStockModule(getTitle('camera-applet'),media);
 assert.equal(applet.create({},null,ctx).screen,'main','Camera helper is not the application welcome owner');
});
