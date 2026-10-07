import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { drawHomeSuspendedWindow } from '../src/os/home-suspended-window.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/packs/home/', import.meta.url);
const packs = Object.fromEntries([['launcher', 'launcher.json'], ['messages', 'messages-and-loose.json']]
  .map(([key, path]) => [key, JSON.parse(readFileSync(new URL(path, root)))]));
const metadata = { description: 'Health and Safety Information', icon: { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) } };
const pane = (pose, name) => nativePaneParentPath(pose, name).at(-1);
const ownPose = value => { const { children, ...own } = value; return own; };
function draw(frame, mode = 'expanded', closeOpacity, source = packs) {
  let options;
  drawHomeSuspendedWindow({ packs: source, measureSingleLineText: () => 222,
    draw(_ctx, _pack, _layout, value) { options = value; return true; } }, {}, metadata, mode, 0, closeOpacity, frame);
  return { options, pose: poseNativeLayout(source.launcher.layouts.LncBase_U_00, source.launcher.animations, options.bindings, options.overrides) };
}

test('window and caption bindings retain their unchanged original HOME member provenance', () => {
  assert.equal(packs.launcher.titleId, '0004003000009802');
  assert.equal(packs.launcher.sourceSha256, '826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834');
  assert.deepEqual(packs.launcher.resourceSources.animations.LncBase_U_00_Appear, {
    path: 'launcher_LZ.bin/anim/LncBase_U_00_Appear.bclan', sha256: '2984f92736035fec7a9475b6840fc2ba27763a8dd5081cd883ab32651d6fb427', titleId: '0004003000009802',
  });
  assert.equal(packs.launcher.resourceSources.layouts.LncBase_U_00.sha256, 'b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50');
  assert.equal(packs.messages.resourceSources.messages.menu_msbt_LZ.sha256, '1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350');
});

test('source window Appear fades only G_Wndw while the other upper producers retain their settled poses', () => {
  const before = JSON.stringify(packs), settled = draw(undefined);
  for (let frame = 0; frame <= 10; frame++) {
    const { options, pose } = draw(frame);
    const binding = options.bindings.find(binding => binding.groups?.includes('G_Wndw_00'));
    assert.deepEqual(binding, { name: 'LncBase_U_00_Appear', frame, groups: ['G_Wndw_00'] });
    assert.equal(pane(pose, 'N_Wndw_00').alpha, [0, 7, 27, 55, 90, 128, 165, 200, 228, 248, 255][frame]);
    for (const name of ['N_Root_00', 'N_Hud_00', 'N_Btm_00', 'N_WndwScale_00', 'W_Wndw_00', 'N_IconWrp_00']) {
      assert.deepEqual(ownPose(pane(pose, name)), ownPose(pane(settled.pose, name)), name);
    }
    assert.equal(pane(pose, 'T_TextTop_00').text.value, 'Suspended software');
    assert.equal(pane(pose, 'T_TextBtmR_00').text.value, 'HOME: Resume suspended software');
  }
  assert.equal(JSON.stringify(packs), before);
  for (const mode of ['expanded', 'compact']) {
    const ordinary = draw(undefined, mode), closing = draw(undefined, mode, .5);
    assert.equal(ordinary.options.bindings.filter(binding => binding.name.endsWith('_Appear')).length, 1);
    assert.equal(pane(ordinary.pose, 'N_Wndw_00').alpha, 255);
    assert.equal(pane(closing.pose, 'N_Wndw_00').alpha, 128);
    assert.equal(closing.options.bindings.find(binding => binding.name.endsWith('_WhiteBlack')).frame, 0);
  }
});

