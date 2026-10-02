import test from 'node:test';
import assert from 'node:assert/strict';
import {BALLOON_REGIONS,LOWER_SIZE,clampBalloonBodyCenter,compareRegion,darkInkBounds,detectSelectedTileAnchor,emptyMaskDifference,findBestTranslation,regionBytes} from '../scripts/compare-home-balloon.mjs';

const pixels=value=>Buffer.alloc(LOWER_SIZE.width*LOWER_SIZE.height*LOWER_SIZE.channels,value);
const paint=(buffer,x,y,r,g,b)=>{
 const index=(y*LOWER_SIZE.width+x)*LOWER_SIZE.channels;buffer[index]=r;buffer[index+1]=g;buffer[index+2]=b;
};

test('source body clamp moves only 16 pixels between left and right tile anchors',()=>{
 assert.deepEqual([clampBalloonBodyCenter(76),clampBalloonBodyCenter(160),clampBalloonBodyCenter(244)],[152,160,168]);
 assert.equal(clampBalloonBodyCenter(244)-clampBalloonBodyCenter(76),16);
});

test('selected tile detection chooses the cell with the mint cursor pixels',()=>{
 const image=pixels(255);
 for(let y=125;y<130;y++)for(let x=238;x<250;x++)paint(image,x,y,20,230,200);
 const detected=detectSelectedTileAnchor(image);
 assert.equal(detected.center,244);assert.equal(detected.mintPixelCount,60);
 assert.deepEqual(detected.bounds,{left:238,top:125,right:249,bottom:129});
});

test('translation search and metrics recover independent body movement',()=>{
 const reference=pixels(240),candidate=pixels(240),region={left:20,top:20,width:20,height:10};
 for(let y=20;y<30;y++)for(let x=20;x<40;x++){paint(reference,x,y,20+x,30+y,40);paint(candidate,x+16,y,20+x,30+y,40)}
 assert.deepEqual(findBestTranslation(reference,candidate,region,{minimumDx:10,maximumDx:20,minimumDy:-1,maximumDy:1}),{dx:16,dy:0,pixelCount:200,pixelsAbove2:0,channelsAbove2:0,mae:0,rmse:0,maxAbsolute:0});
 assert.equal(regionBytes(reference,region).length,600);
});

test('dark ink bounds and predicate comparisons use half-open geometry',()=>{
 const reference=pixels(240),candidate=pixels(240),region={left:10,top:10,width:10,height:10};
 paint(reference,12,13,50,50,50);paint(reference,17,18,50,50,50);paint(candidate,14,13,50,50,50);paint(candidate,19,18,50,50,50);
 assert.deepEqual(darkInkBounds(reference,region),{left:12,top:13,right:17,bottom:18,width:6,height:6,pixelCount:2});
 assert.deepEqual(compareRegion(reference,candidate,region,2,0),{dx:2,dy:0,pixelCount:100,pixelsAbove2:0,channelsAbove2:0,mae:0,rmse:0,maxAbsolute:0});
 assert.deepEqual(BALLOON_REGIONS.body,{left:24,top:49,width:256,height:62});
});

test('empty-mask metrics count pixels and channels above the two-level threshold',()=>{
 const left=Buffer.from([0,0,0,10,10,10]),right=Buffer.from([2,3,4,10,10,10]);
 assert.deepEqual(emptyMaskDifference(left,right,2,1),{width:2,height:1,pixelCount:2,pixelsAbove2:1,channelsAbove2:2,mae:1.5,rmse:2.198484,maxAbsolute:4});
});
