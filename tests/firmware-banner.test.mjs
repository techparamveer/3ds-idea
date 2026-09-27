import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
import {bannerFrameData,hasAuthoredFrame} from './helpers/banner-frame.mjs';
import {defaultBannerData,defaultBannerResource,hasAuthoredDefault} from './helpers/banner-default.mjs';

const modules=new Map();
function moduleUrl(path){
 if(modules.has(path))return modules.get(path);
 let code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/from (['"])([^'"]+)\1/g,(_,quote,specifier)=>`from ${JSON.stringify(specifier.startsWith('.')?moduleUrl(resolve(dirname(path),specifier+'.ts')):import.meta.resolve(specifier))}`);
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');modules.set(path,url);return url;
}
const {createFirmwareBanner}=await import(moduleUrl(fileURLToPath(new URL('../src/scene/firmware-banner.ts',import.meta.url))));
const {settingsBannerPhase}=await import(moduleUrl(fileURLToPath(new URL('../src/scene/banner-verification.ts',import.meta.url))));
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const frame=Object.freeze({visible:true,scale:.8,yawRadians:.31,skeletalFrame:0,materialFrame:0,nativeDisplacementY:0,offsetX:0,offsetY:0});
function setup(t,{failure,alterSettings,alterBind=false,delayFrame,invalidFrame=false,alterDefault,delayDefault,corruptDefaultTexture,defaultFetchObserver,pixelRatio=1}={}){
 const prior={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch};
 globalThis.document={createElement(){return {width:0,height:0,getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}};}};
 globalThis.window={location:{href:'https://firmware.test/'}};
 globalThis.fetch=async input=>{
  const path=new URL(String(input),globalThis.window.location.href).pathname;
  if(failure&&path.includes(failure))return new Response('',{status:503});
  if(path.includes('/banner-default/')){
   const name=path.split('/').at(-1);defaultFetchObserver?.(name);
   if(delayDefault?.name===name)await delayDefault.promise;
   if(name==='model.json'){
    const data=defaultBannerData();alterDefault?.(data);return new Response(JSON.stringify(data));
   }
   return new Response(corruptDefaultTexture===name?'invalid PNG':defaultBannerResource(name));
  }
  if(path.endsWith('/banner-frame/model.json')){
   if(delayFrame)await delayFrame;
   const data=bannerFrameData();if(invalidFrame)data.models[0].materials[0].MaterialParams.StencilTest.Function='Invalid';
   return new Response(JSON.stringify(data));
  }
  let data=readFileSync(resolve(publicRoot,'.'+path));
  if(alterBind&&path.endsWith('/folder/model.json')){
   const model=JSON.parse(data);Object.assign(model.models[0].transform,{M11:1.2,M22:.9,M33:1.1,M41:2,M43:.4});data=JSON.stringify(model);
  }
  if(alterSettings&&path.endsWith('/settings-banner/model.json')){const asset=JSON.parse(data);alterSettings(asset);data=JSON.stringify(asset);}
  return new Response(data);
 };
 const state={target:null,color:new THREE.Color(.2,.3,.4),alpha:.7,viewport:new THREE.Vector4(1,2,3,4),physicalViewport:new THREE.Vector4(1,2,3,4),scissor:new THREE.Vector4(5,6,7,8),scissorTest:true,stencilClear:7};
 const draws=[],events=[],renderer={toneMapping:THREE.ACESFilmicToneMapping,autoClear:false,
  getRenderTarget:()=>state.target,setRenderTarget(value){state.target=value;state.physicalViewport=value?value.viewport.clone():state.viewport.clone().multiplyScalar(pixelRatio);events.push(['target',value]);},
  getContext:()=>({STENCIL_CLEAR_VALUE:0x0b91,getParameter:()=>state.stencilClear}),
  state:{buffers:{stencil:{setClear(value){state.stencilClear=value;events.push(['stencilClear',value]);}}}},
  getClearColor:value=>value.copy(state.color),getClearAlpha:()=>state.alpha,setClearColor(value,alpha){state.color.set(value);state.alpha=alpha;},
  getViewport:value=>value.copy(state.viewport),setViewport(...values){values.length===1?state.viewport.copy(values[0]):state.viewport.set(...values);state.physicalViewport.copy(state.viewport).multiplyScalar(pixelRatio);events.push(['viewport',state.target]);},
  getScissor:value=>value.copy(state.scissor),setScissor:value=>state.scissor.copy(value),getScissorTest:()=>state.scissorTest,setScissorTest:value=>{state.scissorTest=value;},
  clear(...buffers){events.push(['clear',buffers,state.stencilClear,state.target]);},
  render(scene,camera){scene.updateMatrixWorld(true);draws.push({scene,camera,viewport:state.physicalViewport.clone(),primaries:scene.children.filter(group=>group.renderOrder===2&&group.visible)});events.push(['render',scene,renderer.autoClear]);},readRenderTargetPixels(target,x,y,w,h,pixels){pixels.fill(0);events.push(['readback',target]);}
 };
 let paints=0;const ctx={drawImage(){paints++;}},banner=createFirmwareBanner(renderer);
 t.after(()=>{banner.dispose();Object.assign(globalThis,prior);});
 return {banner,renderer,state,draws,events,ctx,paints:()=>paints};
}
const primary=scene=>scene.children.find(group=>group.renderOrder===2&&group.visible);
const mask=scene=>scene.children.find(group=>group.renderOrder===1);
test('native 400×240 banner target ignores fractional page DPR',async t=>{
 const h=setup(t,{pixelRatio:1/3});await h.banner.ready;
 assert.equal(h.banner.drawSettingsFrame(h.ctx,{...frame,skeletalFrame:433}),true);
 assert.deepEqual(h.draws.at(-1).viewport.toArray(),[0,0,400,240]);
 assert.equal(h.events.filter(([kind,target])=>kind==='viewport'&&target?.width===400).length,0);
 assert.equal(h.banner.drawBackground(h.ctx,12000,false),true);
 assert.deepEqual(h.draws.at(-1).viewport.toArray(),[0,0,400,240]);
});

test('Health HOME wallpaper samples a bounded BannerBG_Loop frame and normal painting resumes live playback',async t=>{
 const h=setup(t);await h.banner.ready;
 assert.equal(h.banner.drawBackgroundFrame(h.ctx,311),true);
 assert.equal(h.draws.length,1);
 assert.equal(h.banner.drawBackgroundFrame(h.ctx,600),false);
 assert.equal(h.draws.length,1,'invalid source frame does not render');
 assert.equal(h.banner.drawBackground(h.ctx,12000,false),true);
 assert.equal(h.draws.length,2,'normal wallpaper paint remains available after the synthetic sample');
});
function snapshot(group){
 const meshes=[];group.traverse(node=>{if(node.isMesh)meshes.push({positions:[...node.geometry.attributes.position.array],uniforms:Object.fromEntries(Object.entries(node.material.uniforms).filter(([name])=>name.startsWith('constant')||name.startsWith('uvMatrix')).map(([name,{value}])=>[name,value.toArray()]))});});
 return {position:group.position.toArray(),scale:group.scale.toArray(),yaw:group.rotation.y,inner:group.children.map(child=>child.matrix.toArray()),meshes};
}

test('Settings COMMON draws as the sole group-2 primary with its source frame and shared Frame mask',async t=>{
 const h=setup(t);await h.banner.ready;
 assert.equal(h.banner.status().settingsReady,true);
 assert.equal(h.banner.drawSettingsFrame(h.ctx,{...frame,skeletalFrame:150}),true);
 const draw=h.draws.at(-1),group=primary(draw.scene);
 assert.equal(draw.primaries.length,1);
 assert.equal(group.children[0].children.length,12);
 assert.equal(group.scale.x,.8);assert.equal(group.rotation.y,.31);
 assert.ok(mask(draw.scene));
 assert.deepEqual(draw.camera.position.toArray(),[0,1,44.7859992980957]);
 const pose=snapshot(group);
 assert.equal(h.banner.drawSettingsFrame(h.ctx,{...frame,skeletalFrame:150}),true);
 assert.deepEqual(snapshot(group),pose);
 assert.equal(h.banner.drawSettingsFrame(h.ctx,{...frame,visible:false}),true);
 assert.equal(h.draws.length,2,'hidden sample does not draw stale Settings pixels');
});

test('verification-only Settings source frames bracket the captured broad and edge-on poses without advancing live motion',async t=>{
 const h=setup(t);await h.banner.ready;
 const motion=Object.freeze({yawRadians:-.1466,skeletal:Object.freeze({frame:14})});
 const sample=number=>{
  const phase=settingsBannerPhase(motion,false,number);
  assert.equal(h.banner.drawSettingsFrame(h.ctx,{...frame,scale:1,yawRadians:phase.yawRadians,skeletalFrame:phase.skeletalFrame}),true);
  const draw=h.draws.at(-1),wrench=primary(draw.scene).children[0].children[11];
  const position=wrench.geometry.attributes.position,point=new THREE.Vector3(),xs=[];
  wrench.updateWorldMatrix(true,false);draw.camera.updateMatrixWorld(true);
  for(let i=0;i<position.count;i++)xs.push((point.fromBufferAttribute(position,i).applyMatrix4(wrench.matrixWorld).project(draw.camera).x+1)*200);
  return {phase,width:Math.max(...xs)-Math.min(...xs)};
 };
 const broad=sample(14),edge=sample(150),otherEdge=sample(450);
 assert.equal(broad.phase.sample.kind,'synthetic-source-pose');
 assert.ok(broad.width>75,`frame 14 width ${broad.width}`);
 assert.ok(edge.width<25,`frame 150 width ${edge.width}`);
 assert.ok(otherEdge.width<25,`frame 450 width ${otherEdge.width}`);
 assert.deepEqual(motion,{yawRadians:-.1466,skeletal:{frame:14}},'fixture leaves the live host motion unchanged');
 assert.deepEqual(settingsBannerPhase(motion,false),{yawRadians:-.1466,skeletalFrame:14,sample:null});
 assert.throws(()=>settingsBannerPhase(motion,false,600),/Invalid diagnostic banner frame/);
});

test('Settings wrench samples source sphere coordinates while its row/title retain authored UVs',async t=>{
 const h=setup(t);await h.banner.ready;
 assert.equal(h.banner.drawSettingsFrame(h.ctx,{...frame,scale:1,yawRadians:-309*Math.PI/300,skeletalFrame:309}),true);
 const draw=h.draws.at(-1),meshes=primary(draw.scene).children[0].children,wrench=meshes[11];
 assert.match(wrench.material.vertexShader,/vUv0=normalize\(vNormal\).xy\*0.5\+vec2\(0.5\);/);
 for(const mesh of meshes.slice(0,11))assert.doesNotMatch(mesh.material.vertexShader,/vUv0=normalize/);
 // The flat visible back face at source pose309 uses COMMON4's white centre,
 // selecting Constant0 (native RGB173,173,156), not the old zero-UV black edge.
 const data=JSON.parse(readFileSync(resolve(publicRoot,'os/firmware/10.7.0-32E/models/settings-banner/model.json')));
 const index=data.models[0].meshes[11].normal.findIndex(n=>n[0]===0&&n[1]===0&&n[2]===-1);
 const normal=new THREE.Vector3().fromBufferAttribute(wrench.geometry.attributes.normal,index);
 wrench.updateWorldMatrix(true,false);
 normal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(new THREE.Matrix4().multiplyMatrices(draw.camera.matrixWorldInverse,wrench.matrixWorld))).normalize();
 const uv=new THREE.Vector3(normal.x*.5+.5,normal.y*.5+.5,1).applyMatrix3(wrench.material.uniforms.uvMatrix0.value);
 const image=wrench.material.uniforms.tex0.value.image;
 const pixel=(u,v)=>{const x=Math.max(0,Math.min(image.width-1,Math.floor(u*image.width))),y=Math.max(0,Math.min(image.height-1,Math.floor(v*image.height)));return [...image.data.slice((y*image.width+x)*4,(y*image.width+x)*4+3)];};
 assert.deepEqual(pixel(uv.x,uv.y),[255,255,255]);
 assert.deepEqual(pixel(-.2,0),[0,0,0]);
 assert.deepEqual(wrench.material.uniforms.constant0.value.toArray().slice(0,3).map(x=>Math.round(x*255)),[173,173,156]);
 assert.equal(h.banner.drawFrame(h.ctx,frame),true);
 primary(h.draws.at(-1).scene).traverse(node=>{if(node.isMesh)assert.doesNotMatch(node.material.vertexShader,/vUv0=normalize/);});
});
for(const [name,change]of [
 ['unsupported mapping',p=>p.TextureCoords[0].MappingType='CameraCubeEnvMap'],
 ['wrong source selector',p=>p.TextureSources[0]=3],
 ['unsupported mapping flags',p=>p.TextureCoords[0].Flags='1'],
 ['unbound reference camera',p=>p.TextureCoords[0].ReferenceCameraIndex=1],
])test(`Settings sphere mapping rejects ${name}`,async t=>{
 const h=setup(t,{alterSettings:asset=>change(asset.models[0].materials[2].MaterialParams)});await h.banner.ready;
 assert.equal(h.banner.status().settingsReady,false);assert.match(h.banner.status().settingsFailure,/Unsupported native texture mapping/);
 assert.equal(h.banner.status().ready,true,'failure stays isolated to Settings');
});

