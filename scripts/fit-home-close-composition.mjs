import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,isAbsolute,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';

export const CAPTURE_SIZE=Object.freeze({width:400,height:480,channels:3});
export const HOME_CLOSE_REGIONS=Object.freeze({
 upperAppExposed:Object.freeze({
 include:Object.freeze([{left:24,top:52,width:352,height:158}]),
  exclude:Object.freeze([{left:52,top:52,width:296,height:132}]),
 }),
 upperPanelChrome:Object.freeze({
  include:Object.freeze([
   {left:52,top:52,width:296,height:20},
   {left:52,top:164,width:296,height:20},
  ]),
  exclude:Object.freeze([]),
 }),
 upperPanelCenter:Object.freeze({
  include:Object.freeze([{left:52,top:72,width:296,height:92}]),
  exclude:Object.freeze([]),
 }),
 upperComposition:Object.freeze({
  include:Object.freeze([{left:24,top:52,width:352,height:158}]),
  exclude:Object.freeze([]),
 }),
 lowerDialogBox:Object.freeze({
  include:Object.freeze([{left:61,top:290,width:278,height:190}]),
  exclude:Object.freeze([]),
 }),
 lowerDialogText:Object.freeze({
  include:Object.freeze([{left:105,top:375,width:190,height:45}]),
  exclude:Object.freeze([]),
 }),
 lowerExposedMask:Object.freeze({
  include:Object.freeze([{left:40,top:240,width:320,height:240}]),
  exclude:Object.freeze([{left:61,top:290,width:278,height:190}]),
 }),
 lowerFull:Object.freeze({
  include:Object.freeze([{left:40,top:240,width:320,height:240}]),
  exclude:Object.freeze([]),
 }),
});

const round=(value,digits=6)=>Number(value.toFixed(digits));
const inside=(x,y,rect)=>x>=rect.left&&x<rect.left+rect.width&&y>=rect.top&&y<rect.top+rect.height;

export function regionPixelOffsets(region,width=CAPTURE_SIZE.width,height=CAPTURE_SIZE.height){
 const offsets=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(!region.include.some(rect=>inside(x,y,rect)))continue;
  if(region.exclude.some(rect=>inside(x,y,rect)))continue;
  offsets.push((y*width+x)*CAPTURE_SIZE.channels);
 }
 return offsets;
}

