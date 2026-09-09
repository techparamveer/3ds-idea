import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Matrix4, Quaternion, Vector3, Box3 } from 'three';
const data=fs.readFileSync(new URL('../public/models/silver-3ds-xl.glb',import.meta.url));
const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
function componentBounds(name){
 const node=gltf.nodes.find(n=>n.name===name);assert.ok(node,`${name} is missing`);
 const bounds=new Box3(),matrix=new Matrix4();
 if(node.matrix)matrix.fromArray(node.matrix);
 else matrix.compose(new Vector3(...(node.translation??[0,0,0])),new Quaternion(...(node.rotation??[0,0,0,1])),new Vector3(...(node.scale??[1,1,1])));
 for(const primitive of gltf.meshes[node.mesh].primitives){const a=gltf.accessors[primitive.attributes.POSITION];bounds.union(new Box3(new Vector3(...a.min),new Vector3(...a.max)).applyMatrix4(matrix));}
 return bounds;
}
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
 const root=gltf.nodes.find(n=>n.name==='3DS_XL');assert.deepEqual(root.extras.upper_screen_mm,[106.2,63.72]);
 assert.deepEqual(root.extras.lower_screen_mm,[84.96,63.72]);
});
test('Every textured glTF primitive has a valid UV channel',()=>{
 for(const mesh of gltf.meshes)for(const p of mesh.primitives){const m=gltf.materials[p.material],tx=m.pbrMetallicRoughness?.metallicRoughnessTexture;if(tx){assert.ok((tx.texCoord??0)>=0);assert.ok(p.attributes[`TEXCOORD_${tx.texCoord??0}`]!==undefined,`${mesh.name} has no paint UVs`);}}
});
test('Front, back and silicone materials retain color, roughness and normal maps',()=>{
 for(const name of ['Satin silver metallic paint','Graphite ABS','Circle pad silicone']){
  const materials=gltf.materials.filter(m=>m.name===name);assert.ok(materials.length,`${name} is missing`);
  for(const m of materials){
  for(const tx of [m.pbrMetallicRoughness.baseColorTexture,m.pbrMetallicRoughness.metallicRoughnessTexture,m.normalTexture]){
   assert.ok(tx,`${name} lost an authored material map`);assert.equal(tx.texCoord??0,0,`${name} must share the runtime UV channel`);
   const texture=gltf.textures[tx.index];assert.ok(gltf.images[texture.source]?.bufferView!==undefined,`${name} must embed its image`);
  }}
 }
});
test('Each ABXY socket follows its cap and the membrane keys do not intersect',()=>{
 for(const letter of 'ABXY'){
  const cap=componentBounds('Button_'+letter),socket=componentBounds('Button socket '+letter);
  const a=cap.getCenter(new Vector3()),b=socket.getCenter(new Vector3());
  assert.ok(Math.abs(a.x-b.x)<.001&&Math.abs(a.z-b.z)<.001,`${letter} socket is offset from its cap`);
  assert.ok(socket.getSize(new Vector3()).x>cap.getSize(new Vector3()).x);
 }
 const keys=['SELECT','HOME','START'].map(n=>componentBounds('Button_'+n));
 assert.ok(keys[0].max.x<keys[1].min.x&&keys[1].max.x<keys[2].min.x,'membrane caps intersect');
 assert.ok(keys[1].getSize(new Vector3()).x>keys[0].getSize(new Vector3()).x,'HOME must be the wider centre key');
});
test('Upper face clears closed controls and the LCD sits behind its surround',()=>{
 const face=componentBounds('Inner lid graphite face'),glass=componentBounds('Screen_Top');
 const hinge=gltf.nodes.find(n=>n.name==='Hinge');
 const dpad=componentBounds('Button_Dpad');
 assert.ok(face.min.y+hinge.translation[1]-dpad.max.y>.1,'lid face intersects closed D-pad');
 assert.ok(glass.min.y>face.min.y,'upper glass protrudes beyond the inner face');
});
test('Original XL ports have the correct handedness and side stylus position',()=>{
 assert.ok(componentBounds('Charging socket').getCenter(new Vector3()).x>0);
 assert.ok(componentBounds('IR port').getCenter(new Vector3()).x<0);
 assert.ok(Math.abs(componentBounds('Cartridge slot').getCenter(new Vector3()).x)<.001);
 assert.ok(!gltf.nodes.some(n=>n.name==='Stylus socket'),'obsolete rear stylus opening remains');
 const stylus=componentBounds('Stylus holder sleeve').getCenter(new Vector3());
 assert.ok(stylus.x>70&&Math.abs(stylus.z)<5,'stylus holder is not midway along the right side');
});
