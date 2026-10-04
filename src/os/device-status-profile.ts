/** Single declared device-status / session-profile owner.
 * Isolated Azahar EUR 10.7.0-32E reference used for HOME comparison.
 * This is not AC/PTM/Uds telemetry and does not claim the browser is
 * online. Network operations remain out of scope. Charging=true is a
 * labelled adaptation of that profile's PTM default. */

export type DeviceStatusNetworkMessage =
  | 'lau_connect0'
  | 'lau_connect1'
  | 'lau_connect2'
  | 'lau_connect3'
  | 'lau_connect4';

export type DeviceStatusProfile = Readonly<{
  kind: 'reference-session-profile';
  evidence: string;
  networkMessage: DeviceStatusNetworkMessage;
  netModeFrame: number;
  netAtnFrame: number;
  /** Isolated Azahar PTM default. Not a live charger reading. */
  charging: boolean;
  lowBattery: boolean;
  /** Static clip when not charging, and the odd-second charging pose. */
  batteryFrame: number;
  coins: number;
  steps: number;
  whiteBlackFrame: number;
}>;

export const REFERENCE_DEVICE_STATUS = Object.freeze({
  kind: 'reference-session-profile',
  evidence: 'Isolated Azahar EUR 10.7.0-32E reference profile: Internet, 42 Play Coins, charging battery. Chosen to match HOME comparison stills; not live telemetry.',
  networkMessage: 'lau_connect0',
  netModeFrame: 0,
  netAtnFrame: 3,
  charging: true,
  lowBattery: false,
  batteryFrame: 4,
  coins: 42,
  steps: 0,
  whiteBlackFrame: 0,
} as const satisfies DeviceStatusProfile);

/** HOME idle `0x27c6a8`: `T_TimeC_00` visible when current seconds `+0xdd`
 * bit 0 is clear. Injected `Date.getSeconds()` supplies that byte. */
export function hudColonVisible(seconds: number): boolean {
  return (seconds & 1) === 0;
}

/** HOME `0x27c6e0..0x27c770` charging `G_Bat_00` (`+0x88`): odd `+0xdd`
 * writes float 4.0 at `0x27c780`, even writes 5.0 at `0x27c784`.
 * Settings `0x238f10` uses the same 4/5 mapping on cached seconds.
 * Notifications idle `0x181018` writes the same 4.0/5.0 through Bat
 * animator `+0x8c` from current `+0xd5` seconds. */
export function chargingBatteryFrame(seconds: number): 4 | 5 {
  return (seconds & 1) ? 4 : 5;
}

export function deviceStatusBatteryFrame(profile: DeviceStatusProfile, seconds: number): number {
  if (profile.charging && !profile.lowBattery) return chargingBatteryFrame(seconds);
  return profile.batteryFrame;
}

export function hudSecondParity(seconds: number): 0 | 1 {
  return (seconds & 1) as 0 | 1;
}

/** Reduced-motion HOME keeps the native 1 Hz colon/battery blink with a
 * cheap HUD-visible second-parity paint. WalkCoin and cursor stay frozen.
 * Labelled accessibility adaptation. */
export function homeHudReducedMotionRepaintDue(
  previousParity: number | null,
  seconds: number,
  hudVisible: boolean,
): boolean {
  return hudVisible && previousParity !== hudSecondParity(seconds);
}

/** Skip the parity paint when this animation frame already published for
 * the minute clock. The parity byte is still recorded. */
export function homeHudReducedMotionParityPaintDue(
  previousParity: number | null,
  seconds: number,
  hudVisible: boolean,
  paintedThisFrame: boolean,
): boolean {
  return !paintedThisFrame && homeHudReducedMotionRepaintDue(previousParity, seconds, hudVisible);
}
