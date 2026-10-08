/** Blender-authored portfolio adaptation, independent of native firmware packs. */
const FRAME_WIDTH = 180;
const FRAME_HEIGHT = 148;
const COLUMNS = 8;
const FRAME_COUNT = 80;
const FPS = 30000 / 1001;
const LOGO_HOLD_FRAME = FRAME_COUNT - 1;

export function createNvidiaBanner(drawCaption?: (context: CanvasRenderingContext2D) => void) {
  let image: HTMLImageElement | undefined;
  let ready = false;
  let disposed = false;
  let startedAt: number | undefined;

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
      if (startedAt === undefined) {
        startedAt = time;
      }
      const elapsedFrames = Math.max(0, time - startedAt) * FPS / 1000;
      const frame = reduced ? LOGO_HOLD_FRAME : Math.min(LOGO_HOLD_FRAME, Math.floor(elapsedFrames));
      context.save();
      context.imageSmoothingEnabled = false;
      context.drawImage(image, (frame % COLUMNS) * FRAME_WIDTH, Math.floor(frame / COLUMNS) * FRAME_HEIGHT,
        FRAME_WIDTH, FRAME_HEIGHT, 110, 35, FRAME_WIDTH, FRAME_HEIGHT);
      if (reduced || elapsedFrames >= FRAME_COUNT) drawCaption?.(context);
      context.restore();
      return true;
    },
    reset() {
      startedAt = undefined;
    },
    dispose() {
      disposed = true;
      ready = false;
      image?.removeAttribute('src');
      image = undefined;
    },
  };
}
