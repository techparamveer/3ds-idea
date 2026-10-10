import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createPortfolioState, reduceSystem, tickSystem, touchSystem } from '../src/os/system.ts';
import { sampleHomeGrid, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { decodeNativePng } from '../src/os/native-png.ts';
import { nativeTextureSamplePixels } from '../src/os/native-layout.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const assetRoot=resolve(root,'public/os/firmware/10.7.0-32E');
const canvasPath=process.env.NATIVE_CANVAS_MODULE;
const referencePath=process.env.NATIVE_PAUSE_REFERENCE;
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const transpile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const modules=new Map();
function moduleUrl(path,overrides={}){
 if(modules.has(path))return modules.get(path);
 const code=transpile(readFileSync(path,'utf8')).replace(/from (['"])([^'"]+)\1/g,(_all,_quote,specifier)=>{
  const url=overrides[specifier]??(specifier.startsWith('.')?pathToFileURL(resolve(dirname(path),specifier.endsWith('.ts')?specifier:specifier+'.ts')).href:import.meta.resolve(specifier));
  return `from ${JSON.stringify(url)}`;
 });
 const url=data(code+'\n//# sourceURL='+path);modules.set(path,url);return url;
}
const rendererUrl=moduleUrl(resolve(root,'src/os/native-renderer.ts'));
const {NativeLayoutRenderer}=await import(rendererUrl);
const {BitmapFont}=await import(pathToFileURL(resolve(root,'src/os/bitmap-font.ts')));
const firmwareUrl=moduleUrl(resolve(root,'src/os/firmware-presentation.ts'),{'./native-renderer':rendererUrl});
const graphicsStub=data(`export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>({
 ready:Promise.resolve(),readSuspendedCapture:()=>globalThis.__dialogPixelCapture,
 selectedApp(){},syncStockView(){},stockStatus:()=>"inactive",stockFailure:()=>null,
 banner(){},menuIcon(){},menuArtwork(){},overlay(){},dispose(){}});`);
const screensUrl=moduleUrl(resolve(root,'src/os/screens.ts'),{
 './native-system-presentation':data('export const drawNativeSystemOverlay=()=>false;'),
 './native-chrome':data('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
 './home-native-layouts':data('export const createHomeLayoutManager=()=>({});'),
 './portfolio-screens':graphicsStub,'./firmware-presentation':firmwareUrl,
});
const {createScreens}=await import(screensUrl);
const json=path=>JSON.parse(readFileSync(resolve(assetRoot,path),'utf8'));
function suspendedHealth(){
 let state=tickSystem(createPortfolioState(),3001);
 const slot=Number(Object.entries(state.system.layout).find(([,id])=>id==='health-safety')[0]);
 state=settleHomeNavigation(selectHomeSlot(state,slot));
 const grid=sampleHomeGrid(state.system.homeNavigation),point=grid.slots[slot];
 state=touchSystem(state,point.x-grid.scrollPixels,point.y,3010);
 assert.equal(state.system.phase,'launch');return reduceSystem(tickSystem(state,6500),'home',6600);
}
const rgba=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
function rgbDifference(a,b){
 let changed=0,maximum=0;
 for(let at=0;at<a.length;at+=4){let delta=0;for(let c=0;c<3;c++)delta=Math.max(delta,Math.abs(a[at+c]-b[at+c]));if(delta)changed++;maximum=Math.max(maximum,delta);}
 return {changed,maximum};
}
function assertDialogBeforeHome(samples){
 const firstDialog=samples.find(sample=>sample.dialog.changed>0),firstHome=samples.find(sample=>sample.home.changed>0);
 assert.ok(firstDialog&&firstHome,'both native resources must produce actual RGB');
 assert.equal(firstDialog.home.changed,0,'dialog must contribute actual RGB while lower still matches the same-pose retained Health control');
 assert.ok(firstDialog.receipt<firstHome.receipt,'dialog needs a distinct accepted pair before lower HOME');
}

test('real native-renderer pixels show dialog before lower HOME contributes', {skip:!canvasPath||!referencePath},async t=>{
 assert.ok(canvasPath.startsWith('/')&&referencePath.startsWith('/'),'offline Canvas and reference paths must be absolute');
 const {createCanvas,loadImage}=await import(pathToFileURL(canvasPath));
 const saved=new Map(['document','Image','FontFace','__dialogPixelCapture'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 Object.assign(globalThis,{document:{createElement:()=>createCanvas(1,1),fonts:{add(){}},addEventListener(){},removeEventListener(){},hidden:false},
  Image:class{decode(){return Promise.resolve();}},FontFace:class{load(){return Promise.resolve(this);}}});
 const fonts=[],packs={},textures={};let screens,renderer;
 try{
  const font=async path=>{const manifest=json(path),sheets=await Promise.all(manifest.sheets.map(name=>loadImage(resolve(assetRoot,dirname(path),name))));const value=new BitmapFont(manifest,sheets);fonts.push(value);return value;};
  const shared=await font('fonts/shared/font.json'),hud=await font('fonts/hud/font.json');
  for(const [alias,name] of [['launcher','launcher.json'],['hud','hud.json'],['messages','messages-and-loose.json']]){
   const pack=json('packs/home/'+name);packs[alias]=pack;textures[alias]=new Map();
   for(const [name,record] of Object.entries(pack.textures))textures[alias].set(name,nativeTextureSamplePixels(await decodeNativePng(readFileSync(resolve(assetRoot,record.url)),record),record.picaFormat));
  }
  renderer=new NativeLayoutRenderer(packs,textures,new Map([['cbf_std.bcfnt',shared],['Hud.bcfnt',hud]]));
  const reference=await loadImage(referencePath);assert.deepEqual([reference.width,reference.height],[400,480]);
  const upper=createCanvas(400,240),lower=createCanvas(240,320);
  upper.getContext('2d').drawImage(reference,0,0,400,240,0,0,400,240);
  const lc=lower.getContext('2d');lc.translate(240,0);lc.rotate(Math.PI/2);lc.drawImage(reference,40,240,320,240,0,0,320,240);
  const state=suspendedHealth(),owner=state.system.runtime.application;
  globalThis.__dialogPixelCapture={status:'ready',owner,generation:1,upper:{width:400,height:240,data:rgba(upper)},lower:{width:240,height:320,data:rgba(lower)}};
  const titleIcons=new Map(),titleIconPixels=new Map(),titleDescriptions=new Map();
  for(const [id,title] of Object.entries(json('manifest.json').titles))if(title.icon){
   const icon=await loadImage(resolve(assetRoot,title.icon));titleIcons.set(id.toLowerCase(),icon);
   titleIconPixels.set(id.toLowerCase(),await decodeNativePng(readFileSync(resolve(assetRoot,title.icon)),{width:icon.width,height:icon.height}));
   if(title.longDescription)titleDescriptions.set(id.toLowerCase(),title.longDescription);
  }
  const assets={renderer,sharedFont:shared,hudFont:hud,titleIcons,titleIconPixels,titleDescriptions,diagnostics:[],dispose(){}};
  // The 3D background is outside this CPU test. Its actual captured opaque
  // pixels provide a fixed destination for the real native dialog/HUD raster.
  const draw=renderer.draw.bind(renderer),controlUpper=createCanvas(400,240),controlLower=createCanvas(320,240);
  let dialogSeen=false,suppressUpperFirstDialog=false;
  renderer.draw=(ctx,alias,name,options)=>{
   if(name==='LncBase_U_00'){
    const control=controlUpper.getContext('2d');control.resetTransform();control.clearRect(0,0,400,240);control.drawImage(ctx.canvas,0,0);dialogSeen=true;
    draw(control,alias,name,{...options,overrides:{...options.overrides,N_Wndw_00:{...options.overrides.N_Wndw_00,visible:false}}});
   }
   if(name==='LncPauseFade_D_00'){
    // Same source pose and dimming, with only the HOME plane suppressed.
    const control=controlLower.getContext('2d');control.resetTransform();control.clearRect(0,0,320,240);control.drawImage(ctx.canvas,0,0);
    draw(controlLower.getContext('2d'),alias,name,{...options,overrides:{...options.overrides,P_Lnc_00:{...options.overrides.P_Lnc_00,visible:false}}});
   }
   // Mutation control, not a claimed baseline fault: remove only the window
   // at the existing upper-first source pose and leave HUD/lower untouched.
   const suppress=name==='LncBase_U_00'&&suppressUpperFirstDialog
    &&options.bindings.some(binding=>binding.name==='LncBase_U_00_SceneIn'&&binding.frame===21);
   const result=draw(ctx,alias,name,suppress?{...options,overrides:{...options.overrides,N_Wndw_00:{...options.overrides.N_Wndw_00,visible:false}}}:options);
   if(name==='HudMenu_00'&&dialogSeen)draw(controlUpper.getContext('2d'),alias,name,options);
   return result;
  };
  async function sequence(mutation){
   screens?.dispose();suppressUpperFirstDialog=mutation;
   screens=createScreens({firmwareAssets:assets,drawHomeBackground:()=>true,drawSuspendedBackground(ctx,capture){ctx.putImageData(upper.getContext('2d').getImageData(0,0,400,240),0,0);return capture.status==='ready';}});
   await screens.ready;
   const samples=[];
   for(let update=0;update<=9;update++){
    dialogSeen=false;controlLower.getContext('2d').clearRect(0,0,320,240);
    const current={...state,system:{...state.system,homeClock:{...state.system.homeClock,updateCount:100+update}}};
    const result=screens.paint(current,new Date(0),10000+update*1000/60);
    assert.equal(screens.stockFailure(),null,String(screens.stockFailure()));
    const dialog=rgbDifference(rgba(screens.nativeTop),rgba(controlUpper)),home=rgbDifference(rgba(screens.bottom),rgba(controlLower));
    samples.push({receipt:result.entryMotion.pauseFrame,dialog,home});
    assert.equal(screens.presentHomeEntryMotion(current),true);
   }
   return samples;
  }
  for(const label of ['baseline','fresh-compositor-repeat']){
   const samples=await sequence(false);t.diagnostic(JSON.stringify({label,samples}));assertDialogBeforeHome(samples);
  }
  const mutation=await sequence(true);t.diagnostic(JSON.stringify({label:'mutation-control-not-baseline',samples:mutation}));
  assert.throws(()=>assertDialogBeforeHome(mutation),/dialog must contribute actual RGB while lower still matches/);
 }finally{
  screens?.dispose();renderer?.dispose();for(const font of fonts)font.dispose();
  for(const [key,value] of saved)if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];
 }
});
