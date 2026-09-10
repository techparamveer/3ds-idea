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
const before=load('silver-abxy-ink.glb'),after=load('silver-abxy-openings.glb');

test('ABXY opening rounding retains every other mesh, rig transform, texture and material',()=>{
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const n of before.doc.nodes){
    const next=after.doc.nodes.find(x=>x.name===n.name);assert.ok(next);
    for(const key of ['matrix','translation','rotation','scale'])assert.deepEqual(next[key],n[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),n.children?.map(i=>before.doc.nodes[i].name));
    if(n.mesh===undefined||n.name==='Sourced graphite chassis')continue;
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

test('ABXY opening rounding keeps the closed envelope',()=>{
  const world=matrices(after),bounds=new Box3();
  for(const node of after.doc.nodes){
    if(node.mesh===undefined)continue;
    const p=after.doc.meshes[node.mesh].primitives[0],positions=floats(after,p.attributes.POSITION);
    for(let i=0;i<positions.length;i+=3)bounds.expandByPoint(new Vector3().fromArray(positions,i).applyMatrix4(world.get(node.name)).multiplyScalar(1000));
  }
  const size=bounds.getSize(new Vector3());
  for(const [value,target] of [[size.x,156],[size.y,22],[size.z,93]])assert.ok(Math.abs(value-target)<.002,`${value} vs ${target}`);

});

test('rounded openings clear the caps and preserve remote chassis vertices',()=>{
 const node=after.doc.nodes.find(n=>n.name==='Sourced graphite chassis'),oldNode=before.doc.nodes.find(n=>n.name===node.name);
 const prim=after.doc.meshes[node.mesh].primitives[0],oldPrim=before.doc.meshes[oldNode.mesh].primitives[0];
 const p=floats(after,prim.attributes.POSITION),old=floats(before,oldPrim.attributes.POSITION);
 const centres=[[68.47909546,9.27863503],[60.73775864,1.53730619],[60.73777008,17.01997185],[52.99642944,9.27864456]];
 const key=a=>a.map(v=>Math.round(v*1000)).join(',');const points=new Set();
 for(let i=0;i<p.length;i+=3)points.add(key(p.slice(i,i+3)));
 for(let i=0;i<old.length;i+=3){
  if(old[i+1]<=10.8||centres.every(c=>Math.hypot(old[i]-c[0],-old[i+2]-c[1])>=5.1))assert.ok(points.has(key(old.slice(i,i+3))),'Remote chassis vertex moved');
 }
 for(const [index,c] of centres.entries()){
  let count=0,min=Infinity,max=0;
  for(let i=0;i<p.length;i+=3){
   const r=Math.hypot(p[i]-c[0],-p[i+2]-c[1]);
   if(p[i+1]>11.8&&r<4.1){count++;min=Math.min(min,r);max=Math.max(max,r);}
  }
  assert.ok(count>100,'Insufficient ring refinement');
  assert.ok(min>4.0154&&max<4.0156,'Opening radius changed');
  const cap=after.doc.nodes.find(n=>n.name==='Button_'+['A','B','X','Y'][index]);
  const a=floats(after,after.doc.meshes[cap.mesh].primitives[0].attributes.POSITION);
  const xs=a.filter((_,i)=>i%3===0),ys=a.filter((_,i)=>i%3===2);
  const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  let radius=0;for(let i=0;i<a.length;i+=3)radius=Math.max(radius,Math.hypot(a[i]-cx,a[i+2]-cy));
  const raw=attribute(after,prim.indices),component=after.doc.accessors[prim.indices].componentType;
  const width=component===5125?4:2,ids=Array.from({length:raw.length/width},(_,i)=>width===4?raw.readUInt32LE(i*width):raw.readUInt16LE(i*width));
  let gap=Infinity;
  for(let j=0;j<ids.length;j+=3)for(const [u,v] of [[0,1],[1,2],[2,0]]){
   const a=ids[j+u]*3,b=ids[j+v]*3;
   const ax=p[a]-c[0],ay=-p[a+2]-c[1],bx=p[b]-c[0],by=-p[b+2]-c[1];
   if(p[a+1]<11.8||p[b+1]<11.8||Math.hypot(ax,ay)>4.1||Math.hypot(bx,by)>4.1)continue;
   const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
   const t=len?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/len)):0;
   gap=Math.min(gap,Math.hypot(ax+t*dx,ay+t*dy)-radius);
  }
  assert.ok(Number.isFinite(gap)&&gap>.08,'Insufficient cap/opening edge clearance: '+gap);
 }
 const n=floats(after,prim.attributes.NORMAL),t=floats(after,prim.attributes.TANGENT);
 for(let i=0;i<n.length/3;i++){
  const normal=new Vector3().fromArray(n,i*3),tangent=new Vector3().fromArray(t,i*4);
  assert.ok(Math.abs(normal.length()-1)<3e-5&&Math.abs(tangent.length()-1)<3e-5);
  assert.ok(Math.abs(normal.dot(tangent))<3e-5);assert.equal(Math.abs(t[i*4+3]),1);
 }
});
