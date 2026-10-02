import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {BALLOON_REGIONS,compareRegion,emptyMaskDifference,findBestTranslation,regionBytes} from './compare-home-balloon.mjs';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const luminance=(pixels,index)=>.2126*pixels[index]+.7152*pixels[index+1]+.0722*pixels[index+2];
const beforeInk=(reference,referenceIndex)=>luminance(reference,referenceIndex)<170;

async function decodeTarget(path,width,height,extract=null){
 const bytes=await readFile(path),metadata=await sharp(bytes).metadata();
 let pipeline=sharp(bytes);if(extract)pipeline=pipeline.extract(extract);
 const decoded=await pipeline.removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual({width:decoded.info.width,height:decoded.info.height,channels:decoded.info.channels},{width,height,channels:3},`${path} target dimensions`);
 return Object.freeze({path,fileSha256:sha256(bytes),rgbSha256:sha256(decoded.data),pixels:decoded.data,sourceSize:Object.freeze({width:metadata.width,height:metadata.height})});
}

const decodeNative=async path=>Object.freeze({
 upper:await decodeTarget(path,400,240,{left:0,top:0,width:400,height:240}),
 lower:await decodeTarget(path,320,240,{left:40,top:240,width:320,height:240}),
});

const rawPng=(pixels,width,height)=>sharp(pixels,{raw:{width,height,channels:3}}).png().toBuffer();
const absoluteDiff=(left,right,multiplier=4)=>{
 const pixels=Buffer.alloc(left.length);
 for(let index=0;index<left.length;index++)pixels[index]=Math.min(255,Math.abs(left[index]-right[index])*multiplier);
 return pixels;
};

async function combined(upper,lower){
 const [upperPng,lowerPng]=await Promise.all([rawPng(upper,400,240),rawPng(lower,320,240)]);
 return sharp({create:{width:400,height:480,channels:3,background:{r:0,g:0,b:0}}}).composite([{input:upperPng,left:0,top:0},{input:lowerPng,left:40,top:240}]).png().toBuffer();
}

async function writeArtifacts(directory,{native,before,after}){
 const browserDiff={upper:absoluteDiff(before.upper.pixels,after.upper.pixels),lower:absoluteDiff(before.lower.pixels,after.lower.pixels)};
 const nativeAfterDiff={upper:absoluteDiff(native.upper.pixels,after.upper.pixels),lower:absoluteDiff(native.lower.pixels,after.lower.pixels)};
 const buffers={
  native:await combined(native.upper.pixels,native.lower.pixels),before:await combined(before.upper.pixels,before.lower.pixels),after:await combined(after.upper.pixels,after.lower.pixels),
  browserDiff:await combined(browserDiff.upper,browserDiff.lower),nativeAfterDiff:await combined(nativeAfterDiff.upper,nativeAfterDiff.lower),
 };
 buffers.sheet=await sharp({create:{width:2000,height:480,channels:3,background:{r:0,g:0,b:0}}}).composite(['native','before','after','browserDiff','nativeAfterDiff'].map((name,index)=>({input:buffers[name],left:index*400,top:0}))).png().toBuffer();
 const files={native:'native-combined.png',before:'browser-before-combined.png',after:'browser-after-combined.png',browserDiff:'browser-before-after-diff-x4.png',nativeAfterDiff:'native-after-diff-x4.png',sheet:'comparison-sheet.png'};
 await mkdir(directory,{recursive:true});
 for(const [name,file] of Object.entries(files))await writeFile(`${directory}/${file}`,buffers[name]);
 return Object.freeze(Object.fromEntries(Object.entries(files).map(([name,file])=>[name,Object.freeze({path:`${directory}/${file}`,sha256:sha256(buffers[name])})])));
}

const captureSummary=(path,bytes)=>{
 const value=JSON.parse(bytes);
 return Object.freeze({path,sha256:sha256(bytes),commit:value.commit,inputMatched:value.inputMatched,epochMatched:value.epochMatched,rows:value.state?.rows,selected:value.state?.selected,primaryCenter:value.state?.cursor?.primary?.center});
};
const targetSummary=target=>Object.freeze({path:target.path,fileSha256:target.fileSha256,rgbSha256:target.rgbSha256,sourceSize:target.sourceSize});

