import type { HomeApplicationTransition } from '../os/home-application-transition';

/** Read before advancing the clock: retirement must not admit the same input. */
export function applicationCloseAllowsInput(transition: HomeApplicationTransition | null, input: string): boolean {
  return !transition || ['tick', 'hinge', 'blur', 'visibility', 'power', 'mute', 'volume-up', 'volume-down'].includes(input);
}
