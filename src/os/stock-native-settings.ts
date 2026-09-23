import type { AppView } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import { nativeMessageOverride, nativePaneParentPath, type NativeAnimation, type NativeLayout, type PaneOverrides } from './native-layout';

const prefix='packs/settings/contents/0000-0000003d/';
const mainButtons=['I_TopLTs','I_TopRTs','I_TopLBs','I_TopRBs','I_TopTs'];
const buttons=[...mainButtons,'B_L','B_LBlue','B_SB','B_SMngCTRO','B_SMngDSiO','B_CnctW1','B_CnctW2','B_CnctW3','I_User','T_Page01'];
const otherIcons=['I_Date','I_Touch','I_Sound','I_Mic','I_3DTest','I_Ocam','I_AnalogPad','I_Trans','I_Lang','I_Update','I_Format'];
export const settingsScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'base.json',alias:'base',layouts:['Bg_U_00','Bg_D_00','Base_D_00','Base_D_01','LsBase_D_00'],animations:['Bg_U_00_SceneIn_Legacy','Bg_D_00_SceneIn_Legacy']},
  {url:prefix+'up.json',alias:'up',layouts:['TopText_U_00','CommonBG_U_00','TextBG_U_00','IconNet','IconParental','IconDataMa','IconBasic','IconUser','IconDateTime','IconSound','IconLang','UserInfo_U_00','Connect_U_00','LsCommonBG_U_00'],animations:['TopText_U_00_SceneIn_00','CommonBG_U_00_SceneIn_00','CommonBG_U_00_SceneIn_01','CommonBG_U_00_SceneIn_03','CommonBG_U_00_SceneIn_04','CommonBG_U_00_SceneIn_05','TextBG_U_00_TextFadeIn','UserInfo_U_00_TextFadeIn','Connect_U_00_TextFadeIn','LsCommonBG_U_00_SceneIn_00']},
  {url:prefix+'layout.json',alias:'layout',layouts:['Top_D_02','NetTop_D_01','Btn2Text_D_00','MessageOnly_D_00','SMngTopO_D_00','SMngCTR_D_00','UserInfo_D_00','BasicTop_D_00','NetSetTop_D_00','Birthday_D_00','DateTime_D_00','DateTime_D_01','Sound_D_00','NetType2_D_00','LsMenu_D_00'],animations:['LsMenu_D_00_SceneIn_00','Top_D_02_SceneIn_00','NetTop_D_01_SpecialIn_00','MessageOnly_D_00_SpecialIn_00','MessageOnly_D_00_SceneIn_00','SMngTopO_D_00_SpecialIn_00','BasicTop_D_00_SpecialIn_00']},
  {url:prefix+'button.json',alias:'button',layouts:[...buttons,...otherIcons,'B_LsMenu','B_S','B_M','R_ArrowL','R_ArrowR','T_OnOff','T_Page02','T_Page03','T_Page04'],animations:[...buttons.map(name=>name+'_Select'),'R_ArrowL_Appear','R_ArrowR_Appear','T_OnOff_Decide','T_OnOff_UnDecide']},
  {url:prefix+'message_EU.json',alias:'messages',layouts:[],animations:[]},
];
/** These archive-level shares have neither endpoint in the requested Settings buttons.
 * Keep the resource immutable; the bounded presentation adapter uses direct tracks.
 */
