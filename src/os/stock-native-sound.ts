import type { AppView, JsonValue } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { soundLibraryRows, soundPlaybackMode, soundSeekBar, stockScreenTargets, type SoundPlaybackMode } from './stock-screen-layout';
import { nativeMessageOverride } from './native-layout';

const prefix='packs/sound/contents/0000-0000000b/';
export const soundScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'lyt-S_BG-arc-LZ.json',alias:'sound-bg',layouts:['S_BG','S_BG_D-Grid'],animations:['S_BG_D-Grid_Default']},
  {url:prefix+'lyt-S_Play_D-arc-LZ.json',alias:'sound-player',layouts:['S_Play_D-CtrPanel3','S_Play_D-Effect'],animations:['S_Play_D-CtrPanel3_Default','S_Play_D-Effect_Default']},
  {url:prefix+'lyt-C-Sld.json',alias:'sound-slider',layouts:['C_SldT'],animations:['C_SldT_Default','C_SldT_Rate']},
  {url:prefix+'lyt-C-Dlg.json',alias:'sound-dialog',layouts:['C_Dlg','C_Dlg1BtnB','C_DlgTxt'],animations:['C_Dlg1BtnB_Default']},
  {url:prefix+'lyt-S_Common-arc-LZ.json',alias:'sound-common',layouts:['S_Common-BackBtn','S_Common-OpenBtn','S_Common-BrwCursor'],animations:['S_Common-BackBtn_Default','S_Common-OpenBtn_Default','S_Common-BrwCursor_Default']},
  {url:prefix+'lyt-S_Inf_U-arc-LZ.json',alias:'sound-info',layouts:['S_Inf_U-TitleBar','S_Inf_U-TrackNameU','S_Inf_U-TrackNameD','S_Inf_U-PlayTime','S_Inf_U-UnderBar'],animations:['S_Inf_U-TitleBar_TitleLeftIn','S_Inf_U-TrackNameU_In','S_Inf_U-TrackNameD_In']},
  {url:prefix+'lyt-Parakeet-arc-LZ.json',alias:'sound-bird',layouts:['ParakeetA_U'],animations:['ParakeetA_U_Wait']},
  {url:prefix+'msg-EU_English.json',alias:'sound-messages',layouts:[],animations:[]},
];
type RecordValue=Record<string,JsonValue>;
const record=(value:JsonValue|undefined):RecordValue=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const str=(value:JsonValue|undefined)=>typeof value==='string'?value:'';
const num=(value:JsonValue|undefined)=>typeof value==='number'&&Number.isFinite(value)?value:0;
const duration=(value:number)=>`${Math.floor(Math.max(0,value)/60)}:${String(Math.floor(Math.max(0,value)%60)).padStart(2,'0')}`;
/** S_Play_D-CtrPanel3 PacIconM_Opt* panes by source texture: 0 NoLoop, 1 Folder, 2 Random, 3 OneTime, 4 Single, 5 ABLoop. */
const loopIconPane:Record<SoundPlaybackMode,number>={'no-loop':0,folder:1,random:2,single:4};
/** C_SldT_Rate moves S_Rate from x −140 to 140 across its 280 source frames. */
export const soundSliderRateFrames=280;
export const soundSliderFrame=(fraction:number)=>Math.round(Math.max(0,Math.min(1,fraction))*soundSliderRateFrames);

/** Original Sound artwork at its source mounts with portfolio track content.
 * Playback uses the native transport, playback-mode panel, C_SldT time slider and
 * the resting S_Play_D-Effect panel; the library uses the source list cursor and
 * Open button. The speed/pitch plate, filters, pull cord, recording, percussion,
 * visualisers and native screen sequencing are outside this view.
 */
