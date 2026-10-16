import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {closeApplication,createAppRuntime,dispatchRuntime,resumeRuntimeApplication,runtimeView,showRuntimeHome,startApplication} from '../src/os/app-host.ts';
import {portfolioMedia} from '../src/os/portfolio-media.ts';

// Real Camera reducer, runtime owners, stock presentation and native Camera painter.
// Only the native asset loader, Image and canvas are fakes; nothing is fetched.
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const calls=[];
globalThis.__cameraLifecycleLoad=()=>{let resolve;const pending=new Promise(r=>{resolve=r;});calls.push({resolve});return pending;};
const session=url(compile('native-title-session').replace("'./native-title-assets'",JSON.stringify(url('export const loadNativeTitleAssets=(...args)=>globalThis.__cameraLifecycleLoad(...args)'))));
const browse=new URL('../src/os/camera-browse.ts',import.meta.url).href;
const layout=url(compile('stock-screen-layout')
 .replace("'./camera-browse.ts'",JSON.stringify(browse))
 .replace("'./stock-manual-index.ts'",JSON.stringify(url('export const manualPageZeroAvailable=()=>false;'))));
const camera=url(compile('stock-native-camera').replace("'./stock-screen-layout'",JSON.stringify(layout)).replace("'./camera-browse.ts'",JSON.stringify(browse)).replace("'./native-layout'",JSON.stringify(url(compile('native-layout')))));
let source=compile('stock-screen-presentation').replace("'./native-text-diagnostics'",JSON.stringify(new URL("../src/os/native-text-diagnostics.ts",import.meta.url).href)).replace("'./stock-settings-hud'",JSON.stringify(url(compile('stock-settings-hud').replace("'./device-status-profile.ts'",JSON.stringify(url(compile('device-status-profile'))))))).replace("'./stock-health-scroll'",JSON.stringify(url(compile('stock-health-scroll')))).replace("'./native-title-session'",JSON.stringify(session)).replace("'./stock-native-camera'",JSON.stringify(camera)).replace("'./stock-screen-layout'",JSON.stringify(layout));
source=source.replace("'./applet-title-entry-assets'",JSON.stringify(new URL('../src/os/applet-title-entry-assets.ts',import.meta.url).href));
source=source.replace("'./notes-footer-close-assets'",JSON.stringify(new URL('../src/os/notes-footer-close-assets.ts',import.meta.url).href));
source=source.replace("'./notifications-footer-close-assets'",JSON.stringify(new URL('../src/os/notifications-footer-close-assets.ts',import.meta.url).href));
source=source.replace("'./manual-footer-close-assets'",JSON.stringify(new URL('../src/os/manual-footer-close-assets.ts',import.meta.url).href));
for(const [file,packs,draw]of [['settings','settingsScreenPacks','drawNativeSettingsMain'],['sound','soundScreenPacks','drawNativeSoundFrame'],['health','healthScreenPacks','drawNativeHealthFrame']])source=source.replace(`'./stock-native-${file}'`,JSON.stringify(url(`export const ${packs}=[];export const ${draw}=()=>false;${file==='sound'?'export const soundHudTimeKey=()=>null;':''}`)));
source=source.replace("'./stock-native-personal-tools'",JSON.stringify(url('export const nativePersonalToolView=()=>null;export const drawNativePersonalToolFrame=()=>false;export const notificationReceiveLampPaintKey=()=>null;export const notificationsHudClock=()=>null;export const notesHudClock=()=>null;')));
source=source.replace("'./stock-native-web'",JSON.stringify(url('export const browserScreenPacks=[],miiverseScreenPacks=[];export const drawNativeWebFrame=()=>false;export const browserHudClock=()=>null;')));
source=source.replace("'./stock-native-services'",JSON.stringify(url('export const nativeServiceView=()=>null;export const drawNativeServiceFrame=()=>false;export const zoneClock=()=>({hour:"00",minute:"00",frame:0});export const eshopHudClock=()=>({hour:"00",minute:"00",frame:0});export const eshopWelcomePose=()=>null;')));
source=source.replace("'./stock-native-helpers'",JSON.stringify(url('export const nativeHelperView=()=>null;export const drawNativeHelperFrame=()=>false;')));
source=source.replace("'./stock-native-selectors'",JSON.stringify(url('export const nativeSelectorView=()=>null;export const drawNativeSelectorFrame=()=>false;')));
source=source.replace("'./native-screen-input'",JSON.stringify(url(compile('native-screen-input'))));
source=source.replace("'./notes-boot-cover'",JSON.stringify(new URL('../src/os/notes-boot-cover.ts',import.meta.url).href));
const {createStockScreenPresentation}=await import(url(source));
const messages=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/msg-EU_English.json',import.meta.url),'utf8'));
const gallery=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json',import.meta.url),'utf8'));
const flush=()=>new Promise(resolve=>setImmediate(resolve));

