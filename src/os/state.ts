import type { System } from './system';
import { allocateHomeFolderIdentity, getHomeFolderIdentities, removeHomeFolderIdentity, writeHomeFolderIdentities, type HomeFolderIdentities } from './home-folder-identity.ts';
import { HOME_DENSITIES, getHomeNavigationView, selectHomeSlot, stepHomeDirection, setHomeDensity, enterHomeFolder, leaveHomeFolder, initializeHomeFolderView, deleteHomeFolderView, type HomeNavigation, type HomeDensity } from './home-navigation.ts';
import { getHomeDensityControls } from './home-density-controls.ts';
import { clampHomeSettingsScroll, homeFolderNoticeActionAt, homeFolderSettingsActionAt, homeSettingsActionAt, homeSettingsChoiceScroll, homeSettingsScrollAt, homeSavedLayoutSlotAt, homeSavedLayoutActionAt, homeLayoutConfirmationAt } from './stock-screen-layout.ts';
import { confirmHomeLayoutAction, requestHomeLayoutAction, type HomeLayoutAction, type HomeSavedLayouts } from './home-saved-layouts.ts';
/** Native HOME Menu coordinates: 320 × 240; icons are ordered by column. */
export const ROWS = 2;
export const COLUMNS = 150;
export const SLOT_COUNT = 300;
export const FOLDER_COUNT = 4;
export const MAX_FOLDERS = 60;
export const FIRST_FOLDER_NUMBER = 1;
export const LAST_FOLDER_NUMBER = 99;
export function slotCount(state: MenuState) { return state.opened ? 60 : SLOT_COUNT; }
export type Panel = 'settings' | 'themes' | 'home-layouts' | 'folder-settings' | 'folder-not-empty' | 'notes' | 'friends' | 'notifications' | 'browser' | 'miiverse' | 'theme-shop' | null;
export type Theme = 'white' | 'red' | 'blue' | 'yellow' | 'pink' | 'black';
export type MenuState = {
  system?: System;
  /** Navigation storage for isolated menu consumers without a System. */
  homeNavigation?: HomeNavigation;
  /** Session-local identity storage for isolated menu consumers without a System. */
  homeFolderIdentities?: HomeFolderIdentities;
  selected: number; opened: boolean; powered: boolean; brightness: number; columns: number;
  panel: Panel; theme: Theme; powerSaving: boolean; panelChoice: number;
  panelScroll?: number;
  homeSavedLayouts?: HomeSavedLayouts;
  homeLayoutSlot?: number;
  homeLayoutAction?: HomeLayoutAction | null;
  homeLayoutConfirm?: boolean;
  folders: Record<number, string>; folderSelected: number; nameDraft: string; nextFolderNumber: number;
};
export type Input = 'x' | 'y' | 'l' | 'r' | 'start' | 'select' | 'left' | 'right' | 'up' | 'down' | 'open' | 'back' | 'home' | 'power' | 'brightness' | 'zoom' | 'zoom-in' | 'zoom-out' | 'settings' | 'preferences' | 'mute' | 'volume-up' | 'volume-down' | 'reset-layout';
export const initialState: MenuState = {
  selected: 0, opened: false, powered: true, brightness: 1, columns: 4,
  panel: null, theme: 'white', powerSaving: false, panelChoice: 0,
  folders: { 0: '', 1: '', 2: '', 3: '' }, folderSelected: 0, nameDraft: '', nextFolderNumber: FIRST_FOLDER_NUMBER,
};
/** Native creation uses a saved 1..99 counter and fullwidth leading digits. See docs/folder-naming-runtime.md. */
function createFolder(state: MenuState): MenuState {
  if (Object.keys(state.folders).length >= MAX_FOLDERS || state.system?.layout[state.selected]) return state;
  const number = state.nextFolderNumber;
  const digits = String(number).replace(/[0-9]/g, digit => String.fromCharCode(digit.charCodeAt(0) + 0xfee0));
  const identities = allocateHomeFolderIdentity(getHomeFolderIdentities(state), state.selected);
  return initializeHomeFolderView(writeHomeFolderIdentities({ ...state, folders: { ...state.folders, [state.selected]: `${digits} (New Folder)` },
    nextFolderNumber: number === LAST_FOLDER_NUMBER ? FIRST_FOLDER_NUMBER : number + 1 }, identities), state.selected);
}
export function isFolder(index: number, state: MenuState = initialState): boolean {
  return Object.hasOwn(state.folders, index);
}
/** LncFolder_00/Bounding_00: bottom-centre origin 7, (-101,55), 72×22. Native edges are inclusive. */
export const HOME_FOLDER_BACK_BOUNDS = { left: 23, top: 43, right: 95, bottom: 65 } as const;
export function isHomeFolderBackTouch(state: MenuState, x: number, y: number): boolean {
  const b = HOME_FOLDER_BACK_BOUNDS;
  return state.opened && !state.panel && Number.isFinite(x) && Number.isFinite(y) && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
}
/** Native 0x29af68 hides the footer for an empty selected child, even when other children exist. */
export function hasEmptyHomeFolderSelection(state: MenuState): boolean {
  return state.opened && !state.system?.folderLayouts?.[state.selected]?.[state.folderSelected];
}
export const densities = HOME_DENSITIES;
export function densityIndex(state: MenuState) { return getHomeNavigationView(state).currentDensity; }
export function rowCount(state: MenuState) { return getHomeNavigationView(state).rows; }
/** `columns` remains a legacy density token, independent from visible columns. */
export function visibleColumns(state: MenuState) { return getHomeNavigationView(state).columns; }
export function columnPitch(state: MenuState) { return getHomeNavigationView(state).pitchX; }
export function pageStart(state: MenuState) { const view = getHomeNavigationView(state); return view.scrollPixels / view.pitchX; }
export function menuTiles(state: MenuState) {
  return getHomeNavigationView(state).slots.map(slot => ({ ...slot, x: slot.x - slot.size / 2, y: slot.y - slot.size / 2 }))
    .filter(tile => tile.x < 320 && tile.x + tile.size > 0);
}
export const toolbar = [
  { panel: 'settings', x: 0, width: 40 }, { panel: 'notes', x: 40, width: 44 },
  { panel: 'friends', x: 84, width: 42 }, { panel: 'notifications', x: 126, width: 42 },
  { panel: 'browser', x: 168, width: 42 }, { panel: 'miiverse', x: 210, width: 56 },
] as const;
export const themeChoices: Theme[] = ['red', 'blue', 'yellow', 'pink', 'black', 'white'];
export function renameFolder(state: MenuState, name: string): MenuState {
  if (!isFolder(state.selected, state)) return state;
  return writeHomeFolderIdentities({ ...state, panel: null, folders: { ...state.folders, [state.selected]: name.slice(0, 16) } }, getHomeFolderIdentities(state));
}
export function setHomeSettingsScroll(state: MenuState, value: number): MenuState {
  if (state.panel !== 'settings' || !Number.isFinite(value)) return state;
  const panelScroll = clampHomeSettingsScroll(value);
  return panelScroll === (state.panelScroll ?? 0) ? state : { ...state, panelScroll };
}
function activatePanel(state: MenuState): MenuState {
  if (state.panel === 'themes') return state.panelChoice === 0 ? { ...state, panel: 'theme-shop' } : { ...state, theme: themeChoices[state.panelChoice - 1], panel: 'settings', panelChoice: 0 };
  if (state.panel === 'settings') {
    if (state.panelChoice === 0) return { ...state, panel: 'themes', panelChoice: 0 };
    if (state.panelChoice === 1) return { ...state, panel: 'home-layouts', homeLayoutSlot: 0, homeLayoutAction: null, homeLayoutConfirm: false };
    if (state.panelChoice === 2) return reduceMenu(state, 'brightness');
    if (state.panelChoice === 3) return { ...state, powerSaving: !state.powerSaving };
    return state;
  }
  if (state.panel === 'home-layouts') return state.homeLayoutAction ? (state.homeLayoutConfirm ? confirmHomeLayoutAction(state) : { ...state, homeLayoutAction: null, homeLayoutConfirm: false })
    : requestHomeLayoutAction(state, state.homeSavedLayouts?.[state.homeLayoutSlot ?? 0] ? 'load' : 'save');
  if (state.panel === 'folder-settings') {
    if (state.panelChoice === 0) return state;
    if (Object.keys(state.system?.folderLayouts?.[state.selected] ?? {}).length) return { ...leaveHomeFolder(state), panel: 'folder-not-empty', panelChoice: 0 };
    return deleteSelectedFolder(state);
  }
  if (state.panel === 'folder-not-empty') return { ...leaveHomeFolder(state), panel: null, panelChoice: 0 };
  return state;
}
function deleteSelectedFolder(state: MenuState): MenuState {
  if (!isFolder(state.selected, state)) return state;
  const folders = { ...state.folders }; delete folders[state.selected];
  const system = state.system ? { ...state.system, folderLayouts: { ...state.system.folderLayouts } } : undefined;
  if (system) delete system.folderLayouts[state.selected];
  const identities = removeHomeFolderIdentity(getHomeFolderIdentities(state), state.selected);
  return deleteHomeFolderView(writeHomeFolderIdentities({ ...state, ...(system ? { system } : {}), folders, panel: null, panelChoice: 0 }, identities), state.selected);
}
export function reduceMenu(state: MenuState, input: Input): MenuState {
  if (input === 'power') return { ...state, powered: !state.powered, panel: null };
  if (!state.powered) return state;
  if (input === 'home') return { ...state, panel: null };
  if (input === 'back') {
    if (state.panel === 'home-layouts') return state.homeLayoutAction ? { ...state, homeLayoutAction: null, homeLayoutConfirm: false }
      : { ...state, panel: 'settings', panelChoice: 1, panelScroll: homeSettingsChoiceScroll(1, state.panelScroll) };
    return { ...(state.panel ? state : leaveHomeFolder(state)), panel: state.panel === 'themes' ? 'settings' : state.panel === 'theme-shop' ? 'themes' : null, panelChoice: 0,
      ...(state.panel === 'themes' ? { panelScroll: 0 } : {}) };
  }
  if (input === 'settings') return { ...state, panel: 'settings', panelChoice: 0, panelScroll: 0, homeLayoutAction: null };
  if (input === 'brightness') return { ...state, brightness: state.brightness >= .99 ? .2 : Math.round((state.brightness + .2) * 10) / 10 };
  if (state.panel) {
    if (input === 'open') return activatePanel(state);
    if (state.panel === 'home-layouts') {
      if (state.homeLayoutAction) return input === 'left' || input === 'right' ? { ...state, homeLayoutConfirm: input === 'right' } : state;
      if (input === 'x' || input === 'y') return requestHomeLayoutAction(state, input === 'x' ? 'save' : 'load');
      const slot = state.homeLayoutSlot ?? 0;
      if (input === 'left' || input === 'right') return { ...state, homeLayoutSlot: Math.floor(slot / 4) * 4 + Math.max(0, Math.min(3, slot % 4 + (input === 'right' ? 1 : -1))) };
      if (input === 'up' || input === 'down') return { ...state, homeLayoutSlot: slot % 4 + (input === 'down' ? 4 : 0) };
      return state;
    }
    const count = state.panel === 'themes' ? 7 : state.panel === 'settings' ? 4 : state.panel === 'folder-settings' ? 2 : 1;
    if (input === 'down' || input === 'up') {
      const panelChoice = Math.max(0, Math.min(count - 1, state.panelChoice + (input === 'down' ? 1 : -1)));
      return { ...state, panelChoice, ...(state.panel === 'settings' ? { panelScroll: homeSettingsChoiceScroll(panelChoice, state.panelScroll) } : {}) };
    }
    if (state.panel === 'settings' && (input === 'left' || input === 'right')) {
      if (state.panelChoice === 2) return { ...state, brightness: Math.max(.2, Math.min(1, Math.round((state.brightness + (input === 'right' ? .2 : -.2)) * 10) / 10)) };
      if (state.panelChoice === 3) return { ...state, powerSaving: input === 'right' };
    }
    return state;
  }
  if (input === 'zoom' || input === 'zoom-in' || input === 'zoom-out') {
    const i = getHomeNavigationView(state).targetDensity;
    return setHomeDensity(state, (input === 'zoom' ? (i + 1) % densities.length : Math.max(0, Math.min(densities.length - 1, i + (input === 'zoom-in' ? -1 : 1)))) as HomeDensity);
  }
  if (input === 'open') {
    if (state.opened) return state;
    if (isFolder(state.selected, state)) return enterHomeFolder(state, state.selected);
    return createFolder(state);
  }
  return ['left', 'right', 'up', 'down'].includes(input) ? stepHomeDirection(state, input as 'left' | 'right' | 'up' | 'down') : state;
}
export function touchMenu(state: MenuState, x: number, y: number): MenuState {
  if (!state.powered || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= 320 || y < 0 || y >= 240) return state;
  if (state.panel) {
    if (state.panel !== 'settings' && state.panel !== 'home-layouts' && state.panel !== 'folder-settings' && state.panel !== 'folder-not-empty' && y >= 214) return reduceMenu(state, 'back');
    if (state.panel === 'settings') {
      const scroll = homeSettingsScrollAt(x, y);
      if (scroll !== null) return setHomeSettingsScroll(state, scroll);
      const action = homeSettingsActionAt(state.panelScroll ?? 0, x, y);
      if (action === 'back') return reduceMenu(state, 'back');
      if (action === 'themes' || action === 'home-layouts') return activatePanel({ ...state, panelChoice: action === 'themes' ? 0 : 1 });
      if (action?.startsWith('brightness-')) return { ...state, panelChoice: 2, brightness: Number(action.slice(-1)) / 5 };
      if (action === 'power-saving-off' || action === 'power-saving-on') return { ...state, panelChoice: 3, powerSaving: action === 'power-saving-on' };
    }
    if (state.panel === 'home-layouts') {
      if (state.homeLayoutAction) {
        const action = homeLayoutConfirmationAt(x, y);
        return action === 'cancel' ? reduceMenu(state, 'back') : action === 'confirm' ? confirmHomeLayoutAction(state) : state;
      }
      const action = homeSavedLayoutActionAt(x, y);
      if (action === 'back') return reduceMenu(state, 'back');
      if (action) return requestHomeLayoutAction(state, action);
      const slot = homeSavedLayoutSlotAt(x, y);
      return slot === null ? state : { ...state, homeLayoutSlot: slot };
    }
    if (state.panel === 'themes' && x >= 293 && y >= 31 && y < 213) return {...state, panelChoice:Math.min(6,Math.floor((y-31)/182*7))};
    if (state.panel === 'themes' && x >= 8 && x < 288 && y >= 31 && y < 213) return activatePanel({ ...state, panelChoice: Math.max(0,state.panelChoice-2) + Math.floor((y-31)/53) });
    if (state.panel === 'folder-settings') {
      const action = homeFolderSettingsActionAt(x, y);
      if (action === 'back') return reduceMenu(state, 'back');
      if (action === 'delete') return activatePanel({ ...state, panelChoice: 1 });
      // Rename remains intentionally inert while software-keyboard input is out of scope.
      return state;
    }
    if (state.panel === 'folder-not-empty' && homeFolderNoticeActionAt(x, y)) return activatePanel(state);
    return state;
  }
  if (y < 32) {
    if (x >= 266) {
      const controls=getHomeDensityControls(state),decrease=x<293;
      if (!(decrease?controls.decreaseEnabled:controls.increaseEnabled)) return state;
      return reduceMenu(state,decrease?'zoom-in':'zoom-out');
    }
    const item = toolbar.find(item => x >= item.x && x < item.x + item.width);
    return item ? { ...state, panel: item.panel, panelChoice: 0, ...(item.panel === 'settings' ? { panelScroll: 0, homeLayoutAction: null } : {}) } : state;
  }
  if (y >= 212) {
    if (state.opened) return hasEmptyHomeFolderSelection(state) ? state : reduceMenu(state, 'back');
    if (isFolder(state.selected, state) && x < 104) return { ...state, panel: 'folder-settings', panelChoice: 0 };
    return reduceMenu(state, 'open');
  }
  if (y >= 104 && y < 158 && (x < 12 || x >= 308)) return reduceMenu(state, x < 12 ? 'left' : 'right');
  if (isHomeFolderBackTouch(state, x, y)) return reduceMenu(state, 'back');
  const tile = menuTiles(state).find(tile => x >= tile.x && x < Math.min(308, tile.x + tile.size) && y >= tile.y && y < tile.y + tile.size);
  if (!tile) return state;
  if (state.opened) return selectHomeSlot(state, tile.index);
  return tile.index === state.selected ? reduceMenu(state, 'open') : selectHomeSlot(state, tile.index);
}