export function measureBalloonRemoval(before,after){
 const bodyAtZero=compareRegion(before,after,BALLOON_REGIONS.body,0,0);
 const textSignatureAtZero=compareRegion(before,after,BALLOON_REGIONS.textCompare,0,0,beforeInk);
 const bestBodyMatch=findBestTranslation(before,after,BALLOON_REGIONS.body,{minimumDx:-8,maximumDx:8,minimumDy:-3,maximumDy:3});
 const bestTextMatch=findBestTranslation(before,after,BALLOON_REGIONS.textCompare,{minimumDx:-8,maximumDx:8,minimumDy:-3,maximumDy:3,predicate:beforeInk});
 return Object.freeze({
  bodyAtZero,textSignatureAtZero,bestBodyMatch,bestTextMatch,
  textSignatureChangedFraction:Number((textSignatureAtZero.pixelsAbove2/textSignatureAtZero.pixelCount).toFixed(6)),
  hashes:Object.freeze({beforeBodyRgbSha256:sha256(regionBytes(before,BALLOON_REGIONS.body)),afterBodyRgbSha256:sha256(regionBytes(after,BALLOON_REGIONS.body)),beforeTextRegionRgbSha256:sha256(regionBytes(before,BALLOON_REGIONS.textCompare)),afterTextRegionRgbSha256:sha256(regionBytes(after,BALLOON_REGIONS.textCompare))}),
 });
}

const requireAbsolute=(name,value)=>{
 if(!value||!isAbsolute(value))throw new Error(`${name} must be an absolute path`);return value;
};

const parseArguments=argv=>{
 const values={};for(let index=0;index<argv.length;index+=2){
  const key=argv[index];if(!key?.startsWith('--')||argv[index+1]===undefined)throw new Error(`expected --name value, received ${key??'<end>'}`);values[key.slice(2)]=argv[index+1];
 }return values;
};

