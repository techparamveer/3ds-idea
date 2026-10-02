import { BitmapFont, type FontManifest } from './bitmap-font';
import { blendNativePixel, evaluateNativeMaterial, interpolateNativeQuad, instantiateNativePart, nativeAnimationDiagnostics, nativeMultiplyBlend, nativePaneParentPath, nativeTextMetrics, nativeWindowPatches, nativeVisibleRasterRect, poseNativeLayout, rasterNativePicture,
 type AnimationBinding, type NativeLayout, type NativeText, type NativeMaterial, type NativePack, type NativePane, type NativePicture, type NativePixels, type NativeRasterRegion, type PaneOverrides } from './native-layout';

type Context=CanvasRenderingContext2D;
export type NativeDrawOptions={
 /** Direct alpha glyph sampling for explicitly traced source-layout text. */
 textSampling?:'lcd'|'lcd-source-size'|'lcd-source-size-left';
 /** Optional pane-name allowlist for a bounded direct-text sampling call. */
 textSamplingPanes?:readonly string[];
 /** Source pictures/window patches sampled once at fractional LCD positions. */
 pictureSampling?:'lcd';
 /** Capture-fitted Health Back/Other title coverage; GPU precision remains unverified. */
 textCoverageAdaptation?:'azahar-12p4-fit';
 /** Explicit source layout links; each prt1 retains its own pane/material scope. */
 parts?:Readonly<Record<string,{pack:string;layout:string}>>;
 partBindings?:Readonly<Record<string,{bindings?:AnimationBinding[];overrides?:PaneOverrides}>>;
 textByCallName?:Readonly<Record<string,string>>;
 bindings?:AnimationBinding[];overrides?:PaneOverrides;center?:[number,number];scale?:number;clip?:[number,number,number,number];textures?:Readonly<Record<string,NativePixels>>;
 /** Native child-layout instances appended to a named pane's existing children.
  * Callbacks run in traversal order with parent transform/primary alpha active.
  */
 attachments?:Readonly<Record<string,(alpha:number)=>void>>;
 /** Caller guarantees an opaque LCD target with no inherited fractional clip. */
 allowOpaqueDarken?:boolean};
/** Right-aligned source glyphs can overhang their advance rectangle (HUD
 * outlined digits: width11, advance10). Pane size controls alignment, not ink. */
export function nativeTextRightOverhang(font:FontManifest,value:string,size:number[],alignment:number,lineAlignment:number,spacing:number):number{
 if(font.colorMode!=='luminance-alpha'||alignment!==5||lineAlignment!==0||/[\r\n]/.test(value))return 0;
 const scale=size[0]/(font.width??font.height),glyphs=Array.from(value,c=>font.glyphs[String(c.codePointAt(0))]??font.fallback);
 const advance=glyphs.reduce((n,g)=>n+(g?.advance??0)*scale+spacing,0)-(glyphs.length?spacing:0);
 let x=-advance,right=0;
 for(const g of glyphs){if(!g)continue;right=Math.max(right,x+(g.left+g.width)*scale);x+=g.advance*scale+spacing;}
 return Math.max(0,Math.ceil(right));
}
/** Explicit middle-left LA text uses the source writer's glyph rectangle.
 * Camera's 16px capacity pane positions a 24px glyph; it is not a scissor. */
