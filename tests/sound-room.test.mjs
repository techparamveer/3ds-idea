import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import * as THREE from 'three';
const cache=new Map();function moduleUrl(path){if(cache.has(path))return cache.get(path);let s=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;s=s.replace(/from (['"])([^'"]+)\1/g,(_,q,v)=>'from '+JSON.stringify(v.startsWith('.')?moduleUrl(resolve(dirname(path),v.endsWith('.ts')?v:v+'.ts')):import.meta.resolve(v)));const u='data:text/javascript;base64,'+Buffer.from(s).toString('base64');cache.set(path,u);return u;}
const {createSoundRoom,soundRoomCamera}=await import(moduleUrl(fileURLToPath(new URL('../src/scene/sound-room.ts',import.meta.url))));
const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url),root=new URL('models/sound-room/',firmware),data=JSON.parse(readFileSync(new URL('model.json',root)));
const asset=()=>({data:structuredClone(data),mipmaps:new Map(data.textures.map(t=>[t.name,t.mipmaps.map(m=>({width:m.width,height:m.height,data:new Uint8Array(m.width*m.height*4)}))])),images:new Map(data.textures.map(t=>[t.name,{width:t.width,height:t.height,data:new Uint8Array(t.width*t.height*4)}]))});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(t){
 const original=globalThis.document,puts=[];globalThis.document={createElement(){return{width:0,height:0,getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)};},putImageData(image){puts.push(image.data);}};}};}};t.after(()=>{globalThis.document=original;});
 const initial={target:{old:true},color:new THREE.Color(.2,.4,.6),alpha:.3,viewport:new THREE.Vector4(1,2,3,4),scissor:new THREE.Vector4(5,6,7,8),scissorTest:true};let current={...initial},renders=0,readbacks=0,fail=false,nativeViewportSets=0;
 const renderer={toneMapping:THREE.ACESFilmicToneMapping,autoClear:true,getRenderTarget:()=>current.target,setRenderTarget:x=>current.target=x,getClearColor:x=>x.copy(current.color),getClearAlpha:()=>current.alpha,setClearColor:(x,a)=>{current.color=new THREE.Color(x);current.alpha=a;},getViewport:x=>x.copy(current.viewport),setViewport:(...v)=>{if(current.target?.width===400)nativeViewportSets++;current.viewport=v.length===1?v[0].clone():new THREE.Vector4(...v);},getScissor:x=>x.copy(current.scissor),setScissor:v=>current.scissor=v.clone(),getScissorTest:()=>current.scissorTest,setScissorTest:v=>current.scissorTest=v,clear(){},render(){renders++;if(fail)throw Error('GPU failed');},readRenderTargetPixels(t,x,y,w,h,pixels){readbacks++;pixels.fill(0);pixels[0]=72;pixels[(h-1)*w*4]=93;}};
 return {renderer,puts,initial,current:()=>current,counts:()=>[renders,readbacks],nativeViewportSets:()=>nativeViewportSets,fail:()=>{fail=true;}};
}
test('room delivery keeps source camera/model/texture closure and texture-only native RGB',()=>{
 const manifest=JSON.parse(readFileSync(new URL('manifest.json',firmware)));assert.equal(manifest.models['sound-room'],'models/sound-room/model.json');
 for(const name of ['model.json',...data.textures.flatMap(t=>[t.url,...t.mipmaps.map(m=>m.url)])]){const bytes=readFileSync(new URL(name,root)),record=manifest.resources['models/sound-room/'+name];assert.equal(record.sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(record.size,bytes.length);}
 const camera=soundRoomCamera(asset());assert.deepEqual(camera.position.toArray(),[0,5,11.5]);assert.equal(camera.aspect,1.63636);assert.ok(Math.abs(camera.fov* Math.PI/180-.759536)<1e-12);
 for(const m of data.models[0].materials){const p=m.MaterialParams;assert.equal(p.TexEnvStages[0].Combiner.Color,'Replace');assert.equal(p.TexEnvStages[0].Source.Color[0],'Texture0');assert.ok(p.TexEnvStages.slice(1).every(s=>s.Combiner.Color==='Replace'&&s.Source.Color[0]==='Previous'));assert.equal(p.DepthColorMask.Enabled,false);}
 const replacement=data.models[0].materials.find(m=>m.Name==='lambert2').MaterialParams;assert.deepEqual([replacement.BlendFunction.ColorSrcFunc,replacement.BlendFunction.ColorDstFunc],['One','Zero']);
 const invalid=asset();invalid.images.delete('S_BG_U_Tx_A');assert.throws(()=>soundRoomCamera(invalid),/Incomplete/);
});
test('room drops late owner completions and retains one opaque static render per owner',async t=>{
 const f=setup(t),pending=[];let changes=0;const room=createSoundRoom(f.renderer,()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))),changed=()=>changes++,ctx={drawImage(){}};
 assert.equal(room.prepare('sound:1',changed).status,'loading');room.prepare(null,changed);pending[0].resolve(asset());await flush();assert.equal(changes,0);assert.equal(room.draw(ctx),false);
 room.prepare('sound:2',changed);pending[1].resolve(asset());await flush();assert.equal(changes,1);assert.equal(room.prepare('sound:2',changed).status,'ready');
 assert.equal(room.draw(ctx),true);assert.equal(room.draw(ctx),true);assert.deepEqual(f.counts(),[1,1]);assert.equal(f.nativeViewportSets(),0,'native target viewport must bypass page DPR');assert.equal(f.puts[0][0],93);assert.equal(f.puts[0][239*400*4],72);assert.ok(f.puts[0].every((v,i)=>i%4!==3||v===255));
 assert.deepEqual(f.current(),f.initial);assert.equal(f.renderer.autoClear,true);assert.equal(f.renderer.toneMapping,THREE.ACESFilmicToneMapping);
 room.prepare(null,changed);assert.equal(room.draw(ctx),false);room.dispose();assert.equal(room.prepare('late',changed).status,'inactive');
});
test('room failure restores renderer and invalid resources reach an explicit error',async t=>{
 const f=setup(t);const room=createSoundRoom(f.renderer,async()=>asset());room.prepare('sound:1',()=>{});await flush();f.fail();assert.throws(()=>room.draw({drawImage(){}}),/GPU failed/);assert.deepEqual(f.current(),f.initial);room.dispose();
 const broken=createSoundRoom(f.renderer,async()=>{const a=asset();a.data.models[0].name='Wrong';return a;});broken.prepare('sound:1',()=>{});await flush();assert.equal(broken.prepare('sound:1',()=>{}).status,'error');broken.dispose();
});

