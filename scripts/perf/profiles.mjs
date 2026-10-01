// Shared viewport/device profiles for the benchmark scripts.
export const PROFILES = {
  // Retina laptop window.
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false, cpuThrottle: 1,
    resize: [[1280, 800], [1024, 700], [1600, 1000], [1440, 900], [900, 900], [1920, 1080], [1200, 760], [1440, 900]] },
  // Phone-class viewport: 3x DPR, touch, 4x CPU slowdown and a 4-core / 4 GB
  // navigator so the scene's own quality policy selects its constrained tier.
  mobile: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true, cpuThrottle: 4, hardwareConcurrency: 4, deviceMemory: 4,
    resize: [[844, 390], [390, 844], [360, 740], [740, 360], [412, 915], [390, 844], [844, 390], [390, 844]] },
  // iPad Air 11-inch landscape: 2x DPR with touch. Uses the scene's own
  // tier policy (real hardware concurrency); no CPU throttle.
  ipad: { width: 1180, height: 820, deviceScaleFactor: 2, mobile: true, cpuThrottle: 1,
    resize: [[820, 1180], [1180, 820], [1024, 768], [768, 1024], [1180, 820], [820, 1180], [1180, 820], [1180, 820]] },
};
