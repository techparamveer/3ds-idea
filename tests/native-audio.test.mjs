import test from 'node:test';
import assert from 'node:assert/strict';
import { createMenuAudio } from '../src/os/audio.ts';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
function fixture({cues={},loadMusic,prepareMusic,startMusic}={}){
 const sources=[],contexts=[],requests=[],transports=[],packs=[];
 class Context {
  state='running';currentTime=0;destination={};gains=[];
  constructor(){contexts.push(this);}
  createGain(){const gain={gain:{value:0,setValueAtTime(value){this.value=value;}},connect(to){this.destination=to;},disconnect(){this.disconnected=true;}};this.gains.push(gain);return gain;}
  createBufferSource(){const source={starts:[],stopped:false,connect(to){this.destination=to;},disconnect(){this.disconnected=true;},start(...args){this.starts.push(args);},stop(){this.stopped=true;}};sources.push(source);return source;}
  async decodeAudioData(){return {duration:10};}
  async resume(){this.state='running';}
  async close(){this.state='closed';}
 }
 const cue=name=>({name,url:`${name}.wav`,sampleRate:100,samples:1000,loopStart:null,loopEnd:null});
 // Legacy baked music entries are deliberately present: they must never load.
 const pack={schema:1,cues:{select:cue('select'),back:cue('back'),music:cue('music'),'music-resume':cue('music-resume'),...cues}};
 const audio=createMenuAudio('http://localhost/firmware/audio/audio.json',{
  AudioContext:Context,
  fetch:async url=>{requests.push(String(url));return String(url).endsWith('.json')?{ok:true,json:async()=>pack}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};},
  loadMusicPack:async(url,options)=>{packs.push({url,options});return loadMusic?loadMusic(url,options):{manifest:{},files:[]};},
  createMusicTransport:options=>{
   let state='idle',prepared=false,entry=null,epoch=0;
   const operations=[];
   const transport={options,operations,
    async prepare(raw,signal){operations.push(['prepare',raw]);state='preparing';if(prepareMusic)await prepareMusic(raw,signal);if(signal?.aborted)throw new DOMException('cancelled','AbortError');prepared=true;state='prepared';},
    async start(value){operations.push(['start',value]);state='starting';entry=value.entry;const token=++epoch;if(startMusic)await startMusic(value);if(token!==epoch)throw new DOMException('cancelled','AbortError');state='playing';return {epoch,entry,firstContextFrame:0,missedByFrames:0};},
    async stop(){operations.push(['stop']);epoch++;state=prepared?'prepared':'idle';},
    dispose(){operations.push(['dispose']);epoch++;state='disposed';},
    status(){return {state,epoch,entry,prepared};},
    fail(){state='failed';options.onDiagnostic({source:'transport',type:'error',epoch,error:'worker failure'});},
   };transports.push(transport);return transport;
  },
 });
 return {audio,sources,contexts,requests,transports,packs};
}
const home={home:true,powered:true,sleeping:false,muted:false,volume:.35,elapsedMs:0,homeUpdates:0};
const starts=f=>f.transports.flatMap(t=>t.operations.filter(x=>x[0]==='start').map(x=>x[1]));
test('gesture unlock starts persistent cold music on the effects context without fetching baked music or seeking',async()=>{
 const f=fixture();f.audio.update(home);await flush();assert.equal(f.contexts.length,0);assert.equal(f.packs.length,0);
 f.audio.update({...home,elapsedMs:19000,homeUpdates:1140});await f.audio.unlock();await flush();
 assert.deepEqual(starts(f),[{entry:'music'}]);assert.equal(f.packs.length,1);
 assert.equal(f.packs[0].url,'http://localhost/firmware/music/music.json');
 assert.equal(String(f.transports[0].options.workerUrl),'http://localhost/firmware/audio-stream/music-synthesis.worker.js');
 assert.equal(f.transports[0].options.context,f.contexts[0]);assert.equal(f.transports[0].options.destination,f.contexts[0].gains[1]);
 assert.equal(f.contexts[0].gains[1].destination,f.contexts[0].gains[0]);assert.ok(f.requests.every(url=>!url.includes('music')));
 assert.equal(f.audio.status().music,true);f.audio.dispose();assert.equal(f.contexts[0].state,'closed');assert.equal(f.transports[0].status().state,'disposed');
});
test('effects overlap music; mute and accepted sleep retain the music stream while suppressing output',async()=>{
 const f=fixture();f.audio.update(home);await f.audio.unlock();await flush();f.audio.play('select',false,.4);f.audio.play('back',false,.4);
 assert.equal(f.audio.status().active,2);assert.ok(f.sources.every(source=>!source.stopped));const epoch=f.transports[0].status().epoch;
 f.audio.update({...home,muted:true,homeUpdates:1});assert.equal(f.contexts[0].gains[0].gain.value,0);assert.equal(f.audio.status().music,true);
 f.audio.update({...home,sleeping:true,homeUpdates:2});assert.equal(f.audio.status().active,0);assert.ok(f.sources.every(source=>source.stopped));
 f.audio.play('select',false,.4);assert.equal(f.audio.status().active,0);
 f.audio.update({...home,homeUpdates:3});await flush();assert.equal(f.contexts[0].gains[0].gain.value,.35);assert.equal(f.transports[0].status().epoch,epoch);assert.equal(starts(f).length,1);f.audio.dispose();
});
test('ordinary home reentry uses fresh no-intro engine and counted fade; power cycle selects cold intro again',async()=>{
 const f=fixture();f.audio.update(home);await f.audio.unlock();await flush();
 f.audio.update({...home,home:false,homeUpdates:30});assert.equal(f.contexts[0].gains[1].gain.value,0);
 f.audio.update({...home,homeUpdates:30});await flush();assert.deepEqual(starts(f),[{entry:'music'},{entry:'music-resume'}]);assert.equal(f.packs.length,1);
 assert.equal(f.contexts[0].gains[1].gain.value,0);f.audio.update({...home,homeUpdates:120});assert.equal(f.contexts[0].gains[1].gain.value,.5);
 f.audio.update({...home,homeUpdates:210});assert.equal(f.contexts[0].gains[1].gain.value,1);
 f.audio.update({...home,powered:false});f.audio.update(home);await flush();assert.deepEqual(starts(f).at(-1),{entry:'music'});f.audio.dispose();
});
test('leaving HOME cancels preparation and late resources cannot resurrect the old request',async()=>{
 const pending=deferred();let calls=0;
 const f=fixture({loadMusic:()=>++calls===1?pending.promise:Promise.resolve({manifest:{},files:[]})});
 f.audio.update(home);await f.audio.unlock();await flush();assert.equal(f.packs.length,1);
 f.audio.update({...home,home:false});assert.equal(f.packs[0].options.signal.aborted,true);
 pending.resolve({manifest:{},files:[]});await flush();assert.equal(starts(f).length,0);
 f.audio.update({...home,homeUpdates:50});await flush();assert.deepEqual(starts(f),[{entry:'music-resume'}]);assert.equal(f.audio.status().failure,undefined);f.audio.dispose();
});
test('rapid home return supersedes an in-flight start without stale audible completion',async()=>{
 const pending=deferred();let calls=0;const f=fixture({startMusic:()=>++calls===1?pending.promise:Promise.resolve()});
 f.audio.update(home);await f.audio.unlock();await flush();f.audio.update({...home,home:false});f.audio.update({...home,homeUpdates:10});
 assert.equal(f.contexts[0].gains[1].gain.value,0);pending.resolve();await flush();
 assert.deepEqual(starts(f),[{entry:'music'},{entry:'music-resume'}]);assert.equal(f.audio.status().music,true);assert.equal(f.audio.status().failure,undefined);f.audio.dispose();
});
test('music failures silence only music, do not fall back, and retry only after another gesture',async()=>{
 const f=fixture();f.audio.update(home);await f.audio.unlock();await flush();f.transports[0].fail();
 for(let i=0;i<8;i++)f.audio.update({...home,homeUpdates:i});await flush();
 assert.equal(f.transports.length,1);assert.match(f.audio.status().musicFailure,/worker failure/);assert.equal(f.contexts[0].gains[1].gain.value,0);
 f.audio.play('select',false,.35);assert.equal(f.audio.status().active,1);assert.ok(f.requests.every(url=>!url.includes('music')));
 await f.audio.unlock();await flush();assert.equal(f.transports.length,2);assert.equal(f.audio.status().musicFailure,undefined);assert.equal(f.audio.status().music,true);f.audio.dispose();
});
test('disposal cancels delayed resource loading and never creates a late source',async()=>{
 const pending=deferred(),f=fixture({loadMusic:()=>pending.promise});f.audio.update(home);await f.audio.unlock();await flush();f.audio.dispose();
 pending.resolve({manifest:{},files:[]});await flush();assert.equal(starts(f).length,0);assert.equal(f.contexts[0].state,'closed');assert.equal(f.packs[0].options.signal.aborted,true);
 f.audio.dispose();await f.audio.unlock();assert.equal(f.contexts.length,1);
});
test('sleep before unlock defers first music start until wake without a different entry',async()=>{
 const f=fixture();f.audio.update({...home,sleeping:true});await f.audio.unlock();await flush();assert.equal(starts(f).length,0);
 f.audio.update(home);await flush();assert.deepEqual(starts(f),[{entry:'music'}]);f.audio.dispose();
});
test('malformed loops and escaped cue URLs fail before fetching cue media',async()=>{
 for(const change of [{url:'../secret.wav'},{loopStart:null,loopEnd:100},{loopStart:500,loopEnd:200}]){
  const f=fixture({cues:{select:{name:'select',url:'select.wav',sampleRate:100,samples:1000,loopStart:null,loopEnd:null,...change}}});await flush();assert.ok(f.audio.status().failure);assert.equal(f.requests.length,1);f.audio.dispose();
 }
});
