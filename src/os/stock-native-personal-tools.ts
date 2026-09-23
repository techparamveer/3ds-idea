import type { AppView } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { nativeMessageOverride, type PaneOverrides } from './native-layout';

const notesPrefix='packs/game-notes/';
export const personalNotesPacks:readonly NativeTitlePackRequest[]=[
  {url:notesPrefix+'memo-Bg_U_00-arc-l.json',alias:'notes-upper',layouts:['Bg_U_00'],animations:[]},
  {url:notesPrefix+'memo-Bg_D_00-arc-l.json',alias:'notes-lower',layouts:['Bg_D_00'],animations:[]},
  {url:notesPrefix+'memo-MemoListDown-arc-l.json',alias:'notes-list',layouts:['MemoListDown'],animations:['MemoListDown_Base','MemoListDown_SceneIn']},
  {url:notesPrefix+'memo-MemoTutorialUp-arc-l.json',alias:'notes-help',layouts:['MemoTutorialUp'],animations:['MemoTutorialUp_Base','MemoTutorialUp_SceneIn']},
  {url:notesPrefix+'messages-and-loose.json',alias:'notes-messages',layouts:[],animations:[]},
];
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
  if(view.appId==='game-notes'&&view.screen==='main')return {view:'game-notes-main',titleId:'0004003000009c02',packs:personalNotesPacks};
  if(initialFriendView(view))return {view:'friends-initial',titleId:'0004003000009f02',packs:personalFriendPacks};
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
  if(initialFriendView(view))return drawFriendFrame(renderer,top,bottom,view,options);
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
    T_Box_00:message('fri_card_off'),N_IconNEW_00:{visible:false},N_Blln_00:{visible:false},N_Blln_02:{visible:false},
  },[{name:'FrdElemCard_DB_00_Select',frame:1},{name:'FrdElemCard_DB_00_EdgeOn',frame:1}])&&okay;
  okay=draw(bottom,'FrdElemCard_DF_00',{T_Box_00:{text:nickname},N_FrdCardE_00:{visible:false}},[{name:'FrdElemCard_DF_00_Select',frame:1},{name:'FrdElemCard_DF_00_EdgeOn',frame:1}])&&okay;
  okay=draw(bottom,'FrdTopUIUp_D_00',{
    N_BtnTopPivot_01:{visible:false},N_BtnTopPivot_02:{visible:false},
    T_Box_03:message('fri_option'),T_Box_02:message('fri_option'),T_Box_05:message('fri_add'),T_Box_04:message('fri_add'),
  })&&okay;
  okay=draw(bottom,'FrdTopUIDw_D_00',{
    N_BtnNormal_00:{visible:false},N_BtnBtmPivot_03:{visible:false},
    T_BtnBakHM_01:message('fri_base_1b_quit'),T_BtnBakHM_00:message('fri_base_1b_quit'),
    T_FrdNumNumer_00:{text:'0'},T_FrdNumDenom_00:{text:'100'},
  })&&okay;
  return okay;
}
