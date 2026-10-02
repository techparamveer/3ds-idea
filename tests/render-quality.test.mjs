import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/scene/render-quality.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {applicationCloseNeedsPaint,chooseRenderQuality,pixelRatioForViewport,screenPaintFps}=await import(`data:text/javascript,${encodeURIComponent(js)}`);

test('render quality bounds fill-rate and disables VGPU on constrained devices',()=>{
  const quality=chooseRenderQuality({devicePixelRatio:3,hardwareConcurrency:4,deviceMemory:4,saveData:false,width:1440,height:900});
  assert.equal(quality.tier,'constrained');
  assert.equal(quality.pixelRatio,1.5);
  assert.equal(quality.renderFps,30);
  assert.equal(quality.useVgpu,false);
});

test('high quality caps DPR, shadows, screen uploads and VGPU texture size',()=>{
  const quality=chooseRenderQuality({devicePixelRatio:3,hardwareConcurrency:12,deviceMemory:16,width:1440,height:900});
  assert.equal(quality.tier,'high');
  assert.equal(quality.pixelRatio,2);
  assert.equal(quality.shadowMapSize,1024);
  assert.equal(quality.screenFps,24);
  assert.equal(quality.surfaceSize,512);
});

test('large high-density windows stay sharp within the drawing buffer budget',()=>{
  const quality=chooseRenderQuality({devicePixelRatio:2,hardwareConcurrency:12,deviceMemory:16,width:2000,height:1600});
  assert.equal(quality.tier,'constrained');
  assert.ok(quality.pixelRatio>1);
  assert.ok(2000*1600*quality.pixelRatio**2<=6_000_000);
  assert.equal(pixelRatioForViewport('high',2,1200,800),2);
  assert.ok(pixelRatioForViewport('high',2,3000,2000)<2);
});

test('counted transitions use the scene budget without changing idle or constrained budgets',()=>{
  for(const [cores,memory,expected] of [[12,16,[24,60]],[6,8,[18,45]],[4,4,[12,30]]]){
    const quality=chooseRenderQuality({devicePixelRatio:1,hardwareConcurrency:cores,deviceMemory:memory,width:1000,height:860});
    assert.deepEqual([screenPaintFps(quality,false),screenPaintFps(quality,true)],expected);
    assert.equal(screenPaintFps(quality,false),quality.screenFps,'one transition does not mutate the policy');
  }
});

test('application close publishes terminal and retirement pairs independent of cadence',()=>{
  const closing={phase:'closing',appQuitFrame:19},terminal={phase:'terminal',appQuitFrame:20};
  assert.equal(applicationCloseNeedsPaint(null,null,false),false);
  assert.equal(applicationCloseNeedsPaint(closing,closing,false),false);
  assert.equal(applicationCloseNeedsPaint(closing,{...closing,appQuitFrame:18},false),false);
  assert.equal(applicationCloseNeedsPaint(closing,terminal,false),true);
  assert.equal(applicationCloseNeedsPaint(terminal,null,false),true);
  assert.equal(applicationCloseNeedsPaint(null,closing,true),true);
  assert.equal(applicationCloseNeedsPaint(closing,{...closing},true),true);
  assert.equal(applicationCloseNeedsPaint(closing,closing,true),false);
});

test('terminal upload bypasses both 30fps and 45fps gates between 60Hz updates',()=>{
  for(const fps of [30,45]){
    let lastRender=0,previous={phase:'closing',appQuitFrame:19};
    const rendered=[];
    for(const [now,current] of [[1000/60,{phase:'terminal',appQuitFrame:20}],[2000/60,null]]){
      const forced=applicationCloseNeedsPaint(previous,current,false);
      if(forced||now-lastRender>=1000/fps){rendered.push(current?.appQuitFrame??'retired');lastRender=now;}
      previous=current;
    }
    assert.deepEqual(rendered,[20,'retired']);
  }
});
