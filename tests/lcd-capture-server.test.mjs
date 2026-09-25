import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';

const source = readFileSync(new URL('../src/scene/lcd-capture-server.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const serverModule = `data:text/javascript,${encodeURIComponent(js)}`;
const { localLcdExportAllowed, writeLocalLcdCapture } = await import(serverModule);
const routeSource = readFileSync(new URL('../src/app/api/verification/lcd-capture/route.ts', import.meta.url), 'utf8');
const routeJs = ts.transpileModule(routeSource.replace("'@/scene/lcd-capture-server'", JSON.stringify(serverModule)),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { POST } = await import(`data:text/javascript,${encodeURIComponent(routeJs)}`);

test('LCD export is closed without absolute root, loopback host, opt in and same origin', () => {
  const request = (url, origin, host, fetchSite) => new Request(url, { method: 'POST', headers: { origin, ...(host ? { host } : {}), ...(fetchSite ? { 'sec-fetch-site': fetchSite } : {}) } });
  const root = fileURLToPath(new URL('../', import.meta.url));
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://localhost:3000'), root), true);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://127.0.0.1:3000', '127.0.0.1:3000', 'same-origin'), root), true,
    'Next-normalized localhost URL retains the browser’s 127.0.0.1 authority in Host');
  assert.equal(localLcdExportAllowed(request('http://127.0.0.1:3000/api/verification/lcd-capture?lcdCapture=1', 'http://127.0.0.1:3000', '127.0.0.1:3000'), root), true);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://localhost:3000', 'localhost:3000'), root), true);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://[::1]:3000', '[::1]:3000'), root), true);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://localhost:3000'), undefined), false);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://localhost:3000'), 'relative'), false);
  assert.equal(localLcdExportAllowed(request('http://example.com/api/verification/lcd-capture?lcdCapture=1', 'http://example.com'), root), false);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture', 'http://localhost:3000'), root), false);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/other?lcdCapture=1', 'http://localhost:3000'), root), false);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://evil.example'), root), false);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://127.0.0.1:3000', 'localhost:3000'), root), false);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://127.0.0.1:3001', '127.0.0.1:3000'), root), false);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://evil.example', 'evil.example'), root), false);
  assert.equal(localLcdExportAllowed(request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', 'http://127.0.0.1:3000', '127.0.0.1:3000', 'cross-site'), root), false);
});

test('route admits normalized 127.0.0.1 requests but rejects host or Origin swaps before reading JSON', async () => {
  const previous = process.env.LCD_CAPTURE_OUTPUT_ROOT;
  process.env.LCD_CAPTURE_OUTPUT_ROOT = fileURLToPath(new URL('../', import.meta.url));
  const request = (origin, host) => new Request('http://localhost:3000/api/verification/lcd-capture?lcdCapture=1', {
    method: 'POST', headers: { origin, host, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }, body: '{}',
  });
  try {
    assert.equal((await POST(request('http://127.0.0.1:3000', '127.0.0.1:3000'))).status, 400,
      'a loopback 127 request reaches payload validation despite Next URL normalization');
    assert.equal((await POST(request('http://localhost:3000', 'localhost:3000'))).status, 400);
    assert.equal((await POST(request('http://127.0.0.1:3000', 'localhost:3000'))).status, 404);
    assert.equal((await POST(request('http://evil.example', 'evil.example'))).status, 404);
  } finally {
    if (previous === undefined) delete process.env.LCD_CAPTURE_OUTPUT_ROOT;
    else process.env.LCD_CAPTURE_OUTPUT_ROOT = previous;
  }
});

test('LCD export writes exact JSON and native PNGs only inside the selected scenario', async () => {
  const root = await mkdtemp(fileURLToPath(new URL('../.lcd-capture-test-', import.meta.url)));
  const png = async (width, height, rgba) => {
    const pixels = Buffer.alloc(width * height * 4);
    for (let i = 0; i < pixels.length; i += 4) pixels.set(rgba, i);
    return `data:image/png;base64,${(await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer()).toString('base64')}`;
  };
  try {
    const capture = {
      schema: 'browser-native-lcd-capture-v1', scenario: 'home-idle', elapsedMs: 8483.333,
      dimensions: { top: { width: 400, height: 240 }, bottom: { width: 320, height: 240 } },
      top: await png(400, 240, [12, 34, 56, 255]), bottom: await png(320, 240, [78, 90, 123, 255]),
    };
    const body = JSON.stringify(capture);
    const result = await writeLocalLcdCapture(root, body);
    assert.equal(result.directory, join(root, 'reference', 'scenario-matrix', 'v1', 'captures', 'home-idle', 'browser'));
    assert.equal(await readFile(join(result.directory, 'capture.json'), 'utf8'), body);
    for (const [name, width, height] of [['upper.png', 400, 240], ['lower.png', 320, 240]]) {
      const metadata = await sharp(await readFile(join(result.directory, name))).metadata();
      assert.deepEqual([metadata.width, metadata.height], [width, height]);
    }
    await assert.rejects(writeLocalLcdCapture(root, JSON.stringify({ ...capture, scenario: '../escape' })), /identity/);
    await assert.rejects(writeLocalLcdCapture(root, JSON.stringify({ ...capture, top: capture.bottom })), /native dimensions/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
