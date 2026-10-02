import type { NativePixels } from '../os/native-layout';
import type { FirmwareModelAsset } from './firmware-model';

/** Capture-slot assembly is an explicit host adaptation; geometry, mask,
 * combiners and the settled AppPause pose remain from the pinned BannerBG. */
export function suspendedBackgroundAsset(asset: FirmwareModelAsset): FirmwareModelAsset {
  const data = structuredClone(asset.data), model = data.models[0];
  if (data.sourceSha256 !== '092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595'
    || data.models.length !== 1 || model.name !== 'BannerBG' || model.materials.length !== 1
    || !data.materialAnimations.some(clip => clip.Name === 'BannerBG_AppPause' && clip.FramesCount === 20)) {
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
