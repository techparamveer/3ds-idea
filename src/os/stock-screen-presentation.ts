import { sampleSettingsHud, type SettingsHudPose, type SettingsHudSample } from './stock-settings-hud';
import type { StockModelBackground } from './stock-model-background';
import { drawNativeSelectorFrame, nativeSelectorView } from './stock-native-selectors';
import { drawNativeHelperFrame, nativeHelperView } from './stock-native-helpers';
import { drawNativeServiceFrame, eshopHudClock, eshopWelcomePose, nativeServiceView, zoneClock } from './stock-native-services';
import type { AppView, JsonValue } from './app-types';
import type { BitmapFont } from './bitmap-font';
import type { NativeLayout, NativePixels } from './native-layout';
import type { NativeLayoutRenderer } from './native-renderer';
import type { SuspendedCapture } from './notes-suspended-capture';
import { createNativeTitleSession } from './native-title-session';
import { drawNativeSettingsMain, settingsScreenPacks } from './stock-native-settings';
import { drawNativeSoundFrame, soundHudTimeKey, soundScreenPacks } from './stock-native-sound';
import { drawNativeCameraFrame, cameraScreenPacks } from './stock-native-camera';
import { healthEntrySceneInFrame, healthTopLoopFrame } from './stock-health-scroll';
import { drawNativeHealthFrame, healthScreenPacks } from './stock-native-health';
import { drawNativePersonalToolFrame, nativePersonalToolView, notificationsHudClock } from './stock-native-personal-tools';
import { drawNativeWebFrame, browserHudClock, browserScreenPacks, miiverseScreenPacks } from './stock-native-web';
import { NATIVE_RECOVERY_TARGETS } from './native-screen-input';
import { stockScreenTargets } from './stock-screen-layout';
import type { NotesBootCoverPaint } from './notes-boot-cover';

type Context=CanvasRenderingContext2D;
type MediaRecord=Record<string,JsonValue>;
export type NotesIntroPaint =
  | { status: 'pending' }
  | NotesBootCoverPaint
  | {
      status: 'posed';
      title: NativeLayout;
      upper: NativeLayout;
      lower: NativeLayout;
      scene9Draw: boolean;
      scene10Draw: boolean;
      titleUserVisible: boolean;
      ticket: number;
      steps: number;
      icon?: NativePixels;
      description?: string;
    };