test('invalid selected window appearance frames and unsupported source groups or curves fail explicitly', () => {
  for (const frame of [-1, .5, 11, NaN, Infinity]) assert.throws(() => draw(frame), /appearance frame/);
  for (const mutate of [
    source => source.launcher.animations.LncBase_U_00_Appear.frames = 10,
    source => source.launcher.animations.LncBase_U_00_Appear.loop = true,
    source => source.launcher.animations.LncBase_U_00_Appear.childBinding = false,
    source => source.launcher.animations.LncBase_U_00_Appear.groups = ['G_Hud_00', 'G_Btm_00'],
    source => source.launcher.layouts.LncBase_U_00.groups[0].children.find(group => group.name === 'G_Wndw_00').panes = [],
    source => source.launcher.animations.LncBase_U_00_Appear.tracks.find(track => track.target === 'N_Wndw_00' && track.property === 'alpha').keys[1].value = 254,
    ...['scale.x', 'scale.y'].flatMap(property => [
      source => source.launcher.animations.LncBase_U_00_Appear.tracks.find(track => track.target === 'N_Wndw_00' && track.property === property).keys[0].value = 2,
      source => source.launcher.animations.LncBase_U_00_Appear.tracks.find(track => track.target === 'N_Wndw_00' && track.property === property).keys[0].frame = 1,
      source => source.launcher.animations.LncBase_U_00_Appear.tracks.find(track => track.target === 'N_Wndw_00' && track.property === property).keys[0].slope = 1,
      source => source.launcher.animations.LncBase_U_00_Appear.tracks.find(track => track.target === 'N_Wndw_00' && track.property === property).keys.push({ frame: 10, value: 1, slope: 0 }),
      source => source.launcher.animations.LncBase_U_00_Appear.tracks.find(track => track.target === 'N_Wndw_00' && track.property === property).interpolation = 'step',
      source => source.launcher.animations.LncBase_U_00_Appear.tracks.push(structuredClone(source.launcher.animations.LncBase_U_00_Appear.tracks.find(track => track.target === 'N_Wndw_00' && track.property === property))),
    ]),
  ]) {
    const source = structuredClone(packs); mutate(source);
    assert.throws(() => draw(0, 'expanded', undefined, source), /appearance source unavailable/);
  }
});

const codePath = process.env.THREE_DS_HOME_PAUSE_CODE
  ?? '/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/home-pause-source/exefs/code.bin';
test('pinned executable entry writer resets and starts the original G_Wndw Appear controller',
  { skip: !existsSync(codePath) && 'Private decrypted HOME code is unavailable; set THREE_DS_HOME_PAUSE_CODE' }, () => {
    const code = readFileSync(codePath), base = 0x100000;
    assert.equal(createHash('sha256').update(code).digest('hex'), '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9');
    const word = address => code.readUInt32LE(address - base);
    const string = address => code.subarray(address - base, code.indexOf(0, address - base)).toString('ascii');
    const branch = address => {
      const instruction = word(address);
      assert.equal((instruction >>> 24) & 0xf, 0xb, 'ARM BL opcode');
      return address + 8 + ((instruction << 8) >> 6);
    };
    assert.equal(word(0x2a5cfc), 0x13a01001, 'non-null upper owner receives mode1');
    assert.equal(branch(0x2a5d00), 0x1ed1c4);
    assert.equal(branch(0x2a5d30), 0x1ed3a4);
    assert.equal(string(word(0x32f514)), 'LncBase_U_00');
    assert.equal(string(word(0x32f528)), 'G_Wndw_00');
    assert.equal(string(word(0x32f548)), 'Appear');
    assert.equal(word(0x286a84), 0xe598201c, 'constructor binds G_Wndw_00');
    assert.equal(word(0x286a90), 0xe5840290, 'constructor stores the controller at upper+0x290');
    assert.equal(word(0x1ed300), 0xe5940290);
    assert.equal(word(0x1ed30c), 0xe3a01000, 'forward mode, not reverse');
    assert.equal(word(0x1ed318), 0xe3a01000, 'reset to source start');
    assert.equal(branch(0x1ed31c), 0x229330);
    assert.equal(word(0x1ed4e0), 0xe3a01001);
    assert.equal(branch(0x1ed4e8), 0x1eda38);
    assert.equal(code.readInt8(0x309782 - base), 1, 'request1 selects visible Appear');
    assert.equal(word(0x1eda9c), 0xe5940290);
    assert.equal(word(0x1edaa8), 0xe3a01000);
    assert.equal(word(0x1edab8), 0xe5911010, 'original start virtual action');
  });
