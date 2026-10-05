import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter = readFileSync(new URL('../src/os/stock-native-web.ts', import.meta.url), 'utf8');
const systemInfo = JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-SystemInfo.json', firmware), 'utf8'));
const netAtn = JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-NetAntenna.json', firmware), 'utf8'));
const netMode = JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-NetMode.json', firmware), 'utf8'));
const battery = JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-Battery.json', firmware), 'utf8'));
const calendar = JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-Calendar.json', firmware), 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten = panes => panes.flatMap(pane => [pane, ...flatten(pane.children ?? [])]);
const ROOT = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001';
const FROZEN = {
  native: `${ROOT}/native-new-apps-captures-20261004/browser-start-menu-local/native/_04.10.26_19.20.59.347.png`,
  upper: `${ROOT}/rank1-recapture-20261005/browser-hud/browser/upper.png`,
  lower: `${ROOT}/rank1-recapture-20261005/browser-hud/browser/lower.png`,
  report: `${ROOT}/rank1-recapture-20261005/browser-hud/report.json`,
  contact: `${ROOT}/rank1-recapture-20261005/browser-hud/upper-contact-sheet.png`,
};
const mask = new URL('../scripts/native-compare/empty-mask.json', import.meta.url);

test('BasePct / HudBase_00 uniquely own SystemInfo LCD y=25-27; painter stays title-local', () => {
  assert.equal(systemInfo.titleId, '0004003000009d02');
  assert.equal(systemInfo.contentIndex, 0);
  assert.equal(systemInfo.contentId, '0000001f');
  assert.equal(systemInfo.sourceSha256, '2c6742768f6829d3b2f857e165872baf5a923ed152edf0dea74bed1f20278bc5');
  assert.equal(sha(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-SystemInfo.json', firmware)),
    '31e8be409065363b3fa9164d535fb9037f476e3419193614277754d247599ac2');
  assert.equal(systemInfo.resourceSources.layouts.SystemInfo.path,
    'layout/sysinfo/SystemInfo.arc/blyt/SystemInfo.bclyt');
  assert.equal(systemInfo.resourceSources.layouts.SystemInfo.sha256,
    'a07dfc3efb374634ba31c0424bf3f6771611056827c0ff2aca3095aa997d3e79');
  assert.deepEqual(systemInfo.layouts.SystemInfo.textures, ['CountBarBase_00.bclim', 'HudBase_00.bclim']);

  const panes = flatten(systemInfo.layouts.SystemInfo.roots);
  const pics = panes.filter(pane => pane.kind === 'pic1');
  assert.deepEqual(pics.map(pane => pane.name), ['BasePct', 'BarBasePict']);
  const base = pics.find(pane => pane.name === 'BasePct');
  const bar = pics.find(pane => pane.name === 'BarBasePict');
  assert.deepEqual(base.size, [400, 28]);
  assert.deepEqual(base.translation, [-200, 240, 0]);
  assert.equal(base.origin, 0);
  assert.equal(base.flags & 1, 1);
  assert.equal(base.picture.material, 0);
  assert.deepEqual(base.picture.uvSets, [[0, -2.25, 1, -2.25, 0, 1.25, 1, 1.25]]);
  assert.deepEqual(bar.size, [400, 6]);
  assert.deepEqual(bar.translation, [-0, 218, 0]);
  assert.equal(bar.origin, 4);
  assert.equal(bar.picture.material, 1);

  const baseMat = systemInfo.layouts.SystemInfo.materials[0];
  const barMat = systemInfo.layouts.SystemInfo.materials[1];
  assert.equal(baseMat.name, 'BasePct');
  assert.equal(barMat.name, 'BarBasePict');
  assert.equal(systemInfo.layouts.SystemInfo.textures[baseMat.textureMaps[0].texture], 'HudBase_00.bclim');
  assert.equal(systemInfo.layouts.SystemInfo.textures[barMat.textureMaps[0].texture], 'CountBarBase_00.bclim');
  assert.deepEqual(baseMat.textureMatrices[0].translation, [0, -0.6000000238418579]);

  const hudBase = systemInfo.textures['HudBase_00.bclim'];
  const countBar = systemInfo.textures['CountBarBase_00.bclim'];
  assert.equal(hudBase.formatName, 'LA4');
  assert.deepEqual([hudBase.width, hudBase.height], [8, 8]);
  assert.equal(hudBase.sourceSha256, 'aaaef78fa5e1a428da66c319202f123c8c52eaf798490423f3f9daf3413f843f');
  assert.equal(hudBase.sha256, '82e0c5fdb42d3c9d37f1d16614983b1d7559cc228f7deb0cf41228d5d0f06013');
  assert.equal(countBar.formatName, 'LA8');
  assert.deepEqual([countBar.width, countBar.height], [6, 6]);
  assert.equal(countBar.sourceSha256, '3eef02a1a564137157cb81816811826037189e30165e9b69f68b91e0f4a33663');
  assert.equal(countBar.sha256, 'bd32c2086543e59ab3adad207b5e91ff5b71da223d38bfea58b458da89ef9970');
  assert.equal(sha(new URL(hudBase.url, firmware)), hudBase.sha256);
  assert.equal(sha(new URL(countBar.url, firmware)), countBar.sha256);
  assert.equal(systemInfo.resourceSources.textures['HudBase_00.bclim'].sha256, hudBase.sourceSha256);
  assert.equal(systemInfo.resourceSources.textures['CountBarBase_00.bclim'].sha256, countBar.sourceSha256);

  const childHeights = [
    ...flatten(netAtn.layouts.NetAntenna.roots),
    ...flatten(netMode.layouts.NetMode.roots),
    ...flatten(battery.layouts.Battery.roots),
    ...flatten(calendar.layouts.Calendar.roots),
  ].filter(pane => pane.kind === 'pic1' || pane.kind === 'txt1').map(pane => pane.size[1]);
  assert.equal(Math.max(...childHeights), 20);
  assert.equal(panes.some(pane => pane.kind === 'pic1' && pane.name !== 'BasePct' && pane.size[1] > 6), false);

  assert.match(painter, /draw\(top,'web-hud','SystemInfo'/);
  assert.match(painter, /ButPos:child\('web-hud-battery','Battery',\{bindings:\[\{name:'Battery_Bat',frame:clock\.batteryFrame\}\]\}\)/);
  assert.equal(painter.includes('HudMenu_00'), false);
  assert.equal(painter.includes("message('lau_title_web')"), false);
});

test('frozen rank-1 HUD residual is exactly rows 25-27 (1200); chrome 0-24 stays 0', async t => {
  if (![FROZEN.native, FROZEN.upper, FROZEN.lower, FROZEN.report, FROZEN.contact].every(existsSync)) {
    return t.skip('private Browser HUD recapture pair is absent');
  }
  assert.equal(sha(FROZEN.native), '4bfffefeee3ee291e478e7c8db39d5d31ce1293478acfcbc138caf2561c6e80a');
  assert.equal(sha(FROZEN.upper), '9d1fe9127651ff99d5c62a321d9e695064b62dd9e5f2a8d9a287612336cc2587');
  assert.equal(sha(FROZEN.lower), 'a2b12cde2e886b2de7ad09b208ad88a9417d205d320f0f7f3c80e22d80352a91');
  assert.equal(sha(FROZEN.report), 'ff61db74f2a870a65759f2075edade52e83a0dbc739e36d07d002ff3ce3075a9');
  assert.equal(sha(FROZEN.contact), '33aaf8d88a438ad17b1b39d54bb3dc46a4307092c2880c2d4e065e734841b797');
  assert.equal(sha(mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');

  const sharp = require('sharp');
  const nativeUpper = await sharp(FROZEN.native).extract({left: 0, top: 0, width: 400, height: 240}).ensureAlpha().raw().toBuffer();
  const browserUpper = await sharp(FROZEN.upper).ensureAlpha().raw().toBuffer();
  const count = (native, browser, x0, y0, x1, y1) => {
    let n = 0;
    let max = 0;
    let at = null;
    let nativeRgb = null;
    let browserRgb = null;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * 400 + x) * 4;
      const e = Math.max(
        Math.abs(native[i] - browser[i]),
        Math.abs(native[i + 1] - browser[i + 1]),
        Math.abs(native[i + 2] - browser[i + 2]),
      );
      if (e > max) {
        max = e;
        at = [x, y];
        nativeRgb = [native[i], native[i + 1], native[i + 2]];
        browserRgb = [browser[i], browser[i + 1], browser[i + 2]];
      }
      if (e > 2) n++;
    }
    return {n, max, at, nativeRgb, browserRgb};
  };

  const whole = count(nativeUpper, browserUpper, 0, 0, 400, 240);
  const chrome = count(nativeUpper, browserUpper, 0, 0, 400, 25);
  const hud = count(nativeUpper, browserUpper, 0, 0, 400, 28);
  const tail = count(nativeUpper, browserUpper, 0, 25, 400, 28);
  const body = count(nativeUpper, browserUpper, 0, 28, 400, 240);
  const bat = count(nativeUpper, browserUpper, 368, 0, 400, 20);
  const bar = count(nativeUpper, browserUpper, 0, 19, 400, 25);
  assert.equal(whole.n, 86000);
  assert.equal(chrome.n, 0);
  assert.equal(hud.n, 1200);
  assert.equal(tail.n, 1200);
  assert.equal(body.n, 84800);
  assert.equal(bat.n, 0);
  assert.equal(bar.n, 0);
  assert.equal(hud.max, 120);
  assert.deepEqual(hud.at, [0, 27]);
  assert.deepEqual(hud.nativeRgb, [119, 119, 119]);
  assert.deepEqual(hud.browserRgb, [238, 238, 239]);
  assert.equal(count(nativeUpper, browserUpper, 0, 25, 400, 26).n, 400);
  assert.equal(count(nativeUpper, browserUpper, 0, 26, 400, 27).n, 400);
  assert.equal(count(nativeUpper, browserUpper, 0, 27, 400, 28).n, 400);

  const report = JSON.parse(readFileSync(FROZEN.report, 'utf8'));
  assert.equal(report.scenarioId, 'browser-start-menu-local');
  assert.equal(report.commit, '22b13f20');
  assert.equal(report.screens.upper.pixelsOverThreshold, 86000);
  assert.equal(report.screens.lower.pixelsOverThreshold, 76728);
  assert.deepEqual(report.screens.upper.regions[0], {x: 0, y: 25, width: 400, height: 215, pixelCount: 86000});
  assert.equal(report.screens.upper.browser.sha256, '9d1fe9127651ff99d5c62a321d9e695064b62dd9e5f2a8d9a287612336cc2587');
  assert.equal(report.screens.upper.native.sha256, '4bfffefeee3ee291e478e7c8db39d5d31ce1293478acfcbc138caf2561c6e80a');
});
