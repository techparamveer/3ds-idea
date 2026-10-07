import {amiiboScreenPacks,drawNativeAmiibo} from './stock-native-amiibo';
import type { AppView } from './app-types';
import { nativeMessageOverride, nativePaneParentPath, nativeTextMetrics, poseNativeLayout, type PaneOverrides, type NativeLayout, type NativePane, type NativePixels } from './native-layout';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import { applicationManualTargets, type StockScreenTarget } from './stock-screen-layout';
import { manualContents, manualPageZeroAvailable, manualSources } from './stock-manual-index';
import type { StockScreenPaintOptions } from './stock-screen-presentation';

const updaterPrefix='packs/system-updater/',nnidPrefix='packs/nnid-settings/';
export const updaterScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:updaterPrefix+'base.json',alias:'helper-base',layouts:['Bg_U_00','Bg_D_00','Base_D_01'],animations:[]},
  {url:updaterPrefix+'up.json',alias:'helper-up',layouts:['CommonBG_U_00','IconUpdate','TextBG_U_00'],animations:['CommonBG_U_00_SceneIn_01','TextBG_U_00_TextFadeIn']},
  {url:updaterPrefix+'layout.json',alias:'helper-layout',layouts:['MessageOnly_D_00'],animations:['MessageOnly_D_00_SceneIn_00']},
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
export const manualScreenPacks:readonly NativeTitlePackRequest[]=[
  ...['PageBg00','IndexBase00','SoftTitleHeader','ContentsTxt','PageNum'].map(name=>({url:'packs/manual/layout-'+name+'.json',alias:'manual-'+name,layouts:[name],animations:[]})),
  {url:'packs/manual/layout-BtnHeadLineTxt.json',alias:'manual-row',layouts:['BtnHeadLineTxt'],animations:['BtnHeadLineTxt_Wait','BtnHeadLineTxt_Choice']},
  {url:'packs/manual/layout-BtnBack00.json',alias:'manual-back',layouts:['BtnBack00'],animations:['BtnBack00_SceneIn']},
  {url:'packs/manual/layout-BtnClose00.json',alias:'manual-close',layouts:['BtnClose00'],animations:['BtnClose00_SceneIn']},
  {url:'packs/manual/messages-and-loose.json',alias:'helper-messages',layouts:[],animations:[]},
];
const manualTitle=(view:AppView)=>typeof view.data?.manualTitleId==='string'?view.data.manualTitleId:null;
/** The applet (0004003000009b02) displays the calling application's own
 * content-1 manual. Page 1 adds only its explicitly delivered chrome. */
