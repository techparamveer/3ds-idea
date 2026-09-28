import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/os/native-keyboard-edit.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {editNativeNicknameText:edit}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const golden=JSON.parse(readFileSync(new URL('./fixtures/native-keyboard-edit.json',import.meta.url),'utf8'));
const units=value=>Array.from({length:value.length},(_,i)=>value.charCodeAt(i));

test('all 256 original ARM name-buffer cases preserve text, cursor, selection, acceptance and invalidation order',()=>{
 assert.equal(golden.cases.length,256);
 for(const sample of golden.cases){
  const input=sample.input,state={value:String.fromCharCode(...input.units),cursor:input.cursor,anchor:input.anchor,selectionActive:input.selection};
  const before=structuredClone(state),result=edit(state,input.op==='insert'?{type:'insert',unit:input.unit}:{type:'backspace'});
  assert.deepEqual({accepted:result.accepted,units:units(result.state.value),cursor:result.state.cursor,anchor:result.state.anchor,selection:result.state.selectionActive},sample.result,JSON.stringify(input));
  assert.deepEqual(result.invalidations,sample.endpoints.map(p=>p.paragraphInvalidationFrom),JSON.stringify(input));
  assert.deepEqual(state,before);
 }
});

test('out-of-contract controls, oversized names and invalid cursor/selection indices fail explicitly',()=>{
 const state={value:'Ada',cursor:3,anchor:3,selectionActive:false};
 for(const patch of [{value:'ABCDEFGHIJK'},{value:'A\nB'},{cursor:-1},{cursor:4},{cursor:1.2},{anchor:NaN},{anchor:4}]) assert.throws(()=>edit({...state,...patch},{type:'backspace'}),/edit state/);
 for(const unit of [0,1,10,31,65536,-1,1.5,NaN])assert.throws(()=>edit(state,{type:'insert',unit}),/UTF-16 unit/);
});
