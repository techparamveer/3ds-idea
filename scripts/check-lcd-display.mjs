#!/usr/bin/env node
// Static guard for how LCD canvases are shown on the console (runs in prebuild).
//
// Pixelation regression, 4ee6362 (16 Sep 2026): the display textures were set to
// magFilter=NearestFilter. The panels are seen at non-integer, anisotropic
// scales, so nearest sampling doubled some texel columns and dropped rows.
// Display sampling has one owner: src/scene/lcd-display.ts. This check keeps
// texture creation there and keeps nearest filtering to 1:1 native rasters.
//
// Usage: node scripts/check-lcd-display.mjs [srcRoot]   (default: ./src)
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = process.argv[2] ?? join(process.cwd(), 'src');
const OWNER = 'scene/lcd-display.ts';
const HELPER = 'createLcdDisplayTexture() / createLcdDisplayMaterial() from src/scene/lcd-display.ts';

// Nearest filtering is correct only where a texture is drawn or read back 1:1
// at native size, or is never magnified. Maximum occurrences per file.
const NEAREST_ALLOWED = {
  'scene/sound-room.ts': [2, 'native 400x240 render target read back 1:1 into the LCD canvas'],
  'scene/camera-shoot-background.ts': [2, 'native 320x240 render target read back 1:1 into the LCD canvas'],
  'scene/firmware-banner.ts': [2, 'native 400x240 render target read back 1:1 into the LCD canvas'],
  'scene/firmware-model.ts': [2, 'CGFX lookup-table DataTexture and native sampler emulation'],
  'os/portfolio-screens.ts': [1, '128px banner face is always minified (about 80px), so the mag filter never engages'],
};

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) yield path;
  }
}

const errors = [];
for await (const path of files(root)) {
  const rel = relative(root, path).split(sep).join('/');
  if (rel === OWNER) continue;
  const lines = (await readFile(path, 'utf8')).split('\n');
  const nearest = [];
  lines.forEach((line, i) => {
    const at = `src/${rel}:${i + 1}`;
    for (const _ of line.matchAll(/\bNearestFilter\b/g)) nearest.push(at);
    // Every texture shown on a console mesh is a display surface; in src/scene
    // a canvas texture can only be the LCD panel or a new surface that needs
    // the same treatment.
    if (rel.startsWith('scene/') && /\bCanvasTexture\s*\(/.test(line))
      errors.push(`${at}: canvas texture created outside ${OWNER}. Use ${HELPER}.`);
  });
  const [max, reason] = NEAREST_ALLOWED[rel] ?? [0];
  if (nearest.length > max) errors.push(`${nearest[max]}: NearestFilter ${max ? `exceeds the ${max} allowed here (${reason})` : 'is not allowed in this file'}. `
    + `LCD panels shown on the console must use ${HELPER}, which keeps texels crisp without uneven steps at non-integer scales. `
    + 'Nearest filtering is only for 1:1 native rasters; if this is one, add it to NEAREST_ALLOWED in scripts/check-lcd-display.mjs with the reason.');
}

if (errors.length) {
  console.error(`check-lcd-display: ${errors.length} violation(s)\n${errors.map(e => `  ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('check-lcd-display: ok');
