import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';

const source = readFileSync(new URL('../src/scene/lcd-capture.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { lcdCaptureEnabled, encodeNativeLcdPair } = await import(`data:text/javascript,${encodeURIComponent(js)}`);

test('production LCD capture requires loopback and explicit opt in', () => {
  const location = (hostname, search) => ({ hostname, search });
  assert.equal(lcdCaptureEnabled(location('localhost', '?lcdCapture=1'), false), true);
  assert.equal(lcdCaptureEnabled(location('127.0.0.1', '?lcdCapture=1'), false), true);
  assert.equal(lcdCaptureEnabled(location('example.com', '?lcdCapture=1'), false), false);
  assert.equal(lcdCaptureEnabled(location('localhost', ''), false), false);
  assert.equal(lcdCaptureEnabled(location('example.com', ''), true), true);
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
