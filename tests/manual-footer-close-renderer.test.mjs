import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
import {loadBitmapFont} from '../src/os/bitmap-font.ts';

const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
function module(name,overrides={}){
 const url=new URL('../src/os/'+name+'.ts',import.meta.url);
 const source=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 return data(source.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+(overrides[n]??new URL(n.endsWith('.ts')?n:n+'.ts',url).href)+s));
}
const {loadNativeTitleAssets}=await import(module('native-title-assets',{'./native-renderer':module('native-renderer')}));
const helpers=await import(module('stock-native-helpers',{'./stock-native-amiibo':data('export const amiiboScreenPacks=[];export const drawNativeAmiibo=()=>false;')}));
const base=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url),href='https://fixture.invalid/native/';
const view={appId:'manual',screen:'main',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},data:{manualTitleId:'0004001000022400'}};

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
 const footer=JSON.parse(readFileSync(new URL('packs/manual/layout-BtnCloseLng00.json',base))),texture=footer.textures[footer.layouts.BtnCloseLng00.textures[0]].url;
 globalThis.fetch=async(url,options)=>{if(String(url).startsWith('blob:'))return nativeFetch(url,options);const path=String(url).slice(href.length);assert.ok(String(url).startsWith(href));fetched.push(path);return brokenTexture&&path===texture?new Response(null,{status:404}):new Response(readFileSync(new URL(path,base)));};
 globalThis.document={createElement:name=>{assert.equal(name,'canvas');return canvas();}};
 globalThis.window={location:{href}};
 globalThis.Image=class{async decode(){const response=await nativeFetch(this.src),{data,info}=await sharp(Buffer.from(await response.arrayBuffer())).ensureAlpha().raw().toBuffer({resolveWithObject:true});this.data=new Uint8ClampedArray(data);this.width=this.naturalWidth=info.width;this.height=this.naturalHeight=info.height;}};
 let assets,shared;
 try{shared=await loadBitmapFont(href+'fonts/shared/font.json');assets=await loadNativeTitleAssets(href+'manifest.json','0004003000009b02',helpers.nativeHelperView(view).packs,new Map([['cbf_std.bcfnt',shared]]));await run(assets,fetched);}
 finally{assets?.dispose();shared?.dispose();for(const[name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
}

test('real Manual loader and renderer publish first/repeat Contents and both Close feedback poses without losing source textures',async()=>{
 for(let cycle=0;cycle<2;cycle++)await fixture(async({renderer,dispose},fetched)=>{
 const original=JSON.stringify(renderer.packs['manual-footer-close']),aliases=Object.keys(renderer.packs),top=canvas(),bottom=canvas();top.width=400;top.height=240;bottom.width=320;bottom.height=240;
 const draw=options=>helpers.drawNativeHelperFrame(renderer,top.getContext('2d'),bottom.getContext('2d'),view,options);
 assert.equal(draw(),true,renderer.diagnostics.join('\n'));
 assert.equal(draw({manualFooterClose:{frame:0}}),true,renderer.diagnostics.join('\n'));
 assert.equal(draw({manualFooterClose:{frame:1}}),true,renderer.diagnostics.join('\n'));
 assert.ok(renderer.cacheBytes>0);assert.ok(fetched.some(path=>path.endsWith('.png')));
 assert.deepEqual(Object.keys(renderer.packs),aliases,'fitted feedback cannot add an alias without loaded textures');
 // Existing Contents preparation adapts row layouts; feedback must not mutate any further source packs.
 const prepared=JSON.stringify(renderer.packs);assert.equal(draw({manualFooterClose:{frame:0}}),true);assert.equal(JSON.stringify(renderer.packs),prepared);
 assert.equal(JSON.stringify(renderer.packs['manual-footer-close']),original);
 renderer.textures['manual-footer-close'].clear();
 assert.equal(draw({manualFooterClose:{frame:1}}),false,'missing decoded selected textures must still fail composition');
 assert.match(renderer.diagnostics.at(-1),/manual-footer-close\/BtnCloseLng00: Missing native texture/);
 dispose();dispose();assert.equal(renderer.cacheBytes,0);assert.equal(renderer.draw(bottom.getContext('2d'),'manual-footer-close','BtnCloseLng00'),false);
 assert.deepEqual(Object.keys(renderer.packs),[]);
 });
});

test('missing selected Manual texture bytes fail the real loader instead of manufacturing a ready renderer',async()=>{
 await assert.rejects(fixture(()=>assert.fail('missing texture cannot reach readiness'),true),/Native title texture HTTP 404/);
});