const images=[];
class FakeImage{
 constructor(){this.onload=null;this.onerror=null;this.complete=false;this.naturalWidth=0;this.naturalHeight=0;this.url='';images.push(this);}
 set src(value){this.url=value;this.complete=false;this.naturalWidth=this.naturalHeight=0;}
 get src(){return this.url;}
}
/** Completes every live request for a URL; released requests have an empty URL. */
function load(src){for(const image of images)if(image.url===src&&!image.complete){image.complete=true;image.naturalWidth=640;image.naturalHeight=480;image.onload?.();}}
function surface(canvas){
 return {canvas,marks:[],copies:[],pixelReads:0,fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,globalCompositeOperation:'source-over',
  getContextAttributes(){return {willReadFrequently:canvas.contextRequests?.[0]?.args[1]?.willReadFrequently??false};},
  getImageData(){this.pixelReads++;throw new Error('Unexpected pixel read in stock presentation');},
  resetTransform(){},clearRect(){this.marks=[];},fillRect(){this.marks.push(['fill',this.fillStyle]);},strokeRect(){},fillText(){},
  beginPath(){},roundRect(){},rect(){},clip(){},save(){},restore(){},fill(){},stroke(){},createLinearGradient:()=>({addColorStop(){}}),
  drawImage(image,...rect){this.copies.push({image,rect});if(image instanceof FakeImage)this.marks.push(['photo',image.src,...rect]);else this.marks=structuredClone(image.ctx.marks);}};
}
function nativeAssets(){
 let active=false;const renderCalls=[];
 return {diagnostics:[],renderCalls,disposals:0,dispose(){this.disposals++;},renderer:{packs:{'camera-messages':messages,'camera-gallery':gallery},beginTextDiagnostic(){active=true;},endTextDiagnostic(){if(!active)return null;active=false;return Object.freeze({draws:Object.freeze([]),fixture:true});},draw(ctx,pack,name,opts={}){renderCalls.push({ctx,pack,name,opts});ctx.marks.push(['layout',name,opts.overrides?.ThmbPic?.alpha===0]);return true;},drawLayout(ctx,pack,name,_layout,opts={}){renderCalls.push({ctx,pack,name,opts});ctx.marks.push(['layout',name,false]);return true;}}};
}
const cells=marks=>marks.filter(([kind,name])=>kind==='layout'&&name==='P_BrwsPic').map(([,,shown])=>shown?'photo':'placeholder');
const photos=marks=>marks.filter(([kind])=>kind==='photo').map(([,src])=>src);
const black=[['fill','#000']];

