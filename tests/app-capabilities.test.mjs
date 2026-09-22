import test from 'node:test';
import assert from 'node:assert/strict';
import { createCapabilityAdapter } from '../src/os/app-capabilities.ts';
import { createAppRuntime, startApplication, dispatchRuntime, showRuntimeHome, resumeRuntimeApplication, isRuntimeEffectCurrent, deliverCapabilityResult } from '../src/os/app-host.ts';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const stream=()=>{const track={stops:0,stop(){this.stops++;}};return {track,getTracks:()=>[track]};};
const video=()=>({muted:false,playsInline:false,srcObject:null,videoWidth:640,videoHeight:480,play:async()=>{},pause(){this.paused=true;}});
const item=(id,capability,operation,requestId=`request-${id}`)=>({id,owner:'owner',effect:{type:'capability',capability,requestId,intent:'user',options:{operation}}});
function fixture(environment={},extras={}){
 const pending=new Set(),results=[],media=new Map();let serial=0;
 const adapter=createCapabilityAdapter({environment:{now:()=>123,id:()=>`media-${++serial}`,...environment},isCurrent:e=>pending.has(e.id),onResult:(owner,event)=>{pending.delete(event.requestToken);results.push({owner,...event});},storage:{async putMedia(input,blob){const data={...input,mime:blob.type,bytes:blob.size};media.set(input.id,{blob,data});return data;},async deleteMedia(id){media.delete(id);}},...extras});
 return {adapter,results,media,run(e,gesture=true){pending.add(e.id);return adapter.execute(e,{userGesture:gesture});},pending};
}
class Recorder {
 state='inactive';mimeType='audio/webm';ondataavailable=null;onstop=null;onerror=null;
 constructor(stream){this.stream=stream;}
 start(){this.state='recording';}
 stop(){if(this.state==='inactive')return;this.state='inactive';queueMicrotask(()=>this.onstop?.());}
 chunk(text){this.ondataavailable?.({data:new Blob([text],{type:this.mimeType})});}
}
test('construction and untrusted execution never open devices; unavailable services remain offline',async()=>{
 let prompts=0;const f=fixture({getUserMedia(){prompts++;throw new Error('must not run');}});
 assert.equal(prompts,0);await f.run(item(1,'camera','preview'),false);assert.equal(f.results[0].reason,'gesture-required');
 for(const capability of ['nintendo-network','local-wireless','nfc'])await f.run(item(f.results.length+1,capability),false);
 assert.ok(f.results.slice(1).every(e=>e.reason==='offline'));assert.equal(prompts,0);f.adapter.dispose();
});
test('denied camera and missing microphone report deterministic failures without resources',async()=>{
 const f=fixture({createVideo:video,getUserMedia:async()=>{throw new DOMException('No','NotAllowedError');}});
 await f.run(item(1,'camera','preview'));assert.equal(f.results[0].reason,'denied');assert.equal(f.adapter.getPreview('owner'),null);
 await f.run(item(2,'microphone','record'));assert.equal(f.results[1].reason,'unavailable');f.adapter.dispose();
});
test('camera preview, captured Blob metadata and repeated disposal stop every live track',async()=>{
 const source=stream(),v=video();const f=fixture({getUserMedia:async()=>source,createVideo:()=>v,createCanvas:()=>({getContext:()=>({drawImage(){}}),toBlob:callback=>callback(new Blob(['pixels'],{type:'image/png'}))})});
 await f.run(item(1,'camera','preview'));assert.equal(f.adapter.getPreview('owner'),v);assert.equal(v.srcObject,source);
 await f.run(item(2,'camera','capture'));const result=f.results[1];assert.equal(result.value.kind,'photo');assert.equal(result.value.bytes,6);assert.equal(await f.media.get(result.value.id).blob.text(),'pixels');
 f.adapter.release('owner');assert.ok(source.track.stops>0);assert.equal(v.srcObject,null);assert.equal(f.adapter.getPreview('owner'),null);f.adapter.dispose();f.adapter.dispose();
});
test('permission completion after suspend/resume stops its stream and cannot mutate the app',async()=>{
 let runtime=dispatchRuntime(startApplication(createAppRuntime(),'camera',0),{type:'action',id:'preview'},1);
 const request=runtime.effects.find(e=>e.effect.type==='capability'),permission=deferred(),source=stream();let callbacks=0;
 const adapter=createCapabilityAdapter({environment:{getUserMedia:()=>permission.promise,createVideo:video},isCurrent:item=>isRuntimeEffectCurrent(runtime,item),onResult:(owner,event)=>{callbacks++;runtime=deliverCapabilityResult(runtime,owner,event,5);}});
 const promise=adapter.execute(request,{userGesture:true});runtime=showRuntimeHome(runtime,2);adapter.release(request.owner);runtime=resumeRuntimeApplication(runtime,3);
 permission.resolve(source);await promise;assert.ok(source.track.stops>0);assert.equal(callbacks,0);assert.equal(runtime.shared.photos.length,0);adapter.dispose();
});
test('superseded camera requests cannot replace a newer preview',async()=>{
 const first=deferred(),old=stream(),fresh=stream();let calls=0;const f=fixture({getUserMedia:()=>++calls===1?first.promise:Promise.resolve(fresh),createVideo:video});
 const pending=f.run(item(1,'camera','preview','preview'));await f.run(item(2,'camera','preview','preview'));first.resolve(old);await pending;
 assert.ok(old.track.stops>0);assert.equal(f.adapter.getPreview('owner').srcObject,fresh);assert.equal(f.results.length,1);f.adapter.dispose();assert.ok(fresh.track.stops>0);
});
test('invalidated capture during storage write rolls back the orphaned blob',async()=>{
 const write=deferred(),deleted=[],source=stream();let writes=0;
 const f=fixture({getUserMedia:async()=>source,createVideo:video,createCanvas:()=>({getContext:()=>({drawImage(){}}),toBlob:callback=>callback(new Blob(['x'],{type:'image/png'}))})},{storage:{async putMedia(input){writes++;await write.promise;return {...input,mime:'image/png',bytes:1};},async deleteMedia(id){deleted.push(id);}}});
 await f.run(item(1,'camera','preview'));const capture=f.run(item(2,'camera','capture'));await new Promise(resolve=>setImmediate(resolve));assert.equal(writes,1);
 f.adapter.release('owner');write.resolve();await capture;assert.deepEqual(deleted,['media-1']);assert.equal(f.results.length,1);f.adapter.dispose();
});
test('microphone records local audio and releases tracks when stopping or suspending',async()=>{
 const source=stream();let recorder;const f=fixture({getUserMedia:async()=>source,createRecorder:stream=>recorder=new Recorder(stream)});
 await f.run(item(1,'microphone','record'));recorder.chunk('audio');await f.run(item(2,'microphone','stop'));assert.equal(f.results[1].value.kind,'audio');assert.equal(await f.media.get('media-1').blob.text(),'audio');assert.ok(source.track.stops>0);
 await f.run(item(3,'microphone','record'));recorder.chunk('private');f.adapter.release('owner');assert.equal(recorder.state,'inactive');assert.equal(f.media.size,1);f.adapter.dispose();
});
test('recording byte limit fails without storing partial audio',async()=>{
 let recorder;const source=stream(),f=fixture({getUserMedia:async()=>source,createRecorder:s=>recorder=new Recorder(s)},{maxRecordingBytes:3});
 await f.run(item(1,'microphone','record'));recorder.chunk('oversized');await f.run(item(2,'microphone','stop'));assert.equal(f.results[1].reason,'quota');assert.equal(f.media.size,0);assert.ok(source.track.stops>0);f.adapter.dispose();
});
test('late microphone permission is discarded and encoder startup failure stops tracks',async()=>{
 const permission=deferred(),source=stream(),f=fixture({getUserMedia:()=>permission.promise,createRecorder:s=>new Recorder(s)});
 const pending=f.run(item(1,'microphone','record'));f.adapter.dispose();permission.resolve(source);await pending;assert.equal(f.results.length,0);assert.ok(source.track.stops>0);
 const failing=stream(),g=fixture({getUserMedia:async()=>failing,createRecorder(){throw new Error('codec');}});await g.run(item(1,'microphone','record'));assert.ok(failing.track.stops>0);assert.equal(g.results[0].reason,'unavailable');g.adapter.dispose();
});
test('motion is opt-in, reports permission denial, and removes listeners on release',async()=>{
 let listens=0,removes=0,callback;const f=fixture({requestMotionPermission:async()=> 'granted',listenMotion:cb=>{listens++;callback=cb;return()=>removes++;}});
 await f.run(item(1,'motion'),false);assert.equal(listens,0);await f.run(item(2,'motion'));callback({x:1,y:2,z:3,interval:16});assert.deepEqual(f.adapter.getMotion('owner'),{x:1,y:2,z:3,interval:16});
 f.adapter.release('owner');callback({x:5,y:6,z:7,interval:16});assert.equal(f.adapter.getMotion('owner'),null);assert.equal(removes,1);f.adapter.dispose();
 const denied=fixture({requestMotionPermission:async()=> 'denied',listenMotion:()=>{throw new Error('must not listen');}});await denied.run(item(1,'motion'));assert.equal(denied.results[0].reason,'denied');denied.adapter.dispose();
});
test('file selection receives cancellation and imports only through local storage',async()=>{
 let aborted=false;const f=fixture({pickFile:(_kind,signal)=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('Cancelled','AbortError'));}))});
 const pending=f.run(item(1,'import-photo'));f.adapter.release('owner');await pending;assert.equal(aborted,true);assert.equal(f.results.length,0);f.adapter.dispose();
 const g=fixture({pickFile:async()=>new Blob(['audio'],{type:'audio/webm'})});await g.run(item(1,'import-audio'));assert.equal(g.results[0].value.kind,'audio');g.adapter.dispose();
});
