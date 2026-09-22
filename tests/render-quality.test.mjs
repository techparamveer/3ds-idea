import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/scene/render-quality.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {chooseRenderQuality}=await import(`data:text/javascript,${encodeURIComponent(js)}`);

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
