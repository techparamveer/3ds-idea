import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Group, Mesh, Box3, BoxGeometry, MeshStandardMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { resolveModelLayout, directionFromControlHit, isSilverPaintMaterial, DEFAULT_MODEL_URL } from '../src/scene/model-layout.ts';

function fixture() {
  const model = new Group();
  const root = new Group();root.name = '3DS_XL';root.scale.setScalar(.001);model.add(root);
  const base = new Group();base.name = 'Base';root.add(base);
  const hinge = new Group();hinge.name = 'Hinge';hinge.position.set(0, 16, -40);root.add(hinge);
  return { model, root, base, hinge };
}

function cap(parent, name, position, bakedOffset = [0, 0, 0]) {
  const geometry = new BoxGeometry(10, 2, 10);geometry.translate(...bakedOffset);
  const mesh = new Mesh(geometry, new MeshStandardMaterial());mesh.name = name;mesh.position.set(...position);parent.add(mesh);return mesh;
}

test('preserved legacy asset keeps its original screen placements', () => {
  const { model, base, hinge } = fixture();
  const layout = resolveModelLayout(model);
  assert.equal(layout.source, 'legacy');
  assert.equal(layout.screens.top.parent, hinge);
  assert.equal(layout.screens.bottom.parent, base);
  assert.deepEqual(layout.screens.top.position.toArray(), [0, .145, 43.5]);
  assert.deepEqual(layout.screens.bottom.position.toArray(), [0, 13.83, 1]);
});

test('homepage serves the verified silver source export', async () => {
  const shipped = await readFile(new URL('../public' + DEFAULT_MODEL_URL, import.meta.url));
  const verified = await readFile(new URL('../model/candidates/joshua-xl/silver-source.glb', import.meta.url));
  assert.ok(shipped.equals(verified), 'default website asset must match the verified silver export');
});

test('source anchors replace old offsets and follow their own hierarchy', () => {
  const { model, root, base, hinge } = fixture();root.userData.source_author = 'Source creator';
  const top = new Group();top.name = 'DisplayAnchor_Top';top.position.set(.7, -.966, 38);top.rotation.x = Math.PI / 2;hinge.add(top);
  const bottom = new Group();bottom.name = 'DisplayAnchor_Bottom';bottom.position.set(-.2, 12.3, 2);bottom.rotation.x = -Math.PI / 2;base.add(bottom);
  root.userData.console_layout = { version: 1, screens: {
    top: { anchor: top.name, width_mm: 106.2, height_mm: 63.72 },
    bottom: { anchor: bottom.name, width_mm: 84.96, height_mm: 63.72 },
  } };
  const before = top.position.clone();
  const layout = resolveModelLayout(model);
  assert.equal(layout.source, 'metadata');
  assert.equal(layout.screens.top.parent, top);
  assert.deepEqual(layout.screens.top.position.toArray(), [0, 0, 0]);
  assert.deepEqual(layout.screens.top.quaternion.toArray(), [0, 0, 0, 1]);
  assert.deepEqual(top.position, before);
  assert.equal(layout.screens.top.widthMm, 106.2);
  assert.equal(layout.screens.bottom.widthMm, 84.96);
  hinge.rotation.x = -155 * Math.PI / 180;
  model.updateMatrixWorld(true);
  assert.equal(layout.screens.top.parent.parent, hinge);
});

test('source screens without explicit anchors and anchors under the wrong assembly fail explicitly', () => {
  const { model, root, base } = fixture();root.userData.source_author = 'Source creator';
  assert.throws(() => resolveModelLayout(model), /explicit console_layout/);
  const anchor = new Group();anchor.name = 'wrong';base.add(anchor);
  root.userData.console_layout = { version: 1, screens: {
    top: { anchor: anchor.name, width_mm: 106.2, height_mm: 63.72 },
    bottom: { anchor: anchor.name, width_mm: 84.96, height_mm: 63.72 },
  } };
  assert.throws(() => resolveModelLayout(model), /top screen anchor must belong to Hinge/);
  root.userData.console_layout.version = 2;
  assert.throws(() => resolveModelLayout(model), /unsupported layout/);
});

