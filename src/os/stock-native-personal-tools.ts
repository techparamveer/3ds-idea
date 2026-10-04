import type { AppView } from './app-types';
import { REFERENCE_DEVICE_STATUS, deviceStatusBatteryFrame } from './device-status-profile';
import type { NativeDrawOptions, NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { NotesIntroPaint, StockScreenPaintOptions } from './stock-screen-presentation';
import type { SuspendedCapture } from './notes-suspended-capture';
import { nativeMessageOverride, type NativePixels, type PaneOverrides } from './native-layout';
import { notesCaptureView, NOTES_SWITCH_LAST_FRAME } from './stock-screen-layout';

const notesPrefix='packs/game-notes/';
export const personalNotesPacks:readonly NativeTitlePackRequest[]=[
  {url:notesPrefix+'memo-Bg_U_00-arc-l.json',alias:'notes-upper',layouts:['Bg_U_00'],animations:[]},
  {url:notesPrefix+'memo-Bg_D_00-arc-l.json',alias:'notes-lower',layouts:['Bg_D_00'],animations:[]},
  {url:notesPrefix+'memo-MemoListDown-arc-l.json',alias:'notes-list',layouts:['MemoListDown'],animations:['MemoListDown_Base','MemoListDown_SceneIn']},
  {url:notesPrefix+'memo-MemoTutorialUp-arc-l.json',alias:'notes-help',layouts:['MemoTutorialUp'],animations:['MemoTutorialUp_Base','MemoTutorialUp_SceneIn']},
  {url:notesPrefix+'memo-ApltBoot_U_00-arc-l.json',alias:'notes-aplt-u',layouts:['ApltBoot_U_00'],animations:['ApltBoot_U_00_SceneIn']},
  {url:notesPrefix+'memo-ApltBoot_D_00-arc-l.json',alias:'notes-aplt-d',layouts:['ApltBoot_D_00'],animations:['ApltBoot_D_00_SceneIn']},
  {url:notesPrefix+'messages-and-loose.json',alias:'notes-messages',layouts:[],animations:[]},
];
export const personalSelectedNotePacks:readonly NativeTitlePackRequest[]=[
  ...personalNotesPacks.filter(({alias})=>alias!=='notes-list'&&alias!=='notes-help'),
  {url:notesPrefix+'memo-MemoWriteDown-arc-l.json',alias:'notes-write',layouts:['MemoWriteDown'],animations:['MemoWriteDown_Base','MemoWriteDown_SceneIn','MemoWriteDown_Invalid']},
  {url:notesPrefix+'memo-ImageScreenUp-arc-l.json',alias:'notes-image',layouts:['ImageScreenUp'],animations:[
    'ImageScreenUp_PanelNoGameIn','ImageScreenUp_SwitchDouble','ImageScreenUp_SwitchUp','ImageScreenUp_SwitchDown',
    'ImageScreenUp_TextPanelInOut','ImageScreenUp_TextPanelStay',
    'ImageScreenUp_HudDoubleInOut','ImageScreenUp_HudUpInOut','ImageScreenUp_HudDownInOut',
  ]},
];
// Dynamic replacements for the 8×8 source slots imgUp400x240L/imgDown320x240.
const captureUpperTexture='suspended-capture-upper',captureLowerTexture='suspended-capture-lower';
const personalAllNotePacks:readonly NativeTitlePackRequest[]=[...personalNotesPacks,...personalSelectedNotePacks.filter(({alias})=>!personalNotesPacks.some(pack=>pack.alias===alias))];
export const personalNotificationPacks:readonly NativeTitlePackRequest[]=[
  {url:'packs/notifications/news.json',alias:'notifications',layouts:['NewsTopUI_U_00','NewsTopUI_D_00','NewsUnread_U_00','NewsTopBtn_D_00','NewsWndwNews_D_00'],animations:['NewsUnread_U_00_SceneIn','NewsUnread_U_00_NumAnim','NewsTopBtn_D_00_SceneIn','NewsWndwNews_D_00_SceneIn','NewsWndwNews_D_00_Select'],textures:['special.cic']},
  {url:'packs/notifications/hud.json',alias:'notification-hud',layouts:['HudMenu_00'],animations:['HudMenu_00_SceneIn','HudMenu_00_WhiteBlack','HudMenu_00_NetMode','HudMenu_00_NetAtn','HudMenu_00_Bat']},
  {url:'packs/notifications/contents/0000-00000012/receivelamp.json',alias:'notification-receivelamp',layouts:['RcvLamp_00'],animations:['RcvLamp_00_ReceiveBlue','RcvLamp_00_SceneIn']},
  {url:'packs/notifications/slidebar.json',alias:'notification-slidebar',layouts:['SlideBar'],animations:['SlideBar_Select']},
  {url:'packs/notifications/messages-and-loose.json',alias:'notification-messages',layouts:[],animations:[]},
];
const WEEKDAYS=['sun','mon','tue','wed','thu','fri','sat'] as const;
/** N_Scene_00 default alpha is 0. SceneIn last key is frame 40 (HOME idle is
 * also 40). WalkCoin is not started. The native still shows no steps/coins,
 * but P_Walk_00 is visible by layout default, so hiding Walk/Coin below is a
 * capture-fit adaptation whose native mechanism is untraced. */
const NOTIFICATION_HUD_SCENE_IN=40;
/** Idle HudMenu_00 update `0x181018`: `ldrb +0xd5` (calendar seconds at
 * `+0xcc+9`) `tst #1`. Odd writes Bat float 4.0, even writes 5.0 through
 * animator `+0x8c` vtable `+0x2c`. Same 4/5 map as HOME `0x27c6a8` /
 * Settings `0x238f10`. This title's clip puts `HudBatPlg` on frame 5
 * (even) and `HudBat_01`+`HudBatLgt_00` on frame 4 (odd). Do not invert
 * to Sound `0x17adfc`. `T_TimeC_00` is also gated here; this painter keeps
 * the hashed still's visible colon (even-path) rather than replaying the
 * odd-hide. */
export function notificationsHudBatteryFrame(date:Date):number{
  return deviceStatusBatteryFrame(REFERENCE_DEVICE_STATUS,date.getSeconds());
}
/** Pair-cache identity. Seconds enter through `batteryFrame` so charging
 * Bat republishes at 1 Hz. eShop `eshopHudClock` omits seconds and must
 * not be reused. */
export function notificationsHudClock(date:Date){
  return {
    year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate(),
    hour:date.getHours(),minute:date.getMinutes(),
    batteryFrame:notificationsHudBatteryFrame(date),
  };
}
const friendLayouts=['FrdTopBG_U_00','FrdTopBG_D_00','FrdTopUIUp_D_00','FrdTopUIDw_D_00','FrdElemCard_UB_00','FrdElemCard_UF_00','FrdElemCard_DB_00','FrdElemCard_DF_00'];
export const personalFriendPacks:readonly NativeTitlePackRequest[]=[
  {url:'packs/friends/friend.json',alias:'friends',layouts:friendLayouts,animations:[
    ...friendLayouts.slice(2).map(name=>name+'_SceneIn'),
    'FrdElemCard_UB_00_NotConnect','FrdElemCard_UF_00_NotConnect',
    'FrdElemCard_DB_00_Select','FrdElemCard_DF_00_Select',
    'FrdElemCard_DB_00_EdgeOn','FrdElemCard_DF_00_EdgeOn',
  ]},
  {url:'packs/friends/messages-and-loose.json',alias:'friend-messages',layouts:[],animations:[]},
];
function initialFriendView(view:AppView):boolean{
  return view.appId==='friends'&&view.screen==='main'&&view.rows.length===1&&view.rows[0].id==='profile';
}

const f32=Math.fround;
/** code.bin 0x139188 / 0x13918c, image base 0x100000. */
const SLIDEBAR_K95=f32(0.95),SLIDEBAR_K05=f32(0.05);
/** NewsTopUI_D_00/N_SlideBar_00 pan1 8×184 at [141,14,0]. */
const SLIDEBAR_HOST_H=184,SLIDEBAR_HOST_W=8,SLIDEBAR_HOST_TRANSLATION:[number,number,number]=[141,14,0];
/** Authored SlideBar.bclyt SBBaseWndw / SBBaseLine_00 / B_Slide_00 / SBBtn. */
const SLIDEBAR_WINDOW_H=132,SLIDEBAR_LINE_H=112,SLIDEBAR_BTN_W=22,SLIDEBAR_SLIDE_W=24;
/** 0x13a160 ctor stores SBBtn +0x4c as the minimum thumb height. */
const SLIDEBAR_MIN_THUMB=22;
/** List setup 0x17e098 writes 3 at descriptor+0x04 → controller+0x08. */
const SLIDEBAR_INDEX_BIAS=3;
/** 0x1770cc travel = B_Groove_00 +0x4c − B_Slide_00 +0x4c; 0x13aa9c s3=0.5. */
const SLIDEBAR_HALF=f32(0.5);

export type NotificationSlideBarPose={extra:number;thumbHeight:number;thumbY:number;grooveHeight:number;lineHeight:number};
/**
 * Notifications list SlideBar after controller 0x13a160.
 * `index` is the 0x179660 displacement/stride argument (list window start).
 * `countField` is controller+0x0c in extra = max(0, index + [0x0c] − [0x08]).
 * List ctor 0x17e0b8 stores 0 before rows exist. The populated nine-row
 * profile is the live list count, not the ten constructed / six marked /
 * five drawn row-object leftovers. Detail 0x17ace4 writes the same field
 * from text metrics on that sibling path.
 */
export function notificationSlideBarPose(index:number,countField=0):NotificationSlideBarPose{
  const extra=Math.max(0,Math.trunc(index)+Math.trunc(countField)-SLIDEBAR_INDEX_BIAS);
  const host=f32(SLIDEBAR_HOST_H);
  const computed=f32(f32(host*SLIDEBAR_K95)-f32(f32(host*SLIDEBAR_K05)*f32(extra)));
  const thumbHeight=computed<SLIDEBAR_MIN_THUMB?SLIDEBAR_MIN_THUMB:computed;
  const lineHeight=host;
  const grooveHeight=f32(host+SLIDEBAR_WINDOW_H-SLIDEBAR_LINE_H);
  const travel=f32(grooveHeight-thumbHeight);
  // 0x13a494 ratio uses controller+0x7c/+0x90, both 0 after list ctor 0x1390ac.
  const thumbY=f32(travel*SLIDEBAR_HALF);
  return {extra,thumbHeight,thumbY,grooveHeight,lineHeight};
}
/** Pane size/translation writes from 0x13a160, 0x1770cc and 0x13aa9c. */
export function notificationSlideBarOverrides(index:number,countField=0):PaneOverrides{
  const pose=notificationSlideBarPose(index,countField);
  const thumb=[SLIDEBAR_BTN_W,pose.thumbHeight],slide:[number,number]=[SLIDEBAR_SLIDE_W,pose.thumbHeight];
  const translation:[number,number,number]=[0,pose.thumbY,0];
  const groove:[number,number]=[SLIDEBAR_HOST_W+16-8,pose.grooveHeight];
  return {
    N_Slider_00:{translation:[...SLIDEBAR_HOST_TRANSLATION]},
    SBBaseLine_00:{size:[SLIDEBAR_HOST_W,pose.lineHeight]},
    SBBaseWndw:{size:groove},
    B_Groove_00:{size:groove},
    SBBtn:{size:thumb},
    SBBtnShdw:{size:thumb},
    SBBtnFrame:{size:thumb},
    B_Slide_00:{size:slide,translation},
    N_Slide_00:{translation},
  };
}
export function nativePersonalToolView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.appId==='notifications'&&view.screen==='main')return {view:view.rows.length?'notifications-list':'notifications-empty',titleId:'000400300000a002',packs:personalNotificationPacks};
  if(view.appId==='game-notes'&&view.screen==='drawing')return {view:'game-notes',titleId:'0004003000009c02',packs:personalAllNotePacks};
  if(view.appId==='game-notes'&&view.screen==='main')return {view:'game-notes',titleId:'0004003000009c02',packs:personalAllNotePacks};
  if(view.appId==='friends'&&view.screen==='profile')return {view:'friends',titleId:'0004003000009f02',packs:personalFriendPacks};
  if(initialFriendView(view))return {view:'friends',titleId:'0004003000009f02',packs:personalFriendPacks};
  return null;
}
/** Source notification components for the empty, offline portfolio state. */
export function drawNativePersonalToolFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId==='notifications'&&view.screen==='main'){
    const message=(label:string)=>nativeMessageOverride(renderer.packs['notification-messages'],'newslist_msbt_LZ',label,'');
    const hud=(label:string,fallback:string)=>nativeMessageOverride(renderer.packs['notification-messages'],'hud_msbt_LZ',label,fallback);
    const unread=view.rows.filter(row=>row.value==='New').length;
    const count=(label:string,value:number)=>{const source=message(label);return {...source,text:source.text?.replace('%d',String(value))};};
    const now=options.date??new Date(),status=REFERENCE_DEVICE_STATUS;
    const day=hud(`day_${now.getDate()}`,String(now.getDate()).padStart(2,'0')).text??'';
    const month=hud(`month_${now.getMonth()+1}`,String(now.getMonth()+1).padStart(2,'0')).text??'';
    const weekday=hud(`week_${WEEKDAYS[now.getDay()]}`,'').text??'';
    const dateText=hud('lau_date','%d/%M (%w)');
    dateText.text=(dateText.text??'').replace('%d',day).replace('%M',month).replace('%w',weekday);
    let okay=renderer.draw(top,'notifications','NewsTopUI_U_00');
    okay=renderer.draw(top,'notifications','NewsUnread_U_00',{bindings:[{name:'NewsUnread_U_00_SceneIn',frame:20},{name:'NewsUnread_U_00_NumAnim',frame:Math.min(112,unread)}],overrides:{
      T_Unread_00:message('new_news_u'),T_Unread_01:message('new_news_u'),T_NewsUnread_00:count('new_news_u0',unread),T_News_00:message('new_news_u1'),T_CntUnread_00:count('new_ce_u0',0),T_Cnt_00:message('new_ce_u1'),
    }})&&okay;
    okay=renderer.draw(top,'notification-hud','HudMenu_00',{
      bindings:[
        {name:'HudMenu_00_SceneIn',frame:NOTIFICATION_HUD_SCENE_IN},
        {name:'HudMenu_00_WhiteBlack',frame:status.whiteBlackFrame},
        {name:'HudMenu_00_NetMode',frame:status.netModeFrame},
        {name:'HudMenu_00_NetAtn',frame:status.netAtnFrame},
        {name:'HudMenu_00_Bat',frame:notificationsHudBatteryFrame(now)},
      ],
      overrides:{
        T_NetMode_00:hud(status.networkMessage,'Internet'),
        T_Date_00:dateText,
        T_TimeL_00:{text:String(now.getHours()).padStart(2,'0')},
        T_TimeC_00:{visible:true},
        T_TimeR_00:{text:String(now.getMinutes()).padStart(2,'0')},
        P_Walk_00:{visible:false},T_Walk_00:{visible:false},P_Coin_00:{visible:false},T_Coin_00:{visible:false},
      },
    })&&okay;
    okay=renderer.draw(bottom,'notifications','NewsTopUI_D_00')&&okay;
    if(view.rows.length){
      // NewsTopUI_D_00/N_ElemPos_00 is the source first-row parent at
      // (-160,100). Each native item advances by its 53px source cell height.
      // Five draws preserve the partially clipped fifth row visible above Close.
      const start=Math.max(0,Math.min(view.rows.length-1,view.selection)-Math.min(3,Math.max(0,view.selection)));
      for(let slot=0;slot<5;slot++){
        const index=start+slot,row=view.rows[index];if(!row)break;
        okay=renderer.draw(bottom,'notifications','NewsWndwNews_D_00',{bindings:[
          {name:'NewsWndwNews_D_00_SceneIn',frame:10},
          {name:'NewsWndwNews_D_00_Select',frame:view.data?.selectionActive===true&&index===view.selection?1:0},
        ],overrides:{
          N_News_00:{translation:[-150,85-slot*53,-10]},
          P_Icon_00:{textureBindings:{0:'special.cic'}},
          T_NewsTitleB_00:{text:row.label},T_NewsTitleF_00:{text:row.label},
          N_IconNew_00:{visible:row.value==='New'},
        },attachments:{N_IconNew_00:()=>{
          okay=renderer.draw(bottom,'notification-receivelamp','RcvLamp_00',{
            bindings:[{name:'RcvLamp_00_ReceiveBlue',frame:60},{name:'RcvLamp_00_SceneIn',frame:20}],
          })&&okay;
        }}})&&okay;
      }
      okay=renderer.draw(bottom,'notification-slidebar','SlideBar',{bindings:[{name:'SlideBar_Select',frame:0}],overrides:notificationSlideBarOverrides(start,view.rows.length)})&&okay;
    }
    // T_EndF_00 is alignment 4 / explicit left line alignment: news code.bin
    // 0x16b080 sets writer flags 0x110 and 0x18fe2c keeps the ceil-half block
    // origin, the same one-line X as T_EndB_00's 0x111.
    okay=renderer.draw(bottom,'notifications','NewsTopBtn_D_00',{bindings:[{name:'NewsTopBtn_D_00_SceneIn',frame:20}],overrides:{T_EndB_00:message('new_back'),T_EndF_00:{...message('new_back'),singleLineBlockOrigin:'writer-0x110'}}})&&okay;
    if(!view.rows.length)options.font?.draw(bottom,view.text?.[0]??'',160,110,14,'#666','center');
    return okay;
  }
  if(initialFriendView(view)||(view.appId==='friends'&&view.screen==='profile'))return drawFriendFrame(renderer,top,bottom,view,options);
  if(view.appId==='game-notes'&&view.screen==='drawing')return drawSelectedNote(renderer,top,bottom,view,options.suspendedCapture,options.reducedMotion);
  if(view.appId!=='game-notes'||view.screen!=='main')return false;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['notes-messages'],'message',label,'');
  const selection=Math.max(0,Math.min(15,Math.floor(view.selection))),column=selection%4,row=Math.floor(selection/4);
  const overrides:PaneOverrides={
    T_BtnB_00:message('0100Exitbtn'),T_BtnF_00:message('0100Exitbtn'),
    N_CsrMemo:{translation:[-118+column*79,90-row*51,0]},
  };
  let okay=renderer.draw(top,'notes-upper','Bg_U_00');
  okay=drawNotesMainUpper(renderer,top,message,options)&&okay;
  okay=renderer.draw(bottom,'notes-lower','Bg_D_00')&&okay;
  okay=renderer.draw(bottom,'notes-list','MemoListDown',{bindings:[{name:'MemoListDown_Base',frame:0},{name:'MemoListDown_SceneIn',frame:20}],overrides})&&okay;
  // Native priority-0 scene 9 draws after the list, independently of scene 10.
  // Use the owner clock's already-applied lower pose; painting never steps it.
  if(options.notesIntro?.status==='posed'&&options.notesIntro.scene9Draw)
    okay=renderer.drawLayout(bottom,'notes-aplt-d','ApltBoot_D_00',options.notesIntro.lower,{overrides:{T_Aplt_00:message('lau_title_memo')}})&&okay;
  else if(options.notesIntro?.status==='pending')
    okay=renderer.draw(bottom,'notes-aplt-d','ApltBoot_D_00',{bindings:[{name:'ApltBoot_D_00_SceneIn',frame:0}],overrides:{T_Aplt_00:message('lau_title_memo')}})&&okay;
  return okay;
}

