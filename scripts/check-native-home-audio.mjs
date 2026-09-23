/** Explicit private-resource conformance run; no firmware data or generated PCM enters Git. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { decodeNativeHomeMusicResources, createNativeHomeMusic } from '../src/os/native-home-audio/index.ts';
const [pack, reference, output] = process.argv.slice(2);
if (!pack || !reference || !output) throw new Error('Usage: node scripts/check-native-home-audio.mjs PRIVATE_PACK PRIVATE_REFERENCE PRIVATE_REPORT.json');
const manifest = JSON.parse(await fs.readFile(path.join(pack, 'music.json'), 'utf8'));
const files = new Map(await Promise.all(Object.keys(manifest.resources).map(async name => [name, new Uint8Array(await fs.readFile(path.join(pack, name)))])));
const resources = await decodeNativeHomeMusicResources(manifest, files);
const rejections = [];
async function rejects(name, change) {
  const m = structuredClone(manifest), f = new Map([...files].map(([k,v]) => [k,v.slice()]));
  change(m, f); await assert.rejects(decodeNativeHomeMusicResources(m, f)); rejections.push(name);
}
await rejects('wrong source', m => { m.archive.sha256 = '0'.repeat(64); });
await rejects('truncated PCM', (m,f) => { f.set('wave-3-0.pcm', f.get('wave-3-0.pcm').subarray(2)); });
await rejects('modified PCM digest', (m,f) => { f.get('wave-3-0.pcm')[0] ^= 1; });
await rejects('invalid wave loop', m => { m.waves['3:0'].loopStart = m.waves['3:0'].samples; });
await rejects('missing selected bank', m => { m.entries.music.banks = [2]; });
await rejects('unavailable program misrepresented', m => { m.banks['1'].availablePrograms.push(0); });
await rejects('incorrect arithmetic table', (m,f) => {
  f.get('tables.bin')[0] ^= 1; m.resources['tables.bin'].sha256 = createHash('sha256').update(f.get('tables.bin')).digest('hex');
});
await rejects('unsupported reachable command with valid delivery hash', (m,f) => {
  f.get('music.cseq')[m.entries.music.start] = 0xc8;
  m.resources['music.cseq'].sha256 = createHash('sha256').update(f.get('music.cseq')).digest('hex');
});
await rejects('unavailable program with valid delivery hash', (m,f) => {
  const blob = f.get('music.cseq'); blob.set([0x81,0,0x89,0,0,0], m.entries.music.start);
  m.resources['music.cseq'].sha256 = createHash('sha256').update(blob).digest('hex'); m.entries.music.reachableCommands = 2;
});
const ref = JSON.parse(await fs.readFile(path.join(reference, 'reference.json'), 'utf8'));
const sourceFiles = ['arithmetic.ts','dsp.ts','engine.ts','resources.ts','types.ts','index.ts'];
const engineSources = Object.fromEntries(await Promise.all(sourceFiles.map(async name => [name,
  createHash('sha256').update(await fs.readFile(new URL(`../src/os/native-home-audio/${name}`, import.meta.url))).digest('hex')])));
const report = { schema: 1, node: process.version, platform: process.platform, arch: process.arch,
  profile: manifest.profile.id, engineSources, validationRejections: rejections,
  checkerSha256: createHash('sha256').update(await fs.readFile(new URL(import.meta.url))).digest('hex'),
  packManifestSha256: createHash('sha256').update(await fs.readFile(path.join(pack, 'music.json'))).digest('hex'),
  referenceManifestSha256: createHash('sha256').update(await fs.readFile(path.join(reference, 'reference.json'))).digest('hex'), entries: {} };
// Input mutation, including while digest promises are pending, cannot change decoded resources.
const mutableManifest = structuredClone(manifest), mutableFiles = new Map([...files].map(([k,v]) => [k, v.slice()]));
const pending = decodeNativeHomeMusicResources(mutableManifest, mutableFiles);
mutableManifest.entries.music.volume = 0;
for (const bytes of mutableFiles.values()) bytes.fill(0);
const isolated = await pending;
for (const alias of ['music', 'music-resume']) {
  const pcm = await fs.readFile(path.join(reference, `${alias}.pcm`));
  const snapshots = new Map(JSON.parse(await fs.readFile(path.join(reference, `${alias}-states.json`), 'utf8')).map(x => [x.frame, x]));
  const player = createNativeHomeMusic(resources, alias), control = createNativeHomeMusic(isolated, alias);
  const digest = createHash('sha256'); let checkedStates = 0;
  for (let frame = 0; frame < ref.frames; frame++) {
    const result = player.renderFrame();
    assert.equal(result.startSample, frame * 160); assert.equal(result.pcm.length, 320);
    const bytes = Buffer.from(result.pcm.buffer, result.pcm.byteOffset, result.pcm.byteLength);
    const expected = pcm.subarray(frame * 640, (frame + 1) * 640);
    if (!bytes.equals(expected)) {
      let sample = 0; while (sample < 320 && bytes.readInt16LE(sample * 2) === expected.readInt16LE(sample * 2)) sample++;
      throw new Error(`${alias}: PCM differs at frame ${frame}, channel sample ${sample}: JS=${result.pcm[sample]} Python=${expected.readInt16LE(sample*2)}`);
    }
    digest.update(bytes);
    if (snapshots.has(frame)) {
      const actual = player.snapshot(), expectedState = snapshots.get(frame);
      try { assert.deepEqual(actual, { sample: expectedState.sample, state: expectedState.state }); }
      catch (error) { await fs.writeFile(output + '.state-failure.json', JSON.stringify({ alias, frame, actual, expected: expectedState }, null, 2)); throw error; }
      // Snapshot mutations must never feed back to rendering.
      actual.state.clock.fraction = -100; actual.state.player.active.length = 0;
      actual.state.tracks[0].state[0] = false;
      const active = actual.state.voices.find(v => v.state !== 0);
      if (active) { active.dsp.history[0] = 999; active.dsp.gains[0][0] = 999; active.envelope.level = 999; }
      checkedStates++;
    }
    if (frame < 128) assert.deepEqual(control.renderFrame().pcm, result.pcm, 'private decoded copies');
  }
  assert.equal(digest.digest('hex'), ref.entries[alias].pcmSha256);
  // Different transport groupings must produce the same complete PCM stream.
  const grouped = createNativeHomeMusic(resources, alias); let count = 0, index = 0; const sizes = [1, 7, 128, 3, 257];
  const groupedHash = createHash('sha256'); let previous;
  while (count < ref.frames) {
    const size = Math.min(sizes[index++ % sizes.length], ref.frames - count);
    for (let j = 0; j < size; j++) {
      const result = grouped.renderFrame(); assert.equal(result.startSample, count * 160);
      if (previous) assert.notEqual(result.pcm.buffer, previous.buffer, 'fresh output buffer');
      groupedHash.update(Buffer.from(result.pcm.buffer)); previous = result.pcm; count++;
    }
  }
  assert.equal(groupedHash.digest('hex'), ref.entries[alias].pcmSha256);
  // Measure rendering alone, with no hashing or per-frame diagnostic serialization.
  const bench = createNativeHomeMusic(resources, alias); for (let i = 0; i < 512; i++) bench.renderFrame();
  const batches = [];
  for (let batch = 0; batch < 8; batch++) {
    const cpu = process.cpuUsage(), start = performance.now();
    for (let i = 0; i < 1024; i++) bench.renderFrame();
    const usage = process.cpuUsage(cpu); batches.push({ frames: 1024, wallMs: performance.now() - start, cpuMs: (usage.user + usage.system) / 1000 });
  }
  const wallMs = batches.reduce((n, x) => n + x.wallMs, 0), cpuMs = batches.reduce((n, x) => n + x.cpuMs, 0);
  report.entries[alias] = { frames: ref.frames, samples: ref.frames * 160, exactPcmSha256: ref.entries[alias].pcmSha256,
    exactSnapshots: checkedStates, differentChunkGroupingExact: true, copiedSnapshots: true, privateResources: true,
    benchmark: { frames: 8192, wallMs, cpuMs, wallMsPerFrame: wallMs / 8192, cpuMsPerFrame: cpuMs / 8192,
      audioWallRatio: 8192 * 160 / 32728 / (wallMs / 1000), batches,
      limit: 'Node on this host; browser scheduling, GC tails and underrun behavior unverified' } };
  console.log(alias, JSON.stringify(report.entries[alias]));
}
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
