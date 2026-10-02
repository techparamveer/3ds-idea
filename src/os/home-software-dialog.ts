import {nativeMessageOverride,nativeMessageColorSpans,type AnimationBinding} from './native-layout.ts';
import type {NativeLayoutRenderer} from './native-renderer.ts';
import type {MenuState} from './state.ts';
import {softwareDialogPressed} from './stock-screen-layout.ts';

export function homeSoftwareDialogKey(state:MenuState):string|null{
 const s=state.system;
 return s?.dialog&&!s.sleeping&&!s.preferences?JSON.stringify(['software-dialog',s.dialog,s.runtime.application,s.pending]):null;
}

/** Source dialog assembly; native per-title confirmation policy and timing remain unverified. */
export function drawHomeSoftwareDialog(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,state:MenuState){
 if(!homeSoftwareDialogKey(state))return false;
 const s=state.system!,bank=renderer.packs.messages?.messages.menu_msbt_LZ;
 const text=(label:string)=>{
  if(bank?.labels[label]===undefined)throw Error(`Native software dialog message unavailable: ${label}`);
  return {...nativeMessageOverride(renderer.packs.messages,'menu_msbt_LZ',label,''),colorSpans:nativeMessageColorSpans(renderer.packs.messages,'menu_msbt_LZ',label)};
 };
 const body=text(s.dialog==='switch'?'lau_dlg_quit1':'lau_dlg_quit0');
 const cancel=text('lau_dlg_2b_canc0'),confirm=text('lau_dlg_2b_decide');
 for(const [pack,name,clips] of [['dialog','Dlg_A_D_02',['FadeIn','Select']],['dialogmask','DlgMask_U_00',['FadeIn']],['dialogmask','DlgMask_D_00',['FadeIn']]] as const){
  if(!renderer.packs[pack]?.layouts[name])throw Error(`Native software dialog layout unavailable: ${pack}/${name}`);
  for(const clip of clips)if(!renderer.packs[pack].animations[`${name}_${clip}`])throw Error(`Native software dialog animation unavailable: ${name}_${clip}`);
 }
 const note='Software close/switch uses generic native Dlg_A_D_02 assembly and settled poses; per-title policy, inline MSBT size controls, native input, motion and audio remain unverified adaptations.';
 if(!renderer.diagnostics.includes(note))renderer.diagnostics.push(note);
 const bindings:AnimationBinding[]=[{name:'Dlg_A_D_02_FadeIn',frame:20},{name:'Dlg_A_D_02_Select',frame:0}];
 const pressed=softwareDialogPressed(s.input.touch);
 if(pressed)bindings.push({name:'Dlg_A_D_02_Select',frame:1,groups:[pressed==='back'?'Group_00':'Group_01']});
 const upper=renderer.draw(top,'dialogmask','DlgMask_U_00',{bindings:[{name:'DlgMask_U_00_FadeIn',frame:20}]});
 const lower=renderer.draw(bottom,'dialogmask','DlgMask_D_00',{bindings:[{name:'DlgMask_D_00_FadeIn',frame:20}]});
 const dialog=renderer.draw(bottom,'dialog','Dlg_A_D_02',{textSampling:'lcd',bindings,overrides:{TextBoxDialog:body,TextBox_00:cancel,TextBox_01:cancel,TextBox_02:confirm,TextBox_03:confirm}});
 if(!upper||!lower||!dialog)throw Error('Native software dialog draw failed');
 return true;
}