test('Settings resource failure is explicit and does not borrow the folder model',async t=>{
 const h=setup(t,{failure:'/settings-banner/model.json'});await h.banner.ready;
 assert.equal(h.banner.status().settingsReady,false);
 assert.match(h.banner.status().settingsFailure,/HTTP 503/);
 assert.equal(h.banner.drawSettingsFrame(h.ctx,frame),false);
 assert.equal(h.banner.drawFrame(h.ctx,frame),true);
});

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
 assert.deepEqual(h.events.map(e=>e[0]),['target','stencilClear','clear','render','readback','target','viewport','stencilClear']);
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

// The public pack is integration-owned; the same tests run before promotion
// with FIRMWARE_BANNER_DEFAULT_MODEL pointing at the extracted SSD model.json.
const defaultTest=(name,run)=>test(name,{skip:!hasAuthoredDefault},run);
defaultTest('default readiness requires the actual six textures and selects EUR material despite the KR alternative',async t=>{
 const fetched=[],h=setup(t,{defaultFetchObserver:name=>fetched.push(name)});
 assert.equal(h.banner.status().defaultReady,false);assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),false);
 await h.banner.ready;assert.equal(h.banner.status().defaultReady,true);assert.equal(h.banner.status().defaultFailure,undefined);
 const data=defaultBannerData();assert.equal(data.sourceSha256,'e5711a422d51e11c7047ebcb415401451335c39c46ecfbf1e3abdbffe8985955');
 assert.equal(data.textures.length,6);assert.deepEqual(fetched.sort(),['model.json',...data.textures.map(t=>t.url)].sort());
 for(const texture of data.textures)assert.equal(createHash('sha256').update(defaultBannerResource(texture.url)).digest('hex'),texture.sha256);
 assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),true);
 const group=primary(h.draws.at(-1).scene),meshes=group.children[0].children;
 assert.equal(meshes.length,5);assert.equal(meshes[0].geometry.attributes.position.count,200);
 assert.deepEqual(meshes[0].material.uniforms.constant0.value.toArray().slice(0,3),[.12,.86,0]);
 assert.equal(meshes[0].material.uniforms.constant5.value.w,1,'EUR retains the HOME logo; KR sets this alpha to zero');
 const textures=new Set();for(const mesh of meshes)for(const name of ['tex0','tex1','tex2']){
  const texture=mesh.material.uniforms[name].value;if(texture.image.width===64){assert.equal(texture.image.height,64);assert.equal(texture.image.data.length,64*64*4);assert.equal(texture.colorSpace,THREE.NoColorSpace);textures.add(texture);}
 }
 assert.equal(textures.size,6);assert.ok([...textures].every(texture=>texture.image.data.some(value=>value!==255)),'actual pixels replace white samplers');
 assert.ok(data.models[0].materials.every(m=>m.Name!=='mt_Text'));assert.ok(data.textures.every(t=>t.name!=='DmyText_00'));
 const producer=mask(h.draws[0].scene);assert.equal(group.parent,producer.parent);
 for(const mesh of meshes){const m=mesh.material;assert.equal(m.stencilWrite,true);assert.equal(m.stencilFunc,THREE.EqualStencilFunc);assert.equal(m.stencilRef,1);assert.equal(m.stencilFuncMask,1);assert.equal(m.stencilWriteMask,255);assert.equal(m.stencilFail,THREE.KeepStencilOp);assert.equal(m.stencilZFail,THREE.KeepStencilOp);assert.equal(m.stencilZPass,THREE.KeepStencilOp);assert.equal(m.depthFunc,THREE.LessDepth);}
 assert.deepEqual(h.events.map(e=>e[0]),['target','stencilClear','clear','render','readback','target','viewport','stencilClear']);
 assert.equal(h.events[2][2],0);assert.equal(h.events[0][1].stencilBuffer,true);assert.equal(h.events[3][2],false);
 assert.deepEqual(h.draws[0].camera.position.toArray(),[0,1,44.7859992980957]);assert.equal(h.state.stencilClear,7);
});

