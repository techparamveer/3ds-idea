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
const before = load('silver-abxy-print.glb'), after = load('silver-screen-backings.glb');
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
function triangles(asset,mesh) {
  const result=[];
  for(const primitive of mesh.primitives) {
    const keys=['POSITION','NORMAL','TANGENT','TEXCOORD_0'];
    const buffers=keys.map(key=>attribute(asset,primitive.attributes[key]));
    const count=asset.doc.accessors[primitive.attributes.POSITION].count;
    const vertices=Array.from({length:count},(_,i)=>hash(Buffer.concat(buffers.map(b=>b.subarray(i*b.length/count,(i+1)*b.length/count)))));
    const bytes=attribute(asset,primitive.indices),a=asset.doc.accessors[primitive.indices];
    const size=a.componentType===5123?2:4,read=offset=>size===2?bytes.readUInt16LE(offset):bytes.readUInt32LE(offset);
    for(let i=0;i<bytes.length;i+=size*3) {
      const v=[0,1,2].map(j=>vertices[read(i+j*size)]);
      result.push([v.join(''),[v[1],v[2],v[0]].join(''),[v[2],v[0],v[1]].join('')].sort()[0]);
    }
  }
  return result.sort();
}

test('Screen backing export retains geometry, source UVs, frames and rig',()=>{
  assert.equal(before.doc.nodes.length,after.doc.nodes.length);
  for(const node of before.doc.nodes) {
    const next=after.doc.nodes.find(n=>n.name===node.name);assert.ok(next);
    for(const key of ['translation','rotation','scale','matrix'])assert.deepEqual(next[key],node[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),node.children?.map(i=>before.doc.nodes[i].name));
    if(node.mesh===undefined)continue;
    assert.deepEqual(triangles(after,after.doc.meshes[next.mesh]),triangles(before,before.doc.meshes[node.mesh]),node.name);
  }
});


test('Only screen backings lose the mismatched atlas and alpha blending',()=>{
  for(const node of before.doc.nodes) {
    if(node.mesh===undefined)continue;
    const next=after.doc.nodes.find(n=>n.name===node.name);
    const old=before.doc.meshes[node.mesh].primitives,parts=after.doc.meshes[next.mesh].primitives;
    assert.equal(parts.length,old.length);
    for(let i=0;i<parts.length;i++){
      const m=material(after,parts[i].material);
      if(['Screen_Top','Screen_Bottom'].includes(node.name)) {
        assert.equal(m.alphaMode,undefined);
        assert.equal(m.occlusionTexture,undefined);
        assert.equal(m.normalTexture,undefined);
        assert.deepEqual(m.pbrMetallicRoughness.baseColorFactor,[0,0,0,1]);
        assert.equal(m.pbrMetallicRoughness.baseColorTexture,undefined);
        assert.equal(m.pbrMetallicRoughness.metallicRoughnessTexture,undefined);
        assert.equal(m.pbrMetallicRoughness.metallicFactor,0);
        assert.ok(Math.abs(m.pbrMetallicRoughness.roughnessFactor-(node.name==='Screen_Top'?.18:.26))<1e-6);
        assert.equal(m.extras.console_material_role,'screen-backing');
        assert.equal(m.extensions.KHR_materials_specular.specularFactor,0.6677274107933044);
      } else assert.deepEqual(m,material(before,old[i].material),node.name);
      assert.deepEqual(Object.keys(parts[i].attributes).sort(),Object.keys(old[i].attributes).sort());
      if(parts[i].attributes.TEXCOORD_1!==undefined)assert.ok(attribute(after,parts[i].attributes.TEXCOORD_1).equals(attribute(before,old[i].attributes.TEXCOORD_1)),node.name+' second UV');
    }
  }
});