function applicationManualPacks(titleId:string,page=false):readonly NativeTitlePackRequest[]{
  const source=manualSources[titleId];
  const chrome=manualScreenPacks.filter(pack=>['manual-SoftTitleHeader','manual-IndexBase00','manual-ContentsTxt','manual-row','helper-messages'].includes(pack.alias)).map(pack=>({...pack}));
  const contents:NativeTitlePackRequest[]=[
    {url:'packs/manual/layout-AllNull.json',alias:'manual-all-root',layouts:['AllNull'],animations:['AllNull_Wait']},
    {url:'packs/manual/layout-IndexNull.json',alias:'manual-index-root',layouts:['IndexNull'],animations:['IndexNull_Wait']},
    {url:'packs/manual/layout-CsrHeadLine00.json',alias:'manual-cursor',layouts:['CsrHeadLine00'],animations:['CsrHeadLine00_Wait']},
    {url:'packs/manual/layout-HLTxt.json',alias:'manual-category',layouts:['HLTxt'],animations:[]},
    {url:'packs/manual/layout-ScrollIndicator.json',alias:'manual-scroll',layouts:['ScrollIndicator'],animations:['ScrollIndicator_Wait']},
    {url:'packs/manual/layout-BtnShdw00.json',alias:'manual-footer-shadow',layouts:['BtnShdw00'],animations:['BtnShdw00_SceneIn']},
    {url:'packs/manual/layout-BtnCloseLng00.json',alias:'manual-footer-close',layouts:['BtnCloseLng00'],animations:['BtnCloseLng00_SceneIn']},
    {url:'packs/manual/layout-BtnLngSel00.json',alias:'manual-footer-language',layouts:['BtnLngSel00'],animations:['BtnLngSel00_SceneIn']},
  ];
  // An unknown title has no delivered manual: its absent pack fails the load explicitly.
  const pageChrome:NativeTitlePackRequest[]=page?[
    ...manualScreenPacks.filter(pack=>pack.alias==='manual-back'),
    ...['BtnClose01','BtnTextSize00'].map(name=>({url:`packs/manual/layout-${name}.json`,alias:`manual-${name}`,layouts:[name],animations:[`${name}_SceneIn`]})),
    {url:'packs/manual/layout-PageShdw00.json',alias:'manual-page-shadow',layouts:['PageShdw00'],animations:[]},
    {url:'packs/manual/layout-MainNull.json',alias:'manual-main-root',layouts:['MainNull'],animations:[]},
    {url:source?.neighborUrl??'packs/manual-unavailable/'+titleId+'-neighbor.json',alias:'manual-neighbor',layouts:['Page_001_small_0','Page_001_small_bg'],animations:[],titleId},
    {url:'packs/manual/layout-PageGroup.json',alias:'manual-page-group',layouts:['PageGroup'],animations:[]},
  ]:[];
  if(page)chrome.find(pack=>pack.alias==='manual-row')!.animations=[...chrome.find(pack=>pack.alias==='manual-row')!.animations,'BtnHeadLineTxt_ChangeWait'];
  return [...chrome,...contents,...pageChrome,{url:source?.url??'packs/manual-unavailable/'+titleId+'.json',alias:'manual-index',layouts:page?['Index','Page_000_small_0','Page_000_small_bg']:['Index'],animations:[],titleId}];
}
export function nativeHelperView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.appId==='amiibo-settings')return {view:'amiibo-opening-read-only',titleId:'000400300000b902',packs:amiiboScreenPacks};
  const manual=view.appId==='manual'?manualTitle(view):null;
  if(manual)return {view:view.screen==='document'?'manual-application-page-1':'manual-application-contents',titleId:'0004003000009b02',packs:applicationManualPacks(manual,view.screen==='document')};
  if(view.appId==='manual')return {view:'manual-portfolio-guide',titleId:'0004003000009b02',packs:manualScreenPacks};
  if(view.appId==='system-transfer')return {view:'transfer-read-only',titleId:'0004001000022a00',packs:transferScreenPacks};
  if(view.appId==='extrapad')return {view:'circle-pad-read-only',titleId:'000400300000cd02',packs:circlePadScreenPacks};
  if(view.appId==='nnid-settings')return {view:'nnid-read-only',titleId:'000400100002c100',packs:nnidScreenPacks};
  if(view.appId==='system-updater')return {view:'updater-read-only',titleId:'0004001000022f00',packs:updaterScreenPacks};
  return null;
}
/** Helpers expose only implemented controls. Updater's source OK is visible
 * but inert; its Cancel returns through the existing Back action. */
