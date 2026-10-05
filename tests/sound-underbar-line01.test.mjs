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
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const compile = name => ts.transpileModule(readFileSync(new URL('../src/os/' + name + '.ts', import.meta.url), 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
}).outputText;
const {rasterNativePicture} = await import('data:text/javascript;base64,' + Buffer.from(compile('native-layout')).toString('base64'));

const partitionName = 'UnderBar_Partition.bclim';
const partitionPng = 'textures/1fd119b2de7e5a4ee9e59996607d40fd086ca9d156cb78125e6cfa63df32cfa3.png';
const bodyName = 'UnderBar.bclim';

/** Layout centre plus each translation, with BCLYT +Y going up the LCD. */
function lcdCenter(translations) {
  return translations.reduce((at, translation) => [at[0] + translation[0], at[1] - translation[1]], [200, 120]);
}

test('UnderBar Line01 local (4,4) is partition texel (4,4), and native (82,67,59) is absent', async () => {
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json', firmware)),
    'ff48060bf81844c2992394038aa386a064a55a0a7fe5b6e7e6e533a77e4919c9');
  assert.equal(info.resourceSources.layouts['S_Inf_U-UnderBar'].sha256,
    '7bb9a648e82d1d81e4e6ee0c7f7643a87db0ca3a8e38f72be293af97502a96e8');
  assert.equal(info.resourceSources.layouts['S_Inf_U-UnderBar'].path,
    'lyt/S_Inf_U.arc.LZ/blyt/S_Inf_U-UnderBar.bclyt');
  assert.equal(info.resourceSources.textures[partitionName].sha256,
    'feb032cf8511d038d240a78dfb2a819f4eae462ab68fc9a8b3cb0835b03826df');
  assert.equal(info.resourceSources.textures[bodyName].sha256,
    '1c80567ccbd7d067ba48f8ed1597ac65099a96f2c3494d0477dfa8fc1da9ca00');
  assert.equal(sha(new URL(partitionPng, firmware)), '1fd119b2de7e5a4ee9e59996607d40fd086ca9d156cb78125e6cfa63df32cfa3');

  const under = info.layouts['S_Inf_U-UnderBar'];
  assert.deepEqual([under.canvas.width, under.canvas.height], [400, 240]);
  const bar = under.roots[0].children[0];
  const lines = bar.children;
  assert.equal(bar.name, 'DefUndBar');
  assert.deepEqual(lines.map(pane => pane.name), ['Line00', 'Line01', 'Line02']);
  // BCLYT stores this X as −0. Adding zero keeps the 400px-centred mount.
  assert.deepEqual([bar.translation[0] + 0, bar.translation[1], bar.translation[2]], [0, -104, 0]);
  assert.deepEqual(lines.map(pane => pane.translation), [[-156, -4, 0], [-108, -4, 0], [-4, -4, 0]]);
  const centers = lines.map(pane => lcdCenter([bar.translation, pane.translation]));
  assert.deepEqual(centers, [[44, 228], [92, 228], [196, 228]]);
  for (const pane of lines) {
    assert.deepEqual(pane.size, [8, 24]);
    assert.equal(pane.origin, 4);
    assert.equal(pane.alpha, 255);
    assert.deepEqual(pane.picture.colors, [[255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255]]);
    assert.deepEqual(pane.picture.uvSets, [[0, 0, 1, 0, 0, 0.75, 1, 0.75]]);
    const material = under.materials[pane.picture.material];
    assert.equal(under.textures[material.textureMaps[0].texture], partitionName);
    assert.equal(material.textureMaps[0].magFilter, 1);
    assert.deepEqual(material.tevStages, []);
    assert.equal(material.colorBlend, undefined);
  }
  const meta = info.textures[partitionName];
  assert.deepEqual([meta.width, meta.height, meta.formatName], [8, 32, 'ETC1A4']);
  const decoded = await sharp(new URL(meta.url, firmware).pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const body = await sharp(new URL(info.textures[bodyName].url, firmware).pathname).ensureAlpha().raw().toBuffer();
  const texel = (image, x, y, width) => {
    const at = (y * width + x) * 4;
    return [...image.subarray(at, at + 4)];
  };
  assert.deepEqual(texel(decoded.data, 4, 4, decoded.info.width), [80, 64, 55, 255]);
  const textures = new Map([[partitionName, {
    width: decoded.info.width, height: decoded.info.height, data: decoded.data, picaFormat: meta.picaFormat,
  }]]);
  const sample = pane => {
    const raster = rasterNativePicture(under, pane.picture, pane.size[0], pane.size[1], textures);
    return texel(raster.data, 4, 4, raster.width);
  };
  assert.deepEqual(sample(lines[0]), [80, 64, 55, 255]);
  assert.deepEqual(sample(lines[1]), [80, 64, 55, 255]);
  assert.deepEqual(sample(lines[2]), [80, 64, 55, 255]);
  const countNative = image => {
    let count = 0;
    for (let i = 0; i < image.length; i += 4) if (image[i] === 82 && image[i + 1] === 67 && image[i + 2] === 59) count++;
    return count;
  };
  assert.equal(countNative(decoded.data), 0, 'native (82,67,59) is not a partition texel');
  assert.equal(countNative(body), 0, 'native (82,67,59) is not an UnderBar body texel');

  assert.match(painter, /entry\(top,'sound-info','S_Inf_U-UnderBar'\);/);
  assert.equal(painter.includes('80,64,55'), false);
  assert.equal(painter.includes('82,67,59'), false);
});

test('both frozen uppers keep Line01 excess 1 at (92,220) and the same texel on Line00 and Line02', async t => {
  const root = '/Users/paramveer/.codex/3ds-artifact-overflow';
  const files = {
    nativeFirst: `${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty: `${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst: `${root}/home-fidelity-20261001/sound-guide-next-recapture-20261005/browser/upper.png`,
    browserEmpty: `${root}/home-fidelity-20261001/sound-empty-entry-recapture-20261005/browser/upper.png`,
    mask: new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if (![files.nativeFirst, files.nativeEmpty, files.browserFirst, files.browserEmpty].every(existsSync)) {
    return t.skip('private Sound underbar stills are absent');
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
    assert.deepEqual(count(native, browser, [88, 216, 96, 240]), [[92, 220]]);
    assert.deepEqual(rgb(native, 92, 220), [82, 67, 59]);
    assert.deepEqual(rgb(browser, 92, 220), [80, 64, 55]);
    assert.deepEqual(rgb(native, 44, 220), [80, 64, 55]);
    assert.deepEqual(rgb(browser, 44, 220), [80, 64, 55]);
    assert.deepEqual(rgb(native, 196, 220), [80, 64, 55]);
    assert.deepEqual(rgb(browser, 196, 220), [80, 64, 55]);
    assert.deepEqual(count(native, browser, [192, 216, 200, 240]), []);
    assert.deepEqual(count(native, browser, [45, 216, 85, 240]), [[45, 220]]);
    assert.deepEqual(count(native, browser, [95, 216, 194, 240]), []);
  }
});
