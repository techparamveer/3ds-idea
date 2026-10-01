#!/usr/bin/env node
// Screenshot two pages under identical conditions and count differing pixels.
//
//   node scripts/perf/screenshot-compare.mjs --a http://127.0.0.1:3101/source-preview \
//     --b http://127.0.0.1:3101/ --out /tmp/3ds-shots [--profiles desktop,mobile]
//
// Each capture uses a fresh headed Chromium profile, reduced motion (the lid is
// open at rest without the opening), a frozen wall clock, and the benchmark's
// viewport profiles. `rotated` adds the same scripted drag in both pages.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { CdpSession, launchChromium, sleep } from './cdp.mjs';
import { PROFILES } from './profiles.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1] && !all[index + 1].startsWith('--') ? all[index + 1] : true]);
  return pairs;
}, []));
const chromium = args.chromium ?? process.env.CHROMIUM
  ?? '/Users/paramveer/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const out = args.out ?? '/tmp/3ds-shots';
const profiles = String(args.profiles ?? 'desktop,mobile').split(',');
const FROZEN = Date.parse('2026-09-28T12:34:00Z');

async function capture(url, profileName, view) {
  const profile = PROFILES[profileName];
  const browser = await launchChromium(chromium, [], { headless: false });
  const session = await CdpSession.openPage(browser.port);
  try {
    await session.send('Page.enable');
    await session.send('Emulation.setDeviceMetricsOverride', { width: profile.width, height: profile.height, deviceScaleFactor: profile.deviceScaleFactor, mobile: profile.mobile });
    await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const navigator = profile.hardwareConcurrency ? `Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>${profile.hardwareConcurrency}});Object.defineProperty(navigator,'deviceMemory',{get:()=>${profile.deviceMemory}});` : '';
    await session.send('Page.addScriptToEvaluateOnNewDocument', { source: `${navigator}{const Real=Date;const at=${FROZEN};class Frozen extends Real{constructor(...a){super(...(a.length?a:[at]));}static now(){return at;}}window.Date=Frozen;}` });
    await session.send('Page.navigate', { url });
    await session.waitFor(`document.querySelector('.console-stage')?.dataset.menu==='home'&&document.querySelector('.console-stage').dataset.vgpu!=null&&document.querySelector('.console-stage').dataset.vgpu!=='pending'`, 90000, 50);
    if (view === 'rotated') {
      const x = Math.round(profile.width * 0.5), y = Math.round(profile.height * 0.8);
      await session.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await sleep(100);
      await session.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      for (let step = 1; step <= 10; step++) { await session.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x - step * 18, y: y - step * 4, button: 'left' }); await sleep(16); }
      // Hold still before release so no fling velocity carries the pose further.
      await sleep(400);
      await session.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x - 180, y: y - 40, button: 'left' });
      await sleep(400);
      await session.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x - 180, y: y - 40, button: 'left', clickCount: 1 });
    }
    await sleep(2500);
    const { data } = await session.send('Page.captureScreenshot', { format: 'png' });
    return Buffer.from(data, 'base64');
  } finally { await session.close(); await browser.close(); }
}

async function diff(a, b) {
  const [left, right] = await Promise.all([a, b].map(png => sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  if (left.info.width !== right.info.width || left.info.height !== right.info.height) throw new Error('Screenshot sizes differ');
  let differing = 0, within2 = 0, over32 = 0, max = 0;
  for (let i = 0; i < left.data.length; i += 4) {
    const delta = Math.max(Math.abs(left.data[i] - right.data[i]), Math.abs(left.data[i + 1] - right.data[i + 1]), Math.abs(left.data[i + 2] - right.data[i + 2]));
    if (!delta) continue;
    differing++; if (delta <= 2) within2++; if (delta > 32) over32++; if (delta > max) max = delta;
  }
  const pixels = left.info.width * left.info.height;
  return { width: left.info.width, height: left.info.height, differing, differingPercent: +(100 * differing / pixels).toFixed(4), within2, over32, maxDelta: max };
}

await mkdir(out, { recursive: true });
const report = [];
for (const profileName of profiles) for (const view of String(args.views ?? 'home,rotated').split(',')) {
  const a = await capture(args.a, profileName, view), b = await capture(args.b, profileName, view);
  await writeFile(join(out, `${profileName}-${view}-a.png`), a); await writeFile(join(out, `${profileName}-${view}-b.png`), b);
  const result = { profile: profileName, view, ...(await diff(a, b)) };
  report.push(result); console.log(JSON.stringify(result));
}
await writeFile(join(out, 'report.json'), JSON.stringify({ a: args.a, b: args.b, frozenClock: new Date(FROZEN).toISOString(), report }, null, 1));
