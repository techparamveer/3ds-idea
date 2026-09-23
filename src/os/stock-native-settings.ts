import type { AppView } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import { nativeMessageOverride } from './native-layout';

const prefix='packs/settings/contents/0000-0000003d/';
const buttons=['I_TopLTs','I_TopRTs','I_TopLBs','I_TopRBs','I_TopTs'];
export const settingsScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'base.json',alias:'base',layouts:['Bg_U_00','Bg_D_00'],animations:['Bg_U_00_SceneIn_Legacy','Bg_D_00_SceneIn_Legacy']},
  {url:prefix+'up.json',alias:'up',layouts:['TopText_U_00'],animations:['TopText_U_00_SceneIn_00']},
  {url:prefix+'layout.json',alias:'layout',layouts:['Top_D_02'],animations:['Top_D_02_SceneIn_00']},
  {url:prefix+'button.json',alias:'button',layouts:buttons,animations:[]},
  {url:prefix+'message_EU.json',alias:'messages',layouts:[],animations:[]},
];
/** Native source layouts and child mounts; this presents a settled menu. */
export function drawNativeSettingsMain(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView):boolean{
  if(view.appId!=='system-settings'||view.screen!=='main')return false;
  let okay=true;
  okay=renderer.draw(top,'base','Bg_U_00',{bindings:[{name:'Bg_U_00_SceneIn_Legacy',frame:40}]})&&okay;
  okay=renderer.draw(bottom,'base','Bg_D_00',{bindings:[{name:'Bg_D_00_SceneIn_Legacy',frame:40}]})&&okay;
  const message=(label:string)=>nativeMessageOverride(renderer.packs.messages,'mset',label,'');
  okay=renderer.draw(top,'up','TopText_U_00',{bindings:[{name:'TopText_U_00_SceneIn_00',frame:20}],overrides:{
    TextBoxTitle_00:message('top_sysset_title'),T_ver_00:{text:'Ver. 10.7.0-32E'},
  }})&&okay;
  const ids=['internet','parental','data','other','nnid'];
  const labels=['top_internet','top_parental','top_software','top_settings','top_nnid'];
  const attachments=Object.fromEntries(buttons.map((name,i)=>['N_'+name+'_00',()=>{
    okay=renderer.draw(bottom,'button',name,{overrides:{TextBox_00:message(labels[i])}})&&okay;
  }]));
  okay=renderer.draw(bottom,'layout','Top_D_02',{bindings:[{name:'Top_D_02_SceneIn_00',frame:35}],attachments,overrides:{TextBoxTitle_01:message('top_btm_text')}})&&okay;
  const selected=ids.indexOf(view.rows[view.selection]?.id);
  const rectangles=[[16,38,140,78],[164,38,140,78],[16,123,140,78],[164,123,140,78],[4,0,312,33]];
  if(selected>=0){const [x,y,w,h]=rectangles[selected];bottom.save();bottom.strokeStyle='#f7d248';bottom.lineWidth=2;bottom.strokeRect(x+1,y+1,w-2,h-2);bottom.restore();}
  return okay;
}
