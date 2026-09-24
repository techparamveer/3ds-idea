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
 for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','stock-eshop-welcome','stock-native-services']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
 }
 const [{createCanvas,loadImage,Image:CanvasImage},{BitmapFont},{loadNativeTitleAssets},services,{poseNativeLayout},timeline]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets','stock-native-services','native-layout','stock-eshop-welcome'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs'))))]);
 const {nativeServiceView,drawNativeServiceFrame}=services,{eshopWelcomeBindings,eshopCurtainFrame,eshopWelcomePass,eshopExitStartPass,eshopExitEndPass,ESHOP_WELCOME_PASS_HZ}=timeline;
 const oldGlobals=Object.fromEntries(['document','window','Image'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)])),oldFetch=globalThis.fetch,oldObjectURL=URL.createObjectURL,oldRevokeURL=URL.revokeObjectURL,blobBytes=new WeakMap();let font,assets;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://eshop-welcome.invalid/manifest.json'}};globalThis.Image=CanvasImage;URL.createObjectURL=blob=>'data:image/png;base64,'+blobBytes.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
  globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://eshop-welcome.invalid');const file=resolve(options.assetRoot,u.pathname.slice(1));assert.ok(file.startsWith(options.assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);blobBytes.set(blob,bytes);return blob;};return response;};
  const manifest=JSON.parse(readFileSync(join(options.assetRoot,'manifest.json'))),fontPath=join(options.assetRoot,manifest.fonts.shared),fontData=JSON.parse(readFileSync(fontPath));
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
  const view=(welcomePass,welcomeDecidedPass)=>({appId:'eshop',screen:'main',heading:'Nintendo eShop',rows:[{id:'ok',label:'OK'}],selection:0,footer:{left:{action:'back',label:'Back'},right:{action:'ok',label:'OK'}},
   data:{...(welcomePass===undefined?{}:{welcomePass}),...(welcomeDecidedPass===undefined?{}:{welcomeDecidedPass})}});
  const request=nativeServiceView(view(0));assets=await loadNativeTitleAssets('https://eshop-welcome.invalid/manifest.json',request.titleId,request.packs,new Map([['cbf_std.bcfnt',font]]));
  const pack=assets.renderer.packs['shop-welcome'],bg=assets.renderer.packs['shop-background'],hudPack=assets.renderer.packs['shop-hud'];
  for(const [name,frames,loop]of [['in_00',11,false],['balloonIn_00',59,false],['wait_00',75,true],['out_00',16,false],['out_01',5,false]])assert.deepEqual([pack.animations['welcome_U_00_'+name].frames,pack.animations['welcome_U_00_'+name].loop],[frames,loop],name);
  for(const name of ['BG_U_00_inOut_00','BG_D_00_inOut_00'])assert.deepEqual([bg.animations[name].frames,bg.animations[name].loop],[5,false],name);
  assert.ok(bg.layouts.info_U_00,'Common info_U_00 is the welcome status strip fill');
  assert.deepEqual([hudPack.animations.HudMenu_00_NetMode.frames,hudPack.animations.HudMenu_00_NetAtn.frames,hudPack.animations.HudMenu_00_Bat.frames],[5,10,7]);
  const top=createCanvas(400,240),bottom=createCanvas(320,240);
  const hudDate=new Date(2026,8,24,7,44);
  const draw=(pass,reducedMotion=false,decided)=>{
   assert.equal(drawNativeServiceFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view(pass,decided),{font,reducedMotion,date:hudDate}),true,JSON.stringify(assets.renderer.diagnostics));
   return {top:Buffer.from(top.getContext('2d').getImageData(0,0,400,240).data),bottom:Buffer.from(bottom.getContext('2d').getImageData(0,0,320,240).data)};
  };
  const pane=(items,name)=>{for(const item of items){const found=item.name===name?item:pane(item.children,name);if(found)return found;}};
  const posedHud=poseNativeLayout(hudPack.layouts.HudMenu_00,hudPack.animations,services.eshopHudBindings);
  const hudTexture=name=>posedHud.textures[posedHud.materials.find(m=>m.name===name).textureMaps[0].texture];
  const posedInfo=poseNativeLayout(bg.layouts.info_U_00,bg.animations,[],{N_info_00:{visible:false}});
  const infoBg=pane(posedInfo.roots,'P_bg_01'),infoGroup=pane(posedInfo.roots,'N_info_00');
  const hudNet=pane(posedHud.roots,'P_NetAtn_00'),hudDatePane=pane(posedHud.roots,'T_Date_00');
  assert.equal(infoGroup.flags&1,0,'ctor 0x36b4e8 hides N_info_00');
  assert.equal(infoBg.flags&1,1,'P_bg_01 stays visible as the 400×20 fill');
  assert.deepEqual([infoBg.size[0],infoBg.size[1],infoBg.translation[1]],[400,20,110]);
  assert.equal(hudTexture('P_NetAtn_00'),'HudNetAtnOff_00.bclim','Disabled branch NetAtn frame 9');
  assert.equal(hudNet.translation[1],120);
  assert.equal(hudDatePane.translation[1],120);
  const pose=(pass,decided)=>{const posed=poseNativeLayout(pack.layouts.welcome_U_00,pack.animations,eshopWelcomeBindings(pass,decided)),p=name=>pane(posed.roots,name);
   return {rootAlpha:p('N_root_00').alpha,charaY:+p('N_chara_00').translation[1].toFixed(3),talkAlpha:Math.round(p('N_talk_00').alpha),talkScale:+p('N_talk_00').scale[0].toFixed(3),decideAlpha:Math.round(p('T_decide_00').alpha),eyeOpen:Math.round(p('P_eyeL_00').alpha),eyeClosed:Math.round(p('P_eyeL_01').alpha)};};
  // Curtain N_root_00 (InfluencedAlpha) per inOut_00 frame; hermite 255 → 0, slopes 0.
  const curtainAlpha=Object.fromEntries(['BG_U_00','BG_D_00'].map(layout=>[layout,[0,1,2,3,4].map(frame=>Math.round(pane(poseNativeLayout(bg.layouts[layout],bg.animations,[{name:layout+'_inOut_00',frame}]).roots,'N_root_00').alpha))]));
  for(const alphas of Object.values(curtainAlpha)){assert.deepEqual([alphas[0],alphas[4]],[255,0]);assert.ok(alphas.every((v,i)=>i===0||v<alphas[i-1]),'the reveal is monotone');}
  const passes=[0,3,6,10,11,20,40,68,69,110,142,143,144];
  const poses=Object.fromEntries(passes.map(pass=>[pass,{bindings:eshopWelcomeBindings(pass),...pose(pass)}]));
  assert.deepEqual([poses[0].charaY,poses[0].rootAlpha],[-158,0],'in_00 enters from below, transparent');
  assert.deepEqual([poses[10].charaY,poses[10].rootAlpha,poses[10].talkAlpha],[-112,255,0],'in_00 settles before the balloon');
  assert.deepEqual([poses[68].talkAlpha,poses[68].decideAlpha,poses[68].eyeOpen],[255,255,255],'balloonIn settles with open eyes');
  assert.deepEqual([poses[110].eyeOpen,poses[110].eyeClosed],[0,255],'wait_00 frame 42 is the closed-eye swap');
  assert.deepEqual(pose(undefined),pose(68),'reduced motion keeps the prior settled composition');
  // Exit for a decide at pass 20: out_00 from pass 70, out_01 and the BG cover from 85, HOME at 90.
  const decided=20,start=eshopExitStartPass(decided),exitPasses=[start-1,start,start+7,start+14,start+15,start+16,start+17,start+18,eshopExitEndPass(decided)-1];
  const exitPoses=Object.fromEntries(exitPasses.map(pass=>[pass,{bindings:eshopWelcomeBindings(pass,decided),curtain:eshopCurtainFrame(pass,decided),...pose(pass,decided)}]));
  assert.deepEqual([start,eshopExitEndPass(decided)],[70,90]);
  assert.deepEqual(pose(start-1,decided),pose(start-1),'wait_00 plays until out_00 replaces it');
  assert.equal(exitPoses[start+14].charaY,-158,'out_00 frame 15 returns the character below the screen');
  assert.ok(exitPoses[start+18].talkScale<exitPoses[start+14].talkScale,'out_01 shrinks the balloon');
  // Pixels: settled pass equals the reduced frame; wait_00 repeats every 75 passes.
  const rendered=Object.fromEntries(passes.map(pass=>[pass,draw(pass)])),settled=draw(undefined),reduced=draw(500,true);
  draw(undefined);
  const strip=top.getContext('2d').getImageData(0,0,400,20).data;
  let transparent=0;for(let i=3;i<strip.length;i+=4)if(strip[i]<255)transparent++;
  assert.equal(transparent,0,'the source HUD fill covers the upper 20 px; HOME cannot show through');
  const crop=createCanvas(400,20);crop.getContext('2d').drawImage(top,0,0,400,20,0,0,400,20);
  writeFileSync(join(out,'eshop-welcome-hud-top.png'),crop.toBuffer('image/png'));
  assert.ok(rendered[68].top.equals(settled.top)&&rendered[68].top.equals(reduced.top),'settled/reduced upper pixels');
  assert.ok(rendered[68].bottom.equals(settled.bottom)&&rendered[68].bottom.equals(reduced.bottom),'settled/reduced lower pixels');
  assert.ok(draw(69+75).top.equals(rendered[69].top)&&draw(143).top.equals(draw(68+75*2).top),'wait_00 loop period');
  assert.ok(!rendered[110].top.equals(rendered[69].top),'idle loop changes the upper LCD');
  // The curtain is the only lower-LCD motion; frame 4 (alpha 0) is not drawn.
  const reveal=[0,1,2,3,4].map(pass=>draw(pass));
  for(const pass of [0,1,2,3])assert.ok(!reveal[pass].bottom.equals(settled.bottom)&&!reveal[pass].bottom.equals(reveal[pass+1].bottom),`curtain frame ${pass} covers the lower LCD`);
  for(const pass of passes.filter(pass=>pass>=4))assert.ok(rendered[pass].bottom.equals(settled.bottom),'the revealed lower LCD is static');
  const covered=draw(eshopExitEndPass(decided)-1,false,decided);
  const coverEqualsReveal0={top:covered.top.equals(reveal[0].top),bottom:covered.bottom.equals(reveal[0].bottom)};
  assert.ok(coverEqualsReveal0.top&&coverEqualsReveal0.bottom,'the covered exit equals the covered constructor frame on both LCDs');
  assert.ok(!draw(start+15,false,decided).bottom.equals(settled.bottom),'the cover starts with out_01');
  const save=(name,pass,decidedPass)=>{draw(pass,false,decidedPass);const pair=createCanvas(400,480),ctx=pair.getContext('2d');ctx.drawImage(top,0,0);ctx.drawImage(bottom,40,240);writeFileSync(join(out,name),pair.toBuffer('image/png'));return pair;};
  for(const pass of new Set([0,1,2,3,4,...passes]))save(`eshop-welcome-pass-${String(pass).padStart(3,'0')}.png`,pass);
  const exitPairs=exitPasses.map(pass=>save(`eshop-welcome-exit-d${decided}-pass-${String(pass).padStart(3,'0')}.png`,pass,decided));
  const sheet=createCanvas(400*5,240*Math.ceil(passes.length/5)),sctx=sheet.getContext('2d');
  passes.forEach((pass,i)=>{draw(pass);sctx.drawImage(top,(i%5)*400,Math.floor(i/5)*240);});writeFileSync(join(out,'eshop-welcome-upper-contact.png'),sheet.toBuffer('image/png'));
  const exitSheet=createCanvas(400*exitPairs.length,480),ectx=exitSheet.getContext('2d');exitPairs.forEach((pair,i)=>ectx.drawImage(pair,i*400,0));writeFileSync(join(out,'eshop-welcome-exit-contact.png'),exitSheet.toBuffer('image/png'));
  // Offline cost of one complete stock pair per source pass: entrance, one idle loop and the exit.
  const samples=[];for(let pass=0;pass<=eshopExitEndPass(143);pass++){const start=performance.now();drawNativeServiceFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view(pass,143),{font,date:hudDate});samples.push(performance.now()-start);}
  const sorted=[...samples].sort((a,b)=>a-b),round=v=>+v.toFixed(3);
  const benchmark={environment:'offline @napi-rs/canvas in Node; not browser, WebGL or device evidence',canvas:JSON.parse(readFileSync(join(dirname(options.canvasModule),'package.json'))).version,node:process.version,passes:samples.length,totalMs:round(samples.reduce((a,b)=>a+b,0)),meanMs:round(samples.reduce((a,b)=>a+b,0)/samples.length),p95Ms:round(sorted[Math.floor(sorted.length*.95)]),maxMs:round(sorted.at(-1)),firstPassMs:round(samples[0])};
  assert.deepEqual(assets.renderer.diagnostics,[]);
  const result={passed:true,passesPerSecond:ESHOP_WELCOME_PASS_HZ,passFromMs:[0,33,34,1000].map(v=>[v,eshopWelcomePass(v)]),curtainAlpha,poses,exit:{decided,start,end:eshopExitEndPass(decided),poses:exitPoses,coverEqualsReveal0},benchmark,gaps:[
   'Two VSyncs per pass (0x2eb2fc(2) at 0x2e4eac) are timed at a nominal 60 Hz VSync; the measured LCD rate is not established here.',
   'Whether the constructor pass also ticks in_00 and the BG reveal is unresolved: native may be one pass ahead during the entrance.',
   'The browser epoch is the first eShop application tick after the host launch transition, not the native splash/opening handoff; a native pair still loading after that consumes entrance passes.',
   'The input-dispatch task order relative to 0x2e4380 was not traced, so the first accepted OK may differ by one pass.',
   'The idle, disabled (invalid_00) and pressed OK poses keep the prior touchOff_00 frame 1; stopped bound animator application was not traced.',
   'Sound cues 0x100002f, 0x1000009 (0x28c184, 60), 0x1000033, 0x1000032 and the OK decide SE 0x100000e are not delivered.',
   'Adaptation: native continues to the excluded network step when 0x2e4248 retires; the browser returns HOME there and restarts the welcome on resume.',
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
