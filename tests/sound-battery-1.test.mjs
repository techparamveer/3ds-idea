import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require = createRequire(new URL('../package.json', import.meta.url));
const sharp = require('sharp');
const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter = readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const info = JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json', firmware), 'utf8'));
const hud = JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-C-Hud.json', firmware), 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const compile = name => ts.transpileModule(readFileSync(new URL('../src/os/' + name + '.ts', import.meta.url), 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
}).outputText;
const {rasterNativePicture} = await import('data:text/javascript;base64,' + Buffer.from(compile('native-layout')).toString('base64'));

const partitionName = 'UnderBar_Partition.bclim';
const partitionPng = 'textures/1fd119b2de7e5a4ee9e59996607d40fd086ca9d156cb78125e6cfa63df32cfa3.png';

test('the battery-ROI pixel is UnderBar Line00 texel (5,4), and the battery frame does not cover it', async () => {
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json', firmware)),
    'ff48060bf81844c2992394038aa386a064a55a0a7fe5b6e7e6e533a77e4919c9');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-C-Hud.json', firmware)),
    'bb4bfdd539b1ae9cb11b34718c33eda010192d9af0cdce72c2e9e4d9902500d3');
  assert.equal(info.resourceSources.layouts['S_Inf_U-UnderBar'].sha256,
    '7bb9a648e82d1d81e4e6ee0c7f7643a87db0ca3a8e38f72be293af97502a96e8');
  assert.equal(info.resourceSources.layouts['S_Inf_U-UnderBar'].path,
    'lyt/S_Inf_U.arc.LZ/blyt/S_Inf_U-UnderBar.bclyt');
  assert.equal(info.resourceSources.textures[partitionName].sha256,
    'feb032cf8511d038d240a78dfb2a819f4eae462ab68fc9a8b3cb0835b03826df');
  assert.equal(info.resourceSources.textures[partitionName].path,
    'lyt/S_Inf_U.arc.LZ/timg/UnderBar_Partition.bclim');
  assert.equal(sha(new URL(partitionPng, firmware)), '1fd119b2de7e5a4ee9e59996607d40fd086ca9d156cb78125e6cfa63df32cfa3');
  assert.equal(hud.resourceSources.layouts.C_HudBut_B.sha256,
    'ab8e833f29680e9f9f2e2b0838a7ec930c361dc64d50a70664764ac12e2b7eda');
  assert.equal(hud.resourceSources.animations.C_HudBut_B_Pattern.sha256,
    '266282e44cfa694ab41df019683f07faab4a7da621b4c493cdefbc26152050e7');

  const under = info.layouts['S_Inf_U-UnderBar'];
  const lines = under.roots[0].children[0].children;
  assert.deepEqual(lines.map(pane => pane.name), ['Line00', 'Line01', 'Line02']);
  for (const pane of lines) {
    assert.deepEqual(pane.size, [8, 24]);
    assert.equal(pane.origin, 4);
    assert.deepEqual(pane.picture.uvSets, [[0, 0, 1, 0, 0, 0.75, 1, 0.75]]);
    assert.equal(under.textures[under.materials[pane.picture.material].textureMaps[0].texture], partitionName);
  }
  assert.deepEqual(lines[0].translation, [-156, -4, 0]);
  const meta = info.textures[partitionName];
  assert.deepEqual([meta.width, meta.height, meta.formatName, meta.picaFormat], [8, 32, 'ETC1A4', 13]);
  const decoded = await sharp(new URL(meta.url, firmware).pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const textures = new Map([[partitionName, {
    width: decoded.info.width, height: decoded.info.height, data: decoded.data, picaFormat: meta.picaFormat,
  }]]);
  const sample = (pane, x, y) => {
    const raster = rasterNativePicture(under, pane.picture, pane.size[0], pane.size[1], textures);
    const at = (y * raster.width + x) * 4;
    return [...raster.data.subarray(at, at + 4)];
  };
  assert.deepEqual(sample(lines[0], 5, 4), [74, 58, 49, 255]);
  assert.deepEqual(sample(lines[2], 5, 4), [74, 58, 49, 255]);
  assert.deepEqual(sample(lines[1], 4, 4), [80, 64, 55, 255]);
  let nativeColor = 0;
  for (let i = 0; i < decoded.data.length; i += 4) {
    if (decoded.data[i] === 76 && decoded.data[i + 1] === 62 && decoded.data[i + 2] === 53) nativeColor++;
  }
  assert.equal(nativeColor, 0, 'native (76,62,53) is not a partition texel');

  const frame = hud.layouts.C_HudBut_B.roots[0].children[0];
  assert.equal(frame.name, '-H-But_B');
  assert.equal(frame.origin, 0);
  assert.deepEqual(frame.size, [32, 20]);
  assert.ok(frame.translation[0] === 0);
  assert.equal(frame.translation[1], 10);
  const fill = frame.children[0];
  assert.equal(fill.name, 'ButF_B');
  assert.deepEqual(fill.size, [19, 10]);
  const pattern = hud.animations.C_HudBut_B_Pattern;
  assert.deepEqual(pattern.tracks.filter(track => track.binding === 'pane'), []);
  assert.ok(pattern.tracks.every(track => track.target === 'ButF_B'));

  assert.match(painter, /entry\(top,'sound-info','S_Inf_U-UnderBar'\);/);
  assert.match(painter, /\{name:'C_HudBut_B_Pattern',frame:soundHudBatteryPatternFrame\(options\.date\?\?new Date\(\)\)\}/);
  assert.equal(painter.includes('74,58,49'), false);
  assert.equal(painter.includes('76,62,53'), false);
});

