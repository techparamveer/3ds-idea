import type { DiagnosticHomeHudSample } from '../os/home-hud-sample';

/** Local verification access to the browser's unscaled LCD paint surfaces. */
export function lcdCaptureEnabled(location: Pick<Location, 'hostname' | 'search'>, development: boolean): boolean {
  if (development) return true;
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
  return local && new URLSearchParams(location.search).get('lcdCapture') === '1';
}

/** Shape validation here; delivered firmware clip bounds are validated by the HUD
 * painter. Copy only the declared fields so metadata is the exact painted sample. */
export function lcdHomeHudSample(value: unknown, hostname?: string): DiagnosticHomeHudSample {
  if (!hostname || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) throw new Error('lcdHomeHudSample requires localhost');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid lcdHomeHudSample object');
  const sample = value as Record<string, unknown>;
  const keys = ['kind', 'evidence', 'networkMessage', 'netModeFrame', 'netAtnFrame', 'batteryFrame', 'walkCoinFrame', 'coins', 'steps'];
  if (Object.keys(sample).length !== keys.length || keys.some(key => !Object.hasOwn(sample, key))
      || sample.kind !== 'source-pose' || typeof sample.evidence !== 'string' || !sample.evidence.trim()
      || typeof sample.networkMessage !== 'string' || !/^lau_connect[0-4]$/.test(sample.networkMessage)) throw new Error('Invalid lcdHomeHudSample fields or evidence');
  for (const key of keys.slice(3)) {
    const n = sample[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || (key !== 'walkCoinFrame' && !Number.isSafeInteger(n))) throw new Error(`Invalid lcdHomeHudSample ${key}`);
  }
  return Object.freeze(Object.fromEntries(keys.map(key => [key, sample[key]]))) as DiagnosticHomeHudSample;
}

