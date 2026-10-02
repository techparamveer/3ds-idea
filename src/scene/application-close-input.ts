import type { HomeApplicationTransition } from '../os/home-application-transition';
import type { NativeScreenStatus } from '../os/stock-screen-presentation';

const GLOBAL_INPUTS = ['hinge', 'blur', 'visibility', 'power', 'mute', 'volume-up', 'volume-down'];

/** A missing close presentation cannot advance toward owner retirement. */
export function applicationCloseNeedsReadyScreen(transition: HomeApplicationTransition | null,
  status: NativeScreenStatus): boolean {
  return transition?.intent.kind === 'close' && transition.phase !== 'complete'
    && (status === 'loading' || status === 'error');
}

/** Read before advancing the clock: retirement must not admit the same input. */
export function applicationCloseAllowsInput(transition: HomeApplicationTransition | null, input: string,
  status: NativeScreenStatus = 'ready'): boolean {
  if (!transition) return true;
  if (GLOBAL_INPUTS.includes(input)) return true;
  if (!applicationCloseNeedsReadyScreen(transition, status)) return input === 'tick';
  return input === 'back' || input === 'home';
}
