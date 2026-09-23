import type { AppView, JsonValue } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { stockScreenTargets } from './stock-screen-layout';
import { nativeMessageOverride } from './native-layout';

const prefix='packs/sound/contents/0000-0000000b/';
export const soundScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'lyt-S_BG-arc-LZ.json',alias:'sound-bg',layouts:['S_BG','S_BG_D-Grid'],animations:['S_BG_D-Grid_Default']},
  {url:prefix+'lyt-S_Play_D-arc-LZ.json',alias:'sound-player',layouts:['S_Play_D-CtrPanel3'],animations:['S_Play_D-CtrPanel3_Default']},
  {url:prefix+'lyt-S_Common-arc-LZ.json',alias:'sound-common',layouts:['S_Common-BackBtn','S_Common-BrwCursor'],animations:['S_Common-BackBtn_Default','S_Common-BrwCursor_Default']},
  {url:prefix+'lyt-S_Inf_U-arc-LZ.json',alias:'sound-info',layouts:['S_Inf_U-TitleBar','S_Inf_U-TrackNameU','S_Inf_U-TrackNameD','S_Inf_U-PlayTime'],animations:['S_Inf_U-TitleBar_TitleLeftIn','S_Inf_U-TrackNameU_In','S_Inf_U-TrackNameD_In']},
  {url:prefix+'lyt-Parakeet-arc-LZ.json',alias:'sound-bird',layouts:['ParakeetA_U'],animations:['ParakeetA_U_Wait']},
  {url:prefix+'msg-EU_English.json',alias:'sound-messages',layouts:[],animations:[]},
];
type RecordValue=Record<string,JsonValue>;
const record=(value:JsonValue|undefined):RecordValue=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const str=(value:JsonValue|undefined)=>typeof value==='string'?value:'';
const num=(value:JsonValue|undefined)=>typeof value==='number'&&Number.isFinite(value)?value:0;
const duration=(value:number)=>`${Math.floor(Math.max(0,value)/60)}:${String(Math.floor(Math.max(0,value)%60)).padStart(2,'0')}`;

/** Original Sound artwork with portfolio track content and shared control targets.
 * Transport is repositioned to the current adapter's hit regions; native screen
 * sequencing and the original recording/effects surfaces are outside this view.
 */
export function drawNativeSoundFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId!=='sound')return false;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['sound-messages'],'S',label,'');
  const data=view.data??{},tracks=Array.isArray(data.tracks)?data.tracks.map(record):[],track=record(data.track),selected=Object.keys(track).length?track:tracks[view.selection]??{};
  const text=(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size=14,align:CanvasTextAlign='center')=>{
    if(options.font)options.font.draw(ctx,value,x,y,size,'#665529',align);
    else{ctx.fillStyle='#665529';ctx.font=`${size}px sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y);}
  };
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,opts)&&okay;};
  draw(top,'sound-bg','S_BG');draw(bottom,'sound-bg','S_BG_D-Grid',{bindings:[{name:'S_BG_D-Grid_Default',frame:0}]});
  draw(top,'sound-info','S_Inf_U-TitleBar',{bindings:[{name:'S_Inf_U-TitleBar_TitleLeftIn',frame:5}],overrides:{TitlTxt:message('C_T_00')}});
  draw(top,'sound-info','S_Inf_U-TrackNameU',{bindings:[{name:'S_Inf_U-TrackNameU_In',frame:1}],overrides:{TrkNamTxtU0:{...(str(selected.title)?{text:str(selected.title)}:message('C_T_03')),size:[390,30]},TrkNamTxtU1:{visible:false},TrkNamTxtT:{visible:false}}});
  const artwork=str(selected.artwork);
  if(!artwork||!options.image?.(top,artwork,158,87,84,84))draw(top,'sound-bird','ParakeetA_U',{bindings:[{name:'ParakeetA_U_Wait',frame:0}],center:[200,127]});
  draw(top,'sound-info','S_Inf_U-TrackNameD',{bindings:[{name:'S_Inf_U-TrackNameD_In',frame:1}],overrides:{TrkNamTxtD0:{text:data.mediaError===true?(view.text?.[0]??''):[str(selected.artist),str(selected.album)].filter(Boolean).join(' · '),size:[390,30]},TrkNamTxtD1:{visible:false}}});
  if(view.screen==='playback'){
    const total=num(data.duration)||num(track.duration),position=num(data.position),fraction=total>0?Math.max(0,Math.min(1,position/total)):0;
    draw(top,'sound-info','S_Inf_U-PlayTime',{overrides:{PlyTimeTxt:{text:duration(position)+' / '+duration(total)}}});
    text(bottom,str(track.title),160,43,16);text(bottom,str(track.artist),160,66,12);
    bottom.fillStyle='#d5c89c';bottom.fillRect(30,104,260,5);bottom.fillStyle='#94812e';bottom.fillRect(30,104,Math.max(1,260*fraction),5);bottom.beginPath();bottom.arc(30+260*fraction,106,6,0,2*Math.PI);bottom.fill();
    text(bottom,duration(position),30,89,10,'left');text(bottom,duration(total),290,89,10,'right');
    draw(bottom,'sound-player','S_Play_D-CtrPanel3',{bindings:[{name:'S_Play_D-CtrPanel3_Default',frame:0}],overrides:{
      '-O-C-Big3C_P0':{translation:[0,55,0]},'-B-Big3L_P0':{translation:[-40,54,0]},'-B-Big3R_P0':{translation:[40,54,0]},
      '-O-C-MiniP0':{visible:false},IconBig3C_0_P0:{visible:data.playing===true},IconBig3C_1_P0:{visible:data.playing!==true},
    }});
    for(const r of stockScreenTargets(view).filter(r=>r.action==='repeat'||r.action==='shuffle')){
      bottom.fillStyle='#fbf4d6';bottom.strokeStyle='#b2a473';bottom.beginPath();bottom.roundRect(r.x,r.y,r.width,r.height,4);bottom.fill();bottom.stroke();
      text(bottom,r.action==='repeat'?'Repeat '+(str(data.repeat)||'off'):'Shuffle '+(data.shuffle?'on':'off'),r.x+r.width/2,r.y+r.height/2,12);
    }
  }else{
    if(view.rows.length)draw(bottom,'sound-common','S_Common-BrwCursor',{bindings:[{name:'S_Common-BrwCursor_Default',frame:0}],center:[160,128.5+(view.selection%4)*39]});
    for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){
      const row=view.rows[r.row!];text(bottom,row.label,r.x+20,r.y+12,13,'left');text(bottom,row.value??'',r.x+20,r.y+27,10,'left');
    }
    if(!view.rows.length)text(bottom,'No music added',160,116,16);
  }
  draw(bottom,'sound-common','S_Common-BackBtn',{bindings:[{name:'S_Common-BackBtn_Default',frame:0}],overrides:{TxtC:message(view.screen==='main'?'C_B_01':'C_B_02')}});
  if(view.footer.right){bottom.fillStyle='#fbf4d6';bottom.strokeStyle='#b2a473';bottom.beginPath();bottom.roundRect(172,215,145,23,4);bottom.fill();bottom.stroke();text(bottom,message('P_B_00').text??view.footer.right.label,245,226,13);}
  return okay;
}
