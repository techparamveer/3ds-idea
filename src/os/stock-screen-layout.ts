import type { AppView, JsonValue } from './app-types';
import { cameraStripOffset, readCameraBrowse, CAMERA_BROWSE_PAGE_WIDTH } from './camera-browse.ts';

/** Bounded four-row HOME Settings adapter; later native rows are not yet routed. */
export const HOME_SETTINGS_MAX_SCROLL = 140;
export const clampHomeSettingsScroll = (value = 0): number => Number.isFinite(value) ? Math.max(0, Math.min(HOME_SETTINGS_MAX_SCROLL, value)) : 0;
export type HomeSettingsAction = 'back' | 'themes' | 'home-layouts' | 'brightness-1' | 'brightness-2' | 'brightness-3' | 'brightness-4' | 'brightness-5' | 'power-saving-off' | 'power-saving-on';
export type HomeSettingsTarget = { action: HomeSettingsAction; choice: number; x: number; y: number; width: number; height: number };
/** home.petit PtDlgCnt_CTR mounts plus each child B_* pane, in lower-LCD coordinates. */
export function homeSettingsTargets(scroll = 0): HomeSettingsTarget[] {
  const offset = clampHomeSettingsScroll(scroll);
  const targets: HomeSettingsTarget[] = [
    { action: 'back', choice: -1, x: 0, y: 202, width: 44, height: 38 },
    { action: 'themes', choice: 0, x: 51, y: 43 - offset, width: 202, height: 56 },
    { action: 'home-layouts', choice: 1, x: 51, y: 149 - offset, width: 202, height: 38 },
    ...[71, 112, 152, 192, 233].map((x, index) => ({ action: `brightness-${index + 1}` as HomeSettingsAction, choice: 2,
      x: x - (index === 0 || index === 4 ? 20 : 19), y: 237 - offset, width: index === 0 || index === 4 ? 40 : 38, height: 38 })),
    { action: 'power-saving-off', choice: 3, x: 51, y: 309 - offset, width: 100, height: 38 },
    { action: 'power-saving-on', choice: 3, x: 153, y: 309 - offset, width: 100, height: 38 },
  ];
  return targets.filter(r => r.y < 240 && r.y + r.height > 0).map(r => ({ ...r, y: Math.max(0, r.y), height: Math.min(240, r.y + r.height) - Math.max(0, r.y) }));
}
export function homeSettingsActionAt(scroll: number, x: number, y: number): HomeSettingsAction | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= 320 || y < 0 || y >= 240) return null;
  return homeSettingsTargets(scroll).find(r => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height)?.action ?? null;
}
/** PtSlideBar/B_Groove_00 is 24x206 at (276,120); track-to-scroll mapping is a browser adapter. */
export function homeSettingsScrollAt(x: number, y: number): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 264 || x >= 288 || y < 17 || y > 223) return null;
  return clampHomeSettingsScroll((y - 17) / 206 * HOME_SETTINGS_MAX_SCROLL);
}
/** Keep the selected source row fully visible; motion timing is not native-verified. */
export function homeSettingsChoiceScroll(choice: number, scroll = 0): number {
  const offset = clampHomeSettingsScroll(scroll), bounds = [[38, 104], [128, 192], [216, 280], [288, 352]][choice];
  if (!bounds) return offset;
  if (choice === 0) return 0;
  return clampHomeSettingsScroll(bounds[0] < offset ? bounds[0] : bounds[1] > offset + 240 ? bounds[1] - 240 : offset);
}
/** MyMenu_D_00/N_Thumb_00..07 plus MyMenuBtn_D_00/B_Thumb_00 (66x82). */
export function homeSavedLayoutSlotAt(x: number, y: number): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  for (let slot = 0; slot < 8; slot++) {
    const left = 13 + slot % 4 * 76, top = 21 + Math.floor(slot / 4) * 92;
    if (x >= left && x < left + 66 && y >= top && y < top + 82) return slot;
  }
  return null;
}
/** MyMenuBtmBtn_D_00 native footer labels: Y Load, X Save/Overwrite; top-right deletes. */
export function homeSavedLayoutActionAt(x: number, y: number): 'back' | 'save' | 'load' | 'delete' | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= 320 || y < 0 || y >= 240) return null;
  if (x >= 286 && y < 38) return 'delete';
  if (y < 211 || y >= 239) return null;
  if (x < 40) return 'back';
  if (x < 160) return 'load';
  if (x < 280) return 'save';
  return null;
}

