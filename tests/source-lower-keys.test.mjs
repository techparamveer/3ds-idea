import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const folder = new URL('../model/candidates/joshua-xl/', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function load(name) {
  const bytes = fs.readFileSync(new URL(name, folder)), size = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  return { doc: JSON.parse(bytes.subarray(20,20+size)), bin: bytes.subarray(28+size) };
}
const before = load('silver-restrained-paint.glb'), after = load('silver-lower-keys.glb');
function attribute(asset, index) {
  const a = asset.doc.accessors[index], v = asset.doc.bufferViews[a.bufferView];
  const width = {SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type]*{5123:2,5125:4,5126:4}[a.componentType];
  const data = Buffer.alloc(a.count*width);
  for(let i=0;i<a.count;i++) {
    const offset = (v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??width);
    asset.bin.copy(data,i*width,offset,offset+width);
  }
  return data;
}
function imageHash(asset, textureIndex) {
  const image = asset.doc.images[asset.doc.textures[textureIndex].source];
  const view = asset.doc.bufferViews[image.bufferView];
  return hash(asset.bin.subarray(view.byteOffset, view.byteOffset+view.byteLength));
}

function material(asset,index) {
  const out=structuredClone(asset.doc.materials[index]);
  function resolve(obj) {
    for(const [key,value] of Object.entries(obj)) {
      if(!value || typeof value!=='object')continue;
      if(key.endsWith('Texture') && value.index!==undefined) {
        const texture=asset.doc.textures[value.index];
        value.index=imageHash(asset,value.index);
        value.sampler=asset.doc.samplers?.[texture.sampler];
      } else resolve(value);
    }
  }
  resolve(out);return out;
}
const edited = new Set(['Button_SELECT','Button_START','Sourced graphite chassis']);
test('Lower key rounding preserves textures, node transforms and all other meshes', () => {
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const node of before.doc.nodes) {
    const next=after.doc.nodes.find(n=>n.name===node.name);assert.ok(next);
    for(const key of ['translation','rotation','scale','matrix'])assert.deepEqual(next[key],node[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),node.children?.map(i=>before.doc.nodes[i].name));
    if(node.mesh===undefined)continue;
    const a=before.doc.meshes[node.mesh].primitives[0], b=after.doc.meshes[next.mesh].primitives[0];
    assert.deepEqual(material(after,b.material),material(before,a.material),node.name+' material');
    if(edited.has(node.name))continue;
    for(const key of Object.keys(a.attributes))assert.ok(attribute(before,a.attributes[key]).equals(attribute(after,b.attributes[key])),node.name+' '+key);
    assert.ok(attribute(before,a.indices).equals(attribute(after,b.indices)),node.name+' topology');
  }
});
function floats(asset,index) {
  const b=attribute(asset,index);return Array.from({length:b.length/4},(_,i)=>b.readFloatLE(i*4));
}
test('Refined lower keys retain depth bounds and normalized orthogonal shading frames', () => {
  for(const name of edited) {
    const a=before.doc.meshes[before.doc.nodes.find(n=>n.name===name).mesh].primitives[0];
    const b=after.doc.meshes[after.doc.nodes.find(n=>n.name===name).mesh].primitives[0];
    const p=floats(after,b.attributes.POSITION), old=floats(before,a.attributes.POSITION);
    const heights=values=>values.filter((_,i)=>i%3===1);
    assert.ok(Math.abs(Math.min(...heights(p))-Math.min(...heights(old)))<1e-5);
    assert.ok(Math.abs(Math.max(...heights(p))-Math.max(...heights(old)))<1e-5);
    const n=floats(after,b.attributes.NORMAL),t=floats(after,b.attributes.TANGENT);
    for(let i=0;i<n.length/3;i++) {
      const normal=n.slice(i*3,i*3+3),tangent=t.slice(i*4,i*4+3);
      assert.ok(Math.abs(Math.hypot(...normal)-1)<1e-5);
      assert.ok(Math.abs(Math.hypot(...tangent)-1)<1e-5);
      assert.ok(Math.abs(normal.reduce((sum,v,k)=>sum+v*tangent[k],0))<1e-5);
      assert.equal(Math.abs(t[i*4+3]),1);
    }
  }
});
