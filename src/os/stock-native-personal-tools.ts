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
export function nativePersonalToolView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.appId==='notifications'&&view.screen==='main'&&view.rows.length===0)return {view:'notifications-empty',titleId:'000400300000a002',packs:personalNotificationPacks};
  if(view.appId==='game-notes'&&view.screen==='main')return {view:'game-notes-main',titleId:'0004003000009c02',packs:personalNotesPacks};
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