defaultTest('default samples preserve bind matrices and separate authored bob, manager yaw and Frame displacement',async t=>{
 const h=setup(t,{alterDefault:data=>Object.assign(data.models[0].transform,{M11:1.2,M22:.9,M33:1.1,M41:2,M43:.4})});await h.banner.ready;
 const sample={...frame,nativeDisplacementY:.2,offsetX:3,offsetY:4};h.banner.drawDefaultFrame(h.ctx,sample);
 const group=primary(h.draws[0].scene),producer=mask(h.draws[0].scene),start=snapshot(group),maskStart=snapshot(producer);
 assert.deepEqual([start.inner[0][0],start.inner[0][5],start.inner[0][10],start.inner[0][12],start.inner[0][14]],[1.2,.9,1.1,2,.4]);
 assert.deepEqual(start.position,[3,4.2,0]);assert.deepEqual(start.scale,[.8,.8,.8]);assert.equal(start.yaw,.31);
 h.banner.drawDefaultFrame(h.ctx,{...sample,skeletalFrame:92});const bob=snapshot(group);
 assert.deepEqual(bob.meshes.map(m=>m.uniforms),start.meshes.map(m=>m.uniforms));
 for(let m=0;m<bob.meshes.length;m++)for(let i=1;i<bob.meshes[m].positions.length;i+=3)assert.ok(Math.abs(bob.meshes[m].positions[i]-start.meshes[m].positions[i]-.464378)<.00001);
 assert.deepEqual(snapshot(producer),maskStart,'resource bob never changes Frame Y');
 h.banner.drawDefaultFrame(h.ctx,{...sample,skeletalFrame:392});assert.deepEqual(snapshot(group),bob,'300 source frames loop independently of yaw');
 h.banner.drawDefaultFrame(h.ctx,{...sample,skeletalFrame:0,materialFrame:60});assert.deepEqual(snapshot(group),start,'EUR material clip is constant through its endpoint');
 h.banner.drawDefaultFrame(h.ctx,{...sample,skeletalFrame:0,materialFrame:600});assert.deepEqual(snapshot(group),start,'nonlooping material clamps to its authored endpoint');
 h.banner.drawDefaultFrame(h.ctx,{...sample,yawRadians:1.1});assert.equal(group.rotation.y,1.1);assert.deepEqual(snapshot(group).meshes,start.meshes);
 const count=h.events.length,before=snapshot(group);
 assert.equal(h.banner.drawDefaultFrame(h.ctx,{...sample,visible:false,skeletalFrame:200,materialFrame:30,nativeDisplacementY:99}),true);
 assert.equal(h.events.length,count);assert.deepEqual(snapshot(group),before);assert.deepEqual(snapshot(producer),maskStart);
 h.banner.drawDefaultFrame(h.ctx,sample);assert.deepEqual(snapshot(group),start,'returning to the same checkpoint is deterministic');
});