export function lcdDownloadRequest(search: string, hostname?: string) {
  const params = new URLSearchParams(search);
  const elapsedText = params.get('lcdElapsedMs');
  const dateText = params.get('lcdDate');
  const scenario = params.get('lcdScenario') ?? 'browser-lcd';
  const liveHealthHomeClock = params.has('lcdHealthBannerFrame');
  if (liveHealthHomeClock && (elapsedText !== null || dateText !== null)) throw new Error('Health HOME source frames use the live HOME clock; omit lcdElapsedMs and lcdDate');
  const bannerFrameText = params.get('lcdBannerFrame');
  const elapsedMs = elapsedText === null || elapsedText.trim() === '' ? NaN : Number(elapsedText);
  if (!liveHealthHomeClock && (!Number.isFinite(elapsedMs) || elapsedMs < 0 || !dateText || !Number.isFinite(new Date(dateText).getTime()))) {
    throw new Error('Set valid lcdElapsedMs and lcdDate query parameters before downloading LCDs');
  }
  if (!/^[a-z0-9-]{1,64}$/.test(scenario)) throw new Error('Invalid LCD scenario name');
  const bannerFrame = bannerFrameText === null ? undefined : Number(bannerFrameText);
  if (bannerFrame !== undefined && (bannerFrameText?.trim() === '' || !Number.isSafeInteger(bannerFrame) || bannerFrame < 0 || bannerFrame >= 600)) {
    throw new Error('lcdBannerFrame must be an integer from 0 to 599');
  }
  const healthFrameText = params.get('lcdHealthFrame');
  const healthFrame = healthFrameText === null ? undefined : Number(healthFrameText);
  if (healthFrame !== undefined) {
    if (!hostname || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) throw new Error('lcdHealthFrame requires localhost');
    if (!/^[0-9]+$/.test(healthFrameText!) || !Number.isSafeInteger(healthFrame) || healthFrame < 0 || healthFrame > 719) throw new Error('lcdHealthFrame must be an integer from 0 to 719');
    if (bannerFrame !== undefined) throw new Error('lcdHealthFrame cannot be combined with lcdBannerFrame');
  }
  const healthBannerFrameText = params.get('lcdHealthBannerFrame');
  const homeWallpaperFrameText = params.get('lcdHomeWallpaperFrame');
  const healthBannerFrame = healthBannerFrameText === null ? undefined : Number(healthBannerFrameText);
  const homeWallpaperFrame = homeWallpaperFrameText === null ? undefined : Number(homeWallpaperFrameText);
  if (healthBannerFrame !== undefined) {
    if (!hostname || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) throw new Error('Health HOME frame sampling requires localhost');
    if (homeWallpaperFrameText === null
      || !/^[0-9]+$/.test(healthBannerFrameText!) || !/^[0-9]+$/.test(homeWallpaperFrameText)
      || !Number.isSafeInteger(healthBannerFrame) || healthBannerFrame < 0 || healthBannerFrame > 599
      || !Number.isSafeInteger(homeWallpaperFrame) || homeWallpaperFrame! < 0 || homeWallpaperFrame! > 599) {
      throw new Error('lcdHealthBannerFrame and lcdHomeWallpaperFrame must both be integers from 0 to 599');
    }
  } else if (homeWallpaperFrame !== undefined) {
    if (!hostname || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) throw new Error('HOME wallpaper frame sampling requires localhost');
    if (!/^[0-9]+$/.test(homeWallpaperFrameText!) || !Number.isSafeInteger(homeWallpaperFrame) || homeWallpaperFrame < 0 || homeWallpaperFrame > 599) {
      throw new Error('lcdHomeWallpaperFrame must be an integer from 0 to 599');
    }
  }
  const skeletalText = params.get('lcdBannerSkeletalFrame');
  const bannerSkeletalFrame = skeletalText === null ? undefined : Number(skeletalText);
  if (bannerSkeletalFrame !== undefined) {
    if (!hostname || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) throw new Error('lcdBannerSkeletalFrame requires localhost');
    if (bannerFrame === undefined || !skeletalText!.trim() || !Number.isSafeInteger(bannerSkeletalFrame) || bannerSkeletalFrame < 0 || bannerSkeletalFrame > 599) throw new Error('lcdBannerSkeletalFrame requires lcdBannerFrame and an integer from 0 to 599');
  }
  const hudText = params.get('lcdHomeHudSample');
  const homeHudSample = hudText === null ? undefined : lcdHomeHudSample(JSON.parse(hudText), hostname);
  if (homeHudSample !== undefined && healthFrame !== undefined) throw new Error('lcdHomeHudSample cannot be combined with lcdHealthFrame');
  if (healthBannerFrame !== undefined && (bannerFrame !== undefined || healthFrame !== undefined || bannerSkeletalFrame !== undefined || homeHudSample !== undefined)) {
    throw new Error('Health HOME frames cannot be combined with other sampled banner or HUD frames');
  }
  if (healthBannerFrame === undefined && homeWallpaperFrame !== undefined && healthFrame !== undefined) {
    throw new Error('lcdHomeWallpaperFrame cannot be combined with lcdHealthFrame');
  }
  return { ...(bannerSkeletalFrame === undefined ? {} : { bannerSkeletalFrame }), ...(homeHudSample === undefined ? {} : { homeHudSample }), elapsedMs:liveHealthHomeClock?0:elapsedMs, isoDate:dateText===null?undefined:new Date(dateText).toISOString(), scenario, bannerFrame, ...(healthFrame === undefined ? {} : { healthFrame }), ...(healthBannerFrame === undefined ? (homeWallpaperFrame === undefined ? {} : { homeWallpaperFrame }) : { healthBannerFrame, homeWallpaperFrame }), ...(liveHealthHomeClock?{liveHealthHomeClock:true}:{}) };
}

export function lcdDownloadPayload(scenario: string, capture: ReturnType<typeof encodeNativeLcdPair> & Record<string, unknown>) {
  return JSON.stringify({ schema: 'browser-native-lcd-capture-v1', scenario, ...capture });
}

type CaptureCanvas = Pick<HTMLCanvasElement, 'width' | 'height' | 'toDataURL'>;

