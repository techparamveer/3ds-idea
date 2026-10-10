import { nativePaneParentPath, type NativePack } from './native-layout.ts';
import type { NativeLayoutRenderer } from './native-renderer.ts';
import { validateNotificationsFooterCoverAssets, notificationsFooterCoverBindings } from './notifications-footer-close-assets.ts';

export const manualFooterCoverBindings=notificationsFooterCoverBindings;
export const validateManualFooterCoverAssets=validateNotificationsFooterCoverAssets;
export function manualFooterFeedbackFrame(frame:number):number {
  if(!Number.isInteger(frame)||frame<0||frame>1)throw Error('Invalid Manual footer feedback frame');
  return frame+4;
}
export function validateManualFooterFeedbackAssets(pack:NativePack):void {
  const layout=pack?.layouts.BtnCloseLng00,clip=pack?.animations.BtnCloseLng00_Decide;
  const group=layout?.groups[0]?.children.find(g=>g.name==='G_Btn_01');
  if(!layout||layout.unsupported.length||!clip||clip.frames!==6||clip.loop||!clip.childBinding
    ||clip.groups.join('|')!=='G_Btn_01'||!('unsupported' in clip)||!Array.isArray(clip.unsupported)||clip.unsupported.length
    ||group?.panes.join('|')!=='Bounding_00')throw Error('Unsupported Manual footer feedback');
  for(const name of ['BtnCloseLng01','P_Btn_01','T_BtnB_01','T_BtnF_01','P_Grad_01']){
    const path=nativePaneParentPath(layout,name);
    if(!path||path[1]?.name!=='BtnCloseLng01'||!clip.tracks.some(track=>track.target===name))throw Error('Unsupported Manual footer feedback panes');
  }
}
const feedbackPacks=new WeakMap<NativeLayoutRenderer,{source:NativePack;prepared:NativePack}>();
/** Fitted binding adaptation: the source hit-bound group does not include the
 * painted button sibling. Bind its unchanged Decide tracks to that subtree. */
export function prepareManualFooterFeedback(renderer:NativeLayoutRenderer):string {
  const source=renderer.packs['manual-footer-close'];validateManualFooterFeedbackAssets(source);
  let cached=feedbackPacks.get(renderer);
  if(!cached||cached.source!==source){
    const layout=structuredClone(source.layouts.BtnCloseLng00);
    const group=layout.groups[0].children.find(g=>g.name==='G_Btn_01');
    if(!group)throw Error('Unsupported Manual feedback group');
    group.panes=['BtnCloseLng01'];
    cached={source,prepared:{...source,layouts:{...source.layouts,BtnCloseLng00:layout}}};
    feedbackPacks.set(renderer,cached);
  }
  renderer.packs['manual-footer-feedback']=cached.prepared;
  return 'manual-footer-feedback';
}
