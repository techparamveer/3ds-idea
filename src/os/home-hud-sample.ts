import type { NativePack } from './native-layout';

/** Isolated Azahar reference-profile HOME HUD. This is not AC/PTM telemetry
 * and does not claim the browser is online. The poses come from the 26
 * September native still and the profile coin file (42). WalkCoin stays
 * time-driven. Labelled adaptation. */
export const HOME_REFERENCE_HUD_STATUS = {
  networkMessage: 'lau_connect0',
  netModeFrame: 0,
  netAtnFrame: 3,
  batteryFrame: 4,
  coins: 42,
  steps: 0,
} as const;

/** Explicit source-pose diagnostic, never device telemetry or persisted state.
 * Clip frames and message selection are independent: the HOME service mapping
 * has not been traced. The caller must record their evidence/assumptions. */
export type DiagnosticHomeHudSample = Readonly<{
  kind: 'source-pose';
  evidence: string;
  networkMessage: 'lau_connect0' | 'lau_connect1' | 'lau_connect2' | 'lau_connect3' | 'lau_connect4';
  netModeFrame: number;
  netAtnFrame: number;
  batteryFrame: number;
  walkCoinFrame: number;
  coins: number;
  steps: number;
}>;

export function validateHomeHudSample(sample: DiagnosticHomeHudSample, pack: NativePack): void {
  if (sample.kind !== 'source-pose' || typeof sample.evidence !== 'string' || !sample.evidence.trim()
      || !/^lau_connect[0-4]$/.test(sample.networkMessage)) throw new Error('Invalid HOME HUD diagnostic evidence or message');
  for (const [key, clip] of [
    ['netModeFrame', 'NetMode'], ['netAtnFrame', 'NetAtn'],
    ['batteryFrame', 'Bat'], ['walkCoinFrame', 'WalkCoin'],
  ] as const) {
    const value = sample[key], animation = pack.animations[`HudMenu_00_${clip}`];
    if (!animation || !Number.isFinite(value) || value < 0 || value >= animation.frames
        || (clip !== 'WalkCoin' && !Number.isInteger(value))) throw new Error(`Invalid HOME HUD diagnostic ${key}`);
  }
  // These are displayed decimal counters, not imported native saves.
  for (const key of ['coins', 'steps'] as const) {
    if (!Number.isSafeInteger(sample[key]) || sample[key] < 0) throw new Error(`Invalid HOME HUD diagnostic ${key}`);
  }
}
