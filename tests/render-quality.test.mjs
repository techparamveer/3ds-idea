import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/scene/render-quality.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const systemTransitionsUrl=new URL('../src/os/system-transitions.ts',import.meta.url).href;
const resolved=js.replace(/(['"]\.\.\/os\/system-transitions['"])/g,`'${systemTransitionsUrl}'`);
const {applicationCloseNeedsPaint,bootRevealNeedsPaint,bootTerminalDeadlineReached,bootTerminalIdentity,bootTerminalPublicationPending,chooseRenderQuality,launchTerminalDeadlineReached,launchTerminalIdentity,launchTerminalPublicationPending,pixelRatioForViewport,sameBootTerminalIdentity,sameLaunchTerminalIdentity,sameShutdownTerminalIdentity,screenPaintFps,shutdownTerminalDeadlineReached,shutdownTerminalIdentity,shutdownTerminalPublicationPending}=await import(`data:text/javascript,${encodeURIComponent(resolved)}`);

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

test('boot terminal identity is selected at the source endpoint and scoped to its owner and context',()=>{
  const boot={phase:'boot',since:100};
  assert.equal(bootTerminalIdentity(boot,3083,false,4),null);
  assert.deepEqual(bootTerminalIdentity(boot,3084,false,4),{since:100,contextGeneration:4});
  assert.equal(bootTerminalDeadlineReached(boot,3099,false),false);
  assert.equal(bootTerminalDeadlineReached(boot,3100,false),true);
  assert.equal(bootTerminalIdentity(boot,394,true,4),null);
  assert.deepEqual(bootTerminalIdentity(boot,395,true,4),{since:100,contextGeneration:4});
  assert.equal(bootTerminalDeadlineReached(boot,399,true),false);
  assert.equal(bootTerminalDeadlineReached(boot,400,true),true);
  assert.equal(bootTerminalIdentity({...boot,phase:'home'},3100,false,4),null);

  const identity=bootTerminalIdentity(boot,3100,false,4);
  assert.equal(sameBootTerminalIdentity(identity,{...identity}),true);
  assert.equal(sameBootTerminalIdentity(identity,{...identity,since:101}),false);
  assert.equal(sameBootTerminalIdentity(identity,{...identity,contextGeneration:5}),false);
  assert.equal(sameBootTerminalIdentity(identity,null),false);
});

test('a stalled boot holds its deadline for one terminal publication callback',()=>{
  const boot={phase:'boot',since:100};
  const stalledNow=3800,contextGeneration=4;
  let presented=null;
  assert.equal(bootTerminalPublicationPending(boot,stalledNow,false,contextGeneration,presented),true,
    'the overdue callback must keep boot selected and force its paired terminal paint');
  presented=bootTerminalIdentity(boot,stalledNow,false,contextGeneration);
  assert.equal(bootTerminalPublicationPending(boot,stalledNow,false,contextGeneration,presented),false,
    'the following callback may hand off even at the same timestamp');
  assert.equal(bootTerminalPublicationPending({...boot,since:101},stalledNow,false,contextGeneration,presented),true,
    'a stale boot owner cannot release a new boot');
  assert.equal(bootTerminalPublicationPending(boot,stalledNow,false,contextGeneration+1,presented),true,
    'a restored context must republish the endpoint');
});

test('an overdue reduced boot also requires a fresh receipt after visibility or sleep revocation',()=>{
  const boot={phase:'boot',since:100};
  const now=400,contextGeneration=4;
  const receipt=bootTerminalIdentity(boot,now,true,contextGeneration);
  assert.equal(bootTerminalPublicationPending(boot,now,true,contextGeneration,receipt),false);
  assert.equal(bootTerminalPublicationPending(boot,now,true,contextGeneration,null),true,
    'resume at the same reduced deadline cannot reuse a hidden or sleeping render');
});

test('launch terminal identity selects C14 and scopes it to the active app owner and context',()=>{
  const launch={phase:'launch',since:100,app:'health-safety',runtime:{application:'health-safety:1',active:'health-safety:1'}};
  assert.equal(launchTerminalIdentity(launch,3016,false,4),null);
  assert.deepEqual(launchTerminalIdentity(launch,3017,false,4),{
    since:100,app:'health-safety',owner:'health-safety:1',contextGeneration:4,
  });
  assert.equal(launchTerminalDeadlineReached(launch,3283,false),false);
  assert.equal(launchTerminalDeadlineReached(launch,3284,false),true);
  assert.deepEqual(launchTerminalIdentity(launch,100,true,4),{
    since:100,app:'health-safety',owner:'health-safety:1',contextGeneration:4,
  });
  assert.equal(launchTerminalDeadlineReached(launch,219,true),false);
  assert.equal(launchTerminalDeadlineReached(launch,220,true),true);
  assert.equal(launchTerminalIdentity({...launch,phase:'app'},3284,false,4),null);
  assert.equal(launchTerminalIdentity({...launch,app:null},3284,false,4),null);
  assert.equal(launchTerminalIdentity({...launch,runtime:{application:null,active:'health-safety:1'}},3284,false,4),null);
  assert.equal(launchTerminalIdentity({...launch,runtime:{application:'health-safety:1',active:null}},3284,false,4),null);
  assert.equal(launchTerminalIdentity({...launch,runtime:{application:'health-safety:1',active:'health-safety:2'}},3284,false,4),null,
    'an applet or stale active-only retarget cannot reuse the application receipt');

  const identity=launchTerminalIdentity(launch,3283,false,4);
  assert.equal(sameLaunchTerminalIdentity(identity,{...identity}),true);
  assert.equal(sameLaunchTerminalIdentity(identity,{...identity,since:101}),false);
  assert.equal(sameLaunchTerminalIdentity(identity,{...identity,app:'camera'}),false);
  assert.equal(sameLaunchTerminalIdentity(identity,{...identity,owner:'health-safety:2'}),false);
  assert.equal(sameLaunchTerminalIdentity(identity,{...identity,contextGeneration:5}),false);
  assert.equal(sameLaunchTerminalIdentity(identity,null),false);
});

test('a stalled launch holds its deadline for one successful terminal publication callback',()=>{
  const launch={phase:'launch',since:100,app:'health-safety',runtime:{application:'health-safety:1',active:'health-safety:1'}};
  const stalledNow=3384,contextGeneration=4;
  let presented=null;
  assert.equal(launchTerminalPublicationPending(launch,stalledNow,false,contextGeneration,presented),true,
    'the overdue callback must keep launch selected and force its paired C14 paint');
  presented=launchTerminalIdentity(launch,stalledNow,false,contextGeneration);
  assert.equal(launchTerminalPublicationPending(launch,stalledNow,false,contextGeneration,presented),false,
    'the following callback may hand off to the app');
  assert.equal(launchTerminalPublicationPending({...launch,since:101},stalledNow,false,contextGeneration,presented),true);
  assert.equal(launchTerminalPublicationPending({...launch,app:'camera'},stalledNow,false,contextGeneration,presented),true);
  assert.equal(launchTerminalPublicationPending({...launch,runtime:{application:'health-safety:2',active:'health-safety:2'}},stalledNow,false,contextGeneration,presented),true);
  assert.equal(launchTerminalPublicationPending({...launch,runtime:{application:'health-safety:1',active:'health-safety:2'}},stalledNow,false,contextGeneration,presented),true,
    'a stale active-only retarget must not inherit the prior terminal receipt');
  assert.equal(launchTerminalPublicationPending(launch,stalledNow,false,contextGeneration+1,presented),true,
    'a restored context must republish C14');
});

test('reduced launch and resumed hidden, sleeping or lid-closed launch require the current receipt',()=>{
  const launch={phase:'launch',since:100,app:'health-safety',runtime:{application:'health-safety:1',active:'health-safety:1'}};
  const now=220,contextGeneration=4;
  const receipt=launchTerminalIdentity(launch,now,true,contextGeneration);
  assert.equal(launchTerminalPublicationPending(launch,now,true,contextGeneration,receipt),false);
  for(const boundary of ['hidden','sleeping','lid-closed']){
    assert.equal(launchTerminalPublicationPending(launch,now,true,contextGeneration,null),true,
      `${boundary} publication revocation must hold reduced launch at its deadline`);
  }
  assert.equal(launchTerminalPublicationPending({...launch,runtime:{application:null,active:null}},now,true,contextGeneration,null),true,
    'a launch without a current application owner cannot retire');
});

test('shutdown terminal identity is selected at the source endpoint and scoped to its owner and context',()=>{
  const home={phase:'shutdown',since:100,returnPhase:'home'};
  assert.equal(shutdownTerminalIdentity(home,1266,false,4),null);
  assert.deepEqual(shutdownTerminalIdentity(home,1267,false,4),{since:100,returnPhase:'home',contextGeneration:4});
  assert.equal(shutdownTerminalDeadlineReached(home,1299,false),false);
  assert.equal(shutdownTerminalDeadlineReached(home,1300,false),true);
  assert.deepEqual(shutdownTerminalIdentity(home,100,true,4),{since:100,returnPhase:'home',contextGeneration:4});
  assert.equal(shutdownTerminalDeadlineReached(home,219,true),false);
  assert.equal(shutdownTerminalDeadlineReached(home,220,true),true);
  assert.equal(shutdownTerminalIdentity({...home,phase:'off'},1300,false,4),null);

  const identity=shutdownTerminalIdentity(home,1300,false,4);
  assert.equal(sameShutdownTerminalIdentity(identity,{...identity}),true);
  assert.equal(sameShutdownTerminalIdentity(identity,{...identity,since:101}),false);
  assert.equal(sameShutdownTerminalIdentity(identity,{...identity,returnPhase:'app'}),false);
  assert.equal(sameShutdownTerminalIdentity(identity,{...identity,contextGeneration:5}),false);
  assert.equal(sameShutdownTerminalIdentity(identity,null),false);
});

test('a deadline-frame forced shutdown publication remains selected until the next animation frame',()=>{
  const system={phase:'shutdown',since:100,returnPhase:'home'};
  const now=1300,contextGeneration=4;
  let presented=null;
  assert.equal(shutdownTerminalPublicationPending(system,now,false,contextGeneration,presented),true,
    'the first deadline callback must hold shutdown and force publication');
  presented=shutdownTerminalIdentity(system,now,false,contextGeneration);
  assert.equal(shutdownTerminalPublicationPending(system,now,false,contextGeneration,presented),false,
    'the following callback may advance even when its timestamp is unchanged');
  assert.equal(shutdownTerminalPublicationPending(system,now,false,contextGeneration+1,presented),true,
    'a restored context must republish');
  assert.equal(shutdownTerminalPublicationPending({...system,since:99},now,false,contextGeneration,presented),true,
    'a stale transition owner cannot release a new shutdown');
  assert.equal(shutdownTerminalPublicationPending({...system,returnPhase:'app'},now,false,contextGeneration,presented),true,
    'a stale return owner cannot release a new shutdown');
});

test('an overdue shutdown requires fresh publication after visibility or sleep revokes its receipt',()=>{
  const system={phase:'shutdown',since:100,returnPhase:'home'};
  const now=1300,contextGeneration=4;
  const receipt=shutdownTerminalIdentity(system,now,false,contextGeneration);
  assert.equal(shutdownTerminalPublicationPending(system,now,false,contextGeneration,receipt),false);

  const hiddenReceipt=null;
  assert.equal(shutdownTerminalPublicationPending(system,now,false,contextGeneration,hiddenReceipt),true,
    'resume at the same overdue timestamp cannot reuse the pre-hide render');
  const sleepingReceipt=null;
  assert.equal(shutdownTerminalPublicationPending(system,now,false,contextGeneration,sleepingReceipt),true,
    'wake at the same overdue timestamp cannot reuse the pre-sleep render');
});
