import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectCtm, parseCtm, transformCtm, sha256, REVISION } from '../scripts/reference/ctm.mjs';

const config = Buffer.from('Synthetic configuration fixture; no firmware or native recording.');
const titleId = '0000000000001111';
// Hand-encoded records exercise signed values, bit positions, and preserved padding.
const pad = '00018066ff9a00'; // A + reserved bit 15; circle (-154, 154).
const touch = '013f01ef0001a5'; // (319,239), held; nonzero padding.
const accel = '02ffff00800100';
const gyro = '03010002000300';
const ir = '04ffff02000100';
const extra = '05bfbc3a12ccdd'; // battery31, ZL released, ZR held, R released, sticks abc/123.

function fixture(records = [pad, touch, accel, gyro, ir, extra, pad, touch, pad, touch]) {
  const header = Buffer.alloc(256, 0x5a);
  Buffer.from('43544d1b', 'hex').copy(header, 0);
  header.writeBigUInt64LE(BigInt(`0x${titleId}`), 4);
  Buffer.from(REVISION, 'hex').copy(header, 12);
  header.writeBigUInt64LE(9007199254740993n, 32);
  header.writeBigUInt64LE(0xabcdef0123456789n, 40);
  header.fill(0, 48, 80);
  header.write('fixture', 48);
  header.writeUInt32LE(7, 80);
  header.writeBigUInt64LE(BigInt(records.filter((hex) => hex.startsWith('00')).length), 84);
  header.writeBigInt64LE(-1234567890123456n, 92);
  return Buffer.concat([header, ...records.map((hex) => Buffer.from(hex, 'hex'))]);
}

function phase(startSample = 0, endSample = 1, overrides = {}) {
  return { startSample, endSample, buttons: ['B', 'UP', 'Y'], circle: [20, -30], touch: { x: 160, y: 120 }, ...overrides };
}

function plan(bytes, phases = [phase(), phase(1, 2, { buttons: [], circle: [0, 0], touch: null })]) {
  return { schemaVersion: 1, expected: { titleId, revision: REVISION,
    templateSha256: sha256(bytes), configSnapshotSha256: sha256(config) }, phases };
}

test('decodes source-defined header offsets without losing 64-bit precision', () => {
  const { header, histogram, records, warnings } = parseCtm(fixture());
  assert.deepEqual(header, { titleId, revision: REVISION, clockInitTime: '9007199254740993',
    movieId: 'abcdef0123456789', author: 'fixture', rerecordCount: 7,
    inputCount: '3', timingBaseTicks: '-1234567890123456' });
  assert.deepEqual(histogram, { padAndCircle: 3, touch: 3, accelerometer: 1,
    gyroscope: 1, irRst: 1, extraHidResponse: 1 });
  assert.equal(records.length, 10);
  assert.deepEqual(warnings, []);
});

test('decodes every record kind, signed axes and active-low extra HID bits', () => {
  const { records } = parseCtm(fixture());
  assert.deepEqual(records[0], { type: 'padAndCircle', offset: 256, mask: 32769, buttons: ['A'], circle: [-154, 154] });
  assert.deepEqual(records[1], { type: 'touch', offset: 263, x: 319, y: 239, valid: true });
  assert.deepEqual(records[2].xyz, [-1, -32768, 1]);
  assert.deepEqual(records[3].xyz, [1, 2, 3]);
  assert.deepEqual(records[4], { type: 'irRst', offset: 284, cStick: [-1, 2], zl: true, zr: false });
  assert.deepEqual(records[5], { type: 'extraHidResponse', offset: 291, battery: 31,
    zlHeld: false, zrHeld: true, rHeld: false, cStick: [0xabc, 0x123] });
});

