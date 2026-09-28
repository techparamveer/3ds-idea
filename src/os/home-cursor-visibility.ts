import type { MenuState } from './state.ts';
import { getHomeGestureView } from './home-gestures.ts';
import { getHomeNavigationView } from './home-navigation.ts';
import { isSystemHomeFolderClosing } from './home-folder-close-system.ts';

/** Shared primary-cursor presentation policy, not a claim about every native
 * layout visibility gate. Capture callers suppress drawing without mutating it.
 */
export function getHomeCursorSlot(state: MenuState): number | null {
 const system = state.system;
 if (!state.powered || state.panel || (system && (system.phase !== 'home' || system.sleeping || system.dialog || system.preferences))
  || isSystemHomeFolderClosing(state)) return null;
 const folder = state.opened ? state.selected : null, gesture = getHomeGestureView(state);
 let slot = state.opened ? state.folderSelected : state.selected;
 if (gesture?.mode === 'scroll') return null;
 if (gesture?.mode === 'drag') {
  const target = gesture.target, source = gesture.dragged?.source;
  if (!gesture.canDrop || !target || target.folder !== folder || (source?.folder === target.folder && source.slot === target.slot)) return null;
  slot = target.slot;
 } else if (gesture?.pressed) {
  if (gesture.pressed.folder !== folder) return null;
  slot = gesture.pressed.slot;
 }
 // Match menuTiles' existing horizontal culling without allocating another
 // complete tile array for every shared-clock observation.
 const tile = getHomeNavigationView(state).slots[slot];
 return tile && tile.x - tile.size / 2 < 320 && tile.x + tile.size / 2 > 0 ? slot : null;
}
