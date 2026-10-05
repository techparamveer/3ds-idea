import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import ts from 'typescript';

const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter = readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const browse = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json', firmware), 'utf8'));
const messages = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/msg-EU_English.json', firmware), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fileSha = path => sha(readFileSync(path));
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const transpile = (name, overrides = {}) => {
  const url = new URL(`../src/os/${name}.ts`, import.meta.url);
  const {outputText} = ts.transpileModule(readFileSync(url, 'utf8'), {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}});
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) => prefix + (overrides[path] ?? new URL(path.endsWith('.ts') ? path : `${path}.ts`, url).href) + suffix));
};
const {cameraScreenPacks, drawNativeCameraLower} = await import(transpile('stock-native-camera', {
  './stock-screen-layout': transpile('stock-screen-layout'),
  './native-layout': transpile('native-layout'),
}));
const packs = Object.fromEntries(cameraScreenPacks.map(item => [item.alias, JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/' + item.url, import.meta.url), 'utf8'))]));
const find = (panes, name) => {
  for (const pane of panes ?? []) {
    if (pane.name === name) return pane;
    const child = find(pane.children, name);
    if (child) return child;
  }
};
const textPanes = panes => (panes ?? []).flatMap(pane => (pane.text ? [pane] : []).concat(textPanes(pane.children)));

const NATIVE = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png';
const BROWSER = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-settings-txtset-recapture-20261005/browser/lower.png';
const REPORT = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-settings-txtset-recapture-20261005/report.json';
const CODE = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';

test('browse Settings joins the source-size allowlist beside Slideshow', () => {
  const draws = [];
  const renderer = {
    packs,
    draw() { return true; },
    drawLayout(_ctx, _pack, layout, _source, opts) { draws.push({layout, opts}); return true; },
  };
  const bottom = {save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}};
  const view = {
    appId: 'camera', screen: 'gallery', heading: 'Nintendo 3DS Camera',
    rows: [{id: 'photo:a', label: 'A'}], selection: 0,
    footer: {left: {action: 'back', label: 'Back'}},
    data: {photos: [{id: 'a', src: '/portfolio/a.jpg'}]},
  };
  assert.equal(drawNativeCameraLower(renderer, bottom, view, {image: () => false}), true);
  const menu = draws.find(draw => draw.layout === 'P_BrwsMenu_D');
  assert.equal(menu.opts.textSampling, 'lcd-source-size');
  assert.deepEqual(menu.opts.textSamplingPanes, ['TxtSShow', 'TxtSet']);
  assert.equal(menu.opts.textSamplingPanes.includes('TxtShoot'), false);
  assert.deepEqual(menu.opts.bindings, [{name: 'P_BrwsMenu_D_Brws', frame: 0}]);
  assert.deepEqual(menu.opts.overrides.TxtSet.messageStyle.fontScale, [0.6719999313354492, 0.8399999737739563]);
  assert.equal(menu.opts.overrides.TxtSet.messageStyle.characterSpacing, 0);
  assert.equal(painter.includes("textSamplingPanes:['TxtSShow','TxtSet']"), true);
  assert.equal(/textSamplingPanes:\[[^\]]*TxtShoot/.test(painter), false);
  assert.equal(painter.includes("TxtSet:cameraBrowseSettingsLabel(renderer.packs['camera-messages'])"), true);
  assert.equal(painter.includes("TxtSet:message('setting')"), true);
  assert.equal(painter.includes('glyphScaleSpans'), false);
  const layout = browse.layouts.P_BrwsMenu_D;
  const texts = textPanes(layout.roots);
  assert.deepEqual(texts.map(pane => pane.name), ['TxtSShow', 'TxtShoot', 'TxtSet']);
  const fractional = texts.filter(pane => pane.text.alignment === 4 && pane.text.lineAlignment === 2 && pane.size[0] !== Math.ceil(pane.size[0]));
  assert.deepEqual(fractional.map(pane => pane.name), ['TxtSShow', 'TxtSet']);
  const pane = find(layout.roots, 'TxtSet');
  assert.equal(pane.text.alignment, 4);
  assert.equal(pane.text.lineAlignment, 2);
  assert.deepEqual(pane.size, [76.80000305175781, 24]);
  assert.equal(Math.ceil(pane.size[0]), 77);
  assert.deepEqual(pane.scale, [1, 1]);
  assert.deepEqual(pane.rotation, [0, 0, 0]);
  assert.equal(layout.fonts[pane.text.font], 'cbf_std.bcfnt');
  assert.deepEqual(find(layout.roots, 'TxtShoot').size, [96, 24]);
  const setScale = browse.animations.P_BrwsMenu_D_Brws.tracks.find(track => track.target === 'Set' && track.property === 'scale.x');
  assert.deepEqual(setScale.keys, [{frame: -480, slope: 0, value: 1}]);
  const bank = messages.messages.P;
  const setting = bank.messages[bank.labels.setting];
  assert.equal(setting.text, 'Settings');
  assert.equal(setting.styleIndex, 19);
  assert.equal(browse.resourceSources.layouts.P_BrwsMenu_D.sha256, '58af2008d3112977f2a1b9f0a8aad2584b3f3f20a397f0fd5072bdfc764d5e01');
});

test('Camera flag setter and centering writer are shared, not Slideshow-named', t => {
  if (!existsSync(CODE)) return t.skip('Camera code.bin is absent');
  assert.equal(fileSha(CODE), '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  const code = readFileSync(CODE);
  const word = address => code.readUInt32LE(address - 0x100000);
  assert.equal(word(0x1cdb2c), 0xe5d410ff);
  assert.equal(word(0x1cdb3c), 0xe3510002);
  assert.equal(word(0x1cdb40), 0x0a00000c);
  assert.equal(word(0x1cdb78), 0xe3a00001);
  assert.equal(word(0x1cdba0), 0x03800010);
  assert.equal(word(0x1cdbc0), 0x03800c01);
  assert.equal(word(0x1cdbd0), 0xe585005c);
  assert.equal(word(0x329160), 0xe92d43f0);
  assert.equal(word(0x3291f8), 0xe2000030);
  assert.equal(word(0x3291fc), 0xe3500010);
  assert.equal(word(0x32921c), 0xebfc4978);
  assert.equal(word(0x329230), 0xe2000c03);
  assert.equal(word(0x329554), 0xebffff01);
});

test('recaptured Settings third is 0 after the source-size sampler', t => {
  if (!existsSync(NATIVE) || !existsSync(BROWSER) || !existsSync(REPORT)) return t.skip('frozen camera browse pair is absent');
  assert.equal(fileSha(NATIVE), 'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(fileSha(BROWSER), '2657bb855667464a806298d1f079a20ec0ac0956f26cc1b73eb8287f0f8e119f');
  assert.equal(fileSha(REPORT), 'b7da8109316596bfd6dce6fcd4352c96804343cee899e45b076122f64054fd3d');
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
  assert.deepEqual(nativeAt(253, 227), [70, 65, 58]);
  assert.deepEqual(browserAt(253, 227), [70, 65, 58]);
  const count = (x0, x1, y0, y1) => {
    let n = 0;
    let max = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const d = delta(nativeAt(x, y), browserAt(x, y));
      if (d > 2) { n++; max = Math.max(max, d); }
    }
    return {n, max};
  };
  let whole = 0;
  let header = 0;
  for (let y = 0; y < 240; y++) for (let x = 0; x < 320; x++) {
    if (delta(nativeAt(x, y), browserAt(x, y)) <= 2) continue;
    whole++;
    if (y < 32) header++;
  }
  assert.equal(whole, 7491);
  assert.equal(header, 0);
  assert.equal(count(0, 105, 212, 240).n, 0);
  assert.equal(count(107, 213, 212, 240).n, 0);
  const settings = count(215, 320, 212, 240);
  assert.equal(settings.n, 0);
  assert.equal(settings.max, 0);
});
