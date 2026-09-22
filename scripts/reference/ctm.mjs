#!/usr/bin/env node
// Independent offline reader/editor of Azahar 2126.1.2 CTM files.
// Format evidence and playback limitations: docs/ctm-reference.md.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REVISION = '9e6f523a57fac9564ac0bf8286db3c3702d301ec';
export const HEADER_SIZE = 256;
export const RECORD_SIZE = 7;
export const CLOCK_RATE = 268111856;
export const PAD_TICKS = Math.floor(CLOCK_RATE / 234);
export const RECORD_TYPES = [
  'padAndCircle', 'touch', 'accelerometer', 'gyroscope', 'irRst', 'extraHidResponse',
];
export const BUTTONS = [
  'A', 'B', 'SELECT', 'START', 'RIGHT', 'LEFT', 'UP', 'DOWN',
  'R', 'L', 'X', 'Y', 'DEBUG', 'GPIO14',
];
const MAGIC = Buffer.from([0x43, 0x54, 0x4d, 0x1b]);
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const nominalMs = (samples) => samples * PAD_TICKS * 1000 / CLOCK_RATE;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function hex(value, length, name) {
  check(typeof value === 'string' && new RegExp(`^[0-9a-f]{${length}}$`, 'i').test(value),
    `${name} must be ${length} hexadecimal characters`);
  return value.toLowerCase();
}

function integer(value, min, max, name) {
  check(Number.isSafeInteger(value) && value >= min && value <= max,
    `${name} must be an integer in [${min}, ${max}]`);
}

function exactKeys(value, names, label) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  check(Object.keys(value).length === names.length && names.every((name) => Object.hasOwn(value, name)),
    `${label} requires exactly: ${names.join(', ')}`);
}

export function decodeRecord(bytes, offset) {
  const type = bytes[offset];
  check(type < RECORD_TYPES.length, `Unknown CTM record type ${type} at byte ${offset}`);
  const data = { type: RECORD_TYPES[type], offset };
  if (type === 0) {
    const mask = bytes.readUInt16LE(offset + 1);
    return { ...data, mask, buttons: BUTTONS.filter((_, bit) => mask & (1 << bit)),
      circle: [bytes.readInt16LE(offset + 3), bytes.readInt16LE(offset + 5)] };
  }
  if (type === 1) {
    check(bytes[offset + 5] <= 1, `Non-boolean touch validity at byte ${offset}`);
    return { ...data, x: bytes.readUInt16LE(offset + 1), y: bytes.readUInt16LE(offset + 3),
      valid: bytes[offset + 5] === 1 };
  }
  if (type === 2 || type === 3) {
    return { ...data, xyz: [1, 3, 5].map((delta) => bytes.readInt16LE(offset + delta)) };
  }
  if (type === 4) {
    check(bytes[offset + 5] <= 1 && bytes[offset + 6] <= 1, `Non-boolean IR button at byte ${offset}`);
    return { ...data, cStick: [bytes.readInt16LE(offset + 1), bytes.readInt16LE(offset + 3)],
      zl: bytes[offset + 5] === 1, zr: bytes[offset + 6] === 1 };
  }
  const bits = bytes.readUInt32LE(offset + 1);
  return { ...data, battery: bits & 31, zlHeld: !(bits & 32), zrHeld: !(bits & 64),
    rHeld: !(bits & 128), cStick: [(bits >>> 8) & 4095, bits >>> 20] };
}

