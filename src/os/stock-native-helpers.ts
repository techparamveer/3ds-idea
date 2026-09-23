import type { AppView } from './app-types';
import { nativeMessageOverride, type PaneOverrides } from './native-layout';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenTarget } from './stock-screen-layout';
import type { StockScreenPaintOptions } from './stock-screen-presentation';

const updaterPrefix='packs/system-updater/',nnidPrefix='packs/nnid-settings/';
export const updaterScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:updaterPrefix+'base.json',alias:'helper-base',layouts:['Bg_U_00','Bg_D_00','Base_D_00'],animations:['Bg_U_00_SceneIn_Legacy','Bg_D_00_SceneIn_Legacy']},
  {url:updaterPrefix+'up.json',alias:'helper-up',layouts:['CommonBG_U_00','IconUpdate','TextBG_U_00'],animations:['CommonBG_U_00_SceneIn_00','TextBG_U_00_TextFadeIn']},
  {url:updaterPrefix+'layout.json',alias:'helper-layout',layouts:['MessageOnly_D_00'],animations:['MessageOnly_D_00_SpecialIn_00']},
  {url:updaterPrefix+'message_EU.json',alias:'helper-messages',layouts:[],animations:[]},
];
export const nnidScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:nnidPrefix+'layout-BG.json',alias:'helper-bg',layouts:['BG'],animations:[]},
  {url:nnidPrefix+'layout-sysinfo-AccountHeader.json',alias:'helper-header',layouts:['AccountHeader'],animations:['AccountHeader_TextFade']},
  {url:nnidPrefix+'layout-dialog-DialogBaseNormal.json',alias:'helper-dialog',layouts:['DialogBaseNormal'],animations:[]},
  {url:nnidPrefix+'layout-dialog-DialogNotice.json',alias:'helper-notice',layouts:['DialogNotice'],animations:[]},
  {url:nnidPrefix+'layout-toolbar-OliveBack.json',alias:'helper-back',layouts:['OliveBack'],animations:['OliveBack_FocusedOnOff']},
];
export function nativeHelperView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.appId==='nnid-settings')return {view:'nnid-read-only',titleId:'000400100002c100',packs:nnidScreenPacks};
  if(view.appId==='system-updater')return {view:'updater-read-only',titleId:'0004001000022f00',packs:updaterScreenPacks};
  return null;
}
/** The initial helpers expose only the native Back control. The runtime must
 * likewise omit account/update action rows rather than leave hidden targets. */
export function nativeHelperTargets(view:AppView):StockScreenTarget[]|null{
  if(!nativeHelperView(view))return null;
  const action=view.footer.left?.action??'back';
  return view.appId==='nnid-settings'?[{action,x:0,y:212,width:64,height:28}]:[{action,x:0,y:208,width:120,height:32}];
}
const wrap=(value:string,width:number)=>value.split('\n').map(line=>{const lines:string[]=[];let current='';for(const word of line.split(/\s+/)){if(current&&current.length+word.length+1>width){lines.push(current);current=word;}else current+=(current?' ':'')+word;}lines.push(current);return lines.join('\n');}).join('\n');
const mirrorPanel:PaneOverrides={UpWndwLT_01:{size:[184,80],scale:[-1,1]},UpWndwLT_02:{size:[184,80],scale:[1,-1]},UpWndwLT_03:{size:[184,80],scale:[-1,-1]}};

/** Native entry chrome with local read-only notices. No service status is
 * inferred: in particular the source “up to date” message is never displayed. */
export function drawNativeHelperFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,_options?:StockScreenPaintOptions):boolean{
  if(!nativeHelperView(view))return false;
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,options)&&okay;};
  if(view.appId==='nnid-settings'){
    draw(top,'helper-bg','BG',{center:[200,240]});draw(bottom,'helper-bg','BG',{center:[160,0]});
    const title='Nintendo Network ID Settings';
    draw(top,'helper-header','AccountHeader',{bindings:[{name:'AccountHeader_TextFade',frame:0}],overrides:{T_HeaderTitle_00:{text:title,fontSize:[18,21.6]},T_HeaderTitle_01:{text:title,fontSize:[18,21.6]}}});
    draw(top,'helper-notice','DialogNotice',{center:[200,142],overrides:{TextBox:{text:'Nintendo Network ID\n\nAccount features are read-only.',size:[344,142],fontSize:[18,21.6]}}});
    draw(bottom,'helper-dialog','DialogBaseNormal',{center:[160,110],overrides:{DialogBaseLPct:{size:[148,196]},DialogBaseRPct:{size:[148,196]},BottomFrameFPct:{visible:false},BottomFrameF2Pct:{visible:false},BottomFrameHPct:{visible:false}}});
    const body=(view.text??[]).filter(Boolean).join('\n')||'Linking or creating a Nintendo Network ID is unavailable in this portfolio.';
    draw(bottom,'helper-notice','DialogNotice',{center:[160,110],overrides:{TextBox:{text:wrap(body,31),size:[264,160],fontSize:[16,19.2]}}});
    draw(bottom,'helper-back','OliveBack',{center:[32,226],bindings:[{name:'OliveBack_FocusedOnOff',frame:0}]});
    return okay;
  }
  const message=(label:string)=>nativeMessageOverride(renderer.packs['helper-messages'],'mset',label,'');
  draw(top,'helper-base','Bg_U_00',{bindings:[{name:'Bg_U_00_SceneIn_Legacy',frame:40}]});
  draw(bottom,'helper-base','Bg_D_00',{bindings:[{name:'Bg_D_00_SceneIn_Legacy',frame:40}]});
  draw(top,'helper-up','CommonBG_U_00',{bindings:[{name:'CommonBG_U_00_SceneIn_00',frame:20}],overrides:{TextBoxTitle_00:message('update_title')},attachments:{Icon:()=>draw(top,'helper-up','IconUpdate')}});
  // These three source pictures have signed dimensions. Absolute sizes and
  // reflected scales preserve their origins without mutating the title pack.
  draw(top,'helper-up','TextBG_U_00',{bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{...mirrorPanel,TextBox_00:message('update_comm_u')}});
  draw(bottom,'helper-up','TextBG_U_00',{center:[160,104.4],scale:.8,bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{...mirrorPanel,TextBox_00:{visible:false}}});
  const body=(view.text??[]).filter(Boolean).join('\n')||'System updates are unavailable in this portfolio. No update check has been performed.';
  draw(bottom,'helper-layout','MessageOnly_D_00',{bindings:[{name:'MessageOnly_D_00_SpecialIn_00',frame:1}],overrides:{TextBoxTitle_00:{text:wrap(body,31),translation:[0,70,0],size:[270,140],fontSize:[17,20.4]}}});
  draw(bottom,'helper-base','Base_D_00',{overrides:{TextBox_00:message('base_2b_back'),TextBoxShdw_00:message('base_2b_back')}});
  return okay;
}