test('both frozen uppers keep battery ROI 1 at (45,220) and a clear C_HudBut_B body', async t => {
  const root = '/Users/paramveer/.codex/3ds-artifact-overflow';
  const files = {
    nativeFirst: `${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty: `${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst: `${root}/home-fidelity-20261001/sound-guide-next-recapture-20261005/browser/upper.png`,
    browserEmpty: `${root}/home-fidelity-20261001/sound-empty-entry-recapture-20261005/browser/upper.png`,
    mask: new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if (![files.nativeFirst, files.nativeEmpty, files.browserFirst, files.browserEmpty].every(existsSync)) {
    return t.skip('private Sound battery stills are absent');
  }
  assert.equal(sha(files.nativeFirst), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.nativeEmpty), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.browserFirst), '16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab');
  assert.equal(sha(files.browserEmpty), 'ebe8959e5a4d2bcb69ce63ebe34c3756d2b73a808bca42984708168f6918b97c');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const crop = async path => (await sharp(path).extract({left: 0, top: 0, width: 400, height: 240}).ensureAlpha().raw().toBuffer());
  const load = async path => (await sharp(path).ensureAlpha().raw().toBuffer());
  const rgb = (data, x, y) => {
    const at = (y * 400 + x) * 4;
    return [data[at], data[at + 1], data[at + 2]];
  };
  const over = (native, browser, x, y) => Math.max(...rgb(native, x, y).map((value, channel) => Math.abs(value - rgb(browser, x, y)[channel]))) > 2;
  const count = (native, browser, rect) => {
    const [x0, y0, x1, y1] = rect;
    const hits = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (over(native, browser, x, y)) hits.push([x, y]);
    return hits;
  };
  for (const [nativePath, browserPath] of [[files.nativeFirst, files.browserFirst], [files.nativeEmpty, files.browserEmpty]]) {
    const native = await crop(nativePath);
    const browser = await load(browserPath);
    assert.deepEqual(count(native, browser, [45, 216, 85, 240]), [[45, 220]]);
    assert.deepEqual(rgb(native, 45, 220), [76, 62, 53]);
    assert.deepEqual(rgb(browser, 45, 220), [74, 58, 49]);
    assert.deepEqual(count(native, browser, [51, 218, 83, 238]), []);
    assert.deepEqual(count(native, browser, [59, 223, 78, 233]), []);
    assert.deepEqual(count(native, browser, [95, 216, 194, 240]), []);
    assert.deepEqual(rgb(native, 197, 220), [74, 58, 49]);
    assert.deepEqual(rgb(browser, 197, 220), [74, 58, 49]);
  }
});
