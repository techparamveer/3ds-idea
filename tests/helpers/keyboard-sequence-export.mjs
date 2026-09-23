import { readFileSync } from 'node:fs';
import { createKeyboardSequence } from '../../src/os/native-keyboard-audio/sequence.ts';

const words = new DataView(new ArrayBuffer(4));
export function floatWord(value) {
  words.setFloat32(0, value, true);
  return words.getUint32(0, true);
}
export function collectSequence({ cue, stopAfterUpdate, updates }) {
  const sequence = createKeyboardSequence(cue), controls = [], statuses = [];
  if (stopAfterUpdate === 0) sequence.stop();
  for (let i = 1; i <= updates; i++) {
    for (const event of sequence.advance()) {
      const row = { ...event };
      for (const key of ['gain', 'pitch', 'pan', 'value']) {
        if (key in row) row[key] = floatWord(row[key]);
      }
      controls.push(row);
    }
    if (stopAfterUpdate === i) sequence.stop();
    statuses.push(sequence.status);
  }
  return { cue, stopAfterUpdate, controls, statuses };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  process.stdout.write(JSON.stringify(JSON.parse(readFileSync(0, 'utf8')).map(collectSequence)));
}
