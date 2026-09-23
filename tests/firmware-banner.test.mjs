import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
import {bannerFrameData,hasAuthoredFrame} from './helpers/banner-frame.mjs';

const modules=new Map();
function moduleUrl(path){
 if(modules.has(path))return modules.get(path);
 let code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/from (['"])([^'"]+)\1/g,(_,quote,specifier)=>`from ${JSON.stringify(specifier.startsWith('.')?moduleUrl(resolve(dirname(path),specifier+'.ts')):import.meta.resolve(specifier))}`);
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');modules.set(path,url);return url;
}
const {createFirmwareBanner}=await import(moduleUrl(fileURLToPath(new URL('../src/scene/firmware-banner.ts',import.meta.url))));
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const frame=Object.freeze({visible:true,scale:.8,yawRadians:.31,skeletalFrame:0,materialFrame:0,nativeDisplacementY:0,offsetX:0,offsetY:0});
function setup(t,{failure,alterBind=false,delayFrame,invalidFrame=false}={}){
 const prior={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch};
 globalThis.document={createElement(){return {width:0,height:0,getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}};}};
 globalThis.window={location:{href:'https://firmware.test/'}};
 globalThis.fetch=async input=>{
  const path=new URL(String(input),globalThis.window.location.href).pathname;
  if(failure&&path.includes(failure))return new Response('',{status:503});
  if(path.endsWith('/banner-frame/model.json')){
   if(delayFrame)await delayFrame;
   const data=bannerFrameData();if(invalidFrame)data.models[0].materials[0].MaterialParams.StencilTest.Function='Invalid';
   return new Response(JSON.stringify(data));
  }
  let data=readFileSync(resolve(publicRoot,'.'+path));
  if(alterBind&&path.endsWith('/folder/model.json')){
   const model=JSON.parse(data);Object.assign(model.models[0].transform,{M11:1.2,M22:.9,M33:1.1,M41:2,M43:.4});data=JSON.stringify(model);
  }
  return new Response(data);
 };
 const state={target:null,color:new THREE.Color(.2,.3,.4),alpha:.7,viewport:new THREE.Vector4(1,2,3,4),scissor:new THREE.Vector4(5,6,7,8),scissorTest:true,stencilClear:7};
 const draws=[],events=[],renderer={toneMapping:THREE.ACESFilmicToneMapping,autoClear:false,
  getRenderTarget:()=>state.target,setRenderTarget(value){state.target=value;events.push(['target',value]);},
  getContext:()=>({STENCIL_CLEAR_VALUE:0x0b91,getParameter:()=>state.stencilClear}),
  state:{buffers:{stencil:{setClear(value){state.stencilClear=value;events.push(['stencilClear',value]);}}}},
  getClearColor:value=>value.copy(state.color),getClearAlpha:()=>state.alpha,setClearColor(value,alpha){state.color.set(value);state.alpha=alpha;},
  getViewport:value=>value.copy(state.viewport),setViewport(...values){values.length===1?state.viewport.copy(values[0]):state.viewport.set(...values);},
  getScissor:value=>value.copy(state.scissor),setScissor:value=>state.scissor.copy(value),getScissorTest:()=>state.scissorTest,setScissorTest:value=>{state.scissorTest=value;},
  clear(...buffers){events.push(['clear',buffers,state.stencilClear,state.target]);},
  render(scene,camera){scene.updateMatrixWorld(true);draws.push({scene,camera});events.push(['render',scene,renderer.autoClear]);},readRenderTargetPixels(target,x,y,w,h,pixels){pixels.fill(0);events.push(['readback',target]);}
 };
 let paints=0;const ctx={drawImage(){paints++;}},banner=createFirmwareBanner(renderer);
 t.after(()=>{banner.dispose();Object.assign(globalThis,prior);});
 return {banner,renderer,state,draws,events,ctx,paints:()=>paints};
}
const primary=scene=>scene.children.find(group=>group.renderOrder===2);
const mask=scene=>scene.children.find(group=>group.renderOrder===1);
function snapshot(group){
 const meshes=[];group.traverse(node=>{if(node.isMesh)meshes.push({positions:[...node.geometry.attributes.position.array],uniforms:Object.fromEntries(Object.entries(node.material.uniforms).filter(([name])=>name.startsWith('constant')||name.startsWith('uvMatrix')).map(([name,{value}])=>[name,value.toArray()]))});});
 return {position:group.position.toArray(),scale:group.scale.toArray(),yaw:group.rotation.y,inner:group.children.map(child=>child.matrix.toArray()),meshes};
}

test('explicit folder paints sample independent frames repeatedly and preserve the inner bind transform',async t=>{
 const h=setup(t,{alterBind:true});
 assert.equal(h.banner.drawFrame(h.ctx,{...frame,visible:false}),false,'not loaded yet');
 await h.banner.ready;assert.equal(h.banner.status().ready,true);
 const originalState=structuredClone({alpha:h.state.alpha,viewport:h.state.viewport.toArray(),scissor:h.state.scissor.toArray(),scissorTest:h.state.scissorTest});
 const label={width:256,height:64,data:new Uint8ClampedArray(256*64*4).fill(255)};
 assert.equal(h.banner.drawFrame(h.ctx,frame,label),true);
 const group=primary(h.draws.at(-1).scene),first=snapshot(group);
 assert.deepEqual(first.scale,[.8,.8,.8]);assert.equal(first.yaw,.31);
 assert.deepEqual([first.inner[0][0],first.inner[0][5],first.inner[0][10],first.inner[0][12],first.inner[0][14]],[1.2,.9,1.1,2,.4]);
 const text=group.children[0].children.find(mesh=>mesh.visible&&mesh.material.uniforms.tex0.value.image.width===256),texture=text.material.uniforms.tex0.value,version=texture.version;
 assert.equal(h.banner.drawFrame(h.ctx,frame,label),true);assert.deepEqual(snapshot(group),first);assert.equal(texture.version,version);
 assert.equal(h.banner.drawFrame(h.ctx,Object.freeze({...frame,skeletalFrame:75}),label),true);
 const moved=snapshot(group);assert.notDeepEqual(moved.meshes.map(m=>m.positions),first.meshes.map(m=>m.positions));
 assert.deepEqual(moved.meshes.map(m=>m.uniforms),first.meshes.map(m=>m.uniforms));
 assert.equal(h.banner.drawFrame(h.ctx,Object.freeze({...frame,skeletalFrame:75,materialFrame:225}),label),true);
 const changed=snapshot(group);assert.deepEqual(changed.meshes.map(m=>m.positions),moved.meshes.map(m=>m.positions));
 assert.notDeepEqual(changed.meshes.map(m=>m.uniforms),moved.meshes.map(m=>m.uniforms));
 assert.equal(h.banner.drawFrame(h.ctx,frame,label),true);assert.deepEqual(snapshot(group),first,'returning to a checkpoint does not retain later playback');
 assert.equal(h.renderer.toneMapping,THREE.ACESFilmicToneMapping);assert.equal(h.renderer.autoClear,false);assert.equal(h.state.target,null);
 assert.deepEqual({alpha:h.state.alpha,viewport:h.state.viewport.toArray(),scissor:h.state.scissor.toArray(),scissorTest:h.state.scissorTest},originalState);
 assert.deepEqual(frame,{visible:true,scale:.8,yawRadians:.31,skeletalFrame:0,materialFrame:0,nativeDisplacementY:0,offsetX:0,offsetY:0});
});

test('loaded hidden frames are handled without painting or changing sampled model state; disposal is unavailable',async t=>{
 const h=setup(t);await h.banner.ready;assert.equal(h.banner.drawFrame(h.ctx,frame),true);
 const group=primary(h.draws.at(-1).scene),before=snapshot(group),count=h.paints();
 assert.equal(h.banner.drawFrame(h.ctx,Object.freeze({...frame,visible:false,yawRadians:1,scale:1,skeletalFrame:150,materialFrame:300})),true);
 assert.equal(h.paints(),count);assert.deepEqual(snapshot(group),before);
 h.banner.dispose();assert.equal(h.banner.drawFrame(h.ctx,frame),false);assert.equal(h.banner.drawFrame(h.ctx,{...frame,visible:false}),false);
});

for(const failure of ['/folder/model.json','/home-camera/camera.json','/banner-frame/model.json'])test(`ready settles after ${failure} failure and drawFrame stays unavailable`,async t=>{
 const h=setup(t,{failure});await h.banner.ready;
 assert.match(h.banner.status().failure,/HTTP 503/);assert.equal(h.banner.drawFrame(h.ctx,frame),false);
 assert.equal(h.banner.drawFrame(h.ctx,{...frame,visible:false}),false);assert.equal(h.paints(),0);
});

test('background load failure does not make a loaded folder frame unavailable',async t=>{
 const h=setup(t,{failure:'/home-background/model.json'});await h.banner.ready;
 assert.equal(h.banner.status().failure,undefined);assert.match(h.banner.status().backgroundFailure,/HTTP 503/);
 assert.equal(h.banner.drawFrame(h.ctx,frame),true);
});

test('render failures report unavailable and restore the shared renderer state',async t=>{
 const h=setup(t);await h.banner.ready;h.renderer.render=()=>{throw new Error('test renderer failure');};
 assert.equal(h.banner.drawFrame(h.ctx,frame),false);assert.match(h.banner.status().failure,/test renderer failure/);
 assert.equal(h.banner.drawFrame(h.ctx,{...frame,visible:false}),false);assert.equal(h.paints(),0);
 assert.equal(h.state.target,null);assert.equal(h.state.scissorTest,true);assert.equal(h.renderer.autoClear,false);
 assert.equal(h.state.stencilClear,7);
});

test('one stencil-capable transaction clears zero once, draws siblings, then reads back and restores state',async t=>{
 const h=setup(t);await h.banner.ready;assert.equal(h.banner.status().frameReady,true);
 assert.equal(h.banner.drawFrame(h.ctx,frame),true);
 assert.deepEqual(h.events.map(e=>e[0]),['target','stencilClear','clear','render','readback','target','stencilClear']);
 const target=h.events[0][1];assert.equal(target.stencilBuffer,true);assert.equal(target.depthBuffer,true);
 assert.deepEqual(h.events[2].slice(1),[[true,true,true],0,target]);assert.equal(h.events[3][2],false);assert.equal(h.events[4][1],target);
 const {scene,camera}=h.draws[0],folder=primary(scene),producer=mask(scene);
 assert.equal(folder.parent,scene);assert.equal(producer.parent,scene);
 assert.deepEqual(camera.position.toArray(),[0,1,44.7859992980957]);assert.equal(camera.near,26.5);
 for(const [group,order]of [[folder,2],[producer,1]])group.traverse(node=>{if(node.isGroup)assert.equal(node.renderOrder,order);});
 producer.traverse(node=>{if(node.isMesh){assert.equal(node.material.stencilFunc,THREE.NeverStencilFunc);assert.equal(node.material.stencilFail,THREE.ReplaceStencilOp);assert.equal(node.material.stencilWriteMask,255);}});
 folder.traverse(node=>{if(node.isMesh){assert.equal(node.material.stencilFunc,THREE.EqualStencilFunc);assert.equal(node.material.stencilWrite,true);assert.equal(node.material.stencilZPass,THREE.KeepStencilOp);}});
 assert.equal(h.state.stencilClear,7);
 h.events.length=0;assert.equal(h.banner.drawBackground(h.ctx,1000,false),true);
 const bg=h.draws.at(-1).scene;assert.notEqual(bg,scene);assert.equal(bg.children.length,1);
 bg.traverse(node=>{if(node.isMesh)assert.equal(node.material.stencilWrite,false);});
});

test('Frame copies only visible native displacement; offsets, scale, yaw and resource animation stay on primary',async t=>{
 const h=setup(t);await h.banner.ready;
 assert.equal(h.banner.drawFrame(h.ctx,{...frame,nativeDisplacementY:.37,offsetX:2,offsetY:3}),true);
 const scene=h.draws.at(-1).scene,folder=primary(scene),producer=mask(scene),producerBefore=snapshot(producer);
 assert.deepEqual(folder.position.toArray(),[2,3.37,0]);assert.deepEqual(producer.position.toArray(),[0,.37,0]);
 assert.deepEqual(producer.scale.toArray(),[1,1,1]);assert.deepEqual(producer.quaternion.toArray(),[0,0,0,1]);
 h.banner.drawFrame(h.ctx,{...frame,nativeDisplacementY:.37,offsetX:-8,offsetY:-3,skeletalFrame:75,materialFrame:225});
 assert.deepEqual(snapshot(producer),producerBefore);assert.deepEqual(folder.position.toArray(),[-8,-2.63,0]);
 const count=h.events.length;
 h.banner.drawFrame(h.ctx,{...frame,visible:false,nativeDisplacementY:99,offsetX:99,offsetY:99});
 assert.equal(h.events.length,count);assert.deepEqual(snapshot(producer),producerBefore);
 assert.equal(h.banner.draw(h.ctx,0,false),true);assert.deepEqual(producer.position.toArray(),[0,0,0]);assert.deepEqual(folder.position.toArray(),[0,0,0]);assert.deepEqual(folder.scale.toArray(),[1,1,1]);
});

test('authored Frame keeps every vertex and index with the shared native camera',{skip:!hasAuthoredFrame},async t=>{
 const h=setup(t);await h.banner.ready;assert.equal(h.banner.drawFrame(h.ctx,frame),true);
 const source=bannerFrameData().models[0],group=mask(h.draws[0].scene).children[0];
 assert.equal(source.name,'BannerFrame');assert.equal(source.meshes[0].position.length,994);
 let index=0;for(const mesh of source.meshes)for(const sub of mesh.submeshes){
  const geometry=group.children[index++].geometry;
  assert.deepEqual([...geometry.attributes.position.array],[...new Float32Array(mesh.position.flat())]);
  assert.deepEqual([...geometry.index.array],sub.indices);
 }
 assert.deepEqual(group.matrix.toArray(),new THREE.Matrix4().toArray());
});

test('invalid Frame enums fail independently from background readiness',async t=>{
 const h=setup(t,{invalidFrame:true});await h.banner.ready;
 assert.equal(h.banner.status().ready,false);assert.equal(h.banner.status().frameReady,false);
 assert.match(h.banner.status().frameFailure,/Unsupported native stencil comparison/);
 assert.equal(h.banner.drawFrame(h.ctx,frame),false);assert.equal(h.banner.draw(h.ctx,0,false),false);
 assert.equal(h.banner.drawBackground(h.ctx,0,false),true);
});

test('disposal during pending Frame load prevents readiness and late resources',async t=>{
 let release;const pending=new Promise(resolve=>{release=resolve;}),h=setup(t,{delayFrame:pending});
 h.banner.dispose();release();await h.banner.ready;
 assert.equal(h.banner.status().ready,false);assert.equal(h.banner.status().frameReady,false);assert.equal(h.banner.status().backgroundReady,false);
 assert.equal(h.banner.drawFrame(h.ctx,frame),false);assert.equal(h.events.length,0);
});

test('loaded Frame resources and its stencil target are disposed exactly once',async t=>{
 const h=setup(t);await h.banner.ready;h.banner.drawFrame(h.ctx,frame);
 const resources=new Set([h.events[0][1]]);mask(h.draws[0].scene).traverse(node=>{if(node.isMesh){resources.add(node.geometry);resources.add(node.material);}});
 const counts=new Map();for(const resource of resources)resource.addEventListener('dispose',()=>counts.set(resource,(counts.get(resource)??0)+1));
 h.banner.dispose();h.banner.dispose();assert.equal(counts.size,resources.size);for(const count of counts.values())assert.equal(count,1);
});

test('readback failure restores clear color, stencil clear, target and all shared rendering controls',async t=>{
 const h=setup(t);await h.banner.ready;
 const before={color:h.state.color.clone(),alpha:h.state.alpha,viewport:h.state.viewport.clone(),scissor:h.state.scissor.clone()};
 h.renderer.autoClear=true;h.renderer.readRenderTargetPixels=()=>{throw new Error('readback failed');};
 assert.equal(h.banner.drawFrame(h.ctx,frame),false);assert.match(h.banner.status().failure,/readback failed/);
 assert.equal(h.state.target,null);assert.equal(h.state.stencilClear,7);assert.equal(h.state.scissorTest,true);assert.equal(h.renderer.autoClear,true);assert.equal(h.renderer.toneMapping,THREE.ACESFilmicToneMapping);
 for(const [key,value]of Object.entries(before))assert.deepEqual(h.state[key],value);
});