/** Source S_Play_D loop icons: NoLoop, Folder, Single and Random. OneTime and ABLoop have no portfolio state. */
export type SoundPlaybackMode='no-loop'|'folder'|'single'|'random';
export const soundPlaybackMode=(state:Readonly<Record<string,JsonValue|undefined>>):SoundPlaybackMode=>state.shuffle===true?'random':state.repeat==='all'?'folder':state.repeat==='one'?'single':'no-loop';
/** The single mode control cycles the four supported icons; this ordering is a portfolio choice, not a verified native sequence. */
export const soundNextPlaybackMode:Record<SoundPlaybackMode,{repeat:string;shuffle:boolean}>={'no-loop':{repeat:'all',shuffle:false},folder:{repeat:'one',shuffle:false},single:{repeat:'off',shuffle:true},random:{repeat:'off',shuffle:false}};

/** R_SlideBar B_Slide_00 is 24×104 at the source mount (304,101).
 * The thumb follows local y; Canvas/touch y points downwards. */
export function stockSettingsLanguageThumbAt(thumbY:number,x:number,y:number):boolean{
  return Number.isFinite(thumbY)&&Number.isFinite(x)&&Number.isFinite(y)&&x>=292&&x<316&&y>=49-thumbY&&y<153-thumbY;
}

/**
 * Source Game Notes (0004003000009c02) ImageScreenUp display modes. The scene constructor (code.bin 0x168880) starts at
 * Double (mode 3) and B_BtnSwitch (handler 0x163754) advances the index 0→1→2→0, dispatching events {1,2,3} =
 * SwitchDouble→SwitchUp→SwitchDown. See docs/native-notes-switch-source-audit.md.
 */
export type NotesCaptureView='double'|'up'|'down';
/** Source Switch clips have frames 0–25. The browser samples at nominal 60 Hz;
 * this is not a measurement of native wall-clock timing. */
export const NOTES_SWITCH_LAST_FRAME=25;
export const NOTES_SWITCH_DURATION_MS=NOTES_SWITCH_LAST_FRAME*1000/60;
export function notesSwitchFrame(state:Readonly<Record<string,JsonValue|undefined>>):number{
  const elapsed=state.captureSwitchElapsed;
  return typeof elapsed==='number'&&Number.isFinite(elapsed)?Math.min(NOTES_SWITCH_LAST_FRAME,Math.max(0,Math.floor(elapsed*60/1000+1e-8))):NOTES_SWITCH_LAST_FRAME;
}
export const notesCaptureView=(state:Readonly<Record<string,JsonValue|undefined>>):NotesCaptureView=>state.captureView==='up'||state.captureView==='down'?state.captureView:'double';
export const notesNextCaptureView:Record<NotesCaptureView,NotesCaptureView>={double:'up',up:'down',down:'double'};

/** Logical lower-LCD rectangles shared by presentation and UI navigation. */
export type StockScreenTarget = {action:string;x:number;y:number;width:number;height:number;row?:number};
const target=(action:string,x:number,y:number,width:number,height:number,row?:number):StockScreenTarget=>({action,x,y,width,height,...(row===undefined?{}:{row})});
/** Sound library rows: S_Common-BrwCursor's source mount (y 49) is the first row centre; the pitch is a portfolio adaptation. */
export const soundLibraryRows=3;
export const soundLibraryRowTop=(index:number)=>31.5+index*39;
/** Source C_SldT time slider mounted by S_Play_D-CtrPanel3 at y −39: AB- bound 280×18, handle S_Rate travels x −140…140. */
export const soundSeekBar={x:20,y:150,width:280,height:18};
/** Source PicPosRengeL and PageRengeL: 228 px cell range, 248 px page stride. */
export const cameraBrowsePane={x:46,y:41,width:228,height:132};
export function cameraBrowseCellRect(index:number,offset:number):[number,number,number,number]{
  return [53+(index%3)*76+Math.floor(index/6)*CAMERA_BROWSE_PAGE_WIDTH-offset,50+Math.floor(index%6/3)*66,62,48];
}
/** First Settings Manual row uses the captured Contents mount and source
 * 272×37 Bounding_00. Page footer bounds come from BtnClose01/BtnBack00. */
