/** Tracks whether the next console frame can differ from the last presented one.
 *
 * The WebGL canvas keeps showing its last frame when nothing is drawn, so an
 * unchanged pose with unchanged LCD textures and materials needs no render.
 * Geometry motion (hinge, pose, zoom, pressed controls) is sampled as numbers;
 * texture, material and drawing-buffer changes invalidate explicitly.
 * Only geometry motion invalidates the shadow map: LCD content casts no shadow.
 */
export function createRenderSchedule(epsilon = 1e-6) {
  let presented: number[] | null = null;
  let invalidated = true;
  function moved(sample: readonly number[]) {
    if (!presented || presented.length !== sample.length) return true;
    for (let index = 0; index < sample.length; index++) {
      const previous = presented[index], next = sample[index];
      if (previous === next) continue;
      if (!(Math.abs(previous - next) <= epsilon)) return true;
    }
    return false;
  }
  return {
    /** A texture, material or drawing-buffer change must reach the canvas. */
    invalidate() { invalidated = true; },
    /** Returns whether to render, and whether the shadow map needs recomputing. */
    plan(sample: readonly number[]) {
      const geometry = moved(sample);
      return { render: geometry || invalidated, shadows: geometry };
    },
    /** Record the frame that was drawn. */
    presented(sample: readonly number[]) { presented = [...sample]; invalidated = false; },
  };
}
