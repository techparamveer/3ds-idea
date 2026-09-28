import { getAppModule } from './app-registry.ts';
import { initialSharedData } from './stock-apps.ts';
import { createPortfolioState, restoreSettings, saveSettings } from './system.ts';
import { objectValue, type AppState, type JsonValue, type SaveRecord } from './app-types.ts';

export const FIRMWARE_DATABASE = 'paramveer-3ds-firmware';
export const FIRMWARE_DATABASE_VERSION = 2;
const MAX_RECORD_BYTES = 2 * 1024 * 1024;
export type StorageFailure = 'unavailable' | 'blocked' | 'quota' | 'corrupt' | 'closed' | 'unknown';
export class FirmwareStorageError extends Error {
  readonly code: StorageFailure;
  constructor(code: StorageFailure, cause?: unknown) { super(`Local storage: ${code}`, { cause }); this.name = 'FirmwareStorageError'; this.code = code; }
}
export type MediaMetadata = { id: string; name: string; kind: 'photo' | 'audio'; mime: string; bytes: number; createdAt: number };
export type StoredMedia = { version: 1; metadata: MediaMetadata; blob: Blob };
export type RestoredRuntime = { shared: AppState; saves: Record<string, SaveRecord>; preferences: string | null; issues: string[] };
export type FirmwareStorage = {
  load(): Promise<RestoredRuntime>;
  saveRecord(key: string, record: SaveRecord): Promise<void>;
  saveSharedAndDeleteMedia(record: SaveRecord, ids: readonly string[]): Promise<void>;
  savePreferences(raw: string): Promise<void>;
  putMedia(metadata: Omit<MediaMetadata, 'bytes' | 'mime'>, blob: Blob): Promise<MediaMetadata>;
  getMedia(id: string): Promise<StoredMedia | null>;
  deleteMedia(id: string): Promise<void>;
  dispose(): void;
};
function jsonValue(value: unknown, depth = 0): value is JsonValue {
  if (depth > 48) return false;
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 20000 && value.every(item => jsonValue(item, depth + 1));
  if (!objectValue(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.entries(value).every(([key, item]) => !['__proto__', 'constructor', 'prototype'].includes(key) && jsonValue(item, depth + 1));
}
export function validateSaveRecord(value: unknown): value is SaveRecord {
  if (!objectValue(value) || !Number.isSafeInteger(value.version) || Number(value.version) < 1 || !objectValue(value.data) || !jsonValue(value.data)) return false;
  return JSON.stringify(value).length <= MAX_RECORD_BYTES;
}
export function restoreSharedData(value: unknown): AppState {
  const defaults = initialSharedData();
  if (!objectValue(value) || !jsonValue(value)) return defaults;
  for (const [key, fallback] of Object.entries(defaults)) {
    if (Array.isArray(fallback) && Array.isArray(value[key])) {
      const restored=(value[key] as JsonValue[]).filter(objectValue).slice(0,4096);
      // An explicit saved empty list is user state, even though new profiles
      // start with the isolated reference fixture.
      defaults[key]=restored;
    }
    else if (objectValue(fallback) && objectValue(value[key])) {
      const incoming = value[key] as AppState;
      defaults[key] = { ...fallback };
      for (const [field, baseline] of Object.entries(fallback)) {
        const entry = incoming[field];
        if (entry !== undefined && (baseline === null ? entry === null || typeof entry === 'string' : Array.isArray(baseline) ? Array.isArray(entry) : typeof entry === typeof baseline)) (defaults[key] as AppState)[field] = entry;
      }
    }
  }
  if (objectValue(value.activity)) defaults.activity = Object.fromEntries(Object.entries(value.activity).filter(([id, item]) => getAppModule(id) && objectValue(item)).map(([id, item]) => {
    const entry = item as AppState;
    return [id, { title: getAppModule(id)!.descriptor.title, launches: typeof entry.launches === 'number' ? Math.max(0, Math.floor(entry.launches)) : 0, seconds: typeof entry.seconds === 'number' ? Math.max(0, entry.seconds) : 0 }];
  }));
  return defaults;
}
function preferences(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > MAX_RECORD_BYTES) return null;
  try {
    const parsed: unknown = JSON.parse(raw); if (!objectValue(parsed) || !objectValue(parsed.layout)) return null;
    const initial = createPortfolioState(), restored = restoreSettings(initial, raw);
    return restored === initial ? null : saveSettings(restored);
  } catch { return null; }
}
function failure(error: unknown): FirmwareStorageError {
  if (error instanceof FirmwareStorageError) return error;
  const name = error instanceof Error || error instanceof DOMException ? error.name : '';
  return new FirmwareStorageError(name === 'QuotaExceededError' ? 'quota' : name === 'InvalidStateError' ? 'closed' : name === 'SecurityError' ? 'unavailable' : 'unknown', error);
}
function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { value.onsuccess = () => resolve(value.result); value.onerror = () => reject(value.error); });
}
function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new FirmwareStorageError('unknown')); tx.onerror = () => {}; });
}
function validMedia(value: unknown): value is StoredMedia {
  if (!value || typeof value !== 'object') return false;
  const media = value as StoredMedia, m = media.metadata;
  return media.version === 1 && !!m && typeof m.id === 'string' && typeof m.name === 'string' && ['photo', 'audio'].includes(m.kind) && media.blob instanceof Blob && m.bytes === media.blob.size && m.mime === media.blob.type && Number.isFinite(m.createdAt);
}
/** Database creation never prompts for devices. The old localStorage value is copied once, never deleted. */
export async function openFirmwareStorage(options: { indexedDB?: IDBFactory; databaseName?: string; legacyPreferences?: string | null; maxMediaBytes?: number; maxItemBytes?: number } = {}): Promise<FirmwareStorage> {
  const factory = options.indexedDB ?? globalThis.indexedDB;
  if (!factory) throw new FirmwareStorageError('unavailable');
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    let settled = false;
    const opening = factory.open(options.databaseName ?? FIRMWARE_DATABASE, FIRMWARE_DATABASE_VERSION);
    opening.onupgradeneeded = () => {
      for (const name of ['saves', 'meta', 'media']) if (!opening.result.objectStoreNames.contains(name)) opening.result.createObjectStore(name);
    };
    opening.onblocked = () => { settled = true; reject(new FirmwareStorageError('blocked')); };
    opening.onerror = () => { settled = true; reject(failure(opening.error)); };
    opening.onsuccess = () => { if (settled) opening.result.close(); else resolve(opening.result); };
  }).catch(error => { throw failure(error); });
  let closed = false;
  db.onversionchange = () => { closed = true; db.close(); };
  async function run<T>(stores: string[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => Promise<T>): Promise<T> {
    if (closed) throw new FirmwareStorageError('closed');
    let tx: IDBTransaction | undefined, done: Promise<void> | undefined;
    try {
      tx = db.transaction(stores, mode); done = transactionDone(tx); void done.catch(() => {});
      const result = await work(tx); await done; return result;
    } catch (error) {
      try { tx?.abort(); } catch {}
      await done?.catch(() => {}); throw failure(error);
    }
  }
  const api: FirmwareStorage = {
    async load() {
      return run(['saves', 'meta'], 'readonly', async tx => {
        const source = tx.objectStore('saves');
        const [keys, records, pref] = await Promise.all([request(source.getAllKeys()), request(source.getAll()), request(tx.objectStore('meta').get('preferences'))]);
        const result: RestoredRuntime = { shared: initialSharedData(), saves: {}, preferences: null, issues: [] };
        records.forEach((value, i) => {
          const key = String(keys[i]);
          if (!validateSaveRecord(value)) { result.issues.push(`corrupt:${key}`); return; }
          if (key === '@shared') {
            if (value.version === 1) result.shared = restoreSharedData(value.data); else result.issues.push(`version:${key}`);
            return;
          }
          const module = getAppModule(key); if (!module) { result.issues.push(`unknown:${key}`); return; }
          try {
            const data = module.migrate(value.data, value.version);
            if (data && validateSaveRecord({ version: module.descriptor.saveVersion, data })) result.saves[key] = { version: module.descriptor.saveVersion, data };
            else result.issues.push(`version:${key}`);
          } catch { result.issues.push(`corrupt:${key}`); }
        });
        if (pref !== undefined) {
          result.preferences = pref?.version === 1 ? preferences(pref.data) : null;
          if (!result.preferences) result.issues.push('corrupt:preferences');
        }
        return result;
      });
    },
    async saveRecord(key, record) {
      if ((key !== '@shared' && !getAppModule(key)) || !validateSaveRecord(record)) throw new FirmwareStorageError('corrupt');
      await run(['saves'], 'readwrite', tx => request(tx.objectStore('saves').put(record, key)).then(() => {}));
    },
    async saveSharedAndDeleteMedia(record, ids) {
      if (!validateSaveRecord(record) || record.version !== 1 || !Array.isArray(ids) ||
          ids.some(id => typeof id !== 'string' || !id || id.length > 128)) throw new FirmwareStorageError('corrupt');
      // Refuse to delete a Blob still referenced by either collection.
      const removed = new Set(ids);
      for (const collection of ['photos', 'sounds']) {
        const items = record.data[collection];
        if (!Array.isArray(items) || items.some(item => objectValue(item) && typeof item.id === 'string' && removed.has(item.id)))
          throw new FirmwareStorageError('corrupt');
      }
      await run(['saves', 'media'], 'readwrite', async tx => {
        await Promise.all([
          request(tx.objectStore('saves').put(record, '@shared')),
          ...[...removed].map(id => request(tx.objectStore('media').delete(id))),
        ]);
      });
    },
    async savePreferences(raw) {
      const data = preferences(raw); if (!data) throw new FirmwareStorageError('corrupt');
      await run(['meta'], 'readwrite', tx => request(tx.objectStore('meta').put({ version: 1, data }, 'preferences')).then(() => {}));
    },
    async putMedia(input, blob) {
      if (!input.id || input.id.length > 128 || !input.name || input.name.length > 256 || !['photo', 'audio'].includes(input.kind) || !Number.isFinite(input.createdAt) || !(blob instanceof Blob) || !blob.type.startsWith(input.kind === 'photo' ? 'image/' : 'audio/')) throw new FirmwareStorageError('corrupt');
      if (blob.size > (options.maxItemBytes ?? 32 * 1024 * 1024)) throw new FirmwareStorageError('quota');
      const metadata: MediaMetadata = { ...input, bytes: blob.size, mime: blob.type };
      await run(['media'], 'readwrite', async tx => {
        const store = tx.objectStore('media'), existing = await request(store.getAll());
        const total = existing.reduce((sum, item) => sum + (validMedia(item) && item.metadata.id !== input.id ? item.blob.size : 0), blob.size);
        if (total > (options.maxMediaBytes ?? 128 * 1024 * 1024)) throw new FirmwareStorageError('quota');
        await request(store.put({ version: 1, metadata, blob } satisfies StoredMedia, input.id));
      });
      return metadata;
    },
    async getMedia(id) {
      const value = await run(['media'], 'readonly', tx => request(tx.objectStore('media').get(id)));
      if (value === undefined) return null;
      if (!validMedia(value)) throw new FirmwareStorageError('corrupt');
      return value;
    },
    async deleteMedia(id) { await run(['media'], 'readwrite', tx => request(tx.objectStore('media').delete(id)).then(() => {})); },
    dispose() { if (!closed) { closed = true; db.close(); } },
  };
  try {
    await run(['meta'], 'readwrite', async tx => {
      const meta = tx.objectStore('meta');
      const [migrated, current] = await Promise.all([request(meta.get('legacy-preferences-v1')), request(meta.get('preferences'))]);
      if (!migrated) {
        const data = preferences(options.legacyPreferences);
        if (current === undefined && data) await request(meta.put({ version: 1, data }, 'preferences'));
        await request(meta.put({ version: 1, imported: Boolean(data) }, 'legacy-preferences-v1'));
      }
    });
  } catch (error) { api.dispose(); throw error; }
  return api;
}
