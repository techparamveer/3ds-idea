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
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),report={nativeSha256:hash(o.native),comparison:'RGB differences only; no acceptance threshold. Excludes room and vinyl from the measured regions.',screens:{}};
for(const side of ['top','bottom']){
 const w=side==='top'?400:320,canvas=createCanvas(w,240),ctx=canvas.getContext('2d'),crop=side==='top'?[0,0,400,240]:[40,240,320,240];
 ctx.drawImage(native,...crop,0,0,w,240);const reference=ctx.getImageData(0,0,w,240).data;
 writeFileSync(join(o.out,'native-'+side+'.png'),canvas.toBuffer('image/png'));
 const renderPath=join(o.renders,'sound-main-'+side+'.png'),render=await loadImage(renderPath);assert.deepEqual([render.width,render.height],[w,240]);
 ctx.clearRect(0,0,w,240);ctx.drawImage(render,0,0);const actual=ctx.getImageData(0,0,w,240).data,regions={};
 const entries=side==='top'?[['title',[0,0,400,32]]]:[['open',[98,178,124,60]],['footer',[0,178,320,62]],['slider',[0,148,320,24]]];
 for(const [name,rect]of entries){let delta=0,equal=0;for(let y=rect[1];y<rect[1]+rect[3];y++)for(let x=rect[0];x<rect[0]+rect[2];x++){
  const offset=(y*w+x)*4;let same=true;for(let channel=0;channel<3;channel++){delta+=Math.abs(reference[offset+channel]-actual[offset+channel]);same&&=reference[offset+channel]===actual[offset+channel];}if(same)equal++;
 }const pixels=rect[2]*rect[3];regions[name]={rect,meanAbsoluteRgbDifference:delta/(pixels*3),exactRgbFraction:equal/pixels};}
 report.screens[side]={nativeCrop:crop,renderSha256:hash(renderPath),regions};
}
writeFileSync(join(o.out,'comparison.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
