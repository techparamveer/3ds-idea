/** Blender-authored portfolio adaptation, independent of native firmware packs. */
const FRAME_WIDTH = 180;
const FRAME_HEIGHT = 148;
const COLUMNS = 8;
const INTRO_FRAMES = 112;
/** Seamless idle sway after the intro, like the other portfolio banners. */
const IDLE_FRAMES = 160;
const FRAME_COUNT = INTRO_FRAMES + IDLE_FRAMES;
const FPS = 30000 / 1001;
const LOGO_HOLD_FRAME = INTRO_FRAMES - 1;
/** Centres the three-row logo between the status bar and the HOME toolbar. */
const DRAW_Y = 43;

/** 25 is part of the render, written by the chevron in the logo's own lettering. */
export function createHackLdnBanner() {
  let image: HTMLImageElement | undefined;
  let ready = false;
  let disposed = false;
  let startedAt: number | undefined;

  function load() {
    const pending = new Image();
    image = pending;
    pending.src = '/portfolio/hack-ldn-2025/atlas.png';
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
      const played = Math.floor(elapsedFrames);
      const frame = reduced ? LOGO_HOLD_FRAME
        : played < INTRO_FRAMES ? played : INTRO_FRAMES + (played - INTRO_FRAMES) % IDLE_FRAMES;
      context.save();
      context.imageSmoothingEnabled = false;
      context.drawImage(image, (frame % COLUMNS) * FRAME_WIDTH, Math.floor(frame / COLUMNS) * FRAME_HEIGHT,
        FRAME_WIDTH, FRAME_HEIGHT, 110, DRAW_Y, FRAME_WIDTH, FRAME_HEIGHT);
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