export function nativeHelperTargets(view:AppView):StockScreenTarget[]|null{
  if(!nativeHelperView(view))return null;
  const action=view.footer.left?.action??'back';
  if(view.appId==='amiibo-settings')return [{action,x:0,y:212,width:320,height:28}];
  // The first Settings page is delivered; other rows and Language remain inert.
  if(view.appId==='manual'&&manualTitle(view))return applicationManualTargets(view);
  if(view.appId==='manual'){
    if(view.screen!=='main')return [{action,x:40,y:212,width:140,height:28}];
    return [...view.rows.slice(0,3).map((row,index)=>({action:row.id,x:24,y:56.5+index*44,width:272,height:37,row:index})),{action,x:0,y:212,width:320,height:28}];
  }
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
  if(view.appId==='amiibo-settings')return drawNativeAmiibo(renderer,top,bottom);
  if(view.appId==='manual'&&manualTitle(view))return drawApplicationManual(renderer,top,bottom,view,_options);
  if(view.appId==='manual')return drawManual(renderer,top,bottom,view,_options);
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
  // update.bin state 1 does not enter the source's 1 -> 2 Legacy transition.
  draw(top,'helper-base','Bg_U_00');
  draw(bottom,'helper-base','Bg_D_00');
  draw(top,'helper-up','CommonBG_U_00',{bindings:[{name:'CommonBG_U_00_SceneIn_01',frame:20}],overrides:{TextBoxTitle_00:message('update_title')},attachments:{Icon:()=>draw(top,'helper-up','IconUpdate')}});
  // These three source pictures have signed dimensions. Absolute sizes and
  // reflected scales preserve their origins without mutating the title pack.
  draw(top,'helper-up','TextBG_U_00',{bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{...mirrorPanel,TextBox_00:message('update_comm_u')}});
  // update.bin: original question and Cancel/OK footer. The portfolio never
  // accepts OK or enters the subsequent EULA/network/update scenes.
  draw(bottom,'helper-layout','MessageOnly_D_00',{bindings:[{name:'MessageOnly_D_00_SceneIn_00',frame:20}],overrides:{TextBoxTitle_00:message('update_comm')}});
  draw(bottom,'helper-base','Base_D_01',{overrides:{TextBox_00:message('base_2b_cancel'),TextBoxShdw_00:message('base_2b_cancel'),TextBox_01:message('base_2b_ok'),TextBoxShdw_01:message('base_2b_ok')}});
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

const preparedManuals=new WeakSet<NativeLayoutRenderer>();
function prepareManualBody(renderer:NativeLayoutRenderer){
  if(preparedManuals.has(renderer))return;
  const pack=renderer.packs['manual-ContentsTxt'],layout=structuredClone(pack.layouts.ContentsTxt);
  const pane=layout.roots[0].children.find(p=>p.name==='Contents_Txt')!;
  pane.origin=0;pane.translation=[-136,70,0];pane.size=[272,148];pane.text!.alignment=0;pane.text!.size=[16,19.2];
  renderer.packs['manual-ContentsTxt']={...pack,layouts:{...pack.layouts,PortfolioBody:layout}};preparedManuals.add(renderer);
}
/** The source viewer chrome surrounds the supplied local guide. The guide is
 * portfolio content; no missing application manual chapters are invented. */
function drawManual(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options?:StockScreenPaintOptions):boolean{
  prepareManualBody(renderer);
  const message=(label:string)=>nativeMessageOverride(renderer.packs['helper-messages'],'ebird',label,'');
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,options)&&okay;};
  top.fillStyle='#fff';top.fillRect(0,0,400,240);bottom.fillStyle='#fff';bottom.fillRect(0,0,320,240);
  draw(bottom,'manual-IndexBase00','IndexBase00',{center:[160,0]});
  draw(top,'manual-SoftTitleHeader','SoftTitleHeader',{center:[200,0],overrides:{TextBoxTxt_00:{text:'Portfolio Guide'}}});
  draw(top,'manual-ContentsTxt','ContentsTxt',{center:[200,102],overrides:{Contents_Txt:view.screen==='main'?message('BootMsg_Ebird'):{text:view.heading}}});
  const main=view.screen==='main';
  if(main){
    draw(top,'manual-ContentsTxt','PortfolioBody',{center:[200,204],overrides:{Contents_Txt:{text:wrap((view.text??[]).join('\n'),32)}}});
    draw(bottom,'manual-ContentsTxt','ContentsTxt',{center:[160,25],overrides:{Contents_Txt:message('ContentsText')}});
    view.rows.slice(0,3).forEach((row,i)=>draw(bottom,'manual-row','BtnHeadLineTxt',{center:[160,76+i*44],bindings:[{name:i===view.selection?'BtnHeadLineTxt_Choice':'BtnHeadLineTxt_Wait',frame:i===view.selection?10:1}],overrides:{TextBox_Num:{text:String(i+1)},TextBox_Txt:{text:row.label}}}));
    draw(bottom,'manual-close','BtnClose00',{bindings:[{name:'BtnClose00_SceneIn',frame:20}],overrides:{T_BtnB_01:message('BtnClose'),T_BtnF_01:message('BtnClose')}});
  }else{
    draw(bottom,'manual-PageBg00','PageBg00',{center:[0,240]});
    draw(bottom,'manual-ContentsTxt','ContentsTxt',{center:[160,23],overrides:{Contents_Txt:{text:view.heading}}});
    draw(bottom,'manual-ContentsTxt','PortfolioBody',{overrides:{Contents_Txt:{text:wrap((view.text??[]).join('\n'),32)}}});
    draw(top,'manual-PageNum','PageNum',{center:[200,212],overrides:{PageBackNull:{visible:false},PageNumBase02_00:{size:[210,64],scale:[-1,1]},PageAllNum_03:message('PageNum'),PageNum_01:{text:'1'},PageAllNum_02:{text:'1'}}});
    const backOverrides=manualBackOverrides(renderer,options);
    draw(bottom,'manual-back','BtnBack00',{textSampling:'lcd-source-size',bindings:[{name:'BtnBack00_SceneIn',frame:20}],overrides:backOverrides});
  }
  return okay;
}

/** Capture-fitted placement (adaptation, native capture 23:19:14.606, SHA-256
 * 2efb7fa7…799b): the applet positions the list in code under IndexNull
 * HeadLineAll. Values are BtnHeadLineTxt/ContentsTxt draw centres on the lower
 * LCD. A page row advances 54px and a category band 34px. */
export const APPLICATION_MANUAL_SLOTS={firstRow:86,row:54,category:34,categoryOffset:-10,contentsCentre:42} as const;
/** Component-level capture fit against the same settled native frame. These
 * values retain the delivered layouts: they position the row body and footer
 * panes, and compensate the source blue register for BtnShdw00's later blend. */
