#!/usr/bin/env node
// Scripted performance benchmark for the 3DS console scene.
//
//   node scripts/perf/benchmark.mjs --url http://127.0.0.1:3000/ --label after \
//     --out /tmp/3ds-perf/after [--runs 3] [--profiles desktop,mobile] [--cpu-profile]
//
// Each run launches a fresh headed Chromium window and profile (cold shader and HTTP
// caches), loads the page and drives one fixed timeline: startup, opening,
// idle HOME, HOME navigation, an app transition and viewport resizing. Every
// segment is measured from the in-page instrumentation in instrument.js.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CdpSession, launchChromium, sleep } from './cdp.mjs';
import { summarizeRun, aggregateRuns, formatTable } from './metrics.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1] && !all[index + 1].startsWith('--') ? all[index + 1] : true]);
  return pairs;
}, []));
const url = args.url ?? 'http://127.0.0.1:3000/';
const label = args.label ?? 'run';
const out = args.out ?? join('/tmp/3ds-perf', label);
const runs = Number(args.runs ?? 3);
const profiles = String(args.profiles ?? 'desktop,mobile').split(',');
const chromium = args.chromium ?? process.env.CHROMIUM
  ?? '/Users/paramveer/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

export const PROFILES = {
  // Retina laptop window.
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false, cpuThrottle: 1,
    resize: [[1280, 800], [1024, 700], [1600, 1000], [1440, 900], [900, 900], [1920, 1080], [1200, 760], [1440, 900]] },
  // Phone-class viewport: 3x DPR, touch, 4x CPU slowdown and a 4-core / 4 GB
  // navigator so the scene's own quality policy selects its constrained tier.
  mobile: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true, cpuThrottle: 4, hardwareConcurrency: 4, deviceMemory: 4,
    resize: [[844, 390], [390, 844], [360, 740], [740, 360], [412, 915], [390, 844], [844, 390], [390, 844]] },
};

