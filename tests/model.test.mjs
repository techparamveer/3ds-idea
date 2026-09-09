import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Matrix4, Quaternion, Vector3, Box3 } from 'three';
const data=fs.readFileSync(new URL('../public/models/silver-3ds-xl.glb',import.meta.url));
const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
test('Exported model has the requested closed physical dimensions in metres',()=>{
 const bounds=new Box3();
 function visit(i,parent){const n=gltf.nodes[i],m=new Matrix4();if(n.matrix)m.fromArray(n.matrix);else m.compose(new Vector3(...(n.translation??[0,0,0])),new Quaternion(...(n.rotation??[0,0,0,1])),new Vector3(...(n.scale??[1,1,1])));m.premultiply(parent);
  if(n.mesh!==undefined)for(const p of gltf.meshes[n.mesh].primitives){const a=gltf.accessors[p.attributes.POSITION];bounds.union(new Box3(new Vector3(...a.min),new Vector3(...a.max)).applyMatrix4(m));}
  for(const child of n.children??[])visit(child,m);
 }
 for(const i of gltf.scenes[gltf.scene??0].nodes)visit(i,new Matrix4());
 const actual=bounds.getSize(new Vector3()).toArray();[.156,.022,.093].forEach((v,i)=>assert.ok(Math.abs(actual[i]-v)<.00002,`${actual} doesn't match 156 × 93 × 22 mm`));
});
test('Export retains the movable hinge, touch panels, and original XL controls',()=>{
 const names=new Set(gltf.nodes.map(n=>n.name));for(const n of ['Hinge','Base','Screen_Top','Screen_Bottom','Button_A','Button_B','Button_X','Button_Y','Button_Dpad','Button_Circle','Button_HOME','Button_SELECT','Button_START','Button_POWER'])assert.ok(names.has(n),`${n} is missing`);
 const hinge=gltf.nodes.find(n=>n.name==='Hinge');assert.equal(hinge.extras.max_angle_deg,155);assert.equal(hinge.extras.min_angle_deg,0);
 const root=gltf.nodes.find(n=>n.name==='3DS_XL');const [w,h]=root.extras.upper_screen_mm;assert.ok(Math.abs(Math.hypot(w,h)/25.4-4.88)<.00001);
 const [bw,bh]=root.extras.lower_screen_mm;assert.ok(Math.abs(Math.hypot(bw,bh)/25.4-4.18)<.00001);
});
test('Every textured glTF primitive has a valid UV channel',()=>{
 for(const mesh of gltf.meshes)for(const p of mesh.primitives){const m=gltf.materials[p.material],tx=m.pbrMetallicRoughness?.metallicRoughnessTexture;if(tx){assert.ok((tx.texCoord??0)>=0);assert.ok(p.attributes[`TEXCOORD_${tx.texCoord??0}`]!==undefined,`${mesh.name} has no paint UVs`);}}
});
