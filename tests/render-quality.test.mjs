import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/scene/render-quality.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {chooseRenderQuality,screenPaintFps}=await import(`data:text/javascript,${encodeURIComponent(js)}`);

test('render quality bounds fill-rate and disables VGPU on constrained devices',()=>{
  const quality=chooseRenderQuality({devicePixelRatio:3,hardwareConcurrency:4,deviceMemory:4,saveData:false,width:1440,height:900});
  assert.equal(quality.tier,'constrained');
  assert.equal(quality.pixelRatio,1);
  assert.equal(quality.renderFps,30);
  assert.equal(quality.useVgpu,false);
});

test('high quality caps DPR, shadows, screen uploads and VGPU texture size',()=>{
  const quality=chooseRenderQuality({devicePixelRatio:3,hardwareConcurrency:12,deviceMemory:16,width:1440,height:900});
  assert.equal(quality.tier,'high');
  assert.equal(quality.pixelRatio,1.5);
  assert.equal(quality.shadowMapSize,1024);
  assert.equal(quality.screenFps,24);
  assert.equal(quality.surfaceSize,512);
});

test('counted transitions use the scene budget without changing idle or constrained budgets',()=>{
  for(const [cores,memory,expected] of [[12,16,[24,60]],[6,8,[18,45]],[4,4,[12,30]]]){
    const quality=chooseRenderQuality({devicePixelRatio:1,hardwareConcurrency:cores,deviceMemory:memory,width:1000,height:860});
    assert.deepEqual([screenPaintFps(quality,false),screenPaintFps(quality,true)],expected);
    assert.equal(screenPaintFps(quality,false),quality.screenFps,'one transition does not mutate the policy');
  }
});
