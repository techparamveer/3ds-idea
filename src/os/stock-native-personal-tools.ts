import type { AppView } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import type { SuspendedCapture } from './notes-suspended-capture';
import { nativeMessageOverride, type PaneOverrides } from './native-layout';
import { notesCaptureView, NOTES_SWITCH_LAST_FRAME } from './stock-screen-layout';

const notesPrefix='packs/game-notes/';
export const personalNotesPacks:readonly NativeTitlePackRequest[]=[
  {url:notesPrefix+'memo-Bg_U_00-arc-l.json',alias:'notes-upper',layouts:['Bg_U_00'],animations:[]},
  {url:notesPrefix+'memo-Bg_D_00-arc-l.json',alias:'notes-lower',layouts:['Bg_D_00'],animations:[]},
  {url:notesPrefix+'memo-MemoListDown-arc-l.json',alias:'notes-list',layouts:['MemoListDown'],animations:['MemoListDown_Base','MemoListDown_SceneIn']},
  {url:notesPrefix+'memo-MemoTutorialUp-arc-l.json',alias:'notes-help',layouts:['MemoTutorialUp'],animations:['MemoTutorialUp_Base','MemoTutorialUp_SceneIn']},
  {url:notesPrefix+'messages-and-loose.json',alias:'notes-messages',layouts:[],animations:[]},
];
export const personalSelectedNotePacks:readonly NativeTitlePackRequest[]=[
  ...personalNotesPacks.filter(({alias})=>alias!=='notes-list'&&alias!=='notes-help'),
  {url:notesPrefix+'memo-MemoWriteDown-arc-l.json',alias:'notes-write',layouts:['MemoWriteDown'],animations:['MemoWriteDown_Base','MemoWriteDown_SceneIn','MemoWriteDown_Invalid']},
  {url:notesPrefix+'memo-ImageScreenUp-arc-l.json',alias:'notes-image',layouts:['ImageScreenUp'],animations:['ImageScreenUp_PanelNoGameIn','ImageScreenUp_SwitchDouble','ImageScreenUp_SwitchUp','ImageScreenUp_SwitchDown']},
];
// Dynamic replacements for the 8×8 source slots imgUp400x240L/imgDown320x240.
const captureUpperTexture='suspended-capture-upper',captureLowerTexture='suspended-capture-lower';
const personalAllNotePacks:readonly NativeTitlePackRequest[]=[...personalNotesPacks,...personalSelectedNotePacks.filter(({alias})=>!personalNotesPacks.some(pack=>pack.alias===alias))];
export const personalNotificationPacks:readonly NativeTitlePackRequest[]=[
  {url:'packs/notifications/news.json',alias:'notifications',layouts:['NewsTopUI_U_00','NewsTopUI_D_00','NewsUnread_U_00','NewsTopBtn_D_00'],animations:['NewsUnread_U_00_SceneIn','NewsUnread_U_00_NumAnim','NewsTopBtn_D_00_SceneIn']},
  {url:'packs/notifications/messages-and-loose.json',alias:'notification-messages',layouts:[],animations:[]},
];
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
export function nativePersonalToolView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.appId==='notifications'&&view.screen==='main'&&view.rows.length===0)return {view:'notifications-empty',titleId:'000400300000a002',packs:personalNotificationPacks};
  if(view.appId==='game-notes'&&view.screen==='drawing')return {view:'game-notes',titleId:'0004003000009c02',packs:personalAllNotePacks};
  if(view.appId==='game-notes'&&view.screen==='main')return {view:'game-notes',titleId:'0004003000009c02',packs:personalAllNotePacks};
  if(view.appId==='friends'&&view.screen==='profile')return {view:'friends',titleId:'0004003000009f02',packs:personalFriendPacks};
  if(initialFriendView(view))return {view:'friends',titleId:'0004003000009f02',packs:personalFriendPacks};
  return null;
}
/** Source notification components for the empty, offline portfolio state. */
export function drawNativePersonalToolFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId==='notifications'&&view.screen==='main'&&view.rows.length===0){
    const message=(label:string)=>nativeMessageOverride(renderer.packs['notification-messages'],'newslist_msbt_LZ',label,'');
    const zero=(label:string)=>{const value=message(label);return {...value,text:value.text?.replace('%d','0')};};
    let okay=renderer.draw(top,'notifications','NewsTopUI_U_00');
    okay=renderer.draw(top,'notifications','NewsUnread_U_00',{bindings:[{name:'NewsUnread_U_00_SceneIn',frame:20},{name:'NewsUnread_U_00_NumAnim',frame:0}],overrides:{
      T_Unread_00:message('new_news_u'),T_Unread_01:message('new_news_u'),T_NewsUnread_00:zero('new_news_u0'),T_News_00:message('new_news_u1'),T_CntUnread_00:zero('new_ce_u0'),T_Cnt_00:message('new_ce_u1'),
    }})&&okay;
    okay=renderer.draw(bottom,'notifications','NewsTopUI_D_00')&&okay;
    okay=renderer.draw(bottom,'notifications','NewsTopBtn_D_00',{bindings:[{name:'NewsTopBtn_D_00_SceneIn',frame:20}],overrides:{T_EndB_00:message('new_back'),T_EndF_00:message('new_back')}})&&okay;
    options.font?.draw(top,message('new_title_new').text??view.heading,200,14,14,'#555','center');
    options.font?.draw(bottom,view.text?.[0]??'',160,110,14,'#666','center');
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
  okay=renderer.draw(top,'notes-help','MemoTutorialUp',{bindings:[{name:'MemoTutorialUp_Base',frame:1},{name:'MemoTutorialUp_SceneIn',frame:20}],overrides:{T_PartsTxt00b:message('1000Help_WelcomeP1')}})&&okay;
  okay=renderer.draw(bottom,'notes-lower','Bg_D_00')&&okay;
  okay=renderer.draw(bottom,'notes-list','MemoListDown',{bindings:[{name:'MemoListDown_Base',frame:0},{name:'MemoListDown_SceneIn',frame:20}],overrides})&&okay;
  return okay;
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