defaultTest('folder/default switches render exactly one primary and retain the inactive folder label and clocks',async t=>{
 const h=setup(t);await h.banner.ready;
 const label={width:256,height:64,data:new Uint8ClampedArray(256*64*4).fill(255)};
 h.banner.drawFrame(h.ctx,frame,label);const folder=primary(h.draws[0].scene),folderStart=snapshot(folder),camera=h.draws[0].camera;
 const texture=folder.children[0].children.find(mesh=>mesh.visible&&mesh.material.uniforms.tex0.value.image.width===256).material.uniforms.tex0.value,version=texture.version;
 h.banner.drawDefaultFrame(h.ctx,{...frame,skeletalFrame:92});const defaultGroup=primary(h.draws.at(-1).scene),defaultStart=snapshot(defaultGroup);
 assert.notEqual(defaultGroup,folder);assert.equal(folder.visible,false);assert.equal(defaultGroup.visible,true);assert.equal(h.draws.at(-1).camera,camera);
 assert.deepEqual(snapshot(folder),folderStart);assert.equal(texture.version,version);
 const count=h.events.length;h.banner.drawFrame(h.ctx,{...frame,visible:false,skeletalFrame:99},{...label});
 assert.equal(h.events.length,count);assert.equal(defaultGroup.visible,true);assert.equal(texture.version,version);
 h.banner.drawFrame(h.ctx,frame,label);assert.equal(defaultGroup.visible,false);assert.equal(folder.visible,true);
 assert.deepEqual(snapshot(folder),folderStart);assert.deepEqual(snapshot(defaultGroup),defaultStart);assert.equal(texture.version,version);
 h.banner.drawDefaultFrame(h.ctx,frame);h.banner.draw(h.ctx,0,false,label);
 for(const draw of h.draws)assert.equal(draw.primaries.length,1);
 assert.equal(h.draws.at(-1).primaries[0],folder);
});

