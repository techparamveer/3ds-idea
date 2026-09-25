import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';

const source=readFileSync(new URL('../src/os/cgfx-animation.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {sampleCgfxCurve}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const privateRoot=process.env.CGFX_ZONE_PRIVATE;

test('Zone source boundary fixture exposes actual browser mixed-segment sampling gaps',{
 skip:!privateRoot&&'requires private Zone conversion directory',
},()=>{
 const model=JSON.parse(readFileSync(join(privateRoot,'full-converted/model.json'),'utf8'));
 const fixture=JSON.parse(readFileSync(new URL('../docs/evidence/zone-common-banner-playback-boundary.json',import.meta.url),'utf8'));
 const channels=new Map([
  ['0x4e84',['skeletalAnimations',0,'RotationX']],
  ['0x5258',['materialAnimations',6,'X']],
  ['0x6a44',['materialAnimations',11,'Y']],
  ['0x7128',['materialAnimations',16,'X']],
 ]);
 assert.equal(model.sourceSha256,fixture.commonCgfxSha256);
 for(const row of fixture.comparisons){
  const [type,index,channel]=channels.get(row.groupOffset);
  const curve=model[type][0].Elements[index].Content[channel];
  assert.equal(curve.InterpolationType,row.browserInterpolation);
  for(const sample of row.samples){
   const actual=sampleCgfxCurve(curve,sample.frame,NaN);
   assert.ok(Math.abs(actual-sample.flattenedBrowser)<0.00001,`${row.groupOffset} at ${sample.frame}: ${actual}`);
  }
 }
 const bridge=fixture.comparisons.find(row=>row.groupOffset==='0x5258').samples.find(sample=>sample.frame===119.5);
 assert.equal(bridge.difference,14.5);
});
