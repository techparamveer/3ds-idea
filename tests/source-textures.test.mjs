import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Quaternion, Vector3 } from 'three';

const root = new URL('../', import.meta.url);
const folder = new URL('model/candidates/joshua-xl/', root);
const manifest = JSON.parse(await readFile(new URL('source-download.json', folder), 'utf8'));
const components = JSON.parse(await readFile(new URL('component-report.json', folder), 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function loadGlb(name) {
  const bytes = await readFile(new URL(name, folder));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, `${name}: GLB magic`);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length, `${name}: complete download/export`);
  let document, binary;
  for (let offset = 12; offset < bytes.length;) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    assert.ok(offset + 8 + length <= bytes.length);
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) document = JSON.parse(chunk.toString('utf8'));
    if (type === 0x004e4942) binary = chunk;
    offset += 8 + length;
  }
  assert.ok(document && binary);
  return { document, binary };
}

const source = await loadGlb('geometry-inspection.glb');
const candidate = await loadGlb('textured-source.glb');

function accessor(asset, index) {
  const item = asset.document.accessors[index];
  const view = asset.document.bufferViews[item.bufferView];
  assert.equal(item.sparse, undefined, 'this source uses dense accessors');
  const columns = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[item.type];
  const [size, read] = {
    5121: [1, 'readUInt8'], 5123: [2, 'readUInt16LE'],
    5125: [4, 'readUInt32LE'], 5126: [4, 'readFloatLE'],
  }[item.componentType];
  const offset = (view.byteOffset ?? 0) + (item.byteOffset ?? 0);
  const stride = view.byteStride ?? size * columns;
  return Array.from({ length: item.count }, (_, row) => Array.from({ length: columns }, (_, column) =>
    asset.binary[read](offset + row * stride + column * size)));
}

function imageBytes(asset, image) {
  assert.equal(image.mimeType, 'image/png');
  const view = asset.document.bufferViews[image.bufferView];
  assert.ok(view, 'images must be embedded, with no local source-file dependency');
  const start = view.byteOffset ?? 0;
  return asset.binary.subarray(start, start + view.byteLength);
}

function pngDimensions(bytes) {
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(8), 13);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function close(actual, expected, description) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 2e-6,
    `${description}: expected ${expected}, got ${actual}`);
}

const sourcedNodes = candidate.document.nodes.filter(node => Number.isInteger(node.extras?.source_mesh_index));

test('source texture manifest preserves all seven PNG files and original image headers', async () => {
  assert.equal(manifest.images.length, 7);
  assert.equal(new Set(manifest.images.map(image => image.sha256)).size, 7);
  for (const image of manifest.images) {
    const bytes = await readFile(new URL(image.file, root));
    assert.equal(bytes.length, image.size, image.file);
    assert.equal(digest(bytes), image.sha256, image.file);
    assert.deepEqual(pngDimensions(bytes), image.dimensions, image.file);
  }
});

test('textured rig embeds each original PNG unchanged and preserves material texture bindings', () => {
  const document = candidate.document;
  assert.equal(document.images.length, 7);
  const imageHashes = document.images.map(image => {
    const bytes = imageBytes(candidate, image);
    const hash = digest(bytes);
    const original = manifest.images.find(item => item.sha256 === hash);
    assert.ok(original, `unrecognized or altered embedded PNG: ${image.name}`);
    assert.deepEqual(pngDimensions(bytes), original.dimensions);
    return hash;
  });
  assert.deepEqual([...imageHashes].sort(), manifest.images.map(image => image.sha256).sort());
  const textureHash = (materialTexture, description) => {
    assert.ok(materialTexture, description);
    assert.equal(materialTexture.texCoord ?? 0, 0);
    assert.equal(materialTexture.extensions?.KHR_texture_transform, undefined, 'original UV atlas needs no added transform');
    const texture = document.textures[materialTexture.index];
    const sampler = document.samplers[texture.sampler] ?? {};
    assert.equal(sampler.wrapS ?? 10497, 10497, `${description}: repeat U`);
    assert.equal(sampler.wrapT ?? 10497, 10497, `${description}: repeat V`);
    assert.equal(sampler.magFilter, 9729);
    assert.equal(sampler.minFilter, 9987);
    return imageHashes[texture.source];
  };
  const bindings = [
    ['pbrMetallicRoughness', 'baseColorTexture'],
    ['pbrMetallicRoughness', 'metallicRoughnessTexture'],
    [null, 'normalTexture'], [null, 'emissiveTexture'], [null, 'occlusionTexture'],
  ];
  assert.equal(sourcedNodes.length, 68);
  for (const node of sourcedNodes) {
    const original = manifest.materials[node.extras.source_mesh_index];
    const primitive = document.meshes[node.mesh].primitives[0];
    const material = document.materials[primitive.material];
    assert.equal(material.name, original.name, `${node.name}: material assignment`);
    for (const [group, key] of bindings) {
      const expected = (group ? original[group] : original)?.[key];
      const actual = (group ? material[group] : material)?.[key];
      if (expected) assert.equal(textureHash(actual, `${node.name}.${key}`), manifest.images[expected.index].sha256);
      else assert.equal(actual, undefined, `${node.name}.${key}: unexpected texture`);
    }
  }
  for (const original of manifest.materials) {
    const material = document.materials.find(item => item.name === original.name);
    assert.equal(material.doubleSided, original.doubleSided);
    assert.equal(material.alphaMode ?? 'OPAQUE', original.alphaMode ?? 'OPAQUE');
    const pbr = material.pbrMetallicRoughness;
    const originalPbr = original.pbrMetallicRoughness;
    for (const key of ['metallicFactor', 'roughnessFactor']) close(pbr[key] ?? 1, originalPbr[key] ?? 1, `${original.name}.${key}`);
    (originalPbr.baseColorFactor ?? [1, 1, 1, 1]).forEach((value, index) =>
      close((pbr.baseColorFactor ?? [1, 1, 1, 1])[index], value, `${original.name}.baseColorFactor[${index}]`));
    (original.emissiveFactor ?? [0, 0, 0]).forEach((value, index) =>
      close((material.emissiveFactor ?? [0, 0, 0])[index], value, `${original.name}.emissiveFactor[${index}]`));
    close(material.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1,
      original.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1, `${original.name}.emissiveStrength`);
    close(material.extensions?.KHR_materials_specular?.specularFactor ?? 1,
      original.extensions?.KHR_materials_specular?.specularFactor ?? 1, `${original.name}.specularFactor`);
  }
});

