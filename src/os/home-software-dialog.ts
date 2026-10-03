import {nativeMessageOverride,nativeMessageColorSpans,nativeMessageGlyphScaleSpans,type AnimationBinding,type NativePixels,type PaneOverrides} from './native-layout.ts';
import type {NativeLayoutRenderer} from './native-renderer.ts';
import type {MenuState} from './state.ts';
import {softwareDialogPressed} from './stock-screen-layout.ts';
import {sampleSystemHomeApplicationTransition} from './system-home-application-transition.ts';

/** The close display shares the existing controller identity, never its own timer. */
export function homeSoftwareClosingDialogKey(state:MenuState):string|null{
 const s=state.system;
 if(!s||s.sleeping||s.preferences||s.dialog||state.panel)return null;
 const close=sampleSystemHomeApplicationTransition(state);
 const visible=close?.intent.kind==='close'?close.phase!=='complete'
  :close?.intent.kind==='switch'&&(close.phase==='closing'||close.phase==='terminal');
 return close&&visible
  ?JSON.stringify(['software-closing',close.intent.kind,close.identity]):null;
}

export function homeSoftwareDialogKey(state:MenuState):string|null{
 const s=state.system;
 return s?.dialog&&!s.sleeping&&!s.preferences?JSON.stringify(['software-dialog',s.dialog,s.runtime.application,s.pending]):null;
}

export type HomeSoftwareDialogTitles=readonly[string]|readonly[string,string];

/** Resolves the retained owner behind a visible close/switch dialog. */
export function homeSoftwareDialogTitles(state:MenuState):HomeSoftwareDialogTitles|null{
 if(!homeSoftwareDialogKey(state))return null;
 const s=state.system!,owner=s.runtime.application?s.runtime.instances[s.runtime.application]:undefined;
 if(!owner||owner.closing||!owner.suspended||s.runtime.active||s.runtime.homeReturn!==owner.id)throw Error('Native software dialog owner unavailable');
 if(s.dialog==='switch'){
  if(!s.pending)throw Error('Native software switch owner unavailable');
  return [owner.appId,s.pending];
 }
 return [owner.appId];
}

export function homeSoftwareSwitchTitles(state:MenuState):readonly[string,string]|null{
 const titles=homeSoftwareDialogTitles(state);
 return titles?.length===2?titles:null;
}

/** Captured Camera confirmation and all captured switches leave the upper LCD
 * unobscured. Other ordinary-close titles retain the existing unverified mask. */
export function homeSoftwareDialogUsesUpperMask(titles:HomeSoftwareDialogTitles):boolean{
 return titles.length===1&&titles[0]!=='camera';
}

/** Source dialog assembly; native per-title confirmation policy and timing remain unverified. */
export function drawHomeSoftwareDialog(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,state:MenuState,icons?:readonly NativePixels[]){
 if(!homeSoftwareDialogKey(state))return false;
 const s=state.system!,bank=renderer.packs.messages?.messages.menu_msbt_LZ;
 const text=(label:string)=>{
  if(bank?.labels[label]===undefined)throw Error(`Native software dialog message unavailable: ${label}`);
  return {...nativeMessageOverride(renderer.packs.messages,'menu_msbt_LZ',label,''),colorSpans:nativeMessageColorSpans(renderer.packs.messages,'menu_msbt_LZ',label)};
 };
 const titles=homeSoftwareDialogTitles(state)!,switching=titles.length===2;
 // Only this native pair has a captured no-warning policy; other switches retain their warning.
 const bodyLabel=switching&&titles[0]==='health-safety'&&titles[1]==='camera'?'lau_dlg_quit8':switching?'lau_dlg_quit1':'lau_dlg_quit0';
 const body={...text(bodyLabel),glyphScaleSpans:nativeMessageGlyphScaleSpans(renderer.packs.messages,'menu_msbt_LZ',bodyLabel)};
 const headerName=switching?'LncDlgIcon_D_01':'LncDlgIcon_D_00';
 if(!renderer.packs.sequence?.layouts[headerName])throw Error(`Native software dialog header unavailable: ${headerName}`);
 if(!icons||icons.length!==titles.length||icons.some(icon=>!icon||icon.width!==48||icon.height!==48||icon.data.length!==48*48*4))throw Error('Native software dialog icons unavailable');
 const cancel=text('lau_dlg_2b_canc0'),confirm=text('lau_dlg_2b_decide');
 const usesUpperMask=homeSoftwareDialogUsesUpperMask(titles);
 for(const [pack,name,clips] of [['dialog','Dlg_A_D_02',['FadeIn','Select']],['dialogmask','DlgMask_U_00',['FadeIn']],['dialogmask','DlgMask_D_00',['FadeIn']]] as const){
  if(name==='DlgMask_U_00'&&!usesUpperMask)continue;
  if(!renderer.packs[pack]?.layouts[name])throw Error(`Native software dialog layout unavailable: ${pack}/${name}`);
  for(const clip of clips)if(!renderer.packs[pack].animations[`${name}_${clip}`])throw Error(`Native software dialog animation unavailable: ${name}_${clip}`);
 }
 const note='Software close/switch uses source Dlg_A_D_02 and LncDlgIcon_D_00/01 assemblies at settled poses. HOME dialog warning glyph size is decoded from MSBT controls; source-baseline anchoring is a capture-supported adaptation, and Camera close upper-mask suppression is a separate capture-supported adaptation, because the native call sites remain untraced. Camera close and Health-to-Camera are captured; other title headers are adaptations pending comparison. Per-title policy, native input, motion and audio remain unverified.';
 if(!renderer.diagnostics.includes(note))renderer.diagnostics.push(note);
 const bindings:AnimationBinding[]=[{name:'Dlg_A_D_02_FadeIn',frame:20},{name:'Dlg_A_D_02_Select',frame:0}];
 const pressed=softwareDialogPressed(s.input.touch);
 if(pressed)bindings.push({name:'Dlg_A_D_02_Select',frame:1,groups:[pressed==='back'?'Group_00':'Group_01']});
 // Captured switches and Camera close mask the lower LCD only; other ordinary
 // close confirmations keep their existing upper-mask behavior pending evidence.
 const upper=usesUpperMask?renderer.draw(top,'dialogmask','DlgMask_U_00',{bindings:[{name:'DlgMask_U_00_FadeIn',frame:20}]}):true;
 const lower=renderer.draw(bottom,'dialogmask','DlgMask_D_00',{bindings:[{name:'DlgMask_D_00_FadeIn',frame:20}]});
 const dialog=renderer.draw(bottom,'dialog','Dlg_A_D_02',{textSampling:'lcd',bindings,overrides:{TextBoxDialog:{text:''},TextBox_00:cancel,TextBox_01:cancel,TextBox_02:confirm,TextBox_03:confirm}});
 const textures:Record<string,NativePixels>=switching
  ?{'runtime:switch-from':icons[0],'runtime:switch-to':icons[1]}
  :{'runtime:close':icons[0]};
 const overrides:PaneOverrides={TextBoxDialog:body,P_Icon_00:{textureBindings:{0:switching?'runtime:switch-from':'runtime:close'}}};
 if(switching)overrides.P_Icon_01={textureBindings:{0:'runtime:switch-to'}};
 const header=renderer.draw(bottom,'sequence',headerName,{textSampling:'lcd',pictureSampling:'lcd',textures,overrides});
 if(!upper||!lower||!dialog||!header)throw Error('Native software dialog draw failed');
 return true;
}