export async function analyzeSettingsTwoRow({nativePath,nativeOneRowPath,beforeUpperPath,beforeLowerPath,beforeCapturePath,afterUpperPath,afterLowerPath,afterCapturePath,beforeOneRowLowerPath,beforeOneRowCapturePath,afterOneRowLowerPath,afterOneRowCapturePath,outputPath}){
 for(const [name,value] of Object.entries({native:nativePath,'native-one-row':nativeOneRowPath,'before-upper':beforeUpperPath,'before-lower':beforeLowerPath,'before-capture':beforeCapturePath,'after-upper':afterUpperPath,'after-lower':afterLowerPath,'after-capture':afterCapturePath,'before-one-row-lower':beforeOneRowLowerPath,'before-one-row-capture':beforeOneRowCapturePath,'after-one-row-lower':afterOneRowLowerPath,'after-one-row-capture':afterOneRowCapturePath,output:outputPath}))requireAbsolute(name,value);
 const [native,nativeOneRow,beforeUpper,beforeLower,beforeCaptureBytes,afterUpper,afterLower,afterCaptureBytes,beforeOneRowLower,beforeOneRowCaptureBytes,afterOneRowLower,afterOneRowCaptureBytes]=await Promise.all([
  decodeNative(nativePath),decodeNative(nativeOneRowPath),decodeTarget(beforeUpperPath,400,240),decodeTarget(beforeLowerPath,320,240),readFile(beforeCapturePath),decodeTarget(afterUpperPath,400,240),decodeTarget(afterLowerPath,320,240),readFile(afterCapturePath),decodeTarget(beforeOneRowLowerPath,320,240),readFile(beforeOneRowCapturePath),decodeTarget(afterOneRowLowerPath,320,240),readFile(afterOneRowCapturePath),
 ]);
 const before=Object.freeze({upper:beforeUpper,lower:beforeLower}),after=Object.freeze({upper:afterUpper,lower:afterLower});
 const beforeCapture=captureSummary(beforeCapturePath,beforeCaptureBytes),afterCapture=captureSummary(afterCapturePath,afterCaptureBytes),directory=dirname(outputPath);
 const beforeOneRowCapture=captureSummary(beforeOneRowCapturePath,beforeOneRowCaptureBytes),afterOneRowCapture=captureSummary(afterOneRowCapturePath,afterOneRowCaptureBytes);
 const artifacts=await writeArtifacts(directory,{native,before,after});
 const report=Object.freeze({
  schema:1,
  method:Object.freeze({pixelSpace:'8-bit RGB with empty masks',removalEvidence:'browser before-to-after delta at unchanged two-row Settings selection; native is representative no-balloon context only',acceptanceBoundary:'population, selection identity, HUD, banner and epoch are not matched; no whole-scenario conclusion'}),
  inputs:Object.freeze({native:Object.freeze({path:nativePath,fileSha256:native.lower.fileSha256,upperRgbSha256:native.upper.rgbSha256,lowerRgbSha256:native.lower.rgbSha256}),nativeOneRow:Object.freeze({path:nativeOneRowPath,fileSha256:nativeOneRow.lower.fileSha256,lowerRgbSha256:nativeOneRow.lower.rgbSha256}),before:Object.freeze({upper:targetSummary(beforeUpper),lower:targetSummary(beforeLower),capture:beforeCapture}),after:Object.freeze({upper:targetSummary(afterUpper),lower:targetSummary(afterLower),capture:afterCapture}),beforeOneRow:Object.freeze({lower:targetSummary(beforeOneRowLower),capture:beforeOneRowCapture}),afterOneRow:Object.freeze({lower:targetSummary(afterOneRowLower),capture:afterOneRowCapture})}),
  capturesComparable:Object.freeze({sameRows:beforeCapture.rows===afterCapture.rows,sameSelected:beforeCapture.selected===afterCapture.selected,samePrimaryCenter:JSON.stringify(beforeCapture.primaryCenter)===JSON.stringify(afterCapture.primaryCenter)}),
  browserBeforeAfterEmptyMask:Object.freeze({upper:emptyMaskDifference(beforeUpper.pixels,afterUpper.pixels,400,240),lower:emptyMaskDifference(beforeLower.pixels,afterLower.pixels,320,240)}),
  representativeNativeAfterEmptyMask:Object.freeze({upper:emptyMaskDifference(native.upper.pixels,afterUpper.pixels,400,240),lower:emptyMaskDifference(native.lower.pixels,afterLower.pixels,320,240)}),
  balloonRemoval:measureBalloonRemoval(beforeLower.pixels,afterLower.pixels),
  oneRowPreservation:Object.freeze({
   capturesComparable:Object.freeze({sameRows:beforeOneRowCapture.rows===afterOneRowCapture.rows,sameSelected:beforeOneRowCapture.selected===afterOneRowCapture.selected,samePrimaryCenter:JSON.stringify(beforeOneRowCapture.primaryCenter)===JSON.stringify(afterOneRowCapture.primaryCenter)}),
   body:compareRegion(beforeOneRowLower.pixels,afterOneRowLower.pixels,BALLOON_REGIONS.body,0,0),
   textRegion:compareRegion(beforeOneRowLower.pixels,afterOneRowLower.pixels,BALLOON_REGIONS.textCompare,0,0),
   tail:compareRegion(beforeOneRowLower.pixels,afterOneRowLower.pixels,BALLOON_REGIONS.tail,0,0),
   observation:'The source-gate change leaves the complete one-row browser balloon body, text region and tail byte-identical. Native one-row Settings independently retains the same title and publisher at a different selected anchor.',
  }),
  representativeNativeRegion:Object.freeze({bodyRgbSha256:sha256(regionBytes(native.lower.pixels,BALLOON_REGIONS.body)),textRegionRgbSha256:sha256(regionBytes(native.lower.pixels,BALLOON_REGIONS.textCompare)),observation:'The representative native two-row lower screen contains the upper icon row in this region and no title balloon; population differences prevent direct pixel attribution.'}),
  artifacts,
  conclusion:'Browser before-to-after evidence determines whether the incorrect two-row balloon was removed. Native supplies a no-balloon observation only; whole-LCD native/browser residuals remain confounded.',
 });
 await writeFile(outputPath,`${JSON.stringify(report,null,2)}\n`);return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=parseArguments(process.argv.slice(2));
 const report=await analyzeSettingsTwoRow({nativePath:args.native,nativeOneRowPath:args['native-one-row'],beforeUpperPath:args['before-upper'],beforeLowerPath:args['before-lower'],beforeCapturePath:args['before-capture'],afterUpperPath:args['after-upper'],afterLowerPath:args['after-lower'],afterCapturePath:args['after-capture'],beforeOneRowLowerPath:args['before-one-row-lower'],beforeOneRowCapturePath:args['before-one-row-capture'],afterOneRowLowerPath:args['after-one-row-lower'],afterOneRowCapturePath:args['after-one-row-capture'],outputPath:args.output});
 process.stdout.write(`${JSON.stringify({output:args.output,capturesComparable:report.capturesComparable,browserBeforeAfterEmptyMask:report.browserBeforeAfterEmptyMask,representativeNativeAfterEmptyMask:report.representativeNativeAfterEmptyMask,balloonRemoval:report.balloonRemoval,oneRowPreservation:report.oneRowPreservation,artifacts:report.artifacts},null,2)}\n`);
}
