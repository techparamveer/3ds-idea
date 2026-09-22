import { type PortfolioApp } from './apps.ts';
import { objectValue, type AppModule, type AppState, type AppEffect } from './app-types.ts';
const number = (state: AppState, key: string) => typeof state[key] === 'number' ? state[key] as number : 0;
export function createPortfolioModule(app: PortfolioApp): AppModule {
  const initial = (): AppState => ({ item: 0, detail: false, page: 0, photo: 0 });
  return {
    descriptor: { id: app.id, title: app.title, kind: 'application', home: true, source: 'portfolio', assetPack: 'portfolio', saveVersion: 1 },
    create: initial,
    reduce(state, event) {
      if (event.type !== 'command') return { state };
      const item = number(state, 'item'), entry = app.entries[item], effects: AppEffect[] = [];
      if (event.command === 'back') return { state: state.detail ? { ...state, detail: false, page: 0, photo: 0 } : state, effects: state.detail ? [] : [{ type: 'close' }] };
      if (event.command === 'open') {
        if (!state.detail) return { state: { ...state, detail: true, page: 0, photo: 0 } };
        if (entry.app) effects.push({ type: 'launch', appId: entry.app });
        else if (entry.url) effects.push({ type: 'link', url: entry.url });
        else return { state: { ...state, detail: false } };
      }
      if (event.command === 'up' || event.command === 'down') {
        const direction = event.command === 'up' ? -1 : 1;
        return { state: state.detail ? { ...state, page: Math.max(0, Math.min(entry.pages.length - 1, number(state, 'page') + direction)) } : { ...state, item: Math.max(0, Math.min(app.entries.length - 1, item + direction)), photo: 0 } };
      }
      if (event.command === 'left' || event.command === 'right') return { state: { ...state, photo: Math.max(0, Math.min((entry.images?.length ?? 1) - 1, number(state, 'photo') + (event.command === 'left' ? -1 : 1))) } };
      return { state, effects };
    },
    view(state) { return { appId: app.id, screen: state.detail ? 'detail' : 'entries', heading: app.title, rows: app.entries.map(entry => ({ id: entry.id, label: entry.title, detail: entry.subtitle })), selection: number(state, 'item'), footer: { left: { label: 'Back', action: 'back' }, right: { label: 'Open', action: 'open' } }, data: state }; },
    save: () => ({}),
    migrate: saved => objectValue(saved) ? saved : null,
  };
}
