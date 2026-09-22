import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
import sharp from 'sharp';
const source=readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8');
const api=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
const {sampleNativeTrack,poseNativeLayout,boundAnimationTracks,evaluateNativeMaterial,sampleNativeTexture,rasterNativePicture,nativeWindowPatches,transformNativeUV,nativeWhite}=api;
const combiner=(mode=0,sources=[0,0,0],operands=[0,0,0])=>({mode,sources,operands,scale:1,savePrevious:false});
const material=()=>({name:'test',bufferColor:[0,0,0,0],constantColors:Array.from({length:6},()=>[255,255,255,255]),textureMaps:[],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]});
const pane=(name,children=[])=>({kind:'pan1',name,flags:1,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[20,20],children});
const layout=()=>({canvas:{width:320,height:240,origin:1},roots:[pane('root',[pane('selected',[pane('child')]),pane('unrelated')])],materials:[],textures:[],fonts:[],groups:[{name:'selection',panes:['selected'],children:[]}],unsupported:[]});
const track=(target,value)=>({target,binding:'pane',property:'translation.x',index:0,component:0,interpolation:'step',keys:[{frame:0,value}]});
test('Hermite discontinuities preserve incoming/outgoing keys and step timing',()=>{
 const t={interpolation:'hermite',keys:[{frame:0,value:0,slope:0},{frame:10,value:10,slope:0},{frame:10,value:20,slope:0},{frame:20,value:40,slope:0}]};
 assert.equal(sampleNativeTrack(t,5),5);assert.equal(sampleNativeTrack(t,10),20);assert.equal(sampleNativeTrack(t,15),30);
 assert.equal(sampleNativeTrack({...t,interpolation:'step'},9.9),0);assert.equal(sampleNativeTrack(t,-1),0);
});
test('group and child bindings exclude unrelated tracks without modifying shared assets',()=>{
 const l=layout(),animation={frames:20,loop:true,childBinding:true,groups:['selection'],textures:[],tracks:[track('selected',2),track('child',3),track('unrelated',4)]};
 assert.equal(boundAnimationTracks(l,animation).length,2);
 const result=poseNativeLayout(l,{clip:animation},[{name:'clip',frame:40}],{child:{visible:false}});
 assert.equal(result.roots[0].children[0].children[0].translation[0],3);assert.equal(result.roots[0].children[1].translation[0],0);
 assert.equal(l.roots[0].children[0].translation[0],0);assert.equal(l.roots[0].children[0].children[0].flags,1);
 assert.equal(boundAnimationTracks(l,{...animation,childBinding:false}).length,1);
});
test('TEV operators, constants, alpha test and previous-buffer capture',()=>{
 for(const [mode,expected] of [[0,.6],[1,.12],[2,.8],[3,.3],[4,.3],[5,.4],[6,.2],[7,.37]]){
  const m=material();m.tevStages=[{constantSelectors:0,color:combiner(mode,[0,1,2]),alpha:combiner()}];
  const value=evaluateNativeMaterial(m,[[.6,.6,.6,1],[.2,.2,.2,1],[.25,.25,.25,1]]);assert.ok(Math.abs(value[0]-expected)<1e-8);
 }
 const m=material();m.constantColors[2]=[51,102,153,128];m.tevStages=[{constantSelectors:0x33,color:combiner(0,[4,4,4]),alpha:combiner(0,[4,4,4])}];
 assert.deepEqual(evaluateNativeMaterial(m,[]),[.2,.4,.6,128/255]);
 m.tevStages.push({constantSelectors:0,color:{...combiner(0,[0,0,0]),savePrevious:true},alpha:{...combiner(0,[0,0,0]),savePrevious:true}}, {constantSelectors:0,color:combiner(0,[7,7,7]),alpha:combiner(0,[7,7,7])});
 assert.deepEqual(evaluateNativeMaterial(m,[[1,1,1,1]]),[.2,.4,.6,128/255]);
 m.alphaCompare={function:6,reference:.75};assert.equal(evaluateNativeMaterial(m,[[1,1,1,1]])[3],0);
 const implicit=material();implicit.alphaCompare={function:0,reference:0};assert.equal(evaluateNativeMaterial(implicit,[])[3],0);
});
test('texel-centre filtering wraps each neighbour and matrix translation remains independent of scale',()=>{
 const pixels={width:2,height:1,data:new Uint8ClampedArray([255,0,0,255,0,0,255,255])};
 assert.deepEqual(sampleNativeTexture(pixels,0,.5,0,0,true),[1,0,0,1]);
 assert.deepEqual(sampleNativeTexture(pixels,0,.5,1,0,true),[.5,0,.5,1]);
 assert.deepEqual(sampleNativeTexture(pixels,1.25,.5,2,0,false),[0,0,1,1]);
 assert.deepEqual(sampleNativeTexture(pixels,-.25,.5,1,0,false),[0,0,1,1]);
 assert.deepEqual(transformNativeUV([.5,.5],{translation:[.25,0],scale:[2,2],rotation:90}).map(n=>Math.round(n*100)),[50,75]);
});
test('window raster uses four strips and preserves transparent content',()=>{
 const l=layout(),m=material();m.textureMaps=[{texture:0,wrapS:0,wrapT:0,magFilter:0}];l.materials=[material(),m];l.materials[0].constantColors[0][3]=0;l.textures=['corner'];
 const w={...pane('window'),size:[40,30],window:{content:{material:0,colors:nativeWhite,uvSets:[]},frames:[{material:1,flip:0}],flags:0}};
 const pixels=new Map([['corner',{width:8,height:8,data:new Uint8ClampedArray(256).fill(255)}]]),patches=nativeWindowPatches(w,l,pixels);
 assert.equal(patches.length,5);assert.deepEqual(patches.map(p=>[p.x,p.y,p.width,p.height]),[[8,8,24,14],[0,0,32,8],[32,0,8,22],[8,22,32,8],[0,8,8,22]]);
 assert.equal(rasterNativePicture(l,w.window.content,1,1,pixels).data[3],0);
});
const resourceRoot=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E');
const available=existsSync(resolve(resourceRoot,'packs/home/launcher.json'));
test('real HOME cursor bindings/materials render finite pixels with transparent centre', {skip:!available}, async()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/launcher.json')));
 const l=poseNativeLayout(pack.layouts.LncCsr_00,pack.animations,[{name:'LncCsr_00_Scale',frame:2},{name:'LncCsr_00_Loop',frame:30}]);
 const pixels=new Map();for(const name of l.textures){const {data,info}=await sharp(resolve(resourceRoot,pack.textures[name].url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});pixels.set(name,{width:info.width,height:info.height,data:new Uint8ClampedArray(data)});}
 const windows=l.roots[0].children[0].children;assert.equal(windows.length,2);
 for(const window of windows){const patches=nativeWindowPatches(window,l,pixels);const content=rasterNativePicture(l,patches[0].picture,4,4,pixels);assert.ok(content.data.filter((_,i)=>i%4===3).every(v=>v===0));
  const frame=rasterNativePicture(l,patches[1].picture,32,16,pixels);assert.ok(frame.data.some((v,i)=>i%4===3&&v>0));}
});

test('native framebuffer shadow multiplies RGB and respects alpha factors',()=>{
 assert.deepEqual(api.blendNativePixel([.2,.4,.6,1],[.5,.5,.5,1],{operation:1,sourceFactor:0,destinationFactor:2}),[.1,.2,.3,1]);
 assert.deepEqual(api.blendNativePixel([1,0,0,.5],[0,0,1,1],{operation:1,sourceFactor:4,destinationFactor:5}),[.5,0,.5,.75]);
});
