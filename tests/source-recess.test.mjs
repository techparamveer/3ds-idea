import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Matrix4,Quaternion,Vector3,Box3} from 'three';

const folder=new URL('../model/candidates/joshua-xl/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
function load(name){const bytes=fs.readFileSync(new URL(name,folder)),n=bytes.readUInt32LE(12);return {doc:JSON.parse(bytes.subarray(20,20+n)),bin:bytes.subarray(28+n)};}
function attribute(asset,index){
  const a=asset.doc.accessors[index],v=asset.doc.bufferViews[a.bufferView];
  const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type]*{5123:2,5125:4,5126:4}[a.componentType];
  const bytes=Buffer.alloc(a.count*width);
  for(let i=0;i<a.count;i++){const p=(v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??width);asset.bin.copy(bytes,i*width,p,p+width);}
  return bytes;
}
function floats(asset,index){const b=attribute(asset,index);return Array.from({length:b.length/4},(_,i)=>b.readFloatLE(i*4));}
function matrices(asset){
  const result=new Map();
  function visit(i,parent){
    const n=asset.doc.nodes[i],local=n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3().fromArray(n.translation??[0,0,0]),new Quaternion().fromArray(n.rotation??[0,0,0,1]),new Vector3().fromArray(n.scale??[1,1,1]));
    const world=parent.clone().multiply(local);result.set(n.name,world);
    for(const child of n.children??[])visit(child,world);
  }
  for(const i of asset.doc.scenes[asset.doc.scene??0].nodes)visit(i,new Matrix4());return result;
}
const before=load('silver-pad.glb'),after=load('silver-recess.glb');
function imageHash(asset,i){const v=asset.doc.bufferViews[asset.doc.images[i].bufferView];return hash(asset.bin.subarray(v.byteOffset,v.byteOffset+v.byteLength));}
function material(asset,index){
  const value=structuredClone(asset.doc.materials[index]);
  function visit(v){for(const [key,entry] of Object.entries(v)){
    if(key.endsWith('Texture')&&entry&&typeof entry==='object'&&'index' in entry){const t=asset.doc.textures[entry.index];entry.index=imageHash(asset,t.source);entry.sampler=asset.doc.samplers[t.sampler];}
    else if(entry&&typeof entry==='object')visit(entry);
  }}
  visit(value);return value;
}
test('socket revision preserves all other meshes and their complete materials',()=>{
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const node of before.doc.nodes){
    const next=after.doc.nodes.find(n=>n.name===node.name);assert.ok(next);
    for(const key of ['matrix','translation','rotation','scale','children'])assert.deepEqual(next[key],node[key]);
    if(node.mesh===undefined||node.name==='Sourced graphite chassis')continue;
    const a=before.doc.meshes[node.mesh].primitives[0],b=after.doc.meshes[next.mesh].primitives[0];
    assert.deepEqual(Object.keys(a.attributes),Object.keys(b.attributes));
    for(const key in a.attributes)assert.ok(attribute(before,a.attributes[key]).equals(attribute(after,b.attributes[key])),node.name+' '+key);
    assert.ok(attribute(before,a.indices).equals(attribute(after,b.indices)));
    assert.deepEqual(material(after,b.material),material(before,a.material));
  }
  const images=new Set(after.doc.images.map((_,i)=>imageHash(after,i)));
  for(let i=0;i<before.doc.images.length;i++)assert.ok(images.has(imageHash(before,i)));
});
test('socket export embeds its three bounded maps and retains remote chassis geometry',()=>{
  const n=after.doc.nodes.find(n=>n.name==='Sourced graphite chassis'),p=after.doc.meshes[n.mesh].primitives[0];
  const m=after.doc.materials[p.material];assert.equal(m.name,'Sourced graphite socket finish');
  for(const [file,texture] of [['basecolor',m.pbrMetallicRoughness.baseColorTexture],['normal',m.normalTexture],['metallic-roughness',m.pbrMetallicRoughness.metallicRoughnessTexture]]){
    assert.equal(imageHash(after,after.doc.textures[texture.index].source),hash(fs.readFileSync(new URL('derived-textures/body-socket-'+file+'.png',folder))));
  }
  const positions=floats(after,p.attributes.POSITION),keys=new Set();const key=a=>a.map(x=>Math.round(x*1000)).join(',');
  for(let i=0;i<positions.length;i+=3)keys.add(key(positions.slice(i,i+3)));
  const oldNode=before.doc.nodes.find(x=>x.name===n.name),op=before.doc.meshes[oldNode.mesh].primitives[0],old=floats(before,op.attributes.POSITION);let fixed=0;
  for(let i=0;i<old.length;i+=3)if(Math.hypot(old[i]+62.2249641459375,-old[i+2]-15.174867628173828)>=14||old[i+1]<=10){assert.ok(keys.has(key(old.slice(i,i+3))));fixed++;}
  assert.ok(fixed>10000);
  const world=matrices(after),bounds=new Box3();
  for(const node of after.doc.nodes){if(node.mesh===undefined)continue;const a=after.doc.meshes[node.mesh].primitives[0];const pos=floats(after,a.attributes.POSITION);
    for(let i=0;i<pos.length;i+=3)bounds.expandByPoint(new Vector3().fromArray(pos,i).applyMatrix4(world.get(node.name)).multiplyScalar(1000));
  }
  const size=bounds.getSize(new Vector3());for(const [v,target] of [[size.x,156],[size.y,22],[size.z,93]])assert.ok(Math.abs(v-target)<.002);
  const normals=floats(after,p.attributes.NORMAL),tangents=floats(after,p.attributes.TANGENT);
  for(let i=0;i<normals.length/3;i++){const n=new Vector3().fromArray(normals,i*3),t=new Vector3().fromArray(tangents,i*4);assert.ok(Math.abs(n.length()-1)<3e-5&&Math.abs(t.length()-1)<3e-5&&Math.abs(n.dot(t))<3e-5);assert.equal(Math.abs(tangents[i*4+3]),1);}
});
