import { validateHomeHudSample, type DiagnosticHomeHudSample } from './home-hud-sample';
import { sampleSystemHomeFolderClose } from './home-folder-close-system';
import { BitmapFont, loadBitmapFont } from './bitmap-font';
import { decodeNativePng } from './native-png';
import { nativeBannerLabelOverride } from './native-banner-label';
import { NativeLayoutRenderer } from './native-renderer';
import { boundAnimationTracks, nativeFolderGlyphPixels, nativeMessageOverride, nativePaneParentPath, nativeTextureSamplePixels, poseNativeLayout, sampleNativeTrack, type AnimationBinding, type NativePack, type NativePixels, type PaneOverrides } from './native-layout';
import { isHomeFolderBackTouch, rowCount, toolbar as toolbarRegions, type MenuState } from './state';
import { getHomeGestureView } from './system';
import { getHomeDensityControls } from './home-density-controls';
import { getHomeFooter, getNativeFolderBalloon, getNativeFolderPanel, getNativeHomePanel, nativeHomeDensityFrame, nativeHomeDensityMetric, type HomePresentation } from './home-presentation';
import type { HomeTilePose } from './home-tile-pose';
import { selectHomeSettingsBalloonText, selectHomeHealthBalloonText, selectHomeSoundBalloonText, selectHomeCameraBalloonText } from './home-balloon-presentation';
import { selectNotesMetadata } from './notes-title-metadata';
import { drawHomeSuspendedIcon } from './home-suspended-window';
import { homeSoftwareSwitchTitles } from './home-software-dialog';
import { ownedHomeFooterContact } from './home-footer-touch';
import { HOME_FOOTER_TOUCH_GEOMETRY } from './stock-screen-layout';

type Context=CanvasRenderingContext2D;
export type FirmwarePresentationAssets={sharedFont:BitmapFont;hudFont:BitmapFont;renderer:NativeLayoutRenderer;titleIcons:Map<string,HTMLImageElement>;titleIconPixels:Map<string,NativePixels>;titleDescriptions:Map<string,string>;settingsBalloonText:string|null;healthBalloonText:string|null;soundBalloonText:string|null;cameraBalloonText:string|null;diagnostics:string[];dispose():void};
type Manifest={schema:number;firmware:string;fonts:{shared:string;hud:string};home:Record<string,string>;titles?:Record<string,{icon?:string}>};
const homeSettingsLayouts=['PtDlgBg_U_00','PtDlgBg_D_00','PtDlgCnt_CTR','PtBtnL_Thm_00','PtBtnM_Mym_00','PtBtnT_Lgt_00','PtBtnT_Abl_00','PtClose_00','PtSlideBar','PtLine_00','PtCsr_00'];
const homeLayoutManagerLayouts=['MyMenuBtmBtn_D_00','MyMenuBtn_D_00','MyMenuCsr_00','MyMenuDlg_00','MyMenuDlg_01','MyMenuRandom','MyMenu_D_00','MyMenu_U_00'];
const homeLayouts={common:['CmnFadeNinLogo_U_00','CmnFadeNinLogo_D_00'],sleep:['Slp_U_00','Slp_D_00'],hud:['HudMenu_00'],banner:['BnrDsTitle_00'],petit:homeSettingsLayouts,launcher:['LncPlt_00','LncBase_D_01','LncBase_U_00','LncBlln_00','LncCsr_00','LncCsrEfct_00','LncBtmBtn_02','LncFolder_00','LncFolderCapture_00','LncIconFolder_00','LncIconFolderText_00','LncIconDist_01','LncIconSetSrc_00','LncArw_00','LncIconPickUp_00','LncIconFolderPickUp_00','LncIconPickUpBlank_00','LncIconFolderInT_00','LncIconFolderInB_00']};