test('authored screen axes preserve image orientation and physical width through the full hinge range', () => {
  const { model, root, base, hinge } = fixture();
  const top = new Group();top.name = 'DisplayAnchor_Top';top.position.set(.7, -.966, 38);top.rotation.x = Math.PI / 2;hinge.add(top);
  const bottom = new Group();bottom.name = 'DisplayAnchor_Bottom';bottom.position.set(-.2, 12.3, 2);bottom.rotation.x = -Math.PI / 2;base.add(bottom);
  root.userData.console_layout = { version: 1, screens: {
    top: { anchor: top.name, width_mm: 106.2, height_mm: 63.72 },
    bottom: { anchor: bottom.name, width_mm: 84.96, height_mm: 63.72 },
  } };
  const layout = resolveModelLayout(model);
  for (const degrees of [0, 30, 90, 155]) {
    const angle = degrees * Math.PI / 180;hinge.rotation.x = -angle;model.updateMatrixWorld(true);
    const normal = new Vector3(0, 0, 1).transformDirection(layout.screens.top.parent.matrixWorld);
    const imageUp = new Vector3(0, 1, 0).transformDirection(layout.screens.top.parent.matrixWorld);
    assert.ok(normal.distanceTo(new Vector3(0, -Math.cos(angle), Math.sin(angle))) < 1e-10, `top normal at ${degrees}°`);
    assert.ok(imageUp.distanceTo(new Vector3(0, Math.sin(angle), Math.cos(angle))) < 1e-10, `top image-up at ${degrees}°`);
    const lowerNormal = new Vector3(0, 0, 1).transformDirection(layout.screens.bottom.parent.matrixWorld);
    const lowerUp = new Vector3(0, 1, 0).transformDirection(layout.screens.bottom.parent.matrixWorld);
    assert.ok(lowerNormal.distanceTo(new Vector3(0, 1, 0)) < 1e-10);
    assert.ok(lowerUp.distanceTo(new Vector3(0, 0, -1)) < 1e-10);
    const left = top.localToWorld(new Vector3(-layout.screens.top.widthMm / 2, 0, 0));
    const right = top.localToWorld(new Vector3(layout.screens.top.widthMm / 2, 0, 0));
    assert.ok(Math.abs(left.distanceTo(right) - .1062) < 1e-10);
  }
});

test('directional hits use source control bounds despite baked vertices and scene rotation', () => {
  const { model, base } = fixture();
  const dpad = cap(base, 'Button_Dpad', [-2, 0, 3], [-60, 13, 8.5]);dpad.userData.press_travel_mm = .18;
  cap(base, 'Button_Circle', [-62.2, 13.9, -15.1]);
  model.rotation.set(.25, -.7, .08);model.scale.setScalar(10);
  const layout = resolveModelLayout(model);
  const center = layout.controls.get('DPAD').centerInBase;
  assert.ok(center.distanceTo(new Vector3(-62, 13, 11.5)) < 1e-8);
  assert.equal(layout.controls.get('DPAD').pressTravelMm, .18);
  for (const [direction, offset] of [['left', [-3, 0, 0]], ['right', [3, 0, 0]], ['up', [0, 0, -3]], ['down', [0, 0, 3]]]) {
    const point = base.localToWorld(center.clone().add(new Vector3(...offset)));
    assert.equal(directionFromControlHit(layout, 'DPAD', point), direction);
  }
  const point = base.localToWorld(new Vector3(-62.2, 13.9, -18.1));
  assert.equal(directionFromControlHit(layout, 'CIRCLE', point), 'up');
});

test('VGPU recognizes explicit silver roles without recoloring unclassified source material', () => {
  const material = new MeshStandardMaterial();material.name = 'Source geometry inspection — textures pending';
  assert.equal(isSilverPaintMaterial(material), false);
  material.userData.console_material_role = 'silver-paint';
  assert.equal(isSilverPaintMaterial(material), true);
  material.name = 'Satin silver metallic paint';material.userData.console_material_role = 'graphite-abs';
  assert.equal(isSilverPaintMaterial(material), false);
  delete material.userData.console_material_role;
  assert.equal(isSilverPaintMaterial(material), true);
});

