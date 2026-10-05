import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import ts from 'typescript';

const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const browse = JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json', firmware), 'utf8'));
const painter = readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fileSha = path => sha(readFileSync(path));
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const layoutModule = await import(moduleUrl(ts.transpileModule(readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
}).outputText));
const ARC = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/romfs/lyt/P_Brws_D.arc.LZ';
const NATIVE = '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png';
const BROWSER = '/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png';
const find = (panes, name) => {
  for (const pane of panes ?? []) {
    if (pane.name === name) return pane;
    const child = find(pane.children, name);
    if (child) return child;
  }
};
const blend = (source, under, alpha) => source.map((channel, index) => Math.round(channel * alpha / 255 + under[index] * (255 - alpha) / 255));

test('decoded ZoomUp is opaque white LA4, with no plus-only alpha or backing pane', () => {
  const layout = browse.layouts.P_BrwsBase_D;
  const parent = find(layout.roots, '-B-ZoomUp');
  const up = find(parent.children, 'ZoomUp');
  const backParent = find(layout.roots, '-B-ZoomBack');
  const back = find(backParent.children, 'ZoomBack');
  const bounds = find(parent.children, 'BB-ZoomUp');
  assert.equal(parent.children.length, 2);
  assert.equal(bounds.kind, 'bnd1');
  assert.equal(bounds.picture, undefined);
  assert.equal(up.kind, 'pic1');
  assert.equal(up.flags, 1);
  assert.equal(up.alpha, 255);
  assert.equal(back.flags, 3);
  assert.equal(back.alpha, 255);
  assert.deepEqual(up.picture.colors, [[255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255]]);
  const material = layout.materials[up.picture.material];
  const minus = layout.materials[back.picture.material];
  assert.equal(material.name, 'ZoomUp');
  assert.deepEqual(material.tevStages, []);
  assert.equal(material.colorBlend, undefined);
  assert.deepEqual(material.bufferColor, [70, 55, 55, 0]);
  assert.deepEqual(material.constantColors[0], [255, 255, 255, 255]);
  assert.deepEqual(material.constantColors[5], [255, 255, 255, 255]);
  assert.equal(layout.textures[material.textureMaps[0].texture], 'P_BtnO_BrwsZoom0.bclim');
  assert.equal(layout.textures[minus.textureMaps[0].texture], 'P_BtnO_BrwsZoom1.bclim');
  assert.deepEqual(minus.bufferColor, material.bufferColor);
  assert.deepEqual(minus.constantColors, material.constantColors);
  assert.deepEqual(minus.tevStages, []);
  const texture = browse.textures['P_BtnO_BrwsZoom0.bclim'];
  assert.equal(texture.formatName, 'LA4');
  assert.equal(texture.picaFormat, 9);
  assert.equal(texture.sourceSha256, '5dd880375fd9519421bf2668c9d3b7af9d14f92b250af447cba35d8152e32342');
  assert.equal(fileSha(new URL(texture.url, firmware)), texture.sha256);
  const png = PNG.sync.read(readFileSync(new URL(texture.url, firmware)));
  let white = 0, alpha128 = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] === 128) alpha128++;
    if (png.data[i] === 255 && png.data[i + 1] === 255 && png.data[i + 2] === 255 && png.data[i + 3] === 255) white++;
  }
  assert.equal(white, 156);
  assert.equal(alpha128, 0);
  const user = layout.materials.find(item => item.name === 'UserBG');
  assert.deepEqual(user.constantColors[5], [0, 128, 255, 255]);
  assert.equal(painter.includes('ZoomUp'), false);
  for (const name of Object.keys(browse.animations).filter(item => item.startsWith('P_BrwsBase_D_'))) {
    const keys = target => browse.animations[name].tracks
      .filter(track => track.target === target && track.property === 'alpha')
      .map(track => track.keys.map(key => [key.frame, key.value]));
    assert.deepEqual(keys('ZoomUp'), keys('ZoomBack'), name);
  }
  const posed = layoutModule.poseNativeLayout(layout, browse.animations, [{name: 'P_BrwsBase_D_Brws', frame: 0}]);
  const posedUp = find(posed.roots, 'ZoomUp');
  assert.equal(posedUp.alpha, 255);
  const image = {width: png.width, height: png.height, data: png.data, picaFormat: texture.picaFormat};
  const raster = layoutModule.rasterNativePicture(posed, posedUp.picture, 32, 32, new Map([['P_BtnO_BrwsZoom0.bclim', image]]), 1);
  let rasterWhite = 0;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const at = (y * 32 + x) * 4;
    if (png.data[at] !== 255 || png.data[at + 3] !== 255) continue;
    assert.deepEqual([raster.data[at], raster.data[at + 1], raster.data[at + 2], raster.data[at + 3]], [255, 255, 255, 255]);
    rasterWhite++;
  }
  assert.equal(rasterWhite, 156);
  assert.deepEqual(blend([255, 255, 255], [255, 161, 0], 128), [255, 208, 128]);
});

