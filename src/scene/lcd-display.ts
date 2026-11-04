import * as THREE from 'three';

/**
 * Sole owner of how the paired LCD canvases appear on the console's display
 * meshes. Display only: raw LCD capture reads the 2D canvases directly, so
 * nothing here can change native 400x240 / 320x240 pixels.
 *
 * Measured in native LCD pixels, the panels are seen at arbitrary, non-integer
 * scales: about 1.1x across and 0.75x down at the default HOME view, 1.1-2x
 * face-on or zoomed. The top texture is the native 400x240 frame drawn double
 * width (800x240, nearest), so sampling works on the native grid, never on the
 * canvas size. Wherever the panel is magnified, a nearest mag filter doubles
 * some texel columns and rows but not others, which reads as jagged, uneven
 * pixel steps (4ee6362). Plain linear filtering blurs every texel instead.
 * Here each native pixel stays a flat square and only the boundary between two
 * is blended across one device pixel ("sharp bilinear"). Minified axes use
 * ordinary trilinear filtering from the mip chain.
 * scripts/test-lcd-display.mjs measures both.
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

// Replaces three's emissivemap_fragment. lcdGrid is the native LCD size; the
// texture may repeat each native pixel (top: 2x across), and its bilinear
// blend then spans 1/ratio of a native pixel, hence the offset over lcdSize
// and the gradients scaled to the native grid on magnified axes. Minified
// axes keep the true UV and derivatives. Without anisotropic filtering the mip
// level follows the major axis and softens the minor one; lcdIsotropic then
// biases LOD down by up to half a level as the footprint grows anisotropic.
export const LCD_SHARP_EMISSIVE_FRAGMENT=/* glsl */`
#ifdef USE_EMISSIVEMAP
	vec2 lcdTexel = vEmissiveMapUv * lcdGrid;
	vec2 lcdSeam = floor( lcdTexel + 0.5 );
	vec2 lcdSpan = max( vec2( length( vec2( dFdx( lcdTexel.x ), dFdy( lcdTexel.x ) ) ), length( vec2( dFdx( lcdTexel.y ), dFdy( lcdTexel.y ) ) ) ), vec2( 1e-4 ) );
	vec2 lcdSize = vec2( textureSize( emissiveMap, 0 ) );
	bvec2 lcdMagnified = lessThan( lcdSpan, vec2( 1.0 ) );
	vec2 lcdUv = mix( vEmissiveMapUv, lcdSeam / lcdGrid + clamp( ( lcdTexel - lcdSeam ) / lcdSpan, -0.5, 0.5 ) / lcdSize, lcdMagnified );
	vec2 lcdGradScale = mix( vec2( 1.0 ), lcdGrid / lcdSize, lcdMagnified );
	vec2 lcdFootprint = lcdSpan * lcdSize / lcdGrid * lcdGradScale;
	lcdGradScale *= mix( 1.0, max( sqrt( min( lcdFootprint.x, lcdFootprint.y ) / max( lcdFootprint.x, lcdFootprint.y ) ), 0.7071 ), lcdIsotropic );
	vec4 emissiveColor = textureGrad( emissiveMap, lcdUv, dFdx( vEmissiveMapUv ) * lcdGradScale, dFdy( vEmissiveMapUv ) * lcdGradScale );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif
`;

const EMISSIVE_MARKER='#include <emissivemap_fragment>';

/** Patch any material whose emissiveMap is an LCD display texture of native size `grid`. */
export function sampleLcdSharply<M extends THREE.Material>(material:M,grid:readonly [number,number],anisotropic=true):M{
  material.onBeforeCompile=shader=>{
    if(!shader.fragmentShader.includes(EMISSIVE_MARKER))throw new Error(`LCD display material: fragment shader has no ${EMISSIVE_MARKER}`);
    shader.uniforms.lcdGrid={value:new THREE.Vector2(...grid)};shader.uniforms.lcdIsotropic={value:anisotropic?0:1};
    shader.fragmentShader=`uniform vec2 lcdGrid;\nuniform float lcdIsotropic;\n${shader.fragmentShader.replace(EMISSIVE_MARKER,LCD_SHARP_EMISSIVE_FRAGMENT)}`;
  };
  material.customProgramCacheKey=()=>'lcd-sharp-emissive';
  return material;
}

/** Self-lit LCD panel behind glass; the only material for the display meshes. `grid` is the native LCD size. */
export function createLcdDisplayMaterial(texture:THREE.Texture,roughness:number,grid:readonly [number,number]):THREE.MeshPhysicalMaterial{
  return sampleLcdSharply(new THREE.MeshPhysicalMaterial({
    color:0x080b0e,metalness:0,roughness,ior:1.46,specularIntensity:.35,envMapIntensity:.65,
    emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.97,toneMapped:false,
    // The live panel is only .02 mm ahead of the source glass. Bias raster depth
    // so that precision at oblique views cannot make the two surfaces flicker.
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,
  }),grid,texture.anisotropy>1);
}
