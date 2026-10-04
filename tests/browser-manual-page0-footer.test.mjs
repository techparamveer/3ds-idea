import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const helpers = readFileSync(join(root, 'src/os/stock-native-helpers.ts'), 'utf8');
const note = readFileSync(join(root, 'docs/browser-manual-page0-footer-2026-10-04.md'), 'utf8');

function pageFn(src) {
  const start = src.indexOf('function drawApplicationManualPage');
  assert.notEqual(start, -1);
  const next = src.indexOf('\nfunction ', start + 1);
  return src.slice(start, next === -1 ? undefined : next);
}

describe('Browser Manual page-0 footer bind', () => {
  const body = pageFn(helpers);

  test('Close and Enlarge use lcd-source-size at SceneIn 20', () => {
    assert.match(body, /draw\(bottom,'manual-BtnClose01','BtnClose01',\{textSampling:'lcd-source-size',bindings:\[\{name:'BtnClose01_SceneIn',frame:20\}\]\}\)/);
    assert.match(body, /draw\(bottom,'manual-BtnTextSize00','BtnTextSize00',\{textSampling:'lcd-source-size',bindings:\[\{name:'BtnTextSize00_SceneIn',frame:20\}\]/);
    assert.match(body, /draw\(bottom,'manual-back','BtnBack00',\{textSampling:'lcd-source-size',bindings:\[\{name:'BtnBack00_SceneIn',frame:20\}\]/);
  });

  test('idle page does not bind unused Wait Choice or Select clips', () => {
    assert.doesNotMatch(body, /BtnClose01_Select/);
    assert.doesNotMatch(body, /BtnTextSize00_Select/);
    assert.doesNotMatch(body, /BtnTextSize00_KeyDecide/);
    assert.doesNotMatch(body, /BtnClose01_Wait|BtnBack00_Wait|BtnTextSize00_Wait/);
    assert.doesNotMatch(body, /Choice/);
  });

  test('labelled header capture-fit is unchanged', () => {
    assert.match(helpers, /origin38/);
    assert.match(helpers, /centre20/);
    assert.match(note, /origin38 \/ centre20 was not retuned/);
  });

  test('evidence note keeps dump identity and offline counts', () => {
    assert.match(note, /a28e9f437a0c78bfef3204e343189cdec89ac00e004e8d6082ecc7dff26870b4/);
    assert.match(note, /\[0,212,320,240\)/);
    assert.match(note, /\*\*1934\*\*/);
    assert.match(note, /\*\*1684\*\*/);
    assert.match(note, /0004003000009b02/);
    assert.match(note, /0004003000009d02/);
    assert.match(note, /9f04453f23476615912972530a99abccaee22361cc69bc80052d47acf907831b/);
    assert.match(note, /fb282c968adee9e536197b6b25f5a3c08577635dcebe23e6b4e8a906001d4fc9/);
  });
});
