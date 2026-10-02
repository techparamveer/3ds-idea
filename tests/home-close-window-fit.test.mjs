import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampleCgfxCurve} from '../src/os/cgfx-animation.ts';
import {fittedHomeCloseWindowOpacity,homeCloseWindowOpacity} from '../src/os/home-close-window-fit.ts';

test('fixed-edge fit retains measured control points and clamps only the unresolvable tail',()=>{
 for(const [progress,opacity]of[[0,1],[.008127,.976865],[.027696,.912558],[.105664,.727084],[.215555,.450634],[.282371,.288948],[.423517,0],[1,0]]){
  assert.ok(Math.abs(fittedHomeCloseWindowOpacity(progress)-opacity)<1e-12);
 }
 let previous=1;
 for(let i=0;i<=1000;i++){const opacity=fittedHomeCloseWindowOpacity(i/1000);assert.ok(opacity>=0&&opacity<=previous);previous=opacity;}
 for(const progress of [-1,1.01,NaN,Infinity])assert.throws(()=>fittedHomeCloseWindowOpacity(progress),RangeError);
});

test('fit samples the pinned AppQuit Hermite scalar without adding a clock or mutating source',()=>{
 const data=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json',import.meta.url)));
 assert.equal(data.sourceSha256,'092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595');
 const clip=data.materialAnimations.find(c=>c.Name==='BannerBG_AppQuit');
 const curve=clip.Elements.find(e=>e.TargetType==='MaterialConstant4').Content.A;
 const before=JSON.stringify(curve);
 for(let frame=0;frame<=20;frame++)assert.ok(Math.abs(homeCloseWindowOpacity(frame)-fittedHomeCloseWindowOpacity(sampleCgfxCurve(curve,frame,NaN)))<1e-12);
 assert.equal(homeCloseWindowOpacity(0),1);assert.equal(homeCloseWindowOpacity(20),0);
 assert.equal(JSON.stringify(curve),before);
 for(const frame of [-1,.5,21,NaN,Infinity])assert.throws(()=>homeCloseWindowOpacity(frame),RangeError);
});