export function parseCtm(bytes) {
  check(Buffer.isBuffer(bytes), 'CTM input must be a Buffer');
  check(bytes.length > HEADER_SIZE, 'CTM requires a 256-byte header and at least one record');
  check(bytes.subarray(0, 4).equals(MAGIC), 'Invalid CTM magic');
  check((bytes.length - HEADER_SIZE) % RECORD_SIZE === 0, 'Truncated CTM record');
  const records = [];
  const histogram = Object.fromEntries(RECORD_TYPES.map((type) => [type, 0]));
  for (let offset = HEADER_SIZE; offset < bytes.length; offset += RECORD_SIZE) {
    const record = decodeRecord(bytes, offset);
    records.push(record);
    histogram[record.type]++;
  }
  const inputCount = bytes.readBigUInt64LE(84);
  check(inputCount === 0n || inputCount === BigInt(histogram.padAndCircle),
    `Header input_count ${inputCount} differs from ${histogram.padAndCircle} pad records`);
  const author = bytes.subarray(48, 80);
  const nul = author.indexOf(0);
  const header = {
    titleId: bytes.readBigUInt64LE(4).toString(16).padStart(16, '0'),
    revision: bytes.subarray(12, 32).toString('hex'),
    clockInitTime: bytes.readBigUInt64LE(32).toString(),
    movieId: bytes.readBigUInt64LE(40).toString(16).padStart(16, '0'),
    author: author.subarray(0, nul === -1 ? author.length : nul).toString('utf8'),
    rerecordCount: bytes.readUInt32LE(80),
    inputCount: inputCount.toString(),
    timingBaseTicks: bytes.readBigInt64LE(92).toString(),
  };
  const warnings = [];
  if (header.revision !== REVISION) warnings.push('Unverified revision: decoded using the 2126.1.2 layout assumption. Transformation is disabled.');
  if (inputCount === 0n) warnings.push('Zero input_count: Azahar accepts this legacy convention; transformation is disabled.');
  return { header, records, histogram, warnings };
}

// The HID callback consumes a pad record immediately followed by a touch record.
// Reject schedules we cannot safely associate; never invent or reorder records.
function pairedSamples(records) {
  const samples = [];
  for (let i = 0; i < records.length; i++) {
    if (records[i].type === 'touch') throw new Error(`Unpaired touch record at byte ${records[i].offset}`);
    if (records[i].type !== 'padAndCircle') continue;
    check(records[i + 1]?.type === 'touch', `Pad record at byte ${records[i].offset} lacks an adjacent touch record`);
    samples.push({ pad: records[i], touch: records[++i] });
  }
  return samples;
}

export function inspectCtm(bytes, { timeline = false } = {}) {
  const parsed = parseCtm(bytes);
  const report = {
    formatAssumption: 'Azahar 2126.1.2 CTM', sha256: sha256(bytes), byteLength: bytes.length,
    header: parsed.header, recordCount: parsed.records.length, histogram: parsed.histogram,
    timing: { padPeriodTicks: PAD_TICKS, clockRate: CLOCK_RATE,
      nominalDurationMs: nominalMs(parsed.histogram.padAndCircle),
      note: 'No timestamps in CTM. Nominal duration counts HID sample periods; it is not wall time or a verified video-frame timeline.' },
    warnings: parsed.warnings,
  };
  let samples;
  try {
    samples = pairedSamples(parsed.records);
    report.padTouchPairs = true;
  } catch (error) {
    report.padTouchPairs = false;
    report.warnings.push(error.message);
    if (timeline) throw error;
  }
  if (timeline) {
    report.timeline = [];
    for (const [sample, { pad, touch }] of samples.entries()) {
      const state = { mask: pad.mask, buttons: pad.buttons, circle: pad.circle,
        touch: { x: touch.x, y: touch.y, valid: touch.valid } };
      const previous = report.timeline.at(-1);
      if (previous && JSON.stringify(previous.state) === JSON.stringify(state)) {
        previous.endSample = sample + 1;
      } else {
        report.timeline.push({ startSample: sample, endSample: sample + 1,
          nominalStartMs: nominalMs(sample), padByteOffset: pad.offset, state });
      }
    }
  }
  return report;
}

