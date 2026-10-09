import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';
import { BitmapFont } from '../src/os/bitmap-font.ts';
import { nativeTextureSamplePixels } from '../src/os/native-layout.ts';
import { decodeNativePng } from '../src/os/native-png.ts';
import { manualSources } from '../src/os/stock-manual-index.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const json = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source,
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64');
const countMaterials = !['scalar', 'implicit'].includes(process.env.NATIVE_DESTINATION_MODE);
const layoutUrl = moduleUrl(readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8')
  .replace('export function evaluateNativeMaterial(', countMaterials ? `export let materialEvaluations=0;
export function evaluateNativeMaterial(...args){materialEvaluations++;return measuredMaterial(...args);}
function measuredMaterial(` : 'export const materialEvaluations=0;\nexport function evaluateNativeMaterial(')
  .replace('export function rasterNativePicture(', `export const pictureRasters=[];
export function rasterNativePicture(...args){const start=performance.now();const output=measuredRaster(...args);pictureRasters.push({name:args[0].materials[args[1].material].name,width:args[2],height:args[3],ms:performance.now()-start});return output;}
function measuredRaster(`));
const { pictureRasters, setCompiledRasterEnabled } = await import(layoutUrl);
const measuredLayout = await import(layoutUrl);
const amiibo = moduleUrl('export const drawNativeAmiibo=()=>false;export const amiiboScreenPacks=[];');
const compile = (name, scalar = false) => {
  const url = new URL(`../src/os/${name}.ts`, import.meta.url);
  let source = readFileSync(url, 'utf8');
  if (scalar) {
    assert.match(source, /const implicitText=[^;]+;/, 'the reference must disable only the implicit fast path');
    source = source.replace(/const implicitText=[^;]+;/, 'const implicitText=false;');
  }
  return moduleUrl(source.replace(/(from\s*['"])(\.[^'"]+?)(['"])/g,
    (_all, prefix, path, suffix) => prefix + (path === './stock-native-amiibo' ? amiibo : path === './native-layout' ? layoutUrl : new URL(`${path}.ts`, url).href) + suffix));
};
const { drawNativeHelperFrame, nativeHelperView } = await import(compile('stock-native-helpers'));
const { NativeLayoutRenderer } = await import(compile('native-renderer'));
const { NativeLayoutRenderer: ScalarRenderer } = await import(compile('native-renderer', true));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const canvasModule = process.env.NATIVE_DESTINATION_CANVAS_MODULE;

// This transport stub compares the renderer's source bytes, not Canvas
// destination filtering. The optional installed-Canvas check below covers that boundary.
function transportCanvas() {
  const canvas = { width: 1, height: 1, draws: [] };
  const context = { canvas, globalAlpha: 1, globalCompositeOperation: 'source-over',
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, rect() {}, clip() {}, clearRect() {},
    createImageData(width, height) { return { width, height, data: new Uint8ClampedArray(width * height * 4) }; },
    getImageData(_x, _y, width, height) { return canvas.image ? { ...canvas.image, data: canvas.image.data.slice() } : this.createImageData(width, height); },
    putImageData(image) { canvas.image = { ...image, data: image.data.slice() }; },
    drawImage(source, ...rect) { canvas.draws.push({ width: source.width, height: source.height, data: source.image.data.slice(), rect, alpha: this.globalAlpha, blend: this.globalCompositeOperation }); },
  };
  canvas.getContext = () => context;
  return canvas;
}
function specimen(material, alpha = 255, colors = [[255, 33, 0, 255], [0, 223, 127, 71]]) {
  const layout = structuredClone(json('packs/manual/layout-ContentsTxt.json').layouts.ContentsTxt);
  const pane = layout.roots[0].children[0];
  pane.size = [19, 7]; pane.alpha = alpha; pane.children = [];
  pane.text = { ...pane.text, material: 0, font: 0, value: 'fixture', topColor: colors[0], bottomColor: colors[1], size: [8, 8], characterSpacing: 0, lineSpacing: 0 };
  layout.roots = [pane]; layout.materials = [material]; layout.fonts = ['fixture'];
  const pack = { schema: 1, layouts: { test: layout }, animations: {}, textures: {}, messages: {} };
  const font = { manifest: { colorMode: 'alpha', width: 25, height: 30, baseline: 25, glyphs: {}, fallback: null },
    drawNative(ctx) {
      const image = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
      for (let at = 0; at < image.data.length; at++) image.data[at] = (at * 37 + 13) % 256;
      ctx.putImageData(image, 0, 0);
    } };
  return { pack, fonts: new Map([['fixture', font]]) };
}
const implicitMaterial = () => structuredClone(json('packs/manual/layout-ContentsTxt.json').layouts.ContentsTxt.materials[0]);
function transportPaint(Renderer, fixture, limit) {
  const renderer = new Renderer({ test: fixture.pack }, { test: new Map() }, fixture.fonts, limit), target = transportCanvas();
  const before = measuredLayout.materialEvaluations;
  const okay = renderer.draw(target.getContext('2d'), 'test', 'test');
  return { renderer, target, okay, evaluations: measuredLayout.materialEvaluations - before };
}

