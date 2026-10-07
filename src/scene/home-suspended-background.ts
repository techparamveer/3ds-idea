import type { NativePixels } from '../os/native-layout';
import type { HomeSuspendedBackgroundPresentation } from '../os/home-entry-motion';
import type { FirmwareModelAsset, FirmwareModelPlayback } from './firmware-model';

const SCENE_IN = 'BannerBG_SceneIn';
const APP_PAUSE = 'BannerBG_AppPause';
const APP_QUIT = 'BannerBG_AppQuit';

function nativeClip(asset: FirmwareModelAsset, kind: 'skeletalAnimations' | 'materialAnimations', name: string) {
  return asset.data[kind].find(clip => clip.Name === name);
}

function hasSourceCurve(clip: ReturnType<typeof nativeClip>, target: string, primitive: string, channel: string,
  interpolation: string, keyFrames: readonly (readonly [number, number])[]) {
  const curve = clip?.Elements.find(element => element.Name === 'mt_BG'
    && element.TargetType === target && element.PrimitiveType === primitive)?.Content[channel];
  return !!curve && curve.StartFrame === 0 && curve.EndFrame === 20
    && curve.InterpolationType === interpolation && curve.PreRepeat === 'None' && curve.PostRepeat === 'None'
    && curve.KeyFrames.length === keyFrames.length
    && curve.KeyFrames.every((key, index) => key.Frame === keyFrames[index][0]
      && key.Value === keyFrames[index][1] && key.InSlope === 0 && key.OutSlope === 0);
}

/** Maps the pure HOME controller sample to the ordered source animation stack. */
export function suspendedBackgroundPlayback(presentation: HomeSuspendedBackgroundPresentation | null = null): FirmwareModelPlayback {
  if (!presentation) return {
    skeletal: [{ name: SCENE_IN, frame: 20 }],
    material: [{ name: APP_PAUSE, frame: 20 }],
  };
  const sceneIn = presentation.skeletal[0], appPause = presentation.material[0];
  if (presentation.skeletal.length !== 1 || (presentation.material.length !== 1 && presentation.material.length !== 2)
    || sceneIn?.clip !== SCENE_IN || sceneIn.frame !== 20
    || appPause?.clip !== APP_PAUSE || !Number.isInteger(appPause.frame) || appPause.frame < 0 || appPause.frame > 20) {
    throw new Error('Unsupported native suspended presentation');
  }
  if (presentation.material.length === 1) return {
    skeletal: [{ name: sceneIn.clip, frame: sceneIn.frame }],
    material: [{ name: appPause.clip, frame: appPause.frame }],
  };
  const appQuit = presentation.material[1];
  if (appPause.frame !== 20 || appQuit?.clip !== APP_QUIT || !Number.isInteger(appQuit.frame)
    || appQuit.frame < 0 || appQuit.frame > 20) throw new Error('Unsupported native suspended presentation');
  // Order is significant: AppQuit is authored as an override of AppPause.
  return {
    skeletal: [{ name: sceneIn.clip, frame: sceneIn.frame }],
    material: [{ name: appPause.clip, frame: appPause.frame }, { name: appQuit.clip, frame: appQuit.frame }],
  };
}

/** Capture-slot assembly is an explicit host adaptation; geometry, mask,
 * combiners and the settled AppPause pose remain from the pinned BannerBG. */
export function suspendedBackgroundAsset(asset: FirmwareModelAsset): FirmwareModelAsset {
  const data = structuredClone(asset.data), model = data.models[0];
  const sceneIn = nativeClip(asset, 'skeletalAnimations', SCENE_IN);
  const appPause = nativeClip(asset, 'materialAnimations', APP_PAUSE);
  const appQuit = nativeClip(asset, 'materialAnimations', APP_QUIT);
  if (data.sourceSha256 !== '092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595'
    || data.models.length !== 1 || model.name !== 'BannerBG' || model.materials.length !== 1
    || sceneIn?.FramesCount !== 20 || sceneIn.AnimationFlags !== '0'
    || appPause?.FramesCount !== 20 || appPause.AnimationFlags !== '0'
    || appQuit?.FramesCount !== 20 || appQuit.AnimationFlags !== '0'
    || !hasSourceCurve(appQuit, 'MaterialConstant4', 'RGBA', 'A', 'Hermite', [[0, 0], [20, 1]])
    || !hasSourceCurve(appQuit, 'MaterialTexCoord0Scale', 'Vector2D', 'X', 'Step', [[0, .87], [20, 1]])
    || !hasSourceCurve(appQuit, 'MaterialTexCoord0Scale', 'Vector2D', 'Y', 'Step', [[0, .87], [20, 1]])) {
    throw new Error('Unsupported native suspended background');
  }
  for (const [name, width, height] of [['BG_DmyApp_00', 8, 8], ['BG_CapMask_00', 256, 512], ['BG_64_00', 64, 64]] as const) {
    const pixels = asset.images.get(name);
    if (!pixels || pixels.width !== width || pixels.height !== height || pixels.data.length !== width * height * 4) {
      throw new Error(`Missing native suspended background texture ${name}`);
    }
  }
  const material = model.materials[0];
  if (material.Texture0Name !== 'BG_DmyApp_00' || material.Texture1Name !== 'BG_64_00') throw new Error('Unsupported native capture binding');
  material.Texture1Name = 'BG_CapMask_00';
  material.TextureMappers[1] = { ...material.TextureMappers[0] };
  return { ...asset, data };
}

/** The source UVs address a rotated LCD within a 256x512 texture. The source
 * mask's 398-row interior is centred around the 400-row capture at y=56. */
export function paddedHomeCapture(rotated: NativePixels): NativePixels {
  if (rotated.width !== 240 || rotated.height !== 400 || rotated.data.length !== 240 * 400 * 4) {
    throw new Error('Invalid suspended upper LCD');
  }
  const data = new Uint8ClampedArray(256 * 512 * 4);
  for (let row = 0; row < 400; row++) data.set(rotated.data.subarray(row * 960, (row + 1) * 960), ((row + 56) * 256) * 4);
  return { width: 256, height: 512, data };
}
