#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);
const SOURCE_REVISION = '9e6f523a57fac9564ac0bf8286db3c3702d301ec';
export const HELP = `Usage: node scripts/reference/azahar-frame-advance.mjs
  --pid PID --main-window ID --render-window ID --output ABSOLUTE_NEW_DIRECTORY
  --steps 1..120 --sidecar-x X --sidecar-y Y --sidecar-width W --sidecar-height H

The output parent must exist. The output directory must not already exist.
Use --sidecar-x=-X or --sidecar-y=-Y for negative display coordinates.
Requires an already-paused Azahar and both exact windows visible on the current
Space, wholly inside the supplied Sidecar rectangle. It never pauses, resumes,
quits, changes audio/configuration, or invokes Azahar's Capture Screenshot menu.
Two full-resolution render-window PNGs must be byte-identical before any step.
Then each Tools > Advance Frame request is followed by a render-window capture.
Only the installed cua-driver CLI performs UI operations. Failed runs preserve
partial PNGs, append-only events.jsonl and a final manifest.json; no retry occurs.

Byte equality is a frozen-image precondition, not proof of internal pause state.
Menu dispatch does not prove native advancement; identical step PNGs are kept.
Step ordinals are requested actions, not native layout epochs. Window screenshots
are not raw 400x480 LCD acceptance captures. Host timestamps do not prove native
input, render or audio timing. Inspect the saved evidence before drawing conclusions.
`;

function integer(value, name, minimum = 1) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`Invalid ${name}`);
  return value;
}

function rectangle(value, name) {
  if (!value || typeof value !== 'object') throw new Error(`Invalid ${name} bounds`);
  for (const key of ['x', 'y']) integer(value[key], `${name} ${key}`, -Number.MAX_SAFE_INTEGER);
  for (const key of ['width', 'height']) integer(value[key], `${name} ${key}`);
  if (!Number.isSafeInteger(value.x + value.width) || !Number.isSafeInteger(value.y + value.height)) {
    throw new Error(`Invalid ${name} extent`);
  }
  return value;
}

function validateOptions(options) {
  for (const key of ['pid', 'mainWindow', 'renderWindow', 'steps']) integer(options[key], key);
  if (options.mainWindow === options.renderWindow) throw new Error('Main and render window IDs must differ');
  if (options.steps > 120) throw new Error('Steps must not exceed 120');
  if (typeof options.output !== 'string' || !isAbsolute(options.output)) throw new Error('Output must be absolute');
  rectangle(options.sidecar, 'Sidecar');
  return options;
}

export function parseFrameAdvanceArgs(args) {
  const names = ['pid', 'main-window', 'render-window', 'output', 'steps',
    'sidecar-x', 'sidecar-y', 'sidecar-width', 'sidecar-height'];
  const { values, tokens } = parseArgs({ args, strict: true, allowPositionals: false, tokens: true,
    options: { ...Object.fromEntries(names.map(name => [name, { type: 'string' }])), help: { type: 'boolean' } } });
  const seen = new Set();
  for (const token of tokens) {
    if (token.kind === 'option' && seen.has(token.name)) throw new Error(`Duplicate --${token.name}`);
    if (token.kind === 'option') seen.add(token.name);
  }
  if (values.help) return null;
  for (const name of names) if (!values[name]) throw new Error(`Missing --${name}`);
  if (!isAbsolute(values.output)) throw new Error('Output must be absolute');
  const number = name => {
    if (!/^-?\d+$/.test(values[name])) throw new Error(`Invalid --${name}`);
    return Number(values[name]);
  };
  return validateOptions({ pid: number('pid'), mainWindow: number('main-window'),
    renderWindow: number('render-window'), output: resolve(values.output), steps: number('steps'),
    sidecar: { x: number('sidecar-x'), y: number('sidecar-y'),
      width: number('sidecar-width'), height: number('sidecar-height') } });
}

function inside(bounds, sidecar) {
  return bounds.x >= sidecar.x && bounds.y >= sidecar.y
    && bounds.x + bounds.width <= sidecar.x + sidecar.width
    && bounds.y + bounds.height <= sidecar.y + sidecar.height;
}

function checkedWindows(result, options) {
  if (!Array.isArray(result.windows)) throw new Error('list_windows omitted windows');
  const exact = id => {
    const matches = result.windows.filter(window => window.window_id === id);
    if (matches.length !== 1) throw new Error(`Window ${id} missing or ambiguous`);
    const window = matches[0];
    if (window.pid !== options.pid || window.app_name !== 'Azahar') throw new Error(`Window ${id} owner mismatch`);
    if (window.is_on_screen !== true || window.on_current_space !== true) throw new Error(`Window ${id} is not visibly on the current Space`);
    if (!inside(rectangle(window.bounds, `Window ${id}`), options.sidecar)) throw new Error(`Window ${id} outside Sidecar`);
    return window;
  };
  const main = exact(options.mainWindow), render = exact(options.renderWindow);
  if (typeof main.title !== 'string' || !/^Azahar(?:\s|$)/.test(main.title)) throw new Error('Main window title is not Azahar');
  return { main, render };
}

