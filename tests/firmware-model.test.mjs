import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/os/cgfx-animation.ts',import.meta.url),'utf8');
const {sampleCgfxCurve}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
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
