import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const sharp = require('sharp');
const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter = readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const pack = JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-C-Hud.json', firmware), 'utf8'));
const codePath = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/extracted/sound/contents/0000-0000000b/exefs/code.bin';
const base = 0x100000;
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const word = (code, va) => code.readUInt32LE(va - base);

const sourceTextures = {
  'HudSnd_B_00.bclim': '88a711555f7eaa32b5ccb4d77b112d7583be0f63974feef244de4f10ea120516',
  'HudSnd_B_01.bclim': '0911e0b3ce56ff8419528fe43dd1150af4957c99a2fc8085a52bc6aa8024b1b1',
  'HudSnd_B_02.bclim': '66b666335b8cee6df8aad520166689d9a75deb10bacd49c2855440343d077371',
  'HudSnd_B_03.bclim': '7bbba00d774f4eefbb7473cc93f73ff38c2677056e4c8fb3ee34fc8ebac935af',
  'HudSnd_B_04.bclim': '8e8ba220af4772395c7830f19414342197008abb4ecb767ddaaf6929b1139f54',
};

test('C_HudSndB_Pattern is five dump textures and the painter stays on frame 0', () => {
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '3ed5ec1dad8f193b9561fb66c1f6057406af17d96130f124378b42c09f51bf11');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-C-Hud.json', firmware)),
    'bb4bfdd539b1ae9cb11b34718c33eda010192d9af0cdce72c2e9e4d9902500d3');
  const clip = pack.animations.C_HudSndB_Pattern;
  const layout = pack.layouts.C_HudSndB;
  assert.equal(pack.resourceSources.layouts.C_HudSndB.sha256,
    '37180cd45d2f60fc7b1580a2680c83ccd0d6f4a8fe072205fb3524994cf2b25c');
  assert.equal(pack.resourceSources.animations.C_HudSndB_Pattern.sha256,
    '9f7057bf5d384ae5598949a625978f69bb84d9415158065ebb2dfa6cdc0856dd');
  assert.deepEqual(clip.textures, Object.keys(sourceTextures));
  assert.equal(clip.frames, 5);
  assert.deepEqual(clip.groups, ['Pattern']);
  assert.equal(clip.tracks.length, 1);
  const track = clip.tracks[0];
  assert.equal(track.tag, 'CLTP');
  assert.equal(track.property, 'texture.pattern');
  assert.equal(track.target, '-H-SndB');
  assert.deepEqual(track.keys.map(key => [key.frame, key.value]), [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
  assert.deepEqual(layout.textures, ['HudSnd_B_00.bclim']);
  assert.equal(layout.materials[0].name, '-H-SndB');
  assert.equal(layout.materials[0].textureMaps[0].texture, 0);
  const pane = layout.roots[0].children[0];
  assert.equal(pane.name, '-H-SndB');
  assert.equal(pane.metadata.find(item => item.name === 'TYPE').value, 'vol');
  for (const [name, digest] of Object.entries(sourceTextures)) {
    assert.equal(pack.resourceSources.textures[name].sha256, digest, name);
    assert.equal(pack.textures[name].width, 30);
    assert.equal(pack.textures[name].height, 20);
  }
  assert.match(painter, /\{name:'C_HudSndB_Pattern',frame:0\}/);
  assert.equal(painter.includes('soundHudVolume'), false);
  assert.match(painter, /soundHudBatteryPatternFrame/);
  assert.match(painter, /soundHudTimeOverride/);
});

test('code.bin fills the volume cache from hid:USER GetSoundVolume and stores no constant', async t => {
  if (!existsSync(codePath)) return t.skip('private Sound code.bin is absent');
  const code = readFileSync(codePath);
  assert.equal(sha(codePath), '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9');
  assert.equal(code.subarray(0x327446 - base, 0x327446 - base + 8).toString(), 'hid:USER');
  assert.equal(word(code, 0x303d5c), 0x327446);
  assert.equal(word(code, 0x2b8810), 0xe59f0008);
  assert.equal(word(code, 0x2b8814), 0xe5901008);
  assert.equal(word(code, 0x2b881c), 0xea001414);
  assert.equal(word(code, 0x2bda04), 0x373af8);
  assert.equal(word(code, 0x2c5014), 0x373af8);
  assert.equal(word(code, 0x2c5058), 0x373af8);
  assert.equal(word(code, 0x2c4fc0), 0xe3a0080a);
  assert.equal(word(code, 0x2c502c), 0xe3a00817);
  assert.equal(word(code, 0x2c5030), 0xe5840000);
  assert.equal(word(code, 0x2c503c), 0xef000032);
  assert.equal(word(code, 0x2c5044), 0x4a000002);
  assert.equal(word(code, 0x2c5048), 0xe5d40008);
  assert.equal(word(code, 0x2c504c), 0xe5c50000);
  assert.equal(word(code, 0x31ed3c + 17 * 4), 0x17aeec);
  assert.equal(word(code, 0x17aef0), 0xe5d11003);
  assert.equal(word(code, 0x17aef4), 0xe3510003);
  assert.equal(word(code, 0x17aef8), 0x93a01004);
  assert.equal(word(code, 0x17af00), 0xe3510011);
  assert.equal(word(code, 0x17af04), 0x93a01003);
  assert.equal(word(code, 0x17af0c), 0xe3510025);
  assert.equal(word(code, 0x17af10), 0x93a01002);
  assert.equal(word(code, 0x17af18), 0xe3510039);
  assert.equal(word(code, 0x17af1c), 0x83a01000);
  assert.equal(word(code, 0x17af24), 0x93a01001);
  assert.equal(code[0x3771d4 - base], 0);
});

test('frozen HudTime uppers keep volume 130 and clock 0', async t => {
  const root = '/Users/paramveer/.codex/3ds-artifact-overflow';
  const recap = `${root}/home-fidelity-20261001/sound-clock-recapture-20261004`;
  const files = {
    nativeFirst: `${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty: `${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst: `${recap}/browser-first-run/upper.png`,
    browserEmpty: `${recap}/browser-empty-entry/upper.png`,
  };
  if (!Object.values(files).every(existsSync)) return t.skip('private HudTime-phase uppers are absent');
  assert.equal(sha(files.nativeFirst), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.nativeEmpty), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.browserFirst), '16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab');
  assert.equal(sha(files.browserEmpty), '8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0');
  const upper = async path => {
    const raw = await sharp(path).extract({left: 0, top: 0, width: 400, height: 240}).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    assert.equal(raw.info.width, 400);
    assert.equal(raw.info.height, 240);
    return raw.data;
  };
  const count = (native, browser, [x0, y0, x1, y1]) => {
    let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * 400 + x) * 4;
      if (Math.max(Math.abs(native[i] - browser[i]), Math.abs(native[i + 1] - browser[i + 1]), Math.abs(native[i + 2] - browser[i + 2])) > 2) n++;
    }
    return n;
  };
  const firstNative = await upper(files.nativeFirst);
  const emptyNative = await upper(files.nativeEmpty);
  const firstBrowser = await upper(files.browserFirst);
  const emptyBrowser = await upper(files.browserEmpty);
  assert.equal(count(firstNative, firstBrowser, [0, 216, 30, 240]), 130);
  assert.equal(count(emptyNative, emptyBrowser, [0, 216, 30, 240]), 130);
  assert.equal(count(firstNative, firstBrowser, [95, 216, 194, 240]), 0);
  assert.equal(count(emptyNative, emptyBrowser, [95, 216, 194, 240]), 0);
});
