import type { MenuState } from './state';
import type { NativeScreenStatus } from './stock-screen-presentation';
import { releaseSystemInputs, reduceSystem } from './system.ts';

/** Cancel held repeats/touches before the host ticks an unseen application.
 * No fetch, Canvas or readiness state is stored in the deterministic reducer. */
export function releaseUnreadyNativeInput(state:MenuState,status:NativeScreenStatus,now:number):MenuState{
  const s=state.system;
  if(!s||(status!=='loading'&&status!=='error'))return state;
  return Object.keys(s.input.held).length||Object.keys(s.input.analog).length||s.input.touch?releaseSystemInputs(state,now):state;
}
/** Recovery B/HOME suspends the current owner, preserving Settings/helper callers.
 * Launch normally ignores HOME; this explicit browser escape also works there. */
export function escapeUnreadyNativeScreen(state:MenuState,now:number):MenuState{
  const s=state.system;
  if(!s||s.sleeping||s.preferences||s.dialog||!['launch','app'].includes(s.phase))return state;
  const released=releaseSystemInputs(state,now);
  return reduceSystem({...released,system:{...released.system!,phase:'app'}},'home',now);
}
