import { BitmapFont } from './bitmap-font';
import { blendNativePixel, evaluateNativeMaterial, interpolateNativeQuad, nativeAnimationDiagnostics, nativeMultiplyBlend, nativePaneParentPath, nativeTextMetrics, nativeWindowPatches, nativeVisibleRasterRect, poseNativeLayout, rasterNativePicture,
 type AnimationBinding, type NativeLayout, type NativeMaterial, type NativePack, type NativePane, type NativePicture, type NativePixels, type NativeRasterRegion, type PaneOverrides } from './native-layout';

type Context=CanvasRenderingContext2D;
export type NativeDrawOptions={bindings?:AnimationBinding[];overrides?:PaneOverrides;center?:[number,number];scale?:number;clip?:[number,number,number,number];textures?:Readonly<Record<string,NativePixels>>;
 /** Caller guarantees an opaque LCD target with no inherited fractional clip. */
 allowOpaqueDarken?:boolean};
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
 private disposed=false;
 private parentAlpha=new WeakMap<Context,number>();
 readonly diagnostics:string[]=[];
 constructor(readonly packs:Record<string,NativePack>,private textures:Record<string,Map<string,NativePixels>>,private fonts:ReadonlyMap<string,BitmapFont>,private cacheLimit=8*1024*1024){}
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
 private text(layout:NativeLayout,pane:NativePane,alpha:number){
  const text=pane.text!,font=this.fonts.get(layout.fonts[text.font]);if(!font)throw new Error(`Missing native font ${layout.fonts[text.font]}`);
  const [w,h]=pane.size.map(Math.ceil),material=layout.materials[text.material];
  const key=JSON.stringify(['text',layout.fonts[text.font],text,w,h,alpha,material]);
  return this.cached(key,()=>{
   const canvas=surface(w,h),ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=true;
   const metrics=nativeTextMetrics(text,font.manifest);
   font.drawNative(ctx,text.value,w,h,metrics.size,text.alignment,metrics.characterSpacing,metrics.lineSpacing,text.lineAlignment);
   const image=ctx.getImageData(0,0,w,h);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const at=(y*w+x)*4;if(!image.data[at+3])continue;
    const primary=interpolateNativeQuad([...text.topColor,...text.topColor,...text.bottomColor,...text.bottomColor],.5,(y+.5)/h,4).map(v=>v/255);primary[3]*=alpha;
    const tex=Array.from(image.data.subarray(at,at+4),v=>v/255);
    image.data.set(evaluateNativeMaterial(material,[tex],primary).map(v=>v*255),at);
   }
   if(nativeDarkenBlend(material))for(let i=0;i<image.data.length;i+=4)image.data[i]=image.data[i+1]=image.data[i+2]=0;
   ctx.putImageData(image,0,0);return canvas;
  });
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
  const key=JSON.stringify([packName,layoutName,bindings,overrides]);
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
  if(this.disposed)return false;
  const pack=this.packs[packName],original=pack?.layouts[layoutName];if(!original){this.report(`Missing layout ${packName}/${layoutName}`);return false;}
  const poseKey=JSON.stringify([packName,layoutName,options.bindings,options.overrides]);
  let posed=this.poses.get(poseKey);
  if(posed){this.poses.delete(poseKey);this.poses.set(poseKey,posed);}
  else{for(const binding of options.bindings??[]){const animation=pack.animations[binding.name];if(animation)for(const message of nativeAnimationDiagnostics(original,animation))this.report(`${layoutName}: ${message}`);}
   posed=poseNativeLayout(original,pack.animations,options.bindings,options.overrides);if(this.poses.size>=16)this.poses.delete(this.poses.keys().next().value!);this.poses.set(poseKey,posed);}
  const layout=posed;
  // Bind replacements for this draw only; shared source packs/textures stay intact.
  const textures=options.textures?new Map([...this.textures[packName],...Object.entries(options.textures)]):this.textures[packName];
  ctx.save();
  try{
   for(const pixels of Object.values(options.textures??{}))if(!Number.isInteger(pixels.width)||!Number.isInteger(pixels.height)||pixels.width<1||pixels.height<1||pixels.width*pixels.height>1024*1024||pixels.data.length!==pixels.width*pixels.height*4)throw new Error('Invalid dynamic native texture');
   const allowOpaqueDarken=options.allowOpaqueDarken===true&&(!options.clip||wholeDevicePixelRect(options.clip,ctx.getTransform()));
   if(options.clip){ctx.beginPath();ctx.rect(...options.clip);ctx.clip();}
   const center=options.center??[layout.canvas.width/2,layout.canvas.height/2];ctx.translate(...center);ctx.scale(options.scale??1,options.scale??1);
   const visit=(pane:NativePane,parentAlpha:number)=>{
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
       if(pane.picture){this.composite(ctx,this.picture(packName,layout,pane.picture,w,h,alpha,textures),0,0,w,h,layout,pane.picture.material,undefined,allowOpaqueDarken);}
       if(pane.text){ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();this.composite(ctx,this.text(layout,pane,alpha),0,0,w,h,layout,pane.text.material);}
       if(pane.window)for(const patch of nativeWindowPatches(pane,layout,textures)){
        if(patch.width<=0||patch.height<=0)continue;
        const visible=nativeVisibleRasterRect(patch.x,patch.y,patch.width,patch.height,ctx.getTransform(),ctx.canvas.width,ctx.canvas.height);if(!visible)continue;
        this.composite(ctx,this.picture(packName,layout,patch.picture,visible.rasterWidth,visible.rasterHeight,alpha,textures,patch.material,visible.sampling),visible.x,visible.y,visible.width,visible.height,layout,patch.picture.material,patch.material,allowOpaqueDarken);
       }
      }finally{ctx.restore();}
     }
     // InfluenceAlpha transmits this pane's alpha; an unflagged pane keeps the inherited chain.
     for(const child of pane.children)visit(child,pane.flags&2?alpha:parentAlpha);
    }finally{ctx.restore();}
   };
   for(const root of layout.roots)visit(root,this.parentAlpha.get(ctx)??1);
   return true;
  }catch(error){this.report(`${packName}/${layoutName}: ${error instanceof Error?error.message:String(error)}`);return false;}
  finally{ctx.restore();}
 }
 get cacheBytes(){return this.bytes;}
 dispose(){if(this.disposed)return;this.disposed=true;for(const c of this.cache.values())c.width=c.height=0;this.cache.clear();this.poses.clear();this.bytes=0;if(this.blendTarget)this.blendTarget.width=this.blendTarget.height=0;for(const images of Object.values(this.textures))images.clear();}
}
