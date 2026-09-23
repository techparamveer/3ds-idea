import { createCapabilityAdapter, type CapabilityEnvironment } from './app-capabilities.ts';
import { isRuntimeEffectCurrent } from './app-host.ts';
import { FirmwareStorageError, type FirmwareStorage } from './app-persistence.ts';
import { acknowledgeSystemEffects, dispatchSystemEvent, resolveSystemCapability, saveSettings } from './system.ts';
import {createPortfolioMusic,type PortfolioAudio} from './portfolio-music.ts';
import type { MenuState } from './state.ts';

/** Browser effects are consumed synchronously; device prompts never block release.
 * Save writes retain emission order without capturing an obsolete OS snapshot. */
export function createRuntimeEffects(options: {
  getState: () => MenuState;
  setState: (state: MenuState) => void;
  now: () => number;
  /** Flush the host clock before reading the state an effect will mutate. */
  beforeMutation?: (now: number) => void;
  storage?: FirmwareStorage;
  environment?: CapabilityEnvironment;
  createMusicAudio?: () => PortfolioAudio;
  onChange: () => void;
  onFailure: (error: unknown) => void;
  onSound: (name: string) => void;
  onLink: (url: string) => void;
}) {
  let disposed = false, draining = false, writes = Promise.resolve();
  let preferences = saveSettings(options.getState());
  const report = (error: unknown) => { if (!disposed) options.onFailure(error); };
  const music=createPortfolioMusic({createAudio:options.createMusicAudio,
    isCurrent(owner,effect){const s=options.getState().system!,r=s.runtime,i=r.instances[owner];return !disposed&&s.phase==='app'&&!s.sleeping&&r.active===owner&&!!i&&!i.suspended&&!i.closing&&i.appId==='sound'&&i.state.trackId===effect.trackId&&i.state.revision===effect.revision;},
    onEvent(owner,event){if(disposed)return;const now=options.now();options.beforeMutation?.(now);const current=options.getState();if(current.system?.runtime.active!==owner)return;const next=dispatchSystemEvent(current,event,now);if(next!==current){options.setState(next);drain(false);options.onChange();}},
  });
  const adapter = createCapabilityAdapter({
    storage: options.storage, environment: options.environment,
    isCurrent: item => !disposed && isRuntimeEffectCurrent(options.getState().system!.runtime, item),
    onResult(owner, event) {
      if (disposed) return;
      const now = options.now(); options.beforeMutation?.(now);
      const current = options.getState(), next = resolveSystemCapability(current, owner, event, now);
      if (next === current) return;
      options.setState(next); drain(false); options.onChange();
    },
  });
  function write(work: (storage: FirmwareStorage) => Promise<void>) {
    writes = writes.then(async () => {
      if (!options.storage) throw new FirmwareStorageError('unavailable');
      await work(options.storage);
    }).catch(report);
  }
  function persistPreferences() {
    if (disposed) return;
    const next = saveSettings(options.getState());
    if (next === preferences) return;
    preferences = next; write(storage => storage.savePreferences(next));
  }
  function drain(userGesture: boolean) {
    if (disposed || draining) return;
    draining = true;
    try {
      const state=options.getState().system!;music.setVolume(state.volume,state.muted);
      // A synchronous capability result can append another effect during execute.
      while (options.getState().system!.runtime.effects.length) {
        options.beforeMutation?.(options.now());
        const effects = options.getState().system!.runtime.effects;
        options.setState(acknowledgeSystemEffects(options.getState(), effects.map(item => item.id)));
        for (const item of effects) {
          const effect = item.effect;
          if (effect.type === 'storage') write(storage => effect.removedMedia
            ? storage.saveSharedAndDeleteMedia(effect.record, effect.removedMedia)
            : storage.saveRecord(effect.key, effect.record));
          else if (effect.type === 'release-capabilities') {adapter.release(item.owner);music.release(item.owner);}
          else if (effect.type === 'music') music.execute(item.owner,effect);
          else if (effect.type === 'capability') {
            if (isRuntimeEffectCurrent(options.getState().system!.runtime, item)) void adapter.execute(item, { userGesture }).catch(report);
          } else if (effect.type === 'sound') options.onSound(effect.name);
          else if (effect.type === 'link' && userGesture && /^(https:\/\/|mailto:)/i.test(effect.url)) options.onLink(effect.url);
        }
      }
    } finally { draining = false; }
    persistPreferences();
  }
  return {
    drain, persistPreferences, getPreview: adapter.getPreview, getMotion: adapter.getMotion,
    settled: () => writes,
    dispose() {
      if (disposed) return;
      disposed = true; adapter.dispose(); music.dispose();
      // Complete already emitted save writes before closing their database.
      void writes.finally(() => options.storage?.dispose());
    },
  };
}