test('dump BCLIM decodes the same 156 opaque whites and stores no peach word', t => {
  if (!existsSync(ARC)) return t.skip('private Camera browse archive is absent');
  assert.equal(fileSha(ARC), 'ed22962fa35a3019457302e059ddc19709fa07e36ae1d67b506a58e9d317181a');
  const probed = spawnSync('python3', ['-c', `
import hashlib, json, sys
from collections import Counter
from pathlib import Path
sys.path.insert(0, sys.argv[1]); sys.path.insert(0, sys.argv[1] + '/firmware')
from unpack_home_resources import decompress, unpack_darc
from texture import decode_bclim
files = unpack_darc(decompress(Path(sys.argv[2]).read_bytes()))
raw = files['timg/P_BtnO_BrwsZoom0.bclim']
meta, rgba = decode_bclim(raw)
counts = Counter(tuple(rgba[i:i+4]) for i in range(0, len(rgba), 4))
print(json.dumps({
  'bclimSha': hashlib.sha256(raw).hexdigest(),
  'meta': meta,
  'white': counts[(255, 255, 255, 255)],
  'alpha128': sum(n for color, n in counts.items() if color[3] == 128),
  'rawPeach': bytes([255, 208, 128]) in raw,
}))
`, new URL('../scripts', import.meta.url).pathname, ARC], {encoding: 'utf8'});
  assert.equal(probed.status, 0, probed.stderr);
  const member = JSON.parse(probed.stdout);
  assert.equal(member.bclimSha, '5dd880375fd9519421bf2668c9d3b7af9d14f92b250af447cba35d8152e32342');
  assert.deepEqual(member.meta, {width: 32, height: 32, format: 2, picaFormat: 9, formatName: 'LA4'});
  assert.equal(member.white, 156);
  assert.equal(member.alpha128, 0);
  assert.equal(member.rawPeach, false);
});

test('frozen plus whites are native peach and browser white; strip stays 1992', t => {
  if (!existsSync(NATIVE) || !existsSync(BROWSER)) return t.skip('frozen camera browse pair is absent');
  assert.equal(fileSha(NATIVE), 'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(fileSha(BROWSER), '0d0ffe41fed0cebe34d78ae196cf1694ffeeb3fde59379a027b8969b35845dea');
  const combined = PNG.sync.read(readFileSync(NATIVE));
  const browser = PNG.sync.read(readFileSync(BROWSER));
  const png = PNG.sync.read(readFileSync(new URL(browse.textures['P_BtnO_BrwsZoom0.bclim'].url, firmware)));
  const nativeAt = (x, y) => {
    const index = ((y + 240) * combined.width + (x + 40)) * 4;
    return [combined.data[index], combined.data[index + 1], combined.data[index + 2]];
  };
  const browserAt = (x, y) => {
    const index = (y * browser.width + x) * 4;
    return [browser.data[index], browser.data[index + 1], browser.data[index + 2]];
  };
  let white = 0;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const index = (y * 32 + x) * 4;
    if (png.data[index] !== 255 || png.data[index + 3] !== 255) continue;
    white++;
    assert.deepEqual(nativeAt(2 + x, 176 + y), [255, 208, 128]);
    assert.deepEqual(browserAt(2 + x, 176 + y), [255, 255, 255]);
  }
  assert.equal(white, 156);
  let strip = 0;
  for (let y = 170; y < 210; y++) for (let x = 0; x < 320; x++) {
    const native = nativeAt(x, y), candidate = browserAt(x, y);
    if (Math.max(Math.abs(native[0] - candidate[0]), Math.abs(native[1] - candidate[1]), Math.abs(native[2] - candidate[2])) > 2) strip++;
  }
  assert.equal(strip, 1992);
});
