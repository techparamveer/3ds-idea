#!/usr/bin/env node
// Read-only audit of the Azahar 2126.1.2 Qt input/profile settings used by native replays.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REVISION = '9e6f523a57fac9564ac0bf8286db3c3702d301ec';

const BUTTON_NAMES = ['a', 'b', 'up', 'down', 'left', 'right', 'home', 'start', 'select'];

function decodeValue(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return value;
}

export function parseQtIni(text) {
  const values = new Map();
  let section = '';
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1);
      continue;
    }
    const equals = raw.indexOf('=');
    if (equals < 0) throw new Error(`Malformed Qt INI line ${index + 1}`);
    const key = raw.slice(0, equals).trim();
    values.set(`${section}/${key}`, decodeValue(raw.slice(equals + 1).trim()));
  }
  return values;
}

function boolean(value, fallback = false) {
  if (value === undefined) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Expected boolean, got ${JSON.stringify(value)}`);
}

function integer(value, fallback = 0) {
  const number = Number(value ?? fallback);
  if (!Number.isSafeInteger(number)) throw new Error(`Expected integer, got ${JSON.stringify(value)}`);
  return number;
}

function parameterPackage(value = '') {
  return Object.fromEntries(value.split(',').filter(Boolean).map((field) => {
    const colon = field.indexOf(':');
    return colon < 0 ? [field, ''] : [field.slice(0, colon), field.slice(colon + 1)];
  }));
}

function printableKey(code) {
  return code >= 32 && code <= 126 ? String.fromCharCode(code) : null;
}

function binding(value) {
  const parameters = parameterPackage(value);
  const code = parameters.engine === 'keyboard' ? Number(parameters.code) : null;
  return {
    raw: value,
    engine: parameters.engine ?? null,
    code: Number.isSafeInteger(code) ? code : null,
    key: Number.isSafeInteger(code) ? printableKey(code) : null,
  };
}

function containedBy(path, root) {
  if (!path || !isAbsolute(path)) return false;
  const delta = relative(resolve(root), resolve(path));
  return delta === '' || (!delta.startsWith(`..${sep}`) && delta !== '..' && !isAbsolute(delta));
}

export function auditAzaharInputProfile(text, { configPath = null } = {}) {
  const values = parseQtIni(text);
  const get = (section, key) => values.get(`${section}/${key}`);
  const profileIndex = integer(get('Controls', 'profile'));
  const profilePrefix = `profiles\\${profileIndex + 1}\\`;
  const profile = (key) => get('Controls', `${profilePrefix}${key}`);
  const touchMapIndex = integer(profile('touch_from_button_map'));
  const mapPrefix = `touch_from_button_maps\\${touchMapIndex + 1}\\`;
  const entryCount = integer(get('Controls', `${mapPrefix}entries\\size`));
  const buttons = Object.fromEntries(BUTTON_NAMES.map((name) => [name, binding(profile(`button_${name}`))]));
  const touchEntries = [];
  for (let index = 1; index <= entryCount; index++) {
    const raw = get('Controls', `${mapPrefix}entries\\${index}\\bind`) ?? '';
    const parameters = parameterPackage(raw);
    const keyBinding = binding(raw);
    touchEntries.push({
      index: index - 1,
      ...keyBinding,
      x: integer(parameters.x),
      y: integer(parameters.y),
    });
  }

  const uses = new Map();
  for (const [name, item] of Object.entries(buttons)) {
    if (item.code !== null) uses.set(item.code, [...(uses.get(item.code) ?? []), `button_${name}`]);
  }
  for (const item of touchEntries) {
    if (item.code !== null) uses.set(item.code, [...(uses.get(item.code) ?? []), `touch_${item.index}`]);
  }
  const collisions = [...uses.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([code, owners]) => ({ code, key: printableKey(code), owners }));

  const userRoot = configPath ? dirname(dirname(resolve(configPath))) : null;
  const instanceRoot = userRoot ? dirname(userRoot) : null;
  const storage = {
    nand: get('Data%20Storage', 'nand_directory') ?? null,
    sdmc: get('Data%20Storage', 'sdmc_directory') ?? null,
    screenshots: get('UI', 'Paths\\screenshotPath') ?? null,
  };
  const isolation = userRoot ? {
    inferredUserRoot: userRoot,
    inferredInstanceRoot: instanceRoot,
    nandInsideUserRoot: containedBy(storage.nand, userRoot),
    sdmcInsideUserRoot: containedBy(storage.sdmc, userRoot),
    screenshotsInsideInstanceRoot: containedBy(storage.screenshots, instanceRoot),
  } : null;

  const mouseTouchEnabled = profile('touch_device') === 'engine:emu_window';
  const buttonTouchEnabled = boolean(profile('use_touch_from_button'));
  const issues = [];
  if (!mouseTouchEnabled) issues.push('Active touch_device is not engine:emu_window; render-window mouse touch is unavailable.');
  if (buttonTouchEnabled && entryCount === 0) issues.push('Button touch is enabled but its selected map has no entries.');
  if (collisions.length) issues.push('A keyboard code is shared by more than one audited control.');
  if (isolation && (!isolation.nandInsideUserRoot || !isolation.sdmcInsideUserRoot || !isolation.screenshotsInsideInstanceRoot)) {
    issues.push('Absolute storage or screenshot paths escape the inferred portable instance; a cloned process could share state or output.');
  }

  return {
    schemaVersion: 1,
    sourceAssumption: {
      azaharRevision: REVISION,
      hidPollHz: 234,
      nominalPollMs: 1000 / 234,
      touchPrecedence: 'emu_window mouse/touch, then touch_from_button only when the first device is not pressed, then controller touch',
      focusLossBehavior: 'the render window releases all keyboard keys on focus loss',
    },
    config: {
      path: configPath ? resolve(configPath) : null,
      sha256: createHash('sha256').update(text).digest('hex'),
      profileIndex,
      profileName: profile('name') ?? null,
    },
    touch: {
      device: profile('touch_device') ?? null,
      mouseTouchEnabled,
      buttonTouchEnabled,
      mouseDisabledByButtonTouch: false,
      touchMapIndex,
      touchMapName: get('Controls', `${mapPrefix}name`) ?? null,
      entries: touchEntries,
    },
    buttons,
    collisions,
    hostBehavior: {
      pauseWhenInBackground: boolean(get('UI', 'pauseWhenInBackground')),
      muteWhenInBackground: boolean(get('UI', 'muteWhenInBackground')),
      singleWindowMode: boolean(get('UI', 'singleWindowMode'), true),
    },
    audio: {
      configuredVolume: Number(get('Audio', 'volume')),
      silentByConfiguredVolume: Number(get('Audio', 'volume')) === 0,
    },
    storage,
    isolation,
    issues,
  };
}

async function main(args) {
  if (args.length !== 1) throw new Error('Usage: node scripts/reference/azahar-input-profile-audit.mjs QT_CONFIG_INI');
  const configPath = resolve(args[0]);
  const text = await readFile(configPath, 'utf8');
  return auditAzaharInputProfile(text, { configPath });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then((report) => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`))
    .catch((error) => { process.stderr.write(`azahar-input-profile-audit: ${error.message}\n`); process.exitCode = 1; });
}
