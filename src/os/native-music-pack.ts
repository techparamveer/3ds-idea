/** Fetch only the allowlisted HOME music delivery pack. Validation/synthesis live in the worker. */
export type NativeMusicRawPack = { manifest: unknown; files: { name: string; buffer: ArrayBuffer }[] };
const names = ['music.cseq', 'music-resume.cseq', 'tables.bin', ...Array.from({ length: 5 }, (_, i) => `wave-3-${i}.pcm`)];
const manifestLimit = 128 * 1024;
const resourceLimit = 256 * 1024;

export async function loadNativeMusicPack(manifestUrl: string, options: { signal?: AbortSignal; fetch?: typeof fetch } = {}): Promise<NativeMusicRawPack> {
  const base = new URL(manifestUrl, typeof location === 'undefined' ? 'http://localhost/' : location.href);
  if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Unsupported music pack URL');
  const controller = new AbortController(), signal = controller.signal;
  const cancel = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) cancel();
  else options.signal?.addEventListener('abort', cancel, { once: true });
  const fetchAsset = options.fetch ?? globalThis.fetch;
  async function read(url: URL, limit: number): Promise<Uint8Array> {
    signal.throwIfAborted();
    const response = await fetchAsset(url, { signal, redirect: 'error' });
    if (!response.ok) throw new Error(`Native music HTTP ${response.status}: ${url.pathname}`);
    const declared = response.headers.get('content-length');
    if (declared !== null && Number(declared) > limit) {
      await response.body?.cancel();
      throw new Error(`Native music resource exceeds size limit: ${url.pathname}`);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error(`Empty native music response: ${url.pathname}`);
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      for (;;) {
        signal.throwIfAborted();
        const { done, value } = await reader.read();
        signal.throwIfAborted();
        if (done) break;
        size += value.length;
        if (size > limit) throw new Error(`Native music resource exceeds size limit: ${url.pathname}`);
        chunks.push(value);
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  }
  try {
    const manifest: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await read(base, manifestLimit)));
    if (!manifest || typeof manifest !== 'object') throw new Error('Invalid native music manifest');
    const m = manifest as Record<string, unknown>;
    if (m.schema !== 1 || m.kind !== 'native-home-music' || !m.resources || typeof m.resources !== 'object' || Array.isArray(m.resources)) throw new Error('Invalid native music manifest');
    const records = m.resources as Record<string, { bytes?: unknown; sha256?: unknown }>;
    if (Object.keys(records).length !== names.length) throw new Error('Unexpected native music resource set');
    for (const name of names) {
      const record = records[name];
      if (!record || !Number.isSafeInteger(record.bytes) || (record.bytes as number) <= 0 || (record.bytes as number) > resourceLimit || typeof record.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(record.sha256)) throw new Error(`Invalid native music resource: ${name}`);
    }
    const files = await Promise.all(names.map(async name => {
      const expected = records[name].bytes as number;
      const bytes = await read(new URL(name, base), expected);
      if (bytes.length !== expected) throw new Error(`Truncated native music resource: ${name}`);
      return { name, buffer: bytes.buffer as ArrayBuffer };
    }));
    signal.throwIfAborted();
    return { manifest, files };
  } catch (error) { controller.abort(error); throw error; }
  finally { options.signal?.removeEventListener('abort', cancel); }
}
