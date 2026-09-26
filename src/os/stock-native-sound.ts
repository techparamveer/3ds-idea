import type { AppView, JsonValue } from './app-types';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';
import { soundLibraryRows, soundPlaybackMode, soundSeekBar, stockScreenTargets, type SoundPlaybackMode } from './stock-screen-layout';
import { nativeMessageOverride, poseNativeLayout, type NativeLayout } from './native-layout';
import { drawNativeSoundRecordBackground, soundRecordLayoutSelection } from './stock-sound-record';

const prefix='packs/sound/contents/0000-0000000b/';
export const soundScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:prefix+'lyt-S_BG-arc-LZ.json',alias:'sound-bg',layouts:['S_BG','S_BG_D-Grid','S_BG_D-Ctr',...soundRecordLayoutSelection.layouts],animations:['S_BG_D-Grid_Default',...soundRecordLayoutSelection.animations]},
  {url:prefix+'lyt-S_Play_D-arc-LZ.json',alias:'sound-player',layouts:['S_Play_D-CtrPanel3','S_Play_D-Effect'],animations:['S_Play_D-CtrPanel3_Default','S_Play_D-Effect_Default']},
  {url:prefix+'lyt-C-Sld.json',alias:'sound-slider',layouts:['C_SldT','C_SldH_L'],animations:['C_SldT_Default','C_SldT_Rate','C_SldH_L_Default','C_SldH_L_Rate']},
  {url:prefix+'lyt-C-Dlg.json',alias:'sound-dialog',layouts:['C_Dlg','C_Dlg1BtnB','C_DlgTxt','C_DlgChA','C_DlgGuid1BtnW','C_DlgGuid2Btn'],animations:['C_Dlg1BtnB_Default','C_DlgGuid1BtnW_Default','C_DlgGuid2Btn_Default']},
  {url:prefix+'lyt-S_Guid_U-arc-LZ.json',alias:'sound-guide-upper',layouts:['S_Guid03_U'],animations:[]},
  {url:prefix+'lyt-S_Common-arc-LZ.json',alias:'sound-common',layouts:['S_Common-BackBtn','S_Common-OpenBtn','S_Common-BrwCursor','S_Common-OpLBtn','S_Common-OpRBtn','S_Common-SetBtn','S_Common-Text','S_Common-IconList'],animations:['S_Common-BackBtn_Default','S_Common-OpenBtn_Default','S_Common-BrwCursor_Default','S_Common-BackBtn_Disable','S_Common-OpLBtn_Default','S_Common-OpRBtn_Disable','S_Common-SetBtn_Default','S_Common-IconList_IconCHG']},
  {url:prefix+'lyt-S_Inf_U-arc-LZ.json',alias:'sound-info',layouts:['S_Inf_U-TitleBar','S_Inf_U-TrackNameU','S_Inf_U-TrackNameD','S_Inf_U-PlayTime','S_Inf_U-UnderBar','S_Inf_U-Hour','S_Inf_U-Battery'],animations:['S_Inf_U-TitleBar_TitleLeftIn','S_Inf_U-TrackNameU_In','S_Inf_U-TrackNameD_In']},
  {url:prefix+'lyt-Parakeet-arc-LZ.json',alias:'sound-bird',layouts:['ParakeetA_U','ParakeetA_D'],animations:['ParakeetA_U_Wait','ParakeetA_D_Wait']},
  {url:prefix+'lyt-C-Hud.json',alias:'sound-hud',layouts:['C_HudBut_B','C_HudSndB'],animations:['C_HudBut_B_Pattern','C_HudSndB_Pattern']},
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

/** Source S_ColConf_D BtnRst reset blue is the entry theme adaptation.
 * The title alone uses a captured RGB fit; native runtime colour binding is unverified.
 * Only the sixth theme register is replaced, on an owned posed layout. */
export function soundEntryBlue(layout:NativeLayout,titleBarCaptureFit=false):NativeLayout{
  const posed=structuredClone(layout);
  for(const material of posed.materials)if(material.constantColors[5]?.join(',')==='57,170,213,255')material.constantColors[5]=titleBarCaptureFit&&['TitBar','TitBarBvlL','TitBarBvlC'].includes(material.name)?[41,113,238,255]:[42,113,235,255];
  return posed;
}

