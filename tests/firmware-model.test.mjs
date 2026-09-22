import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
const source=readFileSync(new URL('../src/os/cgfx-animation.ts',import.meta.url),'utf8');
const asModule=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const animationUrl=asModule(source);
const {sampleCgfxCurve,selectCgfxClips,cgfxClipFrame}=await import(animationUrl);
const lightingSource=readFileSync(new URL('../src/scene/cgfx-lighting.ts',import.meta.url),'utf8');
const {decodeCgfxLutWord,sampleCgfxLut,resolveCgfxLut,cgfxLightingShader}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(lightingSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const pngUrl=asModule(readFileSync(new URL('../src/os/native-png.ts',import.meta.url),'utf8'));
const billboardUrl=asModule(readFileSync(new URL('../src/scene/cgfx-billboard.ts',import.meta.url),'utf8').replace("'three'",JSON.stringify(import.meta.resolve('three'))));
const {screenViewpointBone}=await import(billboardUrl);
const modelSource=readFileSync(new URL('../src/scene/firmware-model.ts',import.meta.url),'utf8').replace("'three'",JSON.stringify(import.meta.resolve('three'))).replace("'../os/cgfx-animation'",JSON.stringify(animationUrl)).replace("'./cgfx-lighting'",JSON.stringify(asModule(lightingSource))).replace("'../os/native-png'",JSON.stringify(pngUrl)).replace("'./cgfx-billboard'",JSON.stringify(billboardUrl));
const {createFirmwareModel}=await import(asModule(modelSource));
test('native CGFX Hermite curve preserves tangents and repeat period',()=>{
 const curve={KeyFrames:[{Frame:0,Value:-.4,InSlope:0,OutSlope:0},{Frame:75,Value:.6,InSlope:0,OutSlope:0},{Frame:150,Value:-.4,InSlope:0,OutSlope:0}],StartFrame:0,EndFrame:150,PreRepeat:'Repeat',PostRepeat:'Repeat',InterpolationType:'Hermite'};
 assert.ok(Math.abs(sampleCgfxCurve(curve,37.5)-.1)<1e-7);
 assert.equal(sampleCgfxCurve(curve,225),.6);
 assert.equal(sampleCgfxCurve(curve,75),.6);
});
test('folder conversion includes source geometry, textures, bone and material animation',()=>{
 const data=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/folder/model.json',import.meta.url),'utf8'));
 assert.equal(data.schema,1);assert.equal(data.models[0].skeleton.length,12);assert.equal(data.textures.length,9);
 assert.equal(data.skeletalAnimations.length,1);assert.equal(data.materialAnimations.length,1);
 assert.ok(data.models[0].materials.every(m=>Array.isArray(m.ConstantAssignments)));
 assert.ok(data.models[0].meshes.some(m=>m.position.length===502));
 assert.equal(data.models[0].skeleton.find(b=>b.Name==='Text').BillboardMode,'ScreenViewpoint');
});
test('ScreenViewpoint preserves the source renderer tilt while cancelling the complete parent yaw',()=>{
 const camera=new THREE.PerspectiveCamera(30,5/3,26.5,1000);camera.position.set(0,1,44.786);camera.lookAt(0,1,0);camera.updateMatrixWorld();
 const expected=new THREE.Matrix4().makeRotationX(Math.atan(1/44.786));
 for(const yaw of [0,.2,-.3,Math.PI]){
  const parent=new THREE.Matrix4().makeRotationY(yaw),worldView=new THREE.Matrix4().multiplyMatrices(camera.matrixWorldInverse,parent);
  const local=screenViewpointBone(new THREE.Matrix4(),{X:0,Y:0,Z:0},worldView),world=parent.clone().multiply(local);
  world.elements.forEach((n,i)=>assert.ok(Math.abs(n-expected.elements[i])<1e-10,`${yaw}, component ${i}`));
 }
 assert.throws(()=>screenViewpointBone(new THREE.Matrix4(),{X:0,Y:0,Z:0},new THREE.Matrix4()),/Degenerate/);
});
test('native text mesh keeps its authored corners, remains visible under parent yaw, and accepts cached RGBA replacement',()=>{
 const data=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/folder/model.json',import.meta.url),'utf8'));
 const pixels={width:256,height:64,data:new Uint8ClampedArray(256*64*4).fill(255)};pixels.data.set([3,7,11,0]);
 const model=createFirmwareModel({data,images:new Map([['DmyText_00',pixels]])},{},{overlayCoverage:true}),camera=new THREE.PerspectiveCamera(30,5/3,26.5,1000);
 camera.position.set(0,1,44.786);camera.lookAt(0,1,0);camera.updateMatrixWorld();
 const source=data.models[0].meshes.find(m=>data.models[0].materials[m.material].Name==='mt_Text'),text=model.group.children[0].children.find(m=>m.geometry.getAttribute('position').count===source.position.length);
 assert.equal(text.visible,false);assert.equal(model.setTexture('DmyText_00',pixels),true);assert.equal(model.setMaterialVisible('mt_Text',true),true);
 const texture=text.material.uniforms.tex0.value,version=texture.version;
 assert.equal(text.material.blendSrc,THREE.SrcAlphaFactor);assert.equal(text.material.blendSrcAlpha,THREE.OneFactor,'temporary overlay alpha tracks coverage independently of native framebuffer alpha');
 assert.equal(model.setTexture('DmyText_00',pixels),true);assert.equal(texture.version,version,'unchanged label does not re-upload');
 assert.deepEqual([...texture.image.data.slice((63*256)*4,(63*256)*4+4)],[3,7,11,0],'top-down RGBA is flipped without losing hidden channels');
 assert.throws(()=>model.setTexture('DmyText_00',{...pixels,width:128}),/dimensions differ/);
 let before;
 for(const yaw of [0,.31,-.23]){
  model.group.rotation.y=yaw;model.update(0,camera);
  const world=Array.from({length:source.position.length},(_,i)=>new THREE.Vector3().fromBufferAttribute(text.geometry.getAttribute('position'),i).applyMatrix4(text.matrixWorld));
  if(before)world.forEach((v,i)=>assert.ok(v.distanceTo(before[i])<.00001));else before=world;
 }
 assert.equal(text.geometry.getAttribute('position').count,16);model.dispose();
});
test('PICA LUT interpolation preserves quantized signed slopes and terminal extrapolation',()=>{
 assert.deepEqual(decodeCgfxLutWord(4095|(2047<<12)|(1<<23)),[1,-1]);
 const words=Array(256).fill(0);words[0]=1024|(100<<12);words[128]=2048|(200<<12)|(1<<23);words[255]=3000|(30<<12);
 const sampler={Flags:'IsAbsolute',RawWords:words};
 assert.equal(sampleCgfxLut(sampler,-.5),1024/4095,'one-sided unsigned input clamps negative values rather than reflecting them');
 assert.equal(sampleCgfxLut(sampler,.5/256),1024/4095+(100/2047)*.5);
 assert.equal(sampleCgfxLut(sampler,1),3000/4095+30/2047,'input 1 uses the final entry and its authored slope');
 sampler.Flags='0';assert.equal(sampleCgfxLut(sampler,-1),2048/4095);
 assert.equal(sampleCgfxLut(sampler,-1+.5/128),2048/4095-(200/2047)*.5);
});
test('real folder binds its authored directional light and LUT without a power highlight',()=>{
 const data=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/folder/model.json',import.meta.url),'utf8'));
 const params=data.models[0].materials.find(m=>m.Name==='mt_folder_00').MaterialParams;
 const sampler=resolveCgfxLut(params,data,'Dist0');assert.equal(sampler.Name,'Folder_00');assert.equal(sampler.RawWords.length,256);
 for(const lut of data.luts)for(const s of lut.Samplers)for(let i=0;i<256;i++)assert.ok(Math.abs(decodeCgfxLutWord(s.RawWords[i])[0]-s.Table[i])<1e-7);
 assert.equal(data.lights[0].NativeType,'Directional');assert.equal(data.lights[0].Content.Direction.Z,-.70710677);
 const shader=cgfxLightingShader(params,data);assert.equal(shader.samplers[0],sampler);assert.ok(!shader.code.includes('pow('));
 const quarter=structuredClone(params);quarter.LUTInputScale.Dist0='Quarter';assert.ok(cgfxLightingShader(quarter,data).code.includes('*0.25'));
 const broken=structuredClone(data);broken.luts=[];assert.throws(()=>cgfxLightingShader(params,broken),/Missing native CGFX LUT/);
 const icon=data.models[0].materials.find(m=>m.Name==='mt_icon').MaterialParams;assert.equal(cgfxLightingShader(icon,data).samplers[0].Name,'Icon_00');
});
test('CGFX alternatives require explicit selection and independent frozen checkpoints',()=>{
 const clips=[{Name:'in',FramesCount:20,AnimationFlags:'0'},{Name:'out',FramesCount:40,AnimationFlags:'0'}];
 assert.throws(()=>selectCgfxClips(clips),/explicit animation selection/);
 assert.throws(()=>selectCgfxClips(clips,[{name:'missing'}]),/Invalid native animation selection/);
 assert.throws(()=>selectCgfxClips(clips,[{name:'in'},{name:'in'}]),/Invalid native animation selection/);
 assert.deepEqual(selectCgfxClips(clips,[]),[]);
 assert.equal(selectCgfxClips(clips,[{name:'in',frame:20}])[0].frame,20);
 assert.equal(cgfxClipFrame(clips[0],800),20);
 assert.equal(cgfxClipFrame({Name:'loop',FramesCount:600,AnimationFlags:'IsLooping'},650),50);
});
test('real HOME background binds one scene clip and restores colors/UVs when clips change',()=>{
 const data=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json',import.meta.url),'utf8'));
 const before=JSON.stringify(data),asset={data,images:new Map()};
 assert.throws(()=>createFirmwareModel(asset),/explicit animation selection/);
 const model=createFirmwareModel(asset,{skeletal:[{name:'BannerBG_SceneIn',frame:20}],material:[]});
 model.update(9000);
 const mesh=model.group.children[0].children[0],uniforms=mesh.material.uniforms,position=mesh.geometry.getAttribute('position');
 const source=data.models[0].meshes[0].position;
 for(let i=0;i<source.length;i++)for(let axis=0;axis<3;axis++)assert.ok(Math.abs(position.array[i*3+axis]-source[i][axis])<1e-4,'settled SceneIn must not also apply SceneOut');
 const originalColor=uniforms.constant0.value.toArray(),originalMatrix=uniforms.uvMatrix1.value.toArray();
 model.setPlayback({skeletal:[],material:[{name:'BannerBG_AppPause',frame:0}]});model.update(9000);
 assert.deepEqual(uniforms.constant0.value.toArray(),[1,1,1,originalColor[3]],'RGBA animation preserves an unauthored alpha channel');
 assert.notDeepEqual(uniforms.uvMatrix1.value.toArray(),originalMatrix);
 model.setPlayback({skeletal:[],material:[]});model.update(9000);
 assert.deepEqual(uniforms.constant0.value.toArray(),originalColor);
 assert.deepEqual(uniforms.uvMatrix1.value.toArray(),originalMatrix);
 assert.equal(JSON.stringify(data),before,'playback must not mutate the shared asset');model.dispose();
});
test('HOME runtime yaw wraps independently of selection and native bob clips',async()=>{
 const {homeBannerYaw}=await import(asModule(readFileSync(new URL('../src/os/banner-motion.ts',import.meta.url),'utf8')));
 assert.equal(homeBannerYaw(0),homeBannerYaw(10000));
 assert.ok(Math.abs(homeBannerYaw(149.5*1000/60)+Math.PI/2)<1e-6);
 assert.ok(Math.abs(homeBannerYaw(299.5*1000/60)+Math.PI)<1e-6);
 assert.equal(homeBannerYaw(9999),-0);assert.throws(()=>homeBannerYaw(NaN),/Invalid banner time/);
});
test('native HOME camera projects the source folder label at its captured width',async()=>{
 const {Vector3}=await import('three');
 const cameraSource=readFileSync(new URL('../src/scene/firmware-camera.ts',import.meta.url),'utf8').replace("'three'",JSON.stringify(import.meta.resolve('three')));
 const {createFirmwareCamera}=await import(asModule(cameraSource));
 const data=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/home-camera/camera.json',import.meta.url),'utf8'));
 const camera=createFirmwareCamera(data),left=new Vector3(-10,-5,4.95).project(camera),right=new Vector3(10,-5,4.95).project(camera);
 assert.ok(Math.abs((right.x-left.x)*200-224.84491)<.00001);
 assert.deepEqual(camera.position.toArray(),[0,1,44.7859992980957]);assert.equal(camera.near,26.5);
 const bad=structuredClone(data);bad.cameras[0].near=-1;assert.throws(()=>createFirmwareCamera(bad),/Invalid native camera projection/);
 bad.cameras[0].near=26.5;bad.cameras[0].rotation[1]=1;assert.throws(()=>createFirmwareCamera(bad),/Unsupported native camera transform/);
});
test('model raw texture upload preserves hidden RGB and reverses PNG rows explicitly',()=>{
 const data=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json',import.meta.url),'utf8'));
 const pixels={width:1,height:2,data:new Uint8ClampedArray([10,20,30,0,40,50,60,255])};
 const model=createFirmwareModel({data,images:new Map([['BG_DmyApp_00',pixels]])},{skeletal:[],material:[]});
 const texture=model.group.children[0].children[0].material.uniforms.tex0.value;
 assert.deepEqual([...texture.image.data],[40,50,60,255,10,20,30,0]);
 assert.equal(texture.flipY,false);assert.deepEqual([...pixels.data],[10,20,30,0,40,50,60,255]);model.dispose();
});
