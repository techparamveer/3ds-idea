import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectNotesMetadata,loadNotesTitleMetadata} from '../src/os/notes-title-metadata.ts';
import {createNotesMetadataSession} from '../src/os/notes-metadata-session.ts';
import {createPortfolioState,tickSystem,launch,invokeSystemApplet,reduceSystem,setSystemSleeping} from '../src/os/system.ts';
const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
const health='0004001000022300',url='https://example.invalid/os/manifest.json';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const frame=()=>({width:1,height:1,data:new Uint8ClampedArray(4)});
function start(){let s=tickSystem(launch(tickSystem(createPortfolioState(),4000),'health-safety',4100),6500);return invokeSystemApplet(s,'game-notes',6600);}
const capture=(s,generation=1)=>({status:'ready',owner:s.system.runtime.application,generation,upper:frame(),lower:frame()});
const metadata=(titleId=health)=>({selection:{titleId},icon:frame(),disposals:0,dispose(){this.disposals++;}});
function fixture(){const calls=[],changes=[];const session=createNotesMetadataSession({onChange:s=>changes.push(s),load(...args){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});calls.push({args,resolve,reject});return promise;}});return {session,calls,changes};}

test('published eight SMDH entries validate; seven are usable and source placeholder never substitutes HOME label',()=>{
 const titles=Object.keys(manifest.titles).filter(id=>manifest.titles[id].notesIcon);
 assert.equal(titles.length,8);
 for(const id of titles){
  const selected=selectNotesMetadata(manifest,id);
  if(id==='0004001000022a00'){assert.deepEqual(selected,{status:'unavailable',reason:'unusable-description'});continue;}
  assert.equal(selected.description,manifest.titles[id].longDescription);assert.equal(selected.source.sha256,manifest.titles[id].longDescriptionSource.sha256);
  assert.equal(selected.iconUrl,manifest.titles[id].notesIcon);assert.ok(Object.isFrozen(selected));assert.ok(Object.isFrozen(selected.source));
 }
 assert.equal(selectNotesMetadata(manifest,'0004001000022f00').reason,'unsupported-title');
 const absent=structuredClone(manifest);delete absent.titles[health].longDescription;
 assert.equal(selectNotesMetadata(absent,health).reason,'missing-metadata');
});

test('mismatched SMDH/content provenance, conversion, locale and URL selection fail explicitly',()=>{
 for(const mutate of [
  m=>m.titles[health].longDescriptionSource.sha256='0'.repeat(64),
  m=>m.resources[m.titles[health].notesIcon].sources[0].contentIndex=3,
  m=>m.titles[health].longDescriptionConversion.fieldOffset=0x208,
  m=>m.titles[health].notesIconConversion.width=48,
  m=>m.titles[health].notesIcon='../other.png',
  m=>m.locale='US_English',
 ]){const bad=structuredClone(manifest);mutate(bad);assert.throws(()=>selectNotesMetadata(bad,health),/Notes/);}
});

test('loader acquires real PNG with verified hash/dimensions and releases icon without changing source',async t=>{
 const hits=[];t.mock.method(globalThis,'fetch',async (request)=>{
  const href=String(request);hits.push(href);
  return href===url?Response.json(manifest):new Response(readFileSync(new URL(href.split('/os/')[1],root)));
 });
 for(const id of Object.keys(manifest.titles).filter(id=>manifest.titles[id].notesIcon)){
  const result=await loadNotesTitleMetadata(url,id,new AbortController().signal);
  if(id==='0004001000022a00'){assert.equal(result.status,'unavailable');continue;}
  assert.equal(result.status,'ready');assert.deepEqual([result.metadata.icon.width,result.metadata.icon.height,result.metadata.icon.data.length],[64,64,16384]);
  result.metadata.dispose();result.metadata.dispose();assert.equal(result.metadata.icon.data.length,0);
 }
 assert.equal(hits.length,15,'eight manifests; only seven usable icons');
});

