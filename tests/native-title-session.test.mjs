import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Resource loading itself is covered with real PNG/layout/font data in
// native-title-assets.test.mjs. Here acquisition is controlled to test races.
const url = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const output = ts.transpileModule(readFileSync(new URL('../src/os/native-title-session.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { createNativeTitleSession } = await import(url(output.replace("'./native-title-assets'",
  JSON.stringify(url('export function loadNativeTitleAssets(){throw Error("Expected injected acquisition")}')))));
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };
const request = (owner='keyboard:1', view='qwerty') => ({ owner, view, titleId:'000400300000d002',
  packs:[{url:'packs/keyboard/swkbd_qwerty.json',alias:'keys',layouts:['Keytop_qwerty'],animations:[]}],sharedFonts:new Map() });
const assets = () => ({ renderer:{},diagnostics:[],disposals:0,dispose(){this.disposals++;} });
function fixture() {
  const calls=[],changes=[];
  const session=createNativeTitleSession({manifestUrl:'https://example.invalid/manifest.json',onChange:state=>changes.push(state),
    load(...args){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});calls.push({args,resolve,reject});return promise;} });
  return {session,calls,changes};
}

test('same view coalesces loading and ready resources; replacing a ready view releases it once',async()=>{
  const f=fixture(),first=request(),resource=assets();
  f.session.update(first);f.session.update(request());await flush();assert.equal(f.calls.length,1);
  f.calls[0].resolve(resource);await flush();assert.equal(f.session.getState().status,'ready');
  f.session.update(request());assert.equal(f.calls.length,1);assert.equal(resource.disposals,0);
  f.session.update(request('keyboard:1','symbols'));assert.equal(resource.disposals,1);await flush();
  assert.equal(f.calls.length,2);assert.equal(f.session.getState().view,'symbols');
  const second=assets();f.calls[1].resolve(second);await flush();f.session.dispose();f.session.dispose();
  assert.equal(second.disposals,1);assert.equal(resource.disposals,1);assert.equal(f.session.getState().status,'idle');
});

test('reopening the same title under a new app instance rejects late assets from the old owner',async()=>{
  const f=fixture();f.session.update(request());await flush();
  f.session.update(request('keyboard:2'));assert.equal(f.calls[0].args[4].aborted,true);await flush();
  const newer=assets(),late=assets();f.calls[1].resolve(newer);await flush();
  f.calls[0].resolve(late);await flush();
  assert.equal(late.disposals,1);assert.equal(newer.disposals,0);
  assert.equal(f.session.getState().owner,'keyboard:2');assert.equal(f.session.getState().assets,newer);
  assert.equal(f.changes.filter(state=>state.status==='ready').length,1);f.session.dispose();
});

test('sleep/close invalidation is immediate and stale load failure cannot replace idle or a newer view',async()=>{
  const f=fixture();f.session.update(request());await flush();f.session.update(null);
  assert.equal(f.calls[0].args[4].aborted,true);assert.equal(f.session.getState().status,'idle');
  f.calls[0].reject(Error('old fetch failed'));await flush();assert.equal(f.session.getState().status,'idle');
  f.session.update(request('keyboard:2'));await flush();f.session.update(request('keyboard:3'));await flush();
  f.calls[1].reject(Error('second fetch failed'));await flush();assert.equal(f.session.getState().owner,'keyboard:3');
  assert.equal(f.session.getState().status,'loading');assert.equal(f.changes.some(state=>state.status==='error'),false);
  const late=assets();f.session.dispose();f.calls[2].resolve(late);await flush();assert.equal(late.disposals,1);
});

test('current failures remain visible without an automatic retry loop; explicit retry starts a fresh load',async()=>{
  const f=fixture(),error=Error('missing native title');f.session.update(request());await flush();
  f.calls[0].reject(error);await flush();assert.equal(f.session.getState().error,error);
  f.session.update(request());await flush();assert.equal(f.calls.length,1);
  f.session.retry();await flush();assert.equal(f.calls.length,2);assert.equal(f.session.getState().status,'loading');
  const resource=assets();f.calls[1].resolve(resource);await flush();f.session.retry();assert.equal(f.calls.length,2);
  f.session.dispose();f.session.update(request());f.session.retry();await flush();assert.equal(f.calls.length,2);
});

test('changed pack selections and borrowed font identities invalidate resources without disposing shared fonts',async()=>{
  const f=fixture(),a={dispose(){throw Error('borrowed font must not be disposed')}},b={...a};
  const first=request();first.sharedFonts.set('cbf_std.bcfnt',a);f.session.update(first);await flush();
  const initial=assets();f.calls[0].resolve(initial);await flush();
  first.sharedFonts.set('cbf_std.bcfnt',b);f.session.update(first);await flush();assert.equal(initial.disposals,1);
  assert.equal(f.calls[1].args[3].get('cbf_std.bcfnt'),b);
  const pending=assets();first.packs[0].animations.push('Keytop_qwerty_i0');f.session.update(first);await flush();
  assert.equal(f.calls[1].args[4].aborted,true);f.calls[1].resolve(pending);await flush();assert.equal(pending.disposals,1);
  assert.deepEqual(f.calls[2].args[2][0].animations,['Keytop_qwerty_i0']);f.session.dispose();
  f.calls[2].reject(Error('disposed'));await flush();
});

test('request mutations cannot change the pending acquisition snapshot',async()=>{
  const f=fixture(),input=request(),font={};input.sharedFonts.set('shared',font);f.session.update(input);
  input.owner='changed';input.packs[0].layouts.push('different');input.sharedFonts.clear();await flush();
  assert.deepEqual(f.calls[0].args[2][0].layouts,['Keytop_qwerty']);assert.equal(f.calls[0].args[3].get('shared'),font);
  assert.equal(f.session.getState().owner,'keyboard:1');f.session.dispose();f.calls[0].reject(Error('disposed'));await flush();
});

test('a reentrant loading callback can close the view before any acquisition starts',async()=>{
  let session,loads=0,changes=0;
  session=createNativeTitleSession({manifestUrl:'https://example.invalid/manifest.json',
    onChange(state){changes++;if(state.status==='loading')session.update(null);},load(){loads++;throw Error('must not load');}});
  session.update(request());await flush();assert.equal(loads,0);assert.equal(changes,2);assert.equal(session.getState().status,'idle');session.dispose();
});
