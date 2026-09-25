import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const created = [];
globalThis.__stockBannerModel = {
  createFirmwareModel(asset, playback, options) {
    const instance = { asset, playback, options, bindings: [], disposed: false,
      setTexture(name, image, mode) { this.bindings.push({ name, image, mode }); return true; },
      dispose() { this.disposed = true; } };
    created.push(instance); return instance;
  }, loadFirmwareModel() { throw new Error('Expected injected loader'); },
};
const source = readFileSync(new URL('../src/scene/stock-title-banner.ts', import.meta.url), 'utf8')
  .replace(/^import .* from '.\/firmware-model';\n/m, 'const { createFirmwareModel, loadFirmwareModel } = globalThis.__stockBannerModel;\n');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createStockTitleBannerResourceHost, prepareStockTitleBanner } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const read = (kind, slot) => JSON.parse(readFileSync(new URL(`../public/os/firmware/10.7.0-32E/models/${kind}-banner-${slot}/model.json`, import.meta.url), 'utf8'));
const asset = (kind, slot) => { const data = read(kind, slot); return { data, images: new Map(data.textures.map(t => [t.name, { width: t.width, height: t.height, data: new Uint8ClampedArray(t.width * t.height * 4) }])) }; };

test('four published type-1 pairs bind every locale texture and keep common-only textures', () => {
  for (const kind of ['camera', 'sound', 'health', 'eshop']) {
    const common = asset(kind, 'common'), eur = asset(kind, 'eur');
    const model = prepareStockTitleBanner(kind, common, eur);
    assert.deepEqual(model.bindings.map(binding => binding.name), eur.data.textures.map(texture => texture.name));
    assert.ok(model.bindings.every(binding => binding.mode.allowSizeChange === true));
    assert.deepEqual(model.playback.material.map(clip => clip.name), kind === 'sound' ? ['COMMON'] : []);
    assert.equal(model.asset, common);
    model.dispose();
  }
});

test('a source mismatch fails closed before constructing a GPU model', () => {
  const count = created.length, common = asset('camera', 'common');
  common.data.sourceSha256 = 'wrong';
  assert.throws(() => prepareStockTitleBanner('camera', common, asset('camera', 'eur')), /Invalid camera/);
  assert.equal(created.length, count);
});

test('retarget and disposal prevent stale loads from publishing a prepared primary', async () => {
  const jobs = [];
  const host = createStockTitleBannerResourceHost(url => new Promise(resolve => jobs.push({ url, resolve })));
  const camera = { generation: 'session', requestEpoch: 1, kind: 'camera' };
  const sound = { generation: 'session', requestEpoch: 2, kind: 'sound' };
  const first = host.request(camera); const second = host.request(sound);
  assert.equal(jobs.length, 4);
  for (const job of jobs.slice(0, 2)) job.resolve(asset('camera', job.url.includes('-common/') ? 'common' : 'eur'));
  await first;
  assert.equal(host.status(camera).ready, false);
  for (const job of jobs.slice(2)) job.resolve(asset('sound', job.url.includes('-common/') ? 'common' : 'eur'));
  await second;
  const model = host.status(sound).model;
  assert.equal(host.status(sound).ready, true);
  host.dispose();
  assert.equal(model.disposed, true);
  assert.equal(host.status(sound).ready, false);
});
