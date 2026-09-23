import type { AppView } from './app-types';
import { nativeMessageOverride, type PaneOverrides, type NativeLayout } from './native-layout';
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
export const transferScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:'packs/system-transfer/CARDBOARD-layout-layout-lz77.json',alias:'transfer',layouts:['Bg_U_00','Bg_D_00','CommonBG_U_00','title_D_00','position_D_00','button_D_01','returnBtn_D_00'],animations:['CommonBG_U_00_in_00','position_D_00_inOut_00','button_D_01_touchOn_00','returnBtn_D_00_touchOff_00']},
  {url:'packs/system-transfer/messages-and-loose.json',alias:'helper-messages',layouts:[],animations:[]},
];
export const circlePadScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:'packs/circle-pad-pro/extrapad.json',alias:'extrapad',layouts:['Bg_U_00','Bg_D_00','CommonBG_U_00','TextBG_U_00','Dialog_D_00','Base_D_00','Base_D_01'],animations:['CommonBG_U_00_SceneIn_00','TextBG_U_00_TextFadeIn','Dialog_D_00_FadeIn','Base_D_00_SceneIn_00','Base_D_01_SceneIn_00']},
  {url:'packs/circle-pad-pro/messages-and-loose.json',alias:'helper-messages',layouts:[],animations:[]},
];
export function nativeHelperView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.appId==='system-transfer')return {view:'transfer-read-only',titleId:'0004001000022a00',packs:transferScreenPacks};
  if(view.appId==='extrapad')return {view:'circle-pad-read-only',titleId:'000400300000cd02',packs:circlePadScreenPacks};
  if(view.appId==='nnid-settings')return {view:'nnid-read-only',titleId:'000400100002c100',packs:nnidScreenPacks};
  if(view.appId==='system-updater')return {view:'updater-read-only',titleId:'0004001000022f00',packs:updaterScreenPacks};
  return null;
}
/** The initial helpers expose only the native Back control. The runtime must
 * likewise omit account/update action rows rather than leave hidden targets. */
export function nativeHelperTargets(view:AppView):StockScreenTarget[]|null{
  if(!nativeHelperView(view))return null;
  const action=view.footer.left?.action??'back';
  if(view.appId==='system-transfer'){
    const result:StockScreenTarget[]=[{action,x:0,y:208,width:120,height:32}];
    if(view.screen==='main')view.rows.forEach((row,index)=>{const y=row.id==='3ds'?18:row.id==='dsi'?110:null;if(y!==null)result.push({action:row.id,x:27,y,width:266,height:64,row:index});});
    return result;
  }
  if(view.appId==='extrapad')return view.screen==='main'?[{action,x:0,y:212,width:160,height:28},{action:'information',x:160,y:212,width:160,height:28,row:0}]:[{action,x:0,y:212,width:320,height:28}];
  return view.appId==='nnid-settings'?[{action,x:0,y:212,width:64,height:28}]:[{action,x:0,y:208,width:120,height:32}];
}
const wrap=(value:string,width:number)=>value.split('\n').map(line=>{const lines:string[]=[];let current='';for(const word of line.split(/\s+/)){if(current&&current.length+word.length+1>width){lines.push(current);current=word;}else current+=(current?' ':'')+word;}lines.push(current);return lines.join('\n');}).join('\n');
const mirrorPanel:PaneOverrides={UpWndwLT_01:{size:[184,80],scale:[-1,1]},UpWndwLT_02:{size:[184,80],scale:[1,-1]},UpWndwLT_03:{size:[184,80],scale:[-1,-1]}};

/** Native entry chrome with local read-only notices. No service status is
 * inferred: in particular the source “up to date” message is never displayed. */
