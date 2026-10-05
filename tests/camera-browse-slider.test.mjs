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
const slider = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-C-Sld.json', firmware), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fileSha = path => sha(readFileSync(path));
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const transpile = (name, overrides = {}) => {
  const url = new URL(`../src/os/${name}.ts`, import.meta.url);
  const {outputText} = ts.transpileModule(readFileSync(url, 'utf8'), {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}});
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) => prefix + (overrides[path] ?? new URL(path.endsWith('.ts') ? path : `${path}.ts`, url).href) + suffix));
};
const {cameraBrowseSliderCenter, cameraBrowseSliderFrame, cameraBrowseUserColor, cameraScreenPacks, drawNativeCameraLower} = await import(transpile('stock-native-camera', {
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
const view = (rows, data) => ({
  appId: 'camera', screen: 'gallery', heading: 'Nintendo 3DS Camera', rows, selection: 0,
  footer: {left: {action: 'back', label: 'Back'}}, data,
});
function paint(screenView) {
  const draws = [];
  const renderer = {
    packs,
    draw(_ctx, pack, layout, opts) { draws.push({layout, pack, opts}); return true; },
    drawLayout(_ctx, pack, layout, source, opts) { draws.push({layout, pack, opts, source}); return true; },
  };
  const bottom = {
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    fillText() {}, fillRect() {}, beginPath() {}, rect() {}, clip() {}, save() {}, restore() {},
    roundRect() {}, fill() {}, stroke() {},
  };
  drawNativeCameraLower(renderer, bottom, screenView, {image: () => false});
  return draws;
}

const NATIVE = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png';
const BROWSER = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png';
const FULL_SLIDER = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/camera-native14/packs/camera/contents/0000-0000001a/lyt-C-Sld.json';
const FULL_TAPE = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/camera-native14/packs/camera/contents/0000-0000001a/lyt-P_Tape-arc-LZ.json';
const CODE = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';

test('browse bar keeps the published C_SldH_S Default 20 and Rate mount', () => {
  const request = cameraScreenPacks.find(item => item.alias === 'camera-slider');
  assert.equal(request.url, 'packs/camera/contents/0000-0000001a/lyt-C-Sld.json');
  assert.deepEqual(request.layouts, ['C_SldH_S']);
  assert.deepEqual(request.animations, ['C_SldH_S_Default', 'C_SldH_S_Rate']);
  assert.equal(slider.sourceSha256, '8ddab54d40ce8d1c9daee71147f83dc94d9aec42c8169f7f6737ec70429f512f');
  assert.equal(slider.resourceSources.layouts.C_SldH_S.sha256, '989be172d5ecdac3867e1f6924fbb03a6b75c7e0251c8b10b1c03f68a4a64a7a');
  assert.equal(slider.resourceSources.layouts.C_SldH_S.path, 'lyt/C.LZ/Sld/blyt/C_SldH_S.bclyt');
  assert.deepEqual(Object.keys(slider.layouts), ['C_SldH_S']);
  assert.deepEqual(Object.keys(slider.animations), ['C_SldH_S_Default', 'C_SldH_S_Rate']);
  const mount = find(browse.layouts.P_BrwsBase_D.roots, '-L-Sld');
  assert.deepEqual(mount.metadata, [{name: 'LYT', type: 0, value: 'C--Sld/C_SldH_S'}]);
  assert.deepEqual([...cameraBrowseSliderCenter], [160, 196]);
  assert.equal(cameraBrowseSliderFrame(0, 6), 0);
  assert.equal(cameraBrowseSliderFrame(124, 12), 50);
  assert.equal(cameraBrowseSliderFrame(248, 12), 100);
  const rows = Array.from({length: 12}, (_, index) => ({id: `photo:${index}`, label: String(index)}));
  const sliderDraw = paint(view(rows, {photos: rows.map(row => ({id: row.id.slice(6), src: '/portfolio/a.jpg'})), cameraBrowse: {output: 124}}))
    .find(draw => draw.pack === 'camera-slider');
  assert.deepEqual(sliderDraw, {
    layout: 'C_SldH_S', pack: 'camera-slider', opts: {center: [160, 196], bindings: [
      {name: 'C_SldH_S_Default', frame: 20},
      {name: 'C_SldH_S_Rate', frame: 50},
    ]},
  });
  assert.equal(painter.includes('P_Tape'), false);
  assert.equal(painter.includes('C_SldV_L'), false);
  assert.equal(painter.includes('C_SldT'), false);
  assert.equal(painter.includes('255,208,128'), false);
  assert.equal(painter.includes('255, 208, 128'), false);
});

test('zoom icons stay the bound P_BrwsBase textures, not a slider substitute', () => {
  const layout = browse.layouts.P_BrwsBase_D;
  const up = find(layout.roots, 'ZoomUp');
  const back = find(layout.roots, 'ZoomBack');
  assert.equal(layout.textures[layout.materials[up.picture.material].textureMaps[0].texture], 'P_BtnO_BrwsZoom0.bclim');
  assert.equal(layout.textures[layout.materials[back.picture.material].textureMaps[0].texture], 'P_BtnO_BrwsZoom1.bclim');
  assert.equal(up.picture.material, 0);
  assert.equal(back.picture.material, 1);
  assert.deepEqual(layout.materials[0].constantColors[0], [255, 255, 255, 255]);
  assert.deepEqual(layout.materials[1].constantColors[0], [255, 255, 255, 255]);
  assert.deepEqual(up.picture.colors[0], [255, 255, 255, 255]);
  assert.deepEqual(back.picture.colors[0], [255, 255, 255, 255]);
  assert.equal(browse.resourceSources.textures['P_BtnO_BrwsZoom0.bclim'].sha256, '5dd880375fd9519421bf2668c9d3b7af9d14f92b250af447cba35d8152e32342');
  assert.equal(browse.resourceSources.textures['P_BtnO_BrwsZoom1.bclim'].sha256, '942371957a8967f962ce9b919dc9ed0b98c52c68054c4e6a5d0b20e01cafada7');
  assert.equal(browse.resourceSources.layouts.P_BrwsBase_D.path, 'lyt/P_Brws_D.arc.LZ/blyt/P_BrwsBase_D.bclyt');
  assert.equal(browse.resourceSources.layouts.P_BrwsBase_D.sha256, '9a4899a6d5188952f6a9a6cb2715afe756f2a6a476c3f77143caddce9a93890c');
  const base = paint(view([{id: 'photo:a', label: 'A'}], {photos: [{id: 'a', src: '/portfolio/a.jpg'}], cameraBrowse: {output: 0}}))
    .find(draw => draw.layout === 'P_BrwsBase_D');
  assert.deepEqual(base.opts.bindings, [{name: 'P_BrwsBase_D_Brws', frame: 0}]);
  assert.equal(base.opts.overrides?.ZoomUp, undefined);
  assert.equal(base.opts.overrides?.ZoomBack, undefined);
  assert.equal(base.opts.overrides?.['-B-ZoomUp'], undefined);
  assert.equal(base.opts.overrides?.['-B-ZoomBack'], undefined);
  for (const target of ['ZoomUp', 'ZoomBack']) {
    const channels = browse.animations.P_BrwsBase_D_Default.tracks
      .filter(track => track.target === target && track.property.startsWith('materialColor.0.'))
      .map(track => track.keys[0].value);
    assert.deepEqual(channels, [70, 55, 55], target);
  }
});

test('frozen lower strip stays 1992 over 2/255 with the peach plus at (17,181)', t => {
  if (!existsSync(NATIVE) || !existsSync(BROWSER)) return t.skip('frozen camera browse pair is absent');
  assert.equal(fileSha(NATIVE), 'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(fileSha(BROWSER), '0d0ffe41fed0cebe34d78ae196cf1694ffeeb3fde59379a027b8969b35845dea');
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
  let count = 0;
  let max = 0;
  let maxAt = null;
  for (let y = 170; y < 210; y++) for (let x = 0; x < 320; x++) {
    const native = nativeAt(x, y);
    const candidate = browserAt(x, y);
    const delta = Math.max(Math.abs(native[0] - candidate[0]), Math.abs(native[1] - candidate[1]), Math.abs(native[2] - candidate[2]));
    if (delta > 2) {
      count++;
      if (delta > max) { max = delta; maxAt = {x, y, native, browser: candidate, delta}; }
    }
  }
  assert.equal(count, 1992);
  assert.deepEqual(maxAt, {x: 17, y: 181, native: [255, 208, 128], browser: [255, 255, 255], delta: 127});
  const blend = (over, under, alpha) => over.map((channel, index) => Math.round(channel * alpha / 255 + under[index] * (255 - alpha) / 255));
  assert.deepEqual([...cameraBrowseUserColor], [255, 161, 0, 255]);
  assert.deepEqual(blend([255, 255, 255], cameraBrowseUserColor.slice(0, 3), 128), [255, 208, 128]);
});

test('full slider and tape archives do not contain a unique ZoomUp-only icon owner', t => {
  if (!existsSync(FULL_SLIDER) || !existsSync(FULL_TAPE)) return t.skip('private Camera native14 packs are absent');
  const full = JSON.parse(readFileSync(FULL_SLIDER, 'utf8'));
  assert.deepEqual(Object.keys(full.layouts).sort(), ['C_SldH_S', 'C_SldT', 'C_SldV_L']);
  for (const name of ['C_SldH_S_Disable', 'C_SldH_S_MRate', 'C_SldH_S_Push']) {
    const tracks = full.animations[name].tracks;
    assert.ok(tracks.some(track => track.target === 'BtnP'), name);
    assert.ok(tracks.some(track => track.target === 'BtnN'), name);
    assert.equal(tracks.some(track => track.target === 'ZoomUp'), false, name);
  }
  for (const name of ['C_SldH_S_Disable', 'C_SldH_S_Push']) {
    assert.ok(full.animations[name].tracks.some(track => track.target === 'BtnP' && track.property.startsWith('materialColor')), name);
  }
  const tape = JSON.parse(readFileSync(FULL_TAPE, 'utf8'));
  assert.deepEqual(Object.keys(tape.layouts), ['P_Tape']);
  assert.equal(Object.keys(tape.animations).length, 7);
  assert.equal(tape.sourceSha256, '34fb91c550a7b00a537055c7535cab3805f532f79f0a36cba6e1e08e1533ea31');
  const linked = [];
  for (const pane of [find(browse.layouts.P_BrwsBase_D.roots, '-L-Tape')]) {
    linked.push(pane.metadata.find(item => item.name === 'LYT').value);
  }
  assert.deepEqual(linked, ['P_Tape/P_Tape']);
});

test('code.bin names the zoom panes and does not name C_SldH_S or the peach word', t => {
  if (!existsSync(CODE)) return t.skip('private Camera code.bin is absent');
  const code = readFileSync(CODE);
  assert.equal(sha(code), '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  assert.ok(code.includes(Buffer.from('-B-ZoomUp\0')));
  assert.ok(code.includes(Buffer.from('-B-ZoomBack\0')));
  assert.ok(code.includes(Buffer.from('-L-Sld/-S-\0')));
  assert.equal(code.includes(Buffer.from('C_SldH_S')), false);
  assert.equal(code.includes(Buffer.from([255, 208, 128])), false);
});