export const APPLICATION_MANUAL_LOWER_FIT={rowBodyY:2,secondCategoryRegister:[118,183,218] as [number,number,number],languageGlyphX:-43,languageLabelX:13} as const;
/** Applet `IndexNull` (layout/IndexNull.arc/blyt/IndexNull.bclyt, SHA-256
 * af65d3ac00782bdd74f2c09ea36a61d739650bab5da39602acca4be9d85443c9)
 * holds `SoftTitleHead` at Y+262 of its 400×480 dual-screen root,
 * also in `IndexNull_Wait`. The root centre is the LCD seam: upper y = 240-262. */
export const APPLICATION_MANUAL_HEADER_CENTRE:[number,number]=[200,240-262];
/** Lower list clip: BtnClose00/BtnCloseLng00 `P_Btn_01` (y-120, height 28)
 * begins at y212 of the 240px lower canvas. */
const APPLICATION_MANUAL_LIST_CLIP:[number,number,number,number]=[0,0,320,212];
const preparedApplicationManualCategories=new WeakSet<NativeLayoutRenderer>();
const preparedApplicationManualRows=new WeakSet<NativeLayoutRenderer>();
/** Manual 0x162314 selects a 64x64 RGB565 texture and the source P_Icon_00
 * samples UV 0..0.75, the SMDH large icon's exact 48x48 extent. The remaining
 * storage is intentionally transparent: the source UV never samples it. */
export function applicationManualIconPixels(source:NativePixels):NativePixels{
  if(source.width!==48||source.height!==48||source.data.length!==48*48*4)throw new Error('Manual title icon requires the SMDH large icon');
  const data=new Uint8ClampedArray(64*64*4);
  for(let y=0;y<48;y++)for(let x=0;x<48;x++){
    const from=(y*48+x)*4,to=(y*64+x)*4;
    data.set(source.data.subarray(from,from+4),to);
  }
  return {width:64,height:64,data,picaFormat:3};
}
/** Manual 0x1702c8 uses the plain TextBox_Txt writer. Its alignment 0/0
 * reaches writer flags 0 at 0x19aa10, preserving the original glyph quads. */
