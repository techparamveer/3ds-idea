export type MotionVector = { x: number; y: number; z: number };
export type MotionRotation = { alpha: number; beta: number; gamma: number };
/** One DeviceMotion event. Null fields were not reported by the sensor. */
export type MotionReading = {
  acceleration: MotionVector | null;
  accelerationIncludingGravity: MotionVector | null;
  rotationRate: MotionRotation | null;
  interval: number;
};
/** `insecure`: the API exists, but browsers deliver no events outside HTTPS or localhost. */
export type MotionAccess = 'available' | 'permission-required' | 'insecure' | 'unsupported';
export type MotionSensor = {
  access: MotionAccess;
  /** iOS Safari only. Must be called from a user gesture. */
  requestPermission?: () => Promise<PermissionState>;
  listen?: (callback: (reading: MotionReading) => void) => () => void;
};
type MotionPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<PermissionState> };
const finite = (...values: (number | null | undefined)[]) => values.every(v => typeof v === 'number' && Number.isFinite(v));
const vector = (v: DeviceMotionEventAcceleration | null | undefined): MotionVector | null => v && finite(v.x, v.y, v.z) ? { x: v.x!, y: v.y!, z: v.z! } : null;
const rotation = (r: DeviceMotionEventRotationRate | null | undefined): MotionRotation | null => r && finite(r.alpha, r.beta, r.gamma) ? { alpha: r.alpha!, beta: r.beta!, gamma: r.gamma! } : null;

/** The page's single DeviceMotion boundary, shared by app capabilities and the lid flick. */
export function browserMotionSensor(): MotionSensor {
  const motion = globalThis.DeviceMotionEvent as MotionPermission | undefined;
  if (!globalThis.window || !motion) return { access: 'unsupported' };
  const requestPermission = typeof motion.requestPermission === 'function' ? motion.requestPermission.bind(motion) : undefined;
  return {
    access: !window.isSecureContext ? 'insecure' : requestPermission ? 'permission-required' : 'available',
    requestPermission,
    listen: callback => {
      const listener = (event: DeviceMotionEvent) => {
        const reading = { acceleration: vector(event.acceleration), accelerationIncludingGravity: vector(event.accelerationIncludingGravity), rotationRate: rotation(event.rotationRate), interval: Number.isFinite(event.interval) ? event.interval : 0 };
        // Desktop Chrome sends one all-null event when no sensor exists.
        if (reading.acceleration || reading.accelerationIncludingGravity || reading.rotationRate) callback(reading);
      };
      window.addEventListener('devicemotion', listener);
      return () => window.removeEventListener('devicemotion', listener);
    },
  };
}
