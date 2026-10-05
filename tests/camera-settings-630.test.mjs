import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {PNG} from 'pngjs';

const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter = readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const browse = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json', firmware), 'utf8'));
const messages = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/msg-EU_English.json', firmware), 'utf8'));
const font = JSON.parse(readFileSync(new URL('fonts/shared/font.json', firmware), 'utf8'));
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
const BROWSER = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-settings-footer-recapture-20261005/browser/lower.png';
const CODE = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';

test('browse Settings stays the bound X-only scale; style width is not installed', () => {
  assert.equal(painter.includes("TxtSet:cameraBrowseSettingsLabel(renderer.packs['camera-messages'])"), true);
  assert.equal(painter.includes("TxtSet:message('setting')"), true);
  assert.equal(painter.includes('glyphScaleSpans'), false);
  assert.match(painter, /fontScale:\[Math\.fround\(style\.fontScale\[0\]\*factor\),style\.fontScale\[1\]\]/);
  const bank = messages.messages.P;
  const style = index => messages.styles[bank.styleTable].styles[index];
  const setting = bank.messages[bank.labels.setting];
  assert.deepEqual(setting.tokens, [
    {arguments: '5000', control: 14, group: 1, type: 0},
    {text: 'Settings'},
    {arguments: '6400', control: 14, group: 1, type: 0},
  ]);
  assert.equal(style(setting.styleIndex).unresolvedWords['0'], 80);
  assert.equal(style(bank.messages[bank.labels.Brws_02].styleIndex).unresolvedWords['0'], 152);
  assert.equal(style(bank.messages[bank.labels.Brws_03].styleIndex).unresolvedWords['0'], 176);
  const menu = browse.layouts.P_BrwsMenu_D;
  assert.deepEqual(find(menu.roots, 'TxtSet').size, [76.80000305175781, 24]);
  assert.deepEqual(find(menu.roots, 'TxtSShow').size, [134.39999389648438, 24]);
  assert.deepEqual(find(menu.roots, 'TxtShoot').size, [96, 24]);
  for (const name of ['TxtSet', 'TxtSShow', 'TxtShoot']) {
    const pane = find(menu.roots, name);
    assert.equal(pane.text.alignment, 4);
    assert.equal(pane.text.lineAlignment, 2);
    assert.equal(menu.fonts[pane.text.font], 'cbf_std.bcfnt');
    assert.deepEqual(menu.materials[pane.text.material].textureMaps, []);
    assert.equal(menu.materials[pane.text.material].colorBlend, undefined);
  }
  const setScale = browse.animations.P_BrwsMenu_D_Brws.tracks.find(track => track.target === 'Set' && track.property === 'scale.x');
  assert.deepEqual(setScale.keys, [{frame: -480, slope: 0, value: 1}]);
  assert.equal(font.sourceSha256, '95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581');
  assert.equal(browse.resourceSources.layouts.P_BrwsMenu_D.sha256, '58af2008d3112977f2a1b9f0a8aad2584b3f3f20a397f0fd5072bdfc764d5e01');
});

test('frozen Settings third stays 630 and is not an integer shift', t => {
  if (!existsSync(NATIVE) || !existsSync(BROWSER)) return t.skip('frozen camera browse pair is absent');
  assert.equal(fileSha(NATIVE), 'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(fileSha(BROWSER), '3f5ead625db013831b6a47af7648202865811d5ec6982b2f10b2e98ad59fc169');
  assert.equal(fileSha(new URL('../scripts/native-compare/empty-mask.json', import.meta.url)),
    'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const combined = PNG.sync.read(readFileSync(NATIVE));
  const browser = PNG.sync.read(readFileSync(BROWSER));
  const nativeAt = (x, y) => {
    const index = ((y + 240) * combined.width + (x + 40)) * 4;
    return [combined.data[index], combined.data[index + 1], combined.data[index + 2]];
  };
  const browserAt = (x, y) => {
    const index = (y * browser.width + x) * 4;
    return [browser.data[index], browser.data[index + 1], browser.data[index + 2]];
  };
  const delta = (native, candidate) => Math.max(
    Math.abs(native[0] - candidate[0]), Math.abs(native[1] - candidate[1]), Math.abs(native[2] - candidate[2]));
  assert.deepEqual(nativeAt(240, 217), [241, 239, 236]);
  assert.deepEqual(browserAt(240, 217), [241, 239, 236]);
  assert.deepEqual(nativeAt(275, 214), [243, 242, 238]);
  assert.deepEqual(browserAt(275, 214), [243, 242, 238]);
  assert.deepEqual(nativeAt(253, 227), [70, 65, 58]);
  assert.deepEqual(browserAt(253, 227), [153, 148, 140]);
  const count = (x0, x1, y0, y1, dx = 0, dy = 0) => {
    let n = 0;
    let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const shifted = browserAt(x - dx, y - dy);
      if (!shifted || delta(nativeAt(x, y), shifted) > 2) {
        n++;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    return {n, minX, maxX, minY, maxY};
  };
  assert.equal(count(0, 105, 212, 240).n, 0);
  assert.equal(count(107, 213, 212, 240).n, 0);
  const settings = count(215, 320, 212, 240);
  assert.equal(settings.n, 630);
  assert.deepEqual([settings.minX, settings.maxX, settings.minY, settings.maxY], [241, 307, 216, 236]);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    if (dx === 0 && dy === 0) continue;
    assert.ok(count(241, 308, 216, 237, dx, dy).n > 630, `shift ${dx},${dy} is not a closer owner`);
  }
});

test('Camera size tag writes scale X and copies scale Y', t => {
  if (!existsSync(CODE)) return t.skip('private Camera code.bin is absent');
  const code = readFileSync(CODE);
  assert.equal(sha(code), '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  const word = address => code.readUInt32LE(address - 0x100000);
  assert.equal(word(0x271800), 0x2718c8);
  assert.equal(word(0x2718d4), 0xe1d100b6);
  assert.equal(word(0x2718dc), 0xe6bf0070);
  assert.equal(word(0x2718f4), 0xedd10a07);
  assert.equal(word(0x2718fc), 0xe2800024);
  assert.equal(word(0x271900), 0xee200a80);
  assert.equal(word(0x271904), 0xedd10a06);
  assert.equal(word(0x271908), 0xec800a02);
  assert.equal(word(0x271914), 0xeddf0a59);
  assert.equal(word(0x271a7c), 0x3c23d70a);
  assert.equal(word(0x271a80), 0x3f800000);
});
