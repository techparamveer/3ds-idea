export type RenderQuality = {
  tier: 'high' | 'balanced' | 'constrained';
  pixelRatio: number;
  shadowMapSize: number;
  renderFps: number;
  screenFps: number;
  surfaceSize: number;
  useVgpu: boolean;
  antialias: boolean;
};

export type RenderCapabilities = {
  devicePixelRatio: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  saveData?: boolean;
  width: number;
  height: number;
};

/** Keep the drawing buffer sharp while bounding its area as the viewport grows. */
export function pixelRatioForViewport(tier: RenderQuality['tier'], devicePixelRatio: number, width: number, height: number): number {
  const cap = tier === 'high' ? 2 : tier === 'balanced' ? 1.75 : 1.5;
  const budget = tier === 'high' ? 8_000_000 : tier === 'balanced' ? 7_000_000 : 6_000_000;
  return Math.min(devicePixelRatio, cap, Math.sqrt(budget / Math.max(1, width * height)));
}

/** The largest drawing buffer (device px, longer side) that the compact model
 * serves. It halves only textures above 2048 px; below this size the console
 * never samples their full-resolution level, and matched screenshots differ by
 * at most a few levels. Every phone screen, including 932 px ones at the 1.75
 * DPR cap, stays under it; laptops and tablets exceed it. */
export const COMPACT_MODEL_MAX_BUFFER = 1700;

/** Choose by the screen, not the current window, so enlarging a window can never
 * reach a drawing buffer larger than the loaded textures were chosen for. */
export function prefersCompactModel(tier: RenderQuality['tier'], devicePixelRatio: number, screenWidth: number, screenHeight: number): boolean {
  const ratio = pixelRatioForViewport(tier, devicePixelRatio, screenWidth, screenHeight);
  return Math.max(screenWidth, screenHeight) * ratio <= COMPACT_MODEL_MAX_BUFFER;
}

/** Short counted transitions may use the scene budget; idle LCD loops retain
 * the lower upload cadence. State still advances independently of painting. */
export function screenPaintFps(quality: RenderQuality, transitionAdvanced: boolean): number {
  return transitionAdvanced ? quality.renderFps : quality.screenFps;
}

/** One policy owns expensive renderer choices so the scene cannot drift. */
export function chooseRenderQuality(capabilities: RenderCapabilities): RenderQuality {
  const pixels = capabilities.width * capabilities.height;
  const constrained = capabilities.saveData === true
    || (capabilities.hardwareConcurrency ?? 8) <= 4
    || (capabilities.deviceMemory ?? 8) <= 4
    || pixels > 3_000_000;
  if (constrained) return {
    tier: 'constrained', pixelRatio: pixelRatioForViewport('constrained', capabilities.devicePixelRatio, capabilities.width, capabilities.height),
    shadowMapSize: 512, renderFps: 30, screenFps: 12, surfaceSize: 256,
    useVgpu: false, antialias: false,
  };
  const high = (capabilities.hardwareConcurrency ?? 8) >= 8
    && (capabilities.deviceMemory ?? 8) >= 8
    && pixels <= 2_100_000;
  return {
    tier: high ? 'high' : 'balanced',
    pixelRatio: pixelRatioForViewport(high ? 'high' : 'balanced', capabilities.devicePixelRatio, capabilities.width, capabilities.height),
    shadowMapSize: 1024,
    renderFps: high ? 60 : 45,
    screenFps: high ? 24 : 18,
    surfaceSize: 512,
    useVgpu: true,
    antialias: true,
  };
}

export function browserRenderQuality(host: HTMLElement): RenderQuality {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return chooseRenderQuality({
    devicePixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory,
    saveData: connection?.saveData,
    width: host.clientWidth || window.innerWidth,
    height: host.clientHeight || window.innerHeight,
  });
}
