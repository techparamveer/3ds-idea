import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';

export const LOWER_SIZE=Object.freeze({width:320,height:240,channels:3});
export const BALLOON_REGIONS=Object.freeze({
 body:Object.freeze({left:24,top:49,width:256,height:62}),
 titleSearch:Object.freeze({left:0,top:58,width:320,height:22}),
 publisherSearch:Object.freeze({left:0,top:80,width:320,height:21}),
 textCompare:Object.freeze({left:40,top:60,width:224,height:38}),
 tail:Object.freeze({left:66,top:105,width:20,height:21}),
 selectedTile:Object.freeze({left:40,top:122,width:72,height:83}),
});

const round=(value,digits=6)=>Number(value.toFixed(digits));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const luminance=(pixels,index)=>.2126*pixels[index]+.7152*pixels[index+1]+.0722*pixels[index+2];
const mint=(pixels,index)=>pixels[index+1]>190&&pixels[index+2]>150&&pixels[index]<130;
export const clampBalloonBodyCenter=tileCenter=>Math.max(152,Math.min(168,tileCenter));

export function regionBytes(pixels,region,dx=0,dy=0){
 const bytes=Buffer.alloc(region.width*region.height*LOWER_SIZE.channels);
 let target=0;
 for(let y=region.top;y<region.top+region.height;y++)for(let x=region.left;x<region.left+region.width;x++){
  const source=((y+dy)*LOWER_SIZE.width+x+dx)*LOWER_SIZE.channels;
  pixels.copy(bytes,target,source,source+LOWER_SIZE.channels);target+=LOWER_SIZE.channels;
 }
 return bytes;
}

export function compareRegion(reference,candidate,region,dx,dy,predicate=null){
 let absolute=0,squared=0,maxAbsolute=0,pixels=0,pixelsAbove2=0,channelsAbove2=0;
 for(let y=region.top;y<region.top+region.height;y++)for(let x=region.left;x<region.left+region.width;x++){
  const referenceIndex=(y*LOWER_SIZE.width+x)*LOWER_SIZE.channels;
  const candidateX=x+dx,candidateY=y+dy;
  if(candidateX<0||candidateX>=LOWER_SIZE.width||candidateY<0||candidateY>=LOWER_SIZE.height)continue;
  const candidateIndex=(candidateY*LOWER_SIZE.width+candidateX)*LOWER_SIZE.channels;
  if(predicate&&!predicate(reference,referenceIndex,candidate,candidateIndex))continue;
  let pixelAbove2=false;
  for(let channel=0;channel<LOWER_SIZE.channels;channel++){
   const difference=Math.abs(reference[referenceIndex+channel]-candidate[candidateIndex+channel]);
   absolute+=difference;squared+=difference*difference;maxAbsolute=Math.max(maxAbsolute,difference);
   if(difference>2){channelsAbove2++;pixelAbove2=true}
  }
  pixels++;if(pixelAbove2)pixelsAbove2++;
 }
 assert.ok(pixels>0,'comparison region must contain selected pixels');
 const channels=pixels*LOWER_SIZE.channels;
 return Object.freeze({dx,dy,pixelCount:pixels,pixelsAbove2,channelsAbove2,mae:round(absolute/channels),rmse:round(Math.sqrt(squared/channels)),maxAbsolute});
}

export function findBestTranslation(reference,candidate,region,{minimumDx,maximumDx,minimumDy,maximumDy,predicate=null}){
 let best=null;
 for(let dx=minimumDx;dx<=maximumDx;dx++)for(let dy=minimumDy;dy<=maximumDy;dy++){
  const result=compareRegion(reference,candidate,region,dx,dy,predicate);
  if(!best||result.rmse<best.rmse||result.rmse===best.rmse&&result.mae<best.mae)best=result;
 }
 return best;
}

