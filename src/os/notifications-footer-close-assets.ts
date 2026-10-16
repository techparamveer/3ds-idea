import { nativePaneParentPath, poseNativeLayout, type NativePack } from './native-layout.ts';
import { validateNotesFooterReturnAssets } from './notes-footer-close-assets.ts';

/** HOME common outgoing is fitted to the observed cover, not traced dispatch. */
export function notificationsFooterCoverBindings(kind: 'out' | 'in', frame: number) {
  if (!Number.isInteger(frame) || frame < 0 || frame > 20) throw Error('Invalid Notifications footer cover frame');
  const clip = kind === 'out' ? 'SceneOut' : 'SceneIn';
  return { upper: [{ name: `CmnFade_U_00_${clip}`, frame }],
    lower: [{ name: 'CmnFade_D_00_Aplt', frame: 6 }, { name: `CmnFade_D_00_${clip}`, frame }] };
}
export function validateNotificationsFooterCoverAssets(pack: NativePack): void {
  validateNotesFooterReturnAssets(pack);
  for (const [name, paneName] of [['CmnFade_U_00', 'P_Bg_U_00'], ['CmnFade_D_00', 'P_Bg_D_00']] as const) {
    const clip = pack.animations[`${name}_SceneOut`];
    if (!clip || clip.frames !== 21 || clip.loop || !clip.childBinding || !('unsupported' in clip)
      || !Array.isArray(clip.unsupported) || clip.unsupported.length) throw Error('Unsupported Notifications footer outgoing cover');
    for (const frame of [0, 20]) {
      const bindings = notificationsFooterCoverBindings('out', frame);
      const posed = poseNativeLayout(pack.layouts[name], pack.animations, name.endsWith('U_00') ? bindings.upper : bindings.lower);
      if (nativePaneParentPath(posed, paneName)?.at(-1)?.alpha !== (frame ? 255 : 0)) throw Error('Unsupported Notifications footer cover opacity');
    }
  }
}
export function validateNotificationsFooterFeedbackAssets(pack: NativePack): void {
  const clip = pack?.animations.NewsTopBtn_D_00_Decide, layout = pack?.layouts.NewsTopBtn_D_00;
  const group = layout?.groups[0]?.children.find(value => value.name === 'G_BtnEnd_00');
  if (!layout || layout.unsupported.length || !clip || clip.frames !== 6 || clip.loop || !clip.childBinding
    || clip.groups.join('|') !== 'G_BtnEnd_00' || !('unsupported' in clip) || !Array.isArray(clip.unsupported) || clip.unsupported.length
    || group?.panes.join('|') !== 'B_Btn_00|P_Btn_00|T_EndB_00|T_EndF_00|P_Grad_00') throw Error('Unsupported Notifications footer feedback');
}
