import { apps, getApp } from './apps.ts';
import { initialState, reduceMenu, touchMenu, menuTiles, type MenuState, type Input } from './state.ts';
export type System = {
 phase:'boot'|'home'|'launch'|'app'|'power'|'off'; since:number; sleeping:boolean;
 app:string|null; pending:string|null; item:number; detail:boolean; page:number; photo:number;
 layout:Record<number,string>; muted:boolean; volume:number; dialog:'switch'|'close'|null;
 returnPhase:'home'|'app'; link:string|null; preferences:boolean; preferenceChoice:number;
};
export function createPortfolioState():MenuState {return {...initialState,folders:{},system:{phase:'boot',since:0,sleeping:false,app:null,pending:null,item:0,detail:false,page:0,photo:0,layout:Object.fromEntries(apps.map((app,i)=>[i,app.id])),muted:false,volume:.35,dialog:null,returnPhase:'home',link:null,preferences:false,preferenceChoice:0}};}
export function selectedApp(state:MenuState){return getApp(state.system?.layout[state.selected]);}
export function currentEntry(state:MenuState){const s=state.system;return getApp(s?.app)?.entries[s?.item??0];}
export function launch(state:MenuState,id:string,now:number):MenuState {
 const s=state.system!;if(!getApp(id))return state;
 if(s.app===id)return {...state,panel:null,system:{...s,phase:'app',dialog:null}};
 if(s.app)return {...state,panel:null,system:{...s,pending:id,dialog:'switch'}};
 return {...state,opened:false,panel:null,system:{...s,phase:'launch',since:now,app:id,item:0,detail:false,page:0,photo:0,dialog:null,pending:null}};
}
export function tickSystem(state:MenuState,now:number,reduced=false):MenuState {
 const s=state.system;if(!s||s.sleeping)return state;
 const duration=s.phase==='boot'?(reduced?300:3000):s.phase==='launch'?(reduced?120:1100):Infinity;
 return now-s.since>=duration?{...state,system:{...s,phase:s.phase==='boot'?'home':'app'}}:state;
}
export function reduceSystem(state:MenuState,input:Input,now:number):MenuState {
 const s=state.system;if(!s)return reduceMenu(state,input);
 const change=(patch:Partial<System>):MenuState=>({...state,system:{...s,link:null,...patch}});
 if(input==='power')return s.phase==='off'?{...state,powered:true,panel:null,system:{...s,phase:'boot',since:now,sleeping:false,app:null,dialog:null}}:change({phase:'power',preferences:false,returnPhase:s.phase==='app'?'app':'home',dialog:null});
 if(s.phase==='off'||s.sleeping||s.phase==='boot'||s.phase==='launch')return state;
 if(input==='mute')return change({muted:!s.muted});
 if(input==='volume-up'||input==='volume-down')return change({volume:Math.max(0,Math.min(1,s.volume+(input==='volume-up'?.1:-.1)))});
 if(input==='preferences')return change({preferences:!s.preferences});
 if(s.preferences){
  if(input==='back'||input==='home')return change({preferences:false});
  if(input==='up'||input==='down')return change({preferenceChoice:Math.max(0,Math.min(2,s.preferenceChoice+(input==='down'?1:-1)))});
  if(input==='left'||input==='right')return reduceSystem(state,input==='left'?'volume-down':'volume-up',now);
  if(input==='open'&&s.preferenceChoice===2)return reduceSystem(state,'reset-layout',now);
  if(input==='reset-layout')return {...state,folders:{},selected:0,system:{...s,layout:createPortfolioState().system!.layout}};
  if(input==='open')return change({muted:!s.muted});
  return state;
 }
 if(s.phase==='power'){
  if(input==='back'||input==='home')return change({phase:s.returnPhase});
  if(input==='open')return {...change({phase:'off',app:null}),powered:false,panel:null};
  return state;
 }
 if(s.dialog){
  if(input==='back')return change({dialog:null,pending:null});
  if(input==='open'){
   const closed={...state,system:{...s,app:null,dialog:null,pending:null,phase:'home' as const}};
   return s.pending?launch(closed,s.pending,now):closed;
  }return state;
 }
 if(input==='home')return {...state,panel:null,opened:false,system:{...s,phase:s.phase==='app'?'home':s.app?'app':'home'}};
 if(s.phase==='app'){
  const entry=currentEntry(state);const app=getApp(s.app)!;
  if(input==='back')return s.detail?change({detail:false,page:0,photo:0}):change({phase:'home'});
  if(input==='open')return s.detail?(entry?.app?launch(state,entry.app,now):entry?.url?change({link:entry.url}):change({detail:false})):change({detail:true,page:0,photo:0});
  if(input==='up'||input==='down')return s.detail?change({page:Math.max(0,Math.min((entry?.pages.length??1)-1,s.page+(input==='down'?1:-1)))}):change({item:Math.max(0,Math.min(app.entries.length-1,s.item+(input==='down'?1:-1))),photo:0});
  if(input==='left'||input==='right')return change({photo:Math.max(0,Math.min((entry?.images?.length??1)-1,s.photo+(input==='right'?1:-1)))});
  if(input==='brightness')return reduceMenu(state,input);
  return state;
 }
 if(input==='open'&&!state.panel&&!state.opened){const app=selectedApp(state);if(app)return launch(state,app.id,now);}
 if(input==='back'&&!state.panel&&s.app)return change({dialog:'close'});
 return reduceMenu(state,input);
}
const toolbarApps:Record<string,string>={notes:'about',friends:'contact',notifications:'hackuk',browser:'projects',miiverse:'life'};
export function touchSystem(state:MenuState,x:number,y:number,now:number):MenuState {
 const s=state.system;if(!s)return touchMenu(state,x,y);
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>=320||y<0||y>=240||s.sleeping||s.phase==='off'||s.phase==='boot'||s.phase==='launch')return state;
 const send=(input:Input)=>reduceSystem(state,input,now);
 if(s.preferences){if(y>=212)return send('back');if(y>=53&&y<92)return send('mute');if(y>=106&&y<147)return send(x<160?'volume-down':'volume-up');if(y>=165&&y<204)return send('reset-layout');return state;}
 if(s.phase==='power'||s.dialog)return y>=170?send(x<160?'back':'open'):state;
 if(s.phase==='app'){
  if(y>=212){if(x<100)return send('back');if(x>220)return send('open');return s.detail&&(currentEntry(state)?.images?.length??0)>1?send(x<160?'left':'right'):state;}
  if(s.detail){if(y>=174)return send(x<160?'up':'down');if(y<32)return send(x<160?'left':'right');return state;}
  const first=Math.floor(s.item/4)*4,index=first+Math.floor((y-38)/41);
  if(y>=38&&y<202&&index<getApp(s.app)!.entries.length)return index===s.item?send('open'):{...state,system:{...s,item:index,photo:0}};
  if(y<32)return send(x<160?'up':'down');return state;
 }
 if(!state.panel&&y>=212&&!state.opened&&selectedApp(state))return x<100&&s.app?{...state,system:{...s,dialog:'close'}}:send('open');
 if(!state.panel&&!state.opened&&y>=33&&y<204){const tile=menuTiles(state).find(t=>x>=t.x&&x<Math.min(308,t.x+t.size)&&y>=t.y&&y<t.y+t.size);if(tile&&s.layout[tile.index])return tile.index===state.selected?send('open'):{...state,selected:tile.index};}
 // The drawer handle doubles as audio control; no extra page chrome.
 if(state.panel==='settings'&&x>=265&&y>=145&&y<201)return send('preferences');
 const next=touchMenu(state,x,y);const target=next.panel&&toolbarApps[next.panel];
 return target?launch({...next,panel:null},target,now):next;
}
export function moveApp(state:MenuState,from:number,to:number):MenuState {
 const s=state.system;if(!s||!s.layout[from]||to<0||to>=300||state.folders[to]!==undefined)return state;
 const layout={...s.layout};const previous=layout[to];layout[to]=layout[from];if(previous)layout[from]=previous;else delete layout[from];
 return {...state,selected:to,system:{...s,layout}};
}
export const STORAGE_KEY='paramveer-3ds-v1';
export function saveSettings(state:MenuState){const s=state.system!;return JSON.stringify({theme:state.theme,brightness:state.brightness,columns:state.columns,powerSaving:state.powerSaving,folders:state.folders,layout:s.layout,muted:s.muted,volume:s.volume});}
export function restoreSettings(state:MenuState,raw:string|null):MenuState {
 if(!raw)return state;
 try{const v=JSON.parse(raw);const ids=Object.values(v.layout??{});if(ids.length!==apps.length||new Set(ids).size!==apps.length||!ids.every(id=>getApp(String(id)))||!Object.keys(v.layout).every(k=>/^\d+$/.test(k)&&+k<300))return state;
 const folders=Object.fromEntries(Object.entries(v.folders??{}).filter(([k,value])=>/^\d+$/.test(k)&&+k<300&&typeof value==='string'&&!v.layout[k]).slice(0,60).map(([k,value])=>[k,String(value).slice(0,16)]));
 return {...state,folders,powerSaving:v.powerSaving===true,theme:['white','red','blue','yellow','pink','black'].includes(v.theme)?v.theme:'white',brightness:[.2,.4,.6,.8,1].includes(v.brightness)?v.brightness:1,columns:[3,4,6,8,10,12].includes(v.columns)?v.columns:4,system:{...state.system!,layout:v.layout,muted:v.muted===true,volume:typeof v.volume==='number'&&Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):.35}};
 }catch{return state;}
}
