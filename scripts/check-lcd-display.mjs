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
// Canvas textures outside the owner that are not LCD panels. Maximum occurrences per file.
const CANVAS_TEXTURE_ALLOWED = {
  'os/portfolio-screens.ts': [1, '128px portfolio banner face for the HOME banner model, not an LCD panel'],
};
const CANVAS_TEXTURE_SCOPES = ['scene/', 'os/'];

// Blanks // and /* */ comments, keeping line breaks and string/template literals.
function stripComments(source) {
  return source.replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\[\s\S]|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    match => match[0] === '/' ? match.replace(/[^\n]/g, ' ') : match);
}

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) yield path;
  }
}

function overLimit(rel, kind, hits, allowed, advice) {
  const [max, reason] = allowed[rel] ?? [0];
  if (hits.length > max) errors.push(`${hits[max]}: ${kind} ${max ? `exceeds the ${max} allowed here (${reason})` : 'is not allowed in this file'}. ${advice}`);
}

const errors = [];
for await (const path of files(root)) {
  const rel = relative(root, path).split(sep).join('/');
  if (rel === OWNER) continue;
  const lines = stripComments(await readFile(path, 'utf8')).split('\n');
  const nearest = [], canvasTextures = [];
  lines.forEach((line, i) => {
    const at = `src/${rel}:${i + 1}`;
    for (const _ of line.matchAll(/\bNearestFilter\b/g)) nearest.push(at);
    // Every canvas texture shown on a console mesh is a display surface: the
    // LCD panel or a new surface that needs the same treatment.
    if (CANVAS_TEXTURE_SCOPES.some(scope => rel.startsWith(scope))) for (const _ of line.matchAll(/\bCanvasTexture\s*\(/g)) canvasTextures.push(at);
  });
  overLimit(rel, 'NearestFilter', nearest, NEAREST_ALLOWED,
    `LCD panels shown on the console must use ${HELPER}, which keeps texels crisp without uneven steps at non-integer scales. `
    + 'Nearest filtering is only for 1:1 native rasters; if this is one, add it to NEAREST_ALLOWED in scripts/check-lcd-display.mjs with the reason.');
  overLimit(rel, `canvas texture created outside ${OWNER}`, canvasTextures, CANVAS_TEXTURE_ALLOWED,
    `Use ${HELPER}; if this is not an LCD panel, add it to CANVAS_TEXTURE_ALLOWED in scripts/check-lcd-display.mjs with the reason.`);
}

if (errors.length) {
  console.error(`check-lcd-display: ${errors.length} violation(s)\n${errors.map(e => `  ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('check-lcd-display: ok');
