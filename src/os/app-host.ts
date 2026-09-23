import { getAppModule, getTitle } from './app-registry.ts';
import { initialSharedData } from './stock-apps.ts';
import type { AppEffect, AppEvent, AppState, AppView, SaveRecord } from './app-types.ts';
export type AppInstance = { id: string; appId: string; state: AppState; caller: string | null; requestId: string | null; suspended: boolean; requests: Record<string, number>; closing?: boolean };
export type RuntimeEffect = { id: number; owner: string; effect: AppEffect | { type: 'storage'; key: string; record: SaveRecord; removedMedia?: string[] } };
export type AppRuntime = {
  instances: Record<string, AppInstance>; application: string | null; systemApplet: string | null;
  libraryApplet: string | null; active: string | null; homeReturn: string | null; sleeping: boolean;
  sequence: number; effectSequence: number; effects: RuntimeEffect[]; shared: AppState;
  saves: Record<string, SaveRecord>; pendingLaunch: string | null; link: string | null;
  lastTick: number;
};
export function createAppRuntime(shared?: AppState, saves: Record<string, SaveRecord> = {}): AppRuntime {
  return { instances: {}, application: null, systemApplet: null, libraryApplet: null, active: null, homeReturn: null, sleeping: false, sequence: 0, effectSequence: 0, effects: [], shared: { ...initialSharedData(), ...shared }, saves, pendingLaunch: null, link: null, lastTick: 0 };
}
export function activeInstance(runtime: AppRuntime) { return runtime.active ? runtime.instances[runtime.active] : undefined; }
export function runtimeView(runtime: AppRuntime, now = runtime.lastTick): AppView | null {
  const active = activeInstance(runtime); return active ? getAppModule(active.appId)!.view(active.state, { now, shared: runtime.shared }) : null;
}
function emit(runtime: AppRuntime, owner: string, effect: RuntimeEffect['effect']): AppRuntime {
  const id = runtime.effectSequence + 1;
  const instance = runtime.instances[owner];
  const instances = effect.type === 'capability' && instance ? { ...runtime.instances, [owner]: { ...instance, requests: { ...instance.requests, [effect.requestId]: id } } } : runtime.instances;
  return { ...runtime, instances, effectSequence: id, effects: [...runtime.effects, { id, owner, effect }] };
}
export function acknowledgeEffects(runtime: AppRuntime, ids: readonly number[]): AppRuntime {
  const consumed = new Set(ids); return { ...runtime, effects: runtime.effects.filter(effect => !consumed.has(effect.id)), link: null };
}
function saveInstance(runtime: AppRuntime, owner: string): AppRuntime {
  const instance = runtime.instances[owner]; if (!instance) return runtime;
  const module = getAppModule(instance.appId)!;
  if (module.descriptor.source === 'firmware') return runtime;
  const record = { version: module.descriptor.saveVersion, data: module.save(instance.state) };
  return emit({ ...runtime, saves: { ...runtime.saves, [instance.appId]: record } }, owner, { type: 'storage', key: instance.appId, record });
}
function applyEffects(runtime: AppRuntime, owner: string, effects: readonly AppEffect[], now: number, depth: number): AppRuntime {
  if (depth > 16) throw new Error('Applet transition recursion limit');
  let next = runtime;
  for (const effect of effects) {
    if (!next.instances[owner]) break;
    if (next.instances[owner].closing && !['save', 'shared', 'release-capabilities'].includes(effect.type) && !(effect.type === 'music' && effect.command === 'pause')) continue;
    if (effect.type === 'save') next = saveInstance(next, owner);
    else if (effect.type === 'shared') {
      next = { ...next, shared: { ...next.shared, [effect.key]: effect.value } };
      next = emit(next, owner, { type: 'storage', key: '@shared', record: { version: 1, data: next.shared } });
    } else if (effect.type === 'remove-media') {
      const items = next.shared[effect.collection];
      if (!effect.id || !Array.isArray(items)) continue;
      const kept = items.filter(item => !item || typeof item !== 'object' || Array.isArray(item) || item.id !== effect.id);
      if (kept.length === items.length) continue;
      next = { ...next, shared: { ...next.shared, [effect.collection]: kept } };
      next = emit(next, owner, { type: 'storage', key: '@shared', record: { version: 1, data: next.shared }, removedMedia: [effect.id] });
    } else if (effect.type === 'invoke') next = openApplet(next, effect.appId, effect.requestId, effect.args ?? {}, now, owner, depth + 1);
    else if (effect.type === 'complete') next = completeApplet(next, owner, effect.value ?? null, effect.cancelled ?? false, now, depth + 1);
    else if (effect.type === 'home') next = returnFromSettingsHelper(next, owner, now) ?? showRuntimeHome(next, now);
    else if (effect.type === 'close') {
      const instance = next.instances[owner];
      if (getTitle(instance.appId)!.kind === 'application') next = closeApplication(next, now);
      else next = completeApplet(next, owner, null, true, now, depth + 1);
    } else if (effect.type === 'launch') next = { ...next, pendingLaunch: effect.appId };
    else if (effect.type === 'link') next = { ...emit(next, owner, effect), link: effect.url };
    else if (effect.type === 'release-capabilities') next = releaseCapabilities(next, owner);
    else if (effect.type !== 'capability' || (!next.sleeping && next.active === owner && !next.instances[owner].suspended)) next = emit(next, owner, effect);
  }
  return next;
}
function deliver(runtime: AppRuntime, owner: string, event: AppEvent, now: number, depth = 0): AppRuntime {
  const instance = runtime.instances[owner]; if (!instance) return runtime;
  const module = getAppModule(instance.appId)!;
  const result = module.reduce(instance.state, event, { now, shared: runtime.shared });
  const next = result.state === instance.state ? runtime : { ...runtime, instances: { ...runtime.instances, [owner]: { ...instance, state: result.state } } };
  return result.effects?.length ? applyEffects(next, owner, result.effects, now, depth) : next;
}
/** Invalidates queued and in-flight requests even if the same owner later resumes. */
function releaseCapabilities(runtime: AppRuntime, owner: string): AppRuntime {
  const instance = runtime.instances[owner];
  const next = { ...runtime, instances: instance ? { ...runtime.instances, [owner]: { ...instance, requests: {} } } : runtime.instances,
    effects: runtime.effects.filter(item => item.owner !== owner || item.effect.type !== 'capability') };
  return emit(next, owner, { type: 'release-capabilities' });
}
export function isRuntimeEffectCurrent(runtime: AppRuntime, item: RuntimeEffect): boolean {
  const instance = runtime.instances[item.owner];
  return item.effect.type !== 'capability' || (Number.isSafeInteger(item.id) && !runtime.sleeping && runtime.active === item.owner && !!instance && !instance.suspended && !instance.closing && Object.hasOwn(instance.requests, item.effect.requestId) && instance.requests[item.effect.requestId] === item.id);
}
function suspend(runtime: AppRuntime, owner: string | null, now: number): AppRuntime {
  if (!owner || !runtime.instances[owner] || runtime.instances[owner].suspended) return runtime;
  const marked = { ...runtime, instances: { ...runtime.instances, [owner]: { ...runtime.instances[owner], suspended: true } } };
  const next = releaseCapabilities(deliver(marked, owner, { type: 'lifecycle', phase: 'suspend' }, now), owner);
  if (!next.instances[owner]) return next;
  return { ...next, instances: { ...next.instances, [owner]: { ...next.instances[owner], suspended: true } } };
}
function resume(runtime: AppRuntime, owner: string | null, now: number): AppRuntime {
  if (!owner || !runtime.instances[owner]) return { ...runtime, active: null };
  const next = { ...runtime, active: owner, instances: { ...runtime.instances, [owner]: { ...runtime.instances[owner], suspended: false } } };
  return deliver(next, owner, { type: 'lifecycle', phase: 'resume' }, now);
}
function newInstance(runtime: AppRuntime, appId: string, args: AppState, caller: string | null, requestId: string | null, now: number): { runtime: AppRuntime; id: string } | null {
  const module = getAppModule(appId); if (!module) return null;
  const serial = runtime.sequence + 1, id = `${appId}:${serial}`, saved = runtime.saves[appId];
  let restored = null;
  try { restored = saved ? module.migrate(saved.data, saved.version) : null; } catch { /* A malformed save cannot prevent launch. */ }
  const state = module.create(args, restored, { now, shared: runtime.shared });
  return { runtime: { ...runtime, sequence: serial, instances: { ...runtime.instances, [id]: { id, appId, state, caller, requestId, suspended: false, requests: {} } }, active: id }, id };
}
export function startApplication(runtime: AppRuntime, appId: string, now: number): AppRuntime {
  if (!Number.isFinite(now) || runtime.sleeping || getTitle(appId)?.kind !== 'application') return runtime;
  if (runtime.application && runtime.instances[runtime.application]?.appId === appId) return resumeRuntimeApplication(runtime, now);
  let next = closeApplication(runtime, now);
  const created = newInstance(next, appId, {}, null, null, now); if (!created) return runtime;
  next = { ...created.runtime, application: created.id, pendingLaunch: null, lastTick: now };
  if (getTitle(appId)!.source === 'firmware') return next;
  const activity = typeof next.shared.activity === 'object' && next.shared.activity && !Array.isArray(next.shared.activity) ? next.shared.activity as AppState : {};
  const old = activity[appId]; const previous = old && typeof old === 'object' && !Array.isArray(old) ? old : {};
  next = { ...next, shared: { ...next.shared, activity: { ...activity, [appId]: { ...previous, title: getTitle(appId)!.title, launches: Number(previous.launches ?? 0) + 1, seconds: Number(previous.seconds ?? 0) } } } };
  return emit(next, created.id, { type: 'storage', key: '@shared', record: { version: 1, data: next.shared } });
}
const settingsHelpers = new Set(['nnid-settings', 'system-updater', 'system-transfer']);
/** Settings subprograms retain their parent page instead of closing Settings.
 * This is a bounded UI route, not a general application stack. */
