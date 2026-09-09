export const COLUMNS = 8;
export const ROWS = 2;
export const SLOT_COUNT = COLUMNS * ROWS;
// Four empty portfolio folders; remaining slots are unoccupied.
export const FOLDER_COUNT = 4;
export function isFolder(index: number): boolean { return index >= 0 && index < FOLDER_COUNT; }
export type MenuState = { selected: number; opened: boolean; powered: boolean; brightness: number; columns: number };
export type Input = 'left' | 'right' | 'up' | 'down' | 'open' | 'back' | 'home' | 'power' | 'brightness' | 'zoom';
export const initialState: MenuState = { selected: 0, opened: false, powered: true, brightness: 1, columns: 4 };
export function reduceMenu(state: MenuState, input: Input): MenuState {
  if (input === 'power') return { ...state, powered: !state.powered, opened: false };
  if (!state.powered) return state;
  if (input === 'home' || input === 'back') return { ...state, opened: false };
  if (input === 'open') return isFolder(state.selected) ? { ...state, opened: true } : state;
  if (input === 'brightness') return { ...state, brightness: state.brightness >= 1 ? .45 : state.brightness + .275 };
  if (state.opened) return state;
  if (input === 'zoom') return { ...state, columns: state.columns === 4 ? 6 : 4 };
  const col = Math.floor(state.selected / ROWS), row = state.selected % ROWS;
  const nextCol = input === 'left' ? Math.max(0, col - 1) : input === 'right' ? Math.min(COLUMNS - 1, col + 1) : col;
  const nextRow = input === 'up' ? 0 : input === 'down' ? ROWS - 1 : row;
  return { ...state, selected: nextCol * ROWS + nextRow };
}
export function pageStart(state: MenuState): number {
  return Math.max(0, Math.min(COLUMNS - state.columns, Math.floor(state.selected / ROWS) - Math.floor(state.columns / 2)));
}
/** One geometry source for both canvas drawing and touchscreen hit testing. */
export function menuTiles(state: MenuState) {
  const cell = 296 / state.columns, size = Math.min(60, cell - 11), start = pageStart(state);
  return Array.from({ length: state.columns * ROWS }, (_, i) => {
    const col = Math.floor(i / ROWS), row = i % ROWS;
    return { index: (start + col) * ROWS + row,
      x: 12 + col * cell + (cell - size) / 2,
      y: (row ? 120 : 42) + (60 - size) / 2, size };
  });
}
export function touchMenu(state: MenuState, x: number, y: number): MenuState {
  if (!state.powered || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= 320 || y < 0 || y >= 240) return state;
  if (state.opened) return x >= 6 && x < 314 && y >= 212 && y < 234 ? { ...state, opened: false } : state;
  if (y < 24) {
    if (x < 28) return reduceMenu(state, 'brightness');
    if (x < 80) return reduceMenu(state, 'zoom');
    return state;
  }
  if (y >= 212 && y < 234) {
    if (x >= 6 && x < 38) return reduceMenu(state, 'left');
    if (x >= 282 && x < 314) return reduceMenu(state, 'right');
    if (x >= 46 && x < 274) return reduceMenu(state, 'open');
  }
  const tile = menuTiles(state).find(tile => x >= tile.x && x < tile.x + tile.size && y >= tile.y && y < tile.y + tile.size);
  if (!tile) return state;
  return { ...state, selected: tile.index, opened: tile.index === state.selected && isFolder(tile.index) };
}
