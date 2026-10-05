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

const NATIVE = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png';
const BROWSER = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-browse-header-recapture-20261005/browser/lower.png';
const CODE = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';

test('browse Slideshow header uses the source-size sampler only', () => {
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
  assert.deepEqual(menu.opts.textSamplingPanes, ['TxtSShow']);
  assert.deepEqual(menu.opts.bindings, [{name: 'P_BrwsMenu_D_Brws', frame: 0}]);
  const bank = messages.messages.P;
  const show = bank.messages[bank.labels.Brws_02];
  assert.deepEqual(show.tokens, [{text: 'Slideshow'}]);
  assert.equal(show.styleIndex, 45);
  assert.deepEqual(menu.opts.overrides.TxtSShow.messageStyle.fontScale, [0.8399999737739563, 0.8399999737739563]);
  assert.equal(menu.opts.overrides.TxtSShow.messageStyle.characterSpacing, 0);
  assert.deepEqual(menu.opts.overrides.TxtShoot.messageStyle.fontScale, [0.8399999737739563, 0.8399999737739563]);
  assert.deepEqual(menu.opts.overrides.TxtSet.messageStyle.fontScale, [0.6719999313354492, 0.8399999737739563]);
  assert.equal(painter.includes("textSamplingPanes:['TxtSShow']"), true);
  assert.equal(painter.includes("TxtSet:message('setting')"), true);
  const layout = browse.layouts.P_BrwsMenu_D;
  const pane = find(layout.roots, 'TxtSShow');
  assert.equal(pane.text.alignment, 4);
  assert.equal(pane.text.lineAlignment, 2);
  assert.deepEqual(pane.size, [134.39999389648438, 24]);
  assert.equal(Math.ceil(pane.size[0]), 135);
  const button = browse.animations.P_BrwsMenu_D_Brws.tracks.find(track => track.target === 'BtnMov0' && track.property === 'translation.y');
  assert.deepEqual(button.keys, [{frame: 0, slope: 0, value: 105}]);
  assert.equal(browse.resourceSources.layouts.P_BrwsMenu_D.sha256, '58af2008d3112977f2a1b9f0a8aad2584b3f3f20a397f0fd5072bdfc764d5e01');
});

test('Camera flag setter stores 0x111 and one writer centers on the pane float', t => {
  if (!existsSync(CODE)) return t.skip('Camera code.bin is absent');
  assert.equal(fileSha(CODE), '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  const code = readFileSync(CODE);
  const word = address => code.readUInt32LE(address - 0x100000);
  assert.equal(word(0x1cdb2c), 0xe5d410ff);
  assert.equal(word(0x1cdbd0), 0xe585005c);
  assert.equal(word(0x329160), 0xe92d43f0);
  assert.equal(word(0x329554), 0xebffff01);
  assert.equal(word(0x3291f8), 0xe2000030);
  assert.equal(word(0x329230), 0xe2000c03);
});

test('recaptured header glyph strip is 0 after the source-size sampler', t => {
  if (!existsSync(NATIVE) || !existsSync(BROWSER)) return t.skip('frozen camera browse pair is absent');
  assert.equal(fileSha(NATIVE), 'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(fileSha(BROWSER), 'e14e44c3be89c969627b20807b13c4714de5fe240dde3d1edaefcc0943794c82');
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
  const over = (native, candidate) => Math.max(
    Math.abs(native[0] - candidate[0]), Math.abs(native[1] - candidate[1]), Math.abs(native[2] - candidate[2])) > 2;
  let whole = 0;
  let header = 0;
  for (let y = 0; y < 240; y++) for (let x = 0; x < 320; x++) {
    if (!over(nativeAt(x, y), browserAt(x, y))) continue;
    whole++;
    if (y < 32) header++;
  }
  assert.equal(whole, 8121);
  assert.equal(header, 0);
});
