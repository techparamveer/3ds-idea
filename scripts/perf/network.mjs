#!/usr/bin/env node
// Bytes transferred by one scripted visit, per phase and resource type.
//   node scripts/perf/network.mjs --url http://127.0.0.1:3000/ --profile desktop|mobile [--warm] [--throttle 9:60] [--out file.json]
import { writeFile } from 'node:fs/promises';
import { CdpSession, launchChromium, sleep } from './cdp.mjs';
import { PROFILES } from './profiles.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1] && !all[index + 1].startsWith('--') ? all[index + 1] : true]);
  return pairs;
}, []));
const url = args.url ?? 'http://127.0.0.1:3000/';
const profile = PROFILES[args.profile ?? 'desktop'];
const chromium = args.chromium ?? process.env.CHROMIUM
  ?? '/Users/paramveer/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const browser = await launchChromium(chromium, [], { headless: false });
const session = await CdpSession.openPage(browser.port);
const requests = new Map();
let phase = 'startup', readyMs = null;
session.on('Network.responseReceived', ({ requestId, response, type }) => {
  requests.set(requestId, { url: response.url, type, mime: response.mimeType, phase, encoding: response.headers['content-encoding'] ?? response.headers['Content-Encoding'] ?? null });
});
session.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => {
  const entry = requests.get(requestId); if (entry) entry.transfer = encodedDataLength;
});
session.on('Network.dataReceived', ({ requestId, dataLength }) => {
  const entry = requests.get(requestId); if (entry) entry.decoded = (entry.decoded ?? 0) + dataLength;
});
const key = async (name, code, keyCode) => {
  for (const type of ['rawKeyDown', 'keyUp']) { await session.send('Input.dispatchKeyEvent', { type, key: name, code, windowsVirtualKeyCode: keyCode }, 3000).catch(() => {}); await sleep(70); }
};
try {
  await session.send('Network.enable');
  // --warm measures a returning visitor: one full visit fills the HTTP cache first.
  await session.send('Network.setCacheDisabled', { cacheDisabled: !args.warm });
  // --throttle DOWN_MBPS:LATENCY_MS emulates a slower link, e.g. 9:60 for fast 4G.
  if (args.throttle) {
    const [mbps, latency] = String(args.throttle).split(':').map(Number);
    await session.send('Network.emulateNetworkConditions', { offline: false, latency, downloadThroughput: mbps * 125000, uploadThroughput: 1.5 * 125000 });
  }
  await session.send('Page.enable'); await session.send('Runtime.enable');
  await session.send('Emulation.setDeviceMetricsOverride', { width: profile.width, height: profile.height, deviceScaleFactor: profile.deviceScaleFactor, mobile: profile.mobile });
  if (profile.mobile) await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (args.warm) {
    await session.send('Page.navigate', { url });
    await session.waitFor(`document.querySelector('.console-stage')?.dataset.menu==='home'`, 120000, 50);
    await sleep(3000); requests.clear();
    await session.send('Page.navigate', { url: 'about:blank' }); await sleep(500); requests.clear();
  }
  await session.send('Page.navigate', { url });
  await session.waitFor(`document.querySelector('.console-stage')?.dataset.ready==='true'`, 180000, 50);
  readyMs = await session.evaluate('performance.now()');
  phase = 'opening';
  await session.waitFor(`document.querySelector('.console-stage').dataset.menu==='home'`, 60000, 50);
  await sleep(4000);
  phase = 'interaction';
  await session.evaluate(`document.querySelector('.console-stage').focus()`);
  // Open About (portfolio) and System Settings (native stock app), returning HOME between.
  for (const moves of [['ArrowRight', 'ArrowRight', 'ArrowRight'], ['ArrowDown', 'ArrowRight']]) {
    for (const move of moves) { await key(move, move, { ArrowRight: 39, ArrowDown: 40 }[move]); await sleep(300); }
    await key('Enter', 'Enter', 13); await sleep(4000);
    await key('h', 'KeyH', 72); await sleep(2500);
  }
  await sleep(1500);
} finally {
  await session.close(); await browser.close();
}
const entries = [...requests.values()].filter(entry => entry.transfer !== undefined);
const category = entry => /\.glb/.test(entry.url) ? 'model (glb)' : /\/_next\/static\/.*\.js/.test(entry.url) ? 'javascript' : /\.css/.test(entry.url) ? 'css' : /\.json/.test(entry.url) ? 'json (packs, manifests, models)'
  : /\.(png|webp|jpe?g|avif)/.test(entry.url) ? 'images/textures' : /\.(woff2?|bcfnt|ttf)/.test(entry.url) || /fonts\//.test(entry.url) ? 'fonts' : /\.(wav|ogg|mp3|m4a|bin|pcm|opus|bcstm)/.test(entry.url) || /audio|music/.test(entry.url) ? 'audio' : entry.type === 'Document' ? 'html' : 'other';
const summary = {};
for (const entry of entries) {
  const bucket = summary[entry.phase] ??= {};
  const row = bucket[category(entry)] ??= { requests: 0, transferMB: 0, decodedMB: 0 };
  row.requests++; row.transferMB += entry.transfer / 1048576; row.decodedMB += (entry.decoded ?? 0) / 1048576;
}
const total = phase => Object.values(summary[phase] ?? {}).reduce((sum, row) => ({ requests: sum.requests + row.requests, transferMB: sum.transferMB + row.transferMB, decodedMB: sum.decodedMB + row.decodedMB }), { requests: 0, transferMB: 0, decodedMB: 0 });
const result = { url, profile: args.profile ?? 'desktop', throttle: args.throttle ?? null, readyMs, phases: Object.fromEntries(['startup', 'opening', 'interaction'].map(phase => [phase, { total: total(phase), byType: summary[phase] ?? {} }])),
  largest: entries.sort((a, b) => b.transfer - a.transfer).slice(0, 25).map(entry => ({ url: entry.url.replace(/^https?:\/\/[^/]+/, ''), phase: entry.phase, transferKB: Math.round(entry.transfer / 1024), decodedKB: Math.round((entry.decoded ?? 0) / 1024), encoding: entry.encoding })) };
if (args.out) await writeFile(args.out, JSON.stringify({ ...result, requests: entries }, null, 2));
console.log(JSON.stringify(result, null, 1));
