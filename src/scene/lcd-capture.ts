/** Local verification access to the browser's unscaled LCD paint surfaces. */
export function lcdCaptureEnabled(location: Pick<Location, 'hostname' | 'search'>, development: boolean): boolean {
  if (development) return true;
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
  return local && new URLSearchParams(location.search).get('lcdCapture') === '1';
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
