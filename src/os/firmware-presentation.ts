import { BitmapFont, loadBitmapFont, loadNativeImage } from './bitmap-font';
import { NativeLayoutRenderer } from './native-renderer';
import type { NativePack, NativePixels, PaneOverrides } from './native-layout';
import { isFolder, rowCount, type MenuState } from './state';

type Context=CanvasRenderingContext2D;
export type FirmwarePresentationAssets={sharedFont:BitmapFont;hudFont:BitmapFont;renderer:NativeLayoutRenderer;diagnostics:string[];dispose():void};
type Manifest={schema:number;firmware:string;fonts:{shared:string;hud:string};home:Record<string,string>};
const homeLayouts={hud:['HudMenu_00'],launcher:['LncBase_D_01','LncBase_U_00','LncCsr_00','LncBtmBtn_02','LncIconFolder_00','LncIconCard_00','LncArw_00']};

export async function loadFirmwarePresentationAssets(manifestUrl='/os/firmware/10.7.0-32E/manifest.json',signal?:AbortSignal):Promise<FirmwarePresentationAssets>{
 const base=new URL(manifestUrl,window.location.href),controller=new AbortController();
 const abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const fonts:BitmapFont[]=[];
 try{
  const json=async <T>(url:string):Promise<T>=>{const response=await fetch(new URL(url,base),{signal:controller.signal});if(!response.ok)throw new Error(`Firmware asset HTTP ${response.status}: ${url}`);return response.json();};
  const manifest=await json<Manifest>(base.href);
  if(manifest.schema!==1||manifest.firmware!=='10.7.0-32E'||!manifest.fonts||!manifest.home)throw new Error('Unsupported firmware presentation manifest');
  const font=async (url:string)=>{const result=await loadBitmapFont(new URL(url,base).href,controller.signal);fonts.push(result);return result;};
  const [sharedFont,hudFont,...loaded]=await Promise.all([font(manifest.fonts.shared),font(manifest.fonts.hud),...['hud','launcher','messages'].map(name=>json<NativePack>(manifest.home[name]))]);
  const packs=Object.fromEntries(['hud','launcher','messages'].map((name,i)=>[name,loaded[i]])) as Record<string,NativePack>;
  const textures:Record<string,Map<string,NativePixels>>={};const decoded=new Map<string,Promise<NativePixels>>();
  await Promise.all(Object.entries(homeLayouts).map(async ([name,names])=>{
   const pack=packs[name];if(pack.schema!==1||!pack.layouts||!pack.animations)throw new Error(`Invalid native pack ${name}`);
   const needed=new Set<string>();
   for(const layout of names){if(!pack.layouts[layout])throw new Error(`Missing native layout ${layout}`);pack.layouts[layout].textures.forEach(n=>needed.add(n));
    for(const [clip,animation] of Object.entries(pack.animations))if(clip.startsWith(layout+'_'))animation.textures.forEach(n=>needed.add(n));}
   const images=new Map<string,NativePixels>();textures[name]=images;
   await Promise.all([...needed].map(async key=>{
    const record=pack.textures[key];if(!record)throw new Error(`Missing texture record ${name}/${key}`);
    let pending=decoded.get(record.url);
    if(!pending){pending=(async()=>{const image=await loadNativeImage(new URL(record.url,base).href,controller.signal);
     if(image.naturalWidth!==record.width||image.naturalHeight!==record.height)throw new Error(`Texture dimensions differ: ${key}`);
     const canvas=document.createElement('canvas');canvas.width=record.width;canvas.height=record.height;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
     const pixels=ctx.getImageData(0,0,record.width,record.height);canvas.width=canvas.height=0;return {width:record.width,height:record.height,data:pixels.data};})();decoded.set(record.url,pending);}
    images.set(key,await pending);
   }));
  }));
  controller.signal.throwIfAborted();
  const renderer=new NativeLayoutRenderer(packs,textures,new Map([['cbf_std.bcfnt',sharedFont as BitmapFont],['Hud.bcfnt',hudFont as BitmapFont]]));
  renderer.diagnostics.push('White-theme animated background remains reconstructed pending native comparison.','Native layout frame selection and alpha inheritance await Azahar comparison.','Portfolio icons/content intentionally differ from stock applications.');
  let disposed=false;
  return {sharedFont:sharedFont as BitmapFont,hudFont:hudFont as BitmapFont,renderer,diagnostics:renderer.diagnostics,dispose(){if(disposed)return;disposed=true;renderer.dispose();fonts.forEach(f=>f.dispose());}};
 }catch(error){controller.abort();fonts.forEach(font=>font.dispose());throw error;}
 finally{signal?.removeEventListener('abort',abort);}
}

