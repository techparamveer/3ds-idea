#!/usr/bin/env node
// Re-encode the unfiltered float attribute streams of a meshopt-compressed GLB
// with the exponential filter and the v1 vertex codec, only where the result
// decodes to the same bytes. Each stream takes the smallest exact mode/bit
// count; a stream with no exact encoding is left unchanged. Decoding uses
// Three.js's own MeshoptDecoder, so the check covers the decoder the site runs.
//   node scripts/meshopt-exp-lossless.mjs IN.glb OUT.glb
import { readFileSync, writeFileSync } from 'node:fs';
import { MeshoptEncoder } from 'meshoptimizer';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { readGlb, writeGlb } from './glb.mjs';

const [input, output] = process.argv.slice(2);
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const { json, bin } = readGlb(readFileSync(input));
const decode = (bytes, extension, filter) => {
  const target = new Uint8Array(extension.count * extension.byteStride);
  MeshoptDecoder.decodeGltfBuffer(target, extension.count, extension.byteStride, bytes, extension.mode, filter);
  return Buffer.from(target.buffer, target.byteOffset, target.byteLength);
};
// Only streams read exclusively through float accessors can take the filter.
const nonFloat = new Set(json.accessors.filter(accessor => accessor.componentType !== 5126).map(accessor => accessor.bufferView));
const chunks = []; let offset = 0;
const append = bytes => { const start = offset; chunks.push(Buffer.from(bytes)); offset += bytes.length; const pad = (4 - (offset % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; } return start; };
const report = [];
for (const [index, view] of json.bufferViews.entries()) {
  const extension = view.extensions?.EXT_meshopt_compression;
  if (!extension) { if (view.buffer === 0) view.byteOffset = append(bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)); continue; }
  const compressed = bin.subarray(extension.byteOffset ?? 0, (extension.byteOffset ?? 0) + extension.byteLength);
  let best = null;
  if (extension.mode === 'ATTRIBUTES' && !extension.filter && extension.byteStride % 4 === 0 && !nonFloat.has(index)) {
    const raw = decode(compressed, extension);
    const floats = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
    for (const mode of ['Separate', 'SharedComponent', 'SharedVector']) for (let bits = 1; bits <= 24; bits++) {
      const encoded = MeshoptEncoder.encodeGltfBuffer(MeshoptEncoder.encodeFilterExp(floats, extension.count, extension.byteStride, bits, mode), extension.count, extension.byteStride, 'ATTRIBUTES', 1);
      if (!decode(encoded, extension, 'EXPONENTIAL').equals(raw)) continue;
      if (encoded.length < (best?.bytes.length ?? compressed.length)) best = { mode, bits, bytes: encoded };
      break;
    }
  }
  report.push({ view: index, mode: extension.mode, before: compressed.length, after: best?.bytes.length ?? compressed.length, filter: best && `${best.mode}/${best.bits}` });
  extension.byteOffset = append(best?.bytes ?? compressed);
  extension.byteLength = best?.bytes.length ?? compressed.length;
  if (best) extension.filter = 'EXPONENTIAL';
}
const packed = Buffer.concat(chunks);
json.buffers[0].byteLength = packed.length;
writeFileSync(output, writeGlb(json, packed));
console.log(JSON.stringify({ output, streams: report }));
