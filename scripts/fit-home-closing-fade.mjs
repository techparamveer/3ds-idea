import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,isAbsolute,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';

export const CAPTURE_SIZE=Object.freeze({width:400,height:480,channels:3});
export const CLOSING_FADE_REGIONS=Object.freeze({
 lowerLcd:Object.freeze({include:Object.freeze([{left:40,top:240,width:320,height:240}])}),
 maskTop4:Object.freeze({include:Object.freeze([{left:40,top:240,width:320,height:4}])}),
 maskCorners4:Object.freeze({include:Object.freeze([
  {left:40,top:244,width:4,height:210},
  {left:356,top:244,width:4,height:210},
 ])}),
 dialogMainWithoutFooter:Object.freeze({include:Object.freeze([{left:60,top:260,width:280,height:194}])}),
 textSearch:Object.freeze({include:Object.freeze([{left:105,top:345,width:190,height:35}])}),
 surfaceSearch:Object.freeze({include:Object.freeze([{left:80,top:280,width:240,height:65}])}),
});

const round=(value,digits=6)=>Number(value.toFixed(digits));
const inside=(x,y,rect)=>x>=rect.left&&x<rect.left+rect.width&&y>=rect.top&&y<rect.top+rect.height;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export function regionPixelOffsets(region,width=CAPTURE_SIZE.width,height=CAPTURE_SIZE.height){
 const offsets=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(region.include.some(rect=>inside(x,y,rect)))offsets.push((y*width+x)*CAPTURE_SIZE.channels);
 }
 return offsets;
}

export function differenceMetrics(left,right,pixelOffsets){
 assert.equal(left.length,right.length);
 let absolute=0,squared=0,maxAbsolute=0;
 for(const offset of pixelOffsets)for(let channel=0;channel<CAPTURE_SIZE.channels;channel++){
  const error=Math.abs(left[offset+channel]-right[offset+channel]);
  absolute+=error;squared+=error*error;maxAbsolute=Math.max(maxAbsolute,error);
 }
 const samples=pixelOffsets.length*CAPTURE_SIZE.channels;
 return Object.freeze({mae:round(absolute/samples),rmse:round(Math.sqrt(squared/samples)),maxAbsolute:round(maxAbsolute)});
}

export function fitEndpointFraction(current,start,end,pixelOffsets){
 assert.equal(current.length,start.length);assert.equal(start.length,end.length);
 let numerator=0,denominator=0;
 for(const offset of pixelOffsets)for(let channel=0;channel<CAPTURE_SIZE.channels;channel++){
  const delta=end[offset+channel]-start[offset+channel];
  numerator+=delta*(current[offset+channel]-start[offset+channel]);denominator+=delta*delta;
 }
 assert.ok(denominator>0,'endpoint region must contain a non-zero pixel difference');
 const rawFraction=numerator/denominator,clippedFraction=Math.max(0,Math.min(1,rawFraction));
 let absolute=0,squared=0,maxAbsolute=0;
 for(const offset of pixelOffsets)for(let channel=0;channel<CAPTURE_SIZE.channels;channel++){
  const predicted=start[offset+channel]+clippedFraction*(end[offset+channel]-start[offset+channel]);
  const error=Math.abs(current[offset+channel]-predicted);
  absolute+=error;squared+=error*error;maxAbsolute=Math.max(maxAbsolute,error);
 }
 const samples=pixelOffsets.length*CAPTURE_SIZE.channels;
 return Object.freeze({
  rawFraction:round(rawFraction),clippedFraction:round(clippedFraction),pixelCount:pixelOffsets.length,
  residual:Object.freeze({mae:round(absolute/samples),rmse:round(Math.sqrt(squared/samples)),maxAbsolute:round(maxAbsolute)}),
 });
}

const luminanceAt=(pixels,offset)=>.2126*pixels[offset]+.7152*pixels[offset+1]+.0722*pixels[offset+2];

export function meanLuminance(pixels,pixelOffsets){
 return round(pixelOffsets.reduce((sum,offset)=>sum+luminanceAt(pixels,offset),0)/pixelOffsets.length);
}

export function selectEndpointPixels(start,end,searchOffsets,predicate){
 return searchOffsets.filter(offset=>predicate({start:luminanceAt(start,offset),end:luminanceAt(end,offset)}));
}

