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
const before = load('silver-abxy-rollover.glb'), after = load('silver-abxy-print.glb');
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

test('Cap-print export retains every oriented triangle, source UV and shading frame',()=>{
  assert.equal(before.doc.nodes.length,after.doc.nodes.length);
  for(const node of before.doc.nodes) {
    const next=after.doc.nodes.find(n=>n.name===node.name);assert.ok(next);
    for(const key of ['translation','rotation','scale','matrix'])assert.deepEqual(next[key],node[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),node.children?.map(i=>before.doc.nodes[i].name));
    if(node.mesh===undefined)continue;
    assert.deepEqual(triangles(after,after.doc.meshes[next.mesh]),triangles(before,before.doc.meshes[node.mesh]),node.name);
  }
});

test('Only planar cap faces receive new base colour and a second UV mapping',()=>{
  const report=JSON.parse(fs.readFileSync(new URL('abxy-planar-print-report.json',folder)));
  for(const node of before.doc.nodes) {
    if(node.mesh===undefined)continue;
    const next=after.doc.nodes.find(n=>n.name===node.name);
    const original=before.doc.meshes[node.mesh].primitives[0];
    const expected=material(before,original.material);
    const parts=after.doc.meshes[next.mesh].primitives;
    const cap=/^Button_[ABXY]$/.test(node.name);assert.equal(parts.length,cap?2:1);
    for(const part of parts) {
      const m=material(after,part.material);
      if(m.name==='Sourced planar ABXY print') {
        assert.ok(cap);assert.equal(m.pbrMetallicRoughness.baseColorTexture.texCoord,1);
        assert.equal(m.pbrMetallicRoughness.baseColorTexture.index,report.sha256);
        m.name=expected.name;m.pbrMetallicRoughness.baseColorTexture=expected.pbrMetallicRoughness.baseColorTexture;
        const buffer=attribute(after,part.attributes.POSITION),p=new Float32Array(buffer.buffer,buffer.byteOffset,buffer.length/4);
        const b=attribute(after,part.attributes.TEXCOORD_1),uv=new Float32Array(b.buffer,b.byteOffset,b.length/4);
        const oldBuffer=attribute(before,original.attributes.POSITION),old=new Float32Array(oldBuffer.buffer,oldBuffer.byteOffset,oldBuffer.length/4);
        let top=-Infinity,x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
        for(let i=0;i<old.length;i+=3){top=Math.max(top,old[i+1]);x0=Math.min(x0,old[i]);x1=Math.max(x1,old[i]);z0=Math.min(z0,old[i+2]);z1=Math.max(z1,old[i+2]);}
        const index='ABXY'.indexOf(node.name.at(-1)),row=Math.floor(index/2),column=index%2;
        for(let i=0,j=0;i<p.length;i+=3,j+=2){
          assert.ok(Math.abs(p[i+1]-top)<1e-5);
          assert.ok(Math.abs(uv[j]-((p[i]-(x0+x1)/2)/7.2+.5+column)/2)<1e-6);
          assert.ok(Math.abs(uv[j+1]-(1-((-p[i+2]+(z0+z1)/2)/7.2+.5+1-row)/2))<1e-6);
        }
      }
      assert.deepEqual(m,expected,node.name);
    }
  }
});
