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
const selfTest = mac && compile.status === 0 ? run(['--self-test']) : null;
const procBsdInfoSize = selfTest?.status === 0 ? JSON.parse(selfTest.stdout).procBsdInfoSize : null;
const bounds = { x: 0, y: 0, width: 1800, height: 1169 };
const windowBounds = { x: 40, y: 81, width: 511, height: 645 };
const request = { pid: 42, windowID: 300, displayID: 1, bundleID: 'org.example.Azahar', executable: '/private/isolated/Azahar.app/Contents/MacOS/azahar', executableSha256: 'a'.repeat(64), displayBounds: bounds, windowBounds, seconds: 2, output: '/private/artifacts/unused-pilot' };
const identity = { ...request, onScreen: true, displayBuiltin: true, layer: 0, appKitLaunchTime: null };
const processInfo = { bytesReturned: procBsdInfoSize, pid: request.pid, startSeconds: 1792083687, startMicroseconds: 631364 };
const snapshot = () => ({ window: structuredClone(identity), processReads: [structuredClone(processInfo), structuredClone(processInfo)] });
const fixture = () => ({ request: structuredClone(request), before: snapshot(), after: snapshot(), permissionGranted: true, outputExists: false, completion: { started: true, finished: true, failure: null, videoTracks: 1, audioTracks: 0, width: 1022, height: 1290, expectedWidth: 1022, expectedHeight: 1290, duration: 2 } });
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
  assert.equal(selfTest.status, 0, selfTest.stderr);
  assert.ok(Number.isInteger(procBsdInfoSize) && procBsdInfoSize > 0);
  assert.deepEqual(JSON.parse(selfTest.stdout), { mode: 'offline-self-test', captureAttempted: false, passed: true, procBsdInfoSize });
});
test('real Swift snapshot collection accepts valid kernel identity without an AppKit launch date', { skip: !mac }, () => {
  const result = validate(fixture());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { mode: 'offline-fixture', captureAttempted: false, accepted: true });
});
test('AppKit launch dates remain optional observations alongside required kernel identity', { skip: !mac }, () => {
  for (const dates of [[100, 100], [undefined, undefined], [undefined, 100], [100, undefined]]) {
    const value = fixture();
    value.before.window.appKitLaunchTime = dates[0];
    value.after.window.appKitLaunchTime = dates[1];
    const result = validate(value);
    assert.equal(result.status, 0, result.stderr);
  }
});
test('a zero microsecond component is valid in a positive kernel start time', { skip: !mac }, () => {
  const value = fixture();
  for (const phase of [value.before, value.after]) {
    for (const info of phase.processReads) info.startMicroseconds = 0;
  }
  const result = validate(value);
  assert.equal(result.status, 0, result.stderr);
});