test('Sound main inserts the room after the base and before chrome; playback omits it',async()=>{
 const {drawNativeSoundFrame}=await import(moduleUrl(fileURLToPath(new URL('../src/os/stock-native-sound.ts',import.meta.url))));
 const sequence=[],renderer={packs:{'sound-messages':{messages:{}}},draw(ctx,pack,layout){sequence.push(layout);return true;}},top={},bottom={};
 const view={appId:'sound',screen:'main',heading:'',rows:[],selection:0,footer:{},data:{tracks:[]}},soundRoom={draw(ctx){assert.equal(ctx,top);sequence.push('ROOM');return true;}};
 assert.equal(drawNativeSoundFrame(renderer,top,bottom,view,{soundRoom}),true);
 assert.ok(sequence.indexOf('ROOM')>sequence.indexOf('S_BG'));assert.ok(sequence.indexOf('ROOM')<sequence.indexOf('S_Inf_U-TitleBar'));
 sequence.length=0;drawNativeSoundFrame(renderer,top,bottom,{...view,screen:'playback'},{soundRoom});assert.equal(sequence.includes('ROOM'),false);
});

test('room opts into authored mip chains while ordinary CGFX keeps its existing sampling',async()=>{
 const {createFirmwareModel}=await import(moduleUrl(fileURLToPath(new URL('../src/scene/firmware-model.ts',import.meta.url))));
 const native=createFirmwareModel(asset(),{}, {nativeMipmaps:true}),legacy=createFirmwareModel(asset());
 const textures=model=>{const set=new Set();model.group.traverse(m=>{if(m.isMesh)set.add(m.material.uniforms.tex0.value);});return [...set];};
 try{
  const originals=textures(native);assert.deepEqual(originals.map(t=>t.mipmaps.length).sort(),[4,5]);
  for(const t of originals){assert.equal(t.minFilter,THREE.LinearMipmapNearestFilter);assert.equal(t.magFilter,THREE.LinearFilter);assert.equal(t.generateMipmaps,false);assert.equal(t.wrapS,THREE.RepeatWrapping);assert.equal(t.wrapT,THREE.RepeatWrapping);for(let i=0;i<t.mipmaps.length;i++){assert.equal(t.mipmaps[i].width,t.image.width>>i);assert.equal(t.mipmaps[i].height,t.image.height>>i);}}
  for(const t of textures(legacy)){assert.equal(t.minFilter,THREE.LinearFilter);assert.deepEqual(t.mipmaps,[]);}
 }finally{native.dispose();legacy.dispose();}
 const missing=asset();missing.mipmaps.delete('S_BG_U_Tx_A');assert.throws(()=>createFirmwareModel(missing,{}, {nativeMipmaps:true}),/Incomplete native mip chain/);
 const biased=asset();biased.data.models[0].materials[0].TextureMappers[0].LODBias=1;assert.throws(()=>createFirmwareModel(biased,{}, {nativeMipmaps:true}),/Unsupported native mip sampler/);
});

test('authored room mip metadata covers every native byte with no synthesized levels',()=>{
 assert.deepEqual(data.textures.map(t=>t.nativeMipCount),[5,4]);
 for(const [index,t] of data.textures.entries()){
  let offset=t.width*t.height*(index===0?1:.5);
  for(const [n,m] of t.mipmaps.entries()){
   assert.equal(m.level,n+1);assert.equal(m.width,t.width>>(n+1));assert.equal(m.height,t.height>>(n+1));assert.equal(m.sourceOffset,offset);assert.equal(m.sourceSize,m.width*m.height*(index===0?1:.5));assert.match(m.sourceSha256,/^[0-9a-f]{64}$/);offset+=m.sourceSize;
   assert.equal(createHash('sha256').update(readFileSync(new URL(m.url,root))).digest('hex'),m.sha256);
  }
  assert.equal(offset,index===0?21824:21760);
 }
});

test('room loader requests every authored level and rejects a missing mip instead of downgrading',async t=>{
 const {loadFirmwareModel}=await import(moduleUrl(fileURLToPath(new URL('../src/scene/firmware-model.ts',import.meta.url))));
 const previous={fetch:globalThis.fetch,window:globalThis.window};t.after(()=>{globalThis.fetch=previous.fetch;globalThis.window=previous.window;});
 const calls=[];let absent='';globalThis.window={location:{href:'https://sound.invalid/'}};
 globalThis.fetch=async value=>{const name=new URL(value,globalThis.window.location.href).pathname.split('/').at(-1);calls.push(name);return name===absent?new Response('',{status:404}):new Response(readFileSync(new URL(name,root)));};
 const loaded=await loadFirmwareModel('/model.json');assert.deepEqual([...loaded.mipmaps.values()].map(m=>m.length),[4,3]);assert.equal(calls.length,10);
 absent='texture-0-mip-2.png';await assert.rejects(loadFirmwareModel('/model.json'),/Model mip HTTP 404/);
});
