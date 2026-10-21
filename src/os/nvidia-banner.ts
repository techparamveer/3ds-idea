/** Blender-authored portfolio adaptation, independent of native firmware packs. */
/** Wider than the other banners so the logo draws about 1.4x larger. */
const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 148;
const COLUMNS = 8;
const INTRO_FRAMES = 80;
/** Seamless idle sway after the intro, like the other portfolio banners. */
const IDLE_FRAMES = 160;
const FRAME_COUNT = INTRO_FRAMES + IDLE_FRAMES;
const FPS = 30000 / 1001;
const LOGO_HOLD_FRAME = INTRO_FRAMES - 1;
/** Centres the logo and caption between the status bar and the HOME toolbar. */
const DRAW_X = (400 - FRAME_WIDTH) / 2;
const DRAW_Y = 20;
const CAPTION_Y = 152;

export function createNvidiaBanner() {
  let image: HTMLImageElement | undefined;
  let ready = false;
  let disposed = false;
  let startedAt: number | undefined;
  let captionReady = false;
  const captionFont = new FontFace('NVIDIA-NALA', 'url(/portfolio/nvidia-transform/nvidia-nala.woff2)', { weight: '100 900' });

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
    ready: Promise.all([load(), captionFont.load().then(font => {
      if (disposed) return;
      document.fonts.add(font);
      captionReady = true;
    }).catch(() => { /* Keep the logo available if the caption font fails to load. */ })]),
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
        FRAME_WIDTH, FRAME_HEIGHT, DRAW_X, DRAW_Y, FRAME_WIDTH, FRAME_HEIGHT);
      if (captionReady && (reduced || elapsedFrames >= INTRO_FRAMES)) {
        context.font = '700 25px "NVIDIA-NALA"';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#454952';
        context.fillText('Hack for Impact', 200, CAPTION_Y);
      }
      context.restore();
      return true;
    },
    reset() {
      startedAt = undefined;
    },
    dispose() {
      disposed = true;
      ready = false;
      captionReady = false;
      document.fonts.delete(captionFont);
      image?.removeAttribute('src');
      image = undefined;
    },
  };
}
