import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
function parse(bytes){const length=bytes.readUInt32LE(12);return {doc:JSON.parse(bytes.subarray(20,20+length)),bin:bytes.subarray(28+length)};}
async function stream(asset,index){const a=asset.doc.accessors[index],v=asset.doc.bufferViews[a.bufferView],e=v.extensions?.EXT_meshopt_compression;if(!e)return asset.bin.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);await MeshoptDecoder.ready;const bytes=new Uint8Array(e.count*e.byteStride);MeshoptDecoder.decodeGltfBuffer(bytes,e.count,e.byteStride,asset.bin.subarray(e.byteOffset,e.byteOffset+e.byteLength),e.mode,e.filter);return Buffer.from(bytes);}
test('compact delivery preserves all live geometry, hierarchy, material assignments and UV channels',async()=>{
 const original=parse(await fs.readFile('model/candidates/joshua-xl/silver-audio-finish-web.glb'));
 const packedBytes=await fs.readFile('public/models/candidates/joshua-xl.glb'),packed=parse(packedBytes);
 assert.ok(packedBytes.length<15_000_000,'delivery size budget');
 for(const key of ['nodes','scenes','scene','materials','textures','samplers'])assert.deepEqual(packed.doc[key],original.doc[key],key);
 assert.equal(packed.doc.meshes.length,original.doc.meshes.length);
 for(let i=0;i<original.doc.meshes.length;i++)for(let k=0;k<original.doc.meshes[i].primitives.length;k++){
  const a=original.doc.meshes[i].primitives[k],b=packed.doc.meshes[i].primitives[k];
  assert.equal(a.material,b.material);assert.deepEqual(Object.keys(a.attributes),Object.keys(b.attributes));
  for(const key of Object.keys(a.attributes)){
   const before=await stream(original,a.attributes[key]),after=await stream(packed,b.attributes[key]);assert.equal(before.length,after.length);
   const limit=key==='POSITION'?0.001:key.startsWith('TEXCOORD')?0.00001:0.001;
   for(let offset=0;offset<before.length;offset+=4)assert.ok(Math.abs(before.readFloatLE(offset)-after.readFloatLE(offset))<=limit,`mesh ${i} ${key}`);
  }
  assert.ok((await stream(original,a.indices)).equals(await stream(packed,b.indices)),`mesh ${i} indices`);
 }
 const manifest=JSON.parse(await fs.readFile('model/candidates/joshua-xl/silver-audio-finish-compact.glb.json'));
 for(let i=0;i<manifest.textures.length;i++)if(manifest.textures[i].lossless){
  const av=original.doc.bufferViews[original.doc.images[i].bufferView],bv=packed.doc.bufferViews[packed.doc.images[i].bufferView];
  assert.ok(original.bin.subarray(av.byteOffset,av.byteOffset+av.byteLength).equals(packed.bin.subarray(bv.byteOffset,bv.byteOffset+bv.byteLength)),manifest.textures[i].name);
 }
});