test('rejects malformed headers, partial records, unknown types, bad booleans and count mismatches', () => {
  assert.throws(() => parseCtm(Buffer.alloc(256)), /at least one record/);
  const badMagic = fixture(); badMagic[3] = 0;
  assert.throws(() => parseCtm(badMagic), /magic/);
  assert.throws(() => parseCtm(fixture().subarray(0, -1)), /Truncated/);
  const unknown = fixture(); unknown[256] = 6;
  assert.throws(() => parseCtm(unknown), /Unknown CTM/);
  const badTouch = fixture(); badTouch[268] = 2;
  assert.throws(() => parseCtm(badTouch), /Non-boolean touch/);
  const badIr = fixture(); badIr[289] = 2;
  assert.throws(() => parseCtm(badIr), /Non-boolean IR/);
  const wrongCount = fixture(); wrongCount.writeBigUInt64LE(4n, 84);
  assert.throws(() => parseCtm(wrongCount), /input_count/);
});

test('reports legacy or unverified headers but refuses to transform them', () => {
  const legacy = fixture(); legacy.writeBigUInt64LE(0n, 84);
  assert.match(inspectCtm(legacy).warnings[0], /legacy/);
  assert.throws(() => transformCtm(legacy, plan(legacy), config), /nonzero/);
  const unknown = fixture(); unknown[12] ^= 1;
  assert.match(inspectCtm(unknown).warnings[0], /Unverified revision/);
  assert.throws(() => transformCtm(unknown, plan(unknown), config), /verified Azahar/);
});

test('requires adjacent pad/touch pairs and refuses to invent missing input schedules', () => {
  for (const bytes of [fixture([pad]), fixture([pad, accel, touch]), fixture([touch, pad, touch])]) {
    assert.equal(inspectCtm(bytes).padTouchPairs, false);
    assert.throws(() => inspectCtm(bytes, { timeline: true }), /touch record/);
    assert.throws(() => transformCtm(bytes, plan(bytes, [phase()]), config), /touch record/);
  }
});

test('timeline compresses equal controls across sensor events with nominal sample timing', () => {
  const report = inspectCtm(fixture(), { timeline: true });
  assert.equal(report.timeline.length, 1);
  assert.equal(report.timeline[0].startSample, 0);
  assert.equal(report.timeline[0].endSample, 3);
  assert.equal(report.timing.padPeriodTicks, 1145777);
  assert.equal(report.timing.clockRate, 268111856);
  assert.equal(report.timing.nominalDurationMs, 3 * 1145777 * 1000 / 268111856);
});

test('patches held and released phases while preserving every unrelated byte', () => {
  const bytes = fixture();
  const original = Buffer.from(bytes);
  const { output, manifest } = transformCtm(bytes, plan(bytes), config);
  assert.deepEqual(bytes, original, 'caller buffer is not mutated');
  assert.equal(output.length, bytes.length);
  assert.deepEqual(output.subarray(0, 256), bytes.subarray(0, 256));
  assert.deepEqual(output.subarray(270, 298), bytes.subarray(270, 298), 'sensor/IR records retained');
  assert.equal(output.subarray(256, 263).toString('hex'), '0042881400e2ff');
  assert.equal(output.subarray(263, 270).toString('hex'), '01a000780001a5');
  assert.equal(output.subarray(298, 305).toString('hex'), '00008000000000');
  assert.equal(output.subarray(305, 312).toString('hex'), '010000000000a5');
  assert.deepEqual(output.subarray(312), bytes.subarray(312), 'unselected suffix retained');
  assert.equal(manifest.phaseSampleCount, 2);
  assert.equal(manifest.playbackVerified, false);
  assert.equal(manifest.outputSha256, sha256(output));
  assert.deepEqual(parseCtm(output).histogram, parseCtm(bytes).histogram);
  const timeline = inspectCtm(output, { timeline: true }).timeline;
  assert.deepEqual(timeline.map(({ startSample, endSample }) => [startSample, endSample]), [[0, 1], [1, 2], [2, 3]]);
});

