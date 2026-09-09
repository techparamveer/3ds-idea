import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { Matrix4, Quaternion, Vector3, Box3 } from 'three';

function load(name) {
  const bytes=fs.readFileSync(new URL('../model/candidates/joshua-xl/'+name,import.meta.url));
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const size=bytes.readUInt32LE(12);
  return {doc:JSON.parse(bytes.subarray(20,20+size)),bin:bytes.subarray(28+size)};
}
const original=load('silver-source.glb'),curved=load('silver-curved.glb');
function attribute(asset,index) {
  const a=asset.doc.accessors[index],v=asset.doc.bufferViews[a.bufferView];
  const columns={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
  const [size,method]={5123:[2,'readUInt16LE'],5125:[4,'readUInt32LE'],5126:[4,'readFloatLE']}[a.componentType];
  return Array.from({length:a.count},(_,i)=>Array.from({length:columns},(_,j)=>asset.bin[method]((v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??columns*size)+j*size)));
}
function nodeMesh(asset,name) {
  const node=asset.doc.nodes.find(n=>n.name===name),primitive=asset.doc.meshes[node.mesh].primitives[0];
  return {node,primitive,p:attribute(asset,primitive.attributes.POSITION),n:attribute(asset,primitive.attributes.NORMAL),uv:attribute(asset,primitive.attributes.TEXCOORD_0),indices:attribute(asset,primitive.indices).flat()};
}
function matrix(node) {
  return node.matrix?new Matrix4().fromArray(node.matrix):new Matrix4().compose(new Vector3(...(node.translation??[0,0,0])),new Quaternion(...(node.rotation??[0,0,0,1])),new Vector3(...(node.scale??[1,1,1])));
}
function inRoot(asset,node) {
  const index=asset.doc.nodes.indexOf(node);
  const parent=asset.doc.nodes.find(n=>n.children?.includes(index));
  return node.name==='3DS_XL'?new Matrix4():inRoot(asset,parent).multiply(matrix(node));
}
function surface(asset,name) {
  const mesh=nodeMesh(asset,name),m=inRoot(asset,mesh.node);
  const points=mesh.p.map(p=>new Vector3(...p).applyMatrix4(m).toArray());
  return {...mesh,points};
}
function samples(mesh,x,z) {
  const hits=[];
  for(let i=0;i<mesh.indices.length;i+=3) {
    const ids=mesh.indices.slice(i,i+3),[a,b,c]=ids.map(id=>mesh.points[id]);
    const dx=b[0]-a[0],dz=b[2]-a[2],ex=c[0]-a[0],ez=c[2]-a[2],det=dx*ez-dz*ex;
    if(Math.abs(det)<1e-9)continue;
    const u=((x-a[0])*ez-(z-a[2])*ex)/det,v=(dx*(z-a[2])-dz*(x-a[0]))/det;
    if(u< -1e-6||v< -1e-6||u+v>1+1e-6)continue;
    hits.push({height:a[1]+u*(b[1]-a[1])+v*(c[1]-a[1]),uv:[0,1].map(k=>mesh.uv[ids[0]][k]+u*(mesh.uv[ids[1]][k]-mesh.uv[ids[0]][k])+v*(mesh.uv[ids[2]][k]-mesh.uv[ids[0]][k]))});
  }
  return hits;
}
function outer(mesh,x,z,top) {
  const hits=samples(mesh,x,z).sort((a,b)=>a.height-b.height);
  assert.ok(hits.length,'probe must intersect the actual exported mesh');
  return hits[top?hits.length-1:0];
}
const hashes=asset=>asset.doc.images.map(image=>{const view=asset.doc.bufferViews[image.bufferView];return createHash('sha256').update(asset.bin.subarray(view.byteOffset,view.byteOffset+view.byteLength)).digest('hex');}).sort();

test('curvature export retains textures, material factors, hierarchy and physical controls',()=>{
  assert.deepEqual(hashes(curved),hashes(original));
  assert.deepEqual(curved.doc.materials,original.doc.materials);
  assert.equal(curved.doc.nodes.length,original.doc.nodes.length);
  for(const before of original.doc.nodes) {
    const after=curved.doc.nodes.find(n=>n.name===before.name);assert.ok(after);
    assert.deepEqual(matrix(after).elements,matrix(before).elements);
    assert.deepEqual(after.children?.map(i=>curved.doc.nodes[i].name),before.children?.map(i=>original.doc.nodes[i].name));
    if(before.name==='3DS_XL')assert.deepEqual(after.extras.console_layout,before.extras.console_layout);
    if(!before.name?.startsWith('Button_'))continue;
    const a=nodeMesh(original,before.name),b=nodeMesh(curved,before.name);
    const keys=['POSITION','NORMAL','TANGENT','TEXCOORD_0'];
    for(const key of keys){const aa=attribute(original,a.primitive.attributes[key]),bb=attribute(curved,b.primitive.attributes[key]);
      for(let i=0;i<a.indices.length;i++)for(let j=0;j<aa[0].length;j++)assert.ok(Math.abs(aa[a.indices[i]][j]-bb[b.indices[i]][j])<2e-6,`${before.name} ${key}`);
    }
  }
});

test('actual shell triangles have shallow broad curvature with preserved surface artwork',()=>{
  for(const [name,top,range] of [['Sourced outer lid',true,[.06,.15]],['Sourced graphite chassis',false,[.12,.25]]]) {
    const before=surface(original,name),after=surface(curved,name);
    assert.ok(after.indices.length>before.indices.length*4,'broad faces must contain real additional geometry');
    const centerX=-.21038844,centerZ=top?.336445:5.8;
    const center=outer(after,centerX,centerZ,top).height;
    for(const offset of [-50,50]) {
      const edge=outer(after,centerX+offset,centerZ,top).height;
      const crown=top?center-edge:edge-center;
      assert.ok(crown>range[0]&&crown<range[1],`${name}: measured broad crown ${crown} mm`);
    }
    // Independent vertical ray probes compare the old/new UV interpolation at
    // fixed physical positions, rather than trusting a copied attribute manifest.
    for(const x of [-55,-32,0,32,55])for(const z of [-20,0,20]) {
      const a=outer(before,centerX+x,centerZ+z,top),b=outer(after,centerX+x,centerZ+z,top);
      assert.ok(Math.abs(a.height-b.height)<.45,'bounded shallow deformation');
      assert.ok(Math.hypot(a.uv[0]-b.uv[0],a.uv[1]-b.uv[1])<2e-6,'paint/lettering must not slide across the shell');
    }
  }
});

test('refined mesh exports valid shading frames and keeps the closed footprint',()=>{
  const bounds=[];
  for(const asset of [original,curved]) {
    const box=new Box3();
    for(const node of asset.doc.nodes.filter(n=>n.mesh!==undefined)) {
      const mesh=surface(asset,node.name);
      for(const p of mesh.points)box.expandByPoint(new Vector3(...p));
      if(asset!==curved)continue;
      assert.ok(!Object.keys(mesh.primitive.attributes).some(key=>key.startsWith('_FRAME_')));
      for(const n of mesh.n)assert.ok(Math.abs(Math.hypot(...n)-1)<2e-5);
      if(mesh.primitive.attributes.TANGENT===undefined)continue;
      const tangents=attribute(asset,mesh.primitive.attributes.TANGENT);
      // The preserved auxiliary glass frames were rounded to four decimals by
      // their original Blender export; body frames carry full source precision.
      const tolerance=node.extras?.source_mesh_index===0?2e-5:1e-4;
      for(let i=0;i<tangents.length;i++){const t=tangents[i],n=mesh.n[i];assert.ok(t[3]===1||t[3]===-1);assert.ok(Math.abs(Math.hypot(...t.slice(0,3))-1)<tolerance);assert.ok(Math.abs(n[0]*t[0]+n[1]*t[1]+n[2]*t[2])<tolerance);}
    }
    bounds.push(box.getSize(new Vector3()));
  }
  assert.ok(Math.abs(bounds[0].x-bounds[1].x)<1e-4);
  assert.ok(Math.abs(bounds[0].z-bounds[1].z)<1e-4);
  assert.ok(bounds[1].y<=bounds[0].y+1e-4,'curvature must not increase closed thickness');
});
