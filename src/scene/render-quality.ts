import type { HomeApplicationTransition } from '../os/home-application-transition';
import { appLaunchPose, bootRevealFrame, shutdownTransitionPose, systemTransitionDuration } from '../os/system-transitions';

export type RenderQuality = {
  tier: 'high' | 'balanced' | 'constrained';
  pixelRatio: number;
  shadowMapSize: number;
  renderFps: number;
  screenFps: number;
  surfaceSize: number;
  useVgpu: boolean;
  antialias: boolean;
};

export type RenderCapabilities = {
  devicePixelRatio: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  saveData?: boolean;
  width: number;
  height: number;
};

/** Keep the drawing buffer sharp while bounding its area as the viewport grows. */
export function pixelRatioForViewport(tier: RenderQuality['tier'], devicePixelRatio: number, width: number, height: number): number {
  const cap = tier === 'high' ? 2 : tier === 'balanced' ? 1.75 : 1.5;
  const budget = tier === 'high' ? 8_000_000 : tier === 'balanced' ? 7_000_000 : 6_000_000;
  return Math.min(devicePixelRatio, cap, Math.sqrt(budget / Math.max(1, width * height)));
}

/** Short counted transitions may use the scene budget; idle LCD loops retain
 * the lower upload cadence. State still advances independently of painting. */
export function screenPaintFps(quality: RenderQuality, transitionAdvanced: boolean): number {
  return transitionAdvanced ? quality.renderFps : quality.screenFps;
}

/** Transition endpoints and retirement cannot be skipped by the ordinary LCD cadence. */
export function applicationCloseNeedsPaint(before: HomeApplicationTransition | null,
  after: HomeApplicationTransition | null, reduced: boolean, resumed = false): boolean {
  if (!after) return before !== after;
  const endpoint = reduced || after.phase === 'terminal'
    || (after.phase === 'exiting' && after.dialogExitFrame === 0)
    || after.phase === 'exit-terminal'
    || (after.phase === 'footer-exiting' && after.footerExitFrame === 0)
    || after.phase === 'footer-terminal'
    || (after.phase === 'footer-returning' && after.footerReturnFrame === 0)
    || after.phase === 'return-terminal';
  return endpoint && (before !== after || resumed);
}

/** Reduced motion still presents the configured short source fade. Its endpoint
 * must also bypass idle LCD throttling on normal low-quality renders. */
export function bootRevealNeedsPaint(frame: number | null, lastPainted: number | null, reduced: boolean): boolean {
  return frame !== null && frame !== lastPainted && (reduced || frame === 20);
}

export type BootTerminalIdentity = Readonly<{
  since: number;
  contextGeneration: number;
}>;

type BootSystem = Readonly<{
  phase: string;
  since: number;
}>;

/** Identity for the paired terminal boot pose selected by the current boot
 * owner and the WebGL context that can present it. */
export function bootTerminalIdentity(system: BootSystem, elapsedMs: number, reduced: boolean,
  contextGeneration: number): BootTerminalIdentity | null {
  if (system.phase !== 'boot' || bootRevealFrame(elapsedMs - system.since, reduced) !== 20) return null;
  return { since: system.since, contextGeneration };
}

export function sameBootTerminalIdentity(a: BootTerminalIdentity | null,
  b: BootTerminalIdentity | null): boolean {
  return !!a && !!b && a.since === b.since && a.contextGeneration === b.contextGeneration;
}

export function bootTerminalDeadlineReached(system: BootSystem, elapsedMs: number, reduced: boolean): boolean {
  return system.phase === 'boot' && elapsedMs - system.since >= systemTransitionDuration('boot', reduced);
}

export function bootTerminalPublicationPending(system: BootSystem, elapsedMs: number, reduced: boolean,
  contextGeneration: number, presented: BootTerminalIdentity | null): boolean {
  if (!bootTerminalDeadlineReached(system, elapsedMs, reduced)) return false;
  return !sameBootTerminalIdentity(bootTerminalIdentity(system, elapsedMs, reduced, contextGeneration), presented);
}

export type LaunchTerminalIdentity = Readonly<{
  since: number;
  app: string;
  owner: string;
  contextGeneration: number;
}>;

type LaunchSystem = Readonly<{
  phase: string;
  since: number;
  app: string | null;
  runtime: Readonly<{ application: string | null; active: string | null }>;
}>;

/** Identity for the paired launch endpoint selected by the active application
 * owner and the WebGL context that can present it. Normal motion ends at C14;
 * reduced motion intentionally holds the existing adapted B15 pose. */
