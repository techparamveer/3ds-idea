import { DataTexture, RepeatWrapping, RGBAFormat, UnsignedByteType, LinearFilter, LinearMipmapLinearFilter } from 'three';
import shader from '@/shaders/silver.wgsl';
/** VGPU computes the material map once. Three.js reuses it for every frame. */
export async function createSilverSurface(): Promise<DataTexture | null> {
  if (!('gpu' in navigator)) return null;
  const { init, target, effect } = await import('vgpu');
  const gpu = await init();
  try {
    const output = target(gpu, { size: [1024,1024], format: 'rgba8unorm' });
    const paint = effect(gpu, shader);
    paint.draw(output);
    const pixels = await output.read();
    const texture = new DataTexture(new Uint8Array(pixels),1024,1024,RGBAFormat,UnsignedByteType);
    texture.wrapS=texture.wrapT=RepeatWrapping;texture.minFilter=LinearMipmapLinearFilter;texture.magFilter=LinearFilter;texture.generateMipmaps=true;texture.flipY=false;texture.needsUpdate=true;
    return texture;
  } finally { gpu.dispose(); }
}