/** RI.mstl word +8 stores the source message colour as little-endian RGBA. */
export function soundGuideMessageColor(value:ReturnType<typeof nativeMessageOverride>):number[]|null{
  const word=value.messageStyle?.unresolvedWords?.['8'];
  return typeof word==='number'&&Number.isInteger(word)&&word>=0&&word<=0xffffffff
    ?[word&255,(word>>>8)&255,(word>>>16)&255,(word>>>24)&255]:null;
}

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
  // Settled SD-absent entry captured in native EUR Sound. Recording, StreetPass,
  // Add and Settings are presentation-only here; supplied-song views keep their player.
  // The room CGFX and source 2D Record backdrop are separate source layers.
  if(!playback&&!tracks.length){
    const entry=(ctx:CanvasRenderingContext2D,pack:string,layout:string,opts:Parameters<NativeLayoutRenderer['draw']>[3]={},messageColors:Readonly<Record<string,readonly number[]>>={})=>{
      const source=renderer.packs[pack]?.layouts?.[layout];
      if(!source){draw(ctx,pack,layout,opts);return;}
      const posed=soundEntryBlue(poseNativeLayout(source,renderer.packs[pack].animations,opts.bindings,opts.overrides),pack==='sound-info'&&layout==='S_Inf_U-TitleBar');
      const tone=(panes:typeof posed.roots)=>{for(const pane of panes){const color=messageColors[pane.name];if(color&&pane.text){pane.text.topColor=[...color];pane.text.bottomColor=[...color];}tone(pane.children);}};
      tone(posed.roots);
      okay=renderer.drawLayout(ctx,pack,layout,posed,{...opts,bindings:[]})&&okay;
    };
    // These two full-label source messages contain 80% / restore-100% scale tags.
    const smallLabel=(label:string)=>{const value=message('S',label);return {...value,messageStyle:value.messageStyle?{...value.messageStyle,fontScale:value.messageStyle.fontScale.map(v=>v*.8)}:undefined};};

    entry(top,'sound-bg','S_BG');entry(bottom,'sound-bg','S_BG');
    if(options.soundRoom)okay=options.soundRoom.draw(top)&&okay;
    // The same original Record layout draws on both LCDs in the settled,
    // SD-absent entry capture, behind the entry chrome.
    okay=drawNativeSoundRecordBackground(renderer,top,'top')&&okay;
    okay=drawNativeSoundRecordBackground(renderer,bottom,'bottom')&&okay;
    entry(top,'sound-info','S_Inf_U-TitleBar',{bindings:[{name:'S_Inf_U-TitleBar_TitleLeftIn',frame:5}],overrides:{TitlTxt:{text:message('S','C_T_00').text,translation:[-104,104,0],size:[240,23]}}});
    // The settled native SD-absent capture places the Wait sprites five to six
    // LCD pixels above the uncorrected source-layout mounts at these x positions.
    for(const x of [35,94])entry(top,'sound-bird','ParakeetA_U',{bindings:[{name:'ParakeetA_U_Wait',frame:0}],center:[x,192]});
    entry(bottom,'sound-bird','ParakeetA_D',{bindings:[{name:'ParakeetA_D_Wait',frame:0}],center:[21,123]});
    entry(top,'sound-info','S_Inf_U-UnderBar');
    entry(top,'sound-hud','C_HudSndB',{center:[7,228],bindings:[{name:'C_HudSndB_Pattern',frame:0}]});
    entry(top,'sound-hud','C_HudBut_B',{center:[51,228],bindings:[{name:'C_HudBut_B_Pattern',frame:4}]});
    const date=options.date??new Date(),clock=String(date.getHours()).padStart(2,'0')+' '+String(date.getMinutes()).padStart(2,'0');
    entry(top,'sound-info','S_Inf_U-Hour',{overrides:{TextBox_00:{text:clock,fontSize:[18,21.6],size:[72,30],translation:[-36,-108,0]}}});
    entry(top,'sound-info','S_Inf_U-PlayTime',{overrides:{PlyTimeTxt:{text:'0:00:00 / 0:00:00'}}});
    // The settled native SD-absent capture places this row two LCD pixels above
    // the raw layout origin. Move its source cursor, icon and text together.
    // Native settled capture samples cursor texture 9 at frame 18.
    entry(bottom,'sound-common','S_Common-BrwCursor',{center:[160,118],bindings:[{name:'S_Common-BrwCursor_Default',frame:18}]});
    entry(bottom,'sound-common','S_Common-IconList',{center:[43,47],bindings:[{name:'S_Common-IconList_IconCHG',frame:0}]});
    // S_Common-Text is mounted independently of the row artwork. Its native
    // glyph mask is one LCD pixel left/up of the raw layout composition.
    entry(bottom,'sound-common','S_Common-Text',{center:[55,46],overrides:{Null:{text:message('S','P_BR_00').text,size:[264,30],translation:[132,0,0]}}});
    entry(bottom,'sound-slider','C_SldH_L',{center:[160,159],bindings:[{name:'C_SldH_L_Default',frame:20},{name:'C_SldH_L_Rate',frame:0}]});
    entry(bottom,'sound-bg','S_BG_D-Ctr');
    entry(bottom,'sound-common','S_Common-OpLBtn',{bindings:[{name:'S_Common-OpLBtn_Default',frame:0}],overrides:{TxtC:smallLabel('C_B_04')}});
    entry(bottom,'sound-common','S_Common-OpRBtn',{bindings:[{name:'S_Common-OpRBtn_Disable',frame:1}],overrides:{TxtC:message('S','P_B_03')}});
    entry(bottom,'sound-common','S_Common-OpenBtn',{bindings:[{name:'S_Common-OpenBtn_Default',frame:0}],overrides:{TxtC:message('S','P_B_00')}});
    entry(bottom,'sound-common','S_Common-SetBtn',{bindings:[{name:'S_Common-SetBtn_Default',frame:0}],overrides:{TxtMiniT_W_P0:smallLabel('C_B_03')}});
    entry(bottom,'sound-common','S_Common-BackBtn',{bindings:[{name:'S_Common-BackBtn_Disable',frame:1}],overrides:{TxtC:message('S','C_B_02')}});
    if(view.screen==='guide'){
      const page=Math.max(0,Math.min(2,num(data.guidePage))),first=page===0;
      // S_tips D_001_0..2 and the two C_Dlg guide button variants belong to
      // the EUR Sound content, as does the volume picture on page three.
      if(page===2)entry(top,'sound-guide-upper','S_Guid03_U');
      // -L-DlgGuid in the source guide button layout mounts C_DlgChA at the
      // identity transform. Its own Bird pane supplies the captured parakeet.
      draw(bottom,'sound-dialog','C_DlgChA');
      // S_tips Guide_D_00_00 and _01 bracket two registers at the shared
      // source anchor: / {total} is left-anchored, {page} is right-anchored.
      // The 1×1 source panes expand to the RI.mstl 48px message width here;
      // the 24px raster height remains a capture-fit adapter.
      const total=message('S_tips','Guide_D_00_00'),current=message('S_tips','Guide_D_00_01');
      const counterWidth=total.messageStyle?.unresolvedWords?.['0'];
      if(counterWidth!==48||current.messageStyle?.unresolvedWords?.['0']!==48)throw new Error('Missing Sound guide counter width');
      const common={TxtDlg:message('S_tips',`D_001_${page}`),TxtNumber0:{...total,text:total.text+'3',size:[counterWidth,24]},TxtNumber1:{...current,text:`${page+1}${current.text}`,size:[counterWidth,24]}};
      if(first){
        const button=message('S_tips','Guide_D_N_Btn0');
        const bodyColor=soundGuideMessageColor(common.TxtDlg),buttonColor=soundGuideMessageColor(button);
        entry(bottom,'sound-dialog','C_DlgGuid1BtnW',{bindings:[{name:'C_DlgGuid1BtnW_Default',frame:0}],overrides:{...common,Guid1TxtW:button}},
          {...(bodyColor?{TxtDlg:bodyColor}:{}),...(buttonColor?{Guid1TxtW:buttonColor}:{})});
      }
      else entry(bottom,'sound-dialog','C_DlgGuid2Btn',{bindings:[{name:'C_DlgGuid2Btn_Default',frame:0}],overrides:{...common,Guid2TxtB:message('S_tips','Guide_D_BN_Btn0'),Guid2TxtW:message('S_tips',page===2?'Guide_D_BO_Btn1':'Guide_D_BN_Btn1')}});
    }
    return okay;
  }
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