const quantile=(sorted,fraction)=>{
 if(sorted.length===0)return null;
 const position=(sorted.length-1)*fraction,lower=Math.floor(position),upper=Math.ceil(position);
 return round(sorted[lower]+(sorted[upper]-sorted[lower])*(position-lower));
};

export function perPixelLuminanceRatios(current,start,end,pixelOffsets){
 const ratios=[];
 for(const offset of pixelOffsets){
  const denominator=luminanceAt(end,offset)-luminanceAt(start,offset);
  if(Math.abs(denominator)>.000001)ratios.push((luminanceAt(current,offset)-luminanceAt(start,offset))/denominator);
 }
 ratios.sort((a,b)=>a-b);
 return Object.freeze({count:ratios.length,p10:quantile(ratios,.1),median:quantile(ratios,.5),p90:quantile(ratios,.9)});
}

export function boundaryStrength(current,underlay,{orientation,coordinate,start,end}){
 let sum=0,count=0;
 if(orientation==='vertical'){
  for(let y=start;y<end;y++){
   const a=(y*CAPTURE_SIZE.width+coordinate)*CAPTURE_SIZE.channels,b=a+CAPTURE_SIZE.channels;
   sum+=Math.abs((luminanceAt(current,b)-luminanceAt(current,a))-(luminanceAt(underlay,b)-luminanceAt(underlay,a)));count++;
  }
 }else if(orientation==='horizontal'){
  for(let x=start;x<end;x++){
   const a=(coordinate*CAPTURE_SIZE.width+x)*CAPTURE_SIZE.channels,b=a+CAPTURE_SIZE.width*CAPTURE_SIZE.channels;
   sum+=Math.abs((luminanceAt(current,b)-luminanceAt(current,a))-(luminanceAt(underlay,b)-luminanceAt(underlay,a)));count++;
  }
 }else throw new Error(`unsupported orientation ${orientation}`);
 return round(sum/count);
}

export function sampleHermite(keys,frame){
 assert.ok(keys.length>=1,'track must contain a key');
 const ordered=[...keys].sort((a,b)=>a.frame-b.frame);
 if(frame<=ordered[0].frame)return ordered[0].value;
 for(let index=0;index<ordered.length-1;index++){
  const left=ordered[index],right=ordered[index+1];
  if(frame>right.frame)continue;
  const span=right.frame-left.frame;
  if(span===0)return right.value;
  const t=(frame-left.frame)/span,t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*left.value+(t3-2*t2+t)*span*left.slope+(-2*t3+3*t2)*right.value+(t3-t2)*span*right.slope;
 }
 return ordered.at(-1).value;
}

export function compareAlphaCandidate(animation,observedRetainedFraction){
 const track=animation.tracks.find(candidate=>candidate.target==='P_Bg_00'&&candidate.property==='alpha');
 assert.ok(track,'mask animation must contain the P_Bg_00 alpha track');
 const start=sampleHermite(track.keys,0);
 const samples=Array.from({length:animation.frames},(_,frame)=>{
  const alpha=sampleHermite(track.keys,frame),retainedFraction=alpha/start;
  return Object.freeze({frame,alpha:round(alpha),retainedFraction:round(retainedFraction),absoluteError:round(Math.abs(retainedFraction-observedRetainedFraction))});
 });
 const minimum=Math.min(...samples.map(sample=>sample.absoluteError));
 return Object.freeze({frames:animation.frames,sourceFrameRange:animation.sourceFrameRange,samples,nearest:samples.filter(sample=>sample.absoluteError===minimum)});
}

async function decodePng(path){
 const bytes=await readFile(path),digest=sha256(bytes);
 const decoded=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual({width:decoded.info.width,height:decoded.info.height,channels:decoded.info.channels},CAPTURE_SIZE,`${path} must be a 400x480 RGB-compatible PNG`);
 return Object.freeze({path,sha256:digest,pixels:decoded.data});
}

const cropHash=(pixels,pixelOffsets)=>{
 const bytes=Buffer.alloc(pixelOffsets.length*CAPTURE_SIZE.channels);
 pixelOffsets.forEach((offset,index)=>pixels.copy(bytes,index*CAPTURE_SIZE.channels,offset,offset+CAPTURE_SIZE.channels));
 return sha256(bytes);
};

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

