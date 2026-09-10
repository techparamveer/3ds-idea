import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Box3, Matrix4, Quaternion, Vector3} from 'three';

function load(name) {
  const bytes=fs.readFileSync(new URL('../model/candidates/joshua-xl/'+name,import.meta.url));
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const size=bytes.readUInt32LE(12);
  return {doc:JSON.parse(bytes.subarray(20,20+size)),bin:bytes.subarray(28+size)};
}
for (const [baseline, candidate, pass, preserveClearance] of [
  ['silver-eur.glb', 'silver-dimensions.glb', 'dimensions', true],
  ['silver-dimensions.glb', 'silver-front.glb', 'front aperture', false],
]) {
const before=load(baseline),after=load(candidate);
function attribute(asset,index) {
  const a=asset.doc.accessors[index],v=asset.doc.bufferViews[a.bufferView];
  const columns={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
  const [size,method]={5123:[2,'readUInt16LE'],5125:[4,'readUInt32LE'],5126:[4,'readFloatLE']}[a.componentType];
  return Array.from({length:a.count},(_,i)=>Array.from({length:columns},(_,j)=>asset.bin[method]((v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??columns*size)+j*size)));
}
function inRoot(asset,node,angle=0) {
  if(node.name==='3DS_XL')return new Matrix4();
  const rotation=node.name==='Hinge'?new Quaternion().setFromAxisAngle(new Vector3(1,0,0),-angle):new Quaternion(...(node.rotation??[0,0,0,1]));
  const local=node.matrix?new Matrix4().fromArray(node.matrix):new Matrix4().compose(new Vector3(...(node.translation??[0,0,0])),rotation,new Vector3(...(node.scale??[1,1,1])));
  const parent=asset.doc.nodes.find(n=>n.children?.includes(asset.doc.nodes.indexOf(node)));
  return inRoot(asset,parent,angle).multiply(local);
}
function surface(asset,node,angle=0) {
  const primitive=asset.doc.meshes[node.mesh].primitives[0],matrix=inRoot(asset,node,angle);
  return {node,primitive,points:attribute(asset,primitive.attributes.POSITION).map(p=>new Vector3(...p).applyMatrix4(matrix).toArray()),
    indices:attribute(asset,primitive.indices).flat()};
}
function surfaces(asset) {
  return new Map(asset.doc.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.name,surface(asset,n)]));
}
const old=surfaces(before),current=surfaces(after);
function imageHashes(asset) {
  return asset.doc.images.map(image=>{
    const v=asset.doc.bufferViews[image.bufferView];
    return createHash('sha256').update(asset.bin.subarray(v.byteOffset,v.byteOffset+v.byteLength)).digest('hex');
  });
}
function containsPoint(points,tolerance) {
  const buckets=new Map(),dimension=points[0].length;
  for(const p of points){const key=p.map(x=>Math.round(x/tolerance)).join(',');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(p);}
  const offsets=dimension===2?[-1,0,1].flatMap(x=>[-1,0,1].map(y=>[x,y])):[-1,0,1].flatMap(x=>[-1,0,1].flatMap(y=>[-1,0,1].map(z=>[x,y,z])));
  return p=>{
    const cell=p.map(x=>Math.round(x/tolerance));
    return offsets.some(offset=>(buckets.get(cell.map((x,i)=>x+offset[i]).join(','))??[]).some(q=>Math.hypot(...p.map((x,i)=>x-q[i]))<=tolerance));
  };
}
function heights(mesh,x,z) {
  const hits=[];
  for(let i=0;i<mesh.indices.length;i+=3) {
    const [a,b,c]=mesh.indices.slice(i,i+3).map(index=>mesh.points[index]);
    if(x<Math.min(a[0],b[0],c[0])-1e-6||x>Math.max(a[0],b[0],c[0])+1e-6||z<Math.min(a[2],b[2],c[2])-1e-6||z>Math.max(a[2],b[2],c[2])+1e-6)continue;
    const dx=b[0]-a[0],dz=b[2]-a[2],ex=c[0]-a[0],ez=c[2]-a[2],det=dx*ez-dz*ex;
    if(Math.abs(det)<1e-10)continue;
    const u=((x-a[0])*ez-(z-a[2])*ex)/det,v=(dx*(z-a[2])-dz*(x-a[0]))/det;
    if(u>=-1e-6&&v>=-1e-6&&u+v<=1+1e-6)hits.push(a[1]+u*(b[1]-a[1])+v*(c[1]-a[1]));
  }
  return hits;
}
function underHinge(asset,node) {
  for(let parent=node;parent;parent=asset.doc.nodes.find(n=>n.children?.includes(asset.doc.nodes.indexOf(parent)))) {
    if(parent.name==='Hinge')return true;
  }
  return false;
}
function clearance(asset,meshes,name) {
  const control=meshes.get(name),top=Math.max(...control.points.map(p=>p[1]));
  const lid=[...meshes.values()].filter(m=>underHinge(asset,m.node)&&!m.node.extras?.console_replace_with_display);
  const gaps=[];
  for(const p of control.points) {
    if(p[1]<top-.5)continue;
    const hits=lid.flatMap(mesh=>heights(mesh,p[0],p[2]));
    if(hits.length)gaps.push(Math.min(...hits)-p[1]);
  }
  assert.ok(gaps.length>10,name+' needs actual cap/lid overlap probes');
  return Math.min(...gaps);
}

