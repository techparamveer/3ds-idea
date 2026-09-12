import { Group, MathUtils, Object3D, Vector3 } from 'three';
import type { ControlDirection, DirectionalControlName } from './model-layout';

export type PadVector = { x: number; y: number }; // +x right, +y down on the console
export const DIRECTION_VECTOR: Record<ControlDirection, PadVector> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

export function clampPad(vector: PadVector): PadVector {
  const length = Math.max(1, Math.hypot(vector.x, vector.y));
  return { x: vector.x / length, y: vector.y / length };
}

export function padDirection(vector: PadVector): ControlDirection | undefined {
  if (Math.hypot(vector.x, vector.y) < .15) return undefined;
  return Math.abs(vector.x) > Math.abs(vector.y) ? vector.x < 0 ? 'left' : 'right' : vector.y < 0 ? 'up' : 'down';
}

/** Pointer and keyboard holds share one directional pose, including diagonals. */
export class DirectionalMotion {
  vector: PadVector = { x: 0, y: 0 };
  private inputs = new Map<string, { vector: PadVector; held: boolean; until: number }>();
  press(source: string, vector: PadVector, now: number) {
    this.inputs.set(source, { vector: clampPad(vector), held: true, until: now + 130 });
  }
  release(source: string) {
    const input = this.inputs.get(source);
    if (input) input.held = false;
  }
  cancel() { this.inputs.clear(); }
  step(now: number, dt: number, reduced = false) {
    let x = 0, y = 0;
    for (const [source, input] of this.inputs) {
      if (!input.held && now >= input.until) { this.inputs.delete(source); continue; }
      x += input.vector.x; y += input.vector.y;
    }
    const target = clampPad({ x, y });
    const damping = Math.hypot(x, y) ? 60 : 24;
    for (const axis of ['x', 'y'] as const) {
      this.vector[axis] = reduced ? target[axis] : MathUtils.damp(this.vector[axis], target[axis], damping, dt);
      if (Math.abs(this.vector[axis] - target[axis]) < .0001) this.vector[axis] = target[axis];
    }
    return this.vector;
  }
}

/** Runtime rig: keeps the cap geometry, print children and baked UVs intact. */
export function createDirectionalRig(base: Object3D, center: Vector3, parts: Object3D[]) {
  const pivot = new Group();
  pivot.name = 'DirectionalPivot';
  pivot.position.copy(center);base.add(pivot);
  base.updateWorldMatrix(true, true);
  // All selected parts are siblings; descendants already follow their cap.
  for (const part of parts) pivot.attach(part);
  return {
    pivot,
    apply(name: DirectionalControlName, vector: PadVector) {
      const v = clampPad(vector);
      pivot.position.copy(center);pivot.rotation.set(0, 0, 0);
      if (name === 'DPAD') {
        // A 3.5 degree rocker lowers the pressed arm and lifts its opposite.
        // Values are appearance fits; the pivot is in the cap's centre.
        pivot.rotation.set(v.y * 3.5 * Math.PI / 180, 0, -v.x * 3.5 * Math.PI / 180);
        pivot.position.y -= .08 * Math.hypot(v.x, v.y);
      } else {
        pivot.position.x += v.x * 1.5;
        pivot.position.z += v.y * 1.5;
      }
    },
  };
}