test('textured rig restores every source UV face corner including repeated atlas regions', () => {
  const sortUv = values => values.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let corners = 0, repeatedCorners = 0;
  const seen = new Set();
  for (const node of sourcedNodes) {
    const mid = node.extras.source_mesh_index;
    const cid = node.extras.source_component_id;
    const componentKey = `${mid}:${cid}`;
    assert.ok(!seen.has(componentKey));seen.add(componentKey);
    const part = components.meshes[mid].components.find(item => item.id === cid);
    assert.ok(part);
    const original = source.document.meshes[mid].primitives[0];
    const sourceUvs = accessor(source, original.attributes.TEXCOORD_0);
    const sourceIndices = accessor(source, original.indices).flat();
    const expected = sortUv(part.triangle_indices.flatMap(triangle =>
      sourceIndices.slice(triangle * 3, triangle * 3 + 3).map(index => sourceUvs[index])));
    const primitive = candidate.document.meshes[node.mesh].primitives[0];
    const exportedUvs = accessor(candidate, primitive.attributes.TEXCOORD_0);
    const actual = sortUv(accessor(candidate, primitive.indices).flat().map(index => exportedUvs[index]));
    assert.equal(actual.length, expected.length, `${node.name}: triangle corner count`);
    for (let i = 0; i < expected.length; i++) {
      close(actual[i][0], expected[i][0], `${node.name}: U corner ${i}`);
      close(actual[i][1], expected[i][1], `${node.name}: V corner ${i}`);
      if (expected[i].some(value => value < 0 || value > 1)) repeatedCorners++;
    }
    corners += actual.length;
  }
  assert.equal(seen.size, components.meshes.reduce((sum, mesh) => sum + mesh.components.length, 0));
  assert.equal(corners, 28059);
  assert.ok(repeatedCorners > 0, 'source uses repeated UV islands; clamping would erase screen art');
});

test('textured rig exports finite orthogonal tangent frames with explicit handedness', () => {
  let normalMappedVertices = 0;
  for (const node of sourcedNodes) {
    const primitive = candidate.document.meshes[node.mesh].primitives[0];
    const material = candidate.document.materials[primitive.material];
    if (!material.normalTexture) continue;
    const tangentIndex = primitive.attributes.TANGENT;
    assert.ok(Number.isInteger(tangentIndex), `${node.name}: missing tangent attribute`);
    assert.equal(candidate.document.accessors[tangentIndex].type, 'VEC4');
    const tangents = accessor(candidate, tangentIndex);
    const normals = accessor(candidate, primitive.attributes.NORMAL);
    assert.equal(tangents.length, normals.length);
    for (let i = 0; i < tangents.length; i++) {
      const t = tangents[i], n = normals[i];
      assert.ok(t.every(Number.isFinite) && n.every(Number.isFinite), `${node.name}: finite frame`);
      // Blender rounds exported normal/tangent components to four decimal places.
      assert.ok(Math.abs(Math.hypot(...t.slice(0, 3)) - 1) < 2e-4, `${node.name}: unit tangent`);
      assert.ok(Math.abs(Math.hypot(...n) - 1) < 2e-4, `${node.name}: unit normal`);
      assert.ok(Math.abs(n[0] * t[0] + n[1] * t[1] + n[2] * t[2]) < 2e-4, `${node.name}: tangent perpendicular to normal`);
      assert.ok(t[3] === 1 || t[3] === -1, `${node.name}: tangent W is a sign`);
    }
    normalMappedVertices += tangents.length;
  }
  assert.ok(normalMappedVertices >= 8175, 'all source body vertices retain normal-map tangent data');
});

