import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const mac = process.platform === 'darwin';
const root = process.env.AZAHAR_WINDOW_RECORDER_TEST_OUTPUT;
if (root) assert.equal(root, resolve(root), 'Test artifact root must be absolute');
if (root) mkdirSync(root, { recursive: true });
const output = mac ? mkdtempSync(join(root ?? tmpdir(), 'azahar-window-offline-')) : null;
const binary = output && join(output, 'recorder');
const compile = mac ? spawnSync('xcrun', ['swiftc', '-parse-as-library', '-swift-version', '5', '-target', `${process.arch === 'arm64' ? 'arm64' : 'x86_64'}-apple-macos15.0`, 'scripts/reference/azahar-window-record.swift', '-o', binary], { encoding: 'utf8', timeout: 120_000 }) : null;
if (mac) writeFileSync(join(output, 'compile.log'), (compile.stdout ?? '') + (compile.stderr ?? ''));
const run = args => spawnSync(binary, args, { encoding: 'utf8', timeout: 10_000 });
const bounds = { x: 0, y: 0, width: 1800, height: 1169 };
const windowBounds = { x: 40, y: 81, width: 511, height: 645 };
const request = { pid: 42, windowID: 300, displayID: 1, bundleID: 'org.example.Azahar', executable: '/private/isolated/Azahar.app/Contents/MacOS/azahar', executableSha256: 'a'.repeat(64), displayBounds: bounds, windowBounds, seconds: 2, output: '/private/artifacts/unused-pilot' };
const identity = { ...request, onScreen: true, displayBuiltin: true, layer: 0, launchTime: 100 };
const fixture = () => ({ request: structuredClone(request), before: structuredClone(identity), after: structuredClone(identity), permissionGranted: true, outputExists: false, completion: { started: true, finished: true, failure: null, videoTracks: 1, audioTracks: 0, width: 1022, height: 1290, expectedWidth: 1022, expectedHeight: 1290, duration: 2 } });
let serial = 0;
const validate = value => {
  const file = join(output, `fixture-${serial++}.json`);
  writeFileSync(file, JSON.stringify(value));
  return run(['--validate-fixture', file]);
};

test('exact-window recorder compiles against the installed macOS SDK', { skip: !mac }, () => {
  assert.equal(compile.error, undefined);
  assert.equal(compile.status, 0, compile.stderr);
});
test('help and self-test are explicitly offline', { skip: !mac }, () => {
  const help = run(['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /No activation, input, display fallback or permission request/);
  const self = run(['--self-test']);
  assert.equal(self.status, 0, self.stderr);
  assert.deepEqual(JSON.parse(self.stdout), { mode: 'offline-self-test', captureAttempted: false, passed: true });
});
test('real Swift identity/completion validators accept the exact offline snapshot', { skip: !mac }, () => {
  const result = validate(fixture());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { mode: 'offline-fixture', captureAttempted: false, accepted: true });
});

const rejections = [
  ['zero PID', f => f.request.pid = 0, /Positive PID/],
  ['zero window', f => f.request.windowID = 0, /Positive PID/],
  ['unbounded duration', f => f.request.seconds = 91, /Duration/],
  ['relative output', f => f.request.output = 'pilot', /absolute output/],
  ['noncanonical output', f => f.request.output = '/private/artifacts/../pilot', /absolute output/],
  ['missing grant', f => f.permissionGranted = false, /Existing screen-capture permission/],
  ['existing output', f => f.outputExists = true, /Output already exists/],
  ['stale window', f => f.before.windowID = 301, /PID\/window/],
  ['wrong owner PID', f => f.before.pid = 43, /PID\/window/],
  ['wrong bundle', f => f.before.bundleID = 'com.openai.Codex', /Bundle\/executable/],
  ['wrong executable', f => f.before.executable = '/Applications/Azahar.app/Contents/MacOS/azahar', /Bundle\/executable/],
  ['wrong binary bytes', f => f.before.executableSha256 = 'b'.repeat(64), /Bundle\/executable/],
  ['external display', f => f.before.displayBuiltin = false, /Built-in display/],
  ['changed display geometry', f => f.before.displayBounds.width++, /Built-in display/],
  ['window outside MacBook', f => f.request.windowBounds.x = 1800, /wholly inside/],
  ['hidden window', f => f.before.onScreen = false, /Window moved, hidden/],
  ['wrong layer', f => f.before.layer = 2, /Window moved, hidden/],
  ['window moved', f => f.after.windowBounds.x++, /Window moved, hidden/],
  ['process replaced after capture', f => f.after.launchTime++, /Process replaced/],
  ['wrong final executable', f => f.after.executableSha256 = 'b'.repeat(64), /Bundle\/executable/],
  ['missing start', f => f.completion.started = false, /not successfully finalized/],
  ['missing finalization', f => f.completion.finished = false, /not successfully finalized/],
  ['recording error', f => f.completion.failure = 'stream failed', /not successfully finalized/],
  ['audio track', f => f.completion.audioTracks = 1, /silent video track/],
  ['wrong movie dimensions', f => f.completion.width = 1800, /Movie dimensions/],
  ['empty movie', f => f.completion.duration = 0, /Empty movie/],
];
for (const [name, mutate, expected] of rejections) {
  test(`offline validation rejects ${name}`, { skip: !mac }, () => {
    const value = fixture(); mutate(value);
    const result = validate(value);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, expected);
    assert.equal(result.stdout, '');
  });
}
test('malformed recording CLI rejects before any live API', { skip: !mac }, () => {
  for (const args of [[], ['--pid', '42'], ['--display', '1'], ['--validate-fixture', 'relative.json']]) {
    const result = run(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
  }
});
