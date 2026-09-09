export const INTRO_DURATION_SECONDS = 2.8;
export const MAX_LID_DEGREES = 155;
export const REST_YAW = -0.16;

const settle = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** A short leftward presentation turn, then a weighted opening into a readable pose. */
export function sampleIntroPose(seconds: number) {
  if (seconds >= INTRO_DURATION_SECONDS) return { yaw: REST_YAW, angle: MAX_LID_DEGREES, done: true };
  const leftTurn = settle(seconds / 0.9);
  const faceFront = settle((seconds - 1.05) / 1.75);
  const yaw = 0.52 + (-0.62 - 0.52) * leftTurn + (REST_YAW + 0.62) * faceFront;
  const angle = MAX_LID_DEGREES * settle((seconds - 0.7) / 2.1);
  return { yaw, angle, done: seconds >= INTRO_DURATION_SECONDS };
}
