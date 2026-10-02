import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/scene/render-quality.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {applicationCloseNeedsPaint,bootRevealNeedsPaint,chooseRenderQuality,pixelRatioForViewport,screenPaintFps}=await import(`data:text/javascript,${encodeURIComponent(js)}`);

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
  const closing={phase:'closing',appQuitFrame:19,dialogExitFrame:null};
  const terminal={phase:'terminal',appQuitFrame:20,dialogExitFrame:null};
  const exitStart={phase:'exiting',appQuitFrame:20,dialogExitFrame:0};
  const exitMiddle={phase:'exiting',appQuitFrame:20,dialogExitFrame:12};
  const exitTerminal={phase:'exit-terminal',appQuitFrame:20,dialogExitFrame:20};
  const footerStart={phase:'footer-exiting',appQuitFrame:20,dialogExitFrame:20,footerExitFrame:0};
  const footerMiddle={...footerStart,footerExitFrame:3};
  const footerTerminal={...footerStart,phase:'footer-terminal',footerExitFrame:6};
  const returnStart={...footerTerminal,phase:'footer-returning',footerReturnFrame:0};
  const returnMiddle={...returnStart,footerReturnFrame:4};
  const returnTerminal={...returnStart,phase:'return-terminal',footerReturnFrame:8};
  assert.equal(applicationCloseNeedsPaint(null,null,false),false);
  assert.equal(applicationCloseNeedsPaint(closing,closing,false),false);
  assert.equal(applicationCloseNeedsPaint(closing,{...closing,appQuitFrame:18},false),false);
  assert.equal(applicationCloseNeedsPaint(closing,terminal,false),true);
  assert.equal(applicationCloseNeedsPaint(terminal,exitStart,false),true);
  assert.equal(applicationCloseNeedsPaint(exitStart,exitMiddle,false),false);
  assert.equal(applicationCloseNeedsPaint(exitMiddle,exitTerminal,false),true);
  assert.equal(applicationCloseNeedsPaint(exitTerminal,footerStart,false),true);
  assert.equal(applicationCloseNeedsPaint(footerStart,footerMiddle,false),false);
  assert.equal(applicationCloseNeedsPaint(footerMiddle,footerTerminal,false),true);
  assert.equal(applicationCloseNeedsPaint(footerTerminal,null,false),true);
  assert.equal(applicationCloseNeedsPaint(footerTerminal,returnStart,false),true);
  assert.equal(applicationCloseNeedsPaint(returnStart,returnMiddle,false),false);
  assert.equal(applicationCloseNeedsPaint(returnMiddle,returnTerminal,false),true);
  assert.equal(applicationCloseNeedsPaint(returnTerminal,null,false),true);
  assert.equal(applicationCloseNeedsPaint(returnStart,returnStart,false,true),true);
  assert.equal(applicationCloseNeedsPaint(returnTerminal,returnTerminal,false,true),true);
  assert.equal(applicationCloseNeedsPaint(returnMiddle,returnMiddle,false,true),false);
  assert.equal(applicationCloseNeedsPaint(footerStart,footerStart,false,true),true);
  assert.equal(applicationCloseNeedsPaint(footerTerminal,footerTerminal,false,true),true);
  assert.equal(applicationCloseNeedsPaint(footerMiddle,footerMiddle,false,true),false);
  assert.equal(applicationCloseNeedsPaint(terminal,terminal,false,true),true);
  assert.equal(applicationCloseNeedsPaint(exitStart,exitStart,false,true),true);
  assert.equal(applicationCloseNeedsPaint(exitTerminal,exitTerminal,false,true),true);
  assert.equal(applicationCloseNeedsPaint(exitMiddle,exitMiddle,false,true),false);
  assert.equal(applicationCloseNeedsPaint(exitMiddle,exitMiddle,true,true),true);
  assert.equal(applicationCloseNeedsPaint(null,closing,true),true);
  assert.equal(applicationCloseNeedsPaint(closing,{...closing},true),true);
  assert.equal(applicationCloseNeedsPaint(closing,closing,true),false);
});

test('terminal upload bypasses both 30fps and 45fps gates between 60Hz updates',()=>{
  for(const fps of [30,45]){
    let lastRender=0,previous={phase:'closing',appQuitFrame:19,dialogExitFrame:null};
    const rendered=[];
    for(const [now,current] of [
      [1000/60,{phase:'terminal',appQuitFrame:20,dialogExitFrame:null}],
      [2000/60,{phase:'exiting',appQuitFrame:20,dialogExitFrame:0}],
      [3000/60,{phase:'exiting',appQuitFrame:20,dialogExitFrame:19}],
      [4000/60,{phase:'exit-terminal',appQuitFrame:20,dialogExitFrame:20}],
      [5000/60,{phase:'footer-exiting',appQuitFrame:20,dialogExitFrame:20,footerExitFrame:0}],
      [6000/60,{phase:'footer-exiting',appQuitFrame:20,dialogExitFrame:20,footerExitFrame:5}],
      [7000/60,{phase:'footer-terminal',appQuitFrame:20,dialogExitFrame:20,footerExitFrame:6}],
      [8000/60,{phase:'footer-returning',appQuitFrame:20,dialogExitFrame:20,footerExitFrame:6,footerReturnFrame:0}],
      [9000/60,{phase:'footer-returning',appQuitFrame:20,dialogExitFrame:20,footerExitFrame:6,footerReturnFrame:7}],
      [10000/60,{phase:'return-terminal',appQuitFrame:20,dialogExitFrame:20,footerExitFrame:6,footerReturnFrame:8}],
      [11000/60,null],
    ]){
      const forced=applicationCloseNeedsPaint(previous,current,false);
      if(forced||now-lastRender>=1000/fps){rendered.push(current?.phase??'retired');lastRender=now;}
      previous=current;
    }
    assert.deepEqual(rendered,['terminal','exiting','exit-terminal','footer-exiting','footer-terminal','footer-returning','return-terminal','retired']);
  }
});

test('boot paints reduced source poses and low-cadence endpoints without repainting idle poses',()=>{
  assert.equal(bootRevealNeedsPaint(null,null,true),false);
  assert.equal(bootRevealNeedsPaint(0,0,true),false);
  assert.equal(bootRevealNeedsPaint(10,0,true),true);
  assert.equal(bootRevealNeedsPaint(10,10,true),false);
  assert.equal(bootRevealNeedsPaint(19,18,false),false);
  assert.equal(bootRevealNeedsPaint(20,18,false),true);
  assert.equal(bootRevealNeedsPaint(20,20,false),false);
  assert.equal(bootRevealNeedsPaint(null,20,false),false);
});

test('a state-driven boot paint cannot acknowledge an unpresented terminal pose',()=>{
  let painted=19,presented=19;
  painted=20;
  assert.equal(bootRevealNeedsPaint(20,painted,false),false,'no duplicate LCD composition');
  assert.equal(bootRevealNeedsPaint(painted,presented,false),true,'force the closed 30fps render gate');
  presented=painted;
  assert.equal(bootRevealNeedsPaint(painted,presented,false),false,'only actual render acknowledges publication');
});
