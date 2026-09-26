import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cameraGuideFeedMask} from './camera-guide-feed-mask.mjs';
import {validateMask} from './compare.mjs';
test('Camera mask reproduces delivered source alpha without hiding guide or HUD pixels',async()=>{
 const {mask,guideAlpha,protectedPixels}=await cameraGuideFeedMask();
 assert.deepEqual(mask,JSON.parse(await readFile(new URL('./camera-guide-feed-mask.json',import.meta.url),'utf8')));
 const coverage=validateMask(mask);
 assert.equal(coverage.upper.reduce((a,b)=>a+b,0),5777);
 assert.equal(coverage.lower.some(Boolean),false);
 for(let i=0;i<96000;i++)if(coverage.upper[i]){assert.equal(guideAlpha[i],0);assert.equal(protectedPixels[i],0);}
 // Rounded-border semitransparency remains measurable; source alpha is not
 // converted to a permissive threshold and the full bounding box is not masked.
 const partial=Array.from(guideAlpha).filter(a=>a>0&&a<255);
 assert.ok(partial.length>0);
 assert.equal(coverage.upper[120*400+200],0);
 assert.equal(coverage.upper[3*400+113],0); // source capacity owner area
 assert.equal(coverage.upper[120*400],1); // genuinely unobscured left edge
});