function harness(options={}){
 const old={document:globalThis.document,Image:globalThis.Image};
 const canvases=[];
 function canvas(){
  const result={contextRequests:[],dimensionWrites:[]},dimensions={width:0,height:0};
  for(const name of ['width','height'])Object.defineProperty(result,name,{get:()=>dimensions[name],set(value){dimensions[name]=value;result.dimensionWrites.push([name,value]);}});
  result.ctx=surface(result);result.getContext=(...args)=>{result.contextRequests.push({args,width:result.width,height:result.height});return result.ctx;};return result;
 }
 globalThis.document={createElement:()=>{const result=canvas();canvases.push(result);return result;}};
 globalThis.Image=FakeImage;images.length=0;calls.length=0;
 const screen=createStockScreenPresentation(options),outerUpper=canvas(),outerLower=canvas();outerUpper.width=400;outerUpper.height=240;outerLower.width=320;outerLower.height=240;
 const top=outerUpper.getContext('2d'),bottom=outerLower.getContext('2d'),font={draw(){}},loaded=[];
 let runtime=startApplication(createAppRuntime(),'camera',0),now=0;
 const finishGuide=()=>{for(let page=0;page<5;page++)runtime=dispatchRuntime(runtime,{type:'action',id:'guide-next'},++now);};
 finishGuide();
 const h={
  get runtime(){return runtime;},loaded,screen,canvases,top,bottom,
  act(id){runtime=dispatchRuntime(runtime,{type:'action',id},++now);},
  home(){runtime=showRuntimeHome(runtime,++now);},
  resume(){runtime=resumeRuntimeApplication(runtime,++now);},
  relaunch(){runtime=startApplication(closeApplication(runtime,++now),'camera',now);finishGuide();},
  /** One portfolio-screens frame: sync the foreground owner, then draw it. */
  frame(frameView=runtimeView(runtime)){
   screen.sync(runtime.active);
   if(!runtime.active)return null;
   const complete=screen.draw(top,bottom,frameView,runtime.active,font);
   return {complete,upper:top.marks,lower:bottom.marks};
  },
  async ready(){h.frame();await flush();const assets=nativeAssets();loaded.push(assets);calls.at(-1).resolve(assets);await flush();return h.frame();},
  dispose(){screen.dispose();globalThis.document=old.document;globalThis.Image=old.Image;},
 };
 return h;
}

const folder=id=>portfolioMedia.folders.find(item=>item.id===id);
const sources=id=>folder(id).photos.map(photo=>photo.src);

test('stock lower first allocation requests readback orientation and retains the paired surfaces through Camera resets',async()=>{
 const h=harness({cameraTextProbe:true});
 try{
  const [upper,lower]=h.canvases;
  const allocation=()=>{
   assert.deepEqual(h.canvases,[upper,lower],'reset does not allocate replacement stock canvases');
   assert.deepEqual(upper.contextRequests,[{args:['2d'],width:400,height:240}]);
   assert.deepEqual(lower.contextRequests,[{args:['2d',{willReadFrequently:true}],width:320,height:240}]);
   for(const [canvas,width]of [[upper,400],[lower,320]])assert.deepEqual(canvas.dimensionWrites,[['width',width],['height',240]],'reset neither resizes nor reacquires the persistent context');
   for(const [ctx,width]of [[h.top,400],[h.bottom,320]])assert.deepEqual(ctx.canvas.contextRequests,[{args:['2d'],width,height:240}],'stock does not request or replace the caller-owned outer context');
   for(const ctx of [upper.ctx,lower.ctx,h.top,h.bottom])assert.equal(ctx.pixelReads,0);
  };
  const published=()=>{
   assert.deepEqual(h.top.copies.at(-1),{image:upper,rect:[0,0]});
   assert.deepEqual(h.bottom.copies.at(-1),{image:lower,rect:[0,0]});
   assert.equal(h.top.copies.length,h.bottom.copies.length);
  };
  const main=()=>{
   const assets=h.loaded.at(-1),counts=assets.renderCalls.filter(call=>call.name==='P_BrwsFld');
   assert.deepEqual(counts.map(call=>call.opts.overrides.TxtThmb.text),['5','1','3','1']);
   for(const call of counts){assert.equal(call.ctx,lower.ctx);assert.equal(call.opts.textSampling,undefined);}
   const menu=assets.renderCalls.find(call=>call.name==='P_BrwsMenu_D');
   assert.equal(menu.ctx,lower.ctx);assert.equal(menu.opts.textSampling,'lcd-source-size');
   assert.deepEqual(menu.opts.textSamplingPanes,['TxtSShow','TxtSet']);
   const diagnostic=h.screen.textDiagnostic();
   assert.equal(diagnostic.destination.upper.contextAttributes.willReadFrequently,false);
   assert.equal(diagnostic.destination.lower.contextAttributes.willReadFrequently,false,'pair destination diagnostics describe the unchanged outer LCDs');
   assert.equal(lower.ctx.getContextAttributes().willReadFrequently,true);
   const drawCount=assets.renderCalls.length;h.frame();assert.equal(assets.renderCalls.length,drawCount,'cached pair publishes without repainting');
   assert.equal(h.screen.textDiagnostic().use,'cached-pair');allocation();published();
  };
  allocation();assert.equal((await h.ready()).complete,true);main();
  for(const leave of [()=>{h.home();assert.equal(h.frame(),null);h.resume();},()=>h.relaunch()]){
   const previous=h.loaded.at(-1);leave();
   const pending=h.frame();assert.equal(pending.complete,false);assert.deepEqual([pending.upper,pending.lower],[black,black]);
   assert.equal(previous.disposals,1);allocation();published();
   assert.equal((await h.ready()).complete,true);main();
  }
  const current=h.loaded.at(-1);h.screen.dispose();assert.equal(current.disposals,1);
  for(const canvas of [upper,lower]){assert.equal(canvas.width,0);assert.equal(canvas.height,0);assert.equal(canvas.contextRequests.length,1);}
  assert.equal(h.screen.textDiagnostic(),null);assert.equal(h.frame().complete,false);
 }finally{h.dispose();}
});

