import type { MotionReading } from './motion-sensor.ts';

/** Thresholds for a deliberate wrist flick. Walking and hand tremor stay well
 * below them: a hand-held phone rarely pitches faster than ~100 deg/s or
 * accelerates beyond ~6 m/s² while its owner walks. */
export const FLICK = {
  /** Peak pitch rate about the device x axis, deg/s. */
  pitchPeak: 240,
  /** Every sample of the confirming run, deg/s. */
  pitchFloor: 150,
  /** Linear acceleration in the y-z plane when no gyroscope reports, m/s². */
  linearPeak: 18,
  linearFloor: 12,
  /** The flick axis must exceed the other axes by this factor. */
  dominance: 1.25,
  /** Consecutive qualifying samples; one noisy sample never fires. */
  samples: 2,
  /** A longer sample gap breaks a run. */
  maxGapMs: 120,
  /** Sustained rotation (turning round, a spinning chair) is not a flick. */
  maxRunMs: 450,
  cooldownMs: 1200,
} as const;

export type FlickSample = Pick<MotionReading, 'acceleration' | 'accelerationIncludingGravity' | 'rotationRate'> & { t: number };

/**
 * Recognise a short, sharp pitch of the phone (a downward flick) from
 * DeviceMotion samples. Either pitch direction counts: iOS and Android
 * disagree on several axis signs, and a forgiving gesture is easier to find.
 */
export function createFlickDetector(options: Partial<typeof FLICK> = {}) {
  const o = { ...FLICK, ...options };
  let gravity: { x: number; y: number; z: number } | null = null;
  let run = 0, runStart = 0, runEnd = 0, runPeak = false, lastT = -Infinity, cooldownUntil = -Infinity;
  function linear(sample: FlickSample) {
    if (sample.acceleration) return sample.acceleration;
    const a = sample.accelerationIncludingGravity;
    if (!a) return null;
    // Some Android sensors omit gravity-free acceleration. Remove a slow
    // gravity estimate so posture changes are not mistaken for a flick.
    gravity = gravity ? { x: gravity.x + (a.x - gravity.x) * .1, y: gravity.y + (a.y - gravity.y) * .1, z: gravity.z + (a.z - gravity.z) * .1 } : { ...a };
    return { x: a.x - gravity.x, y: a.y - gravity.y, z: a.z - gravity.z };
  }
  return {
    /** Returns true once for each recognised flick. */
    push(sample: FlickSample): boolean {
      const r = sample.rotationRate, l = linear(sample);
      let qualifies = false, peak = false;
      if (r) {
        const pitch = Math.abs(r.beta), off = Math.max(Math.abs(r.alpha), Math.abs(r.gamma));
        qualifies = pitch >= o.pitchFloor && pitch >= o.dominance * off;
        peak = pitch >= o.pitchPeak;
      } else if (l) {
        const flick = Math.hypot(l.y, l.z);
        qualifies = flick >= o.linearFloor && flick >= o.dominance * Math.abs(l.x);
        peak = flick >= o.linearPeak;
      }
      const continuing = qualifies && run > 0 && sample.t - lastT <= o.maxGapMs;
      lastT = sample.t;
      if (continuing) { run++; runEnd = sample.t; runPeak ||= peak; return false; }
      // A run is judged when it ends, so sustained rotation is never mistaken
      // for the start of a flick. This costs one sample of latency.
      const fired = run >= o.samples && runPeak && runEnd - runStart <= o.maxRunMs && runEnd >= cooldownUntil;
      if (fired) cooldownUntil = runEnd + o.cooldownMs;
      if (qualifies) { run = 1; runStart = runEnd = sample.t; runPeak = peak; } else { run = 0; runPeak = false; }
      return fired;
    },
    reset() { gravity = null; run = 0; runPeak = false; lastT = -Infinity; },
  };
}