export function settingsDirectButtonClip(layout:NativeLayout,source:NativeAnimation):NativeAnimation{
  const panes=new Set<string>(),groups=new Set<string>();
  const paneNames=(items:NativeLayout['roots'])=>items.forEach(p=>{panes.add(p.name);paneNames(p.children);});paneNames(layout.roots);
  const groupNames=(items:NativeLayout['groups'])=>items.forEach(g=>{groups.add(g.name);groupNames(g.children);});groupNames(layout.groups);
  const omitted=new Set(['Button/AS_Picture_00','BottunPage01/AS_Picture_16','BottunUser/AS_Picture_00']);
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
  // top4btn requests background state 3 from initial state 0. The executable
  // starts Legacy only for 1→2, so main retains the original white-pane defaults.
  // See docs/settings-main-source-validation.md; subpages have separate states.
  okay=renderer.draw(top,'base','Bg_U_00')&&okay;
  okay=renderer.draw(bottom,'base','Bg_D_00')&&okay;
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

/** Source table byte 0x23 selects both the background transition and title
 * animation. Adapted detail cards inherit their parent section's presentation;
 * only the identified DS Profile route requests Legacy. */
export function settingsSceneVariant(view:AppView):1|2|3|4|5{
  if(view.screen==='main')return 3;
  if(view.screen==='detail'&&view.data?.field==='ds-profile')return 2;
  const section=view.screen==='detail'?String(view.data?.parent??'other'):view.screen;
  if(section==='internet'||section==='connections')return 3;
  if(section==='data'||section==='data-3ds')return 4;
  if(section==='parental'||section==='restrictions')return 5;
  return 1;
}

const preparedFields=new WeakSet<NativeLayoutRenderer>();
/** Read-only fields reuse source text/materials and source numeric boxes. The
 * source digit samples and editing arrows are hidden, never treated as data. */
function prepareReadOnlyFields(renderer:NativeLayoutRenderer){
  if(preparedFields.has(renderer))return;
  const pack=renderer.packs.layout,layouts={...pack.layouts};
  for(const name of ['Birthday_D_00','DateTime_D_00','DateTime_D_01']){
    const layout=structuredClone(pack.layouts[name]);
    const parent=nativePaneParentPath(layout,'Null_00')!.at(-1)!;
    const fields=name==='DateTime_D_00'?['TextBox_00','TextBox_01','TextBox_02']:['TextBox_01','TextBox_02'];
    for(const field of fields){
      const template=nativePaneParentPath(layout,field)!.at(-1)!;
      const pane=structuredClone(template);pane.name=field+'_Value';pane.children=[];pane.origin=4;pane.translation=[template.translation[0],12,0];pane.size=[field==='TextBox_00'?112:62,42];pane.text!.size=[27,32.4];pane.text!.alignment=4;pane.text!.messageStyle=undefined;
      parent.children.push(pane);
    }
    layouts[name+'_ReadOnly']=layout;
  }
  renderer.packs.layout={...pack,layouts};preparedFields.add(renderer);
}
type Child=readonly [mount:string,layout:string,id:string,label?:string];
const otherButtons:Record<string,[string,string]>={profile:['I_User','user_info'],clock:['I_Date','date_time'],touch:['I_Touch','touch'],sound:['I_Sound','sound'],mic:['I_Mic','mic_test'],'calibration-3d':['I_3DTest','3d_check'],'outer-cameras':['I_Ocam','ocam'],'circle-pad':['I_AnalogPad','analog_pad'],transfer:['I_Trans','trans'],language:['I_Lang','language'],update:['I_Update','update'],format:['I_Format','initialize']};
const panelMirrors={UpWndwLT_01:{size:[184,80],scale:[-1,1]},UpWndwLT_02:{size:[184,80],scale:[1,-1]},UpWndwLT_03:{size:[184,80],scale:[-1,-1]}};
/** Source menus retain their child mounts. Introductory and read-only detail
 * cards reuse source text panels; they never imply configured device state. */
function drawNativeSettingsSubpage(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView):boolean{
  prepareSettingsButtons(renderer);
  const message=(label:string)=>nativeMessageOverride(renderer.packs.messages,'mset',label,'');
  const {screen}=view,data=view.data??{},page=typeof data.page==='number'?data.page:0;
  const preferences=data.settings&&typeof data.settings==='object'?data.settings as Record<string,unknown>:{};
  const value=(key:string)=>typeof preferences[key]==='string'&&preferences[key]!==''?String(preferences[key]):'Not set';
  const field=String(data.field??'');
  const section=screen==='detail'?String(data.parent??'other'):screen;
  const sections:Record<string,[string,string,string]>={internet:['IconNet','net_top_title','net_top_comm_u'],connections:['IconNet','net_set_title','net_set_comm_u'],parental:['IconParental','parental_title_u','par_top_comm_u_n'],restrictions:['IconParental','parental_title_u','par_chan_comm_u1'],data:['IconDataMa','dat_title_u','dat_comm_u'],'data-3ds':['IconDataMa','dat_title_u','dat_3ds_comm_u'],profile:['IconUser','user_info_title','user_info_comm_u'],clock:['IconDateTime','date_time_title','datetime_comm_u'],other:['IconBasic','settings_title','settings_comm_u']};
  const detailSections:Record<string,[string,string,string]>={sound:['IconSound','sound_title','sound_comm_u'],language:['IconLang','language','language_comm_u'],date:['IconDateTime','date_time_title','date_comm_u'],time:['IconDateTime','date_time_title','time_comm_u'],birthday:['IconUser','user_info_title','birthday_comm_u'],nickname:['IconUser','user_info_title','user_name_comm_u']};
  const detailSource=screen==='detail'?detailSections[field]:undefined;
  const [icon,title,instruction]=detailSource??sections[section]??sections.other;
  const variant=settingsSceneVariant(view);
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,options)&&okay;};
  const back=()=>draw(bottom,'base','Base_D_00',{overrides:{TextBox_00:message('base_2b_back'),TextBoxShdw_00:message('base_2b_back')}});
  for(const [ctx,name] of [[top,'Bg_U_00'],[bottom,'Bg_D_00']] as const){
    draw(ctx,'base',name,variant===2?{bindings:[{name:name+'_SceneIn_Legacy',frame:40}]}:{});
  }
  if(screen==='detail'&&field==='ds-profile'){
    // ds_user_info uses independent Legacy chrome. No stored DS profile was
    // supplied; clear authored sample values rather than inventing device data.
    draw(top,'up','LsCommonBG_U_00',{bindings:[{name:'LsCommonBG_U_00_SceneIn_00',frame:20}],overrides:{
      TextBox_00:{text:''},TextBox_01:{text:''},TextBox_02:message('ds_birthday_u'),TextBox_03:{text:''},TextBoxTitle_01:message('ds_info_comm_u'),
    }});
    draw(bottom,'layout','LsMenu_D_00',{bindings:[{name:'LsMenu_D_00_SceneIn_00',frame:20}],attachments:{
      N_B_LsMenu_00:()=>draw(bottom,'button','B_LsMenu',{overrides:{TextBox_00:message('ds_comment')}}),
      N_B_LsMenu_01:()=>draw(bottom,'button','B_LsMenu',{overrides:{TextBox_00:message('ds_user_color')}}),
    }});
    draw(bottom,'base','LsBase_D_00',{overrides:{TextBox_00:message('ds_base_1b_back'),TextBox_02:message('ds_info_comm')}});
    return okay;
  }
  draw(top,'up','CommonBG_U_00',{bindings:[{name:'CommonBG_U_00_SceneIn_0'+(variant===2?0:variant),frame:20}],overrides:{TextBoxTitle_00:screen==='detail'&&!detailSource?{text:view.heading}:message(title)},attachments:{Icon:()=>draw(top,'up',icon)}});
  const profileInfo=screen==='profile'||screen==='detail'&&section==='profile'&&['nickname','birthday'].includes(field);
  // Original signed sizes encode mirrored quadrants. Derived absolute sizes
  // and reflected scales preserve each origin; the source pack is immutable.
  if(!profileInfo&&screen!=='connections')draw(top,'up','TextBG_U_00',{bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{...panelMirrors,TextBox_00:screen==='profile'||screen==='detail'&&section==='profile'&&field==='nickname'?{visible:false}:screen==='detail'&&!detailSource?{text:(view.text??[]).join('\n'),fontSize:[18,21.6]}:message(instruction)}});
  if(profileInfo){
    draw(top,'up','UserInfo_U_00',{bindings:[{name:'UserInfo_U_00_TextFadeIn',frame:20}],overrides:{
      IconTop_00:{visible:false},TextBox_01:message('user_name_u'),TextBox_02:{text:value('nickname')},TextBox_03:message('region_u'),TextBox_04:{visible:false},TextBox_05:{visible:false},TextBox_06:{text:value('region')},TextBox_07:message('birthday_u'),TextBox_08:{text:value('birthday')},TextBox_00:message(instruction),
    }});
  }
  if(screen==='connections'){
    const overrides:PaneOverrides={TextBox_00:message('net_set_comm_u')};
    for(let i=0;i<3;i++){
      overrides['TextBox_0'+(i*2+1)]=message('net_connect'+(i+1)+'_u');
      overrides['TextBox_0'+(i*2+2)]=message('net_none_set_u');
      // This portfolio has no configured console networks or security keys.
      overrides['NetKeyL_0'+i]={visible:false};
    }
    draw(top,'up','Connect_U_00',{bindings:[{name:'Connect_U_00_TextFadeIn',frame:20}],overrides});
  }
  const child=(layout:string,id:string,label?:string)=>{
    const clip=layout==='B_S'?'B_SB':layout==='B_M'?'B_L':otherIcons.includes(layout)?'I_User':layout;
    const bindings=buttons.includes(clip)?[{name:clip+'_DirectSettings',frame:view.rows[view.selection]?.id===id?1:0}]:[];
    const overrides:PaneOverrides=label?{TextBox_00:message(label)}:{};
    if(layout.startsWith('B_CnctW'))overrides.TextBox_00={text:message('net_connect1_u').text!.replace(/ 1$/,''),fontSize:[15,18]};
    draw(bottom,'button',layout,{bindings,overrides});
  };
  const menu=(layout:string,children:readonly Child[],clip?:string,overrides:PaneOverrides={})=>draw(bottom,'layout',layout,{bindings:clip?[{name:clip,frame:1}]:[],overrides:{Null_00:{translation:[0,0,0],alpha:255,visible:true},...overrides},attachments:Object.fromEntries(children.map(([mount,layout,id,label])=>[mount,()=>child(layout,id,label)]))});
  if(screen==='internet')menu('NetTop_D_01',[
    ['N_B_LBlue_00','B_LBlue','connections','net_set'],['N_B_S_00','B_S','spotpass','net_bg24'],['N_B_S_01','B_S','ds-connections','net_ds_card'],['N_B_S_02','B_S','internet-info','net_option'],
  ],'NetTop_D_01_SpecialIn_00');
  else if(screen==='parental'){
    // pare_new_set: source instruction-only page and two-control base footer.
    draw(bottom,'layout','MessageOnly_D_00',{bindings:[{name:'MessageOnly_D_00_SceneIn_00',frame:20}],overrides:{TextBoxTitle_00:message('par_top_comm0_n')}});
    draw(bottom,'base','Base_D_01',{overrides:{TextBox_00:message('base_2b_back'),TextBoxShdw_00:message('base_2b_back'),TextBox_01:message('base_2b_set'),TextBoxShdw_01:message('base_2b_set')}});
    return okay;
  }else if(screen==='data')menu('SMngTopO_D_00',[
    ['N_B_SMngCTRO_00','B_SMngCTRO','data-3ds'],['N_B_SMngDSiO_00','B_SMngDSiO','data-dsi'],['N_B_M_00','B_M','streetpass','dat_ce'],['N_B_S_00','B_S','blocked-users','dat_blist_reset'],
  ],'SMngTopO_D_00_SpecialIn_00');
  else if(screen==='profile')menu('UserInfo_D_00',[
    ['N_B_M_00','B_M','nickname','user_name'],['N_B_M_01','B_M','birthday','birthday'],['N_B_M_02','B_M','region','region'],['N_B_S_00','B_S','ds-profile','ds_user_info'],
  ],undefined,{TextBoxTitle_00:message('user_info_title')});
  else if(screen==='data-3ds')menu('SMngCTR_D_00',[
    ['N_B_M_00','B_M','software','dat_software'],['N_B_M_01','B_M','extra-data','dat_option'],['N_B_M_02','B_M','add-on-content','dat_contents'],['N_B_S_00','B_S','backup','dat_backup'],
  ]);
  else if(screen==='connections')menu('NetSetTop_D_00',[
    ['N_B_L_00','B_L','new-connection','net_new_set'],['N_B_CnctW1_00','B_CnctW1','connection-1'],['N_B_CnctW2_00','B_CnctW2','connection-2'],['N_B_CnctW3_00','B_CnctW3','connection-3'],
  ]);
  else if(screen==='other'){
    const attachments:Record<string,()=>void>={};
    view.rows.slice(0,3).forEach((row,i)=>{const button=otherButtons[row.id];if(button)attachments['N_I_Button_0'+i]=()=>child(button[0],row.id,button[1]);});
    for(let i=0;i<4;i++)attachments['NN_T_Page0'+(i+1)+'_00']=()=>draw(bottom,'button','T_Page0'+(i+1),{bindings:[{name:'T_Page01_DirectSettings',frame:i===page?1:0}]});
    if(page>0)attachments.N_R_ArrowL_00=()=>draw(bottom,'button','R_ArrowL',{bindings:[{name:'R_ArrowL_Appear',frame:0}]});
    if(page<3)attachments.N_R_ArrowR_00=()=>draw(bottom,'button','R_ArrowR',{bindings:[{name:'R_ArrowR_Appear',frame:0}]});
    draw(bottom,'layout','BasicTop_D_00',{bindings:[{name:'BasicTop_D_00_SpecialIn_00',frame:1}],attachments});
  }else if(screen==='clock')menu('NetType2_D_00',[['N_B_L_00','B_L','date','date_btn'],['N_B_L_01','B_L','time','time_btn']]);
  else if(screen==='restrictions'){
    const start=Math.floor(view.selection/4)*4;
    view.rows.slice(start,start+4).forEach((row,i)=>{
      draw(bottom,'button','B_M',{center:[160,43+i*44],bindings:[{name:'B_L_DirectSettings',frame:start+i===view.selection?1:0}],overrides:{TextBox_00:{text:row.label,fontSize:[15,18]}}});
    });
  }else if(screen==='detail'&&field==='sound'){
    draw(bottom,'layout','Sound_D_00',{overrides:{Null_00:{translation:[0,0,0],alpha:255}},attachments:Object.fromEntries(['surround','stereo','mono'].map((label,i)=>['N_T_OnOff_0'+i,()=>draw(bottom,'button','T_OnOff',{bindings:[{name:value('sound').toLowerCase()===label?'T_OnOff_Decide':'T_OnOff_UnDecide',frame:value('sound').toLowerCase()===label?11:1}],overrides:{TextBox_00:message(label)}})]))});
  }else if(screen==='detail'&&['birthday','date','time'].includes(field)){
    // Reflow the source panel behind read-only fields so captions retain the
    // source dark text's contrast. This does not expose the editing arrows.
    draw(bottom,'up','TextBG_U_00',{center:[160,120],bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{TextBox_00:{visible:false},UpWndwLT_00:{size:[154,104],translation:[0,68,0]},UpWndwLT_01:{size:[154,104],translation:[154,68,0],scale:[-1,1]},UpWndwLT_02:{size:[154,104],translation:[0,-36,0],scale:[1,-1]},UpWndwLT_03:{size:[154,104],translation:[154,-36,0],scale:[-1,-1]}}});
    prepareReadOnlyFields(renderer);
    const layout=field==='birthday'?'Birthday_D_00':field==='date'?'DateTime_D_00':'DateTime_D_01';
    const raw=value(field),parts=field==='time'?/^(\d{2}):(\d{2})$/.exec(raw):field==='date'?/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw):/^(?:\d{4}-)?(\d{2})-(\d{2})$/.exec(raw);
    const values=parts?parts.slice(1):field==='date'?['—','—','—']:['—','—'];
    const labels=field==='time'?['Hour','Minute']:field==='date'?['Year','Month','Day']:['Month','Day'];
    const fields=field==='date'?['TextBox_00','TextBox_01','TextBox_02']:['TextBox_01','TextBox_02'];
    const overrides:PaneOverrides={Null_00:{translation:[0,0,0],alpha:255},TextBoxTitle_00:message(field+'_comm')};
    fields.forEach((name,i)=>{overrides[name]={text:labels[i]};overrides[name+'_Value']={text:values[i]};});
    const hideSamples=(panes:NativeLayout['roots'])=>panes.forEach(pane=>{if(/^(Picture_|Number_|Sign_|N_R_)/.test(pane.name))overrides[pane.name]={visible:false};hideSamples(pane.children);});hideSamples(renderer.packs.layout.layouts[layout].roots);
    draw(bottom,'layout',layout+'_ReadOnly',{overrides});
  }else{
    draw(bottom,'up','TextBG_U_00',{center:[160,104.4],scale:.8,bindings:[{name:'TextBG_U_00_TextFadeIn',frame:20}],overrides:{...panelMirrors,TextBox_00:{text:(view.text??[]).join('\n'),fontSize:[18,21.6]}}});
  }
  back();return okay;
}
