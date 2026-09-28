import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
import {WebGLRenderLists} from 'three/src/renderers/webgl/WebGLRenderLists.js';
import {defaultBannerData,hasAuthoredDefault} from './helpers/banner-default.mjs';
const source=readFileSync(new URL('../src/os/cgfx-animation.ts',import.meta.url),'utf8');
const asModule=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const animationUrl=asModule(source);
const {sampleCgfxCurve,selectCgfxClips,cgfxClipFrame}=await import(animationUrl);
const lightingSource=readFileSync(new URL('../src/scene/cgfx-lighting.ts',import.meta.url),'utf8');
const {decodeCgfxLutWord,sampleCgfxLut,resolveCgfxLut,cgfxLightingShader}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(lightingSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const pngUrl=asModule(readFileSync(new URL('../src/os/native-png.ts',import.meta.url),'utf8'));
const billboardUrl=asModule(readFileSync(new URL('../src/scene/cgfx-billboard.ts',import.meta.url),'utf8').replace("'three'",JSON.stringify(import.meta.resolve('three'))));
const {nativeYAxialBone}=await import(billboardUrl);
const modelSource=readFileSync(new URL('../src/scene/firmware-model.ts',import.meta.url),'utf8').replace("'three'",JSON.stringify(import.meta.resolve('three'))).replace("'../os/cgfx-animation'",JSON.stringify(animationUrl)).replace("'./cgfx-lighting'",JSON.stringify(asModule(lightingSource))).replace("'../os/native-png'",JSON.stringify(pngUrl)).replace("'./cgfx-billboard'",JSON.stringify(billboardUrl));
const {createFirmwareModel}=await import(asModule(modelSource));
// Evaluate only the emitted direction expression in Node. Expected vectors come
// from original ARM execution, not this shader; GPU compilation is a separate check.
function generatedLightDirection(code,viewMatrix){
 const expression=code.match(/vec3 L=normalize\((-?)mat3\(viewMatrix\)\*vec3\(([^)]+)\)\);/);
 assert.ok(expression,'expected a direction (w=0) transformed by the view matrix');
 return new THREE.Vector3(...expression[2].split(',').map(Number)).applyMatrix3(new THREE.Matrix3().setFromMatrix4(viewMatrix)).multiplyScalar(expression[1]?-1:1).normalize();
}
test('generated CGFX direction agrees with executed native camera and nonunit controls',()=>{
 const evidence=JSON.parse(readFileSync(new URL('../docs/evidence/native-directional-light-installation.json',import.meta.url),'utf8')).nativeDrawExecution;
 const data=folderData(),params=data.models[0].materials.find(m=>m.Name==='mt_folder_00').MaterialParams;
 for(const row of evidence.cases.filter(row=>row.case!=='light_slot3_control')){
  const [X,Y,Z]=row.cachedDirection;data.lights[0].Content.Direction={X,Y,Z};
  const view=new THREE.Matrix4().set(...row.viewMatrixRowMajor3x4,0,0,0,1);
  const actual=generatedLightDirection(cgfxLightingShader(params,data).code,view);
  const expected=new THREE.Vector3(...row.setterCapture.vector4.slice(0,3)).normalize();
  assert.ok(actual.distanceTo(expected)<1e-8,row.case);
  assert.ok(actual.distanceTo(new THREE.Vector3(...row.normalizedPosition))<.0001,'native float16 packing is a separate bounded precision difference');
 }
});
test('authored default materials use the native direction and retain unit disabled-LUT specular', {skip:!hasAuthoredDefault},()=>{
 const data=defaultBannerData(),before=JSON.stringify(data);
 assert.equal(data.sourceSha256,'e5711a422d51e11c7047ebcb415401451335c39c46ecfbf1e3abdbffe8985955');
 for(const material of data.models[0].materials){
  const shader=cgfxLightingShader(material.MaterialParams,data);
  assert.ok(shader);assert.equal(shader.samplers.length,0);
  const direction=generatedLightDirection(shader.code,new THREE.Matrix4());
  assert.ok(Math.abs(direction.z-.91192151)<1e-7,'front-facing diffuse must be positive');
  assert.match(shader.code,/litSecondary\.rgb\+=\(vec3\(1\.00000000,1\.00000000,1\.00000000\)\*vec3\(1\.00000000,1\.00000000,1\.00000000\)\*1\.0\+/);
 }
 assert.equal(JSON.stringify(data),before,'lighting generation preserves authored TEV, colors and texture records');
});
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
 assert.equal(data.models[0].skeleton.find(b=>b.Name==='Text').BillboardMode,'ScreenViewpoint','SPICA enum label is preserved only as parser provenance');
 assert.equal(data.models[0].skeleton.find(b=>b.Name==='Text').NativeBillboardMode,5);
});
test('raw native mode5 preserves world Y and faces camera direction without viewpoint tilt',()=>{
 const camera=new THREE.PerspectiveCamera(30,5/3,26.5,1000);camera.position.set(0,1,44.786);camera.lookAt(0,1,0);camera.updateMatrixWorld();
 for(const yaw of [0,.2,-.3,Math.PI]){
  const parent=new THREE.Matrix4().makeRotationY(yaw);
  const local=nativeYAxialBone(new THREE.Matrix4(),parent,camera.matrixWorld),world=parent.clone().multiply(local);
  world.elements.forEach((n,i)=>assert.ok(Math.abs(n-new THREE.Matrix4().elements[i])<1e-10,`${yaw}, component ${i}`));
 }
 const parent=new THREE.Matrix4().compose(new THREE.Vector3(2,3,4),new THREE.Quaternion().setFromEuler(new THREE.Euler(.2,.3,0)),new THREE.Vector3(2,3,4));
 camera.position.set(8,12,44);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const local=nativeYAxialBone(new THREE.Matrix4(),parent,camera.matrixWorld),world=parent.clone().multiply(local);
 assert.ok(new THREE.Vector3().setFromMatrixColumn(world,1).normalize().distanceTo(new THREE.Vector3().setFromMatrixColumn(parent,1).normalize())<1e-10);
 assert.ok(new THREE.Vector3().setFromMatrixPosition(world).distanceTo(new THREE.Vector3(2,3,4))<1e-10);
 assert.ok(new THREE.Vector3().setFromMatrixScale(world).distanceTo(new THREE.Vector3(2,3,4))<1e-10);
 assert.throws(()=>nativeYAxialBone(new THREE.Matrix4(),new THREE.Matrix4().makeScale(0,1,1),camera.matrixWorld),/Degenerate/);
});
test('converted Settings p_title mode 1 updates both source meshes through its COMMON clip',()=>{
 const data=JSON.parse(readFileSync(new URL('./fixtures/settings-billboard-model.json',import.meta.url),'utf8'));
 assert.equal(data.sourceSha256,'96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d');
 assert.equal(data.models[0].skeleton[0].Name,'p_title');
 assert.equal(data.models[0].skeleton[0].NativeBillboardMode,1);
 assert.deepEqual(data.models[0].meshes.map(mesh=>mesh.submeshes[0].bones),[[0],[0]]);
 const before=JSON.stringify(data),model=createFirmwareModel({data,images:new Map()},{skeletal:[{name:'COMMON'}],material:[]});
 const camera=new THREE.PerspectiveCamera(30,5/3,26.5,1000);
 const check=(frame,y,direction)=>{
  model.update(frame*1000/60,camera);
  for(const [index,source] of data.models[0].meshes.entries()){
   const mesh=model.group.children[0].children[index],actual=new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'),0).applyMatrix4(mesh.matrixWorld);
   const [sx,sy,sz]=source.position[0],expected=new THREE.Vector3(.94*sx,.94*(direction.z*sy+direction.y*sz)+y,.94*(-direction.y*sy+direction.z*sz));
   assert.ok(actual.distanceTo(expected)<1e-4,`frame ${frame}, mesh ${index}: ${actual.toArray()} vs ${expected.toArray()}`);
  }
 };
 camera.position.set(0,1,44.786);camera.lookAt(0,1,0);
 check(0,-7.05967,{y:0,z:1});check(132,-7.08047,{y:0,z:1});check(312,-7.23887,{y:0,z:1});
 model.group.rotation.y=.4;camera.position.set(0,30,40);camera.lookAt(0,0,0);
 check(312,-7.23887,{y:.6,z:.8});
 assert.equal(JSON.stringify(data),before,'source CGFX values must stay unchanged');
 model.dispose();
});
test('full private Settings conversion updates every source mesh without mutation',{skip:!process.env.NATIVE_SETTINGS_MODEL_JSON},()=>{
 const data=JSON.parse(readFileSync(process.env.NATIVE_SETTINGS_MODEL_JSON,'utf8'));
 assert.equal(data.sourceSha256,'96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d');
 const before=JSON.stringify(data),model=createFirmwareModel({data,images:new Map()},{skeletal:[{name:'COMMON'}],material:[]});
 const camera=new THREE.PerspectiveCamera(30,5/3,26.5,1000);camera.position.set(0,1,44.786);camera.lookAt(0,1,0);
 for(const frame of [0,1,150,300,599]){
  model.update(frame*1000/60,camera);
  const meshes=model.group.children[0].children;
  assert.equal(meshes.length,12);
  assert.equal(meshes.reduce((count,mesh)=>count+mesh.geometry.getAttribute('position').count,0),1454);
  for(const mesh of meshes)for(const value of mesh.geometry.getAttribute('position').array)assert.ok(Number.isFinite(value));
 }
 assert.equal(JSON.stringify(data),before);model.dispose();
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
test('native type-1 common banners accept larger EUR artwork in matching material slots',()=>{
 for(const name of ['camera','sound','health','eshop']){
  const common=JSON.parse(readFileSync(new URL(`../public/os/firmware/10.7.0-32E/models/${name}-banner-common/model.json`,import.meta.url),'utf8'));
  const selected=JSON.parse(readFileSync(new URL(`../public/os/firmware/10.7.0-32E/models/${name}-banner-eur/model.json`,import.meta.url),'utf8'));
  const playback={skeletal:common.skeletalAnimations.map(clip=>({name:clip.Name})),material:common.materialAnimations.map(clip=>({name:clip.Name}))};
  const images=new Map(common.textures.map(texture=>[texture.name,{width:texture.width,height:texture.height,data:new Uint8ClampedArray(texture.width*texture.height*4)}]));
  const model=createFirmwareModel({data:common,images},playback);
  for(const record of selected.textures){
   const source=common.textures.find(texture=>texture.name===record.name);
   assert.ok(source,`${name}: ${record.name} maps to a common texture`);
   const image={width:record.width,height:record.height,data:new Uint8ClampedArray(record.width*record.height*4)};
   const resized=source.width!==record.width||source.height!==record.height;
   if(resized)assert.throws(()=>model.setTexture(record.name,image),/dimensions differ/);
   assert.equal(model.setTexture(record.name,image,{allowSizeChange:true}),true,`${name}: ${record.name} bound`);
  }
  model.dispose();
 }
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
 const light=generatedLightDirection(shader.code,new THREE.Matrix4()),half=new THREE.Vector3(0,0,1).add(light).normalize();
 assert.ok(Math.abs(sampleCgfxLut(sampler,half.z)-.214974)<1e-6,'corrected native light feeds the authored folder half-vector LUT');
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

// These real resources previously fell through to Three's LessEqual default.
test('native folder and background preserve authored depth comparison on every mesh',()=>{
 for(const name of ['folder','home-background']){
  const data=JSON.parse(readFileSync(new URL(`../public/os/firmware/10.7.0-32E/models/${name}/model.json`,import.meta.url),'utf8'));
  const before=JSON.stringify(data),model=createFirmwareModel({data,images:new Map()},{skeletal:[],material:[]});
  const comparisons={Never:THREE.NeverDepth,Always:THREE.AlwaysDepth,Equal:THREE.EqualDepth,NotEqual:THREE.NotEqualDepth,Less:THREE.LessDepth,LessOrEqual:THREE.LessEqualDepth,Greater:THREE.GreaterDepth,GreaterOrEqual:THREE.GreaterEqualDepth};
  data.models.forEach((source,index)=>{
   let child=0;
   for(const mesh of source.meshes)for(const sub of mesh.submeshes){
    const actual=model.group.children[index].children[child++].material,expected=source.materials[mesh.material].MaterialParams.DepthColorMask;
    assert.equal(actual.depthFunc,comparisons[expected.DepthFunc]);
    assert.equal(actual.depthTest,expected.Enabled);assert.equal(actual.depthWrite,expected.DepthWrite);
   }
  });
  assert.equal(JSON.stringify(data),before);model.dispose();
 }
});

const folderData=()=>JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/folder/model.json',import.meta.url),'utf8'));
const stencilProperties=material=>Object.fromEntries(['stencilWrite','stencilFunc','stencilRef','stencilFuncMask','stencilWriteMask','stencilFail','stencilZFail','stencilZPass'].map(key=>[key,material[key]]));
test('all eight authored stencil comparisons and operations map exactly, including zero write mask',()=>{
 const comparisons={Never:THREE.NeverStencilFunc,Always:THREE.AlwaysStencilFunc,Equal:THREE.EqualStencilFunc,NotEqual:THREE.NotEqualStencilFunc,Less:THREE.LessStencilFunc,LessOrEqual:THREE.LessEqualStencilFunc,Greater:THREE.GreaterStencilFunc,GreaterOrEqual:THREE.GreaterEqualStencilFunc};
 const operations={Keep:THREE.KeepStencilOp,Zero:THREE.ZeroStencilOp,Replace:THREE.ReplaceStencilOp,Increment:THREE.IncrementStencilOp,Decrement:THREE.DecrementStencilOp,Invert:THREE.InvertStencilOp,IncrementWrap:THREE.IncrementWrapStencilOp,DecrementWrap:THREE.DecrementWrapStencilOp};
 for(const [index,[comparison,expected]]of Object.entries(comparisons).entries()){
  const [operation,op]=Object.entries(operations)[index],data=folderData();
  for(const material of data.models[0].materials){material.MaterialParams.StencilTest={Enabled:true,Function:comparison,Reference:3,Mask:5,BufferMask:0};material.MaterialParams.StencilOperation={FailOp:operation,ZFailOp:operation,ZPassOp:operation};}
  const model=createFirmwareModel({data,images:new Map()});
  model.group.traverse(node=>{if(node.isMesh)assert.deepEqual(stencilProperties(node.material),{stencilWrite:true,stencilFunc:expected,stencilRef:3,stencilFuncMask:5,stencilWriteMask:0,stencilFail:op,stencilZFail:op,stencilZPass:op});});model.dispose();
 }
});

test('per-instance stencil overrides cover all primary materials, survive animation and preserve asset and blend state',()=>{
 const data=folderData(),before=JSON.stringify(data),asset={data,images:new Map()},runtimeStencil=Object.freeze({enabled:true,function:'Equal',reference:1,compareMask:1,writeMask:255,fail:'Keep',depthFail:'Keep',depthPass:'Keep'});
 const primary=createFirmwareModel(asset,{}, {runtimeStencil,overlayCoverage:true}),original=createFirmwareModel(asset);
 for(const sample of [0,75,225]){
  primary.setPlayback({skeletal:[{name:'BannerFolder',frame:sample}],material:[{name:'BannerFolder',frame:sample}]});primary.update(0);
  primary.group.traverse(node=>{if(node.isMesh)assert.deepEqual(stencilProperties(node.material),{stencilWrite:true,stencilFunc:THREE.EqualStencilFunc,stencilRef:1,stencilFuncMask:1,stencilWriteMask:255,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp,stencilZPass:THREE.KeepStencilOp});});
 }
 original.group.traverse(node=>{if(node.isMesh)assert.equal(node.material.stencilWrite,false);});
 assert.equal(JSON.stringify(data),before);
 const textIndex=data.models[0].materials.findIndex(m=>m.Name==='mt_Text'),textMeshIndex=data.models[0].meshes.findIndex(m=>m.material===textIndex),material=primary.group.children[0].children[textMeshIndex].material;
 assert.equal(material.blendSrc,THREE.SrcAlphaFactor);assert.equal(material.blendSrcAlpha,THREE.OneFactor);
 assert.equal(material.depthFunc,THREE.LessDepth);primary.dispose();original.dispose();
});

test('missing source stencil stays disabled and a write-mask-only override does not enable it',()=>{
 const data=folderData();for(const m of data.models[0].materials){delete m.MaterialParams.StencilTest;delete m.MaterialParams.StencilOperation;}
 const model=createFirmwareModel({data,images:new Map()},{},{runtimeStencil:{writeMask:0}});
 model.group.traverse(node=>{if(node.isMesh){assert.equal(node.material.stencilWrite,false);assert.equal(node.material.stencilWriteMask,0);}});model.dispose();
});

test('invalid authored and override stencil enums throw, even when overridden or disabled',()=>{
 for(const invalid of ['Bogus','constructor'])for(const field of ['Function','FailOp','ZFailOp','ZPassOp']){
  const data=folderData(),p=data.models[0].materials[0].MaterialParams;
  if(field==='Function')p.StencilTest.Function=invalid;else p.StencilOperation[field]=invalid;
  assert.throws(()=>createFirmwareModel({data,images:new Map()},{},{runtimeStencil:{enabled:false,function:'Equal',fail:'Keep',depthFail:'Keep',depthPass:'Keep'}}),/Unsupported native stencil/);
 }
 for(const field of ['function','fail','depthFail','depthPass'])assert.throws(()=>createFirmwareModel({data:folderData(),images:new Map()},{},{runtimeStencil:{[field]:'Bogus'}}),/Unsupported native stencil/);
});

test('native draw groups survive every internal Group and Three transparent sorting regardless of insertion',()=>{
 const models=[2,0,1].map(drawGroup=>{
  const data=folderData();data.models.push(structuredClone(data.models[0]));
  // Force priorities opposite to the native outer group order.
  for(const source of data.models)for(const mesh of source.meshes){mesh.layer=2-drawGroup;mesh.priority=99;}
  return createFirmwareModel({data,images:new Map()},{},{drawGroup});
 });
 const scene=new THREE.Scene();scene.add(...models.map(m=>m.group));
 const lists=new WebGLRenderLists(),list=lists.get(scene,0),camera=new THREE.PerspectiveCamera();list.init();
 // WebGLRenderer.projectObject replaces inherited groupOrder at each Group.
 function project(object,groupOrder=0){
  if(object.isGroup)groupOrder=object.renderOrder;
  if(object.isMesh)list.push(object,object.geometry,object.material,groupOrder,0,null,camera);
  for(const child of object.children)project(child,groupOrder);
 }
 project(scene);list.sort();
 assert.deepEqual([...new Set(list.transparent.map(item=>item.groupOrder))],[0,1,2]);
 for(const model of models){model.group.traverse(node=>{if(node.isGroup)assert.equal(node.renderOrder,model.group.renderOrder);});model.dispose();}lists.dispose();
});


test('explicitly absent vertex color uses source material diffuse while authored and legacy zeros remain zero',()=>{
 const source=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/eshop-banner-common/model.json',import.meta.url),'utf8'));
 for(const presence of [false,true,undefined]){
  const data=structuredClone(source);
  for(const mesh of data.models[0].meshes){
   if(presence===undefined)delete mesh.hasVertexColor;else mesh.hasVertexColor=presence;
  }
  const images=new Map(data.textures.map(texture=>[texture.name,{width:texture.width,height:texture.height,data:new Uint8ClampedArray(texture.width*texture.height*4)}]));
  const model=createFirmwareModel({data,images},{}),meshes=[];model.group.traverse(node=>{if(node.isMesh)meshes.push(node);});
  assert.equal(meshes.length,data.models[0].meshes.length);
  meshes.forEach((mesh,index)=>{
   const original=data.models[0].meshes[index],diffuse=data.models[0].materials[original.material].MaterialParams.DiffuseColor;
   const color=mesh.geometry.getAttribute('nativeColor');
   for(let i=0;i<color.count;i++){
    const expected=presence===false?[diffuse.R/255,diffuse.G/255,diffuse.B/255,diffuse.A/255]:original.color[i];
    for(let j=0;j<4;j++)assert.ok(Math.abs(color.array[i*4+j]-expected[j])<1e-7);
   }
  });
  assert.deepEqual(data.models[0].meshes.map(mesh=>mesh.color),source.models[0].meshes.map(mesh=>mesh.color),'source arrays remain unmodified');
  model.dispose();
 }
});

test('delivered Camera photos and eShop meshes retain source attribute presence and visible material alpha',()=>{
 for(const [kind,presence] of [['camera',[true,false,false,false]],['eshop',[false,false,false,false]]]){
  const data=JSON.parse(readFileSync(new URL(`../public/os/firmware/10.7.0-32E/models/${kind}-banner-common/model.json`,import.meta.url),'utf8'));
  assert.deepEqual(data.models[0].meshes.map(mesh=>mesh.hasVertexColor),presence);
  const images=new Map(data.textures.map(texture=>[texture.name,{width:texture.width,height:texture.height,data:new Uint8ClampedArray(texture.width*texture.height*4)}]));
  const model=createFirmwareModel({data,images},{}),meshes=[];model.group.traverse(node=>{if(node.isMesh)meshes.push(node);});
  meshes.forEach((mesh,index)=>{
   const authored=data.models[0].meshes[index];
   if(authored.hasVertexColor)return;
   assert.ok(authored.color.every(value=>value[3]===0),'decoder array retained separately from absent-input binding');
   const alpha=data.models[0].materials[authored.material].MaterialParams.DiffuseColor.A/255;
   assert.ok(alpha>0);
   const colors=mesh.geometry.getAttribute('nativeColor');
   for(let i=0;i<colors.count;i++)assert.ok(Math.abs(colors.getW(i)-alpha)<1e-7);
  });
  model.dispose();
 }
});
