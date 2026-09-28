import { decodeNativePng } from './native-png.ts';
import type { NativePixels } from './native-layout';

type Source = { titleId: string; path: string; sha256: string; contentIndex?: number; contentId?: string };
export type NotesMetadataSelection = Readonly<{
  titleId: string; description: string; source: Readonly<Source>;
  iconUrl: string; iconSha256: string; iconSize: number;
}>;
export type NotesTitleMetadata = { selection: NotesMetadataSelection; icon: NativePixels; dispose(): void };
export type NotesMetadataResult = { status: 'ready'; metadata: NotesTitleMetadata } | { status: 'unavailable'; reason: 'unsupported-title' | 'missing-metadata' | 'unusable-description' };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const hash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const own = (v: Record<string, unknown>, k: string) => Object.hasOwn(v, k) ? v[k] : undefined;
const supported = new Set(['0004001000022000','0004001000022300','0004001000022400','0004001000022500','0004001000022900','0004001000022a00','0004001000022b00','000400100002c100']);
const notesCode = '8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6';

/** Only the eight audited SMDH conversions are accepted. A HOME label is never
 * substituted for an absent/placeholder long description. No request is made
 * for firmware packages, executables or the original SMDH. */
export function selectNotesMetadata(raw: unknown, titleId: string): NotesMetadataSelection | Exclude<NotesMetadataResult, { status: 'ready' }> {
  if (!supported.has(titleId)) return { status: 'unavailable', reason: 'unsupported-title' };
  if (!record(raw) || raw.schema !== 1 || raw.firmware !== '10.7.0-32E' || raw.region !== 'EUR' || raw.locale !== 'EU_English' || !record(raw.titles) || !record(raw.resources)) throw Error('Invalid Notes metadata manifest');
  if (Array.isArray(raw.excludedTitles) && raw.excludedTitles.includes(titleId)) return { status: 'unavailable', reason: 'unsupported-title' };
  const title = own(raw.titles, titleId);
  if (!record(title) || title.longDescription === undefined || title.notesIcon === undefined) return { status: 'unavailable', reason: 'missing-metadata' };
  const source = title.longDescriptionSource, text = title.longDescriptionConversion, icon = title.notesIconConversion;
  if (title.titleId !== titleId || title.kind !== 'app' || typeof title.longDescription !== 'string' || title.longDescription.length > 127 || title.longDescription.includes('\0') ||
      !record(source) || source.titleId !== titleId || source.path !== 'ExeFS/icon' || !hash(source.sha256) ||
      ((source.contentIndex !== undefined || source.contentId !== undefined) && (!Number.isInteger(source.contentIndex) || Number(source.contentIndex) < 0 || Number(source.contentIndex) > 65535 || typeof source.contentId !== 'string' || !/^[a-f0-9]{8}$/.test(source.contentId))) ||
      !record(text) || text.name !== 'smdh-notes-english-description' || text.version !== 1 || text.languageIndex !== 1 || text.fieldOffset !== 0x288 || text.maxCodeUnits !== 127 || !hash(text.scriptSha256) ||
      !record(icon) || icon.name !== 'notes-smdh-large-icon' || icon.version !== 1 || icon.width !== 64 || icon.height !== 64 || icon.codeSha256 !== notesCode || icon.routineStart !== '0x106258' || icon.routineEndExclusive !== '0x1066a4' || icon.undefinedTexels !== 'transparent-native-uninitialized-masked-region' || !hash(icon.scriptSha256) ||
      title.notesIcon !== `icons/notes/${titleId}.png`) throw Error('Invalid Notes SMDH conversion identity');
  const resource = own(raw.resources, title.notesIcon as string);
  if (!record(resource) || resource.kind !== 'title-icon' || !hash(resource.sha256) || !Number.isInteger(resource.size) || Number(resource.size) <= 0 || Number(resource.size) > 65536 || !Array.isArray(resource.sources) || resource.sources.length !== 1) throw Error('Invalid Notes icon resource');
  const iconSource = resource.sources[0];
  if (!record(iconSource) || ['titleId','path','sha256','contentIndex','contentId'].some(key => iconSource[key] !== source[key])) throw Error('Notes description/icon source mismatch');
  if (!title.longDescription.trim() || title.longDescription === '???') return { status: 'unavailable', reason: 'unusable-description' };
  return Object.freeze({ titleId, description: title.longDescription, source: Object.freeze({ titleId, path: 'ExeFS/icon', sha256: source.sha256,
    ...(source.contentId !== undefined ? { contentId: source.contentId as string, contentIndex: source.contentIndex as number } : {}) }),
    iconUrl: title.notesIcon as string, iconSha256: resource.sha256, iconSize: resource.size as number });
}

export async function loadNotesTitleMetadata(manifestUrl: string, titleId: string, signal: AbortSignal): Promise<NotesMetadataResult> {
  signal.throwIfAborted();
  if (!supported.has(titleId)) return { status: 'unavailable', reason: 'unsupported-title' };
  const base = new URL(manifestUrl, typeof window === 'undefined' ? undefined : window.location.href);
  const response = await fetch(base, { signal });
  if (!response.ok) throw Error(`Notes metadata HTTP ${response.status}`);
  const selected = selectNotesMetadata(await response.json(), titleId); signal.throwIfAborted();
  if ('status' in selected) return selected;
  const image = await fetch(new URL(selected.iconUrl, base), { signal });
  if (!image.ok) throw Error(`Notes icon HTTP ${image.status}`);
  const bytes = new Uint8Array(await image.arrayBuffer()); signal.throwIfAborted();
  if (bytes.length !== selected.iconSize) throw Error('Notes icon size differs');
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), v => v.toString(16).padStart(2, '0')).join('');
  signal.throwIfAborted(); if (digest !== selected.iconSha256) throw Error('Notes icon hash differs');
  const icon = await decodeNativePng(bytes, { width: 64, height: 64 }, signal); signal.throwIfAborted();
  let disposed = false;
  return { status: 'ready', metadata: { selection: selected, icon, dispose() { if (disposed) return; disposed = true; icon.data = new Uint8ClampedArray(0); } } };
}
