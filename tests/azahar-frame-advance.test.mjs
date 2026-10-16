import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { advanceAzaharFrames, parseFrameAdvanceArgs } from '../scripts/reference/azahar-frame-advance.mjs';

const cli = fileURLToPath(new URL('../scripts/reference/azahar-frame-advance.mjs', import.meta.url));
const png = color => sharp({ create: { width: 8, height: 10, channels: 4, background: color } }).png().toBuffer();
const [a, b] = await Promise.all([png('#123456'), png('#abcdef')]);
const base = { pid: 123, mainWindow: 10, renderWindow: 11, steps: 2,
  sidecar: { x: 100, y: -50, width: 200, height: 200 } };
const args = output => ['--pid', '123', '--main-window', '10', '--render-window', '11',
  '--output', output, '--steps', '2', '--sidecar-x', '100', '--sidecar-y=-50',
  '--sidecar-width', '200', '--sidecar-height', '200'];
const windows = () => ({ current_space_id: 85, windows: [
  { pid: 123, window_id: 10, app_name: 'Azahar', title: 'Azahar 2126.1.2',
    bounds: { x: 100, y: -50, width: 80, height: 90 }, is_on_screen: true, on_current_space: true },
  { pid: 123, window_id: 11, app_name: 'Azahar', title: '',
    bounds: { x: 180, y: 50, width: 4, height: 5 }, is_on_screen: true, on_current_space: true },
  { pid: 123, window_id: 99, app_name: 'Azahar', title: '', bounds: { x: 0, y: 0, width: 1, height: 1 } },
] });

function fixture({ snapshots = [a, a, b, b], changeWindows, changeCapture, fail } = {}) {
  const calls = []; let lists = 0, captures = 0, menus = 0;
  const transport = async (tool, input) => {
    calls.push({ tool, input });
    if (fail) await fail(tool, input, { captures, menus, lists });
    if (tool === 'list_windows') {
      const result = windows(); lists++;
      changeWindows?.(result, lists);
      return result;
    }
    if (tool === 'get_window_state') {
      await writeFile(input.screenshot_out_file, snapshots[captures] ?? b, { flag: 'wx' });
      const result = { pid: 123, window_id: 11, screenshot_file_path: input.screenshot_out_file,
        screenshot_frame_valid: true, screenshot_width: 8, screenshot_height: 10, screenshot_scale: 2,
        window_bounds: { x: 180, y: 50, width: 4, height: 5 }, capture_id: `capture-${captures}`,
        snapshot_id: `snapshot-${captures}` };
      captures++; changeCapture?.(result, captures);
      return result;
    }
    if (tool === 'invoke_menu') {
      menus++;
      return { delivery: { mode: 'foreground' }, effect: 'unverifiable', route: 'accessibility',
        summary: 'Resolved the live native menu path and dispatched its final accessibility action.' };
    }
    if (tool === 'end_session') return {};
    throw new Error(`Unexpected tool ${tool}`);
  };
  return { transport, calls };
}

