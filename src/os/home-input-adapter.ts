import {
  createHomeInputSampler, sampleHomeInput, setHomeDigitalSource, setHomePrimaryAxis,
  type HomeInputSampler, type HomeInputSampleResult,
} from './home-input-sample.ts';

export type HomeInputDirection = 'right' | 'left' | 'up' | 'down';
export type HomeInputAdapterButton = Readonly<{
  source: string;
  command: HomeInputDirection;
  phase: 'down' | 'up' | 'repeat';
}>;
type DigitalSource = Readonly<{ mask: number; observed: boolean; pendingRelease: boolean }>;
export type HomeInputAdapter = Readonly<{
  sampler: HomeInputSampler;
  sources: Readonly<Record<string, DigitalSource>>;
}>;
export type HomeInputAdapterSample = Readonly<{
  state: HomeInputAdapter;
  /** Unmodified result of the one native sample, before expired pulses are removed. */
  sample: HomeInputSampleResult;
}>;

const directionMasks = Object.freeze({ right: 0x10, left: 0x20, up: 0x40, down: 0x80 });
function snapshot(sampler: HomeInputSampler, sources: HomeInputAdapter['sources']): HomeInputAdapter {
  return Object.freeze({ sampler,
    sources: Object.freeze(Object.fromEntries(Object.entries(sources).map(([id, value]) => [id, Object.freeze({ ...value })]))),
  });
}

export function createHomeInputAdapter(): HomeInputAdapter {
  return snapshot(createHomeInputSampler(), {});
}

/** Browser adaptation: an unobserved down survives its up until one explicit
 * sample. This minimum pulse is not native HID behavior or measured latency.
 * Each source owns one current direction; stale ups cannot clear its replacement.
 * Source updates never sample input or advance the native producer.
 */
export function updateHomeInputAdapterButton(state: HomeInputAdapter, event: HomeInputAdapterButton): HomeInputAdapter {
  if (typeof event.source !== 'string' || event.source.trim().length === 0) throw new TypeError('Invalid HOME adapter source');
  if (typeof event.command !== 'string' || !Object.hasOwn(directionMasks, event.command)) throw new RangeError('Invalid HOME adapter direction');
  if (!['down', 'up', 'repeat'].includes(event.phase)) throw new TypeError('Invalid HOME adapter button phase');
  if (event.phase === 'repeat') return state;
  const mask = directionMasks[event.command];
  const previous = Object.hasOwn(state.sources, event.source) ? state.sources[event.source] : undefined;
  if (event.phase === 'up') {
    if (!previous || previous.mask !== mask || previous.pendingRelease) return state;
    if (!previous.observed) {
      return snapshot(state.sampler, { ...state.sources, [event.source]: { ...previous, pendingRelease: true } });
    }
    const sources = { ...state.sources };
    delete sources[event.source];
    return snapshot(setHomeDigitalSource(state.sampler, event.source, 0), sources);
  }
  if (previous?.mask === mask && !previous.pendingRelease) return state;
  return snapshot(setHomeDigitalSource(state.sampler, event.source, mask), {
    ...state.sources, [event.source]: { mask, observed: false, pendingRelease: false },
  });
}

/** The host routes its one primary circle-pad source here. Browser positive Y
 * points down; native positive Y points up. No device arbitration or clamping.
 */
export function setHomeInputAdapterAxis(state: HomeInputAdapter, x: number, y: number): HomeInputAdapter {
  // Validate before negation so coercible nonnumbers cannot become valid axes.
  if (!Number.isFinite(y) || y < -1 || y > 1) throw new RangeError('Invalid normalized HOME primary axis');
  return snapshot(setHomePrimaryAxis(state.sampler, x, -y), state.sources);
}

/** The host calls this once per eligible sample. Eligibility remains external.
 * Removal after sampling retains the raw previous-held mask, so the next sample
 * sees release unless another digital source still owns that bit.
 */
export function sampleHomeInputAdapter(state: HomeInputAdapter): HomeInputAdapterSample {
  const sample = sampleHomeInput(state.sampler);
  let sampler = sample.state;
  const sources: [string, DigitalSource][] = [];
  for (const [id, source] of Object.entries(state.sources)) {
    if (source.pendingRelease) sampler = setHomeDigitalSource(sampler, id, 0);
    else sources.push([id, { ...source, observed: true }]);
  }
  return Object.freeze({ state: snapshot(sampler, Object.fromEntries(sources)), sample });
}

/** The host must deliver any required consumer cancellation before resetting.
 * Reset itself emits nothing and clears sources, pulses, axes and edge history.
 */
export function resetHomeInputAdapter(): HomeInputAdapter {
  return createHomeInputAdapter();
}
