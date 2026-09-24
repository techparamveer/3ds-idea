import { objectValue, type AppState, type AppViewRow, type AppEvent } from './app-types.ts';

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
// Native touch entry shows the Other buttons in their frame-0 white pose; a
// logical first row is retained so A can still activate Profile immediately.
function menuState(screen:string,page=0,selection=0):AppState{return {screen,selection,...(screen==='other'?{page,selectionActive:false}:{})};}
export function settingsBack(state:AppState):AppState{
  const screen=screenOf(state),parent=screen==='detail'&&typeof state.parent==='string'?state.parent:menuParents[screen]??'main';
  // Native user_info/date_time return by reconstructing basic_top1. Its
  // manager starts at logical Profile while all three Select clips stay at
  // frame 0 until directional input (settings-other-focus-source-audit.md).
  if(parent==='other'&&(screen==='profile'||screen==='clock'))return menuState('other',0);
  const child=screen==='detail'?state.field:['parental-explain','parental-pin-notice','restrictions'].includes(screen)?'next':screen;
  const next=menuState(parent,settingsPage(state));
  const index=settingsChoices(next,{}).findIndex(row=>row.id===child);
  return {...next,selection:Math.max(0,index),...(parent==='other'?{selectionActive:true}:{})};
}
// The two source Country scroll clips span frames 0..3. Nominal 60 Hz is
// the browser clock adapter; native input-to-display latency is not measured.
export const LANGUAGE_SCROLL_DURATION_MS=50;
export function languageScroll(state:AppState):{from:number;to:number;direction:-1|1;frame:number}|null{
  if(state.screen!=='detail'||state.field!=='language'||(state.languageScrollDirection!==-1&&state.languageScrollDirection!==1)||typeof state.languageScrollElapsed!=='number'||!Number.isFinite(state.languageScrollElapsed))return null;
  const from=typeof state.languageTop==='number'&&Number.isFinite(state.languageTop)?Math.max(0,Math.min(4,Math.floor(state.languageTop))):0;
  const to=from+state.languageScrollDirection;if(to<0||to>4)return null;
  return {from,to,direction:state.languageScrollDirection,frame:Math.max(0,Math.min(3,Math.floor(state.languageScrollElapsed*60/1000)))};
}
const languageTop=(state:AppState)=>typeof state.languageTop==='number'&&Number.isFinite(state.languageTop)?Math.max(0,Math.min(4,Math.floor(state.languageTop))):0;
export const settingsLanguageOffset=(state:AppState)=>typeof state.languageDragOffset==='number'&&Number.isFinite(state.languageDragOffset)?Math.max(-22,Math.min(22,state.languageDragOffset)):0;
export function settingsLanguageThumbY(state:AppState):number{
  return typeof state.languageTop==='number'&&Number.isFinite(state.languageTop)?20-(languageTop(state)*44+settingsLanguageOffset(state))*40/176:0;
}
const languageDragging=(state:AppState)=>typeof state.languageDragStartY==='number'&&Number.isFinite(state.languageDragStartY)&&typeof state.languageDragThumbY==='number'&&Number.isFinite(state.languageDragThumbY);
/** Browser pointer capture around source slider 0x1f38c0 and list 0x1f03d8.
 * Thumb geometry is supplied by stock-screen-layout; configuration is untouched. */
