import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const source=readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8');
const {boundAnimationTracks,poseNativeLayout}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const pane=(name,children=[])=>({kind:'pan1',name,flags:1,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[20,20],children});
const track=(target,binding='pane',value=17)=>({target,contentIndex:binding==='pane'?0:1,binding,property:binding==='pane'?'alpha':'materialColor.0.0',index:0,component:0,interpolation:'step',keys:[{frame:0,value}]});
const material=name=>({name,bufferColor:[0,0,0,0],constantColors:[],textureMaps:[],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]});
function fixture(){
 const src=pane('source',[pane('sourceChild')]),dest=pane('destination',[pane('destinationChild')]);
 src.kind='pic1';src.picture={material:0,colors:[],uvSets:[]};dest.kind='pic1';dest.picture={material:1,colors:[],uvSets:[]};
 const layout={canvas:{width:320,height:240,origin:1},roots:[pane('root',[src,pane('parent',[dest]),pane('outside')])],materials:[material('sourceInk'),material('destinationInk')],textures:[],fonts:[],groups:[{name:'share',panes:['source','destination','outside'],children:[]},{name:'active',panes:['parent'],children:[]}],unsupported:[]};
 const clip={frames:1,loop:false,groups:['active'],childBinding:true,textures:[],shares:[{sourcePane:'source',targetGroup:'share'}],tracks:[track('source'),track('sourceInk','material',83),track('sourceChild','pane',42)]};
 return {layout,clip};
}
const flatten=items=>items.flatMap(p=>[p,...flatten(p.children)]);

test('sharing reads source outside selected groups, maps material ordinal, and leaves hierarchy/assets intact',()=>{
 const {layout,clip}=fixture(),before=structuredClone({layout,clip});
 const tracks=boundAnimationTracks(layout,clip);
 assert.deepEqual(tracks.map(t=>[t.binding,t.target]),[['pane','destination'],['material','destinationInk']]);
 const posed=poseNativeLayout(layout,{clip},[{name:'clip',frame:0}]);
 assert.equal(flatten(posed.roots).find(p=>p.name==='destination').alpha,17);
 assert.equal(flatten(posed.roots).find(p=>p.name==='destinationChild').alpha,255);
 assert.equal(posed.materials[1].bufferColor[0],83);
 assert.deepEqual({layout,clip},before);
});
test('direct selection, own-source exclusion and ungrouped share preserve native membership rules',()=>{
 const {layout,clip}=fixture();
 assert.equal(boundAnimationTracks(layout,{...clip,childBinding:false}).length,0);
 const all=boundAnimationTracks(layout,{...clip,groups:[]});
 assert.deepEqual(all.map(t=>t.target),['source','sourceInk','sourceChild','destination','destinationInk','outside']);
 // A share group's descendants do not become share targets even with childBinding.
 assert.equal(all.some(t=>t.target==='destinationChild'),false);
});
test('first matching native content entry supplies shared tracks',()=>{
 const {layout,clip}=fixture();clip.tracks.push({...track('source','pane',99),contentIndex:4});
 assert.equal(boundAnimationTracks(layout,clip).find(t=>t.target==='destination').keys[0].value,17);
});
test('an empty first native content entry does not borrow a later duplicate',()=>{
 const {layout,clip}=fixture();clip.contents=[{target:'source',binding:'pane'},{target:'sourceInk',binding:'material'},{target:'source',binding:'pane'}];
 clip.tracks[0].contentIndex=2;
 assert.deepEqual(boundAnimationTracks(layout,clip).map(t=>t.target),['destinationInk']);
});
test('invalid share references and unproved pane kinds are explicit errors',()=>{
 for(const mutate of [x=>x.clip.shares[0].sourcePane='absent',x=>x.clip.shares[0].targetGroup='absent',x=>x.layout.groups[0].panes.push('absent'),x=>x.layout.roots[0].children[0].picture.material=99,x=>x.layout.roots[0].children[0].kind='wnd1',x=>x.layout.roots.push(pane('source'))]){
  const x=fixture();mutate(x);assert.throws(()=>boundAnimationTracks(x.layout,x.clip),/animation-share/);
 }
});
test('unproved competing shared/direct channels fail explicitly',()=>{
 const {layout,clip}=fixture();clip.tracks.push(track('destination'));
 assert.throws(()=>boundAnimationTracks(layout,clip),/overlapping animation-share/);
});
test('a clip with no shares retains the existing selected channels',()=>{
 const {layout,clip}=fixture();delete clip.shares;assert.deepEqual(boundAnimationTracks(layout,clip),[]);
});

