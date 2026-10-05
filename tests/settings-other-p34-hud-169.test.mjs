import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {sampleSettingsHud} from '../src/os/stock-settings-hud.ts';
import {chargingBatteryFrame, hudColonVisible} from '../src/os/device-status-profile.ts';

const require = createRequire(new URL('../package.json', import.meta.url));
const sharp = require('sharp');
const repo = new URL('..', import.meta.url);
const firmware = new URL('public/os/firmware/10.7.0-32E/', repo);
const packPath = 'packs/settings/contents/0000-0000003d/hud.json';
const pack = JSON.parse(readFileSync(new URL(packPath, firmware)));
const manifest = JSON.parse(readFileSync(new URL('manifest.json', firmware)));
const painter = readFileSync(new URL('src/os/stock-native-settings.ts', repo), 'utf8');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten = panes => panes.flatMap(pane => [pane, ...flatten(pane.children ?? [])]);
const BAT = ['HudBat_00.bclim', 'HudBat_01.bclim', 'HudBat_02.bclim', 'HudBat_03.bclim', 'HudBat_04.bclim', 'HudBat_05.bclim', 'HudBat_06.bclim'];
const ROOT = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001';
const FROZEN = {
  n3: `${ROOT}/settings-other-p34-20261004/natives/page3.png`,
  n4: `${ROOT}/settings-other-p34-20261004/natives/page4.png`,
  b3u: `${ROOT}/settings-other-p34-20261004/browser-page3/upper.png`,
  b3l: `${ROOT}/settings-other-p34-20261004/browser-page3/lower.png`,
  b4u: `${ROOT}/settings-other-p34-20261004/browser-page4/upper.png`,
  b4l: `${ROOT}/settings-other-p34-20261004/browser-page4/lower.png`,
  r3u: `${ROOT}/regression-recapture-20261005/settings-other-p34/settings-other-page3/browser/upper.png`,
  r3l: `${ROOT}/regression-recapture-20261005/settings-other-p34/settings-other-page3/browser/lower.png`,
  r4u: `${ROOT}/regression-recapture-20261005/settings-other-p34/settings-other-page4/browser/upper.png`,
  r4l: `${ROOT}/regression-recapture-20261005/settings-other-p34/settings-other-page4/browser/lower.png`,
};

function sample(data, width, x, y) {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}
function dmax(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}
async function loadRaw(path, extract) {
  let image = sharp(typeof path === 'string' ? path : path.pathname);
  if (extract) image = image.extract(extract);
  return image.ensureAlpha().raw().toBuffer({resolveWithObject: true});
}
function countDiff(native, browser, width, x0, y0, x1, y1) {
  let n = 0;
  let max = 0;
  const pts = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const d = dmax(sample(native.data, width, x, y), sample(browser.data, width, x, y));
    if (d > 2) {
      n++;
      if (d > max) max = d;
      pts.push([x, y]);
    }
  }
  return {n, max, pts};
}
function opaqueHits(lcd, frame) {
  let match = 0;
  let differ = 0;
  for (let y = 0; y < 20; y++) for (let x = 0; x < 32; x++) {
    const texel = sample(frame.data, 32, x, y);
    if (texel[3] !== 255) continue;
    if (dmax(texel, sample(lcd.data, 400, 368 + x, y)) <= 2) match++;
    else differ++;
  }
  return {match, differ};
}