test('opt-in Camera main sample follows the successful cached pair and clears on HOME, reload, unrelated views and failure',async()=>{
 const h=harness({cameraTextProbe:true});
 try{
  await h.ready();const first=h.screen.textDiagnostic();assert.equal(first.use,'rendered');assert.equal(first.pair.owner,h.runtime.active);
  h.frame();const hit=h.screen.textDiagnostic();assert.equal(hit.use,'cached-pair');assert.equal(hit.pair,first.pair);
  assert.throws(()=>{hit.pair.owner='stale';},TypeError);
  h.screen.clearTextDiagnostic();assert.equal(h.screen.textDiagnostic(),null);h.frame();assert.equal(h.screen.textDiagnostic().pair,first.pair);
  for(let cycle=0;cycle<2;cycle++){
   h.home();h.frame();assert.equal(h.screen.textDiagnostic(),null);h.resume();h.frame();assert.equal(h.screen.textDiagnostic(),null);
   await h.ready();assert.ok(h.screen.textDiagnostic().pair.generation>first.pair.generation);assert.notEqual(h.screen.textDiagnostic().pair.pairId,first.pair.pairId);
  }
  h.act('folder:buildings');h.frame();assert.equal(h.screen.textDiagnostic(),null,'gallery is outside the main-only probe');
  h.relaunch();h.frame();assert.equal(h.screen.textDiagnostic(),null);await h.ready();
  assert.equal(runtimeView(h.runtime).screen,'main');assert.ok(h.screen.textDiagnostic());
  h.loaded.at(-1).renderer.draw=()=>false;const main=runtimeView(h.runtime);
  assert.equal(h.frame({...main,data:{...main.data,diagnosticFixtureRevision:1}}).complete,false,'changed main key forces an actual redraw to fail');
  assert.ok(h.screen.getFailure());assert.equal(h.screen.textDiagnostic(),null,'partial main trace is not a pair sample');
  assert.equal(h.screen.retry(),true);assert.equal(h.screen.textDiagnostic(),null);h.frame();assert.equal(h.screen.textDiagnostic(),null);
  await h.ready();assert.ok(h.screen.textDiagnostic(),'retry publishes only the newly loaded successful main pair');
  h.screen.dispose();assert.equal(h.screen.textDiagnostic(),null);
 }finally{h.dispose();}
});

test('fixture folders are distinct URLs, so a reused cell slot always names a different image',()=>{
 const all=portfolioMedia.folders.flatMap(item=>item.photos.map(photo=>photo.src));
 assert.equal(new Set(all).size,all.length);
 assert.ok(folder('buildings').photos.length>=2&&folder('renu').photos.length>=1);
});

