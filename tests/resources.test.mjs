import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateInventory, loadResourceArchive } from '../src/os/resources.ts';
const data=new TextEncoder().encode('synthetic fixture');
const sha=createHash('sha256').update(data).digest('hex');
const inventory={schema:1,sourceSha256:sha,decodedSha256:sha,resources:{'blyt/test.bclyt':{kind:'unknown',size:data.length,sha256:sha}}};

test('Resource loader verifies bytes against inventory and encodes paths',async()=>{
 const calls=[];
 const archive=await loadResourceArchive('https://example.test/os/inventory.json',async url=>{
  calls.push(url);return new Response(url.endsWith('.json')?JSON.stringify(inventory):data);
 });
 assert.deepEqual(await archive.read('blyt/test.bclyt'),data);
 assert.equal(calls[1],'https://example.test/os/resources/blyt/test.bclyt');
 await assert.rejects(()=>archive.read('missing'),/Resource not in inventory/);
});
test('Loader rejects modified, oversized and truncated resources',async()=>{
 for(const payload of ['changed bytes!!!!','x','oversized resource payload']){
  const archive=await loadResourceArchive('https://example.test/inventory.json',async url=>new Response(url.endsWith('.json')?JSON.stringify(inventory):payload));
  await assert.rejects(()=>archive.read('blyt/test.bclyt'));
 }
});
test('Inventory rejects traversal, unsupported kinds and invalid section bounds',()=>{
 for(const path of ['../a','/a','a\\b','a//b'])assert.throws(()=>validateInventory({...inventory,resources:{[path]:inventory.resources['blyt/test.bclyt']}}));
 assert.throws(()=>validateInventory({...inventory,resources:{a:{kind:'executable',size:1,sha256:sha}}}));
 assert.throws(()=>validateInventory({...inventory,resources:{a:{kind:'layout',size:16,sha256:sha,sections:[{tag:'pan1',offset:12,size:8}]}}}));
});
