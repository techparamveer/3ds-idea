import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BufferGeometry,Float32BufferAttribute,Group,Mesh,PerspectiveCamera,Vector3} from 'three';
import {createConsoleFraming} from '../src/scene/framing.ts';

test('shipped console fits portrait and landscape throughout hinge, rotation, tilt and zoom',()=>{
  const bytes=fs.readFileSync(new URL('../public/models/candidates/joshua-xl.glb',import.meta.url));
  const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  const meshes=[];
  const nodes=doc.nodes.map(n=>{
    const object=new Group();object.name=n.name;
    if(n.matrix)object.applyMatrix4(object.matrix.fromArray(n.matrix));
    else {if(n.translation)object.position.fromArray(n.translation);if(n.rotation)object.quaternion.fromArray(n.rotation);if(n.scale)object.scale.fromArray(n.scale);}
    if(n.mesh!==undefined)for(const primitive of doc.meshes[n.mesh].primitives){
      const a=doc.accessors[primitive.attributes.POSITION],points=[];
      for(const x of [a.min[0],a.max[0]])for(const y of [a.min[1],a.max[1]])for(const z of [a.min[2],a.max[2]])points.push(x,y,z);
      const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(points,3));
      const mesh=new Mesh(geometry);object.add(mesh);meshes.push(mesh);
    }
    return object;
  });
  doc.nodes.forEach((n,i)=>n.children?.forEach(j=>nodes[i].add(nodes[j])));
  const model=new Group(),pivot=new Group();model.scale.setScalar(10);pivot.add(model);
  for(const i of doc.scenes[doc.scene??0].nodes)model.add(nodes[i]);
  const hinge=nodes.find(n=>n.name==='Hinge');assert.ok(hinge);
  const camera=new PerspectiveCamera(33,1,.01,100);camera.position.set(.08,2.45,2.65);camera.lookAt(0,.28,-.15);
  const fit=createConsoleFraming(model,camera),point=new Vector3();
  let poses=0;
  for(const aspect of [390/844,844/390,1280/720,1])for(const angle of [0,30,60,90,120,155])for(const pitch of [-1.65,-.6,0,.6,1.3])for(const scale of [.7,1,1.3])for(let yaw=-Math.PI;yaw<Math.PI;yaw+=Math.PI/8){
    camera.aspect=aspect;hinge.rotation.x=-angle*Math.PI/180;pivot.rotation.set(pitch,yaw,0);pivot.scale.setScalar(scale);pivot.updateMatrixWorld(true);fit();
    for(const mesh of meshes){
      const position=mesh.geometry.attributes.position;
      for(let i=0;i<position.count;i++){
        point.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld).project(camera);
        assert.ok(Math.abs(point.x)<=.880001&&Math.abs(point.y)<=.880001&&Math.abs(point.z)<1,`clipped pose ${aspect},${angle},${pitch},${scale},${yaw}`);
      }
    }
    poses++;
  }
  assert.ok(poses>=5000);
});