/** Live list upper: composed title/HUD under ApltBoot while scene-10 draw is
 * set. The painter only samples a precomposed pose. Drawing still hides the
 * title. MemoTutorialUp remains the no-metadata fallback. */
function notesIntroTitleOptions(intro:Extract<NotesIntroPaint,{status:'posed'}>,capture:SuspendedCapture):NativeDrawOptions{
  const hidden={visible:false},textures:Record<string,NativePixels>={};
  if(intro.icon)textures['notes-icon']=intro.icon;
  if(capture.status==='ready'){textures[captureUpperTexture]=capture.upper;textures[captureLowerTexture]=capture.lower;}
  return {textures,overrides:{
    T_TextList:hidden,T_TextWrite:hidden,P_Mask:hidden,N_BtnMemoUp:hidden,P_ScreenUpR:hidden,
    ...(intro.description!==undefined?{T_TextTitle:{text:intro.description}}:{}),
    ...(intro.icon?{P_Icon_00:{textureBindings:{0:'notes-icon'}}}:{}),
    ...(capture.status==='ready'
      ?{P_ScreenUpL:{textureBindings:{0:captureUpperTexture}},P_ScreenDown:{textureBindings:{0:captureLowerTexture}}}
      :{P_ScreenUpL:hidden,P_ScreenDown:hidden,P_ScreenShdwUp:hidden,P_ScreenShdwDown:hidden,W_ScreenShdwUp:hidden,W_ScreenShdwDown:hidden}),
  }};
}
function drawNotesMainUpper(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,message:(label:string)=>PaneOverrides[string],options:StockScreenPaintOptions):boolean{
  const intro=options.notesIntro,capture=options.suspendedCapture??{status:'none'};
  if(intro?.status==='posed'){
    let okay=renderer.drawLayout(top,'notes-image','ImageScreenUp',intro.title,notesIntroTitleOptions(intro,capture));
    if(intro.scene10Draw)okay=renderer.drawLayout(top,'notes-aplt-u','ApltBoot_U_00',intro.upper)&&okay;
    return okay;
  }
  if(intro?.status==='pending')return renderer.draw(top,'notes-aplt-u','ApltBoot_U_00');
  return renderer.draw(top,'notes-help','MemoTutorialUp',{bindings:[{name:'MemoTutorialUp_Base',frame:1},{name:'MemoTutorialUp_SceneIn',frame:20}],overrides:{T_PartsTxt00b:message('1000Help_WelcomeP1')}});
}