test('loader rejects changed icon bytes and aborted acquisition; unsupported title has no fetch',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async request=>{calls++;if(String(request)===url)return Response.json(manifest);const bytes=Buffer.from(readFileSync(new URL(manifest.titles[health].notesIcon,root)));bytes[bytes.length-1]^=1;return new Response(bytes);});
 await assert.rejects(loadNotesTitleMetadata(url,health,new AbortController().signal),/hash differs/);
 assert.equal((await loadNotesTitleMetadata(url,'portfolio',new AbortController().signal)).status,'unavailable');assert.equal(calls,2);
 const aborted=new AbortController();aborted.abort();await assert.rejects(loadNotesTitleMetadata(url,health,aborted.signal),{name:'AbortError'});assert.equal(calls,2);
});

test('Notes+application+capture identity publishes atomically, coalesces, and survives sleep and note navigation',async()=>{
 const f=fixture();let s=start();const pair=capture(s);f.session.sync(s.system.runtime,pair);f.session.sync(s.system.runtime,{...pair});await flush();
 assert.equal(f.calls.length,1);const m=metadata();f.calls[0].resolve({status:'ready',metadata:m});await flush();
 const ready=f.session.getState();assert.equal(ready.status,'ready');assert.equal(ready.notesOwner,s.system.runtime.active);assert.equal(ready.applicationOwner,pair.owner);assert.equal(ready.captureGeneration,1);assert.equal(ready.capture.upper,pair.upper);
 s=reduceSystem(s,'open',6700);f.session.sync(s.system.runtime,pair);s=setSystemSleeping(s,true,6800);f.session.sync(s.system.runtime,pair);s=setSystemSleeping(s,false,6900);f.session.sync(s.system.runtime,pair);
 assert.equal(f.session.getState(),ready);assert.equal(m.disposals,0);f.session.dispose();assert.equal(m.disposals,1);assert.equal(pair.upper.data.length,4,'borrowed capture is not disposed');
});

test('HOME completion and same-title reopening abort stale Notes result and publish only new owner',async()=>{
 const f=fixture();let s=start(),pair=capture(s);const old=s.system.runtime.active;f.session.sync(s.system.runtime,pair);await flush();
 s=reduceSystem(reduceSystem(s,'home',6700),'home',6800);f.session.sync(s.system.runtime,pair);
 assert.equal(f.session.getState().status,'idle');assert.equal(f.calls[0].args[2].aborted,true);
 s=invokeSystemApplet(s,'game-notes',6900);assert.notEqual(s.system.runtime.active,old);f.session.sync(s.system.runtime,pair);await flush();
 const fresh=metadata(),late=metadata();f.calls[1].resolve({status:'ready',metadata:fresh});await flush();f.calls[0].resolve({status:'ready',metadata:late});await flush();
 assert.equal(late.disposals,1);assert.equal(fresh.disposals,0);assert.equal(f.session.getState().notesOwner,s.system.runtime.active);assert.equal(f.changes.filter(s=>s.status==='ready').length,1);f.session.dispose();
});

test('capture generation or application owner changes invalidate pending and ready metadata',async()=>{
 const f=fixture();let s=start();const pair=capture(s);f.session.sync(s.system.runtime,pair);await flush();
 f.session.sync(s.system.runtime,capture(s,2));assert.equal(f.calls[0].args[2].aborted,true);await flush();
 const stale=metadata();f.calls[0].resolve({status:'ready',metadata:stale});f.calls[1].resolve({status:'ready',metadata:metadata()});await flush();assert.equal(stale.disposals,1);assert.equal(f.session.getState().captureGeneration,2);
 const ready=f.session.getState().metadata,previous=s.system.runtime.application;
 s=reduceSystem(s,'power',7000);f.session.sync(s.system.runtime,{status:'none'});assert.equal(ready.disposals,1);assert.equal(f.session.getState().status,'idle');
 s=reduceSystem(s,'back',7100);s=tickSystem(launch(s,'health-safety',7200),9400);
 assert.notEqual(s.system.runtime.application,previous);s=invokeSystemApplet(s,'game-notes',9500);
 f.session.sync(s.system.runtime,capture(s));await flush();assert.equal(f.session.getState().applicationOwner,s.system.runtime.application);f.session.dispose();
});

