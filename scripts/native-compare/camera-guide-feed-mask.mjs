/** Derive the strictly unobscured live-feed mask from delivered Camera resources.
 * This never reads native/browser captures or their difference images. */
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import ts from 'typescript';
const root=fileURLToPath(new URL('../../',import.meta.url));
const firmware=path.join(root,'public/os/firmware/10.7.0-32E');
const prefix='packs/camera/contents/0000-0000001a/';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function cameraGuideFeedMask(){
 const sources=[];
 const read=async relative=>{const bytes=await readFile(path.join(firmware,relative));sources.push({file:relative,sha256:hash(bytes)});return bytes;};
 const dialog=JSON.parse(await read(prefix+'lyt-C-Dlg.json'));
 const finder=JSON.parse(await read(prefix+'lyt-P_Finder_U-arc-LZ.json'));
 const guide=JSON.parse(await read(prefix+'lyt-P_Guid_U-arc-LZ.json'));
 const moduleSource=await readFile(path.join(root,'src/os/native-layout.ts'),'utf8');
 const js=ts.transpileModule(moduleSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const {rasterNativePicture}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 const layout=dialog.layouts.C_DlgGuid_U,textures=new Map();
 for(const name of layout.textures){const entry=dialog.textures[name];const decoded=await sharp(await read(entry.url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});textures.set(name,{width:decoded.info.width,height:decoded.info.height,data:decoded.data,picaFormat:entry.picaFormat});}
 const guideAlpha=new Uint8Array(400*240);
 for(const pane of layout.roots[0].children.filter(p=>p.picture)){
  if(pane.origin!==4||pane.rotation.some(Boolean)||pane.scale[1]!==1||Math.abs(pane.scale[0])!==1)throw new Error('Re-audit guide pane transform');
  const [w,h]=pane.size,left=200+pane.translation[0]-w/2,top=120-pane.translation[1]-h/2;
  if(![w,h,left,top].every(Number.isInteger))throw new Error('Re-audit fractional guide geometry');
  const pixels=rasterNativePicture(layout,pane.picture,w,h,textures,pane.alpha/255);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=pane.scale[0]<0?w-1-x:x;
   guideAlpha[(top+y)*400+left+x]=Math.max(guideAlpha[(top+y)*400+left+x],pixels.data[(y*w+sx)*4+3]);
  }
 }
 // Retain every illustration pane footprint even if a later resource revision
 // extends beyond the opaque frame. No text, icon or guide border is masked.
 const protectedPixels=new Uint8Array(400*240),protectedBounds=[];
 const protect=(name,x,y,w,h)=>{const x0=Math.max(0,Math.floor(x)),x1=Math.min(400,Math.ceil(x+w)),y0=Math.max(0,Math.floor(y)),y1=Math.min(240,Math.ceil(y+h));protectedBounds.push({name,x:x0,y:y0,width:x1-x0,height:y1-y0});for(let py=y0;py<y1;py++)protectedPixels.fill(1,py*400+x0,py*400+x1);};
 for(const name of ['P_Guid05_U','P_Guid01_U','P_Guid02_U'])for(const pane of guide.layouts[name].roots[0].children){const [w,h]=pane.size.map((n,i)=>n*Math.abs(pane.scale[i]));protect(name+'/'+pane.name,200+pane.translation[0]-w/2,120-pane.translation[1]-h/2,w,h);}
 // Reserve full source HUD owner rectangles and children, including transparent
 // padding. This intentionally under-masks rather than judging glyph alpha.
 for(const name of ['PhoRem','Storage','ViewInfo']){
  const owner=finder.layouts.P_Finder_U.roots[0].children.find(p=>p.name===name);
  const panes=[owner,...owner.children.map(p=>({...p,translation:p.translation.map((v,i)=>v+owner.translation[i])}))];
  let x0=400,y0=240,x1=0,y1=0;
  for(const p of panes){x0=Math.min(x0,200+p.translation[0]-p.size[0]/2);x1=Math.max(x1,200+p.translation[0]+p.size[0]/2);y0=Math.min(y0,120-p.translation[1]-p.size[1]/2);y1=Math.max(y1,120-p.translation[1]+p.size[1]/2);}
  protect('P_Finder_U/'+name,x0,y0,x1-x0,y1-y0);
 }
 const regions=[];
 for(let y=0;y<240;y++)for(let x=0;x<400;){if(guideAlpha[y*400+x]||protectedPixels[y*400+x]){x++;continue;}const start=x;while(x<400&&!guideAlpha[y*400+x]&&!protectedPixels[y*400+x])x++;
  const previous=regions.findLast(r=>r.x===start&&r.width===x-start&&r.y+r.height===y);
  if(previous)previous.height++;else regions.push({screen:'upper',x:start,y,width:x-start,height:1,category:'feature-map-adaptation',reason:'Strictly zero guide alpha exposes the intentionally replaced live camera feed; guide border, illustrations and HUD bounds remain compared.',featureMapRef:'docs/camera-guide-feed-mask.md'});
 }
 return {mask:{name:'camera-guide-pages-3-5-unobscured-live-feed',scope:'Only settled Welcome pages 3–5; no border-alpha or HUD masking.',sources,protectedBounds,regions},guideAlpha,protectedPixels};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const {mask}=await cameraGuideFeedMask();await writeFile(new URL('./camera-guide-feed-mask.json',import.meta.url),JSON.stringify(mask,null,2)+'\n');console.log(mask.regions.reduce((sum,r)=>sum+r.width*r.height,0)+' pixels in '+mask.regions.length+' rectangles');
}
