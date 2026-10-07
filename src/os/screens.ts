import type { DiagnosticHomeHudSample } from './home-hud-sample';
import { homeTitleBannerKind, hasHomeTitleBanner } from './home-title-banner';
import type { StockModelBackground } from './stock-model-background';
import {drawNativeSystemOverlay} from './native-system-presentation';
import { isSystemHomeFolderClosing } from './home-folder-close-system';
import { getHomeCursorLoopFrame } from './home-cursor-loop';
import { createNativeChrome } from './native-chrome';
import { createPortfolioGraphics, setPortfolioFont } from './portfolio-screens';
import { getApp } from './apps';
import { getTitle } from './app-registry';
import { getHomeNavigation, getHomePageBoundary, leaveHomeFolder, saveHomeView } from './home-navigation';
import { getHomeFooter, getHomeLaunchPresentation, getHomePresentation, type HomePresentation, type HomeLaunchPresentation } from './home-presentation';
import { type MenuState, type Theme, isFolder, pageStart, rowCount, slotCount, themeChoices } from './state';
import { type BitmapFont } from './bitmap-font';
import { createFirmwareHome, type FirmwarePresentationAssets } from './firmware-presentation';
import { createHomeLayoutManager, type HomeLayoutPreview } from './home-native-layouts';
import {homeSoftwareDialogKey,homeSoftwareClosingDialogKey,homeSoftwareDialogTitles,drawHomeSoftwareDialog} from './home-software-dialog';
import {drawHomeSoftwareClosingDialog} from './home-software-closing-dialog';
import { homeSuspendedApplication, homeSuspendedIconDisappeared, retainedSuspendedApplication, selectedSuspendedApplication, drawHomeSuspendedWindow, type SuspendedWindowMetadata } from './home-suspended-window';
import { homeCloseWindowOpacity } from './home-close-window-fit';
import { sampleSystemHomeApplicationTransition } from './system-home-application-transition';
import { createHomeSuspendedPresentation, getHomeSuspendedSleepFrame, syncHomeSuspendedPresentation } from './home-suspended-presentation';
import { sampleHomeEntryMotionCandidate, acknowledgeHomeEntryMotionCandidate, homeEntryMotionMatches, homeEntryMotionActive, homeFolderEntryPose, homePauseEntryPresentation, type HomeEntryMotion, type HomeEntryMotionIdentity, type HomeFolderEntryPose, type HomeSuspendedBackgroundPresentation } from './home-entry-motion';
import { acknowledgeHomeEntryBannerPresentation, acknowledgeHomeEntryFooterRelease, acknowledgeHomeEntryFooterTerminal, bypassHomeEntryBannerPresentation, createHomeEntryPresentation, getHomeEntryFooterReadiness, homeEntryBannerActivationDue,
 sampleHomeEntryPresentation, HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME, HOME_ENTRY_FOOTER_LAST_FRAME } from './home-entry-presentation';
import { NATIVE_RECOVERY_TARGETS } from './native-screen-input';
import { getHomeFolderIdentity } from './home-folder-identity';
import type { NativePixels } from './native-layout';
import type { SuspendedCapture } from './notes-suspended-capture';
import type { HomeBannerHostView } from './home-banner-host';
import type { HomeBannerMotion } from './home-banner-lifecycle';
import { createManualEntryPresentation, sameManualEntryIdentity, type ManualEntryIdentity, type ManualEntryPose } from './manual-entry-presentation';
import { manualEntryIdentity, manualEntryEligible, manualEntryOrigin, sameManualEntryOrigin, manualEntryBackingMatches, type ManualEntryOrigin } from './manual-entry-identity';
import { createAppletEntryPresentation, appletEntryIdentity, appletEntryEligible, appletEntryHomePair, sameAppletEntryHomePair,
 sameAppletEntryIdentity, appletEntryBackingMatches, type AppletEntryIdentity, type AppletEntryHomePair, type AppletEntryPose } from './applet-entry-presentation';
import { createHomeFolderEntryBanner, homeFolderEntryBannerSource, homeFolderEntryBannerDestinationReady, type HomeFolderEntryBannerOwner,
 type HomeFolderEntryBannerPose, type HomeFolderEntryBannerSource, type HomeFolderEntryBannerRelease } from './home-folder-entry-banner';
