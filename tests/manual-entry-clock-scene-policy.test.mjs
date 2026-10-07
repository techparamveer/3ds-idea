import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/scene/console-scene.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('console-scene.ts',source,ts.ScriptTarget.Latest,true);
let paintScreens;
function visit(node){
 if(ts.isFunctionDeclaration(node)&&node.name?.text==='paintScreens')paintScreens=node;
 ts.forEachChild(node,visit);
}
visit(ast);assert.ok(paintScreens);
const {outputText}=ts.transpileModule(paintScreens.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}});
const load=new Function('runtime',`
 const {performance,screens,state,start,quality,recordScreenPaint,topTexture,bottomTexture,schedule}=runtime;
 let lastScreenPaint=0,lastBootPaintIdentity={},lastLaunchPaintIdentity={},lastShutdownPaintIdentity={};
 ${outputText}
 return {paintScreens,clock:()=>lastScreenPaint};
`);

test('actual scene cadence, state-driven and restore paints use a fresh Manual clock without changing their frame clock',()=>{
 const calls=[],records=[],state={},result={nativeSystem:true,manualEntry:{phase:'out',frame:20,owner:'manual:1'}},topTexture={},bottomTexture={};
 let observed=1134,invalidations=0;
 const scene=load({performance:{now:()=>observed},screens:{paint(...args){calls.push(args);return result;}},state,start:1000,quality:{screenFps:20},recordScreenPaint(...args){records.push(args);},topTexture,bottomTexture,schedule:{invalidate(){invalidations++;}}});
 for(const [raf,fresh,stateDriven]of [[1120,1134,false],[1160,1166,true],[1210,1214,false]]){
  observed=fresh;assert.equal(scene.paintScreens(raf,stateDriven),result);
  const [paintState,date,elapsed,options]=calls.at(-1);
  assert.equal(paintState,state);assert.ok(date instanceof Date);assert.equal(elapsed,raf-1000);
  assert.equal(options.manualEntryObservedElapsedMs,fresh-1000);
  assert.equal(options.reuseHomeBackgroundMs,stateDriven?50:undefined);
  assert.deepEqual(records.at(-1),[raf-1000,true,undefined,result.manualEntry]);
  assert.equal(scene.clock(),stateDriven?1120:raf);
 }
 assert.equal(topTexture.needsUpdate,true);assert.equal(bottomTexture.needsUpdate,true);assert.equal(invalidations,3);
});

test('diagnostic restoration and valid render receipts already use the fresh observation clock',()=>{
 assert.equal([...source.matchAll(/const restoredAt=performance\.now\(\)-start;[^\n]*const restored=screens\.paint\(state,new Date\(\),restoredAt\)/g)].length,2);
 const render=source.slice(source.indexOf('function renderFrame()'),source.indexOf('function animate('));
 assert.match(render,/if\(validPublication\)\{[^}]*screens\.presentManualEntry\(state,performance\.now\(\)-start\);\}/);
 assert.match(render,/paintScreens\(performance\.now\(\)\);entryPublicationRepaintPending=false;/);
});