export function settingsLanguageTouch(state:AppState,event:Extract<AppEvent,{type:'touch'}>,thumbHit:boolean):AppState|null{
  if(state.screen!=='detail'||state.field!=='language')return null;
  const dragging=languageDragging(state);
  if(dragging&&state.languageDragPointer!==(event.pointerId??0))return state;
  if(event.phase==='cancel')return dragging?settingsLanguageSettle(state):null;
  if(!Number.isFinite(event.x)||!Number.isFinite(event.y))return dragging?state:null;
  if(event.phase==='down'){
    if(dragging)return state;
    if(!thumbHit)return null;
    if(languageScroll(state)||settingsLanguageOffset(state)!==0)return state;
    return {...state,languageDragStartY:event.y,languageDragThumbY:settingsLanguageThumbY(state),languageDragPointer:event.pointerId??0};
  }
  if(!dragging)return null;
  if(event.phase==='up'){
    // Native release keeps the last applied sample and enters list mode 5.
    const {languageDragStartY:_start,languageDragThumbY:_thumb,languageDragPointer:_pointer,...rest}=state;
    const offset=settingsLanguageOffset(state);
    return offset===0?rest:{...rest,languageSnapFrom:offset,languageSnapElapsed:0};
  }
  // 0x1f38c0 clamps thumb travel to ±20. 0x1f03d8 rounds at half a
  // 44-pixel row and retains the signed fraction for Null_Slideanim.
  const y=Math.max(-20,Math.min(20,(state.languageDragThumbY as number)-event.y+(state.languageDragStartY as number)));
  const f=Math.fround,ratio=f(1-f(f(y+20)/40)),rows=f(f(ratio*176)/44);
  let top=Math.trunc(rows),offset=f(f(rows-top)*44);
  if(offset>=22){top++;offset=f(offset-44);}
  return {...state,languageTop:top,languageDragOffset:offset};
}
/** Cancellation/suspension is a browser adaptation: settle and release ownership. */
export function settingsLanguageSettle(state:AppState):AppState{
  const settled=settingsLanguageTick(state,LANGUAGE_SCROLL_DURATION_MS);
  if(!languageDragging(settled)&&settingsLanguageOffset(settled)===0&&settled.languageSnapFrom===undefined)return settled;
  const {languageDragStartY:_start,languageDragThumbY:_thumb,languageDragPointer:_pointer,languageDragOffset:_offset,languageSnapFrom:_from,languageSnapElapsed:_elapsed,...rest}=settled;
  return rest;
}
export function settingsLanguageTick(state:AppState,elapsed:number):AppState{
  if(!Number.isFinite(elapsed)||elapsed<=0||languageDragging(state))return state;
  if(typeof state.languageSnapFrom==='number'&&Number.isFinite(state.languageSnapFrom)&&settingsLanguageOffset(state)!==0){
    const previous=typeof state.languageSnapElapsed==='number'&&Number.isFinite(state.languageSnapElapsed)?Math.max(0,state.languageSnapElapsed):0;
    const next=previous+elapsed,frames=Math.floor(next*60/1000);
    // Source mode 5 (0x1f01c8) moves the residual by 8 pixels per update.
    const offset=Math.sign(state.languageSnapFrom)*Math.max(0,Math.abs(state.languageSnapFrom)-frames*8);
    if(offset!==0)return {...state,languageSnapElapsed:next,languageDragOffset:offset};
    const {languageDragOffset:_offset,languageSnapFrom:_from,languageSnapElapsed:_elapsed,...rest}=state;return rest;
  }
  const scroll=languageScroll(state);if(!scroll)return state;
  const next=Math.max(0,state.languageScrollElapsed as number)+elapsed;
  if(next<LANGUAGE_SCROLL_DURATION_MS)return {...state,languageScrollElapsed:next};
  const {languageScrollDirection:_direction,languageScrollElapsed:_elapsed,...rest}=state;
  return {...rest,languageTop:scroll.to};
}
export function settingsNavigate(state:AppState,action:string):AppState{
  const screen=screenOf(state);
  if(screen==='detail'&&state.field==='language'&&(action==='language-up'||action==='language-down')){
    // Source 0x19f044 blocks arrows while either clip runs; 0x1983d4/0x198434
    // commit one row only after completion. Configuration stays immutable.
    if(languageScroll(state)||languageDragging(state)||settingsLanguageOffset(state)!==0)return state;
    const top=typeof state.languageTop==='number'&&Number.isFinite(state.languageTop)?Math.max(0,Math.min(4,Math.floor(state.languageTop))):0;
    const next=Math.max(0,Math.min(4,top+(action==='language-down'?1:-1)));
    return next===top?state:{...state,languageTop:top,languageScrollDirection:action==='language-down'?1:-1,languageScrollElapsed:0};
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