async function scratch(run) {
  const root = await mkdtemp(join(tmpdir(), 'azahar-frame-test-'));
  try { await run(join(root, 'evidence'), root); } finally { await rm(root, { recursive: true, force: true }); }
}
const manifest = async output => JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
const eventLog = async output => (await readFile(join(output, 'events.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);

test('CLI requires explicit safe IDs, a fresh absolute output and bounded Sidecar/step values', () => {
  assert.equal(parseFrameAdvanceArgs(['--help']), null);
  assert.deepEqual(parseFrameAdvanceArgs(args('/tmp/new-evidence')), { ...base, output: '/tmp/new-evidence' });
  assert.equal(parseFrameAdvanceArgs(args('/tmp/new').map((value, index, all) => all[index - 1] === '--steps' ? '120' : value)).steps, 120);
  for (const [flag, value] of [['--pid', '0'], ['--pid', '9007199254740992'], ['--main-window', '-1'],
    ['--render-window', '10'], ['--steps', '121'], ['--steps', '0'], ['--steps', '1.5'],
    ['--sidecar-width', '0'], ['--sidecar-height', '-3'], ['--sidecar-x', 'NaN'], ['--output', 'relative']]) {
    const input = args('/tmp/new'), index = input.indexOf(flag); input[index + 1] = value;
    assert.throws(() => parseFrameAdvanceArgs(input), undefined, `${flag} ${value}`);
  }
  assert.throws(() => parseFrameAdvanceArgs(args('/tmp/new').slice(2)), /Missing --pid/);
  assert.throws(() => parseFrameAdvanceArgs([...args('/tmp/new'), '--pid', '999']), /Duplicate/);
  assert.throws(() => parseFrameAdvanceArgs([...args('/tmp/new'), '--transport', '/tmp/command']), /Unknown option/);
});

test('reused output is rejected before any CLI transport or artifact overwrite', async () => scratch(async output => {
  await mkdir(output); await writeFile(join(output, 'existing'), 'keep');
  const fake = fixture();
  await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport), /EEXIST/);
  assert.equal(fake.calls.length, 0);
  assert.equal(await readFile(join(output, 'existing'), 'utf8'), 'keep');
  assert.deepEqual(await readdir(output), ['existing']);
}));

test('each exact-target action follows a fresh two-window guard and keeps unchanged stepped captures', async () => scratch(async output => {
  const fake = fixture(), report = await advanceAzaharFrames({ ...base, output }, fake.transport);
  assert.deepEqual(fake.calls.map(call => call.tool), ['list_windows', 'get_window_state', 'list_windows', 'get_window_state',
    'list_windows', 'invoke_menu', 'list_windows', 'get_window_state',
    'list_windows', 'invoke_menu', 'list_windows', 'get_window_state', 'end_session']);
  const sessions = new Set(fake.calls.filter(call => call.input.session).map(call => call.input.session));
  assert.equal(sessions.size, 1);
  for (const { tool, input } of fake.calls) {
    if (tool === 'invoke_menu') assert.deepEqual({ ...input, session: null },
      { pid: 123, window_id: 10, path: ['Tools', 'Advance Frame'], session: null });
    if (tool === 'get_window_state') {
      assert.equal(input.window_id, 11); assert.equal(input.pid, 123);
      assert.equal(input.max_image_dimension, 0); assert.equal(input.include_accessibility_tree, false);
    }
  }
  assert.equal(report.status, 'complete'); assert.equal(report.menuRequests, 2); assert.equal(report.menuDispatches, 2);
  assert.equal(report.frozenImagePrecondition, true);
  assert.deepEqual(report.captures.map(capture => capture.differsFromPreviousBytes), [null, false, true, false]);
  for (const capture of report.captures) {
    assert.equal(capture.fullDecode, true); assert.equal(capture.width, 8); assert.equal(capture.height, 10);
    assert.match(capture.sha256, /^[a-f0-9]{64}$/);
    assert.equal(capture.windows.main.window_id, 10); assert.equal(capture.metadata.capture_id.startsWith('capture-'), true);
    assert.ok(BigInt(capture.after.monotonicNs) >= BigInt(capture.before.monotonicNs));
    assert.ok(Number.isFinite(Date.parse(capture.before.utc)));
  }
  assert.deepEqual(await manifest(output), report);
  const events = await eventLog(output);
  assert.equal(events.filter(event => event.semanticAdvancementVerified === false).length, 2);
  for (const event of events.filter(event => event.tool)) {
    const completion = events.find(item => item.id === event.id && item.after);
    assert.ok(completion); assert.ok(BigInt(completion.after.monotonicNs) >= BigInt(event.before.monotonicNs));
  }
}));

test('differing initial PNG bytes abort before the first advance and preserve both captures', async () => scratch(async output => {
  const fake = fixture({ snapshots: [a, b] });
  await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport), /Initial snapshots differ/);
  assert.equal(fake.calls.some(call => call.tool === 'invoke_menu'), false);
  const report = await manifest(output);
  assert.equal(report.status, 'failed'); assert.equal(report.frozenImagePrecondition, false);
  assert.equal(report.captures.length, 2); assert.equal(report.menuDispatches, 0);
  assert.deepEqual(await readFile(join(output, 'frozen-a.png')), a);
  assert.deepEqual(await readFile(join(output, 'frozen-b.png')), b);
}));

test('missing, ambiguous, wrong-owner, offscreen, wrong-Space and out-of-Sidecar windows fail closed', async () => {
  const cases = [
    result => { result.windows.shift(); },
    result => { result.windows.push({ ...result.windows[0] }); },
    result => { result.windows[1].pid = 999; },
    result => { result.windows[0].title = 'Other application'; },
    result => { result.windows[0].app_name = 'Other'; },
    result => { result.windows[0].is_on_screen = false; },
    result => { result.windows[1].on_current_space = false; },
    result => { result.windows[0].bounds.x--; },
    result => { result.windows[1].bounds.x = 298; },
    result => { result.windows[1].bounds.height = 0; },
  ];
  for (const changeWindows of cases) await scratch(async output => {
    const fake = fixture({ changeWindows });
    await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport));
    assert.deepEqual(fake.calls.map(call => call.tool), ['list_windows']);
    assert.equal((await manifest(output)).menuDispatches, 0);
  });
});

