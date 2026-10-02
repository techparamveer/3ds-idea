import test from 'node:test';
import assert from 'node:assert/strict';
import {CAPTURE_SIZE,CLOSING_FADE_REGIONS,boundaryStrength,compareAlphaCandidate,differenceMetrics,fitEndpointFraction,meanLuminance,regionPixelOffsets,sampleHermite,selectEndpointPixels} from '../scripts/fit-home-closing-fade.mjs';

const pixels=value=>Buffer.alloc(CAPTURE_SIZE.width*CAPTURE_SIZE.height*CAPTURE_SIZE.channels,value);
const onePixel=Object.freeze({include:Object.freeze([{left:0,top:0,width:1,height:1}])});

test('endpoint projection and residual arithmetic are deterministic',()=>{
 const start=pixels(10),end=pixels(110),mid=pixels(35),offsets=regionPixelOffsets(onePixel);
 assert.deepEqual(fitEndpointFraction(mid,start,end,offsets),{rawFraction:.25,clippedFraction:.25,pixelCount:1,residual:{mae:0,rmse:0,maxAbsolute:0}});
 mid[0]=45;
 assert.deepEqual(fitEndpointFraction(mid,start,end,offsets),{rawFraction:.283333,clippedFraction:.283333,pixelCount:1,residual:{mae:4.444444,rmse:4.714045,maxAbsolute:6.666667}});
 assert.deepEqual(differenceMetrics(mid,start,offsets),{mae:28.333333,rmse:28.722813,maxAbsolute:35});
 assert.equal(meanLuminance(start,offsets),10);
});

test('mask probes use exact combined-PNG coordinates and exclude the footer',()=>{
 assert.equal(regionPixelOffsets(CLOSING_FADE_REGIONS.lowerLcd).length,76800);
 assert.equal(regionPixelOffsets(CLOSING_FADE_REGIONS.maskTop4).length,1280);
 assert.equal(regionPixelOffsets(CLOSING_FADE_REGIONS.maskCorners4).length,1680);
 assert.deepEqual(CLOSING_FADE_REGIONS.maskCorners4.include,[
  {left:40,top:244,width:4,height:210},{left:356,top:244,width:4,height:210},
 ]);
});

test('dynamic endpoint selectors inspect luminance only inside their search mask',()=>{
 const start=pixels(200),end=pixels(20),offsets=regionPixelOffsets(onePixel);
 assert.deepEqual(selectEndpointPixels(start,end,offsets,values=>values.start>150&&values.end<100),offsets);
 assert.deepEqual(selectEndpointPixels(start,end,offsets,values=>values.start<150&&values.end<100),[]);
});

test('underlay-subtracted boundary strength retains fixed edge contrast',()=>{
 const underlay=pixels(100),settled=pixels(100),mid=pixels(100);
 for(let y=10;y<20;y++){
  for(let x=5;x<CAPTURE_SIZE.width;x++){
   let offset=(y*CAPTURE_SIZE.width+x)*CAPTURE_SIZE.channels;
   settled[offset]=settled[offset+1]=settled[offset+2]=200;
   mid[offset]=mid[offset+1]=mid[offset+2]=150;
  }
 }
 const definition={orientation:'vertical',coordinate:4,start:10,end:20};
 assert.equal(boundaryStrength(settled,underlay,definition),100);
 assert.equal(boundaryStrength(mid,underlay,definition),50);
});

test('Hermite candidate sampling reaches the authored terminal plateau',()=>{
 const animation={frames:21,sourceFrameRange:[80,100],tracks:[{target:'P_Bg_00',property:'alpha',keys:[
  {frame:0,value:130,slope:-8.666666666666666},{frame:15,value:0,slope:0},
 ]}]};
 assert.equal(sampleHermite(animation.tracks[0].keys,0),130);
 assert.equal(sampleHermite(animation.tracks[0].keys,15),0);
 assert.equal(sampleHermite(animation.tracks[0].keys,20),0);
 const comparison=compareAlphaCandidate(animation,0);
 assert.deepEqual(comparison.nearest.map(sample=>sample.frame),[15,16,17,18,19,20]);
});