test(`${pass}: sourced export meets the published closed envelope with retained images, UVs and rigid controls`,()=>{
  const box=new Box3();
  for(const mesh of current.values())for(const p of mesh.points)box.expandByPoint(new Vector3(...p));
  const size=box.getSize(new Vector3());
  for(const [value,target] of [[size.x,156],[size.y,22],[size.z,93]])assert.ok(Math.abs(value-target)<2e-5,`${value} != ${target} mm`);
  const root=after.doc.nodes.find(n=>n.name==='3DS_XL');
  for(const scale of root.scale)assert.ok(Math.abs(scale-.001)<1e-9,'GLB root converts mm to metres');
  assert.deepEqual(imageHashes(after),imageHashes(before));
  assert.deepEqual(after.doc.materials,before.doc.materials);
  assert.deepEqual(after.doc.samplers,before.doc.samplers);
  assert.equal(current.size,68);
  const triangles=[...current.values()].reduce((sum,m)=>sum+m.indices.length/3,0);
  assert.ok(triangles>59986&&triangles<200000,'Local refinement must remain a bounded web asset');
  for(const [name,a] of old) {
    const b=current.get(name);assert.ok(b);
    if(pass==='front aperture'&&name!=='Sourced inner lid') {
      assert.deepEqual(a.points,b.points,name+' geometry must remain unchanged');
      for(const key of Object.keys(a.primitive.attributes))assert.deepEqual(attribute(before,a.primitive.attributes[key]),attribute(after,b.primitive.attributes[key]),name+' '+key);
    }
    const uvA=attribute(before,a.primitive.attributes.TEXCOORD_0),uvB=attribute(after,b.primitive.attributes.TEXCOORD_0);
    if(a.indices.length===b.indices.length){
      for(let i=0;i<a.indices.length;i++)for(let j=0;j<2;j++)assert.ok(Math.abs(uvA[a.indices[i]][j]-uvB[b.indices[i]][j])<1e-7,`${name} UV corner`);
    }else{
      assert.ok(['Sourced inner lid','Sourced graphite chassis'].includes(name));
      assert.ok(b.indices.length>a.indices.length);
      const contains=containsPoint(uvB,1e-7);
      for(const uv of uvA)assert.ok(contains(uv),`${name} original UV sample`);
    }
    if(!name.startsWith('Button_'))continue;
    assert.deepEqual(a.indices,b.indices);
    for(const key of Object.keys(a.primitive.attributes))assert.deepEqual(attribute(before,a.primitive.attributes[key]),attribute(after,b.primitive.attributes[key]),name+' '+key);
  }
});

