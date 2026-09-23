import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';

const source=readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8');
const {poseNativeLayout}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const pane=(name,children=[])=>({kind:'pan1',name,flags:1,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[20,20],children});
const flatten=panes=>panes.flatMap(p=>[p,...flatten(p.children)]);
const byName=layout=>new Map(flatten(layout.roots).map(p=>[p.name,p]));
const track=(target,value,binding='pane',property='translation.x')=>({target,binding,property,index:0,component:0,interpolation:'step',keys:[{frame:0,value}]});
function fixture(childBinding){
 const child=pane('child');child.picture={material:0,colors:[],uvSets:[]};
 const layout={canvas:{width:320,height:240,origin:1},roots:[pane('root',[pane('selected',[child]),pane('other')])],materials:[{name:'childMaterial',bufferColor:[0,0,0,0],constantColors:[],textureMaps:[],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]}],textures:[],fonts:[],groups:[{name:'selection',panes:['selected'],children:[]},{name:'otherGroup',panes:['other'],children:[]}],unsupported:[]};
 const clip={frames:1,loop:false,childBinding,groups:['selection','otherGroup'],textures:[],tracks:[track('selected',2),track('child',3),track('other',4),track('childMaterial',80,'material','materialColor.0.0')]};
 return {layout,clip};
}

test('explicit direct binding excludes descendants and their materials while preserving source assets',()=>{
 const {layout,clip}=fixture(true),before=structuredClone({layout,clip});
 const direct=poseNativeLayout(layout,{clip},[{name:'clip',frame:0,groups:['selection'],childBinding:false}]);
 assert.deepEqual(flatten(direct.roots).map(p=>p.translation[0]),[0,2,0,0]);
 assert.equal(direct.materials[0].bufferColor[0],0);
 const inherited=poseNativeLayout(layout,{clip},[{name:'clip',frame:0,groups:['selection']}]);
 assert.deepEqual(flatten(inherited.roots).map(p=>p.translation[0]),[0,2,3,0]);
 assert.equal(inherited.materials[0].bufferColor[0],80);
 assert.deepEqual({layout,clip},before);
});

test('explicit descendant binding overrides a direct resource and omission retains its behavior',()=>{
 const {layout,clip}=fixture(false);
 const inherited=poseNativeLayout(layout,{clip},[{name:'clip',frame:0}]);
 const recursive=poseNativeLayout(layout,{clip},[{name:'clip',frame:0,childBinding:true}]);
 assert.equal(byName(inherited).get('child').translation[0],0);
 assert.equal(byName(recursive).get('child').translation[0],3);
 assert.equal(recursive.materials[0].bufferColor[0],80);
 assert.equal(byName(inherited).get('other').translation[0],4);
});

test('an ungrouped Scale clip retains all tracks regardless of child binding overrides',()=>{
 const {layout,clip}=fixture(true),Scale={...clip,groups:[]};
 const expected=poseNativeLayout(layout,{Scale},[{name:'Scale',frame:0}]);
 for(const childBinding of [false,true])assert.deepEqual(poseNativeLayout(layout,{Scale},[{name:'Scale',frame:0,childBinding}]),expected);
 assert.deepEqual(flatten(expected.roots).map(p=>p.translation[0]),[0,2,3,4]);
});

const resourceRoot=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E');
const packPath=resolve(resourceRoot,'packs/home/launcher.json');
test('real FolderInT PicToggle binds only its three native group members and preserves the hidden empty tab',{skip:!existsSync(packPath)},()=>{
 const pack=JSON.parse(readFileSync(packPath)),name='LncIconFolderInT_00',layout=pack.layouts[name],animations=pack.animations;
 const before=structuredClone({layout,animations}),original=byName(layout);
 const switched=poseNativeLayout(layout,animations,[{name:name+'_PicToggle',frame:1,childBinding:false}]);
 const changed=flatten(switched.roots).filter(p=>{
  const withoutChildren=({children,...values})=>values;
  return JSON.stringify(withoutChildren(p))!==JSON.stringify(withoutChildren(original.get(p.name)));
 }).map(p=>p.name).sort();
 assert.deepEqual(changed,['N_Color_00','N_Had_00','N_Pic_00']);
 const bindings=[{name:name+'_Scale',frame:1},{name:name+'_PicToggle',frame:0,childBinding:false}];
 const posed=poseNativeLayout(layout,animations,bindings),panes=byName(posed);
 assert.equal(panes.get('N_Color_00').flags&1,1);
 assert.equal(panes.get('N_Pic_00').flags&1,0);
 assert.equal(panes.get('N_Had_00').translation[1],-0); // Original float32 constant key retains its sign.
 assert.equal(panes.get('P_FolderHad_01').flags&1,0);
 assert.deepEqual(panes.get('N_Had_01').scale,[1,1]);
 assert.equal(panes.get('N_Had_01').translation[1],7);
 const scaleOnly=byName(poseNativeLayout(layout,animations,[bindings[0]]));
 for(const target of ['N_FolderRoot_00','P_BaseShdw_00','N_Had_01']){
  for(const property of ['translation','scale','size'])assert.deepEqual(panes.get(target)[property],scaleOnly.get(target)[property]);
 }
 assert.deepEqual({layout,animations},before);
});
