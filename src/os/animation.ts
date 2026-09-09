/** Normalized animation math, not a claim to decode CLAN binary tracks. */
export type Keyframe = { frame: number; value: number; slope?: number };
export type Curve = { interpolation: 'step' | 'linear' | 'hermite'; keys: readonly Keyframe[] };

/** Validate once; retain a copy so later caller mutations cannot corrupt playback. */
export function compileCurve(curve: Curve): (frame: number) => number {
  if (!['step', 'linear', 'hermite'].includes(curve.interpolation) || !curve.keys.length) throw new Error('Invalid animation curve');
  const keys = curve.keys.map(key => ({ ...key })), mode = curve.interpolation;
  keys.forEach((key, i) => {
    if (!Number.isFinite(key.frame) || !Number.isFinite(key.value) || (i > 0 && key.frame <= keys[i - 1].frame) ||
        (mode === 'hermite' && !Number.isFinite(key.slope))) throw new Error('Invalid keyframe ordering/value/slope');
  });
  return frame => {
    if (!Number.isFinite(frame)) throw new Error('Invalid animation time');
    if (frame <= keys[0].frame) return keys[0].value;
    if (frame >= keys[keys.length - 1].frame) return keys[keys.length - 1].value;
    let low = 0, high = keys.length - 1;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (keys[middle].frame <= frame) low = middle;
      else high = middle;
    }
    const a = keys[low], b = keys[high], duration = b.frame - a.frame;
    const t = (frame - a.frame) / duration;
    if (mode === 'step') return a.value;
    if (mode === 'linear') return a.value + (b.value - a.value) * t;
    // Slopes are value per frame, not normalized tangents.
    return (2*t*t*t - 3*t*t + 1)*a.value + (t*t*t - 2*t*t + t)*duration*a.slope!
      + (-2*t*t*t + 3*t*t)*b.value + (t*t*t - t*t)*duration*b.slope!;
  };
}

/** Loop endpoint is excluded; non-looping playback holds the last frame. */
export function clipFrame(frame: number, duration: number, loop: boolean): number {
  if (!Number.isFinite(frame) || !Number.isFinite(duration) || duration < 0) throw new Error('Invalid clip time');
  if (duration === 0) return 0;
  return loop ? ((frame % duration) + duration) % duration : Math.max(0, Math.min(duration, frame));
}
