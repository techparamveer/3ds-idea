import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeEffects } from '../src/os/runtime-effects.ts';
import { createPortfolioState, launch, tickSystem, dispatchSystemEvent, reduceSystem } from '../src/os/system.ts';

const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
function fixture(extra={}){
 let state=createPortfolioState(),now=4000;state=tickSystem(state,now);
 const failures=[],links=[],sounds=[];
 const adapter=createRuntimeEffects({getState:()=>state,setState:next=>{state=next;},now:()=>now,onChange(){},onFailure:e=>failures.push(e),onLink:url=>links.push(url),onSound:name=>sounds.push(name),...extra});
 return {adapter,failures,links,sounds,get state(){return state;},set state(next){state=next;},launch(id){state=tickSystem(launch(state,id,now),now+=1200);},action(id){state=dispatchSystemEvent(state,{type:'action',id},now+=10);}};
}
test('capability release bypasses a pending save and stops a granted stream',async()=>{
 const gate=deferred(),writes=[];let stopped=0,permissionCalls=0;
 const storage={async saveRecord(key){writes.push(key);await gate.promise;},async savePreferences(){},dispose(){}};
 const source={getTracks:()=>[{stop(){stopped++;}}]},video={play:async()=>{},pause(){},srcObject:null};
 const f=fixture({storage,environment:{getUserMedia:async()=>{permissionCalls++;return source;},createVideo:()=>video}});
 f.launch('camera');f.action('preview');f.adapter.drain(true);
 assert.equal(permissionCalls,1,'permission starts synchronously in originating gesture');
 await new Promise(resolve=>setImmediate(resolve));assert.equal(f.adapter.getPreview(f.state.system.runtime.active),video);
 f.state=reduceSystem(f.state,'home',6000);f.adapter.drain(false);assert.ok(stopped>0,'release must not wait for IndexedDB');
 gate.resolve();await f.adapter.settled();assert.ok(writes.length);f.adapter.dispose();
});
test('save writes preserve order, failures are explicit, and draining does not duplicate effects',async()=>{
 const writes=[];const f=fixture({storage:{async saveRecord(key){writes.push(key);if(key==='bad')throw new Error('quota');},async savePreferences(){},dispose(){}}});
 const record={version:1,data:{}};f.state={...f.state,system:{...f.state.system,runtime:{...f.state.system.runtime,effects:['one','bad','three'].map((key,id)=>({id,owner:'test',effect:{type:'storage',key,record}}))}}};
 f.adapter.drain(false);f.adapter.drain(false);await f.adapter.settled();
 assert.deepEqual(writes,['one','bad','three']);assert.equal(f.failures.length,1);assert.equal(f.state.system.runtime.effects.length,0);f.adapter.dispose();
});
test('late permission completion after HOME cannot overwrite later state',async()=>{
 const gate=deferred();let stopped=0;const f=fixture({environment:{getUserMedia:()=>gate.promise,createVideo:()=>({play:async()=>{},pause(){},srcObject:null})}});
 f.launch('camera');f.action('preview');f.adapter.drain(true);
 f.state=reduceSystem(f.state,'home',6500);f.adapter.drain(false);f.state=reduceSystem(f.state,'right',6600);const selected=f.state.selected;
 gate.resolve({getTracks:()=>[{stop(){stopped++;}}]});await new Promise(resolve=>setImmediate(resolve));
 assert.ok(stopped>0);assert.equal(f.state.selected,selected);assert.equal(f.state.system.phase,'home');f.adapter.dispose();
});
test('preference writes are deduplicated and storage closes after queued writes',async()=>{
 const gate=deferred(),writes=[];let closed=false;
 const f=fixture({storage:{async saveRecord(){},async savePreferences(value){writes.push(value);await gate.promise;},dispose(){closed=true;}}});
 f.adapter.drain(false);assert.equal(writes.length,0);
 f.state=reduceSystem(f.state,'mute',4000);f.adapter.drain(true);f.adapter.drain(false);await Promise.resolve();assert.equal(writes.length,1);
 f.adapter.dispose();assert.equal(closed,false);gate.resolve();await f.adapter.settled();await Promise.resolve();assert.equal(closed,true);
});
test('external links require a gesture and a safe protocol',()=>{
 const f=fixture();function link(url,id){f.state={...f.state,system:{...f.state.system,runtime:{...f.state.system.runtime,effects:[{id,owner:'test',effect:{type:'link',url}}]}}};}
 link('https://example.com',1);f.adapter.drain(false);link('javascript:alert(1)',2);f.adapter.drain(true);link('https://example.com',3);f.adapter.drain(true);
 assert.deepEqual(f.links,['https://example.com']);f.adapter.dispose();
});
