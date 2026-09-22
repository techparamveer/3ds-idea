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

/** One policy owns expensive renderer choices so the scene cannot drift. */
export function chooseRenderQuality(capabilities: RenderCapabilities): RenderQuality {
  const pixels = capabilities.width * capabilities.height;
  const constrained = capabilities.saveData === true
    || (capabilities.hardwareConcurrency ?? 8) <= 4
    || (capabilities.deviceMemory ?? 8) <= 4
    || pixels > 3_000_000;
  if (constrained) return {
    tier: 'constrained', pixelRatio: Math.min(capabilities.devicePixelRatio, 1),
    shadowMapSize: 512, renderFps: 30, screenFps: 12, surfaceSize: 256,
    useVgpu: false, antialias: false,
  };
  const high = (capabilities.hardwareConcurrency ?? 8) >= 8
    && (capabilities.deviceMemory ?? 8) >= 8
    && pixels <= 2_100_000;
  return {
    tier: high ? 'high' : 'balanced',
    pixelRatio: Math.min(capabilities.devicePixelRatio, high ? 1.5 : 1.25),
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