function validateApplicationManualRow(layout:NativeLayout|undefined,bodyY:number){
  const fail=()=>{throw new Error('Unsupported Manual Contents TextBox_Txt source');};
  if(!layout||layout.unsupported.length||layout.fonts.length!==1||layout.fonts[0]!=='cbf_std.bcfnt')return fail();
  const path=nativePaneParentPath(layout,'TextBox_Txt');
  if(!path||path.length!==3||path.map(pane=>pane.name).join('/')!=='RootPane/BtnHeadLineBody/TextBox_Txt')return fail();
  const counts=new Map<string,number>();
  const visit=(panes:NativePane[])=>{for(const pane of panes){counts.set(pane.name,(counts.get(pane.name)??0)+1);visit(pane.children);}};
  visit(layout.roots);
  const same=(value:unknown,expected:readonly number[])=>Array.isArray(value)&&value.length===expected.length&&value.every((item,index)=>item===expected[index]);
  for(const [index,pane] of path.entries()){
    if(counts.get(pane.name)!==1||pane.kind!==(index===2?'txt1':'pan1')||pane.flags!==1||pane.alpha!==255||pane.origin!==(index===2?3:4)
      ||pane.unsupported?.length||pane.part||pane.picture||pane.window||index!==2&&pane.text||!same(pane.rotation,[0,0,0])||!same(pane.scale,[1,1]))return fail();
    if(!same(pane.translation,index===0?[0,0,0]:index===1?[0,bodyY,0]:[-97,1.5399999618530273,0])||!same(pane.size,index===0?[320,240]:index===1?[30,40]:[290,21]))return fail();
  }
  const pane=path[2],text=pane.text;
  if(!text||pane.children.length||text.font!==0||text.material!==0||text.alignment!==0||text.lineAlignment!==0
    ||text.characterSpacing!==0||text.lineSpacing!==0||!('flags' in text)||text.flags!==0
    ||!('capacity' in text)||text.capacity!==30||!('length' in text)||text.length!==30||!same(text.size,[17.5,21])
    ||!same(text.topColor,[50,50,50,255])||!same(text.bottomColor,[50,50,50,255])
    ||text.messageStyle!==undefined||text.colorSpans!==undefined||text.glyphScaleSpans!==undefined||text.fixedWidthSpans!==undefined
    ||text.cursorAdvances!==undefined||text.lineAdvanceScales!==undefined||text.multilineBlockOrigin!==undefined||text.singleLineBlockOrigin!==undefined
    )return fail();
  const material=layout.materials[0];
  if(!material||Object.keys(material).sort().join(',')!=='bufferColor,constantColors,coordinateGenerators,flags,name,tevStages,textureMaps,textureMatrices,textureOnly,unsupported'
    ||material.name!=='TextBox_Txt'||!('flags' in material)||material.flags!==0||material.textureOnly!==false||!same(material.bufferColor,[50,50,50,0])
    ||material.constantColors.length!==6||material.constantColors.some(color=>!same(color,[255,255,255,255]))
    ||material.textureMaps.length||material.textureMatrices.length||material.coordinateGenerators.length||material.tevStages.length||material.unsupported.length)return fail();
  return layout;
}
function prepareApplicationManualRows(renderer:NativeLayoutRenderer,bottom?:CanvasRenderingContext2D){
  const pack=renderer.packs['manual-row'],source=bottom?validateApplicationManualRow(pack?.layouts.BtnHeadLineTxt,3):pack.layouts.BtnHeadLineTxt;
  if(bottom){
    const font=renderer.getFontManifest('cbf_std.bcfnt'),transform=bottom.getTransform?.();
    if(!font||font.sourceSha256!=='95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581'
      ||font.colorMode!=='alpha'||font.width!==25||font.height!==30||font.ascent!==25||font.baseline!==25||font.lineFeed!==30)throw new Error('Unsupported Manual Contents TextBox_Txt font');
    if(!transform||transform.a!==1||transform.d!==1||transform.b!==0||transform.c!==0||!Number.isFinite(transform.e)||!Number.isFinite(transform.f))throw new Error('Unsupported Manual Contents TextBox_Txt LCD transform');
  }
  if(!preparedApplicationManualRows.has(renderer)){
    const tint=(name:string,color:[number,number,number])=>{
      const layout=structuredClone(source),material=layout.materials.find(item=>item.name==='PageTitleNumBase');
      if(!material)throw new Error('Missing Manual page-number material');
      material.bufferColor=[...color,0];
      // Native row artwork is one raster line above the unparented applet
      // layout. Keep the source slot/cursor centres and move only its body.
      const body=layout.roots[0]?.children.find(item=>item.name==='BtnHeadLineBody');
      if(!body)throw new Error('Missing Manual row body');
      body.translation=[body.translation[0],APPLICATION_MANUAL_LOWER_FIT.rowBodyY,body.translation[2]];
      return [name,layout] as const;
    };
    renderer.packs['manual-row']={...pack,layouts:{...pack.layouts,
      ...Object.fromEntries([tint('ManualRowImportant',[237,136,136]),tint('ManualRowGettingStarted',[154,212,105])])}};
    preparedApplicationManualRows.add(renderer);
  }
  // Recheck cached clones and the actual Wait pose: an unsupported replacement
  // must fail instead of taking the renderer's generic Canvas fallback.
  if(bottom)for(const name of ['ManualRowImportant','ManualRowGettingStarted']){
    const layout=validateApplicationManualRow(renderer.packs['manual-row'].layouts[name],APPLICATION_MANUAL_LOWER_FIT.rowBodyY);
    validateApplicationManualRow(poseNativeLayout(layout,pack.animations,[{name:'BtnHeadLineTxt_Wait',frame:1}]),3);
  }
}
function prepareApplicationManualCategory(renderer:NativeLayoutRenderer){
  if(preparedApplicationManualCategories.has(renderer))return;
  const pack=renderer.packs['manual-category'];
  // The applet supplies this register in code. Its green value is measured
  // from the settled 400×480 Azahar capture, while the shape, alpha and
  // NintendoWare material operation remain from HLTxt/CategoryColor00.
  const tint=(color:[number,number,number])=>{
    const layout=structuredClone(pack.layouts.HLTxt);
    for(const material of layout.materials)if(material.name==='IndexCategory00'||material.name==='IndexCategory01')material.bufferColor=[...color,0];
    return layout;
  };
  // BtnShdw00 is composited after the clipped second band. Its native blend
  // lifts this register to the capture's visible 124/186/219 blue.
  renderer.packs['manual-category']={...pack,layouts:{...pack.layouts,HLTxt:tint([154,212,105]),HLTxtBlue:tint(APPLICATION_MANUAL_LOWER_FIT.secondCategoryRegister)}};
  preparedApplicationManualCategories.add(renderer);
}

/** Application manual Contents. Rows come only from
 * the application's source Index.bclyt; titles, numbers and order are source
 * data. All visible chrome below is decoded from the Manual applet packs. */