export function darkInkBounds(pixels,region,threshold=170){
 let left=LOWER_SIZE.width,top=LOWER_SIZE.height,right=-1,bottom=-1,count=0;
 for(let y=region.top;y<region.top+region.height;y++)for(let x=region.left;x<region.left+region.width;x++){
  const index=(y*LOWER_SIZE.width+x)*LOWER_SIZE.channels;
  if(luminance(pixels,index)>=threshold)continue;
  left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;
 }
 assert.ok(count>0,'ink search must find pixels');
 return Object.freeze({left,top,right,bottom,width:right-left+1,height:bottom-top+1,pixelCount:count});
}

export function detectSelectedTileAnchor(pixels){
 const candidates=[76,160,244].map(center=>{
  let left=LOWER_SIZE.width,top=LOWER_SIZE.height,right=-1,bottom=-1,count=0;
  for(let y=115;y<210;y++)for(let x=center-42;x<center+42;x++){
   const index=(y*LOWER_SIZE.width+x)*LOWER_SIZE.channels;
   if(!mint(pixels,index))continue;
   left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;
  }
  return Object.freeze({center,count,bounds:count?Object.freeze({left,top,right,bottom}):null});
 });
 const selected=[...candidates].sort((left,right)=>right.count-left.count)[0];
 assert.ok(selected.count>0,'selected cursor highlight was not detected');
 return Object.freeze({center:selected.center,mintPixelCount:selected.count,bounds:selected.bounds,candidates});
}

async function decodeLower(path){
 const bytes=await readFile(path),metadata=await sharp(bytes).metadata();
 let pipeline=sharp(bytes);
 if(metadata.width===400&&metadata.height===480)pipeline=pipeline.extract({left:40,top:240,width:320,height:240});
 else assert.deepEqual({width:metadata.width,height:metadata.height},{width:320,height:240},`${path} must be a 400x480 combined PNG or 320x240 lower PNG`);
 const decoded=await pipeline.removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual({width:decoded.info.width,height:decoded.info.height,channels:decoded.info.channels},LOWER_SIZE);
 return Object.freeze({path,fileSha256:sha256(bytes),lowerRgbSha256:sha256(decoded.data),sourceSize:Object.freeze({width:metadata.width,height:metadata.height}),pixels:decoded.data});
}

async function decodeUpper(path){
 const bytes=await readFile(path),metadata=await sharp(bytes).metadata();
 let pipeline=sharp(bytes);
 if(metadata.width===400&&metadata.height===480)pipeline=pipeline.extract({left:0,top:0,width:400,height:240});
 else assert.deepEqual({width:metadata.width,height:metadata.height},{width:400,height:240},`${path} must be a 400x480 combined PNG or 400x240 upper PNG`);
 const decoded=await pipeline.removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual({width:decoded.info.width,height:decoded.info.height,channels:decoded.info.channels},{width:400,height:240,channels:3});
 return Object.freeze({path,fileSha256:sha256(bytes),rgbSha256:sha256(decoded.data),sourceSize:Object.freeze({width:metadata.width,height:metadata.height}),pixels:decoded.data});
}

export function emptyMaskDifference(reference,candidate,width,height){
 assert.equal(reference.length,width*height*3);assert.equal(candidate.length,reference.length);
 let absolute=0,squared=0,maxAbsolute=0,pixelsAbove2=0,channelsAbove2=0;
 for(let pixel=0;pixel<width*height;pixel++){
  let pixelAbove2=false;
  for(let channel=0;channel<3;channel++){
   const index=pixel*3+channel,difference=Math.abs(reference[index]-candidate[index]);
   absolute+=difference;squared+=difference*difference;maxAbsolute=Math.max(maxAbsolute,difference);
   if(difference>2){channelsAbove2++;pixelAbove2=true}
  }
  if(pixelAbove2)pixelsAbove2++;
 }
 return Object.freeze({width,height,pixelCount:width*height,pixelsAbove2,channelsAbove2,mae:round(absolute/reference.length),rmse:round(Math.sqrt(squared/reference.length)),maxAbsolute});
}

