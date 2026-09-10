import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const folder=new URL('../model/candidates/joshua-xl/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
function load(name){const bytes=fs.readFileSync(new URL(name,folder)),size=bytes.readUInt32LE(12);assert.equal(bytes.readUInt32LE(8),bytes.length);return {doc:JSON.parse(bytes.subarray(20,20+size)),bin:bytes.subarray(28+size)};}
const before=load('silver-grain.glb'),after=load('silver-eur.glb');
function attribute(asset,index){
  const a=asset.doc.accessors[index],v=asset.doc.bufferViews[a.bufferView];
  const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type]*{5123:2,5125:4,5126:4}[a.componentType],bytes=Buffer.alloc(a.count*width);
  for(let i=0;i<a.count;i++){const offset=(v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??width);asset.bin.copy(bytes,i*width,offset,offset+width);}
  return bytes;
}
function textureHash(asset,index){const image=asset.doc.images[asset.doc.textures[index].source],v=asset.doc.bufferViews[image.bufferView];return hash(asset.bin.subarray(v.byteOffset,v.byteOffset+v.byteLength));}

test('EUR material pass preserves every curved geometry attribute and the complete rig',()=>{
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const node of before.doc.nodes){
    const next=after.doc.nodes.find(n=>n.name===node.name);assert.ok(next);
    for(const key of ['translation','rotation','scale','matrix'])assert.deepEqual(next[key],node[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),node.children?.map(i=>before.doc.nodes[i].name));
    if(node.mesh===undefined)continue;
    const a=before.doc.meshes[node.mesh].primitives[0],b=after.doc.meshes[next.mesh].primitives[0];
    assert.deepEqual(Object.keys(a.attributes),Object.keys(b.attributes));
    for(const key of Object.keys(a.attributes))assert.ok(attribute(before,a.attributes[key]).equals(attribute(after,b.attributes[key])),`${node.name} ${key}`);
    assert.ok(attribute(before,a.indices).equals(attribute(after,b.indices)));
  }
  const a=before.doc.nodes.find(n=>n.name==='3DS_XL').extras,b=after.doc.nodes.find(n=>n.name==='3DS_XL').extras;
  assert.deepEqual(b.console_layout,a.console_layout);assert.deepEqual(b.shell_curvature,a.shell_curvature);
  assert.equal(b.source_markings_region,'EUR');assert.match(b.underside_lettering_method,/Photographic/);
});

test('EUR export embeds the independently audited maps and uses the matching new paint mask',()=>{
  const audit=JSON.parse(fs.readFileSync(new URL('eur-pixel-audit.json',folder))),material=after.doc.materials[0];
  for(const [kind,index] of [['basecolor',material.pbrMetallicRoughness.baseColorTexture.index],['normal',material.normalTexture.index],['metallic-roughness',material.pbrMetallicRoughness.metallicRoughnessTexture.index]]){
    assert.equal(textureHash(after,index),audit.maps[kind].output_sha256);
    assert.equal(hash(fs.readFileSync(new URL('derived-textures/body-eur-'+kind+'.png',folder))),audit.maps[kind].output_sha256);
    assert.equal(audit.maps[kind].changed_outside_edit_mask,0);
  }
  const maskUrl=material.extras.console_paint_mask;
  assert.equal(maskUrl,'/models/candidates/joshua-xl-eur-paint-mask.png');
  assert.equal(hash(fs.readFileSync(new URL('../public'+maskUrl,import.meta.url))),audit.maps['paint-mask'].output_sha256);
  const clean=m=>{const c=structuredClone(m);delete c.name;delete c.extras.console_paint_mask;return c;};
  assert.deepEqual(clean(material),clean(before.doc.materials[0]));
  assert.deepEqual(after.doc.samplers,before.doc.samplers);
  const changedTextures=new Set([material.pbrMetallicRoughness.baseColorTexture.index,material.normalTexture.index,material.pbrMetallicRoughness.metallicRoughnessTexture.index]);
  assert.equal(after.doc.textures.length,before.doc.textures.length);
  for(let i=0;i<after.doc.textures.length;i++){
    if(!changedTextures.has(i))assert.equal(textureHash(after,i),textureHash(before,i),`Unrelated texture ${i} must stay exact`);
  }
  for(let i=1;i<before.doc.materials.length;i++)assert.deepEqual(after.doc.materials[i],before.doc.materials[i]);
});
