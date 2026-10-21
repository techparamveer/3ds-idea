#!/usr/bin/env node
// Hosts that clone without Git LFS (Vercel by default) copy the 132-byte
// pointer for the packed console GLB. Three.js then parses "version https://..."
// as JSON and the page stays on the static preview fallback.
// This keeps `npm run build` from shipping that pointer.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GLB_MAGIC = 0x46546c67;

const delivery = await readFile(join(root, 'src/scene/model-delivery.ts'), 'utf8');
const url = delivery.match(/PACKED_MODEL_URL = '([^']+)'/)?.[1];
if (!url) throw new Error('PACKED_MODEL_URL is missing from src/scene/model-delivery.ts');
const packedPath = join(root, 'public', url.replace(/^\//, ''));

const bytes = await readFile(packedPath);
if (isGlb(bytes)) {
  console.log(`packed model ready (${bytes.length} bytes)`);
  process.exit(0);
}

const pointer = parseLfsPointer(bytes);
if (!pointer) {
  throw new Error(`${packedPath} is neither a GLB nor a Git LFS pointer`);
}

console.log(`materializing packed model from Git LFS (${pointer.size} bytes)`);
const model = await downloadLfsObject(pointer);
if (!isGlb(model)) throw new Error('downloaded packed model is not a GLB');
const hash = createHash('sha256').update(model).digest('hex');
if (hash !== pointer.oid) throw new Error(`packed model sha256 ${hash} != ${pointer.oid}`);
if (model.length !== pointer.size) throw new Error(`packed model size ${model.length} != ${pointer.size}`);
await writeFile(packedPath, model);
console.log(`wrote ${url} (${model.length} bytes)`);

function isGlb(buf) {
  return buf.length >= 12 && buf.readUInt32LE(0) === GLB_MAGIC;
}

function parseLfsPointer(buf) {
  if (buf.length > 1024) return null;
  const text = buf.toString('utf8');
  if (!text.startsWith('version https://git-lfs.github.com/spec/v1')) return null;
  const oid = text.match(/^oid sha256:([a-f0-9]{64})$/m)?.[1];
  const size = Number(text.match(/^size (\d+)$/m)?.[1]);
  if (!oid || !Number.isInteger(size) || size <= 0) return null;
  return { oid, size };
}

async function downloadLfsObject({ oid, size }) {
  const owner = process.env.VERCEL_GIT_REPO_OWNER || 'techparamveer';
  const repo = process.env.VERCEL_GIT_REPO_SLUG || '3ds-idea';
  const batch = await fetch(`https://github.com/${owner}/${repo}.git/info/lfs/objects/batch`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.git-lfs+json',
      'Content-Type': 'application/vnd.git-lfs+json',
    },
    body: JSON.stringify({
      operation: 'download',
      transfers: ['basic'],
      objects: [{ oid, size }],
    }),
  });
  if (!batch.ok) {
    throw new Error(`Git LFS batch failed (${batch.status}): ${await batch.text()}`);
  }
  const body = await batch.json();
  const href = body.objects?.[0]?.actions?.download?.href;
  if (!href) {
    throw new Error(`Git LFS batch had no download URL: ${JSON.stringify(body)}`);
  }
  const file = await fetch(href);
  if (!file.ok) throw new Error(`Git LFS download failed (${file.status})`);
  return Buffer.from(await file.arrayBuffer());
}
