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
const before=load('silver-camera.glb'),after=load('silver-camera-round.glb');

test('camera rounding retains every other mesh, rig transform, texture and material',()=>{
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const n of before.doc.nodes){
    const next=after.doc.nodes.find(x=>x.name===n.name);assert.ok(next);
    for(const key of ['matrix','translation','rotation','scale'])assert.deepEqual(next[key],n[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),n.children?.map(i=>before.doc.nodes[i].name));
    if(n.mesh===undefined||['Sourced inner lid','Source_2_part_02'].includes(n.name))continue;
    const a=before.doc.meshes[n.mesh].primitives[0],b=after.doc.meshes[next.mesh].primitives[0];
    assert.deepEqual(Object.keys(b.attributes),Object.keys(a.attributes));
    for(const key in a.attributes)assert.ok(attribute(before,a.attributes[key]).equals(attribute(after,b.attributes[key])),n.name+' '+key);
    assert.ok(attribute(before,a.indices).equals(attribute(after,b.indices)));
  }
  assert.deepEqual(after.doc.materials,before.doc.materials);assert.deepEqual(after.doc.samplers,before.doc.samplers);
  assert.equal(after.doc.images.length,before.doc.images.length);
  const images=asset=>asset.doc.images.map(i=>{const v=asset.doc.bufferViews[i.bufferView];return hash(asset.bin.subarray(v.byteOffset,v.byteOffset+v.byteLength));});
  assert.deepEqual(images(after),images(before));
  const a=before.doc.nodes.find(n=>n.name==='3DS_XL').extras,b=after.doc.nodes.find(n=>n.name==='3DS_XL').extras;
  for(const key in a)if(key!=='source_changes')assert.deepEqual(b[key],a[key]);
});

test('camera rounding keeps the envelope, remote vertices and valid shading frames',()=>{
  const world=matrices(after),bounds=new Box3();
  for(const node of after.doc.nodes){
    if(node.mesh===undefined)continue;
    const p=after.doc.meshes[node.mesh].primitives[0],positions=floats(after,p.attributes.POSITION);
    for(let i=0;i<positions.length;i+=3)bounds.expandByPoint(new Vector3().fromArray(positions,i).applyMatrix4(world.get(node.name)).multiplyScalar(1000));
  }
  const size=bounds.getSize(new Vector3());
  for(const [value,target] of [[size.x,156],[size.y,22],[size.z,93]])assert.ok(Math.abs(value-target)<.002,`${value} vs ${target}`);
  const node=after.doc.nodes.find(n=>n.name==='Sourced inner lid'),primitive=after.doc.meshes[node.mesh].primitives[0];
  const originalNode=before.doc.nodes.find(n=>n.name===node.name),original=before.doc.meshes[originalNode.mesh].primitives[0];
  const positions=floats(after,primitive.attributes.POSITION),old=floats(before,original.attributes.POSITION);
  const key=p=>p.map(x=>Math.round(x*1000)).join(',');const points=new Set();
  for(let i=0;i<positions.length;i+=3)points.add(key(positions.slice(i,i+3)));

  let fixed=0;
  for(let i=0;i<old.length;i+=3){
    const p=old.slice(i,i+3);
    const distance=Math.hypot(p[0],-p[2]+81.70998);
    if(distance>=3.1){assert.ok(points.has(key(p)),'Remote vertex moved');fixed++;}
  }
  assert.ok(fixed>50);
  const normals=floats(after,primitive.attributes.NORMAL),tangents=floats(after,primitive.attributes.TANGENT);
  for(let i=0;i<normals.length/3;i++){
    const n=new Vector3().fromArray(normals,i*3),t=new Vector3().fromArray(tangents,i*4);
    assert.ok(Number.isFinite(n.length())&&Math.abs(n.length()-1)<3e-5);
    assert.ok(Number.isFinite(t.length())&&Math.abs(t.length()-1)<3e-5);
    assert.ok(Math.abs(n.dot(t))<3e-5);assert.equal(Math.abs(tangents[i*4+3]),1);
  }
  assert.ok(after.doc.accessors[primitive.indices].count>before.doc.accessors[original.indices].count);
});

test('camera aperture and insert have circular, finely segmented rims and retained UV sets',()=>{
 for(const [name,cx,cy,radius,height,layers] of [
  ['Sourced inner lid',0,-81.70998,2.08,-1.20934,1],
  ['Source_2_part_02',0,-81.1066437,2.054391,-1.391893,2]]) {
  const node=after.doc.nodes.find(n=>n.name===name),prim=after.doc.meshes[node.mesh].primitives[0];
  assert.equal(Object.keys(prim.attributes).filter(k=>k.startsWith('TEXCOORD')).length,layers);
  const p=floats(after,prim.attributes.POSITION),angles=[];
  for(let i=0;i<p.length;i+=3) {
   const dx=p[i]-cx,dy=-p[i+2]-cy,r=Math.hypot(dx,dy);
   if(Math.abs(p[i+1]-height)<.0001 && Math.abs(r-radius)<.0001)angles.push(Math.atan2(dy,dx));
  }
  const unique=[...new Set(angles.map(a=>Math.round(a*10000)/10000))].sort((a,b)=>a-b);
  assert.ok(unique.length>=80,name+' rim samples');
  const gaps=unique.map((a,i)=>(i===unique.length-1?unique[0]+2*Math.PI:unique[i+1])-a);
  assert.ok(Math.max(...gaps)<.1,name+' unrounded sector');
  for(const key of ['NORMAL','TANGENT',...Object.keys(prim.attributes).filter(k=>k.startsWith('TEXCOORD'))]) assert.ok(floats(after,prim.attributes[key]).every(Number.isFinite));
 }
});
