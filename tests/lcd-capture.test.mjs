import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';

const source = readFileSync(new URL('../src/scene/lcd-capture.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { lcdHomeHudSample, captureAtHealthFrame, lcdCaptureEnabled, lcdDownloadRequest, lcdDownloadPayload, encodeNativeLcdPair } = await import(`data:text/javascript,${encodeURIComponent(js)}`);

test('production LCD capture requires loopback and explicit opt in', () => {
  const location = (hostname, search) => ({ hostname, search });
  assert.equal(lcdCaptureEnabled(location('localhost', '?lcdCapture=1'), false), true);
  assert.equal(lcdCaptureEnabled(location('127.0.0.1', '?lcdCapture=1'), false), true);
  assert.equal(lcdCaptureEnabled(location('example.com', '?lcdCapture=1'), false), false);
  assert.equal(lcdCaptureEnabled(location('localhost', ''), false), false);
  assert.equal(lcdCaptureEnabled(location('example.com', ''), true), true);
});

test('download request fixes presentation time and names a single JSON capture', () => {
  assert.deepEqual(
    lcdDownloadRequest('?lcdCapture=1&lcdScenario=settings-other-page1&lcdElapsedMs=8483.333&lcdDate=2026-09-25T10%3A52%3A00Z'),
    { elapsedMs: 8483.333, isoDate: '2026-09-25T10:52:00.000Z', scenario: 'settings-other-page1', bannerFrame: undefined },
  );
  assert.deepEqual(lcdDownloadRequest('?lcdScenario=home-settings-frame150&lcdElapsedMs=12000&lcdDate=2026-09-25&lcdBannerFrame=150'),
    { elapsedMs: 12000, isoDate: '2026-09-25T00:00:00.000Z', scenario: 'home-settings-frame150', bannerFrame: 150 });
  for (const invalid of ['', '-1', '600', '12.5', 'nan']) {
    assert.throws(() => lcdDownloadRequest(`?lcdElapsedMs=0&lcdDate=2026-09-25&lcdBannerFrame=${invalid}`), /lcdBannerFrame/);
  }
  assert.throws(() => lcdDownloadRequest('?lcdElapsedMs=0'), /lcdDate/);
  assert.throws(() => lcdDownloadRequest('?lcdElapsedMs=-1&lcdDate=2026-09-25'), /lcdElapsedMs/);
  assert.throws(() => lcdDownloadRequest('?lcdScenario=../escape&lcdElapsedMs=0&lcdDate=2026-09-25'), /scenario/);
});

test('LCD pair encodes native raw canvas pixels without scaling', async () => {
  const canvas = async (width, height, rgba) => {
    const pixels = Buffer.alloc(width * height * 4);
    for (let i = 0; i < pixels.length; i += 4) pixels.set(rgba, i);
    const png = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
    return { width, height, toDataURL(type) { assert.equal(type, 'image/png'); return `data:image/png;base64,${png.toString('base64')}`; } };
  };
  const top = await canvas(400, 240, [12, 34, 56, 255]);
  const bottom = await canvas(320, 240, [78, 90, 123, 255]);
  const result = encodeNativeLcdPair(top, bottom);
  const payload = JSON.parse(lcdDownloadPayload('home-idle', { ...result, elapsedMs: 0, date: '2026-09-25T10:52:00.000Z' }));
  assert.equal(payload.schema, 'browser-native-lcd-capture-v1');
  assert.equal(payload.scenario, 'home-idle');
  assert.equal(payload.top, result.top);
  assert.equal(payload.bottom, result.bottom);
  assert.deepEqual(result.dimensions, { top: { width: 400, height: 240 }, bottom: { width: 320, height: 240 } });
  for (const [encoded, width, height, pixel] of [[result.top, 400, 240, [12, 34, 56, 255]], [result.bottom, 320, 240, [78, 90, 123, 255]]]) {
    const bytes = Buffer.from(encoded.split(',')[1], 'base64');
    const image = sharp(bytes);
    const metadata = await image.metadata();
    assert.deepEqual([metadata.width, metadata.height], [width, height]);
    assert.deepEqual([...await image.raw().toBuffer().then(v => v.subarray(0, 4))], pixel);
  }
  assert.throws(() => encodeNativeLcdPair({ ...top, width: 800 }, bottom), /native resolution/);
});


test('Health frame request validates bounds and loopback even in development', () => {
  const query = '?lcdElapsedMs=0&lcdDate=2026-09-25';
  for (const frame of [0, 351, 719]) {
    assert.equal(lcdDownloadRequest(`${query}&lcdHealthFrame=${frame}`, 'localhost').healthFrame, frame);
  }
  for (const invalid of ['', '-1', '720', '351.5', 'NaN', 'Infinity', ' ']) {
    assert.throws(() => lcdDownloadRequest(`${query}&lcdHealthFrame=${invalid}`, 'localhost'), /lcdHealthFrame/);
  }
  for (const hostname of ['example.com', undefined]) {
    assert.throws(() => lcdDownloadRequest(`${query}&lcdHealthFrame=351`, hostname), /localhost/);
  }
  assert.throws(() => lcdDownloadRequest(`${query}&lcdHealthFrame=351&lcdBannerFrame=1`, 'localhost'), /combined/);
  assert.equal(lcdDownloadRequest(query).healthFrame, undefined);
});

function liveCaptureFixture(initialFrame = 350) {
  let callback, frame = initialFrame, elapsed = 5550, cancelled = 0, captures = 0;
  const controller = new AbortController();
  const options = {
    signal: controller.signal,
    read: () => ({ healthTopLoopFrame: frame, healthElapsedMs: elapsed, reducedMotion: false }),
    capture: (sample, timestamp) => { captures++; return { ...sample, timestamp, top: 'current-upper', bottom: 'current-lower' }; },
    requestFrame: next => { callback = next; return 1; },
    cancelFrame: () => { cancelled++; },
  };
  return { options, controller, tick(nextFrame, timestamp) { frame = nextFrame; elapsed += 16.7; callback(timestamp); }, get captures() { return captures; }, get cancelled() { return cancelled; } };
}

test('phase gate waits for an observed live frame and atomically captures that sample', async () => {
  const f = liveCaptureFixture();
  const pending = captureAtHealthFrame(351, f.options);
  assert.equal(f.captures, 0, 'click never captures synchronously');
  f.tick(350, 100); assert.equal(f.captures, 0);
  f.tick(352, 117); assert.equal(f.captures, 0, 'a skipped target is not synthesized');
  f.tick(351, 12100); assert.equal(f.captures, 1, 'capture occurs inside the matching callback');
  const result = await pending;
  assert.equal(result.healthTopLoopFrame, 351);
  assert.ok(Math.abs(result.healthElapsedMs - (5550 + 16.7 * 3)) < 1e-9);
  assert.equal(result.timestamp, 12100);
  assert.equal(result.top, 'current-upper'); assert.equal(result.bottom, 'current-lower');
  assert.equal(f.cancelled, 1);
});

test('phase gate fails when Health becomes unavailable, aborts, or rAF stops', async () => {
  const unavailable = liveCaptureFixture();
  const pending = captureAtHealthFrame(351, unavailable.options);
  unavailable.options.read = () => { throw new Error('Active Health LCD unavailable'); };
  unavailable.tick(351, 100);
  await assert.rejects(pending, /unavailable/);
  assert.equal(unavailable.captures, 0);
  const aborted = liveCaptureFixture();
  const cancelled = captureAtHealthFrame(351, aborted.options);
  aborted.controller.abort();
  await assert.rejects(cancelled, /cancelled/);
  assert.equal(aborted.cancelled, 1);
  const stalled = liveCaptureFixture();
  await assert.rejects(captureAtHealthFrame(351, { ...stalled.options, timeoutMs: 5 }), /Timed out/);
  assert.equal(stalled.captures, 0); assert.equal(stalled.cancelled, 1);
});

test('phase gate rejects impossible reduced motion phases and allows live frame zero', async () => {
  const f = liveCaptureFixture(0);
  f.options.read = () => ({ healthTopLoopFrame: 0, healthElapsedMs: 100, reducedMotion: true });
  await assert.rejects(captureAtHealthFrame(351, f.options), /reduced motion/);
  const pending = captureAtHealthFrame(0, f.options);
  f.tick(0, 100);
  assert.equal((await pending).healthTopLoopFrame, 0);
  await assert.rejects(captureAtHealthFrame(720, f.options), /Invalid/);
});

const hudSample = { kind:'source-pose', evidence:'explicit test observation; not telemetry', networkMessage:'lau_connect0', netModeFrame:0, netAtnFrame:3, batteryFrame:4, walkCoinFrame:179.5, coins:42, steps:0 };
const hudQuery = sample => `?lcdElapsedMs=12000&lcdDate=2026-09-26&lcdHomeHudSample=${encodeURIComponent(JSON.stringify(sample))}`;

test('HOME HUD capture requires explicit complete provenance and loopback; never supplies a profile default', () => {
  assert.equal(lcdDownloadRequest('?lcdElapsedMs=0&lcdDate=2026-09-26').homeHudSample, undefined);
  const request = lcdDownloadRequest(hudQuery(hudSample), 'localhost');
  assert.deepEqual(request.homeHudSample, hudSample);
  assert.ok(Object.isFrozen(request.homeHudSample));
  const payload = JSON.parse(lcdDownloadPayload('home-pose', { homeHudSample:request.homeHudSample }));
  assert.deepEqual(payload.homeHudSample, hudSample);
  for (const host of [undefined, 'example.com']) assert.throws(() => lcdDownloadRequest(hudQuery(hudSample), host), /localhost/);
  for (const invalid of [null, [], {}, {...hudSample,evidence:''}, {...hudSample,coins:-1}, {...hudSample,batteryFrame:1.5}, {...hudSample,steps:'0'}, {...hudSample,extra:true}, {...hudSample,networkMessage:'Internet'}]) {
    assert.throws(() => lcdDownloadRequest(hudQuery(invalid), 'localhost'), /lcdHomeHudSample/);
  }
  assert.throws(() => lcdDownloadRequest(`${hudQuery(hudSample)}&lcdHealthFrame=327`, 'localhost'), /combined/);
  assert.equal(lcdDownloadRequest(`${hudQuery(hudSample)}&lcdBannerFrame=309`, 'localhost').bannerFrame, 309);
});

test('HOME HUD wiring is capture-only, records its sample, and restores live paint even on encoding failure', () => {
  const scene = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');
  const block = scene.slice(scene.indexOf('if(lcdCapture){const captureScreensAt='), scene.indexOf('Object.assign(host,{captureScreensAt})'));
  assert.match(block, /lcdHomeHudSample\(hudSample,window.location.hostname\)/);
  assert.match(block, /phase!=='home'/);
  assert.match(block, /try\{screens.paint\(state,date,elapsedMs,\{sampleCalendar:isoDate!==undefined,homeHudSample\}\)/);
  assert.match(block, /homeHudSample:homeHudSample\?\?null/);
  assert.match(block, /finally\{verificationBannerFrame=undefined;screens.paint\(state,new Date\(\),performance.now\(\)-start\)/);
});


test('capture transaction paints explicit sample once, records it, and restores live HUD after success or failure', () => {
  const scene = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');
  const code = scene.slice(scene.indexOf('const captureScreensAt='), scene.indexOf('Object.assign(host,{captureScreensAt})'));
  const compiled = ts.transpileModule(code, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  for (const fails of [false, true]) {
    const paints=[];
    const dependencies={disposed:false,firmwareAssets:{},state:{powered:true,system:{phase:'home',homeClock:{updateCount:1}}},window:{location:{hostname:'localhost'}},lcdHomeHudSample,
      screens:{paint(...args){paints.push(args);},nativeTop:{},bottom:{}},getHomeBannerHostView:()=>({status:'unsupported'}),bannerHost:{},cursorDiagnostic:()=>({}),reduced:false,
      encodeNativeLcdPair(){if(fails)throw new Error('encoding failed');return {top:'png',bottom:'png'};},start:0,topTexture:{},bottomTexture:{}};
    const capture = new Function(...Object.keys(dependencies), 'let verificationBannerFrame;'+compiled+';return captureScreensAt;')(...Object.values(dependencies));
    if(fails) assert.throws(()=>capture(12000,'2026-09-26',undefined,hudSample),/encoding failed/);
    else {
      const result=capture(12000,'2026-09-26',undefined,hudSample);
      assert.deepEqual(result.homeHudSample,hudSample);
      assert.equal(result.homeHudSampling,'verification-source-pose');
    }
    assert.equal(paints.length,2);
    assert.deepEqual(paints[0][3],{sampleCalendar:true,homeHudSample:hudSample});
    assert.equal(paints[1].length,3,'restoration supplies no verification sample');
    assert.equal(dependencies.topTexture.needsUpdate,true);
    assert.equal(dependencies.bottomTexture.needsUpdate,true);
    dependencies.state.system.phase='app';
    assert.throws(()=>capture(12000,'2026-09-26',undefined,hudSample),/active HOME/);
    assert.equal(paints.length,2,'rejected captures do not paint');
  }
});