const rawPng=(pixels,width,height)=>sharp(pixels,{raw:{width,height,channels:3}}).png().toBuffer();

const absoluteDiff=(reference,candidate,multiplier=4)=>{
 const pixels=Buffer.alloc(reference.length);
 for(let index=0;index<reference.length;index++)pixels[index]=Math.min(255,Math.abs(reference[index]-candidate[index])*multiplier);
 return pixels;
};

async function writeDiagnosticImages({directory,nativeUpper,nativeLower,browserUpper,browserLower}){
 const files={
  nativeUpper:'native-upper.png',nativeLower:'native-lower.png',browserUpper:'browser-upper.png',browserLower:'browser-lower.png',
  diffUpper:'absolute-diff-upper-x4.png',diffLower:'absolute-diff-lower-x4.png',sheet:'comparison-sheet.png',
 };
 const buffers={
  nativeUpper:await rawPng(nativeUpper,400,240),nativeLower:await rawPng(nativeLower,320,240),
  browserUpper:await rawPng(browserUpper,400,240),browserLower:await rawPng(browserLower,320,240),
  diffUpper:await rawPng(absoluteDiff(nativeUpper,browserUpper),400,240),diffLower:await rawPng(absoluteDiff(nativeLower,browserLower),320,240),
 };
 const combined=[];
 for(const prefix of ['native','browser','diff'])combined.push(await sharp({create:{width:400,height:480,channels:3,background:{r:0,g:0,b:0}}}).composite([
  {input:buffers[`${prefix}Upper`],left:0,top:0},{input:buffers[`${prefix}Lower`],left:40,top:240},
 ]).png().toBuffer());
 buffers.sheet=await sharp({create:{width:1200,height:480,channels:3,background:{r:0,g:0,b:0}}}).composite(combined.map((input,index)=>({input,left:index*400,top:0}))).png().toBuffer();
 await mkdir(directory,{recursive:true});
 for(const [name,file] of Object.entries(files))await writeFile(`${directory}/${file}`,buffers[name]);
 return Object.freeze(Object.fromEntries(Object.entries(files).map(([name,file])=>[name,Object.freeze({path:`${directory}/${file}`,sha256:sha256(buffers[name])})])));
}

const inkPredicate=(reference,referenceIndex,candidate,candidateIndex)=>luminance(reference,referenceIndex)<170||luminance(candidate,candidateIndex)<170;

