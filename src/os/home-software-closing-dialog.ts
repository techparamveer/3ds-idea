import {nativeMessageColorSpans,nativeMessageOverride,type AnimationBinding} from './native-layout.ts';
import type {NativeLayoutRenderer} from './native-renderer.ts';

export const HOME_SOFTWARE_CLOSING_DIALOG_SOURCE=Object.freeze({
 message:Object.freeze({pack:'messages',bank:'menu_msbt_LZ',label:'lau_dlg_quit4'}),
 dialog:Object.freeze({pack:'dialog',layout:'Dlg_A_D_00'}),
 lowerMask:Object.freeze({pack:'dialogmask',layout:'DlgMask_D_00',clip:'DlgMask_D_00_FadeIn',lastFrame:20}),
} as const);

/**
 * Draw the source-backed settled "Closing software..." presentation observed
 * in the native lower LCD. The caller owns the validated close predicate and
 * epoch; this helper intentionally does not infer either from a host clock.
 */
export function drawHomeSoftwareClosingDialog(renderer:NativeLayoutRenderer,
 _top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,maskFrame=20):true{
 const source=HOME_SOFTWARE_CLOSING_DIALOG_SOURCE,dialog=renderer.packs.dialog,mask=renderer.packs.dialogmask;
 if(!Number.isSafeInteger(maskFrame)||maskFrame<0||maskFrame>source.lowerMask.lastFrame)throw new RangeError('Invalid native software-closing mask frame');
 const messages=renderer.packs.messages?.messages[source.message.bank];
 if(messages?.labels[source.message.label]===undefined)throw Error(`Native software-closing message unavailable: ${source.message.label}`);
 if(!dialog?.layouts[source.dialog.layout])throw Error(`Native software-closing layout unavailable: ${source.dialog.pack}/${source.dialog.layout}`);
 for(const item of [source.lowerMask]){
  if(!mask?.layouts[item.layout])throw Error(`Native software-closing layout unavailable: ${item.pack}/${item.layout}`);
  if(!mask.animations[item.clip])throw Error(`Native software-closing animation unavailable: ${item.clip}`);
 }
 const text={...nativeMessageOverride(renderer.packs.messages,source.message.bank,source.message.label,''),
  colorSpans:nativeMessageColorSpans(renderer.packs.messages,source.message.bank,source.message.label)};
 const binding=(item:typeof source.lowerMask):AnimationBinding=>({name:item.clip,frame:maskFrame});
 // The native close leaves HUD and upper wallpaper unmasked. The source
 // dialog mask darkens that LCD despite white vertex colors; do not bind it.
 const lower=renderer.draw(bottom,source.lowerMask.pack,source.lowerMask.layout,{bindings:[binding(source.lowerMask)]});
 const window=renderer.draw(bottom,source.dialog.pack,source.dialog.layout,{textSampling:'lcd',overrides:{TextBoxDialog:text}});
 if(!lower||!window)throw Error('Native software-closing dialog draw failed');
 return true;
}
