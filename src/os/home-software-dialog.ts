import {nativeMessageOverride,nativeMessageColorSpans,type AnimationBinding,type NativePixels} from './native-layout.ts';
import type {NativeLayoutRenderer} from './native-renderer.ts';
import type {MenuState} from './state.ts';
import {softwareDialogPressed} from './stock-screen-layout.ts';

export function homeSoftwareDialogKey(state:MenuState):string|null{
 const s=state.system;
 return s?.dialog&&!s.sleeping&&!s.preferences?JSON.stringify(['software-dialog',s.dialog,s.runtime.application,s.pending]):null;
}

export function homeSoftwareSwitchTitles(state:MenuState):readonly[string,string]|null{
 if(!homeSoftwareDialogKey(state)||state.system?.dialog!=='switch')return null;
 const s=state.system,owner=s.runtime.application?s.runtime.instances[s.runtime.application]:undefined;
 if(!owner||owner.closing||!owner.suspended||s.runtime.active||s.runtime.homeReturn!==owner.id||!s.pending)throw Error('Native software switch owner unavailable');
 return [owner.appId,s.pending];
}

/** Source dialog assembly; native per-title confirmation policy and timing remain unverified. */
export function drawHomeSoftwareDialog(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,state:MenuState,icons?:readonly[NativePixels,NativePixels]){
 if(!homeSoftwareDialogKey(state))return false;
 const s=state.system!,bank=renderer.packs.messages?.messages.menu_msbt_LZ;
 const text=(label:string)=>{
  if(bank?.labels[label]===undefined)throw Error(`Native software dialog message unavailable: ${label}`);
  return {...nativeMessageOverride(renderer.packs.messages,'menu_msbt_LZ',label,''),colorSpans:nativeMessageColorSpans(renderer.packs.messages,'menu_msbt_LZ',label)};
 };
 const titles=homeSoftwareSwitchTitles(state);
 // Only this native pair has a captured no-warning policy; other switches retain their warning.
 const body=text(titles?.[0]==='health-safety'&&titles[1]==='camera'?'lau_dlg_quit8':titles?'lau_dlg_quit1':'lau_dlg_quit0');
 if(titles){
  if(!renderer.packs.sequence?.layouts.LncDlgIcon_D_01)throw Error('Native software switch header unavailable');
  if(!icons||icons.length!==2||icons.some(icon=>!icon||icon.width!==48||icon.height!==48||icon.data.length!==48*48*4))throw Error('Native software switch icons unavailable');
 }
 const cancel=text('lau_dlg_2b_canc0'),confirm=text('lau_dlg_2b_decide');
 for(const [pack,name,clips] of [['dialog','Dlg_A_D_02',['FadeIn','Select']],['dialogmask','DlgMask_U_00',['FadeIn']],['dialogmask','DlgMask_D_00',['FadeIn']]] as const){
  if(!renderer.packs[pack]?.layouts[name])throw Error(`Native software dialog layout unavailable: ${pack}/${name}`);
  for(const clip of clips)if(!renderer.packs[pack].animations[`${name}_${clip}`])throw Error(`Native software dialog animation unavailable: ${name}_${clip}`);
 }
 const note='Software close/switch uses source Dlg_A_D_02 and LncDlgIcon_D_01 assembly at settled poses. Health-to-Camera uses captured quit8; other switch headers are adaptations pending comparison. Per-title policy, inline MSBT size controls, native input, motion and audio remain unverified.';
 if(!renderer.diagnostics.includes(note))renderer.diagnostics.push(note);
 const bindings:AnimationBinding[]=[{name:'Dlg_A_D_02_FadeIn',frame:20},{name:'Dlg_A_D_02_Select',frame:0}];
 const pressed=softwareDialogPressed(s.input.touch);
 if(pressed)bindings.push({name:'Dlg_A_D_02_Select',frame:1,groups:[pressed==='back'?'Group_00':'Group_01']});
 // The captured switch masks the lower LCD only; it leaves the upper banner visible.
 const upper=titles?true:renderer.draw(top,'dialogmask','DlgMask_U_00',{bindings:[{name:'DlgMask_U_00_FadeIn',frame:20}]});
 const lower=renderer.draw(bottom,'dialogmask','DlgMask_D_00',{bindings:[{name:'DlgMask_D_00_FadeIn',frame:20}]});
 const dialog=renderer.draw(bottom,'dialog','Dlg_A_D_02',{textSampling:'lcd',bindings,overrides:{TextBoxDialog:titles?{text:''}:body,TextBox_00:cancel,TextBox_01:cancel,TextBox_02:confirm,TextBox_03:confirm}});
 const header=!titles||renderer.draw(bottom,'sequence','LncDlgIcon_D_01',{textSampling:'lcd',pictureSampling:'lcd',textures:{'runtime:switch-from':icons![0],'runtime:switch-to':icons![1]},overrides:{TextBoxDialog:body,P_Icon_00:{textureBindings:{0:'runtime:switch-from'}},P_Icon_01:{textureBindings:{0:'runtime:switch-to'}}}});
 if(!upper||!lower||!dialog||!header)throw Error('Native software dialog draw failed');
 return true;
}