export function encodeNativeLcdPair(top: CaptureCanvas, bottom: CaptureCanvas) {
  if (top.width !== 400 || top.height !== 240 || bottom.width !== 320 || bottom.height !== 240) {
    throw new Error('LCD capture surfaces are not at native resolution');
  }
  const upper = top.toDataURL('image/png');
  const lower = bottom.toDataURL('image/png');
  if (!upper.startsWith('data:image/png;base64,') || !lower.startsWith('data:image/png;base64,')) {
    throw new Error('LCD PNG encoding failed');
  }
  return {
    top: upper,
    bottom: lower,
    dimensions: { top: { width: 400, height: 240 }, bottom: { width: 320, height: 240 } },
  };
}

// Three complete 720-frame source loops at the Health LCD VBlank rate, plus
// scheduling grace. A single browser rAF can skip the exact requested frame.
export const HEALTH_CAPTURE_TIMEOUT_MS = 3 * 720 * 1000 / (268111856 / 4481136) + 2000;

export type HealthCaptureSample = { healthTopLoopFrame: number; healthElapsedMs: number; reducedMotion: boolean };

/** Observe live updates; capture synchronously on the matching rAF, never seek
 * the app clock. A wall-clock timeout also bounds waits in a background tab. */
export function captureAtHealthFrame<T>(target: number, options: {
  read: () => HealthCaptureSample;
  capture: (sample: HealthCaptureSample, timestamp: number) => T;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  signal: AbortSignal;
  timeoutMs?: number;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    let request: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    let observed = 0, skippedTargets = 0;
    let previous: HealthCaptureSample | undefined;
    const finish = (error?: unknown, value?: T) => {
      if (done) return;
      done = true;
      if (request !== undefined) options.cancelFrame(request);
      if (timer !== undefined) clearTimeout(timer);
      options.signal.removeEventListener('abort', abort);
      if (error !== undefined) reject(error); else resolve(value as T);
    };
    const abort = () => finish(new Error('Health LCD capture cancelled'));
    const read = () => {
      const sample = options.read();
      if (!Number.isFinite(sample.healthElapsedMs) || sample.healthElapsedMs < 0 || !Number.isInteger(sample.healthTopLoopFrame) || sample.healthTopLoopFrame < 0 || sample.healthTopLoopFrame > 719) throw new Error('Health clock unavailable');
      if (sample.reducedMotion && target !== 0) throw new Error('Requested Health frame unavailable with reduced motion');
      if (previous && sample.healthElapsedMs >= previous.healthElapsedMs && sample.healthTopLoopFrame !== target) {
        const advance = (sample.healthTopLoopFrame - previous.healthTopLoopFrame + 720) % 720;
        const distance = (target - previous.healthTopLoopFrame + 720) % 720;
        if (distance > 0 && advance > distance) skippedTargets++;
      }
      previous = sample;
      observed++;
      return sample;
    };
    const tick: FrameRequestCallback = timestamp => {
      try {
        const sample = read();
        if (sample.healthTopLoopFrame === target) finish(undefined, options.capture(sample, timestamp));
        else request = options.requestFrame(tick);
      } catch (error) { finish(error); }
    };
    try {
      if (!Number.isInteger(target) || target < 0 || target > 719) throw new Error('Invalid Health capture frame');
      if (options.signal.aborted) { abort(); return; }
      read(); // Fail immediately if Health is not active or cannot reach the phase.
      options.signal.addEventListener('abort', abort, { once: true });
      // Retry later source loops without seeking either clock or substituting a
      // visually equivalent phase. Low browser cadence can still miss all three.
      timer = setTimeout(() => finish(new Error(`Timed out waiting for live Health frame ${target}; observed=${observed}, lastFrame=${previous?.healthTopLoopFrame ?? 'none'}, lastElapsedMs=${previous?.healthElapsedMs ?? 'none'}, skippedTargetCrossings=${skippedTargets}`)), options.timeoutMs ?? HEALTH_CAPTURE_TIMEOUT_MS);
      request = options.requestFrame(tick);
    } catch (error) { finish(error); }
  });
}
