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
const before = load('silver-curved.glb'), after = load('silver-grain.glb');
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

test('grain material export retains every curved mesh attribute, control and rig transform', () => {
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

test('grain changes only the body normal and roughness images, with retained base artwork and emission', () => {
  const audit = JSON.parse(fs.readFileSync(new URL('paint-grain-pixel-audit.json',folder)));
  assert.equal(audit.paint_pixels,5044041);
  const a = before.doc.materials[0], b = after.doc.materials[0];
  const clean = material => { const clone=structuredClone(material);delete clone.name;return clone; };
  assert.deepEqual(clean(b),clean(a));
  assert.equal(imageHash(after,b.normalTexture.index),audit.maps.normal.output_sha256);
  assert.equal(imageHash(after,b.pbrMetallicRoughness.metallicRoughnessTexture.index),audit.maps['metallic-roughness'].output_sha256);
  assert.equal(imageHash(after,b.pbrMetallicRoughness.baseColorTexture.index),imageHash(before,a.pbrMetallicRoughness.baseColorTexture.index));
  assert.equal(imageHash(after,b.emissiveTexture.index),imageHash(before,a.emissiveTexture.index));
  for(const kind of ['normal','metallic-roughness']) {
    assert.equal(audit.maps[kind].unpainted_changed_pixels,0);
    assert.equal(hash(fs.readFileSync(new URL('derived-textures/body-paint-grain-'+kind+'.png',folder))),audit.maps[kind].output_sha256);
  }
  for(let i=1;i<before.doc.materials.length;i++)assert.deepEqual(after.doc.materials[i],before.doc.materials[i]);
  const images=asset=>asset.doc.images.map(image=>{const v=asset.doc.bufferViews[image.bufferView];return hash(asset.bin.subarray(v.byteOffset,v.byteOffset+v.byteLength));});
  const previous=new Set(images(before));
  assert.equal(images(after).filter(h=>previous.has(h)).length,5);
});
