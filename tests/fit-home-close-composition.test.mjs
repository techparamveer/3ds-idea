import test from 'node:test';
import assert from 'node:assert/strict';
import {CAPTURE_SIZE,HOME_CLOSE_REGIONS,differenceMetrics,fitEndpointFraction,fixedEdgeProfile,regionPixelOffsets} from '../scripts/fit-home-close-composition.mjs';

const pixels=value=>Buffer.alloc(CAPTURE_SIZE.width*CAPTURE_SIZE.height*CAPTURE_SIZE.channels,value);
const onePixel=Object.freeze({include:Object.freeze([{left:0,top:0,width:1,height:1}]),exclude:Object.freeze([])});

test('least-squares endpoint fit reports exact fractions and channel residuals',()=>{
 const start=pixels(10),end=pixels(110),mid=pixels(35),offsets=regionPixelOffsets(onePixel);
 assert.deepEqual(fitEndpointFraction(mid,start,end,offsets),{
  rawFraction:.25,clippedFraction:.25,residual:{mae:0,rmse:0,maxAbsolute:0},pixelCount:1,
 });
 mid[0]=45;
 const fitted=fitEndpointFraction(mid,start,end,offsets);
 assert.equal(fitted.rawFraction,.283333);
 assert.deepEqual(fitted.residual,{mae:4.444444,rmse:4.714045,maxAbsolute:6.666667});
});

test('residual prediction clips out-of-range fractions while retaining the raw projection',()=>{
 const start=pixels(10),end=pixels(110),outside=pixels(130),offsets=regionPixelOffsets(onePixel);
 assert.deepEqual(fitEndpointFraction(outside,start,end,offsets),{
  rawFraction:1.2,clippedFraction:1,residual:{mae:20,rmse:20,maxAbsolute:20},pixelCount:1,
 });
});

test('region inclusion and exclusion use exact half-open capture coordinates',()=>{
 const region={include:[{left:2,top:3,width:3,height:2}],exclude:[{left:3,top:4,width:1,height:1}]};
 assert.deepEqual(regionPixelOffsets(region,8,8),[78,81,84,102,108]);
});

test('upper masks separate the exact fixed panel from exposed application pixels',()=>{
 assert.deepEqual(HOME_CLOSE_REGIONS.upperAppExposed.exclude,[{left:52,top:52,width:296,height:132}]);
 assert.deepEqual(HOME_CLOSE_REGIONS.upperPanelChrome.include,[
  {left:52,top:52,width:296,height:20},{left:52,top:164,width:296,height:20},
 ]);
 assert.deepEqual(HOME_CLOSE_REGIONS.upperPanelCenter.include,[{left:52,top:72,width:296,height:92}]);
 assert.equal(regionPixelOffsets(HOME_CLOSE_REGIONS.upperAppExposed).length,16544);
 assert.equal(regionPixelOffsets(HOME_CLOSE_REGIONS.upperPanelChrome).length,11840);
});

test('difference metrics and fixed-edge localization are deterministic',()=>{
 const settled=pixels(100),current=pixels(100),offsets=regionPixelOffsets(onePixel);
 current[0]=103;current[1]=104;current[2]=100;
 assert.deepEqual(differenceMetrics(current,settled,offsets),{mae:2.333333,rmse:2.886751,maxAbsolute:4});
 for(let y=10;y<20;y++)for(let x=0;x<=10;x++){
  const value=x<=4?40:180,index=(y*CAPTURE_SIZE.width+x)*CAPTURE_SIZE.channels;
  current[index]=value;current[index+1]=value;current[index+2]=value;
 }
 const profile=fixedEdgeProfile(current,settled,{left:1,right:9,top:10,bottom:20});
 assert.equal(profile.peakBoundary,4.5);
 assert.equal(profile.peakStrength,140);
});