for(const [name,leave]of [['HOME suspension and resume',h=>{h.home();assert.equal(h.frame(),null);h.resume();}],['close and relaunch',h=>h.relaunch()]])
 test(`${name} releases thumbnail readiness before the next gallery scene publishes`,async()=>{
  const h=harness();
  try{
   h.act('folder:buildings');
   let frame=await h.ready();
   assert.deepEqual(cells(frame.lower),['placeholder','placeholder','placeholder']);
   for(const src of sources('buildings'))load(src);
   frame=h.frame();
   assert.equal(frame.complete,true);
   assert.deepEqual(cells(frame.lower),['photo','photo','photo']);
   assert.deepEqual(photos(frame.lower),sources('buildings'));
   assert.deepEqual(photos(frame.upper),[sources('buildings')[0]]);
   const owner=h.runtime.active,previous=images.filter(image=>image.url);
   assert.equal(previous.length,3);

   leave(h);
   if(name==='close and relaunch'){assert.notEqual(h.runtime.active,owner);h.act('folder:buildings');}
   else assert.equal(h.runtime.active,owner,'resume keeps the instance and its gallery state');
   assert.equal(runtimeView(h.runtime).screen,'gallery');

   frame=h.frame();
   assert.equal(frame.complete,false);
   assert.deepEqual([frame.upper,frame.lower],[black,black],'the first published pair after switching is source black, not the old gallery');
   for(const image of previous)assert.deepEqual([image.url,image.onload,image.onerror],['',null,null],'released requests cannot repaint or report readiness');
   assert.equal(h.loaded[0].disposals,1,'the previous owner native renderer is disposed');
   frame=await h.ready();
   assert.equal(frame.complete,true);
   assert.deepEqual(cells(frame.lower),['placeholder','placeholder','placeholder'],'ThmbPic placeholder until the new scene loads its own thumbnails');
   assert.deepEqual([photos(frame.lower),photos(frame.upper)],[[],[]]);
   for(const image of previous)image.onload?.();
   load(sources('buildings')[1]);
   frame=h.frame();
   assert.deepEqual(cells(frame.lower),['placeholder','photo','placeholder']);
   assert.deepEqual(photos(frame.lower),[sources('buildings')[1]]);
  }finally{h.dispose();}
 });

test('within one owner, readiness follows the image URL, not the reused cell slot',async()=>{
 const h=harness();
 try{
  h.act('folder:buildings');
  await h.ready();
  const [first,second]=sources('buildings'),[renu]=sources('renu');
  load(first);
  assert.deepEqual(cells(h.frame().lower),['photo','placeholder','placeholder']);

  h.act('back');h.act('folder:renu');
  let frame=h.frame();
  assert.deepEqual(cells(frame.lower),['placeholder'],'slot 0 was ready for another folder; that readiness does not transfer');
  assert.deepEqual([photos(frame.lower),photos(frame.upper)],[[],[]]);

  load(second);
  frame=h.frame();
  assert.deepEqual(cells(frame.lower),['placeholder'],'a late completion from the previous folder repaints without binding to this scene');
  assert.deepEqual([photos(frame.lower),photos(frame.upper)],[[],[]]);

  load(renu);
  frame=h.frame();
  assert.deepEqual([cells(frame.lower),photos(frame.lower),photos(frame.upper)],[['photo'],[renu],[renu]]);

  h.act('back');h.act('folder:buildings');
  frame=h.frame();
  assert.deepEqual(cells(frame.lower),['photo','photo','placeholder'],'the same URL keeps its decoded image for the life of the owner');
  assert.deepEqual(photos(frame.lower),[first,second]);
  assert.equal(calls.length,1,'folder scenes share one native session within the owner');
  assert.deepEqual(Object.keys(h.runtime.instances[h.runtime.active].state).sort(),['cameraBrowse','folderId','screen','selection'],'reducer state carries strip motion but no thumbnail readiness');
 }finally{h.dispose();}
});
