import { Box3, Matrix4, Mesh, Object3D, Quaternion, Vector3, type Material } from 'three';

export const DEFAULT_MODEL_URL = '/models/silver-3ds-xl.glb';

export type ControlName = 'A' | 'B' | 'X' | 'Y' | 'HOME' | 'SELECT' | 'START' | 'POWER' | 'L' | 'R' | 'DPAD' | 'CIRCLE';
export type DirectionalControlName = 'DPAD' | 'CIRCLE';
export type ControlDirection = 'up' | 'down' | 'left' | 'right';

/** Stored in the 3DS_XL node's glTF extras / Three.js userData. */
export type ModelLayoutMetadata = {
  version: 1;
  screens: {
    top: { anchor: string; width_mm: number; height_mm: number };
    bottom: { anchor: string; width_mm: number; height_mm: number };
  };
};

export type ScreenPlacement = {
  parent: Object3D;
  widthMm: number;
  heightMm: number;
  position: Vector3;
  quaternion: Quaternion;
};

export type ControlLayout = {
  object: Object3D;
  centerInBase: Vector3;
  pressTravelMm: number;
};

export type ModelLayout = {
  source: 'metadata' | 'legacy';
  base: Object3D;
  hinge: Object3D;
  screens: { top: ScreenPlacement; bottom: ScreenPlacement };
  controls: Map<ControlName, ControlLayout>;
};

const CONTROL_NAMES = new Set<ControlName>(['A', 'B', 'X', 'Y', 'HOME', 'SELECT', 'START', 'POWER', 'L', 'R', 'DPAD', 'CIRCLE']);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function requireNode(model: Object3D, name: string): Object3D {
  const node = model.getObjectByName(name);
  if (!node) throw new Error(`Console model is missing ${name}.`);
  return node;
}

function hasAncestor(node: Object3D, ancestor: Object3D): boolean {
  for (let parent: Object3D | null = node; parent; parent = parent.parent) if (parent === ancestor) return true;
  return false;
}

function screenFromMetadata(model: Object3D, value: unknown, expectedParent: Object3D, id: string): ScreenPlacement {
  if (!isRecord(value) || typeof value.anchor !== 'string' || !value.anchor
    || typeof value.width_mm !== 'number' || !Number.isFinite(value.width_mm) || value.width_mm <= 0
    || typeof value.height_mm !== 'number' || !Number.isFinite(value.height_mm) || value.height_mm <= 0) {
    throw new Error(`Console model has invalid ${id} screen layout metadata.`);
  }
  const anchor = requireNode(model, value.anchor);
  if (!hasAncestor(anchor, expectedParent)) throw new Error(`The ${id} screen anchor must belong to ${expectedParent.name}.`);
  // Contract: the exported anchor's local XY plane is the image plane. Local +Z
  // faces the viewer and +Y is image-up. Units below are millimetres, matching
  // the rig's mesh coordinates inside its 0.001 glTF root scale.
  return { parent: anchor, widthMm: value.width_mm, heightMm: value.height_mm, position: new Vector3(), quaternion: new Quaternion() };
}

/** Bounds in Base space, independent of a mesh's baked vertices or object origin. */
export function controlCenterInBase(base: Object3D, control: Object3D): Vector3 {
  base.updateWorldMatrix(true, true);
  const inverseBase = base.matrixWorld.clone().invert();
  const bounds = new Box3();
  const matrix = new Matrix4();
  const point = new Vector3();
  control.traverse(object => {
    if (!(object instanceof Mesh)) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const local = object.geometry.boundingBox;
    if (!local || local.isEmpty()) return;
    matrix.multiplyMatrices(inverseBase, object.matrixWorld);
    for (const x of [local.min.x, local.max.x]) for (const y of [local.min.y, local.max.y]) for (const z of [local.min.z, local.max.z]) {
      bounds.expandByPoint(point.set(x, y, z).applyMatrix4(matrix));
    }
  });
  if (bounds.isEmpty()) throw new Error(`Control ${control.name} has no mesh bounds.`);
  return bounds.getCenter(new Vector3());
}

/** Read layout without changing the asset, its rest transforms, UVs, or materials. */
export function resolveModelLayout(model: Object3D): ModelLayout {
  const base = requireNode(model, 'Base');
  const hinge = requireNode(model, 'Hinge');
  const root = model.getObjectByName('3DS_XL') ?? model;
  const metadata: unknown = root.userData.console_layout;
  let screens: ModelLayout['screens'];
  let source: ModelLayout['source'];
  if (metadata !== undefined) {
    if (!isRecord(metadata) || metadata.version !== 1 || !isRecord(metadata.screens)) throw new Error('Console model has unsupported layout metadata.');
    screens = {
      top: screenFromMetadata(model, metadata.screens.top, hinge, 'top'),
      bottom: screenFromMetadata(model, metadata.screens.bottom, base, 'bottom'),
    };
    source = 'metadata';
  } else {
    // A newly imported source must provide explicit anchors. Silently applying
    // the old offsets to it would place the screens above/below its real glass.
    if (root.userData.source_author) throw new Error('The sourced console needs explicit console_layout screen anchors before runtime integration.');
    screens = {
      top: { parent: hinge, widthMm: 106.2, heightMm: 63.72, position: new Vector3(0, .145, 43.5), quaternion: new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2) },
      bottom: { parent: base, widthMm: 84.96, heightMm: 63.72, position: new Vector3(0, 13.83, 1), quaternion: new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2) },
    };
    source = 'legacy';
  }
  const controls = new Map<ControlName, ControlLayout>();
  model.traverse(object => {
    if (!object.name.startsWith('Button_')) return;
    const name = object.name.slice(7).toUpperCase() as ControlName;
    if (!CONTROL_NAMES.has(name)) return;
    if (!hasAncestor(object, base)) throw new Error(`Control ${object.name} must belong to Base.`);
    const travel = object.userData.press_travel_mm;
    controls.set(name, {
      object,
      centerInBase: controlCenterInBase(base, object),
      pressTravelMm: typeof travel === 'number' && Number.isFinite(travel) && travel >= 0 ? travel : .25,
    });
  });
  return { source, base, hinge, screens, controls };
}

export function directionFromControlHit(layout: ModelLayout, name: DirectionalControlName, worldPoint: Vector3): ControlDirection {
  const control = layout.controls.get(name);
  if (!control) throw new Error(`Console model is missing directional control ${name}.`);
  const point = layout.base.worldToLocal(worldPoint.clone()).sub(control.centerInBase);
  return Math.abs(point.x) > Math.abs(point.z) ? (point.x < 0 ? 'left' : 'right') : (point.z < 0 ? 'up' : 'down');
}

/** Explicit roles take priority; an untextured source material is never guessed silver. */
export function isSilverPaintMaterial(material: Material): boolean {
  const role: unknown = material.userData.console_material_role;
  return role === undefined ? material.name.includes('Satin silver') : role === 'silver-paint';
}