export function nativeTextVerticalOverhang(font:FontManifest,value:string,size:number[],height:number,alignment:number,lineAlignment:number,spacing:number):readonly [number,number]{
 if(font.colorMode!=='luminance-alpha'||alignment!==3||lineAlignment!==1||spacing!==0||/[\r\n]/.test(value))return [0,0];
 const f=Math.fround,sy=f(size[1]/font.height),rectHeight=f((font.lineFeed??font.height)*sy);
 const y=height/2+f(f(-Math.ceil(f(rectHeight*.5))+f((font.ascent??font.baseline)*sy))-f(font.baseline*sy));
 let bottom=height;
 for(const char of value){const glyph=font.glyphs[String(char.codePointAt(0))]??font.fallback;if(glyph?.width)bottom=Math.max(bottom,y+f(glyph.height*sy));}
 return [Math.max(0,Math.ceil(-y)),Math.max(0,Math.ceil(bottom-height))];
}
const surface=(width:number,height:number)=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;};
// On the opaque LCD, Add(Zero, OneMinusSourceAlpha) is D*(1-As).
// Black source-over has the same visible RGB; retain the evaluated alpha bytes.
const nativeDarkenBlend=(material:NativeMaterial)=>material.colorBlend?.operation===1&&material.colorBlend.sourceFactor===0&&material.colorBlend.destinationFactor===5&&material.alphaCompare?.function===7;
const wholeDevicePixelRect=([x,y,w,h]:[number,number,number,number],m:DOMMatrix)=>m.b===0&&m.c===0&&[m.a*x+m.e,m.d*y+m.f,m.a*(x+w)+m.e,m.d*(y+h)+m.f].every(Number.isInteger);
/** Canvas owns only layout targets. The scene owns all 3D banner rendering. */
export class NativeLayoutRenderer {
 private cache=new Map<string,HTMLCanvasElement>();
 private opaque=new WeakSet<HTMLCanvasElement>();
 private poses=new Map<string,NativeLayout>();
 private bytes=0;
 private textureIds=new WeakMap<NativePixels,number>();
 private nextTextureId=1;
 private blendTarget?:HTMLCanvasElement;
 private projectedTarget?:HTMLCanvasElement;
 private disposed=false;
 private parentAlpha=new WeakMap<Context,number>();
 readonly diagnostics:string[]=[];
 constructor(readonly packs:Record<string,NativePack>,private textures:Record<string,Map<string,NativePixels>>,private fonts:ReadonlyMap<string,BitmapFont>,private cacheLimit=8*1024*1024){}
 /** Source single-line writer width used by Settings' title/icon centering. */
 measureSingleLineText(fontName:string,text:NativeText):number{
  const font=this.fonts.get(fontName);if(!font)throw new Error(`Missing native font ${fontName}`);
  const metrics=nativeTextMetrics(text,font.manifest),f=Math.fround;
  if(/[\r\n]/.test(text.value)||metrics.characterSpacing!==0||text.cursorAdvances?.length)throw new Error('Unsupported native title width measurement');
  const scale=f(metrics.size[0]/(font.manifest.width??font.manifest.height));
  let width=0;for(const char of text.value){const glyph=font.manifest.glyphs[String(char.codePointAt(0))]??font.manifest.fallback;width=f(width+f((glyph?.advance??0)*scale));}
  return width;
 }
 /** Draw an explicitly loaded bundled bitmap at its original logical size. */
 drawBitmap(ctx:Context,pack:string,name:string,x:number,y:number):boolean{
  if(this.disposed)return false;
  const pixels=this.textures[pack]?.get(name);
  if(!pixels||!Number.isFinite(x)||!Number.isFinite(y)){this.report(`Missing or invalid native bitmap ${pack}/${name}`);return false;}
  const canvas=this.cached(JSON.stringify(['bitmap',pack,name]),()=>{
   const canvas=surface(pixels.width,pixels.height),context=canvas.getContext('2d')!;
   const data=context.createImageData(pixels.width,pixels.height);data.data.set(pixels.data);context.putImageData(data,0,0);return canvas;
  });
  ctx.drawImage(canvas,x,y);return true;
 }
 private report(message:string){if(!this.diagnostics.includes(message))this.diagnostics.push(message);}
 private cached(key:string,make:()=>HTMLCanvasElement){
  const previous=this.cache.get(key);if(previous){this.cache.delete(key);this.cache.set(key,previous);return previous;}
  const canvas=make(),size=canvas.width*canvas.height*4;
  while(this.bytes+size>this.cacheLimit&&this.cache.size){const first=this.cache.entries().next().value!;this.bytes-=first[1].width*first[1].height*4;first[1].width=first[1].height=0;this.cache.delete(first[0]);}
  if(size<=this.cacheLimit){this.cache.set(key,canvas);this.bytes+=size;}return canvas;
 }
 private picture(pack:string,layout:NativeLayout,picture:NativePicture,width:number,height:number,alpha:number,textures:ReadonlyMap<string,NativePixels>,override?:NativeMaterial,sampling?:NativeRasterRegion) {
  const w=Math.max(1,Math.ceil(width)),h=Math.max(1,Math.ceil(height));
  if(w*h>1024*1024)throw new Error('Native pane exceeds raster budget');
  const material=override??layout.materials[picture.material];
  // Dynamic textures are immutable snapshots. Identity isolates simultaneous folder
  // glyphs and renames without retaining their byte arrays in the raster cache.
  const textureIds=material.textureMaps.map(map=>{const pixels=textures.get(layout.textures[map.texture]);if(!pixels)return 0;
   let id=this.textureIds.get(pixels);if(id===undefined){id=this.nextTextureId++;this.textureIds.set(pixels,id);}return id;});
  const key=JSON.stringify([pack,material,picture.colors,picture.uvSets,w,h,alpha,layout.textures,textureIds,sampling]);
  return this.cached(key,()=>{
   const pixels=rasterNativePicture(layout,picture,w,h,textures,alpha,material,sampling),canvas=surface(w,h),ctx=canvas.getContext('2d')!;
   const data=ctx.createImageData(w,h);data.data.set(pixels.data);
   if(nativeDarkenBlend(material))for(let i=0;i<data.data.length;i+=4)data.data[i]=data.data[i+1]=data.data[i+2]=0;
   // Project native LCD RGB to opaque Canvas for no-blend and multiplicative
   // masks. Their RGB remains meaningful under alpha zero (LA4 shadow masks).
   if(material.colorBlend?.operation===0||nativeMultiplyBlend(material.colorBlend))for(let i=3;i<data.data.length;i+=4)data.data[i]=255;
   if(data.data.every((v,i)=>i%4!==3||v===255))this.opaque.add(canvas);
   ctx.putImageData(data,0,0);return canvas;
  });
 }
 /** Rotated pictures, and explicitly opted-in fractional panes, sample once at LCD centres. A
  * pane-sized intermediate followed by Canvas rotation filters the edges twice.
  * Limit direct readback to opaque targets and ordinary source-over blending;
  * other blend/alpha targets retain the established composition path. */
 private projectedPicture(ctx:Context,layout:NativeLayout,picture:NativePicture,w:number,h:number,alpha:number,textures:ReadonlyMap<string,NativePixels>,lcd=false,override?:NativeMaterial):boolean{
  const m=ctx.getTransform?.(),material=override??layout.materials[picture.material],blend=material.colorBlend;
  if(!m||(!m.b&&!m.c&&(!lcd||Number.isInteger(m.e)&&Number.isInteger(m.f)))||ctx.globalAlpha!==1||(blend&&!(blend.operation===1&&blend.sourceFactor===4&&blend.destinationFactor===5)))return false;
  const det=m.a*m.d-m.b*m.c;if(!det)return false;
  const corners=[[0,0],[w,0],[0,h],[w,h]].map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
  const x=Math.max(0,Math.floor(Math.min(...corners.map(p=>p[0])))),y=Math.max(0,Math.floor(Math.min(...corners.map(p=>p[1]))));
  const width=Math.min(ctx.canvas.width,Math.ceil(Math.max(...corners.map(p=>p[0]))))-x,height=Math.min(ctx.canvas.height,Math.ceil(Math.max(...corners.map(p=>p[1]))))-y;
  if(width<=0||height<=0)return true;
  const target=ctx.getImageData(x,y,width,height);
  for(let at=3;at<target.data.length;at+=4)if(target.data[at]!==255)return false;
  const pixels=rasterNativePicture(layout,picture,width,height,textures,alpha,material,{x,y,fullWidth:w,fullHeight:h,
   localTransform:[m.d/det,-m.b/det,-m.c/det,m.a/det,(m.c*m.f-m.d*m.e)/det,(m.b*m.e-m.a*m.f)/det]});
  // The guarded blend is Add(SourceAlpha, OneMinusSourceAlpha). Evaluate
  // its RGB directly in byte units, without allocating arrays per fragment.
  for(let at=0;at<pixels.data.length;at+=4){
   const a=pixels.data[at+3]/255;if(!a)continue;
   for(let c=0;c<3;c++)target.data[at+c]=pixels.data[at+c]*a+target.data[at+c]*(1-a);
  }
  const canvas=this.projectedTarget??=surface(ctx.canvas.width,ctx.canvas.height);
  if(canvas.width!==ctx.canvas.width||canvas.height!==ctx.canvas.height){canvas.width=ctx.canvas.width;canvas.height=ctx.canvas.height;}
  canvas.getContext('2d')!.putImageData(target,0,0);
  ctx.save();try{ctx.resetTransform();ctx.globalCompositeOperation='source-over';ctx.drawImage(canvas,0,0,width,height,x,y,width,height);}finally{ctx.restore();}
  return true;
 }
 private text(layout:NativeLayout,pane:NativePane,alpha:number,transform?:DOMMatrix,coverageAdaptation?:'azahar-12p4-fit',sourceSize=false,sourceTopLeftSampling=false){
  const text=pane.text!,font=this.fonts.get(layout.fonts[text.font]);if(!font)throw new Error(`Missing native font ${layout.fonts[text.font]}`);
  const [w,h]=pane.size.map(Math.ceil),material=layout.materials[text.material];
  const metrics=nativeTextMetrics(text,font.manifest);
  // Direct alpha glyph sampling is limited to traced alignments and upright LCD
  // transforms; other projections keep the pane-raster path.
  const sourceTopLeft=sourceTopLeftSampling&&font.manifest.colorMode==='alpha'&&text.alignment===0&&text.lineAlignment===0&&/^(?:[^\r\n]*)(?:\r\n|\r|\n)?$/.test(text.value);
  const direct=font.manifest.colorMode==='alpha'&&((!/[\r\n]/.test(text.value)&&(text.alignment===3||text.alignment===4)&&(text.lineAlignment===0||sourceSize&&text.alignment===4&&text.lineAlignment===2)&&metrics.characterSpacing===0)||sourceTopLeft)&&(sourceSize||pane.size[0]===w&&pane.size[1]===h)&&transform?.a===1&&transform.d===1&&transform.b===0&&transform.c===0;
  const coverage=direct?coverageAdaptation:undefined;
  const phase:readonly [number,number]=direct?[transform.e-Math.floor(transform.e),transform.f-Math.floor(transform.f)]:[0,0];
  const [above,below]=nativeTextVerticalOverhang(font.manifest,text.value,metrics.size,h,text.alignment,text.lineAlignment,metrics.characterSpacing);
  const extra=nativeTextRightOverhang(font.manifest,text.value,metrics.size,text.alignment,text.lineAlignment,metrics.characterSpacing),rasterWidth=w+extra+Math.ceil(phase[0]),rasterHeight=h+above+below+Math.ceil(phase[1]);
  const key=JSON.stringify(['text',layout.fonts[text.font],text,w,h,alpha,material,phase,direct,coverage,direct&&sourceSize?pane.size:undefined]);
  const canvas=this.cached(key,()=>{
   const canvas=surface(rasterWidth,rasterHeight),ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=true;
   // Each mask uses the complete message for measurement, centering and advances.
   // Only ink is selected; spans never become independently positioned strings.
   const runs:{start:number;end:number;color?:number[]}[]=[];let start=0;
   for(const span of text.colorSpans??[]){
    if(!Number.isInteger(span.start)||!Number.isInteger(span.end)||span.start<start||span.end<=span.start||span.end>text.value.length||span.color.length!==4||span.color.some(v=>!Number.isInteger(v)||v<0||v>255))throw new Error('Invalid native text color span');
    if(span.start>start)runs.push({start,end:span.start});
    runs.push(span);start=span.end;
   }
   if(start<text.value.length||!runs.length)runs.push({start,end:text.value.length});
   const mask=runs.length>1?surface(rasterWidth,rasterHeight):canvas,ink=mask.getContext('2d')!;
   for(const run of runs){
    if(mask!==canvas)ink.clearRect(0,0,rasterWidth,rasterHeight);
    ink.save();ink.translate(0,above);
    font.drawNative(ink,text.value,direct&&sourceSize?pane.size[0]:w,direct&&sourceSize?pane.size[1]:h,metrics.size,text.alignment,metrics.characterSpacing,metrics.lineSpacing,text.lineAlignment,phase,direct,coverage,text.colorSpans?.length?[run.start,run.end]:undefined,text.cursorAdvances,sourceSize,sourceTopLeftSampling,text.lineAdvanceScales,text.multilineBlockOrigin);
    ink.restore();
    const image=ink.getImageData(0,0,rasterWidth,rasterHeight);
    for(let y=0;y<rasterHeight;y++)for(let x=0;x<rasterWidth;x++){
     const at=(y*rasterWidth+x)*4;if(!image.data[at+3])continue;
     const top=run.color??text.topColor,bottom=run.color??text.bottomColor;
     const primary=interpolateNativeQuad([...top,...top,...bottom,...bottom],.5,(y+.5-phase[1]-above)/(direct&&sourceSize?pane.size[1]:h),4).map(v=>v/255);primary[3]*=alpha;
     const tex=Array.from(image.data.subarray(at,at+4),v=>v/255);
     image.data.set(evaluateNativeMaterial(material,[tex],primary).map(v=>v*255),at);
    }
    if(nativeDarkenBlend(material))for(let i=0;i<image.data.length;i+=4)image.data[i]=image.data[i+1]=image.data[i+2]=0;
    ink.putImageData(image,0,0);if(mask!==canvas)ctx.drawImage(mask,0,0);
   }
   if(mask!==canvas)mask.width=mask.height=0;
   return canvas;
  });
  return {canvas,phase,extra,above,below,direct};
 }
 private composite(ctx:Context,canvas:HTMLCanvasElement,x:number,y:number,w:number,h:number,layout:NativeLayout,index:number,override?:NativeMaterial,allowOpaqueDarken=false){
  const material=override??layout.materials[index],blend=material.colorBlend;
  ctx.save();
  try{
   // Coverage/resampling and nonunit Canvas alpha differ from readback. Opt in
   // only for whole device pixels with one raster texel per destination pixel.
   const darkenTransform=allowOpaqueDarken&&nativeDarkenBlend(material)?ctx.getTransform():undefined;
   if(darkenTransform&&ctx.globalAlpha===1&&wholeDevicePixelRect([x,y,w,h],darkenTransform)&&Math.abs(darkenTransform.a*w)===canvas.width&&Math.abs(darkenTransform.d*h)===canvas.height){ctx.globalCompositeOperation='source-over';ctx.drawImage(canvas,x,y,w,h);return;}
   if(!blend||(blend.operation===1&&blend.sourceFactor===4&&blend.destinationFactor===5)){ctx.globalCompositeOperation='source-over';ctx.drawImage(canvas,x,y,w,h);return;}
   if(blend.operation===0){ctx.globalCompositeOperation='source-over';ctx.drawImage(canvas,x,y,w,h);return;}
   if(nativeMultiplyBlend(blend)&&this.opaque.has(canvas)){ctx.globalCompositeOperation='multiply';ctx.drawImage(canvas,x,y,w,h);return;}
   // Readback is limited to uncommon native blend modes; ordinary panes stay on Canvas's fast path.
   const target=this.blendTarget??=surface(ctx.canvas.width,ctx.canvas.height);
   if(target.width!==ctx.canvas.width||target.height!==ctx.canvas.height){target.width=ctx.canvas.width;target.height=ctx.canvas.height;}
   const tmp=target.getContext('2d',{willReadFrequently:true})!,m=darkenTransform??ctx.getTransform();
   tmp.resetTransform();tmp.clearRect(0,0,target.width,target.height);tmp.setTransform(m);tmp.drawImage(canvas,x,y,w,h);tmp.resetTransform();
   const src=tmp.getImageData(0,0,target.width,target.height),dst=ctx.getImageData(0,0,target.width,target.height),det=m.a*m.d-m.b*m.c;
   if(!det)return;
   for(let py=0;py<target.height;py++)for(let px=0;px<target.width;px++){
    const rx=px+.5-m.e,ry=py+.5-m.f,lx=(m.d*rx-m.c*ry)/det,ly=(-m.b*rx+m.a*ry)/det;
    if(lx<x||ly<y||lx>=x+w||ly>=y+h)continue;
    const at=(py*target.width+px)*4,a=Array.from(src.data.subarray(at,at+4),n=>n/255),b=Array.from(dst.data.subarray(at,at+4),n=>n/255);
    dst.data.set(blendNativePixel(a,b,blend).map(n=>n*255),at);
    // This target is the LCD's visible RGB. Retaining native blend alpha here
    // would attenuate edge RGB again when the screen CanvasTexture is sampled.
    dst.data[at+3]=255;
   }
   tmp.putImageData(dst,0,0);ctx.resetTransform();ctx.globalCompositeOperation='copy';ctx.drawImage(target,0,0);
  }finally{ctx.restore();}
 }

