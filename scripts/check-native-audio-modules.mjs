/** Real emitted ESM in a worker isolate; emulated standard worklet globals, not a browser smoke. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { Worker, MessageChannel } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { decodeNativeHomeMusicResources, createNativeHomeMusic } from '../src/os/native-home-audio/index.ts';
import { createContinuousMusicResampler } from '../src/os/native-home-audio/continuous-resampler.ts';
import { musicBufferConfig, stamp } from '../src/os/native-home-audio/transport-protocol.ts';
const [modules,pack,reportPath]=process.argv.slice(2);
if(!modules||!pack||!reportPath?.startsWith('/Volumes/'))throw new Error('Usage: MODULE_DIR PRIVATE_PACK SSD_REPORT.json');
const modulesManifest=JSON.parse(await fs.readFile(path.join(modules,'modules.json'),'utf8'));
for(const [name,r]of Object.entries(modulesManifest.files)){const bytes=await fs.readFile(path.join(modules,name));assert.equal(bytes.length,r.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);}
const manifest=JSON.parse(await fs.readFile(path.join(pack,'music.json'),'utf8'));
const files=new Map(await Promise.all(Object.keys(manifest.resources).map(async name=>[name,new Uint8Array(await fs.readFile(path.join(pack,name)))])));
const resources=await decodeNativeHomeMusicResources(manifest,files);
const wrapper=reportPath+'.worker.mjs';
await fs.writeFile(wrapper,`import {parentPort,workerData} from 'node:worker_threads';\nglobalThis.postMessage=m=>parentPort.postMessage(m);\nglobalThis.close=()=>parentPort.close();\nparentPort.on('message',data=>globalThis.onmessage?.({data}));\nawait import(workerData.entry);\nparentPort.postMessage({type:'harness-ready'});\n`);
const worker=new Worker(wrapper,{workerData:{entry:pathToFileURL(path.join(modules,modulesManifest.entries.worker)).href}});
const control=new MessageChannel(),stream=new MessageChannel(),events=[];let processorConstructor;
const waiters=[];
function receive(source,data){const event={source,data};events.push(event);for(const waiter of [...waiters])if(waiter.predicate(event)){clearTimeout(waiter.timer);waiters.splice(waiters.indexOf(waiter),1);waiter.resolve(data);}}
function next(source,type,epoch){return new Promise((resolve,reject)=>{const waiter={predicate:e=>e.source===source&&e.data.type===type&&(epoch===undefined||e.data.epoch===epoch),resolve,timer:setTimeout(()=>{waiters.splice(waiters.indexOf(waiter),1);reject(new Error(`Timeout ${source}:${type}:${epoch}; latest ${JSON.stringify(events.slice(-5))}`));},5000)};waiters.push(waiter);});}
worker.on('message',data=>receive('worker',data));worker.on('error',error=>{for(const w of waiters.splice(0)){clearTimeout(w.timer);w.resolve(Promise.reject(error));}});
control.port1.onmessage=e=>receive('worklet',e.data);
globalThis.sampleRate=48000;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.port=control.port2;}};
globalThis.registerProcessor=(name,ctor)=>{assert.equal(name,modulesManifest.processor);processorConstructor=ctor;};
const report={schema:1,node:process.version,mode:'worker_threads isolate + emulated AudioWorklet globals; no browser claim',modulesManifestSha256:createHash('sha256').update(await fs.readFile(path.join(modules,'modules.json'))).digest('hex')};
try{
 const ready=events.some(e=>e.data.type==='harness-ready')?Promise.resolve():next('worker','harness-ready');await ready;
 await import(pathToFileURL(path.join(modules,modulesManifest.entries.worklet)).href);assert.ok(processorConstructor);const processor=new processorConstructor();
 const attachedW=next('worker','attached',0),attachedO=next('worklet','attached',0);
 worker.postMessage({...stamp(0),type:'attach',port:stream.port1},[stream.port1]);control.port1.postMessage({...stamp(0),type:'attach',port:stream.port2},[stream.port2]);await Promise.all([attachedW,attachedO]);
 const raw=[...files].map(([name,bytes])=>({name,buffer:bytes.slice().buffer}));const prepared=next('worker','prepared',0);
 worker.postMessage({...stamp(0),type:'prepare',manifest,files:raw},raw.map(x=>x.buffer));await prepared;
 let contextFrame=0;
 async function status(epoch){const pending=next('worklet','status',epoch);control.port1.postMessage({...stamp(epoch),type:'status'});return pending;}
 async function begin(epoch,entry){const begun=next('worklet','begun',epoch);control.port1.postMessage({...stamp(epoch),type:'begin',config:musicBufferConfig(48000)});await begun;const started=next('worker','producer-started',epoch);worker.postMessage({...stamp(epoch),type:'start',entry,outputRate:48000});await started;}
 async function filled(epoch){for(let i=0;i<500;i++){const s=await status(epoch);if(s.bufferedFrames>=musicBufferConfig(48000).lowWaterFrames)return s;if(s.state==='failed')throw new Error(s.failure);await new Promise(resolve=>setTimeout(resolve,2));}throw new Error('Producer never filled ring');}
 function reference(entry){const e=createNativeHomeMusic(resources,entry),r=createContinuousMusicResampler(48000);return frames=>{const pcm=new Float32Array(frames*2);let at=0;while(at<frames){at+=r.readInto(pcm,at).frames;if(at<frames)r.push(e.renderFrame());}return pcm;};}
 let expected=reference('music'),checked=0;
 async function process(epoch,frames=256){const before=await status(epoch),left=new Float32Array(frames),right=new Float32Array(frames);globalThis.currentFrame=contextFrame;assert.equal(processor.process([],[[left,right]],{}),true);contextFrame+=frames;const after=await status(epoch),count=after.outputConsumed-before.outputConsumed,ref=expected(count);for(let i=0;i<count;i++){assert.equal(left[i],ref[i*2]);assert.equal(right[i],ref[i*2+1]);}assert.ok(left.subarray(count).every(x=>x===0));assert.ok(right.subarray(count).every(x=>x===0));checked+=count;return after;}
 await begin(1,'music');await filled(1);
 for(let i=0;i<128;i++){let s=await status(1);if(s.bufferedFrames<256)await filled(1);await process(1,i%3===0?128:256);}
 const workerPaused=next('worker','paused',1),outputPaused=next('worklet','paused',1);worker.postMessage({...stamp(1),type:'pause'});control.port1.postMessage({...stamp(1),type:'pause'});await workerPaused;
 await new Promise(resolve=>setImmediate(resolve));const consumed=(await status(1)).outputConsumed;await process(1);const pauseAck=await outputPaused;assert.equal(pauseAck.outputConsumed,consumed);
 const workerResumed=next('worker','resumed',1),outputResumed=next('worklet','resumed',1);worker.postMessage({...stamp(1),type:'resume'});control.port1.postMessage({...stamp(1),type:'resume'});await workerResumed;await process(1);await outputResumed;
 // Stop only production to force a genuine active underrun in the consumer.
 const pausedAgain=next('worker','paused',1);worker.postMessage({...stamp(1),type:'pause'});await pausedAgain;
 let s;do{s=await process(1,256);}while(s.state!=='starved');await process(1,384);const gap=(await status(1)).underrunFrames;assert.ok(gap>=384);
 const resumeProduction=next('worker','resumed',1);worker.postMessage({...stamp(1),type:'resume'});await resumeProduction;await filled(1);s=await process(1,256);assert.equal(s.state,'running');assert.equal(s.underrunEvents,1);
 const stopW=next('worker','stopped',2),stopO=next('worklet','stopped',2);worker.postMessage({...stamp(2),type:'stop'});control.port1.postMessage({...stamp(2),type:'stop'});await Promise.all([stopW,stopO]);
 expected=reference('music-resume');await begin(3,'music-resume');await filled(3);for(let i=0;i<8;i++)await process(3,256);
 const disposeW=next('worker','disposed',4),disposeO=next('worklet','disposed',4);worker.postMessage({...stamp(4),type:'dispose'});control.port1.postMessage({...stamp(4),type:'dispose'});await Promise.all([disposeW,disposeO]);
 globalThis.currentFrame=contextFrame;assert.equal(processor.process([],[[new Float32Array(128),new Float32Array(128)]],{}),false);
 assert.equal(events.filter(e=>e.data.type==='error').length,0);
 Object.assign(report,{checkedOutputFrames:checked,orderedPcmExact:true,pauseResumeExact:true,forcedUnderrunFrames:gap,forcedUnderrunEvents:1,rebufferWithoutLoss:true,stopRestartEntryExact:true,disposed:true});
 await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await worker.terminate();control.port1.close();control.port2.close();for(const w of waiters){clearTimeout(w.timer);}for(const name of ['sampleRate','currentFrame','AudioWorkletProcessor','registerProcessor'])delete globalThis[name];}