test('actual sourced GLB anchors keep authored orientation, sizes and control hit centers without altering geometry', async () => {
  const path = new URL('../model/candidates/joshua-xl/rigged-geometry.glb', import.meta.url);
  const file = await readFile(path);
  const gltf = await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), '');
  const model = gltf.scene;
  const geometryHash = () => {
    const hash = createHash('sha256');
    model.traverse(object => {
      if (!(object instanceof Mesh)) return;
      for (const [name, attribute] of Object.entries(object.geometry.attributes)) {
        hash.update(name);const array = attribute.array;
        hash.update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
      }
      const index = object.geometry.index?.array;
      if (index) hash.update(new Uint8Array(index.buffer, index.byteOffset, index.byteLength));
    });
    return hash.digest('hex');
  };
  const originalGeometry = geometryHash();
  const originalTransforms = [];
  model.traverse(object => originalTransforms.push([object.uuid, object.position.toArray(), object.quaternion.toArray(), object.scale.toArray()]));
  const layout = resolveModelLayout(model);
  assert.equal(layout.source, 'metadata');
  assert.equal(layout.controls.size, 12);
  const afterTransforms = [];
  model.traverse(object => afterTransforms.push([object.uuid, object.position.toArray(), object.quaternion.toArray(), object.scale.toArray()]));
  assert.deepEqual(afterTransforms, originalTransforms, 'resolving metadata must preserve rest transforms');
  const replacements = [];
  model.traverse(object => { if (object.userData.console_replace_with_display === true) replacements.push(object.name); });
  assert.deepEqual(replacements.sort(), ['Source_1_part_03', 'Source_1_part_04']);

  for (const degrees of [0, 30, 90, 155]) {
    const angle = degrees * Math.PI / 180;layout.hinge.rotation.x = -angle;model.updateMatrixWorld(true);
    const topNormal = new Vector3(0, 0, 1).transformDirection(layout.screens.top.parent.matrixWorld);
    const topUp = new Vector3(0, 1, 0).transformDirection(layout.screens.top.parent.matrixWorld);
    assert.ok(topNormal.distanceTo(new Vector3(0, -Math.cos(angle), Math.sin(angle))) < 2e-6, `exported top normal at ${degrees}°`);
    assert.ok(topUp.distanceTo(new Vector3(0, Math.sin(angle), Math.cos(angle))) < 2e-6, `exported top image-up at ${degrees}°`);
    assert.ok(new Vector3(0, 0, 1).transformDirection(layout.screens.bottom.parent.matrixWorld).distanceTo(new Vector3(0, 1, 0)) < 2e-6);
    for (const [id, width, height] of [['top', .1062, .06372], ['bottom', .08496, .06372]]) {
      const screen = layout.screens[id];
      const left = screen.parent.localToWorld(new Vector3(-screen.widthMm / 2, 0, 0));
      const right = screen.parent.localToWorld(new Vector3(screen.widthMm / 2, 0, 0));
      const upper = screen.parent.localToWorld(new Vector3(0, screen.heightMm / 2, 0));
      const lower = screen.parent.localToWorld(new Vector3(0, -screen.heightMm / 2, 0));
      assert.ok(Math.abs(left.distanceTo(right) - width) < 1e-7, `${id} authored width at ${degrees}°`);
      assert.ok(Math.abs(upper.distanceTo(lower) - height) < 1e-7, `${id} authored height at ${degrees}°`);
      const glass = model.getObjectByName(id === 'top' ? 'Screen_Top' : 'Screen_Bottom');
      assert.ok(glass);
      const glassCenter = new Box3().setFromObject(glass).getCenter(new Vector3());
      const screenCenter = screen.parent.getWorldPosition(new Vector3());
      const facing = new Vector3(0, 0, 1).transformDirection(screen.parent.matrixWorld);
      const clearance = screenCenter.sub(glassCenter).dot(facing);
      assert.ok(clearance > .000015 && clearance < .000025, `${id} plane should sit .02 mm in front of source glass`);
    }
  }

  model.rotation.set(.25, -.7, .08);model.scale.setScalar(10);model.updateMatrixWorld(true);
  for (const name of ['DPAD', 'CIRCLE']) {
    const control = layout.controls.get(name);
    const meshCenter = layout.base.worldToLocal(new Box3().setFromObject(control.object).getCenter(new Vector3()));
    assert.ok(control.centerInBase.distanceTo(meshCenter) < 1e-4);
    for (const [direction, offset] of [['left', [-3, 0, 0]], ['right', [3, 0, 0]], ['up', [0, 0, -3]], ['down', [0, 0, 3]]]) {
      const worldPoint = layout.base.localToWorld(control.centerInBase.clone().add(new Vector3(...offset)));
      assert.equal(directionFromControlHit(layout, name, worldPoint), direction);
    }
  }
  assert.equal(geometryHash(), originalGeometry, 'anchor resolution and hinge movement must preserve vertex, normal, UV and index arrays');
  assert.ok(file.equals(await readFile(path)), 'source GLB must remain unchanged');
});
