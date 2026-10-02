import test from 'node:test';
import assert from 'node:assert/strict';
import {BALLOON_REGIONS,LOWER_SIZE} from '../scripts/compare-home-balloon.mjs';
import {measureBalloonRemoval} from '../scripts/compare-home-settings-two-row.mjs';

const pixels=value=>Buffer.alloc(LOWER_SIZE.width*LOWER_SIZE.height*LOWER_SIZE.channels,value);
const paint=(buffer,x,y,value)=>{
 const index=(y*LOWER_SIZE.width+x)*3;buffer[index]=buffer[index+1]=buffer[index+2]=value;
};

test('two-row removal measurement tracks changed balloon and dark text pixels',()=>{
 const before=pixels(240),after=pixels(240);
 for(let y=BALLOON_REGIONS.body.top;y<BALLOON_REGIONS.body.top+BALLOON_REGIONS.body.height;y++)for(let x=BALLOON_REGIONS.body.left;x<BALLOON_REGIONS.body.left+BALLOON_REGIONS.body.width;x++)paint(before,x,y,220);
 for(let y=66;y<72;y++)for(let x=90;x<120;x++)paint(before,x,y,50);
 const measured=measureBalloonRemoval(before,after);
 assert.equal(measured.bodyAtZero.dx,0);assert.equal(measured.bodyAtZero.dy,0);
 assert.equal(measured.bodyAtZero.pixelsAbove2,BALLOON_REGIONS.body.width*BALLOON_REGIONS.body.height);
 assert.equal(measured.textSignatureAtZero.pixelCount,180);
 assert.equal(measured.textSignatureAtZero.pixelsAbove2,180);
 assert.equal(measured.textSignatureChangedFraction,1);
});
