/** Blender-authored portfolio adaptation, independent of native firmware packs. */
const COLUMNS = 8;
const FPS = 30000 / 1001;
/** Longer than the slowest idle LCD cadence, so an on-screen banner stays "drawn". */
const ON_SCREEN_MS = 200;

export type OxHackBannerSpec = {
  url: string;
  frameWidth: number;
  frameHeight: number;
  introFrames: number;
  /** Seamless idle sway after the intro, like the other portfolio banners. */
  idleFrames: number;
  x: number;
  y: number;
};

/** Plays like the Hack LDN banner, but these large atlases load on the first
 * draw instead of delaying startup, and the intro clock waits for the decode. */
export function createOxHackBanner(spec: OxHackBannerSpec) {
  const { url, frameWidth, frameHeight, introFrames, idleFrames, x, y } = spec;
  const frameCount = introFrames + idleFrames;
  const holdFrame = introFrames - 1;
  let image: HTMLImageElement | undefined;
  let ready = false;
  let disposed = false;
  let startedAt: number | undefined;
  let drawnAt: number | undefined;
  let drawnFrame = -1;

  function load() {
    const pending = new Image();
    image = pending;
    pending.src = url;
    pending.decode().then(() => {
      if (!disposed && image === pending) {
        ready = pending.naturalWidth === frameWidth * COLUMNS
          && pending.naturalHeight === frameHeight * Math.ceil(frameCount / COLUMNS);
      }
    }).catch(() => { /* The existing source logo remains visible if loading fails. */ });
  }

  function frameAt(time: number, reduced: boolean) {
    const elapsedFrames = Math.max(0, time - (startedAt ?? time)) * FPS / 1000;
    const played = Math.floor(elapsedFrames);
    return reduced ? holdFrame
      : played < introFrames ? played : introFrames + (played - introFrames) % idleFrames;
  }

  return {
    draw(context: CanvasRenderingContext2D, time: number, reduced: boolean) {
      if (disposed) return false;
      if (!image) load();
      if (!ready || !image) return false;
      if (startedAt === undefined) {
        startedAt = time;
      }
      const frame = frameAt(time, reduced);
      drawnAt = time;
      drawnFrame = frame;
      context.save();
      context.imageSmoothingEnabled = false;
      context.drawImage(image, (frame % COLUMNS) * frameWidth, Math.floor(frame / COLUMNS) * frameHeight,
        frameWidth, frameHeight, x, y, frameWidth, frameHeight);
      context.restore();
      return true;
    },
    /** The idle LCD cadence is below this atlas's frame rate, so it would drop frames. */
    frameDue(time: number, reduced: boolean) {
      return drawnAt !== undefined && time - drawnAt < ON_SCREEN_MS && frameAt(time, reduced) !== drawnFrame;
    },
    reset() {
      startedAt = undefined;
      drawnAt = undefined;
    },
    dispose() {
      disposed = true;
      ready = false;
      image?.removeAttribute('src');
      image = undefined;
    },
  };
}
