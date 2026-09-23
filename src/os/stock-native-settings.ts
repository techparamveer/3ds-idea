import type { AppView } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import { nativeMessageOverride, type NativeAnimation, type NativeLayout } from './native-layout';

const prefix='packs/settings/contents/0000-0000003d/';
const buttons=['I_TopLTs','I_TopRTs','I_TopLBs','I_TopRBs','I_TopTs'];
export const settingsScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'base.json',alias:'base',layouts:['Bg_U_00','Bg_D_00'],animations:['Bg_U_00_SceneIn_Legacy','Bg_D_00_SceneIn_Legacy']},
  {url:prefix+'up.json',alias:'up',layouts:['TopText_U_00'],animations:['TopText_U_00_SceneIn_00']},
  {url:prefix+'layout.json',alias:'layout',layouts:['Top_D_02'],animations:['Top_D_02_SceneIn_00']},
  {url:prefix+'button.json',alias:'button',layouts:buttons,animations:buttons.map(name=>name+'_Select')},
  {url:prefix+'message_EU.json',alias:'messages',layouts:[],animations:[]},
];
/** These archive-level shares have neither endpoint in the five Settings buttons.
 * Keep the resource immutable; the bounded presentation adapter uses direct tracks.
 */
export function settingsDirectButtonClip(layout:NativeLayout,source:NativeAnimation):NativeAnimation{
  const panes=new Set<string>(),groups=new Set<string>();
  const paneNames=(items:NativeLayout['roots'])=>items.forEach(p=>{panes.add(p.name);paneNames(p.children);});paneNames(layout.roots);
  const groupNames=(items:NativeLayout['groups'])=>items.forEach(g=>{groups.add(g.name);groupNames(g.children);});groupNames(layout.groups);
  const omitted=new Set(['Button/AS_Picture_00','BottunPage01/AS_Picture_16']);
  for(const share of source.shares??[]){
    if(!omitted.has(share.sourcePane+'/'+share.targetGroup)||panes.has(share.sourcePane)||groups.has(share.targetGroup))throw new Error('Settings button share requires an explicit composition');
  }
  return {...source,shares:[]};
}
const prepared=new WeakSet<NativeLayoutRenderer>();
function prepareSettingsButtons(renderer:NativeLayoutRenderer){
  if(prepared.has(renderer))return;
  const source=renderer.packs.button,animations={...source.animations};
  for(const name of buttons)animations[name+'_DirectSettings']=settingsDirectButtonClip(source.layouts[name],source.animations[name+'_Select']);
  renderer.packs.button={...source,animations};prepared.add(renderer);
}
/** Native source layouts and child mounts; this presents a settled menu. */
export function drawNativeSettingsMain(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView):boolean{
  if(view.appId!=='system-settings'||view.screen!=='main')return false;
  prepareSettingsButtons(renderer);
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
    okay=renderer.draw(bottom,'button',name,{bindings:[{name:name+'_DirectSettings',frame:view.rows[view.selection]?.id===ids[i]?1:0}],overrides:{TextBox_00:message(labels[i])}})&&okay;
  }]));
  okay=renderer.draw(bottom,'layout','Top_D_02',{bindings:[{name:'Top_D_02_SceneIn_00',frame:35}],attachments,overrides:{TextBoxTitle_01:message('top_btm_text')}})&&okay;
  return okay;
}