test(`${pass}: closed caps retain clearance and both hinge sections stay circular`,()=>{
  for(const name of ['Button_A','Button_B','Button_Circle','Button_Dpad','Button_HOME','Button_POWER','Button_SELECT','Button_START','Button_X','Button_Y']) {
    const a=clearance(before,old,name),b=clearance(after,current,name);
    assert.ok(b>.008,`${name} penetrates or loses closed clearance: ${b} mm`);
    // Narrowing the bezel brings its underside over Y, which was previously
    // under the glass. It must stay clear, but its old gap is not an invariant.
    if(preserveClearance||name!=='Button_Y')assert.ok(Math.abs(a-b)<3e-5,`${name} clearance changed: ${a} -> ${b}`);
    else assert.ok(b>.4,`Y needs clearance beneath the narrower bezel: ${b}`);
  }
  const hingeA=new Vector3(...before.doc.nodes.find(n=>n.name==='Hinge').translation);
  const hingeB=new Vector3(...after.doc.nodes.find(n=>n.name==='Hinge').translation);
  const shift=hingeB.sub(hingeA);
  for(const name of ['Sourced inner lid','Sourced graphite chassis']) {
    const a=old.get(name),b=current.get(name);let count=0;
    const contains=containsPoint(b.points,3e-5);
    for(const p of a.points) {
      if(p[2]>-34.3||p[1]<11.05)continue;
      assert.ok(contains(new Vector3(...p).add(shift).toArray()),name+' barrel must translate rigidly');
      count++;
    }
    assert.ok(count>100,'Each actual hinge section needs enough geometry probes');
  }
});

test(`${pass}: broad shell crown and physical display sizes survive the hinge range`,()=>{
  for(const [name,top,z] of [['Sourced outer lid',true,.336445],['Sourced graphite chassis',false,5.8]]) {
    const crown=mesh=>{
      const sample=x=>{const hits=heights(mesh,x,z);assert.ok(hits.length);return top?Math.max(...hits):Math.min(...hits);};
      const center=sample(-.21038844),edge=(sample(-50.21038844)+sample(49.78961156))/2;
      return top?center-edge:edge-center;
    };
    const a=crown(old.get(name)),b=crown(current.get(name));
    assert.ok(b>(top?.06:.12),'Broad face must retain measurable geometry curvature');
    assert.ok(Math.abs(a-b)<3e-5,'Thinning must retain the established crown');
  }
  for(const degrees of [0,30,90,155])for(const [anchorName,glassName,width,height] of [
    ['DisplayAnchor_Top','Screen_Top',106.2,63.72],['DisplayAnchor_Bottom','Screen_Bottom',84.96,63.72],
  ]) {
    const anchor=after.doc.nodes.find(n=>n.name===anchorName),angle=degrees*Math.PI/180,m=inRoot(after,anchor,angle);
    const center=new Vector3().applyMatrix4(m),normal=new Vector3(0,0,1).transformDirection(m);
    const point=(x,y)=>new Vector3(x,y,0).applyMatrix4(m);
    assert.ok(Math.abs(point(-width/2,0).distanceTo(point(width/2,0))-width)<1e-5);
    assert.ok(Math.abs(point(0,-height/2).distanceTo(point(0,height/2))-height)<1e-5);
    const glass=surface(after,after.doc.nodes.find(n=>n.name===glassName),angle);
    for(const p of glass.points)assert.ok(Math.abs(center.clone().sub(new Vector3(...p)).dot(normal)-.02)<1e-5,'Live LCD must remain coplanar and .02 mm in front of glass');
  }
  if(pass==='front aperture') {
    const inner=current.get('Sourced inner lid'),glass=current.get('Screen_Top');
    const center=new Vector3().applyMatrix4(inRoot(after,after.doc.nodes.find(n=>n.name==='DisplayAnchor_Top')));
    const glassHeight=glass.points[0][1];
    const blocked=(x,z)=>heights(inner,x,z).some(y=>y>13&&y<glassHeight);
    for(const sign of [-1,1]) {
      assert.equal(blocked(center.x+sign*56,center.z),false,'112 mm aperture must expose the glass');
      assert.equal(blocked(center.x+sign*56.1,center.z),true,'Aperture must stop before 112.2 mm');
    }
    for(const x of [-53.1,-26.55,0,26.55,53.1])for(const z of [-31.86,-15.93,0,15.93,31.86])
      assert.equal(blocked(center.x+x,center.z+z),false,'The new bezel must not cover the active LCD');
  }
});
}
