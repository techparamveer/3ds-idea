/** OxHack wordmark helpers. `glow SVG OUT.png` rasterizes the source's blurred navy
 * groups. `check ATLAS.png` proves every frame leaves the 340x160 border transparent. */
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const [mode, ...args] = process.argv.slice(2);

/** The balanced source of the element with this id, found by counting <g> depth. */
function group(svg, id) {
  const at = svg.indexOf(`id="${id}"`);
  if (at < 0) throw new Error(`Missing group ${id}`);
  const start = svg.lastIndexOf('<g', at);
  const tag = /<g\b|<\/g>/g;
  tag.lastIndex = start;
  for (let depth = 0, match; (match = tag.exec(svg));) {
    depth += match[0] === '</g>' ? -1 : 1;
    if (!depth) return svg.slice(start, match.index + 4);
  }
  throw new Error(`Unbalanced group ${id}`);
}

function element(svg, id) {
  const at = svg.indexOf(`id="${id}"`);
  const start = svg.lastIndexOf('<filter', at);
  return svg.slice(start, svg.indexOf('</filter>', at) + 9);
}

if (mode === 'glow') {
  const [input, output] = args;
  const svg = await readFile(input, 'utf8');
  // Shadow also nests the Outline group; only its filtered child is the glow.
  const glow = `<svg xmlns="http://www.w3.org/2000/svg" width="3500" height="2000" viewBox="0 0 3500 2000">${
    element(svg, 'filter1')}${element(svg, 'filter2')}${group(svg, 'OXHACK-26')}${group(svg, 'g9')}</svg>`;
  const png = await sharp(Buffer.from(glow), { density: 72 }).resize(700, 400).png({ compressionLevel: 9, palette: false }).toBuffer();
  await writeFile(output, png);
  console.log(`Glow ${output}: ${png.length} bytes`);
} else if (mode === 'check') {
  const [input, frames = '216', columns = '8', width = '340', height = '160'] = args;
  const [count, cols, w, h] = [frames, columns, width, height].map(Number);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const stride = info.width * 4;
  let touched = 0, worst = 0;
  const report = [];
  for (let i = 0; i < count; i++) {
    const left = (i % cols) * w, top = Math.floor(i / cols) * h;
    let hits = 0, peak = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x && y && x < w - 1 && y < h - 1) continue;
        const alpha = data[(top + y) * stride + (left + x) * 4 + 3];
        if (alpha) { hits++; peak = Math.max(peak, alpha); }
      }
    }
    if (hits) { touched++; worst = Math.max(worst, peak); report.push(`frame ${i + 1}: ${hits}px peak ${peak}`); }
  }
  console.log(`${info.width}x${info.height}, ${count} frames: ${touched} touch the border (peak alpha ${worst}).`);
  if (report.length) { console.log(report.join('\n')); process.exitCode = 1; }
} else {
  throw new Error('Usage: oxhack-wordmark-tools.mjs glow SVG OUT.png | check ATLAS.png [FRAMES COLUMNS WIDTH HEIGHT]');
}