/** HOME assembly chooses groups and discrete firmware clip frames explicitly. */
export function createFirmwareHome(assets:FirmwarePresentationAssets){
 const renderer=assets.renderer;
 const message=(table:string,key:string,fallback:string)=>{const data=renderer.packs.messages.messages[table];return data?.messages[data.labels[key]]?.text??fallback;};
 const binding=(name:string,frame:number)=>({name,frame});
 function hud(ctx:Context,date:Date,time:number){
  const table='hud_msbt_LZ',day=message(table,`day_${date.getDate()}`,String(date.getDate()).padStart(2,'0')),month=message(table,`month_${date.getMonth()+1}`,String(date.getMonth()+1).padStart(2,'0'));
  const weekday=message(table,`week_${['sun','mon','tue','wed','thu','fri','sat'][date.getDay()]}`,'');
  const dateText=message(table,'lau_date','%d/%M (%w)').replace('%d',day).replace('%M',month).replace('%w',weekday);
  return renderer.draw(ctx,'hud','HudMenu_00',{bindings:[binding('HudMenu_00_SceneIn',41),binding('HudMenu_00_WhiteBlack',0),binding('HudMenu_00_NetMode',4),binding('HudMenu_00_NetAtn',8),binding('HudMenu_00_Bat',3),binding('HudMenu_00_WalkCoin',time*.06)],overrides:{
   T_NetMode_00:{text:message(table,'lau_connect4','Disabled')},T_Date_00:{text:dateText},T_TimeL_00:{text:String(date.getHours()).padStart(2,'0')},T_TimeR_00:{text:String(date.getMinutes()).padStart(2,'0')},T_Walk_00:{text:'0'},T_Coin_00:{text:'0'}
  }});
 }
 function toolbar(ctx:Context){return renderer.draw(ctx,'launcher','LncBase_D_01',{bindings:[binding('LncBase_D_01_PaletteOut',12),binding('LncBase_D_01_MvsToggle',0)],clip:[0,0,320,212]});}
 function footer(ctx:Context,state:MenuState){
  const occupied=!!state.system?.layout[state.selected],folder=isFolder(state.selected,state)&&!state.opened,two=folder||occupied;
  const active=new Set(two?['N_BtnW_R_02','N_BtnW_L_03']:['N_BtnW_C_01']);
  const overrides:PaneOverrides={};
  const walk=(panes:NativePack['layouts'][string]['roots'])=>panes.forEach(p=>{if(/^N_Btn[WB]_[LRC]+_\d+$/.test(p.name))overrides[p.name]={visible:active.has(p.name)};if(p.text)overrides[p.name]={text:''};walk(p.children);});walk(renderer.packs.launcher.layouts.LncBtmBtn_02.roots);
  const right=state.opened?message('menu_msbt_LZ','lau_2b_close','Close'):two?(state.system?.app&&state.system.app===state.system.layout[state.selected]?'Resume':message('menu_msbt_LZ','lau_2b_folder_open','Open')):message('menu_msbt_LZ','lau_1b_make_folder','Create Folder');
  const left=folder?message('menu_msbt_LZ','lau_2b_folder_setting','Settings'):state.system?.app?'Close software':'';
  for(const prefix of ['T_BtnBW','T_BtnFW','T_BtnPW']){overrides[`${prefix}_C_01`]={text:right};overrides[`${prefix}_R_02`]={text:right};overrides[`${prefix}_L_03`]={text:left};}
  return renderer.draw(ctx,'launcher','LncBtmBtn_02',{bindings:[binding('LncBtmBtn_02_SceneIn',15)],overrides,clip:[0,210,320,30]});
 }
 function tile(ctx:Context,x:number,y:number,size:number,rows:number,folder:boolean){
  const name=folder?'LncIconFolder_00':'LncIconCard_00';
  // Native size clips encode the five icon densities. The sixth uses the smallest authored artwork.
  return renderer.draw(ctx,'launcher',name,{center:[x+size/2,y+size/2],scale:rows>5?size/26:1,bindings:[binding(name+'_Scale',Math.min(5,rows))]});
 }
 function cursor(ctx:Context,x:number,y:number,size:number,rows:number,time:number){
  return renderer.draw(ctx,'launcher','LncCsr_00',{center:[x+size/2,y+size/2],scale:rows>5?size/26:1,bindings:[binding('LncCsr_00_Select',0),binding('LncCsr_00_Scale',Math.min(5,rows)),binding('LncCsr_00_Loop',time*.06)]});
 }
 function arrows(ctx:Context,showLeft:boolean){return renderer.draw(ctx,'launcher','LncArw_00',{bindings:[binding('LncArw_00_Appear',15)],overrides:{N_arwL_00:{visible:showLeft}},clip:[0,33,320,179]});}
 return {hud,toolbar,footer,tile,cursor,arrows,rows:rowCount};
}
