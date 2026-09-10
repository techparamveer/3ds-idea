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
const before = load('silver-power-indicator.glb'), after = load('silver-abxy-rollover.glb');
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

test('ABXY rollover preserves unrelated geometry, UVs, topology and rig', () => {
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const node of before.doc.nodes) {
    const next = after.doc.nodes.find(n=>n.name===node.name);
    assert.ok(next);
    for(const key of ['translation','rotation','scale','matrix']) assert.deepEqual(next[key],node[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),node.children?.map(i=>before.doc.nodes[i].name));
    if(node.mesh===undefined)continue;
    const a = before.doc.meshes[node.mesh].primitives[0], b = after.doc.meshes[next.mesh].primitives[0];
    assert.deepEqual(Object.keys(a.attributes),Object.keys(b.attributes));
    for(const key of Object.keys(a.attributes)) {if(/^Button_[ABXY]$/.test(node.name)&&['POSITION','NORMAL','TANGENT'].includes(key))continue;assert.ok(attribute(before,a.attributes[key]).equals(attribute(after,b.attributes[key])),`${node.name}: ${key}`);}
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
test('ABXY rollover preserves every material and texture', () => {
  for(const node of before.doc.nodes) {
    if(node.mesh===undefined)continue;
    const next=after.doc.nodes.find(n=>n.name===node.name);
    const a=material(before,before.doc.meshes[node.mesh].primitives[0].material);
    const b=material(after,after.doc.meshes[next.mesh].primitives[0].material);
    assert.deepEqual(b,a,node.name);
  }
});

test('Rounded cap rims retain height and diameter with valid shading frames', () => {
  const floats=buffer=>new Float32Array(buffer.buffer,buffer.byteOffset,buffer.byteLength/4);
  for(const name of ['Button_A','Button_B','Button_X','Button_Y']) {
    const primitive=asset=>asset.doc.meshes[asset.doc.nodes.find(n=>n.name===name).mesh].primitives[0];
    const a=primitive(before),b=primitive(after);
    const old=floats(attribute(before,a.attributes.POSITION)),p=floats(attribute(after,b.attributes.POSITION));
    const n=floats(attribute(after,b.attributes.NORMAL)),t=floats(attribute(after,b.attributes.TANGENT));
    assert.equal(p.length,old.length);
    const bounds=values=>[0,1,2].map(axis=>{
      let lo=Infinity,hi=-Infinity;
      for(let i=axis;i<values.length;i+=3){lo=Math.min(lo,values[i]);hi=Math.max(hi,values[i]);}
      return [lo,hi];
    });
    const previous=bounds(old),current=bounds(p);
    for(let axis=0;axis<3;axis++)for(let end=0;end<2;end++)assert.ok(Math.abs(previous[axis][end]-current[axis][end])<1e-5,name+' envelope');
    let moved=0;
    for(let i=0,j=0;i<p.length;i+=3,j+=4){
      const distance=Math.hypot(p[i]-old[i],p[i+1]-old[i+1],p[i+2]-old[i+2]);
      assert.ok(distance<.134,name+' bounded rim change');
      if(distance>1e-5)moved++;
      if(Math.abs(old[i+1]-previous[1][1])<1e-5)assert.ok(distance<1e-5,name+' planar ink surface');
      assert.ok(Math.abs(Math.hypot(n[i],n[i+1],n[i+2])-1)<2e-5);
      assert.ok(Math.abs(Math.hypot(t[j],t[j+1],t[j+2])-1)<2e-5);
      assert.ok(Math.abs(n[i]*t[j]+n[i+1]*t[j+1]+n[i+2]*t[j+2])<2e-5);
      assert.equal(Math.abs(t[j+3]),1);
    }
    assert.ok(moved>2000,name+' rim geometry changes');
  }
});