defaultTest('default forwards independent material checkpoints instead of deriving them from skeletal frames',async t=>{
 const h=setup(t,{alterDefault:data=>{
  // EUR's real material channels are constant. A controlled ramp makes the
  // independent checkpoint wiring observable without changing its clip profile.
  const curve=data.materialAnimations.find(c=>c.Name==='BannerDef').Elements[0].Content.A;
  Object.assign(curve,{StartFrame:0,EndFrame:60,InterpolationType:'Linear',KeyFrames:[{Frame:0,Value:.1,InSlope:0,OutSlope:0},{Frame:60,Value:.9,InSlope:0,OutSlope:0}]});
 }});await h.banner.ready;h.banner.drawDefaultFrame(h.ctx,frame);
 const group=primary(h.draws[0].scene),before=snapshot(group),material=group.children[0].children[0].material;
 assert.equal(material.uniforms.constant5.value.w,.1);
 h.banner.drawDefaultFrame(h.ctx,{...frame,skeletalFrame:92});assert.equal(material.uniforms.constant5.value.w,.1);const bob=snapshot(group);
 h.banner.drawDefaultFrame(h.ctx,{...frame,skeletalFrame:92,materialFrame:60});assert.equal(material.uniforms.constant5.value.w,.9);
 assert.deepEqual(snapshot(group).meshes.map(m=>m.positions),bob.meshes.map(m=>m.positions));
 h.banner.drawDefaultFrame(h.ctx,{...frame,skeletalFrame:92,materialFrame:300});assert.equal(material.uniforms.constant5.value.w,.9);
 h.banner.drawDefaultFrame(h.ctx,frame);assert.deepEqual(snapshot(group),before);
});

