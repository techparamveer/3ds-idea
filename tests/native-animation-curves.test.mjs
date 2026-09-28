import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8');
const {sampleNativeTrack,poseNativeLayout}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const fixture=JSON.parse(readFileSync(new URL('./fixtures/native-animation-curves.json',import.meta.url),'utf8'));
const word=v=>{const b=new ArrayBuffer(4);new Float32Array(b)[0]=v;return new Uint32Array(b)[0];};
test('original HOME and keyboard Hermite outputs match all 3665 real-resource samples bit for bit',()=>{
 const failures=[];let count=0;
 for(const curve of fixture.curves)for(const [frame,expected] of curve.samples){
  const actual=sampleNativeTrack({keys:curve.keys,interpolation:'hermite'},frame);count++;
  if(word(actual)!==word(expected))failures.push({source:curve.sources[0],frame,expected,actual});
 }
 assert.equal(count,3665);assert.equal(failures.length,0,JSON.stringify({mismatches:failures.length,first:failures.slice(0,5)}));
});

test('34 original fade submissions preserve float32 translation and byte color writes',()=>{
 for(const sample of fixture.applications){
  const rows=fixture.curves.flatMap(c=>c.sources.filter(s=>s.file===sample.file).map(s=>({s,keys:c.keys})));
  const roots=sample.panes.filter(p=>p.binding==='pane').map(p=>({kind:'pan1',name:p.target,flags:1,origin:4,alpha:0,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[1,1],children:[]}));
  const materials=sample.panes.filter(p=>p.binding==='material').map(p=>({name:p.target,bufferColor:[0,0,0,0],constantColors:Array.from({length:6},()=>[0,0,0,0]),textureMaps:[],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]}));
  const layout={canvas:{width:320,height:240,origin:1},roots,materials,textures:[],fonts:[],groups:[],unsupported:[]};
  const tracks=rows.map(({s,keys})=>({target:s.target,binding:s.kind==='CLMC'?'material':'pane',index:0,component:s.component,interpolation:'hermite',keys,
   property:s.kind==='CLPA'?['translation.x','translation.y','translation.z','rotation.x','rotation.y','rotation.z','scale.x','scale.y','size.width','size.height'][s.component]:s.kind==='CLVC'?'alpha':`materialColor.${Math.floor(s.component/4)}.${s.component%4}`}));
  const posed=poseNativeLayout(layout,{fade:{frames:1000,loop:false,groups:[],textures:[],tracks}},[{name:'fade',frame:sample.frame}]);
  for(const native of sample.panes){
   if(native.binding==='pane'){
    const actual=posed.roots.find(p=>p.name===native.target);assert.deepEqual(actual.translation.map(word),native.translation.map(word),`${sample.file}/${sample.frame}/${native.target}/translation`);
    assert.equal(actual.alpha,native.alpha,`${sample.file}/${sample.frame}/${native.target}/alpha`);
   }else{
    const actual=posed.materials.find(p=>p.name===native.target);assert.deepEqual([actual.bufferColor,...actual.constantColors].flat(),native.colors);
   }
  }
 }
});
