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
import { leaveHomeFolder } from './home-navigation';
import { getHomeFooter, getHomePresentation, type HomePresentation } from './home-presentation';
import { type MenuState, type Theme, isFolder, pageStart, rowCount, slotCount, themeChoices } from './state';
import { type BitmapFont } from './bitmap-font';
import { createFirmwareHome, type FirmwarePresentationAssets } from './firmware-presentation';
import { getHomeFolderIdentity } from './home-folder-identity';
import type { NativePixels } from './native-layout';
import type { HomeBannerHostView } from './home-banner-host';
import type { HomeBannerMotion } from './home-banner-lifecycle';
export { loadFirmwarePresentationAssets, type FirmwarePresentationAssets } from './firmware-presentation';
type Context = CanvasRenderingContext2D;
type NativeHome=ReturnType<typeof createFirmwareHome>;
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
 const {two,left,right}=actions,labels={'close-folder':'Close','close-software':'Close software','folder-settings':'Settings',manual:'Manual',resume:'Resume',open:'Open','create-folder':'Create Folder'};
 if(two){line(c,[[104.5,214],[104.5,240]],'#aaabb2');text(c,left?labels[left]:'',52,226,11,'#494b51','center');text(c,labels[right],212,226,14,'#494b51','center');}
 else{if(state.opened)text(c,'↶',24,226,19);text(c,labels[right],160,226,14,'#494b51','center');}
}
function arrows(c:Context,state:MenuState){
 for(const right of [false,true]){
  if(!right&&pageStart(state)===0)continue;
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
function grid(c:Context,state:MenuState,time:number,reduced:boolean,graphics:ReturnType<typeof createPortfolioGraphics>,chrome:ReturnType<typeof createNativeChrome>,view:HomePresentation,nativeHome?:NativeHome,capture=false,assets?:FirmwarePresentationAssets){
 const system=state.system,controls=nativeHome?system?.homeControls:null;
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
   else if(appId)artwork(()=>titleIcon(c,appId,x,y,size,assets));
   else if(folderLabel!==null&&!nativeDrawn)artwork(()=>folder(c,x+size/2,y+size/2,size*.78,folderLabel));
  }else if(!nativeHome?.empty(c,x,y,size,view.density)){
   artwork(()=>{const inset=size*.34,side=size-inset*2;
   rounded(c,x+inset,y+inset,side,side,2,'#d3d4d766','#c8c9cc');
   line(c,[[x+inset+1,y+inset+side],[x+inset+side,y+inset+side],[x+inset+side,y+inset+1]],'#e9e9eb');});
  }
  };
  if(nativeHome&&!capture)nativeHome.folderChild(c,state,!occupied,drawTile,reduced);else drawTile(1);
  if(!controls&&!capture&&!isSystemHomeFolderClosing(state)&&tile.cursor&&!nativeHome?.cursor(c,x,tile.y,size,view.density,getHomeCursorLoopFrame(state,reduced),pressed))cursor(c,x,y,size,size,time,reduced);
 }c.restore();
 // Retained native layouts can target toolbar anchors and offscreen departures.
 // Paint after the tile clip, before the existing arrows; the host owns close
 // visibility and controller updates. Rendering only samples applied poses.
 // Only authored grid scroll/drag suppress this group; ordinary press does not.
 if(nativeHome&&controls&&!capture&&state.powered&&system?.phase==='home'
  &&!system.sleeping&&!system.dialog&&!system.preferences&&!state.panel
  &&!(system.homeNavigation.gesture?.area==='grid'&&system.homeNavigation.gesture.mode!=='press')){
  const {primary,presentation}=controls;
  if(primary.layoutVisible)nativeHome.cursorAt(c,primary.center.x,primary.center.y,presentation.primaryScale.appliedFrame,getHomeCursorLoopFrame(state,reduced));
  if(!reduced)for(const effect of presentation.effects)if(effect.visible){
   nativeHome.cursorEffectAt(c,effect.center.x,effect.center.y,effect.scale.appliedFrame,effect.disappear.appliedFrame);
  }
 }
 if(!capture&&!nativeHome?.arrows(c,pageStart(state)>0))arrows(c,state);
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
 c.save();c.beginPath();c.rect(0,0,320,240);c.clip();
 const pickup=nativeHome&&(view.pickup
  ?nativeHome.pickupAt(c,x,y,view.pickup.scale.appliedFrame!)
  :nativeHome.pickup(c,x,y,size,view.density,item.kind==='folder',item.kind==='folder'?item.label:''));
 if(pickup?.drawn){
  if(app){const rect=pickup.icon;c.globalAlpha=rect.alpha;graphics.menuArtwork(c,app,rect.x,rect.y,rect.width,rect.height);}
  else if(item.kind==='app'){const rect=pickup.icon;c.globalAlpha=rect.alpha;titleArtwork(c,item.id,rect.x,rect.y,rect.width,rect.height,assets);}
 }else if(item.kind==='folder')folder(c,x,y,size*.78,item.label);
 else if(app){rounded(c,x-size/2,y-size/2,size,size,8,'#f8f9fc','#adb4bf');graphics.menuIcon(c,app,x-size/2,y-size/2,size);}
 else if(item.kind==='app'){rounded(c,x-size/2,y-size/2,size,size,8,'#f8f9fc','#adb4bf');titleIcon(c,item.id,x-size/2,y-size/2,size,assets);}
 c.restore();
}

