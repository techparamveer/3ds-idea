import test from 'node:test';
import assert from 'node:assert/strict';
import { auditAzaharInputProfile, parseQtIni } from '../scripts/reference/azahar-input-profile-audit.mjs';

const root = '/private/tmp/native-audit/instance';

function fixture(overrides = '') {
  return `[Audio]\nvolume=0\n\n[Controls]\nprofile=0\nprofiles\\1\\name=Default\nprofiles\\1\\button_a="code:65,engine:keyboard"\nprofiles\\1\\button_b="code:83,engine:keyboard"\nprofiles\\1\\button_up="code:84,engine:keyboard"\nprofiles\\1\\button_down="code:71,engine:keyboard"\nprofiles\\1\\button_left="code:70,engine:keyboard"\nprofiles\\1\\button_right="code:72,engine:keyboard"\nprofiles\\1\\button_home="code:66,engine:keyboard"\nprofiles\\1\\button_start="code:77,engine:keyboard"\nprofiles\\1\\button_select="code:78,engine:keyboard"\nprofiles\\1\\touch_device=engine:emu_window\nprofiles\\1\\use_touch_from_button=true\nprofiles\\1\\touch_from_button_map=0\ntouch_from_button_maps\\1\\entries\\1\\bind="code:69,engine:keyboard,x:160,y:230"\ntouch_from_button_maps\\1\\entries\\2\\bind="code:82,engine:keyboard,x:160,y:205"\ntouch_from_button_maps\\1\\entries\\size=2\ntouch_from_button_maps\\1\\name=default\n\n[Data%20Storage]\nnand_directory=${root}/user/nand/\nsdmc_directory=${root}/user/sdmc/\n\n[UI]\nPaths\\screenshotPath=${root}/screenshots\npauseWhenInBackground=false\nmuteWhenInBackground=false\nsingleWindowMode=true\n${overrides}`;
}

const configPath = `${root}/user/config/qt-config.ini`;

test('parses Qt groups, backslash keys and quoted parameter packages', () => {
  const values = parseQtIni(fixture());
  assert.equal(values.get('Controls/profiles\\1\\button_left'), 'code:70,engine:keyboard');
  assert.equal(values.get('UI/Paths\\screenshotPath'), `${root}/screenshots`);
});

test('reports mouse and button touch as ordered independent sources', () => {
  const report = auditAzaharInputProfile(fixture(), { configPath });
  assert.equal(report.touch.mouseTouchEnabled, true);
  assert.equal(report.touch.buttonTouchEnabled, true);
  assert.equal(report.touch.mouseDisabledByButtonTouch, false);
  assert.match(report.sourceAssumption.touchPrecedence, /^emu_window/);
  assert.deepEqual(report.touch.entries.map(({ key, x, y }) => ({ key, x, y })), [
    { key: 'E', x: 160, y: 230 },
    { key: 'R', x: 160, y: 205 },
  ]);
});

test('decodes direction keys and validates an isolated portable root', () => {
  const report = auditAzaharInputProfile(fixture(), { configPath });
  assert.deepEqual(Object.fromEntries(['up', 'down', 'left', 'right'].map((key) => [key, report.buttons[key].key])),
    { up: 'T', down: 'G', left: 'F', right: 'H' });
  assert.deepEqual(report.isolation, {
    inferredUserRoot: `${root}/user`,
    inferredInstanceRoot: root,
    nandInsideUserRoot: true,
    sdmcInsideUserRoot: true,
    screenshotsInsideInstanceRoot: true,
  });
  assert.equal(report.audio.silentByConfiguredVolume, true);
  assert.deepEqual(report.issues, []);
});

test('flags stale absolute paths in a nominal clone', () => {
  const report = auditAzaharInputProfile(fixture(), {
    configPath: '/private/tmp/native-audit/clone/user/config/qt-config.ini',
  });
  assert.equal(report.isolation.nandInsideUserRoot, false);
  assert.match(report.issues.at(-1), /share state or output/);
});

test('reports conflicting keyboard bindings and disabled mouse touch', () => {
  const text = fixture()
    .replace('profiles\\1\\touch_device=engine:emu_window', 'profiles\\1\\touch_device=engine:other')
    .replace('code:69,engine:keyboard,x:160,y:230', 'code:70,engine:keyboard,x:160,y:230');
  const report = auditAzaharInputProfile(text, { configPath });
  assert.deepEqual(report.collisions, [{ code: 70, key: 'F', owners: ['button_left', 'touch_0'] }]);
  assert.equal(report.touch.mouseTouchEnabled, false);
  assert.equal(report.issues.length, 2);
});
