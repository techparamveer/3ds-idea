#!/usr/bin/env node
// Copy mesh names from a source GLB onto a repacked one, matched by node name.
// gltfpack keeps named nodes but drops mesh names, which Three.js uses to name
// multi-primitive meshes. JSON-only: the binary chunk is copied unchanged.
//   node scripts/restore-glb-names.mjs SOURCE.glb PACKED.glb
import { readFileSync, writeFileSync } from 'node:fs';
import { readGlb, writeGlb } from './glb.mjs';

const [sourcePath, packedPath] = process.argv.slice(2);
const source = readGlb(readFileSync(sourcePath)).json, packed = readGlb(readFileSync(packedPath));
const names = new Map(source.nodes.filter(node => node.name && node.mesh !== undefined).map(node => [node.name, source.meshes[node.mesh].name]));
let restored = 0;
for (const node of packed.json.nodes) {
  if (node.mesh === undefined || !names.has(node.name)) continue;
  const mesh = packed.json.meshes[node.mesh], name = names.get(node.name);
  if (mesh.name !== undefined && mesh.name !== name) throw new Error(`Mesh ${node.mesh} is shared by nodes with different source mesh names`);
  if (name !== undefined) { mesh.name = name; restored++; }
}
writeFileSync(packedPath, writeGlb(packed.json, packed.bin));
console.log(JSON.stringify({ packed: packedPath, restoredMeshNames: restored }));