export async function loadFirmwarePresentationAssets(manifestUrl='/os/firmware/10.7.0-32E/manifest.json',signal?:AbortSignal):Promise<FirmwarePresentationAssets>{
 const base=new URL(manifestUrl,window.location.href),controller=new AbortController();
 const abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const fonts:BitmapFont[]=[];
 try{
  const json=async <T>(url:string):Promise<T>=>{const response=await fetch(new URL(url,base),{signal:controller.signal});if(!response.ok)throw new Error(`Firmware asset HTTP ${response.status}: ${url}`);return response.json();};
  const manifest=await json<Manifest>(base.href);
  if(manifest.schema!==1||manifest.firmware!=='10.7.0-32E'||!manifest.fonts||!manifest.home)throw new Error('Unsupported firmware presentation manifest');
  const settingsBalloonText=selectHomeSettingsBalloonText(manifest);
  const healthBalloonText=selectHomeHealthBalloonText(manifest);
  const soundBalloonText=selectHomeSoundBalloonText(manifest);
  const cameraBalloonText=selectHomeCameraBalloonText(manifest);
  const titleIcons=new Map<string,HTMLImageElement>();
  const titleIconPixels=new Map<string,NativePixels>();
  const titleDescriptions=new Map<string,string>();
  for(const titleId of Object.keys(manifest.titles??{})){
   const metadata=selectNotesMetadata(manifest,titleId);
   if(!('status' in metadata))titleDescriptions.set(titleId,metadata.description);
  }
  await Promise.all(Object.entries(manifest.titles??{}).map(async ([titleId,title])=>{
   if(!/^[a-f0-9]{16}$/i.test(titleId)||!title.icon||!/^icons\/[a-z0-9-]+\.png$/.test(title.icon))return;
   try{
    const response=await fetch(new URL(title.icon,base),{signal:controller.signal});
    if(!response.ok)throw new Error(`Firmware icon HTTP ${response.status}: ${title.icon}`);
    const pixels=await decodeNativePng(new Uint8Array(await response.arrayBuffer()),{width:48,height:48},controller.signal);
    titleIconPixels.set(titleId.toLowerCase(),pixels);
   }catch(error){if(controller.signal.aborted)throw error;/* Other native presentation remains independently usable. */}
   if(typeof Image==='undefined')return;
   const icon=new Image();icon.src=new URL(title.icon,base).href;
   try{await icon.decode();if(icon.naturalWidth===48&&icon.naturalHeight===48)titleIcons.set(titleId.toLowerCase(),icon);}catch{/* The remaining native presentation can still load. */}
  }));
  const font=async (url:string)=>{const result=await loadBitmapFont(new URL(url,base).href,controller.signal);fonts.push(result);return result;};
  const packNames=['hud','launcher','messages','banner','common','sleep','petit','MyMenu','dialog','dialogmask','sequence',...(manifest.home.launch?['launch']:[])];
  const [sharedFont,hudFont,...loaded]=await Promise.all([font(manifest.fonts.shared),font(manifest.fonts.hud),...packNames.map(name=>json<NativePack>(manifest.home[name]))]);
  const packs=Object.fromEntries(packNames.map((name,i)=>[name,loaded[i]])) as Record<string,NativePack>;
  if(!packs.MyMenu?.layouts||!Object.keys(packs.MyMenu.layouts).length)throw new Error('Missing native HOME layout manager pack');
  const requestedLayouts={...homeLayouts,launcher:[...homeLayouts.launcher,'LncIconSleep_00'],MyMenu:homeLayoutManagerLayouts,dialog:['Dlg_A_D_00','Dlg_A_D_02'],dialogmask:['DlgMask_U_00','DlgMask_D_00'],sequence:['LncDlgIcon_D_01'],...(manifest.home.launch?{launch:['NintendoLogo_U_00','NintendoLogo_D_00']}:{})};
  // Reject an incomplete style conversion during loading, before a paint can partially fail.
  for(const [bank,data] of Object.entries(packs.messages.messages))for(const label of Object.keys(data.labels))nativeMessageOverride(packs.messages,bank,label,'');
  const textures:Record<string,Map<string,NativePixels>>={};const decoded=new Map<string,Promise<NativePixels>>();
  await Promise.all(Object.entries(requestedLayouts).map(async ([name,names])=>{
   const pack=packs[name];if(pack.schema!==1||!pack.layouts||!pack.animations)throw new Error(`Invalid native pack ${name}`);
   const needed=new Set<string>();
   for(const layout of names){if(!pack.layouts[layout])throw new Error(`Missing native layout ${layout}`);pack.layouts[layout].textures.forEach(n=>needed.add(n));
    for(const [clip,animation] of Object.entries(pack.animations))if(clip.startsWith(layout+'_'))animation.textures.forEach(n=>needed.add(n));}
   const images=new Map<string,NativePixels>();textures[name]=images;
   await Promise.all([...needed].map(async key=>{
    const record=pack.textures[key];if(!record)throw new Error(`Missing texture record ${name}/${key}`);
    const decodeKey=`${record.picaFormat??'rgba'}:${record.url}`;let pending=decoded.get(decodeKey);
    if(!pending){pending=(async()=>{const response=await fetch(new URL(record.url,base),{signal:controller.signal});
     if(!response.ok)throw new Error(`Firmware texture HTTP ${response.status}: ${key}`);
     return nativeTextureSamplePixels(await decodeNativePng(new Uint8Array(await response.arrayBuffer()),record,controller.signal),record.picaFormat);})();decoded.set(decodeKey,pending);}
    const pixels=await pending;if(pixels.width!==record.width||pixels.height!==record.height)throw new Error(`Texture dimensions differ: ${key}`);images.set(key,pixels);
   }));
  }));
  controller.signal.throwIfAborted();
  const renderer=new NativeLayoutRenderer(packs,textures,new Map([['cbf_std.bcfnt',sharedFont as BitmapFont],['Hud.bcfnt',hudFont as BitmapFont]]));
  renderer.diagnostics.push('Native HOME animation epochs and transitions await synchronized Azahar comparison.','Native layout frame selection and alpha inheritance await Azahar comparison.','Portfolio icons/content intentionally differ from stock applications.','HOME Settings uses source layouts with capture-fitted scrollbar geometry, a bounded four-row scroll range and settled cursor/button bindings; these are adaptations pending native runtime comparison.');
  let disposed=false;
  return {sharedFont:sharedFont as BitmapFont,hudFont:hudFont as BitmapFont,renderer,titleIcons,titleIconPixels,titleDescriptions,settingsBalloonText,healthBalloonText,soundBalloonText,cameraBalloonText,diagnostics:renderer.diagnostics,dispose(){if(disposed)return;disposed=true;titleIcons.clear();titleIconPixels.clear();titleDescriptions.clear();renderer.dispose();fonts.forEach(f=>f.dispose());}};
 }catch(error){controller.abort();fonts.forEach(font=>font.dispose());throw error;}
 finally{signal?.removeEventListener('abort',abort);}
}

