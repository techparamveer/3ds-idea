import type { MenuState } from './state.ts';
import { getHomePresentation, getNativeFolderBalloon } from './home-presentation.ts';

export type HomeBalloonPresentation = Readonly<{
  visible: boolean;
  desired: boolean;
  clip: 'Appear' | 'DisAppear';
  frame: number;
  label: string;
  baseX: number;
  bodyOffsetX: number;
}>;

/** The source LncBlln_00 clips apply frames 0..5 once per HOME update.
 * Keep the last content and anchor while DisAppear runs. Initial HOME uses
 * the source's static settled pose rather than replaying an entry animation.
 */
export function createHomeBalloonPresentation(state: MenuState): HomeBalloonPresentation {
  const target = getNativeFolderBalloon(state, getHomePresentation(state));
  return Object.freeze({ visible: !!target, desired: !!target, clip: 'Appear', frame: 5,
    label: target?.label ?? '', baseX: target?.baseX ?? 0, bodyOffsetX: target?.bodyOffsetX ?? 0 });
}

export function advanceHomeBalloonPresentation(current: HomeBalloonPresentation, state: MenuState): HomeBalloonPresentation {
  const target = getNativeFolderBalloon(state, getHomePresentation(state));
  if (target) {
    if (!current.desired) return Object.freeze({ visible: true, desired: true, clip: 'Appear', frame: 0,
      label: target.label, baseX: target.baseX, bodyOffsetX: target.bodyOffsetX });
    return Object.freeze({ ...current, visible: true, clip: 'Appear', frame: Math.min(5, current.frame + 1),
      label: target.label, baseX: target.baseX, bodyOffsetX: target.bodyOffsetX });
  }
  if (current.desired) return Object.freeze({ ...current, desired: false, clip: 'DisAppear', frame: 0 });
  if (!current.visible) return current;
  if (current.frame === 5) return Object.freeze({ ...current, visible: false });
  const frame = Math.min(5, current.frame + 1);
  return Object.freeze({ ...current, clip: 'DisAppear', frame });
}
