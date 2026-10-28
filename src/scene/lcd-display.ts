import * as THREE from 'three';

/**
 * Sole owner of how the paired LCD canvases appear on the console's display
 * meshes. Display only: raw LCD capture reads the 2D canvases directly, so
 * nothing here can change native 400x240 / 320x240 pixels.
 *
 * The panels are seen at arbitrary, non-integer scales: about 1.1x across and
 * 0.75x down at the default HOME view, 1.1-2x face-on or zoomed. Wherever the
 * panel is magnified, a nearest mag filter doubles some texel columns and rows
 * but not others, which reads as jagged, uneven pixel steps (4ee6362). Plain
 * linear filtering blurs every texel instead. Here each texel stays a flat
 * square and only the boundary between two texels is blended across one
 * device pixel ("sharp bilinear"). Minified axes use ordinary trilinear
 * filtering from the mip chain. scripts/test-lcd-display.mjs measures both.
 */
export function createLcdDisplayTexture(canvas:HTMLCanvasElement,renderer:THREE.WebGLRenderer):THREE.CanvasTexture{
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  // The shader below supplies the sharp edge; the sampler itself must be linear
  // so that edge can be blended, and mipmapped so minified views do not alias.
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;
  texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
  return texture;
}

// Replaces three's emissivemap_fragment. textureGrad keeps mip selection on
// the true UV derivatives; per-axis min(.,1) leaves minified axes untouched.
export const LCD_SHARP_EMISSIVE_FRAGMENT=/* glsl */`
#ifdef USE_EMISSIVEMAP
	vec2 lcdSize = vec2( textureSize( emissiveMap, 0 ) );
	vec2 lcdTexel = vEmissiveMapUv * lcdSize;
	vec2 lcdSeam = floor( lcdTexel + 0.5 );
	vec2 lcdSpan = clamp( fwidth( lcdTexel ), vec2( 1e-4 ), vec2( 1.0 ) );
	vec2 lcdUv = ( lcdSeam + clamp( ( lcdTexel - lcdSeam ) / lcdSpan, -0.5, 0.5 ) ) / lcdSize;
	vec4 emissiveColor = textureGrad( emissiveMap, lcdUv, dFdx( vEmissiveMapUv ), dFdy( vEmissiveMapUv ) );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif
`;

/** Patch any material whose emissiveMap is an LCD display texture. */
export function sampleLcdSharply<M extends THREE.Material>(material:M):M{
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',LCD_SHARP_EMISSIVE_FRAGMENT);};
  material.customProgramCacheKey=()=>'lcd-sharp-emissive';
  return material;
}

/** Self-lit LCD panel behind glass; the only material for the display meshes. */
export function createLcdDisplayMaterial(texture:THREE.Texture,roughness:number):THREE.MeshPhysicalMaterial{
  return sampleLcdSharply(new THREE.MeshPhysicalMaterial({
    color:0x080b0e,metalness:0,roughness,ior:1.46,specularIntensity:.35,envMapIntensity:.65,
    emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.97,toneMapped:false,
    // The live panel is only .02 mm ahead of the source glass. Bias raster depth
    // so that precision at oblique views cannot make the two surfaces flicker.
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,
  }));
}
