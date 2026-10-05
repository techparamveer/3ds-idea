import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createStockModule, initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';

const CODE = '/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';
const BASE = 0x100000;
const word = (code, va) => code.readUInt32LE(va - BASE);

test('dated folder open still selects the first photo', () => {
  const dated = {folders: [{id: 'hni', title: 'View Photos/Videos', photos: [1, 2].map(number => ({id: `HNI_000${number}`, title: `HNI_000${number}`, src: `/fixture/${number}.jpg`, capturedAt: '2026-09-25T22:19:00'}))}], tracks: []};
  const ctx = {now: 0, shared: initialSharedData()};
  const module = createStockModule(getTitle('camera'), dated);
  let state = module.create({}, null, ctx);
  for (let page = 0; page < 5; page++) state = module.reduce(state, {type: 'action', id: 'guide-next'}, ctx).state;
  const gallery = module.reduce(state, {type: 'action', id: 'folder:hni'}, ctx).state;
  assert.deepEqual(module.view(gallery, ctx).rows.map(item => item.id), ['camera-date-group', 'photo:HNI_0001', 'photo:HNI_0002']);
  assert.equal(gallery.selection, 1);
  const painter = readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
  assert.match(painter, /if\(r\.row===view\.selection\)draw\('P_BrwsCursor_D'/);
});

test('code.bin does not unique-own the settled date-folder index', t => {
  if (!existsSync(CODE)) return t.skip('private Camera code.bin is absent');
  const code = readFileSync(CODE);
  assert.equal(createHash('sha256').update(code).digest('hex'), '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  // 0x1fbf30 defaults to count-1, then a saved type can replace it. Type 0 falls through to that default.
  assert.equal(word(code, 0x1fbf50), 0xc2455001);
  assert.equal(word(code, 0x1fbf70), 0x0a00001d);
  assert.equal(word(code, 0x1fc038), 0xeb0003b6);
  assert.equal(word(code, 0x1fcd64), 0xe5cda004);
  assert.equal(word(code, 0x1fcd9c), 0xe5cd1004);
  assert.equal(word(code, 0x1fce78), 0xe5cdb004);
  // State 9 calls 0x1fbf30 with r1 = 0, which still stores.
  assert.equal(word(code, 0x2d4d30), 0xe3500009);
  assert.equal(word(code, 0x2d38d4), 0xe3a01000);
  assert.equal(word(code, 0x2d38dc), 0xebfca193);
  // States 5 and 7 keep a selection that is already below the count.
  assert.equal(word(code, 0x2d07b0), 0x00002232);
  assert.equal(word(code, 0x2d0ff4), 0x00002232);
  assert.equal(word(code, 0x2cf8cc), 0x8a000008);
  assert.equal(word(code, 0x2cf8dc), 0xe2411001);
  assert.equal(word(code, 0x2d09ac), 0x8a000008);
  assert.equal(word(code, 0x2d09bc), 0xe2421001);
  // List rebuild stores either the computed word or that word minus one.
  assert.equal(word(code, 0x2dddac), 0x12401001);
  assert.equal(word(code, 0x2dddb8), 0x059d100c);
  assert.equal(word(code, 0x2dddbc), 0xebfc7bcc);
});
