import { HOME_BANNER_PERIOD, homeBannerYawAtCounter, type HomeBannerMotion } from '../os/home-banner-lifecycle';

/** Presentation-only source phase for a local LCD fixture; never advances HOME. */
export function settingsBannerPhase(motion: HomeBannerMotion, reduced: boolean, frame?: number) {
  if (frame !== undefined) {
    if (!Number.isSafeInteger(frame) || frame < 0 || frame >= HOME_BANNER_PERIOD) throw new RangeError('Invalid diagnostic banner frame');
    return { yawRadians: homeBannerYawAtCounter(frame), skeletalFrame: frame, sample: { kind: 'synthetic-source-pose' as const, frame, yawRadians: homeBannerYawAtCounter(frame), skeletalFrame: frame } };
  }
  return { yawRadians: reduced ? 0 : motion.yawRadians, skeletalFrame: reduced ? 0 : motion.skeletal.frame, sample: null };
}