test('moving a window after frozen proof aborts before dispatch', async () => scratch(async output => {
  const fake = fixture({ changeWindows(result, count) { if (count === 3) result.windows[0].bounds.x = 0; } });
  await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport), /outside Sidecar/);
  assert.equal(fake.calls.some(call => call.tool === 'invoke_menu'), false);
  assert.equal((await manifest(output)).captures.length, 2);
}));

test('moving a window after dispatch preserves the request and aborts before its capture', async () => scratch(async output => {
  const fake = fixture({ changeWindows(result, count) { if (count === 4) result.windows[1].on_current_space = false; } });
  await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport), /current Space/);
  const report = await manifest(output);
  assert.equal(report.menuDispatches, 1); assert.equal(report.captures.length, 2);
  assert.equal((await eventLog(output)).some(event => event.stepOrdinal === 1), true);
  assert.equal((await readdir(output)).includes('step-001.png'), false);
}));

test('invalid capture identity, frame, path, bounds, scale or dimensions cannot establish the precondition', async () => {
  for (const changeCapture of [
    result => { result.pid++; }, result => { result.window_id++; },
    result => { result.screenshot_frame_valid = false; }, result => { result.screenshot_error = 'capture refused'; },
    result => { result.screenshot_file_path += '.other'; }, result => { result.window_bounds.x++; },
    result => { result.screenshot_scale = 0.5; }, result => { result.screenshot_width = 4; },
    result => { result.screenshot_height = 99; },
    result => { result.screenshot_width = 4; result.screenshot_height = 5; result.screenshot_scale = 1; },
  ]) await scratch(async output => {
    const fake = fixture({ changeCapture });
    await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport));
    const report = await manifest(output);
    assert.equal(report.menuDispatches, 0); assert.equal(report.captures.length, 0);
    assert.equal((await readdir(output)).includes('frozen-a.png'), true, 'failed raw evidence survives');
  });
});

test('PNG decode failure aborts without requesting a step', async () => scratch(async output => {
  const fake = fixture({ snapshots: [a.subarray(0, a.length - 20)] });
  await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport));
  const report = await manifest(output);
  assert.equal(report.menuDispatches, 0); assert.equal(report.captures.length, 0);
  assert.deepEqual(await readFile(join(output, 'frozen-a.png')), a.subarray(0, a.length - 20));
}));

test('a transport failure after one step preserves its evidence without retry or resume', async () => scratch(async output => {
  const fake = fixture({ fail(tool, _input, counts) { if (tool === 'invoke_menu' && counts.menus === 1) throw new Error('Dispatch refused'); } });
  await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport), /Dispatch refused/);
  const report = await manifest(output);
  assert.equal(report.status, 'failed'); assert.equal(report.menuDispatches, 1); assert.equal(report.captures.length, 3);
  assert.equal(report.menuRequests, 2, 'an unsuccessful response does not erase the attempted request');
  assert.equal(fake.calls.filter(call => call.tool === 'invoke_menu').length, 2, 'no retry of a failed request');
  assert.equal(fake.calls.at(-1).tool, 'end_session');
  assert.equal((await eventLog(output)).some(event => event.error === 'Dispatch refused'), true);
}));

test('returned CLI errors abort without stepping and named-session cleanup failures stay explicit', async () => {
  await scratch(async output => {
    await assert.rejects(advanceAzaharFrames({ ...base, output }, async () => ({ error: 'window server refused' })), /returned an error/);
    assert.equal((await manifest(output)).captures.length, 0);
  });
  await scratch(async output => {
    const fake = fixture({ fail(tool) { if (tool === 'end_session') throw new Error('Cleanup refused'); } });
    await assert.rejects(advanceAzaharFrames({ ...base, output }, fake.transport), /Session cleanup: Cleanup refused/);
    assert.equal((await manifest(output)).menuDispatches, 2);
  });
});

test('CLI help documents evidence limits and does not expose an arbitrary transport command', () => {
  const help = execFileSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.match(help, /not native layout epochs/); assert.match(help, /not raw 400x480/);
  assert.match(help, /already-paused/); assert.match(help, /byte-identical/);
  assert.throws(() => execFileSync(process.execPath, [cli, '--transport', '/bin/true'], { stdio: 'pipe' }), /Command failed/);
});