test('implicit text keeps scalar source bytes for every pane alpha, gradients, registers and clamp ties', () => {
  const previous = globalThis.document; globalThis.document = { createElement: transportCanvas };
  try {
    for (let alpha = 0; alpha <= 255; alpha++) {
      const material = implicitMaterial();
      material.bufferColor = [alpha % 256, 23, 191, 47]; material.constantColors[0] = [255 - alpha, 222, 53, alpha];
      const fixture = specimen(material, alpha);
      const generic = transportPaint(ScalarRenderer, fixture), optimized = transportPaint(NativeLayoutRenderer, fixture);
      try {
        assert.equal(generic.okay, true); assert.equal(optimized.okay, true);
        assert.deepEqual(optimized.target.draws, generic.target.draws, `source pixels, blend and geometry at alpha ${alpha}`);
        if (countMaterials && alpha) assert.ok(generic.evaluations > 0);
        assert.equal(optimized.evaluations, 0, 'prepare implicit registers once, never once per ink pixel');
      } finally { generic.renderer.dispose(); optimized.renderer.dispose(); }
    }
    for (const constants of [[], [[127.5, 127.5, 127.5, 127.5]]]) {
      const material = implicitMaterial(); material.constantColors = constants; material.bufferColor = [127.5, 127.5, 127.5, 127.5];
      const fixture = specimen(material, 255, [[255, 255, 255, 255], [255, 255, 255, 255]]);
      const generic = transportPaint(ScalarRenderer, fixture), optimized = transportPaint(NativeLayoutRenderer, fixture);
      assert.deepEqual(optimized.target.draws, generic.target.draws); generic.renderer.dispose(); optimized.renderer.dispose();
    }
  } finally { globalThis.document = previous; }
});

test('TEV, alpha compare, FLYT and unsupported material fields retain scalar evaluation and failures', () => {
  const previous = globalThis.document; globalThis.document = { createElement: transportCanvas };
  try {
    const variants = [
      material => { material.alphaCompare = { function: 6, reference: 0.5 }; },
      material => { material.sourceFormat = 'FLYT'; },
      material => { material.unsupported = ['future']; },
      material => { material.tevStages = [{ constantSelectors: 17, color: { sources: [0, 5, 4], operands: [0, 0, 0], mode: 1, scale: 1, savePrevious: false }, alpha: { sources: [0, 5, 4], operands: [0, 0, 0], mode: 1, scale: 1, savePrevious: false } }]; },
      material => { material.sourceFormat = 'FLYT'; material.unsupported = ['future']; },
      material => { material.constantColors.push(null); },
      material => { material.tevStages = [{ constantSelectors: 17, color: { sources: [8], operands: [0], mode: 0, scale: 1, savePrevious: false }, alpha: { sources: [0], operands: [99], mode: 0, scale: 1, savePrevious: false } }]; },
    ];
    for (const [index, edit] of variants.entries()) {
      const material = implicitMaterial(); edit(material);
      const fixture = specimen(material), generic = transportPaint(ScalarRenderer, fixture), optimized = transportPaint(NativeLayoutRenderer, fixture);
      try {
        assert.equal(optimized.okay, generic.okay, `fallback ${index}`); assert.deepEqual(optimized.target.draws, generic.target.draws);
        if (index < 4) { assert.equal(optimized.okay, true); if (countMaterials) assert.ok(optimized.evaluations > 0); }
        else { assert.equal(optimized.okay, false); assert.equal(optimized.target.draws.length, 0); assert.ok(optimized.renderer.diagnostics.length); }
      } finally { generic.renderer.dispose(); optimized.renderer.dispose(); }
    }
    for (const missing of ['font', 'material']) {
      const fixture = specimen(implicitMaterial());
      if (missing === 'font') fixture.fonts.clear(); else fixture.pack.layouts.test.roots[0].text.material = 99;
      const generic = transportPaint(ScalarRenderer, fixture), optimized = transportPaint(NativeLayoutRenderer, fixture);
      assert.equal(generic.okay, false); assert.equal(optimized.okay, false); assert.deepEqual(optimized.target.draws, []);
      assert.ok(optimized.renderer.diagnostics.length); generic.renderer.dispose(); optimized.renderer.dispose();
    }
  } finally { globalThis.document = previous; }
});

