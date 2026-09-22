import type { System } from './system';
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
  return { ...state, folders: { ...state.folders, [state.selected]: `${digits} (New Folder)` },
    nextFolderNumber: number === LAST_FOLDER_NUMBER ? FIRST_FOLDER_NUMBER : number + 1 };
}
export function isFolder(index: number, state: MenuState = initialState): boolean {
  return Object.hasOwn(state.folders, index);
}
export const densities = [3, 4, 6, 8, 10, 12] as const;
export function densityIndex(state:MenuState){return Math.max(0,densities.indexOf(state.columns as typeof densities[number]));}
export function rowCount(state: MenuState) { return densityIndex(state)+1; }
/** `columns` remains a legacy preference token. Native visible columns differ. */
export function visibleColumns(state:MenuState){return state.opened?state.columns:[3,3,5,7,9,10][densityIndex(state)];}
export function columnPitch(state:MenuState){return state.opened?(rowCount(state)===1?84:168/rowCount(state)):[84,84,54,40,32,28][densityIndex(state)];}
function firstColumnX(state:MenuState){return state.opened?40+(columnPitch(state)-(rowCount(state)<=2?12:8))/2:[76,76,52,40,32,34][densityIndex(state)];}
function withScroll(state:MenuState,scrollColumn:number):MenuState{return state.system?{...state,system:{...state.system,homeNavigation:{...state.system.homeNavigation,scrollColumn}}}:state;}
export function pageStart(state: MenuState): number {
  const rows = rowCount(state), selected = state.opened ? state.folderSelected : state.selected,columns=visibleColumns(state);
  const scroll = state.system?.homeNavigation?.scrollColumn;
  if (typeof scroll === 'number' && Number.isFinite(scroll)) return Math.max(0, Math.min(Math.max(0, Math.ceil(slotCount(state) / rows) - columns), scroll));
  return Math.max(0, Math.min(Math.ceil(slotCount(state) / rows) - columns, Math.floor(selected / rows) - Math.floor((columns - 1) / 2)));
}
export function menuTiles(state: MenuState) {
  const rows=rowCount(state),density=densityIndex(state),pitch=columnPitch(state),size=state.opened?pitch-(rows<=2?12:8):[72,72,50,36,28,24][density];
  const scroll=pageStart(state),start=Math.max(0,Math.floor(scroll)-1);
  const top=state.opened?(rows===1?125:(rows===2?46:40)+(168-rows*pitch)/2):[161,82,70,64,60,54][density]-size/2;
  return Array.from({ length: (visibleColumns(state) + 3) * rows }, (_, i) => {
    const col = Math.floor(i / rows), row = i % rows;
    return { index: (start + col) * rows + row, x: firstColumnX(state)-size/2+(start+col-scroll)*pitch, y: top + row * pitch, size };
  }).filter(tile => tile.index < slotCount(state) && tile.x < 320 && tile.x+tile.size>0);
}
/** Native density touch chooses the earliest left column nearest the old X. */
function changeDensity(state:MenuState,columns:number):MenuState{
  if(columns===state.columns)return state;
  const selected=state.opened?state.folderSelected:state.selected;
  const oldX=Math.fround(firstColumnX(state)+Math.fround((Math.floor(selected/rowCount(state))-pageStart(state))*columnPitch(state)));
  const next={...state,columns},rows=rowCount(next),count=visibleColumns(next),selectedColumn=Math.floor(selected/rows);
  const first=Math.max(0,selectedColumn-count+1),last=Math.min(Math.max(0,Math.ceil(slotCount(next)/rows)-count),selectedColumn+count-1);
  let closest=first,distance=Infinity;
  for(let left=first;left<=last;left++){
    const x=Math.fround(firstColumnX(next)+Math.fround((selectedColumn-left)*columnPitch(next))),delta=Math.fround(x-oldX),squared=Math.fround(delta*delta);
    if(squared<distance){closest=left;distance=squared;}
  }
  return withScroll(next,closest);
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
    return { ...state, ...(system ? { system } : {}), folders, panel: null, opened: false };
  }
  return state;
}
export function reduceMenu(state: MenuState, input: Input): MenuState {
  if (input === 'power') return { ...state, powered: !state.powered, opened: false, panel: null };
  if (!state.powered) return state;
  if (input === 'home') return { ...state, opened: false, panel: null };
  if (input === 'back') return { ...state, panel: state.panel === 'themes' ? 'settings' : state.panel === 'theme-shop' ? 'themes' : null, opened: state.panel ? state.opened : false, panelChoice: 0 };
  if (input === 'settings') return { ...state, panel: 'settings', panelChoice: 0 };
  if (input === 'brightness') return { ...state, brightness: state.brightness >= .99 ? .2 : Math.round((state.brightness + .2) * 10) / 10 };
  if (state.panel) {
    if (input === 'open') return activatePanel(state);
    const count = state.panel === 'themes' ? 7 : state.panel === 'settings' ? 3 : state.panel === 'folder-settings' ? 2 : 1;
    if (input === 'down' || input === 'up') return { ...state, panelChoice: Math.max(0, Math.min(count - 1, state.panelChoice + (input === 'down' ? 1 : -1))) };
    return state;
  }
  if (input === 'zoom' || input === 'zoom-in' || input === 'zoom-out') {
    const i = densities.indexOf(state.columns as typeof densities[number]);
    return changeDensity(state,densities[input === 'zoom' ? (i + 1) % densities.length : Math.max(0, Math.min(densities.length - 1, i + (input === 'zoom-in' ? -1 : 1)))]);
  }
  if (input === 'open') {
    if (state.opened) return state;
    if (isFolder(state.selected, state)) return withScroll({ ...state, opened: true, folderSelected: 0 },0);
    return createFolder(state);
  }
  const rows = rowCount(state), selected = state.opened ? state.folderSelected : state.selected;
  const col = Math.floor(selected / rows), row = selected % rows;
  const nextCol = input === 'left' ? Math.max(0, col - 1) : input === 'right' ? Math.min(Math.ceil(slotCount(state) / rows) - 1, col + 1) : col;
  const nextRow = input === 'up' ? Math.max(0, row - 1) : input === 'down' ? Math.min(rows - 1, row + 1) : row;
  const next = Math.min(slotCount(state) - 1, nextCol * rows + nextRow);
  const moved={ ...state, [state.opened ? 'folderSelected' : 'selected']: next };
  // Retain navigation history until an edge is crossed. Cancelling a gesture
  // happens before this reducer, so fractional stylus scroll has one owner.
  const left=pageStart(state),column=Math.floor(next/rows),columns=visibleColumns(state);
  return withScroll(moved,Math.max(0,Math.min(Math.max(0,Math.ceil(slotCount(state)/rows)-columns),column<left?column:column>=left+columns?column-columns+1:left)));
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
    if (state.opened) return reduceMenu(state, 'back');
    if (isFolder(state.selected, state) && x < 104) return { ...state, panel: 'folder-settings', panelChoice: 0 };
    return reduceMenu(state, 'open');
  }
  if (y >= 104 && y < 158 && (x < 12 || x >= 308)) return reduceMenu(state, x < 12 ? 'left' : 'right');
  if (state.opened && x < 46 && y < 51) return reduceMenu(state, 'back');
  const tile = menuTiles(state).find(tile => x >= tile.x && x < Math.min(308, tile.x + tile.size) && y >= tile.y && y < tile.y + tile.size);
  if (!tile) return state;
  if (state.opened) return { ...state, folderSelected: tile.index };
  return tile.index === state.selected ? reduceMenu(state, 'open') : { ...state, selected: tile.index };
}

/** Canvas keyboard geometry is shared with touch, including the space/delete row. */
export const keyboardKeys = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'].flatMap((row, r) =>
  Array.from(row, (value, i) => ({ value, x: 5 + (10 - row.length) * 15.5 + i * 31, y: 75 + r * 32, width: 28 }))
);
// Use the free positions at either end of the final letter row.
keyboardKeys.push({ value: ' ', x: 1, y: 171, width: 41 }, { value: '⌫', x: 275, y: 171, width: 43 });