test('textured rig retains the original normal-map frame through the rigid closing rotation', () => {
  const document = candidate.document;
  const rootIndex = document.nodes.findIndex(node => node.name === '3DS_XL');
  const matrices = new Map([[rootIndex, new Matrix4()]]);
  const parents = new Map();
  document.nodes.forEach((node, index) => node.children?.forEach(child => parents.set(child, index)));
  function matrixInRoot(index) {
    if (!matrices.has(index)) {
      const node = document.nodes[index];
      const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
        new Vector3().fromArray(node.translation ?? [0, 0, 0]),
        new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
        new Vector3().fromArray(node.scale ?? [1, 1, 1]));
      assert.ok(parents.has(index));
      matrices.set(index, matrixInRoot(parents.get(index)).clone().multiply(local));
    }
    return matrices.get(index);
  }
  const closing = new Matrix4().makeRotationX(components.screen_pose.inferred_open_angle_degrees * Math.PI / 180);
  const lids = new Set(components.rig_assignment_candidates.main_primitive_lid_components);
  const original = source.document.meshes[0].primitives[0];
  const sourceNormals = accessor(source, original.attributes.NORMAL);
  const sourceTangents = accessor(source, original.attributes.TANGENT);
  const sourceIndices = accessor(source, original.indices).flat();
  let checkedCorners = 0;
  document.nodes.forEach((node, nodeIndex) => {
    if (node.extras?.source_mesh_index !== 0) return;
    const cid = node.extras.source_component_id;
    const part = components.meshes[0].components.find(item => item.id === cid);
    const expectedIds = part.triangle_indices.flatMap(index => sourceIndices.slice(index * 3, index * 3 + 3));
    const primitive = document.meshes[node.mesh].primitives[0];
    const normals = accessor(candidate, primitive.attributes.NORMAL);
    const tangents = accessor(candidate, primitive.attributes.TANGENT);
    const actualIds = accessor(candidate, primitive.indices).flat();
    const toRoot = matrixInRoot(nodeIndex);
    assert.equal(actualIds.length, expectedIds.length);
    actualIds.forEach((index, corner) => {
      const originalIndex = expectedIds[corner];
      const expectedNormal = new Vector3().fromArray(sourceNormals[originalIndex]);
      const expectedTangent = new Vector3().fromArray(sourceTangents[originalIndex]);
      if (lids.has(cid)) {
        expectedNormal.transformDirection(closing);
        expectedTangent.transformDirection(closing);
      }
      const actualNormal = new Vector3().fromArray(normals[index]).transformDirection(toRoot);
      const actualTangent = new Vector3().fromArray(tangents[index]).transformDirection(toRoot);
      assert.ok(actualNormal.distanceTo(expectedNormal) < 2e-6, `${node.name}: source normal corner ${corner}`);
      assert.ok(actualTangent.distanceTo(expectedTangent) < 2e-6, `${node.name}: source tangent corner ${corner}`);
      assert.equal(tangents[index][3], sourceTangents[originalIndex][3], `${node.name}: original tangent W corner ${corner}`);
      checkedCorners++;
    });
  });
  assert.equal(checkedCorners, 27297);
});