function drawApplicationManual(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options?:StockScreenPaintOptions):boolean{
  const titleId=manualTitle(view)!,source=manualSources[titleId],index=renderer.packs['manual-index']?.layouts.Index;
  if(!source||!index)return false;
  if(view.screen==='document')return drawApplicationManualPage(renderer,top,bottom,view,options);
  prepareApplicationManualCategory(renderer);
  prepareApplicationManualRows(renderer,bottom);
  const entries=manualContents(index);
  const message=(label:string)=>nativeMessageOverride(renderer.packs['helper-messages'],'ebird',label,'');
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,options)&&okay;};
  // The applet's 400×480 root owns both LCD bases. Centre it at the source
  // upper-screen origin so P_Bg_U_00 fills this 400×240 target; the browser
  // publishes the lower LCD separately below.
  top.fillStyle='#fff';top.fillRect(0,0,400,240);bottom.fillStyle='#fff';bottom.fillRect(0,0,320,240);
  draw(top,'manual-all-root','AllNull',{center:[200,240],bindings:[{name:'AllNull_Wait',frame:1}]});
  draw(bottom,'manual-all-root','AllNull',{center:[160,0],bindings:[{name:'AllNull_Wait',frame:1}]});
  // P_Icon_00 defaults to IconBlank; the applet binds the calling title's SMDH icon.
  draw(top,'manual-index-root','IndexNull',{center:[200,240-262],bindings:[{name:'IndexNull_Wait',frame:1}]});
  const sourceIcon=options?.nativeImage?.(source.iconUrl);
  const icon=sourceIcon&&sourceIcon.width===48&&sourceIcon.height===48?applicationManualIconPixels(sourceIcon):undefined;
  draw(top,'manual-SoftTitleHeader','SoftTitleHeader',{center:APPLICATION_MANUAL_HEADER_CENTRE,textSampling:'lcd-source-size',textures:icon?{'IconBlank.bclim':icon}:undefined,overrides:{TextBoxTxt_00:{text:source.heading},...(!icon&&{P_Icon_00:{visible:false}})}});
  draw(top,'manual-scroll','ScrollIndicator',{center:[392,32],pictureSampling:'lcd',bindings:[{name:'ScrollIndicator_Wait',frame:5}]});
  draw(bottom,'manual-IndexBase00','IndexBase00',{center:[160,0]});
  draw(bottom,'manual-ContentsTxt','ContentsTxt',{center:[160,APPLICATION_MANUAL_SLOTS.contentsCentre],textSampling:'lcd',overrides:{Contents_Txt:message('ContentsText')}});
  let y=APPLICATION_MANUAL_SLOTS.firstRow,categoryIndex=0;
  for(const entry of entries){
    if(entry.kind==='category'){
      // The second band starts at y205; only its top seven pixels survive the
      // footer clip in the captured native Contents frame.
      if(y+APPLICATION_MANUAL_SLOTS.categoryOffset-16>=APPLICATION_MANUAL_LIST_CLIP[3])break;
      draw(bottom,'manual-category',categoryIndex===1?'HLTxtBlue':'HLTxt',{center:[160,y+APPLICATION_MANUAL_SLOTS.categoryOffset],clip:APPLICATION_MANUAL_LIST_CLIP,pictureSampling:'lcd',textSampling:'lcd',overrides:{IndexCategory01:{size:[160,32],scale:[-1,1]},TextBox_00:{text:entry.title}}});
      categoryIndex++;
      y+=APPLICATION_MANUAL_SLOTS.category;continue;
    }
    if(y>=APPLICATION_MANUAL_LIST_CLIP[3])break;
    // The native selected row keeps its idle button under the separate
    // CsrHeadLine00 cursor, so every row uses BtnHeadLineTxt_Wait.
    // The applet truncates the first long English heading in its row control.
    // The cutoff below is measured from the settled native Contents capture.
    const title=entry.title.length>24?entry.title.slice(0,23)+'...':entry.title;
    if(/[\r\n]/.test(title))throw new Error('Unsupported Manual Contents TextBox_Txt multiline title');
    draw(bottom,'manual-row',entry.page===0?'ManualRowImportant':'ManualRowGettingStarted',{center:[160,y],clip:APPLICATION_MANUAL_LIST_CLIP,pictureSampling:'lcd',textSampling:'lcd-source-size-left',textSamplingPanes:['TextBox_Txt'],bindings:[{name:'BtnHeadLineTxt_Wait',frame:1}],overrides:{TextBox_Num:{text:String(entry.page+1)},TextBox_Txt:{text:title}}});
    y+=APPLICATION_MANUAL_SLOTS.row;
  }
  draw(bottom,'manual-cursor','CsrHeadLine00',{center:[160,APPLICATION_MANUAL_SLOTS.firstRow+4],bindings:[{name:'CsrHeadLine00_Wait',frame:22}],clip:APPLICATION_MANUAL_LIST_CLIP});
  draw(bottom,'manual-footer-shadow','BtnShdw00',{bindings:[{name:'BtnShdw00_SceneIn',frame:20}]});
  draw(bottom,'manual-footer-close','BtnCloseLng00',{textSampling:'lcd-source-size',bindings:[{name:'BtnCloseLng00_SceneIn',frame:20}],overrides:{T_BtnB_01:message('BtnCloseLng'),T_BtnF_01:message('BtnCloseLng')}});
  draw(bottom,'manual-footer-language','BtnLngSel00',{textSampling:'lcd-source-size',bindings:[{name:'BtnLngSel00_SceneIn',frame:20}],overrides:{T_BtnB_Text:{...message('BtnLngSel'),translation:[APPLICATION_MANUAL_LOWER_FIT.languageLabelX,23.5,0]},T_BtnF_Text:{...message('BtnLngSel'),translation:[APPLICATION_MANUAL_LOWER_FIT.languageLabelX,25,0]},T_BtnB_Pict:{...message('BtnLngSel_Picto'),translation:[APPLICATION_MANUAL_LOWER_FIT.languageGlyphX,24.5,0]},T_BtnF_Pict:{...message('BtnLngSel_Picto'),translation:[APPLICATION_MANUAL_LOWER_FIT.languageGlyphX,26,0]}}});
  return okay;
}

