/** Pure source snapshots for HOME's digital and primary-axis sample channels.
 * Axis coordinates are normalized native coordinates: positive Y points up.
 * Updating a source never consumes a sample or advances an edge history.
 */
export type HomeInputMasks = Readonly<{ held: number; pressed: number; released: number }>;
export type HomeInputSampler = Readonly<{
  digitalSources: Readonly<Record<string, number>>;
  primaryAxis: Readonly<{ x: number; y: number }>;
  previousDigitalHeld: number;
  previousPrimaryHeld: number;
}>;
export type HomeInputSampleResult = Readonly<{
  state: HomeInputSampler;
  digital: HomeInputMasks;
  primary: HomeInputMasks;
  combined: HomeInputMasks;
}>;

function mask(value: number, allowed: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff || (value & ~allowed) !== 0) {
    throw new RangeError(`Invalid HOME sample ${name}`);
  }
}
function axis(value: number): void {
  if (!Number.isFinite(value) || value < -1 || value > 1) throw new RangeError('Invalid normalized HOME primary axis');
}
function source(value: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) throw new TypeError('Invalid HOME digital source');
}
function validate(state: HomeInputSampler): void {
  mask(state.previousDigitalHeld, 0xdfff, 'previous digital mask');
  mask(state.previousPrimaryHeld, 0xf0, 'previous primary mask');
  axis(state.primaryAxis.x); axis(state.primaryAxis.y);
  if (!state.digitalSources || typeof state.digitalSources !== 'object'
    || ![null, Object.prototype].includes(Object.getPrototypeOf(state.digitalSources))) {
    throw new TypeError('Invalid HOME digital source record');
  }
  for (const [id, held] of Object.entries(state.digitalSources)) { source(id); mask(held, 0xffff, 'digital mask'); }
}
function snapshot(state: HomeInputSampler): HomeInputSampler {
  return Object.freeze({
    digitalSources: Object.freeze({ ...state.digitalSources }),
    primaryAxis: Object.freeze({ x: Math.fround(state.primaryAxis.x), y: Math.fround(state.primaryAxis.y) }),
    previousDigitalHeld: state.previousDigitalHeld, previousPrimaryHeld: state.previousPrimaryHeld,
  });
}

export function createHomeInputSampler(): HomeInputSampler {
  return snapshot({ digitalSources: {}, primaryAxis: { x: 0, y: 0 }, previousDigitalHeld: 0, previousPrimaryHeld: 0 });
}

/** Each source supplies its whole current held mask. Zero removes that source;
 * another digital source holding the same bit continues to own that bit.
 */
export function setHomeDigitalSource(state: HomeInputSampler, sourceId: string, heldMask: number): HomeInputSampler {
  validate(state); source(sourceId); mask(heldMask, 0xffff, 'digital mask');
  const digitalSources = { ...state.digitalSources, [sourceId]: heldMask };
  if (heldMask === 0) delete digitalSources[sourceId];
  return snapshot({ ...state, digitalSources });
}

/** One primary analog channel, after platform calibration. The native float32
 * sample is retained. Browser positive-Y-down conversion belongs to its caller.
 */
export function setHomePrimaryAxis(state: HomeInputSampler, x: number, y: number): HomeInputSampler {
  validate(state); axis(x); axis(y);
  return snapshot({ ...state, primaryAxis: { x, y } });
}

const edges = (held: number, previous: number): HomeInputMasks => Object.freeze({
  held, pressed: held & ~previous, released: previous & ~held,
});

/** Consume one explicit normalized sample. Primary release may overlap combined
 * held bits; never derive combined edges from the combined held mask.
 */
export function sampleHomeInput(state: HomeInputSampler): HomeInputSampleResult {
  validate(state);
  let digitalHeld = 0;
  for (const held of Object.values(state.digitalSources)) digitalHeld |= held;
  // Native reader 0x12cb48..6c clears this bit before the outer edge calculation.
  digitalHeld &= 0xdfff;
  const x = Math.fround(state.primaryAxis.x), y = Math.fround(state.primaryAxis.y);
  const primaryHeld = (x > .5 ? 0x10 : 0) | (x < -.5 ? 0x20 : 0)
    | (y > .5 ? 0x40 : 0) | (y < -.5 ? 0x80 : 0);
  const digital = edges(digitalHeld, state.previousDigitalHeld);
  const primary = edges(primaryHeld, state.previousPrimaryHeld);
  return Object.freeze({
    state: snapshot({ ...state, previousDigitalHeld: digitalHeld, previousPrimaryHeld: primaryHeld }),
    digital, primary,
    combined: Object.freeze({ held: digital.held | primary.held,
      pressed: digital.pressed | primary.pressed, released: digital.released | primary.released }),
  });
}