/** Read-only own-card composition; dynamic Mii surfaces are deliberately absent. */
function drawFriendFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  const message=(label:string)=>nativeMessageOverride(renderer.packs['friend-messages'],'friend_msbt_LZ',label,'');
  const profile=view.screen==='profile';
  const status=typeof view.data?.message==='string'?view.data.message:'';
  const settings=view.data?.settings as {nickname?:unknown}|undefined;
  const nickname=typeof settings?.nickname==='string'?settings.nickname:'';
  const draw=(ctx:CanvasRenderingContext2D,name:string,overrides:PaneOverrides={},extra:{name:string;frame:number}[]=[])=>renderer.draw(ctx,'friends',name,{bindings:[{name:name+'_SceneIn',frame:20},...extra],overrides});
  let okay=renderer.draw(top,'friends','FrdTopBG_U_00');
  okay=draw(top,'FrdElemCard_UB_00',{},[{name:'FrdElemCard_UB_00_NotConnect',frame:1}])&&okay;
  okay=draw(top,'FrdElemCard_UF_00',{
    T_FrdCode_00:message('fri_code'),T_FrdCodeNum_00:message('fri_code_num'),T_FrdName_00:{text:nickname},
    N_FrdCardE_00:{visible:false},N_PlyApp_00:{visible:false},
    N_FavApp_00:{alpha:255},P_FavPicDummy_00:{visible:false},
    T_FavName_00:message('fri_favorite_u'),T_FavAppName_00:message('fri_edit_fav_none'),
  },[{name:'FrdElemCard_UF_00_NotConnect',frame:1}])&&okay;
  options.font?.draw(top,message('fri_title_fri').text??view.heading,200,14,14,'#555','center');
  okay=renderer.draw(bottom,'friends','FrdTopBG_D_00')&&okay;
  okay=draw(bottom,'FrdElemCard_DB_00',{
    T_Box_00:message('fri_card_off'),N_IconNEW_00:{visible:false},
    N_Blln_00:{visible:profile&&Boolean(status),alpha:255},T_Box_03:{text:status},
    N_Blln_02:{visible:profile&&!status,alpha:255},T_NoComment_00:{...message('fri_twitt_none'),alpha:255},
  },[{name:'FrdElemCard_DB_00_Select',frame:1},{name:'FrdElemCard_DB_00_EdgeOn',frame:1}])&&okay;
  okay=draw(bottom,'FrdElemCard_DF_00',{T_Box_00:{text:nickname},N_FrdCardE_00:{visible:false}},[{name:'FrdElemCard_DF_00_Select',frame:1},{name:'FrdElemCard_DF_00_EdgeOn',frame:1}])&&okay;
  okay=draw(bottom,'FrdTopUIUp_D_00',{
    N_BtnTopPivot_00:{visible:!profile},N_BtnTopPivot_01:{visible:profile},N_BtnTopPivot_02:{visible:false},
    N_BtnRegF_02:{visible:false},
    T_Box_08:message('fri_edit'),T_Box_09:message('fri_edit'),T_Box_06:message('fri_twitt'),T_Box_07:message('fri_twitt'),
    T_Box_03:message('fri_option'),T_Box_02:message('fri_option'),T_Box_05:message('fri_add'),T_Box_04:message('fri_add'),
  })&&okay;
  okay=draw(bottom,'FrdTopUIDw_D_00',{
    N_BtnNormal_00:{visible:false},N_BtnBtmPivot_03:{visible:false},
    T_BtnBakHM_01:message(profile?'fri_dlg_2b_back':'fri_base_1b_quit'),T_BtnBakHM_00:message(profile?'fri_dlg_2b_back':'fri_base_1b_quit'),
    T_FrdNumNumer_00:{text:'0'},T_FrdNumDenom_00:{text:'100'},
  })&&okay;
  return okay;
}