function manualBackOverrides(renderer:NativeLayoutRenderer,options?:StockScreenPaintOptions):PaneOverrides{
 const message=(label:string)=>nativeMessageOverride(renderer.packs['helper-messages'],'ebird',label,'');
    const backOverrides:PaneOverrides={T_BtnB_Text:message('BtnBack'),T_BtnF_Text:message('BtnBack'),T_BtnB_Pict:message('BtnBack_Picto'),T_BtnF_Pict:message('BtnBack_Picto')};
    const layout=renderer.packs['manual-back'].layouts.BtnBack00,font=options?.font?.manifest;
    if(font){
      // Source glyph/label panes share x0; group them using the selected source
      // message styles and actual font advances, keeping each vertical baseline.
      const width=(name:string,value:string)=>{const pane=nativePaneParentPath(layout,name)!.at(-1)!;const metrics=nativeTextMetrics({...pane.text!,messageStyle:backOverrides[name].messageStyle},font),glyphs=Array.from(value,char=>font.glyphs[String(char.codePointAt(0))]??font.fallback);return glyphs.reduce((sum,glyph)=>sum+(glyph?.advance??0)*metrics.size[0]/(font.width??font.height)+metrics.characterSpacing,0)-(glyphs.length?metrics.characterSpacing:0);};
      const labelWidth=width('T_BtnF_Text',backOverrides.T_BtnF_Text.text!),glyphWidth=width('T_BtnF_Pict',backOverrides.T_BtnF_Pict.text!),gap=width('T_BtnF_Text',' ');
      for(const [name,override]of Object.entries(backOverrides)){const pane=nativePaneParentPath(layout,name)!.at(-1)!;override.translation=[name.endsWith('Text')?(glyphWidth+gap)/2:-(labelWidth+gap)/2,pane.translation[1],pane.translation[2]];}
    }else{backOverrides.T_BtnB_Pict={visible:false};backOverrides.T_BtnF_Pict={visible:false};}

 return backOverrides;
}

/** Settled first page only. The small variant is identified by every line break
 * in native 00:44:30.298. Body origin38 and header centre20 are capture fits;
 * page geometry, glyphs and all strings remain authored source data. */