export function startSettingsHelper(runtime: AppRuntime, appId: string, now: number): AppRuntime {
  const parent=activeInstance(runtime);
  if(!Number.isFinite(now)||runtime.sleeping||!settingsHelpers.has(appId)||!parent||parent.appId!=='system-settings'||parent.id!==runtime.application||parent.suspended)return runtime;
  const suspended=suspend(runtime,parent.id,now);
  const created=newInstance(suspended,appId,{},parent.id,null,now);
  return created?{...created.runtime,application:created.id,pendingLaunch:null,homeReturn:null,lastTick:now}:runtime;
}
function returnFromSettingsHelper(runtime: AppRuntime, owner: string, now: number): AppRuntime|null {
  const child=runtime.instances[owner],parent=child?.caller?runtime.instances[child.caller]:undefined;
  if(!child||child.id!==runtime.application||!settingsHelpers.has(child.appId)||parent?.appId!=='system-settings')return null;
  const removed=removeInstance(runtime,owner,now);
  return {...resume(removed,parent.id,now),application:parent.id,homeReturn:null,pendingLaunch:null,lastTick:now};
}
export function openApplet(runtime: AppRuntime, appId: string, requestId: string, args: AppState, now: number, caller = runtime.active, depth = 0): AppRuntime {
  const descriptor = getTitle(appId); if (!Number.isFinite(now) || runtime.sleeping || !descriptor || descriptor.kind === 'application') return runtime;
  if (Object.values(runtime.instances).filter(instance => getTitle(instance.appId)?.kind === 'library-applet').length >= 8) return runtime;
  let next = runtime;
  // A system applet occupies a different slot from the suspended application.
  if (descriptor.kind === 'system-applet' && next.systemApplet) next = completeApplet(next, next.systemApplet, null, true, now, depth + 1);
  if (caller && !next.instances[caller]) caller = next.active;
  next = suspend(next, next.active, now);
  if (caller && !next.instances[caller]) caller = next.active;
  const created = newInstance(next, appId, args, caller, requestId, now); if (!created) return runtime;
  return { ...created.runtime, [descriptor.kind === 'library-applet' ? 'libraryApplet' : 'systemApplet']: created.id, lastTick: now };
}
export function completeApplet(runtime: AppRuntime, owner: string, value: import('./app-types.ts').JsonValue, cancelled: boolean, now: number, depth = 0): AppRuntime {
  const instance = runtime.instances[owner]; if (!instance || getTitle(instance.appId)?.kind === 'application') return runtime;
  let next = removeInstance(runtime, owner, now);
  next = resume(next, instance.caller, now);
  const active = activeInstance(next);
  next = { ...next, libraryApplet: active && getTitle(active.appId)?.kind === 'library-applet' ? active.id : null };
  if (instance.caller && instance.requestId) next = deliver(next, instance.caller, { type: 'applet-result', requestId: instance.requestId, value, cancelled }, now, depth + 1);
  return next;
}
function removeInstance(runtime: AppRuntime, owner: string, now: number): AppRuntime {
  const instance = runtime.instances[owner];
  if (!instance || instance.closing) return runtime;
  let next = { ...runtime, instances: { ...runtime.instances, [owner]: { ...instance, closing: true } } };
  for (const instance of Object.values(runtime.instances)) if (instance.caller === owner) next = removeInstance(next, instance.id, now);
  next = deliver(next, owner, { type: 'lifecycle', phase: 'close' }, now);
  next = saveInstance(next, owner);
  next = releaseCapabilities(next, owner);
  const instances = { ...next.instances }; delete instances[owner];
  return { ...next, instances, active: next.active === owner ? null : next.active, application: next.application === owner ? null : next.application, systemApplet: next.systemApplet === owner ? null : next.systemApplet, libraryApplet: next.libraryApplet === owner ? null : next.libraryApplet, homeReturn: next.homeReturn === owner ? null : next.homeReturn };
}
export function closeApplication(runtime: AppRuntime, now: number): AppRuntime {
  let next = runtime;
  for (const instance of Object.values(runtime.instances)) if (!instance.caller && next.instances[instance.id]) next = removeInstance(next, instance.id, now);
  return { ...next, active: null, application: null, systemApplet: null, libraryApplet: null, homeReturn: null, pendingLaunch: null };
}
export function showRuntimeHome(runtime: AppRuntime, now: number): AppRuntime {
  if (!Number.isFinite(now) || !runtime.active) return runtime;
  const active = runtime.active;
  const next = suspend(runtime, active, now);
  return { ...next, active: null, homeReturn: next.instances[active] ? active : null, lastTick: now };
}
export function resumeRuntimeApplication(runtime: AppRuntime, now: number): AppRuntime {
  if (!Number.isFinite(now) || runtime.sleeping) return runtime;
  const owner = runtime.homeReturn && runtime.instances[runtime.homeReturn] ? runtime.homeReturn : runtime.application;
  return { ...resume(runtime, owner, now), homeReturn: null, lastTick: now };
}
export function setRuntimeSleeping(runtime: AppRuntime, sleeping: boolean, now: number): AppRuntime {
  if (!Number.isFinite(now) || runtime.sleeping === sleeping) return runtime;
  let next = { ...runtime, sleeping, lastTick: now };
  for (const instance of Object.values(next.instances)) {
    next = deliver(next, instance.id, { type: 'lifecycle', phase: sleeping ? 'sleep' : 'wake' }, now);
    if (sleeping) next = releaseCapabilities(next, instance.id);
  }
  return next;
}
export function dispatchRuntime(runtime: AppRuntime, event: AppEvent, now: number): AppRuntime {
  if (!Number.isFinite(now) || runtime.sleeping || !runtime.active) return runtime;
  return event.type === 'capability-result' ? deliverCapabilityResult(runtime, runtime.active, event, now) : deliver(runtime, runtime.active, event, now);
}
export function deliverCapabilityResult(runtime: AppRuntime, owner: string, event: Extract<AppEvent, { type: 'capability-result' }>, now: number): AppRuntime {
  // Late permission/media completions must not mutate a suspended or closed app.
  const instance = runtime.instances[owner];
  if (!Number.isFinite(now) || !Number.isSafeInteger(event.requestToken) || runtime.sleeping || runtime.active !== owner || !instance || instance.suspended || instance.closing || !Object.hasOwn(instance.requests, event.requestId) || instance.requests[event.requestId] !== event.requestToken) return runtime;
  const requests = { ...instance.requests }; delete requests[event.requestId];
  return deliver({ ...runtime, instances: { ...runtime.instances, [owner]: { ...instance, requests } } }, owner, event, now);
}
export function tickRuntime(runtime: AppRuntime, now: number): AppRuntime {
  if (!Number.isFinite(now) || now < runtime.lastTick) return runtime;
  if (runtime.sleeping || !runtime.active) return runtime.lastTick === now ? runtime : { ...runtime, lastTick: now };
  const elapsedMs = Math.min(1000, now - runtime.lastTick);
  let next = dispatchRuntime({ ...runtime, lastTick: now }, { type: 'tick', elapsedMs }, now);
  const active = activeInstance(next);
  if (active && active.id === next.application && getTitle(active.appId)?.source === 'portfolio' && elapsedMs > 0) {
    const activity = next.shared.activity as AppState, current = activity[active.appId] as AppState;
    next = { ...next, shared: { ...next.shared, activity: { ...activity, [active.appId]: { ...current, seconds: Number(current.seconds ?? 0) + elapsedMs / 1000 } } } };
  }
  return next;
}
