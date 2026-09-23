import { objectValue, type AppState, type AppViewRow, type JsonValue } from './app-types.ts';
const value=(input:JsonValue|undefined)=>typeof input==='string'?input:'';
const record=(input:JsonValue|undefined):AppState=>objectValue(input)?input:{};
const entries=(input:JsonValue|undefined):AppState[]=>Array.isArray(input)?input.filter(objectValue):[];
export const browserSettingsRows:readonly (readonly [string,string])[]=[
  ['auto-wrap','Text Wrap'],['search-engine','Search Engine'],['delete-cookies','Delete Cookies'],['clear-history','Delete History'],
  ['network','Network Information'],['proxy','Proxy Settings'],['version','Version Info'],['reset','Clear All Save Data'],
];
const mainRows:readonly (readonly [string,string])[]=[['search','Enter search text'],['bookmarks','Bookmarks'],['add-bookmark','Add'],['settings','Settings'],['page-info','Page Info'],['address','Enter URL']];
export function browserChoices(state:AppState,shared:AppState):AppViewRow[]{
  const screen=value(state.screen)||'main';
  if(screen==='bookmarks'||screen==='history')return entries(record(shared.browser)[screen]).map((entry,index)=>({id:String(index),label:value(entry.title)||value(entry.url),value:value(entry.url)}));
  return (screen==='main'?mainRows:screen==='settings'?browserSettingsRows:[]).map(([id,label])=>({id,label}));
}
function browserState(state:AppState,screen:string,patch:AppState={}):AppState{return {screen,selection:0,url:value(state.url),...patch};}
export function browserNavigate(state:AppState,action:string):AppState{
  const screen=value(state.screen)||'main';
  if(screen==='main')return browserState(state,action);
  if(screen==='settings')return browserState(state,'detail',{parent:screen,field:action});
  if(screen==='bookmarks'||screen==='history')return browserState(state,'page',{parent:screen,entryId:action});
  return state;
}
export function browserBack(state:AppState):AppState{
  const screen=value(state.screen);
  if(screen==='detail'&&state.parent==='settings')return browserState(state,'settings',{selection:Math.max(0,browserSettingsRows.findIndex(([id])=>id===state.field))});
  if(screen==='page'&&(state.parent==='bookmarks'||state.parent==='history'))return browserState(state,state.parent,{selection:/^\d+$/.test(value(state.entryId))?Number(state.entryId):0});
  return browserState(state,'main',{selection:Math.max(0,mainRows.findIndex(([id])=>id===screen))});
}
export function browserPageEntry(state:AppState,shared:AppState):AppState|null{
  if(state.screen!=='page'||(state.parent!=='bookmarks'&&state.parent!=='history')||!/^\d+$/.test(value(state.entryId)))return null;
  const entry=entries(record(shared.browser)[state.parent])[Number(state.entryId)];
  return entry?{title:value(entry.title),url:value(entry.url)}:null;
}
export function browserHeading(state:AppState):string{
  const screen=value(state.screen);
  if(screen==='detail')return browserSettingsRows.find(([id])=>id===state.field)?.[1]??'Settings';
  if(screen==='page')return 'Saved Page';
  if(screen==='history')return 'History';
  return mainRows.find(([id])=>id===screen)?.[1]??'Internet Browser';
}
export function browserText(state:AppState,shared:AppState):string[]{
  const screen=value(state.screen),url=value(state.url);
  if((screen==='bookmarks'||screen==='history')&&!browserChoices(state,shared).length)return [screen==='bookmarks'?'No bookmarks are saved.':'No history is saved.'];
  if(screen==='page'){
    const entry=browserPageEntry(state,shared);
    return entry?[value(entry.title)||value(entry.url),value(entry.url),'Saved address only. Web pages are not loaded.'].filter(Boolean):['This saved entry is unavailable.'];
  }
  if(screen==='page-info')return url?[url,'Only the saved address is available.']:['No page information is available.'];
  if(screen==='address')return [url||'No address is saved.','Address entry is unavailable.'];
  if(screen==='search')return ['Search entry is unavailable.'];
  if(screen==='add-bookmark')return [url||'No page is selected.','Bookmarks cannot be added in this preview.'];
  if(screen==='detail'){
    const text:Record<string,string>={
      'auto-wrap':'Text wrapping preview. No browser preference is stored.',
      'search-engine':'Search engine preview. No browser preference is stored.',
      'delete-cookies':'Read-only preview. No cookies are deleted.',
      'clear-history':'Read-only preview. Saved history is unchanged.',
      network:'No network settings are provided.',proxy:'No proxy settings are provided.',
      version:'No browser version is provided.',reset:'Read-only preview. Saved browser data is unchanged.',
    };
    return [text[value(state.field)]??'Read-only preview.'];
  }
  return [];
}