function panel(c:Context,state:MenuState,time:number,reduced:boolean,themeSprite:HTMLImageElement,shopSprite:HTMLImageElement){
 if(!state.panel)return;
 c.fillStyle='#171a2b66';c.fillRect(0,0,320,240);
 if(state.panel==='settings'){
  c.save();c.shadowColor='#3338';c.shadowBlur=8;c.shadowOffsetX=2;rounded(c,26,-7,268,264,3,'#eeeff2');c.restore();
  for(let y=0;y<240;y+=3){c.fillStyle='#b5b8c318';c.fillRect(27,y,265,1);}
  text(c,'⌂ HOME Menu Design',48,25,14);
  button(c,42,38,214,62,'');
  if(themeSprite.complete&&themeSprite.naturalWidth)c.drawImage(themeSprite,53,45);else text(c,'Change Theme',149,68,14,'#44464b','center');
  text(c,'Screen Brightness',63,137,14);text(c,'☀',47,137,16,'#70747c');
  c.save();c.shadowColor='#5558';c.shadowBlur=3;c.shadowOffsetY=2;
  rounded(c,49,152,204,39,7,gradient(c,152,39,'#f9f9f9','#cfd0d1'),'#96999c');c.restore();
  for(let i=0;i<5;i++){
   const x=51+i*40;if(Math.round(state.brightness*5)===i+1){rounded(c,x,154,40,35,i===4?5:1,gradient(c,154,35,'#b6ffbf','#8cf5a5'));c.fillStyle='#a9fab8';c.beginPath();c.moveTo(x+13,152);c.lineTo(x+20,159);c.lineTo(x+27,152);c.fill();}
   if(i)line(c,[[x,154],[x,189]],'#999c9e');text(c,String(i+1),x+20,172,17,'#484b4e','center');
  }
  text(c,'Power-Saving Mode',63,208,14);button(c,50,220,100,34,'OFF',!state.powerSaving);button(c,150,220,100,34,'ON',state.powerSaving);
  rounded(c,267,20,19,106,4,gradient(c,20,106,'#fff','#d0d1d5'),'#b9bac0');line(c,[[272,71],[281,71]],'#aaa',2);line(c,[[272,76],[281,76]],'#aaa',2);
  if(state.system){button(c,267,149,20,45,state.system.muted?'×':'♪');}
  if(state.panelChoice===0){rounded(c,37,32,225,78,12,'#0000','#dfb991');cursor(c,48,42,202,53,time,reduced);}
  else if(state.panelChoice===1)cursor(c,50,152,200,39,time,reduced);
  else cursor(c,50,220,200,34,time,reduced);
  rounded(c,-13,207,47,45,12,'#666b73');text(c,'×',15,224,30,'white','center');
 }else if(state.panel==='themes'){
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
 }else if(state.panel==='folder-settings'){
  rounded(c,28,35,264,176,9,gradient(c,35,176,'#fff','#d9dbe0'),'#979ba5');text(c,'Folder Settings',160,50,14,'#484b53','center');
  button(c,34,68,252,57,'Rename');button(c,34,129,252,57,'Delete');cursor(c,34,state.panelChoice===0?68:129,252,57,time,reduced);
  text(c,'Ⓑ Cancel',160,200,13,'#484b53','center');
 }else if(state.panel==='delete'){
  rounded(c,20,44,280,164,9,'#f5f5f7','#adb0b8');text(c,'Delete this folder?',160,97,15,'#44464b','center');button(c,28,165,126,35,'Cancel');button(c,166,165,126,35,'Delete');
 }else{
  const titles={notes:'Game Notes',friends:'Friend List',notifications:'Notifications',browser:'Internet Browser',miiverse:'Miiverse','theme-shop':'Theme Shop'};
  rounded(c,0,0,320,240,0,'#eff0f4');c.fillStyle=gradient(c,0,31,'#fff','#d7dae0');c.fillRect(0,0,320,31);text(c,titles[state.panel],160,16,15,'#454b58','center');
  if(state.panel==='notes'){
   for(let y=52;y<204;y+=17)line(c,[[18,y],[302,y]],'#cbd9e8');line(c,[[36,36],[36,206]],'#e3b6bc');
  }else{const messages={friends:'No friends registered.',notifications:'No notifications.',browser:'Internet Browser is not available.',miiverse:'Miiverse service has ended.','theme-shop':'Purchases are no longer available.'};text(c,messages[state.panel],160,115,13,'#646b78','center');}
  c.fillStyle=gradient(c,212,28,'#fff','#c9cdd5');c.fillRect(0,212,320,28);text(c,'Ⓑ Close',160,226,14,'#4d535e','center');
 }
}
export function createScreens(options: { soundRoom?:StockModelBackground;cameraShoot?:StockModelBackground; font?: BitmapFont; reducedMotion?: boolean; firmwareAssets?:FirmwarePresentationAssets; drawFolderBanner?:(ctx:Context,time:number,reduced:boolean,label?:NativePixels)=>boolean; getHomeBanner?:()=>HomeBannerHostView|undefined; drawFolderBannerFrame?:(ctx:Context,motion:HomeBannerMotion,label?:NativePixels)=>boolean; drawDefaultBannerFrame?:(ctx:Context,motion:HomeBannerMotion)=>boolean; drawSettingsBannerFrame?:(ctx:Context,motion:HomeBannerMotion)=>boolean; drawNewsBanner?:(ctx:Context,time:number,reduced:boolean,label?:NativePixels)=>boolean; drawFriendBanner?:(ctx:Context,time:number,reduced:boolean,label?:NativePixels)=>boolean; drawMemoBanner?:(ctx:Context,time:number,reduced:boolean,label?:NativePixels)=>boolean; drawWebBanner?:(ctx:Context,time:number,reduced:boolean,label?:NativePixels)=>boolean; drawMiiverseBanner?:(ctx:Context,time:number,reduced:boolean,label?:NativePixels)=>boolean; drawStockTitleBannerFrame?:(ctx:Context,motion:HomeBannerMotion,ticket:Readonly<{generation:string;requestEpoch:number}>,kind:NonNullable<ReturnType<typeof homeTitleBannerKind>>)=>boolean; drawHomeBackground?:(ctx:Context,time:number,reduced:boolean,sourceFrame?:number,reuseWithinMs?:number)=>boolean; runtimeNotice?:()=>string|null } = {}){
 const top=document.createElement('canvas');top.width=800;top.height=240;
 const bottom=document.createElement('canvas');bottom.width=320;bottom.height=240;
 const native=document.createElement('canvas');native.width=400;native.height=240;
 const output=top.getContext('2d')!,t=native.getContext('2d')!,b=bottom.getContext('2d')!;
 const graphics=createPortfolioGraphics({soundRoom:options.soundRoom,cameraShoot:options.cameraShoot,reducedMotion:()=>reduced});const chrome=createNativeChrome();
 const sprite=new Image();sprite.src='/os/home-toolbar.png';
 const themeSprite=new Image();themeSprite.src='/os/change-theme.png';
 const shopSprite=new Image();shopSprite.src='/os/theme-shop.png';
 const fontReady=loadSystemFont();
 let firmwareAssets:FirmwarePresentationAssets|undefined,nativeHome:NativeHome|undefined,disposed=false;
 let folderCapture:{identity:string;pixels:NativePixels}|undefined;
 const useFont=(font:BitmapFont)=>{for(const ctx of [t,b]){fonts.set(ctx,font);setPortfolioFont(ctx,font);}};
 if(options.font)useFont(options.font);
 function setFirmwareAssets(assets:FirmwarePresentationAssets){if(disposed){assets.dispose();return;}if(firmwareAssets&&firmwareAssets!==assets)firmwareAssets.dispose();firmwareAssets=assets;nativeHome=createFirmwareHome(assets);folderCapture=undefined;useFont(assets.sharedFont);}
 if(options.firmwareAssets)setFirmwareAssets(options.firmwareAssets);
 const captureCanvas=document.createElement('canvas');captureCanvas.width=320;captureCanvas.height=240;
 const captureContext=captureCanvas.getContext('2d',{willReadFrequently:true})!;
 function folderBackdrop(state:MenuState,time:number){
  if(!state.opened){folderCapture=undefined;return;}
  if(!nativeHome)return;
  const identity=getHomeFolderIdentity(state,state.selected)??`slot:${state.selected}`;
  if(folderCapture?.identity!==identity){
   // Native 0x1b56f4 redraws the root before capture, with the footer,
   // cursor/effects, arrows and balloon hidden. Never copy the old onscreen footer.
   const root=leaveHomeFolder(state),view=getHomePresentation(root),ctx=captureContext;
   ctx.resetTransform();ctx.clearRect(0,0,320,240);ctx.fillStyle=themes[root.theme].bottom;ctx.fillRect(0,0,320,240);
   nativeHome.toolbar(ctx,root,true);nativeHome.homePlate(ctx,root);grid(ctx,root,time,reduced,graphics,chrome,view,nativeHome,true,firmwareAssets);
   folderCapture={identity,pixels:{width:320,height:206,data:ctx.getImageData(0,34,320,206).data}};
  }
  nativeHome.folderBackdrop(b,folderCapture.pixels,state,reduced);
 }
 let reduced=options.reducedMotion??false;
 /** reuseHomeBackgroundMs: an input-driven paint may recompose over the HOME
  * background sampled by the latest cadence paint, if it is at most this old.
  * The background then advances only on the LCD cadence, as without the paint. */
 function paint(state:MenuState,date=new Date(),elapsedMs=0,verification?:{sampleCalendar?:boolean;homeHudSample?:DiagnosticHomeHudSample;homeWallpaperFrame?:number;reuseHomeBackgroundMs?:number}){
  if(disposed)return;
  const verificationPaint=verification?.homeWallpaperFrame===undefined?undefined:{homeWallpaper:false,healthBanner:false};
  graphics.syncStockView(state,t);
  t.resetTransform();t.clearRect(0,0,400,240);b.clearRect(0,0,320,240);
  if(!state.powered){t.fillStyle=b.fillStyle='#101318';t.fillRect(0,0,800,240);b.fillRect(0,0,320,240);output.drawImage(native,0,0,800,240);return;}
  const view=getHomePresentation(state);
  const time=reduced?0:elapsedMs;const palette=themes[state.theme];background(t,state,time);if(state.theme==='white'){const drawn=options.drawHomeBackground?.(t,time,reduced,verification?.homeWallpaperFrame,verification?.reuseHomeBackgroundMs);if(verificationPaint)verificationPaint.homeWallpaper=drawn===true;}
  const hostedBanner=options.getHomeBanner?.();
  const toolbarFocus=hostedBanner?.status==='unsupported'&&hostedBanner.selection?.kind==='toolbar'?hostedBanner.selection.focus:null;
  const toolbarNews=toolbarFocus===3,toolbarFriend=toolbarFocus===2,toolbarMemo=toolbarFocus===1,toolbarWeb=toolbarFocus===4,toolbarMiiverse=toolbarFocus===5;
  const app=graphics.selectedApp(state);if(app&&!state.panel&&state.system?.phase!=='app'&&!toolbarNews&&!toolbarFriend&&!toolbarMemo&&!toolbarWeb&&!toolbarMiiverse&&!(hasHomeTitleBanner(app.id)&&hostedBanner?.selection?.kind==='app'&&hostedBanner.selection.id===app.id))graphics.banner(t,app,time,reduced);
  if(toolbarMiiverse&&!state.panel&&state.system?.phase==='home'){
   const label=nativeHome?.folderBannerLabel('Miiverse');
   if(!options.drawMiiverseBanner?.(t,time,reduced,label)&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native Miiverse toolbar banner unavailable.'))firmwareAssets.diagnostics.push('Native Miiverse toolbar banner unavailable.');
  }
  if(toolbarWeb&&!state.panel&&state.system?.phase==='home'){
   const label=nativeHome?.folderBannerLabel('Internet Browser');
   if(!options.drawWebBanner?.(t,time,reduced,label)&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native Internet Browser toolbar banner unavailable.'))firmwareAssets.diagnostics.push('Native Internet Browser toolbar banner unavailable.');
  }
  if(toolbarFriend&&!state.panel&&state.system?.phase==='home'){
   const label=nativeHome?.folderBannerLabel('Friend List');
   if(!options.drawFriendBanner?.(t,time,reduced,label)&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native Friend List toolbar banner unavailable.'))firmwareAssets.diagnostics.push('Native Friend List toolbar banner unavailable.');
  }
  if(toolbarNews&&!state.panel&&state.system?.phase==='home'){
   const label=nativeHome?.folderBannerLabel('Notifications');
   if(!options.drawNewsBanner?.(t,time,reduced,label)&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native Notifications toolbar banner unavailable.'))firmwareAssets.diagnostics.push('Native Notifications toolbar banner unavailable.');
  }
  if(toolbarMemo&&!state.panel&&state.system?.phase==='home'){
   const label=nativeHome?.folderBannerLabel('Game Notes');
   if(!options.drawMemoBanner?.(t,time,reduced,label)&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native Game Notes toolbar banner unavailable.'))firmwareAssets.diagnostics.push('Native Game Notes toolbar banner unavailable.');
  }
  if(hostedBanner&&hostedBanner.status!=='unsupported'){
   // Pending/hidden native instances are handled without painting the incoming fallback.
   if(hostedBanner.status==='active'&&hostedBanner.primary.motion.visible&&!state.panel&&state.system?.phase==='home'){
    const {selection,motion}=hostedBanner.primary;
    if(selection.kind==='default'){
     if(!options.drawDefaultBannerFrame?.(t,motion)&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native default banner unavailable.'))firmwareAssets.diagnostics.push('Native default banner unavailable.');
    }else if(selection.kind==='app'&&homeTitleBannerKind(selection.id)){
     const drawn=options.drawStockTitleBannerFrame?.(t,motion,hostedBanner.primary,homeTitleBannerKind(selection.id)!);if(verificationPaint&&selection.id==='health-safety')verificationPaint.healthBanner=drawn===true;if(!drawn&&firmwareAssets&&!firmwareAssets.diagnostics.includes(`Native ${selection.id} banner unavailable.`))firmwareAssets.diagnostics.push(`Native ${selection.id} banner unavailable.`);
    }else if(selection.kind==='app'){
     if(!options.drawSettingsBannerFrame?.(t,motion)&&firmwareAssets&&!firmwareAssets.diagnostics.includes('Native Settings banner unavailable.'))firmwareAssets.diagnostics.push('Native Settings banner unavailable.');
    }else{
     const label=nativeHome?.folderBannerLabel(selection.label);
     if(!options.drawFolderBannerFrame?.(t,motion,label)){
      folder(t,200,115,91*(reduced?1:motion.scale),selection.label,reduced?0:motion.yawRadians);
      if(selection.label){rounded(t,85,181,230,30,10,'#ffffffbc');text(t,selection.label,200,196,16,palette.ink,'center');}
     }
    }
   }
  }else if(!hostedBanner&&!state.opened&&isFolder(state.selected,state)&&!state.panel){
   const name=state.folders[state.selected],label=nativeHome?.folderBannerLabel(name),nativeDrawn=options.drawFolderBanner?.(t,time,reduced,label);
   if(!nativeDrawn){
   t.save();t.shadowColor='#626d8a50';t.shadowBlur=12;t.shadowOffsetY=10;
   folder(t,200,115+Math.sin(time/800)*2,91,state.folders[state.selected],Math.sin(time/1500)*.32);t.restore();
   if(firmwareAssets&&!firmwareAssets.diagnostics.includes('Native folder model unavailable; drawing reconstructed fallback.'))firmwareAssets.diagnostics.push('Native folder model unavailable; drawing reconstructed fallback.');}
   if(name&&(!nativeDrawn||!label)){rounded(t,85,181,230,30,10,'#ffffffbc');text(t,name,200,196,16,palette.ink,'center');}
  }
  if(state.panel){
   const panels=['notes','friends','notifications','browser','miiverse'];
   const index=panels.indexOf(state.panel);const chosen=index<0?1:index;
   for(let i=0;i<5;i++){
    const x=105+i*47,y=128,sz=i===chosen?39:27;
    t.save();t.shadowColor='#6c718855';t.shadowBlur=4;t.shadowOffsetY=3;rounded(t,x-sz/2,y-sz/2,sz,sz,3,'#ffffff99','#fff');t.restore();
    if(sprite.complete&&sprite.naturalWidth){const sx=[12,55,96,138,181][i];t.drawImage(sprite,sx,3,i===4?30:25,25,x-sz*.4,y-sz*.4,sz*.8,sz*.8);}
   }
  }
  // Native descending layout priority: upperBase499 then HUD100, both
  // after the upper 3D traversal. Camera hints stay inside upperBase.
  nativeHome?.upperBase(t);if(!nativeHome?.hud(t,date,time,verification?.homeHudSample))status(t,date,chrome);
  b.fillStyle=palette.bottom;b.fillRect(0,0,320,240);if(!nativeHome&&state.theme==='white')chrome.draw(b,'icon-tray',0,33);if(!nativeHome?.toolbar(b,state))toolbar(b,sprite,chrome);nativeHome?.homePlate(b,state);folderBackdrop(state,time);nativeHome?.folderChrome(b,state,reduced);grid(b,state,time,reduced,graphics,chrome,view,nativeHome,false,firmwareAssets);nativeHome?.folderBalloon(b,state,view);if(!nativeHome?.footer(b,state,reduced))footer(b,state,chrome);if(!state.panel)dragGhost(b,view,graphics,nativeHome,firmwareAssets);panel(b,state,time,reduced,themeSprite,shopSprite);
  graphics.overlay(t,b,state,elapsedMs,reduced,!!firmwareAssets,date,verification);
  if(firmwareAssets)drawNativeSystemOverlay(t,b,state,elapsedMs,reduced,firmwareAssets);
  const nativeStatus=graphics.stockStatus(state,t);const notice=options.runtimeNotice?.();if(notice&&nativeStatus!=='loading'&&nativeStatus!=='error'){rounded(b,8,185,304,26,5,'#fff9e8','#a88d53');text(b,notice,160,198,11,'#5d491f','center');}
  output.imageSmoothingEnabled=false;output.clearRect(0,0,800,240);output.drawImage(native,0,0,800,240);
  return verificationPaint;
 }
 return {top,nativeTop:native,bottom,paint,stockStatus:(state:MenuState)=>graphics.stockStatus(state,t),retryStockScreen:graphics.retryStockScreen,stockFailure:graphics.stockFailure,setFirmwareAssets,prepareFolderBannerLabel:(name:string)=>nativeHome?.folderBannerLabel(name),dispose(){if(disposed)return;disposed=true;folderCapture=undefined;captureCanvas.width=captureCanvas.height=0;graphics.dispose();firmwareAssets?.dispose();fonts.delete(t);fonts.delete(b);setPortfolioFont(t);setPortfolioFont(b);},setReducedMotion(value:boolean){reduced=value;},ready:Promise.allSettled([sprite.decode(),themeSprite.decode(),shopSprite.decode(),fontReady,graphics.ready,chrome.ready])};
}
