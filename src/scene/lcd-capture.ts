/** Local verification access to the browser's unscaled LCD paint surfaces. */
export function lcdCaptureEnabled(location: Pick<Location, 'hostname' | 'search'>, development: boolean): boolean {
  if (development) return true;
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
  return local && new URLSearchParams(location.search).get('lcdCapture') === '1';
}

export function lcdDownloadRequest(search: string) {
  const params = new URLSearchParams(search);
  const elapsedText = params.get('lcdElapsedMs');
  const dateText = params.get('lcdDate');
  const scenario = params.get('lcdScenario') ?? 'browser-lcd';
  const bannerFrameText = params.get('lcdBannerFrame');
  const elapsedMs = elapsedText === null || elapsedText.trim() === '' ? NaN : Number(elapsedText);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || !dateText || !Number.isFinite(new Date(dateText).getTime())) {
    throw new Error('Set valid lcdElapsedMs and lcdDate query parameters before downloading LCDs');
  }
  if (!/^[a-z0-9-]{1,64}$/.test(scenario)) throw new Error('Invalid LCD scenario name');
  const bannerFrame = bannerFrameText === null ? undefined : Number(bannerFrameText);
  if (bannerFrame !== undefined && (bannerFrameText?.trim() === '' || !Number.isSafeInteger(bannerFrame) || bannerFrame < 0 || bannerFrame >= 600)) {
    throw new Error('lcdBannerFrame must be an integer from 0 to 599');
  }
  return { elapsedMs, isoDate: new Date(dateText).toISOString(), scenario, bannerFrame };
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
