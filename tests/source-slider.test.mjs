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
const before = load('silver-rubber.glb'), after = load('silver-slider.glb');
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

test('slider cavity export retains every mesh attribute, control and rig transform', () => {
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const node of before.doc.nodes) {
    const next = after.doc.nodes.find(n=>n.name===node.name);
    assert.ok(next);
    for(const key of ['translation','rotation','scale','matrix']) assert.deepEqual(next[key],node[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),node.children?.map(i=>before.doc.nodes[i].name));
    if(node.mesh===undefined)continue;
    const a = before.doc.meshes[node.mesh].primitives[0], b = after.doc.meshes[next.mesh].primitives[0];
    assert.deepEqual(Object.keys(a.attributes),Object.keys(b.attributes));
    for(const key of Object.keys(a.attributes)) assert.ok(attribute(before,a.attributes[key]).equals(attribute(after,b.attributes[key])),`${node.name}: ${key}`);
    assert.ok(attribute(before,a.indices).equals(attribute(after,b.indices)),node.name+' topology');
  }
  const a = before.doc.nodes.find(n=>n.name==='3DS_XL'), b = after.doc.nodes.find(n=>n.name==='3DS_XL');
  assert.deepEqual(b.extras.console_layout,a.extras.console_layout);
  assert.deepEqual(b.extras.shell_curvature,a.extras.shell_curvature);
});

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
test('slider cavity export changes only the two bounded inner-lid maps', () => {
  const report=JSON.parse(fs.readFileSync(new URL('slider-cavity-report.json',folder)));
  for(const node of before.doc.nodes) {
    if(node.mesh===undefined)continue;
    const next=after.doc.nodes.find(n=>n.name===node.name);
    const a=material(before,before.doc.meshes[node.mesh].primitives[0].material);
    const b=material(after,after.doc.meshes[next.mesh].primitives[0].material);
    if(node.name==='Sourced inner lid') {
      assert.equal(b.pbrMetallicRoughness.baseColorTexture.index,report.sha256);
      assert.equal(b.normalTexture.index,report.dot_normal.sha256);
      b.pbrMetallicRoughness.baseColorTexture.index=a.pbrMetallicRoughness.baseColorTexture.index;
      b.normalTexture.index=a.normalTexture.index;
    }
    assert.deepEqual(b,a,node.name);
  }
  assert.equal(report.outside_mask_changes,0);
  assert.equal(report.dot_normal.blue_channel_unchanged,true);
  assert.equal(hash(fs.readFileSync(new URL('derived-textures/body-slider-basecolor.png',folder))),report.sha256);
  assert.equal(hash(fs.readFileSync(new URL('derived-textures/body-slider-dot-normal.png',folder))),report.dot_normal.sha256);
});
