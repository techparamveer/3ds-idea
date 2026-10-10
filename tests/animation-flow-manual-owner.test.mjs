import assert from 'node:assert/strict';
import test from 'node:test';
import { manualCaptureHeading, selectAnimationTitle, validateManualCaptureDestination, validateManualCaptureOrigin } from '../scripts/verify-animation-flow.mjs';

const origin = (title, focus = {}) => ({ menu: 'home', selected: title === 'settings' ? '9' : '10',
  homeCursor: JSON.stringify({ focus: { toolbarActive: title === 'browser', currentFocus: title === 'browser' ? 4 : 0, ...focus } }) });

test('Manual collection rejects Health and unsupported application manuals', () => {
  for (const title of ['health', 'portfolio', 'sound', 'unknown', '__proto__']) assert.throws(() => manualCaptureHeading(title));
});

test('Browser selection uses the real toolbar touch and its settling wait', async () => {
  const inputs = [];
  await selectAnimationTitle('browser', { key: async value => inputs.push(['key', value]),
    touch: async (x, y) => inputs.push(['touch', x, y]), wait: async ms => inputs.push(['wait', ms]) });
  assert.deepEqual(inputs, [['touch', 190, 16], ['wait', 300]]);
});

test('grid title routes preserve their existing directional inputs', async () => {
  for (const [title, slot] of Object.entries({ portfolio: 0, health: 8, settings: 9, camera: 10, sound: 7 })) {
    const inputs = [];
    await selectAnimationTitle(title, { key: async value => inputs.push(['key', value]),
      touch: async () => assert.fail('Grid selection must not use toolbar'), wait: async ms => inputs.push(['wait', ms]) });
    const expected = Array.from({ length: Math.floor(slot / 2) }, () => [['key', 'ArrowRight'], ['wait', 180]]).flat();
    if (slot % 2) expected.push(['key', 'ArrowDown']);
    expected.push(['wait', 300]);
    assert.deepEqual(inputs, expected);
  }
});

test('Browser Manual checks caller focus independently on every entry', () => {
  validateManualCaptureOrigin(origin('browser'), 'browser');
  assert.throws(() => validateManualCaptureOrigin(origin('browser', { toolbarActive: false }), 'browser'));
  assert.throws(() => validateManualCaptureOrigin(origin('browser', { currentFocus: 3 }), 'browser'));
  assert.throws(() => validateManualCaptureOrigin({ ...origin('browser'), menu: 'app' }, 'browser'));
  assert.throws(() => validateManualCaptureOrigin({ menu: 'home' }, 'browser'));
});

test('grid Manual checks selected caller and rejects toolbar focus', () => {
  for (const title of ['settings', 'camera']) {
    validateManualCaptureOrigin(origin(title), title);
    assert.throws(() => validateManualCaptureOrigin({ ...origin(title), selected: '8' }, title));
    assert.throws(() => validateManualCaptureOrigin(origin(title, { toolbarActive: true }), title));
  }
});

test('ready app or the wrong Manual heading cannot count as requested Manual', () => {
  for (const title of ['settings', 'camera', 'browser']) {
    validateManualCaptureDestination({ announcement: `${manualCaptureHeading(title)}. Contents` }, title);
    assert.throws(() => validateManualCaptureDestination({ announcement: 'Health and Safety Information' }, title));
    assert.throws(() => validateManualCaptureDestination({ announcement: 'Loading software screen. B or HOME to return to HOME Menu.' }, title));
    assert.throws(() => validateManualCaptureDestination({}, title));
  }
});