export function fitEndpointFraction(current,start,end,pixelOffsets){
 assert.equal(current.length,start.length);
 assert.equal(start.length,end.length);
 let numerator=0,denominator=0;
 for(const offset of pixelOffsets)for(let channel=0;channel<CAPTURE_SIZE.channels;channel++){
  const index=offset+channel,delta=end[index]-start[index];
  numerator+=delta*(current[index]-start[index]);
  denominator+=delta*delta;
 }
 assert.ok(denominator>0,'endpoint region must contain a non-zero pixel difference');
 const rawFraction=numerator/denominator,clippedFraction=Math.max(0,Math.min(1,rawFraction));
 let absolute=0,squared=0,maxAbsolute=0;
 for(const offset of pixelOffsets)for(let channel=0;channel<CAPTURE_SIZE.channels;channel++){
  const index=offset+channel,predicted=start[index]+clippedFraction*(end[index]-start[index]);
  const error=Math.abs(current[index]-predicted);
  absolute+=error;squared+=error*error;maxAbsolute=Math.max(maxAbsolute,error);
 }
 const samples=pixelOffsets.length*CAPTURE_SIZE.channels;
 return Object.freeze({
  rawFraction:round(rawFraction),
  clippedFraction:round(clippedFraction),
  residual:Object.freeze({mae:round(absolute/samples),rmse:round(Math.sqrt(squared/samples)),maxAbsolute:round(maxAbsolute)}),
  pixelCount:pixelOffsets.length,
 });
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

const luminance=(pixels,x,y)=>{
 const index=(y*CAPTURE_SIZE.width+x)*CAPTURE_SIZE.channels;
 return .2126*pixels[index]+.7152*pixels[index+1]+.0722*pixels[index+2];
};

export function fixedEdgeProfile(current,settled,{left,right,top,bottom}){
 const strengths=[];
 for(let x=left;x<right;x++){
  let sum=0;
  for(let y=top;y<bottom;y++){
   const currentGradient=luminance(current,x+1,y)-luminance(current,x,y);
   const settledGradient=luminance(settled,x+1,y)-luminance(settled,x,y);
   sum+=Math.abs(currentGradient-settledGradient);
  }
  strengths.push(sum/(bottom-top));
 }
 const maximum=Math.max(...strengths),peak=strengths.indexOf(maximum);
 return Object.freeze({
  peakBoundary:round(left+peak+.5,1),
  peakStrength:round(maximum),
  profile:strengths.map((strength,index)=>Object.freeze({boundary:round(left+index+.5,1),strength:round(strength)})),
 });
}

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

async function decodePng(path){
 const bytes=await readFile(path),digest=sha256(bytes);
 const decoded=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual(
  {width:decoded.info.width,height:decoded.info.height,channels:decoded.info.channels},
  CAPTURE_SIZE,
  `${path} must be a 400x480 RGB-compatible PNG`,
 );
 return Object.freeze({path,sha256:digest,pixels:decoded.data});
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

const range=(start,end)=>Array.from({length:end-start+1},(_,index)=>start+index);
const atPath=(value,path)=>path.split('.').reduce((current,key)=>current[key],value);
const summarizeResidual=(captures,path,indices)=>Object.freeze(Object.fromEntries(['mae','rmse','maxAbsolute'].map(metric=>{
 const ranked=indices.map(index=>({index,value:atPath(captures[index],path).residual[metric]})).sort((a,b)=>b.value-a.value);
 return [metric,Object.freeze(ranked[0])];
})));
const fractionRange=(captures,path,indices)=>{
 const values=indices.map(index=>atPath(captures[index],path).rawFraction);
 return Object.freeze({minimum:round(Math.min(...values)),maximum:round(Math.max(...values))});
};

export async function analyzeHomeClose({sequencePath,screenshotsPath,outputPath,earlyIndex=3,settledIndex=17,normalEarlyPath,normalSettledPath}){
 requireAbsolute('sequence',sequencePath);requireAbsolute('screenshots',screenshotsPath);requireAbsolute('output',outputPath);
 if(normalEarlyPath)requireAbsolute('normal-early',normalEarlyPath);
 if(normalSettledPath)requireAbsolute('normal-settled',normalSettledPath);
 if(Boolean(normalEarlyPath)!==Boolean(normalSettledPath))throw new Error('normal-early and normal-settled must be supplied together');
 const sequenceBytes=await readFile(sequencePath),sequence=JSON.parse(sequenceBytes);
 assert.ok(Array.isArray(sequence.records)&&sequence.records.length>settledIndex,'sequence does not contain the selected endpoint');
 const images=[];
 for(const [index,record] of sequence.records.entries()){
  const image=await decodePng(join(screenshotsPath,record.file));
  assert.equal(image.sha256,record.sha256,`capture ${index} hash does not match sequence.json`);
  images.push(image);
 }
 const early=images[earlyIndex].pixels,settled=images[settledIndex].pixels;
 const offsets=Object.fromEntries(Object.entries(HOME_CLOSE_REGIONS).map(([name,region])=>[name,regionPixelOffsets(region)]));
 const captures=images.map((image,index)=>{
  const upper=Object.fromEntries(['upperAppExposed','upperPanelChrome','upperPanelCenter','upperComposition'].map(name=>[
   name,fitEndpointFraction(image.pixels,settled,early,offsets[name]),
  ]));
  const lower=Object.fromEntries(['lowerDialogBox','lowerDialogText','lowerExposedMask','lowerFull'].map(name=>[
   name,fitEndpointFraction(image.pixels,early,settled,offsets[name]),
  ]));
  const changeFromEarly=Object.freeze({
   upperAppExposed:differenceMetrics(image.pixels,early,offsets.upperAppExposed),
   upperPanelChrome:differenceMetrics(image.pixels,early,offsets.upperPanelChrome),
   lowerDialogText:differenceMetrics(image.pixels,early,offsets.lowerDialogText),
  });
  return Object.freeze({
   index,file:sequence.records[index].file,sha256:image.sha256,
   upper:Object.freeze(upper),lower:Object.freeze(lower),changeFromEarly,
   comparison:Object.freeze({
    appMinusPanelRetainedFraction:round(upper.upperAppExposed.rawFraction-upper.upperPanelChrome.rawFraction),
    lowerMinusUpperComplement:round(lower.lowerFull.rawFraction-(1-upper.upperComposition.rawFraction)),
   }),
   fixedPanelEdges:Object.freeze({
    left:fixedEdgeProfile(image.pixels,settled,{left:47,right:57,top:104,bottom:164}),
    right:fixedEdgeProfile(image.pixels,settled,{left:342,right:352,top:104,bottom:164}),
   }),
  });
 });
 const earlyIndices=range(0,earlyIndex),settledIndices=range(settledIndex,captures.length-1),transitionIndices=range(earlyIndex+1,settledIndex-1);
 const upperNoise=Math.max(...earlyIndices.map(index=>captures[index].changeFromEarly.upperAppExposed.rmse),...earlyIndices.map(index=>captures[index].changeFromEarly.upperPanelChrome.rmse));
 const lowerNoise=Math.max(...earlyIndices.map(index=>captures[index].changeFromEarly.lowerDialogText.rmse));
 const firstUpperChange=captures.find(({index,changeFromEarly})=>index>earlyIndex&&changeFromEarly.upperAppExposed.rmse>upperNoise&&changeFromEarly.upperPanelChrome.rmse>upperNoise)?.index;
 const firstLowerChange=captures.find(({index,changeFromEarly})=>index>earlyIndex&&changeFromEarly.lowerDialogText.rmse>lowerNoise)?.index;
 const maxGap=transitionIndices.map(index=>({index,value:Math.abs(captures[index].comparison.appMinusPanelRetainedFraction)})).sort((a,b)=>b.value-a.value)[0];
 const initialLeft=captures[earlyIndex].fixedPanelEdges.left.peakBoundary,initialRight=captures[earlyIndex].fixedPanelEdges.right.peakBoundary;
 const edgeStrength=(capture,side,boundary)=>capture.fixedPanelEdges[side].profile.find(sample=>sample.boundary===boundary).strength;
 const initialLeftStrength=edgeStrength(captures[earlyIndex],'left',initialLeft),initialRightStrength=edgeStrength(captures[earlyIndex],'right',initialRight);
 const fixedEdgeIndices=range(earlyIndex,settledIndex-1).filter(index=>captures[index].fixedPanelEdges.left.peakBoundary===initialLeft&&captures[index].fixedPanelEdges.right.peakBoundary===initialRight);
 const panelEdgeContrast=range(earlyIndex,settledIndex).map(index=>{
  const left=round(edgeStrength(captures[index],'left',initialLeft)/initialLeftStrength);
  const right=round(edgeStrength(captures[index],'right',initialRight)/initialRightStrength);
  return Object.freeze({
   index,
   appDepartureProgress:round(1-captures[index].upper.upperAppExposed.rawFraction),
   appRetainedFraction:captures[index].upper.upperAppExposed.rawFraction,
   normalizedExpectedEdge:Object.freeze({left,right,mean:round((left+right)/2),halfRange:round(Math.abs(left-right)/2)}),
   expectedBoundariesRemainDominant:fixedEdgeIndices.includes(index),
  });
 });
 let normalSpeedEndpointCheck=null;
 if(normalEarlyPath){
  const [normalEarly,normalSettled]=await Promise.all([decodePng(normalEarlyPath),decodePng(normalSettledPath)]);
  normalSpeedEndpointCheck=Object.freeze({
   early:Object.freeze({path:normalEarly.path,sha256:normalEarly.sha256,againstSequenceEarly:Object.freeze({
    upperAppExposed:differenceMetrics(normalEarly.pixels,early,offsets.upperAppExposed),
    upperPanelChrome:differenceMetrics(normalEarly.pixels,early,offsets.upperPanelChrome),
    upperComposition:differenceMetrics(normalEarly.pixels,early,offsets.upperComposition),
    lowerFull:differenceMetrics(normalEarly.pixels,early,offsets.lowerFull),
   })}),
   settled:Object.freeze({path:normalSettled.path,sha256:normalSettled.sha256,againstSequenceSettled:Object.freeze({
    upperAppExposed:differenceMetrics(normalSettled.pixels,settled,offsets.upperAppExposed),
    upperPanelChrome:differenceMetrics(normalSettled.pixels,settled,offsets.upperPanelChrome),
    upperComposition:differenceMetrics(normalSettled.pixels,settled,offsets.upperComposition),
    lowerFull:differenceMetrics(normalSettled.pixels,settled,offsets.lowerFull),
   })}),
  });
 }
 const report=Object.freeze({
  schema:1,
  method:Object.freeze({
   pixelSpace:'8-bit PNG RGB channel values',
   fraction:'least-squares scalar projection between the selected early and settled endpoint pixels, clipped only for residual prediction',
   timingBoundary:'capture list order only; filenames, mtimes and emulator-speed scaling are not used as native frame or duration evidence',
  }),
  inputs:Object.freeze({
   sequence:Object.freeze({path:sequencePath,sha256:sha256(sequenceBytes),speedPercent:sequence.speedPercent,matchedBrowserEpoch:sequence.matchedBrowserEpoch,records:sequence.records.length}),
   screenshotsPath,
   earlyEndpoint:Object.freeze({index:earlyIndex,file:sequence.records[earlyIndex].file,sha256:images[earlyIndex].sha256}),
   settledEndpoint:Object.freeze({index:settledIndex,file:sequence.records[settledIndex].file,sha256:images[settledIndex].sha256}),
   normalSpeedEndpointCheck,
  }),
  regions:Object.freeze(Object.fromEntries(Object.entries(HOME_CLOSE_REGIONS).map(([name,region])=>[name,Object.freeze({...region,pixelCount:offsets[name].length})]))),
  captures,
  summary:Object.freeze({
   firstChangeBeyondPretransitionNoise:Object.freeze({
    upperIndex:firstUpperChange,upperNoiseRmse:round(upperNoise),lowerIndex:firstLowerChange,lowerNoiseRmse:round(lowerNoise),
   }),
   endpointFractionNoise:Object.freeze({
    upperAppExposed:Object.freeze({early:fractionRange(captures,'upper.upperAppExposed',earlyIndices),settled:fractionRange(captures,'upper.upperAppExposed',settledIndices)}),
    upperPanelChrome:Object.freeze({early:fractionRange(captures,'upper.upperPanelChrome',earlyIndices),settled:fractionRange(captures,'upper.upperPanelChrome',settledIndices)}),
    upperComposition:Object.freeze({early:fractionRange(captures,'upper.upperComposition',earlyIndices),settled:fractionRange(captures,'upper.upperComposition',settledIndices)}),
    lowerFull:Object.freeze({early:fractionRange(captures,'lower.lowerFull',earlyIndices),settled:fractionRange(captures,'lower.lowerFull',settledIndices)}),
    lowerDialogText:Object.freeze({early:fractionRange(captures,'lower.lowerDialogText',earlyIndices),settled:fractionRange(captures,'lower.lowerDialogText',settledIndices)}),
   }),
   maximumAppPanelFractionGap:Object.freeze(maxGap),
   residualBounds:Object.freeze({
    upperAppExposed:summarizeResidual(captures,'upper.upperAppExposed',transitionIndices),
    upperPanelChrome:summarizeResidual(captures,'upper.upperPanelChrome',transitionIndices),
    upperComposition:summarizeResidual(captures,'upper.upperComposition',transitionIndices),
    lowerFull:summarizeResidual(captures,'lower.lowerFull',transitionIndices),
   }),
   fixedPanelEdges:Object.freeze({
    expected:Object.freeze({left:initialLeft,right:initialRight}),
    indicesWithBothDominantPeaksAtExpectedBoundaries:Object.freeze(fixedEdgeIndices),
    normalizedExpectedEdgeContrast:Object.freeze(panelEdgeContrast),
   }),
  }),
 });
 await mkdir(dirname(outputPath),{recursive:true});
 await writeFile(outputPath,`${JSON.stringify(report,null,2)}\n`);
 return report;
}

async function main(){
 const args=parseArguments(process.argv.slice(2));
 const report=await analyzeHomeClose({
  sequencePath:requireAbsolute('--sequence',args.sequence),
  screenshotsPath:requireAbsolute('--screenshots',args.screenshots),
  outputPath:requireAbsolute('--output',args.output),
  earlyIndex:Number(args['early-index']??3),
  settledIndex:Number(args['settled-index']??17),
  normalEarlyPath:args['normal-early'],
  normalSettledPath:args['normal-settled'],
 });
 process.stdout.write(`${JSON.stringify({output:args.output,summary:report.summary,normalSpeedEndpointCheck:report.inputs.normalSpeedEndpointCheck},null,2)}\n`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
