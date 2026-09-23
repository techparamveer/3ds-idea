/** Write synthetic FIR measurements only; no firmware or browser interaction. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { createContinuousMusicResampler, createWindowedSincKernel } from '../src/os/native-home-audio/continuous-resampler.ts';
const output=process.argv[2];if(!output?.startsWith('/Volumes/'))throw new Error('Explicit SSD output required');
await fs.mkdir(output,{recursive:false});
const nativeRate=32728, nativeFrames=32800, impulseAt=2048, rates=[8000,16000,32728,44100,48000,96000,192000];
const sourceFiles=['scripts/measure-native-audio-stream.mjs','src/os/native-home-audio/continuous-resampler.ts','src/os/native-home-audio/arithmetic.ts'];
const sources=Object.fromEntries(await Promise.all(sourceFiles.map(async name=>[name,createHash('sha256').update(await fs.readFile(new URL('../'+name,import.meta.url))).digest('hex')])));
const report={schema:1,node:process.version,sources,nativeRate,nativeFrames,impulseAt,rates:{}};
for(const rate of rates){
 const cases={impulse:{},dc:{level:8192},pass:{hz:1000},noise:{}};
 if(rate<nativeRate){cases.stop={hz:rate*.6};cases['stop-edge']={hz:rate*.505};cases['stop-high']={hz:Math.min(nativeRate*.49,rate*.9)};}
 const kernel=createWindowedSincKernel(rate), selected=[];
 for(let phase=0;phase<=kernel.phases;phase+=64)selected.push(Buffer.from(kernel.coefficients.buffer,phase*kernel.taps*8,kernel.taps*8));
 await fs.writeFile(path.join(output,`${rate}-kernel.f64`),Buffer.concat(selected));
 const results={};
 for(const [name,description]of Object.entries(cases)){
  const input=new Int16Array(nativeFrames*2);let seed=123456;
  for(let i=0;i<nativeFrames;i++){
   let sample=0;
   if(name==='impulse')sample=i===impulseAt?16384:0;
   else if(name==='dc')sample=8192;
   else if(name==='noise'){seed=(Math.imul(seed,1664525)+1013904223)>>>0;sample=(seed>>>17)-16384;}
   else sample=Math.round(Math.sin(2*Math.PI*description.hz*i/nativeRate)*16000);
   input[i*2]=sample;input[i*2+1]=-sample;
  }
  const resampler=createContinuousMusicResampler(rate),chunks=[];const start=performance.now();
  for(let i=0;i<nativeFrames;i+=160){
   resampler.push({startSample:i,pcm:input.subarray(i*2,(i+160)*2)});
   for(;;){const out=new Float32Array(2048),read=resampler.readInto(out);if(read.frames)chunks.push(Buffer.from(out.buffer,0,read.frames*8));if(read.frames<1024)break;}
  }
  const elapsed=performance.now()-start,pcm=Buffer.concat(chunks);
  await fs.writeFile(path.join(output,`${rate}-${name}.f32`),pcm);
  if(name==='noise')await fs.writeFile(path.join(output,'noise.pcm'),Buffer.from(input.buffer));
  results[name]={...description,samples:pcm.length/8,elapsedMs:elapsed,state:resampler.status()};
 }
 report.rates[rate]=results;
}
await fs.writeFile(path.join(output,'measurements.json'),JSON.stringify(report,null,2)+'\n');console.log(output);