test('HudMset_00 dump identity owns Bat 4/5 and T_TimeC_00', () => {
  assert.equal(manifest.converter.name, 'ctr-native-web');
  assert.equal(manifest.converter.version, '1.2.0');
  assert.equal(manifest.converter.extractor.version, '1.3.0');
  assert.equal(manifest.sources['0004001000022000'].version, 9220);
  assert.equal(pack.titleId, '0004001000022000');
  assert.equal(pack.contentIndex, 0);
  assert.equal(pack.contentId, '0000003d');
  assert.equal(sha(new URL(packPath, firmware)), '01025d86a3f136a773fec95eb00ade65c54718d0a1eeec01c3e904ad1352d427');
  assert.equal(pack.sourceSha256, 'c25089a209c4dcec2096ad65c5e4f8d20e41e9991e81551d56a5f483c96de129');
  assert.deepEqual(pack.resourceSources.layouts.HudMset_00, {
    contentId: '0000003d',
    contentIndex: 0,
    path: 'hud_LZ.bin/blyt/HudMset_00.bclyt',
    sha256: '834c8f31e06d5c43bc2e651d59a2754a0c69346997df8e543f6a833200981114',
    titleId: '0004001000022000',
  });
  assert.deepEqual(pack.resourceSources.animations.HudMset_00_Bat, {
    contentId: '0000003d',
    contentIndex: 0,
    path: 'hud_LZ.bin/anim/HudMset_00_Bat.bclan',
    sha256: 'e8c70db4c5f366e5251aba8c93e2a32a7622e595e511d000ac063f567de83729',
    titleId: '0004001000022000',
  });
  assert.deepEqual(pack.resourceSources.textures['HudBat_04.bclim'], {
    contentId: '0000003d',
    contentIndex: 0,
    path: 'hud_LZ.bin/timg/HudBat_04.bclim',
    sha256: '6e5e661417dbb2972de2d586dd05479dcc26539820e046f5c641d89ccaecee17',
    titleId: '0004001000022000',
  });
  assert.deepEqual(pack.resourceSources.textures['HudBat_05.bclim'], {
    contentId: '0000003d',
    contentIndex: 0,
    path: 'hud_LZ.bin/timg/HudBat_05.bclim',
    sha256: 'ded9e05759df120c1cf5f1cfecd7dd9891c1faa993040a979e69878795d6924c',
    titleId: '0004001000022000',
  });
  assert.equal(pack.textures['HudBat_04.bclim'].url, 'textures/a38db030a56d4f7be610ea8a6b1c567d9d12d6c65df2e7450ee16e9e41f6d179.png');
  assert.equal(pack.textures['HudBat_05.bclim'].url, 'textures/0eefbdb3e25aabc813e86b6b4e1f7e16ae0b1f28f2b8f34b88edbf7c24e7fc47.png');
  const track = pack.animations.HudMset_00_Bat.tracks.find(item => item.target === 'P_Bat_00' && item.property === 'texture.pattern');
  assert.equal(pack.animations.HudMset_00_Bat.textures[track.keys.find(key => key.frame === 4).value], 'HudBat_04.bclim');
  assert.equal(pack.animations.HudMset_00_Bat.textures[track.keys.find(key => key.frame === 5).value], 'HudBat_05.bclim');
  const pane = flatten(pack.layouts.HudMset_00.roots).find(item => item.name === 'T_TimeC_00');
  assert.equal(pane.kind, 'txt1');
  assert.deepEqual(pane.size, [7, 20]);
  assert.equal(pane.translation[0], 136);
  assert.equal(pane.translation[1] === 0, true);
  assert.equal(pane.translation[2], 0);
  assert.equal(pane.text.value, ':');
  assert.equal(pane.text.font, 1);
  assert.deepEqual(pack.layouts.HudMset_00.fonts, ['cbf_std.bcfnt', 'Hud.bcfnt']);
  const font = JSON.parse(readFileSync(new URL('fonts/hud/font.json', firmware)));
  assert.equal(font.sourceSha256, '172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8');
  assert.equal(manifest.resources['fonts/hud/font.json'].sources[0].path, 'font/Hud_JP.bcfnt');
  assert.equal(font.glyphs[String(':'.codePointAt(0))].width, 4);
  assert.match(painter, /T_TimeC_00:\{visible:hud\.colonVisible\}/);
  assert.match(painter, /HudMset_00_Bat',frame:hud\?\.batteryFrame\?\?status\.batteryFrame/);
  assert.equal(painter.includes('displayedDateMs'), false);
  assert.equal(painter.includes('date.getSeconds()'), false);
});

test('frozen Other p3/p4 upper 169 is uniquely Bat 4/5 plus T_TimeC_00', async t => {
  if (!Object.values(FROZEN).every(existsSync)) return t.skip('private Other p3/p4 pair is absent');
  assert.equal(sha(new URL('scripts/native-compare/empty-mask.json', repo)),
    'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  assert.equal(sha(FROZEN.n3), '76ff09145c2883225368be33d32986322e3cb3d733556d81bb994292a7b4daac');
  assert.equal(sha(FROZEN.n4), '3250974938fec12396178767df9f526d314c524978c962a3584a80a4d92d15d3');
  assert.equal(sha(FROZEN.b3u), '1548bfb7a2ea07c1cbf13649e741ff1f392be8ce858e591d5444d6860a0e1a3f');
  assert.equal(sha(FROZEN.b3l), '5ebc1404c08c9cded1183d748090dc849d1282d208919979050782769cec2548');
  assert.equal(sha(FROZEN.b4u), 'fceaa771716c952e3c975801eb4c6f9acbd7ef1d3ac17ecec19c1f41726b06d3');
  assert.equal(sha(FROZEN.b4l), 'a2a473ec5819df679bfd4377916e8d59e46911dc2c12591a7c5cd9c36443c0d2');
  assert.equal(sha(FROZEN.r3u), sha(FROZEN.b3u));
  assert.equal(sha(FROZEN.r3l), sha(FROZEN.b3l));
  assert.equal(sha(FROZEN.r4u), sha(FROZEN.b4u));
  assert.equal(sha(FROZEN.r4l), sha(FROZEN.b4l));

  const n3 = await loadRaw(FROZEN.n3, {left: 0, top: 0, width: 400, height: 240});
  const n4 = await loadRaw(FROZEN.n4, {left: 0, top: 0, width: 400, height: 240});
  const b3 = await loadRaw(FROZEN.b3u);
  const b4 = await loadRaw(FROZEN.b4u);
  const l3n = await loadRaw(FROZEN.n3, {left: 40, top: 240, width: 320, height: 240});
  const l4n = await loadRaw(FROZEN.n4, {left: 40, top: 240, width: 320, height: 240});
  const l3b = await loadRaw(FROZEN.b3l);
  const l4b = await loadRaw(FROZEN.b4l);
  const whole3 = countDiff(n3, b3, 400, 0, 0, 400, 240);
  const whole4 = countDiff(n4, b4, 400, 0, 0, 400, 240);
  const bat3 = countDiff(n3, b3, 400, 377, 6, 395, 14);
  const bat4 = countDiff(n4, b4, 400, 377, 6, 395, 14);
  const c1_3 = countDiff(n3, b3, 400, 339, 5, 343, 9);
  const c2_3 = countDiff(n3, b3, 400, 339, 11, 343, 15);
  const c1_4 = countDiff(n4, b4, 400, 339, 5, 343, 9);
  const c2_4 = countDiff(n4, b4, 400, 339, 11, 343, 15);
  assert.deepEqual([whole3.n, bat3.n, c1_3.n, c2_3.n], [169, 137, 16, 16]);
  assert.deepEqual([whole4.n, bat4.n, c1_4.n, c2_4.n], [169, 137, 16, 16]);
  assert.equal(countDiff(n3, b3, 400, 0, 0, 400, 28).n, 169);
  assert.equal(countDiff(l3n, l3b, 320, 0, 0, 320, 240).n, 8);
  assert.equal(countDiff(l4n, l4b, 320, 0, 0, 320, 240).n, 35);
  assert.equal(whole3.n - bat3.n - c1_3.n - c2_3.n, 0);
  assert.equal(whole4.n - bat4.n - c1_4.n - c2_4.n, 0);
  for (const [x, y] of [...c1_3.pts, ...c2_3.pts, ...c1_4.pts, ...c2_4.pts]) {
    assert.equal(x >= 336 && x < 343 && y >= 0 && y < 20, true, `${x},${y} stays in T_TimeC_00`);
  }

  const frames = {};
  for (const name of BAT) {
    frames[name] = await loadRaw(new URL(pack.textures[name].url, firmware));
  }
  assert.deepEqual(opaqueHits(n3, frames['HudBat_05.bclim']), {match: 190, differ: 0});
  assert.deepEqual(opaqueHits(b3, frames['HudBat_04.bclim']), {match: 190, differ: 0});
  assert.deepEqual(opaqueHits(n4, frames['HudBat_04.bclim']), {match: 190, differ: 0});
  assert.deepEqual(opaqueHits(b4, frames['HudBat_05.bclim']), {match: 190, differ: 0});
  for (const name of BAT) {
    if (name !== 'HudBat_05.bclim') assert.notEqual(opaqueHits(n3, frames[name]).differ, 0, name);
    if (name !== 'HudBat_04.bclim') assert.notEqual(opaqueHits(b3, frames[name]).differ, 0, name);
  }
  let native5 = 0;
  let browser4 = 0;
  for (const [x, y] of bat3.pts) {
    const local = sample(frames['HudBat_05.bclim'].data, 32, x - 368, y);
    const odd = sample(frames['HudBat_04.bclim'].data, 32, x - 368, y);
    if (dmax(sample(n3.data, 400, x, y), local) <= 2) native5++;
    if (dmax(sample(b3.data, 400, x, y), odd) <= 2) browser4++;
  }
  assert.deepEqual([native5, browser4], [137, 137]);

  const page3 = new Date(2026, 8, 26, 21, 45, 42, 533).getTime();
  const page4 = new Date(2026, 8, 26, 21, 46, 7, 466).getTime();
  const hud3 = sampleSettingsHud(null, 12000, page3);
  const hud4 = sampleSettingsHud(null, 12000, page4);
  assert.equal(hudColonVisible(new Date(page3).getSeconds()), true);
  assert.equal(chargingBatteryFrame(new Date(page3).getSeconds()), 5);
  assert.equal(hud3.colonVisible, false);
  assert.equal(hud3.batteryFrame, 4);
  assert.equal(hudColonVisible(new Date(page4).getSeconds()), false);
  assert.equal(chargingBatteryFrame(new Date(page4).getSeconds()), 4);
  assert.equal(hud4.colonVisible, true);
  assert.equal(hud4.batteryFrame, 5);
});
