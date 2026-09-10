import test from 'node:test';
import assert from 'node:assert/strict';
import { compileCurve, clipFrame } from '../src/os/animation.ts';
test('Step and linear keys clamp endpoints and switch exactly at keys',()=>{
 const keys=[{frame:2,value:5},{frame:6,value:13},{frame:8,value:17}];
 const step=compileCurve({interpolation:'step',keys});const linear=compileCurve({interpolation:'linear',keys});
 assert.equal(step(5.9),5);assert.equal(step(6),13);assert.equal(linear(4),9);assert.equal(linear(-1),5);assert.equal(linear(99),17);
 keys[0].value=999;assert.equal(linear(2),5);
});
test('Hermite slopes use frame units over non-unit intervals',()=>{
 const curve=compileCurve({interpolation:'hermite',keys:[{frame:0,value:0,slope:2},{frame:10,value:20,slope:2}]});
 assert.equal(curve(2.5),5);assert.equal(curve(5),10);
 const ease=compileCurve({interpolation:'hermite',keys:[{frame:0,value:0,slope:0},{frame:10,value:1,slope:0}]});
 assert.equal(ease(2.5),0.15625);
});
test('Loop and nonloop time boundaries are deterministic',()=>{
 assert.equal(clipFrame(10,10,true),0);assert.equal(clipFrame(-1,10,true),9);assert.equal(clipFrame(20,10,false),10);
 assert.equal(clipFrame(-1,10,false),0);assert.equal(clipFrame(9,0,true),0);
});
test('Reject duplicate keys, missing slopes, and nonfinite time',()=>{
 assert.throws(()=>compileCurve({interpolation:'linear',keys:[{frame:0,value:0},{frame:0,value:1}]}));
 assert.throws(()=>compileCurve({interpolation:'hermite',keys:[{frame:0,value:1}]}));
 assert.throws(()=>clipFrame(Infinity,10,true));
 assert.throws(()=>compileCurve({interpolation:'step',keys:[{frame:0,value:1}]})(NaN));
});
