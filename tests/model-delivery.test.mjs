import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DEFAULT_MODEL_URL } from '../src/scene/model-layout.ts';
import { PACKED_MODEL_URL } from '../src/scene/model-delivery.ts';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const publicFile = url => readFileSync(new URL('../public' + url, import.meta.url));
function parse(bytes) {
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  const bin = bytes.subarray(20 + jsonLength + 8);
  const image = index => { const view = json.bufferViews[json.images[index].bufferView]; return bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength); };
  return { json, bin, image };
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

// Decode every primitive to (material, vertex records per triangle). Each vertex
// record is the exact bytes of all its attributes, so equal sets mean the GPU
// receives the same triangles with the same values, only in another order.
await MeshoptDecoder.ready;
function triangles(model) {
  const { json, bin } = model;
  const views = new Map();
  const view = index => {
    if (views.has(index)) return views.get(index);
    const value = json.bufferViews[index], meshopt = value.extensions?.EXT_meshopt_compression;
    let bytes;
    if (meshopt) {
      bytes = new Uint8Array(meshopt.count * meshopt.byteStride);
      MeshoptDecoder.decodeGltfBuffer(bytes, meshopt.count, meshopt.byteStride, bin.subarray(meshopt.byteOffset ?? 0, (meshopt.byteOffset ?? 0) + meshopt.byteLength), meshopt.mode, meshopt.filter);
    } else bytes = bin.subarray(value.byteOffset ?? 0, (value.byteOffset ?? 0) + value.byteLength);
    views.set(index, bytes);
    return bytes;
  };
  const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }, bytesOf = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };
  const element = accessor => {
    const bytes = view(accessor.bufferView), width = size[accessor.type] * bytesOf[accessor.componentType];
    const stride = json.bufferViews[accessor.bufferView].byteStride ?? json.bufferViews[accessor.bufferView].extensions?.EXT_meshopt_compression?.byteStride ?? width;
    return index => Buffer.from(bytes.buffer, bytes.byteOffset + (accessor.byteOffset ?? 0) + index * stride, width);
  };
  const byNode = new Map();
  for (const node of json.nodes) {
    if (node.mesh === undefined) continue;
    const list = [];
    for (const primitive of json.meshes[node.mesh].primitives) {
      assert.equal(primitive.mode ?? 4, 4);
      const names = Object.keys(primitive.attributes).sort();
      const readers = names.map(name => element(json.accessors[primitive.attributes[name]]));
      const indices = json.accessors[primitive.indices], read = element(indices), wide = indices.componentType === 5125;
      const vertex = index => Buffer.concat(readers.map(reader => reader(index))).toString('base64');
      const keys = [];
      for (let i = 0; i < indices.count; i += 3) {
        const corners = [0, 1, 2].map(k => { const b = read(i + k); return vertex(wide ? b.readUInt32LE(0) : b.readUInt16LE(0)); });
        // Rotate to a canonical first corner; winding is preserved.
        const first = corners.indexOf([...corners].sort()[0]);
        keys.push(corners.slice(first).concat(corners.slice(0, first)).join('|'));
      }
      list.push({ material: json.materials[primitive.material]?.name, attributes: names.join(','), triangles: keys.sort() });
    }
    byNode.set(node.name, list);
  }
  return byNode;
}

test('delivered model is generated from the current sourced export', () => {
  const generated = readFileSync(new URL('../src/scene/model-delivery.ts', import.meta.url), 'utf8');
  const recorded = /sha256 ([0-9a-f]{64})/.exec(generated)?.[1];
  assert.equal(recorded, createHash('sha256').update(publicFile(DEFAULT_MODEL_URL)).digest('hex'), 'rerun scripts/pack-model.mjs after re-exporting the model');
  const hash = /\.([0-9a-f]{12})\.packed\.glb$/.exec(PACKED_MODEL_URL)?.[1];
  assert.equal(hash, createHash('sha256').update(publicFile(PACKED_MODEL_URL)).digest('hex').slice(0, 12), `${PACKED_MODEL_URL} name must match its content`);
});

test('packed model keeps the hierarchy, transforms, metadata and materials', () => {
  assert.deepEqual(sceneContract(parse(publicFile(PACKED_MODEL_URL))), sceneContract(source));
});

test('packed images are byte-identical to the source', () => {
  const byName = model => new Map(model.json.images.map((image, index) => [image.name, model.image(index)]));
  const original = byName(source), packed = byName(parse(publicFile(PACKED_MODEL_URL)));
  assert.deepEqual([...packed.keys()].sort(), [...original.keys()].sort());
  for (const [name, bytes] of original) assert.ok(packed.get(name).equals(bytes), `${name} must be copied unchanged`);
});

test('packed geometry draws the source triangles with bit-identical vertex values', () => {
  const expected = triangles(source), actual = triangles(parse(publicFile(PACKED_MODEL_URL)));
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());
  for (const [name, primitives] of expected) {
    const packed = actual.get(name);
    assert.equal(packed.length, primitives.length, name);
    primitives.forEach((primitive, index) => {
      assert.equal(packed[index].material, primitive.material, name);
      assert.equal(packed[index].attributes, primitive.attributes, name);
      assert.equal(packed[index].triangles.length, primitive.triangles.length, name);
      assert.ok(packed[index].triangles.every((key, i) => key === primitive.triangles[i]), `${name} primitive ${index} triangles differ`);
    });
  }
});
