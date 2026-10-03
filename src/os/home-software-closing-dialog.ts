import {nativeMessageColorSpans,nativeMessageOverride,type AnimationBinding} from './native-layout.ts';
import type {NativeLayoutRenderer} from './native-renderer.ts';

export const HOME_SOFTWARE_CLOSING_DIALOG_SOURCE=Object.freeze({
 messages:Object.freeze({
  close:Object.freeze({pack:'messages',bank:'menu_msbt_LZ',label:'lau_dlg_quit4'}),
  switch:Object.freeze({pack:'messages',bank:'menu_msbt_LZ',label:'lau_dlg_quit5'}),
 }),
 dialog:Object.freeze({pack:'dialog',layout:'Dlg_A_D_00',entryClip:'Dlg_A_D_02_FadeIn',entryLastFrame:20,
  exitClip:'Dlg_A_D_02_FadeOut00',exitLastFrame:20}),
 lowerMask:Object.freeze({pack:'dialogmask',layout:'DlgMask_D_00',clip:'DlgMask_D_00_FadeIn',lastFrame:20,
  exitClip:'DlgMask_D_00_FadeOut00',exitLastFrame:20,exitZeroFrame:15}),
} as const);

/**
 * Draw the source-backed "Closing software..." presentation observed in the
 * native lower LCD. When supplied, exitFrame samples the native 0..20 dialog
 * and mask exit clips. The caller owns the close predicate, epoch, and owner
 * retirement; this helper intentionally does not infer them from a host clock.
 * Entry borrows the compatible donor FadeIn at the existing mask sample as a
 * capture-fitted adaptation; only the exit donor has a traced native caller.
 */
export function drawHomeSoftwareClosingDialog(renderer:NativeLayoutRenderer,
 _top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,maskFrame=20,exitFrame?:number,intent:'close'|'switch'='close'):true{
 const source=HOME_SOFTWARE_CLOSING_DIALOG_SOURCE,message=source.messages[intent],dialog=renderer.packs.dialog,mask=renderer.packs.dialogmask;
 if(!Number.isSafeInteger(maskFrame)||maskFrame<0||maskFrame>source.lowerMask.lastFrame)throw new RangeError('Invalid native software-closing mask frame');
 if(exitFrame!==undefined&&(!Number.isSafeInteger(exitFrame)||exitFrame<0||exitFrame>source.dialog.exitLastFrame))throw new RangeError('Invalid native software-closing exit frame');
 if(intent!=='close'&&intent!=='switch')throw new RangeError('Invalid software-closing intent');
 const messages=renderer.packs.messages?.messages[message.bank];
 if(messages?.labels[message.label]===undefined)throw Error(`Native software-closing message unavailable: ${message.label}`);
 if(!dialog?.layouts[source.dialog.layout])throw Error(`Native software-closing layout unavailable: ${source.dialog.pack}/${source.dialog.layout}`);
 for(const item of [source.lowerMask]){
  if(!mask?.layouts[item.layout])throw Error(`Native software-closing layout unavailable: ${item.pack}/${item.layout}`);
  if(!mask.animations[item.clip])throw Error(`Native software-closing animation unavailable: ${item.clip}`);
 }
 if(exitFrame!==undefined){
  if(!dialog.animations[source.dialog.exitClip])throw Error(`Native software-closing animation unavailable: ${source.dialog.exitClip}`);
  if(!mask.animations[source.lowerMask.exitClip])throw Error(`Native software-closing animation unavailable: ${source.lowerMask.exitClip}`);
 }else{
  if(!dialog.animations[source.dialog.entryClip])throw Error(`Native software-closing animation unavailable: ${source.dialog.entryClip}`);
 }
 const text={...nativeMessageOverride(renderer.packs.messages,message.bank,message.label,''),
  colorSpans:nativeMessageColorSpans(renderer.packs.messages,message.bank,message.label)};
 const binding=(item:typeof source.lowerMask):AnimationBinding=>({name:item.clip,frame:maskFrame});
 // Native close/switch leaves HUD and upper wallpaper unmasked. The source
 // dialog mask darkens that LCD despite white vertex colors; do not bind it.
 const lowerBinding:AnimationBinding=exitFrame===undefined?binding(source.lowerMask):{name:source.lowerMask.exitClip,frame:exitFrame};
 const windowBinding:AnimationBinding[]=[exitFrame===undefined
  ?{name:source.dialog.entryClip,frame:maskFrame}:{name:source.dialog.exitClip,frame:exitFrame}];
 const lower=renderer.draw(bottom,source.lowerMask.pack,source.lowerMask.layout,{bindings:[lowerBinding]});
 const window=renderer.draw(bottom,source.dialog.pack,source.dialog.layout,{textSampling:'lcd',bindings:windowBinding,overrides:{TextBoxDialog:text}});
 if(!lower||!window)throw Error('Native software-closing dialog draw failed');
 return true;
}
