import type { NativePixels } from '../os/native-layout';
import type { HomeSuspendedBackgroundPresentation } from '../os/home-entry-motion';
import type { FirmwareModelAsset, FirmwareModelPlayback } from './firmware-model';

const SCENE_IN = 'BannerBG_SceneIn';
const APP_PAUSE = 'BannerBG_AppPause';
const APP_QUIT = 'BannerBG_AppQuit';

function nativeClip(asset: FirmwareModelAsset, kind: 'skeletalAnimations' | 'materialAnimations', name: string) {
  const clips = asset.data[kind].filter(clip => clip.Name === name);
  return clips.length === 1 ? clips[0] : undefined;
}

type SourceKey = readonly [frame: number, value: number]
  | readonly [frame: number, value: number, inSlope: number, outSlope: number];

function hasNamedSourceCurve(clip: ReturnType<typeof nativeClip>, elementName: string, target: string, primitive: string,
  channel: string, interpolation: string, keyFrames: readonly SourceKey[], endFrame = 20) {
  const elements = clip?.Elements.filter(element => element.Name === elementName && element.TargetType === target);
  const curve = elements?.length === 1 && elements[0].PrimitiveType === primitive ? elements[0].Content[channel] : undefined;
  return !!curve && 'Exists' in curve && curve.Exists === true && curve.StartFrame === 0 && curve.EndFrame === endFrame
    && curve.InterpolationType === interpolation && curve.PreRepeat === 'None' && curve.PostRepeat === 'None'
    && curve.KeyFrames.length === keyFrames.length
    && curve.KeyFrames.every((key, index) => {
      const [frame, value, inSlope = 0, outSlope = 0] = keyFrames[index];
      return key.Frame === frame && key.Value === value && key.InSlope === inSlope && key.OutSlope === outSlope;
    });
}

function hasSourceCurve(clip: ReturnType<typeof nativeClip>, target: string, primitive: string, channel: string,
  interpolation: string, keyFrames: readonly SourceKey[], endFrame = 20) {
  return hasNamedSourceCurve(clip, 'mt_BG', target, primitive, channel, interpolation, keyFrames, endFrame);
}

function hasSceneInCurves(clip: ReturnType<typeof nativeClip>): boolean {
  if (clip?.Elements.length !== 1) return false;
  const curves = [
    ['ScaleX', [[0, .777129, .0116729, .0116729], [12, .942945, .0124529, .0124529], [19, .998914, .00211728, .00211728], [20, 1, .00108647, .00108647]]],
    ['ScaleY', [[0, .777129, .0116729, .0116729], [12, .942945, .0124529, .0124529], [19, .998914, .00211728, .00211728], [20, 1, .00108647, .00108647]]],
    ['ScaleZ', [[0, .001, .0523226, .0523226], [2, .109891, .0583166, .0583166], [19, .99513, .00949052, .00949052], [20, 1, .00487012, .00487012]]],
    ['TranslationY', [[0, .223, -.0116796, -.0116796], [20, 0, -.00108712, -.00108712]]],
    ['TranslationZ', [[0, -34.786, -.52375, -.52375], [2, -35.876, -.58375, -.58375], [19, -44.7373, -.0949993, -.0949993], [20, -44.786, -.048748, -.048748]]],
  ] satisfies readonly (readonly [string, readonly SourceKey[]])[];
  return curves.every(([channel, keys]) => hasNamedSourceCurve(clip, 'BG', 'Bone', 'Transform', channel, 'Hermite', keys));
}

function hasAppPauseCurves(clip: ReturnType<typeof nativeClip>): boolean {
  if (clip?.Elements.length !== 6) return false;
  for (const [target, start, end] of [
    ['MaterialConstant0', [1, 1, 1], [.4, .45, .5]],
    ['MaterialConstant1', [0, 0, 0], [0, .1, .2]],
  ] as const) {
    for (const [index, channel] of ['R', 'G', 'B'].entries()) {
      if (!hasSourceCurve(clip, target, 'RGBA', channel, 'Hermite', [[0, start[index]], [20, end[index]]])) return false;
    }
  }
  for (const [target, end] of [['MaterialTexCoord0Scale', 19], ['MaterialTexCoord1Scale', 20]] as const) {
    for (const channel of ['X', 'Y']) {
      if (!hasSourceCurve(clip, target, 'Vector2D', channel, 'Linear',
        [[0, 1], [1, 1.002], [2, 1], [5, .98], [10, .93], [15, .89], [end, .87]], end)) return false;
    }
  }
  return hasSourceCurve(clip, 'MaterialConstant4', 'RGBA', 'A', 'Hermite', [[0, 0]], 0)
    && ['X', 'Y'].every(channel => hasSourceCurve(clip, 'MaterialTexCoord1Trans', 'Vector2D', channel, 'Hermite', [[0, 0]], 0));
}

/** Maps the pure HOME controller sample to the ordered source animation stack. */
export function suspendedBackgroundPlayback(presentation: HomeSuspendedBackgroundPresentation | null = null): FirmwareModelPlayback {
  if (!presentation) return {
    skeletal: [{ name: SCENE_IN, frame: 20 }],
    material: [{ name: APP_PAUSE, frame: 20 }],
  };
  const sceneIn = presentation.skeletal[0], appPause = presentation.material[0];
  if (presentation.skeletal.length !== 1 || (presentation.material.length !== 1 && presentation.material.length !== 2)
    || sceneIn?.clip !== SCENE_IN || !Number.isInteger(sceneIn.frame) || sceneIn.frame < 0 || sceneIn.frame > 20
    || appPause?.clip !== APP_PAUSE || !Number.isInteger(appPause.frame) || appPause.frame < 0 || appPause.frame > 20) {
    throw new Error('Unsupported native suspended presentation');
  }
  if (presentation.material.length === 1) {
    if (sceneIn.frame !== appPause.frame) throw new Error('Unsupported native suspended presentation');
    return {
      skeletal: [{ name: sceneIn.clip, frame: sceneIn.frame }],
      material: [{ name: appPause.clip, frame: appPause.frame }],
    };
  }
  const appQuit = presentation.material[1];
  if (sceneIn.frame !== 20 || appPause.frame !== 20 || appQuit?.clip !== APP_QUIT || !Number.isInteger(appQuit.frame)
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
    || sceneIn?.FramesCount !== 20 || sceneIn.AnimationFlags !== '0' || !hasSceneInCurves(sceneIn)
    || appPause?.FramesCount !== 20 || appPause.AnimationFlags !== '0'
    || !hasAppPauseCurves(appPause)
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
