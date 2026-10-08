/** Blender-authored portfolio adaptation, independent of native firmware packs. */
const FRAME_WIDTH = 180;
const FRAME_HEIGHT = 148;
const COLUMNS = 8;
const FRAME_COUNT = 96;
const FPS = 24;
const LOGO_HOLD_FRAME = 51;

export function createNvidiaBanner() {
  let image: HTMLImageElement | undefined;
  let ready = false;
  let disposed = false;
  let startedAt: number | undefined;
  let lastPaint: number | undefined;

  function load() {
    const pending = new Image();
    image = pending;
    pending.src = '/portfolio/nvidia-transform/atlas.png';
    return pending.decode().then(() => {
      if (!disposed && image === pending) {
        ready = pending.naturalWidth === FRAME_WIDTH * COLUMNS
          && pending.naturalHeight === FRAME_HEIGHT * (FRAME_COUNT / COLUMNS);
      }
    }).catch(() => { /* The existing source logo remains visible if loading fails. */ });
  }

  return {
    ready: load(),
    draw(context: CanvasRenderingContext2D, time: number, reduced: boolean) {
      if (!ready || !image || disposed) return false;
      if (startedAt === undefined || lastPaint === undefined || time < lastPaint || time - lastPaint > 250) {
        startedAt = time;
      }
      lastPaint = time;
      const frame = reduced ? LOGO_HOLD_FRAME : Math.floor((time - startedAt) * FPS / 1000) % FRAME_COUNT;
      context.save();
      context.imageSmoothingEnabled = false;
      context.drawImage(image, (frame % COLUMNS) * FRAME_WIDTH, Math.floor(frame / COLUMNS) * FRAME_HEIGHT,
        FRAME_WIDTH, FRAME_HEIGHT, 110, 35, FRAME_WIDTH, FRAME_HEIGHT);
      context.restore();
      return true;
    },
    reset() {
      startedAt = undefined;
      lastPaint = undefined;
    },
    dispose() {
      disposed = true;
      ready = false;
      image?.removeAttribute('src');
      image = undefined;
    },
  };
}
