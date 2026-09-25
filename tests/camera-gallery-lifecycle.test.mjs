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
const layout=url(compile('stock-screen-layout').replace("'./camera-browse.ts'",JSON.stringify(browse)));
const camera=url(compile('stock-native-camera').replace("'./stock-screen-layout'",JSON.stringify(layout)).replace("'./camera-browse.ts'",JSON.stringify(browse)).replace("'./native-layout'",JSON.stringify(url(compile('native-layout')))));
let source=compile('stock-screen-presentation').replace("'./native-title-session'",JSON.stringify(session)).replace("'./stock-native-camera'",JSON.stringify(camera)).replace("'./stock-screen-layout'",JSON.stringify(layout));
for(const [file,packs,draw]of [['settings','settingsScreenPacks','drawNativeSettingsMain'],['sound','soundScreenPacks','drawNativeSoundFrame'],['health','healthScreenPacks','drawNativeHealthFrame']])source=source.replace(`'./stock-native-${file}'`,JSON.stringify(url(`export const ${packs}=[];export const ${draw}=()=>false;`)));
source=source.replace("'./stock-native-personal-tools'",JSON.stringify(url('export const nativePersonalToolView=()=>null;export const drawNativePersonalToolFrame=()=>false;')));
source=source.replace("'./stock-native-web'",JSON.stringify(url('export const browserScreenPacks=[],miiverseScreenPacks=[];export const drawNativeWebFrame=()=>false;')));
source=source.replace("'./stock-native-services'",JSON.stringify(url('export const nativeServiceView=()=>null;export const drawNativeServiceFrame=()=>false;export const zoneClock=()=>({hour:"00",minute:"00",frame:0});export const eshopHudClock=()=>({hour:"00",minute:"00",frame:0});export const eshopWelcomePose=()=>null;')));
source=source.replace("'./stock-native-helpers'",JSON.stringify(url('export const nativeHelperView=()=>null;export const drawNativeHelperFrame=()=>false;')));
source=source.replace("'./stock-native-selectors'",JSON.stringify(url('export const nativeSelectorView=()=>null;export const drawNativeSelectorFrame=()=>false;')));
source=source.replace("'./native-screen-input'",JSON.stringify(url(compile('native-screen-input'))));
const {createStockScreenPresentation}=await import(url(source));
const messages=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/msg-EU_English.json',import.meta.url),'utf8'));
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
 return {canvas,marks:[],fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,globalCompositeOperation:'source-over',
  resetTransform(){},clearRect(){this.marks=[];},fillRect(){this.marks.push(['fill',this.fillStyle]);},strokeRect(){},fillText(){},
  beginPath(){},roundRect(){},rect(){},clip(){},save(){},restore(){},fill(){},stroke(){},createLinearGradient:()=>({addColorStop(){}}),
  drawImage(image,...rect){if(image instanceof FakeImage)this.marks.push(['photo',image.src,...rect]);else this.marks=structuredClone(image.ctx.marks);}};
}
function nativeAssets(){
 return {diagnostics:[],disposals:0,dispose(){this.disposals++;},renderer:{packs:{'camera-messages':messages},draw(ctx,_pack,name,opts={}){ctx.marks.push(['layout',name,opts.overrides?.ThmbPic?.alpha===0]);return true;}}};
}
const cells=marks=>marks.filter(([kind,name])=>kind==='layout'&&name==='P_BrwsPic').map(([,,shown])=>shown?'photo':'placeholder');
const photos=marks=>marks.filter(([kind])=>kind==='photo').map(([,src])=>src);
const black=[['fill','#000']];

function harness(){
 const old={document:globalThis.document,Image:globalThis.Image};
 globalThis.document={createElement:()=>{const canvas={width:0,height:0};canvas.ctx=surface(canvas);canvas.getContext=()=>canvas.ctx;return canvas;}};
 globalThis.Image=FakeImage;images.length=0;calls.length=0;
 const screen=createStockScreenPresentation(),top=surface({}),bottom=surface({}),font={draw(){}},loaded=[];
 let runtime=startApplication(createAppRuntime(),'camera',0),now=0;
 const h={
  get runtime(){return runtime;},loaded,
  act(id){runtime=dispatchRuntime(runtime,{type:'action',id},++now);},
  home(){runtime=showRuntimeHome(runtime,++now);},
  resume(){runtime=resumeRuntimeApplication(runtime,++now);},
  relaunch(){runtime=startApplication(closeApplication(runtime,++now),'camera',now);},
  /** One portfolio-screens frame: sync the foreground owner, then draw it. */
  frame(){
   screen.sync(runtime.active);
   if(!runtime.active)return null;
   const complete=screen.draw(top,bottom,runtimeView(runtime),runtime.active,font);
   return {complete,upper:top.marks,lower:bottom.marks};
  },
  async ready(){h.frame();await flush();const assets=nativeAssets();loaded.push(assets);calls.at(-1).resolve(assets);await flush();return h.frame();},
  dispose(){screen.dispose();globalThis.document=old.document;globalThis.Image=old.Image;},
 };
 return h;
}

const folder=id=>portfolioMedia.folders.find(item=>item.id===id);
const sources=id=>folder(id).photos.map(photo=>photo.src);

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
