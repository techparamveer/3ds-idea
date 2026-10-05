import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const sharp = require('sharp');
const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter = readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const pack = JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-Parakeet-arc-LZ.json', firmware), 'utf8'));
const codePath = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/extracted/sound/contents/0000-0000000b/exefs/code.bin';
const base = 0x100000;
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const word = (code, va) => code.readUInt32LE(va - base);
const float = (code, va) => code.readFloatLE(va - base);

test('entry HUD birds stay on ParakeetA_U_Wait frame 0 at the settled centres', () => {
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  const clip = pack.animations.ParakeetA_U_Wait;
  assert.equal(pack.resourceSources.animations.ParakeetA_U_Wait.sha256,
    '4bfb3266826c859eb318f31fb0f1aeed1cb4bdd71920e4db8f08c4dafb66c07f');
  assert.equal(clip.loop, true);
  assert.equal(clip.frames, 60);
  assert.deepEqual(clip.textures, ['CharaA_Wait_00.bclim', 'CharaA_Wait_A_00.bclim']);
  const pattern = clip.tracks.find(track => track.property === 'texture.pattern');
  assert.deepEqual(pattern.keys.map(key => [key.frame, key.value]), [[0, 0], [60, 1]]);
  assert.match(painter, /for\(const x of \[35,94\]\)entry\(top,'sound-bird','ParakeetA_U',\{bindings:\[\{name:'ParakeetA_U_Wait',frame:0\}\],center:\[x,192\]\}\);/);
  assert.equal(painter.includes('ParakeetA_U_LipSync'), false);
  assert.equal(painter.includes('ParakeetA_U_Random'), false);
});

test('code.bin adds one inclusive ±10 offset when an extended bird enters', async t => {
  if (!existsSync(codePath)) return t.skip('private Sound code.bin is absent');
  const code = readFileSync(codePath);
  assert.equal(sha(codePath), '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9');
  assert.equal(float(code, 0x231e3c), 50);
  assert.equal(float(code, 0x231e40), -157);
  assert.equal(float(code, 0x231e44), -72);
  assert.equal(float(code, 0x2485d0), -24);
  assert.equal(float(code, 0x2485d4), -72);
  assert.equal(float(code, 0x2485e4), 24);
  assert.equal(word(code, 0x231b4c), 0xee000a88);
  assert.equal(word(code, 0x231b6c), 0xe580112c);
  assert.equal(word(code, 0x231b70), 0xe5802130);
  assert.equal(word(code, 0x231b94), 0xe3a0100a);
  assert.equal(word(code, 0x231ba0), 0xe5801124);
  assert.equal(word(code, 0x1fca84), 0xe5942124);
  assert.equal(word(code, 0x1fca8c), 0xe2621000);
  assert.equal(word(code, 0x1fca90), 0xeb000132);
  assert.equal(word(code, 0x1fcae8), 0xed940a4b);
  assert.equal(word(code, 0x1fcaf0), 0xee300a08);
  assert.equal(word(code, 0x1fcaf4), 0xed840a28);
  assert.equal(word(code, 0x1fcaec), 0xe3a0100a);
  assert.equal(word(code, 0x1fcb18), 0xea00009b);
  assert.equal(word(code, 0x1fcf60), 0xe1510002);
  assert.equal(word(code, 0x1fcf74), 0xe282c001);
  assert.equal(word(code, 0x1fcf7c), 0xe0223582);
  assert.equal(word(code, 0x1fcfa8), 0xe0802c92);
  assert.equal(word(code, 0x1fcfac), 0xe0800001);
  assert.equal(word(code, 0x1fc934), 0xed940a3f);
  assert.equal(word(code, 0x1fc958), 0xe3a02006);
  assert.equal(word(code, 0x1fc95c), 0xe3a01001);
  assert.equal(word(code, 0x1ff9b4), 0xee1d0f70);
});

test('frozen HudTime uppers keep birds 1558 and clock 0', async t => {
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
  assert.equal(count(firstNative, emptyNative, [15, 174, 115, 216]), 0);
  assert.equal(count(firstNative, firstBrowser, [15, 174, 115, 216]), 1558);
  assert.equal(count(emptyNative, emptyBrowser, [15, 174, 115, 216]), 1558);
  assert.equal(count(firstNative, firstBrowser, [95, 216, 194, 240]), 0);
  assert.equal(count(emptyNative, emptyBrowser, [95, 216, 194, 240]), 0);
});