for(const name of ['model.json',...Array.from({length:6},(_,i)=>`texture-${i}.png`)])defaultTest(`default ${name} failure remains separate from folder/background availability`,async t=>{
 const h=setup(t,{failure:`/banner-default/${name}`});await h.banner.ready;
 assert.equal(h.banner.status().defaultReady,false);assert.match(h.banner.status().defaultFailure,/HTTP 503/);
 assert.equal(h.banner.status().failure,undefined);assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),false);assert.equal(h.banner.drawDefaultFrame(h.ctx,{...frame,visible:false}),false);
 assert.equal(h.banner.drawFrame(h.ctx,frame),true);assert.equal(h.banner.drawBackground(h.ctx,0,false),true);
});

const invalidDefaults=[
 ['missing texture record',d=>{d.textures.pop();}],
 ['duplicate texture name',d=>{d.textures[0].name=d.textures[1].name;}],
 ['unresolved texture binding',d=>{d.models[0].materials[0].Texture0Name='Missing';}],
 ['wrong PNG dimensions',d=>{d.textures[0].width=32;}],
 ['wrong model',d=>{d.models[0].name='BannerFolder';}],
 ['missing geometry',d=>{d.models[0].meshes=[];}],
 ['KR without EUR clip',d=>{d.materialAnimations=d.materialAnimations.filter(c=>c.Name==='BannerDef_KR');}],
 ['duplicate EUR clip',d=>{d.materialAnimations.push(structuredClone(d.materialAnimations.find(c=>c.Name==='BannerDef')));}],
 ['looping EUR material',d=>{d.materialAnimations.find(c=>c.Name==='BannerDef').AnimationFlags='IsLooping';}],
 ['missing skeletal clip',d=>{d.skeletalAnimations=[];}],
 ['wrong skeletal duration',d=>{d.skeletalAnimations[0].FramesCount=600;}],
 ['nonlooping skeletal clip',d=>{d.skeletalAnimations[0].AnimationFlags='0';}],
];
for(const [name,alterDefault]of invalidDefaults)defaultTest(`default rejects ${name} before readiness`,async t=>{
 const h=setup(t,{alterDefault});await h.banner.ready;
 assert.equal(h.banner.status().defaultReady,false);assert.ok(h.banner.status().defaultFailure);assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),false);
 assert.equal(h.banner.drawFrame(h.ctx,frame),true);
});

