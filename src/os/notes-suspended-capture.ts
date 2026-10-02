import type { AppRuntime } from './app-host';
import type { NativePixels } from './native-layout';

/** Game Notes' view of the application slot. `missing` is a suspended
 * application whose complete LCD pair was never painted (for example, HOME was
 * pressed while its native screen was still loading); it is not "no software".
 */
export type SuspendedCapture =
  | { status: 'none' }
  | { status: 'missing'; owner: string }
  | { status: 'ready'; owner: string; generation: number; upper: NativePixels; lower: NativePixels };

type Surface = { width: number; height: number; getContext(type: '2d'): CanvasRenderingContext2D | null };
type Source = CanvasImageSource & { width: number; height: number };
const LCD = { upper: [400, 240], lower: [320, 240] } as const;

/** ImageScreenUp samples its capture panes with UVs [1,0, 1,1, 0,0, 0,1].
 * Store the upright W×H row-major LCD rotated 90° clockwise (H×W) so the
 * source UVs display it unrotated.
 */
export function rotateCaptureForNativeUV(width: number, height: number, rgba: ArrayLike<number>): NativePixels {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || rgba.length !== width * height * 4) throw new Error('Invalid LCD capture');
  const data = new Uint8ClampedArray(rgba.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const from = (y * width + x) * 4, to = (x * height + (height - 1 - y)) * 4;
    data[to] = rgba[from]; data[to + 1] = rgba[from + 1]; data[to + 2] = rgba[from + 2]; data[to + 3] = rgba[from + 3];
  }
  return { width: height, height: width, data };
}

/** One in-memory LCD pair for the current application instance. Frames are
 * copied only while that instance is the visible foreground owner, so HOME,
 * applets, loading/recovery screens and later owners can never replace it.
 * Nothing here is serialized; closing or replacing the instance frees it.
 */
export function createSuspendedApplicationCapture(options: { createSurface?: (width: number, height: number) => Surface } = {}) {
  const create = options.createSurface ?? ((width: number, height: number) => { const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas; });
  let owner: string | null = null, generation = 0, disposed = false;
  let surfaces: { upper: Surface; lower: Surface } | undefined;
  let converted: { generation: number; upper: NativePixels; lower: NativePixels } | undefined;
  function release() {
    if (surfaces) for (const surface of [surfaces.upper, surfaces.lower]) surface.width = surface.height = 0;
    owner = null; surfaces = undefined; converted = undefined;
  }
  function sync(runtime: AppRuntime) { if (owner !== null && runtime.application !== owner) release(); }
  function pixels(surface: Surface, [width, height]: readonly [number, number]) {
    return rotateCaptureForNativeUV(width, height, surface.getContext('2d')!.getImageData(0, 0, width, height).data);
  }
  return {
    sync,
    /** HOME borrows the same owned frozen frame without another readback or copy.
     * Flat presentation is an adaptation until the native capture warp is decoded. */
    drawUpper(runtime: AppRuntime, target: CanvasRenderingContext2D): boolean {
      if(disposed)return false;
      sync(runtime);
      const application=runtime.application,instance=application?runtime.instances[application]:undefined;
      if(!instance||!instance.suspended||instance.closing||runtime.active===application||owner!==application||!surfaces)return false;
      // HOME owns the HUD and camera hints; never retain the app's old clock.
      target.drawImage(surfaces.upper as CanvasImageSource,0,24,400,188,0,24,400,188);
      return true;
    },
    /** Call only after a complete application pair has been painted. */
    record(runtime: AppRuntime, instance: string, upper: Source, lower: Source): boolean {
      if (disposed) return false;
      sync(runtime);
      const current = runtime.instances[instance];
      if (runtime.sleeping || runtime.application !== instance || runtime.active !== instance || !current || current.suspended || current.closing) return false;
      if (upper.width !== LCD.upper[0] || upper.height !== LCD.upper[1] || lower.width !== LCD.lower[0] || lower.height !== LCD.lower[1]) return false;
      if (owner !== instance) { release(); owner = instance; }
      const target = surfaces ??= { upper: create(...LCD.upper), lower: create(...LCD.lower) };
      for (const [surface, source] of [[target.upper, upper], [target.lower, lower]] as const) {
        const ctx = surface.getContext('2d')!;
        ctx.save(); ctx.resetTransform(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'copy'; ctx.drawImage(source, 0, 0); ctx.restore();
      }
      generation++; converted = undefined; return true;
    },
    read(runtime: AppRuntime): SuspendedCapture {
      if (disposed) return { status: 'none' };
      sync(runtime);
      const application = runtime.application, instance = application ? runtime.instances[application] : undefined;
      if (!application || !instance || !instance.suspended || instance.closing || runtime.active === application) return { status: 'none' };
      if (owner !== application || !surfaces) return { status: 'missing', owner: application };
      // Read back once per frozen frame; the resumed owner invalidates it.
      const pair = converted?.generation === generation ? converted : (converted = { generation, upper: pixels(surfaces.upper, LCD.upper), lower: pixels(surfaces.lower, LCD.lower) });
      return { status: 'ready', owner: application, generation, upper: pair.upper, lower: pair.lower };
    },
    dispose() { if (disposed) return; disposed = true; release(); },
  };
}