export type CameraStereoFit={kind:'camera-stereo';originalWidth:number;originalHeight:number;parallaxPixels:number};
type MediaFit='contain'|'camera-mono'|CameraStereoFit;
export type StockScreenPaintOptions={settingsHud?:SettingsHudPose;soundRoom?:StockModelBackground;cameraShoot?:StockModelBackground;font?:BitmapFont;native?:NativeLayoutRenderer;nativeRequired?:boolean;image?:(ctx:Context,url:string,x:number,y:number,width:number,height:number,fit?:MediaFit)=>boolean;nativeImage?:(url:string)=>NativePixels|undefined;suspendedCapture?:SuspendedCapture;reducedMotion?:boolean;date?:Date;elapsedMs?:number;notesIntro?:NotesIntroPaint;healthEntryFrame?:number};
/** Portfolio media placement; native UI graphics continue through the layout renderer. */
export function drawStockMediaImage(ctx:Context,image:CanvasImageSource,sourceWidth:number,sourceHeight:number,x:number,y:number,w:number,h:number,fit:MediaFit='contain'){
  if(typeof fit==='object'&&fit.kind==='camera-stereo'&&w===400&&h===240&&sourceWidth>=480&&sourceHeight>=240&&sourceWidth<=2*sourceHeight&&fit.originalWidth>=480&&fit.originalHeight>=240&&Number.isFinite(fit.parallaxPixels)){
    // EUR Camera browse 0x284b54 -> 0x210230: mode 2, stereo margin 40.
    // The MPO note's scaled parallax moves the source window before clipping.
    const scale=Math.max(480/sourceWidth,240/sourceHeight);
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    ctx.drawImage(image,x+(w-sourceWidth*scale)/2-fit.parallaxPixels*scale,y+(h-sourceHeight*scale)/2,sourceWidth*scale,sourceHeight*scale);
    ctx.restore();return;
  }
  // EUR Camera 0x210230, non-stereo branch: contain within 400×240,
  // capped at 1 so small decoded photos are not enlarged.
  const scale=Math.min(w/sourceWidth,h/sourceHeight,fit==='camera-mono'||typeof fit==='object'?1:Infinity);
  ctx.drawImage(image,x+(w-sourceWidth*scale)/2,y+(h-sourceHeight*scale)/2,sourceWidth*scale,sourceHeight*scale);
}
const record=(v:JsonValue|undefined):MediaRecord=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const records=(v:JsonValue|undefined):MediaRecord[]=>Array.isArray(v)?v.map(record):[];
const string=(v:JsonValue|undefined)=>typeof v==='string'?v:'';
const number=(v:JsonValue|undefined)=>typeof v==='number'&&Number.isFinite(v)?v:0;
const camera=(id:string)=>id==='camera'||id==='camera-applet';
function fill(ctx:Context,x:number,y:number,w:number,h:number,r:number,color:string,stroke?:string){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function text(ctx:Context,font:BitmapFont|undefined,value:string,x:number,y:number,size=14,color='#444',align:CanvasTextAlign='center'){
  if(font){font.draw(ctx,value,x,y,size,color,align);return;}
  ctx.font=`${size}px sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y);
}
function lines(ctx:Context,font:BitmapFont|undefined,value:string,x:number,y:number,width:number,size=14,color='#444'){
  const rows:string[]=[];
  for(const paragraph of value.split('\n')){
    let row='';
    for(const word of paragraph.split(' ')){
      const next=row?row+' '+word:word;
      // This adaptation wraps portfolio labels; native text panes use their own metrics.
      if(next.length*size*.52>width&&row){rows.push(row);row=word;}else row=next;
    }
    rows.push(row);
  }
  rows.forEach((row,i)=>text(ctx,font,row,x,y+i*(size+4),size,color));
}
const accents:Record<string,string>={'system-settings':'#9aa5b1',camera:'#d98b19','camera-applet':'#d98b19',sound:'#69ae23','health-safety':'#e58f20','game-notes':'#c8a52b',friends:'#ee8729',notifications:'#78ad52',browser:'#229ac6',miiverse:'#4d9f69'};
function chrome(ctx:Context,width:number,heading:string,accent:string,font?:BitmapFont){
  ctx.fillStyle='#f5f5f2';ctx.fillRect(0,0,width,240);
  const g=ctx.createLinearGradient(0,0,0,30);g.addColorStop(0,'#fff');g.addColorStop(1,'#e4e5df');ctx.fillStyle=g;ctx.fillRect(0,0,width,30);
  ctx.fillStyle=accent;ctx.fillRect(0,29,width,3);text(ctx,font,heading,width/2,15,15,'#525751');
}
function control(ctx:Context,label:string,x:number,y:number,w:number,h:number,active:boolean,font?:BitmapFont,accent='#80b953'){
  const gradient=ctx.createLinearGradient(0,y,0,y+h);gradient.addColorStop(0,active?'#fffdeb':'#fff');gradient.addColorStop(1,active?'#f7de96':'#e5e7e0');
  ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=active?accent:'#a9aea4';ctx.lineWidth=active?2:1;ctx.stroke();text(ctx,font,label,x+w/2,y+h/2,13);
}
function footer(ctx:Context,view:AppView,font?:BitmapFont){
  ctx.fillStyle='#d9ddd4';ctx.fillRect(view.appId==='miiverse'?256:0,212,view.appId==='miiverse'?64:320,28);
  for(const side of ['left','right'] as const){const item=view.footer[side],target=item&&stockScreenTargets(view).find(r=>r.row===undefined&&r.action===item.action);if(item&&target)control(ctx,item.label,target.x+3,target.y+1,target.width-6,target.height-3,false,font);}
}
function mediaImage(ctx:Context,item:MediaRecord,rect:number[],options:StockScreenPaintOptions){
  const url=string(item.thumbnail)||string(item.src)||string(item.artwork);
  return url?options.image?.(ctx,url,rect[0],rect[1],rect[2],rect[3])??false:false;
}
function albumSymbol(ctx:Context,x:number,y:number,accent:string){
  fill(ctx,x-21,y-15,42,31,3,'#fff',accent);fill(ctx,x-14,y-23,28,12,3,accent);
  ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-14,y+9);ctx.lineTo(x-3,y-3);ctx.lineTo(x+4,y+4);ctx.lineTo(x+10,y-2);ctx.lineTo(x+16,y+9);ctx.stroke();
}
function duration(seconds:number){return `${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;}
function transportIcon(ctx:Context,action:string,x:number,y:number,playing:boolean){
  ctx.fillStyle='#58722d';
  if(action==='play'&&playing){ctx.fillRect(x-7,y-9,5,18);ctx.fillRect(x+2,y-9,5,18);return;}
  const direction=action==='previous'?-1:1;
  ctx.beginPath();ctx.moveTo(x-direction*6,y-9);ctx.lineTo(x+direction*8,y);ctx.lineTo(x-direction*6,y+9);ctx.closePath();ctx.fill();
  if(action!=='play')ctx.fillRect(x+direction*10-(direction<0?3:0),y-9,3,18);
}

/** Resource support is independent of shared-font readiness. */
export function nativeStockView(view:AppView){
  return view.appId==='system-settings'?{view:'settings',titleId:'0004001000022000',packs:settingsScreenPacks}:view.appId==='sound'?{view:'sound',titleId:'0004001000022500',packs:soundScreenPacks}:camera(view.appId)?{view:'camera-gallery',titleId:'0004001000022400',packs:cameraScreenPacks}:view.appId==='health-safety'?{view:'health',titleId:'0004001000022300',packs:healthScreenPacks}:view.appId==='browser'?{view:'browser',titleId:'0004003000009d02',packs:browserScreenPacks}:view.appId==='miiverse'?{view:'miiverse',titleId:'000400300000be02',packs:miiverseScreenPacks}:nativePersonalToolView(view)??nativeServiceView(view)??nativeHelperView(view)??nativeSelectorView(view);
}
export type NativeScreenStatus='inactive'|'loading'|'ready'|'error';
/** Browser resource deadline, not a measured Nintendo loading duration. */
export const NATIVE_SCREEN_DEADLINE_MS=20_000;

/** Stock-specific 400×240 / 320×240 surfaces. Media is supplied by AppView. */
export function drawStockScreenFrame(top:Context,bottom:Context,view:AppView,options:StockScreenPaintOptions={}):void{
  const {font}=options,accent=accents[view.appId]??'#809d8c',data=view.data??{};
  if(options.native&&drawNativeSettingsMain(options.native,top,bottom,view,options.reducedMotion,options.date,options.settingsHud))return;
  if(options.native&&drawNativeSoundFrame(options.native,top,bottom,view,options))return;
  if(options.native&&camera(view.appId)){
    if(!drawNativeCameraFrame(options.native,top,bottom,view,options))throw new Error('Native camera composition failed');
    if(view.screen==='photo')footer(bottom,view,font);
    return;
  }
  if(options.native&&drawNativeHealthFrame(options.native,top,bottom,view,options))return;
  if(options.native&&drawNativePersonalToolFrame(options.native,top,bottom,view,options))return;
  if(options.native&&drawNativeWebFrame(options.native,top,bottom,view,options))return;
  if(options.native&&drawNativeServiceFrame(options.native,top,bottom,view,options))return;
  if(options.native&&drawNativeSelectorFrame(options.native,top,bottom,view,options))return;
  if(options.native&&drawNativeHelperFrame(options.native,top,bottom,view,options))return;
  if((options.nativeRequired||options.native)&&nativeStockView(view)&&!camera(view.appId))throw new Error('Native screen composition failed: '+view.appId+'/'+view.screen);
  chrome(top,400,view.heading,accent,font);chrome(bottom,320,view.heading,accent,font);
  if(camera(view.appId)){
    const folders=records(data.folders),photos=records(data.photos),selected=view.rows[view.selection];
    const folder=folders.find(f=>'folder:'+string(f.id)===selected?.id);
    const photo=view.screen==='photo'?record(data.photo):view.screen==='gallery'?photos.find(p=>'photo:'+string(p.id)===selected?.id)??{}:records(folder?.photos)[0]??{};
    top.fillStyle='#292923';top.fillRect(0,32,400,181);
    if(!mediaImage(top,photo,[5,35,390,175],options))albumSymbol(top,200,120,accent);
    text(top,font,string(photo.title)||string(folder?.title)||'Photo Album',200,226,14);
    if(options.nativeRequired||options.native)throw new Error('Native camera composition failed');
    if(view.screen==='photo'){
      fill(bottom,63,51,194,134,5,'#e5e0cf','#b5a887');mediaImage(bottom,photo,[68,56,184,124],options);
      for(const r of stockScreenTargets(view).filter(r=>r.action==='previous'||r.action==='next'))control(bottom,r.action==='previous'?'‹':'›',r.x,r.y,r.width,r.height,false,font,accent);
      text(bottom,font,string(photo.title),160,199,12);
    }else{
      for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){
        const row=view.rows[r.row!],active=r.row===view.selection;
        fill(bottom,r.x,r.y,r.width,r.height,4,active?'#ffe6a7':'#eeeee6',active?'#d79123':'#b5b8a9');
        let image:MediaRecord;
        if(view.screen==='gallery')image=photos.find(p=>'photo:'+string(p.id)===row.id)??{};
        else image=records(folders.find(f=>'folder:'+string(f.id)===row.id)?.photos)[0]??{};
        if(!mediaImage(bottom,image,[r.x+4,r.y+4,r.width-8,47],options))albumSymbol(bottom,r.x+r.width/2,r.y+28,accent);
        text(bottom,font,row.label,r.x+r.width/2,r.y+61,10);
      }
      if(!view.rows.length)text(bottom,font,'No photos',160,112,15,'#858574');
    }
  }else if(view.appId==='sound'){
    const tracks=records(data.tracks),track=record(data.track),selected=Object.keys(track).length?track:tracks[view.selection]??{};
    const gradient=top.createLinearGradient(0,32,0,240);gradient.addColorStop(0,'#e7f2c4');gradient.addColorStop(1,'#82b849');top.fillStyle=gradient;top.fillRect(0,32,400,208);
    for(let i=0;i<8;i++){top.strokeStyle='#f8ffdd55';top.lineWidth=2;top.beginPath();top.ellipse(200,230,80+i*28,70+i*17,0,Math.PI,2*Math.PI);top.stroke();}
    fill(top,159,48,82,82,9,'#f9ffe5','#6c9833');
    if(!mediaImage(top,{artwork:selected.artwork??''},[164,53,72,72],options)){text(top,font,'♪',200,88,42,'#6c9b29');}
    text(top,font,string(selected.title)||'Nintendo 3DS Sound',200,155,18,'#36501e');
    text(top,font,string(selected.artist),200,181,13,'#416224');text(top,font,string(selected.album),200,203,11,'#416224');
    if(view.screen==='playback'){
      text(bottom,font,string(track.title),160,54,16,'#43671b');text(bottom,font,string(track.artist),160,77,12,'#718160');
      const total=number(data.duration)||number(track.duration),position=number(data.position),fraction=total>0?Math.max(0,Math.min(1,position/total)):0;
      fill(bottom,30,104,260,5,3,'#bfc6af');fill(bottom,30,104,Math.max(5,260*fraction),5,3,'#81ad32');
      bottom.beginPath();bottom.arc(30+260*fraction,106,6,0,2*Math.PI);bottom.fillStyle='#5c8c20';bottom.fill();
      text(bottom,font,duration(position),31,91,10,'#718160','left');text(bottom,font,duration(total),290,91,10,'#718160','right');
      const labels:Record<string,string>={play:data.playing?'Ⅱ':'▶',previous:'|◀',next:'▶|',mode:data.shuffle===true?'Shuffle':data.repeat==='all'?'Repeat all':data.repeat==='one'?'Repeat one':'Play once'};
      for(const r of stockScreenTargets(view).filter(r=>Object.hasOwn(labels,r.action))){
        const transport=['previous','play','next'].includes(r.action);
        control(bottom,transport?'':labels[r.action],r.x,r.y,r.width,r.height,r.action==='play'&&data.playing===true,font,accent);
        if(transport)transportIcon(bottom,r.action,r.x+r.width/2,r.y+r.height/2,data.playing===true);
      }
    }else{
      for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){const row=view.rows[r.row!];control(bottom,'',r.x,r.y,r.width,r.height,r.row===view.selection,font,accent);text(bottom,font,'♪',r.x+18,r.y+17,19,'#6f9f26');text(bottom,font,row.label,r.x+39,r.y+12,12,'#444','left');text(bottom,font,row.value??'',r.x+39,r.y+27,10,'#7a856d','left');}
      // An empty song manifest stays visibly empty; the source has no SD-card-empty list message.
    }
  }else if((view.appId==='game-notes'||view.appId==='memo')&&view.screen==='main'){
    fill(top,55,53,290,148,4,'#fffef2','#b6ad7d');for(let y=78;y<196;y+=16){top.fillStyle='#dbe5e7';top.fillRect(68,y,264,1);}text(top,font,view.rows[view.selection]?.label??'Game Notes',200,221,14);
    for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){fill(bottom,r.x,r.y,r.width,r.height,2,r.row===view.selection?'#fff3a1':'#fffef2',r.row===view.selection?'#b79516':'#c4c0a7');text(bottom,font,String(r.row!+1),r.x+10,r.y+11,10,'#99917b');}
  }else{
    const settings=view.appId==='system-settings';
    if(settings&&view.screen==='main'){
      text(top,font,'System Settings',200,130,24);
      for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){control(bottom,'',r.x,r.y,r.width,r.height,r.row===view.selection,font,accent);lines(bottom,font,view.rows[r.row!].label,r.x+r.width/2,r.y+r.height/2-7,r.width-12,13);}
    }else{
      text(top,font,view.subheading??view.heading,200,66,19);
      (view.text??[]).slice(0,3).forEach((value,i)=>lines(top,font,value,200,106+i*38,348,13));
      if(view.screen==='document'||view.screen==='detail'){
        fill(bottom,16,42,288,155,5,'#fff','#c7ccbf');
        (view.text??[]).slice(0,3).forEach((value,i)=>lines(bottom,font,value,160,64+i*44,258,13));
        if(view.screen==='document')text(bottom,font,String(number(data.page)+1),294,195,10,'#999','right');
      }else for(const r of stockScreenTargets(view).filter(r=>r.row!==undefined)){const row=view.rows[r.row!];control(bottom,row.label,r.x,r.y,r.width,r.height,r.row===view.selection,font,accent);}
    }
  }
  footer(bottom,view,font);
}

