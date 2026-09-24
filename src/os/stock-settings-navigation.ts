import { objectValue, type AppState, type AppViewRow } from './app-types.ts';

type Choice=readonly [id:string,label:string];
const settingsMenus:Record<string,readonly Choice[]>={
  main:[['internet','Internet Settings'],['parental','Parental Controls'],['data','Data Management'],['other','Other Settings'],['nnid','Nintendo Network ID Settings']],
  internet:[['connections','Connection Settings'],['spotpass','SpotPass'],['ds-connections','Nintendo DS Connections'],['internet-info','Other Information']],
  connections:[['connection-1','Connection 1'],['connection-2','Connection 2'],['connection-3','Connection 3'],['new-connection','New Connection']],
  parental:[['next','Set'],['back','Back']],
  'parental-explain':[['next','Next'],['back','Back']],
  // Native notice OK continues to PIN setup. The portfolio dismisses it instead.
  'parental-pin-notice':[['back','OK']],
  restrictions:[['rating','Software Rating'],['browser','Internet Browser'],['shopping','Nintendo 3DS Shopping Services'],['3d','Display of 3D Images'],['sharing','Sharing Images / Audio / Video / Long Text Data'],['interaction','Online Interaction'],['friend-registration','Friend Registration'],['download-play','DS Download Play'],['streetpass-restriction','StreetPass'],['videos','Viewing Distributed Videos'],['miiverse','Miiverse']],
  data:[['data-3ds','Nintendo 3DS'],['data-dsi','Nintendo DSiWare'],['streetpass','StreetPass Management'],['blocked-users','Reset blocked-user settings']],
  'data-3ds':[['software','Software'],['extra-data','Extra Data'],['add-on-content','Add-on Content'],['backup','Save Data Backup']],
  profile:[['nickname','User Name'],['birthday','Date of Birth'],['region','Region Settings'],['ds-profile','Nintendo DS Profile']],
  clock:[['date',"Today's Date"],['time','Current Time']],
};
/** Three-button portfolio grouping uses native original-model components.
 * Resource files do not establish the executable page order. */
