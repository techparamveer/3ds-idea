import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';

const source=readFileSync(new URL('../src/scene/cgfx-billboard.ts',import.meta.url),'utf8').replace("'three'",JSON.stringify(import.meta.resolve('three')));
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {nativeCameraDirectionBone,nativeYAxialBone}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-9,`${message}: ${actual} vs ${expected}`);
function rows(matrix){const e=matrix.elements;return [e[0],e[4],e[8],e[12],e[1],e[5],e[9],e[13],e[2],e[6],e[10],e[14]];}
function expectRows(actual,expected){rows(actual).forEach((value,index)=>near(value,expected[index],`matrix entry ${index}`));}

test('raw mode 1 keeps Settings p_title source scale and animated translation at front camera',()=>{
 // Source CGFX SHA256 96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d.
 // COMMON/p_title has raw mode 1, scale .94, and TranslationY keys at frames 0 and 312.
 for(const y of [-7.05967,-7.23887]){
  const bone=new THREE.Matrix4().compose(new THREE.Vector3(0,y,0),new THREE.Quaternion(),new THREE.Vector3(.94,.94,.94));
  const camera=new THREE.Matrix4().setPosition(0,1,44.786);
  expectRows(nativeCameraDirectionBone(bone,new THREE.Matrix4(),camera),[.94,0,0,0,0,.94,0,y,0,0,.94,0]);
 }
});

test('raw mode 1 recomputes Y from inverse-view Z for a pitched camera',()=>{
 // HOME 0x2e1854 loads inverse-view column Z and passes helper flag 1.
 // 0x1cce54 computes X=normalize(oldY x Z), Y=Z x X, Z=normalized input.
 const camera=new THREE.Matrix4().makeBasis(new THREE.Vector3(1,0,0),new THREE.Vector3(0,.8,-.6),new THREE.Vector3(0,.6,.8)).setPosition(0,300,400);
 const bone=new THREE.Matrix4().makeScale(.94,.94,.94).setPosition(0,-7.05967,0);
 const actual=nativeCameraDirectionBone(bone,new THREE.Matrix4(),camera);
 expectRows(actual,[.94,0,0,0,0,.752,.564,-7.05967,0,-.564,.752,0]);
 assert.ok(Math.abs(rows(nativeYAxialBone(bone,new THREE.Matrix4(),camera))[9]+.564)>.1,'mode 5 retains world Y and must remain independent');
 const shifted=camera.clone().setPosition(500,-20,3);
 expectRows(nativeCameraDirectionBone(bone,new THREE.Matrix4(),shifted),rows(actual));
});

test('raw mode 1 cancels model yaw once while preserving world translation and scale',()=>{
 const parent=new THREE.Matrix4().compose(new THREE.Vector3(2,3,4),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2),new THREE.Vector3(2,2,2));
 const bone=new THREE.Matrix4().makeScale(.94,.94,.94).setPosition(0,-7.05967,0);
 const local=nativeCameraDirectionBone(bone,parent,new THREE.Matrix4()),world=parent.clone().multiply(local);
 expectRows(world,[1.88,0,0,2,0,1.88,0,3-2*7.05967,0,0,1.88,4]);
 assert.throws(()=>nativeCameraDirectionBone(bone,new THREE.Matrix4().makeScale(0,1,1),new THREE.Matrix4()),/Degenerate/);
 const parallelCamera=new THREE.Matrix4().makeBasis(new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,-1),new THREE.Vector3(0,1,0));
 assert.throws(()=>nativeCameraDirectionBone(new THREE.Matrix4(),new THREE.Matrix4(),parallelCamera),/Degenerate/);
});
