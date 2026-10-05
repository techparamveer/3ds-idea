import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import ts from 'typescript';

const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painterPath = new URL('../src/os/stock-native-camera.ts', import.meta.url);
const painter = readFileSync(painterPath, 'utf8');
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
const {cameraBrowseSettingsLabel, cameraScreenPacks, drawNativeCameraLower} = await import(transpile('stock-native-camera', {
  './stock-screen-layout': transpile('stock-screen-layout'),
  './native-layout': transpile('native-layout'),
}));
const packs = Object.fromEntries(cameraScreenPacks.map(item => [item.alias, JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/' + item.url, import.meta.url), 'utf8'))]));

const NATIVE = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png';
const BROWSER = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-settings-footer-recapture-20261005/browser/lower.png';
const CODE = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';

test('browse Settings label keeps P/setting 80% on writer scale X only', () => {
  const bank = messages.messages.P;
  const message = bank.messages[bank.labels.setting];
  const style = messages.styles[bank.styleTable].styles[message.styleIndex];
  assert.equal(message.styleIndex, 19);
  assert.deepEqual(message.tokens, [
    {arguments: '5000', control: 14, group: 1, type: 0},
    {text: 'Settings'},
    {arguments: '6400', control: 14, group: 1, type: 0},
  ]);
  assert.deepEqual(style.fontScale, [0.8399999737739563, 0.8399999737739563]);
  const before = JSON.stringify(messages);
  const label = cameraBrowseSettingsLabel(messages);
  const factor = Math.fround(Math.fround(80) * Math.fround(0.01));
  assert.equal(factor, 0.7999999523162842);
  assert.deepEqual(label.messageStyle.fontScale, [Math.fround(style.fontScale[0] * factor), style.fontScale[1]]);
  assert.equal(label.messageStyle.fontScale[0], 0.6719999313354492);
  assert.equal(label.text, 'Settings');
  assert.equal(label.messageStyle.unresolvedWords['8'], 0xff394045);
  assert.equal(JSON.stringify(messages), before);
  for (const plain of ['Brws_02', 'Brws_03']) {
    const sibling = bank.messages[bank.labels[plain]];
    assert.deepEqual(sibling.tokens, [{text: sibling.text}]);
  }
  const broken = structuredClone(messages);
  broken.messages.P.messages[bank.labels.setting].tokens = [{text: 'Settings'}];
  assert.throws(() => cameraBrowseSettingsLabel(broken), /Unsupported Camera setting label control/);
  assert.deepEqual(cameraBrowseSettingsLabel({messages: {}}), {text: ''});
});

test('settled browse binds the scaled Settings label and leaves Slideshow and Shoot alone', () => {
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
  const bank = messages.messages.P;
  const style = index => messages.styles[bank.styleTable].styles[index].fontScale;
  assert.deepEqual(menu.opts.bindings, [{name: 'P_BrwsMenu_D_Brws', frame: 0}]);
  assert.deepEqual(menu.opts.overrides.TxtSShow.messageStyle.fontScale, style(bank.messages[bank.labels.Brws_02].styleIndex));
  assert.deepEqual(menu.opts.overrides.TxtShoot.messageStyle.fontScale, style(bank.messages[bank.labels.Brws_03].styleIndex));
  assert.deepEqual(menu.opts.overrides.TxtSet.messageStyle.fontScale, [0.6719999313354492, 0.8399999737739563]);
  assert.equal(painter.includes("TxtSet:cameraBrowseSettingsLabel(renderer.packs['camera-messages'])"), true);
  assert.equal(painter.includes("TxtSet:message('setting')"), true, 'Welcome keeps the unscaled setting label');
  assert.equal(browse.resourceSources.layouts.P_BrwsMenu_D.sha256, '58af2008d3112977f2a1b9f0a8aad2584b3f3f20a397f0fd5072bdfc764d5e01');
  assert.equal(browse.resourceSources.textures['P_BtnDW_90x30.bclim'].sha256, 'bbb8d1ad7cab3d04509febd46bb619bfaf371346b621fa30e86fc6a6e38a6cdf');
});

test('recaptured Settings third is 630 after the X-scale bind', t => {
  if (!existsSync(NATIVE) || !existsSync(BROWSER)) return t.skip('frozen camera browse pair is absent');
  assert.equal(fileSha(NATIVE), 'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(fileSha(BROWSER), '3f5ead625db013831b6a47af7648202865811d5ec6982b2f10b2e98ad59fc169');
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
  const count = (x0, x1, y0, y1) => {
    let n = 0, max = 0, maxAt = null;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const native = nativeAt(x, y), candidate = browserAt(x, y);
      const delta = Math.max(Math.abs(native[0] - candidate[0]), Math.abs(native[1] - candidate[1]), Math.abs(native[2] - candidate[2]));
      if (delta > 2) {
        n++;
        if (delta > max) { max = delta; maxAt = {x, y, native, browser: candidate, delta}; }
      }
    }
    return {n, maxAt};
  };
  assert.equal(count(0, 105, 212, 240).n, 0);
  assert.equal(count(107, 213, 212, 240).n, 0);
  const settings = count(215, 320, 212, 240);
  assert.equal(settings.n, 630);
  assert.deepEqual(settings.maxAt, {x: 253, y: 227, native: [70, 65, 58], browser: [153, 148, 140], delta: 83});
  let whole = 0;
  for (let y = 0; y < 240; y++) for (let x = 0; x < 320; x++) {
    const native = nativeAt(x, y), candidate = browserAt(x, y);
    if (Math.max(Math.abs(native[0] - candidate[0]), Math.abs(native[1] - candidate[1]), Math.abs(native[2] - candidate[2])) > 2) whole++;
  }
  assert.equal(whole, 10158);
});

test('Camera group-1 type-0 tag writes scale X and copies scale Y', t => {
  if (!existsSync(CODE)) return t.skip('private Camera code.bin is absent');
  const code = readFileSync(CODE);
  assert.equal(sha(code), '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  const word = address => code.readUInt32LE(address - 0x100000);
  assert.equal(word(0x271800), 0x2718c8);
  assert.equal(word(0x2718c8), 0xe1d100b2);
  assert.equal(word(0x2718cc), 0xe3500000);
  assert.equal(word(0x2718d0), 0x1a000065);
  assert.equal(word(0x271a7c), 0x3c23d70a);
  assert.equal(word(0x271a80), 0x3f800000);
  assert.equal(word(0x271908), 0xec800a02);
  assert.equal(word(0x27191c), 0xec800a02);
});