async function key(session, keyName, code, holdMs = 70) {
  const keyCode = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Enter: 13, h: 72, b: 66 }[keyName];
  const base = { key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
  // Input acknowledgements can stall behind a busy renderer; the timeline is
  // wall-clock driven, so do not let one acknowledgement block the script.
  const dispatch = type => session.send('Input.dispatchKeyEvent', { type, ...base }, 3000).catch(() => { session.inputTimeouts = (session.inputTimeouts ?? 0) + 1; });
  await dispatch('rawKeyDown');
  await sleep(holdMs);
  await dispatch('keyUp');
}
const KEY_CODES = { ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', Enter: 'Enter', h: 'KeyH', b: 'KeyB' };
const press = (session, name, hold) => key(session, name, KEY_CODES[name], hold);

// System-wide Apple GPU utilization from the IOAccelerator performance
// statistics. It includes WindowServer composition, identical for every build.
function gpuStatistics() {
  try {
    const text = execFileSync('ioreg', ['-r', '-d', '1', '-w', '0', '-c', 'IOAccelerator'], { encoding: 'utf8' });
    const device = /"Device Utilization %"=(\d+)/.exec(text), memory = /"In use system memory"=(\d+)/.exec(text);
    return device ? { device: Number(device[1]), memoryMB: memory ? Number(memory[1]) / 1048576 : null } : null;
  } catch { return null; }
}
function sampleGpu(origin) {
  const samples = [];
  const timer = setInterval(() => { const value = gpuStatistics(); if (value) samples.push({ at: Date.now() - origin, ...value }); }, 100);
  return { samples, stop: () => clearInterval(timer) };
}

function processMemory(profileDir) {
  // Physical footprint (includes IOSurface/Metal allocations) per Chromium process type.
  const rows = execFileSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' }).split('\n').filter(row => row.includes(profileDir));
  const result = {};
  for (const row of rows) {
    const pid = row.trim().split(/\s+/)[0];
    const type = /--type=([\w-]+)/.exec(row)?.[1] ?? 'browser';
    const kind = type === 'gpu-process' ? 'gpu' : type === 'renderer' ? 'renderer' : null;
    if (!kind) continue;
    try {
      const text = execFileSync('footprint', ['-p', pid], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const match = /Footprint:\s+([\d.]+)\s*(KB|MB|GB)/.exec(text);
      if (match) {
        const mb = Number(match[1]) * (match[2] === 'GB' ? 1024 : match[2] === 'KB' ? 1 / 1024 : 1);
        result[kind] = Math.max(result[kind] ?? 0, mb);
      }
    } catch {}
  }
  return result;
}

async function runOnce(profileName, runIndex, url) {
  const profile = PROFILES[profileName];
  // Headed: headless Chromium intermittently schedules this page at 1 frame/s
  // until the first input, which a real display link never does.
  const browser = await launchChromium(chromium, [], { headless: Boolean(args.headless) });
  const session = await CdpSession.openPage(browser.port);
  try {
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await session.send('Emulation.setDeviceMetricsOverride', { width: profile.width, height: profile.height, deviceScaleFactor: profile.deviceScaleFactor, mobile: profile.mobile });
    if (profile.mobile) await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    if (profile.cpuThrottle > 1) await session.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuThrottle });
    const overrides = { hardwareConcurrency: profile.hardwareConcurrency, deviceMemory: profile.deviceMemory };
    const instrument = await readFile(join(here, 'instrument.js'), 'utf8');
    await session.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__perfOverrides=${JSON.stringify(overrides)};\n${instrument}` });
    // --cpu-profile [segment]: sample the whole run, or only the named segment.
    const profileSegment = typeof args['cpu-profile'] === 'string' ? args['cpu-profile'] : null;
    const startProfile = async () => { await session.send('Profiler.enable'); await session.send('Profiler.setSamplingInterval', { interval: 200 }); await session.send('Profiler.start'); };
    if (args['cpu-profile'] && !profileSegment) await startProfile();
    const mark = async name => {
      if (profileSegment && name === `${profileSegment}:start`) await startProfile();
      await session.evaluate(`__perf.mark('${name}')`);
      if (profileSegment && name === `${profileSegment}:end`) cpuProfile = (await session.send('Profiler.stop')).profile;
    };
    let cpuProfile;

    // Idle system GPU load with an empty page, for context.
    const idleGpu = sampleGpu(Date.now()); await sleep(1500); idleGpu.stop();
    await session.send('Page.navigate', { url });
    await session.waitFor(`typeof window.__perf==='object'`, 30000, 10);
    const origin = await session.evaluate('performance.timeOrigin');
    const gpuSampler = sampleGpu(origin);
    await session.waitFor(`window.__perf?.introEnd!=null`, 90000, 25);
    await session.waitFor(`document.querySelector('.console-stage').dataset.menu==='home'`, 30000, 25);
    await sleep(500);
    const quality = await session.evaluate(`document.querySelector('.console-stage').dataset.quality`);

    await mark('idle:start');
    await sleep(3000);
    await mark('idle:end');

    await session.evaluate(`document.querySelector('.console-stage').focus()`);
    await mark('home-nav:start');
    // Slots are column-major: 0 Work, 2 Hobbies, 4 HackUK, 6 About, 7 Sound,
    // 5 NVIDIA, 3 Life. The walk ends on About (slot 6).
    for (const name of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowRight']) {
      await press(session, name);
      await sleep(230);
    }
    await sleep(600);
    await mark('home-nav:end');

    const beforeApp = await session.evaluate(`document.querySelector('.console-stage [aria-live]').textContent`);
    // Open About, return HOME (suspend), resume it, return HOME again.
    await mark('app:start');
    await press(session, 'Enter'); await sleep(2800);
    await press(session, 'h'); await sleep(2200);
    await press(session, 'Enter'); await sleep(2200);
    await press(session, 'h'); await sleep(2200);
    await mark('app:end');
    const afterApp = await session.evaluate(`({menu:document.querySelector('.console-stage').dataset.menu,app:document.querySelector('.console-stage').dataset.app})`);

    await mark('resize:start');
    for (const [width, height] of profile.resize) {
      await session.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: profile.deviceScaleFactor, mobile: profile.mobile });
      await sleep(250);
    }
    await sleep(500);
    await mark('resize:end');

    gpuSampler.stop();
    const memory = await session.evaluate(`({jsHeapMB: performance.memory.usedJSHeapSize/1048576, jsHeapTotalMB: performance.memory.totalJSHeapSize/1048576})`);
    Object.assign(memory, processMemory(browser.profile), { gpuInUseMB: gpuStatistics()?.memoryMB ?? null });
    const shot = await session.send('Page.captureScreenshot', { format: 'png' });
    const raw = await session.evaluate(`JSON.stringify({frames:__perf.frames,callbacks:__perf.callbacks,gpu:__perf.gpu,uploads:__perf.uploads,loaf:__perf.loaf,events:__perf.events,marks:__perf.marks,ready:__perf.ready,introEnd:__perf.introEnd,firstDraw:__perf.firstDraw,foreignInput:__perf.foreignInput,nav:performance.getEntriesByType('navigation')[0]?.toJSON()})`);
    if (args['cpu-profile'] && !profileSegment) cpuProfile = (await session.send('Profiler.stop')).profile;
    return { profile: profileName, run: runIndex, inputTimeouts: session.inputTimeouts ?? 0, quality, beforeApp, afterApp, memory, raw: { ...JSON.parse(raw), gpuDevice: gpuSampler.samples, gpuDeviceIdle: idleGpu.samples }, screenshot: shot.data, cpuProfile };
  } finally {
    await session.close();
    await browser.close();
  }
}

// A run is valid only if the scripted timeline ran as intended.
function invalidReason(result) {
  const { raw } = result;
  if (raw.foreignInput) return `${raw.foreignInput} unscripted pointer/wheel events`;
  if (raw.introEnd - raw.ready < 2500) return 'opening interrupted';
  if (!/About/.test(result.beforeApp) || result.afterApp.app !== 'about' || result.afterApp.menu !== 'home') return 'scripted navigation diverged';
  if (result.inputTimeouts) return 'input acknowledgements timed out';
  return null;
}

// --targets baseline=URL,after=URL interleaves the builds run by run, so slow
// drift in background load affects every target equally.
const targets = String(args.targets ?? `${label}=${url}`).split(',').map(entry => { const at = entry.indexOf('='); return { label: entry.slice(0, at), url: entry.slice(at + 1) }; });
const reports = Object.fromEntries(targets.map(target => [target.label, { label: target.label, url: target.url, runs, chromium, date: new Date().toISOString(), profiles: {} }]));
for (const profileName of profiles) {
  const summaries = Object.fromEntries(targets.map(target => [target.label, []]));
  for (let run = 1; run <= runs; run++) for (const target of targets) {
    const directory = targets.length > 1 ? join(out, target.label) : out;
    await mkdir(directory, { recursive: true });
    let result, reason, attempt = 0;
    do {
      result = await runOnce(profileName, run, target.url);
      reason = invalidReason(result);
      if (reason) console.error(`${target.label} ${profileName} run ${run}: discarded (${reason}), retrying`);
    } while (reason && ++attempt < 4);
    if (reason) throw new Error(`${target.label} ${profileName} run ${run} stayed invalid: ${reason}`);
    const summary = summarizeRun(result);
    summaries[target.label].push(summary);
    await writeFile(join(directory, `${profileName}-run${run}.raw.json`), JSON.stringify({ ...result, screenshot: undefined, cpuProfile: undefined }));
    await writeFile(join(directory, `${profileName}-run${run}.png`), Buffer.from(result.screenshot, 'base64'));
    if (result.cpuProfile) await writeFile(join(directory, `${profileName}-run${run}.cpuprofile`), JSON.stringify(result.cpuProfile));
    console.error(`${target.label} ${profileName} run ${run}: quality=${result.quality} selected=${JSON.stringify(result.beforeApp)} after-app=${JSON.stringify(result.afterApp)} ready=${summary.startup.readyMs.toFixed(0)}ms`);
  }
  for (const target of targets) reports[target.label].profiles[profileName] = { runs: summaries[target.label], median: aggregateRuns(summaries[target.label]) };
}
for (const target of targets) {
  const directory = targets.length > 1 ? join(out, target.label) : out;
  await writeFile(join(directory, 'summary.json'), JSON.stringify(reports[target.label], null, 2));
  await writeFile(join(directory, 'summary.md'), formatTable(reports[target.label]));
  console.log(formatTable(reports[target.label]));
}
