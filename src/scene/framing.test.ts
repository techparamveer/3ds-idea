import assert from 'node:assert/strict';
import test from 'node:test';
import { BoxGeometry, Mesh, PerspectiveCamera, Vector3 } from 'three';
import { createConsoleFraming } from './framing.ts';

function portrait() {
  const camera = new PerspectiveCamera(33, 390 / 844, .01, 100);
  camera.position.set(.08, 2.45, 2.65); camera.lookAt(0, .28, -.15);
  const shell = new Mesh(new BoxGeometry(1.56, .22, .93));
  shell.updateMatrixWorld(true);
  return { camera, shell, fit: createConsoleFraming(shell, camera) };
}
function projectedY(camera: PerspectiveCamera, shell: Mesh) {
  camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  const box = shell.geometry.boundingBox!, ys: number[] = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) ys.push(new Vector3(x, y, z).project(camera).y);
  return { min: Math.min(...ys), max: Math.max(...ys) };
}

test('centred framing is unchanged without an anchor', () => {
  const { camera, shell, fit } = portrait();
  fit();
  assert.equal(camera.view, null);
  const { min, max } = projectedY(camera, shell);
  assert.ok(min > -.88 && max < .88);
});

test('a bottom anchor rests the console on the bottom margin', () => {
  const { camera, shell, fit } = portrait();
  fit({ margin: .92, bottomAnchor: 1 });
  const { min, max } = projectedY(camera, shell);
  assert.ok(Math.abs(min + .92) < 1e-6, `lowest corner at ${min}`);
  assert.ok(max < 0, 'the upper half of the viewport is left for the prompt');
  fit({ margin: .92, bottomAnchor: 0 });
  assert.equal(camera.view?.enabled ?? false, false);
});