test('implicit text still uses bounded snapshots and disposal, including an uncached raster', () => {
  const previous = globalThis.document; globalThis.document = { createElement: transportCanvas };
  try {
    for (const limit of [1, 600]) {
      const fixture = specimen(implicitMaterial()), { renderer, target, okay } = transportPaint(NativeLayoutRenderer, fixture, limit);
      assert.equal(okay, true); const bytes = target.draws[0].data;
      for (const value of ['different', 'fixture', 'different', 'fixture']) {
        assert.equal(renderer.draw(target.getContext('2d'), 'test', 'test', { overrides: { Contents_Txt: { text: value } } }), true);
        assert.deepEqual(target.draws.at(-1).data, bytes); assert.ok(renderer.cacheBytes <= limit);
      }
      const cached = [...renderer.cache.values()]; renderer.dispose(); assert.equal(renderer.cacheBytes, 0);
      for (const canvas of cached) assert.deepEqual([canvas.width, canvas.height], [0, 0]);
      assert.equal(renderer.draw(target.getContext('2d'), 'test', 'test'), false);
    }
  } finally { globalThis.document = previous; }
});

test('Manual destination actual Canvas equivalence and CPU profile', { skip: !canvasModule }, async t => {
  assert.ok(canvasModule.startsWith('/'), 'supply the existing offline Canvas module by absolute path');
  const { createCanvas, loadImage } = await import(pathToFileURL(canvasModule));
  setCompiledRasterEnabled(true);
  const mode = process.env.NATIVE_DESTINATION_MODE ?? 'equivalence';
  assert.ok(['scalar', 'implicit', 'equivalence'].includes(mode));
  const previous = globalThis.document;
  globalThis.document = { createElement: () => createCanvas(1, 1) };
  const manifestPath = fileURLToPath(new URL('fonts/shared/font.json', root));
  const manifest = json('fonts/shared/font.json');
  const sheets = await Promise.all(manifest.sheets.map(name => loadImage(join(dirname(manifestPath), name))));
  // Production borrows one shared original font across destination owners.
  const font = new BitmapFont(manifest, sheets), reports = [], assets = new Map();
  const asset = path => { const bytes = readFileSync(new URL(path, root)); assets.set(path, sha256(bytes)); return bytes; };
  asset('fonts/shared/font.json'); for (const name of manifest.sheets) asset(`fonts/shared/${name}`);
  let comparedTextBytes = 0, comparedTargetBytes = 0, comparedTextRasters = 0, syntheticCanvasCases = 0;
  try {
    const scenarios = [['0004001000022000', 'main'], ['0004001000022400', 'main']];
    if (mode === 'equivalence') scenarios.push(['0004003000009d02', 'main'], ['0004001000022000', 'document'], ['0004003000009d02', 'document']);
    for (const [titleId, screen] of scenarios) {
      const view = { appId: 'manual', screen, heading: '', rows: [], selection: 0,
        footer: { left: { action: 'back', label: 'Back' } }, data: { manualTitleId: titleId, page: 0 } };
      const packs = Object.fromEntries(nativeHelperView(view).packs.map(request => {
        const pack = JSON.parse(asset(request.url));
        return [request.alias, { ...pack, layouts: Object.fromEntries(request.layouts.map(name => [name, pack.layouts[name]])),
          animations: Object.fromEntries(request.animations.map(name => [name, pack.animations[name]])) }];
      }));
      const decoded = {};
      for (const [alias, pack] of Object.entries(packs)) {
        const images = new Map();
        const names = new Set([...Object.values(pack.layouts), ...Object.values(pack.animations)].flatMap(value => value.textures ?? []));
        for (const name of names) {
          const record = pack.textures[name];
          images.set(name, nativeTextureSamplePixels(await decodeNativePng(asset(record.url), record), record.picaFormat));
        }
        decoded[alias] = images;
      }
      const icon = await decodeNativePng(asset(manualSources[titleId].iconUrl.replace('/os/firmware/10.7.0-32E/', '')), { width: 48, height: 48 });
      const makeRenderer = Renderer => new Renderer(structuredClone(packs), Object.fromEntries(Object.entries(decoded).map(([alias, images]) => [alias, new Map(images)])), new Map([['cbf_std.bcfnt', font]]));
      for (let owner = 0; owner < (mode === 'equivalence' ? 2 : 8); owner++) {
        const renderer = makeRenderer(mode === 'scalar' ? ScalarRenderer : NativeLayoutRenderer);
        const reference = mode === 'equivalence' ? makeRenderer(ScalarRenderer) : undefined;
        const draw = renderer.draw.bind(renderer), calls = [], textCalls = [], textSources = [], scalarSources = [];
        const captureSource = (output, pane, sources) => sources.push({ name: pane.name, width: output.canvas.width, height: output.canvas.height,
          phase: output.phase, extra: output.extra, above: output.above, below: output.below, direct: output.direct, writer0101: output.writer0101,
          data: output.canvas.getContext('2d').getImageData(0, 0, output.canvas.width, output.canvas.height).data });
        if (reference) {
          const text = reference.text.bind(reference);
          reference.text = (...args) => { const output = text(...args); captureSource(output, args[1], scalarSources); return output; };
        }
        const text = renderer.text.bind(renderer);
        renderer.text = (...args) => {
          const start = performance.now(); const output = text(...args);
          if (reference) captureSource(output, args[1], textSources);
          textCalls.push({ name: args[1].name, ms: performance.now() - start }); return output;
        };
        renderer.draw = (...args) => {
          const start = performance.now(); const okay = draw(...args);
          calls.push({ pack: args[1], layout: args[2], ms: performance.now() - start }); return okay;
        };
        try {
          for (let paint = 0; paint < 2; paint++) {
            pictureRasters.length = 0; calls.length = 0; textCalls.length = 0; textSources.length = 0; scalarSources.length = 0;
            const top = createCanvas(400, 240), bottom = createCanvas(320, 240);
            const evaluations = measuredLayout.materialEvaluations;
            const start = performance.now();
            assert.equal(drawNativeHelperFrame(renderer, top.getContext('2d'), bottom.getContext('2d'), view, { font, nativeImage: () => icon }), true, renderer.diagnostics.join('\n'));
            const ms = performance.now() - start;
            const upper = top.getContext('2d').getImageData(0, 0, 400, 240).data, lower = bottom.getContext('2d').getImageData(0, 0, 320, 240).data;
            const report = { titleId, screen, owner, paint, ms, materialEvaluations: measuredLayout.materialEvaluations - evaluations,
              calls: calls.slice(), texts: textCalls.slice(), rasters: pictureRasters.slice(), cacheBytes: renderer.cacheBytes,
              upper: sha256(upper), lower: sha256(lower),
              textSources: textSources.map(({ data, ...source }) => ({ ...source, sha256: sha256(data) })) };
            assert.ok(renderer.cacheBytes <= 8 * 1024 * 1024);
            if (reference) {
              const scalarTop = createCanvas(400, 240), scalarBottom = createCanvas(320, 240);
              const scalarEvaluations = measuredLayout.materialEvaluations;
              assert.equal(drawNativeHelperFrame(reference, scalarTop.getContext('2d'), scalarBottom.getContext('2d'), view, { font, nativeImage: () => icon }), true, reference.diagnostics.join('\n'));
              report.scalarMaterialEvaluations = measuredLayout.materialEvaluations - scalarEvaluations;
              assert.deepEqual(textSources, scalarSources, `${titleId}/${screen}/${owner}/${paint} every text source RGBA byte and placement metadata`);
              assert.deepEqual(upper, scalarTop.getContext('2d').getImageData(0, 0, 400, 240).data);
              assert.deepEqual(lower, scalarBottom.getContext('2d').getImageData(0, 0, 320, 240).data);
              comparedTextRasters += textSources.length; comparedTextBytes += textSources.reduce((sum, source) => sum + source.data.length, 0);
              comparedTargetBytes += upper.length + lower.length;
            }
            reports.push(report);
          }
        } finally { renderer.dispose(); reference?.dispose(); }
      }
    }
    if (mode === 'equivalence') for (const alpha of [37, 128, 255]) for (const spans of [false, true]) for (const opaque of [false, true]) {
      const material = implicitMaterial(); material.bufferColor = [47, 121, 193, 29]; material.constantColors[0] = [211, 39, 93, 237];
      const fixture = specimen(material, alpha), pane = fixture.pack.layouts.test.roots[0];
      pane.text.alignment = 4; pane.text.lineAlignment = 2;
      if (spans) pane.text.colorSpans = [{ start: 1, end: 3, color: [37, 151, 207, 113] }];
      const paint = Renderer => {
        const renderer = new Renderer({ test: fixture.pack }, { test: new Map() }, fixture.fonts), target = createCanvas(80, 30), ctx = target.getContext('2d');
        try {
          ctx.fillStyle = opaque ? 'rgb(17,107,199)' : 'rgba(17,107,199,0.6)'; ctx.fillRect(0, 0, 80, 30);
          ctx.fillStyle = 'rgba(223,41,73,0.4)'; ctx.fillRect(20, 0, 40, 30); ctx.globalAlpha = 0.75;
          assert.equal(renderer.draw(ctx, 'test', 'test', { center: [40.25, 15.75], textSampling: 'lcd-source-size' }), true, renderer.diagnostics.join('\n'));
          return ctx.getImageData(0, 0, 80, 30).data;
        } finally { renderer.dispose(); }
      };
      assert.deepEqual(paint(NativeLayoutRenderer), paint(ScalarRenderer), `actual Canvas gradient/alpha ${alpha}, spans ${spans}, opaque ${opaque}`);
      syntheticCanvasCases++;
    }
  } finally { globalThis.document = previous; }
  const result = { mode, countMaterials, node: process.version, platform: process.platform, arch: process.arch, canvasModule,
    limitations: 'Installed offline CPU Canvas, not browser/GPU/native timing; actual selected delivered packs, textures and original shared font, borrowed across owners; no asset loading or publication timing included. Equivalence mode includes readback overhead and is not a CPU benchmark. Owner0/paint0 is cold; owner1+ fresh renderer/font-warm and paint1 cached are separate.',
    sourceFiles: Object.fromEntries(['src/os/native-renderer.ts', 'src/os/stock-native-helpers.ts', 'src/os/native-layout.ts', 'src/os/bitmap-font.ts'].map(path => [path, sha256(readFileSync(new URL(`../${path}`, import.meta.url)))])),
    assets: Object.fromEntries(assets), comparedTextRasters, comparedTextBytes, comparedTargetBytes, syntheticCanvasCases, reports };
  if (process.env.NATIVE_DESTINATION_ARTIFACT_DIR) {
    const out = process.env.NATIVE_DESTINATION_ARTIFACT_DIR; assert.ok(out.startsWith('/')); mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'profile.json'), JSON.stringify(result, null, 2) + '\n');
  }
  const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  t.diagnostic(JSON.stringify({ mode, comparedTextRasters, comparedTextBytes, comparedTargetBytes, syntheticCanvasCases,
    summaries: scenariosFor(reports).map(([titleId, screen]) => {
      const rows = reports.filter(row => row.titleId === titleId && row.screen === screen), fresh = rows.filter(row => row.owner > 0 && row.paint === 0);
      return { titleId, screen, firstMs: rows[0].ms, freshOwnerMedianMs: median(fresh.map(row => row.ms)),
        freshOwnerTextMedianMs: median(fresh.map(row => row.texts.reduce((sum, text) => sum + text.ms, 0))),
        cachedMedianMs: median(rows.filter(row => row.paint === 1).map(row => row.ms)) };
    }) }));
});

function scenariosFor(reports) {
  return [...new Map(reports.map(row => [row.titleId + '/' + row.screen, [row.titleId, row.screen]])).values()];
}
