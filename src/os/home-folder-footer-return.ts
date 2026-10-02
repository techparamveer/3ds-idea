import type { SystemHomeFolderCloseRecord } from './home-folder-close-system.ts';

export const HOME_FOOTER_SCENE_IN_SETTLED_FRAME = 15 as const;
export const HOME_FOOTER_SCENE_OUT_SETTLED_FRAME = 14 as const;

export type HomeFolderFooterPose = Readonly<{
  clip: 'LncBtmBtn_02_SceneIn' | 'LncBtmBtn_02_SceneOut';
  frame: number;
}>;

const SETTLED_IN: HomeFolderFooterPose = Object.freeze({
  clip: 'LncBtmBtn_02_SceneIn', frame: HOME_FOOTER_SCENE_IN_SETTLED_FRAME,
});

/**
 * Selects only the normal folder-close footer pose. Software-switch ownership
 * remains in the caller. The retained close record supplies both counted
 * epochs, so paint never creates a timer or mutates the controller.
 */
export function selectHomeFolderFooterPose(
  close: SystemHomeFolderCloseRecord | null,
  updateCount: number,
  reduced = false,
): HomeFolderFooterPose {
  if (reduced || close === null) return SETTLED_IN;
  if (!Number.isSafeInteger(updateCount) || updateCount < 0) throw new RangeError('Invalid HOME footer update count');

  if (close.controller.phase !== 'complete') {
    const elapsed = updateCount - close.startedAtUpdate;
    if (elapsed < 0) throw new RangeError('HOME footer close epoch is ahead of the shared clock');
    return Object.freeze({
      clip: 'LncBtmBtn_02_SceneOut',
      frame: Math.min(HOME_FOOTER_SCENE_OUT_SETTLED_FRAME, elapsed),
    });
  }

  const ready = close.selectionReadyAtUpdate;
  if (ready === null) throw new Error('Completed HOME folder close has no selection-ready boundary');
  const elapsed = updateCount - ready;
  if (elapsed < 0) throw new RangeError('HOME footer return epoch is ahead of the shared clock');
  return Object.freeze({
    clip: 'LncBtmBtn_02_SceneIn',
    frame: Math.min(HOME_FOOTER_SCENE_IN_SETTLED_FRAME, elapsed),
  });
}
