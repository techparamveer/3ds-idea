import { apps } from './apps.ts';
import { getHomeFolderIdentities, moveHomeFolderIdentity } from './home-folder-identity.ts';
import { enterHomeFolder, leaveHomeFolder, selectHomeSlot, remapHomeFolderViews, getHomeNavigation, writeHomeNavigation, settleHomeNavigation } from './home-navigation.ts';
import { getTitle, homeTitles, retiredHomeTitleIds } from './app-registry.ts';
import { FIRST_FOLDER_NUMBER, LAST_FOLDER_NUMBER, isFolder, MAX_FOLDERS, SLOT_COUNT, type MenuState } from './state.ts';

export const FOLDER_SLOT_COUNT = 60;
export type HomeLocation = { folder: number | null; slot: number };
export type FolderLayouts = Record<number, Record<number, string>>;
export type HomeItem = { kind: 'app'; id: string } | { kind: 'folder'; label: string };
export const homeContainer = (state: MenuState): number | null => state.opened ? state.selected : null;
/** Shared child/root lookup for hit testing, banners, icons and launching. */
export function homeSlotAppId(state: MenuState, slot: number, folder = homeContainer(state)): string | undefined {
  return folder === null ? state.system?.layout[slot] : state.system?.folderLayouts?.[folder]?.[slot];
}
export function homeItemAt(state: MenuState, location: HomeLocation): HomeItem | null {
  const id = homeSlotAppId(state, location.slot, location.folder);
  return id ? { kind: 'app', id } : location.folder === null && isFolder(location.slot, state) ? { kind: 'folder', label: state.folders[location.slot] } : null;
}
export const canEnterFolder = (id: string) => !['system-settings', 'eshop', 'game-card'].includes(id);
export const folderHasItems = (state: MenuState, folder: number) => Object.keys(state.system?.folderLayouts?.[folder] ?? {}).length > 0;
export function validHomeLocation(state: MenuState, location: HomeLocation): boolean {
  return Number.isInteger(location.slot) && location.slot >= 0 && location.slot < (location.folder === null ? SLOT_COUNT : FOLDER_SLOT_COUNT) && (location.folder === null || Number.isInteger(location.folder) && isFolder(location.folder, state));
}
export const sameHomeLocation = (a: HomeLocation | null, b: HomeLocation | null) => !!a && !!b && a.folder === b.folder && a.slot === b.slot;
export function selectHomeLocation(state: MenuState, location: HomeLocation): MenuState {
  return selectHomeSlot(location.folder === null ? leaveHomeFolder(state) : enterHomeFolder(state, location.folder), location.slot);
}
/** Resolves a folder-icon drop to its first free child slot; no layout is changed here. */
export function resolveHomeDrop(state: MenuState, from: HomeLocation, target: HomeLocation): HomeLocation | null {
  if (!state.system || !validHomeLocation(state, from) || !validHomeLocation(state, target)) return null;
  const item = homeItemAt(state, from); if (!item) return null;
  if (sameHomeLocation(from, target)) return target;
  if (item.kind === 'folder') return target.folder === null ? target : null;
  let to = target;
  if (to.folder === null && isFolder(to.slot, state)) {
    if (!canEnterFolder(item.id)) return null;
    if (from.folder === to.slot) return from;
    const contents = state.system.folderLayouts[to.slot] ?? {};
    const slot = Array.from({ length: FOLDER_SLOT_COUNT }, (_, index) => index).find(index => !contents[index]);
    if (slot === undefined) return null;
    to = { folder: to.slot, slot };
  }
  if (to.folder !== null && !canEnterFolder(item.id)) return null;
  const displaced = homeSlotAppId(state, to.slot, to.folder);
  if (from.folder !== null && displaced && !canEnterFolder(displaced)) return null;
  return to;
}
/** Atomic placement: folder identity, labels and children travel together; apps swap without duplication. */
export function moveHomeItem(state: MenuState, from: HomeLocation, target: HomeLocation): MenuState {
  const s = state.system, to = resolveHomeDrop(state, from, target);
  if (!s || !to || sameHomeLocation(from, to)) return state;
  const item = homeItemAt(state, from)!;
  const layout = { ...s.layout }, folders = { ...state.folders }, folderLayouts = { ...s.folderLayouts };
  if (item.kind === 'folder') {
    const otherFolder = isFolder(to.slot, state), sourceContents = folderLayouts[from.slot];
    if (otherFolder) {
      folders[from.slot] = folders[to.slot]; folders[to.slot] = item.label;
      const otherContents = folderLayouts[to.slot];
      delete folderLayouts[from.slot]; delete folderLayouts[to.slot];
      if (otherContents) folderLayouts[from.slot] = otherContents;
      if (sourceContents) folderLayouts[to.slot] = sourceContents;
    } else {
      delete folders[from.slot]; folders[to.slot] = item.label;
      delete folderLayouts[from.slot]; if (sourceContents) folderLayouts[to.slot] = sourceContents;
      if (layout[to.slot]) layout[from.slot] = layout[to.slot];
      delete layout[to.slot];
    }
  } else {
    const source = from.folder === null ? layout : (folderLayouts[from.folder] = { ...folderLayouts[from.folder] });
    const destination = to.folder === null ? layout : from.folder === to.folder ? source : (folderLayouts[to.folder] = { ...folderLayouts[to.folder] });
    const displaced = destination[to.slot]; destination[to.slot] = item.id;
    if (displaced) source[from.slot] = displaced; else delete source[from.slot];
  }
  const identities = getHomeFolderIdentities(state);
  const homeFolderIdentities = item.kind === 'folder' ? moveHomeFolderIdentity(identities, from.slot, to.slot) : identities;
  let placed = { ...state, folders, system: { ...s, layout, folderLayouts, homeFolderIdentities } };
  if (item.kind === 'folder') placed = remapHomeFolderViews(placed, from.slot, to.slot, isFolder(to.slot, state)) as typeof placed;
  const activeFolder = getHomeNavigation(placed).activeFolderSlot;
  const selected = selectHomeLocation(placed, to);
  // A folder can move while its retained HOME context is active (e.g. software suspended).
  if (item.kind !== 'folder' || activeFolder === null) return selected;
  const settled = settleHomeNavigation(selected);
  return writeHomeNavigation(settled, { ...getHomeNavigation(settled), activeFolderSlot: activeFolder });
}
const dictionary = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const slotKey = (key: string, count: number) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < count;
/** Reject ambiguous/corrupt arrangements as a whole, retaining the caller's safe current layout. */
export function restoreHomeLayout(value: unknown): { layout: Record<number, string>; folders: Record<number, string>; folderLayouts: FolderLayouts; nextFolderNumber: number } | null {
  if (!dictionary(value) || (value.version !== undefined && value.version !== 1 && value.version !== 2 && value.version !== 3 && value.version !== 4) || !dictionary(value.layout)) return null;
  // Older browser saves contain no creation history. Start a new sequence; never infer it from labels/count/slots.
  const nextFolderNumber = value.nextFolderNumber === undefined && value.version !== 3 && value.version !== 4 ? FIRST_FOLDER_NUMBER : value.nextFolderNumber;
  if (typeof nextFolderNumber !== 'number' || !Number.isInteger(nextFolderNumber) || nextFolderNumber < FIRST_FOLDER_NUMBER || nextFolderNumber > LAST_FOLDER_NUMBER) return null;
  const layout: Record<number, string> = {}, folders: Record<number, string> = {}, folderLayouts: FolderLayouts = {}, ids = new Set<string>();
  function add(source: Record<string, unknown>, target: Record<number, string>, count: number, child = false): boolean {
    for (const [key, id] of Object.entries(source)) {
      if (!slotKey(key, count) || typeof id !== 'string') return false;
      if (retiredHomeTitleIds.has(id)) continue;
      if (!getTitle(id)?.home || ids.has(id) || child && !canEnterFolder(id)) return false;
      ids.add(id); target[Number(key)] = id;
    }
    return true;
  }
  if (!add(value.layout, layout, SLOT_COUNT)) return null;
  if (value.folders !== undefined && !dictionary(value.folders)) return null;
  for (const [key, label] of Object.entries(value.folders ?? {})) {
    if (!slotKey(key, SLOT_COUNT) || typeof label !== 'string' || layout[Number(key)] || Object.keys(folders).length >= MAX_FOLDERS) {
      if (value.version === 2 || value.version === 3 || value.version === 4) return null; else continue;
    }
    folders[Number(key)] = label.slice(0, 16);
  }
  if (value.folderLayouts !== undefined && !dictionary(value.folderLayouts)) return null;
  for (const [key, contents] of Object.entries(value.folderLayouts ?? {})) {
    if (!slotKey(key, SLOT_COUNT) || !Object.hasOwn(folders, key) || !dictionary(contents)) return null;
    const target: Record<number, string> = {};
    if (!add(contents, target, FOLDER_SLOT_COUNT, true)) return null;
    folderLayouts[Number(key)] = target;
  }
  // Saves from before Hack LDN was installed still require the original apps.
  // The installed-title reconciliation below places the new app in a free slot.
  if (!apps.every(app => app.id === 'hack-ldn-2025' || ids.has(app.id))) return null;
  for (const title of homeTitles) if (!ids.has(title.id)) {
    let slot = 0; while (slot < SLOT_COUNT && (layout[slot] || Object.hasOwn(folders, slot))) slot++;
    if (slot >= SLOT_COUNT) return null;
    layout[slot] = title.id;
  }
  return { layout, folders, folderLayouts, nextFolderNumber };
}
