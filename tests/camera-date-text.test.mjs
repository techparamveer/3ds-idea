import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {PNG} from 'pngjs';

const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter = readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const browse = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json', firmware), 'utf8'));
const messages = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/msg-EU_English.json', firmware), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fileSha = path => sha(readFileSync(path));
const find = (panes, name) => {
  for (const pane of panes ?? []) {
    if (pane.name === name) return pane;
    const child = find(pane.children, name);
    if (child) return child;
  }
};

const NATIVE = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png';
const BROWSER = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-date-group-recapture-20261005/browser/lower.png';

test('date text stays the expanded TxtThmb string; Brws_05_L is not a published label', () => {
  assert.match(painter, /text:`\$\{date\.slice\(8,10\)\}\/\$\{date\.slice\(5,7\)\}\\n\$\{date\.slice\(0,4\)\}`,size:\[49\.92,40\]/);
  assert.equal(painter.includes('Brws_05_L'), false);
  assert.equal(/TxtThmb:date\?\{[^}]*multilineBlockOrigin/.test(painter), false);
  assert.match(painter, /drawLayout\(bottom,'camera-gallery','P_BrwsFld',dateGroup,opts\)/);
  const pane = find(browse.layouts.P_BrwsFld.roots, 'TxtThmb');
  assert.deepEqual(pane.size, [49.92000198364258, 19.19999885559082]);
  assert.deepEqual(pane.translation, [-1, -2, 0]);
  assert.equal(pane.text.alignment, 4);
  assert.equal(pane.text.lineAlignment, 2);
  assert.deepEqual(pane.text.size, [16, 19.19999885559082]);
  assert.deepEqual(pane.metadata, [{name: 'MSG', type: 0, value: 'P/Brws_05_L'}]);
  assert.equal(messages.messages.P.labels.Brws_05_L, undefined);
  const style = messages.styles['RI.mstl'].styles[5];
  assert.equal(style.unresolvedWords['0'], 58);
  assert.deepEqual(style.fontScale, [0.6800000071525574, 0.6800000071525574]);
  assert.equal(style.characterSpacing, 0);
  assert.equal(style.lineSpacing, 0);
  assert.equal(browse.resourceSources.layouts.P_BrwsFld.sha256, 'b12a383b73d75d331f2c1278c17ddeab82ba2cdf6503348ff0c9959e296877b0');
  assert.equal(messages.resourceSources.messages.P.sha256, 'c7c8333e0d051725c45a27bac7f239a6e36699044053b5013cd4edd4cc80be05');
  assert.equal(messages.resourceSources.styles['RI.mstl'].sha256, 'f2505d2077a5c90de9ba222d1e12d82d23168f44216f3e21dfdc1e005570ef1a');
});

test('frozen date pane stays 1006 over 2/255 with the assigned glyph samples', t => {
  if (!existsSync(NATIVE) || !existsSync(BROWSER)) return t.skip('frozen camera date pair is absent');
  assert.equal(fileSha(NATIVE), 'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(fileSha(BROWSER), '0265b51095b1051f94424eea9cf2b2c31ad23da3ed6a1137d4cc9a9a31d05616');
  assert.equal(fileSha(new URL('../scripts/native-compare/empty-mask.json', import.meta.url)),
    'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const combined = PNG.sync.read(readFileSync(NATIVE));
  const browser = PNG.sync.read(readFileSync(BROWSER));
  assert.deepEqual([combined.width, combined.height], [400, 480]);
  assert.deepEqual([browser.width, browser.height], [320, 240]);
  const nativeAt = (x, y) => {
    const index = ((y + 240) * combined.width + (x + 40)) * 4;
    return [combined.data[index], combined.data[index + 1], combined.data[index + 2]];
  };
  const browserAt = (x, y) => {
    const index = (y * browser.width + x) * 4;
    return [browser.data[index], browser.data[index + 1], browser.data[index + 2]];
  };
  assert.deepEqual(nativeAt(85, 75), [255, 161, 0]);
  assert.deepEqual(browserAt(85, 75), [255, 161, 0]);
  assert.deepEqual(nativeAt(60, 59), [255, 255, 255]);
  assert.deepEqual(browserAt(60, 59), [255, 161, 0]);
  assert.deepEqual(nativeAt(70, 85), [255, 161, 0]);
  assert.deepEqual(browserAt(70, 85), [255, 225, 173]);
  let count = 0;
  let max = 0;
  let maxAt = null;
  for (let y = 49; y < 101; y++) for (let x = 52; x < 118; x++) {
    const native = nativeAt(x, y);
    const candidate = browserAt(x, y);
    const delta = Math.max(Math.abs(native[0] - candidate[0]), Math.abs(native[1] - candidate[1]), Math.abs(native[2] - candidate[2]));
    if (delta > 2) {
      count++;
      if (delta > max) { max = delta; maxAt = {x, y, native, browser: candidate, delta}; }
    }
  }
  assert.equal(count, 1006);
  assert.deepEqual(maxAt, {x: 60, y: 59, native: [255, 255, 255], browser: [255, 161, 0], delta: 255});
});
