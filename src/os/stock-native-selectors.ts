import type { AppView } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { nativeMessageOverride, type PaneOverrides } from './native-layout';

export const miiSelectorPacks:readonly NativeTitlePackRequest[]=[
  {url:'packs/mii-selector/layout-Select.json',alias:'mii',layouts:['AplSelectBase','AplSelectBase_Up'],animations:['AplSelectBase_FadeIn','AplSelectBase_Up_FadeIn','AplSelectBase_Invalid']},
  {url:'packs/mii-selector/message-EU_English.json',alias:'messages',layouts:[],animations:[]},
];
export const photoSelectorPacks:readonly NativeTitlePackRequest[]=[
  {url:'packs/camera-picker/lyt-P_AptDlg_U-arc-LZ.json',alias:'upper',layouts:['P_AptDlg_U'],animations:[]},
  {url:'packs/camera-picker/lyt-P_Brws_D-arc-LZ.json',alias:'lower',layouts:['AptMenu_D','AptTxt','P_BrwsTxt_D'],animations:['AptTxt_In','AptMenu_D_Disable']},
  {url:'packs/camera-picker/msg-EU_English.json',alias:'messages',layouts:[],animations:[]},
];
export const soundSelectorPacks:readonly NativeTitlePackRequest[]=[
  {url:'packs/sound-picker/lyt-S_ApVoicSele_D-arc-LZ.json',alias:'lower',layouts:['Apt_D','AptTxt'],animations:['AptTxt_In','Apt_D_Disable']},
  {url:'packs/sound-picker/msg-EU_English.json',alias:'messages',layouts:[],animations:[]},
];
export function nativeSelectorView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.screen!=='main'&&view.screen!=='detail')return null;
  if(view.appId==='mii-selector')return {view:'mii-selector',titleId:'000400300000d102',packs:miiSelectorPacks};
  if(view.appId==='photo-selector')return {view:'photo-selector',titleId:'000400300000d302',packs:photoSelectorPacks};
  if(view.appId==='sound-selector')return {view:'sound-selector',titleId:'000400300000d402',packs:soundSelectorPacks};
  return null;
}
export function nativeSelectorTargets(view:AppView):{action:string;x:number;y:number;width:number;height:number}[]|null{
  if(!nativeSelectorView(view))return null;
  return [{action:'back',...(view.appId==='mii-selector'?{x:5,y:215,width:155,height:24}:{x:20,y:202,width:88,height:28})}];
}
function savedName(view:AppView):string{
  const entry=view.data?.entry;
  const name=entry&&typeof entry==='object'&&!Array.isArray(entry)?entry.name??entry.title:undefined;
  const supplied=typeof name==='string'?name:view.screen==='main'?view.rows[view.selection]?.label??'':'';
  return Array.from(supplied.replace(/[\u0000-\u001f\u007f-\u009f\ue000-\uf8ff]/g,' ')).slice(0,64).join('');
}
/** Native selector chrome with no model/media synthesis, capture or confirmation. */
export function drawNativeSelectorFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(!nativeSelectorView(view))return false;
  const name=savedName(view);
  const text=(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size=15)=>{
    ctx.save();ctx.beginPath();ctx.rect(12,y-20,ctx.canvas.width-24,60);ctx.clip();
    value.split('\n').forEach((line,index)=>options.font?.draw(ctx,line,x,y+index*20,size,'#555','center'));ctx.restore();
  };
  if(view.appId==='mii-selector'){
    const message=(label:string)=>nativeMessageOverride(renderer.packs.messages,'appm',label,'');
    const hidden:PaneOverrides=Object.fromEntries(['Btn10Rooms','Btn11Rooms','Cursor10Rooms','Cursor11Rooms','N_Layout','N_MyMiiPosTex','N_MiiPositTex','N_BtnArrows','N_Arrows'].map(pane=>[pane,{visible:false}]));
    const common:PaneOverrides={...hidden,T_BgMessage_00:message('appm_text_00'),T_BgMessage_01:{...message('appm_text_03'),...(name?{text:name}:{})}};
    let okay=renderer.draw(top,'mii','AplSelectBase_Up',{bindings:[{name:'AplSelectBase_Up_FadeIn',frame:20}],overrides:{...common,T_Base_00:{visible:false},T_Base_01:{visible:false},T_Base_02:{visible:false}}});
    okay=renderer.draw(bottom,'mii','AplSelectBase',{bindings:[{name:'AplSelectBase_FadeIn',frame:20},{name:'AplSelectBase_Invalid',frame:0}],overrides:{...common,N_BtnBase_02:{visible:false},T_Base_00:message('appm_btn_back_down'),T_BaseShadow_00:message('appm_btn_back_down'),T_Base_01:message('appm_btn_dec_down'),T_BaseShadow_01:message('appm_btn_dec_down')}})&&okay;
    return okay;
  }
  const photo=view.appId==='photo-selector',bank=photo?'P_ap_psel':'S_ap_vsel';
  const message=(label:string)=>nativeMessageOverride(renderer.packs.messages,bank,label,'');
  const noData=name||view.text?.[0]||(photo?'There are no saved photos.':'No saved sounds are available.');
  const footer:PaneOverrides={TxtApt2BtnB:message(photo?'L_D_01':'B_close'),TxtApt2BtnW:message(photo?'L_D_02':'B_confirm')};
  let okay:boolean;
  if(photo){
    okay=renderer.draw(top,'upper','P_AptDlg_U',{overrides:{ULCDMask:{visible:false}}});
    text(top,name||message('LU_06').text||noData,200,105);
    // AptMenu's blue body is a replacement surface. Reuse its neutral upper
    // dialog body beneath the original lower frame and Back control.
    okay=renderer.draw(bottom,'upper','P_AptDlg_U',{center:[160,120],overrides:{RootPane:{scale:[0.8,1]},ULCDMask:{visible:false}}})&&okay;
    okay=renderer.draw(bottom,'lower','AptMenu_D',{bindings:[{name:'AptMenu_D_Disable',frame:0}],overrides:{...footer,DlgWdwL:{visible:false},DlgWdwR:{visible:false}}})&&okay;
    okay=renderer.draw(bottom,'lower','P_BrwsTxt_D',{overrides:{TxtNoData:{...message('L_D_05'),size:[280,60],...(name?{text:name}:{})}}})&&okay;
  }else{
    // The original upper AppImag is a dated sample waveform, not supplied media.
    // Reuse the native dialog frame, with its body stretched to the upper width.
    okay=renderer.draw(top,'lower','Apt_D',{center:[200,120],overrides:{RootPane:{scale:[1.25,1]},'-B-Apt2BtnW':{visible:false},'-B-Apt2BtnB':{visible:false},UserWdwL:{visible:false},UserWdwR:{visible:false}}});
    text(top,message('M_title').text??view.heading,200,45);text(top,noData,200,110);
    okay=renderer.draw(bottom,'lower','Apt_D',{bindings:[{name:'Apt_D_Disable',frame:0}],overrides:{...footer,UserWdwL:{visible:false},UserWdwR:{visible:false}}})&&okay;
    text(bottom,noData,160,110);
  }
  okay=renderer.draw(bottom,'lower','AptTxt',{bindings:[{name:'AptTxt_In',frame:20}],overrides:{Apt1TxtUp:photo?{visible:false}:message('M_title')}})&&okay;
  // The photo prompt's source pane has white glyph colours on a white strip.
  // Draw its supplied English string with the shared bitmap font for readability.
  if(photo)text(bottom,message('L_D_03_00').text??view.heading,160,15,21);
  return okay;
}
