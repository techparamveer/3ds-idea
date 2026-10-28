export const INTRO_DURATION_SECONDS = 2.8;
export const MAX_LID_DEGREES = 155;
export const REST_YAW = -0.16;

const settle = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** Handheld (phone) presentation: the turn ends square to the camera with the
 * lid shut, waiting for a flick or tap. */
export const HANDHELD_INTRO = { opens: false, restYaw: 0 } as const;

/** A short leftward presentation turn, then a weighted opening into a readable pose. */
export function sampleIntroPose(seconds: number, { opens = true, restYaw = REST_YAW }: { opens?: boolean; restYaw?: number } = {}) {
  const restAngle = opens ? MAX_LID_DEGREES : 0;
  if (seconds >= INTRO_DURATION_SECONDS) return { yaw: restYaw, angle: restAngle, done: true };
  const leftTurn = settle(seconds / 0.9);
  const faceFront = settle((seconds - 1.05) / 1.75);
  const yaw = 0.52 + (-0.62 - 0.52) * leftTurn + (restYaw + 0.62) * faceFront;
  const angle = restAngle * settle((seconds - 0.7) / 2.1);
  return { yaw, angle, done: seconds >= INTRO_DURATION_SECONDS };
}
