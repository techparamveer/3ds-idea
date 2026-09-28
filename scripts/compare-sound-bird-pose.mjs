/** Compare the three settled Sound entry birds' coloured silhouettes in matched LCD crops. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {parseArgs} from 'node:util';
import sharp from 'sharp';

const {values:paths}=parseArgs({options:Object.fromEntries(
  ['native','baseline-top','baseline-bottom','current-top','current-bottom','out'].map(name=>[name,{type:'string'}])
)});
for(const [name,path] of Object.entries(paths))assert.ok(isAbsolute(path??''),`${name} must be absolute`);
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const nativeSha=sha(paths.native);
assert.equal(nativeSha,'9071f0d1a3fa47bbc8e407245906a2efa9a90cac9f1c91ecb92c3b15eb809485','settled native capture');
const pixels=async path=>{
  const {data,info}=await sharp(path).removeAlpha().raw().toBuffer({resolveWithObject:true});
  return {data,width:info.width,height:info.height};
};
const native=await pixels(paths.native);
assert.deepEqual([native.width,native.height],[400,480]);
const images={
  baseline:{top:await pixels(paths['baseline-top']),bottom:await pixels(paths['baseline-bottom'])},
  current:{top:await pixels(paths['current-top']),bottom:await pixels(paths['current-bottom'])},
};
for(const set of Object.values(images)){
  assert.deepEqual([set.top.width,set.top.height],[400,240]);
  assert.deepEqual([set.bottom.width,set.bottom.height],[320,240]);
}
// Original birds use vivid green and yellow. The conservative colour mask keeps
// the room, record texture, slider and HUD outside the comparison.
function birdPixel(image,x,y){
  const i=(y*image.width+x)*3,[r,g,b]=image.data.subarray(i,i+3);
  return (g>r*1.28&&g>b*1.25&&g>90)||(r>150&&g>125&&b<105);
}
const crops=[
  {name:'upperLeft',screen:'top',rect:[16,174,38,44],nativeOrigin:[0,0]},
  {name:'upperRight',screen:'top',rect:[76,174,38,44],nativeOrigin:[0,0]},
  {name:'lower',screen:'bottom',rect:[2,97,38,58],nativeOrigin:[40,240]},
];
const report={nativeSha256:nativeSha,metric:'Vivid green/yellow bird silhouette IoU in matched LCD crops; no native motion claim.',crops:{}};
for(const crop of crops){
  const [x0,y0,w,h]=crop.rect,[ox,oy]=crop.nativeOrigin;
  const compare=image=>{
    let intersection=0,union=0,referencePixels=0,renderPixels=0,mismatchedPixels=0,rgbDifference=0;
    for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
      const reference=birdPixel(native,x+ox,y+oy),render=birdPixel(image,x,y);
      referencePixels+=Number(reference);renderPixels+=Number(render);
      intersection+=Number(reference&&render);union+=Number(reference||render);
      mismatchedPixels+=Number(reference!==render);
      if(reference){
        const nativeIndex=((y+oy)*native.width+x+ox)*3,renderIndex=(y*image.width+x)*3;
        for(let channel=0;channel<3;channel++)rgbDifference+=Math.abs(native.data[nativeIndex+channel]-image.data[renderIndex+channel]);
      }
    }
    return {referencePixels,renderPixels,intersection,union,mismatchedPixels,intersectionOverUnion:intersection/union,
      nativeBirdMeanAbsoluteRgbDifference:rgbDifference/(referencePixels*3)};
  };
  report.crops[crop.name]={screen:crop.screen,rect:crop.rect,nativeOrigin:crop.nativeOrigin,
    baseline:compare(images.baseline[crop.screen]),current:compare(images.current[crop.screen])};
}
writeFileSync(paths.out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
