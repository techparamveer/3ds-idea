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
test('empty media and injected saved screens never create hidden playback/capture state',()=>{
 for(const id of ['camera','sound']){const {module}=setup(id,{folders:[],tracks:[]});const state=module.create({screen:'record',playing:true},{screen:'playback',playing:true},ctx);assert.equal(state.screen,'main');assert.equal(module.view(state,ctx).rows.length,0);assert.equal(action(module,state,'play').state,state);}
});

test('Camera directions follow three columns across pages and bound incomplete rows',()=>{
 const photos=Array.from({length:8},(_,i)=>({id:String(i),title:String(i),src:`/fixture/${i}.jpg`}));
 const folders=photos.map(photo=>({id:photo.id,title:photo.title,photos}));
 for(const id of ['camera','camera-applet'])for(const screen of ['main','gallery']){
  const {module}=setup(id,{folders,tracks:[]});let state={...module.create({},null,ctx),screen,folderId:'0'};
  const move=command=>{state=module.reduce(state,{type:'command',command},ctx).state;return state.selection;};
  assert.equal(move('left'),0);assert.equal(move('up'),0);assert.equal(move('right'),1);assert.equal(move('right'),2);assert.equal(move('right'),2);
  assert.equal(move('down'),5);assert.equal(move('down'),7); // closest cell in the partial third row, on the next page
  assert.equal(move('down'),7);assert.equal(move('right'),7);assert.equal(move('left'),6);assert.equal(move('left'),6);assert.equal(move('up'),3);assert.equal(move('up'),0);
  state=module.reduce(state,{type:'button',command:'right',phase:'down',source:'pad'},ctx).state;assert.equal(state.selection,1);
  const released=module.reduce(state,{type:'button',command:'right',phase:'up',source:'pad'},ctx).state;assert.equal(released,state);
  const opened=module.reduce(state,{type:'command',command:'open'},ctx).state;
  assert.equal(opened[screen==='main'?'folderId':'photoId'],'1');
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

test('Health exposes the native article labels and bounded pagination for every topic',()=>{
 const {module}=setup('health-safety');const main=module.create({},null,ctx);
 assert.deepEqual(module.view(main,ctx).rows.map(({id,label})=>[id,label]),[['3d','3D Display Precautions'],['general','General Precautions'],['usage','Usage Precautions']]);
 for(const [topic,count] of [['3d',12],['general',44],['usage',27]]){
  let state=action(module,main,topic).state;assert.equal(state.page,0);assert.equal(module.view(state,ctx).data.pageCount,count);
  assert.equal(action(module,state,'previous').state,state);assert.equal(module.view(state,ctx).footer.left.action,'back');
  state=module.reduce(state,{type:'touch',phase:'up',x:250,y:225},ctx).state;assert.equal(state.page,1);
  state=module.reduce(state,{type:'command',command:'left'},ctx).state;assert.equal(state.page,0);
  for(let page=1;page<count;page++){state=module.reduce(state,{type:'command',command:'right'},ctx).state;assert.equal(state.page,page);}
  assert.equal(action(module,state,'next').state,state);assert.equal(module.view(state,ctx).footer.right.action,'back');assert.equal(module.view(state,ctx).footer.right.label,'Done');
  state=module.reduce(state,{type:'touch',phase:'up',x:50,y:225},ctx).state;assert.equal(state.page,count-2);
  assert.equal(module.reduce(state,{type:'command',command:'back'},ctx).state.screen,'main');
 }
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
  assert.equal(module.view(back,ctx).rows[back.selection].id,path.at(-1));
 }
});
test('Parental intro explores restrictions without creating a configured profile or PIN flow',()=>{
 const {module}=setup('system-settings');let state=action(module,module.create({},null,ctx),'parental').state;
 assert.deepEqual(module.view(state,ctx).rows.map(row=>row.id),['next','back']);assert.ok(module.view(state,ctx).text.length);
 state=action(module,state,'next').state;assert.equal(state.screen,'restrictions');assert.equal(module.view(state,ctx).rows.length,11);
 for(const row of module.view(state,ctx).rows){
  const detail=action(module,state,row.id);assert.deepEqual(detail.effects??[],[]);assert.equal(detail.state.screen,'detail');
  assert.ok(module.view(detail.state,ctx).text[0]);assert.equal(action(module,detail.state,'back').state.screen,'restrictions');
 }
 assert.equal(action(module,state,'back').state.screen,'parental');
 assert.equal(action(module,state,'change-pin').state,state);assert.deepEqual(module.save(state),{});
});
test('Other Settings pages bound directions and preserve page plus selection after leaf Back',()=>{
 const {module}=setup('system-settings');let state=action(module,module.create({},null,ctx),'other').state;
 const expected=[['profile','clock','touch'],['sound','mic','calibration-3d'],['outer-cameras','circle-pad','transfer'],['language','update','format']];
 assert.equal(module.reduce(state,{type:'command',command:'left'},ctx).state,state);
 for(let page=0;page<4;page++){
  const view=module.view(state,ctx);assert.equal(view.data.page,page);assert.equal(view.data.pageCount,4);assert.deepEqual(view.rows.map(row=>row.id),expected[page]);
  for(const row of view.rows){
   const result=action(module,state,row.id);
   if(['transfer','update'].includes(row.id)){assert.equal(result.effects[0].type,'launch');continue;}
   const back=action(module,result.state,'back').state;assert.equal(back.screen,'other');assert.equal(back.page,page);assert.equal(module.view(back,ctx).rows[back.selection].id,row.id);
  }
  const next=module.reduce(state,{type:'command',command:'right'},ctx).state;
  if(page===3)assert.equal(next,state);else assert.equal(next.page,page+1);state=next;
 }
 state=action(module,state,'settings-previous').state;assert.equal(state.page,2);
 assert.equal(action(module,state,'back').state.screen,'main');
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
