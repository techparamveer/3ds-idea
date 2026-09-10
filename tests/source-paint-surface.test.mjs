import test from 'node:test';
import assert from 'node:assert/strict';
import { MeshStandardMaterial, ShaderLib, Texture } from 'three';
import { installSourcePaintSurface } from '../src/scene/source-paint-surface.ts';

function fixture() {
  const material = new MeshStandardMaterial({
    map: new Texture(), roughnessMap: new Texture(), metalnessMap: new Texture(),
    normalMap: new Texture(), emissiveMap: new Texture(), roughness: .62, metalness: .1,
  });
  return { material, noise: new Texture(), mask: new Texture() };
}

function compile(material, renderer = {}) {
  const shader = {
    uniforms: {}, vertexShader: ShaderLib.standard.vertexShader,
    fragmentShader: ShaderLib.standard.fragmentShader,
  };
  material.onBeforeCompile(shader, renderer);
  return shader;
}

test('paint extension chains the existing hook and keeps all source PBR maps and factors', () => {
  const { material, noise, mask } = fixture();
  const maps = ['map', 'roughnessMap', 'metalnessMap', 'normalMap', 'emissiveMap'];
  const originals = maps.map(name => material[name]);
  const renderer = { name: 'renderer fixture' };
  let calls = 0;
  material.onBeforeCompile = function (shader, receivedRenderer) {
    assert.equal(this, material);
    assert.equal(receivedRenderer, renderer);
    calls++;
    shader.uniforms.existingUniform = { value: 17 };
    shader.fragmentShader += '\n// earlier material extension\n';
  };
  const remove = installSourcePaintSurface(material, noise, mask);
  const shader = compile(material, renderer);
  assert.equal(calls, 1);
  assert.equal(shader.uniforms.existingUniform.value, 17);
  assert.equal(shader.uniforms.consoleSourcePaintNoise.value, noise);
  assert.equal(shader.uniforms.consoleSourcePaintMask.value, mask);
  assert.match(shader.fragmentShader, /earlier material extension/);
  maps.forEach((name, index) => assert.equal(material[name], originals[index]));
  assert.equal(material.roughness, .62);
  assert.equal(material.metalness, .1);
  assert.equal(material.normalScale.x, 1);
  assert.equal(material.normalScale.y, 1);
  remove();
});

test('actual Three standard shader retains atlas sampling and gates the roughness addition by paint coverage', () => {
  const { material, noise, mask } = fixture();
  const remove = installSourcePaintSurface(material, noise, mask);
  const shader = compile(material);
  const roughness = shader.fragmentShader.indexOf('#include <roughnessmap_fragment>');
  const detail = shader.fragmentShader.indexOf('float consolePaintCoverage');
  const lighting = shader.fragmentShader.indexOf('#include <lights_physical_fragment>');
  assert.ok(roughness >= 0 && detail > roughness && lighting > detail,
    'source atlas roughness must be read before the detail is applied and lighting uses it');
  assert.match(shader.fragmentShader, /texture2D\( consoleSourcePaintMask, vConsoleSourcePaintUv \)/);
  assert.match(shader.fragmentShader, /if \( consolePaintCoverage > 0\.0 \) \{/,
    'unpainted regions must skip the paint-specific roughness clamp');
  assert.match(shader.fragmentShader, /roughnessFactor \+ consolePaintCoverage \*/);
  assert.match(shader.fragmentShader, /vConsoleSourcePaintPosition\.xz \/ 16\.0/);
  assert.match(shader.vertexShader, /#include <begin_vertex>\s+vConsoleSourcePaintPosition = position;/,
    'noise must use rest geometry millimetres before instance or world transforms');
  assert.match(shader.fragmentShader, /#include <normal_fragment_maps>/,
    'original normal-map evaluation stays in the standard shader');
  assert.match(shader.fragmentShader, /#include <metalnessmap_fragment>/);
  remove();
});

test('a UV1 label map cannot redirect the UV0 silver-paint mask', () => {
  const { material, noise, mask } = fixture();
  material.map.channel = 1;
  material.map.offset.set(.25, .5);
  const remove = installSourcePaintSurface(material, noise, mask);
  const shader = compile(material);
  assert.equal(material.map.channel, 1, 'keep the label on its authored UV channel');
  assert.deepEqual(material.map.offset.toArray(), [.25, .5]);
  assert.match(shader.vertexShader, /vConsoleSourcePaintUv = uv;/);
  assert.match(shader.fragmentShader, /texture2D\( consoleSourcePaintMask, vConsoleSourcePaintUv \)/);
  assert.doesNotMatch(shader.fragmentShader, /texture2D\( consoleSourcePaintMask, vMapUv \)/);
  remove();
});

test('shader cache keys preserve prior variation and distinguish different earlier hooks', () => {
  const a = fixture(), b = fixture();
  a.material.onBeforeCompile = function earlierA(shader) { shader.uniforms.a = { value: 1 }; };
  b.material.onBeforeCompile = function earlierB(shader) { shader.uniforms.b = { value: 2 }; };
  a.material.userData.variant = 'first';
  a.material.customProgramCacheKey = function () { return this.userData.variant; };
  const removeA = installSourcePaintSurface(a.material, a.noise, a.mask);
  const removeB = installSourcePaintSurface(b.material, b.noise, b.mask);
  const first = a.material.customProgramCacheKey();
  assert.notEqual(first, b.material.customProgramCacheKey());
  assert.match(first, /^first\|/);
  a.material.userData.variant = 'second';
  assert.notEqual(first, a.material.customProgramCacheKey());
  removeA();removeB();
});

test('cleanup restores the exact previous hooks and defines once and leaves texture ownership with caller', () => {
  const { material, noise, mask } = fixture();
  const defines = { STANDARD: '', PRIOR_FEATURE: 1 };
  material.defines = defines;
  const previousCompile = material.onBeforeCompile;
  const previousCacheKey = material.customProgramCacheKey;
  let disposals = 0;
  for (const texture of [noise, mask, material.roughnessMap]) texture.addEventListener('dispose', () => disposals++);
  const initialVersion = material.version;
  const remove = installSourcePaintSurface(material, noise, mask);
  assert.notEqual(material.defines, defines);
  assert.equal(material.defines.PRIOR_FEATURE, 1);
  assert.equal(defines.CONSOLE_SOURCE_PAINT_SURFACE, undefined);
  assert.ok(material.version > initialVersion);
  remove();
  const removedVersion = material.version;
  remove();
  assert.equal(material.version, removedVersion);
  assert.equal(material.defines, defines);
  assert.equal(material.onBeforeCompile, previousCompile);
  assert.equal(material.customProgramCacheKey, previousCacheKey);
  assert.equal(disposals, 0);
  installSourcePaintSurface(material, noise, mask)();
});

test('missing atlas, duplicate installation and incompatible shader hooks fail explicitly', () => {
  const { material, noise, mask } = fixture();
  const originalCompile = material.onBeforeCompile;
  const empty = new MeshStandardMaterial();
  const version = empty.version;
  assert.throws(() => installSourcePaintSurface(empty, noise, mask), /base-color atlas/);
  assert.equal(empty.version, version);
  const remove = installSourcePaintSurface(material, noise, mask);
  assert.throws(() => installSourcePaintSurface(material, noise, mask), /already installed/);
  remove();
  assert.equal(material.onBeforeCompile, originalCompile);
  material.onBeforeCompile = shader => { shader.fragmentShader = 'void main() {}'; };
  const removeIncompatible = installSourcePaintSurface(material, noise, mask);
  assert.throws(() => compile(material), /shader chunk <common>/);
  removeIncompatible();
});
