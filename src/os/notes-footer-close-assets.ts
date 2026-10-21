import { nativePaneParentPath, poseNativeLayout, type NativePack, type PaneOverrides } from './native-layout.ts';
import type { NotesFooterClosePaint } from './notes-footer-close.ts';
import { validateManualEntryAssets } from './manual-entry-assets.ts';
export type NotesFooterCloseDraw = NotesFooterClosePaint & Readonly<{ homeLabel: PaneOverrides[string] }>;
export function notesFooterReturnBindings(frame: number) {
  if (!Number.isInteger(frame) || frame < 0 || frame > 20) throw Error('Invalid Notes HOME return source frame');
  return { upper: [{ name: 'CmnFade_U_00_SceneIn', frame }],
    lower: [{ name: 'CmnFade_D_00_Aplt', frame: 6 }, { name: 'CmnFade_D_00_SceneIn', frame }] };
}
export function validateNotesFooterReturnAssets(pack: NativePack): void {
  validateManualEntryAssets(pack);
  const bindings = notesFooterReturnBindings(0);
  const layout = poseNativeLayout(pack.layouts.CmnFade_D_00, pack.animations, bindings.lower);
  const path = nativePaneParentPath(layout, 'P_Aplt_00'), icon = path?.at(-1);
  const material = icon?.picture ? layout.materials[icon.picture.material] : undefined;
  const texture = material?.textureMaps[0]?.texture;
  if (!path?.every(pane => pane.flags & 1) || !material || texture === undefined || layout.textures[texture] !== 'LncApltPictHome_00.bclim'
    || !pack.textures['LncApltPictHome_00.bclim'] || material.bufferColor.slice(0, 3).join('|') !== '160|160|160')
    throw Error('Unsupported Notes HOME return selector');
}

export function validateNotesFooterCloseAssets(packs: Record<string, NativePack>): void {
  for (const [alias, name, group] of [['notes-aplt-u', 'ApltBoot_U_00', 'Group_00'], ['notes-aplt-d', 'ApltBoot_D_00', 'G_Scene_00']] as const) {
    const pack = packs[alias], layout = pack?.layouts[name], clip = pack?.animations[`${name}_SceneOut`];
    if (!layout || layout.unsupported.length || !clip || clip.frames !== 21 || clip.loop || !clip.childBinding
      || clip.groups.join('|') !== group || !('unsupported' in clip) || !Array.isArray(clip.unsupported) || clip.unsupported.length)
      throw Error(`Unsupported Notes footer close ${name}`);
    for (const frame of [0, 20]) {
      const posed = poseNativeLayout(layout, pack.animations, [{ name: `${name}_SceneOut`, frame, groups: [group] }]);
      const pane = (key: string) => nativePaneParentPath(posed, key)?.at(-1);
      if (pane(alias === 'notes-aplt-u' ? 'P_Bg_U_00' : 'P_Bg_D_00')?.alpha !== (frame ? 255 : 0))
        throw Error(`Unsupported Notes footer close cover ${name}`);
      if (alias === 'notes-aplt-d') {
        const belt = pane('P_Belt_00'), home = pane('P_Home_00'), applet = pane('P_Aplt_00');
        const material = belt?.picture ? posed.materials[belt.picture.material] : undefined;
        if (belt?.alpha !== (frame ? 255 : 0) || belt.translation[0] !== (frame ? 0 : 80)
          || !home || !(home.flags & 1) || !applet || applet.flags & 1
          || !material || material.constantColors[0]?.slice(0, 3).join('|') !== '160|160|160')
          throw Error('Unsupported Notes footer close HOME belt');
      }
    }
  }
  const list = packs['notes-list'], clip = list?.animations.MemoListDown_Decide;
  const group = list?.layouts.MemoListDown?.groups[0]?.children.find(value => value.name === 'G_Btn_end');
  if (!clip || clip.frames !== 6 || clip.loop || clip.groups.join('|') !== 'G_Btn_end'
    || !('unsupported' in clip) || !Array.isArray(clip.unsupported) || clip.unsupported.length
    || group?.panes.join('|') !== 'P_Btn_00|P_Grad_00|T_BtnB_00|T_BtnF_00')
    throw Error('Unsupported Notes footer close feedback');
}
