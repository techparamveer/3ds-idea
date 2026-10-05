import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter = readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8');
const font = readFileSync(new URL('../src/os/bitmap-font.ts', import.meta.url), 'utf8');
const dialog = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-C-Dlg.json', firmware), 'utf8'));
const messages = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/msg-EU_English.json', firmware), 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten = panes => panes.flatMap(pane => [pane, ...flatten(pane.children ?? [])]);
const codePath = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';
const word = (code, address) => code.readUInt32LE(address - 0x100000);

test('Welcome TxtDlg stays on the already-requested whole-layout source-size draw', () => {
  const txt = flatten(dialog.layouts.C_DlgGuid2Btn.roots).find(pane => pane.name === 'TxtDlg');
  assert.deepEqual(txt.size, [280, 152]);
  assert.equal(txt.origin, 4);
  assert.equal(txt.text.alignment, 4);
  assert.equal(txt.text.lineAlignment, 2);
  assert.equal(txt.text.characterSpacing, 0);
  assert.equal(txt.text.lineSpacing, 0);
  assert.match(painter, /drawLayout\(bottom,'camera-dialog',layout,cameraMessageColors\(source,overrides\),\{textSampling:'lcd-source-size',bindings:\[\{name:layout\+'_Default',frame:0\}\],overrides\}\)/);
  assert.equal(painter.includes('multilineBlockOrigin'), false);
  assert.equal(painter.includes("textSamplingPanes:['TxtDlg']"), false);
  assert.match(renderer, /!\/\[\\r\\n\]\/\.test\(text\.value\)&&\(text\.alignment===3\|\|text\.alignment===4\)&&\(text\.lineAlignment===0\|\|sourceSize&&text\.alignment===4&&text\.lineAlignment===2/);
  assert.match(renderer, /multilineBlockOrigin==='writer-0x111'&&\/\[\\r\\n\]\/\.test\(text\.value\)&&text\.alignment===4&&text\.lineAlignment===0/);
  assert.match(font, /lines\.length===1&&\(nativeAlignedLine\|\|lcdBottomEdge&&alignment===4&&lineAlignment===2&&this\.manifest\.colorMode==='alpha'\)/);
  const bank = messages.messages.P_tips;
  const message = label => bank.messages[bank.labels[label]];
  for (const label of ['D_003_0', 'D_003_2', 'D_003_4']) {
    assert.equal(message(label).text.includes('\n'), true, label);
    assert.equal(message(label).styleIndex, 83, label);
  }
  assert.equal(messages.styles['RI.mstl'].styles[83].unresolvedWords['0'], 280);
  assert.equal(message('D_003_0').tokens.some(token => token.group === 0 && token.type === 3), false);
  assert.equal(message('D_003_4').tokens.some(token => token.group === 0 && token.type === 3), false);
  assert.equal(message('D_003_2').tokens.some(token => token.group === 0 && token.type === 3), true);
  assert.match(painter, /TxtDlg:\{\.\.\.message\(entry\.label\),colorSpans:nativeMessageColorSpans\(renderer\.packs\['camera-messages'\],'P_tips',entry\.label\)\}/);
});

test('code.bin has one alignment-4 centering writer and it is already 0x329160', t => {
  if (!existsSync(codePath)) return t.skip('private Camera code.bin is absent');
  const code = readFileSync(codePath);
  assert.equal(sha(codePath), '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  assert.equal(word(code, 0x1cdb2c), 0xe5d410ff);
  assert.equal(word(code, 0x1cdb78), 0xe3a00001);
  assert.equal(word(code, 0x1cdba0), 0x03800010);
  assert.equal(word(code, 0x1cdbc0), 0x03800c01);
  assert.equal(word(code, 0x1cdbd0), 0xe585005c);
  assert.equal(word(code, 0x3291f8), 0xe2000030);
  assert.equal(word(code, 0x3291fc), 0xe3500010);
  assert.equal(word(code, 0x329268), 0xe2000003);
  assert.equal(word(code, 0x32926c), 0xe3500001);
  assert.equal(word(code, 0x329328), 0x00000333);
  assert.equal(word(code, 0x32932c), 0x3f000000);
  assert.equal(word(code, 0x329554), 0xebffff01);
  const callers = [];
  for (let address = 0x100000; address + 4 <= 0x100000 + code.length; address += 4) {
    const instruction = word(code, address);
    if ((instruction >>> 24) !== 0xeb) continue;
    let immediate = instruction & 0xffffff;
    if (immediate & 0x800000) immediate -= 0x1000000;
    if (address + 8 + (immediate << 2) === 0x329160) callers.push(address);
  }
  assert.deepEqual(callers, [0x329554]);
});

test('frozen page-3 interior stays 1079 on the unchanged painter', async t => {
  const root = '/Users/paramveer/.codex/3ds-artifact-overflow';
  const native = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/camera-guide-replay-20260926/screenshots/Nintendo 3DS Camera_26.09.26_20.37.10.334.png';
  const lower = `${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page3-modal-0d7bfea/browser/lower.png`;
  const report = `${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page3-modal-0d7bfea/diff/report.json`;
  if (![native, lower, report].every(existsSync)) return t.skip('private Camera Welcome page-3 pair is absent');
  assert.equal(sha(native), '3ad989b5c214caa6be956643b2aa0785df2cc9612ffcc63a32ed5c70270f7c8a');
  assert.equal(sha(lower), '57476c312f731b8f52884b8c1d777c590a13f23588f32923664713081b715339');
  assert.equal(sha(report), '1e8cf7907e4a9cc6447b10621bb4eb57d974333b46c928ca8b75d4049eed51be');
  assert.equal(sha(new URL('../scripts/native-compare/empty-mask.json', import.meta.url)),
    'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp = require('sharp');
  const nativeLower = await sharp(native).extract({left: 40, top: 240, width: 320, height: 240}).ensureAlpha().raw().toBuffer();
  const browserLower = await sharp(lower).ensureAlpha().raw().toBuffer();
  const at = (buffer, x, y) => {
    const index = (y * 320 + x) * 4;
    return [buffer[index], buffer[index + 1], buffer[index + 2]];
  };
  assert.deepEqual(at(nativeLower, 246, 113), [202, 200, 198]);
  assert.deepEqual(at(browserLower, 246, 113), [214, 213, 212]);
  let whole = 0;
  let interior = 0;
  for (let y = 0; y < 240; y++) for (let x = 0; x < 320; x++) {
    const nativeRgb = at(nativeLower, x, y);
    const browserRgb = at(browserLower, x, y);
    const delta = Math.max(
      Math.abs(nativeRgb[0] - browserRgb[0]),
      Math.abs(nativeRgb[1] - browserRgb[1]),
      Math.abs(nativeRgb[2] - browserRgb[2]),
    );
    if (delta <= 2) continue;
    whole++;
    if (x >= 20 && x < 300 && y >= 20 && y < 220) interior++;
  }
  assert.equal(whole, 2480);
  assert.equal(interior, 1079);
  assert.equal(whole - interior, 1401);
});
