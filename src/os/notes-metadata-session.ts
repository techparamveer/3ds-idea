import { getTitle } from './app-registry.ts';
import { loadNotesTitleMetadata, type NotesMetadataResult } from './notes-title-metadata.ts';
import type { AppRuntime } from './app-host';
import type { SuspendedCapture } from './notes-suspended-capture';
import type { NativePixels } from './native-layout';

type ReadyCapture = Extract<SuspendedCapture, { status: 'ready' }>;
type Identity = { notesOwner: string; applicationOwner: string; captureGeneration: number; titleId: string };
export type NotesDisplayMetadata = { selection: { titleId: string; description: string }; icon: NativePixels; dispose(): void };
export type NotesMetadataState =
  | { status: 'idle' }
  | { status: 'unavailable'; reason: string }
  | (Identity & { status: 'loading' })
  | (Identity & { status: 'ready'; metadata: NotesDisplayMetadata; capture: ReadyCapture })
  | (Identity & { status: 'error'; error: unknown });

/** Metadata lifetime is the Notes context, not the selected note or renderer
 * view. Capture pixels are borrowed from the separate application owner. */
export function createNotesMetadataSession(options: {
  manifestUrl?: string;
  load?: typeof loadNotesTitleMetadata;
  /** Portfolio titles borrow the source panel, but use their own title/artwork. */
  loadPortfolio?: (appId: string, signal: AbortSignal) => Promise<NotesDisplayMetadata>;
  onChange?: (state: NotesMetadataState) => void;
} = {}) {
  let state: NotesMetadataState = { status: 'idle' }, key = '', generation = 0, disposed = false;
  let controller: AbortController | undefined;
  const load = options.load ?? loadNotesTitleMetadata;
  const publish = (next: NotesMetadataState) => { state = next; options.onChange?.(state); };
  function release() {
    generation++; controller?.abort(); controller = undefined;
    if (state.status === 'ready') state.metadata.dispose();
  }
  return {
    getState: () => state,
    sync(runtime: AppRuntime | undefined, capture: SuspendedCapture) {
      if (disposed) return state;
      const notes = runtime?.systemApplet ? runtime.instances[runtime.systemApplet] : undefined;
      const application = runtime?.application ? runtime.instances[runtime.application] : undefined;
      const descriptor = application && getTitle(application.appId);
      const eligible = notes?.appId === 'game-notes' && !notes.closing;
      const reason = !eligible ? null : !application || !application.suspended || application.closing ? 'no-suspended-application'
        : capture.status !== 'ready' || capture.owner !== application.id || !Number.isSafeInteger(capture.generation) || capture.generation < 1 ? 'missing-capture'
        : !descriptor || descriptor.kind !== 'application' || (descriptor.source === 'firmware' ? !descriptor.titleId : !options.loadPortfolio) ? 'unsupported-title' : null;
      if (!eligible || reason) {
        const nextKey = eligible ? JSON.stringify([notes.id, application?.id, reason]) : '';
        if (key !== nextKey) { release(); key = nextKey; publish(reason ? { status: 'unavailable', reason } : { status: 'idle' }); }
        return state;
      }
      // The predicates above establish this pair. Snapshot before any await.
      const frozen = capture as ReadyCapture;
      const identity: Identity = { notesOwner: notes.id, applicationOwner: application!.id, captureGeneration: frozen.generation, titleId: descriptor!.source === 'firmware' ? descriptor!.titleId!.toLowerCase() : `portfolio:${application!.appId}` };
      const nextKey = JSON.stringify(identity);
      if (key === nextKey) return state;
      release(); key = nextKey;
      const ticket = generation, signal = (controller = new AbortController()).signal;
      const captured = { ...frozen };
      publish({ ...identity, status: 'loading' });
      void Promise.resolve().then((): Promise<NotesMetadataResult | { status: 'ready'; metadata: NotesDisplayMetadata }> | null => {
        if (disposed || ticket !== generation) return null;
        return descriptor!.source === 'portfolio'
          ? options.loadPortfolio!(application!.appId, signal).then(metadata => ({ status: 'ready' as const, metadata }))
          : load(options.manifestUrl ?? '/os/firmware/10.7.0-32E/manifest.json', identity.titleId, signal);
      }).then((result: NotesMetadataResult | { status: 'ready'; metadata: NotesDisplayMetadata } | null) => {
        if (!result) return;
        if (disposed || ticket !== generation) { if (result.status === 'ready') result.metadata.dispose(); return; }
        controller = undefined;
        if (result.status === 'unavailable') publish(result);
        else if (result.metadata.selection.titleId !== identity.titleId) {
          result.metadata.dispose(); publish({ ...identity, status: 'error', error: Error('Notes metadata title differs') });
        } else publish({ ...identity, status: 'ready', metadata: result.metadata, capture: captured });
      }, error => {
        if (disposed || ticket !== generation) return;
        controller = undefined; publish({ ...identity, status: 'error', error });
      });
      return state;
    },
    dispose() { if (disposed) return; disposed = true; release(); key = ''; state = { status: 'idle' }; },
  };
}