// Private original-resource checks: no binary firmware is copied into the repo.
const root=process.env.FIRMWARE_KEYBOARD_MEMBERS;
const golden=JSON.parse(readFileSync(new URL('./fixtures/native-keyboard-animation-share.json',import.meta.url)));
const decode=(path,kind)=>{
 const result=spawnSync('python3',['-c',`import json,sys;sys.path.insert(0,'scripts/firmware');from native import decode_${kind};print(json.dumps(decode_${kind}(open(sys.argv[1],'rb').read())))`,path],{cwd:resolve(new URL('..',import.meta.url).pathname),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
};
for(const clip of golden.clips)clip.sharedBindings=clip.sharedBindings.map(([binding,target,contentIndex,sourceTarget])=>({binding,target,contentIndex,sourceTarget}));
for(const expected of golden.clips)test(`original ${expected.file} matches ARM share bindings`,{skip:!root},()=>{
 const dir=resolve(root,'swkbd_qwerty_LZ.bin'),layoutPath=resolve(dir,'blyt/Keytop_qwerty.bclyt'),clipPath=resolve(dir,'anim',expected.file);
 assert.ok(existsSync(clipPath));
 assert.equal(createHash('sha256').update(readFileSync(layoutPath)).digest('hex'),golden.layoutSha256);
 assert.equal(createHash('sha256').update(readFileSync(clipPath)).digest('hex'),expected.sha256);
 const layout=decode(layoutPath,'layout'),clip=decode(clipPath,'animation');
 assert.deepEqual(clip.unsupported,[]);assert.deepEqual(clip.shares,expected.records);
 const ordinary=boundAnimationTracks(layout,{...clip,shares:[]});
 const shared=boundAnimationTracks(layout,clip).slice(ordinary.length);
 const identities=[...new Map(shared.map(t=>[JSON.stringify([t.binding,t.target,t.contentIndex]),{binding:t.binding,target:t.target,contentIndex:t.contentIndex}])).values()];
 assert.deepEqual(identities,expected.sharedBindings.map(({sourceTarget,...row})=>row));
 // Every copied curve/property belongs to the native source content index.
 for(const row of expected.sharedBindings){
  const original=clip.tracks.filter(t=>t.contentIndex===row.contentIndex);
  const copied=shared.filter(t=>t.contentIndex===row.contentIndex&&t.binding===row.binding&&t.target===row.target);
  assert.deepEqual(copied,original.map(t=>({...t,target:row.target})));
 }
 const before=structuredClone({layout,clip});
 for(const frame of [0,clip.frames/2,clip.frames]){
  const posed=poseNativeLayout(layout,{clip},[{name:'clip',frame}]);assert.equal(posed.roots.length,layout.roots.length);
 }
 assert.deepEqual({layout,clip},before);
});

test('original group override probes agree with native direct/descendant filtering',{skip:!root},()=>{
 const dir=resolve(root,'swkbd_qwerty_LZ.bin'),sourceLayout=decode(resolve(dir,'blyt/Keytop_qwerty.bclyt'),'layout'),sourceClip=decode(resolve(dir,'anim/Keytop_qwerty_i0.bclan'),'animation');
 for(const probe of golden.selectionProbes){
  const layout=structuredClone(sourceLayout),clip={...sourceClip,groups:probe.groupsOverride,childBinding:probe.childOverride};
  if(probe.rootGroupProbe)layout.groups.find(g=>g.name==='RootGroup').panes=[layout.roots[0].name];
  const direct=boundAnimationTracks(layout,{...clip,shares:[]});
  const shared=boundAnimationTracks(layout,clip).slice(direct.length);
  assert.equal(new Set(shared.map(t=>JSON.stringify([t.binding,t.target,t.contentIndex]))).size,probe.sharedBindingCount,JSON.stringify(probe.groupsOverride));
 }
});

test('text line spacing and picture/window vertex overrides clone caller colors without changing text colors',()=>{
 const {layout}=fixture(),text=pane('text'),window=pane('window');text.kind='txt1';
 text.text={material:0,value:'A',lineSpacing:1,topColor:[1,2,3,4],bottomColor:[5,6,7,8]};
 window.kind='wnd1';window.window={content:{material:0,colors:[],uvSets:[]},frames:[],flags:0};layout.roots.push(text,window);
 const colors=Array.from({length:4},()=>[20,30,40,50]),before=structuredClone(layout);
 const posed=poseNativeLayout(layout,{},[],{source:{vertexColors:colors},window:{vertexColors:colors},text:{lineSpacing:0,vertexColors:colors}});
 const panes=new Map(flatten(posed.roots).map(p=>[p.name,p]));
 assert.equal(panes.get('text').text.lineSpacing,0);
 assert.deepEqual(panes.get('text').text.topColor,text.text.topColor);
 assert.deepEqual(panes.get('text').text.bottomColor,text.text.bottomColor);
 assert.deepEqual(panes.get('source').picture.colors,colors);assert.deepEqual(panes.get('window').window.content.colors,colors);
 colors[0][0]=99;assert.equal(panes.get('source').picture.colors[0][0],20);assert.equal(panes.get('window').window.content.colors[0][0],20);
 assert.notEqual(panes.get('source').picture.colors[0],panes.get('window').window.content.colors[0]);assert.deepEqual(layout,before);
});
