import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const sourceRoot = process.env.NOTIFICATIONS_ENTRY_SOURCE_ROOT ??
  '/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/notifications-entry-source';
const codePath = sourceRoot + '/exefs/code.bin';
const archivePath = sourceRoot + '/romfs/common_LZ.bin';
const firmware = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const json = path => JSON.parse(readFileSync(new URL(path, firmware), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pane = (layout, name) => nativePaneParentPath(layout, name).at(-1);
let decoded;
function source(t) {
  if (!existsSync(codePath) || !existsSync(archivePath)) {
    t.skip('private pinned Notifications entry extraction is absent');
    return null;
  }
  if (decoded) return decoded;
  const result = spawnSync('python3', ['-c', `
import hashlib, json, sys
from pathlib import Path
sys.path[:0] = ['scripts', 'scripts/firmware']
from unpack_home_resources import decompress, unpack_darc
from native import decode_layout, decode_animation, decode_msbt, decode_mstl
root = Path(sys.argv[1]) / 'romfs'
members = unpack_darc(decompress((root / 'common_LZ.bin').read_bytes()))
names = ['CmnFade_U_00', 'CmnFade_D_00']
message = (root / 'message/EU_English/newslist_msbt_LZ.bin').read_bytes()
style = (root / 'message/EU_English/RI_mstl_LZ.bin').read_bytes()
digest = lambda data: hashlib.sha256(data).hexdigest()
print(json.dumps({
  'layouts': {name: decode_layout(members['blyt/' + name + '.bclyt']) for name in names},
  'animations': {name + '_SceneIn': decode_animation(members['anim/' + name + '_SceneIn.bclan']) for name in names},
  'members': {name: digest(data) for name, data in members.items()},
  'messages': decode_msbt(decompress(message)), 'styles': decode_mstl(decompress(style)),
  'messageHashes': [digest(message), digest(decompress(message))],
  'styleHashes': [digest(style), digest(decompress(style))]
}))
`, sourceRoot], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  decoded = JSON.parse(result.stdout);
  return decoded;
}

test('fresh title-owned common layouts/clips retain exact archive and member provenance', t => {
  const data = source(t);
  if (!data) return;
  assert.equal(sha(readFileSync(codePath)), 'b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228');
  assert.equal(sha(readFileSync(archivePath)), '1ac03207aa03eb4f447e7ae5d4fe7f64fba08dca055717b8ff0ce9067db8e4ae');
  const expected = {
    'blyt/CmnFade_U_00.bclyt': '727986552371a72c62a0a24f11e2ef778d90156b210b9d009f9e1c301aa9620b',
    'blyt/CmnFade_D_00.bclyt': 'e8fb04c1e1dbea4523423f4e7b18d3ae50801f6b5b312c02a1510869e1c5b1c6',
    'anim/CmnFade_U_00_SceneIn.bclan': 'd5e5dad524a7d074362ddc5de840dd64be715c021229c0fb8b0d1aa93d54d805',
    'anim/CmnFade_D_00_SceneIn.bclan': 'e47fa2508f3aa924cea2d5901ed04d8c271ba19730915f2265509cf1956d3fe2',
    'timg/BgLgt.bclim': 'c0d63a4ee5205e77b89b18b334ffbd13df83a06912ac258119a46160791f983b',
    'timg/BgLine.bclim': 'f9d858867fbd4c5db9d3fccb83819b9ed41052e96aeac9bcde0b63ed262134cc',
    'timg/LncApltBeltLine_00.bclim': 'e89489c43f81e212a19b5370dc2905f4b1580ffcc011ee0ecb05c010d4c1e434',
    'timg/LncApltBeltMask_00.bclim': '1dd62f26e7387aea82f14c80bfdd89b0316d9a773eb7aac42b8349b8d91b4e55',
    'timg/LncApltBelt_00.bclim': 'd41841f80d82c1f95eb3efb62103f13af506ccb12c5ab30ff153f9702870fd71',
    'timg/LncApltPictHome_00.bclim': 'c50f34febfce1b655d775997c7e8fa252e436626b5b283342e970114df00c406',
    'timg/LncApltPictNews_00.bclim': 'dfded3b8d750da95d921f06468e02d87dccc3ca86c62a700c5edcb4da3fd9a1e',
  };
  for (const [name, hash] of Object.entries(expected)) assert.equal(data.members[name], hash, name);
  for (const name of ['CmnFade_U_00', 'CmnFade_D_00']) {
    assert.deepEqual(data.layouts[name].unsupported, []);
    const clip = data.animations[name + '_SceneIn'];
    assert.equal(clip.frames, 21);
    assert.equal(clip.loop, false);
    assert.equal(clip.childBinding, true);
    assert.deepEqual(clip.sourceFrameRange, [20, 40]);
  }
});

test('original independent SceneIn tracks pose 0 and 20 without a HOME selector binding', t => {
  const data = source(t);
  if (!data) return;
  for (const frame of [0, 20]) {
    const upper = poseNativeLayout(data.layouts.CmnFade_U_00, data.animations,
      [{ name: 'CmnFade_U_00_SceneIn', frame }]);
    const lower = poseNativeLayout(data.layouts.CmnFade_D_00, data.animations,
      [{ name: 'CmnFade_D_00_SceneIn', frame }]);
    const alpha = frame === 0 ? 255 : 0;
    assert.equal(pane(upper, 'P_Bg_U_00').alpha, alpha);
    assert.equal(pane(lower, 'P_Bg_D_00').alpha, alpha);
    assert.equal(pane(lower, 'P_Belt_00').alpha, alpha);
    assert.equal(pane(lower, 'P_Belt_00').translation[0], frame === 0 ? 0 : -80);
    assert.equal(pane(lower, 'P_Home_00').flags & 1, 0);
    assert.equal(pane(lower, 'P_Aplt_00').flags & 1, 1);
    assert.deepEqual(pane(lower, 'P_Belt_00').size, [480, 64]);
    assert.deepEqual(lower.materials[pane(lower, 'P_Belt_00').picture.material].constantColors[0], [55, 205, 165, 255]);
    const icon = pane(lower, 'P_Aplt_00');
    assert.equal(lower.textures[lower.materials[icon.picture.material].textureMaps[0].texture], 'LncApltPictNews_00.bclim');
    assert.deepEqual(icon.picture.uvSets[0], [0, 0, 2, 0, 0, 1, 2, 1]);
  }
  for (const [name, target] of [['CmnFade_U_00', 'P_Bg_U_00'], ['CmnFade_D_00', 'P_Bg_D_00']]) {
    const alpha = data.animations[name + '_SceneIn'].tracks.find(track => track.target === target && track.property === 'alpha');
    assert.deepEqual(alpha.keys, [{ frame: 0, value: 255, slope: -12.75 }, { frame: 20, value: 0, slope: 0 }]);
  }
});

test('startup label resolves to the already delivered native Notifications message and style13', t => {
  const data = source(t);
  if (!data) return;
  const code = readFileSync(codePath), at = address => address - 0x100000;
  assert.equal(code.readUInt32LE(at(0x1879dc)), 0xe28f0030);
  assert.equal(code.subarray(at(0x187a14), at(0x187a14) + 14).toString(), 'new_title_new\0');
  const branch = code.readUInt32LE(at(0x1879f4));
  assert.equal(branch >>> 24, 0xeb);
  const signedOffset = (branch << 8) >> 8;
  assert.equal(0x1879f4 + 8 + signedOffset * 4, 0x17fcc0);
  assert.equal(code.readUInt32LE(at(0x17fce0)), 0xe3a0c001);
  assert.equal(code.readUInt32LE(at(0x14f9f8)), 0xe3a02003);
  assert.equal(code.readUInt32LE(at(0x180c64)), 0xe3a02064);
  assert.equal(code.readUInt32LE(at(0x17c534)), 0xe3a02f7d);
  const bank = data.messages, message = bank.messages[bank.labels.new_title_new];
  assert.equal(bank.labels.new_title_new, 26);
  assert.equal(message.text, 'Notifications');
  assert.equal(message.styleIndex, 13);
  assert.deepEqual(data.messageHashes, [
    'cd9261dd122c66ff8feaddc68f2bd5f8e199ebb90feb7067976fa34fa0966652',
    '72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62',
  ]);
  assert.deepEqual(data.styleHashes, [
    'bd8b581be5f49d28cbf81321595c1451e6634e701563696d1e41aa4fc20bcf03',
    '23833acc620efbf4f5119ce7c0dace5ac68e9055f79eb54cc3489c60b6d65834',
  ]);
  const delivered = json('packs/notifications/messages-and-loose.json');
  const publishedBank = delivered.messages.newslist_msbt_LZ;
  assert.deepEqual(publishedBank.messages[publishedBank.labels.new_title_new], message);
  assert.deepEqual(delivered.styles[publishedBank.styleTable].styles[13], data.styles.styles[13]);
  const manifest = json('manifest.json');
  assert.equal(manifest.titles['000400300000a002'].version, 4097);
  assert.equal(manifest.sources['000400300000a002'].contents[0].sha256,
    '80e73dc01348a7e68975073ba4317856e9b79821b27ce4d65692612c500dacc8');
});