test('patching is reproducible and unselected prefixes remain byte-identical', () => {
  const bytes = fixture();
  const edits = plan(bytes, [phase(2, 3)]);
  const first = transformCtm(bytes, edits, config);
  assert.deepEqual(first, transformCtm(bytes, edits, config));
  assert.deepEqual(first.output.subarray(0, 312), bytes.subarray(0, 312));
});

test('requires exact template, configuration snapshot, title and source revision', () => {
  const bytes = fixture();
  for (const [key, value, pattern] of [
    ['templateSha256', '0'.repeat(64), /Template SHA/],
    ['configSnapshotSha256', '0'.repeat(64), /Configuration snapshot SHA/],
    ['titleId', '0000000000002222', /Title ID/],
    ['revision', '0'.repeat(40), /verified Azahar/],
    ['titleId', '1111', /16 hexadecimal/],
  ]) {
    const edits = plan(bytes); edits.expected[key] = value;
    assert.throws(() => transformCtm(bytes, edits, config), pattern);
  }
  assert.throws(() => transformCtm(bytes, plan(bytes), Buffer.alloc(0)), /nonempty/);
});

test('validates complete explicit phases and rejects typos, overlaps, overflow and HOME', () => {
  const bytes = fixture();
  for (const phases of [
    [], [phase(-1)], [phase(0, 0)], [phase(0, 4)], [phase(0.5)],
    [phase(0, 2), phase(1, 3)], [phase(0, 1, { buttons: ['HOME'] })],
    [phase(0, 1, { buttons: ['A', 'A'] })], [phase(0, 1, { circle: [155, 0] })],
    [phase(0, 1, { circle: [0, -155] })], [phase(0, 1, { touch: { x: 320, y: 1 } })],
    [phase(0, 1, { touch: { x: 1, y: 240 } })], [phase(0, 1, { frame: 4 })],
    [phase(0, 1, { touch: undefined })],
  ]) assert.throws(() => transformCtm(bytes, plan(bytes, phases), config));
  const missing = plan(bytes); delete missing.phases[0].buttons;
  assert.throws(() => transformCtm(bytes, missing, config), /requires exactly/);
  const wrongVersion = plan(bytes); wrongVersion.schemaVersion = 2;
  assert.throws(() => transformCtm(bytes, wrongVersion, config), /schemaVersion/);
});

test('CLI inspects and transforms offline, refuses overwrites and leaves no output on invalid plans', () => {
  const dir = mkdtempSync(join(process.env.CTM_TEST_SCRATCH ?? tmpdir(), 'ctm-test-'));
  const cli = fileURLToPath(new URL('../scripts/reference/ctm.mjs', import.meta.url));
  try {
    const bytes = fixture();
    const input = join(dir, 'input.ctm');
    const configPath = join(dir, 'config.snapshot');
    const planPath = join(dir, 'plan.json');
    const output = join(dir, 'output.ctm');
    writeFileSync(input, bytes);
    writeFileSync(configPath, config);
    writeFileSync(planPath, JSON.stringify(plan(bytes)));
    const inspected = JSON.parse(execFileSync(process.execPath, [cli, 'inspect', input, '--timeline']));
    assert.equal(inspected.header.titleId, titleId);
    const args = [cli, 'transform', input, planPath, configPath, output];
    const result = JSON.parse(execFileSync(process.execPath, args));
    assert.equal(result.outputSha256, sha256(readFileSync(output)));
    assert.equal(result.planSha256, sha256(readFileSync(planPath)));
    const second = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.equal(second.status, 1);
    assert.match(second.stderr, /EEXIST/);
    assert.deepEqual(readFileSync(input), bytes);
    args[5] = input;
    assert.equal(spawnSync(process.execPath, args).status, 1);
    assert.deepEqual(readFileSync(input), bytes);
    rmSync(output);
    writeFileSync(planPath, '{}');
    args[5] = output;
    assert.equal(spawnSync(process.execPath, args).status, 1);
    assert.throws(() => readFileSync(output), /ENOENT/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