defaultTest('a corrupt default PNG cannot be replaced by a white sampler',async t=>{
 const h=setup(t,{corruptDefaultTexture:'texture-5.png'});await h.banner.ready;
 assert.equal(h.banner.status().defaultReady,false);assert.match(h.banner.status().defaultFailure,/Invalid native PNG/);assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),false);
});

for(const failure of ['/folder/model.json','/home-camera/camera.json','/banner-frame/model.json'])defaultTest(`default availability distinguishes shared and folder-only failure: ${failure}`,async t=>{
 const h=setup(t,{failure});await h.banner.ready;const available=failure.includes('/folder/');
 assert.equal(h.banner.status().defaultReady,available);assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),available);
 if(!available){assert.match(h.banner.status().defaultFailure,/HTTP 503/);assert.equal(h.paints(),0);}
});

defaultTest('default remains unready until the last texture decodes',async t=>{
 let release,reached;const promise=new Promise(r=>{release=r;}),seen=new Promise(r=>{reached=r;});
 const h=setup(t,{delayDefault:{name:'texture-5.png',promise},defaultFetchObserver:name=>{if(name==='texture-5.png')reached();}});
 await seen;assert.equal(h.banner.status().defaultReady,false);assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),false);
 release();await h.banner.ready;assert.equal(h.banner.status().defaultReady,true);assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),true);
});

defaultTest('disposal during default texture loading prevents late model allocation and readiness',async t=>{
 let release,reached;const promise=new Promise(r=>{release=r;}),seen=new Promise(r=>{reached=r;});
 const h=setup(t,{delayDefault:{name:'texture-5.png',promise},defaultFetchObserver:name=>{if(name==='texture-5.png')reached();}});
 await seen;h.banner.dispose();release();await h.banner.ready;
 assert.equal(h.banner.status().defaultReady,false);assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),false);assert.equal(h.events.length,0);
});

defaultTest('default GPU resources and shared target are disposed once after primary switches',async t=>{
 const h=setup(t);await h.banner.ready;h.banner.drawDefaultFrame(h.ctx,frame);
 const resources=new Set([h.events[0][1]]);primary(h.draws[0].scene).traverse(node=>{
  if(node.isMesh){resources.add(node.geometry);resources.add(node.material);for(const {value}of Object.values(node.material.uniforms))if(value instanceof THREE.Texture)resources.add(value);}
 });
 const counts=new Map();for(const resource of resources)resource.addEventListener('dispose',()=>counts.set(resource,(counts.get(resource)??0)+1));
 h.banner.drawFrame(h.ctx,frame);h.banner.dispose();h.banner.dispose();
 assert.equal(counts.size,resources.size);for(const count of counts.values())assert.equal(count,1);assert.equal(h.banner.status().defaultReady,false);
});

defaultTest('default render errors restore shared controls and do not disable the folder',async t=>{
 const h=setup(t);await h.banner.ready;const original=h.renderer.render,before={...h.state,color:h.state.color.clone(),viewport:h.state.viewport.clone(),scissor:h.state.scissor.clone()};
 h.renderer.autoClear=true;h.renderer.render=()=>{throw new Error('default render failed');};
 assert.equal(h.banner.drawDefaultFrame(h.ctx,frame),false);assert.match(h.banner.status().defaultFailure,/default render failed/);assert.equal(h.banner.status().defaultReady,false);
 assert.deepEqual(h.state,before);assert.equal(h.renderer.autoClear,true);assert.equal(h.renderer.toneMapping,THREE.ACESFilmicToneMapping);assert.equal(h.banner.status().failure,undefined);
 h.renderer.render=original;assert.equal(h.banner.drawFrame(h.ctx,frame),true);assert.equal(h.draws.at(-1).primaries.length,1);
});


