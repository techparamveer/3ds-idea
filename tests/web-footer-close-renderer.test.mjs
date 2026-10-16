import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
import {loadBitmapFont} from '../src/os/bitmap-font.ts';
import {nativePaneParentPath,poseNativeLayout} from '../src/os/native-layout.ts';
import {validateWebFooterFeedbackAssets,webFooterFeedbackFrame} from '../src/os/web-footer-close-assets.ts';
import {notificationsFooterCoverBindings,validateNotificationsFooterCoverAssets} from '../src/os/notifications-footer-close-assets.ts';
import {nativeMessageOverride} from '../src/os/native-layout.ts';

const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
function module(name,overrides={}){
 const url=new URL('../src/os/'+name+'.ts',import.meta.url);
 const source=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 return data(source.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+(overrides[n]??new URL(n.endsWith('.ts')?n:n+'.ts',url).href)+s));
}
const {loadNativeTitleAssets}=await import(module('native-title-assets',{'./native-renderer':module('native-renderer')}));
const tools=await import(module('stock-native-web'));
const base=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url),href='https://fixture.invalid/native/';
const view=appId=>({appId,screen:'main',rows:[],selection:0,heading:appId,footer:{}});

// Canvas is a byte transport, not a replacement renderer or geometry oracle.
// Every picture/texture/font raster still runs through the production renderer.
function canvas(){
 const c={width:1,height:1},stack=[];let pixels,transform={a:1,b:0,c:0,d:1,e:0,f:0};
 const buffer=()=>{if(pixels?.length!==c.width*c.height*4)pixels=new Uint8ClampedArray(c.width*c.height*4);return pixels;};
 const ctx={canvas:c,globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'#fff',
  save(){stack.push({...transform});},restore(){transform=stack.pop();},resetTransform(){transform={a:1,b:0,c:0,d:1,e:0,f:0};},
  getTransform:()=>({...transform}),translate(x,y){transform.e+=transform.a*x+transform.c*y;transform.f+=transform.b*x+transform.d*y;},
  scale(x,y){transform.a*=x;transform.b*=x;transform.c*=y;transform.d*=y;},
  rotate(angle){const {a,b,c,d}=transform,cos=Math.cos(angle),sin=Math.sin(angle);Object.assign(transform,{a:a*cos+c*sin,b:b*cos+d*sin,c:c*cos-a*sin,d:d*cos-b*sin});},
  beginPath(){},rect(){},clip(){},
  createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),
  getImageData(x,y,width,height){const image=this.createImageData(width,height),source=buffer();for(let row=0;row<height;row++)for(let col=0;col<width;col++){const sx=x+col,sy=y+row;if(sx>=0&&sy>=0&&sx<c.width&&sy<c.height)image.data.set(source.subarray((sy*c.width+sx)*4,(sy*c.width+sx)*4+4),(row*width+col)*4);}return image;},
  putImageData(image,x,y){const target=buffer();for(let row=0;row<image.height;row++)for(let col=0;col<image.width;col++){const dx=x+col,dy=y+row;if(dx>=0&&dy>=0&&dx<c.width&&dy<c.height)target.set(image.data.subarray((row*image.width+col)*4,(row*image.width+col)*4+4),(dy*c.width+dx)*4);}},
  clearRect(){buffer().fill(0);},fillRect(){const rgb=this.fillStyle==='#fff'?[255,255,255,255]:[0,0,0,255];const target=buffer();for(let at=0;at<target.length;at+=4)target.set(rgb,at);},
  drawImage(source,...args){const sourcePixels=source.data??source.getContext('2d').getImageData(0,0,source.width,source.height).data,sw=source.naturalWidth??source.width,sh=source.naturalHeight??source.height;
   const [sx,sy,w,h,dx,dy,dw,dh]=args.length===8?args:args.length===4?[0,0,sw,sh,...args]:[0,0,sw,sh,args[0],args[1],sw,sh],image=this.createImageData(Math.ceil(dw),Math.ceil(dh));
   for(let row=0;row<image.height;row++)for(let col=0;col<image.width;col++){const x=Math.floor(sx+col*w/dw),y=Math.floor(sy+row*h/dh);if(x>=0&&y>=0&&x<sw&&y<sh)image.data.set(sourcePixels.subarray((y*sw+x)*4,(y*sw+x)*4+4),(row*image.width+col)*4);}this.putImageData(image,Math.floor(dx),Math.floor(dy));
  },
 };
 c.getContext=()=>ctx;return c;
}

