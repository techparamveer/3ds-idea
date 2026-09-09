import type { MeshStandardMaterial, Texture } from 'three';

const activeMaterials = new WeakSet<MeshStandardMaterial>();
const PROGRAM_KEY = 'console-source-paint-surface-v1';
const DEFINE = 'CONSOLE_SOURCE_PAINT_SURFACE';

function afterChunk(source: string, name: string, addition: string): string {
  const marker = `#include <${name}>`;
  if (!source.includes(marker)) {
    throw new Error(`Source paint surface requires Three.js shader chunk <${name}>.`);
  }
  return source.replace(marker, `${marker}\n${addition}`);
}

/**
 * Adds restrained VGPU paint grain to a sourced PBR atlas without replacing it.
 *
 * The source base-color map must exist: its vMapUv coordinates locate the mask.
 * Supply a non-color mask with flipY=false and glTF-compatible repeat wrapping,
 * and a repeating non-color VGPU noise texture. Geometry positions are native
 * glTF millimetres; the noise repeats every 16 mm in the mesh-local XZ plane.
 * Root presentation scale and the moving hinge do not change that physical size.
 *
 * The caller owns the textures and must dispose them after removing this hook.
 * Install once per material, after any existing compile hook. Cleanup is idempotent.
 */
export function installSourcePaintSurface(
  material: MeshStandardMaterial,
  noiseTexture: Texture,
  maskTexture: Texture,
): () => void {
  if (!material.map) {
    throw new Error('Source paint surface requires the original base-color atlas and its UV coordinates.');
  }
  if (activeMaterials.has(material)) {
    throw new Error('Source paint surface is already installed on this material.');
  }
  activeMaterials.add(material);

  const previousCompile = material.onBeforeCompile;
  const previousCacheKey = material.customProgramCacheKey;
  const previousDefines = material.defines;
  material.defines = { ...previousDefines, [DEFINE]: 1 };

  material.onBeforeCompile = function (shader, renderer) {
    previousCompile.call(this, shader, renderer);
    const vertexShader = afterChunk(
      afterChunk(shader.vertexShader, 'common', 'varying vec3 vConsoleSourcePaintPosition;'),
      'begin_vertex',
      'vConsoleSourcePaintPosition = position;',
    );
    const fragmentShader = afterChunk(
      afterChunk(shader.fragmentShader, 'common', `
uniform sampler2D consoleSourcePaintNoise;
uniform sampler2D consoleSourcePaintMask;
varying vec3 vConsoleSourcePaintPosition;`),
      'roughnessmap_fragment',
      `
#if defined( USE_MAP ) && defined( CONSOLE_SOURCE_PAINT_SURFACE )
  float consolePaintCoverage = clamp( texture2D( consoleSourcePaintMask, vMapUv ).r, 0.0, 1.0 );
  // Black mask pixels retain the atlas result even below the paint-only clamp.
  if ( consolePaintCoverage > 0.0 ) {
    float consolePaintNoise = texture2D( consoleSourcePaintNoise, vConsoleSourcePaintPosition.xz / 16.0 ).r;
    roughnessFactor = clamp( roughnessFactor + consolePaintCoverage * ( consolePaintNoise - 0.345 ) * 0.3, 0.04, 1.0 );
  }
#endif`,
    );
    shader.uniforms.consoleSourcePaintNoise = { value: noiseTexture };
    shader.uniforms.consoleSourcePaintMask = { value: maskTexture };
    shader.vertexShader = vertexShader;
    shader.fragmentShader = fragmentShader;
  };

  material.customProgramCacheKey = function () {
    // The default Three.js cache key reads the current onBeforeCompile function.
    // Include the earlier hook too, so materials with different prior injections
    // cannot accidentally share a program after receiving this common wrapper.
    return `${previousCacheKey.call(this)}|${previousCompile.toString()}|${PROGRAM_KEY}`;
  };
  material.needsUpdate = true;

  let removed = false;
  return () => {
    if (removed) return;
    removed = true;
    material.onBeforeCompile = previousCompile;
    material.customProgramCacheKey = previousCacheKey;
    material.defines = previousDefines;
    activeMaterials.delete(material);
    material.needsUpdate = true;
  };
}
