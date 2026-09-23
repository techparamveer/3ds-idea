import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createKeyboardSequence } from '../src/os/native-keyboard-audio/sequence.ts';
import {
  KEYBOARD_CODE_SHA256, GAIN_STRENGTH_SHA256, encodeGain, decodeGain,
  decodePitch, decodePan, attackCoefficient, decayReleaseStep, gainAttenuation,
} from '../src/os/native-keyboard-audio/math.ts';
import { collectSequence, floatWord } from './helpers/keyboard-sequence-export.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/keyboard-sequence-controls.json', import.meta.url)));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => sha(JSON.stringify(canonical(value)));
const evidenceBytes = process.env.KEYBOARD_SEQUENCE_CONTROL_EVIDENCE
  ? readFileSync(process.env.KEYBOARD_SEQUENCE_CONTROL_EVIDENCE) : null;
const evidence = evidenceBytes && JSON.parse(evidenceBytes);

test('compact math is pinned to original keyboard code and required native values', () => {
  assert.equal(KEYBOARD_CODE_SHA256, fixture.codeSha256);
  assert.equal(GAIN_STRENGTH_SHA256, fixture.math.strengthSha256);
  const strengths = Uint8Array.from({ length: 724 }, (_, i) => encodeGain(i - 723) & 255);
  assert.equal(sha(strengths), GAIN_STRENGTH_SHA256);
  for (const [value, expected] of Object.entries(fixture.math.gainAttenuationSubset)) {
    assert.equal(gainAttenuation(Number(value)), expected);
  }
  for (const [encoded, word] of Object.entries(fixture.math.pitchOriginal1357e0)) {
    assert.equal(floatWord(decodePitch(Number(encoded))), word);
  }
  for (const [parameter, coefficient] of Object.entries(fixture.math.attackSubset)) {
    assert.equal(attackCoefficient(Number(parameter)), coefficient);
  }
  assert.deepEqual([112, 100, 127, 108].map(decayReleaseStep), [548, 295, 65535, 426]);
  assert.deepEqual([-241, -240, -121, -120, -61, -60, 0].map(v => encodeGain(v) >> 8), [3, 2, 2, 1, 1, 0, 0]);
  assert.equal(encodeGain(-1000), encodeGain(-723));
  assert.equal(encodeGain(1), encodeGain(0));
  assert.equal(decodeGain(encodeGain(0)), 1);
  assert.deepEqual([32, 56, 64, 72, 96, 100].map(v => floatWord(decodePan(v))),
    [0xbf000000, 0xbe000000, 0, 0x3e020821, 0x3f020821, 0x3f124925]);
});

for (const expected of fixture.cases) {
  test(`original common_back controls through loop stop: cue ${expected.cue}, stop ${expected.stopAfterUpdate}`, () => {
    const actual = collectSequence(expected);
    assert.equal(actual.controls.length, expected.controlCount);
    assert.equal(digest(actual.controls), expected.digests.controls, 'every ordered control, float word and note/wave owner');
    assert.equal(digest(actual.statuses), expected.digests.statuses, 'every update clock, completion, silence and owner state');
    assert.equal(actual.statuses.at(-1).silent, true);
    assert.deepEqual(actual.controls.filter(row => row.type === 'stop').map(row => row.quantum), expected.stopQuanta);
    if (evidence) {
      const native = evidence.cases.find(c => c.cue === expected.cue && c.stopAfterUpdate === expected.stopAfterUpdate);
      assert.deepEqual(actual.controls, native.controls);
      assert.deepEqual(actual.statuses, native.statuses);
      assert.deepEqual(native.typescriptWaveReplay.commands, native.native.commands);
      assert.equal(digest(native.native.commands), expected.digests.commands);
      assert.equal(native.typescriptWaveReplay.finalActiveVoices, 0);
    }
  });
}

test('private differential evidence remains the reviewed artifact', { skip: !evidence }, () => {
  assert.equal(sha(evidenceBytes), fixture.evidenceSha256);
  assert.equal(evidence.codeSha256, KEYBOARD_CODE_SHA256);
  assert.equal(evidence.cases.length, fixture.cases.length);
});

test('native float clock, deferred wave starts and completion retain their separate boundaries', () => {
  const sequence = createKeyboardSequence(6);
  const clocks = [];
  let first;
  for (let i = 0; i < 6; i++) {
    const batch = sequence.advance();
    if (i === 0) first = batch;
    clocks.push(sequence.status.quantum);
  }
  assert.deepEqual(clocks, [3, 6, 9, 13, 16, 19]);
  assert.deepEqual(first.filter(row => row.type === 'play').map(row => row.quantum), [2, 2, 2]);
  assert.equal(first.at(-1).type, 'wavePass');
  assert.equal(first.at(-1).quantum, 3);
  while (sequence.status.update < 48) sequence.advance();
  assert.equal(sequence.status.sequenceActive, true);
  sequence.advance();
  assert.equal(sequence.status.sequenceActive, false);
  assert.equal(sequence.status.silent, false);
  assert.equal(sequence.status.owners.length, 4);
  while (sequence.status.update < 76) sequence.advance();
  assert.equal(sequence.status.silent, true);
  assert.deepEqual(sequence.advance().map(row => row.type), ['wavePass']);
});

test('stop is idempotent, releases tails and preserves previously returned snapshots', () => {
  const sequence = createKeyboardSequence(6), control = createKeyboardSequence(6);
  for (let i = 0; i < 10; i++) { sequence.advance(); control.advance(); }
  const snapshot = sequence.status;
  sequence.stop(); sequence.stop(); control.stop();
  assert.equal(sequence.status.sequenceActive, false);
  assert.equal(sequence.status.silent, false);
  assert.equal(snapshot.sequenceActive, true);
  assert.ok(Object.isFrozen(snapshot) && Object.isFrozen(snapshot.owners));
  assert.ok(snapshot.owners.every(Object.isFrozen));
  const stops = [];
  for (let i = 0; i < 48; i++) {
    const batch = sequence.advance();
    assert.deepEqual(batch, control.advance());
    assert.ok(Object.isFrozen(batch) && batch.every(Object.isFrozen));
    stops.push(...batch.filter(event => event.type === 'stop').map(event => event.quantum));
  }
  assert.deepEqual(stops, [35, 36, 187]);
  assert.equal(sequence.status.silent, true);
});

test('instances own independent pools and unsupported cues fail explicitly', () => {
  assert.throws(() => createKeyboardSequence(5), RangeError);
  const stopped = createKeyboardSequence(6), playing = createKeyboardSequence(7);
  stopped.stop();
  assert.deepEqual(stopped.advance().map(row => row.type), ['wavePass']);
  assert.deepEqual(playing.advance().filter(row => row.type === 'play').map(row => row.waveSlot), [0, 1, 2]);
  assert.equal(stopped.status.silent, true);
  assert.equal(playing.status.sequenceActive, true);
});