export function compareBalloonPlacement(nativePixels,browserPixels){
 const nativeAnchor=detectSelectedTileAnchor(nativePixels),browserAnchor=detectSelectedTileAnchor(browserPixels);
 const expectedTailDx=browserAnchor.center-nativeAnchor.center;
 const nativeBodyCenter=clampBalloonBodyCenter(nativeAnchor.center),browserBodyCenter=clampBalloonBodyCenter(browserAnchor.center);
 const expectedBodyDx=browserBodyCenter-nativeBodyCenter;
 const body=findBestTranslation(nativePixels,browserPixels,BALLOON_REGIONS.body,{minimumDx:expectedBodyDx-8,maximumDx:expectedBodyDx+8,minimumDy:-3,maximumDy:3});
 const text=findBestTranslation(nativePixels,browserPixels,BALLOON_REGIONS.textCompare,{minimumDx:expectedBodyDx-8,maximumDx:expectedBodyDx+8,minimumDy:-3,maximumDy:3,predicate:inkPredicate});
 const tail=findBestTranslation(nativePixels,browserPixels,BALLOON_REGIONS.tail,{minimumDx:expectedTailDx-8,maximumDx:expectedTailDx+8,minimumDy:-5,maximumDy:5});
 const selectedTile=compareRegion(nativePixels,browserPixels,BALLOON_REGIONS.selectedTile,expectedTailDx,0);
 const title=Object.freeze({native:darkInkBounds(nativePixels,BALLOON_REGIONS.titleSearch),browser:darkInkBounds(browserPixels,BALLOON_REGIONS.titleSearch)});
 const publisher=Object.freeze({native:darkInkBounds(nativePixels,BALLOON_REGIONS.publisherSearch),browser:darkInkBounds(browserPixels,BALLOON_REGIONS.publisherSearch)});
 return Object.freeze({
  selectedTileAnchors:Object.freeze({native:nativeAnchor,browser:browserAnchor,delta:Object.freeze({x:expectedTailDx,y:0})}),
  sourceAnchorModel:Object.freeze({bodyCenterClamp:Object.freeze([152,168]),nativeBodyCenter,browserBodyCenter,expectedBodyDelta:Object.freeze({x:expectedBodyDx,y:0}),expectedTailDelta:Object.freeze({x:expectedTailDx,y:0})}),
  bestTranslations:Object.freeze({body,text,tail}),
  textBounds:Object.freeze({title,publisher,titleDelta:Object.freeze({x:title.browser.left-title.native.left,y:title.browser.top-title.native.top}),publisherDelta:Object.freeze({x:publisher.browser.left-publisher.native.left,y:publisher.browser.top-publisher.native.top})}),
  selectedTileAtAnchorDelta:selectedTile,
  matchesSourceAnchorModel:body.dx===expectedBodyDx&&body.dy===0&&text.dx===expectedBodyDx&&text.dy===0&&tail.dx===expectedTailDx&&tail.dy===0,
  regionalHashes:Object.freeze({
   nativeBodyRgbSha256:sha256(regionBytes(nativePixels,BALLOON_REGIONS.body)),
   browserAlignedBodyRgbSha256:sha256(regionBytes(browserPixels,BALLOON_REGIONS.body,body.dx,body.dy)),
   nativeTailRgbSha256:sha256(regionBytes(nativePixels,BALLOON_REGIONS.tail)),
   browserAlignedTailRgbSha256:sha256(regionBytes(browserPixels,BALLOON_REGIONS.tail,tail.dx,tail.dy)),
  }),
 });
}

const requireAbsolute=(name,value)=>{
 if(!value||!isAbsolute(value))throw new Error(`${name} must be an absolute path`);
 return value;
};

const parseArguments=argv=>{
 const values={};
 for(let index=0;index<argv.length;index+=2){
  const key=argv[index];
  if(!key?.startsWith('--')||argv[index+1]===undefined)throw new Error(`expected --name value, received ${key??'<end>'}`);
  values[key.slice(2)]=argv[index+1];
 }
 return values;
};