export function applicationManualTargets(view:AppView):StockScreenTarget[]{
  return view.screen==='document'
    ?[target('manual-close',0,212,40,28),target('back',40,212,140,28)]
    :[...(view.data?.manualTitleId==='0004001000022000'?[target('manual-page-0',24,67.5,272,37)]:[]),target('back',0,212,160,28)];
}
export function stockScreenTargets(view:AppView):StockScreenTarget[]{
  const {appId,screen,rows,selection}=view, result:StockScreenTarget[]=[];
  // Camera C_DlgGuid BB hit panes: first 128×40 at (160,204), paired 88×40 at (112/208,204).
  if(appId==='camera'&&screen==='guide')return [...(view.footer.left?[target('back',68,184,88,40)]:[]),target('guide-next',view.footer.left?164:96,184,view.footer.left?88:128,40)];
  if(appId==='sound'&&screen==='guide')return [...(view.footer.left?[target('back',67,184,90,44)]:[]),target('guide-next',view.footer.left?163:135,184,view.footer.left?90:130,44)];
  if(appId==='manual'&&view.data?.manualTitleId)return applicationManualTargets(view);
  if(appId==='manual')return screen==='main'?[...rows.slice(0,3).map((row,index)=>target(row.id,24,56.5+44*index,272,37,index)),target('back',0,212,320,28)]:[target('back',40,212,140,28)];
  if(appId==='mii-selector')return [target('back',5,215,155,24)];
  if(appId==='photo-selector'||appId==='sound-selector')return [target('back',20,202,88,28)];
  if(appId==='amiibo-settings')return [target('back',0,212,320,28)];
  if(appId==='nnid-settings')return [target('back',0,212,64,28)];
  if(appId==='system-updater')return [target('back',0,208,120,32)];
  if(appId==='system-transfer'){
    result.push(target('back',0,208,120,32));
    if(screen==='main')rows.forEach((row,index)=>{const y=row.id==='3ds'?18:row.id==='dsi'?110:null;if(y!==null)result.push(target(row.id,27,y,266,64,index));});
    return result;
  }
  if(appId==='extrapad')return screen==='main'?[target('back',0,212,160,28),target('information',160,212,160,28,0)]:[target('back',0,212,320,28)];
  if(appId==='system-settings'&&screen==='parental-pin-notice')return [target('back',10,188,300,40,0)];
  if(appId==='system-settings'&&screen==='main'){
    const locations:Record<string,number[]>={nnid:[4,0,312,33],internet:[16,38,140,78],parental:[164,38,140,78],data:[16,123,140,78],other:[164,123,140,78]};
    rows.forEach((row,index)=>{const rect=locations[row.id];if(rect)result.push(target(row.id,rect[0],rect[1],rect[2],rect[3],index));});
  }else if(appId==='system-settings'&&(screen==='internet'||screen==='parental'||screen==='parental-explain')){
    const rects=screen==='internet'?[[28,23,264,66],[28,106,264,26],[28,139,264,26],[28,172,264,26]]:[[200,208,120,32],[0,208,120,32]];
    rows.forEach((row,index)=>{const r=rects[index];if(r)result.push(target(row.id,r[0],r[1],r[2],r[3],index));});
    if(screen==='internet'&&view.footer.left)result.push(target(view.footer.left.action,0,208,120,32));
    return result;
  }else if(appId==='system-settings'&&screen!=='main'){
    const rects=screen==='data'?[[19,17,146,78],[177,17,126,78],[28,109,264,38],[28,171,264,26]]:screen==='profile'||screen==='data-3ds'?[[28,37,264,38],[28,82,264,38],[28,127,264,38],[28,173,264,26]]:screen==='other'?[[35,50,249,41],[35,98,249,41],[35,146,249,41]]:screen==='clock'?[[28,27,264,66],[28,123,264,66]]:[];
    if(screen==='connections'){
      const locations:Record<string,number[]>={'new-connection':[28,19,264,66],'connection-1':[12,117,92,70],'connection-2':[114,117,92,70],'connection-3':[216,117,92,70]};
      rows.forEach((row,index)=>{const r=locations[row.id];if(r)result.push(target(row.id,r[0],r[1],r[2],r[3],index));});
    }else if(screen==='restrictions'){
      const start=Math.floor(selection/4)*4;rows.slice(start,start+4).forEach((row,i)=>result.push(target(row.id,28,24+i*44,264,38,start+i)));
    }else rows.forEach((row,index)=>{const r=rects[index];if(r)result.push(target(row.id,r[0],r[1],r[2],r[3],index));});
    if(screen==='other'){
      const page=typeof view.data?.page==='number'?view.data.page:0;
      // The four numbered tabs accept direct lower-screen touch in native Settings.
      for(let index=0;index<4;index++)result.push(target(`settings-page-${index}`,88+index*40,8,24,24));
      if(page>0)result.push(target('settings-previous',0,65,30,100));
      if(page<3)result.push(target('settings-next',290,65,30,100));
    }
    if(screen==='detail'&&view.data?.field==='language'){
      // R_SlideBar B_Up_00/B_Dw_00: 24×24 at (304,101) ±84.
      result.push(target('language-up',292,5,24,24),target('language-down',292,173,24,24));
    }
    if(view.footer.left)result.push(target(view.footer.left.action,0,208,screen==='detail'&&view.data?.field==='ds-profile'?320:120,32));
    return result;
  }else if(appId==='eshop'){
    return [target('ok',85,193,150,33)];
  }else if(appId==='nintendo-zone'){
    if(screen==='main')result.push(target('scan',29,30,262,86,0),target('information',29,136,262,36,1));
    result.push(target('back',0,212,106,28));return result;
  }else if(appId==='health-safety'&&screen==='document'){
    // BtmBtn_White B_Btn_00: 320×28 bounding pane, origin bottom-centre at (0,−120).
    return view.footer.left?[target(view.footer.left.action,0,212,320,28)]:[];
  }else if(appId==='health-safety'&&screen==='main'){
    rows.slice(0,3).forEach((row,index)=>result.push(target(row.id,36,21+index*64,248,48,index)));
  }else if(appId==='browser'&&screen==='main'){
    const locations:Record<string,number[]>={search:[16,38,288,64],bookmarks:[16,111,144,42],'add-bookmark':[160,111,144,42],settings:[9,164,100,34],'page-info':[110,164,100,34],address:[211,164,100,34]};
    rows.forEach((row,index)=>{const r=locations[row.id];if(r)result.push(target(row.id,r[0],r[1],r[2],r[3],index));});
    if(view.footer.left)result.push(target(view.footer.left.action,0,212,106,28));
    return result;
  }else if(appId==='miiverse'){
    if(screen==='main')rows.slice(0,4).forEach((row,index)=>result.push(target(row.id,index*64,212,64,28,index)));
    if(view.footer.left)result.push(target(view.footer.left.action,256,212,64,28));
    return result;
  }else if((appId==='camera'||appId==='camera-applet')&&(screen==='main'||screen==='gallery')){
    const offset=screen==='gallery'?cameraStripOffset(readCameraBrowse(view.data?.cameraBrowse).output):Math.floor(selection/6)*CAMERA_BROWSE_PAGE_WIDTH;
    // Camera 0x2de524 places PicPosRengeL (228×132) in 3×2 at
    // -PhoMntPos (0,+13); BB-Thmb is 62×48. See camera-grid-source-audit.md.
    rows.forEach((row,index)=>{
      const [x,y,width,height]=cameraBrowseCellRect(index,offset);
      const left=Math.max(x,cameraBrowsePane.x),right=Math.min(x+width,cameraBrowsePane.x+cameraBrowsePane.width);
      if(right>left)result.push(target(row.id,left,y,right-left,height,index));
    });
    // Native browse chrome shows Slideshow/Shoot/Settings. Those operations
    // are excluded from the read-only portfolio; B/HOME retain return access.
    return result;
  }else if((appId==='camera'||appId==='camera-applet')&&screen==='photo'){
    // P_BrwsPhoMntBase paints the photo mount with no arrow controls. Keep
    // physical left/right navigation; don't retain invisible arrow hit boxes.
  }else if(appId==='sound'){
    // The SD-absent entry is read-only: record/StreetPass/settings do not request devices or writes.
    if(screen==='main'&&Array.isArray(view.data?.tracks)&&view.data.tracks.length===0)return [];
    // Source S_dlg dialog: C_Dlg1BtnB BB-Dlg1BtnB (128×40 at y −84) is the only control while "Could not play." is shown.
    if(view.data?.mediaError===true)return [target('error-ok',96,184,128,40)];
    if(screen==='playback'){
      // S_Play_D-CtrPanel3 bounds BB-Big3L_P0, CB-Big3C_P0, BB-Big3R_P0 and the CB-MiniP0 playback-mode panel at their native mounts.
      result.push(target('previous',98,178,33,60),target('play',133,178,54,60),target('next',189,178,33,60),target('mode',230,210,90,28));
    }else{
      // Three two-line rows keep clear of the S_Common-OpenBtn CB-Open (124×60 at y −89); the first row centre is BrwCursor's source mount.
      const start=Math.floor(selection/soundLibraryRows)*soundLibraryRows;
      rows.slice(start,start+soundLibraryRows).forEach((row,i)=>result.push(target(row.id,18,soundLibraryRowTop(i),284,35,start+i)));
      if(view.footer.right&&rows.length)result.push(target(view.footer.right.action,98,178,124,60));
    }
    if(view.footer.left)result.push(target(view.footer.left.action,0,210,90,30)); // S_Common-BackBtn CB-Back
    return result;
  }else if(appId==='friends'&&(screen==='profile'||screen==='main'&&rows.length===1&&rows[0].id==='profile')){
    if(screen==='main')result.push(target('profile',107,114,106,66,0));
    if(view.footer.left)for(const [width,height]of [[110,32],[150,27],[186,22],[214,17],[242,12],[270,6]])result.push(target(view.footer.left.action,(320-width)/2,240-height,width,height));
    return result;
  }else if(appId==='game-notes'&&screen==='drawing'){
    // MemoWriteDown bounding panes: B_BtnBack origin 6 at (−160,−120) and B_BtnSwitch origin 7 at (92,−120), both 44×28.
    return [target('back',0,212,44,28),target('switch',230,212,44,28)];
  }else if(appId==='game-notes'&&screen==='main'){
    const start=Math.floor(selection/16)*16;
    rows.slice(start,start+16).forEach((row,i)=>result.push(target(row.id,7+(i%4)*79,8+Math.floor(i/4)*51,70,44,start+i)));
    if(view.footer.left)result.push(target(view.footer.left.action,0,212,320,28));
    return result;
  }else if(appId==='memo'&&screen==='main'){
    const start=Math.floor(selection/16)*16;
    rows.slice(start,start+16).forEach((row,i)=>result.push(target(row.id,17+(i%4)*73,37+Math.floor(i/4)*41,67,36,start+i)));
  }else if(appId!=='notifications'&&screen!=='document'&&screen!=='detail'){
    const start=Math.floor(selection/4)*4;
    rows.slice(start,start+4).forEach((row,i)=>result.push(target(row.id,18,40+i*39,284,35,start+i)));
  }
  if(appId==='notifications'&&screen==='main'){
    const first=Math.max(0,Math.min(rows.length-1,selection)-Math.min(3,Math.max(0,selection)));
    if(view.footer.left)result.push(target(view.footer.left.action,0,212,320,28));
    rows.slice(first,first+4).forEach((row,i)=>result.push(target(row.id,0,27+i*53,288,53,first+i)));
    return result;
  }
  if(appId==='browser'){if(view.footer.left)result.push(target(view.footer.left.action,0,212,106,28));return result;}
  if(view.footer.left)result.push(target(view.footer.left.action,0,214,150,26));
  if(view.footer.right)result.push(target(view.footer.right.action,170,214,150,26));
  return result;
}
export function stockScreenActionAt(view:AppView,x:number,y:number):string|null{
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  return stockScreenTargets(view).find(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height)?.action??null;
}
/** The player owns seek seconds; this function only maps its displayed track. */
export function stockScreenSeekAt(view:AppView,x:number,y:number):number|null{
  const bar=soundSeekBar;
  if(view.appId!=='sound'||view.screen!=='playback'||view.data?.mediaError===true||!Number.isFinite(x)||!Number.isFinite(y)||x<bar.x||x>bar.x+bar.width||y<bar.y||y>bar.y+bar.height)return null;
  return Math.max(0,Math.min(1,(x-bar.x)/bar.width));
}