 /** Attach independently painted child layouts to an animated native pane.
  * The native renderer receives inherited primary alpha before TEV evaluation;
  * portfolio artwork can use the supplied alpha for its Canvas-only content.
  * Supply the same overrides used to draw the parent so runtime pane writes
  * also affect child placement, visibility and inherited alpha.
  */
 withPaneParent(ctx:Context,packName:string,layoutName:string,paneName:string,bindings:AnimationBinding[],draw:(alpha:number)=>void,overrides:PaneOverrides={}):boolean {
  if(this.disposed)return false;
  const pack=this.packs[packName],original=pack?.layouts[layoutName];if(!original)return false;
  // Attachment does not run draw diagnostics. Keep its entries separate so a
  // later draw cannot mistake an attachment-only pose for a validated draw.
  const key=JSON.stringify(['parent',packName,layoutName,bindings,overrides]);
  let posed=this.poses.get(key);
  if(!posed){posed=poseNativeLayout(original,pack.animations,bindings,overrides);if(this.poses.size>=16)this.poses.delete(this.poses.keys().next().value!);this.poses.set(key,posed);}
  const path=nativePaneParentPath(posed,paneName);if(!path){this.report(`Missing native parent ${layoutName}/${paneName}`);return false;}
  const previous=this.parentAlpha.get(ctx);let alpha=previous??1;
  ctx.save();
  try{
   ctx.translate(posed.canvas.width/2,posed.canvas.height/2);
   for(const pane of path){
    if(!(pane.flags&1))return true;
    ctx.translate(pane.translation[0],-pane.translation[1]);ctx.rotate(-pane.rotation[2]*Math.PI/180);
    ctx.scale(pane.scale[0]*Math.cos(pane.rotation[1]*Math.PI/180),pane.scale[1]*Math.cos(pane.rotation[0]*Math.PI/180));
    if(pane.flags&2)alpha*=pane.alpha/255;
   }
   ctx.translate(-posed.canvas.width/2,-posed.canvas.height/2);
   this.parentAlpha.set(ctx,alpha);draw(alpha);return true;
  }finally{if(previous===undefined)this.parentAlpha.delete(ctx);else this.parentAlpha.set(ctx,previous);ctx.restore();}
 }

