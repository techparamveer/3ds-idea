import { HOME_BANNER_PERIOD, homeBannerYawAtCounter, type HomeBannerMotion } from '../os/home-banner-lifecycle';

/** Presentation-only source phase for a local LCD fixture; never advances HOME. */
export function settingsBannerPhase(motion: HomeBannerMotion, reduced: boolean, frame?: number, skeletalFrame?: number) {
  if (skeletalFrame !== undefined && (frame === undefined || !Number.isSafeInteger(skeletalFrame) || skeletalFrame < 0 || skeletalFrame >= HOME_BANNER_PERIOD)) throw new RangeError('Invalid diagnostic skeletal frame; an explicit banner frame is required');
  if (frame !== undefined) {
    if (!Number.isSafeInteger(frame) || frame < 0 || frame >= HOME_BANNER_PERIOD) throw new RangeError('Invalid diagnostic banner frame');
    return { yawRadians: homeBannerYawAtCounter(frame), skeletalFrame: skeletalFrame ?? frame, sample: { kind: 'synthetic-source-pose' as const, frame, yawRadians: homeBannerYawAtCounter(frame), skeletalFrame: skeletalFrame ?? frame, ...(skeletalFrame === undefined ? {} : { clockRelationship: 'independent-diagnostic' as const }) } };
  }
  return { yawRadians: reduced ? 0 : motion.yawRadians, skeletalFrame: reduced ? 0 : motion.skeletal.frame, sample: null };
}