export function drawNativeSoundFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId!=='sound')return false;
  const message=(bank:string,label:string)=>nativeMessageOverride(renderer.packs['sound-messages'],bank,label,'');
  const data=view.data??{},tracks=Array.isArray(data.tracks)?data.tracks.map(record):[],track=record(data.track),playback=view.screen==='playback';
  const selected=playback?track:tracks[view.selection]??{},hasSelection=Object.keys(selected).length>0;
  const text=(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size=14,align:CanvasTextAlign='center')=>{
    if(options.font)options.font.draw(ctx,value,x,y,size,'#665529',align);
    else{ctx.fillStyle='#665529';ctx.font=`${size}px sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y);}
  };
  let okay=true;
  const draw=(ctx:CanvasRenderingContext2D,pack:string,layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,pack,layout,opts)&&okay;};
  draw(top,'sound-bg','S_BG');draw(bottom,'sound-bg','S_BG_D-Grid',{bindings:[{name:'S_BG_D-Grid_Default',frame:0}]});
  // DefUndBar carries PlyTimeTxt during playback; its battery/clock HUD slots are not composed here.
  if(playback)draw(top,'sound-info','S_Inf_U-UnderBar');
  draw(top,'sound-info','S_Inf_U-TitleBar',{bindings:[{name:'S_Inf_U-TitleBar_TitleLeftIn',frame:5}],overrides:{TitlTxt:message('S','C_T_00')}});
  // Track panels belong to a highlighted or playing song; an empty library shows none.
  if(hasSelection)draw(top,'sound-info','S_Inf_U-TrackNameU',{bindings:[{name:'S_Inf_U-TrackNameU_In',frame:1}],overrides:{TrkNamTxtU0:{text:str(selected.title),size:[390,30]},TrkNamTxtU1:{visible:false},TrkNamTxtT:{visible:false}}});
  const artwork=str(selected.artwork);
  if(!artwork||!options.image?.(top,artwork,158,87,84,84))draw(top,'sound-bird','ParakeetA_U',{bindings:[{name:'ParakeetA_U_Wait',frame:0}],center:[200,127]});
  if(hasSelection)draw(top,'sound-info','S_Inf_U-TrackNameD',{bindings:[{name:'S_Inf_U-TrackNameD_In',frame:1}],overrides:{TrkNamTxtD0:{text:[str(selected.artist),str(selected.album)].filter(Boolean).join(' · '),size:[390,30]},TrkNamTxtD1:{visible:false}}});
  if(playback){
    const total=num(data.duration)||num(track.duration),position=num(data.position),fraction=total>0?Math.max(0,Math.min(1,position/total)):0;
    draw(top,'sound-info','S_Inf_U-PlayTime',{overrides:{PlyTimeTxt:{text:duration(position)+' / '+duration(total)}}});
    // C_SldT is mounted by CtrPanel3's -L-C_SldT pane; A/B loop handles stay closed as in the source ABIn start state.
    draw(bottom,'sound-slider','C_SldT',{center:[soundSeekBar.x+soundSeekBar.width/2,soundSeekBar.y+soundSeekBar.height/2],bindings:[{name:'C_SldT_Default',frame:20},{name:'C_SldT_Rate',frame:soundSliderFrame(fraction)}],overrides:{'AS-':{visible:false},'BS-':{visible:false},Mask:{visible:false}}});
    const mode=soundPlaybackMode(data);
    draw(bottom,'sound-player','S_Play_D-CtrPanel3',{bindings:[{name:'S_Play_D-CtrPanel3_Default',frame:0}],overrides:{
      IconBig3C_0_P0:{visible:data.playing===true},IconBig3C_1_P0:{visible:data.playing!==true},
      ...Object.fromEntries([0,1,2,3,4,5].map(index=>[`PacIconM_Opt${index}_P0`,{visible:loopIconPane[mode]===index}])),
    }});
    // Resting playback mode 0: the executable brings Effect in when the speed/pitch plate or
    // filter closes. Its two buttons open audio-altering surfaces, so they stay inert here.
    draw(bottom,'sound-player','S_Play_D-Effect',{bindings:[{name:'S_Play_D-Effect_Default',frame:0}]});
  }else{
    const rows=stockScreenTargets(view).filter(r=>r.row!==undefined);
    if(view.rows.length)draw(bottom,'sound-common','S_Common-BrwCursor',{bindings:[{name:'S_Common-BrwCursor_Default',frame:0}],center:[160,120+(view.selection%soundLibraryRows)*39]});
    for(const r of rows){const row=view.rows[r.row!];text(bottom,row.label,r.x+20,r.y+12,13,'left');text(bottom,row.value??'',r.x+20,r.y+27,10,'left');}
    if(view.rows.length&&view.footer.right)draw(bottom,'sound-common','S_Common-OpenBtn',{bindings:[{name:'S_Common-OpenBtn_Default',frame:0}],overrides:{TxtC:message('S','P_B_02')}});
  }
  draw(bottom,'sound-common','S_Common-BackBtn',{bindings:[{name:'S_Common-BackBtn_Default',frame:0}],overrides:{TxtC:message('S',playback?'C_B_02':'C_B_01')}});
  if(data.mediaError===true){
    // Source S_dlg "Could not play." on the common one-button dialog; OK is its only control.
    draw(bottom,'sound-dialog','C_Dlg');
    draw(bottom,'sound-dialog','C_DlgTxt',{overrides:{DlgTxt:message('S_dlg','C_ErrPlay')}});
    draw(bottom,'sound-dialog','C_Dlg1BtnB',{bindings:[{name:'C_Dlg1BtnB_Default',frame:20}],overrides:{Dlg1TxtB:message('S_dlg','C_B_ErrPlay')}});
  }
  return okay;
}