test('Camera owns a locale-bound group-2 primary and retarget revokes stale drawing', async t => {
 const h=setup(t);await h.banner.ready;
 const ticket={generation:'camera-test',requestEpoch:1,kind:'camera'};
 await h.banner.syncStockTitles([ticket]);
 assert.equal(h.banner.stockTitleStatus(ticket).ready,true);
 assert.equal(h.banner.drawStockTitleFrame(h.ctx,{...frame,skeletalFrame:137},ticket),true);
 assert.equal(h.draws.at(-1).primaries.length,1);
 const cameraPrimary=h.draws.at(-1).primaries[0], first=snapshot(cameraPrimary);
 assert.equal(h.banner.drawStockTitleFrame(h.ctx,{...frame,skeletalFrame:138},ticket),true);
 assert.notDeepEqual(snapshot(cameraPrimary),first,'source skeletal phase changes the submitted model');
 assert.equal(h.banner.drawSettingsFrame(h.ctx,frame),true);
 assert.notEqual(h.draws.at(-1).primaries[0],cameraPrimary);
 assert.equal(cameraPrimary.visible,false);
 h.banner.syncStockTitles([]);
 assert.equal(cameraPrimary.parent,null);
 assert.equal(h.banner.stockTitleStatus(ticket).ready,false);
 assert.equal(h.banner.drawStockTitleFrame(h.ctx,frame,ticket),false);
 await h.banner.syncStockTitles([{...ticket,requestEpoch:2}]);
 assert.equal(h.banner.drawStockTitleFrame(h.ctx,frame,ticket),false,'old request cannot draw replacement');
 assert.equal(h.banner.stockTitleStatus({...ticket,requestEpoch:2}).ready,true);
});


test('stock titles retain outgoing resources during preparation and Sound samples material COMMON', async t => {
 const h=setup(t);await h.banner.ready;
 const ticket=kind=>({generation:'stock-test',requestEpoch:{camera:1,sound:2,health:3,eshop:4}[kind],kind});
 const camera=ticket('camera'),sound=ticket('sound');
 await h.banner.syncStockTitles([camera]);
 h.banner.drawStockTitleFrame(h.ctx,frame,camera);
 const cameraGroup=h.draws.at(-1).primaries[0];
 await h.banner.syncStockTitles([camera,sound]);
 assert.equal(h.banner.stockTitleStatus(camera).ready,true,'outgoing resource survives incoming preparation');
 assert.equal(h.banner.drawStockTitleFrame(h.ctx,{...frame,materialFrame:0},sound),true);
 const soundGroup=h.draws.at(-1).primaries[0],first=snapshot(soundGroup);
 assert.equal(cameraGroup.visible,false);
 assert.equal(cameraGroup.parent,h.draws.at(-1).scene);
 assert.equal(h.banner.drawStockTitleFrame(h.ctx,{...frame,materialFrame:137},sound),true);
 assert.notDeepEqual(snapshot(soundGroup),first,'Sound source material uniforms sample the material clock');
 await h.banner.syncStockTitles([sound]);
 assert.equal(cameraGroup.parent,null);
 assert.equal(h.banner.stockTitleStatus(camera).ready,false);
 for(const kind of ['health','eshop']){
  const current=ticket(kind);await h.banner.syncStockTitles([current]);
  assert.equal(h.banner.stockTitleStatus(current).ready,true,kind);
  assert.equal(h.banner.drawStockTitleFrame(h.ctx,{...frame,skeletalFrame:137},current),true,kind);
  assert.equal(h.draws.at(-1).primaries.length,1);
 }
 h.banner.dispose();
 assert.equal(h.banner.stockTitleStatus(ticket('eshop')).ready,false);
});

test('independent diagnostic COMMON pose keeps explicit yaw and leaves live clocks untouched',()=>{
 const motion={yawRadians:-.1466,skeletal:{frame:14}};
 const before=structuredClone(motion),sample=settingsBannerPhase(motion,false,304,302);
 assert.equal(sample.yawRadians,settingsBannerPhase(motion,false,304).yawRadians);
 assert.equal(sample.skeletalFrame,302);
 assert.deepEqual(sample.sample,{kind:'synthetic-source-pose',frame:304,yawRadians:sample.yawRadians,skeletalFrame:302,clockRelationship:'independent-diagnostic'});
 assert.deepEqual(motion,before);
 assert.deepEqual(settingsBannerPhase(motion,false),{yawRadians:-.1466,skeletalFrame:14,sample:null});
 for(const value of [-1,600,NaN,302.5])assert.throws(()=>settingsBannerPhase(motion,false,304,value),/skeletal frame/);
 assert.throws(()=>settingsBannerPhase(motion,false,undefined,302),/explicit banner frame/);
});