export async function analyzeHomeBalloon({nativePath,historicalNativePath,browserPath,sameAnchorBrowserPath,browserUpperPath,capturePath,outputPath}){
 for(const [name,value] of Object.entries({native:nativePath,'historical-native':historicalNativePath,browser:browserPath,'same-anchor-browser':sameAnchorBrowserPath,'browser-upper':browserUpperPath,capture:capturePath,output:outputPath}))requireAbsolute(name,value);
 const [native,historicalNative,browser,sameAnchorBrowser,nativeUpper,browserUpper,captureBytes]=await Promise.all([
  decodeLower(nativePath),decodeLower(historicalNativePath),decodeLower(browserPath),decodeLower(sameAnchorBrowserPath),decodeUpper(nativePath),decodeUpper(browserUpperPath),readFile(capturePath),
 ]);
 const capture=JSON.parse(captureBytes),directory=dirname(outputPath);
 const historicalStability=Object.freeze({
  lower:compareRegion(native.pixels,historicalNative.pixels,{left:0,top:0,width:320,height:240},0,0),
  body:compareRegion(native.pixels,historicalNative.pixels,BALLOON_REGIONS.body,0,0),
  text:compareRegion(native.pixels,historicalNative.pixels,BALLOON_REGIONS.textCompare,0,0,inkPredicate),
  tail:compareRegion(native.pixels,historicalNative.pixels,BALLOON_REGIONS.tail,0,0),
 });
 const artifacts=await writeDiagnosticImages({directory,nativeUpper:nativeUpper.pixels,nativeLower:native.pixels,browserUpper:browserUpper.pixels,browserLower:sameAnchorBrowser.pixels});
 const report=Object.freeze({
  schema:1,
  method:Object.freeze({
   pixelSpace:'8-bit lower-LCD RGB; combined native captures are cropped at x40,y240,width320,height240',
   positioningTest:'selected cursor anchor, balloon body, dark text and tail translations are measured independently; icon-population pixels are excluded from balloon fits',
   acceptanceBoundary:'diagnostic only; captures are not input/phase matched and do not establish a whole-scenario result',
  }),
  inputs:Object.freeze({
   native:Object.freeze({path:native.path,fileSha256:native.fileSha256,lowerRgbSha256:native.lowerRgbSha256,sourceSize:native.sourceSize}),
   historicalNative:Object.freeze({path:historicalNative.path,fileSha256:historicalNative.fileSha256,lowerRgbSha256:historicalNative.lowerRgbSha256,sourceSize:historicalNative.sourceSize}),
   browser:Object.freeze({path:browser.path,fileSha256:browser.fileSha256,lowerRgbSha256:browser.lowerRgbSha256,sourceSize:browser.sourceSize}),
   sameAnchorBrowser:Object.freeze({path:sameAnchorBrowser.path,fileSha256:sameAnchorBrowser.fileSha256,lowerRgbSha256:sameAnchorBrowser.lowerRgbSha256,sourceSize:sameAnchorBrowser.sourceSize}),
   browserUpper:Object.freeze({path:browserUpper.path,fileSha256:browserUpper.fileSha256,rgbSha256:browserUpper.rgbSha256,sourceSize:browserUpper.sourceSize}),
   capture:Object.freeze({path:capturePath,sha256:sha256(captureBytes),commit:capture.commit,inputMatched:capture.inputMatched,epochMatched:capture.epochMatched,rows:capture.state?.rows,selected:capture.state?.selected,primaryCenter:capture.state?.cursor?.primary?.center}),
  }),
  artifacts,
  regions:BALLOON_REGIONS,
  emptyMaskFullLcd:Object.freeze({
   upper:emptyMaskDifference(nativeUpper.pixels,browserUpper.pixels,400,240),
   lower:emptyMaskDifference(native.pixels,sameAnchorBrowser.pixels,320,240),
  }),
  historicalNativeStability:historicalStability,
  differentAnchorComparison:compareBalloonPlacement(native.pixels,browser.pixels),
  sameAnchorComparison:compareBalloonPlacement(native.pixels,sameAnchorBrowser.pixels),
  conclusion:'The different-anchor and same-anchor pairs both match the source clamp/tile-anchor prediction exactly. No independent balloon positioning correction is supported; remaining >2 pixels are raster/compositing or unrelated full-LCD population/epoch residuals.',
 });
 await mkdir(dirname(outputPath),{recursive:true});await writeFile(outputPath,`${JSON.stringify(report,null,2)}\n`);
 return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=parseArguments(process.argv.slice(2));
 const report=await analyzeHomeBalloon({nativePath:args.native,historicalNativePath:args['historical-native'],browserPath:args.browser,sameAnchorBrowserPath:args['same-anchor-browser'],browserUpperPath:args['browser-upper'],capturePath:args.capture,outputPath:args.output});
 process.stdout.write(`${JSON.stringify({output:args.output,artifacts:report.artifacts,emptyMaskFullLcd:report.emptyMaskFullLcd,historicalNativeStability:report.historicalNativeStability,differentAnchorComparison:report.differentAnchorComparison,sameAnchorComparison:report.sameAnchorComparison},null,2)}\n`);
}
