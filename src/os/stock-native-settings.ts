import type { AppView } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import { nativeMessageOverride, type NativeAnimation, type NativeLayout } from './native-layout';

const prefix='packs/settings/contents/0000-0000003d/';
const mainButtons=['I_TopLTs','I_TopRTs','I_TopLBs','I_TopRBs','I_TopTs'];
const buttons=[...mainButtons,'B_L','B_LBlue','B_SB'];
export const settingsScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'base.json',alias:'base',layouts:['Bg_U_00','Bg_D_00','Base_D_00'],animations:['Bg_U_00_SceneIn_Legacy','Bg_D_00_SceneIn_Legacy']},
  {url:prefix+'up.json',alias:'up',layouts:['TopText_U_00','CommonBG_U_00','TextBG_U_00','IconNet','IconParental'],animations:['TopText_U_00_SceneIn_00','CommonBG_U_00_SceneIn_00','TextBG_U_00_TextFadeIn']},
  {url:prefix+'layout.json',alias:'layout',layouts:['Top_D_02','NetTop_D_01','Btn2Text_D_00','MessageOnly_D_00'],animations:['Top_D_02_SceneIn_00','NetTop_D_01_SpecialIn_00','MessageOnly_D_00_SpecialIn_00']},
  {url:prefix+'button.json',alias:'button',layouts:[...buttons,'B_S'],animations:buttons.map(name=>name+'_Select')},
  {url:prefix+'message_EU.json',alias:'messages',layouts:[],animations:[]},
];
/** These archive-level shares have neither endpoint in the requested Settings buttons.
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
  if(view.appId!=='system-settings')return false;
  if(view.screen!=='main')return drawNativeSettingsSubpage(renderer,top,bottom,view);
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
  const attachments=Object.fromEntries(mainButtons.map((name,i)=>['N_'+name+'_00',()=>{
    okay=renderer.draw(bottom,'button',name,{bindings:[{name:name+'_DirectSettings',frame:view.rows[view.selection]?.id===ids[i]?1:0}],overrides:{TextBox_00:message(labels[i])}})&&okay;
  }]));
  okay=renderer.draw(bottom,'layout','Top_D_02',{bindings:[{name:'Top_D_02_SceneIn_00',frame:35}],attachments,overrides:{TextBoxTitle_01:message('top_btm_text')}})&&okay;
  return okay;
}

/** Source menu mounts are retained; network and parental setup remain read-only. */
function drawNativeSettingsSubpage(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView):boolean{
  if(!['internet','parental'].includes(view.screen))return false;
  prepareSettingsButtons(renderer);
  const internet=view.screen==='internet';
  const message=(label:string)=>nativeMessageOverride(renderer.packs.messages,'mset',label,'');
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,options)&&okay;};
  draw(top,'base','Bg_U_00',{bindings:[{name:'Bg_U_00_SceneIn_Legacy',frame:40}]});
  draw(bottom,'base','Bg_D_00',{bindings:[{name:'Bg_D_00_SceneIn_Legacy',frame:40}]});
  draw(top,'up','CommonBG_U_00',{bindings:[{name:'CommonBG_U_00_SceneIn_00',frame:20}],overrides:{TextBoxTitle_00:message(internet?'net_top_title':'parental_title_u')},attachments:{Icon:()=>draw(top,'up',internet?'IconNet':'IconParental')}});
  draw(top,'up','TextBG_U_00',{bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{TextBox_00:message(internet?'net_top_comm_u':'par_top_comm_u_n'),UpWndwLT_01:{size:[184,80],scale:[-1,1]},UpWndwLT_02:{size:[184,80],scale:[1,-1]},UpWndwLT_03:{size:[184,80],scale:[-1,-1]}}});
  // The source uses signed dimensions for three mirrored panel quarters.
  // Normalize only these derived panes; keep their origins and source pack intact.
  if(!internet)draw(bottom,'up','TextBG_U_00',{center:[160,44],scale:.8,bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{TextBox_00:{visible:false},UpWndwLT_01:{size:[184,80],scale:[-1,1]},UpWndwLT_02:{size:[184,80],scale:[1,-1]},UpWndwLT_03:{size:[184,80],scale:[-1,-1]}}});
  const children=internet?[
    ['N_B_LBlue_00','B_LBlue','connections','net_set'],
    ['N_B_S_00','B_S','spotpass','net_bg24'],
    ['N_B_S_01','B_S','ds-connections','net_ds_card'],
    ['N_B_S_02','B_S','internet-info','net_option'],
  ]:[['N_B_S_00','B_S','next','base_2b_next'],['N_B_S_01','B_S','back','base_2b_back']];
  const attachments=Object.fromEntries(children.map(([mount,layout,id,label])=>[mount,()=>{
    // The small button has no standalone Select clip in this archive. Its
    // matching text/button material tracks are shared by the B_SB variant.
    const clip=layout==='B_S'?'B_SB':layout;
    draw(bottom,'button',layout,{bindings:[{name:clip+'_DirectSettings',frame:view.rows[view.selection]?.id===id?1:0}],overrides:{TextBox_00:message(label)}});
  }]));
  const layout=internet?'NetTop_D_01':'Btn2Text_D_00';
  draw(bottom,'layout',layout,{bindings:internet?[{name:layout+'_SpecialIn_00',frame:1}]:[],attachments,overrides:internet?{}:{Null_00:{translation:[0,0,0],alpha:255,visible:true},TextBoxTitle_00:{...message('par_top_comm1'),fontSize:[16,19.2]}}});
  if(internet)draw(bottom,'base','Base_D_00',{overrides:{TextBox_00:message('base_2b_back'),TextBoxShdw_00:message('base_2b_back')}});
  return okay;
}
