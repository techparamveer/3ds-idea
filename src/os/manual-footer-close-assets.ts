import { nativePaneParentPath, type NativeLayout, type NativePack } from './native-layout.ts';
import type { NativeLayoutRenderer } from './native-renderer.ts';
import { validateNotificationsFooterCoverAssets, notificationsFooterCoverBindings } from './notifications-footer-close-assets.ts';

export const manualFooterCoverBindings=notificationsFooterCoverBindings;
export const validateManualFooterCoverAssets=validateNotificationsFooterCoverAssets;
export function manualFooterFeedbackFrame(frame:number):number {
  if(!Number.isInteger(frame)||frame<0||frame>1)throw Error('Invalid Manual footer feedback frame');
  return frame+4;
}
export function validateManualFooterFeedbackAssets(pack:NativePack):void {
  const layout=pack?.layouts.BtnCloseLng00;
  const group=layout?.groups[0]?.children.find(g=>g.name==='G_Btn_01');
  if(!layout||layout.unsupported.length||group?.panes.join('|')!=='Bounding_00')throw Error('Unsupported Manual footer feedback');
  for(const [name,frames]of [['BtnCloseLng00_Decide',6],['BtnCloseLng00_Select',2]] as const){
    const clip=pack.animations[name];
    if(!clip||clip.frames!==frames||clip.loop||!clip.childBinding||clip.groups.join('|')!=='G_Btn_01'
      ||!('unsupported' in clip)||!Array.isArray(clip.unsupported)||clip.unsupported.length)throw Error('Unsupported Manual footer feedback');
    for(const pane of ['BtnCloseLng01','P_Btn_01','T_BtnB_01','T_BtnF_01','P_Grad_01']){
      const path=nativePaneParentPath(layout,pane);
      if(!path||path[1]?.name!=='BtnCloseLng01'||!clip.tracks.some(track=>track.target===pane))throw Error('Unsupported Manual footer feedback panes');
    }
  }
}
const feedbackLayouts=new WeakMap<NativeLayoutRenderer,{source:NativePack;prepared:NativeLayout}>();
/** Fitted binding adaptation: the source hit-bound group does not include the
 * painted button sibling. Bind its unchanged Select/Decide tracks to that subtree. */
export function prepareManualFooterFeedback(renderer:NativeLayoutRenderer):NativeLayout {
  const source=renderer.packs['manual-footer-close'];validateManualFooterFeedbackAssets(source);
  let cached=feedbackLayouts.get(renderer);
  if(!cached||cached.source!==source){
    const layout=structuredClone(source.layouts.BtnCloseLng00);
    const group=layout.groups[0].children.find(g=>g.name==='G_Btn_01');
    if(!group)throw Error('Unsupported Manual feedback group');
    group.panes=['BtnCloseLng01'];
    cached={source,prepared:layout};
    feedbackLayouts.set(renderer,cached);
  }
  return cached.prepared;
}
