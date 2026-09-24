import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { resolve, join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import ts from 'typescript';
import { createNotesIntroComposer } from '../src/os/notes-intro-publication.ts';

const { values } = parseArgs({ options: Object.fromEntries(['artifact-dir', 'asset-root', 'canvas-module'].map(k => [k, { type: 'string' }])) });
for (const k of ['artifact-dir', 'asset-root', 'canvas-module']) assert.ok(isAbsolute(values[k] ?? ''), k);
const root = values['asset-root'], out = values['artifact-dir'], repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(out, { recursive: true });
const compiled = mkdtempSync(join(out, 'compiled-'));
for (const name of ['bitmap-font', 'native-layout', 'native-png', 'native-renderer', 'native-title-assets', 'stock-screen-layout', 'stock-native-personal-tools']) {
  const source = readFileSync(join(repo, 'src/os', name + '.ts'), 'utf8');
  writeFileSync(join(compiled, name + '.mjs'), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g, (_, p) => `from '${p.replace(/\.ts$/, '')}.mjs'`));
}
const load = name => import(pathToFileURL(join(compiled, name + '.mjs')));
const [{ createCanvas, loadImage }, { BitmapFont }, { loadNativeTitleAssets }, { drawNativePersonalToolFrame, personalNotesPacks, personalSelectedNotePacks }] = await Promise.all([
  import(pathToFileURL(values['canvas-module'])), load('bitmap-font'), load('native-title-assets'), load('stock-native-personal-tools'),
]);
globalThis.document = { createElement: () => createCanvas(1, 1) };
globalThis.fetch = async value => {
  const u = new URL(value); assert.equal(u.origin, 'https://notes.invalid');
  const path = resolve(root, u.pathname.slice(1)); assert.ok(path.startsWith(root + '/'));
  return new Response(readFileSync(path));
};
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'))), fontPath = join(root, manifest.fonts.shared), fontData = JSON.parse(readFileSync(fontPath));
const font = new BitmapFont(fontData, await Promise.all(fontData.sheets.map(n => loadImage(join(dirname(fontPath), n)))));
const requests = [...personalNotesPacks, ...personalSelectedNotePacks.filter(p => !personalNotesPacks.some(q => q.alias === p.alias))];
const assets = await loadNativeTitleAssets('https://notes.invalid/manifest.json', '0004003000009c02', requests, new Map([['cbf_std.bcfnt', font]]));
const composer = createNotesIntroComposer();
try {
  const owner = { notesOwner: 'notes-1', applicationOwner: 'camera-1', captureGeneration: 1, titleId: '0004001000022400' };
  const { ticket } = composer.sync({ owner, assetsReady: true, paused: false, startup: 'nonzero-history', metadata: {
    ...owner, status: 'ready', metadata: { selection: { titleId: owner.titleId }, icon: { width: 64, height: 64, data: new Uint8ClampedArray(16384) } },
    capture: { status: 'ready', owner: owner.applicationOwner, generation: 1 },
  } });
  const packs = assets.renderer.packs;
  const sources = {
    title: { layout: packs['notes-image'].layouts.ImageScreenUp, animations: packs['notes-image'].animations },
    upper: { layout: packs['notes-aplt-u'].layouts.ApltBoot_U_00, animations: packs['notes-aplt-u'].animations },
    lower: { layout: packs['notes-aplt-d'].layouts.ApltBoot_D_00, animations: packs['notes-aplt-d'].animations },
  };
  const reports = [], sheet = createCanvas(640, 720), sheetContext = sheet.getContext('2d');
  let row = 0;
  for (let update = 1; update <= 21; update++) {
    composer.step(ticket);
    if (![1, 10, 21].includes(update)) continue;
    const composition = composer.compose(sources), pair = [];
    for (const [column, mode] of ['before', 'after'].entries()) {
      const top = createCanvas(400, 240), bottom = createCanvas(320, 240);
      assert.equal(drawNativePersonalToolFrame(assets.renderer, top.getContext('2d'), bottom.getContext('2d'), { appId: 'game-notes', screen: 'main', selection: 0, rows: [] }, {
        notesIntro: { status: 'posed', ...composition, scene9Draw: mode === 'after' && composition.scene9Draw },
      }), true);
      const hash = createHash('sha256').update(bottom.getContext('2d').getImageData(0, 0, 320, 240).data).digest('hex');
      pair.push(hash); reports.push({ update, mode, scene9Draw: composition.scene9Draw, sha256: hash });
      writeFileSync(join(out, `${mode}-${update}.png`), bottom.toBuffer('image/png'));
      sheetContext.drawImage(bottom, column * 320, row * 240);
    }
    if (update < 21) assert.notEqual(...pair); else assert.equal(...pair);
    row++;
  }
  assert.deepEqual(assets.diagnostics, []);
  writeFileSync(join(out, 'comparison.png'), sheet.toBuffer('image/png'));
  writeFileSync(join(out, 'verification.json'), JSON.stringify({ passed: true, reports, method: 'Actual live painter; original native layout/clip/glyph assets; explicit source update specimens', limits: ['No matched physical-console capture.', 'Lower list SceneIn and no-metadata entry remain existing adaptations.'] }, null, 2) + '\n');
  console.log('PASS: six lower LCD specimens; intro changes frames 1/10 and settled frame21 remains byte-identical.');
} finally { composer.dispose(); assets.dispose(); font.dispose(); }