test('unavailable capture/portfolio source never acquires; failures do not retry every frame; disposal rejects late errors',async()=>{
 const f=fixture();let s=start();f.session.sync(s.system.runtime,{status:'missing',owner:s.system.runtime.application});assert.equal(f.session.getState().reason,'missing-capture');await flush();assert.equal(f.calls.length,0);
 const runtime=s.system.runtime,app=runtime.application;
 const portfolio={...runtime,instances:{...runtime.instances,[app]:{...runtime.instances[app],appId:'projects'}}};
 f.session.sync(portfolio,capture(s));assert.equal(f.session.getState().reason,'unsupported-title');await flush();assert.equal(f.calls.length,0);
 f.session.sync(runtime,capture(s));await flush();f.calls[0].reject(Error('bad resource'));await flush();assert.equal(f.session.getState().status,'error');f.session.sync(runtime,capture(s));await flush();assert.equal(f.calls.length,1);
 f.session.sync(runtime,capture(s,2));await flush();f.session.dispose();f.calls[1].reject(Error('late'));await flush();assert.equal(f.session.getState().status,'idle');
});

test('portfolio title uses its own artwork in the source Notes panel and retains owner lifetime',async()=>{
 const calls=[];const session=createNotesMetadataSession({loadPortfolio:async(id,signal)=>{
  calls.push({id,signal});return {selection:{titleId:`portfolio:${id}`,description:'Work'},icon:{width:64,height:64,data:new Uint8ClampedArray(64*64*4)},disposals:0,dispose(){this.disposals++;}};
 }});
 let s=tickSystem(launch(tickSystem(createPortfolioState(),4000),'work',4100),6500);
 s=invokeSystemApplet(s,'game-notes',6600);
 const pair=capture(s);session.sync(s.system.runtime,pair);await flush();
 const ready=session.getState();assert.equal(ready.status,'ready');assert.equal(ready.titleId,'portfolio:work');assert.equal(ready.metadata.selection.description,'Work');assert.equal(calls.length,1);
 session.sync(s.system.runtime,pair);assert.equal(calls.length,1);
 s=reduceSystem(reduceSystem(s,'home',6700),'home',6800);session.sync(s.system.runtime,pair);
 assert.equal(ready.metadata.disposals,1);assert.equal(session.getState().status,'idle');session.dispose();
});

test('synchronous onChange disposal prevents starting a resource request',async()=>{
 let count=0;const session=createNotesMetadataSession({load(){count++;throw Error('unexpected');},onChange(){session.dispose();}});const s=start();session.sync(s.system.runtime,capture(s));await flush();assert.equal(count,0);assert.equal(session.getState().status,'idle');
});


test('result during sleep stays with the same Notes context; replacement and disposal reject late successes',async()=>{
 const f=fixture();let s=start();const pair=capture(s);f.session.sync(s.system.runtime,pair);await flush();
 s=setSystemSleeping(s,true,6700);f.session.sync(s.system.runtime,pair);const ready=metadata();f.calls[0].resolve({status:'ready',metadata:ready});await flush();
 assert.equal(f.session.getState().metadata,ready);s=setSystemSleeping(s,false,6800);f.session.sync(s.system.runtime,pair);assert.equal(f.calls.length,1);
 s=invokeSystemApplet(s,'friends',6900);f.session.sync(s.system.runtime,pair);assert.equal(ready.disposals,1);assert.equal(f.session.getState().status,'idle');
 s=invokeSystemApplet(s,'game-notes',7000);f.session.sync(s.system.runtime,pair);await flush();f.session.dispose();const late=metadata();f.calls[1].resolve({status:'ready',metadata:late});await flush();assert.equal(late.disposals,1);assert.equal(f.session.getState().status,'idle');
});

test('wrong-title result and changed capture eligibility cannot publish a mismatched pair',async()=>{
 const f=fixture(),s=start();f.session.sync(s.system.runtime,capture(s));await flush();const wrong=metadata('0004001000022000');f.calls[0].resolve({status:'ready',metadata:wrong});await flush();assert.equal(wrong.disposals,1);assert.equal(f.session.getState().status,'error');
 f.session.sync(s.system.runtime,capture(s,2));await flush();f.session.sync(s.system.runtime,{...capture(s,2),owner:'another-application'});assert.equal(f.calls[1].args[2].aborted,true);const late=metadata();f.calls[1].resolve({status:'ready',metadata:late});await flush();assert.equal(late.disposals,1);assert.equal(f.session.getState().reason,'missing-capture');
});
