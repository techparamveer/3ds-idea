#!/usr/bin/env node
// GPU behaviour test for LCD display sampling (src/scene/lcd-display.ts).
//
// Renders one-native-pixel strokes, spaced 8 apart, through the real owner
// module and three's real shaders in Chromium, at several sub-pixel panel
// phases. The bottom canvas is native 320x240; the top is native 400x240 drawn
// double width (800x240, nearest) as src/os/screens.ts does. Scales are per
// native pixel. Then it measures each stroke on screen:
//  - uneven: a non-integer magnification must not make some strokes fatter
//    than others (nearest filtering gives 1 or 2 px strokes at 1.14x). Under
//    minification a stroke is thinner than a pixel, so trilinear filtering
//    keeps a bounded residual and gets a looser bound;
//  - crisp: relative to the panel's white, a stroke magnified s times keeps a
//    peak of at least min(1, s/2), the worst phase of a one-pixel edge blend,
//    and a full core from 2x (plain linear filtering blurs it).
// The scales are the measured views: the reported screenshot (1.14 x 1.18), the
// default HOME view (1.1 across, 0.75 down), wheel zoom (1.9) and integer 2x.
//
// Usage: node scripts/test-lcd-display.mjs [--sampler owner|isotropic|legacy|linear] [--chromium PATH]
//   owner   (default) src/scene/lcd-display.ts as shipped; must pass.
//   isotropic  owner on a GPU without anisotropic filtering; must pass.
//   legacy  the 4ee6362 settings (magFilter=NearestFilter, minFilter=LinearFilter,
//           no mipmaps, no shader patch); must fail on uneven strokes.
//   linear  plain trilinear without the shader patch; must fail on blur.
import { createServer } from 'node:http';
import { access, readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CdpSession, launchChromium } from './perf/cdp.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const samplerFlag = args.indexOf('--sampler');
const sampler = samplerFlag >= 0 ? args[samplerFlag + 1] : 'owner';
if (!['owner', 'isotropic', 'legacy', 'linear'].includes(sampler)) throw new Error(`unknown --sampler ${sampler}`);
const flag = args.indexOf('--chromium');
const chromium = (flag >= 0 ? args[flag + 1] : undefined) ?? process.env.CHROMIUM ?? await findChromium();
if (!chromium) { console.error('test-lcd-display: no Chromium found. Pass --chromium PATH or set CHROMIUM.'); process.exit(2); }

// Newest Playwright Chrome for Testing build, then a system Chrome.
async function findChromium() {
  const bin = 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  for (const cache of [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), 'Library/Caches/ms-playwright')].filter(Boolean)) {
    const builds = (await readdir(cache).catch(() => [])).filter(name => /^chromium-\d+$/.test(name)).sort((a, b) => b.split('-')[1] - a.split('-')[1]);
    for (const build of builds) for (const arch of ['chrome-mac-arm64', 'chrome-mac'])
      if (await access(join(cache, build, arch, bin)).then(() => true, () => false)) return join(cache, build, arch, bin);
  }
  const system = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return await access(system).then(() => system, () => undefined);
}

