import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DEFAULT_MODEL_URL } from '../src/scene/model-layout.ts';
import { COMPACT_MODEL_URL, PACKED_MODEL_URL } from '../src/scene/model-delivery.ts';
import { COMPACT_MODEL_MAX_BUFFER, prefersCompactModel } from '../src/scene/render-quality.ts';

const publicFile = url => readFileSync(new URL('../public' + url, import.meta.url));
function parse(bytes) {
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  const bin = bytes.subarray(20 + jsonLength + 8);
  const image = index => { const view = json.bufferViews[json.images[index].bufferView]; return bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength); };
  return { json, image };
}
// Everything the scene reads from the model, independent of buffer layout.
function sceneContract({ json }) {
  const materialOf = mesh => mesh.primitives.map(primitive => json.materials[primitive.material]?.name);
  const node = index => {
    const value = json.nodes[index];
    return { name: value.name, translation: value.translation, rotation: value.rotation, scale: value.scale, matrix: value.matrix, extras: value.extras,
      mesh: value.mesh === undefined ? null : { name: json.meshes[value.mesh].name, extras: json.meshes[value.mesh].extras, materials: materialOf(json.meshes[value.mesh]) },
      children: (value.children ?? []).map(node) };
  };
  // Texture indices renumber when duplicate texture records merge; compare the image.
  const resolveTextures = value => Array.isArray(value) ? value.map(resolveTextures) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, key === 'index' ? json.images[json.textures[value.index].source ?? json.textures[value.index].extensions?.EXT_texture_webp?.source]?.name : resolveTextures(value[key])])) : value;
  const materials = Object.fromEntries(json.materials.map(material => {
    const { name, pbrMetallicRoughness: pbr = {}, extensions = {}, ...rest } = material;
    const slot = info => info && { image: json.images[json.textures[info.index].source ?? json.textures[info.index].extensions?.EXT_texture_webp?.source]?.name, texCoord: info.texCoord ?? 0, scale: info.scale, strength: info.strength };
    return [name, { factors: { base: pbr.baseColorFactor, metallic: pbr.metallicFactor, roughness: pbr.roughnessFactor, emissive: rest.emissiveFactor },
      maps: { base: slot(pbr.baseColorTexture), metallicRoughness: slot(pbr.metallicRoughnessTexture), normal: slot(rest.normalTexture), emissive: slot(rest.emissiveTexture), occlusion: slot(rest.occlusionTexture) },
      alpha: [rest.alphaMode, rest.alphaCutoff, rest.doubleSided], extras: rest.extras,
      extensions: resolveTextures(extensions) }];
  }));
  // gltfpack writes shortest float32 round-trip decimals; compare at float32.
  const float32 = value => typeof value === 'number' ? Math.fround(value) : Array.isArray(value) ? value.map(float32)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, float32(entry)])) : value;
  return float32({ scenes: json.scenes.map(scene => scene.nodes.map(node)), materials });
}

const source = parse(publicFile(DEFAULT_MODEL_URL));

test('delivered models are generated from the current sourced export', () => {
  const generated = readFileSync(new URL('../src/scene/model-delivery.ts', import.meta.url), 'utf8');
  const recorded = /sha256 ([0-9a-f]{64})/.exec(generated)?.[1];
  assert.equal(recorded, createHash('sha256').update(publicFile(DEFAULT_MODEL_URL)).digest('hex'), 'rerun scripts/pack-model.mjs after re-exporting the model');
  for (const url of [PACKED_MODEL_URL, COMPACT_MODEL_URL]) {
    const hash = /\.([0-9a-f]{12})\.(packed|compact)\.glb$/.exec(url)?.[1];
    assert.equal(hash, createHash('sha256').update(publicFile(url)).digest('hex').slice(0, 12), `${url} name must match its content`);
  }
});

test('packed and compact models keep the hierarchy, transforms, metadata and materials', () => {
  const expected = sceneContract(source);
  for (const url of [PACKED_MODEL_URL, COMPACT_MODEL_URL]) assert.deepEqual(sceneContract(parse(publicFile(url))), expected, url);
});

test('packed images are byte-identical; compact halves only images above 2048 px', () => {
  const byName = model => new Map(model.json.images.map((image, index) => [image.name, model.image(index)]));
  const original = byName(source), packed = byName(parse(publicFile(PACKED_MODEL_URL))), compact = byName(parse(publicFile(COMPACT_MODEL_URL)));
  assert.deepEqual([...packed.keys()].sort(), [...original.keys()].sort());
  const width = bytes => {
    const chunk = bytes.subarray(12, 16).toString('latin1');
    if (chunk === 'VP8L') { const bits = bytes.readUInt32LE(21); return (bits & 0x3fff) + 1; }
    if (chunk === 'VP8 ') return bytes.readUInt16LE(26) & 0x3fff;
    throw new Error(`Unexpected WebP chunk ${chunk}`);
  };
  for (const [name, bytes] of original) {
    assert.ok(packed.get(name).equals(bytes), `${name} must be copied unchanged`);
    if (width(bytes) <= 2048) assert.ok(compact.get(name).equals(bytes), `${name} is within the limit and must be unchanged`);
    else assert.equal(width(compact.get(name)), width(bytes) / 2, `${name} is halved once`);
  }
});

test('phones take the compact model; laptops, desktops and tablets keep full textures', () => {
  // iPhone Pro Max and large Android at the balanced/constrained caps.
  assert.equal(prefersCompactModel('balanced', 3, 430, 932), true);
  assert.equal(prefersCompactModel('constrained', 3, 390, 844), true);
  assert.equal(prefersCompactModel('balanced', 2.625, 412, 915), true);
  // Retina laptop, 1080p desktop and iPad Pro screens.
  assert.equal(prefersCompactModel('high', 2, 1440, 900), false);
  assert.equal(prefersCompactModel('high', 1, 1920, 1080), false);
  assert.equal(prefersCompactModel('high', 2, 1024, 1366), false);
  assert.ok(Math.max(430, 932) * 1.75 <= COMPACT_MODEL_MAX_BUFFER);
});
