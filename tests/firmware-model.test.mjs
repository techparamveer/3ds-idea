import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/os/cgfx-animation.ts',import.meta.url),'utf8');
const {sampleCgfxCurve}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
const lightingSource=readFileSync(new URL('../src/scene/cgfx-lighting.ts',import.meta.url),'utf8');
const {decodeCgfxLutWord,sampleCgfxLut,resolveCgfxLut,cgfxLightingShader}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(lightingSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
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
