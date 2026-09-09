export const COLUMNS = 8;
export const ROWS = 2;
export const SLOT_COUNT = COLUMNS * ROWS;
export type MenuState = { selected: number; opened: boolean; powered: boolean; brightness: number; columns: number };
export type Input = 'left' | 'right' | 'up' | 'down' | 'open' | 'back' | 'home' | 'power' | 'brightness' | 'zoom';
export const initialState: MenuState = { selected: 0, opened: false, powered: true, brightness: 1, columns: 4 };
export function reduceMenu(state: MenuState, input: Input): MenuState {
  if (input === 'power') return { ...state, powered: !state.powered, opened: false };
  if (!state.powered) return state;
  if (input === 'home' || input === 'back') return { ...state, opened: false };
  if (input === 'open') return { ...state, opened: true };
  if (input === 'brightness') return { ...state, brightness: state.brightness >= 1 ? .45 : state.brightness + .275 };
  if (input === 'zoom') return { ...state, columns: state.columns === 4 ? 6 : 4 };
  if (state.opened) return state;
  const col = Math.floor(state.selected / ROWS), row = state.selected % ROWS;
  const nextCol = input === 'left' ? Math.max(0, col - 1) : input === 'right' ? Math.min(COLUMNS - 1, col + 1) : col;
  const nextRow = input === 'up' ? 0 : input === 'down' ? ROWS - 1 : row;
  return { ...state, selected: nextCol * ROWS + nextRow };
}
export function pageStart(state: MenuState): number {
  return Math.max(0, Math.min(COLUMNS - state.columns, Math.floor(state.selected / ROWS) - Math.floor(state.columns / 2)));
}
export function touchMenu(state: MenuState, x: number, y: number): MenuState {
  if (!state.powered || x < 0 || x > 320 || y < 0 || y > 240) return state;
  if (state.opened) return y > 205 ? { ...state, opened: false } : state;
  if (y < 24) {
    if (x < 28) return reduceMenu(state, 'brightness');
    if (x < 80) return reduceMenu(state, 'zoom');
    return state;
  }
  if (y > 211) return reduceMenu(state, x < 50 ? 'left' : x > 270 ? 'right' : 'open');
  const cell = 296 / state.columns;
  const col = Math.floor((x - 12) / cell);
  const row = y >= 115 ? 1 : 0;
  if (x < 12 || col < 0 || col >= state.columns || y < 35 || y > 197) return state;
  const selected = (pageStart(state) + col) * ROWS + row;
  return { ...state, selected, opened: selected === state.selected };
}
