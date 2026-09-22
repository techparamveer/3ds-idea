import test from 'node:test';
import assert from 'node:assert/strict';
import { createMenuAudio } from '../src/os/audio.ts';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(cues={}){
 const sources=[],contexts=[],requests=[];
 class Context {
  state='running';currentTime=0;destination={};
  constructor(){contexts.push(this);}
  createGain(){return {gain:{value:0,setValueAtTime(value){this.value=value;}},connect(){},disconnect(){}};}
  createBufferSource(){const source={starts:[],stopped:false,connect(){},disconnect(){this.disconnected=true;},start(...args){this.starts.push(args);},stop(){this.stopped=true;}};sources.push(source);return source;}
  async decodeAudioData(){return {duration:10};}
  async resume(){this.state='running';}
  async close(){this.state='closed';}
 }
 const cue=(name,loop=false)=>({name,url:`${name}.wav`,sampleRate:100,samples:1000,loopStart:loop?100:null,loopEnd:loop?900:null});
 const pack={schema:1,cues:{select:cue('select'),back:cue('back'),music:cue('music',true),...cues}};
 const audio=createMenuAudio('http://localhost/audio/audio.json',{AudioContext:Context,fetch:async url=>{requests.push(String(url));return String(url).endsWith('.json')?{ok:true,json:async()=>pack}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
 return {audio,sources,contexts,requests};
}
const home={home:true,powered:true,sleeping:false,muted:false,volume:.35,elapsedMs:0};
test('audio waits for a gesture, starts music at shared-clock offset and loops original boundaries',async()=>{
 const f=fixture();f.audio.update(home);await flush();assert.equal(f.contexts.length,0);assert.ok(f.requests.every(url=>!url.endsWith('music.wav')));
 f.audio.update({...home,elapsedMs:19000});await f.audio.unlock();await flush();
 const music=f.sources.find(source=>source.loop);assert.equal(music.loopStart,1);assert.equal(music.loopEnd,9);assert.deepEqual(music.starts,[[0,3]]);
 f.audio.dispose();assert.equal(music.stopped,true);assert.equal(f.contexts[0].state,'closed');
});
test('effects overlap without cutting music and sleep stops every source',async()=>{
 const f=fixture();f.audio.update(home);await f.audio.unlock();await flush();f.audio.play('select',false,.4);f.audio.play('back',false,.4);
 assert.equal(f.audio.status().active,3);assert.equal(f.sources.every(source=>!source.stopped),true);
 f.audio.update({...home,sleeping:true,elapsedMs:100});assert.equal(f.audio.status().active,0);assert.ok(f.sources.every(source=>source.stopped));
 f.audio.play('select',false,.4);assert.equal(f.audio.status().active,0);f.audio.dispose();
});
test('muting preserves silent state and reentering HOME resets the transport',async()=>{
 const f=fixture();f.audio.update(home);await f.audio.unlock();await flush();f.audio.update({...home,muted:true,elapsedMs:500});assert.equal(f.audio.status().music,false);
 f.audio.update({...home,home:false,elapsedMs:1000});f.audio.update({...home,elapsedMs:8000});await flush();assert.deepEqual(f.sources.at(-1).starts,[[0,0]]);f.audio.dispose();
});
test('malformed loops and escaped cue URLs fail before fetching media',async()=>{
 for(const change of [{url:'../secret.wav'},{loopStart:null,loopEnd:100},{loopStart:500,loopEnd:200}]){
  const f=fixture({select:{name:'select',url:'select.wav',sampleRate:100,samples:1000,loopStart:null,loopEnd:null,...change}});await flush();assert.ok(f.audio.status().failure);assert.equal(f.requests.length,1);f.audio.dispose();
 }
});
