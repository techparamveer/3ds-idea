import test from 'node:test';
import assert from 'node:assert/strict';
import { createContinuousMusicResampler, RationalMusicClock } from '../src/os/native-home-audio/continuous-resampler.ts';
import { PcmStereoRing } from '../src/os/native-home-audio/pcm-ring.ts';
import { MusicOutputController } from '../src/os/native-home-audio/output-controller.ts';
import { MusicSynthesisController } from '../src/os/native-home-audio/synthesis-controller.ts';
import { musicBufferConfig, stamp } from '../src/os/native-home-audio/transport-protocol.ts';

function resample(rate, sizes) {
 const resampler=createContinuousMusicResampler(rate), samples=[],input=new Int16Array(160*2);let group=0;
 for(let frame=0;frame<24;frame++){
  for(let i=0;i<160;i++){input[i*2]=Math.round(Math.sin((frame*160+i)*.237)*20000);input[i*2+1]=((frame*160+i)*37)%20001-10000;}
  resampler.push({startSample:frame*160,pcm:input});
  for(;;){const out=new Float32Array(sizes[group++%sizes.length]*2);const read=resampler.readInto(out);samples.push(...out.subarray(0,read.frames*2));if(read.frames<out.length/2)break;}
 }
 return {pcm:Float32Array.from(samples),state:resampler.status()};
}
test('FIR output is byte-identical for arbitrary pull groupings at up/down/native rates',()=>{
 for(const rate of [8000,16000,32728,44100,48000,96000]){
  const a=resample(rate,[1024]),b=resample(rate,[1,17,128,3,257]);assert.deepEqual(a,b);
  assert.equal(a.pcm.length/2,Math.ceil(24*160*rate/32728));
 }
});
test('rational phase advances ten hours exactly, independent of advance grouping',()=>{
 for(const rate of [8000,44100,48000,96000,192000]){
  const a=new RationalMusicClock(rate),b=new RationalMusicClock(rate),frames=rate*36000+123;
  a.advance(frames);for(const n of [1,1234567,frames-1234568])b.advance(n);
  assert.deepEqual(a,b);assert.equal(a.nativePosition,Number(BigInt(frames)*32728n/BigInt(rate)));
  assert.equal(a.phaseNumerator,Number(BigInt(frames)*32728n%BigInt(rate)));
 }
});
test('resampler rejects discontinuity and input overflow; unavailable pulls do not pad or advance',()=>{
 const r=createContinuousMusicResampler(48000),before=r.status();assert.equal(r.readInto(new Float32Array(2048)).frames,0);assert.deepEqual(r.status(),before);
 assert.throws(()=>r.push({startSample:160,pcm:new Int16Array(320)}));
 for(let i=0;i<6;i++)r.push({startSample:i*160,pcm:new Int16Array(320)});
 assert.throws(()=>r.push({startSample:960,pcm:new Int16Array(320)}),/capacity/);
});
test('ring wrap preserves order and rejects overwrite, nonfinite, duplicate, gaps and stale epochs',()=>{
 const ring=new PcmStereoRing(8);ring.reset(1);ring.enqueue(1,0,Float32Array.from([1,-1,2,-2,3,-3,4,-4,5,-5,6,-6]));
 const left=new Float32Array(4),right=new Float32Array(4);assert.equal(ring.readInto(left,right),4);assert.deepEqual([...left],[1,2,3,4]);
 ring.enqueue(1,6,Float32Array.from([7,-7,8,-8,9,-9,10,-10]));
 for(const [epoch,start,pcm]of [[0,10,new Float32Array(2)],[1,9,new Float32Array(2)],[1,11,new Float32Array(2)],[1,10,new Float32Array(8)],[1,10,Float32Array.from([NaN,0])]])assert.throws(()=>ring.enqueue(epoch,start,pcm));
 const all=new Float32Array(8),rr=new Float32Array(8);assert.equal(ring.readInto(all,rr),6);assert.deepEqual([...all],[5,6,7,8,9,10,0,0]);
});
function outputFixture(rate=8000){
 const events=[],sent=[];const port={onmessage:null,postMessage:m=>sent.push(m),close(){this.closed=true;}};
 const output=new MusicOutputController(rate,m=>events.push(m));output.control({...stamp(0),type:'attach',port});
 output.control({...stamp(1),type:'begin',config:musicBufferConfig(rate)});
 const send=m=>port.onmessage({data:{...stamp(1),...m}});
 send({type:'producer-ready'});
 let written=0;
 function fill(){const credit=sent.filter(x=>x.type==='credit').at(-1).creditEnd;while(written+1024<=credit){const pcm=new Float32Array(2048);for(let i=0;i<1024;i++){pcm[i*2]=written+i+1;pcm[i*2+1]=-(written+i+1);}send({type:'pcm',startOutputFrame:written,frames:1024,buffer:pcm.buffer});written+=1024;}}
 return {output,events,sent,port,send,fill};
}
test('begin/readiness/credits bound accepted plus in-flight frames',()=>{
 const f=outputFixture();assert.equal(f.events.at(-1).type,'begun');assert.equal(f.sent[0].creditEnd,musicBufferConfig(8000).targetFrames);
 const l=new Float32Array(128),r=new Float32Array(128);f.output.process(l,r,0);assert.equal(f.output.status().underrunFrames,0);assert.ok(l.every(x=>x===0));
 f.fill();f.output.process(l,r,128);assert.equal(l[0],1);assert.equal(f.events.find(x=>x.type==='started').firstContextFrame,128);
 for(let frame=256;frame<4096;frame+=128){f.output.process(l,r,frame);f.fill();const s=f.output.status();assert.ok(s.creditEnd-s.outputConsumed<=musicBufferConfig(8000).capacityFrames);}
 assert.equal(f.output.status().underrunFrames,0);
});
test('underrun zeros only missing frames, rebuffer preserves order and counters, arbitrary quantum',()=>{
 const f=outputFixture(),initial=musicBufferConfig(8000).targetFrames;f.fill();
 f.output.process(new Float32Array(initial-512),new Float32Array(initial-512),0);
 const l=new Float32Array(768),r=new Float32Array(768);f.output.process(l,r,initial-512);
 assert.equal(l[511],initial);assert.equal(l[512],0);assert.equal(f.output.status().underrunFrames,256);assert.equal(f.output.status().underrunEvents,1);
 f.output.process(l,r,initial+256);assert.equal(f.output.status().underrunFrames,1024);assert.equal(f.output.status().outputConsumed,initial);
 f.fill();f.output.process(l,r,initial+1024);assert.equal(l[0],initial+1);assert.equal(f.output.status().underrunEvents,1);
});
test('pause boundary freezes consumption; stop rejects late blocks; dispose closes and terminates output',()=>{
 const f=outputFixture();f.fill();const l=new Float32Array(256),r=new Float32Array(256);f.output.process(l,r,0);
 f.output.control({...stamp(1),type:'pause'});const before=f.output.status().outputConsumed;f.output.process(l,r,256);
 assert.equal(f.output.status().outputConsumed,before);assert.equal(f.events.at(-1).type,'paused');assert.equal(f.events.at(-1).contextFrame,256);
 f.output.control({...stamp(1),type:'resume'});f.output.process(l,r,512);assert.equal(l[0],257);
 f.output.control({...stamp(2),type:'stop'});f.send({type:'pcm',startOutputFrame:2048,frames:1024,buffer:new ArrayBuffer(8192)});
 f.output.process(l,r,768);assert.ok(l.every(x=>x===0));assert.equal(f.output.status().staleMessages,1);
 f.output.control({...stamp(3),type:'dispose'});assert.equal(f.port.closed,true);assert.equal(f.output.process(l,r,1024),false);
});
test('same-epoch bad block is a visible failure and never overwrites unread PCM',()=>{
 const f=outputFixture();f.fill();const before=f.output.status();f.send({type:'pcm',startOutputFrame:0,frames:1024,buffer:new ArrayBuffer(8192)});
 assert.equal(f.output.status().state,'failed');assert.equal(f.output.status().outputAccepted,before.outputAccepted);assert.equal(f.events.at(-1).type,'error');
});
test('unsupported output reports one failure and remains alive until disposal',()=>{
 const f=outputFixture();assert.equal(f.output.unavailableOutput(),true);assert.equal(f.output.unavailableOutput(),true);
 assert.equal(f.output.status().state,'failed');assert.equal(f.events.filter(x=>x.type==='error').length,1);
 assert.equal(f.events.at(-1).source,'worklet');assert.equal(f.events.at(-1).epoch,1);
 f.output.control({...stamp(2),type:'dispose'});assert.equal(f.output.unavailableOutput(),false);
});
test('scheduled start respects an intra-quantum frame and reports a missed deadline',()=>{
 for(const [when,contextFrame,first,missed]of [[170,128,170,0],[170,256,256,86]]){
  const f=outputFixture();f.output.control({...stamp(2),type:'begin',config:musicBufferConfig(8000),whenContextFrame:when});
  f.port.onmessage({data:{...stamp(2),type:'producer-ready'}});
  for(let at=0;at<musicBufferConfig(8000).lowWaterFrames;at+=1024)f.port.onmessage({data:{...stamp(2),type:'pcm',startOutputFrame:at,frames:1024,buffer:new Float32Array(2048).fill(.25).buffer}});
  const left=new Float32Array(128),right=new Float32Array(128);f.output.process(left,right,contextFrame);
  const offset=first-contextFrame;assert.ok(left.subarray(0,offset).every(x=>x===0));assert.ok(left.subarray(offset).every(x=>x===.25));
  const start=f.events.find(x=>x.type==='started');assert.equal(start.firstContextFrame,first);assert.equal(start.missedByFrames,missed);
  assert.equal(f.output.status().outputConsumed,128-offset);assert.equal(f.output.status().underrunFrames,0);
 }
});
test('pause before producer readiness resumes priming credits without deadlock or underrun',()=>{
 const sent=[],events=[],port={onmessage:null,postMessage:m=>sent.push(m),close(){}};
 const output=new MusicOutputController(8000,m=>events.push(m));output.control({...stamp(0),type:'attach',port});
 output.control({...stamp(1),type:'begin',config:musicBufferConfig(8000)});output.control({...stamp(1),type:'pause'});
 port.onmessage({data:{...stamp(1),type:'producer-ready'}});assert.equal(sent.length,0);
 const left=new Float32Array(256),right=new Float32Array(256);output.process(left,right,0);assert.equal(events.at(-1).type,'paused');
 output.control({...stamp(1),type:'resume'});assert.equal(sent.at(-1).type,'credit');assert.equal(sent.at(-1).creditEnd,musicBufferConfig(8000).targetFrames);
 output.process(left,right,256);assert.equal(events.at(-1).type,'resumed');assert.equal(output.status().state,'priming');assert.equal(output.status().underrunFrames,0);
 for(let at=0;at<musicBufferConfig(8000).lowWaterFrames;at+=1024)port.onmessage({data:{...stamp(1),type:'pcm',startOutputFrame:at,frames:1024,buffer:new Float32Array(2048).fill(.5).buffer}});
 output.process(left,right,512);assert.equal(left[0],.5);assert.equal(output.status().state,'running');assert.equal(output.status().underrunEvents,0);
});
test('pause/resume below low-water preserves running mode until an actual underrun',()=>{
 const f=outputFixture(),initial=musicBufferConfig(8000).targetFrames;f.fill();f.output.process(new Float32Array(initial-512),new Float32Array(initial-512),0);
 assert.equal(f.output.status().bufferedFrames,512);f.output.control({...stamp(1),type:'pause'});
 const left=new Float32Array(256),right=new Float32Array(256);f.output.process(left,right,1536);assert.equal(f.events.at(-1).type,'paused');
 f.output.control({...stamp(1),type:'resume'});f.output.process(left,right,1792);assert.equal(left[0],initial-511);assert.equal(f.output.status().underrunFrames,0);assert.equal(f.output.status().state,'running');
 f.output.process(new Float32Array(384),new Float32Array(384),2048);assert.equal(f.output.status().underrunFrames,128);assert.equal(f.output.status().underrunEvents,1);
 f.output.control({...stamp(1),type:'pause'});f.output.process(left,right,2432);f.output.control({...stamp(1),type:'resume'});f.output.process(left,right,2688);
 assert.equal(f.output.status().state,'starved');assert.equal(f.output.status().underrunEvents,1);assert.equal(f.output.status().underrunFrames,384);
});
test('stale asynchronous decode completion/rejection cannot resurrect or fail a stopped/new epoch',async()=>{
 for(const rejectOld of [false,true]){
  let resolve,reject;const old=new Promise((yes,no)=>{resolve=yes;reject=no;});const events=[];
  const worker=new MusicSynthesisController(m=>events.push(m),{schedule:()=>0,cancel(){}},()=>old);
  const pending=worker.control({...stamp(0),type:'prepare',manifest:{},files:[]});
  await worker.control({...stamp(1),type:'stop'});if(rejectOld)reject(new Error('old failure'));else resolve({kind:'native-home-music',schema:1});await pending;
  assert.equal(worker.status().state,'idle');assert.equal(events.some(x=>x.type==='prepared'||x.type==='error'),false);
  await worker.control({...stamp(2),type:'dispose'});assert.equal(worker.status().state,'disposed');
 }
});

test('48 kHz refill reserve covers the observed 184 ms producer processing and scheduling stall',()=>{
 const f=outputFixture(48000),config=musicBufferConfig(48000),left=new Float32Array(128),right=new Float32Array(128);f.fill();
 let at=0;
 while(f.output.status().outputConsumed<config.targetFrames-config.lowWaterFrames){f.output.process(left,right,at);at+=128;}
 assert.equal(f.output.status().bufferedFrames,config.lowWaterFrames);
 const consumed=f.output.status().outputConsumed;
 for(let elapsed=0;elapsed<Math.ceil(.184*48000);elapsed+=128){f.output.process(left,right,at);at+=128;}
 assert.equal(f.output.status().underrunFrames,0);assert.ok(f.output.status().outputConsumed>consumed);
 f.fill();f.output.process(left,right,at);assert.equal(f.output.status().underrunEvents,0);
 assert.ok(f.output.status().creditEnd-f.output.status().outputConsumed<=config.capacityFrames);
});