/** HOME assembly chooses groups and discrete firmware clip frames explicitly. */
export function createFirmwareHome(assets:FirmwarePresentationAssets){
 const renderer=assets.renderer;
 let ordinaryTitleMaterialValidated=false;
 const message=(table:string,key:string,fallback:string)=>nativeMessageOverride(renderer.packs.messages,table,key,fallback);
 const binding=(name:string,frame:number,groups?:string[]):AnimationBinding=>({name,frame,...(groups?{groups}:{})});
 const pressTrack=renderer.packs.launcher.animations.LncCsr_00_Select.tracks.find(track=>track.target==='N_Scene_00'&&track.property==='translation.y');
 const pressOffset=pressTrack?-sampleNativeTrack(pressTrack,5):0;
 const bannerLabels=new Map<string,NativePixels>();
 const folderGlyphs=new Map<string,NativePixels>(),glyphTexture='runtime:folder-first-character';
 function folderGlyph(name:string):NativePixels|undefined{
  // Native 0x2027d0 reads one UTF-16 code unit, including a lone surrogate.
  const character=name.slice(0,1);if(!character)return;
  const cached=folderGlyphs.get(character);if(cached){folderGlyphs.delete(character);folderGlyphs.set(character,cached);return cached;}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  try{
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   if(!renderer.draw(ctx,'launcher','LncIconFolderText_00',{overrides:{T_Icon_00:{text:character},P_Icon_00:{visible:false}}}))return;
   const pixels=nativeFolderGlyphPixels({width:32,height:32,data:ctx.getImageData(0,0,32,32).data});
   if(folderGlyphs.size>=64)folderGlyphs.delete(folderGlyphs.keys().next().value!);folderGlyphs.set(character,pixels);return pixels;
  }finally{canvas.width=canvas.height=0;}
 }
 function folderBannerLabel(name:string):NativePixels|undefined{
  const text=name||message('menu_msbt_LZ','lau_2b_folder_noname','(No name)').text!;
  const layout=renderer.packs.banner?.layouts.BnrDsTitle_00;if(!layout)return;
  return bannerLabel(`folder:${name}`,nativeBannerLabelOverride(layout,assets.sharedFont.manifest,text));
 }
 function appletBannerLabel(key:'memo'|'fri'|'news'|'web'|'mvs'):NativePixels|undefined{
  // Native 0x1e1070 selects the upper message; 0x1f8b0c applies its style.
  const label=`lau_title_${key}_u`,bank=renderer.packs.messages.messages.menu_msbt_LZ;
  if(bank?.labels[label]===undefined)throw new Error(`Native applet title unavailable: ${label}`);
  return bannerLabel(`applet:${key}`,{T_Title_00:message('menu_msbt_LZ',label,'')});
 }
 function bannerLabel(key:string,overrides:PaneOverrides):NativePixels|undefined{
  const cached=bannerLabels.get(key);if(cached){bannerLabels.delete(key);bannerLabels.set(key,cached);return cached;}
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
  try{
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   if(!renderer.draw(ctx,'banner','BnrDsTitle_00',{overrides}))return;
   const pixels={width:256,height:64,data:ctx.getImageData(0,0,256,64).data};if(bannerLabels.size>=2)bannerLabels.delete(bannerLabels.keys().next().value!);bannerLabels.set(key,pixels);return pixels;
  }finally{canvas.width=canvas.height=0;}
 }
 function upperBase(ctx:Context){
  // screens.paint supplies the opaque native LCD with no inherited clip. The
  // renderer additionally checks exact placement and this integer clip.
  return renderer.draw(ctx,'launcher','LncBase_U_00',{allowOpaqueDarken:true,bindings:[binding('LncBase_U_00_SceneIn',40),binding('LncBase_U_00_Appear',10),binding('LncBase_U_00_WhiteBlack',0)],overrides:{N_Wndw_00:{visible:false}},clip:[0,212,400,28]});
 }
 function settingsUpper(ctx:Context){
  if(renderer.packs.messages.messages.menu_msbt_LZ?.labels.ptt_title_u===undefined)throw new Error('Native HOME Settings title unavailable');
  // Settled source pose observed in the native Design capture. Opening/closing
  // epochs remain unverified; do not derive them from the presentation clock.
  if(!renderer.draw(ctx,'petit','PtDlgBg_U_00',{bindings:[binding('PtDlgBg_U_00_FadeIn',20)],overrides:{T_Text_00:message('menu_msbt_LZ','ptt_title_u','')}}))throw new Error('Native HOME Settings upper layout unavailable');
 }
 function settingsLower(ctx:Context,state:MenuState&{panelScroll?:number}){
  const pack=renderer.packs.petit,bank=renderer.packs.messages.messages.menu_msbt_LZ;
  const requiredMessage=(label:string)=>{
   if(bank?.labels[label]===undefined)throw new Error(`Native HOME Settings message unavailable: ${label}`);
   return message('menu_msbt_LZ',label,'');
  };
  const labels=Object.fromEntries(['ptt_menu_design','ptt_theme','ptt_menu_mhm','ptt_mhm','ptt_light_bright','ptt_light_eco','ptt_light_on','ptt_light_off'].map(label=>[label,requiredMessage(label)]));
  for(const name of homeSettingsLayouts)if(!pack?.layouts[name])throw new Error(`Native HOME Settings layout unavailable: ${name}`);
  const scroll=Number.isFinite(state.panelScroll)?Math.max(0,Math.min(140,state.panelScroll!)):0;
  const level=Math.max(1,Math.min(5,Math.round(state.brightness*5))),choice=state.panelChoice;
  let okay=true;
  const draw=(layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{
   for(const clip of options.bindings??[])if(!pack.animations[clip.name])throw new Error(`Native HOME Settings animation unavailable: ${clip.name}`);
   okay=renderer.draw(ctx,'petit',layout,options)&&okay;
  };
  const cursor=(layout:string,anchor:string)=>()=>{
   const pane=nativePaneParentPath(pack.layouts[layout],anchor)?.at(-1);
   if(!pane)throw new Error(`Native HOME Settings cursor anchor unavailable: ${layout}/${anchor}`);
   // Copy source cursor-anchor dimensions without inheriting its scale twice.
   draw('PtCsr_00',{center:[160+pane.translation[0],120-pane.translation[1]],bindings:[binding('PtCsr_00_Loop',0)],overrides:{W_CsrF_00:{size:pane.size},W_CsrLgt_00:{size:pane.size}}});
  };
  const button=(layout:string,overrides:PaneOverrides,selected:boolean,anchor='N_CPos_Btn_00',bindings:AnimationBinding[]=[])=>draw(layout,{overrides,bindings,textSampling:'lcd',attachments:selected?{RootPane:cursor(layout,anchor)}:undefined});
  // home.petit / PtDlgCnt_CTR: Theme on; Prize, Cbnt and Info off. Binding
  // native groups preserves the nested 0,72,0,56,64 wrapper translations.
  const contents=()=>draw('PtDlgCnt_CTR',{
   bindings:[binding('PtDlgCnt_CTR_Theme',1),binding('PtDlgCnt_CTR_Prize',0),binding('PtDlgCnt_CTR_Cbnt',0),binding('PtDlgCnt_CTR_Info',0)],
   overrides:{N_Wrp_00:{translation:[0,120+scroll,0]}},attachments:{
    N_BtnTheme_00:()=>button('PtBtnL_Thm_00',{T_Base_00:labels.ptt_menu_design,T_Btn_00:labels.ptt_theme,T_Btn_01:labels.ptt_theme},choice===0,'N_CPos_Btn_00',[binding('PtBtnL_Thm_00_Select',0)]),
    N_BtnMyMenu_00:()=>button('PtBtnM_Mym_00',{T_Base_00:labels.ptt_menu_mhm,T_Btn_00:labels.ptt_mhm,T_Btn_01:labels.ptt_mhm},choice===1),
    N_BtnLgt_00:()=>button('PtBtnT_Lgt_00',{T_Base_00:labels.ptt_light_bright},choice===2,`N_CPos_Lv${level}_00`,[binding('PtBtnT_Lgt_01_UnDecide',1,Array.from({length:5},(_,i)=>`G_Lv${i+1}_00`)),binding('PtBtnT_Lgt_01_Decide',1,[`G_Lv${level}_00`])]),
    N_BtnAbl_00:()=>button('PtBtnT_Abl_00',{T_Base_00:labels.ptt_light_eco,T_Off_00:labels.ptt_light_off,T_Off_01:labels.ptt_light_off,T_On_00:labels.ptt_light_on,T_On_01:labels.ptt_light_on},choice===3,`N_CPos_${state.powerSaving?'On':'Off'}_00`,[binding('PtBtnT_Lgt_01_UnDecide',1,['G_Off_00','G_On_00']),binding('PtBtnT_Lgt_01_Decide',1,[state.powerSaving?'G_On_00':'G_Off_00'])]),
    N_Line_00:()=>draw('PtLine_00'),N_Line_01:()=>draw('PtLine_00'),
   },
  });
  // The capture's 88px thumb starts at y18. The runtime range/length writer is
  // not recovered: retain the source artwork and label this geometry as a fit.
  const thumbY=58-scroll/140*116;
  // Source mask fitted to the captured dimmed HOME backing. Its use by the
  // original Petit host is not yet traced; retain this assembly as an adaptation.
  if(!renderer.packs.dialogmask?.layouts.DlgMask_D_00||!renderer.packs.dialogmask.animations.DlgMask_D_00_FadeIn)throw new Error('Native HOME Settings backing mask unavailable');
  okay=renderer.draw(ctx,'dialogmask','DlgMask_D_00',{bindings:[binding('DlgMask_D_00_FadeIn',20)]})&&okay;
  draw('PtDlgBg_D_00',{clip:[0,0,320,240],bindings:[binding('PtDlgBg_D_00_FadeIn',20)],attachments:{
   N_Wrp_00:contents,
   N_SlideBar_00:()=>draw('PtSlideBar',{bindings:[binding('PtSlideBar_Select',0)],overrides:{N_Slide_00:{translation:[0,thumbY,0]},SBBtnShdw:{size:[22,88]},SBBtn:{size:[22,88]},SBBtnFrame:{size:[22,88]},B_Slide_00:{translation:[0,thumbY,0],size:[24,88]}}}),
   N_PetitBtn_00:()=>draw('PtClose_00',{bindings:[binding('PtClose_00_Select',0)]}),
  }});
  if(!okay)throw new Error('Native HOME Settings lower layout unavailable');
  return true;
 }
 function folderBalloon(ctx:Context,state:MenuState,view:HomePresentation){
  const retained=state.system?.homeControls?.balloon;
  const label=retained ? retained.visible ? retained : null : getNativeFolderBalloon(state,view);
  if(!label)return false;
  const titleText=retained?.titleId==='0004001000022000'?assets.settingsBalloonText:retained?.titleId==='0004001000022300'?assets.healthBalloonText:retained?.titleId==='0004001000022500'?assets.soundBalloonText:retained?.titleId==='0004001000022400'?assets.cameraBalloonText:null;
  if(retained?.titleId&&!titleText)return false;
  const clip=retained?.clip??'Appear',frame=retained?.frame??5;
  return renderer.draw(ctx,'launcher','LncBlln_00',{bindings:[binding(`LncBlln_00_${clip}`,frame)],overrides:{
   N_Base_00:{translation:[label.baseX,0,0]},N_LR_00:{translation:[label.bodyOffsetX,-6,0]},T_Blln_00:titleText?{text:titleText}:label.label?{text:label.label}:message('menu_msbt_LZ','lau_2b_folder_noname','(No name)')
  }});
 }
 function hud(ctx:Context,date:Date,time:number,sample?:DiagnosticHomeHudSample){
  if(sample)validateHomeHudSample(sample,renderer.packs.hud);
  const table='hud_msbt_LZ',day=message(table,`day_${date.getDate()}`,String(date.getDate()).padStart(2,'0')).text!,month=message(table,`month_${date.getMonth()+1}`,String(date.getMonth()+1).padStart(2,'0')).text!;
  const weekday=message(table,`week_${['sun','mon','tue','wed','thu','fri','sat'][date.getDay()]}`,'').text!;
  const dateText=message(table,'lau_date','%d/%M (%w)');dateText.text=dateText.text!.replace('%d',day).replace('%M',month).replace('%w',weekday);
  return renderer.draw(ctx,'hud','HudMenu_00',{bindings:[binding('HudMenu_00_SceneIn',41),binding('HudMenu_00_WhiteBlack',0),binding('HudMenu_00_NetMode',sample?.netModeFrame??4),binding('HudMenu_00_NetAtn',sample?.netAtnFrame??8),binding('HudMenu_00_Bat',sample?.batteryFrame??3),binding('HudMenu_00_WalkCoin',sample?.walkCoinFrame??time*.06)],overrides:{
   T_NetMode_00:message(table,sample?.networkMessage??'lau_connect4','Disabled'),T_Date_00:dateText,T_TimeL_00:{text:String(date.getHours()).padStart(2,'0')},T_TimeR_00:{text:String(date.getMinutes()).padStart(2,'0')},T_Walk_00:{text:String(sample?.steps??0)},T_Coin_00:{text:String(sample?.coins??0)}
  }});
 }
 function toolbar(ctx:Context,state?:MenuState,fullHeight=false){
  const gesture=state&&getHomeGestureView(state),bindings=[binding('LncBase_D_01_PaletteOut',12),binding('LncBase_D_01_MvsToggle',0)];
  const controls=state&&getHomeDensityControls(state),disabled:string[]=[];
  if(controls&&!controls.decreaseEnabled)disabled.push('G_Dw_00');
  if(controls&&!controls.increaseEnabled)disabled.push('G_Up_00');
  if(disabled.length)bindings.push(binding('LncBase_D_01_Invalid',0,disabled));
  if(!state?.panel&&gesture?.mode==='press'&&gesture.y>=0&&gesture.y<33&&gesture.x>=0&&gesture.x<320){
   const index=toolbarRegions.findIndex(region=>gesture.x>=region.x&&gesture.x<region.x+region.width);
   const group=index>=0?['G_Light_00','G_Memo_00','G_Friend_00','G_News_00','G_Web_00','G_Mvs_00'][index]:gesture.x<294?'G_Dw_00':'G_Up_00';
   if(!disabled.includes(group))bindings.push(binding('LncBase_D_01_Select',1,[group]));
  }
  return renderer.draw(ctx,'launcher','LncBase_D_01',{bindings,clip:[0,0,320,state?.opened||fullHeight?240:212]});
 }
 function homePlate(ctx:Context,state:MenuState){
  if(state.opened)return false;
  const panel=getNativeHomePanel(state);
  return renderer.draw(ctx,'launcher','LncPlt_00',{bindings:[binding('LncPlt_00_PaletteOut',11)],overrides:{W_Plt_00:{translation:[panel.x,-92,0],size:[panel.width,175]},W_Shdw_00:{translation:[panel.x,-102,0],size:[panel.shadowWidth,193]}}});
 }
 function folderBackdrop(ctx:Context,capture:NativePixels,state:MenuState,reduced=false){
  const close=sampleSystemHomeFolderClose(state),frame=!reduced&&close?.controller.phase==='closing'?close.controller.capture.appliedFrame??8:8;
  // The host supplies canonical rows34..239 of the fresh pre-folder render.
  // This replaces the native rotated framebuffer plus its UV0 crop; UV1 and TEV stay original.
  const texture='runtime:folder-background';
  return renderer.draw(ctx,'launcher','LncFolderCapture_00',{bindings:[binding('LncFolderCapture_00_Fade',frame),binding('LncFolderCapture_00_PicUp',0)],textures:{[texture]:capture},overrides:{P_Capture_00:{textureBindings:{0:texture}}}});
 }
 function folderChrome(ctx:Context,state:MenuState,reduced=false){
  const panel=getNativeFolderPanel(state);if(!panel)return false;
  const close=sampleSystemHomeFolderClose(state),frame=!reduced&&close?.controller.phase==='closing'?close.controller.folder.appliedFrame??16:16;
  const gesture=state.system?.homeNavigation.gesture;
  const pressed=gesture?.mode==='press'&&isHomeFolderBackTouch(state,gesture.startX,gesture.startY)&&isHomeFolderBackTouch(state,gesture.x,gesture.y);
  return renderer.draw(ctx,'launcher','LncFolder_00',{bindings:[binding('LncFolder_00_FadeIn',frame),binding('LncFolder_00_Select',pressed?1:0,['G_Btn_00'])],overrides:{W_Plt_00:{translation:[panel.x,-16,0],size:[panel.width,144]},W_Shdw_00:{translation:[panel.x,-20,0],size:[panel.shadowWidth,164]}}});
 }
 function folderChild(ctx:Context,state:MenuState,empty:boolean,draw:(alpha:number)=>void,reduced=false){
  const close=sampleSystemHomeFolderClose(state);
  if(reduced||!state.opened||close?.controller.phase!=='closing'){draw(1);return;}
  const frame=close.controller.folder.appliedFrame??16;
  if(!renderer.withPaneParent(ctx,'launcher','LncFolder_00',empty?'N_BlankAnime_00':'N_Dlg_00',[binding('LncFolder_00_FadeIn',frame)],draw))draw(1);
 }
 function footer(ctx:Context,state:MenuState,reduced=false){
  const actions=getHomeFooter(state);if(!actions)return true;
  const {two,left:leftAction,right:rightAction}=actions;
  const leftTone=leftAction==='close-software'?'B':'W';
  const active=new Set(two?['N_BtnW_R_02',`N_Btn${leftTone}_L_03`]:['N_BtnW_C_01']);
  const overrides:PaneOverrides={};
  const walk=(panes:NativePack['layouts'][string]['roots'])=>panes.forEach(p=>{if(/^N_Btn[WB]_[LRC]+_\d+$/.test(p.name))overrides[p.name]={visible:active.has(p.name)};if(p.text)overrides[p.name]={text:''};walk(p.children);});walk(renderer.packs.launcher.layouts.LncBtmBtn_02.roots);
  const label=(action:typeof leftAction|typeof rightAction)=>action===null?{text:''}:message('menu_msbt_LZ',{'close-folder':'lau_2b_close','close-software':'lau_3b_quit','folder-settings':'lau_2b_folder_setting',manual:'lau_2b_manual',open:'lau_2b_folder_open','create-folder':'lau_1b_make_folder',resume:'lau_2b_restart'}[action],{'close-folder':'Close','close-software':'Close','folder-settings':'Settings',manual:'Manual',open:'Open','create-folder':'Create Folder',resume:'Resume'}[action]);
  const right=label(rightAction),left=label(leftAction);
  for(const prefix of ['T_BtnBW','T_BtnFW','T_BtnPW']){overrides[`${prefix}_C_01`]=right;overrides[`${prefix}_R_02`]=right;overrides[`${prefix}_L_03`]=left;}
  for(const prefix of ['T_BtnBB','T_BtnFB','T_BtnPB'])overrides[`${prefix}_L_03`]=left;
  const close=sampleSystemHomeFolderClose(state);
  // Captured switch dialogs have no footer; use the source's settled out pose.
  const bindings=[homeSoftwareSwitchTitles(state)?binding('LncBtmBtn_02_SceneOut',14):!reduced&&close&&close.controller.phase!=='complete'
   ?binding('LncBtmBtn_02_SceneOut',Math.min(14,state.system!.homeClock.updateCount-close.startedAtUpdate))
   :binding('LncBtmBtn_02_SceneIn',15)];
  const pressed=ownedHomeFooterContact(state,HOME_FOOTER_TOUCH_GEOMETRY,state.system?.homeNavigation.gesture);
  if(pressed){
   const group=two?(pressed.side==='left'?`G_Btn${leftTone}_L_03`:'G_BtnW_R_02'):'G_BtnW_C_01';bindings.push(binding('LncBtmBtn_02_Select',1,[group]));
  }
  return renderer.draw(ctx,'launcher','LncBtmBtn_02',{bindings,overrides,clip:[0,210,320,30],textSampling:'lcd'});
 }
 /** Sample the last actual tile writer, not two possibly disabled controllers.
  * Dist has no density Scale clip: density sizes its child/artwork elsewhere,
  * below this translated pane. Only ancestors can scale its displacement.
  */
 function tilePressOffset(pose:HomeTilePose|null|undefined,density:number):number {
  if(!pose)return 0;
  if(!Number.isFinite(density)||!Number.isFinite(pose.frame)||!['select','decide'].includes(pose.clip))throw new RangeError('Invalid native tile pose');
  const pack=renderer.packs.launcher,name='LncIconDist_01',layout=pack.layouts[name];
  const animation=pack.animations[`${name}_${pose.clip==='select'?'Select':'Decide'}`];
  const path=layout&&nativePaneParentPath(layout,'P_IconBtnDmy_00');
  const track=layout&&animation&&boundAnimationTracks(layout,animation).find(track=>track.target==='P_IconBtnDmy_00'&&track.property==='translation.y');
  if(!path||!track)throw new Error('Missing native tile press transform');
  const frame=Math.max(0,Math.min(animation.frames,pose.frame));
  let x=0,y=-(sampleNativeTrack(track,frame)-path[path.length-1].translation[1]);
  // Same Y sign and ancestor rotate/scale convention as NativeLayoutRenderer.
  // Target/child scales do not scale the target's own parent-space translation.
  for(let i=path.length-2;i>=0;i--){
   const pane=path[i],angle=-pane.rotation[2]*Math.PI/180;
   const sx=x*pane.scale[0]*Math.cos(pane.rotation[1]*Math.PI/180),sy=y*pane.scale[1]*Math.cos(pane.rotation[0]*Math.PI/180);
   x=Math.cos(angle)*sx-Math.sin(angle)*sy;y=Math.sin(angle)*sx+Math.cos(angle)*sy;
  }
  return y===0?0:y;
 }
 function tile(ctx:Context,x:number,y:number,size:number,density:number,folder:boolean,receiving=false,folderName=''){
  const name=folder?(receiving?'LncIconFolderInT_00':'LncIconFolder_00'):'LncIconSetSrc_00';
  // SetSrc stores the ordinary plate at +32 and the empty-slot source at -32.
  const frame=nativeHomeDensityFrame(density),drawn=renderer.draw(ctx,'launcher',name,{center:[x+size/2-(folder?0:32),y+size/2],bindings:[binding(name+'_Scale',frame)],overrides:folder?{}:{N_Color_01:{visible:false},N_Pic_01:{visible:false}}});
  const glyph=folder&&folderGlyph(folderName);
  if(glyph){
   // 0x1d7f3c → 0x256df4 → 0x257254: plain folder glyph size/Y tables.
   const width=nativeHomeDensityMetric([32,32,24,20,18,16],frame),offset=nativeHomeDensityMetric([-6,-6,-3,-3,-2,-1],frame);
   renderer.draw(ctx,'launcher','LncIconDist_01',{center:[x+size/2,y+size/2],textures:{[glyphTexture]:glyph},overrides:{
    // The folder plate above supplies the separately rendered button surface.
    P_IconBtnDmy_00:{size:[0,0]},P_Icon_00:{size:[width,width],translation:[0,offset,0],textureBindings:{0:glyphTexture}}
   }});
  }
  return drawn;
 }
 function ordinaryTitleIcon(ctx:Context,titleId:string,x:number,y:number,size:number){
  if(!ordinaryTitleMaterialValidated){
   const layout=renderer.packs.launcher?.layouts.LncIconDist_01,path=layout&&nativePaneParentPath(layout,'P_Icon_00'),pane=path?.at(-1),material=pane?.picture&&layout!.materials[pane.picture.material];
   const contract=layout?.textures.length===2&&layout.textures[0]==='IconDmy.bclim'&&layout.textures[1]==='IconMask.bclim'
    &&JSON.stringify(path?.map(item=>item.name))==='["RootPane","P_IconBtnDmy_00","P_Icon_00"]'
    &&JSON.stringify(pane?.size)==='[48,48]'&&JSON.stringify(pane?.picture?.uvSets)==='[[0,0,1,0,0,1,1,1],[0.25,0.25,1.75,0.25,0.25,1.75,1.75,1.75],[0,0,1,0,0,1,1,1]]'
    &&material?.name==='P_Icon_00'&&JSON.stringify(material.textureMaps)==='[{"magFilter":1,"minFilter":1,"texture":0,"wrapS":0,"wrapT":0},{"magFilter":1,"minFilter":1,"texture":1,"wrapS":2,"wrapT":2},{"magFilter":1,"minFilter":1,"texture":0,"wrapS":0,"wrapT":0}]'
    &&JSON.stringify(material.coordinateGenerators)==='[{"reserved":0,"source":0,"type":0},{"reserved":0,"source":1,"type":0},{"reserved":0,"source":2,"type":0}]';
   if(!contract)throw new Error('Unsupported ordinary title icon material identity');
   ordinaryTitleMaterialValidated=true;
  }
  const pixels=assets.titleIconPixels?.get(titleId.toLowerCase());
  if(!pixels)throw new Error(`Native ordinary title icon unavailable: ${titleId}`);
  if(pixels.width!==48||pixels.height!==48)throw new Error('Unsupported ordinary title icon dimensions');
  const width=Math.round(size*2/3),left=Math.round(x+(size-width)/2),top=Math.round(y+(size-width)/2),texture='runtime:ordinary-title-icon';
  const drawn=renderer.draw(ctx,'launcher','LncIconDist_01',{center:[left+width/2,top+width/2],textures:{[texture]:pixels},overrides:{
   // Only the dynamic SMDH sampler is rebound. IconMask and the third authored
   // IconDmy sample retain the decoded layout's UVs, descriptors and matrices.
   P_IconBtnDmy_00:{size:[0,0]},P_Icon_00:{size:[width,width],textureBindings:{0:texture}}
  }});
  if(!drawn)throw new Error(`Native ordinary title icon draw unavailable: ${titleId}`);
  return true;
 }
 function suspendedIcon(ctx:Context,x:number,y:number,size:number,density:number,sleepFrame:number){
  drawHomeSuspendedIcon(renderer,ctx,[x+size/2,y+size/2],nativeHomeDensityFrame(density),sleepFrame);
 }
 /** Fresh opening capture replaces only the selected ordinary folder instance.
  * Native priority414 T precedes priority412 B; preserve authored pane geometry.
  */
 function captureFolder(ctx:Context,x:number,y:number,size:number,density:number,name:string){
  const center:[number,number]=[x+size/2,y+size/2],frame=nativeHomeDensityFrame(density);
  const top='LncIconFolderInT_00',bottom='LncIconFolderInB_00',glyph=folderGlyph(name);
  const drawn=renderer.draw(ctx,'launcher',top,{center,bindings:[binding(top+'_Scale',frame),{...binding(top+'_PicToggle',0),childBinding:false}]});
  renderer.draw(ctx,'launcher',bottom,{center,bindings:[binding(bottom+'_Scale',frame)],textures:glyph?{[glyphTexture]:glyph}:undefined,overrides:{
   P_Icon_00:glyph?{visible:true,textureBindings:{0:glyphTexture,1:'IconMask.bclim'}}:{visible:false},P_IconPrize_00:{visible:false}
  }});
  return drawn;
 }
 function empty(ctx:Context,x:number,y:number,size:number,density:number){
  // Native category5 sets final P_IconBtnDmy_00 alpha128 after SetSrc.
  // The supported vacancy subtree contributes one source-over picture.
  ctx.save();
  try{
   ctx.globalAlpha*=128/255;
   const name='LncIconSetSrc_00';return renderer.draw(ctx,'launcher',name,{center:[x+size/2+32,y+size/2],bindings:[binding(name+'_Scale',nativeHomeDensityFrame(density))],overrides:{N_IconRoot_00:{visible:false},P_BtnShdw_00:{visible:false},N_Pic_01:{visible:false}}});
  }finally{ctx.restore();}
 }
 /** Caller supplies applied controller frames; toolbar Scale10–12 is not density. */
 function cursorAt(ctx:Context,centerX:number,centerY:number,scaleFrame:number,loopFrame:number,pressed=false){
  return renderer.draw(ctx,'launcher','LncCsr_00',{center:[centerX,centerY],pictureSampling:'lcd',bindings:[binding('LncCsr_00_Select',pressed?5:0),binding('LncCsr_00_Scale',scaleFrame),binding('LncCsr_00_Loop',loopFrame)]});
 }
 function cursorEffectAt(ctx:Context,centerX:number,centerY:number,scaleFrame:number,disappearFrame:number){
  return renderer.draw(ctx,'launcher','LncCsrEfct_00',{center:[centerX,centerY],bindings:[binding('LncCsrEfct_00_Scale',scaleFrame),binding('LncCsrEfct_00_DisAppear',disappearFrame)]});
 }
 function cursor(ctx:Context,x:number,y:number,size:number,density:number,loopFrame:number,pressed=false){
  return cursorAt(ctx,x+size/2,y+size/2,nativeHomeDensityFrame(density),loopFrame,pressed);
 }
 function arrows(ctx:Context,showLeft:boolean){return renderer.draw(ctx,'launcher','LncArw_00',{bindings:[binding('LncArw_00_Appear',15)],overrides:{N_arwL_00:{visible:showLeft}},clip:[0,33,320,179]});}
 const pickupSizes=new Map<string,{x:number;y:number;width:number;height:number;alpha:number}>();
 function paintPickupAt(ctx:Context,x:number,y:number,frame:number,folder:boolean,folderName=''){
  const name=folder?'LncIconFolderPickUp_00':'LncIconPickUp_00';
  const glyph=folder&&folderGlyph(folderName);
  const drawn=renderer.draw(ctx,'launcher',name,{center:[x,y],bindings:[binding(name+'_Scale',frame)],textures:glyph?{[glyphTexture]:glyph}:undefined,overrides:{
   P_Icon_00:glyph?{visible:true,textureBindings:{0:glyphTexture,1:'IconMask.bclim'}}:{visible:false},P_IconPrize_00:{visible:false}
  }});
  // Native P_Icon is a direct child of RootPane; retain its sampled bounds for portfolio artwork.
  const key=`${name}:${frame}`;let rect=pickupSizes.get(key);
  if(!rect){const pack=renderer.packs.launcher,posed=poseNativeLayout(pack.layouts[name],pack.animations,[binding(name+'_Scale',frame)]),pane=posed.roots[0].children.find(p=>p.name==='P_Icon_00')!;
   rect={x:pane.translation[0]-pane.size[0]/2,y:-pane.translation[1]-pane.size[1]/2,width:pane.size[0],height:pane.size[1],alpha:pane.alpha/255};if(pickupSizes.size>=16)pickupSizes.delete(pickupSizes.keys().next().value!);pickupSizes.set(key,rect);}
  return {drawn,icon:{x:x+rect.x,y:y+rect.y,width:rect.width,height:rect.height,alpha:rect.alpha}};
 }
 /** Ordinary entry consumes an applied Scale and LCD center. The caller omits
  * null submissions and owns visibility, anchor, source hiding and artwork.
  */
 function pickupAt(ctx:Context,centerX:number,centerY:number,appliedScaleFrame:number){
  return paintPickupAt(ctx,centerX,centerY,appliedScaleFrame,false);
 }
 function pickupBlankAt(ctx:Context,centerX:number,centerY:number,appliedScaleFrame:number){
  const name='LncIconPickUpBlank_00';return renderer.draw(ctx,'launcher',name,{center:[centerX,centerY],bindings:[binding(name+'_Scale',appliedScaleFrame)]});
 }
 function pickup(ctx:Context,x:number,y:number,size:number,density:number,folder:boolean,folderName=''){
  return paintPickupAt(ctx,x,y,nativeHomeDensityFrame(density),folder,folderName);
 }
 function liftedSource(ctx:Context,x:number,y:number,size:number,density:number){
  return pickupBlankAt(ctx,x+size/2,y+size/2,nativeHomeDensityFrame(density));
 }
 return {hud,upperBase,settingsUpper,settingsLower,folderBalloon,folderBannerLabel,appletBannerLabel,toolbar,homePlate,folderBackdrop,folderChrome,folderChild,footer,tilePressOffset,tile,ordinaryTitleIcon,suspendedIcon,captureFolder,empty,cursor,cursorAt,cursorEffectAt,arrows,pickup,pickupAt,pickupBlankAt,liftedSource,pressOffset,rows:rowCount};
}