/** Source selected-note chrome around the existing, immutable legacy stroke data. */
function drawSelectedNote(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,capture:SuspendedCapture={status:'none'},reducedMotion=false):boolean{
  const message=(label:string)=>nativeMessageOverride(renderer.packs['notes-messages'],'message',label,'');
  let okay=renderer.draw(top,'notes-upper','Bg_U_00');
  if(capture.status==='none')okay=renderer.draw(top,'notes-image','ImageScreenUp',{bindings:[{name:'ImageScreenUp_PanelNoGameIn',frame:20}],overrides:{
    T_TextList:{...message('9900NoBreakGameMesList'),visible:true,alpha:255},T_TextWrite:{visible:false},
    P_ScreenUpR:{visible:false},P_ScreenUpL:{visible:false},P_ScreenDown:{visible:false},
    P_ScreenShdwUp:{visible:false},P_ScreenShdwDown:{visible:false},W_ScreenShdwUp:{visible:false},W_ScreenShdwDown:{visible:false},
    W_TextPanel:{visible:false},P_IconSwitch:{visible:false},P_Mask:{visible:false},N_BtnMemoUp:{visible:false},
  }})&&okay;
  else{
    // Sample the source Switch clip at the reducer's bounded frame; initial/reduced-motion views settle.
    // ImageScreenUp starts at Double and B_BtnSwitch cycles Double→Up→Down (0x168880, 0x163754).
    // PanelGameIn is the memo-to-upper
    // transition, so N_BtnMemoUp stays hidden. Only the left-eye pane is exposed.
    const hidden={visible:false};
    const textures=capture.status==='ready'?{[captureUpperTexture]:capture.upper,[captureLowerTexture]:capture.lower}:undefined;
    const clip={double:'ImageScreenUp_SwitchDouble',up:'ImageScreenUp_SwitchUp',down:'ImageScreenUp_SwitchDown'}[notesCaptureView(view.data??{})];
    okay=renderer.draw(top,'notes-image','ImageScreenUp',{bindings:[{name:clip,frame:!reducedMotion&&typeof view.data?.captureSwitchFrame==='number'&&Number.isFinite(view.data.captureSwitchFrame)?Math.max(0,Math.min(NOTES_SWITCH_LAST_FRAME,view.data.captureSwitchFrame)):NOTES_SWITCH_LAST_FRAME}],textures,overrides:{
      T_TextList:hidden,T_TextWrite:hidden,P_Mask:hidden,N_BtnMemoUp:hidden,W_TextPanel:hidden,P_ScreenUpR:hidden,
      // Missing pixels are not "no suspended software", and are never invented.
      ...(textures?{P_ScreenUpL:{textureBindings:{0:captureUpperTexture}},P_ScreenDown:{textureBindings:{0:captureLowerTexture}}}
        :{P_ScreenUpL:hidden,P_ScreenDown:hidden,P_ScreenShdwUp:hidden,P_ScreenShdwDown:hidden,W_ScreenShdwUp:hidden,W_ScreenShdwDown:hidden}),
    }})&&okay;
  }
  okay=renderer.draw(bottom,'notes-lower','Bg_D_00')&&okay;
  // Scene enter (0x16322c) puts the switch button in state 5 without suspended software; its animator
  // slot 5 is the G_Btn_Switch-bound Invalid clip (greyed P_BtnSwitch/P_GradSwitch/P_MemoSwitchB/F).
  const switchState=capture.status==='none'?[{name:'MemoWriteDown_Invalid',frame:1}]:[];
  okay=renderer.draw(bottom,'notes-write','MemoWriteDown',{bindings:[{name:'MemoWriteDown_Base',frame:0},{name:'MemoWriteDown_SceneIn',frame:20},...switchState],overrides:{
    N_ExtendMenu:{visible:false},P_CsrPenSsizeM:{visible:false},
    P_ShutterFlash:{visible:false},P_ShutterParts:{visible:false},
    P_BtnMemoNext:{visible:false},P_BtnMemoShdwN:{visible:false},
  }})&&okay;
  // Existing legacy points are lower-LCD coordinates. This is a display adapter,
  // not an implementation of the native pen or eraser; nothing writes to state.
  bottom.save();bottom.beginPath();bottom.rect(4,4,312,208);bottom.clip();
  bottom.lineCap='round';bottom.lineJoin='round';
  for(const stroke of Array.isArray(view.data?.strokes)?view.data.strokes.slice(-2048):[]){
    if(!stroke||typeof stroke!=='object'||Array.isArray(stroke)||!Array.isArray(stroke.points))continue;
    const color=stroke.color??'black';
    if(color!=='black'&&color!=='red'&&color!=='blue'&&color!=='eraser')continue;
    bottom.strokeStyle={black:'#000',red:'#f00',blue:'#00f',eraser:'#fff'}[color];bottom.lineWidth=color==='eraser'?12:2;
    bottom.beginPath();let started=false;
    for(const point of stroke.points.slice(-4096)){
      if(!Array.isArray(point)||typeof point[0]!=='number'||typeof point[1]!=='number'||!Number.isFinite(point[0])||!Number.isFinite(point[1])){started=false;continue;}
      const [x,y]=point;
      if(!started){bottom.moveTo(x,y);bottom.lineTo(x+0.01,y);started=true;}else bottom.lineTo(x,y);
    }
    bottom.stroke();
  }
  bottom.restore();return okay;
}
