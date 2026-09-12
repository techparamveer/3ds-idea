import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { DirectionalMotion, DIRECTION_VECTOR, createDirectionalRig, clampPad } from '../src/scene/directional-motion.ts';
import { controlCenterInBase } from '../src/scene/model-layout.ts';

test('a quick directional tap tilts toward that edge and returns exactly to centre', () => {
  for(const vector of Object.values(DIRECTION_VECTOR)) {
    const motion=new DirectionalMotion();motion.press('pointer',vector,0);motion.release('pointer');
    for(let t=0;t<=100;t+=10)motion.step(t,.01);
    assert.ok(Math.hypot(motion.vector.x-vector.x,motion.vector.y-vector.y)<.003);
    for(let t=110;t<=800;t+=10)motion.step(t,.01);
    assert.deepEqual(motion.vector,{x:0,y:0});
  }
});

test('diagonal and opposing key holds are bounded and release independently', () => {
  const m=new DirectionalMotion();
  m.press('up',DIRECTION_VECTOR.up,0);m.press('right',DIRECTION_VECTOR.right,0);
  const v=m.step(500,1,true);assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-12);assert.ok(v.x>0&&v.y<0);
  m.release('right');assert.deepEqual(m.step(600,.1,true),DIRECTION_VECTOR.up);
  m.press('down',DIRECTION_VECTOR.down,700);assert.deepEqual(m.step(800,.1,true),{x:0,y:0});
  m.cancel();assert.deepEqual(m.step(900,.1,true),{x:0,y:0});
});

test('circle-pad dragging follows intermediate directions and recentres after cancellation', () => {
  const m=new DirectionalMotion();
  for(let i=0;i<24;i++) {
    const a=i*Math.PI/12;const v={x:Math.cos(a),y:Math.sin(a)};
    m.press('pointer',v,i*50);m.step(i*50,.05,true);
    assert.ok(Math.abs(m.vector.x-v.x)<1e-12&&Math.abs(m.vector.y-v.y)<1e-12);
  }
  assert.deepEqual(clampPad({x:30,y:40}),{x:.6,y:.8});
  m.cancel();for(let i=0;i<80;i++)m.step(2000+i*10,.01);
  assert.deepEqual(m.vector,{x:0,y:0});
});

test('shipped D-pad rocks around its own centre with the opposite arm rising; circle slides without spinning', async () => {
  const file=await readFile(new URL('../public/models/candidates/joshua-xl.glb',import.meta.url));
  const size=file.readUInt32LE(12);const doc=JSON.parse(file.subarray(20,20+size));const binary=file.subarray(28+size);
  for(const [nodeName,name]of [['Button_Dpad','DPAD'],['Button_Circle','CIRCLE']]) {
    const node=doc.nodes.find(n=>n.name===nodeName);const primitive=doc.meshes[node.mesh].primitives[0];
    const accessor=doc.accessors[primitive.attributes.POSITION],view=doc.bufferViews[accessor.bufferView];
    const e=view.extensions?.EXT_meshopt_compression;
    let data=binary,start=(view.byteOffset??0)+(accessor.byteOffset??0);
    if(e){await MeshoptDecoder.ready;data=Buffer.alloc(e.count*e.byteStride);MeshoptDecoder.decodeGltfBuffer(data,e.count,e.byteStride,binary.subarray(e.byteOffset,e.byteOffset+e.byteLength),e.mode,e.filter);start=accessor.byteOffset??0;}
    const stride=view.byteStride??12;
    const positions=[];for(let i=0;i<accessor.count;i++)for(let j=0;j<3;j++)positions.push(data.readFloatLE(start+i*stride+j*4));
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
    const model=new Group();model.scale.setScalar(.01);model.rotation.set(.3,-.4,.1);
    const base=new Group();model.add(base);const cap=new Mesh(geometry,new MeshBasicMaterial());cap.position.fromArray(node.translation);base.add(cap);
    const ink=new Mesh(geometry.clone(),new MeshBasicMaterial());ink.position.copy(cap.position);base.add(ink);
    const center=controlCenterInBase(base,cap),before=cap.matrixWorld.clone();
    const rig=createDirectionalRig(base,center,[cap,ink]);model.updateMatrixWorld(true);
    for(let i=0;i<16;i++)assert.ok(Math.abs(cap.matrixWorld.elements[i]-before.elements[i])<1e-10);
    for(const vector of Object.values(DIRECTION_VECTOR)) {
      rig.apply(name,vector);model.updateMatrixWorld(true);
      if(name==='DPAD') {
        const pressed=new Vector3(vector.x*8,3,vector.y*8),opposite=new Vector3(-vector.x*8,3,-vector.y*8);
        const py=base.worldToLocal(rig.pivot.localToWorld(pressed)).y;
        const oy=base.worldToLocal(rig.pivot.localToWorld(opposite)).y;
        assert.ok(py<center.y+3-.4,'pressed edge must go into the deck');
        assert.ok(oy>center.y+3+.3,'opposite edge must rise');
      } else {
        assert.ok(Math.abs(rig.pivot.position.distanceTo(center)-1.5)<1e-10);
        assert.equal(rig.pivot.rotation.x,0);assert.equal(rig.pivot.rotation.z,0);
      }
      assert.ok(cap.matrixWorld.equals(ink.matrixWorld),'print must follow the cap');
    }
    rig.apply(name,{x:0,y:0});model.updateMatrixWorld(true);
    for(let i=0;i<16;i++)assert.ok(Math.abs(cap.matrixWorld.elements[i]-before.elements[i])<1e-10);
    assert.deepEqual(Array.from(geometry.attributes.position.array),positions,'rig must not alter source vertices');
  }
});
