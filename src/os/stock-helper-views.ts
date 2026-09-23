import { objectValue, type AppState, type AppViewRow, type JsonValue } from './app-types.ts';
const string=(value:JsonValue|undefined)=>typeof value==='string'?value:'';
export const helperSelectorSources:Record<string,string>={'mii-selector':'miis','photo-selector':'photos','sound-selector':'sounds'};
const selectorNames:Record<string,string>={'mii-selector':'Mii characters','photo-selector':'photos','sound-selector':'sounds'};
const intros:Record<string,readonly string[]>={
  'nnid-settings':['Nintendo Network ID account setup.','Account services are unavailable.'],
  'system-updater':['System Update information.','No update is checked or installed.'],
  'system-transfer':['Choose a source system.','Transfers are unavailable here.'],
  'amiibo-settings':['Choose an amiibo setting.','No amiibo data is connected.'],
  extrapad:['Circle Pad Pro settings.','Accessory input is unavailable here.'],
  manual:['Choose a section of the local guide.'],
};
const details:Record<string,Record<string,readonly string[]>>={
  'system-transfer':{
    '3ds':['Transfer from a Nintendo 3DS System','No console data is connected.'],
    dsi:['Transfer from a Nintendo DSi System','No console data is connected.'],
  },
  'amiibo-settings':{
    register:['Register Owner and Nickname','No amiibo data is connected.'],
    'delete-data':['Delete amiibo Game Data','No amiibo game data is deleted.'],
    reset:['Reset amiibo','No amiibo data is reset.'],
  },
  extrapad:{information:['Circle Pad Pro','Accessory calibration is unavailable.']},
};
const manualPages:Record<string,readonly string[]>={
  contents:['Browse the portfolio from HOME.','Select a title to open it.','B returns to the previous screen.'],
  controls:['A: open the selected item.','B: go back.','HOME: return to HOME Menu.','Touch the lower screen to select.'],
  support:['No application manual was supplied.','This guide covers portfolio controls.'],
};
export function isHelperTitle(id:string):boolean{return Boolean(intros[id]||helperSelectorSources[id]);}
export function helperTitle(id:string,state:AppState):string|undefined{
  if(state.screen==='detail')return details[id]?.[string(state.field)]?.[0];
  if(id==='manual'&&state.screen==='document')return {contents:'Contents',controls:'Controls',support:'Support Information'}[string(state.topic)];
  return undefined;
}
/** Text and saved-item projections only. No account, hardware or network operation. */
export function helperView(id:string,state:AppState,shared:AppState,rows:readonly AppViewRow[]):{text:string[];data:AppState}|null{
  const screen=string(state.screen)||'main',source=helperSelectorSources[id];
  if(source){
    if(screen==='main')return {text:rows.length?['Choose a saved item to view.']:[`No saved ${selectorNames[id]} are available.`],data:{readOnly:true}};
    const items=Array.isArray(shared[source])?shared[source].filter(objectValue):[];
    const field=string(state.field),item=/^\d+$/.test(field)?items[Number(field)]:undefined;
    if(!item)return {text:['This saved item is unavailable.'],data:{readOnly:true,entry:null}};
    const entry:AppState={};for(const key of ['id','name','title'])if(typeof item[key]==='string')entry[key]=item[key];
    const name=string(item.name)||string(item.title);
    return {text:[name||'Saved item','Read-only item information.'],data:{readOnly:true,entry}};
  }
  if(!intros[id])return null;
  if(id==='manual'&&screen==='document')return {text:[...(manualPages[string(state.topic)]??['This guide section is unavailable.'])],data:{readOnly:true}};
  if(screen==='main')return {text:[...intros[id]],data:{readOnly:true}};
  const page=details[id]?.[string(state.field)];
  return {text:page?[...page.slice(1)]:['This information is unavailable.'],data:{readOnly:true}};
}