export function transformCtm(template, plan, configSnapshot) {
  exactKeys(plan, ['schemaVersion', 'expected', 'phases'], 'plan');
  check(plan.schemaVersion === 1, 'Unsupported plan schemaVersion');
  exactKeys(plan.expected, ['titleId', 'revision', 'templateSha256', 'configSnapshotSha256'], 'expected');
  const expected = plan.expected;
  check(hex(expected.templateSha256, 64, 'templateSha256') === sha256(template), 'Template SHA-256 mismatch');
  check(Buffer.isBuffer(configSnapshot) && configSnapshot.length > 0, 'Supply a nonempty captured configuration snapshot');
  check(hex(expected.configSnapshotSha256, 64, 'configSnapshotSha256') === sha256(configSnapshot), 'Configuration snapshot SHA-256 mismatch');
  const parsed = parseCtm(template);
  check(hex(expected.revision, 40, 'revision') === REVISION && parsed.header.revision === REVISION,
    'Transformation requires the verified Azahar 2126.1.2 revision');
  check(hex(expected.titleId, 16, 'titleId') === parsed.header.titleId, 'Title ID mismatch');
  check(parsed.header.inputCount !== '0', 'Transformation requires a nonzero verified input_count');
  const samples = pairedSamples(parsed.records);
  check(Array.isArray(plan.phases) && plan.phases.length > 0, 'Provide at least one phase');
  let previousEnd = 0;
  // Validate the entire plan before editing the copied bytes.
  const phases = plan.phases.map((phase, index) => {
    const label = `phases[${index}]`;
    exactKeys(phase, ['startSample', 'endSample', 'buttons', 'circle', 'touch'], label);
    integer(phase.startSample, previousEnd, samples.length - 1, `${label}.startSample`);
    integer(phase.endSample, phase.startSample + 1, samples.length, `${label}.endSample`);
    previousEnd = phase.endSample;
    check(Array.isArray(phase.buttons) && new Set(phase.buttons).size === phase.buttons.length,
      `${label}.buttons must be a list without duplicates`);
    let mask = 0;
    for (const button of phase.buttons) {
      check(BUTTONS.includes(button), `Unknown button ${button}; HOME is not encoded in CTM`);
      mask |= 1 << BUTTONS.indexOf(button);
    }
    check(Array.isArray(phase.circle) && phase.circle.length === 2, `${label}.circle requires [x, y]`);
    phase.circle.forEach((value, axis) => integer(value, -154, 154, `${label}.circle[${axis}]`));
    if (phase.touch !== null) {
      exactKeys(phase.touch, ['x', 'y'], `${label}.touch`);
      integer(phase.touch.x, 0, 319, `${label}.touch.x`);
      integer(phase.touch.y, 0, 239, `${label}.touch.y`);
    }
    return { ...phase, mask };
  });
  const output = Buffer.from(template);
  for (const phase of phases) {
    for (let sample = phase.startSample; sample < phase.endSample; sample++) {
      const { pad, touch } = samples[sample];
      // Keep reserved pad bits and touch padding, including nonzero template bytes.
      output.writeUInt16LE((pad.mask & 0xc000) | phase.mask, pad.offset + 1);
      output.writeInt16LE(phase.circle[0], pad.offset + 3);
      output.writeInt16LE(phase.circle[1], pad.offset + 5);
      output.writeUInt16LE(phase.touch?.x ?? 0, touch.offset + 1);
      output.writeUInt16LE(phase.touch?.y ?? 0, touch.offset + 3);
      output[touch.offset + 5] = phase.touch === null ? 0 : 1;
    }
  }
  return {
    output,
    manifest: {
      schemaVersion: 1, tool: 'offline CTM template transform', verifiedSourceRevision: REVISION,
      titleId: parsed.header.titleId, templateSha256: sha256(template), outputSha256: sha256(output),
      configSnapshotSha256: sha256(configSnapshot),
      configValidation: 'Supplied bytes match the planned snapshot hash. Live emulator settings and snapshot completeness are not validated.',
      phaseSampleCount: phases.reduce((sum, phase) => sum + phase.endSample - phase.startSample, 0),
      totalSampleCount: samples.length, recordCount: parsed.records.length, phases: plan.phases,
      preserves: ['entire header', 'file size', 'record type order', 'sensor and IR payloads', 'unselected samples', 'unused bits and padding'],
      playbackVerified: false,
    },
  };
}

async function main(args) {
  if (args[0] === 'inspect' && (args.length === 2 || (args.length === 3 && args[2] === '--timeline'))) {
    return inspectCtm(await readFile(args[1]), { timeline: args.length === 3 });
  }
  if (args[0] === 'transform' && args.length === 5) {
    const [template, planBytes, configSnapshot] = await Promise.all(args.slice(1, 4).map((path) => readFile(path)));
    const { output, manifest } = transformCtm(template, JSON.parse(planBytes.toString('utf8')), configSnapshot);
    await writeFile(args[4], output, { flag: 'wx' });
    return { ...manifest, planSha256: sha256(planBytes), outputPath: resolve(args[4]) };
  }
  throw new Error('Usage: node scripts/reference/ctm.mjs inspect INPUT.ctm [--timeline]\n       node scripts/reference/ctm.mjs transform TEMPLATE.ctm PLAN.json CONFIG_SNAPSHOT OUTPUT.ctm');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then((report) => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`))
    .catch((error) => { process.stderr.write(`ctm: ${error.message}\n`); process.exitCode = 1; });
}
