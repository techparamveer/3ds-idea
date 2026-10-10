import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { completeNotesFooterClose, completeNotificationsFooterClose, createPortfolioState, tickSystem, invokeSystemApplet, touchSystem } from '../src/os/system.ts';
const source=readFileSync(new URL('../src/scene/console-scene.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('console-scene.ts',source,ts.ScriptTarget.Latest,true);
const functions=new Map();
function visit(node){if(ts.isFunctionDeclaration(node)&&node.name)functions.set(node.name.text,node);ts.forEachChild(node,visit);}
visit(ast);
const render=ts.transpileModule(functions.get('renderFrame').getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const load=new Function('runtime',`
 const {document,angle,topScreen,touchScreen,renderer,screens,performance}=runtime;
 let state=runtime.state;
 const completeNotesFooterClose=runtime.completeNotesFooterClose,observeFolderBanner=runtime.observeFolderBanner??(()=>{}),effects=runtime.effects??{drain(){}},paint=runtime.paint??(()=>{});
 const completeNotificationsFooterClose=runtime.completeNotificationsFooterClose;
 const start=1000,scene={updateMatrixWorld(){}},camera={updateProjectionMatrix(){}},schedule={plan:()=>({shadows:false}),presented(){}};
 const poseSample=()=>({}),fitConsole=()=>{},publishProjectedTargets=()=>{},paintScreens=()=>{};
 const revokeTerminalPublications=()=>screens.revokeAppletEntryCandidate();
 let entryPublicationRepaintPending=false,frame=0,lastBootPresentedFrame,lastBootPaintFrame;
 let lastBootPresentedIdentity,lastBootPaintIdentity,lastLaunchPresentedIdentity,lastLaunchPaintIdentity,lastShutdownPresentedIdentity,lastShutdownPaintIdentity;
 const diagnostics=false;
 ${render}
 renderFrame.state=()=>state;return renderFrame;
`);

test('actual render acknowledges common cover after WebGL success, before Notes, with a fresh clock and strict visible/context guards',()=>{
 for(const patch of [{},{hidden:true},{powered:false},{sleeping:true},{angle:12},{upper:false},{lower:false},{lost:true},{renderFailure:true}]){
  const events=[],screens=new Proxy({},{get:(_target,name)=>name==='presentAppletEntry'?(_state,elapsed)=>events.push([name,elapsed]):()=>{events.push([name]);return null;}});
  const renderer={getContext:()=>({isContextLost:()=>!!patch.lost}),render(){events.push(['render']);if(patch.renderFailure)throw Error('GPU failed');}};
  const run=load({document:{hidden:!!patch.hidden},state:{powered:patch.powered??true,system:{sleeping:!!patch.sleeping}},angle:patch.angle??100,topScreen:{visible:patch.upper??true},touchScreen:{visible:patch.lower??true},renderer,screens,performance:{now:()=>1400}});
  if(patch.renderFailure)assert.throws(run,/GPU failed/);else run();
  if(Object.keys(patch).length===0){assert.ok(events.findIndex(e=>e[0]==='render')<events.findIndex(e=>e[0]==='presentAppletEntry'));assert.ok(events.findIndex(e=>e[0]==='presentAppletEntry')<events.findIndex(e=>e[0]==='presentNotesBootCover'));assert.deepEqual(events.find(e=>e[0]==='presentAppletEntry'),['presentAppletEntry',400]);}
  else{assert.equal(events.some(e=>e[0]==='presentAppletEntry'),false);assert.ok(events.some(e=>e[0]==='revokeAppletEntryCandidate'));}
 }
});

test('actual Notifications removal requires a visible awake paired render, including context/sleep/lid/dispose-candidate guards',()=>{
 for(const patch of [{},{hidden:true},{sleeping:true},{powered:false},{angle:12},{upper:false},{lower:false},{lost:true},{renderFailure:true}]){
  const events=[];
  let state=touchSystem(invokeSystemApplet(tickSystem(createPortfolioState(),3001),'notifications',3100),160,226,3200),owner=state.system.runtime.active;
  state={...state,powered:patch.powered??true,system:{...state.system,sleeping:!!patch.sleeping}};
  const screens=new Proxy({presentNotesFooterClose:()=>null,presentNotificationsFooterClose(){events.push('receipt');return owner;}},{get:(target,key)=>target[key]??(()=>null)});
  const run=load({document:{hidden:!!patch.hidden},state,angle:patch.angle??100,topScreen:{visible:patch.upper??true},touchScreen:{visible:patch.lower??true},screens,
   renderer:{getContext:()=>({isContextLost:()=>!!patch.lost}),render(){events.push('render');if(patch.renderFailure)throw Error('GPU failed');}},performance:{now:()=>5000},
   completeNotificationsFooterClose(current,id,now){events.push('complete');return completeNotificationsFooterClose(current,id,now);},
   effects:{drain(){events.push('cleanup');}},observeFolderBanner(){events.push('banner');},paint(){events.push('paint');}});
  if(patch.renderFailure)assert.throws(run,/GPU failed/);else run();
  if(Object.keys(patch).length===0){assert.deepEqual(events,['render','receipt','complete','banner','cleanup','paint']);assert.equal(run.state().system.runtime.instances[owner],undefined);assert.equal(run.state().system.phase,'home');}
  else{assert.equal(events.includes('receipt'),false);assert.ok(run.state().system.runtime.instances[owner]);}
 }
});

test('actual scene removes Notes only after a valid outgoing terminal receipt, then drains the existing cleanup and repaints HOME',()=>{
 for(const valid of [true,false]){
  const events=[];
  const state=touchSystem(invokeSystemApplet(tickSystem(createPortfolioState(),3001),'game-notes',3100),160,226,3200),owner=state.system.runtime.active;
  const screens=new Proxy({presentNotesFooterClose(){events.push('close-receipt');return owner;}},{get:(target,key)=>target[key]??(()=>null)});
  const run=load({document:{hidden:!valid},state,angle:100,topScreen:{visible:true},touchScreen:{visible:true},
   renderer:{getContext:()=>({isContextLost:()=>false}),render(){events.push('render');}},screens,performance:{now:()=>5000},
   completeNotesFooterClose(current,id,now){events.push('complete');return completeNotesFooterClose(current,id,now);},
   effects:{drain(){events.push('cleanup');}},observeFolderBanner(){events.push('banner');},paint(){events.push('paint');}});
  run();
  if(valid){assert.deepEqual(events,['render','close-receipt','complete','banner','cleanup','paint']);assert.equal(run.state().system.runtime.instances[owner],undefined);}
  else{assert.deepEqual(events,['render']);assert.ok(run.state().system.runtime.instances[owner]);}
 }
});

test('common entry joins only the existing guarded transition LCD cadence; diagnostics retain kind/frame/owner',()=>{
 const cadence=source.slice(source.indexOf('const entryActive='),source.indexOf('const bootFrame=',source.indexOf('const entryActive=')));
 assert.match(cadence,/const entryActive=state\.powered&&angle>12&&!homeClockSuspended&&!document\.hidden&&!state\.system!\.sleeping&&topScreen\.visible&&touchScreen\.visible&&!renderer\.getContext\(\)\.isContextLost\(\)\s*&&\([^;]*screens\.appletEntryActive\(state\)\)/);
 assert.match(cadence,/const lcdFps=screenPaintFps\(quality,closeAdvanced\|\|entryActive\)/);
 assert.match(source,/appletEntry:appletEntry\?\?null/);
 assert.match(functions.get('paintScreens').getText(ast),/manualEntryObservedElapsedMs:performance\.now\(\)-start/);
 assert.match(functions.get('paintScreens').getText(ast),/painted\?\.appletEntry/);
});
