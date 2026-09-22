import type { System } from './system';
import { HOME_DENSITIES, getHomeNavigationView, selectHomeSlot, stepHomeDirection, setHomeDensity, enterHomeFolder, leaveHomeFolder, initializeHomeFolderView, deleteHomeFolderView, type HomeNavigation, type HomeDensity } from './home-navigation.ts';
/** Native HOME Menu coordinates: 320 × 240; icons are ordered by column. */
export const ROWS = 2;
export const COLUMNS = 150;
export const SLOT_COUNT = 300;
export const FOLDER_COUNT = 4;
export const MAX_FOLDERS = 60;
export const FIRST_FOLDER_NUMBER = 1;
export const LAST_FOLDER_NUMBER = 99;
export function slotCount(state: MenuState) { return state.opened ? 60 : SLOT_COUNT; }
export type Panel = 'settings' | 'themes' | 'folder-settings' | 'rename' | 'delete' | 'notes' | 'friends' | 'notifications' | 'browser' | 'miiverse' | 'theme-shop' | null;
export type Theme = 'white' | 'red' | 'blue' | 'yellow' | 'pink' | 'black';
export type MenuState = {
  system?: System;
  /** Navigation storage for isolated menu consumers without a System. */
  homeNavigation?: HomeNavigation;
  selected: number; opened: boolean; powered: boolean; brightness: number; columns: number;
  panel: Panel; theme: Theme; powerSaving: boolean; panelChoice: number;
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
  return initializeHomeFolderView({ ...state, folders: { ...state.folders, [state.selected]: `${digits} (New Folder)` },
    nextFolderNumber: number === LAST_FOLDER_NUMBER ? FIRST_FOLDER_NUMBER : number + 1 }, state.selected);
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
  return { ...state, panel: null, folders: { ...state.folders, [state.selected]: name.slice(0, 16) } };
}
function activatePanel(state: MenuState): MenuState {
  if (state.panel === 'themes') return state.panelChoice === 0 ? { ...state, panel: 'theme-shop' } : { ...state, theme: themeChoices[state.panelChoice - 1], panel: 'settings', panelChoice: 0 };
  if (state.panel === 'settings') {
    if (state.panelChoice === 0) return { ...state, panel: 'themes', panelChoice: 0 };
    if (state.panelChoice === 1) return reduceMenu(state, 'brightness');
    return { ...state, powerSaving: !state.powerSaving };
  }
  if (state.panel === 'folder-settings') return { ...state, panel: state.panelChoice === 0 ? 'rename' : 'delete', nameDraft: state.folders[state.selected] ?? '', panelChoice: 0 };
  if (state.panel === 'delete') {
    if (Object.keys(state.system?.folderLayouts?.[state.selected] ?? {}).length) return state;
    const folders = { ...state.folders }; delete folders[state.selected];
    const system = state.system ? { ...state.system, folderLayouts: { ...state.system.folderLayouts } } : undefined;
    if (system) delete system.folderLayouts[state.selected];
    return deleteHomeFolderView({ ...state, ...(system ? { system } : {}), folders, panel: null }, state.selected);
  }
  return state;
}
export function reduceMenu(state: MenuState, input: Input): MenuState {
  if (input === 'power') return { ...state, powered: !state.powered, panel: null };
  if (!state.powered) return state;
  if (input === 'home') return { ...state, panel: null };
  if (input === 'back') return { ...(state.panel ? state : leaveHomeFolder(state)), panel: state.panel === 'themes' ? 'settings' : state.panel === 'theme-shop' ? 'themes' : null, panelChoice: 0 };
  if (input === 'settings') return { ...state, panel: 'settings', panelChoice: 0 };
  if (input === 'brightness') return { ...state, brightness: state.brightness >= .99 ? .2 : Math.round((state.brightness + .2) * 10) / 10 };
  if (state.panel) {
    if (input === 'open') return activatePanel(state);
    const count = state.panel === 'themes' ? 7 : state.panel === 'settings' ? 3 : state.panel === 'folder-settings' ? 2 : 1;
    if (input === 'down' || input === 'up') return { ...state, panelChoice: Math.max(0, Math.min(count - 1, state.panelChoice + (input === 'down' ? 1 : -1))) };
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
    if (state.panel === 'rename') {
      if (y >= 212) return x < 160 ? reduceMenu(state, 'back') : renameFolder(state, state.nameDraft);
      const key = keyboardKeys.find(key => x >= key.x && x < key.x + key.width && y >= key.y && y < key.y + 29);
      if (key) return { ...state, nameDraft: key.value === '⌫' ? state.nameDraft.slice(0, -1) : (state.nameDraft + key.value).slice(0, 16) };
      return state;
    }
    if ((state.panel !== 'settings' && y >= 214) || (state.panel === 'settings' && x < 30 && y > 206)) return reduceMenu(state, 'back');
    if (state.panel === 'settings') {
      if (x >= 42 && x < 256 && y >= 34 && y < 105) return { ...state, panel: 'themes', panelChoice: 0 };
      if (x >= 50 && x < 250 && y >= 150 && y < 191) return { ...state, brightness: (Math.floor((x - 50) / 40) + 1) / 5 };
      if (x >= 50 && x < 250 && y >= 220) return { ...state, powerSaving: x >= 150 };
    }
    if (state.panel === 'themes' && x >= 293 && y >= 31 && y < 213) return {...state, panelChoice:Math.min(6,Math.floor((y-31)/182*7))};
    if (state.panel === 'themes' && x >= 8 && x < 288 && y >= 31 && y < 213) return activatePanel({ ...state, panelChoice: Math.max(0,state.panelChoice-2) + Math.floor((y-31)/53) });
    if (state.panel === 'folder-settings' && x > 30 && x < 290 && y >= 68 && y < 188) return { ...state, panel: y < 128 ? 'rename' : 'delete', nameDraft: state.folders[state.selected] ?? '', panelChoice: 0 };
    if (state.panel === 'delete' && y >= 165 && y < 205 && x >= 166 && x < 292) return activatePanel(state);
    if (state.panel === 'delete' && y >= 165 && y < 205 && x >= 28 && x < 154) return reduceMenu(state, 'back');
    return state;
  }
  if (y < 32) {
    if (x >= 266) return reduceMenu(state, x < 293 ? 'zoom-in' : 'zoom-out');
    const item = toolbar.find(item => x >= item.x && x < item.x + item.width);
    return item ? { ...state, panel: item.panel, panelChoice: 0 } : state;
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

/** Canvas keyboard geometry is shared with touch, including the space/delete row. */
export const keyboardKeys = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'].flatMap((row, r) =>
  Array.from(row, (value, i) => ({ value, x: 5 + (10 - row.length) * 15.5 + i * 31, y: 75 + r * 32, width: 28 }))
);
// Use the free positions at either end of the final letter row.
keyboardKeys.push({ value: ' ', x: 1, y: 171, width: 41 }, { value: '⌫', x: 275, y: 171, width: 43 });
