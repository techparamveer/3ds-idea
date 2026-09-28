/** Isolated original texture-pattern checkpoints, deliberately not a live clock. */
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync,writeFileSync} from 'node:fs';
import {isAbsolute,join} from 'node:path';
import {parseArgs} from 'node:util';
const {values:o}=parseArgs({options:{report:{type:'string'},textures:{type:'string'},output:{type:'string'}}});
for(const k of ['report','textures','output'])assert.ok(isAbsolute(o[k]??''),k+' must be absolute');
const audit=JSON.parse(readFileSync(o.report)),rows=['Wait','RandomA','RandomB','RandomC','RandomD','RandomF','RandomG'],frames=[0,4,6,30,54,56,60],layers=[],sampled=[];
for(let r=0;r<rows.length;r++)for(let c=0;c<frames.length;c++){
 const clip=audit.clips['ParakeetA_U_'+rows[r]],frame=frames[c],key=clip.patternKeys.filter(k=>k.frame<=frame).at(-1),texture=clip.textures[key.value];
 assert.ok(texture);const input=await sharp(join(o.textures,texture+'.png')).resize(64,64,{fit:'contain',kernel:'nearest'}).png().toBuffer();
 layers.push({input,left:140+c*90,top:38+r*86});sampled.push({clip:rows[r],frame,texture});
}
const label=`<svg width="800" height="640"><rect width="800" height="640" fill="#eee"/><g font-family="sans-serif" font-size="15" fill="#222"><text x="10" y="20">Original texture-pattern checkpoints; not a scheduled upper-LCD animation</text>${frames.map((f,i)=>`<text x="${145+i*90}" y="38">f ${f}</text>`).join('')}${rows.map((s,i)=>`<text x="12" y="${80+i*86}">${s}</text>`).join('')}</g></svg>`;
await sharp(Buffer.from(label)).composite(layers).png().toFile(o.output);writeFileSync(o.output+'.json',JSON.stringify(sampled,null,2)+'\n');
console.log('Rendered 49 original texture checkpoints; Wait frame 60 is an explicit endpoint, not loop timing.');
