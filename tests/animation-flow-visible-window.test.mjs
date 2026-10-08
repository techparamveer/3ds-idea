import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { animationBrowserLaunchOptions, assertFreshWindowGate, main, parseVisibleWindow } from '../scripts/verify-animation-flow.mjs';

function options(root, extra = {}) {
  return { 'visible-window': true, 'window-x': '-1200', 'window-y': '80', 'window-width': '1100',
    'window-height': '780', 'ready-file': join(root, 'ready.json'), 'continue-file': join(root, 'continue.json'),
    'window-timeout-ms': '1000', ...extra };
}

async function fixture(t, extra = {}) {
  const root = await mkdtemp(join(tmpdir(), 'animation-window-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const modulePath = join(root, 'playwright.mjs'), log = join(root, 'calls.jsonl');
  await writeFile(modulePath, `
    import { appendFile } from 'node:fs/promises';
    const record = value => appendFile(${JSON.stringify(log)}, JSON.stringify(value) + '\\n');
    export const chromium = { launch: async options => {
      await record({ launch: options });
      return { close: () => record({ closed: true }), newPage: async options => {
        await record({ newPage: options });
        ${extra.newPageFailure ? "throw new Error('newPage failed');" : ''}
        return { url: () => 'about:blank', viewportSize: () => options.viewport,
          emulateMedia: async () => {}, on: () => {},
          goto: async url => { await record({ goto: url }); throw new Error('scenario sentinel'); },
          locator: () => ({ evaluate: async () => null }), screenshot: async () => {} };
      } };
    } };
  `);
  const values = options(root, extra.values);
  const args = ['--playwright-module', modulePath, '--browser-executable', '/unused/chromium',
    '--output', join(root, 'output'), '--commit', 'a'.repeat(40), '--width', '1000', '--height', '700'];
  if (!extra.defaultMode) for (const [key, value] of Object.entries(values)) {
    args.push(value === true ? `--${key}` : `--${key}=${value}`);
  }
  return { root, values, args, calls: async () => (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse) };
}

async function readReady(path) {
  const deadline = performance.now() + 2000;
  while (performance.now() < deadline) {
    try { return JSON.parse(await readFile(path, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
    await delay(5);
  }
  throw new Error('No ready marker');
}

test('visible window is opt-in and default launch options remain unchanged', () => {
  assert.equal(parseVisibleWindow({}), null);
  assert.equal(parseVisibleWindow({ 'visible-window': false }), null);
  assert.deepEqual(animationBrowserLaunchOptions('/browser', null), {
    executablePath: '/browser', headless: true, args: ['--mute-audio'],
  });
  for (const key of ['window-x', 'window-y', 'window-width', 'window-height', 'ready-file', 'continue-file', 'window-timeout-ms']) {
    assert.throws(() => parseVisibleWindow({ [key]: '1' }), /require --visible-window/);
  }
});

test('visible mode requires explicit geometry, absolute gate paths and a bounded timeout', () => {
  const good = options('/tmp/window-test');
  for (const key of ['window-x', 'window-y', 'window-width', 'window-height', 'ready-file', 'continue-file']) {
    assert.throws(() => parseVisibleWindow({ ...good, [key]: undefined }));
  }
  for (const [key, value] of [['window-x', '1.5'], ['window-y', 'NaN'], ['window-width', '0'],
    ['window-height', '-1'], ['ready-file', 'relative'], ['continue-file', 'relative'],
    ['window-timeout-ms', '0'], ['window-timeout-ms', '300001']]) {
    assert.throws(() => parseVisibleWindow({ ...good, [key]: value }));
  }
  assert.deepEqual(animationBrowserLaunchOptions('/browser', parseVisibleWindow(good)), {
    executablePath: '/browser', headless: false,
    args: ['--mute-audio', '--window-position=-1200,80', '--window-size=1100,780'],
  });
});

test('fresh gate rejects identical paths, directory aliases and existing signals', async t => {
  const f = await fixture(t), config = parseVisibleWindow(f.values);
  await assertFreshWindowGate(config);
  await assert.rejects(assertFreshWindowGate({ ...config, continueFile: config.readyFile }), /distinct/);
  const alias = join(f.root, 'alias');
  await symlink(f.root, alias);
  await assert.rejects(assertFreshWindowGate({ ...config, continueFile: join(alias, 'ready.json') }), /distinct/);
  for (const path of [config.readyFile, config.continueFile]) {
    await writeFile(path, '{}');
    await assert.rejects(main(f.args), /already exists/);
    await rm(path);
  }
  await symlink(join(f.root, 'missing'), config.continueFile);
  await assert.rejects(assertFreshWindowGate(config), /already exists/);
});

test('headed browser stays blank until the coordinator returns this run token, then closes on scenario failure', async t => {
  const f = await fixture(t);
  const completion = assert.rejects(main(f.args), /scenario sentinel/);
  const ready = await readReady(f.values['ready-file']);
  assert.equal(ready.event, 'animation-window-ready');
  assert.equal(ready.pageUrl, 'about:blank');
  assert.equal(ready.muted, true);
  assert.deepEqual(ready.requestedBounds, { x: -1200, y: 80, width: 1100, height: 780 });
  assert.deepEqual(ready.viewport, { width: 1000, height: 700 });
  assert.equal((await f.calls()).some(call => call.goto), false);
  await delay(30);
  assert.equal((await f.calls()).some(call => call.goto), false);
  await writeFile(f.values['continue-file'], JSON.stringify({ token: ready.token }), { flag: 'wx' });
  await completion;
  const calls = await f.calls();
  assert.equal(calls[0].launch.headless, false);
  assert.deepEqual(calls.at(-1), { closed: true });
  assert.equal(calls.filter(call => call.goto).length, 1);
  const diagnostic = JSON.parse(await readFile(join(f.root, 'output/visible-window.json'), 'utf8'));
  assert.equal(diagnostic.status, 'confirmed');
  assert.equal(diagnostic.token, ready.token);
  const failure = JSON.parse(await readFile(join(f.root, 'output/failure.json'), 'utf8'));
  assert.equal(failure.windowConfirmation.token, ready.token);
});

test('a stale token created after ready cannot start the scenario', async t => {
  const f = await fixture(t);
  const completion = assert.rejects(main(f.args), /fresh ready token/);
  await readReady(f.values['ready-file']);
  await writeFile(f.values['continue-file'], JSON.stringify({ token: 'previous-run' }), { flag: 'wx' });
  await completion;
  const calls = await f.calls();
  assert.equal(calls.some(call => call.goto), false);
  assert.deepEqual(calls.at(-1), { closed: true });
  assert.equal(JSON.parse(await readFile(join(f.root, 'output/visible-window.json'), 'utf8')).status, 'failed');
});

test('confirmation timeout keeps diagnostics, avoids navigation and closes the owned browser', async t => {
  const f = await fixture(t, { values: { 'window-timeout-ms': '30' } });
  await assert.rejects(main(f.args), /timed out after 30ms/);
  const calls = await f.calls();
  assert.equal(calls.some(call => call.goto), false);
  assert.deepEqual(calls.at(-1), { closed: true });
  assert.equal(JSON.parse(await readFile(join(f.root, 'output/visible-window.json'), 'utf8')).status, 'failed');
  assert.match(JSON.parse(await readFile(join(f.root, 'output/failure.json'), 'utf8')).error, /timed out/);
});

test('page creation failure also closes the owned browser and retains diagnostics', async t => {
  const f = await fixture(t, { newPageFailure: true });
  await assert.rejects(main(f.args), /newPage failed/);
  assert.deepEqual((await f.calls()).at(-1), { closed: true });
  assert.match(JSON.parse(await readFile(join(f.root, 'output/failure.json'), 'utf8')).error, /newPage failed/);
});

test('no visible flag retains headless launch and navigates without gate files', async t => {
  const f = await fixture(t, { defaultMode: true });
  await assert.rejects(main(f.args), /scenario sentinel/);
  const calls = await f.calls();
  assert.deepEqual(calls[0].launch, { executablePath: '/unused/chromium', headless: true, args: ['--mute-audio'] });
  assert.equal(calls.filter(call => call.goto).length, 1);
  await assert.rejects(readFile(f.values['ready-file']), { code: 'ENOENT' });
  assert.deepEqual(calls.at(-1), { closed: true });
});
