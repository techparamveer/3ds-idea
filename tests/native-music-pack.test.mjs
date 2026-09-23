import test from 'node:test';
import assert from 'node:assert/strict';
import { loadNativeMusicPack } from '../src/os/native-music-pack.ts';
const names=['music.cseq','music-resume.cseq','tables.bin',...Array.from({length:5},(_,i)=>`wave-3-${i}.pcm`)];
function fixture(change=()=>{},fetchResource=()=>new Response(new Uint8Array([1,2,3,4]))){
 const manifest={schema:1,kind:'native-home-music',resources:Object.fromEntries(names.map(name=>[name,{bytes:4,sha256:'a'.repeat(64)}]))};change(manifest);
 const requests=[];
 const fetch=async(url,options)=>{requests.push({url:String(url),options});return String(url).endsWith('music.json')?Response.json(manifest):fetchResource(url,options);};
 return {manifest,requests,fetch};
}
test('fetch-only music loader obtains exactly allowlisted sibling files and original bytes',async()=>{
 const f=fixture(),pack=await loadNativeMusicPack('https://firmware.test/music/music.json',{fetch:f.fetch});
 assert.deepEqual(pack.manifest,f.manifest);assert.deepEqual(pack.files.map(x=>x.name),names);
 for(const file of pack.files)assert.deepEqual([...new Uint8Array(file.buffer)],[1,2,3,4]);
 assert.deepEqual(f.requests.map(x=>x.url),['https://firmware.test/music/music.json',...names.map(x=>'https://firmware.test/music/'+x)]);
 assert.ok(f.requests.every(x=>x.options.redirect==='error'));
});
test('manifest resource shape rejects additions, missing entries and unsafe sizes before media fetch',async()=>{
 for(const change of [m=>{m.resources['../secret.bin']=m.resources['music.cseq'];},m=>{delete m.resources['music.cseq'];},m=>{m.resources['music.cseq'].bytes=262145;},m=>{m.resources['music.cseq'].bytes=0;},m=>{m.resources['music.cseq'].sha256='wrong';}]){
  const f=fixture(change);await assert.rejects(loadNativeMusicPack('/music/music.json',{fetch:f.fetch}),/native music/);assert.equal(f.requests.length,1);
 }
});
test('streamed size checks reject lying headers, oversized and truncated payloads and cancel siblings',async()=>{
 for(const response of [()=>new Response(new Uint8Array(5)),()=>new Response(new Uint8Array(3)),()=>new Response(new Uint8Array(4),{headers:{'content-length':'100'}})]){
  const f=fixture(undefined,response);await assert.rejects(loadNativeMusicPack('/music/music.json',{fetch:f.fetch}),/size limit|Truncated/);
  assert.ok(f.requests.every(x=>x.options.signal.aborted));
 }
 let cancelled=false;
 await assert.rejects(loadNativeMusicPack('/music/music.json',{fetch:async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(131073));},cancel(){cancelled=true;}}))}),/size limit/);
 assert.equal(cancelled,true);
});
test('caller abort is honored before fetching and while resources are pending',async()=>{
 const before=new AbortController();before.abort();const f=fixture();
 await assert.rejects(loadNativeMusicPack('/music/music.json',{signal:before.signal,fetch:f.fetch}),{name:'AbortError'});assert.equal(f.requests.length,0);
 const active=new AbortController();let begun;const loading=new Promise(resolve=>{begun=resolve;});
 const g=fixture(undefined,async(url,{signal})=>new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(signal.reason),{once:true});begun();}));
 const result=loadNativeMusicPack('/music/music.json',{signal:active.signal,fetch:g.fetch});await loading;active.abort();
 await assert.rejects(result,{name:'AbortError'});
});
test('HTTP and malformed manifest failures do not produce a usable pack',async()=>{
 await assert.rejects(loadNativeMusicPack('/music/music.json',{fetch:async()=>new Response('',{status:503})}),/HTTP 503/);
 await assert.rejects(loadNativeMusicPack('/music/music.json',{fetch:async()=>new Response('{')}),SyntaxError);
});