const rejections = [
  ['zero PID', f => f.request.pid = 0, /Positive PID/],
  ['zero window', f => f.request.windowID = 0, /Positive PID/],
  ['unbounded duration', f => f.request.seconds = 91, /Duration/],
  ['relative output', f => f.request.output = 'pilot', /absolute output/],
  ['noncanonical output', f => f.request.output = '/private/artifacts/../pilot', /absolute output/],
  ['missing grant', f => f.permissionGranted = false, /Existing screen-capture permission/],
  ['existing output', f => f.outputExists = true, /Output already exists/],
  ['stale window', f => f.before.window.windowID = 301, /PID\/window/],
  ['wrong owner PID', f => f.before.window.pid = 43, /PID\/window/],
  ['wrong bundle', f => f.before.window.bundleID = 'com.openai.Codex', /Bundle\/executable/],
  ['wrong executable', f => f.before.window.executable = '/Applications/Azahar.app/Contents/MacOS/azahar', /Bundle\/executable/],
  ['wrong binary bytes', f => f.before.window.executableSha256 = 'b'.repeat(64), /Bundle\/executable/],
  ['external display', f => f.before.window.displayBuiltin = false, /Built-in display/],
  ['changed display geometry', f => f.before.window.displayBounds.width++, /Built-in display/],
  ['window outside MacBook', f => f.request.windowBounds.x = 1800, /wholly inside/],
  ['hidden window', f => f.before.window.onScreen = false, /Window moved, hidden/],
  ['wrong layer', f => f.before.window.layer = 2, /Window moved, hidden/],
  ['window moved', f => f.after.window.windowBounds.x++, /Window moved, hidden/],
  ['process replaced after capture', f => f.after.processReads.forEach(info => info.startSeconds++), /Process replaced during capture/],
  ['process replaced within the same second', f => f.after.processReads.forEach(info => info.startMicroseconds++), /Process replaced during capture/],
  ['invalid optional AppKit date', f => f.before.window.appKitLaunchTime = 0, /Invalid AppKit launch time/],
  ['changed optional AppKit date', f => { f.before.window.appKitLaunchTime = 100; f.after.window.appKitLaunchTime = 101; }, /AppKit launch time changed/],
  ['missing kernel identity despite valid AppKit dates', f => {
    f.before.window.appKitLaunchTime = f.after.window.appKitLaunchTime = 100;
    f.before.processReads[0].bytesReturned = 0;
  }, /Kernel process identity unavailable or incomplete/],
  ['consistently wrong kernel PID', f => {
    for (const phase of [f.before, f.after]) phase.processReads.forEach(info => info.pid++);
  }, /Kernel process PID mismatch/],
  ['consistently zero kernel start time', f => {
    for (const phase of [f.before, f.after]) phase.processReads.forEach(info => info.startSeconds = 0);
  }, /Invalid kernel process start time/],
  ['consistently invalid microsecond component', f => {
    for (const phase of [f.before, f.after]) phase.processReads.forEach(info => info.startMicroseconds = 1_000_000);
  }, /Invalid kernel process start time/],
  ['wrong final executable', f => f.after.window.executableSha256 = 'b'.repeat(64), /Bundle\/executable/],
  ['missing start', f => f.completion.started = false, /not successfully finalized/],
  ['missing finalization', f => f.completion.finished = false, /not successfully finalized/],
  ['recording error', f => f.completion.failure = 'stream failed', /not successfully finalized/],
  ['audio track', f => f.completion.audioTracks = 1, /silent video track/],
  ['wrong movie dimensions', f => f.completion.width = 1800, /Movie dimensions/],
  ['empty movie', f => f.completion.duration = 0, /Empty movie/],
];
for (const phase of ['before', 'after']) {
  rejections.push(
    [`process replaced while reading ${phase} snapshot`, f => f[phase].processReads[1].startMicroseconds++, /Process replaced while reading snapshot/],
    [`missing second ${phase} kernel read`, f => f[phase].processReads.pop(), /two kernel reads/],
    [`prevalidated ${phase} identity instead of kernel reads`, f => { delete f[phase].processReads; f[phase].processGeneration = processInfo; }, /processReads/],
  );
  for (const index of [0, 1]) {
    for (const [name, mutate, expected] of [
      ['unavailable kernel info', info => info.bytesReturned = 0, /Kernel process identity unavailable or incomplete/],
      ['failed kernel query', info => info.bytesReturned = -1, /Kernel process identity unavailable or incomplete/],
      ['short kernel info', info => info.bytesReturned--, /Kernel process identity unavailable or incomplete/],
      ['oversized kernel info', info => info.bytesReturned++, /Kernel process identity unavailable or incomplete/],
      ['wrong kernel PID', info => info.pid++, /Kernel process PID mismatch/],
      ['zero kernel PID', info => info.pid = 0, /Kernel process PID mismatch/],
      ['zero kernel start', info => info.startSeconds = 0, /Invalid kernel process start time/],
      ['overflow microseconds', info => info.startMicroseconds = 1_000_000, /Invalid kernel process start time/],
      ['negative kernel start', info => info.startSeconds = -1, /DecodingError/],
      ['fractional kernel start', info => info.startSeconds = 1.5, /DecodingError/],
      ['negative kernel microseconds', info => info.startMicroseconds = -1, /DecodingError/],
      ['missing kernel start', info => delete info.startSeconds, /startSeconds/],
    ]) {
      rejections.push([`${name} in ${phase} read ${index + 1}`, f => mutate(f[phase].processReads[index]), expected]);
    }
  }
}
rejections.push(['microsecond replacement without floating-point rounding', f => {
  for (const phase of [f.before, f.after]) {
    for (const info of phase.processReads) { info.startSeconds = 2 ** 53; info.startMicroseconds = 0; }
  }
  f.after.processReads.forEach(info => info.startMicroseconds = 1);
}, /Process replaced during capture/]);
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