export async function analyzeHomeClosingFade({sequencePath,historicalSequencePath,gapSequencePath,dialogPackPath,maskPackPath,outputPath,settledIndex=2,intermediateIndex=3,underlayIndex=4,gapAfterIndex=64}){
 for(const [name,value] of Object.entries({sequence:sequencePath,'historical-sequence':historicalSequencePath,'dialog-pack':dialogPackPath,'mask-pack':maskPackPath,output:outputPath}))requireAbsolute(name,value);
 if(gapSequencePath)requireAbsolute('gap-sequence',gapSequencePath);
 const [sequenceBytes,historicalBytes,dialogBytes,maskBytes]=await Promise.all([readFile(sequencePath),readFile(historicalSequencePath),readFile(dialogPackPath),readFile(maskPackPath)]);
 const sequence=JSON.parse(sequenceBytes),historical=JSON.parse(historicalBytes),dialogPack=JSON.parse(dialogBytes),maskPack=JSON.parse(maskBytes);
 assert.ok(Array.isArray(sequence.files)&&sequence.files.length>underlayIndex,'fresh sequence lacks selected captures');
 assert.ok(Array.isArray(historical.records),'historical sequence lacks records');
 const fresh=[];
 for(const [index,record] of sequence.files.entries()){
  requireAbsolute(`fresh capture ${index}`,record.path);
  const image=await decodePng(record.path);assert.equal(image.sha256,record.sha256,`fresh capture ${index} hash mismatch`);fresh.push(image);
 }
 const historicalImages=[];
 for(const [index,record] of historical.records.entries()){
  const image=await decodePng(join(dirname(historicalSequencePath),record.file));assert.equal(image.sha256,record.sha256,`historical capture ${index} hash mismatch`);historicalImages.push(image);
 }
 let gapSequence=null,gapSequenceBytes=null,gapImages=[];
 if(gapSequencePath){
  gapSequenceBytes=await readFile(gapSequencePath);gapSequence=JSON.parse(gapSequenceBytes);
  assert.ok(Array.isArray(gapSequence.files)&&gapSequence.files.length>gapAfterIndex+1,'gap sequence lacks selected boundary captures');
  for(const [index,record] of gapSequence.files.entries()){
   requireAbsolute(`gap capture ${index}`,record.path);
   const image=await decodePng(record.path);assert.equal(image.sha256,record.sha256,`gap capture ${index} hash mismatch`);gapImages.push(image);
  }
 }
 const regions=Object.fromEntries(Object.entries(CLOSING_FADE_REGIONS).map(([name,region])=>[name,regionPixelOffsets(region)]));
 const settled=fresh[settledIndex].pixels,intermediate=fresh[intermediateIndex].pixels,underlay=fresh[underlayIndex].pixels;
 const textPixels=selectEndpointPixels(underlay,settled,regions.textSearch,({start,end})=>end<100&&start>150&&start-end>50);
 const surfacePixels=selectEndpointPixels(underlay,settled,regions.surfaceSearch,({start,end})=>start>235&&end>=225&&end<=240&&Math.abs(start-end)>4);
 const endpointFits=Object.freeze({
  maskTop4:fitEndpointFraction(intermediate,underlay,settled,regions.maskTop4),
  maskCorners4:fitEndpointFraction(intermediate,underlay,settled,regions.maskCorners4),
  dialogMainWithoutFooter:fitEndpointFraction(intermediate,underlay,settled,regions.dialogMainWithoutFooter),
  textInk:Object.freeze({...fitEndpointFraction(intermediate,underlay,settled,textPixels),ratioQuantiles:perPixelLuminanceRatios(intermediate,underlay,settled,textPixels)}),
  brightSurface:Object.freeze({...fitEndpointFraction(intermediate,underlay,settled,surfacePixels),ratioQuantiles:perPixelLuminanceRatios(intermediate,underlay,settled,surfacePixels)}),
 });
 const edgeDefinitions=Object.freeze({
  left:Object.freeze({orientation:'vertical',coordinate:59,start:280,end:340,boundary:59.5}),
  right:Object.freeze({orientation:'vertical',coordinate:339,start:280,end:340,boundary:339.5}),
  top:Object.freeze({orientation:'horizontal',coordinate:259,start:80,end:320,boundary:259.5}),
 });
 const fixedBoundaryEvidence=Object.freeze(Object.fromEntries(Object.entries(edgeDefinitions).map(([name,definition])=>{
  const settledStrength=boundaryStrength(settled,underlay,definition),intermediateStrength=boundaryStrength(intermediate,underlay,definition);
  return [name,Object.freeze({...definition,settledStrength,intermediateStrength,normalizedIntermediate:round(intermediateStrength/settledStrength)})];
 })));
 const historicalLower=historicalImages.map((image,index)=>Object.freeze({index,file:historical.records[index].file,sha256:image.sha256,lowerCropSha256:cropHash(image.pixels,regions.lowerLcd)}));
 let identicalSuffixStart=historicalLower.length-1;
 while(identicalSuffixStart>0&&historicalLower[identicalSuffixStart-1].lowerCropSha256===historicalLower.at(-1).lowerCropSha256)identicalSuffixStart--;
 const historicalConsecutive=historicalImages.slice(1).map((image,index)=>Object.freeze({from:index,to:index+1,...differenceMetrics(historicalImages[index].pixels,image.pixels,regions.lowerLcd)}));
 const maskLayout=maskPack.layouts.DlgMask_D_00,maskPane=maskLayout.roots[0].children.find(pane=>pane.name==='P_Bg_00');
 assert.ok(maskPane,'DlgMask_D_00 P_Bg_00 missing');
 const maskCandidates=Object.freeze(Object.fromEntries(['DlgMask_D_00_FadeOut00','DlgMask_D_00_FadeOut01'].map(name=>[
  name,Object.freeze({source:maskPack.resourceSources.animations[name],...compareAlphaCandidate(maskPack.animations[name],endpointFits.maskTop4.rawFraction)}),
 ])));
 const dialogOwnAnimations=Object.keys(dialogPack.animations).filter(name=>name.startsWith('Dlg_A_D_00_'));
 const gapAudit=gapSequence?Object.freeze({
  sequence:Object.freeze({path:gapSequencePath,sha256:sha256(gapSequenceBytes),speedPercent:gapSequence.speed,inputMatched:gapSequence.inputMatched,phaseMatched:gapSequence.phaseMatched,count:gapSequence.files.length,notes:gapSequence.notes}),
  lastBeforeGap:Object.freeze({index:gapAfterIndex,path:gapImages[gapAfterIndex].path,sha256:gapImages[gapAfterIndex].sha256,againstSettled:Object.freeze({
   lowerLcd:differenceMetrics(gapImages[gapAfterIndex].pixels,settled,regions.lowerLcd),
   maskTop4:differenceMetrics(gapImages[gapAfterIndex].pixels,settled,regions.maskTop4),
   dialogMainWithoutFooter:differenceMetrics(gapImages[gapAfterIndex].pixels,settled,regions.dialogMainWithoutFooter),
  })}),
  firstAfterGap:Object.freeze({index:gapAfterIndex+1,path:gapImages[gapAfterIndex+1].path,sha256:gapImages[gapAfterIndex+1].sha256,againstUnderlay:Object.freeze({
   lowerLcd:differenceMetrics(gapImages[gapAfterIndex+1].pixels,underlay,regions.lowerLcd),
   maskTop4:differenceMetrics(gapImages[gapAfterIndex+1].pixels,underlay,regions.maskTop4),
   dialogMainWithoutFooter:differenceMetrics(gapImages[gapAfterIndex+1].pixels,underlay,regions.dialogMainWithoutFooter),
  })}),
  conclusion:'The actual exit falls inside an explicit observation gap. The adjacent files bound the state change but supply no exit intermediate and no timing evidence.',
 }):null;
 const report=Object.freeze({
  schema:1,
  method:Object.freeze({
   pixelSpace:'8-bit PNG RGB channel values',
   endpointProjection:'least-squares projection from ordinary-HOME underlay (0) to settled closing presentation (1); projections are composited-pixel summaries, not pane alpha',
   timingBoundary:'capture-list order only; filenames, mtimes and emulator speed are not native-frame or duration evidence',
  }),
  inputs:Object.freeze({
   freshSequence:Object.freeze({path:sequencePath,sha256:sha256(sequenceBytes),speedPercent:sequence.speed,inputMatched:sequence.inputMatched,phaseMatched:sequence.phaseMatched,count:sequence.files.length}),
   historicalSequence:Object.freeze({path:historicalSequencePath,sha256:sha256(historicalBytes),speedPercent:historical.speedPercent,matchedBrowserEpoch:historical.matchedBrowserEpoch,count:historical.records.length}),
   gapSequence:gapAudit?.sequence??null,
   dialogPack:Object.freeze({path:dialogPackPath,sha256:sha256(dialogBytes),sourceSha256:dialogPack.sourceSha256,titleId:dialogPack.titleId}),
   maskPack:Object.freeze({path:maskPackPath,sha256:sha256(maskBytes),sourceSha256:maskPack.sourceSha256,titleId:maskPack.titleId}),
   selected:Object.freeze({settled:{index:settledIndex,path:fresh[settledIndex].path,sha256:fresh[settledIndex].sha256},intermediate:{index:intermediateIndex,path:fresh[intermediateIndex].path,sha256:fresh[intermediateIndex].sha256},underlay:{index:underlayIndex,path:fresh[underlayIndex].path,sha256:fresh[underlayIndex].sha256}}),
  }),
  regions:Object.freeze(Object.fromEntries(Object.entries(CLOSING_FADE_REGIONS).map(([name,region])=>[name,Object.freeze({...region,pixelCount:regions[name].length})]))),
  measurements:Object.freeze({
   endpointFits,
   maskProbe:Object.freeze({
    settledMeanLuminance:meanLuminance(settled,regions.maskTop4),
    intermediateMeanLuminance:meanLuminance(intermediate,regions.maskTop4),
    underlayMeanLuminance:meanLuminance(underlay,regions.maskTop4),
    settledToUnderlayLuminanceRatio:round(meanLuminance(settled,regions.maskTop4)/meanLuminance(underlay,regions.maskTop4)),
   }),
   underlayStability:Object.freeze({top4:differenceMetrics(intermediate,underlay,regions.maskTop4),corners4:differenceMetrics(intermediate,underlay,regions.maskCorners4)}),
   selectedPixelCounts:Object.freeze({textInk:textPixels.length,brightSurface:surfacePixels.length}),
   fixedBoundaryEvidence,
  }),
  historicalAudit:Object.freeze({
   captures:historicalLower,
   consecutiveLowerDifferences:historicalConsecutive,
   byteIdenticalTerminalSuffix:Object.freeze({startIndex:identicalSuffixStart,endIndex:historicalLower.length-1,count:historicalLower.length-identicalSuffixStart,lowerCropSha256:historicalLower.at(-1).lowerCropSha256}),
   conclusion:'The historical sequence reaches and holds the settled closing presentation; it contains no lower fade-out sample.',
  }),
  gapSequenceAudit:gapAudit,
  sourceCandidates:Object.freeze({
   maskLayout:Object.freeze({source:maskPack.resourceSources.layouts.DlgMask_D_00,size:maskPane.size,baseAlpha:maskPane.alpha}),
   maskFadeOut:maskCandidates,
   dialogLayout:Object.freeze({source:dialogPack.resourceSources.layouts.Dlg_A_D_00,ownAnimations:dialogOwnAnimations}),
  }),
  conclusions:Object.freeze({
   mask:'The strict top probe is byte-identical to the ordinary-HOME underlay at the sole intermediate, so the full-screen lower mask is already terminal there. Corner noise does not change that conclusion.',
   dialog:'Text and fixed window boundaries are near gone while bright gray surface pixels retain a much larger endpoint projection. One parent-alpha blend is contradicted as a literal pixel model; projections cannot be assigned directly to pane alpha because mask and underlay change concurrently.',
   geometry:'Expected settled boundaries are no longer dominant in the sole intermediate. The capture neither evidences scale nor supports localization of a moved edge; fixed-versus-scale remains unresolved for dialog exit.',
   source:'Both delivered DlgMask_D_00 fade-out tracks reach alpha zero at sample 15 and fit the terminal mask observation, but one terminal capture cannot select a route or native epoch. Dlg_A_D_00 has no delivered animation, so there is no source-backed dialog-parent fade curve in this pack.',
  }),
 });
 await mkdir(dirname(outputPath),{recursive:true});await writeFile(outputPath,`${JSON.stringify(report,null,2)}\n`);
 return report;
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=parseArguments(process.argv.slice(2));
  const report=await analyzeHomeClosingFade({
  sequencePath:args.sequence,historicalSequencePath:args['historical-sequence'],gapSequencePath:args['gap-sequence'],dialogPackPath:args['dialog-pack'],maskPackPath:args['mask-pack'],outputPath:args.output,
  settledIndex:Number(args['settled-index']??2),intermediateIndex:Number(args['intermediate-index']??3),underlayIndex:Number(args['underlay-index']??4),
  gapAfterIndex:Number(args['gap-after-index']??64),
 });
 process.stdout.write(`${JSON.stringify({output:args.output,measurements:report.measurements,conclusions:report.conclusions},null,2)}\n`);
}
