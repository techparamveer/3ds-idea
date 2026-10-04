import { REFERENCE_DEVICE_STATUS, hudColonVisible } from './device-status-profile.ts';
import type { NativePack } from './native-layout';

/** Display projection of {@link REFERENCE_DEVICE_STATUS}. Live charging
 * frames come from the profile owner, not this static batteryFrame. */
export const HOME_REFERENCE_HUD_STATUS = {
  networkMessage: REFERENCE_DEVICE_STATUS.networkMessage,
  netModeFrame: REFERENCE_DEVICE_STATUS.netModeFrame,
  netAtnFrame: REFERENCE_DEVICE_STATUS.netAtnFrame,
  batteryFrame: REFERENCE_DEVICE_STATUS.batteryFrame,
  coins: REFERENCE_DEVICE_STATUS.coins,
  steps: REFERENCE_DEVICE_STATUS.steps,
} as const;

/** Idle HOME `0x27c6a8`: `T_TimeC_00` visible when current sampled seconds
 * (`+0xdd`) bit 0 is clear. Injected `Date.getSeconds()` supplies that byte;
 * `+0xcc`, hold `+0xb0` and WhiteBlack animator states 1/2 are not replayed. */
export function homeHudColonVisible(seconds: number): boolean {
  return hudColonVisible(seconds);
}

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
