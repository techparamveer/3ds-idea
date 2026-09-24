import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,dirname,join,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {parseArgs} from 'node:util';
import ts from 'typescript';

/** Source-render check of the eShop welcome pass timeline, plus an offline draw benchmark. */
export async function verifyEshopWelcome(options){
 for(const key of ['artifactDir','assetRoot','canvasModule'])assert.ok(isAbsolute(options[key]??''),key);
 const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.artifactDir;mkdirSync(out,{recursive:true});
 const compiled=mkdtempSync(join(out,'compiled-'));
 for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','stock-native-services']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
 }
 const [{createCanvas,loadImage,Image:CanvasImage},{BitmapFont},{loadNativeTitleAssets},services,{poseNativeLayout}]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets','stock-native-services','native-layout'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs'))))]);
 const {nativeServiceView,drawNativeServiceFrame,eshopWelcomeBindings,eshopWelcomePass}=services;
 const oldGlobals=Object.fromEntries(['document','window','Image'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)])),oldFetch=globalThis.fetch,oldObjectURL=URL.createObjectURL,oldRevokeURL=URL.revokeObjectURL,blobBytes=new WeakMap();let font,assets;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://eshop-welcome.invalid/manifest.json'}};globalThis.Image=CanvasImage;URL.createObjectURL=blob=>'data:image/png;base64,'+blobBytes.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
  globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://eshop-welcome.invalid');const file=resolve(options.assetRoot,u.pathname.slice(1));assert.ok(file.startsWith(options.assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);blobBytes.set(blob,bytes);return blob;};return response;};
  const manifest=JSON.parse(readFileSync(join(options.assetRoot,'manifest.json'))),fontPath=join(options.assetRoot,manifest.fonts.shared),fontData=JSON.parse(readFileSync(fontPath));
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
  const view={appId:'eshop',screen:'main',heading:'Nintendo eShop',rows:[{id:'back',label:'OK'}],selection:0,footer:{left:{action:'back',label:'Back'}}};
  const request=nativeServiceView(view);assets=await loadNativeTitleAssets('https://eshop-welcome.invalid/manifest.json',request.titleId,request.packs,new Map([['cbf_std.bcfnt',font]]));
  const pack=assets.renderer.packs['shop-welcome'];
  for(const [name,frames,loop]of [['in_00',11,false],['balloonIn_00',59,false],['wait_00',75,true]])assert.deepEqual([pack.animations['welcome_U_00_'+name].frames,pack.animations['welcome_U_00_'+name].loop],[frames,loop],name);
  // Mid-pass time, so pass boundaries never depend on float rounding.
  const ms=pass=>(pass+.5)*1000/60,top=createCanvas(400,240),bottom=createCanvas(320,240);
  const draw=(pass,reducedMotion=false)=>{
   assert.equal(drawNativeServiceFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{font,reducedMotion,eshopWelcomeMs:pass===undefined?undefined:ms(pass)}),true,JSON.stringify(assets.renderer.diagnostics));
   return {top:Buffer.from(top.getContext('2d').getImageData(0,0,400,240).data),bottom:Buffer.from(bottom.getContext('2d').getImageData(0,0,320,240).data)};
  };
  const pane=(items,name)=>{for(const item of items){const found=item.name===name?item:pane(item.children,name);if(found)return found;}};
  const pose=pass=>{const posed=poseNativeLayout(pack.layouts.welcome_U_00,pack.animations,eshopWelcomeBindings(pass)),p=name=>pane(posed.roots,name);
   return {rootAlpha:p('N_root_00').alpha,charaY:+p('N_chara_00').translation[1].toFixed(3),talkAlpha:Math.round(p('N_talk_00').alpha),decideAlpha:Math.round(p('T_decide_00').alpha),eyeOpen:Math.round(p('P_eyeL_00').alpha),eyeClosed:Math.round(p('P_eyeL_01').alpha)};};
  const passes=[0,3,6,10,11,20,40,68,69,110,142,143,144];
  const poses=Object.fromEntries(passes.map(pass=>[pass,{bindings:eshopWelcomeBindings(pass),...pose(pass)}]));
  assert.deepEqual([poses[0].charaY,poses[0].rootAlpha],[-158,0],'in_00 enters from below, transparent');
  assert.deepEqual([poses[10].charaY,poses[10].rootAlpha,poses[10].talkAlpha],[-112,255,0],'in_00 settles before the balloon');
  assert.deepEqual([poses[68].talkAlpha,poses[68].decideAlpha,poses[68].eyeOpen],[255,255,255],'balloonIn settles with open eyes');
  assert.deepEqual([poses[110].eyeOpen,poses[110].eyeClosed],[0,255],'wait_00 frame 42 is the closed-eye swap');
  assert.deepEqual(pose(undefined),pose(68),'reduced motion keeps the prior settled composition');
  // Pixels: settled pass equals the reduced frame; wait_00 repeats every 75 passes.
  const rendered=Object.fromEntries(passes.map(pass=>[pass,draw(pass)])),settled=draw(undefined),reduced=draw(500,true);
  assert.ok(rendered[68].top.equals(settled.top)&&rendered[68].top.equals(reduced.top),'settled/reduced upper pixels');
  assert.ok(draw(69+75).top.equals(rendered[69].top)&&draw(143).top.equals(draw(68+75*2).top),'wait_00 loop period');
  assert.ok(!rendered[110].top.equals(rendered[69].top),'idle loop changes the upper LCD');
  for(const pass of passes)assert.ok(rendered[pass].bottom.equals(settled.bottom),'no source animation touches the lower LCD');
  for(const pass of passes){draw(pass);const pair=createCanvas(400,480),ctx=pair.getContext('2d');ctx.drawImage(top,0,0);ctx.drawImage(bottom,40,240);writeFileSync(join(out,`eshop-welcome-pass-${String(pass).padStart(3,'0')}.png`),pair.toBuffer('image/png'));}
  const sheet=createCanvas(400*5,240*Math.ceil(passes.length/5)),sctx=sheet.getContext('2d');
  passes.forEach((pass,i)=>{draw(pass);sctx.drawImage(top,(i%5)*400,Math.floor(i/5)*240);});writeFileSync(join(out,'eshop-welcome-upper-contact.png'),sheet.toBuffer('image/png'));
  // Offline cost of one complete stock pair per source pass: entrance plus two idle loops.
  const samples=[];for(let pass=0;pass<69+150;pass++){const start=performance.now();drawNativeServiceFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{font,eshopWelcomeMs:ms(pass)});samples.push(performance.now()-start);}
  const sorted=[...samples].sort((a,b)=>a-b),round=v=>+v.toFixed(3);
  const benchmark={environment:'offline @napi-rs/canvas in Node; not browser, WebGL or device evidence',canvas:JSON.parse(readFileSync(join(dirname(options.canvasModule),'package.json'))).version,node:process.version,passes:samples.length,totalMs:round(samples.reduce((a,b)=>a+b,0)),meanMs:round(samples.reduce((a,b)=>a+b,0)/samples.length),p95Ms:round(sorted[Math.floor(sorted.length*.95)]),maxMs:round(sorted.at(-1)),firstPassMs:round(samples[0])};
  assert.deepEqual(assets.renderer.diagnostics,[]);
  const result={passed:true,passesPerSecond:60,passFromMs:[0,17,1000].map(v=>[v,eshopWelcomePass(v)]),poses,benchmark,gaps:[
   'One task pass per 60 Hz frame is assumed; the executable main loop VSync wait was not traced.',
   'Whether the constructor pass also ticks in_00 is unresolved: native may be one pass ahead during the entrance.',
   'The browser epoch is the first published welcome pair after the host launch transition, not the native splash/opening handoff.',
   'BG_U_00/BG_D_00 draw above welcome at priority 1.0 and the constructor plays inOut_00 forward (N_root_00 alpha 255→0); the browser still paints BG beneath at alpha 255. The native backdrop beneath welcome is untraced.',
   'OK-button enable, out_00/out_01 exit, and the constructor/balloon sound cues 0x100002f, 0x1000009 and 0x1000033 are not implemented.',
   'Source rendering is not a matched native LCD capture.',
  ]};
  writeFileSync(join(out,'verification.json'),JSON.stringify(result,null,2)+'\n');return result;
 }finally{assets?.dispose();font?.dispose();globalThis.fetch=oldFetch;URL.createObjectURL=oldObjectURL;URL.revokeObjectURL=oldRevokeURL;for(const[key,value]of Object.entries(oldGlobals)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module'].map(k=>[k,{type:'string'}]))});
 const result=await verifyEshopWelcome(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])));
 console.log(JSON.stringify({passed:result.passed,benchmark:result.benchmark,gaps:result.gaps},null,2));
}