const ts = createRequire(join(root, 'package.json'))('typescript');
const owner = ts.transpileModule(await readFile(join(root, 'src/scene/lcd-display.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;

const page = /* html */`<!doctype html><script>addEventListener('error', e => { window.ready ??= 'page error: ' + e.message; });</script>
<script type="importmap">{"imports":{"three":"/three/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';
import { createLcdDisplayMaterial, createLcdDisplayTexture } from '/lcd-display.js';
const sampler = ${JSON.stringify(sampler)};
const W = 1024, H = 768;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: false }); } catch (error) { window.ready = 'WebGL2 unavailable: ' + error.message; }
const target = renderer && new THREE.WebGLRenderTarget(W, H);
const camera = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
renderer?.setPixelRatio(1); renderer?.setSize(W, H);
// Native strokes plus a solid white band at one end of them, outside the
// measured middle half; the top screen's canvas repeats each column twice.
function strokes(axis, width, doubled) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = 240;
  const g = canvas.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, width, 240); g.fillStyle = '#fff';
  for (let i = 4; i < (axis === 'x' ? width : 240); i += 8) axis === 'x' ? g.fillRect(i, 0, 1, 240) : g.fillRect(0, i, width, 1);
  axis === 'x' ? g.fillRect(0, 0, width, 24) : g.fillRect(0, 0, 24, 240);
  if (!doubled) return canvas;
  const wide = document.createElement('canvas'); wide.width = 2 * width; wide.height = 240;
  const w = wide.getContext('2d'); w.imageSmoothingEnabled = false; w.drawImage(canvas, 0, 0, 2 * width, 240);
  return wide;
}
function display(canvas, grid) {
  const texture = createLcdDisplayTexture(canvas, renderer);
  if (sampler === 'isotropic') texture.anisotropy = 1;
  const material = createLcdDisplayMaterial(texture, .26, grid);
  // legacy: 4ee6362 src/scene/console-scene.ts, verbatim sampler.
  if (sampler === 'legacy') { texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false; }
  if (sampler === 'legacy' || sampler === 'linear') { material.onBeforeCompile = () => {}; material.customProgramCacheKey = () => sampler; }
  return material;
}
window.measure = (screen, axis, sx, sy, phase) => {
  const native = screen === 'top' ? 400 : 320, scene = new THREE.Scene(), material = display(strokes(axis, native, screen === 'top'), [native, 240]);
  const w = native * sx, h = 240 * sy, x0 = 37.37 + phase, y0 = 29.61 + phase;  // deliberately off the pixel grid
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material); mesh.position.set(x0 + w / 2, y0 + h / 2, 0); scene.add(mesh);
  renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
  const px = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(target, 0, 0, W, H, px);
  // Profile across the strokes, averaged over the middle half of the panel.
  const along = axis === 'x' ? W : H, scale = axis === 'x' ? sx : sy, origin = axis === 'x' ? x0 : y0;
  const across = axis === 'x' ? [Math.ceil(y0 + h / 4), Math.floor(y0 + 3 * h / 4)] : [Math.ceil(x0 + w / 4), Math.floor(x0 + 3 * w / 4)];
  const profile = new Float64Array(along);
  for (let a = 0; a < along; a++) { let sum = 0; for (let b = across[0]; b < across[1]; b++) { const i = axis === 'x' ? (b * W + a) * 4 : (a * W + b) * 4; sum += px[i]; } profile[a] = sum / (across[1] - across[0]); }
  let white = 1; for (let i = 0; i < px.length; i += 4) white = Math.max(white, px[i]);
  const weights = [], peaks = [];
  for (let i = 12; i < (axis === 'x' ? native : 240) - 12; i += 8) {
    const centre = origin + (i + .5) * scale, from = Math.ceil(centre - 4 * scale), to = Math.floor(centre + 4 * scale);
    let sum = 0, peak = 0; for (let a = from; a < to; a++) { sum += profile[a]; peak = Math.max(peak, profile[a]); }
    weights.push(sum / white / scale); peaks.push(peak / white);
  }
  scene.remove(mesh); mesh.geometry.dispose(); material.emissiveMap.dispose(); material.dispose();
  return { minWeight: Math.min(...weights), maxWeight: Math.max(...weights), minPeak: Math.min(...peaks) };
};
if (renderer) window.ready = true;
</script>`;

const three = join(root, 'node_modules/three/build');
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  try {
    if (path === '/') return res.writeHead(200, { 'content-type': 'text/html' }).end(page);
    if (path === '/lcd-display.js') return res.writeHead(200, { 'content-type': 'text/javascript' }).end(owner);
    if (/^\/three\/[\w.]+\.js$/.test(path)) return res.writeHead(200, { 'content-type': 'text/javascript' }).end(await readFile(join(three, path.slice(7))));
  } catch {}
  res.writeHead(404).end();
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

// [label, screen, axis, sx, sy]: scales per native pixel.
const CASES = [
  ['reported screenshot, across', 'bottom', 'x', 1.14, 1.18],
  ['reported screenshot, down', 'bottom', 'y', 1.14, 1.18],
  ['default HOME view, across', 'bottom', 'x', 1.1, .75],
  ['default HOME view, down', 'bottom', 'y', 1.1, .75],
  ['wheel zoom 1.9x', 'bottom', 'x', 1.9, 1.9],
  ['integer 2x', 'bottom', 'x', 2, 2],
  ['minified 0.6x', 'bottom', 'x', .6, .6],
  ['top, default HOME view, across', 'top', 'x', 1.1, .75],
  ['top, default HOME view, down', 'top', 'y', 1.1, .75],
  ['top, wheel zoom 1.9x', 'top', 'x', 1.9, 1.9],
];
const PHASES = [0, .25, .5, .75];
// Stroke weight max/min: magnified, and minified along the measured axis.
const UNEVEN_MAX = 1.08, UNEVEN_MINIFIED_MAX = 1.5, CRISP_MIN = .95, CRISP_EPSILON = .03;
const crispMin = scale => scale >= 2 ? CRISP_MIN : Math.min(1, scale / 2) - CRISP_EPSILON;
const browser = await launchChromium(chromium);
let failures = 0;
try {
  const session = await CdpSession.openPage(browser.port);
  await session.send('Runtime.enable');
  await session.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  await session.waitFor('window.ready !== undefined', 30000);
  const ready = await session.evaluate('window.ready');
  if (ready !== true) throw new Error(`test page: ${ready}`);
  console.log(`LCD display sampling (${sampler === 'owner' ? 'src/scene/lcd-display.ts' : sampler}), phases ${PHASES.join('/')}: stroke weight max/min <= ${UNEVEN_MAX} (minified ${UNEVEN_MINIFIED_MAX}), peak/white >= min(1, s/2) - ${CRISP_EPSILON} when magnified, >= ${CRISP_MIN} from 2x`);
  for (const [label, screen, axis, sx, sy] of CASES) {
    const scale = axis === 'x' ? sx : sy, results = [];
    for (const phase of PHASES) results.push(await session.evaluate(`measure(${JSON.stringify(screen)}, ${JSON.stringify(axis)}, ${sx}, ${sy}, ${phase})`));
    const minWeight = Math.min(...results.map(r => r.minWeight)), maxWeight = Math.max(...results.map(r => r.maxWeight)), minPeak = Math.min(...results.map(r => r.minPeak));
    const uneven = maxWeight / Math.max(minWeight, 1e-3), problems = [];
    if (uneven > (scale < 1 ? UNEVEN_MINIFIED_MAX : UNEVEN_MAX)) problems.push(`uneven strokes ${uneven.toFixed(2)}x`);
    if (scale >= 1 && minPeak < crispMin(scale)) problems.push(`blurred core ${minPeak.toFixed(2)} < ${crispMin(scale).toFixed(2)}`);
    if (problems.length) failures++;
    console.log(`  ${problems.length ? 'FAIL' : 'ok  '} ${label} (${sx} x ${sy}): weight ${minWeight.toFixed(2)}-${maxWeight.toFixed(2)}, core ${minPeak.toFixed(2)}${problems.length ? ` <- ${problems.join(', ')}` : ''}`);
  }
  await session.close();
} finally {
  // Chromium can still be writing its profile when cdp.mjs removes it.
  await browser.close().catch(() => {}); server.close();
}
if (failures) { console.error(`test-lcd-display: ${failures} case(s) failed. Show LCD canvases only through createLcdDisplayTexture() / createLcdDisplayMaterial().`); process.exit(1); }
console.log('test-lcd-display: ok');
