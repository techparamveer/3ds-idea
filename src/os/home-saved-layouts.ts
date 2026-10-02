import type { MenuState, Theme } from './state.ts';
import { initialState } from './state.ts';
import { restoreHomeLayout, type FolderLayouts } from './home-layout.ts';
import { homeDensityIndex, restoreHomeView, saveHomeView } from './home-navigation.ts';
import { allocateHomeFolderIdentity, clearHomeFolderIdentities, getHomeFolderIdentities } from './home-folder-identity.ts';
import { createSystemHomeFolderClose } from './home-folder-close-system.ts';
import { enableHomeControls } from './home-controls.ts';

/** MyMenu_D_00 has eight saved thumbnail anchors; N_Thumb_08 is the current-layout preview. */
export const HOME_SAVED_LAYOUT_SLOT_COUNT = 8;
export type HomeLayoutAction = 'save' | 'load' | 'delete';
export type HomeSavedLayout = {
  version: 1;
  layout: Record<number, string>;
  folders: Record<number, string>;
  folderLayouts: FolderLayouts;
  nextFolderNumber: number;
  homeView: ReturnType<typeof saveHomeView>;
  theme: Theme;
};
export type HomeSavedLayouts = readonly (HomeSavedLayout | null)[];
const validSlot = (slot: number) => Number.isInteger(slot) && slot >= 0 && slot < HOME_SAVED_LAYOUT_SLOT_COUNT;
const dictionary = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const themes: readonly Theme[] = ['white', 'red', 'blue', 'yellow', 'pink', 'black'];

/** Browser-local layout storage only. Runtime owners, live folder identities and audio never enter the payload. */
function readSnapshot(value: unknown): HomeSavedLayout | null {
  if (!dictionary(value) || value.version !== 1 || !themes.includes(value.theme as Theme)) return null;
  const home = restoreHomeLayout({ ...value, version: 4 });
  if (!home) return null;
  const normalized = restoreHomeView({ ...initialState, folders: home.folders }, value.homeView, 1);
  return { version: 1, ...home, homeView: saveHomeView(normalized), theme: value.theme as Theme };
}
function slots(state: MenuState): (HomeSavedLayout | null)[] {
  return Array.from({ length: HOME_SAVED_LAYOUT_SLOT_COUNT }, (_, slot) => readSnapshot(state.homeSavedLayouts?.[slot]));
}
export function serializeHomeSavedLayouts(state: MenuState): { version: 1; slots: HomeSavedLayouts } {
  return { version: 1, slots: slots(state) };
}
export function restoreHomeSavedLayouts(state: MenuState, value: unknown): MenuState {
  if (!dictionary(value) || value.version !== 1 || !Array.isArray(value.slots) || value.slots.length !== HOME_SAVED_LAYOUT_SLOT_COUNT) return state;
  const saved = value.slots;
  return { ...state, homeSavedLayouts: Array.from({ length: HOME_SAVED_LAYOUT_SLOT_COUNT }, (_, slot) => readSnapshot(saved[slot])) };
}
export function saveHomeLayoutSlot(state: MenuState, slot: number): MenuState {
  if (!state.system || !validSlot(slot)) return state;
  const snapshot = readSnapshot({ version: 1, layout: state.system.layout, folders: state.folders,
    folderLayouts: state.system.folderLayouts, nextFolderNumber: state.nextFolderNumber, homeView: saveHomeView(state), theme: state.theme });
  if (!snapshot) return state;
  const saved = slots(state); saved[slot] = snapshot;
  return { ...state, homeSavedLayouts: saved };
}
export function deleteHomeLayoutSlot(state: MenuState, slot: number): MenuState {
  if (!validSlot(slot) || !state.homeSavedLayouts?.[slot]) return state;
  const saved = slots(state); saved[slot] = null;
  return { ...state, homeSavedLayouts: saved };
}
export function loadHomeLayoutSlot(state: MenuState, slot: number): MenuState {
  if (!state.system || !validSlot(slot)) return state;
  const snapshot = readSnapshot(state.homeSavedLayouts?.[slot]);
  if (!snapshot) return state;
  let identities = clearHomeFolderIdentities(getHomeFolderIdentities(state));
  for (const folder of Object.keys(snapshot.folders).map(Number).sort((a, b) => a - b)) identities = allocateHomeFolderIdentity(identities, folder);
  const restored = { ...state, theme: snapshot.theme, folders: snapshot.folders, nextFolderNumber: snapshot.nextFolderNumber,
    system: { ...state.system, layout: snapshot.layout, folderLayouts: snapshot.folderLayouts,
      homeFolderIdentities: identities, homeFolderClose: createSystemHomeFolderClose(state.system.homeFolderClose), homeControls: null } };
  const next = restoreHomeView(restored, snapshot.homeView, homeDensityIndex(state.columns));
  return state.system.homeControls ? enableHomeControls(next) : next;
}
/** Confirmation routing is an explicit portfolio adaptation, pending native interaction comparison. */
export function requestHomeLayoutAction(state: MenuState, action: HomeLayoutAction): MenuState {
  const slot = state.homeLayoutSlot ?? 0;
  if (state.panel !== 'home-layouts' || !validSlot(slot) || !state.system || (action !== 'save' && !readSnapshot(state.homeSavedLayouts?.[slot]))) return state;
  return { ...state, homeLayoutAction: action, homeLayoutConfirm: false };
}
export function confirmHomeLayoutAction(state: MenuState): MenuState {
  if (state.panel !== 'home-layouts' || !state.homeLayoutAction) return state;
  const slot = state.homeLayoutSlot ?? 0, action = state.homeLayoutAction;
  const next = action === 'save' ? saveHomeLayoutSlot(state, slot) : action === 'load' ? loadHomeLayoutSlot(state, slot) : deleteHomeLayoutSlot(state, slot);
  return { ...next, homeLayoutAction: null, homeLayoutConfirm: false };
}