function drawApplicationManualPage(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options?:StockScreenPaintOptions):boolean{
  if(!manualPageZeroAvailable(manualTitle(view))||view.data?.page!==0)return false;
  const index=renderer.packs['manual-index'].layouts.Index;
  const page=manualContents(index).find(entry=>entry.kind==='page'&&entry.page===0);
  if(!page||page.kind!=='page')return false;
  prepareApplicationManualRows(renderer);
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,opts)&&okay;};
  const base=renderer.packs['manual-page-group'].layouts.PageGroup.roots[0]?.children.find(pane=>pane.name==='BaseN');
  if(!base||base.translation[0]!==-160)return false;
  const main=renderer.packs['manual-main-root'].layouts.MainNull;
  const neighbor=nativePaneParentPath(main,'ContsR')?.at(-1);
  const next=manualContents(index).find(entry=>entry.kind==='page'&&entry.page===1);
  if(!neighbor||!next||next.kind!=='page')return false;
  draw(top,'manual-all-root','AllNull',{center:[200,240],bindings:[{name:'AllNull_Wait',frame:1}]});
  draw(bottom,'manual-all-root','AllNull',{center:[160,0],bindings:[{name:'AllNull_Wait',frame:1}]});
  for(const [ctx,x,y,width,height] of [[top,200+base.translation[0],38,400,240],[bottom,160+base.translation[0],-202,320,212]] as const){
    // ContsR is the authored adjacent-page offset; only its upper-LCD sliver is visible.
    const right=x+neighbor.translation[0];
    draw(ctx,'manual-page-shadow','PageShdw00',{center:[right,y+202],clip:[0,0,width,height],overrides:{PageShdw00_01:{size:[30,280],scale:[-1,1]},PageShdw00_03:{size:[30,240],scale:[-1,1]}}});
    draw(ctx,'manual-neighbor','Page_001_small_bg',{center:[right,y],clip:[0,0,width,height]});
    draw(ctx,'manual-neighbor','Page_001_small_0',{center:[right,y],clip:[right,0,320,height]});
    draw(ctx,'manual-page-shadow','PageShdw00',{center:[x,y+202],clip:[0,0,width,height],overrides:{PageShdw00_01:{size:[30,280],scale:[-1,1]},PageShdw00_03:{size:[30,240],scale:[-1,1]}}});
    draw(ctx,'manual-index','Page_000_small_bg',{center:[x,y],clip:[0,0,width,height]});
    draw(ctx,'manual-index','Page_000_small_0',{center:[x,y],clip:[x,0,320,height],textSampling:'lcd-source-size-left'});
  }
  // ChangeWait supplies x−145.5 for the number chip, x−122 for title text,
  // BtnShdw01 alpha 255 / width 512, and body y+0.5. That half-pixel pose is
  // the authored hairline; Contents already samples this layout at LCD centres.
  draw(top,'manual-row','ManualRowGettingStarted',{center:[200+neighbor.translation[0],20],pictureSampling:'lcd',bindings:[{name:'BtnHeadLineTxt_ChangeWait',frame:0}],overrides:{TextBox_Num:{text:String(next.page+1)},TextBox_Txt:{text:next.title}}});
  draw(top,'manual-row','ManualRowImportant',{center:[200,20],pictureSampling:'lcd',bindings:[{name:'BtnHeadLineTxt_ChangeWait',frame:0}],overrides:{TextBox_Num:{text:String(page.page+1)},TextBox_Txt:{text:page.title}}});
  draw(bottom,'manual-BtnClose01','BtnClose01',{textSampling:'lcd-source-size',bindings:[{name:'BtnClose01_SceneIn',frame:20}]});
  draw(bottom,'manual-back','BtnBack00',{textSampling:'lcd-source-size',bindings:[{name:'BtnBack00_SceneIn',frame:20}],overrides:manualBackOverrides(renderer,options)});
  const message=(label:string)=>nativeMessageOverride(renderer.packs['helper-messages'],'ebird',label,'');
  // Enlarge is visible source chrome but remains inert in this first-page slice.
  const sizeOverrides:PaneOverrides={BtnMinusIcon00:{visible:false},Plus01__Text:message('BtnTextSize_Big'),Plus02__Text:message('BtnTextSize_Big'),T_BtnB_Pict:message('BtnTextSize_Picto'),T_BtnF_Pict:message('BtnTextSize_Picto')};
  const sizeLayout=renderer.packs['manual-BtnTextSize00'].layouts.BtnTextSize00,font=options?.font?.manifest;
  if(font){
    const width=(name:string,text:string)=>{const pane=nativePaneParentPath(sizeLayout,name)!.at(-1)!,metrics=nativeTextMetrics({...pane.text!,messageStyle:sizeOverrides[name].messageStyle},font);return Array.from(text,char=>font.glyphs[String(char.codePointAt(0))]??font.fallback).reduce((sum,glyph)=>sum+(glyph?.advance??0)*metrics.size[0]/(font.width??font.height)+metrics.characterSpacing,0)-metrics.characterSpacing;};
    const label=width('Plus02__Text',sizeOverrides.Plus02__Text.text!),glyph=width('T_BtnF_Pict',sizeOverrides.T_BtnF_Pict.text!),gap=width('Plus02__Text',' ');
    for(const name of ['Plus01__Text','Plus02__Text','T_BtnB_Pict','T_BtnF_Pict']){const pane=nativePaneParentPath(sizeLayout,name)!.at(-1)!;sizeOverrides[name].translation=[name.startsWith('Plus')?(glyph+gap)/2:-(label+gap)/2,pane.translation[1],pane.translation[2]];}
  }
  draw(bottom,'manual-BtnTextSize00','BtnTextSize00',{textSampling:'lcd-source-size',bindings:[{name:'BtnTextSize00_SceneIn',frame:20}],overrides:sizeOverrides});
  return okay;
}
