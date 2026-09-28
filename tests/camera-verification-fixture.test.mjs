import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cameraVerificationMedia, portfolioMedia } from '../src/os/portfolio-media.ts';
import { GET } from '../src/app/api/verification/camera-photo/[number]/route.ts';

test('Camera fixture is explicit, local and leaves production portfolio media intact', () => {
  const location = (hostname, search) => ({ hostname, search });
  assert.equal(cameraVerificationMedia(undefined), undefined);
  assert.equal(cameraVerificationMedia(location('localhost', '')), undefined);
  assert.equal(cameraVerificationMedia(location('example.com', '?cameraFixture=hni')), undefined);
  const fixture = cameraVerificationMedia(location('127.0.0.1', '?cameraFixture=hni'));
  assert.deepEqual(fixture.folders.flatMap(folder => folder.photos.map(photo => photo.id)), ['HNI_0001', 'HNI_0002']);
  assert.equal(portfolioMedia.folders.flatMap(folder => folder.photos).length, 5);
  assert.ok(portfolioMedia.folders.every(folder => folder.photos.every(photo => photo.src.startsWith('/portfolio/'))));
});

test('private originals are served only to the explicit local fixture page', async () => {
  const root = await mkdtemp(join(tmpdir(), 'camera-sdmc-'));
  const previous = process.env.CAMERA_FIXTURE_SDMC_ROOT;
  try {
    const folder = join(root, 'DCIM', '100NIN03');
    await mkdir(folder, { recursive: true });
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    await writeFile(join(folder, 'HNI_0001.JPG'), bytes);
    process.env.CAMERA_FIXTURE_SDMC_ROOT = root;
    const request = (referer) => new Request('http://127.0.0.1:3000/api/verification/camera-photo/1?cameraFixture=hni', {
      headers: { host: '127.0.0.1:3000', referer },
    });
    const context = { params: Promise.resolve({ number: '1' }) };
    const good = await GET(request('http://127.0.0.1:3000/?cameraFixture=hni'), context);
    assert.equal(good.status, 200);
    assert.deepEqual(Buffer.from(await good.arrayBuffer()), bytes);
    assert.equal((await GET(request('http://127.0.0.1:3000/'), context)).status, 404);
    assert.equal((await GET(request('http://evil.example/?cameraFixture=hni'), context)).status, 404);
    assert.equal((await GET(request('http://127.0.0.1:3000/?cameraFixture=hni'), { params: Promise.resolve({ number: '3' }) })).status, 404);
  } finally {
    if (previous === undefined) delete process.env.CAMERA_FIXTURE_SDMC_ROOT;
    else process.env.CAMERA_FIXTURE_SDMC_ROOT = previous;
    await rm(root, { recursive: true, force: true });
  }
});