async function fixture(appId,run,brokenTexture=false){
 const names=['fetch','document','window','Image'],saved=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)])),nativeFetch=globalThis.fetch,fetched=[];
 const browser=appId==='browser',requests=browser?tools.browserScreenPacks:tools.miiverseScreenPacks,alias=browser?'web-exit':'web-back',name=browser?'ExitButton':'OliveBack';
 const footer=JSON.parse(readFileSync(new URL(requests.find(p=>p.alias===alias).url,base)));
 const texture=footer.textures[browser?'BtmBtnBase_00.bclim':'Toolbar_Btn_Exit_DecidedOn.bclim'].url;
 globalThis.fetch=async(url,options)=>{if(String(url).startsWith('blob:'))return nativeFetch(url,options);const path=String(url).slice(href.length);assert.ok(String(url).startsWith(href));fetched.push(path);return brokenTexture&&path===texture?new Response(null,{status:404}):new Response(readFileSync(new URL(path,base)));};
 globalThis.document={createElement:name=>{assert.equal(name,'canvas');return canvas();}};
 globalThis.window={location:{href}};
 globalThis.Image=class{async decode(){const response=await nativeFetch(this.src),{data,info}=await sharp(Buffer.from(await response.arrayBuffer())).ensureAlpha().raw().toBuffer({resolveWithObject:true});this.data=new Uint8ClampedArray(data);this.width=this.naturalWidth=info.width;this.height=this.naturalHeight=info.height;}};
 let assets,shared,home;
 try{
  shared=await loadBitmapFont(href+'fonts/shared/font.json');
  assets=await loadNativeTitleAssets(href+'manifest.json',browser?'0004003000009d02':'000400300000be02',requests,new Map([['cbf_std.bcfnt',shared]]));
  home=await loadNativeTitleAssets(href+'manifest.json','0004003000009802',[
   {url:'packs/home/common.json',alias:'common',layouts:['CmnFade_U_00','CmnFade_D_00'],animations:['CmnFade_U_00_SceneOut','CmnFade_D_00_SceneOut','CmnFade_U_00_SceneIn','CmnFade_D_00_SceneIn','CmnFade_D_00_Aplt']},
   {url:'packs/home/messages-and-loose.json',alias:'messages',layouts:[],animations:[]},
  ],new Map([['cbf_std.bcfnt',shared]]));
  await run(assets,fetched,{alias,name,texture,home:home.renderer,shared});
 }finally{assets?.dispose();home?.dispose();shared?.dispose();for(const[name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
}
const source=readFileSync(new URL('../src/os/firmware-presentation.ts',import.meta.url),'utf8'),ast=ts.createSourceFile('firmware-presentation.ts',source,ts.ScriptTarget.Latest,true),functions=[];
function visit(node){if(ts.isFunctionDeclaration(node)&&['notificationsFooterCover','notesFooterReturnLabel'].includes(node.name?.text))functions.push(node.getText(ast));ts.forEachChild(node,visit);}visit(ast);assert.equal(functions.length,2);
const createCover=new Function('renderer','notificationsFooterCoverBindings','validateNotificationsFooterCoverAssets','nativeMessageOverride',
 ts.transpileModule(functions.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nreturn notificationsFooterCover;');

for(const appId of ['browser','miiverse']){
 test(appId+': real loader/renderer retain first/repeat body and HUD through feedback and draw the actual common cover on both LCDs',async()=>{
  for(let cycle=0;cycle<2;cycle++)await fixture(appId,async({renderer,dispose},fetched,{alias,name,texture,home,shared})=>{
   const original=JSON.stringify(renderer.packs),aliases=Object.keys(renderer.packs),top=canvas(),bottom=canvas();top.width=400;top.height=240;bottom.width=320;bottom.height=240;
   const options={date:new Date(0),font:shared},draw=frame=>tools.drawNativeWebFrame(renderer,top.getContext('2d'),bottom.getContext('2d'),view(appId),{...options,...(frame===undefined?{}:{webFooterClose:{frame}})});
   assert.equal(draw(),true,renderer.diagnostics.join('\n'));const stableTop=top.getContext('2d').getImageData(0,0,400,240).data;
   validateWebFooterFeedbackAssets(renderer.packs,appId);
   const feedbackPixels=[];
   for(let frame=0;frame<=5;frame++){
    assert.equal(draw(frame),true,renderer.diagnostics.join('\n'));
    assert.deepEqual(top.getContext('2d').getImageData(0,0,400,240).data,stableTop,'feedback leaves the upper body/HUD unchanged');
    feedbackPixels.push(bottom.getContext('2d').getImageData(0,0,320,240).data);
   }
   assert.notDeepEqual(feedbackPixels[0],feedbackPixels[5],'decoded feedback must alter rendered lower pixels');
   assert.ok(fetched.includes(texture),'selected animation-only textures must be loaded');
   if(appId==='miiverse')assert.ok(renderer.textures[alias].has('Toolbar_Btn_Exit_DecidedOn.bclim'));
   const cover=createCover(home,notificationsFooterCoverBindings,validateNotificationsFooterCoverAssets,nativeMessageOverride);
   for(const kind of ['out','in'])for(const frame of [0,5,10,20])assert.equal(cover(top.getContext('2d'),bottom.getContext('2d'),kind,frame),true,home.diagnostics.join('\n'));
   assert.equal(home.diagnostics.length,0);assert.equal(renderer.diagnostics.length,0);
   assert.ok(renderer.cacheBytes>0);assert.deepEqual(Object.keys(renderer.packs),aliases);assert.equal(JSON.stringify(renderer.packs),original);
   renderer.textures[alias].clear();assert.equal(draw(4),false,'selected texture loss cannot manufacture a successful pair');
   assert.match(renderer.diagnostics.at(-1),/Missing native texture/);
   dispose();dispose();assert.equal(renderer.cacheBytes,0);assert.equal(renderer.draw(bottom.getContext('2d'),alias,name),false);
   assert.deepEqual(Object.keys(renderer.packs),[]);
  });
 });
 test(appId+': missing selected feedback bytes reject the actual loader before readiness',async()=>{
  await assert.rejects(fixture(appId,()=>assert.fail('missing texture cannot become ready'),true),/Native title texture HTTP 404/);
 });
 test(appId+': caller paints only delivered footer tracks and retains all other source draws',()=>{
  const requests=appId==='browser'?tools.browserScreenPacks:tools.miiverseScreenPacks,packs=Object.fromEntries(requests.map(p=>[p.alias,JSON.parse(readFileSync(new URL(p.url,base)))])),calls=[];
  const alias=appId==='browser'?'web-exit':'web-back',name=appId==='browser'?'ExitButton':'OliveBack';
  const renderer={packs,draw(ctx,alias,name,options={}){calls.push({ctx,alias,name,options});for(const attachment of Object.values(options.attachments??{}))attachment();return true;}},ctx={fillText(){}};
  const options={date:new Date(0),font:{draw(){}}};
  assert.equal(tools.drawNativeWebFrame(renderer,ctx,ctx,view(appId),options),true);const ordinary=calls.splice(0);
  for(const frame of [0,4,5]){
   assert.equal(tools.drawNativeWebFrame(renderer,ctx,ctx,view(appId),{...options,webFooterClose:{frame}}),true);
   const retained=rows=>rows.filter(r=>r.alias!==alias).map(({options,...r})=>({...r,options:{...options,attachments:undefined}}));
   assert.deepEqual(retained(calls),retained(ordinary));
   assert.deepEqual(calls.find(c=>c.alias===alias).options.bindings,[{name:name+'_FocusedOnOff',frame:0},{name:name+'_DecidedOn',frame}]);calls.length=0;
  }
  for(const frame of [-1,6,.5,NaN])assert.throws(()=>webFooterFeedbackFrame(frame),/Invalid/);
  for(const mutate of [p=>delete p.animations[name+'_DecidedOn'],p=>p.animations[name+'_DecidedOn'].unsupported.push('unknown'),p=>p.resourceSources.animations[name+'_DecidedOn'].sha256='wrong',p=>p.animations[name+'_DecidedOn'].tracks[0].target='missing',p=>p.animations[name+'_DecidedOn'].textures.push('missing')]){
   const broken=structuredClone(packs[alias]);mutate(broken);assert.throws(()=>validateWebFooterFeedbackAssets({...packs,[alias]:broken},appId),/Unsupported/);
  }
  assert.throws(()=>tools.drawNativeWebFrame(renderer,ctx,ctx,{...view(appId),screen:'detail'},{...options,webFooterClose:{frame:0}}),/requires main/);
 });
}
