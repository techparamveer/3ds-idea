/** Loads explicitly supplied extracted resources. Does not fetch firmware by default. */
export type ResourceKind = 'layout' | 'animation' | 'font' | 'message' | 'model' | 'texture' | 'archive' | 'unknown';
export type ResourceRecord = { kind: ResourceKind; size: number; sha256: string; sections?: { tag: string; offset: number; size: number }[] };
export type ResourceInventory = { schema: 1; sourceSha256: string; decodedSha256: string; resources: Record<string, ResourceRecord> };
const hashPattern = /^[a-f0-9]{64}$/;
const kinds = new Set(['layout', 'animation', 'font', 'message', 'model', 'texture', 'archive', 'unknown']);

export function validateInventory(value: unknown): ResourceInventory {
  if (!value || typeof value !== 'object') throw new Error('Missing resource inventory');
  const inventory = value as ResourceInventory;
  if (inventory.schema !== 1 || !hashPattern.test(inventory.sourceSha256) || !hashPattern.test(inventory.decodedSha256) ||
      !inventory.resources || typeof inventory.resources !== 'object' || Array.isArray(inventory.resources)) throw new Error('Invalid resource inventory');
  const entries = Object.entries(inventory.resources);
  if (entries.length > 65536) throw new Error('Excessive resource count');
  for (const [path, record] of entries) {
    if (path.split('/').some(part => !part || part === '.' || part === '..' || /[\\:\x00-\x1f]/.test(part)))
      throw new Error('Unsafe resource path');
    if (!record || !kinds.has(record.kind) || !Number.isSafeInteger(record.size) || record.size < 0 || record.size > 64 * 1024 * 1024 ||
        !hashPattern.test(record.sha256)) throw new Error('Invalid resource metadata');
    if (record.sections !== undefined) {
      if (!Array.isArray(record.sections)) throw new Error('Invalid sections');
      let end = 0;
      for (const section of record.sections) {
        if (!Number.isSafeInteger(section.offset) || !Number.isSafeInteger(section.size) || section.offset < end ||
            section.size < 8 || section.offset + section.size > record.size || typeof section.tag !== 'string' || section.tag.length !== 4)
          throw new Error('Invalid resource section');
        end = section.offset + section.size;
      }
    }
  }
  return inventory;
}

/** Size is checked during streaming, not after an unbounded response allocation. */
async function boundedBytes(response: Response, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  if (!response.ok || !response.body) throw new Error(`Resource HTTP ${response.status}`);
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) throw new Error('Resource exceeds size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel();
    throw error;
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) { result.set(chunk, at); at += chunk.byteLength; }
  return result;
}

export async function loadResourceArchive(inventoryUrl: string, fetcher: typeof fetch = fetch) {
  // Absolute URL keeps this module usable in both a browser and offline verification.
  const url = new URL(inventoryUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Expected HTTP resource URL');
  const bytes = await boundedBytes(await fetcher(url.href), 8 * 1024 * 1024);
  const inventory = validateInventory(JSON.parse(new TextDecoder().decode(bytes)));
  return {
    inventory,
    async read(path: string): Promise<Uint8Array<ArrayBuffer>> {
      if (!Object.hasOwn(inventory.resources, path)) throw new Error('Resource not in inventory');
      const record = inventory.resources[path];
      const resourceUrl = new URL(`resources/${path.split('/').map(encodeURIComponent).join('/')}`, url);
      const data = await boundedBytes(await fetcher(resourceUrl.href), record.size);
      if (data.byteLength !== record.size) throw new Error('Resource length mismatch');
      const digest = await crypto.subtle.digest('SHA-256', data);
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (hash !== record.sha256) throw new Error('Resource hash mismatch');
      return data;
    },
  };
}
