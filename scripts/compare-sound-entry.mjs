import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isAbsolute,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
const {values:o}=parseArgs({options:Object.fromEntries(['native','renders','out','canvas'].map(k=>[k,{type:'string'}]))});
for(const k of ['native','renders','out','canvas'])assert.ok(isAbsolute(o[k]??''),k+' must be absolute');
const {createCanvas,loadImage}=await import(pathToFileURL(o.canvas)),native=await loadImage(o.native);
assert.deepEqual([native.width,native.height],[400,480]);mkdirSync(o.out,{recursive:true});
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),report={nativeSha256:hash(o.native),comparison:'RGB regions and bounded glyph/arrow masks; no acceptance threshold. The upper full-screen comparison requires the separately rendered CGFX room.',screens:{}};
for(const side of ['top','bottom']){
 const w=side==='top'?400:320,canvas=createCanvas(w,240),ctx=canvas.getContext('2d'),crop=side==='top'?[0,0,400,240]:[40,240,320,240];
 ctx.drawImage(native,...crop,0,0,w,240);const reference=ctx.getImageData(0,0,w,240).data;
 writeFileSync(join(o.out,'native-'+side+'.png'),canvas.toBuffer('image/png'));
 const renderPath=join(o.renders,'sound-main-'+side+'.png'),render=await loadImage(renderPath);assert.deepEqual([render.width,render.height],[w,240]);
 ctx.clearRect(0,0,w,240);ctx.drawImage(render,0,0);const actual=ctx.getImageData(0,0,w,240).data,regions={};
 const entries=side==='top'?[['title',[0,0,400,32]]]:[['whole',[0,0,320,240]],['entryRow',[0,32,320,32]],['entryIcon',[0,32,56,32]],['entryArrow',[6,38,24,20]],['entryLeftFill',[0,38,7,19]],['entryLabel',[56,37,224,20]],['open',[98,178,124,60]],['footer',[0,178,320,62]],['footerStreetPass',[0,178,92,31]],['footerBack',[0,209,92,31]],['footerAdd',[228,178,92,31]],['footerSettings',[228,209,92,31]],['slider',[0,148,320,24]]];
 for(const [name,rect]of entries){let delta=0,equal=0;for(let y=rect[1];y<rect[1]+rect[3];y++)for(let x=rect[0];x<rect[0]+rect[2];x++){
  const offset=(y*w+x)*4;let same=true;for(let channel=0;channel<3;channel++){delta+=Math.abs(reference[offset+channel]-actual[offset+channel]);same&&=reference[offset+channel]===actual[offset+channel];}if(same)equal++;
 }const pixels=rect[2]*rect[3];regions[name]={rect,meanAbsoluteRgbDifference:delta/(pixels*3),exactRgbFraction:equal/pixels};}
 if(side==='bottom'){
  // The settled row label uses white source CFNT coverage on dark artwork.
  // This bounded mask measures placement/shape separately from RGB filtering.
  const [x0,y0,rw,rh]=[56,37,224,20],white=(data,at)=>{
   const r=data[at],g=data[at+1],b=data[at+2];return Math.min(r,g,b)>180&&Math.max(r,g,b)-Math.min(r,g,b)<35;
  };
  let nativePixels=0,renderPixels=0,intersection=0,union=0;
  for(let y=y0;y<y0+rh;y++)for(let x=x0;x<x0+rw;x++){
   const at=(y*w+x)*4,a=white(reference,at),b=white(actual,at);
   nativePixels+=Number(a);renderPixels+=Number(b);intersection+=Number(a&&b);union+=Number(a||b);
  }
  regions.entryGlyphMask={rect:[x0,y0,rw,rh],nativePixels,renderPixels,intersection,union,iou:intersection/union};
  const [ax,ay,aw,ah]=[6,38,24,20],red=(data,at)=>{
   const r=data[at],g=data[at+1],b=data[at+2];return r>90&&r>g*1.35&&r>b*1.3;
  };
  let nativeRed=0,renderRed=0,redIntersection=0,redUnion=0,exactRed=0;
  for(let y=ay;y<ay+ah;y++)for(let x=ax;x<ax+aw;x++){
   const at=(y*w+x)*4,a=red(reference,at),b=red(actual,at);
   nativeRed+=Number(a);renderRed+=Number(b);redIntersection+=Number(a&&b);redUnion+=Number(a||b);
   if(a||b)exactRed+=Number(reference[at]===actual[at]&&reference[at+1]===actual[at+1]&&reference[at+2]===actual[at+2]);
  }
  regions.entryRedMask={rect:[ax,ay,aw,ah],nativePixels:nativeRed,renderPixels:renderRed,intersection:redIntersection,union:redUnion,iou:redIntersection/redUnion,exactRgbFraction:exactRed/redUnion};
 }
 report.screens[side]={nativeCrop:crop,renderSha256:hash(renderPath),regions};
}
writeFileSync(join(o.out,'comparison.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