import { homeApplicationTransitionFooterReturn, homeApplicationTransitionPresentation, type HomeApplicationTransition } from './home-application-transition';
export { loadFirmwarePresentationAssets, type FirmwarePresentationAssets } from './firmware-presentation';
type Context = CanvasRenderingContext2D;
type HomeEntryBannerIdentity=Readonly<{generation:string;requestEpoch:number;activationEpoch:number}>;
function homeEntryBannerIdentity(view:HomeBannerHostView|undefined):HomeEntryBannerIdentity|null{
 if(!view||view.status!=='active'||!view.primary.motion.visible)return null;
 return {generation:view.primary.generation,requestEpoch:view.primary.requestEpoch,activationEpoch:view.primary.activationEpoch};
}
function homeEntryNoBannerIdentity(view:HomeBannerHostView|undefined):string|null{
 if(!view||!(view.status==='unsupported'||view.status==='cleared'||view.selection.kind==='clear'))return null;
 const selection=view.selection;
 return JSON.stringify([view.status,'generation'in view?view.generation:null,selection?.kind??null,
  selection&&'id'in selection?selection.id:null,selection&&'focus'in selection?selection.focus:null]);
}
type SystemWithHomeApplicationTransition = NonNullable<MenuState['system']> & {
 homeApplicationTransition?:HomeApplicationTransition|null;
};
type NativeHome=ReturnType<typeof createFirmwareHome>;
type ScreenPaintResult={homeWallpaper?:boolean;healthBanner?:boolean;nativeSystem?:true;entryMotion?:{folder:HomeFolderEntryPose|null;pauseFrame:number|null};manualEntry?:{phase:'out'|'in';frame:number;owner:string};appletEntry?:{kind:'cover'|'handoff';frame:number|null;owner:string}};
const fonts = new WeakMap<Context, BitmapFont>();
let systemFont: Promise<void> | undefined;
function loadSystemFont() {
 return systemFont ??= new FontFace('HOME Menu','url(/os/home-menu.woff2)').load()
  .then(face=>{document.fonts.add(face);}).catch(()=>undefined);
}
const themes: Record<Theme, { top: string; bottom: string; ink: string; tile: string }> = {
 // Plain lower-tray RGB sampled from the owner's native 10.7.0-32E capture.
 white: { top: '#d9d8e6', bottom: '#dfdbd7', ink: '#44464b', tile: '#f9f9fa' },
 red: { top: '#ec6864', bottom: '#d64748', ink: '#4b2021', tile: '#fff3ef' },
 blue: { top: '#8dc5eb', bottom: '#61a9dc', ink: '#193c64', tile: '#eff8ff' },
 yellow: { top: '#fae585', bottom: '#f5d14d', ink: '#655326', tile: '#fffced' },
 pink: { top: '#f5c1dc', bottom: '#ee9ac8', ink: '#693753', tile: '#fff4fb' },
 black: { top: '#41424a', bottom: '#4b4b51', ink: '#f1f1f5', tile: '#bcbcc4' },
};
function rounded(c: Context, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke?: string) {
 c.beginPath(); c.roundRect(x,y,w,h,r); c.fillStyle=fill; c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
function gradient(c: Context, y: number, h: number, a: string, b: string) {
 const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;
}
function text(c:Context,t:string,x:number,y:number,size=13,color='#44464b',align:CanvasTextAlign='left'){
 const font=fonts.get(c);if(font){font.draw(c,t,x,y,size,color,align);return;}
 // Fontworks NTLG conversion; provenance and the distinction from CFNT rasterization are documented.
 c.font=`${size}px "HOME Menu", Arial, sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(t,x,y);
}
function line(c:Context,points:number[][],color:string,width=1){
 c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function folder(c:Context,x:number,y:number,size:number,label='',angle=0){
 c.save();c.translate(x,y);c.scale(size/60,size/60);
 // A shallow translucent blue case, paper insert and the native upper-left tab.
 const tilt=Math.sin(angle)*5;c.transform(Math.cos(angle)*.12+.88,0,tilt/60,1,0,0);
 rounded(c,-23,-27,25,8,2,'#a8e2ef','#84bacf');
 rounded(c,-25,-23,50,50,3,gradient(c,-23,50,'#b7ecfb','#73c7e6'),'#80b9cf');
 rounded(c,-23,-22,46,4,1,'#d9f5fb');
 rounded(c,-25,-15,50,42,2,gradient(c,-15,42,'#abe8f8','#76cde9'),'#86c8df');
 line(c,[[-23,25],[23,25]],'#b3e8ef');
 if(label)text(c,label[0],0,6,26,'#588b9b','center');c.restore();
}
function cursor(c:Context,x:number,y:number,w:number,h:number,time:number,reduced:boolean){
 const p=reduced?0:(Math.sin(time/220)+1)*.7;
 x-=3+p;y-=3+p;w+=6+2*p;h+=6+2*p;
 c.save();c.shadowColor='#82f6d0';c.shadowBlur=3;
 rounded(c,x,y,w,h,8,'#0000','#64dab7');
 const d=Math.min(11,w*.25);c.strokeStyle='#58e5bb';c.lineWidth=4;c.lineCap='round';c.lineJoin='round';
 for(const [px,py,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){
  c.beginPath();c.moveTo(px,py+sy*d);c.lineTo(px,py+sy*5);c.quadraticCurveTo(px,py,px+sx*5,py);c.lineTo(px+sx*d,py);c.stroke();
 }c.restore();
}
function status(c:Context,date:Date,chrome:ReturnType<typeof createNativeChrome>){
 c.fillStyle=gradient(c,0,22,'#ffffffd9','#ffffff00');c.fillRect(0,0,400,24);
 c.fillStyle='#38b5e8';for(let i=0;i<4;i++)c.fillRect(3+i*5,17-i*4,3,3+i*4);
 rounded(c,26,3,108,14,3,gradient(c,3,14,'#69d2f3','#25a5df'),'#5eb4db');text(c,'Internet',80,10,12,'white','center');
 c.strokeStyle='#ccbc8c';c.lineWidth=1;c.beginPath();c.ellipse(153,10,6,8,0,0,Math.PI*2);c.stroke();text(c,'P',153,11,9,'#ccbc8c','center');text(c,'0',165,10,13,'#64646c');
 const d=`${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')} (${date.toLocaleDateString('en-GB',{weekday:'short'})})`;
 text(c,d,222,11,13,'#34343b');text(c,`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`,319,11,13,'#34343b');
 rounded(c,374,4,23,12,1,'#f1f8ff','#454958');c.fillStyle='#464959';c.fillRect(371,7,3,6);
 for(let i=0;i<4;i++)rounded(c,377+i*4,6,3,8,.3,gradient(c,6,8,'#6ce2fb','#1678b4'));
 chrome.draw(c,'internet-status',0,0);chrome.draw(c,'battery-status',370,0);
}
function background(c:Context,state:MenuState,time:number){
 const palette=themes[state.theme];c.fillStyle=gradient(c,0,240,state.theme==='white'?'#f3f2f7':palette.top,palette.top);c.fillRect(0,0,400,240);
 const drift=time/2200%62;c.save();c.globalAlpha=state.theme==='black'?.09:.32;
 for(let row=0;row<5;row++)for(let col=-1;col<8;col++){
  const x=col*62+drift+(row%2)*5,y=30+row*61;
  rounded(c,x,y,49,48,9,'#fff');
  if(state.theme==='white')rounded(c,x-7,y-7,48,47,9,'#ffffff55');
 }c.restore();
}
function settingsIcon(c:Context){
 c.save();c.translate(20,16);c.fillStyle='#88a3bf';
 c.beginPath();c.moveTo(-12,-1);c.lineTo(0,-12);c.lineTo(12,-1);c.lineTo(8,-1);c.lineTo(8,10);c.lineTo(2,10);c.lineTo(2,3);c.lineTo(-3,3);c.lineTo(-3,10);c.lineTo(-9,10);c.lineTo(-9,-1);c.fill();
 line(c,[[-7,9],[8,-7]],'#f6f7fa',5);line(c,[[-7,9],[8,-7]],'#91a7bf',2);c.restore();
}
function toolbar(c:Context,sprite:HTMLImageElement,chrome:ReturnType<typeof createNativeChrome>){
 c.fillStyle=gradient(c,0,33,'#fff','#d7d8dc');c.fillRect(0,0,320,33);
 if(sprite.complete&&sprite.naturalWidth)c.drawImage(sprite,48,0);if(!chrome.draw(c,'settings-glyph',7,0))settingsIcon(c);
 line(c,[[0,32.5],[320,32.5]],'#b6b7bc');
}
function button(c:Context,x:number,y:number,w:number,h:number,label:string,active=false){
 c.save();c.shadowColor='#7777';c.shadowBlur=2;c.shadowOffsetY=1;
 rounded(c,x,y,w,h,5,gradient(c,y,h,active?'#b1ffba':'#fff',active?'#7cef9e':'#d6d7da'),'#a8a9ae');c.restore();
 text(c,label,x+w/2,y+h/2,14,'#44464b','center');
}
function footer(c:Context,state:MenuState,chrome:ReturnType<typeof createNativeChrome>){
 const actions=getHomeFooter(state);if(!actions)return;
 c.fillStyle=gradient(c,212,28,'#fff','#c4c5c9');c.fillRect(0,212,320,28);line(c,[[0,212.5],[320,212.5]],'#9c9da4');chrome.draw(c,'home-footer',0,214);
 const {two,left,right}=actions,middle=actions.middle??null,labels={'close-folder':'Close','close-software':'Close software','folder-settings':'Settings',manual:'Manual',resume:'Resume',open:'Open','create-folder':'Create Folder'};
 if(middle){line(c,[[105.5,214],[105.5,240]],'#aaabb2');line(c,[[213.5,214],[213.5,240]],'#aaabb2');text(c,left?labels[left]:'',52,226,11,'#494b51','center');text(c,labels[middle],160,226,14,'#494b51','center');text(c,labels[right],267,226,14,'#494b51','center');}
 else if(two){line(c,[[104.5,214],[104.5,240]],'#aaabb2');text(c,left?labels[left]:'',52,226,11,'#494b51','center');text(c,labels[right],212,226,14,'#494b51','center');}
 else{if(state.opened)text(c,'↶',24,226,19);text(c,labels[right],160,226,14,'#494b51','center');}
}
function arrows(c:Context,state:MenuState){
 const boundary=getHomePageBoundary(state);
 for(const [right,visible] of [[false,boundary.left],[true,boundary.right]] as const){
  if(!visible)continue;
  c.save();c.beginPath();c.rect(0,33,320,177);c.clip();
  c.fillStyle=gradient(c,101,60,'#fff','#e6e7e8');c.strokeStyle='#bebfc6';c.lineWidth=1;c.beginPath();c.ellipse(right?325:-5,131,20,29,0,0,Math.PI*2);c.fill();c.stroke();
  const x=right?310:10;c.fillStyle='#91bdb7';c.beginPath();c.moveTo(x+(right?5:-5),131);c.lineTo(x+(right?-3:3),125);c.lineTo(x+(right?-3:3),137);c.fill();c.restore();
 }
}
function titleArtwork(c:Context,appId:string|null|undefined,x:number,y:number,width:number,height:number,assets?:FirmwarePresentationAssets){
 const titleId=getTitle(appId)?.titleId?.toLowerCase(),icon=titleId&&assets?.titleIcons?.get(titleId);
 if(!icon)return false;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(icon,x,y,width,height);c.restore();
 return true;
}
function titleIcon(c:Context,appId:string|null|undefined,x:number,y:number,size:number,assets?:FirmwarePresentationAssets){
 const side=Math.round(size*2/3);
 return titleArtwork(c,appId,Math.round(x+(size-side)/2),Math.round(y+(size-side)/2),side,side,assets);
}
function grid(c:Context,state:MenuState,time:number,reduced:boolean,graphics:ReturnType<typeof createPortfolioGraphics>,chrome:ReturnType<typeof createNativeChrome>,view:HomePresentation,nativeHome?:NativeHome,capture=false,assets?:FirmwarePresentationAssets,suspendedSleepFrame=0,launchRetained:HomeLaunchPresentation|null=null,cursorLoop=getHomeCursorLoopFrame(state,reduced),folderEntry:HomeFolderEntryPose|null=null){
 const system=state.system,controls=nativeHome?system?.homeControls:null;
 const suspendedApp=capture?null:homeSuspendedApplication(state)?.appId;
 c.save();c.beginPath();c.rect(0,state.opened?49:34,320,state.opened?159:174);c.clip();
 for(const tile of view.tiles){
  const {x,size,appId,folderLabel,pressed,source,drop}=tile;
  // Retained poses belong to the active container, never the captured root.
  const offset=controls?(capture?0:nativeHome!.tilePressOffset(controls.tilePoses[tile.index],view.density)):(pressed?(nativeHome?.pressOffset??2):0),y=tile.y+offset;
  const app=getApp(appId),occupied=!!appId||folderLabel!==null;
  const drawTile=(alpha:number)=>{
  const artwork=(draw:()=>void)=>{c.save();try{c.globalAlpha*=alpha;draw();}finally{c.restore();}};
  if(source){
   const pickup=!capture&&controls?view.pickup:null;
   const drawn=pickup?pickup.blankScale.appliedFrame===null||nativeHome!.pickupBlankAt(c,pickup.blankCenter.x,pickup.blankCenter.y,pickup.blankScale.appliedFrame)
    :nativeHome?.liftedSource(c,x,tile.y,size,view.density);
   if(!drawn){
    artwork(()=>{const inset=size*.34;rounded(c,x+inset,tile.y+inset,size-inset*2,size-inset*2,2,'#d3d4d766','#c8c9cc');});
   }
  }else if(occupied){
   const nativeDrawn=capture&&tile.index===state.selected&&folderLabel!==null
    ?nativeHome?.captureFolder(c,x,y,size,view.density,folderLabel)
    :nativeHome?.tile(c,x,y,size,view.density,folderLabel!==null,drop&&folderLabel!==null,folderLabel??'');
   if(!(nativeDrawn??chrome.tile(c,x,y,size))){c.save();c.globalAlpha*=alpha;c.shadowColor='#96969c';c.shadowOffsetY=2;c.shadowBlur=3;
    rounded(c,x,y,size,size,Math.min(12,size*.16),gradient(c,y,size,'#fff','#efeff1'),'#bfc0c5');c.restore();}
   if(app)artwork(()=>graphics.menuIcon(c,app,x,y,size));
   else if(appId)artwork(()=>{const titleId=getTitle(appId)?.titleId;
    if(nativeHome){if(!titleId)throw new Error(`Native HOME title unavailable: ${appId}`);nativeHome.ordinaryTitleIcon(c,titleId,x,y,size);}
    else titleIcon(c,appId,x,y,size,assets);
   });
   else if(folderLabel!==null&&!nativeDrawn)artwork(()=>folder(c,x+size/2,y+size/2,size*.78,folderLabel));
   if(appId&&appId===suspendedApp)artwork(()=>nativeHome?.suspendedIcon(c,x,y,size,view.density,suspendedSleepFrame,homeSuspendedIconDisappeared(state)));
  }else if(!nativeHome?.empty(c,x,y,size,view.density)){
   artwork(()=>{const inset=size*.34,side=size-inset*2;
   rounded(c,x+inset,y+inset,side,side,2,'#d3d4d766','#c8c9cc');
   line(c,[[x+inset+1,y+inset+side],[x+inset+side,y+inset+side],[x+inset+side,y+inset+1]],'#e9e9eb');});
  }
  };
  if(nativeHome&&!capture){if(nativeHome.folderChild(c,state,!occupied,drawTile,reduced,folderEntry)===false)throw Error('Native folder entry child unavailable');}else drawTile(1);
  if(!controls&&!capture&&!isSystemHomeFolderClosing(state)&&tile.cursor&&!nativeHome?.cursor(c,x,tile.y,size,view.density,cursorLoop,pressed))cursor(c,x,y,size,size,time,reduced);
 }c.restore();
 // Retained native layouts can target toolbar anchors and offscreen departures.
 // Paint after the tile clip, before the existing arrows; the host owns close
 // visibility and controller updates. Rendering only samples applied poses.
 // Only authored grid scroll/drag suppress this group; ordinary press does not.
 // An eligible retained launch keeps the selected cursor beneath the source
 // fade: native shows its brackets until HOME reaches black.
 if(nativeHome&&controls&&!capture&&state.powered&&(system?.phase==='home'||(!!launchRetained&&system?.phase==='launch'))
  &&!system.sleeping&&!system.dialog&&!system.preferences&&!state.panel
  &&!(system.homeNavigation.gesture?.area==='grid'&&system.homeNavigation.gesture.mode!=='press')){
  const {primary,presentation}=controls;
  if(primary.layoutVisible)nativeHome.cursorAt(c,primary.center.x,primary.center.y,presentation.primaryScale.appliedFrame,cursorLoop);
  if(!reduced)for(const effect of presentation.effects)if(effect.visible){
   nativeHome.cursorEffectAt(c,effect.center.x,effect.center.y,effect.scale.appliedFrame,effect.disappear.appliedFrame);
  }
  if(launchRetained&&system?.phase==='launch'&&primary.layoutVisible
   &&!nativeHome.launchCursorEffectAt(c,primary.center.x,primary.center.y,presentation.primaryScale.appliedFrame,launchRetained.cursorEffectFrame))
   throw Error('Native HOME launch cursor effect unavailable');
 }
 if(!capture){const boundary=getHomePageBoundary(state);if(!nativeHome?.arrows(c,boundary.left,boundary.right))arrows(c,state);}
 // Native idle HOME has no track above the footer. Keep the old fallback's
 // scroll indicator separate from the decoded native chrome.
 if(!nativeHome){
  rounded(c,15,204,290,5,2,'#bfc0c580');
  const width=Math.max(14,290*state.columns/Math.ceil(slotCount(state)/rowCount(state)));
  rounded(c,15+(290-width)*pageStart(state)/Math.max(1,Math.ceil(slotCount(state)/rowCount(state))-state.columns),204,width,5,2,'#fafafa','#b8b9bc');
 }
 if(state.opened&&!nativeHome){c.fillStyle='#737982';c.fillRect(0,33,320,16);text(c,'↶',21,41,15,'white');text(c,state.folders[state.selected]||'',160,41,11,'white','center');}
}
function dragGhost(c:Context,view:HomePresentation,graphics:ReturnType<typeof createPortfolioGraphics>,nativeHome?:NativeHome,assets?:FirmwarePresentationAssets){
 const ghost=view.ghost;if(!ghost)return;
 if(nativeHome&&view.pickup?.scale.appliedFrame===null)return;
 const {x,y,size,item}=ghost,app=item.kind==='app'?getApp(item.id):undefined;
 const titleId=item.kind==='app'&&!app?getTitle(item.id)?.titleId:undefined;
 if(nativeHome&&item.kind==='app'&&!app&&!titleId)throw new Error(`Native HOME pickup title unavailable: ${item.id}`);
 c.save();c.beginPath();c.rect(0,0,320,240);c.clip();
 const pickup=nativeHome&&(view.pickup
  ?nativeHome.pickupAt(c,x,y,view.pickup.scale.appliedFrame!,titleId)
  :nativeHome.pickup(c,x,y,size,view.density,item.kind==='folder',item.kind==='folder'?item.label:'',titleId));
 if(pickup?.drawn){
  if(app){const rect=pickup.icon;c.globalAlpha=rect.alpha;graphics.menuArtwork(c,app,rect.x,rect.y,rect.width,rect.height);}
  else if(item.kind==='app'&&!titleId){const rect=pickup.icon;c.globalAlpha=rect.alpha;titleArtwork(c,item.id,rect.x,rect.y,rect.width,rect.height,assets);}
 }else if(item.kind==='folder')folder(c,x,y,size*.78,item.label);
 else if(app){rounded(c,x-size/2,y-size/2,size,size,8,'#f8f9fc','#adb4bf');graphics.menuIcon(c,app,x-size/2,y-size/2,size);}
 else if(item.kind==='app'){rounded(c,x-size/2,y-size/2,size,size,8,'#f8f9fc','#adb4bf');titleIcon(c,item.id,x-size/2,y-size/2,size,assets);}
 c.restore();
}

function panel(c:Context,state:MenuState,time:number,reduced:boolean,themeSprite:HTMLImageElement,shopSprite:HTMLImageElement,nativeHome?:NativeHome){
 if(!state.panel||state.panel==='home-layouts')return;
 if(state.panel==='settings'){
  if(!nativeHome?.settingsLower(c,state))throw new Error('Native HOME Settings lower panel unavailable.');
  return;
 }
 if(state.panel==='folder-settings'){
  if(!nativeHome?.folderSettingsLower(c,state))throw new Error('Native HOME Folder Settings lower panel unavailable.');
  return;
 }
 if(state.panel==='folder-not-empty'){
  if(!nativeHome?.folderNotEmptyLower(c,state))throw new Error('Native HOME populated-folder notice lower panel unavailable.');
  return;
 }
 c.fillStyle='#171a2b66';c.fillRect(0,0,320,240);
 if(state.panel==='themes'){
  rounded(c,0,0,320,240,0,'#e8e9eb');
  for(let y=0;y<214;y+=3){c.fillStyle='#b9bcc425';c.fillRect(0,y,320,1);}
  const start=Math.max(0,state.panelChoice-2);
  c.save();c.beginPath();c.rect(0,0,293,214);c.clip();
  for(let i=start;i<Math.min(7,start+4);i++){
   const y=31+(i-start)*53;
   if(i===0){
    rounded(c,8,y,280,49,5,gradient(c,y,49,'#ffe000','#f4c000'),'#e8b906');
    c.fillStyle='#fff1';for(let row=0;row<5;row++)for(let col=0;col<28;col++)if((row+col)%2===0)c.fillRect(10+col*10,y+row*10,10,10);
    if(shopSprite.complete&&shopSprite.naturalWidth)c.drawImage(shopSprite,12,y+6);text(c,'Theme Shop',60,y+25,20,'#fff');
   }else{
    const theme=themeChoices[i-1];button(c,8,y,280,49,'');rounded(c,12,y+5,40,39,3,gradient(c,y+5,39,{white:'#fff',red:'#ff4c30',blue:'#00b2ee',yellow:'#fff300',pink:'#ffade0',black:'#555'}[theme],{white:'#eee',red:'#ed0000',blue:'#0025bd',yellow:'#ffc300',pink:'#ee52b7',black:'#111'}[theme]));
    text(c,theme==='white'?'Do not use a theme':`Simple ${theme[0].toUpperCase()+theme.slice(1)}`,58,y+24,14);
   }
   if(i===state.panelChoice)cursor(c,10,y+2,276,44,time,reduced);
  }
  c.restore();
  rounded(c,25,8,242,19,10,'#fff');text(c,'Purchase themes here.',146,18,13,'#21b5dc','center');
  rounded(c,295,8,18,134,3,gradient(c,8,134,'#fff','#d4d5d7'),'#b7b9bc');line(c,[[299,74],[309,74]],'#989ba0',2);line(c,[[299,79],[309,79]],'#989ba0',2);
  c.fillStyle=gradient(c,214,26,'#fff','#c6c8ce');c.fillRect(0,214,320,26);text(c,'Ⓑ Cancel',160,228,17,'#4a4d55','center');
 }else{
  const titles={notes:'Game Notes',friends:'Friend List',notifications:'Notifications',browser:'Internet Browser',miiverse:'Miiverse','theme-shop':'Theme Shop'};
  rounded(c,0,0,320,240,0,'#eff0f4');c.fillStyle=gradient(c,0,31,'#fff','#d7dae0');c.fillRect(0,0,320,31);text(c,titles[state.panel],160,16,15,'#454b58','center');
  if(state.panel==='notes'){
   for(let y=52;y<204;y+=17)line(c,[[18,y],[302,y]],'#cbd9e8');line(c,[[36,36],[36,206]],'#e3b6bc');
  }else{const messages={friends:'No friends registered.',notifications:'No notifications.',browser:'Internet Browser is not available.',miiverse:'Miiverse service has ended.','theme-shop':'Purchases are no longer available.'};text(c,messages[state.panel],160,115,13,'#646b78','center');}
  c.fillStyle=gradient(c,212,28,'#fff','#c9cdd5');c.fillRect(0,212,320,28);text(c,'Ⓑ Close',160,226,14,'#4d535e','center');
 }
}
export function createScreens(options: { soundRoom?:StockModelBackground;cameraShoot?:StockModelBackground; font?: BitmapFont; reducedMotion?: boolean; firmwareAssets?:FirmwarePresentationAssets; drawFolderBanner?:(ctx:Context,time:number,reduced:boolean,label?:NativePixels)=>boolean; getHomeBanner?:()=>HomeBannerHostView|undefined; getMemoBannerFailure?:()=>string|null; getFriendBannerFailure?:()=>string|null; getNewsBannerFailure?:()=>string|null; getWebBannerFailure?:()=>string|null; getMiiverseBannerFailure?:()=>string|null; drawFolderBannerFrame?:(ctx:Context,motion:HomeBannerMotion,label?:NativePixels)=>boolean; drawDefaultBannerFrame?:(ctx:Context,motion:HomeBannerMotion)=>boolean; drawSettingsBannerFrame?:(ctx:Context,motion:HomeBannerMotion)=>boolean; drawMemoBannerFrame?:(ctx:Context,motion:HomeBannerMotion,label?:NativePixels)=>boolean; drawFriendBannerFrame?:(ctx:Context,motion:HomeBannerMotion,label?:NativePixels)=>boolean; drawNewsBannerFrame?:(ctx:Context,motion:HomeBannerMotion,label?:NativePixels)=>boolean; drawWebBannerFrame?:(ctx:Context,motion:HomeBannerMotion,label?:NativePixels)=>boolean; drawMiiverseBannerFrame?:(ctx:Context,motion:HomeBannerMotion,label?:NativePixels)=>boolean; drawStockTitleBannerFrame?:(ctx:Context,motion:HomeBannerMotion,ticket:Readonly<{generation:string;requestEpoch:number}>,kind:NonNullable<ReturnType<typeof homeTitleBannerKind>>)=>boolean; drawHomeBackground?:(ctx:Context,time:number,reduced:boolean,sourceFrame?:number,reuseWithinMs?:number)=>boolean; drawSuspendedBackground?:(ctx:Context,capture:SuspendedCapture,presentation?:HomeSuspendedBackgroundPresentation|null)=>boolean; runtimeNotice?:()=>string|null } = {}){
 const top=document.createElement('canvas');top.width=800;top.height=240;
 const bottom=document.createElement('canvas');bottom.width=320;bottom.height=240;
 const native=document.createElement('canvas');native.width=400;native.height=240;
 const output=top.getContext('2d')!,t=native.getContext('2d')!,b=bottom.getContext('2d')!;
 const graphics=createPortfolioGraphics({soundRoom:options.soundRoom,cameraShoot:options.cameraShoot,reducedMotion:()=>reduced});const chrome=createNativeChrome();
 const manualPresentation=createManualEntryPresentation();
 const manualCanvases=[400,320,400,320].map(width=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=240;return canvas;});
 const [lastPresentedUpper,lastPresentedLower,manualBackingUpper,manualBackingLower]=manualCanvases;
 let manualGeneration=0,lastPresentedOrigin:ManualEntryOrigin|null=null,manualBackingIdentity:ManualEntryIdentity|null=null;
 let manualSourceCandidate:ManualEntryOrigin|null=null,manualCandidate:ManualEntryPose|undefined;
 function revokeManualEntryCandidate(){manualPresentation.revoke();manualCandidate=undefined;manualSourceCandidate=null;}
 function resetManualEntry(){manualGeneration++;manualPresentation.reset();manualCandidate=undefined;manualSourceCandidate=null;manualBackingIdentity=null;lastPresentedOrigin=null;}
 function presentManualEntry(state:MenuState,elapsedMs:number):boolean{
  const source=manualSourceCandidate;manualSourceCandidate=null;
  if(disposed)return false;
  if(source&&sameManualEntryOrigin(source,manualEntryOrigin(state,manualGeneration))){
   for(const [target,image] of [[lastPresentedUpper,native],[lastPresentedLower,bottom]]){const ctx=target.getContext('2d')!;ctx.resetTransform();ctx.clearRect(0,0,target.width,240);ctx.drawImage(image,0,0);}
   lastPresentedOrigin=source;
  }
  const candidate=manualCandidate;manualCandidate=undefined;
  if(!candidate)return false;
  const identity=manualEntryIdentity(state,manualGeneration),eligible=manualEntryEligible(state)&&!panelFailure;
  if(!manualPresentation.present(candidate,identity,elapsedMs,eligible,graphics.stockStatus(state,t)==='ready')){revokeManualEntryCandidate();return false;}
  return true;
 }
 function manualEntryActive(state:MenuState):boolean{
  return !disposed&&!panelFailure&&manualEntryEligible(state)&&graphics.stockFailure()===null
   &&manualPresentation.active(manualEntryIdentity(state,manualGeneration),graphics.stockStatus(state,t)==='ready');
 }
 const appletPresentation=createAppletEntryPresentation();
 const appletCanvases=[400,320,400,320].map(width=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=240;return canvas;});
 const [appletHomeUpper,appletHomeLower,appletBackingUpper,appletBackingLower]=appletCanvases;
 let appletGeneration=0,appletHomeOrigin:AppletEntryHomePair|null=null,appletBackingIdentity:AppletEntryIdentity|null=null;
 let appletSourceCandidate:{source:AppletEntryHomePair|null;generation:number;application:string|null}|null=null,appletCandidate:AppletEntryPose|undefined,appletCoverPainted=false;
 let coveredAppletOwner:string|null=null;
 function setAppletEntryCovered(owner:string|null){if(owner!==coveredAppletOwner){coveredAppletOwner=owner;graphics.setAppletEntryCovered(owner);}}
 function revokeAppletEntryCandidate(){appletPresentation.revoke();appletCandidate=undefined;appletSourceCandidate=null;}
 function resetAppletEntry(){appletGeneration++;appletPresentation.reset();appletCandidate=undefined;appletSourceCandidate=null;appletBackingIdentity=null;appletHomeOrigin=null;appletCoverPainted=false;setAppletEntryCovered(null);}
 function presentAppletEntry(state:MenuState,elapsedMs:number):boolean{
  const source=appletSourceCandidate;appletSourceCandidate=null;
  if(disposed)return false;
  const current=appletEntryHomePair(state,appletGeneration);
  if(source&&state.system?.phase==='home'&&appletEntryEligible(state)&&source.generation===appletGeneration&&source.application===state.system.runtime.application
    &&(source.source===null&&current===null||sameAppletEntryHomePair(source.source,current))){
   if(source.source)for(const [target,image] of [[appletHomeUpper,native],[appletHomeLower,bottom]]){const ctx=target.getContext('2d')!;ctx.resetTransform();ctx.clearRect(0,0,target.width,240);ctx.drawImage(image,0,0);}
   appletHomeOrigin=source.source;
  }
  const candidate=appletCandidate;appletCandidate=undefined;
  if(!candidate)return false;
  if(!appletPresentation.present(candidate,appletEntryIdentity(state,appletGeneration),elapsedMs,appletEntryEligible(state)&&!panelFailure&&graphics.stockFailure()===null,graphics.preparedStockPair(state))){revokeAppletEntryCandidate();return false;}
  return true;
 }
 function appletEntryActive(state:MenuState):boolean{
  const identity=appletEntryIdentity(state,appletGeneration);if(!identity)return false;
  return !disposed&&!panelFailure&&appletEntryEligible(state)&&graphics.stockFailure()===null
   &&appletPresentation.active(identity,graphics.preparedStockPair(state));
 }
 function presentNotesBootCover(state:MenuState):boolean{
  const identity=appletEntryIdentity(state,appletGeneration);
  return !appletCoverPainted&&(!identity||appletPresentation.ready(identity))&&graphics.presentNotesBootCover(state);
 }
 function skipAppletEntryForAccessibilityShortcut(state:MenuState):boolean{
  const identity=appletEntryIdentity(state,appletGeneration);
  if(disposed||!identity||identity.caller!==null||!appletEntryEligible(state))return false;
  revokeAppletEntryCandidate();appletPresentation.skipAccessibilityShortcut(identity);setAppletEntryCovered(null);return true;
 }
 const sprite=new Image();sprite.src='/os/home-toolbar.png';
 const themeSprite=new Image();themeSprite.src='/os/change-theme.png';
 const shopSprite=new Image();shopSprite.src='/os/theme-shop.png';
 const fontReady=loadSystemFont();
 let firmwareAssets:FirmwarePresentationAssets|undefined,nativeHome:NativeHome|undefined,layoutManager:ReturnType<typeof createHomeLayoutManager>|undefined,disposed=false;
 let folderCapture:{identity:string;pixels:NativePixels}|undefined;
 const folderEntryBanner=createHomeFolderEntryBanner();let folderEntryBannerGeneration=0;
 let rootFolderBannerCandidate:{generation:number;source:HomeFolderEntryBannerSource|null}|undefined;
 let folderEntryBannerCandidate:HomeFolderEntryBannerPose|null=null;
 let folderEntryBannerReleaseCandidate:{release:HomeFolderEntryBannerRelease;identity:HomeEntryBannerIdentity}|undefined;
 let layoutCapture:{identity:string;preview:HomeLayoutPreview}|undefined;
 let suspendedMetadata:{owner:string;metadata:SuspendedWindowMetadata}|undefined;
 let suspendedPresentation=createHomeSuspendedPresentation();
 let folderEntryMotion:HomeEntryMotion|null=null,pauseEntryMotion:HomeEntryMotion|null=null;
 let folderEntryMotionKey:string|null=null;
 let pendingFolderEntryMotion:HomeEntryMotion|null=null,pendingPauseEntryMotion:HomeEntryMotion|null=null;
 let folderEntryNeedsRebase=false,pauseEntryNeedsRebase=false;
 let entryMotionGeneration=0;
 let entryMotionCandidate:{generation:number;folder:HomeEntryMotion|null;folderNavigationRevision:number;pause:HomeEntryMotion|null}|undefined;
 function revokeHomeEntryMotionCandidate(){entryMotionGeneration++;pendingFolderEntryMotion=null;pendingPauseEntryMotion=null;entryMotionCandidate=undefined;folderEntryNeedsRebase=true;pauseEntryNeedsRebase=true;folderEntryBanner.revoke();rootFolderBannerCandidate=undefined;folderEntryBannerCandidate=null;folderEntryBannerReleaseCandidate=undefined;}
 function resetHomeEntryMotion(){revokeHomeEntryMotionCandidate();folderEntryMotion=null;folderEntryMotionKey=null;pauseEntryMotion=null;folderEntryNeedsRebase=false;pauseEntryNeedsRebase=false;folderEntryBannerGeneration++;if(disposed)folderEntryBanner.dispose();else folderEntryBanner.reset();}
 let homeEntryPresentation=createHomeEntryPresentation();
 let homeEntryFooterCandidate:{sample:ReturnType<typeof sampleHomeEntryPresentation>;state:MenuState}|undefined;
 let homeEntryFooterReleaseCandidate:{sample:ReturnType<typeof sampleHomeEntryPresentation>;state:MenuState}|undefined;
 let homeEntryBannerCandidate:{sample:ReturnType<typeof sampleHomeEntryPresentation>;state:MenuState;identity:HomeEntryBannerIdentity}|undefined;
 let homeEntryNoBannerCandidate:{sample:ReturnType<typeof sampleHomeEntryPresentation>;state:MenuState;identity:string}|undefined;
 let applicationTransitionCapture:{generation:string;transitionId:number;owner:string;captureGeneration:number}|undefined;
 let softwareDialogIcons:{key:string;icons:readonly NativePixels[]}|undefined;
 let panelFailure:Error|undefined,panelPublished:string|null=null;
 const panelKey=(state:MenuState)=>homeSoftwareClosingDialogKey(state)??homeSoftwareDialogKey(state)??(state.system&&!state.system.sleeping&&['boot','launch','power','shutdown'].includes(state.system.phase)
  ?JSON.stringify(['system',state.system.phase,state.system.since,state.system.returnPhase,state.system.app,state.system.runtime.application,state.system.runtime.active])
  :manualEntryIdentity(state,manualGeneration)&&manualEntryEligible(state)?JSON.stringify(['manual-entry',manualEntryIdentity(state,manualGeneration)])
  :appletEntryIdentity(state,appletGeneration)&&appletEntryEligible(state)?JSON.stringify(['applet-entry',appletEntryIdentity(state,appletGeneration)])
  :state.system?.phase==='home'&&state.opened&&nativeHome&&!state.system.sleeping&&!state.system.preferences&&!state.system.dialog&&!state.panel
  ?JSON.stringify(['folder-entry',getHomeFolderIdentity(state,state.selected)])
  :state.system?.phase==='home'&&!state.system.sleeping&&!state.system.preferences&&!state.system.dialog&&(state.panel==='settings'||state.panel==='home-layouts'||state.panel==='folder-settings'||state.panel==='folder-not-empty')
  ?JSON.stringify([state.panel,state.panelChoice,state.panelScroll??0,state.homeLayoutSlot??0,state.homeLayoutAction??null,state.homeLayoutConfirm??false]):retainedSuspendedApplication(state)?JSON.stringify([retainedSuspendedApplication(state)!.id,!!selectedSuspendedApplication(state)]):null);
 function stockStatus(state:MenuState){
  const key=panelKey(state);
  if(key&&panelPublished!==key)return 'loading';
  if(key&&panelFailure)return 'error';
  const source=appletEntryHomePair(state,appletGeneration);
  // Quarantine rapid activation until the selected HOME pair is rendered.
  if(nativeHome&&source&&!sameAppletEntryHomePair(source,appletHomeOrigin))return 'loading';
  if(!key)return graphics.stockStatus(state,t);
  // Browser receipt quarantine, not a recovered native input epoch.
  if(state.opened&&nativeHome&&options.getHomeBanner&&folderEntryEligible(state)
   &&(!folderEntryBanner.complete(folderEntryBannerOwner(state))||folderEntryBanner.active(folderEntryBannerOwner(state))))return 'loading';
  const manual=manualEntryIdentity(state,manualGeneration);
  if(manual&&manualEntryEligible(state)){const status=graphics.stockStatus(state,t);return status==='error'?'error':status==='ready'&&manualPresentation.ready(manual)?'ready':'loading';}
  const applet=appletEntryIdentity(state,appletGeneration);
  if(applet&&appletEntryEligible(state)){const status=graphics.stockStatus(state,t);return status==='error'?'error':status==='ready'&&appletPresentation.ready(applet)?'ready':'loading';}
  // Successful source launch chrome cannot hide the destination screen's own
  // loading/failure contract. Its B/HOME escape remains available until ready.
  return state.system?.phase==='launch'?graphics.stockStatus(state,t):'ready';
 }
 function retryStockScreen(){revokeAppletEntryCandidate();revokeManualEntryCandidate();if(panelFailure){revokeHomeEntryMotionCandidate();panelFailure=undefined;panelPublished=null;return true;}return graphics.retryStockScreen();}
 function panelRecovery(state:MenuState){
  // Authored host recovery, never substituted as a native firmware screen.
  for(const ctx of [t,b]){ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.fillRect(0,0,ctx.canvas.width,240);}
  text(t,'Website display unavailable',200,92,16,'#fff','center');
  text(t,'The HOME panel could not be loaded.',200,121,13,'#ddd','center');
  text(b,'A: Retry',160,92,16,'#fff','center');
  const retryOnly=state.system?.phase==='boot';
  if(!retryOnly)text(b,'B / HOME: Return to HOME Menu',160,121,13,'#ddd','center');
  for(const item of NATIVE_RECOVERY_TARGETS){
   // HOME cannot safely bypass the mandatory native boot publication barrier.
   if(retryOnly&&item.action==='home')continue;
   b.strokeStyle='#aaa';b.lineWidth=1;b.strokeRect(item.x,item.y,item.width,item.height);text(b,item.action==='retry'?'Retry':'HOME',item.x+item.width/2,item.y+item.height/2,14,'#fff','center');
  }
  output.imageSmoothingEnabled=false;output.clearRect(0,0,800,240);output.drawImage(native,0,0,800,240);
 }
 const useFont=(font:BitmapFont)=>{for(const ctx of [t,b]){fonts.set(ctx,font);setPortfolioFont(ctx,font);}};
 if(options.font)useFont(options.font);
 function setFirmwareAssets(assets:FirmwarePresentationAssets){if(disposed){assets.dispose();return;}if(firmwareAssets&&firmwareAssets!==assets)firmwareAssets.dispose();resetManualEntry();resetAppletEntry();firmwareAssets=assets;nativeHome=createFirmwareHome(assets);layoutManager=createHomeLayoutManager(assets.renderer);folderCapture=undefined;layoutCapture=undefined;suspendedMetadata=undefined;resetHomeEntryMotion();homeEntryPresentation=createHomeEntryPresentation();homeEntryFooterCandidate=undefined;homeEntryFooterReleaseCandidate=undefined;homeEntryBannerCandidate=undefined;homeEntryNoBannerCandidate=undefined;applicationTransitionCapture=undefined;softwareDialogIcons=undefined;panelFailure=undefined;panelPublished=null;useFont(assets.sharedFont);}
 if(options.firmwareAssets)setFirmwareAssets(options.firmwareAssets);
 const captureCanvas=document.createElement('canvas');captureCanvas.width=320;captureCanvas.height=240;
 const captureContext=captureCanvas.getContext('2d',{willReadFrequently:true})!;
 function currentLayoutPreview(state:MenuState,time:number){
  if(state.panel!=='home-layouts'){layoutCapture=undefined;return;}
  if(!nativeHome)throw new Error('Native HOME layout preview unavailable');
  const root=leaveHomeFolder(state);
  const identity=JSON.stringify([root.theme,root.system?.layout,root.folders,root.system?.folderLayouts,saveHomeView(root)]);
  if(layoutCapture?.identity!==identity){
   // Capture before upper HUD/panel composition, and redraw the lower root with
   // the existing capture path (no cursor, footer actions or panel chrome).
   const ctx=captureContext;
   ctx.resetTransform();ctx.clearRect(0,0,320,240);ctx.fillStyle=themes[root.theme].bottom;ctx.fillRect(0,0,320,240);
   if(!nativeHome.toolbar(ctx,root)||!nativeHome.homePlate(ctx,root))throw new Error('Native HOME layout preview tray unavailable');
   grid(ctx,root,time,reduced,graphics,chrome,getHomePresentation(root),nativeHome,true,firmwareAssets);
   layoutCapture={identity,preview:{upper:{width:400,height:240,data:t.getImageData(0,0,400,240).data},lower:{width:320,height:240,data:ctx.getImageData(0,0,320,240).data}}};
  }
  return layoutCapture.preview;
 }
 function folderBackdrop(state:MenuState,time:number,entry:HomeFolderEntryPose|null){
  if(!state.opened){folderCapture=undefined;return;}
  if(!nativeHome)return;
  const identity=getHomeFolderIdentity(state,state.selected)??`slot:${state.selected}`;
  if(folderCapture?.identity!==identity){
   // Native 0x1b56f4 redraws the root before capture, with the footer,
   // cursor/effects, arrows and balloon hidden. Never copy the old onscreen footer.
   const root=leaveHomeFolder(state),view=getHomePresentation(root),ctx=captureContext;
   ctx.resetTransform();ctx.clearRect(0,0,320,240);ctx.fillStyle=themes[root.theme].bottom;ctx.fillRect(0,0,320,240);
   nativeHome.toolbar(ctx,root);nativeHome.homePlate(ctx,root);grid(ctx,root,time,reduced,graphics,chrome,view,nativeHome,true,firmwareAssets);
   folderCapture={identity,pixels:{width:320,height:206,data:ctx.getImageData(0,34,320,206).data}};
  }
  if(!nativeHome.folderBackdrop(b,folderCapture.pixels,state,reduced,entry))throw Error('Native folder entry capture unavailable');
 }
 let reduced=options.reducedMotion??false;
 function folderEntryIdentity(state:MenuState):HomeEntryMotionIdentity|null {
  return state.powered&&state.opened?{kind:'folder',folder:getHomeFolderIdentity(state,state.selected)??`slot:${state.selected}`}:null;
 }
 function folderEntryBannerOwner(state:MenuState):HomeFolderEntryBannerOwner|null {
  const folder=getHomeFolderIdentity(state,state.selected),system=state.system;
  return folder&&system?{folder,firmwareGeneration:folderEntryBannerGeneration,
   systemGeneration:system.homeFolderClose.generation,application:system.runtime.application,
   navigationRevision:getHomeNavigation(state).selectionRevision,closeSequence:system.homeFolderClose.nextTransitionId}:null;
 }
 function folderEntryEligible(state:MenuState):boolean {
  return !!state.system&&state.powered&&state.system.phase==='home'&&!state.system.sleeping&&!state.system.preferences&&!state.system.dialog&&!state.panel&&!isSystemHomeFolderClosing(state);
 }
 function pauseEntryOwner(state:MenuState):string|null {
  const runtime=state.system?.runtime,owner=runtime?.application,application=owner?runtime?.instances[owner]:undefined;
  return state.powered&&state.system?.phase==='home'&&application?.suspended&&!application.closing&&!runtime?.active&&runtime?.homeReturn===owner?owner??null:null;
 }
 function pauseEntryIdentity(state:MenuState):HomeEntryMotionIdentity|null {
  const owner=pauseEntryOwner(state),capture=owner?graphics.readSuspendedCapture(state.system!.runtime):{status:'none' as const};
  return owner&&capture.status==='ready'&&capture.owner===owner?{kind:'pause',owner,captureGeneration:capture.generation}:null;
 }
 function pauseEntryEligible(state:MenuState):boolean {
  return !!retainedSuspendedApplication(state)&&!state.system?.dialog&&!state.system?.homeApplicationTransition;
 }
 function presentHomeEntryMotion(state:MenuState):boolean {
  const root=rootFolderBannerCandidate;rootFolderBannerCandidate=undefined;
  if(!disposed&&root&&root.generation===entryMotionGeneration&&!state.opened&&folderEntryEligible(state)&&!panelFailure){
   const current=homeEntryBannerIdentity(options.getHomeBanner?.());
   const primary=root.source?.primary;
   folderEntryBanner.presentRoot(primary&&current&&current.generation===primary.generation&&current.requestEpoch===primary.requestEpoch
    &&current.activationEpoch===primary.activationEpoch?root.source:null,folderEntryBannerOwner(state));
  }
  const release=folderEntryBannerReleaseCandidate;folderEntryBannerReleaseCandidate=undefined;
  if(!disposed&&release){
   const view=options.getHomeBanner?.(),current=homeEntryBannerIdentity(view);
   if(panelFailure||!folderEntryEligible(state)||!homeFolderEntryBannerDestinationReady(view)||!current
    ||current.generation!==release.identity.generation||current.requestEpoch!==release.identity.requestEpoch||current.activationEpoch!==release.identity.activationEpoch
    ||!folderEntryBanner.presentRelease(release.release,folderEntryBannerOwner(state))){revokeHomeEntryMotionCandidate();return false;}
  }
  const candidate=entryMotionCandidate;entryMotionCandidate=undefined;
  if(disposed||!candidate||candidate.generation!==entryMotionGeneration)return !!release&&!disposed;
  const update=state.system?.homeClock.updateCount??0;
  const folder=acknowledgeHomeEntryMotionCandidate(candidate.folder,folderEntryIdentity(state),update,
   folderEntryEligible(state)&&candidate.folderNavigationRevision===getHomeNavigation(state).selectionRevision);
  const pause=acknowledgeHomeEntryMotionCandidate(candidate.pause,pauseEntryIdentity(state),update,pauseEntryEligible(state));
  if(folder){
   if(folderEntryBannerCandidate&&!folderEntryBanner.present(folderEntryBannerCandidate,folderEntryBannerOwner(state),folder)){revokeHomeEntryMotionCandidate();return false;}
   folderEntryMotion=folder;pendingFolderEntryMotion=null;folderEntryNeedsRebase=false;folderEntryBannerCandidate=null;
  }
  if(pause){pauseEntryMotion=pause;pendingPauseEntryMotion=null;pauseEntryNeedsRebase=false;}
  if(!folder&&!pause)revokeHomeEntryMotionCandidate();
  return !!folder||!!pause;
 }
 function isHomeEntryMotionActive(state:MenuState):boolean {
  if(disposed||panelFailure)return false;
  const folder=folderEntryIdentity(state),pause=pauseEntryIdentity(state);
  if(folder&&nativeHome&&options.getHomeBanner&&folderEntryEligible(state)&&folderEntryBanner.active(folderEntryBannerOwner(state)))return true;
  return !!folder&&folderEntryEligible(state)&&(!!pendingFolderEntryMotion||!homeEntryMotionMatches(folderEntryMotion,folder)||homeEntryMotionActive(folderEntryMotion,reduced))
   ||!!pause&&pauseEntryEligible(state)&&(!!pendingPauseEntryMotion||!homeEntryMotionMatches(pauseEntryMotion,pause)||homeEntryMotionActive(pauseEntryMotion,reduced));
 }
 function homeFolderBannerRequestReady(state:MenuState):boolean {
  if(disposed)return false;
  if(!state.opened||!nativeHome||!options.getHomeBanner)return true;
  return !panelFailure&&folderEntryEligible(state)&&folderEntryBanner.requestReady(folderEntryBannerOwner(state));
 }
 function homeFolderBannerActivationReady(state:MenuState):boolean {
  if(disposed)return false;
  if(!state.opened||!nativeHome||!options.getHomeBanner)return true;
  return !panelFailure&&folderEntryEligible(state)&&folderEntryBanner.activationReady(folderEntryBannerOwner(state));
 }
 /** reuseHomeBackgroundMs: an input-driven paint may recompose over the HOME
  * background sampled by the latest cadence paint, if it is at most this old.
  * The background then advances only on the LCD cadence, as without the paint.
  * manualEntryObservedElapsedMs uses the fresh render-receipt clock origin;
  * Manual and outgoing applet entry consume it without making the paint diagnostic. */
 function paint(state:MenuState,date=new Date(),elapsedMs=0,verification?:{sampleCalendar?:boolean;homeHudSample?:DiagnosticHomeHudSample;homeWallpaperFrame?:number;homeCursorLoopFrame?:number;reuseHomeBackgroundMs?:number;manualEntryObservedElapsedMs?:number}):ScreenPaintResult|undefined{
  if(disposed)return;
  entryMotionCandidate=undefined;
  rootFolderBannerCandidate=undefined;folderEntryBannerCandidate=null;folderEntryBannerReleaseCandidate=undefined;
  manualCandidate=undefined;manualSourceCandidate=null;
  appletCandidate=undefined;appletSourceCandidate=null;appletCoverPainted=false;
  const key=panelKey(state);
  if(key!==panelPublished)panelFailure=undefined;
  if(key&&panelFailure){revokeHomeEntryMotionCandidate();revokeManualEntryCandidate();revokeAppletEntryCandidate();panelRecovery(state);return;}
  try{const result=paintPair(state,date,elapsedMs,verification);panelPublished=key;return result;}
  catch(error){revokeHomeEntryMotionCandidate();revokeManualEntryCandidate();revokeAppletEntryCandidate();if(!key)throw error;panelFailure=error instanceof Error?error:new Error(String(error));panelRecovery(state);panelPublished=key;}
 }
 function paintPair(state:MenuState,date:Date,elapsedMs:number,verification?:{sampleCalendar?:boolean;homeHudSample?:DiagnosticHomeHudSample;homeWallpaperFrame?:number;homeCursorLoopFrame?:number;reuseHomeBackgroundMs?:number;manualEntryObservedElapsedMs?:number}):ScreenPaintResult|undefined{
  if(disposed)return;
  suspendedPresentation=syncHomeSuspendedPresentation(suspendedPresentation,state,reduced);
  const homeEntry=sampleHomeEntryPresentation(homeEntryPresentation,state,reduced);
  const diagnosticPaint=verification!==undefined
   &&(verification.sampleCalendar!==undefined||verification.homeHudSample!==undefined||verification.homeWallpaperFrame!==undefined||verification.homeCursorLoopFrame!==undefined);
  if(!diagnosticPaint&&!state.opened)folderEntryBanner.leave();
  const manualIdentity=manualEntryIdentity(state,manualGeneration);
  const appletIdentity=appletEntryIdentity(state,appletGeneration);
  if(diagnosticPaint||!appletIdentity||!appletEntryEligible(state))revokeAppletEntryCandidate();
  const appletOwner=state.system?.runtime.systemApplet;
  if(!appletIdentity&&(!appletOwner||!state.system?.runtime.instances[appletOwner])){appletPresentation.reset();appletBackingIdentity=null;}
  let appletPose:AppletEntryPose|undefined;
  if(appletIdentity&&appletEntryEligible(state)&&!diagnosticPaint){
   if(!appletPresentation.ready(appletIdentity)){
    if(!nativeHome)throw Error('Native applet entry cover unavailable');
    if(!sameAppletEntryIdentity(appletBackingIdentity,appletIdentity)){
     if(!appletEntryBackingMatches(appletHomeOrigin,appletIdentity))throw Error('Applet entry has no matching presented HOME pair');
     for(const [target,image] of [[appletBackingUpper,appletHomeUpper],[appletBackingLower,appletHomeLower]]){const ctx=target.getContext('2d')!;ctx.resetTransform();ctx.clearRect(0,0,target.width,240);ctx.drawImage(image,0,0);}
     appletBackingIdentity=Object.freeze({...appletIdentity});appletPresentation.reset();
    }
   }
   appletPose=appletPresentation.sample({identity:appletIdentity,elapsedMs:verification?.manualEntryObservedElapsedMs??elapsedMs,eligible:true,pair:graphics.preparedStockPair(state),reducedMotion:reduced});
  }
  setAppletEntryCovered(appletPose?.kind==='cover'?appletIdentity!.owner:null);
  if(diagnosticPaint||!manualIdentity||!manualEntryEligible(state))revokeManualEntryCandidate();
  const manualOwner=state.system?.runtime.systemApplet;
  if(!manualIdentity&&(!manualOwner||state.system?.runtime.instances[manualOwner]?.appId!=='manual')){manualPresentation.reset();manualBackingIdentity=null;}
  if(diagnosticPaint||!folderEntryEligible(state)||pauseEntryOwner(state)&&(!pauseEntryEligible(state)||!pauseEntryIdentity(state)))revokeHomeEntryMotionCandidate();
  const homeUpdate=state.system?.homeClock.updateCount??0;
  const folderIdentity=folderEntryIdentity(state);
  if(!diagnosticPaint&&nativeHome&&options.getHomeBanner){
   const owner=state.opened?folderEntryBannerOwner(state):null,key=owner?JSON.stringify(owner):null;
   if(key!==folderEntryMotionKey&&!folderEntryBanner.complete(owner)){
    folderEntryMotion=null;pendingFolderEntryMotion=null;folderEntryNeedsRebase=false;folderEntryMotionKey=key;
   }
  }
  if(!diagnosticPaint){entryMotionCandidate=undefined;if(!folderIdentity){folderEntryMotion=null;pendingFolderEntryMotion=null;}}
  const folderMotion=sampleHomeEntryMotionCandidate(folderEntryMotion,pendingFolderEntryMotion,folderIdentity,homeUpdate,folderEntryEligible(state),folderEntryNeedsRebase,reduced);
  const folderEntry=homeFolderEntryPose(folderMotion,reduced);
  // Diagnostic captures revoke pending pixels, never the last receipt-backed
  // pose. A reuse-only options object belongs to a live state-driven paint.
  homeEntryFooterCandidate=undefined;homeEntryFooterReleaseCandidate=undefined;homeEntryBannerCandidate=undefined;homeEntryNoBannerCandidate=undefined;
  if(!diagnosticPaint)homeEntryPresentation=homeEntry.presentation;
  let homeEntryFooterTerminalDrawn=false;
  let homeEntryFooterReleaseDrawn=false;
  let homeEntryBannerDrawn=false;
  let homeEntryDrawnBannerIdentity:HomeEntryBannerIdentity|null=null;
  let homeEntryDrawnNoBannerIdentity:string|null=null;
  const suspendedSleepFrame=getHomeSuspendedSleepFrame(suspendedPresentation);
  const applicationTransition=(state.system as SystemWithHomeApplicationTransition|undefined)?.homeApplicationTransition??null;
  const applicationFooterReturn=homeApplicationTransitionFooterReturn(sampleSystemHomeApplicationTransition(state),reduced);
  const applicationTransitionPresentation=homeApplicationTransitionPresentation(state.system?.sleeping?null:applicationTransition,reduced);
  const verificationPaint=verification?.homeWallpaperFrame===undefined?undefined:{homeWallpaper:false,healthBanner:false};
  graphics.syncStockView(state,t);
  t.resetTransform();t.clearRect(0,0,400,240);b.clearRect(0,0,320,240);
  if(!state.powered){if(!diagnosticPaint){resetHomeEntryMotion();resetManualEntry();resetAppletEntry();}t.fillStyle=b.fillStyle='#101318';t.fillRect(0,0,800,240);b.fillRect(0,0,320,240);output.drawImage(native,0,0,800,240);return;}
  const view=getHomePresentation(state);
  const launchCandidate=getHomeLaunchPresentation(state,elapsedMs,reduced);
  const time=reduced?0:elapsedMs;if(verification?.homeCursorLoopFrame!==undefined&&(!Number.isInteger(verification.homeCursorLoopFrame)||verification.homeCursorLoopFrame<0||verification.homeCursorLoopFrame>=60))throw new Error('HOME cursor loop frame must be an integer from 0 to 59');const palette=themes[state.theme];background(t,state,time);if(state.theme==='white'){const drawn=options.drawHomeBackground?.(t,time,reduced,verification?.homeWallpaperFrame,verification?.reuseHomeBackgroundMs);if(verificationPaint)verificationPaint.homeWallpaper=drawn===true;if(state.panel==='home-layouts'&&drawn!==true)throw new Error('Native HOME layout preview wallpaper unavailable');}
  const layoutPreview=currentLayoutPreview(state,time);
  const suspended=retainedSuspendedApplication(state),expanded=!!selectedSuspendedApplication(state);
  const suspendedCapture:SuspendedCapture=suspended?graphics.readSuspendedCapture(state.system!.runtime):{status:'none'};
  const pauseOwner=pauseEntryOwner(state);
  const pauseIdentity=pauseOwner&&suspendedCapture.status==='ready'&&suspendedCapture.owner===pauseOwner
   ?{kind:'pause' as const,owner:pauseOwner,captureGeneration:suspendedCapture.generation}
   :pauseOwner&&pauseEntryMotion?.identity.kind==='pause'&&pauseEntryMotion.identity.owner===pauseOwner?pauseEntryMotion.identity:null;
  if(!diagnosticPaint&&!pauseOwner){pauseEntryMotion=null;pendingPauseEntryMotion=null;}
  const pauseEligible=!!suspended&&suspendedCapture.status==='ready'&&!state.system?.dialog&&!applicationTransition;
  const pauseMotion=sampleHomeEntryMotionCandidate(pauseEntryMotion,pendingPauseEntryMotion,pauseIdentity,homeUpdate,
   pauseEligible,pauseEntryNeedsRebase,reduced);
  const pauseEntry=homePauseEntryPresentation(pauseMotion,reduced);
  const suspendedBackgroundPresentation=applicationTransitionPresentation??pauseEntry;
  if(!applicationTransition||applicationFooterReturn)applicationTransitionCapture=undefined;
  else if(!state.system?.sleeping){
   const captureOwner=suspendedCapture.status==='none'?null:suspendedCapture.owner;
   if(!suspended||captureOwner!==applicationTransition.identity.owner)throw Error('Stale HOME application-transition capture owner');
   if(suspendedCapture.status==='ready'){
    const identity=applicationTransition.identity,current=applicationTransitionCapture;
    if(!current||current.generation!==identity.generation||current.transitionId!==identity.transitionId||current.owner!==identity.owner){
     applicationTransitionCapture={...identity,captureGeneration:suspendedCapture.generation};
    }else if(current.captureGeneration!==suspendedCapture.generation)throw Error('HOME application-transition capture generation changed');
   }
  }
  if(!suspended)suspendedMetadata=undefined;
  if(!suspended)options.drawSuspendedBackground?.(t,suspendedCapture,suspendedBackgroundPresentation);
  if(suspended&&!options.drawSuspendedBackground?.(t,suspendedCapture,suspendedBackgroundPresentation))throw Error('Native suspended application background unavailable');
  const hostedBanner=options.getHomeBanner?.();
  const launchPresentation=!expanded&&launchCandidate&&hostedBanner?.status==='active'&&hostedBanner.stage==='active'
   &&hostedBanner.selection.kind==='app'&&hostedBanner.selection.id===launchCandidate.appId
   &&hostedBanner.primary.motion.visible&&hostedBanner.primary.selection.kind==='app'
   &&hostedBanner.primary.selection.id===launchCandidate.appId
   &&hostedBanner.resourceTicket?.generation===hostedBanner.primary.generation
   &&hostedBanner.resourceTicket.requestEpoch===hostedBanner.primary.requestEpoch
   ?launchCandidate:null;
  if(!expanded){
  homeEntryDrawnNoBannerIdentity=homeEntryNoBannerIdentity(hostedBanner);
  const hostedToolbar=hostedBanner?.status!=='unsupported'&&hostedBanner?.selection.kind==='toolbar'?hostedBanner.selection:null;
  // Captured root-held HOME has no title/banner. A confirmed continuous stroke
  // retains that capture-fitted visibility history after folder re-entry; this
  // is not a recovered native controller. Initial folder-held HOME keeps it.
  const hideHeldRootBanner=!!view.pickup&&(!state.opened||view.pickup.suppressUpperBanner);
  const toolbarUnavailableByFocus={1:'Native Game Notes toolbar banner unavailable.',2:'Native Friend List toolbar banner unavailable.',3:'Native Notifications toolbar banner unavailable.',4:'Native Internet Browser toolbar banner unavailable.',5:'Native Miiverse toolbar banner unavailable.'} as const;
  const toolbarFailure=hostedToolbar?.focus===1?options.getMemoBannerFailure?.():hostedToolbar?.focus===2?options.getFriendBannerFailure?.():hostedToolbar?.focus===3?options.getNewsBannerFailure?.():hostedToolbar?.focus===4?options.getWebBannerFailure?.():hostedToolbar?.focus===5?options.getMiiverseBannerFailure?.():null;
  const toolbarUnavailable=hostedToolbar&&toolbarUnavailableByFocus[hostedToolbar.focus];
  if(hostedToolbar&&toolbarFailure&&toolbarUnavailable&&firmwareAssets&&!firmwareAssets.diagnostics.includes(toolbarUnavailable))firmwareAssets.diagnostics.push(toolbarUnavailable);
  if(!hideHeldRootBanner){
  if(!diagnosticPaint&&nativeHome&&options.getHomeBanner&&!state.opened&&folderEntryEligible(state))rootFolderBannerCandidate={generation:entryMotionGeneration,source:null};
  let retainedFolderBanner:HomeFolderEntryBannerPose|null=null;
  if(!diagnosticPaint&&nativeHome&&options.getHomeBanner&&state.opened&&folderMotion&&folderEntryEligible(state)){
   const owner=folderEntryBannerOwner(state);if(!owner)throw Error('Native folder-entry banner identity unavailable');
   retainedFolderBanner=folderEntryBanner.sample(owner,folderMotion,homeFolderEntryBannerDestinationReady(hostedBanner),reduced);
  }
  if(retainedFolderBanner){
   const visible=retainedFolderBanner.primary.motion.visible;
   const label=visible?nativeHome?.folderBannerLabel(retainedFolderBanner.primary.selection.label):undefined;
   if(visible&&!label||options.drawFolderBannerFrame?.(t,retainedFolderBanner.primary.motion,label)!==true)throw Error('Native retained folder-entry banner unavailable');
   folderEntryBannerCandidate=retainedFolderBanner;
  }else{
  const app=graphics.selectedApp(state);if(app&&!state.panel&&state.system?.phase!=='app'&&!hostedToolbar&&!(hasHomeTitleBanner(app.id)&&hostedBanner?.selection?.kind==='app'&&hostedBanner.selection.id===app.id))graphics.banner(t,app,time,reduced);
  if(hostedBanner&&hostedBanner.status!=='unsupported'){
   // Pending/hidden native instances are handled without painting the incoming fallback.
   if(hostedBanner.status==='active'&&hostedBanner.primary.motion.visible&&(!state.panel||((state.panel==='folder-settings'||state.panel==='folder-not-empty')&&hostedBanner.primary.selection.kind==='folder'))&&(state.system?.phase==='home'||launchPresentation!==null)){
    const {selection,motion}=hostedBanner.primary;
    homeEntryDrawnBannerIdentity=homeEntryBannerIdentity(hostedBanner);
    if(selection.kind==='default'){
     const drawn=options.drawDefaultBannerFrame?.(t,motion)===true;homeEntryBannerDrawn=drawn;
     if(!drawn&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native default banner unavailable.'))firmwareAssets.diagnostics.push('Native default banner unavailable.');
    }else if(selection.kind==='toolbar'){
     const key=selection.focus===1?'memo':selection.focus===2?'fri':selection.focus===3?'news':selection.focus===4?'web':'mvs';
     const label=nativeHome?.appletBannerLabel(key);
     const drawn=selection.focus===1?options.drawMemoBannerFrame?.(t,motion,label)
      :selection.focus===2?options.drawFriendBannerFrame?.(t,motion,label)
      :selection.focus===3?options.drawNewsBannerFrame?.(t,motion,label)
      :selection.focus===4?options.drawWebBannerFrame?.(t,motion,label)
      :options.drawMiiverseBannerFrame?.(t,motion,label);
     homeEntryBannerDrawn=drawn===true;
     const unavailable=toolbarUnavailableByFocus[selection.focus];
     if(!drawn&&firmwareAssets&&!firmwareAssets.diagnostics.includes(unavailable))firmwareAssets.diagnostics.push(unavailable);
    }else if(selection.kind==='app'&&homeTitleBannerKind(selection.id)){
     const drawn=options.drawStockTitleBannerFrame?.(t,motion,hostedBanner.primary,homeTitleBannerKind(selection.id)!);homeEntryBannerDrawn=drawn===true;if(verificationPaint&&selection.id==='health-safety')verificationPaint.healthBanner=drawn===true;if(!drawn&&launchPresentation)throw Error(`Native ${selection.id} launch banner unavailable.`);if(!drawn&&firmwareAssets&&!firmwareAssets.diagnostics.includes(`Native ${selection.id} banner unavailable.`))firmwareAssets.diagnostics.push(`Native ${selection.id} banner unavailable.`);
    }else if(selection.kind==='app'){
     const drawn=options.drawSettingsBannerFrame?.(t,motion)===true;homeEntryBannerDrawn=drawn;
     if(!drawn&&launchPresentation)throw Error(`Native ${selection.id} launch banner unavailable.`);
     if(!drawn&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native Settings banner unavailable.'))firmwareAssets.diagnostics.push('Native Settings banner unavailable.');
    }else{
     const label=nativeHome?.folderBannerLabel(selection.label);
     const drawn=options.drawFolderBannerFrame?.(t,motion,label)===true;homeEntryBannerDrawn=drawn;
     const owner=rootFolderBannerCandidate?folderEntryBannerOwner(state):null;
     if(owner&&drawn&&label)rootFolderBannerCandidate={generation:entryMotionGeneration,source:homeFolderEntryBannerSource(owner,hostedBanner,homeUpdate)};
     if(!drawn){
      folder(t,200,115,91*(reduced?1:motion.scale),selection.label,reduced?0:motion.yawRadians);
      if(selection.label){rounded(t,85,181,230,30,10,'#ffffffbc');text(t,selection.label,200,196,16,palette.ink,'center');}
     }
    }
   }
  }else if(!hostedBanner&&!state.opened&&isFolder(state.selected,state)&&(!state.panel||state.panel==='folder-settings'||state.panel==='folder-not-empty')){
   const name=state.folders[state.selected],label=nativeHome?.folderBannerLabel(name),nativeDrawn=options.drawFolderBanner?.(t,time,reduced,label);
   if(!nativeDrawn){
   t.save();t.shadowColor='#626d8a50';t.shadowBlur=12;t.shadowOffsetY=10;
   folder(t,200,115+Math.sin(time/800)*2,91,state.folders[state.selected],Math.sin(time/1500)*.32);t.restore();
   if(firmwareAssets&&!firmwareAssets.diagnostics.includes('Native folder model unavailable; drawing reconstructed fallback.'))firmwareAssets.diagnostics.push('Native folder model unavailable; drawing reconstructed fallback.');}
   if(name&&(!nativeDrawn||!label)){rounded(t,85,181,230,30,10,'#ffffffbc');text(t,name,200,196,16,palette.ink,'center');}
  }
  if(!diagnosticPaint&&state.opened&&folderEntryEligible(state)&&!retainedFolderBanner){
   const owner=folderEntryBannerOwner(state),release=owner?folderEntryBanner.sampleRelease(owner):null;
   if(release){
    if(!homeEntryBannerDrawn||!homeEntryDrawnBannerIdentity||!homeFolderEntryBannerDestinationReady(hostedBanner))throw Error('Native folder-entry child banner unavailable');
    folderEntryBannerReleaseCandidate={release,identity:homeEntryDrawnBannerIdentity};
   }
  }
  }
  }
  if(state.panel&&state.panel!=='settings'&&state.panel!=='home-layouts'&&state.panel!=='folder-settings'&&state.panel!=='folder-not-empty'){
   const panels=['notes','friends','notifications','browser','miiverse'];
   const index=panels.indexOf(state.panel);const chosen=index<0?1:index;
   for(let i=0;i<5;i++){
    const x=105+i*47,y=128,sz=i===chosen?39:27;
    t.save();t.shadowColor='#6c718855';t.shadowBlur=4;t.shadowOffsetY=3;rounded(t,x-sz/2,y-sz/2,sz,sz,3,'#ffffff99','#fff');t.restore();
    if(sprite.complete&&sprite.naturalWidth){const sx=[12,55,96,138,181][i];t.drawImage(sprite,sx,3,i===4?30:25,25,x-sz*.4,y-sz*.4,sz*.8,sz*.8);}
   }
  }
  }
  if(suspended){
   if(!firmwareAssets)throw Error('Suspended application frame unavailable');
   if(suspendedMetadata?.owner!==suspended.id){
    const title=getTitle(suspended.appId),portfolio=getApp(suspended.appId),ctx=captureContext;
    ctx.resetTransform();ctx.clearRect(0,0,64,64);
    let description:string|undefined;
    if(title?.source==='firmware'&&title.titleId){
     description=firmwareAssets.titleDescriptions.get(title.titleId);
     const icon=firmwareAssets.titleIcons.get(title.titleId);
     if(!icon||!description)throw Error('Native suspended title metadata unavailable');
     ctx.drawImage(icon,0,0);
    }else if(title?.source==='portfolio'&&portfolio){
     description=portfolio.title;graphics.menuArtwork(ctx,portfolio,0,0,48,48);
    }else throw Error('Unsupported suspended title');
    suspendedMetadata={owner:suspended.id,metadata:{description,icon:{width:64,height:64,data:ctx.getImageData(0,0,64,64).data}}};
   }
   // The switch keeps the compact suspended-title window intact. Only the
   // separately captured ordinary-close route applies the fitted upper fade.
   const closeOpacity=homeSoftwareClosingDialogKey(state)&&applicationTransition?.intent.kind==='close'
    ?homeCloseWindowOpacity(reduced?20:applicationTransition.appQuitFrame):undefined;
   drawHomeSuspendedWindow(firmwareAssets.renderer,t,suspendedMetadata.metadata,expanded?'expanded':'compact',suspendedSleepFrame,closeOpacity);
  }
  // Native descending layout priority: upperBase499 then HUD100, both
  // after the upper 3D traversal. Camera hints stay inside upperBase.
  if(state.panel==='settings')nativeHome?.settingsUpper(t);else if(!suspended)nativeHome?.upperBase(t);
  // Native cold boot fades only the paired HOME bases, lower chrome and icons.
  // The HUD/footer packs have independent SceneIn clips, but their exact native
  // caller boundary remains untraced. This captured slice only prevents their
  // settled poses appearing beneath CmnFadeNinLogo while boot is still active.
  const bootBaseOnly=state.system?.phase==='boot';
  if(!bootBaseOnly&&!nativeHome?.hud(t,date,time,verification?.homeHudSample,homeEntry.hudSceneInFrame??undefined))status(t,date,chrome);
  b.fillStyle=palette.bottom;b.fillRect(0,0,320,240);if(!nativeHome&&state.theme==='white')chrome.draw(b,'icon-tray',0,33);if(!nativeHome?.toolbar(b,state))toolbar(b,sprite,chrome);nativeHome?.homePlate(b,state);folderBackdrop(state,time,folderEntry);const folderChromeDrawn=nativeHome?.folderChrome(b,state,reduced,folderEntry);if(state.opened&&nativeHome&&!folderChromeDrawn)throw Error('Native folder entry chrome unavailable');grid(b,state,time,reduced,graphics,chrome,view,nativeHome,false,firmwareAssets,suspendedSleepFrame,launchPresentation,verification?.homeCursorLoopFrame??getHomeCursorLoopFrame(state,reduced),folderEntry);nativeHome?.folderBalloon(b,state,view);
  if(!bootBaseOnly&&state.panel!=='folder-settings'&&state.panel!=='folder-not-empty'){
   const nativeFooterDrawn=nativeHome?.footer(b,state,reduced,homeEntry.footerSceneInFrame??undefined,launchPresentation?.footerSceneOutFrame,launchPresentation?.footerDecideFrame)===true;
   if(launchPresentation&&!nativeFooterDrawn)throw Error('Native HOME launch footer unavailable');
   if(!nativeFooterDrawn)footer(b,state,chrome);
   homeEntryFooterTerminalDrawn=nativeFooterDrawn&&getHomeFooter(state)!==null
    &&homeEntry.footerSceneInFrame===HOME_ENTRY_FOOTER_LAST_FRAME;
   homeEntryFooterReleaseDrawn=nativeFooterDrawn&&getHomeFooter(state)!==null&&homeEntry.footerSceneInFrame!==null
    &&homeEntry.footerSceneInFrame>=HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME;
  }
  if(!state.panel)dragGhost(b,view,graphics,nativeHome,firmwareAssets);panel(b,state,time,reduced,themeSprite,shopSprite,nativeHome);
  if(state.panel==='home-layouts'&&!layoutManager?.draw(t,b,state,()=>{if(!nativeHome?.hud(t,date,time,verification?.homeHudSample,homeEntry.hudSceneInFrame??undefined))status(t,date,chrome);},layoutPreview))throw new Error('Native HOME layout manager unavailable.');
  graphics.overlay(t,b,state,elapsedMs,reduced,!!firmwareAssets,date,verification);
  const dialogKey=homeSoftwareDialogKey(state),dialogTitles=homeSoftwareDialogTitles(state);
  if(!dialogTitles)softwareDialogIcons=undefined;
  if(dialogTitles&&softwareDialogIcons?.key!==dialogKey){
   const icons=dialogTitles.map(id=>{
    const title=getTitle(id),portfolio=getApp(id),ctx=captureContext;
    ctx.resetTransform();ctx.clearRect(0,0,48,48);
    if(title?.source==='firmware'&&title.titleId){
     const icon=firmwareAssets?.titleIcons.get(title.titleId);
     if(!icon)throw Error(`Native software dialog icon unavailable: ${id}`);
     ctx.drawImage(icon,0,0);
    }else if(title?.source==='portfolio'&&portfolio)graphics.menuArtwork(ctx,portfolio,0,0,48,48);
    else throw Error(`Unsupported software dialog icon: ${id}`);
    return {width:48,height:48,data:ctx.getImageData(0,0,48,48).data};
   });
   softwareDialogIcons={key:dialogKey!,icons};
  }
  if(homeSoftwareDialogKey(state)){
   if(!firmwareAssets)throw Error('Native software dialog resources unavailable');
   drawHomeSoftwareDialog(firmwareAssets.renderer,t,b,state,softwareDialogIcons?.icons);
  }
  if(homeSoftwareClosingDialogKey(state)&&!applicationFooterReturn){
   if(!firmwareAssets)throw Error('Native software-closing resources unavailable');
   // The source-selected exit clips use the adapted close clock; their native
   // start epoch and host cadence still need matched motion verification.
   const exitFrame=applicationTransition!.dialogExitFrame;
   drawHomeSoftwareClosingDialog(firmwareAssets.renderer,t,b,reduced?20:applicationTransition!.appQuitFrame,
    exitFrame===null?undefined:reduced?20:exitFrame,applicationTransition!.intent.kind);
  }
  const requiresNativeSystem=state.system&&!state.system.sleeping&&['boot','launch','power','shutdown'].includes(state.system.phase);
  const nativeSystem=firmwareAssets?drawNativeSystemOverlay(t,b,state,elapsedMs,reduced,firmwareAssets):false;
  if(requiresNativeSystem&&!nativeSystem)throw Error(`Native ${state.system!.phase} screen unavailable`);
  const nativeStatus=graphics.stockStatus(state,t);const notice=options.runtimeNotice?.();if(notice&&nativeStatus!=='loading'&&nativeStatus!=='error'){rounded(b,8,185,304,26,5,'#fff9e8','#a88d53');text(b,notice,160,198,11,'#5d491f','center');}
  let manualPose:ManualEntryPose|undefined;
  if(manualIdentity&&manualEntryEligible(state)&&!diagnosticPaint){
   if(!nativeHome)throw Error('Native Manual entry cover unavailable');
   if(nativeStatus==='error')revokeManualEntryCandidate();
   else{
    if(!sameManualEntryIdentity(manualBackingIdentity,manualIdentity)){
     if(!manualEntryBackingMatches(lastPresentedOrigin,manualIdentity))throw Error('Manual entry has no matching presented caller pair');
     for(const [target,image] of [[manualBackingUpper,lastPresentedUpper],[manualBackingLower,lastPresentedLower]]){const ctx=target.getContext('2d')!;ctx.resetTransform();ctx.clearRect(0,0,target.width,240);ctx.drawImage(image,0,0);}
     manualBackingIdentity=Object.freeze({...manualIdentity});manualPresentation.reset();
    }
    manualPose=manualPresentation.sample({identity:manualIdentity,elapsedMs:verification?.manualEntryObservedElapsedMs??elapsedMs,eligible:true,destinationReady:nativeStatus==='ready',reducedMotion:reduced});
    if(manualPose){
     if(manualPose.phase==='out'){for(const [ctx,image] of [[t,manualBackingUpper],[b,manualBackingLower]] as const){ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,ctx.canvas.width,240);ctx.drawImage(image,0,0);}}
     if(!nativeHome.manualEntry(t,b,manualPose))throw Error('Native Manual entry paired cover unavailable');
     manualCandidate=manualPose;
    }
   }
  }
  if(appletPose&&appletIdentity){
   if(graphics.stockFailure()!==null){revokeAppletEntryCandidate();appletPose=undefined;}
   else{
    const pair=graphics.preparedStockPair(state);
    if(appletPose.kind==='handoff'){
     if(pair)appletPose=appletPresentation.bindPreparedPair(pair);
     else{revokeAppletEntryCandidate();appletPose=appletPresentation.sample({identity:appletIdentity,elapsedMs:verification?.manualEntryObservedElapsedMs??elapsedMs,eligible:true,reducedMotion:reduced});setAppletEntryCovered(appletIdentity.owner);}
    }
    if(appletPose?.kind==='cover'){
     for(const [ctx,image] of [[t,appletBackingUpper],[b,appletBackingLower]] as const){ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,ctx.canvas.width,240);ctx.drawImage(image,0,0);}
     if(!nativeHome!.appletEntry(t,b,{appId:appletIdentity.appId,frame:appletPose.frame}))throw Error('Native applet entry paired cover unavailable');
     appletCoverPainted=true;graphics.revokeNotesBootCoverCandidate();
    }
    appletCandidate=appletPose;
   }
  }
  output.imageSmoothingEnabled=false;output.clearRect(0,0,800,240);output.drawImage(native,0,0,800,240);
  if(!diagnosticPaint&&state.system?.phase==='home'&&appletEntryEligible(state)&&nativeHome&&nativeStatus!=='error'&&nativeStatus!=='loading')appletSourceCandidate={source:appletEntryHomePair(state,appletGeneration),application:state.system.runtime.application,generation:appletGeneration};
  if(!diagnosticPaint&&!manualIdentity&&nativeHome&&nativeStatus!=='error'&&nativeStatus!=='loading'){const source=manualEntryOrigin(state,manualGeneration);if(source&&(source.kind==='home'||nativeStatus==='ready'))manualSourceCandidate=source;}
  if(!diagnosticPaint){
   const folderNeeds=folderMotion&&(!homeEntryMotionMatches(folderEntryMotion,folderIdentity)||folderEntryNeedsRebase||homeEntryMotionActive(folderEntryMotion)||!!pendingFolderEntryMotion||!!folderEntryBannerCandidate);
   const pauseNeeds=pauseMotion&&(!homeEntryMotionMatches(pauseEntryMotion,pauseIdentity)||pauseEntryNeedsRebase||homeEntryMotionActive(pauseEntryMotion)||!!pendingPauseEntryMotion);
   pendingFolderEntryMotion=folderNeeds?folderMotion:null;pendingPauseEntryMotion=pauseNeeds?pauseMotion:null;
   if(folderEntryEligible(state)&&folderNeeds||suspended&&pauseNeeds&&!applicationTransitionPresentation){
    entryMotionCandidate={generation:entryMotionGeneration,folder:folderEntryEligible(state)?pendingFolderEntryMotion:null,
     folderNavigationRevision:getHomeNavigation(state).selectionRevision,pause:suspended&&!applicationTransitionPresentation?pendingPauseEntryMotion:null};
   }
  }
  if(!diagnosticPaint&&homeEntryFooterTerminalDrawn)homeEntryFooterCandidate={sample:homeEntry,state};
  if(!diagnosticPaint&&homeEntryFooterReleaseDrawn&&homeEntry.presentation.footerReleasedAtUpdate===null)homeEntryFooterReleaseCandidate={sample:homeEntry,state};
  if(!diagnosticPaint&&homeEntryBannerDrawn&&homeEntryDrawnBannerIdentity&&homeEntry.presentation.footerTerminalAtUpdate!==null
   &&homeEntry.presentation.bannerPresentedAtUpdate===null&&!homeEntry.presentation.bannerBypassed)homeEntryBannerCandidate={sample:homeEntry,state,identity:homeEntryDrawnBannerIdentity};
  if(!diagnosticPaint&&homeEntryDrawnNoBannerIdentity&&homeEntry.presentation.footerTerminalAtUpdate!==null
   &&homeEntry.presentation.bannerPresentedAtUpdate===null&&!homeEntry.presentation.bannerBypassed)homeEntryNoBannerCandidate={sample:homeEntry,state,identity:homeEntryDrawnNoBannerIdentity};
  const visibleFolderEntry=isSystemHomeFolderClosing(state)?null:folderEntry;
  const visiblePauseEntry=suspended&&!applicationTransitionPresentation?pauseEntry:null;
  const entryMotion=visibleFolderEntry||visiblePauseEntry
   ?{folder:visibleFolderEntry,pauseFrame:visiblePauseEntry?.material[0].frame??null}:undefined;
  return nativeSystem||verificationPaint||entryMotion||manualPose||appletPose
   ?{...(verificationPaint??{}),...(nativeSystem?{nativeSystem:true as const}:{}),...(entryMotion?{entryMotion}:{}),...(manualPose?{manualEntry:{phase:manualPose.phase,frame:manualPose.frame,owner:manualPose.identity.owner}}:{}),...(appletPose?{appletEntry:{kind:appletPose.kind,frame:appletPose.kind==='cover'?appletPose.frame:null,owner:appletPose.identity.owner}}:{})}:undefined;
 }
 function presentHomeEntryFooterRelease(){
  const candidate=homeEntryFooterReleaseCandidate;homeEntryFooterReleaseCandidate=undefined;
  if(disposed||!candidate||candidate.sample.presentation!==homeEntryPresentation)return false;
  homeEntryPresentation=acknowledgeHomeEntryFooterRelease(candidate.sample,candidate.state);return true;
 }
 function presentHomeEntryFooterTerminal(){
  const candidate=homeEntryFooterCandidate;homeEntryFooterCandidate=undefined;
  if(disposed||!candidate||candidate.sample.presentation!==homeEntryPresentation)return false;
  homeEntryPresentation=acknowledgeHomeEntryFooterTerminal(candidate.sample,candidate.state);return true;
 }
 function presentHomeEntryBanner(){
  const candidate=homeEntryBannerCandidate;homeEntryBannerCandidate=undefined;
  if(disposed||!candidate||candidate.sample.presentation!==homeEntryPresentation)return false;
  const current=homeEntryBannerIdentity(options.getHomeBanner?.());
  if(!current||current.generation!==candidate.identity.generation||current.requestEpoch!==candidate.identity.requestEpoch
   ||current.activationEpoch!==candidate.identity.activationEpoch)return false;
  homeEntryPresentation=acknowledgeHomeEntryBannerPresentation(candidate.sample,candidate.state);return true;
 }
 function presentHomeEntryWithoutNativeBanner(){
  const candidate=homeEntryNoBannerCandidate;homeEntryNoBannerCandidate=undefined;
  if(disposed||!candidate||candidate.sample.presentation!==homeEntryPresentation)return false;
  if(homeEntryNoBannerIdentity(options.getHomeBanner?.())!==candidate.identity)return false;
  homeEntryPresentation=bypassHomeEntryBannerPresentation(candidate.sample,candidate.state);return true;
 }
 function homeEntryActivationReady(state:MenuState){
  return homeEntryBannerActivationDue(sampleHomeEntryPresentation(homeEntryPresentation,state,reduced));
 }
 return {top,nativeTop:native,bottom,paint,stockStatus,retryStockScreen,stockFailure:()=>panelFailure??graphics.stockFailure(),setFirmwareAssets,prepareFolderBannerLabel:(name:string)=>nativeHome?.folderBannerLabel(name),homeEntryFooterReadiness:()=>getHomeEntryFooterReadiness(homeEntryPresentation),homeEntryActivationReady,homeFolderBannerRequestReady,homeFolderBannerActivationReady,presentHomeEntryMotion,homeEntryMotionActive:isHomeEntryMotionActive,homeEntryMotionPublicationPending:()=>!!entryMotionCandidate,revokeHomeEntryMotionCandidate,presentManualEntry,revokeManualEntryCandidate,manualEntryActive,presentAppletEntry,revokeAppletEntryCandidate,appletEntryActive,skipAppletEntryForAccessibilityShortcut,presentHomeEntryFooterRelease,presentHomeEntryFooterTerminal,presentHomeEntryBanner,presentHomeEntryWithoutNativeBanner,
  notesBootCoverActive:(state:MenuState)=>{const identity=appletEntryIdentity(state,appletGeneration);return (!identity||appletPresentation.ready(identity))&&graphics.notesBootCoverActive(state);},presentNotesBootCover,revokeNotesBootCoverCandidate:()=>graphics.revokeNotesBootCoverCandidate(),revokeHomeEntryFooterCandidate(){homeEntryFooterCandidate=undefined;homeEntryFooterReleaseCandidate=undefined;},revokeHomeEntryBannerCandidate(){homeEntryBannerCandidate=undefined;},revokeHomeEntryNoBannerCandidate(){homeEntryNoBannerCandidate=undefined;},dispose(){if(disposed)return;disposed=true;resetAppletEntry();appletPresentation.dispose();for(const canvas of appletCanvases)canvas.width=canvas.height=0;resetManualEntry();manualPresentation.dispose();for(const canvas of manualCanvases)canvas.width=canvas.height=0;panelFailure=undefined;panelPublished=null;folderCapture=undefined;layoutCapture=undefined;suspendedMetadata=undefined;resetHomeEntryMotion();homeEntryPresentation=createHomeEntryPresentation();homeEntryFooterCandidate=undefined;homeEntryFooterReleaseCandidate=undefined;homeEntryBannerCandidate=undefined;homeEntryNoBannerCandidate=undefined;applicationTransitionCapture=undefined;softwareDialogIcons=undefined;captureCanvas.width=captureCanvas.height=0;graphics.dispose();firmwareAssets?.dispose();fonts.delete(t);fonts.delete(b);setPortfolioFont(t);setPortfolioFont(b);},setReducedMotion(value:boolean){if(reduced!==value){revokeHomeEntryMotionCandidate();revokeManualEntryCandidate();revokeAppletEntryCandidate();}reduced=value;},ready:Promise.allSettled([sprite.decode(),themeSprite.decode(),shopSprite.decode(),fontReady,graphics.ready,chrome.ready])};
}