 draw(ctx:Context,packName:string,layoutName:string,options:NativeDrawOptions={}):boolean {
  return this.drawResolved(ctx,packName,layoutName,options);
 }
 /** Draw an already-posed layout. Empty bindings keep retained pane values;
  * overrides (capture/icon/text) apply on that pose, not the shared original. */
 drawLayout(ctx:Context,packName:string,layoutName:string,layout:NativeLayout,options:NativeDrawOptions={}):boolean {
  if(this.disposed)return false;
  if(!this.packs[packName]||!layout){this.report(`Missing layout ${packName}/${layoutName}`);return false;}
  return this.drawResolved(ctx,packName,layoutName,{...options,bindings:options.bindings??[]},{
   layout,textures:this.textures[packName],key:JSON.stringify(['posed',packName,layoutName]),depth:0,
  });
 }
 private drawResolved(ctx:Context,packName:string,layoutName:string,options:NativeDrawOptions,instance?:{layout:NativeLayout;textures:ReadonlyMap<string,NativePixels>;key:string;depth:number}):boolean {
  if(this.disposed)return false;
  const pack=this.packs[packName],original=instance?.layout??pack?.layouts[layoutName];if(!original){this.report(`Missing layout ${packName}/${layoutName}`);return false;}
  const poseKey=JSON.stringify([instance?.key,packName,layoutName,options.bindings,options.overrides,options.textByCallName]);
  let posed=this.poses.get(poseKey);
  if(posed){this.poses.delete(poseKey);this.poses.set(poseKey,posed);}
  else{for(const binding of options.bindings??[]){const animation=pack.animations[binding.name];if(animation)for(const message of nativeAnimationDiagnostics(original,animation))this.report(`${layoutName}: ${message}`);}
   posed=poseNativeLayout(original,pack.animations,options.bindings,options.overrides);
   const textByCallName=options.textByCallName;
   if(textByCallName){const bind=(panes:NativePane[])=>panes.forEach(p=>{if(p.text?.callName&&options.overrides?.[p.name]?.text===undefined&&Object.hasOwn(textByCallName,p.text.callName))p.text.value=textByCallName[p.text.callName];bind(p.children);});bind(posed.roots);}
   if(this.poses.size>=16)this.poses.delete(this.poses.keys().next().value!);this.poses.set(poseKey,posed);}
  const layout=posed;
  // Bind replacements for this draw only; shared source packs/textures stay intact.
  const sourceTextures=instance?.textures??this.textures[packName];
  const textures=options.textures?new Map([...sourceTextures,...Object.entries(options.textures)]):sourceTextures;
  const textSamplingPanes=options.textSamplingPanes?new Set(options.textSamplingPanes):undefined;
  ctx.save();
  try{
   if(options.textSamplingPanes&&(!options.textSampling||options.textSamplingPanes.some(name=>typeof name!=='string'||!name)||textSamplingPanes!.size!==options.textSamplingPanes.length))throw new Error('Invalid native text sampling pane allowlist');
   if(textSamplingPanes){const available=new Set<string>();const scan=(panes:NativePane[])=>panes.forEach(pane=>{if(pane.text)available.add(pane.name);scan(pane.children);});scan(layout.roots);
    for(const name of textSamplingPanes)if(!available.has(name))throw new Error(`Missing native text sampling pane ${name}`);
   }
   if(layout.sourceFormat==='FLYT'&&layout.unsupported.length)throw new Error('Unsupported FLYT layout fields');
   for(const pixels of Object.values(options.textures??{}))if(!Number.isInteger(pixels.width)||!Number.isInteger(pixels.height)||pixels.width<1||pixels.height<1||pixels.width*pixels.height>1024*1024||pixels.data.length!==pixels.width*pixels.height*4)throw new Error('Invalid dynamic native texture');
   const allowOpaqueDarken=options.allowOpaqueDarken===true&&(!options.clip||wholeDevicePixelRect(options.clip,ctx.getTransform()));
   if(options.clip){ctx.beginPath();ctx.rect(...options.clip);ctx.clip();}
   const center=options.center??[layout.canvas.width/2,layout.canvas.height/2];ctx.translate(...center);ctx.scale(options.scale??1,options.scale??1);
   const visit=(pane:NativePane,parentAlpha:number)=>{
    if(pane.sourceFormat==='FLYT'&&pane.unsupported?.length)throw new Error(`Unsupported FLYT pane fields ${pane.name}`);
    if(!(pane.flags&1))return;
    const alpha=parentAlpha*pane.alpha/255;ctx.save();
    try{
     ctx.translate(pane.translation[0],-pane.translation[1]);ctx.rotate(-pane.rotation[2]*Math.PI/180);
     if(pane.rotation[0]||pane.rotation[1])this.report(`Unverified 3D pane projection: ${layoutName}/${pane.name}`);
     ctx.scale(pane.scale[0]*Math.cos(pane.rotation[1]*Math.PI/180),pane.scale[1]*Math.cos(pane.rotation[0]*Math.PI/180));
     const [w,h]=pane.size,x=-w*(pane.origin%3)/2,y=-h*Math.floor(pane.origin/3)/2;
     if(w>0&&h>0&&alpha>0){
      ctx.save();ctx.translate(x,y);
      try{
       if(pane.picture&&!this.projectedPicture(ctx,layout,pane.picture,w,h,alpha,textures,options.pictureSampling==='lcd')){this.composite(ctx,this.picture(packName,layout,pane.picture,w,h,alpha,textures),0,0,w,h,layout,pane.picture.material,undefined,allowOpaqueDarken);}
       if(pane.text){const textSampling=!textSamplingPanes||textSamplingPanes.has(pane.name)?options.textSampling:undefined;
        const raster=this.text(layout,pane,alpha,textSampling?ctx.getTransform?.():undefined,options.textCoverageAdaptation,textSampling==='lcd-source-size'||textSampling==='lcd-source-size-left',textSampling==='lcd-source-size-left'),textCanvas=raster.canvas;
        ctx.beginPath();ctx.rect(0,-raster.above,w*(Math.ceil(w)+raster.extra)/Math.ceil(w),h+raster.above+raster.below);ctx.clip();
        const sourceSize=textSampling==='lcd-source-size'||textSampling==='lcd-source-size-left';
        this.composite(ctx,textCanvas,0-raster.phase[0],0-raster.above-raster.phase[1],raster.direct&&sourceSize?textCanvas.width:w*textCanvas.width/Math.ceil(w),raster.direct&&sourceSize?textCanvas.height:h*textCanvas.height/Math.ceil(h),layout,pane.text.material);
       }
       if(pane.window)for(const patch of nativeWindowPatches(pane,layout,textures)){
        if(patch.width<=0||patch.height<=0)continue;
        if(options.pictureSampling==='lcd'){
         ctx.save();let sampled=false;try{ctx.translate(patch.x,patch.y);sampled=this.projectedPicture(ctx,layout,patch.picture,patch.width,patch.height,alpha,textures,true,patch.material);}finally{ctx.restore();}
         if(sampled)continue;
        }
        const visible=nativeVisibleRasterRect(patch.x,patch.y,patch.width,patch.height,ctx.getTransform(),ctx.canvas.width,ctx.canvas.height);if(!visible)continue;
        this.composite(ctx,this.picture(packName,layout,patch.picture,visible.rasterWidth,visible.rasterHeight,alpha,textures,patch.material,visible.sampling),visible.x,visible.y,visible.width,visible.height,layout,patch.picture.material,patch.material,allowOpaqueDarken);
       }
      }finally{ctx.restore();}
     }
     if(pane.part){
      const depth=(instance?.depth??0)+1;if(depth>8)throw new Error('Native part dependency cycle/depth limit');
      const link=options.parts?.[pane.part.layout];
      const template=link&&this.packs[link.pack]?.layouts[link.layout];
      if(!link||!template)throw new Error(`Missing native part layout ${pane.part.layout}`);
      const prepared=instantiateNativePart(layout,pane.part,template),images=new Map(this.textures[link.pack]);
      for(const [alias,name] of Object.entries(prepared.parentTextures)){
       const image=textures.get(name);if(!image)throw new Error(`Missing native part texture ${name}`);images.set(alias,image);
      }
      const partOptions=options.partBindings?.[pane.name],previous=this.parentAlpha.get(ctx);
      this.parentAlpha.set(ctx,pane.flags&2?alpha:parentAlpha);
      try{
       const key=JSON.stringify([poseKey,pane.name,pane.part]);
       if(!this.drawResolved(ctx,link.pack,link.layout,{parts:options.parts,partBindings:options.partBindings,textByCallName:options.textByCallName,
        bindings:partOptions?.bindings,overrides:partOptions?.overrides,center:[0,0]}, {layout:prepared.layout,textures:images,key,depth}))throw new Error(`Failed native part ${pane.name}`);
      }finally{if(previous===undefined)this.parentAlpha.delete(ctx);else this.parentAlpha.set(ctx,previous);}
     }
     // InfluenceAlpha transmits this pane's alpha; an unflagged pane keeps the inherited chain.
     const childAlpha=pane.flags&2?alpha:parentAlpha;
     for(const child of pane.children)visit(child,childAlpha);
     const attached=options.attachments?.[pane.name];
     if(attached){
      // A child draw supplies its normal layout center. Cancel the parent's
      // center here, as withPaneParent does, while retaining its pane transform.
      const previous=this.parentAlpha.get(ctx);ctx.save();
      try{ctx.translate(-layout.canvas.width/2,-layout.canvas.height/2);this.parentAlpha.set(ctx,childAlpha);attached(childAlpha);}
      finally{if(previous===undefined)this.parentAlpha.delete(ctx);else this.parentAlpha.set(ctx,previous);ctx.restore();}
     }
    }finally{ctx.restore();}
   };
   for(const root of layout.roots)visit(root,this.parentAlpha.get(ctx)??1);
   return true;
  }catch(error){this.report(`${packName}/${layoutName}: ${error instanceof Error?error.message:String(error)}`);return false;}
  finally{ctx.restore();}
 }
 get cacheBytes(){return this.bytes;}
 dispose(){if(this.disposed)return;this.disposed=true;for(const c of this.cache.values())c.width=c.height=0;this.cache.clear();this.poses.clear();this.bytes=0;if(this.blendTarget)this.blendTarget.width=this.blendTarget.height=0;if(this.projectedTarget)this.projectedTarget.width=this.projectedTarget.height=0;for(const images of Object.values(this.textures))images.clear();}
}
