import { loadNativeTitleAssets, type NativeTitleAssets, type NativeTitlePackRequest } from './native-title-assets';
import type { BitmapFont } from './bitmap-font';

/** A view belongs to an AppInstance, not just a title. Reopening the same title
 * under another instance must invalidate its old asynchronous completion. */
export type NativeTitleSessionRequest = {
  owner: string;
  view: string;
  titleId: string;
  packs: readonly NativeTitlePackRequest[];
  sharedFonts: ReadonlyMap<string, BitmapFont>;
};
type Identity = { owner: string; view: string; titleId: string };
export type NativeTitleSessionState =
  | { status: 'idle' }
  | (Identity & { status: 'loading' })
  | (Identity & { status: 'ready'; assets: NativeTitleAssets })
  | (Identity & { status: 'error'; error: unknown });

/** Scene-facing owner for one foreground native view. Inactive/sleeping owners
 * pass null; no asset or shared-font cache survives an owner/view replacement. */
export function createNativeTitleSession(options: {
  manifestUrl: string;
  onChange: (state: NativeTitleSessionState) => void;
  load?: typeof loadNativeTitleAssets;
}) {
  const load = options.load ?? loadNativeTitleAssets, manifestUrl = options.manifestUrl;
  let state: NativeTitleSessionState = { status: 'idle' };
  let request: NativeTitleSessionRequest | null = null, key = '';
  let generation = 0, controller: AbortController | null = null, disposed = false;
  const release = () => {
    generation++;
    controller?.abort(); controller = null;
    if (state.status === 'ready') state.assets.dispose();
  };
  const sameFonts = (a: ReadonlyMap<string, BitmapFont>, b: ReadonlyMap<string, BitmapFont>) =>
    a.size === b.size && [...a].every(([name, font]) => b.get(name) === font);
  function begin() {
    release();
    if (!request) {
      state = { status: 'idle' }; options.onChange(state); return;
    }
    const selected = request, ticket = generation;
    const signal = (controller = new AbortController()).signal;
    const identity = { owner: selected.owner, view: selected.view, titleId: selected.titleId };
    state = { ...identity, status: 'loading' }; options.onChange(state);
    // A change callback may synchronously switch owners or dispose the scene.
    void Promise.resolve().then(() => {
      if (disposed || ticket !== generation) return null;
      return load(manifestUrl, selected.titleId, selected.packs, selected.sharedFonts, signal);
    }).then(assets => {
      if (!assets) return;
      if (disposed || ticket !== generation) { assets.dispose(); return; }
      controller = null;
      state = { ...identity, status: 'ready', assets }; options.onChange(state);
    }, error => {
      if (disposed || ticket !== generation) return;
      controller = null;
      state = { ...identity, status: 'error', error }; options.onChange(state);
    });
  }
  return {
    getState: () => state,
    update(next: NativeTitleSessionRequest | null) {
      if (disposed) return state;
      if (!next) {
        if (!request) return state;
        request = null; key = ''; begin(); return state;
      }
      if (!next.owner || !next.view) throw new Error('Native title view requires an instance owner and view identity');
      const nextKey = JSON.stringify([next.owner, next.view, next.titleId, next.packs]);
      if (request && key === nextKey && sameFonts(request.sharedFonts, next.sharedFonts)) return state;
      request = { ...next, packs: next.packs.map(pack => ({ ...pack,
        layouts: [...pack.layouts], animations: [...pack.animations], ...(pack.textures?{textures:[...pack.textures]}:{}) })), sharedFonts: new Map(next.sharedFonts) };
      key = nextKey; begin(); return state;
    },
    retry() { if (!disposed && request && state.status === 'error') begin(); return state; },
    dispose() {
      if (disposed) return;
      disposed = true; release(); request = null; key = ''; state = { status: 'idle' };
    },
  };
}
