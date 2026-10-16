import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
import {loadBitmapFont} from '../src/os/bitmap-font.ts';
import {nativePaneParentPath,poseNativeLayout} from '../src/os/native-layout.ts';
import {validateFriendsFooterCloseAssets,drawFriendsFooterCover} from '../src/os/friends-footer-close-assets.ts';

const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
function module(name,overrides={}){
 const url=new URL('../src/os/'+name+'.ts',import.meta.url);
 const source=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 return data(source.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+(overrides[n]??new URL(n.endsWith('.ts')?n:n+'.ts',url).href)+s));
}
const {loadNativeTitleAssets}=await import(module('native-title-assets',{'./native-renderer':module('native-renderer')}));
const tools=await import(module('stock-native-personal-tools'));
const base=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url),href='https://fixture.invalid/native/';
const view={appId:'friends',screen:'main',rows:[{id:'profile',label:'Profile'}],selection:0,heading:'Friend List',data:{settings:{nickname:'Portfolio'}}};

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
async function fixture(run,brokenTexture=false){
 const names=['fetch','document','window','Image'],saved=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)])),nativeFetch=globalThis.fetch,fetched=[];
 const cover=JSON.parse(readFileSync(new URL('packs/friends/incoming.json',base))),texture=cover.textures['LncApltPictHome_00.bclim'].url;
 globalThis.fetch=async(url,options)=>{if(String(url).startsWith('blob:'))return nativeFetch(url,options);const path=String(url).slice(href.length);assert.ok(String(url).startsWith(href));fetched.push(path);return brokenTexture&&path===texture?new Response(null,{status:404}):new Response(readFileSync(new URL(path,base)));};
 globalThis.document={createElement:name=>{assert.equal(name,'canvas');return canvas();}};
 globalThis.window={location:{href}};
 globalThis.Image=class{async decode(){const response=await nativeFetch(this.src),{data,info}=await sharp(Buffer.from(await response.arrayBuffer())).ensureAlpha().raw().toBuffer({resolveWithObject:true});this.data=new Uint8ClampedArray(data);this.width=this.naturalWidth=info.width;this.height=this.naturalHeight=info.height;}};
 let assets,shared;
 try{shared=await loadBitmapFont(href+'fonts/shared/font.json');assets=await loadNativeTitleAssets(href+'manifest.json','0004003000009f02',tools.nativePersonalToolView(view).packs,new Map([['cbf_std.bcfnt',shared]]));await run(assets,fetched);}
 finally{assets?.dispose();shared?.dispose();for(const[name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
}

test('real Friends loader, font and renderer draw first/repeat Close feedback and both original LCD covers',async()=>{
 for(let cycle=0;cycle<2;cycle++)await fixture(async({renderer,dispose},fetched)=>{
 const original=JSON.stringify(renderer.packs),aliases=Object.keys(renderer.packs),top=canvas(),bottom=canvas();top.width=400;top.height=240;bottom.width=320;bottom.height=240;
 const draw=options=>tools.drawNativePersonalToolFrame(renderer,top.getContext('2d'),bottom.getContext('2d'),view,options??{});
 validateFriendsFooterCloseAssets(renderer.packs);
 assert.equal(draw(),true,renderer.diagnostics.join('\n'));
 for(const frame of [0,1,2,3,4,5])assert.equal(draw({friendsFooterClose:{kind:'feedback',frame}}),true,renderer.diagnostics.join('\n'));
 for(const frame of [0,5,10,20])assert.equal(draw({friendsFooterClose:{kind:'out',frame}}),true,renderer.diagnostics.join('\n'));
 assert.ok(renderer.cacheBytes>0);assert.ok(fetched.some(path=>path.endsWith('.png')));
 assert.deepEqual(Object.keys(renderer.packs),aliases,'fitted feedback cannot add an alias without loaded textures');
 assert.equal(JSON.stringify(renderer.packs),original);
 assert.equal(renderer.diagnostics.length,0);
 for(const name of renderer.packs['friends-incoming'].layouts.FrdCmnFade_D_00.textures)assert.ok(renderer.textures['friends-incoming'].has(name));
 renderer.textures['friends-incoming'].clear();
 assert.equal(draw({friendsFooterClose:{kind:'out',frame:20}}),false,'missing decoded selected textures must fail composition');
 assert.match(renderer.diagnostics.at(-1),/friends-incoming\/FrdCmnFade_D_00: Missing native texture/);
 dispose();dispose();assert.equal(renderer.cacheBytes,0);assert.equal(renderer.draw(bottom.getContext('2d'),'friends-incoming','FrdCmnFade_D_00'),false);
 assert.deepEqual(Object.keys(renderer.packs),[]);
 });
});

test('missing selected Friends HOME-icon bytes fail the real loader before readiness',async()=>{
 await assert.rejects(fixture(()=>assert.fail('missing texture cannot reach readiness'),true),/Native title texture HTTP 404/);
});

test('exact Friends source tracks preserve HOME icon/plain text and reject changed cover resources before drawing',()=>{
 const requests=tools.nativePersonalToolView(view).packs,packs=Object.fromEntries(requests.map(r=>[r.alias,JSON.parse(readFileSync(new URL(r.url,base)))]));
 const source=packs['friends-incoming'],draws=[];
 const renderer={packs,draw(ctx,alias,name,options){draws.push({ctx,alias,name,options,posed:poseNativeLayout(packs[alias].layouts[name],packs[alias].animations,options.bindings,options.overrides)});return true;}};
 for(let frame=0;frame<=20;frame++){
  assert.equal(drawFriendsFooterCover(renderer,'upper','lower',frame),true);
  const [upper,lower]=draws.slice(-2),pane=name=>nativePaneParentPath(lower.posed,name).at(-1);
  assert.equal(upper.name,'FrdCmnFade_U_00');assert.equal(lower.name,'FrdCmnFade_D_00');
  assert.equal(pane('P_Home_00').flags&1,1);assert.equal(pane('P_Aplt_00').flags&1,0);
  assert.equal(pane('T_Home_00').text.value,'HOME Menu');assert.equal(pane('T_Home_00').text.messageStyle,undefined);
  const material=lower.posed.materials[pane('P_Home_00').picture.material];
  assert.equal(lower.posed.textures[material.textureMaps[0].texture],'LncApltPictHome_00.bclim');
  if(frame===0||frame===20){assert.equal(pane('P_Bg_D_00').alpha,frame?255:0);assert.equal(pane('P_Belt_00').translation[0],frame?0:80);}
 }
 for(const mutate of [p=>delete p.animations.FrdCmnFade_D_00_SceneOut,p=>p.animations.FrdCmnFade_U_00_SceneOut.tracks[0].keys[0].slope=10,p=>p.returnTextBinding.caller.commandType=1,p=>p.messages.friend_msbt_LZ.messages[1].text='Wrong label',p=>p.layouts.FrdCmnFade_D_00.materials[1].textureMaps[0].texture=0]){
  const altered=structuredClone(source);mutate(altered);let called=false;
  assert.throws(()=>drawFriendsFooterCover({packs:{...packs,'friends-incoming':altered},draw(){called=true;}},{},{},20),/Unsupported/);assert.equal(called,false);
 }
 for(const frame of[-1,21,.5,NaN])assert.throws(()=>drawFriendsFooterCover(renderer,{},{},frame),/Invalid/);
});
