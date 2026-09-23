import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { openFirmwareStorage } from '../src/os/app-persistence.ts';
import { createRuntimeEffects } from '../src/os/runtime-effects.ts';
import { createPortfolioState, launch, tickSystem, dispatchSystemEvent, reduceSystem } from '../src/os/system.ts';

const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
function fixture(extra={}){
 let state=createPortfolioState(),now=4000;state=tickSystem(state,now);
 const failures=[],links=[],sounds=[];
 const adapter=createRuntimeEffects({getState:()=>state,setState:next=>{state=next;},now:()=>now,onChange(){},onFailure:e=>failures.push(e),onLink:url=>links.push(url),onSound:name=>sounds.push(name),...extra});
 return {adapter,failures,links,sounds,get state(){return state;},set state(next){state=next;},launch(id){state=tickSystem(launch(state,id,now),now+=1200);},confirmSwitch(){state=tickSystem(reduceSystem(state,'open',now),now+=1200);},action(id){state=dispatchSystemEvent(state,{type:'action',id},now+=10);}};
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

test('effect acknowledgements read the state after the host mutation boundary',()=>{
 let calls=0;
 const f=fixture({beforeMutation(now){assert.equal(now,4000);calls++;f.state={...f.state,system:{...f.state.system,homeClock:{...f.state.system.homeClock,updateCount:17}}};}});
 f.state={...f.state,system:{...f.state.system,runtime:{...f.state.system.runtime,effects:[{id:1,owner:'test',effect:{type:'sound',name:'select'}}]}}};
 f.adapter.drain(false);
 assert.equal(calls,1);assert.equal(f.state.system.homeClock.updateCount,17);
 assert.equal(f.state.system.runtime.effects.length,0);assert.deepEqual(f.sounds,['select']);f.adapter.dispose();
});
test('asynchronous capability results preserve state flushed at their arrival boundary',async()=>{
 const gate=deferred();let calls=0,changedLabel;
 const f=fixture({beforeMutation(){calls++;f.state={...f.state,nameDraft:`boundary:${calls}`};},onChange(){changedLabel=f.state.nameDraft;},environment:{getUserMedia:()=>gate.promise,createVideo:()=>({play:async()=>{},pause(){},srcObject:null})}});
 f.launch('camera');f.action('preview');f.adapter.drain(true);const before=calls;
 gate.resolve({getTracks:()=>[{stop(){}}]});await new Promise(resolve=>setImmediate(resolve));
 assert.ok(calls>before);assert.equal(changedLabel,`boundary:${calls}`);assert.equal(f.state.nameDraft,changedLabel);f.adapter.dispose();
});

test('Camera and Sound deletion removes local files as well as gallery entries through the effect queue',async()=>{
 const storage=await openFirmwareStorage({indexedDB:new IDBFactory(),databaseName:'media-effects'});
 const photo=await storage.putMedia({id:'photo-one',name:'Photo',kind:'photo',createdAt:1},new Blob(['pixels'],{type:'image/png'}));
 const audio=await storage.putMedia({id:'audio-one',name:'Sound',kind:'audio',createdAt:2},new Blob(['samples'],{type:'audio/webm'}));
 const keep=await storage.putMedia({id:'photo-two',name:'Keep',kind:'photo',createdAt:3},new Blob(['keep'],{type:'image/png'}));
 const f=fixture({storage}),runtime=f.state.system.runtime;
 f.state={...f.state,system:{...f.state.system,runtime:{...runtime,shared:{...runtime.shared,photos:[photo,keep],sounds:[audio]}}}};
 f.launch('camera');f.action('gallery');f.action(photo.id);f.action('delete');
 const deletion=f.state.system.runtime.effects.find(item=>item.effect.removedMedia);
 assert.deepEqual(deletion.effect.removedMedia,[photo.id]);assert.equal(deletion.effect.key,'@shared');
 f.adapter.drain(true);f.adapter.drain(false);await f.adapter.settled();
 assert.equal(await storage.getMedia(photo.id),null);assert.ok(await storage.getMedia(audio.id));
 assert.deepEqual((await storage.load()).shared.photos,[keep]);
 f.launch('sound');f.confirmSwitch();f.action('library');f.action(audio.id);f.action('delete');
 f.state=reduceSystem(f.state,'home',9000);f.adapter.drain(false);await f.adapter.settled();
 assert.equal(await storage.getMedia(audio.id),null);assert.deepEqual((await storage.load()).shared.sounds,[]);
 assert.equal(await (await storage.getMedia(keep.id)).blob.text(),'keep');assert.deepEqual(f.failures,[]);f.adapter.dispose();
});

test('media deletion waits for preceding writes and failure is reported without duplicating the operation',async()=>{
 const gate=deferred(),writes=[];
 const f=fixture({storage:{async saveRecord(key){writes.push(key);await gate.promise;},async saveSharedAndDeleteMedia(record,ids){writes.push(ids);throw new Error('delete transaction failed');},async savePreferences(){},dispose(){}}});
 const record={version:1,data:{photos:[],sounds:[]}};
 f.state={...f.state,system:{...f.state.system,runtime:{...f.state.system.runtime,effects:[
  {id:1,owner:'old',effect:{type:'storage',key:'camera',record}},
  {id:2,owner:'old',effect:{type:'storage',key:'@shared',record,removedMedia:['photo']}}
 ]}}};
 f.adapter.drain(false);f.adapter.drain(false);await Promise.resolve();assert.deepEqual(writes,['camera']);
 gate.resolve();await f.adapter.settled();assert.deepEqual(writes,['camera',['photo']]);assert.equal(f.failures.length,1);f.adapter.dispose();
});