export const settingsOtherPages:readonly (readonly Choice[])[]=[
  [['profile','Profile'],['clock','Date & Time'],['touch','Touch Screen']],
  [['calibration-3d','3D Calibration'],['sound','Sound'],['mic','Mic Test']],
  [['outer-cameras','Outer Cameras'],['circle-pad','Circle Pad'],['transfer','System Transfer']],
  [['language','Language'],['update','System Update'],['format','Format System Memory']],
];
const menuParents:Record<string,string>={internet:'main',connections:'internet',parental:'main','parental-explain':'parental','parental-pin-notice':'parental-explain',restrictions:'parental',data:'main','data-3ds':'data',other:'main',profile:'other',clock:'other'};
const names:Record<string,string>={main:'System Settings',internet:'Internet Settings',connections:'Connection Settings',parental:'Parental Controls','parental-explain':'Parental Controls','parental-pin-notice':'Parental Controls',restrictions:'Parental Controls Settings',data:'Data Management','data-3ds':'Nintendo 3DS',other:'Other Settings',profile:'Profile',clock:'Date & Time'};
const settingsValueFields=new Set(['nickname','birthday','region','sound','language','date','time']);
const screenOf=(state:AppState)=>typeof state.screen==='string'?state.screen:'main';
export function settingsPage(state:AppState):number{return typeof state.page==='number'&&Number.isFinite(state.page)?Math.max(0,Math.min(settingsOtherPages.length-1,Math.floor(state.page))):0;}
export function settingsChoices(state:AppState,prefs:AppState):AppViewRow[]{
  const screen=screenOf(state),choices=screen==='other'?settingsOtherPages[settingsPage(state)]:settingsMenus[screen]??[];
  return choices.map(([id,label])=>({id,label,...(settingsValueFields.has(id)&&typeof prefs[id]==='string'&&prefs[id]!==''?{value:prefs[id] as string}:{})}));
}
export function settingsHeading(state:AppState):string{
  const screen=screenOf(state);
  if(screen!=='detail')return names[screen]??'System Settings';
  const parent=typeof state.parent==='string'?state.parent:'main';
  return settingsChoices({screen:parent,page:state.page},{}).find(row=>row.id===state.field)?.label??'System Settings';
}
function menuState(screen:string,page=0,selection=0):AppState{return {screen,selection,...(screen==='other'?{page}:{})};}
export function settingsBack(state:AppState):AppState{
  const screen=screenOf(state),parent=screen==='detail'&&typeof state.parent==='string'?state.parent:menuParents[screen]??'main';
  const child=screen==='detail'?state.field:['parental-explain','parental-pin-notice','restrictions'].includes(screen)?'next':screen;
  const next=menuState(parent,settingsPage(state));
  const index=settingsChoices(next,{}).findIndex(row=>row.id===child);
  return {...next,selection:Math.max(0,index)};
}
export function settingsNavigate(state:AppState,action:string):AppState{
  const screen=screenOf(state);
  if(screen==='detail'&&state.field==='language'&&(action==='language-up'||action==='language-down')){
    // Source list 0x19f044 / 0x1983d4: arrows move one row within 8−4.
    // This is viewport navigation only; configured language stays immutable.
    const top=typeof state.languageTop==='number'&&Number.isFinite(state.languageTop)?Math.max(0,Math.min(4,Math.floor(state.languageTop))):0;
    const next=Math.max(0,Math.min(4,top+(action==='language-down'?1:-1)));
    return next===top?state:{...state,languageTop:next};
  }
  if(screen==='other'&&(action==='settings-next'||action==='settings-previous')){
    const page=Math.max(0,Math.min(settingsOtherPages.length-1,settingsPage(state)+(action==='settings-next'?1:-1)));
    return page===settingsPage(state)?state:menuState('other',page);
  }
  if(!settingsChoices(state,{}).some(row=>row.id===action))return state;
  if(screen==='parental'&&action==='next')return menuState('parental-explain');
  if(screen==='parental-explain'&&action==='next')return menuState('parental-pin-notice');
  if(settingsMenus[action]||action==='other')return menuState(action);
  return {screen:'detail',selection:0,field:action,parent:screen,...(screen==='other'?{page:settingsPage(state)}:{})};
}
export function settingsText(state:AppState,shared:AppState):string[]{
  const screen=screenOf(state);
  if(screen==='parental')return ['View the features covered by Parental Controls.'];
  if(screen==='parental-explain')return ['If a child will be using this system, please set it up for them.'];
  if(screen==='parental-pin-notice')return ['If you forget your PIN and the answer to your secret question, you will be unable to remove Parental Controls restrictions without first obtaining a master key.'];
  if(screen!=='detail')return [];
  const field=typeof state.field==='string'?state.field:'',prefs=objectValue(shared.settings)?shared.settings:{};
  if(settingsValueFields.has(field))return [typeof prefs[field]==='string'&&prefs[field]!==''?prefs[field] as string:'Not set in this portfolio.'];
  const descriptions:Record<string,string>={
    spotpass:'View SpotPass settings.', 'ds-connections':'View connections for Nintendo DS software.', 'internet-info':'View internet connection information.',
    'new-connection':'Connection setup is unavailable in this portfolio.', 'data-dsi':'No Nintendo DSiWare data is provided.',
    streetpass:'No StreetPass software data is provided.', 'blocked-users':'Read-only preview. Blocked-user settings are unchanged.',
    // mset dat_no_software / dat_no_option: the accessible, empty SD state.
    software:'There is no accessible software data.', 'extra-data':'There is no extra data.', 'add-on-content':'No add-on content is provided.', backup:'No save data backups are provided.',
    'ds-profile':'No Nintendo DS profile is provided.', format:'Read-only preview. System data is unchanged.',
    touch:'Touch Screen calibration preview.',mic:'Mic Test preview.', 'calibration-3d':'3D Calibration preview.', 'outer-cameras':'Outer Cameras calibration preview.', 'circle-pad':'Circle Pad calibration preview.',
  };
  if(field.startsWith('connection-'))return ['No connection details are provided.'];
  if(state.parent==='restrictions')return ['Read-only preview. No restriction is applied.'];
  return [descriptions[field]??'Read-only preview.'];
}
