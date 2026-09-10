import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Matrix4,Quaternion,Vector3,Box3,BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,DoubleSide,Raycaster} from 'three';

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
const before=load('silver-chassis.glb'),after=load('silver-pad.glb');

test('circle-pad refinement retains every other mesh, rig transform, texture and material',()=>{
  assert.equal(after.doc.nodes.length,before.doc.nodes.length);
  for(const n of before.doc.nodes){
    const next=after.doc.nodes.find(x=>x.name===n.name);assert.ok(next);
    for(const key of ['matrix','translation','rotation','scale'])assert.deepEqual(next[key],n[key]);
    assert.deepEqual(next.children?.map(i=>after.doc.nodes[i].name),n.children?.map(i=>before.doc.nodes[i].name));
    if(n.mesh===undefined||n.name==='Button_Circle')continue;
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

test('rounded pad keeps the closed envelope, centre stem vertices and valid shading frames',()=>{
  const world=matrices(after),bounds=new Box3();
  for(const node of after.doc.nodes){
    if(node.mesh===undefined)continue;
    const p=after.doc.meshes[node.mesh].primitives[0],positions=floats(after,p.attributes.POSITION);
    for(let i=0;i<positions.length;i+=3)bounds.expandByPoint(new Vector3().fromArray(positions,i).applyMatrix4(world.get(node.name)).multiplyScalar(1000));
  }
  const size=bounds.getSize(new Vector3());
  for(const [value,target] of [[size.x,156],[size.y,22],[size.z,93]])assert.ok(Math.abs(value-target)<.002,`${value} vs ${target}`);
  const node=after.doc.nodes.find(n=>n.name==='Button_Circle'),primitive=after.doc.meshes[node.mesh].primitives[0];
  const originalNode=before.doc.nodes.find(n=>n.name===node.name),original=before.doc.meshes[originalNode.mesh].primitives[0];
  const positions=floats(after,primitive.attributes.POSITION),old=floats(before,original.attributes.POSITION);
  const key=p=>p.map(x=>Math.round(x*1000)).join(',');const points=new Set();
  for(let i=0;i<positions.length;i+=3)points.add(key(positions.slice(i,i+3)));
  let fixed=0;const oldWorld=matrices(before).get(node.name);
  for(let i=0;i<old.length;i+=3){
    const p=old.slice(i,i+3),worldPoint=new Vector3().fromArray(p).applyMatrix4(oldWorld).multiplyScalar(1000);
    if(Math.hypot(p[0]-.00001144,p[2]+.0636425)<4.8){assert.ok(points.has(key(p)),'Centre stem vertex moved');fixed++;}
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


test('rounded pad retains radius and height and clears the actual closed inner lid',()=>{
  const world=matrices(after);
  function primitive(asset,name){const n=asset.doc.nodes.find(n=>n.name===name);return asset.doc.meshes[n.mesh].primitives[0];}
  const pad=primitive(after,'Button_Circle'),oldPad=primitive(before,'Button_Circle');
  const p=floats(after,pad.attributes.POSITION),old=floats(before,oldPad.attributes.POSITION);
  const maxY=a=>Math.max(...a.filter((_,i)=>i%3===1));
  assert.ok(Math.abs(maxY(p)-maxY(old))<1e-5);
  const radius=a=>Math.max(...Array.from({length:a.length/3},(_,i)=>Math.hypot(a[i*3]-.00001144,a[i*3+2]+.0636425)));
  assert.ok(Math.abs(radius(p)-radius(old))<.0001);
  const lid=primitive(after,'Sourced inner lid'),lp=floats(after,lid.attributes.POSITION);
  const points=[];
  for(let i=0;i<lp.length;i+=3)points.push(...new Vector3().fromArray(lp,i).applyMatrix4(world.get('Sourced inner lid')).multiplyScalar(1000).toArray());
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(points,3));
  const raw=attribute(after,lid.indices),width=after.doc.accessors[lid.indices].componentType===5125?4:2;
  geometry.setIndex(Array.from({length:raw.length/width},(_,i)=>width===4?raw.readUInt32LE(i*width):raw.readUInt16LE(i*width)));
  const mesh=new Mesh(geometry,new MeshBasicMaterial({side:DoubleSide}));mesh.updateMatrixWorld(true);
  const ray=new Raycaster(),direction=new Vector3(0,1,0);let minimum=Infinity,count=0;
  for(let i=0;i<p.length;i+=3){
    if(p[i+1]<maxY(p)-.0001)continue;
    const point=new Vector3().fromArray(p,i).applyMatrix4(world.get('Button_Circle')).multiplyScalar(1000);
    ray.set(point,direction);const hits=ray.intersectObject(mesh);assert.ok(hits.length);
    minimum=Math.min(minimum,hits[0].distance);count++;
  }
  assert.ok(count>32);assert.ok(minimum>.015&&minimum<.018,`clearance ${minimum} mm`);
  geometry.dispose();mesh.material.dispose();
});
