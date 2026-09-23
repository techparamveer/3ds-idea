import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';
import {verifyNativeKeyboardComposition} from '../scripts/verify-native-keyboard-composition.mjs';
const urls={};
for(const name of ['native-layout','native-keyboard-text','native-keyboard-keys','native-keyboard-composition']){
 const source=readFileSync(new URL(`../src/os/${name}.ts`,import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"]\.\/([^'"]+)['"]/g,(_,dependency)=>`from '${urls[dependency]}'`);
 urls[name]='data:text/javascript;base64,'+Buffer.from(code).toString('base64');
}
const {nativeNicknameComposition:compose,drawNativeNicknameComposition:draw}=await import(urls['native-keyboard-composition']);
test('nickname painter connects both inline parents and preserves root order and per-instance overrides',()=>{
 const selection={RootPane:{visible:false}},cursor={};
 const composition={drawOrder:['BG','TextArea_02','KeytopModeSelect','LncArw_00','WaitIcon'],attachments:[
  {parent:'N_decor',layout:'DecorArea_select',instance:0,overrides:selection},
  {parent:'N_transDecor',layout:'DecorCursor',instance:0,overrides:cursor},
 ]};
 const calls=[],renderer={draw(ctx,alias,name,options){calls.push({alias,name,options});if(name==='TextArea_02'){options.attachments.N_decor(1);options.attachments.N_transDecor(1);}return true;}};
 assert.deepEqual(draw({},renderer,'case',composition),['BG','TextArea_02','N_decor/DecorArea_select[0]','N_transDecor/DecorCursor[0]','KeytopModeSelect','LncArw_00','WaitIcon']);
 assert.equal(calls.find(c=>c.name==='DecorArea_select').options.overrides,selection);
 assert.equal(calls.find(c=>c.name==='DecorCursor').options.overrides,cursor);
 assert.ok(calls.every(c=>c.alias==='case'));
});
test('invalid checkpoint and failed child submission fail explicitly',()=>{
 assert.throws(()=>compose({},'Ada','transition',{},{}),/checkpoint/);
 const composition={drawOrder:['TextArea_02'],attachments:[{parent:'N_transDecor',layout:'DecorCursor',instance:0,overrides:{}}]};
 const renderer={draw(ctx,alias,name,options){if(name==='TextArea_02'){options.attachments.N_transDecor(1);return true;}return false;}};
 assert.throws(()=>draw({},renderer,'case',composition),/DecorCursor/);
});
const options={artifactDir:process.env.NATIVE_KEYBOARD_COMPOSITION_ARTIFACT_DIR,referenceRoot:process.env.NATIVE_KEYBOARD_REFERENCE_ROOT,fontManifest:process.env.NATIVE_KEYBOARD_FONT_MANIFEST,canvasModule:process.env.NATIVE_CANVAS_MODULE};
test('complete real-resource capture and settled components match ordered native journals and preserve cache isolation',{skip:!Object.values(options).every(Boolean)},async()=>{
 const report=await verifyNativeKeyboardComposition({...options,artifactDir:join(options.artifactDir,'test')});
 assert.equal(report.passed,true);assert.equal(report.results.length,6);
 assert.ok(report.results.every(r=>r.cursorPixels>0&&r.drawCalls.length===21));
 assert.deepEqual(report.results.map(r=>r.footerEnabled),[false,false,true,true,true,true]);
 assert.ok(report.gaps.length>0,'Native LCD acceptance remains explicit');
});