test('silver adaptation changes only the body color atlas while preserving the source rig and shading data', async () => {
  const silver = await loadGlb('silver-source.glb');
  const derivedColor = await readFile(new URL('derived-textures/body-silver-basecolor.png', folder));
  const paintMask = await readFile(new URL('derived-textures/paint-mask.png', folder));
  assert.deepEqual(pngDimensions(derivedColor), [4096, 4096]);
  assert.deepEqual(pngDimensions(paintMask), [4096, 4096]);
  assert.equal(paintMask[24], 8, 'mask is 8-bit data');
  assert.equal(paintMask[25], 0, 'mask stores grayscale coverage data');
  assert.equal(digest(paintMask), '5b368a30e13b4047db8f782b57786e79749e776177f6cf5142753f92b848f3ba',
    'mask must match the independently audited atlas coverage recorded in source-texture-transfer-audit.md');
  const derivedHash = digest(derivedColor);
  assert.notEqual(derivedHash, manifest.images[0].sha256, 'silver atlas must differ from source red');
  const hashCache = new Map();
  const hashes = asset => {
    if (!hashCache.has(asset)) hashCache.set(asset, asset.document.images.map(image => digest(imageBytes(asset, image))));
    return hashCache.get(asset);
  };
  const silverHashes = hashes(silver);
  assert.deepEqual([...silverHashes].sort(), [derivedHash, ...manifest.images.slice(1).map(image => image.sha256)].sort(),
    'only original image 0 is replaced; all other PNG payloads remain byte-identical');

  function canonicalMaterial(asset, material) {
    const result = structuredClone(material);
    delete result.name;delete result.extras;
    const imageHashes = hashes(asset);
    for (const [group, key] of [
      ['pbrMetallicRoughness', 'baseColorTexture'], ['pbrMetallicRoughness', 'metallicRoughnessTexture'],
      [null, 'normalTexture'], [null, 'emissiveTexture'], [null, 'occlusionTexture'],
    ]) {
      const item = group ? result[group]?.[key] : result[key];
      if (!item) continue;
      const texture = asset.document.textures[item.index];
      const sampler = asset.document.samplers[texture.sampler] ?? {};
      delete item.index;
      item.imageSha256 = imageHashes[texture.source];
      item.sampler = { ...sampler, wrapS: sampler.wrapS ?? 10497, wrapT: sampler.wrapT ?? 10497 };
    }
    return result;
  }

  const silverByName = new Map(silver.document.nodes.map(node => [node.name, node]));
  assert.equal(silverByName.size, silver.document.nodes.length, 'node names must identify a unique rig object');
  assert.equal(silver.document.nodes.length, candidate.document.nodes.length);
  let checkedMeshes = 0;
  for (const originalNode of candidate.document.nodes) {
    const node = silverByName.get(originalNode.name);
    assert.ok(node, `retained node ${originalNode.name}`);
    for (const transform of ['matrix', 'translation', 'rotation', 'scale']) {
      assert.deepEqual(node[transform], originalNode[transform], `${node.name}: ${transform}`);
    }
    assert.deepEqual((node.children ?? []).map(index => silver.document.nodes[index].name),
      (originalNode.children ?? []).map(index => candidate.document.nodes[index].name), `${node.name}: hierarchy`);
    if (originalNode.name !== '3DS_XL') assert.deepEqual(node.extras, originalNode.extras, `${node.name}: rig/anchor extras`);
    if (originalNode.mesh === undefined) continue;
    const originalPrimitives = candidate.document.meshes[originalNode.mesh].primitives;
    const primitives = silver.document.meshes[node.mesh].primitives;
    assert.equal(primitives.length, originalPrimitives.length);
    primitives.forEach((primitive, index) => {
      const original = originalPrimitives[index];
      assert.equal(primitive.mode ?? 4, original.mode ?? 4);
      assert.deepEqual(accessor(silver, primitive.indices), accessor(candidate, original.indices), `${node.name}: triangle indices`);
      assert.deepEqual(Object.keys(primitive.attributes).sort(), Object.keys(original.attributes).sort());
      for (const attribute of Object.keys(original.attributes)) {
        assert.deepEqual(accessor(silver, primitive.attributes[attribute]), accessor(candidate, original.attributes[attribute]),
          `${node.name}: unchanged ${attribute}`);
      }
      const material = silver.document.materials[primitive.material];
      const expectedMaterial = canonicalMaterial(candidate, candidate.document.materials[original.material]);
      if (node.extras.source_mesh_index === 0) {
        expectedMaterial.pbrMetallicRoughness.baseColorTexture.imageSha256 = derivedHash;
        assert.equal(material.extras.console_material_role, 'sourced-body');
        assert.equal(material.extras.console_paint_mask, '/models/candidates/joshua-xl-paint-mask.png');
      }
      assert.deepEqual(canonicalMaterial(silver, material), expectedMaterial, `${node.name}: PBR inputs and factors`);
    });
    checkedMeshes++;
  }
  assert.equal(checkedMeshes, 68);
  const originalRoot = candidate.document.nodes.find(node => node.name === '3DS_XL').extras;
  const adaptedRoot = silverByName.get('3DS_XL').extras;
  for (const key of ['source_author', 'source_url', 'source_license', 'source_sha256', 'source_tangent_frames',
    'texture_download_complete', 'source_uniform_scale_to_mm', 'console_layout', 'source_markings_region']) {
    assert.deepEqual(adaptedRoot[key], originalRoot[key], `retained source metadata ${key}`);
  }
  assert.equal(adaptedRoot.source_finish, 'silver-adaptation');
  assert.equal(adaptedRoot.silver_colour_bake.classification.source_body_png_sha256, manifest.images[0].sha256);
  assert.equal(adaptedRoot.silver_colour_bake.classification.qualified_pixels_in_other_component_uvs, 0);
});