/** One foreground session; asynchronous resources never outlive its owner. */
export function createStockScreenPresentation(options:{manifestUrl?:string;onChange?:()=>void;deadlineMs?:number;soundRoom?:StockModelBackground;cameraShoot?:StockModelBackground;reducedMotion?:()=>boolean}={}){
  let revision=0,painted='',paintedFont:BitmapFont|undefined,complete=false;
  const changed=()=>{revision++;options.onChange?.();};
  const session=createNativeTitleSession({manifestUrl:options.manifestUrl??'/os/firmware/10.7.0-32E/manifest.json',onChange:state=>{if((state.status==='ready'&&roomReady)||state.status==='error')clearDeadline();changed();}});
  const images=new Map<string,HTMLImageElement>(),nativeImages=new Map<string,NativePixels>();let owner:string|null=null,disposed=false;
  let identity='',failure:unknown=null,recoveryPublished=false,deadline:ReturnType<typeof setTimeout>|undefined;
  let published:NativeLayoutRenderer|undefined;
  let roomReady=true;
  let settingsHud:SettingsHudSample|null=null,settingsHudOwner:string|null=null;
  // This receipt is independent of native asset-session teardown. The same
  // application owner can leave for HOME/an applet and resume without replaying
  // its first-entry fade; a replacement owner still receives a fresh frame 0.
  let healthEntry:{owner:string;origin:number|null;complete:boolean}|null=null;
  const deadlineMs=options.deadlineMs??NATIVE_SCREEN_DEADLINE_MS;
  if(!Number.isFinite(deadlineMs)||deadlineMs<=0)throw new Error('Invalid native preparation deadline');
  const upper=document.createElement('canvas'),lower=document.createElement('canvas');upper.width=400;upper.height=240;lower.width=320;lower.height=240;
  const upperContext=upper.getContext('2d')!,lowerContext=lower.getContext('2d')!;
  const clearDeadline=()=>{if(deadline!==undefined)clearTimeout(deadline);deadline=undefined;};
  function fail(error:unknown){
    options.soundRoom?.prepare(null,changed);options.cameraShoot?.prepare(null,changed);roomReady=true;clearDeadline();failure=error??new Error('Native screen preparation failed');recoveryPublished=false;published=undefined;
    // Invalidates the generation as well as aborting a cooperative loader.
    session.update(null);changed();
  }
  function reset(){options.soundRoom?.prepare(null,changed);options.cameraShoot?.prepare(null,changed);roomReady=true;clearDeadline();identity='';failure=null;recoveryPublished=false;published=undefined;session.update(null);painted='';}
  function releaseImages(){for(const image of images.values()){image.onload=null;image.onerror=null;image.src='';}images.clear();nativeImages.clear();}
  function sourceImage(url:string){
    let im=images.get(url);
    if(!im){if(images.size>=64){const first=images.keys().next().value!;const stale=images.get(first)!;stale.onload=null;stale.onerror=null;stale.src='';images.delete(first);}im=new Image();images.set(url,im);im.onload=()=>{if(!disposed)changed();};im.onerror=()=>{if(!disposed)changed();};im.src=url;}
    return im.complete&&im.naturalWidth?im:undefined;
  }
  function image(ctx:Context,url:string,x:number,y:number,w:number,h:number,fit:MediaFit='contain'){
    const im=sourceImage(url);if(!im)return false;
    drawStockMediaImage(ctx,im,im.naturalWidth,im.naturalHeight,x,y,w,h,fit);return true;
  }
  function nativeImage(url:string):NativePixels|undefined{
    const previous=nativeImages.get(url);if(previous)return previous;
    const im=sourceImage(url);if(!im)return undefined;
    const canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;
    const context=canvas.getContext('2d')!;context.drawImage(im,0,0);
    const pixels={width:canvas.width,height:canvas.height,data:context.getImageData(0,0,canvas.width,canvas.height).data};
    nativeImages.set(url,pixels);canvas.width=canvas.height=0;return pixels;
  }
  function sync(nextOwner:string|null){if(disposed)return;if(owner!==nextOwner){owner=nextOwner;reset();releaseImages();}}
  function prepare(view:AppView,nextOwner:string,font?:BitmapFont){
    if(disposed)return session.getState();
    sync(nextOwner);
    const descriptor=nativeStockView(view),next=descriptor?JSON.stringify([nextOwner,descriptor]):'';
    if(identity!==next){reset();identity=next;}
    if(!descriptor||failure)return session.getState();
    const state=session.update(font?{owner:nextOwner,...descriptor,sharedFonts:new Map([['cbf_std.bcfnt',font]])}:null);
    if(state.status==='error'){fail(state.error);return state;}
    const room=options.soundRoom?.prepare(view.appId==='sound'&&(view.screen==='main'||view.screen==='guide')?nextOwner:null,changed);
    const shoot=options.cameraShoot?.prepare(view.appId==='camera'&&view.screen==='guide'?nextOwner:null,changed);
    roomReady=[room,shoot].every(background=>!background||background.status==='inactive'||background.status==='ready');
    if(shoot?.status==='error'){fail(shoot.error);return state;}
    if(room?.status==='error'){fail(room.error);return state;}
    if(state.status==='ready'&&roomReady)clearDeadline();
    else if(deadline===undefined)deadline=setTimeout(()=>{if(!disposed&&identity===next)fail(new Error('Native screen preparation timed out'));},deadlineMs);
    return state;
  }
  function status(view:AppView,nextOwner:string,font?:BitmapFont):NativeScreenStatus{
    const state=prepare(view,nextOwner,font);
    if(!identity||disposed)return 'inactive';
    if(failure)return recoveryPublished?'error':'loading';
    return state.status==='ready'&&roomReady&&published===state.assets.renderer?'ready':'loading';
  }
  function black(){
    // CmnFadeNinLogo_U/D_00 SceneOut frame20: full-screen RGB0, alpha255.
    for(const ctx of [upperContext,lowerContext]){ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,ctx.canvas.width,240);ctx.fillStyle='#000';ctx.fillRect(0,0,ctx.canvas.width,240);}
  }
  function recovery(){
    black();
    // Authored host recovery, intentionally not presented as a firmware dialog.
    text(upperContext,undefined,'Website display unavailable',200,92,16,'#fff');
    text(upperContext,undefined,'The software screen could not be loaded.',200,121,13,'#ddd');
    text(lowerContext,undefined,'A: Retry',160,92,16,'#fff');
    text(lowerContext,undefined,'B / HOME: Return to HOME Menu',160,121,13,'#ddd');
    for(const item of NATIVE_RECOVERY_TARGETS){
      lowerContext.strokeStyle='#aaa';lowerContext.lineWidth=1;lowerContext.strokeRect(item.x,item.y,item.width,item.height);
      text(lowerContext,undefined,item.action==='retry'?'Retry':'HOME',item.x+item.width/2,item.y+item.height/2,14,'#fff');
    }
  }
  return {
    sync,prepare,status,
    retry(){if(!disposed&&failure){reset();changed();return true;}return false;},
    /** True only when the published pair is this owner's complete application frame. */
    draw(top:Context,bottom:Context,view:AppView,nextOwner:string,font?:BitmapFont,suspendedCapture?:SuspendedCapture,date=new Date(),elapsedMs=0,notesIntro?:NotesIntroPaint,verification?:{sampleCalendar?:boolean}):boolean{
      if(disposed)return false;
      // Pixels stay out of the key; one frozen capture has one generation.
      const capture=suspendedCapture?.status==='ready'?[suspendedCapture.owner,suspendedCapture.generation]:suspendedCapture?.status??null;
      const reducedMotion=options.reducedMotion?.()??false;
      // Native status clocks and animation poses key paired-screen publication.
      const zoneTime=view.appId==='nintendo-zone'?zoneClock(date,elapsedMs):null;
      const zonePaintKey=zoneTime?[zoneTime.hour,zoneTime.minute,zoneTime.frame<60,zoneTime.batteryFrame]:null;
      // Local host time drives Notes/Health; only the selected pose keys paint.
      const data=view.data&&typeof view.data==='object'&&!Array.isArray(view.data)?view.data:{};
      const clockField=view.appId==='game-notes'?'notesHostMs':view.appId==='health-safety'?'healthElapsedMs':view.appId==='system-settings'?'settingsHudElapsedMs':null;
      const notesView=clockField?{...view,data:Object.fromEntries(Object.entries(data).filter(([key])=>key!==clockField))}:view;
      const introKey=notesIntro?.status==='posed'?[notesIntro.ticket,notesIntro.steps,notesIntro.scene9Draw,notesIntro.scene10Draw,notesIntro.titleUserVisible]:notesIntro?.status==='boot-cover'?[notesIntro.status,notesIntro.ticket,notesIntro.steps,notesIntro.scene9Draw,notesIntro.scene10Draw]:notesIntro?.status??null;
      const state=prepare(view,nextOwner,font);
      // Poses, not passes, key the eShop pair: settled passes do not repaint.
      const eshop=nativeServiceView(view)?.view==='eshop-welcome';
      const keyView=eshop?{...notesView,data:{...notesView.data,welcomePass:null,welcomeDecidedPass:null}}:notesView,eshopPaintKey=eshop?eshopWelcomePose(view,reducedMotion):null;
      // S/HudTime's type-47 separator follows seconds parity (Sound 0x206c3c);
      // only the empty-entry composer draws it.
      const soundClockKey=soundHudTimeKey(view,date);
      if(settingsHudOwner!==nextOwner){settingsHud=null;settingsHudOwner=nextOwner;}
      const settingsElapsed=data.settingsHudElapsedMs;
      const isSettingsClock=view.appId==='system-settings'&&typeof settingsElapsed==='number';
      // Verification Date injection reconstructs an isolated sample sequence.
      // It cannot overwrite the live owner's source-retained HUD state.
      const capturedHud=isSettingsClock&&verification?.sampleCalendar?sampleSettingsHud(null,settingsElapsed,date.getTime()):undefined;
      if(isSettingsClock&&!verification?.sampleCalendar)settingsHud=sampleSettingsHud(settingsHud,settingsElapsed,date.getTime());
      const hud=capturedHud??(isSettingsClock?settingsHud:undefined);
      const hudDate=hud?new Date(hud.dateMs):date;
      const settingsPaintKey=view.appId==='system-settings'?[hudDate.getFullYear(),hudDate.getMonth(),hudDate.getDate(),hudDate.getHours(),hudDate.getMinutes(),hud?.batteryFrame,hud?.colonVisible]:null;
      // eshopHudClock omits seconds; Bat 4 and colonVisible stay frozen.
      const eshopHudKey=eshop?eshopHudClock(date):null;
      // notificationsHudClock includes batteryFrame so 0x181018 1 Hz Bat republishes.
      const notificationsHudKey=view.appId==='notifications'?notificationsHudClock(date):null;
      // browserHudClock includes batteryFrame and colonVisible so Battery_Bat / TimeC 1 Hz republishes.
      const browserHudKey=view.appId==='browser'?browserHudClock(date):null;
      const healthElapsed=typeof data.healthElapsedMs==='number'&&Number.isFinite(data.healthElapsedMs)?Math.max(0,data.healthElapsedMs):0;
      if(view.appId==='health-safety'&&healthEntry?.owner!==nextOwner)healthEntry={owner:nextOwner,origin:null,complete:false};
      // Asset/font loading can outlast the 21 source frames. Until a complete
      // pair succeeds, hold frame 0 instead of consuming the reveal invisibly.
      const healthEntryFrame=view.appId==='health-safety'
        ?(reducedMotion||healthEntry!.complete?20:healthEntry!.origin===null?0:healthEntrySceneInFrame(healthElapsed-healthEntry!.origin))
        :undefined;
      const healthPaintKey=view.appId==='health-safety'?[healthTopLoopFrame(healthElapsed,reducedMotion),healthEntryFrame]:null;
      const key=JSON.stringify([nextOwner,keyView,revision,capture,reducedMotion,zonePaintKey,eshopPaintKey,eshopHudKey,notificationsHudKey,browserHudKey,settingsPaintKey,soundClockKey,introKey,healthPaintKey]);
      if(painted!==key||paintedFont!==font){
        complete=false;
        black();
        if(failure)recovery();
        else if(!identity||(state.status==='ready'&&roomReady)){
          upperContext.clearRect(0,0,400,240);lowerContext.clearRect(0,0,320,240);
          try{
            drawStockScreenFrame(upperContext,lowerContext,view,{font,image,nativeImage,soundRoom:options.soundRoom,cameraShoot:options.cameraShoot,native:state.status==='ready'?state.assets.renderer:undefined,nativeRequired:!!identity,suspendedCapture,reducedMotion,date,elapsedMs,notesIntro,settingsHud:hud??undefined,healthEntryFrame});
            published=state.status==='ready'?state.assets.renderer:undefined;complete=true;
            if(healthEntryFrame!==undefined){
              if(reducedMotion||healthEntryFrame===20)healthEntry!.complete=true;
              else if(healthEntry!.origin===null)healthEntry!.origin=healthElapsed;
            }
          }catch(error){fail(error);recovery();}
        }
        // Only publish after both native surfaces succeed, or after both were
        // replaced with the pending/error pair. Never expose a partial draw.
        painted=key;paintedFont=font;
      }
      top.drawImage(upper,0,0);bottom.drawImage(lower,0,0);
      if(failure)recoveryPublished=true;
      return complete&&!failure;
    },
    getState:session.getState,
    getFailure:()=>failure,
    dispose(){if(disposed)return;disposed=true;clearDeadline();session.dispose();options.soundRoom?.prepare(null,changed);options.cameraShoot?.prepare(null,changed);releaseImages();owner=null;healthEntry=null;published=undefined;upper.width=upper.height=lower.width=lower.height=0;},
  };
}