export function drawNativeHelperFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,_options?:StockScreenPaintOptions):boolean{
  if(!nativeHelperView(view))return false;
  if(view.appId==='system-transfer')return drawTransfer(renderer,top,bottom,view);
  if(view.appId==='extrapad')return drawCirclePad(renderer,top,bottom,view);
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

const preparedTransfers=new WeakSet<NativeLayoutRenderer>();
/** The two supplied clips carry archive-level shares whose endpoints are absent
 * in these layouts. Keep immutable source clips and validate before deriving. */
function prepareTransfer(renderer:NativeLayoutRenderer){
  if(preparedTransfers.has(renderer))return;
  const pack=renderer.packs.transfer,animations={...pack.animations};
  for(const [name,layoutName]of [['position_D_00_inOut_00','position_D_00'],['button_D_01_touchOn_00','button_D_01']]){
    const source=animations[name],layout=pack.layouts[layoutName],panes=new Set<string>(),groups=new Set<string>();
    const collectPanes=(items:NativeLayout['roots'])=>items.forEach(p=>{panes.add(p.name);collectPanes(p.children);});collectPanes(layout.roots);
    const collectGroups=(items:NativeLayout['groups'])=>items.forEach(g=>{groups.add(g.name);collectGroups(g.children);});collectGroups(layout.groups);
    for(const share of source.shares??[])if(!['Button/AS_Picture_00','BottunUser/AS_Picture_00','BottunPage01/AS_Picture_16'].includes(share.sourcePane+'/'+share.targetGroup)||panes.has(share.sourcePane)||groups.has(share.targetGroup))throw new Error('Transfer animation share requires an explicit composition');
    animations[name+'_ReadOnly']={...source,shares:[]};
  }
  renderer.packs.transfer={...pack,animations};preparedTransfers.add(renderer);
}
function drawTransfer(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView):boolean{
  prepareTransfer(renderer);
  const message=(label:string)=>nativeMessageOverride(renderer.packs['helper-messages'],'cardboard_ctr',label,'');
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,'transfer',layout,options)&&okay;};
  draw(top,'Bg_U_00',{overrides:{N_wipe_00:{visible:false}}});draw(bottom,'Bg_D_00');
  draw(top,'CommonBG_U_00',{bindings:[{name:'CommonBG_U_00_in_00',frame:80}],overrides:{T_title_00:message('Title_Name')}});
  draw(top,'title_D_00',{center:[212,104],overrides:{T_title_00:message(view.screen==='main'?'CM_00_Header':view.data?.field==='dsi'?'Button_CM_00_TWL':'Button_CM_00_CTR')}});
  const back=()=>draw(bottom,'returnBtn_D_00',{bindings:[{name:'returnBtn_D_00_touchOff_00',frame:5}],overrides:{T_returnBtn_00:message('Button_Return'),T_returnBtnS_00:message('Button_Return'),T_returnBtn_01:{visible:false},T_returnBtnS_01:{visible:false}}});
  const attachments:Record<string,()=>void>={N_returnBtn_D_00:back};
  if(view.screen==='main')for(const [mount,id,label]of [['N_button_20','3ds','Button_CM_00_CTR'],['N_button_21','dsi','Button_CM_00_TWL']])attachments[mount]=()=>draw(bottom,'button_D_01',{bindings:[{name:'button_D_01_touchOn_00_ReadOnly',frame:view.rows[view.selection]?.id===id?1:0}],overrides:{T_button_00:message(label)}});
  draw(bottom,'position_D_00',{bindings:[{name:'position_D_00_inOut_00_ReadOnly',frame:20}],attachments});
  if(view.screen!=='main')draw(bottom,'title_D_00',{center:[172,82],overrides:{T_title_00:{text:wrap((view.text??[]).join('\n')||'No console data is connected.',30),size:[280,100],fontSize:[17,20.4]},P_title_00:{size:[288,52]},P_title_01:{translation:[0,-104,0],size:[288,52]}}});
  return okay;
}
function drawCirclePad(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView):boolean{
  const message=(label:string)=>nativeMessageOverride(renderer.packs['helper-messages'],'extrapad_msbt_LZ',label,'');
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,'extrapad',layout,options)&&okay;};
  draw(top,'Bg_U_00');draw(bottom,'Bg_D_00');
  draw(top,'CommonBG_U_00',{bindings:[{name:'CommonBG_U_00_SceneIn_00',frame:20}]});
  draw(top,'TextBG_U_00',{bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{...mirrorPanel,TextBox_00:message('top_comm_u')}});
  const main=view.screen==='main';
  draw(bottom,'Dialog_D_00',{center:[160,106],bindings:[{name:'Dialog_D_00_FadeIn',frame:20}],overrides:{TextBoxDialog_00:main?message('cepd_dlg_ready'):{text:wrap((view.text??[]).join('\n')||'Accessory calibration is unavailable.',30),fontSize:[17,20.4]}}});
  const footer=main?'Base_D_01':'Base_D_00';
  draw(bottom,footer,{bindings:[{name:footer+'_SceneIn_00',frame:40}],overrides:{TextBox_00:message('base_2b_cancel'),TextBoxShdw_00:message('base_2b_cancel'),...(main?{TextBox_01:message('base_2b_next'),TextBoxShdw_01:message('base_2b_next')}: {})}});
  return okay;
}
