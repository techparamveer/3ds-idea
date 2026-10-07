import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/scene/console-scene.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('console-scene.ts',source,ts.ScriptTarget.Latest,true);
const functions=new Map();
function visit(node){if(ts.isFunctionDeclaration(node)&&node.name)functions.set(node.name.text,node);ts.forEachChild(node,visit);}
visit(ast);
const render=ts.transpileModule(functions.get('renderFrame').getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const load=new Function('runtime',`
 const {document,state,angle,topScreen,touchScreen,renderer,screens,performance}=runtime;
 const start=1000,scene={updateMatrixWorld(){}},camera={updateProjectionMatrix(){}},schedule={plan:()=>({shadows:false}),presented(){}};
 const poseSample=()=>({}),fitConsole=()=>{},publishProjectedTargets=()=>{},paintScreens=()=>{};
 const revokeTerminalPublications=()=>screens.revokeAppletEntryCandidate();
 let entryPublicationRepaintPending=false,frame=0,lastBootPresentedFrame,lastBootPaintFrame;
 let lastBootPresentedIdentity,lastBootPaintIdentity,lastLaunchPresentedIdentity,lastLaunchPaintIdentity,lastShutdownPresentedIdentity,lastShutdownPaintIdentity;
 const diagnostics=false;
 ${render}
 return renderFrame;
`);

test('actual render acknowledges common cover after WebGL success, before Notes, with a fresh clock and strict visible/context guards',()=>{
 for(const patch of [{},{hidden:true},{powered:false},{sleeping:true},{angle:12},{upper:false},{lower:false},{lost:true},{renderFailure:true}]){
  const events=[],screens=new Proxy({},{get:(_target,name)=>name==='presentAppletEntry'?(_state,elapsed)=>events.push([name,elapsed]):()=>events.push([name])});
  const renderer={getContext:()=>({isContextLost:()=>!!patch.lost}),render(){events.push(['render']);if(patch.renderFailure)throw Error('GPU failed');}};
  const run=load({document:{hidden:!!patch.hidden},state:{powered:patch.powered??true,system:{sleeping:!!patch.sleeping}},angle:patch.angle??100,topScreen:{visible:patch.upper??true},touchScreen:{visible:patch.lower??true},renderer,screens,performance:{now:()=>1400}});
  if(patch.renderFailure)assert.throws(run,/GPU failed/);else run();
  if(Object.keys(patch).length===0){assert.ok(events.findIndex(e=>e[0]==='render')<events.findIndex(e=>e[0]==='presentAppletEntry'));assert.ok(events.findIndex(e=>e[0]==='presentAppletEntry')<events.findIndex(e=>e[0]==='presentNotesBootCover'));assert.deepEqual(events.find(e=>e[0]==='presentAppletEntry'),['presentAppletEntry',400]);}
  else{assert.equal(events.some(e=>e[0]==='presentAppletEntry'),false);assert.ok(events.some(e=>e[0]==='revokeAppletEntryCandidate'));}
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