export function launchTerminalIdentity(system: LaunchSystem, elapsedMs: number, reduced: boolean,
  contextGeneration: number): LaunchTerminalIdentity | null {
  const owner = system.runtime.active;
  if (system.phase !== 'launch' || !system.app || !owner || owner !== system.runtime.application) return null;
  const pose = appLaunchPose(elapsedMs - system.since, reduced).logo;
  if (!pose || (reduced ? pose.clip !== 'B' || pose.frame !== 15 : pose.clip !== 'C' || pose.frame !== 14)) return null;
  return { since: system.since, app: system.app, owner, contextGeneration };
}

export function sameLaunchTerminalIdentity(a: LaunchTerminalIdentity | null,
  b: LaunchTerminalIdentity | null): boolean {
  return !!a && !!b && a.since === b.since && a.app === b.app && a.owner === b.owner
    && a.contextGeneration === b.contextGeneration;
}

export function launchTerminalDeadlineReached(system: LaunchSystem, elapsedMs: number, reduced: boolean): boolean {
  return system.phase === 'launch' && elapsedMs - system.since >= systemTransitionDuration('launch', reduced);
}

export function launchTerminalPublicationPending(system: LaunchSystem, elapsedMs: number, reduced: boolean,
  contextGeneration: number, presented: LaunchTerminalIdentity | null): boolean {
  if (!launchTerminalDeadlineReached(system, elapsedMs, reduced)) return false;
  return !sameLaunchTerminalIdentity(
    launchTerminalIdentity(system, elapsedMs, reduced, contextGeneration), presented);
}

export type ShutdownTerminalIdentity = Readonly<{
  since: number;
  returnPhase: 'home' | 'app';
  contextGeneration: number;
}>;

type ShutdownSystem = Readonly<{
  phase: string;
  since: number;
  returnPhase: 'home' | 'app';
}>;

/** Identity for the selected paired terminal shutdown pose. It is scoped to
 * both the transition owner and WebGL context that can actually present it. */
export function shutdownTerminalIdentity(system: ShutdownSystem, elapsedMs: number, reduced: boolean,
  contextGeneration: number): ShutdownTerminalIdentity | null {
  if (system.phase !== 'shutdown'
    || shutdownTransitionPose(elapsedMs - system.since, reduced).sleepSceneOutFrame !== 60) return null;
  return { since: system.since, returnPhase: system.returnPhase, contextGeneration };
}

export function sameShutdownTerminalIdentity(a: ShutdownTerminalIdentity | null,
  b: ShutdownTerminalIdentity | null): boolean {
  return !!a && !!b && a.since === b.since && a.returnPhase === b.returnPhase
    && a.contextGeneration === b.contextGeneration;
}

export function shutdownTerminalDeadlineReached(system: ShutdownSystem, elapsedMs: number, reduced: boolean): boolean {
  return system.phase === 'shutdown' && elapsedMs - system.since >= systemTransitionDuration('shutdown', reduced);
}

export function shutdownTerminalPublicationPending(system: ShutdownSystem, elapsedMs: number, reduced: boolean,
  contextGeneration: number, presented: ShutdownTerminalIdentity | null): boolean {
  if (!shutdownTerminalDeadlineReached(system, elapsedMs, reduced)) return false;
  return !sameShutdownTerminalIdentity(
    shutdownTerminalIdentity(system, elapsedMs, reduced, contextGeneration), presented);
}

/** One policy owns expensive renderer choices so the scene cannot drift. */
export function chooseRenderQuality(capabilities: RenderCapabilities): RenderQuality {
  const pixels = capabilities.width * capabilities.height;
  const constrained = capabilities.saveData === true
    || (capabilities.hardwareConcurrency ?? 8) <= 4
    || (capabilities.deviceMemory ?? 8) <= 4
    || pixels > 3_000_000;
  if (constrained) return {
    tier: 'constrained', pixelRatio: pixelRatioForViewport('constrained', capabilities.devicePixelRatio, capabilities.width, capabilities.height),
    shadowMapSize: 512, renderFps: 30, screenFps: 12, surfaceSize: 256,
    useVgpu: false, antialias: false,
  };
  const high = (capabilities.hardwareConcurrency ?? 8) >= 8
    && (capabilities.deviceMemory ?? 8) >= 8
    && pixels <= 2_100_000;
  return {
    tier: high ? 'high' : 'balanced',
    pixelRatio: pixelRatioForViewport(high ? 'high' : 'balanced', capabilities.devicePixelRatio, capabilities.width, capabilities.height),
    shadowMapSize: 1024,
    renderFps: high ? 60 : 45,
    screenFps: high ? 24 : 18,
    surfaceSize: 512,
    useVgpu: true,
    antialias: true,
  };
}

export function browserRenderQuality(host: HTMLElement): RenderQuality {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return chooseRenderQuality({
    devicePixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory,
    saveData: connection?.saveData,
    width: host.clientWidth || window.innerWidth,
    height: host.clientHeight || window.innerHeight,
  });
}
