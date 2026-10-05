import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require = createRequire(new URL('../package.json', import.meta.url));
const sharp = require('sharp');
const repo = new URL('..', import.meta.url);
const firmware = new URL('public/os/firmware/10.7.0-32E/', repo);
const painter = readFileSync(new URL('src/os/stock-native-sound.ts', repo), 'utf8');
const hud = JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-C-Hud.json', firmware), 'utf8'));
const info = JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json', firmware), 'utf8'));
const bg = JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_BG-arc-LZ.json', firmware), 'utf8'));
const room = JSON.parse(readFileSync(new URL('models/sound-room/model.json', firmware), 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const compile = name => ts.transpileModule(readFileSync(new URL('src/os/' + name + '.ts', repo), 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
}).outputText;
const {rasterNativePicture} = await import('data:text/javascript;base64,' + Buffer.from(compile('native-layout')).toString('base64'));

const volumeNames = [
  'HudSnd_B_00.bclim', 'HudSnd_B_01.bclim', 'HudSnd_B_02.bclim', 'HudSnd_B_03.bclim', 'HudSnd_B_04.bclim',
];
const icon = [7, 218, 37, 238];

async function loadTexture(pack, name) {
  const meta = pack.textures[name];
  const decoded = await sharp(new URL(meta.url, firmware).pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  return {
    meta,
    image: {width: decoded.info.width, height: decoded.info.height, data: decoded.data, picaFormat: meta.picaFormat},
  };
}

function over(src, dest) {
  const out = new Uint8ClampedArray(3);
  const alpha = src[3] / 255;
  for (let channel = 0; channel < 3; channel++) out[channel] = src[channel] * alpha + dest[channel] * (1 - alpha);
  return [out[0], out[1], out[2]];
}

test('volume spill is the frame-0 icon overhang, and the room has no clips', async () => {
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-C-Hud.json', firmware)),
    'bb4bfdd539b1ae9cb11b34718c33eda010192d9af0cdce72c2e9e4d9902500d3');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json', firmware)),
    'ff48060bf81844c2992394038aa386a064a55a0a7fe5b6e7e6e533a77e4919c9');
  assert.equal(info.resourceSources.textures['UnderBar.bclim'].sha256,
    '1c80567ccbd7d067ba48f8ed1597ac65099a96f2c3494d0477dfa8fc1da9ca00');
  assert.equal(info.resourceSources.textures['UnderBar.bclim'].path, 'lyt/S_Inf_U.arc.LZ/timg/UnderBar.bclim');
  const underMeta = info.textures['UnderBar.bclim'];
  assert.deepEqual([underMeta.formatName, underMeta.width, underMeta.height], ['ETC1A4', 8, 32]);
  assert.equal(sha(new URL(underMeta.url, firmware)), '38e2651a8d47684b1da2756896d50bfb55ae89baeae57556c29cdde617bb7c12');
  const under = await loadTexture(info, 'UnderBar.bclim');
  let brown = 0;
  for (let i = 0; i < under.image.data.length; i += 4) {
    if (under.image.data[i] === 62 && under.image.data[i + 1] === 46 && under.image.data[i + 2] === 29 && under.image.data[i + 3] === 255) brown++;
  }
  assert.equal(brown, 144);

  const layout = hud.layouts.C_HudSndB;
  const pane = layout.roots[0].children[0];
  assert.equal(pane.name, '-H-SndB');
  assert.deepEqual(pane.size, [30, 20]);
  assert.deepEqual(pane.translation, [15, 0, 0]);
  assert.equal(layout.materials[0].textureMaps[0].magFilter, 1);
  assert.deepEqual(hud.animations.C_HudSndB_Pattern.textures, volumeNames);
  for (const name of volumeNames) assert.equal(hud.textures[name].formatName, 'LA4');
  assert.match(painter, /\{name:'C_HudSndB_Pattern',frame:0\}/);
  assert.equal(painter.includes('soundHudVolume'), false);

  const bar = info.layouts['S_Inf_U-UnderBar'].roots[0].children[0];
  assert.equal(bar.name, 'DefUndBar');
  assert.deepEqual(bar.size, [400, 32]);
  const barRaster = rasterNativePicture(info.layouts['S_Inf_U-UnderBar'], bar.picture, bar.size[0], bar.size[1], new Map([['UnderBar.bclim', under.image]]), 1, info.layouts['S_Inf_U-UnderBar'].materials[bar.picture.material]);
  const rasters = [];
  for (const name of volumeNames) {
    const texture = await loadTexture(hud, name);
    const posed = structuredClone(layout);
    posed.textures = [name];
    rasters.push(rasterNativePicture(posed, pane.picture, 30, 20, new Map([[name, texture.image]]), 1, posed.materials[0]));
  }
  const sample = (image, x, y) => {
    const at = (y * image.width + x) * 4;
    return [image.data[at], image.data[at + 1], image.data[at + 2], image.data[at + 3]];
  };
  let clear = 0;
  let grey = 0;
  for (let y = 0; y < 20; y++) for (let x = 23; x < 27; x++) {
    const alphas = rasters.map(image => sample(image, x, y)[3]);
    const destAt = ((10 + y) * 400 + (7 + x)) * 4;
    const dest = [barRaster.data[destAt], barRaster.data[destAt + 1], barRaster.data[destAt + 2]];
    if (alphas[0] > 0 && alphas.slice(1).every(alpha => alpha === 0)) {
      clear++;
      assert.deepEqual(dest, [62, 46, 29]);
    }
    if (alphas.every(alpha => alpha === 255) && sample(rasters[4], x, y).slice(0, 3).join(',') === '204,204,204') grey++;
  }
  assert.equal(clear, 38);
  assert.equal(grey, 4);

  const record = bg.animations['S_BG-Record_U_Default'];
  assert.equal(bg.resourceSources.animations['S_BG-Record_U_Default'].sha256,
    '707b881432691496bdcd565e63cf939b83e2bbf1d66fdd533ca8330eca092ff8');
  assert.equal(record.tracks.find(track => track.property === 'translation.y').keys[0].value, -332);
  assert.equal(room.sourceSha256, '134099e5050c465200be110ed53258c2d81c6bfc43456496bb60b53d69fd27bd');
  assert.equal(room.compressedSourceSha256, '8c7d41fee74034b22bbd39b3a35d24906057f996c9201de51596feb218f504f5');
  assert.deepEqual(room.textures.map(texture => [texture.name, texture.format]), [['S_BG_U_Tx_A', 'ETC1A4'], ['S_BG_U_Tx_BC', 'ETC1']]);
  assert.deepEqual([room.skeletalAnimations.length, room.materialAnimations.length, room.visibilityAnimations.length, room.cameraAnimations.length], [0, 0, 0, 0]);
  assert.equal(painter.includes("soundRoom"), true);
});

test('frozen uppers keep the 42-pixel volume overhang and the 274-pixel room residual', async t => {
  const root = '/Users/paramveer/.codex/3ds-artifact-overflow';
  const files = {
    nativeFirst: `${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty: `${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst: `${root}/home-fidelity-20261001/sound-guide-next-recapture-20261005/browser/upper.png`,
    browserEmpty: `${root}/home-fidelity-20261001/sound-clock-recapture-20261004/browser-empty-entry/upper.png`,
  };
  if (!Object.values(files).every(existsSync)) return t.skip('private Sound uppers are absent');
  assert.equal(sha(new URL('scripts/native-compare/empty-mask.json', repo)),
    'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  assert.equal(sha(files.nativeFirst), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.nativeEmpty), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.browserFirst), '16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab');
  assert.equal(sha(files.browserEmpty), '8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0');
  const upper = async path => {
    const raw = await sharp(path).extract({left: 0, top: 0, width: 400, height: 240}).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    assert.deepEqual([raw.info.width, raw.info.height], [400, 240]);
    return raw.data;
  };
  const delta = (a, b, i) => Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
  const count = (native, browser, [x0, y0, x1, y1]) => {
    let n = 0;
    let max = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const d = delta(native, browser, (y * 400 + x) * 4);
      if (d > 2) {
        n++;
        if (d > max) max = d;
      }
    }
    return {n, max};
  };
  const firstNative = await upper(files.nativeFirst);
  const emptyNative = await upper(files.nativeEmpty);
  const firstBrowser = await upper(files.browserFirst);
  const emptyBrowser = await upper(files.browserEmpty);
  for (const [native, browser] of [[firstNative, firstBrowser], [emptyNative, emptyBrowser]]) {
    assert.deepEqual(count(native, browser, [0, 216, 30, 240]), {n: 130, max: 226});
    assert.deepEqual(count(native, browser, [30, 216, 37, 240]), {n: 42, max: 226});
    assert.deepEqual(count(native, browser, icon), {n: 172, max: 226});
    assert.deepEqual(count(native, browser, [0, 114, 400, 160]), {n: 269, max: 10});
    assert.deepEqual(count(native, browser, [103, 85, 107, 89]), {n: 4, max: 3});
    assert.equal(delta(native, browser, (81 * 400 + 98) * 4), 3);
    assert.equal(count(native, browser, [0, 100, 400, 114]).n > 2000, true);
  }
  let roomDiffer = 0;
  let spanDiffer = 0;
  for (let y = 0; y < 240; y++) for (let x = 0; x < 400; x++) {
    const i = (y * 400 + x) * 4;
    const inRoom = (y >= 114 && y < 160) || (x >= 103 && x < 107 && y >= 85 && y < 89) || (x === 98 && y === 81);
    if (inRoom && delta(firstNative, emptyNative, i) > 0) roomDiffer++;
    if (y >= 100 && y < 114 && delta(firstNative, emptyNative, i) > 2) spanDiffer++;
  }
  assert.equal(roomDiffer, 0);
  assert.equal(spanDiffer, 2297);
  const shifted = (dx, dy) => {
    let n = 0;
    for (let y = 114; y < 160; y++) for (let x = 0; x < 400; x++) {
      const xx = x + dx;
      const yy = y + dy;
      const iB = (y * 400 + x) * 4;
      const iN = (yy * 400 + xx) * 4;
      if (Math.max(Math.abs(firstBrowser[iB] - firstNative[iN]), Math.abs(firstBrowser[iB + 1] - firstNative[iN + 1]), Math.abs(firstBrowser[iB + 2] - firstNative[iN + 2])) > 2) n++;
    }
    return n;
  };
  assert.equal(shifted(0, 0), 269);
  assert.equal(shifted(-1, 0), 1791);
  assert.equal(shifted(1, 0), 1793);
  assert.equal(shifted(0, -1), 5513);
  assert.equal(shifted(0, 1), 5469);

  const under = await loadTexture(info, 'UnderBar.bclim');
  const bar = info.layouts['S_Inf_U-UnderBar'].roots[0].children[0];
  const barRaster = rasterNativePicture(info.layouts['S_Inf_U-UnderBar'], bar.picture, 400, 32, new Map([['UnderBar.bclim', under.image]]), 1, info.layouts['S_Inf_U-UnderBar'].materials[bar.picture.material]);
  const layout = hud.layouts.C_HudSndB;
  const pane = layout.roots[0].children[0];
  const scores = [];
  for (const name of volumeNames) {
    const texture = await loadTexture(hud, name);
    const posed = structuredClone(layout);
    posed.textures = [name];
    const raster = rasterNativePicture(posed, pane.picture, 30, 20, new Map([[name, texture.image]]), 1, posed.materials[0]);
    let nativeHit = 0;
    let browserHit = 0;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 30; x++) {
      const at = (y * 30 + x) * 4;
      const src = [raster.data[at], raster.data[at + 1], raster.data[at + 2], raster.data[at + 3]];
      const destAt = ((10 + y) * 400 + (7 + x)) * 4;
      const predicted = over(src, [barRaster.data[destAt], barRaster.data[destAt + 1], barRaster.data[destAt + 2]]);
      const nativeAt = ((218 + y) * 400 + (7 + x)) * 4;
      const browserAt = nativeAt;
      if (Math.max(...predicted.map((v, i) => Math.abs(v - firstNative[nativeAt + i]))) <= 2) nativeHit++;
      if (Math.max(...predicted.map((v, i) => Math.abs(v - firstBrowser[browserAt + i]))) <= 2) browserHit++;
    }
    scores.push([nativeHit, browserHit]);
  }
  assert.deepEqual(scores, [[428, 600], [476, 552], [510, 518], [526, 502], [600, 428]]);

  const output = mkdtempSync(join(tmpdir(), 'sound-upper-316-'));
  try {
    const run = spawnSync(process.execPath, [
      new URL('scripts/verify-sound-room-source.mjs', repo).pathname,
      '--output', output,
      '--model', new URL('models/sound-room/model.json', firmware).pathname,
      '--native', files.nativeFirst,
      '--sampling', 'native',
    ], {cwd: new URL('.', repo).pathname, encoding: 'utf8'});
    assert.equal(run.status, 0, run.stderr);
    const report = JSON.parse(readFileSync(join(output, 'report.json'), 'utf8'));
    assert.equal(report.triangles, 40);
    assert.equal(report.sampling, 'authored-mips');
    const cpu = await upper(join(output, 'room-cpu-source.png'));
    let cpuNative = 0;
    let cpuBrowser = 0;
    let sharedMiss = 0;
    const regions = [[0, 114, 400, 160], [103, 85, 107, 89]];
    const seen = new Set();
    const visit = (x, y) => {
      const key = x + ',' + y;
      if (seen.has(key)) return;
      seen.add(key);
      const i = (y * 400 + x) * 4;
      if (delta(firstNative, firstBrowser, i) <= 2) return;
      const cpuNativeDelta = delta(cpu, firstNative, i);
      const cpuBrowserDelta = delta(cpu, firstBrowser, i);
      if (cpuNativeDelta <= 2) cpuNative++;
      if (cpuBrowserDelta <= 2) cpuBrowser++;
      if (cpuNativeDelta > 2 && delta(firstBrowser, firstNative, i) > 2) sharedMiss++;
    };
    for (const [x0, y0, x1, y1] of regions) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) visit(x, y);
    visit(98, 81);
    assert.equal(cpuNative, 47);
    assert.equal(cpuBrowser, 230);
    assert.equal(sharedMiss, 227);
  } finally {
    rmSync(output, {recursive: true, force: true});
  }
});
