/** Pack the Blender RGBA frames, with crisp alpha edges and RGB555-style color. */
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
if (!input || !output || !isAbsolute(input) || !isAbsolute(output)) {
  throw new Error('Usage: node pack-nvidia-transform.mjs ABSOLUTE_FRAME_DIR ABSOLUTE_OUTPUT_DIR');
}
await mkdir(output, { recursive: true });
const width = 180, height = 148, columns = 8, count = 80;
const layers = [];
for (let i = 0; i < count; i++) {
  const { data, info } = await sharp(join(input, `frame-${String(i + 1).padStart(4, '0')}.png`))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height) throw new Error(`Wrong dimensions at frame ${i + 1}`);
  for (let p = 0; p < data.length; p += 4) {
    data[p + 3] = data[p + 3] >= 128 ? 255 : 0;
    for (let c = 0; c < 3; c++) data[p + c] = data[p + 3] ? Math.round(Math.round(data[p + c] * 31 / 255) * 255 / 31) : 0;
  }
  const png = await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
  layers.push({ input: png, left: (i % columns) * width, top: Math.floor(i / columns) * height });
  if (i === count - 1) await writeFile(join(output, 'poster.png'), png);
}
await sharp({ create: { width: columns * width, height: (count / columns) * height, channels: 4, background: '#00000000' } })
  .composite(layers).png({ compressionLevel: 9 }).toFile(join(output, 'atlas.png'));
console.log(`Packed ${count} RGBA frames at ${width}x${height}, 29.97 fps.`);
