import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const folder = new URL('../model/candidates/joshua-xl/', import.meta.url);
const report = JSON.parse(readFileSync(new URL('component-report.json', folder), 'utf8'));
const rig = JSON.parse(readFileSync(new URL('rig-report.json', folder), 'utf8'));
async function load() {
  const bytes = readFileSync(new URL('rigged-geometry.glb', folder));
  return new Promise((resolve, reject) => new GLTFLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '', resolve, reject));
}

test('source partition preserves every original triangle and UV-bearing part', async () => {
  const { scene } = await load();
  const meshes = [];
  scene.traverse(o => { if (o.isMesh) meshes.push(o); });
  const components = report.meshes.flatMap(m => m.components);
  assert.equal(meshes.length, components.length);
  for (const meshReport of report.meshes) {
    const indices = meshReport.components.flatMap(c => c.triangle_indices);
    assert.equal(new Set(indices).size, indices.length);
    assert.equal(Math.max(...indices), indices.length - 1);
    for (const component of meshReport.components) {
      const mesh = meshes.find(m => m.userData.source_mesh_index === meshReport.mesh_index
        && m.userData.source_component_id === component.id);
      assert.ok(mesh);
      assert.equal(mesh.geometry.index.count / 3, component.triangles);
      assert.equal(mesh.geometry.attributes.uv.count, mesh.geometry.attributes.position.count);
      assert.equal(mesh.geometry.attributes.normal.count, mesh.geometry.attributes.position.count);
    }
  }
  assert.equal(scene.getObjectByName('3DS_XL').userData.texture_download_complete, false);
});

test('source rig exports closed with an unrotated root and independent controls', async () => {
  const { scene } = await load();
  const root = scene.getObjectByName('3DS_XL');
  const hinge = scene.getObjectByName('Hinge');
  assert.ok(root.quaternion.angleTo(root.quaternion.clone().identity()) < 1e-7);
  assert.ok(Math.abs(hinge.rotation.x) < 1e-7);
  assert.equal(scene.getObjectByName('Screen_Top').parent, hinge);
  assert.equal(scene.getObjectByName('Screen_Bottom').parent.name, 'Base');
  for (const name of rig.control_names) assert.equal(scene.getObjectByName(name).parent.name, 'Base');
  const mm = new Box3().setFromObject(scene, true).getSize(new Vector3()).multiplyScalar(1000);
  // Blender Z-up becomes glTF Y-up. Preserve the measured source proportions;
  // this assertion intentionally does not label them the exact Nintendo envelope.
  const expected = [rig.closed_dimensions_mm[0], rig.closed_dimensions_mm[2], rig.closed_dimensions_mm[1]];
  mm.toArray().forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 0.001));
  const baseBefore = scene.getObjectByName('Button_A').getWorldPosition(new Vector3());
  for (const degrees of [0, 45, 90, 150, 155]) {
    hinge.rotation.x = -degrees * Math.PI / 180;
    scene.updateMatrixWorld(true);
    assert.ok(scene.getObjectByName('Button_A').getWorldPosition(new Vector3()).distanceTo(baseBefore) < 1e-9);
    const bounds = new Box3().setFromObject(scene, true);
    assert.ok([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite));
  }
});
