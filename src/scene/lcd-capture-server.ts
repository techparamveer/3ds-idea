import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const maxBodyBytes = 8 * 1024 * 1024;

export function localLcdExportAllowed(request: Request, root: string | undefined): boolean {
  if (!root || !isAbsolute(root)) return false;
  const url = new URL(request.url);
  if (!loopback.has(url.hostname) || url.searchParams.get('lcdCapture') !== '1') return false;
  if (request.headers.get('origin') !== url.origin) return false;
  const fetchSite = request.headers.get('sec-fetch-site');
  return fetchSite === null || fetchSite === 'same-origin';
}

function pngFromDataUrl(value: unknown, width: number, height: number): Buffer {
  if (typeof value !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('Invalid LCD PNG data URL');
  const png = Buffer.from(value.slice('data:image/png;base64,'.length), 'base64');
  if (png.length < 24 || !png.subarray(0, 8).equals(pngSignature) || png.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Invalid LCD PNG bytes');
  if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) throw new Error('LCD PNG has wrong native dimensions');
  return png;
}

export async function writeLocalLcdCapture(root: string, body: string) {
  if (!isAbsolute(root)) throw new Error('LCD output root must be absolute');
  if (Buffer.byteLength(body) > maxBodyBytes) throw new Error('LCD capture exceeds size limit');
  const capture: unknown = JSON.parse(body);
  if (!capture || typeof capture !== 'object') throw new Error('Invalid LCD capture');
  const value = capture as Record<string, unknown>;
  if (value.schema !== 'browser-native-lcd-capture-v1' || typeof value.scenario !== 'string' || !/^[a-z0-9-]{1,64}$/.test(value.scenario)) throw new Error('Invalid LCD capture identity');
  const dimensions = value.dimensions as {top?:{width?:number;height?:number};bottom?:{width?:number;height?:number}} | undefined;
  if (dimensions?.top?.width !== 400 || dimensions.top.height !== 240 || dimensions.bottom?.width !== 320 || dimensions.bottom.height !== 240) throw new Error('Invalid LCD capture dimensions');
  const upper = pngFromDataUrl(value.top, 400, 240);
  const lower = pngFromDataUrl(value.bottom, 320, 240);
  const directory = join(root, 'reference', 'scenario-matrix', 'v1', 'captures', value.scenario, 'browser');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'capture.json'), body);
  await writeFile(join(directory, 'upper.png'), upper);
  await writeFile(join(directory, 'lower.png'), lower);
  return { directory, bytes: Buffer.byteLength(body), sha256: createHash('sha256').update(body).digest('hex') };
}

export { maxBodyBytes };
