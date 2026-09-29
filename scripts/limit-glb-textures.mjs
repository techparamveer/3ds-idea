#!/usr/bin/env node
// Derive a GLB whose embedded WebP images are at most --max pixels on a side.
//   node scripts/limit-glb-textures.mjs IN.glb OUT.glb [--max 2048] [--quality 92]
//
// Only images above the limit change: each halving is one 2:1 downscale, the
// same footprint the GPU samples from the original's next mip level. Lossless
// (VP8L) sources stay lossless; lossy (VP8) sources are re-encoded at --quality.
// Every other byte range (JSON, geometry, meshopt streams) is copied unchanged
// and all buffer-0 offsets, including EXT_meshopt_compression's, are remapped.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { readGlb, writeGlb } from './glb.mjs';

const [input, output, ...rest] = process.argv.slice(2);
const option = (name, fallback) => { const at = rest.indexOf(`--${name}`); return at >= 0 ? Number(rest[at + 1]) : fallback; };
const max = option('max', 2048), quality = option('quality', 92);
if (!input || !output) throw new Error('usage: limit-glb-textures.mjs IN.glb OUT.glb [--max 2048] [--quality 92]');

const glb = readFileSync(input);
const { json, bin } = readGlb(glb);

// Every range stored in buffer 0: plain buffer views and meshopt streams.
const ranges = [];
json.bufferViews.forEach((view, index) => {
  if (view.buffer === 0) ranges.push({ target: view, offset: view.byteOffset ?? 0, length: view.byteLength, image: json.images?.find(image => image.bufferView === index) });
  const meshopt = view.extensions?.EXT_meshopt_compression;
  if (meshopt && meshopt.buffer === 0) ranges.push({ target: meshopt, offset: meshopt.byteOffset ?? 0, length: meshopt.byteLength });
});
const ordered = [...ranges].sort((a, b) => a.offset - b.offset);

const report = [];
const parts = [];
let cursor = 0;
for (const range of ordered) {
  let bytes = bin.subarray(range.offset, range.offset + range.length);
  if (range.image?.mimeType === 'image/webp') {
    const meta = await sharp(bytes).metadata();
    if (Math.max(meta.width, meta.height) > max) {
      let scale = 1; while (Math.max(meta.width, meta.height) / scale > max) scale *= 2;
      const lossless = bytes.subarray(12, 16).toString('latin1') === 'VP8L';
      const resized = await sharp(bytes).resize(meta.width / scale, meta.height / scale, { kernel: 'linear' })
        .webp(lossless ? { lossless: true, effort: 6 } : { quality, effort: 6, smartSubsample: true }).toBuffer();
      report.push({ image: range.image.name, from: `${meta.width}x${meta.height}`, to: `${meta.width / scale}x${meta.height / scale}`, lossless, bytes: [bytes.length, resized.length] });
      bytes = resized;
    }
  }
  const padding = (4 - (cursor % 4)) % 4;
  if (padding) { parts.push(Buffer.alloc(padding)); cursor += padding; }
  range.target.byteOffset = cursor; range.target.byteLength = bytes.length;
  parts.push(bytes); cursor += bytes.length;
}
const tail = (4 - (cursor % 4)) % 4; if (tail) parts.push(Buffer.alloc(tail));
const newBin = Buffer.concat(parts);
json.buffers[0].byteLength = newBin.length;

const out = writeGlb(json, newBin);
writeFileSync(output, out);
console.log(JSON.stringify({ input, output, max, quality, inputBytes: glb.length, outputBytes: out.length, resized: report }, null, 1));