async function cuaCli(tool, args) {
  const { stdout } = await execFileAsync('cua-driver', [tool, JSON.stringify(args)],
    { timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(stdout);
}

async function absent(path) {
  try { await lstat(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new Error(`Refusing existing file: ${path}`);
}

const stamp = () => ({ utc: new Date().toISOString(), monotonicNs: process.hrtime.bigint().toString() });

// The transport is injectable for offline tests. The CLI offers no command override.
export async function advanceAzaharFrames(options, transport = cuaCli) {
  validateOptions(options);
  await mkdir(options.output);
  const events = await open(join(options.output, 'events.jsonl'), 'ax');
  const session = `azahar-frame-${randomUUID()}`;
  const report = { schemaVersion: 1, sourceRevision: SOURCE_REVISION, options, session, started: stamp(),
    status: 'running', frozenImagePrecondition: false, menuRequests: 0, menuDispatches: 0, captures: [], errors: [],
    limits: ['Requested actions are not native layout epochs.', 'Window PNGs are not raw LCD acceptance.',
      'Identical step PNGs do not prove advancement.', 'Host times do not establish native timing.'] };
  let sequence = 0, sessionUsed = false;
  const log = event => events.appendFile(`${JSON.stringify(event)}\n`);
  async function call(tool, args) {
    const id = sequence++, before = stamp();
    await log({ id, tool, args, before });
    if (args.session) sessionUsed = true;
    try {
      const result = await transport(tool, args);
      await log({ id, after: stamp(), result });
      if (!result || typeof result !== 'object' || result.error || result.isError || result.success === false) {
        throw new Error(`${tool} returned an error: ${JSON.stringify(result)}`);
      }
      return result;
    } catch (error) {
      await log({ id, failed: stamp(), error: error.message });
      throw error;
    }
  }
  const verify = async () => checkedWindows(await call('list_windows', { pid: options.pid }), options);
  async function capture(name) {
    const path = join(options.output, `${name}.png`);
    await absent(path);
    const windows = await verify(), before = stamp();
    const result = await call('get_window_state', { pid: options.pid, window_id: options.renderWindow,
      session, include_accessibility_tree: false, include_screenshot: true, max_image_dimension: 0,
      screenshot_out_file: path });
    const after = stamp();
    if (result.pid !== options.pid || result.window_id !== options.renderWindow) throw new Error('Capture target mismatch');
    if (result.screenshot_frame_valid !== true || result.screenshot_error) throw new Error('Capture frame is invalid');
    if (result.screenshot_file_path !== path) throw new Error('Capture output path mismatch');
    const bounds = rectangle(result.window_bounds, 'Capture');
    if (['x', 'y', 'width', 'height'].some(key => bounds[key] !== windows.render.bounds[key])) throw new Error('Capture bounds changed after guard');
    const scale = result.screenshot_scale;
    if (![1, 2].includes(scale) || result.screenshot_width !== bounds.width * scale
      || result.screenshot_height !== bounds.height * scale) throw new Error('Capture dimensions or scale mismatch');
    const file = await lstat(path);
    if (!file.isFile()) throw new Error('Capture is not a regular file');
    const bytes = await readFile(path), image = sharp(bytes, { failOn: 'warning' });
    const metadata = await image.metadata();
    const { info } = await image.raw().toBuffer({ resolveWithObject: true });
    if (metadata.format !== 'png' || info.width !== result.screenshot_width
      || info.height !== result.screenshot_height) throw new Error('Decoded PNG dimensions mismatch');
    const previous = report.captures.at(-1);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    report.captures.push({ name, path, before, after, windows, metadata: result,
      sha256, byteLength: bytes.length, width: info.width, height: info.height, fullDecode: true,
      differsFromPreviousBytes: previous ? previous.sha256 !== sha256 : null });
    await log({ captured: report.captures.at(-1) });
    return bytes;
  }
  try {
    const first = await capture('frozen-a'), second = await capture('frozen-b');
    if (!first.equals(second)) throw new Error('Initial snapshots differ; no frame advance requested');
    report.frozenImagePrecondition = true;
    for (let step = 1; step <= options.steps; step++) {
      const windows = await verify();
      report.menuRequests++;
      const result = await call('invoke_menu', { pid: options.pid, window_id: options.mainWindow,
        session, path: ['Tools', 'Advance Frame'] });
      report.menuDispatches++;
      await log({ stepOrdinal: step, windows, dispatch: result, semanticAdvancementVerified: false });
      await capture(`step-${String(step).padStart(3, '0')}`);
    }
    report.status = 'complete';
  } catch (error) {
    report.status = 'failed'; report.errors.push(error.message);
  } finally {
    if (sessionUsed) {
      try { await call('end_session', { session }); }
      catch (error) { report.status = 'failed'; report.errors.push(`Session cleanup: ${error.message}`); }
    }
    report.finished = stamp();
    try { await writeFile(join(options.output, 'manifest.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' }); }
    finally { await events.close(); }
  }
  if (report.status === 'failed') throw new Error(`${report.errors.join('; ')}. Partial evidence: ${options.output}`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parseFrameAdvanceArgs(process.argv.slice(2));
    if (!options) process.stdout.write(HELP);
    else await advanceAzaharFrames(options).then(report => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`));
  } catch (error) { process.stderr.write(`azahar-frame-advance: ${error.message}\n`); process.exitCode = 1; }
}
