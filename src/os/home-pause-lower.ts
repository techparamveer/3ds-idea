import { type NativePack, type NativePixels } from './native-layout.ts';
import type { NativeLayoutRenderer } from './native-renderer.ts';

const LAYOUT = 'LncPauseFade_D_00';
const SCENE_IN = 'LncPauseFade_D_00_SceneIn';
const APP_TEXTURE = 'runtime:pause-lower-application';
const HOME_TEXTURE = 'runtime:pause-lower-home';
const MASK_TEXTURE = 'LncPauseMask_00.bclim';
const paddedCaptures = new WeakMap<NativePixels, NativePixels>();

type SourceKey = Readonly<{ frame: number; value: number; slope?: number }>;

function sourceEntry(pack: NativePack, kind: 'layouts' | 'animations' | 'textures', name: string,
  path: string, sha256: string): boolean {
  const entry = pack.resourceSources?.[kind]?.[name];
  return entry?.titleId === '0004003000009802' && entry.path === path && entry.sha256 === sha256;
}

function exactTrack(pack: NativePack, target: string, property: string, binding: 'pane' | 'material', keys: readonly SourceKey[]): boolean {
  const tracks = pack.animations[SCENE_IN]?.tracks.filter(track => track.target === target && track.property === property);
  return tracks?.length === 1 && tracks[0].binding === binding && tracks[0].interpolation === 'hermite'
    && tracks[0].keys.length === keys.length && tracks[0].keys.every((key, index) => {
      const expected = keys[index];
      return key.frame === expected.frame && key.value === expected.value
        && (expected.slope === undefined || key.slope === expected.slope);
    });
}

/** Reject a partial or substituted lower pause conversion before publishing it. */
export function validateHomePauseLowerAssets(pack: NativePack): void {
  const layout = pack.layouts[LAYOUT], animation = pack.animations[SCENE_IN];
  const panes = layout?.roots[0]?.children ?? [];
  const background = panes.find(pane => pane.name === 'P_BG_00');
  const app = panes.find(pane => pane.name === 'P_App_00');
  const home = panes.find(pane => pane.name === 'P_Lnc_00');
  if (pack.titleId !== '0004003000009802'
    || pack.sourceSha256 !== '826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834'
    || !sourceEntry(pack, 'layouts', LAYOUT, 'launcher_LZ.bin/blyt/LncPauseFade_D_00.bclyt', '87acf2364346072552cc48761184e8b98f61b3f9231e57703af48808cf509f2e')
    || !sourceEntry(pack, 'animations', SCENE_IN, 'launcher_LZ.bin/anim/LncPauseFade_D_00_SceneIn.bclan', '11a82f19bb21c3da0ccb67039ddf86b5feb90d8c7aafe4f3d57a77f49fd3b25f')
    || !sourceEntry(pack, 'textures', MASK_TEXTURE, 'launcher_LZ.bin/timg/LncPauseMask_00.bclim', 'ddb2afbac83aad87d97239fbadd88b11bd9f37da71a432f17a265282e40fabc6')
    || !layout || layout.canvas.width !== 320 || layout.canvas.height !== 240
    || JSON.stringify(layout.textures) !== '["CmnDmyCap_00.bclim","LncPauseMask_00.bclim"]'
    || !background?.picture || background.picture.material !== 2 || JSON.stringify(background.size) !== '[320,240]'
    || JSON.stringify(background.picture.colors) !== '[[0,0,0,255],[0,0,0,255],[0,26,51,255],[0,26,51,255]]'
    || !app?.picture || app.picture.material !== 0 || !home?.picture || home.picture.material !== 1
    || animation?.frames !== 41 || animation.loop || animation.childBinding !== true
    || JSON.stringify(animation.groups) !== '["G_Scene_00"]' || animation.tracks.length !== 10
    || !exactTrack(pack, 'P_App_00', 'scale.x', 'pane', [{ frame: 0, value: 1, slope: 0 }, { frame: 20, value: 0.8999999761581421, slope: 0 }])
    || !exactTrack(pack, 'P_App_00', 'scale.y', 'pane', [{ frame: 0, value: 1, slope: 0 }, { frame: 20, value: 0.8999999761581421, slope: 0 }])
    || !exactTrack(pack, 'P_Lnc_00', 'scale.x', 'pane', [{ frame: 20, value: 1.100000023841858, slope: 0 }, { frame: 40, value: 1, slope: 0 }])
    || !exactTrack(pack, 'P_Lnc_00', 'scale.y', 'pane', [{ frame: 20, value: 1.100000023841858, slope: 0 }, { frame: 40, value: 1, slope: 0 }])
    || !exactTrack(pack, 'P_Lnc_00', 'alpha', 'pane', [{ frame: 20, value: 0, slope: 0 }, { frame: 40, value: 255, slope: 0 }])
    || !exactTrack(pack, 'P_App_00', 'materialColor.1.0', 'material', [{ frame: 0, value: 255, slope: 0 }, { frame: 20, value: 102, slope: 0 }])
    || !exactTrack(pack, 'P_App_00', 'materialColor.1.1', 'material', [{ frame: 0, value: 255, slope: 0 }, { frame: 20, value: 115, slope: 0 }])
    || !exactTrack(pack, 'P_App_00', 'materialColor.1.2', 'material', [{ frame: 0, value: 255, slope: 0 }, { frame: 20, value: 128, slope: 0 }])
    || !exactTrack(pack, 'P_App_00', 'texture.scale.x', 'material', [{ frame: 0, value: 0.8500000238418579, slope: 0 }, { frame: 20, value: 1, slope: 0 }])
    || !exactTrack(pack, 'P_App_00', 'texture.scale.y', 'material', [{ frame: 0, value: 0.800000011920929, slope: 0 }, { frame: 20, value: 1, slope: 0 }])) {
    throw new Error('Native HOME lower pause source unavailable');
  }
}

/** P_App_00 addresses the rotated 240x320 LCD in the top-left of 256x512. */
export function paddedHomeLowerCapture(capture: NativePixels): NativePixels {
  if (capture.width !== 240 || capture.height !== 320 || capture.data.length !== 240 * 320 * 4) {
    throw new Error('Invalid suspended lower LCD');
  }
  const cached = paddedCaptures.get(capture);
  if (cached) return cached;
  const data = new Uint8ClampedArray(256 * 512 * 4);
  for (let row = 0; row < 320; row++) {
    data.set(capture.data.subarray(row * 240 * 4, (row + 1) * 240 * 4), row * 256 * 4);
  }
  const padded = { width: 256, height: 512, data };
  paddedCaptures.set(capture, padded);
  return padded;
}

export function drawHomePauseLower(renderer: NativeLayoutRenderer, ctx: CanvasRenderingContext2D,
  application: NativePixels, home: NativePixels, frame: number): boolean {
  if (!Number.isSafeInteger(frame) || frame < 0 || frame > 40) throw new RangeError('Invalid HOME lower pause frame');
  if (home.width !== 320 || home.height !== 240 || home.data.length !== 320 * 240 * 4) throw new Error('Invalid HOME lower snapshot');
  validateHomePauseLowerAssets(renderer.packs.launcher);
  return renderer.draw(ctx, 'launcher', LAYOUT, {
    bindings: [{ name: SCENE_IN, frame }],
    textures: { [APP_TEXTURE]: paddedHomeLowerCapture(application), [HOME_TEXTURE]: home },
    overrides: {
      P_App_00: { textureBindings: { 0: APP_TEXTURE, 1: MASK_TEXTURE } },
      P_Lnc_00: { textureBindings: { 0: HOME_TEXTURE } },
    },
  });
}
