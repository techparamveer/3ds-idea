import * as THREE from 'three';
import { apps, getApp, type PortfolioApp } from './apps';
import { currentEntry, getActiveAppView, selectedApp } from './system';
import { getTitle } from './app-registry';
import type { AppView } from './app-types';
import type { MenuState } from './state';
import { measureBitmapText, type BitmapFont } from './bitmap-font';
import { createStockScreenPresentation } from './stock-screen-presentation';
import { createSuspendedApplicationCapture } from './notes-suspended-capture';
type C=CanvasRenderingContext2D;
const nativeFonts=new WeakMap<C,BitmapFont>();
export function setPortfolioFont(ctx:C,font?:BitmapFont){if(font)nativeFonts.set(ctx,font);else nativeFonts.delete(ctx);}
export function label(c:C,value:string,x:number,y:number,size=13,color='#454952',align:CanvasTextAlign='left'){
 const font=nativeFonts.get(c);if(font){font.draw(c,value,x,y,size,color,align);return;}
 c.font=`${size}px "HOME Menu", Arial, sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(value,x,y);
}
function box(c:C,x:number,y:number,w:number,h:number,r:number,fill:string|CanvasGradient,stroke?:string){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function button(c:C,x:number,y:number,w:number,h:number,title:string,active=false){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,active?'#dafff2':'#fff');g.addColorStop(1,active?'#94e9ca':'#d9dde2');c.beginPath();c.roundRect(x,y,w,h,5);c.fillStyle=g;c.fill();c.strokeStyle=active?'#39b692':'#a9afb8';c.stroke();label(c,title,x+w/2,y+h/2,13,'#48515c','center');}
function paragraph(c:C,value:string,x:number,y:number,width:number,size=14,lineHeight=20){
 c.font=`${size}px "HOME Menu", Arial, sans-serif`;const lines:string[]=[];let row='';
 for(const word of value.split(' ')){const next=row?`${row} ${word}`:word;if((nativeFonts.has(c)?measureBitmapText(nativeFonts.get(c)!.manifest,next,size).width:c.measureText(next).width)>width&&row){lines.push(row);row=word;}else row=next;}if(row)lines.push(row);
 lines.forEach((line,i)=>label(c,line,x,y+i*lineHeight,size));return lines.length;
}
export function createPortfolioGraphics(){
 const stockScreens=createStockScreenPresentation(),suspendedCapture=createSuspendedApplicationCapture();
 function syncStockView(state:MenuState,context?:C){
  if(state.system)suspendedCapture.sync(state.system.runtime);
  const s=state.system,owner=s&&(s.phase==='launch'||s.phase==='app')&&!s.sleeping&&!s.preferences&&!s.dialog?s.runtime.active:null;
  stockScreens.sync(owner);if(owner&&context){const view=getActiveAppView(state);if(view)stockScreens.prepare(view,owner,nativeFonts.get(context));}
 }
 function stockStatus(state:MenuState,context:C){
  syncStockView(state,context);
  const s=state.system,view=getActiveAppView(state);
  return s&&(s.phase==='launch'||s.phase==='app')&&!s.sleeping&&!s.preferences&&!s.dialog&&s.runtime.active&&view
   ?stockScreens.status(view,s.runtime.active,nativeFonts.get(context)):'inactive' as const;
 }
 const menuIcons=new Map<string,HTMLCanvasElement>();
 const images=new Map<string,HTMLImageElement>();
 const urls=new Set(apps.flatMap(a=>[...(a.icon.startsWith('/')?[a.icon]:[]),...a.entries.flatMap(e=>e.images??[])]));
 const ready=Promise.allSettled([...urls].map(async url=>{const image=new Image();image.src=url;images.set(url,image);await image.decode();})).then(()=>{menuIcons.clear();});
 function fit(c:C,url:string,x:number,y:number,w:number,h:number){const im=images.get(url);if(!im?.naturalWidth)return false;const k=Math.min(w/im.naturalWidth,h/im.naturalHeight);c.drawImage(im,x+(w-im.naturalWidth*k)/2,y+(h-im.naturalHeight*k)/2,im.naturalWidth*k,im.naturalHeight*k);return true;}
 function icon(c:C,app:PortfolioApp,x:number,y:number,size:number){
  c.save();c.translate(x,y);c.scale(size/64,size/64);
  if(app.icon.startsWith('/')){fit(c,app.icon,4,4,56,56);c.restore();return;}
  const g=c.createLinearGradient(0,4,0,60);g.addColorStop(0,'#fff');g.addColorStop(.05,app.color);g.addColorStop(1,app.color+'bb');box(c,4,4,56,56,11,g);
  c.strokeStyle='white';c.lineWidth=3;c.lineJoin='round';c.lineCap='round';c.fillStyle='white';
  if(app.icon==='case'){c.strokeRect(24,16,16,9);box(c,14,24,36,25,3,'#fff');c.fillStyle=app.color;c.fillRect(14,33,36,2);c.fillRect(29,31,6,7);}
  if(app.icon==='code'){c.beginPath();c.moveTo(24,22);c.lineTo(15,32);c.lineTo(24,42);c.moveTo(40,22);c.lineTo(49,32);c.lineTo(40,42);c.moveTo(35,20);c.lineTo(29,44);c.stroke();}
  if(app.icon==='camera'){box(c,13,24,38,26,4,'white');box(c,20,18,15,10,2,'white');c.beginPath();c.arc(32,37,9,0,Math.PI*2);c.fillStyle=app.color;c.fill();c.beginPath();c.arc(32,37,6,0,Math.PI*2);c.stroke();}
  if(app.icon==='leaf'){c.beginPath();c.moveTo(17,46);c.bezierCurveTo(10,22,32,17,48,16);c.bezierCurveTo(48,39,38,47,17,46);c.fill();c.strokeStyle=app.color;c.beginPath();c.moveTo(16,49);c.lineTo(40,26);c.stroke();}
  if(app.icon==='person'){c.beginPath();c.arc(32,24,9,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(32,45,16,10,0,Math.PI,0);c.fill();}
  if(app.icon==='mail'){box(c,12,21,40,28,3,'white');c.strokeStyle=app.color;c.beginPath();c.moveTo(13,23);c.lineTo(32,37);c.lineTo(51,23);c.stroke();}
  c.restore();
 }
 function menuArtwork(c:C,app:PortfolioApp,x:number,y:number,width:number,height:number){
  let canvas=menuIcons.get(app.id);
  if(!canvas){
   canvas=document.createElement('canvas');canvas.width=canvas.height=48;
   const native=canvas.getContext('2d')!;native.scale(48/56,48/56);native.translate(-4,-4);icon(native,app,0,0,64);menuIcons.set(app.id,canvas);
  }
  c.save();c.imageSmoothingEnabled=false;c.drawImage(canvas,x,y,width,height);c.restore();
 }
 function menuIcon(c:C,app:PortfolioApp,x:number,y:number,tileSize:number){
  // HOME software artwork is 48×48 inside the 72×72 two-row tile.
  const size=Math.round(tileSize*2/3);menuArtwork(c,app,Math.round(x+(tileSize-size)/2),Math.round(y+(tileSize-size)/2),size,size);
 }
 // One small rasterized 3D scene shared by every HOME banner.
 let renderer:THREE.WebGLRenderer|undefined;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false});renderer.setSize(180,148);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;}catch{/* Flat icon remains available on context-constrained devices. */}
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,180/148,.1,100);camera.position.z=5.3;
 scene.add(new THREE.AmbientLight(0xffffff,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,5,6);scene.add(light);
 const group=new THREE.Group();scene.add(group);
 const shape=new THREE.Shape();shape.moveTo(-.8,-.92);shape.lineTo(.8,-.92);shape.quadraticCurveTo(.96,-.92,.96,-.76);shape.lineTo(.96,.76);shape.quadraticCurveTo(.96,.92,.8,.92);shape.lineTo(-.8,.92);shape.quadraticCurveTo(-.96,.92,-.96,.76);shape.lineTo(-.96,-.76);shape.quadraticCurveTo(-.96,-.92,-.8,-.92);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:6});
 const material=new THREE.MeshStandardMaterial({color:0xf4f5f7,roughness:.3,metalness:.1});group.add(new THREE.Mesh(geometry,material));
 const art=document.createElement('canvas');art.width=art.height=128;const ac=art.getContext('2d')!;const texture=new THREE.CanvasTexture(art);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;
 const faceMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});const face=new THREE.Mesh(new THREE.PlaneGeometry(1.75,1.75),faceMaterial);face.position.z=.22;group.add(face);let previous='';
 function banner(c:C,app:PortfolioApp,time:number,reduced:boolean){
  if(renderer){if(previous!==app.id){ac.clearRect(0,0,128,128);icon(ac,app,0,0,128);texture.needsUpdate=true;previous=app.id;}
   group.rotation.set(reduced?-.06:Math.sin(time/1800)*.06,reduced?-.12:Math.sin(time/2100)*.32,0);group.position.y=reduced?0:Math.sin(time/900)*.035;renderer.render(scene,camera);c.drawImage(renderer.domElement,110,35,180,148);
  }else icon(c,app,151,62,98);
  box(c,55,183,290,33,12,'#ffffffcb');label(c,app.title,200,199,19,'#454952','center');label(c,app.subtitle,200,229,11,'#686b79','center');
 }
 function application(t:C,b:C,state:MenuState,time:number,reduced:boolean,nativeSystem=false){
  const s=state.system!;const app=getApp(s.app)!;const entry=currentEntry(state)!;
  t.fillStyle='#edf0f4';t.fillRect(0,24,400,216);
  const photo=entry.images?.[s.photo];
  if(photo){t.fillStyle='#25282d';t.fillRect(0,24,400,188);if(!fit(t,photo,0,24,400,188)){icon(t,app,158,65,84);label(t,'Image unavailable',200,175,12,'#e0e4eb','center');}label(t,entry.title,200,226,14,'#454952','center');}
  else {banner(t,app,time,reduced);box(t,28,185,344,51,9,'#f9fafc');label(t,entry.title,200,200,17,'#454952','center');label(t,entry.subtitle,200,222,11,'#777e88','center');}
  b.fillStyle='#edf0f4';b.fillRect(0,0,320,240);const g=b.createLinearGradient(0,0,0,31);g.addColorStop(0,'#fff');g.addColorStop(1,'#d7dce3');b.fillStyle=g;b.fillRect(0,0,320,31);
  label(b,s.detail?entry.title:app.title,160,16,15,'#454952','center');
  if(s.detail){
   if((entry.images?.length??0)>1){label(b,'◀',13,16,12);label(b,'▶',307,16,12,'#454952','right');}
   label(b,entry.subtitle,16,48,11,'#6c7b8c');paragraph(b,entry.pages[s.page],16,74,288,14,19);
   if(entry.pages.length>1){if(s.page>0)button(b,12,176,88,27,'◀ Previous');label(b,`${s.page+1} / ${entry.pages.length}`,160,190,12,'#747b87','center');if(s.page<entry.pages.length-1)button(b,220,176,88,27,'Next ▶');}
  }else{
   const first=Math.floor(s.item/4)*4;
   app.entries.slice(first,first+4).forEach((entry,i)=>{const y=38+i*41,active=first+i===s.item;button(b,10,y,300,37,'',active);box(b,17,y+7,4,23,2,app.color);label(b,entry.title,29,y+12,13);label(b,entry.subtitle,29,y+27,10,'#74808c');label(b,'›',298,y+19,20,'#8293a0','center');});
   label(b,'‹',13,16,17);label(b,`${s.item+1}/${app.entries.length} ›`,293,16,10,'#73808b','center');
  }
  b.fillStyle='#d1d6de';b.fillRect(0,211,320,29);button(b,3,214,95,24,'Ⓑ Back');
  if(s.detail&&entry.images&&entry.images.length>1)label(b,`◀ ${s.photo+1}/${entry.images.length} ▶`,157,226,12,'#6b7380','center');
  button(b,222,214,95,24,s.detail?(entry.app?'Ⓐ Open':entry.url?'Ⓐ Visit':'Ⓐ Done'):'Ⓐ Open');
 }
 function semanticApplication(t:C,b:C,view:AppView,state:MenuState,owner:string){
  const capture=view.appId==='game-notes'&&view.screen==='drawing'?suspendedCapture.read(state.system!.runtime):undefined;
  return stockScreens.draw(t,b,view,owner,nativeFonts.get(t),capture);
 }
 function overlay(t:C,b:C,state:MenuState,time:number,reduced:boolean,nativeSystem=false){
  const s=state.system;if(!s)return;
  if(s.phase==='app'){
   const view=getActiveAppView(state,time);let complete=false;
   if(view&&getApp(view.appId)&&currentEntry(state)){application(t,b,state,time,reduced);complete=true;}
   else if(view&&s.runtime.active)complete=semanticApplication(t,b,view,state,s.runtime.active);
   // Retain the application slot's last complete pair, before host overlays.
   if(complete&&s.runtime.active&&!s.sleeping&&!s.preferences&&!s.dialog)suspendedCapture.record(s.runtime,s.runtime.active,t.canvas,b.canvas);
  }
  if(s.phase==='launch'&&!nativeSystem){
   t.fillStyle=b.fillStyle='#fff';t.fillRect(0,0,400,240);b.fillRect(0,0,320,240);
   const app=getApp(s.app);if(app){icon(t,app,155,50,90);label(t,'Paramveer Singh',200,194,12,'#9398a0','center');}
   label(t,getTitle(s.app)?.title??'',200,164,23,'#454952','center');
   label(b,'Starting software…',160,125,14,'#777e86','center');
  }
  if(s.preferences){
   b.fillStyle='#eef0f5';b.fillRect(0,0,320,240);label(b,'Sound & Layout',160,24,17,'#454952','center');
   button(b,20,53,280,39,s.muted?'Sound: OFF':'Sound: ON',s.preferenceChoice===0);button(b,20,106,80,39,'−',s.preferenceChoice===1);label(b,`${Math.round(s.volume*100)}%`,160,126,18,'#454952','center');button(b,220,106,80,39,'+',s.preferenceChoice===1);
   button(b,20,165,280,39,'Reset HOME icon layout',s.preferenceChoice===2);button(b,3,214,314,24,'Ⓑ Back');
  }
  if((s.phase==='power'&&!nativeSystem)||s.dialog){
   b.fillStyle='#17243777';b.fillRect(0,0,320,240);box(b,12,42,296,167,9,'#f5f7fa','#a0a9b7');
   const power=s.phase==='power';label(b,power?'Power Options':'Close software?',160,65,17,'#454952','center');
   paragraph(b,power?'To take a break, close the system to enter Sleep Mode.':s.pending?'Close the current app and start the selected software?':'Close the current app and return to the HOME Menu?',30,98,260,13,20);
   button(b,23,173,128,29,'Ⓑ Cancel');button(b,169,173,128,29,power?'Ⓐ Power Off':'Ⓐ Close');
  }
  if((s.phase==='boot'&&!nativeSystem)||s.phase==='shutdown'&&!nativeSystem||s.sleeping||s.phase==='off'){
   const alpha=s.phase==='boot'&&!s.sleeping?Math.max(0,Math.min(1,1-(time-s.since-2100)/900)):1;
   t.fillStyle=b.fillStyle=`rgba(0,0,0,${alpha})`;t.fillRect(0,0,400,240);b.fillRect(0,0,320,240);
  }
 }
 return {ready,icon,menuIcon,menuArtwork,banner,overlay,syncStockView,stockStatus,retryStockScreen:stockScreens.retry,stockFailure:stockScreens.getFailure,dispose(){stockScreens.dispose();suspendedCapture.dispose();renderer?.dispose();geometry.dispose();material.dispose();texture.dispose();face.geometry.dispose();faceMaterial.dispose();},selectedApp};
}
