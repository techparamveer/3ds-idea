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
 * draw instead of delaying startup, and the intro clock waits for the decode.
 * The 2D source icon is not shown while the atlas is loading. */
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
  let loads = 0;
  /** Last paint asked for this banner before the atlas was ready. */
  let awaitingFirstFrame = false;

  function load() {
    const pending = new Image();
    image = pending;
    loads++;
    pending.src = url;
    pending.decode().then(() => {
      if (!disposed && image === pending) {
        ready = pending.naturalWidth === frameWidth * COLUMNS
          && pending.naturalHeight === frameHeight * Math.ceil(frameCount / COLUMNS);
      }
    }).catch(() => {
      // Leave the banner empty; the next draw retries once per selection.
      if (image === pending) release();
    });
  }

  function release() {
    ready = false;
    image?.removeAttribute('src');
    image = undefined;
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
      if (!image && loads < 2) load();
      if (!ready || !image) {
        awaitingFirstFrame = true;
        return false;
      }
      awaitingFirstFrame = false;
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
      if (awaitingFirstFrame && ready) return true;
      return drawnAt !== undefined && time - drawnAt < ON_SCREEN_MS && frameAt(time, reduced) !== drawnFrame;
    },
    /** A paint that leaves this banner off-screen must not keep frameDue forcing repaints. */
    hide() {
      drawnAt = undefined;
      awaitingFirstFrame = false;
    },
    /** Deselection drops the decoded atlas (tens of MB); the next draw reloads it. */
    reset() {
      startedAt = undefined;
      drawnAt = undefined;
      awaitingFirstFrame = false;
      loads = 0;
      release();
    },
    dispose() {
      disposed = true;
      release();
    },
  };
}
