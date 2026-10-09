import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import ts from 'typescript';
import {evaluateNativeMaterial,nativePaneParentPath,poseNativeLayout} from '../src/os/native-layout.ts';
import {nativeTextWriterFlags} from '../src/os/bitmap-font.ts';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const amiibo=moduleUrl('export const drawNativeAmiibo=()=>false;export const amiiboScreenPacks=[];');
const compile=name=>{
 const url=new URL(`../src/os/${name}.ts`,import.meta.url),source=readFileSync(url,'utf8');
 return moduleUrl(source.replace(/(from\s*['"])(\.[^'"]+?)(['"])/g,(_all,prefix,path,suffix)=>prefix+(path==='./stock-native-amiibo'?amiibo:new URL(`${path}.ts`,url).href)+suffix));
};
const {drawNativeHelperFrame,nativeHelperView,APPLICATION_MANUAL_SLOTS}=await import(compile('stock-native-helpers'));
const {NativeLayoutRenderer}=await import(compile('native-renderer'));
const settings='0004001000022000',camera='0004001000022400',browser='0004003000009d02';
const row=layout=>nativePaneParentPath(layout,'TextBox_Txt').at(-1);
const body=layout=>nativePaneParentPath(layout,'TextBox_Txt')[1];
const decoration=layout=>nativePaneParentPath(layout,'PageTitleNumB02').at(-1);
const identity=()=>({a:1,b:0,c:0,d:1,e:0,f:0});
function fixture(titleId=camera,screen='main'){
 const view={appId:'manual',screen,heading:'',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},data:titleId?{manualTitleId:titleId}:{}};
 const packs=Object.fromEntries(nativeHelperView(view).packs.map(request=>[request.alias,json(request.url)]));
 const font={manifest:json('fonts/shared/font.json')},fonts=new Map([['cbf_std.bcfnt',font]]);
 const renderer=new NativeLayoutRenderer(packs,{},fonts),calls=[];
 // Record the transport only; resource, font binding and preparation are real.
 renderer.draw=(context,pack,layout,options)=>{calls.push({context,pack,layout,options});return true;};
 const context={fillStyle:'',fillRect(){},getTransform:identity};
 return {view,renderer,calls,context,font,fonts,source:packs['manual-row'].layouts.BtnHeadLineTxt,
  paint:()=>drawNativeHelperFrame(renderer,context,context,view)};
}

const rowPaintTop=layout=>{
 const path=nativePaneParentPath(layout,'BtnPageTitleT_01'),pane=path.at(-1);
 return -path.reduce((sum,pane)=>sum+pane.translation[1],0)-pane.size[1]*pane.scale[1]*Math.floor(pane.origin/3)/2;
};

test('Contents culling uses the decoded visible row halves rather than the transparent shadow or row centre',()=>{
 const f=fixture(browser),posed=poseNativeLayout(f.source,f.renderer.packs['manual-row'].animations,[{name:'BtnHeadLineTxt_Wait',frame:1}]);
 for(const [name,x,scaleX]of [['BtnPageTitleT_01',84,-1],['BtnPageTitleT_02',-84,1]]){
  const path=nativePaneParentPath(posed,name),pane=path.at(-1);
  assert.deepEqual(path.map(pane=>pane.name),['RootPane','BtnHeadLineBody',name]);
  assert.deepEqual({kind:pane.kind,flags:pane.flags,alpha:pane.alpha,origin:pane.origin,translation:pane.translation,scale:pane.scale,rotation:pane.rotation,size:pane.size},
   {kind:'pic1',flags:1,alpha:255,origin:4,translation:[x,1,0],scale:[scaleX,1.2999999523162842],rotation:[0,0,0],size:[168,32]});
  const material=posed.materials[pane.picture.material];
  for(const alpha of [0,.5,1])assert.equal(evaluateNativeMaterial(material,[[.5,.5,.5,alpha]],pane.picture.colors[0].map(value=>value/255),[5])[3],alpha,'the original implicit program retains source texture alpha');
 }
 assert.equal(nativePaneParentPath(posed,'BtnShdw01').at(-1).alpha,0);
 assert.equal(rowPaintTop(posed),-24.799999237060547);
 assert.equal(f.paint(),true);
 const calls=f.calls.filter(call=>call.pack==='manual-row');
 assert.deepEqual(calls.map(call=>call.options.overrides.TextBox_Num.text),['1','2','3'],'the native partial third page row is submitted; no later row is submitted');
 assert.deepEqual(calls.map(call=>call.options.center),[[160,86],[160,174],[160,228]],'the captured placement contract is unchanged');
 assert.equal(calls[2].options.overrides.TextBox_Txt.text,'Browser Usage Precautio...','existing heading truncation is unchanged');
 assert.deepEqual(calls[2].options.clip,[0,0,320,212]);
 assert.equal(calls[2].options.center[1]+rowPaintTop(posed),203.20000076293945);
 f.renderer.dispose();
});

test('Contents submits a partial row just inside the source-derived bottom bound, but not at or beyond it',()=>{
 const original=APPLICATION_MANUAL_SLOTS.firstRow;
 try{
  for(const [delta,count]of [[-.001,3],[0,2],[.001,2]]){
   const f=fixture(browser),posed=poseNativeLayout(f.source,f.renderer.packs['manual-row'].animations,[{name:'BtnHeadLineTxt_Wait',frame:1}]);
   APPLICATION_MANUAL_SLOTS.firstRow=212-rowPaintTop(posed)-2*APPLICATION_MANUAL_SLOTS.row-APPLICATION_MANUAL_SLOTS.category+delta;
   assert.equal(f.paint(),true);
   const calls=f.calls.filter(call=>call.pack==='manual-row');
   assert.equal(calls.length,count,`row top ${212+delta}`);
   assert.deepEqual(calls.map(call=>call.options.overrides.TextBox_Num.text),Array.from({length:count},(_,index)=>String(index+1)));
   for(const call of calls)assert.deepEqual(call.options.clip,[0,0,320,212]);
   f.renderer.dispose();
  }
 }finally{APPLICATION_MANUAL_SLOTS.firstRow=original;}
});

for(const titleId of [camera,settings])test(`Contents ${titleId} retains its two rows and clipped second category`,()=>{
 const f=fixture(titleId),before=JSON.stringify(f.source);assert.equal(f.paint(),true);
 const rows=f.calls.filter(call=>call.pack==='manual-row'),categories=f.calls.filter(call=>call.pack==='manual-category');
 assert.deepEqual(rows.map(call=>call.options.overrides.TextBox_Num.text),['1','2']);
 assert.deepEqual(rows.map(call=>call.options.center),[[160,86],[160,174]]);
 assert.deepEqual(categories.map(call=>call.options.center),[[160,130],[160,218]]);
 assert.equal(categories[1].layout,'HLTxtBlue');
 for(const call of [...rows,...categories])assert.deepEqual(call.options.clip,[0,0,320,212]);
 assert.equal(JSON.stringify(f.source),before);f.renderer.dispose();
});

test('unsupported selected visible row bounds fail before drawing, including cached and posed geometry',()=>{
 const half=(layout,name='BtnPageTitleT_01')=>nativePaneParentPath(layout,name).at(-1);
 const edits=[
  f=>{body(f.source).children=body(f.source).children.filter(pane=>pane.name!=='BtnPageTitleT_01');},
  f=>{body(f.source).children.push(structuredClone(half(f.source)));},
  f=>{f.source.roots.push(structuredClone(half(f.source)));},
  ...['BtnPageTitleT_01','BtnPageTitleT_02'].flatMap(name=>[
   f=>{half(f.source,name).kind='pan1';},f=>{half(f.source,name).flags=0;},
   f=>{half(f.source,name).alpha=254;},f=>{half(f.source,name).origin=0;},
   f=>{half(f.source,name).translation[1]=2;},f=>{half(f.source,name).rotation[2]=1;},
   f=>{half(f.source,name).scale[1]=1.3;},f=>{half(f.source,name).size[1]=31;},
   f=>{half(f.source,name).unsupported=['unknown'];},f=>{delete half(f.source,name).picture;},
  ]),
 ];
 for(const edit of edits){const f=fixture(browser);edit(f);assert.throws(f.paint,/Unsupported Manual Contents row paint bounds source/);assert.equal(f.calls.length,0);f.renderer.dispose();}
 for(const name of ['ManualRowImportant','ManualRowGettingStarted']){
  const f=fixture(browser);assert.equal(f.paint(),true);f.calls.length=0;
  half(f.renderer.packs['manual-row'].layouts[name]).size[1]=31;
  assert.throws(f.paint,/Unsupported Manual Contents row paint bounds source/);assert.equal(f.calls.length,0);f.renderer.dispose();
 }
 const f=fixture(browser),track=structuredClone(f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks[0]);
 Object.assign(track,{target:'BtnPageTitleT_01',binding:'pane',property:'scale.y',component:4,tag:'CLPA',keys:[{frame:0,value:2,slope:0}]});
 f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.push(track);
 assert.throws(f.paint,/Unsupported Manual Contents row paint bounds source/);assert.equal(f.calls.length,0);f.renderer.dispose();
});

test('row-half pictures and complete selected materials reject visibility or sampler substitutions in originals and cached clones',()=>{
 const half=(layout,name)=>nativePaneParentPath(layout,name).at(-1),edits=[];
 for(const [name,index]of [['BtnPageTitleT_01',6],['BtnPageTitleT_02',7]])edits.push(
  ...Array.from({length:4},(_,corner)=>layout=>{half(layout,name).picture.colors[corner][3]=0;}),
  layout=>{half(layout,name).picture.colors[0][0]=254;},
  layout=>{half(layout,name).picture.colors.pop();},
  layout=>{half(layout,name).picture.material=index===6?7:6;},
  layout=>{half(layout,name).picture.uvSets[0][0]=.5;},
  layout=>{half(layout,name).picture.uvSets.push([0,0,1,0,0,1,1,1]);},
  ...[
   material=>{material.name='Different';},material=>{material.flags=0;},
   material=>{material.textureOnly=true;},material=>{material.bufferColor[3]=255;},
   material=>{material.constantColors[0][3]=0;},material=>{material.constantColors.pop();},
   material=>{material.textureMaps[0].texture=0;},material=>{material.textureMaps[0].wrapS=2;},
   material=>{material.textureMaps[0].wrapT=2;},material=>{material.textureMaps[0].minFilter=0;},
   material=>{material.textureMaps[0].magFilter=0;},material=>{material.textureMaps.push(structuredClone(material.textureMaps[0]));},
   material=>{material.textureMatrices[0].translation[0]=0;},material=>{material.textureMatrices[0].scale[0]=2;},
   material=>{material.textureMatrices[0].rotation=1;},material=>{material.textureMatrices.pop();},
   material=>{material.coordinateGenerators[0].source=1;},material=>{material.coordinateGenerators[0].reserved=1;},
   material=>{material.tevStages.push({constantSelectors:0,color:{},alpha:{}});},
   material=>{material.alphaCompare={function:7,reference:0};},
   material=>{material.colorBlend={operation:1,sourceFactor:4,destinationFactor:5};},
   material=>{material.sourceCombiners=[];},material=>{material.unsupported.push('unknown');},
  ].map(edit=>layout=>edit(layout.materials[index])),
 );
 for(const layoutName of ['BtnHeadLineTxt','ManualRowImportant','ManualRowGettingStarted'])for(const [index,edit]of edits.entries()){
  const f=fixture(browser);if(layoutName!=='BtnHeadLineTxt'){assert.equal(f.paint(),true);f.calls.length=0;}
  edit(f.renderer.packs['manual-row'].layouts[layoutName]);
  assert.throws(f.paint,/Unsupported Manual Contents row paint bounds source/,`${layoutName} mutation ${index}`);
  assert.equal(f.calls.length,0);f.renderer.dispose();
 }
});

test('row-half bound texture identity and layout binding are revalidated before every paint',()=>{
 const edits=[
  pack=>{delete pack.textures['BtnPageTitle00.bclim'];},
  ...[['width',15],['height',47],['picaFormat',8],['format',1],['formatName','A8'],['sha256','0'.repeat(64)],['sourceSha256','0'.repeat(64)],['url','textures/other.png']].map(([field,value])=>pack=>{pack.textures['BtnPageTitle00.bclim'][field]=value;}),
  pack=>{pack.layouts.BtnHeadLineTxt.textures[1]='Other.bclim';},
  pack=>{pack.layouts.BtnHeadLineTxt.textures.push('BtnPageTitle00.bclim');},
 ];
 for(const cached of [false,true])for(const edit of edits){
  const f=fixture(browser);if(cached){assert.equal(f.paint(),true);f.calls.length=0;}
  edit(f.renderer.packs['manual-row']);assert.throws(f.paint,/Unsupported Manual Contents row paint bounds source/);assert.equal(f.calls.length,0);f.renderer.dispose();
 }
 for(const name of ['ManualRowImportant','ManualRowGettingStarted']){
  const f=fixture(browser);assert.equal(f.paint(),true);f.calls.length=0;f.renderer.packs['manual-row'].layouts[name].textures[1]='Other.bclim';
  assert.throws(f.paint,/Unsupported Manual Contents row paint bounds source/);assert.equal(f.calls.length,0);f.renderer.dispose();
 }
});

test('row-half Wait visibility and texture programs reject changed channels even when the resulting pose has the same bounds',()=>{
 for(const name of ['BtnPageTitleT_01','BtnPageTitleT_02']){
  const alpha=clip=>clip.tracks.find(track=>track.target===name&&track.property==='materialColor.1.3');
  const edits=[
   clip=>{alpha(clip).keys[0].value=0;},clip=>{alpha(clip).keys[0].frame=0;},
   clip=>{alpha(clip).keys[0].slope=1;},clip=>{alpha(clip).keys.push({frame:90,value:0,slope:0});},
   clip=>{alpha(clip).property='materialColor.0.3';},clip=>{alpha(clip).binding='pane';},
   clip=>{alpha(clip).contentIndex=0;},clip=>{alpha(clip).component=0;},clip=>{alpha(clip).index=1;},
   clip=>{alpha(clip).interpolation='step';},clip=>{alpha(clip).tag='CLPA';},
   clip=>{clip.tracks=clip.tracks.filter(track=>track!==alpha(clip));},
   clip=>{clip.tracks.push(structuredClone(alpha(clip)));},
   clip=>{clip.tracks.find(track=>track.target===name&&track.property==='texture.translation.x').keys[0].value=0;},
   clip=>{clip.contents.find(content=>content.target===name).binding='pane';},
   clip=>{clip.textures=['BtnLngSelBase01.bclim'];},
  ];
  for(const cached of [false,true])for(const edit of edits){
   const f=fixture(browser);if(cached){assert.equal(f.paint(),true);f.calls.length=0;}
   edit(f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait);
   assert.throws(f.paint,/Unsupported Manual Contents row paint bounds source/);assert.equal(f.calls.length,0);f.renderer.dispose();
  }
 }
});

test('a failed partial-row draw keeps the real helper frame unready',()=>{
 const f=fixture(browser),draw=f.renderer.draw;
 f.renderer.draw=(...args)=>{const okay=draw(...args);return args[1]==='manual-row'&&args[3].overrides.TextBox_Num.text==='3'?false:okay;};
 assert.equal(f.paint(),false);assert.equal(f.calls.filter(call=>call.pack==='manual-row').length,3);f.renderer.dispose();
});

test('row source identity stays in the existing published Manual pack and shared original font',()=>{
 const bytes=readFileSync(new URL('packs/manual/layout-BtnHeadLineTxt.json',root)),pack=JSON.parse(bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'9c0c0fb055d3b15311c0f0210bf3a89314c64edfab54a7596adc3878e1a3ca7a');
 assert.equal(pack.titleId,'0004003000009b02');assert.equal(pack.sourceSha256,'8c06c951ba9740058c438b69cc52c4b4bf9e2f53102b73dc8b34aad40845a1f6');
 assert.deepEqual(pack.resourceSources.layouts.BtnHeadLineTxt,{path:'layout/BtnHeadLineTxt.arc/blyt/BtnHeadLineTxt.bclyt',sha256:'c41c54be9f004b98714ff8b9dc941b09386de50cd9215894d1ac6fe95181dca2',titleId:pack.titleId});
 assert.deepEqual(pack.resourceSources.animations.BtnHeadLineTxt_Wait,{path:'layout/BtnHeadLineTxt.arc/anim/BtnHeadLineTxt_Wait.bclan',sha256:'048be32112420819a2e8bdd8693a33c3dac618adcb34b6f80c2f86e3311bcff3',titleId:pack.titleId});
 assert.deepEqual(pack.resourceSources.textures['BtnPageTitle00.bclim'],{path:'layout/BtnHeadLineTxt.arc/timg/BtnPageTitle00.bclim',sha256:'80094660435f8016d2952e5c8a0184da9eeffbe71bb5cf5438cbbeb4666ed6da',titleId:pack.titleId});
 assert.equal(createHash('sha256').update(readFileSync(new URL(pack.textures['BtnPageTitle00.bclim'].url,root))).digest('hex'),'d8b10a7c49643d5a9fc9aa4dea8c417b2f07cf832ecf1634119f7173162ab224');
 assert.equal(json('fonts/shared/font.json').sourceSha256,'95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581');
});

for(const titleId of [settings,camera,browser])test(`Contents ${titleId} binds only the original title and centered number to direct source-size sampling`,()=>{
 const f=fixture(titleId),sourceBefore=JSON.stringify(f.source),waitBefore=JSON.stringify(f.renderer.packs['manual-row'].animations);
 assert.equal(f.paint(),true);
 const calls=f.calls.filter(call=>call.pack==='manual-row');assert.ok(calls.length>=2);
 for(const call of calls){
  assert.equal(call.options.textSampling,'lcd-source-size-left');
  assert.deepEqual(call.options.textSamplingPanes,['TextBox_Txt','TextBox_Num']);
  assert.equal(call.options.pictureSampling,'lcd');
  assert.deepEqual(call.options.clip,[0,0,320,212]);
  assert.deepEqual(call.options.bindings,[{name:'BtnHeadLineTxt_Wait',frame:1}]);
  assert.deepEqual(Object.keys(call.options.overrides),['TextBox_Num','TextBox_Txt','PageTitleNumB02']);
  assert.deepEqual(call.options.overrides.PageTitleNumB02,{visible:false});
  assert.deepEqual(Object.keys(call.options.overrides.TextBox_Txt),['text']);
  assert.ok(!/[\r\n]/.test(call.options.overrides.TextBox_Txt.text));
  const layout=f.renderer.packs['manual-row'].layouts[call.layout],posed=poseNativeLayout(layout,f.renderer.packs['manual-row'].animations,call.options.bindings,call.options.overrides);
  const originalPose=poseNativeLayout(layout,f.renderer.packs['manual-row'].animations,call.options.bindings,{TextBox_Num:call.options.overrides.TextBox_Num,TextBox_Txt:call.options.overrides.TextBox_Txt});
  assert.equal(decoration(layout).flags,1);assert.equal(decoration(originalPose).flags,1);
  decoration(originalPose).flags&=~1;assert.deepEqual(posed,originalPose,'only the original named visibility bit changes');
  assert.equal(body(layout).translation[1],2,'existing body fit is unchanged');
  assert.equal(body(posed).translation[1],3,'original Wait track is not fitted or rewritten');
  assert.deepEqual(row(posed).translation,row(f.source).translation);
  assert.deepEqual(row(posed).text.size,[17.5,21]);assert.equal(nativeTextWriterFlags(row(posed).text.alignment,row(posed).text.lineAlignment),0);
  const number=nativePaneParentPath(posed,'TextBox_Num').at(-1).text;
  assert.deepEqual([number.alignment,number.lineAlignment,number.size],[4,2,[15.75,19.5]]);
 }
 const header=f.calls.find(call=>call.pack==='manual-SoftTitleHeader');
 assert.equal(header.options.pictureSampling,'lcd');
 assert.equal(header.options.textSampling,'lcd-source-size');
 assert.deepEqual(header.options.center,[200,-22]);
 assert.equal(header.options.overrides.TextBoxTxt_00.text,{[settings]:'System Settings',[camera]:'Nintendo 3DS Camera',[browser]:'Internet Browser'}[titleId]);
 for(const call of f.calls.filter(call=>call.pack!=='manual-row')){
  assert.notEqual(call.options.textSampling,'lcd-source-size-left',call.pack);
  assert.equal(call.options.textSamplingPanes,undefined,call.pack);
 }
 assert.equal(JSON.stringify(f.source),sourceBefore);assert.equal(JSON.stringify(f.renderer.packs['manual-row'].animations),waitBefore);
 const before=f.calls.map(call=>({pack:call.pack,layout:call.layout,options:call.options}));f.calls.length=0;
 assert.equal(f.paint(),true);assert.deepEqual(f.calls.map(call=>({pack:call.pack,layout:call.layout,options:call.options})),before);
 f.renderer.dispose();
});

test('selected Manual row facts reject unsupported data before the first draw',()=>{
 const edits=[
  f=>{delete f.renderer.packs['manual-row'];},
  f=>{delete f.renderer.packs['manual-row'].layouts.BtnHeadLineTxt;},
  f=>{f.source.roots.push(structuredClone(row(f.source)));},
  f=>{body(f.source).name='DifferentParent';},
  f=>{f.source.roots.push(structuredClone(f.source.roots[0]));},
  f=>{f.source.fonts[0]='another.bcfnt';},
  f=>{f.source.unsupported.push('unknown');},
  f=>{row(f.source).unsupported=['unknown'];},
  f=>{row(f.source).flags=0;},
  f=>{row(f.source).origin=4;},
  f=>{row(f.source).alpha=128;},
  f=>{row(f.source).size[1]=21.25;},
  f=>{row(f.source).translation[1]=1.5;},
  f=>{body(f.source).scale[0]=.99;},
  f=>{body(f.source).rotation[2]=1;},
  f=>{body(f.source).text=structuredClone(row(f.source).text);},
  f=>{f.source.roots[0].rotation[0]=1;},
  f=>{row(f.source).text.font=1;},
  f=>{row(f.source).text.material=1;},
  f=>{row(f.source).text.flags=1;},
  f=>{row(f.source).text.capacity=29;},
  f=>{row(f.source).text.length=29;},
  f=>{delete row(f.source).text.capacity;},
  f=>{delete row(f.source).text.length;},
  f=>{row(f.source).text.alignment=3;},
  f=>{row(f.source).text.lineAlignment=2;},
  f=>{row(f.source).text.size[0]=18;},
  f=>{row(f.source).text.characterSpacing=.5;},
  f=>{row(f.source).text.lineSpacing=1;},
  f=>{row(f.source).text.topColor[0]=51;},
  f=>{row(f.source).text.bottomColor[3]=254;},
  f=>{row(f.source).text.messageStyle={fontScale:[.7,.7],characterSpacing:0,lineSpacing:0};},
  f=>{row(f.source).text.glyphScaleSpans=[];},
  f=>{row(f.source).text.fixedWidthSpans=[];},
  f=>{row(f.source).text.cursorAdvances=[];},
  f=>{row(f.source).text.colorSpans=[];},
  f=>{row(f.source).text.lineAdvanceScales=[];},
  f=>{row(f.source).text.multilineBlockOrigin='writer-0x111';},
  f=>{row(f.source).text.singleLineBlockOrigin='writer-0x110';},
 ];
 for(const [index,edit] of edits.entries()){
  const f=fixture();edit(f);assert.throws(f.paint,/Unsupported Manual Contents TextBox_Txt source/,`mutation ${index}`);
  assert.equal(f.calls.length,0);f.renderer.dispose();
 }
});

test('the selected title material is pinned completely without validating unrelated row materials',()=>{
 const edits=[
  material=>{material.name='Different';},
  material=>{material.flags=1;},
  material=>{material.textureOnly=true;},
  material=>{material.bufferColor[0]=51;},
  material=>{material.constantColors[0][3]=254;},
  material=>{material.constantColors.pop();},
  material=>{material.textureMaps.push({texture:0,wrapS:0,wrapT:0,minFilter:0,magFilter:0});},
  material=>{material.textureMatrices.push({translation:[0,0],rotation:0,scale:[1,1]});},
  material=>{material.coordinateGenerators.push({type:0,source:0});},
  material=>{material.tevStages.push({constantSelectors:0,color:{},alpha:{}});},
  material=>{material.alphaCompare={function:7,reference:0};},
  material=>{material.colorBlend={operation:1,sourceFactor:4,destinationFactor:5};},
  material=>{material.sourceFormat='FLYT';},
  material=>{material.capability='another';},
  material=>{material.sourceCombiners=[];},
  material=>{material.sourceProjections=[];},
  material=>{material.unsupported.push('unknown');},
 ];
 for(const edit of edits){const f=fixture();edit(f.source.materials[0]);assert.throws(f.paint,/Unsupported Manual Contents TextBox_Txt source/);assert.equal(f.calls.length,0);f.renderer.dispose();}
 const f=fixture();f.source.materials[3].bufferColor[0]=10;
 assert.equal(f.paint(),true,'sibling artwork stays outside the selected text sampler predicates');f.renderer.dispose();
});

test('Manual row validates the bound font rather than an optional supplied font',()=>{
 for(const [field,value] of [['sourceSha256','0'.repeat(64)],['colorMode','luminance-alpha'],['width',24],['height',29],['ascent',24],['baseline',24],['lineFeed',29]]){
  const f=fixture();f.font.manifest[field]=value;
  assert.throws(()=>drawNativeHelperFrame(f.renderer,f.context,f.context,f.view,{font:{manifest:json('fonts/shared/font.json')}}),/Unsupported Manual Contents TextBox_Txt font/,field);
  assert.equal(f.calls.length,0);f.renderer.dispose();
 }
 const f=fixture();f.fonts.clear();assert.throws(f.paint,/Unsupported Manual Contents TextBox_Txt font/);f.renderer.dispose();
});

test('unsupported outer LCD transform cannot silently fall back to the generic row raster',()=>{
 for(const transform of [undefined,{...identity(),a:2},{...identity(),d:.5},{...identity(),b:.1},{...identity(),c:.1},{...identity(),e:NaN}]){
  const f=fixture();f.context.getTransform=()=>transform;
  assert.throws(f.paint,/Unsupported Manual Contents TextBox_Txt LCD transform/);assert.equal(f.calls.length,0);f.renderer.dispose();
 }
 const f=fixture();f.context.getTransform=()=>({...identity(),e:.25,f:.75});assert.equal(f.paint(),true);f.renderer.dispose();
});

test('cached preparations and selected Wait poses are revalidated on subsequent paints',()=>{
 const edits=[
  f=>{row(f.source).text.lineAlignment=1;},
  f=>{row(f.renderer.packs['manual-row'].layouts.ManualRowImportant).text.characterSpacing=1;},
  f=>{row(f.renderer.packs['manual-row'].layouts.ManualRowGettingStarted).scale=[2,1];},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.find(track=>track.target==='BtnHeadLineBody'&&track.property==='translation.y').keys[0].value=4;},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.find(track=>track.target==='TextBox_Txt'&&track.property==='translation.x').keys[0].value=-96;},
 ];
 for(const edit of edits){const f=fixture();assert.equal(f.paint(),true);f.calls.length=0;edit(f);assert.throws(f.paint,/Unsupported Manual Contents TextBox_Txt source/);assert.equal(f.calls.length,0);f.renderer.dispose();}
 const f=fixture();assert.equal(f.paint(),true);f.font.manifest.colorMode='luminance-alpha';assert.throws(f.paint,/Unsupported Manual Contents TextBox_Txt font/);f.renderer.dispose();
 const missing=fixture();delete missing.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait;
 assert.throws(missing.paint,/Missing native animation BtnHeadLineTxt_Wait/);assert.equal(missing.calls.length,0);missing.renderer.dispose();
});

test('a multiline selected index title fails explicitly instead of changing writer branch',()=>{
 const f=fixture();nativePaneParentPath(f.renderer.packs['manual-index'].layouts.Index,'PageTitle_000').at(-1).text.value='two\nlines';
 assert.throws(f.paint,/Unsupported Manual Contents TextBox_Txt multiline title/);assert.equal(f.calls.some(call=>call.pack==='manual-row'),false);f.renderer.dispose();
});

test('Contents decoration hide rejects malformed source pane, selected material and texture before drawing',()=>{
 const edits=[
  f=>{body(f.source).children=body(f.source).children.filter(pane=>pane.name!=='PageTitleNumB02');},
  f=>{body(f.source).children.push(structuredClone(decoration(f.source)));},
  f=>{const pane=decoration(f.source);body(f.source).children=body(f.source).children.filter(item=>item!==pane);f.source.roots[0].children.push(pane);},
  ...['kind','flags','origin','alpha'].map(field=>f=>{decoration(f.source)[field]=field==='kind'?'pan1':0;}),
  f=>{decoration(f.source).translation[1]=1;},
  f=>{decoration(f.source).rotation[2]=1;},
  f=>{decoration(f.source).scale[0]=2;},
  f=>{decoration(f.source).size[1]=30;},
  f=>{decoration(f.source).children.push(structuredClone(row(f.source)));decoration(f.source).children[0].name='child';},
  f=>{decoration(f.source).text=structuredClone(row(f.source).text);},
  f=>{decoration(f.source).part={layout:'replacement'};},
  f=>{decoration(f.source).window={};},
  f=>{decoration(f.source).unsupported=['unknown'];},
  f=>{decoration(f.source).picture.material=1;},
  f=>{decoration(f.source).picture.colors[0][3]=254;},
  f=>{decoration(f.source).picture.uvSets[0][2]=1;},
  f=>{decoration(f.source).picture.unknown=0;},
  f=>{f.source.materials.push(structuredClone(f.source.materials[5]));},
  ...['name','flags','textureOnly','bufferColor','constantColors','textureMaps','textureMatrices','coordinateGenerators'].map(field=>f=>{f.source.materials[5][field]=[];}),
  f=>{f.source.materials[5].tevStages.push({});},
  f=>{f.source.materials[5].unsupported.push('unknown');},
  ...['alphaCompare','colorBlend','sourceFormat','capability','sourceCombiners','sourceProjections'].map(field=>f=>{f.source.materials[5][field]={};}),
  f=>{f.source.materials[5].bufferColor[0]=219;},
  f=>{f.source.materials[5].constantColors[0][0]=254;},
  ...['texture','wrapS','wrapT','minFilter','magFilter'].map(field=>f=>{f.source.materials[5].textureMaps[0][field]++;}),
  f=>{f.source.materials[5].textureMatrices[0].translation[0]=1;},
  f=>{f.source.materials[5].textureMatrices[0].rotation=1;},
  f=>{f.source.materials[5].textureMatrices[0].scale[0]=2;},
  ...['reserved','source','type'].map(field=>f=>{f.source.materials[5].coordinateGenerators[0][field]++;}),
  f=>{f.source.textures[0]='replacement.bclim';},
  f=>{f.source.textures.push(f.source.textures[0]);},
  f=>{delete f.renderer.packs['manual-row'].textures['BtnLngSelBase01.bclim'];},
  ...['url','width','height','picaFormat','format','formatName','sha256','sourceSha256'].map(field=>f=>{f.renderer.packs['manual-row'].textures['BtnLngSelBase01.bclim'][field]=0;}),
  f=>{f.renderer.packs['manual-row'].textures['BtnLngSelBase01.bclim'].unsupported=['unknown'];},
 ];
 for(const [index,edit]of edits.entries()){
  const f=fixture();edit(f);assert.throws(f.paint,/Unsupported Manual Contents PageTitleNumB02 source/,`decoration mutation ${index}`);
  assert.equal(f.calls.length,0);f.renderer.dispose();
 }
});

test('cached decorations, replacements and unmodified Wait are guarded before a visibility override',()=>{
 const edits=[
  f=>{decoration(f.source).alpha=254;},
  f=>{decoration(f.renderer.packs['manual-row'].layouts.ManualRowImportant).flags=0;},
  f=>{decoration(f.renderer.packs['manual-row'].layouts.ManualRowGettingStarted).size[0]=30;},
  f=>{f.renderer.packs['manual-row'].layouts.ManualRowImportant.materials[5].bufferColor[0]=0;},
  f=>{f.renderer.packs['manual-row'].layouts.ManualRowGettingStarted.materials[5].textureMaps[0].texture=1;},
  f=>{const replacement=structuredClone(f.renderer.packs['manual-row']);decoration(replacement.layouts.BtnHeadLineTxt).flags=0;f.renderer.packs['manual-row']=replacement;},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.find(track=>track.target==='PageTitleNumB02').keys[0].value=-119;},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.find(track=>track.target==='PageTitleNumB02'&&track.property==='materialColor.0.0').keys[0].value=219;},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.find(track=>track.target==='PageTitleNumB02').keys[0].slope=1;},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.groups=['replacement'];},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.shares=[];},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.shares=[{sourcePane:'PageTitleNumB02',targetGroup:'replacement'}];},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.unsupported.push('unknown');},
  ...['PageTitleNumB02','RootPane','BtnHeadLineBody'].flatMap(target=>[0,1].map(value=>f=>{
   f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.push({target,binding:'pane',property:'visible',index:0,component:0,interpolation:'step',keys:[{frame:0,value}]});
  })),
 ];
 for(const [index,edit]of edits.entries()){
  const f=fixture();assert.equal(f.paint(),true);f.calls.length=0;edit(f);
  assert.throws(f.paint,/Unsupported Manual Contents PageTitleNumB02 source/,`cached decoration mutation ${index}`);assert.equal(f.calls.length,0);f.renderer.dispose();
 }
 const f=fixture();assert.equal(f.paint(),true);f.renderer.packs['manual-row']=structuredClone(f.renderer.packs['manual-row']);
 assert.equal(f.paint(),true,'an exact immutable source replacement retains the same explicit hide');f.renderer.dispose();
});

test('Page and generic Manual paths do not inherit the Contents-only decoration override',()=>{
 for(const [titleId,screen]of [[settings,'document'],[browser,'document'],[null,'main']]){
  const f=fixture(titleId,screen),before=JSON.stringify(f.source);
  if(screen==='document')f.view.data.page=0;
  if(!titleId)f.view.rows=[{label:'Guide'}];
  assert.equal(f.paint(),true);
  const rows=f.calls.filter(call=>call.pack==='manual-row');assert.ok(rows.length);
  for(const call of rows)assert.equal(call.options.overrides.PageTitleNumB02,undefined);
  assert.equal(JSON.stringify(f.source),before);f.renderer.dispose();
 }
});

test('real renderer keeps the row title left and the number centered on direct glyph sampling',()=>{
 const f=fixture();assert.equal(f.paint(),true);const selected=f.calls.find(call=>call.pack==='manual-row');
 const layout=structuredClone(f.renderer.packs['manual-row'].layouts[selected.layout]);
 // Keep B02 to prove the visibility override prevents its missing texture draw.
 const strip=panes=>{for(const pane of panes){if(pane.name!=='PageTitleNumB02')delete pane.picture;delete pane.window;strip(pane.children);}};strip(layout.roots);
 const calls=[],font={manifest:f.font.manifest,drawNative(...args){calls.push({value:args[1],size:args[4],alignment:args[5],lineAlignment:args[8],direct:args[10],sourceSize:args[14],topLeft:args[15]});}};
 const renderer=new NativeLayoutRenderer({row:{...f.renderer.packs['manual-row'],layouts:{row:layout}}},{row:new Map()},new Map([['cbf_std.bcfnt',font]]));
 const previous=globalThis.document;
 const canvas=()=>{
  const canvas={width:320,height:240},stack=[];let matrix=identity();
  const context={canvas,save(){stack.push({...matrix});},restore(){matrix=stack.pop();},getTransform:()=>matrix,
   translate(x,y){matrix.e+=matrix.a*x;matrix.f+=matrix.d*y;},rotate(){},scale(x,y){matrix.a*=x;matrix.d*=y;},beginPath(){},rect(){},clip(){},drawImage(){},
   getImageData:(_x,_y,width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),putImageData(){}};
  canvas.getContext=()=>context;return canvas;
 };
 globalThis.document={createElement:canvas};
 try{
  assert.equal(renderer.draw(canvas().getContext(),'row','row',selected.options),true);
  const title=calls.find(call=>call.value===selected.options.overrides.TextBox_Txt.text),number=calls.find(call=>call.value===selected.options.overrides.TextBox_Num.text);
  assert.deepEqual(title,{value:selected.options.overrides.TextBox_Txt.text,size:[17.5,21],alignment:0,lineAlignment:0,direct:true,sourceSize:true,topLeft:true});
  assert.deepEqual(number,{value:selected.options.overrides.TextBox_Num.text,size:[15.75,19.5],alignment:4,lineAlignment:2,direct:true,sourceSize:true,topLeft:true});
  const visibleOptions=structuredClone(selected.options);delete visibleOptions.overrides.PageTitleNumB02;
  assert.equal(renderer.draw(canvas().getContext(),'row','row',visibleOptions),false,'without the source hide B02 reaches its missing texture');
  assert.ok(renderer.diagnostics.some(message=>message.includes('Missing native texture BtnLngSelBase01.bclim')));
 }finally{globalThis.document=previous;renderer.dispose();f.renderer.dispose();}
});

test('selected centered number and its parent reject unsupported replacements before LCD drawing',()=>{
 const num=layout=>nativePaneParentPath(layout,'TextBox_Num').at(-1);
 const parent=layout=>nativePaneParentPath(layout,'TextBox_Num').at(-2);
 const edits=[
  f=>{parent(f.source).children=[];},
  f=>{parent(f.source).children.push(structuredClone(num(f.source)));},
  f=>{num(f.source).kind='pan1';},
  f=>{num(f.source).flags=0;},
  f=>{num(f.source).alpha=254;},
  f=>{num(f.source).origin=3;},
  f=>{num(f.source).unsupported=['unknown'];},
  f=>{num(f.source).translation[0]=1;},
  f=>{num(f.source).rotation[2]=1;},
  f=>{num(f.source).scale[0]=2;},
  f=>{num(f.source).size[0]=89;},
  f=>{num(f.source).text.value='1';},
  f=>{num(f.source).text.callName='replacement';},
  f=>{num(f.source).text.unknown=0;},
  ...['font','material','alignment','lineAlignment','characterSpacing','lineSpacing','flags','capacity','length'].map(field=>f=>{num(f.source).text[field]++;}),
  f=>{num(f.source).text.size[0]=16;},
  f=>{num(f.source).text.size[1]=20;},
  f=>{num(f.source).text.topColor[3]=254;},
  f=>{num(f.source).text.bottomColor[0]=254;},
  ...['messageStyle','colorSpans','glyphScaleSpans','fixedWidthSpans','cursorAdvances','lineAdvanceScales','multilineBlockOrigin','singleLineBlockOrigin'].map(field=>f=>{num(f.source).text[field]=[];}),
  f=>{parent(f.source).translation[1]=1;},
  f=>{parent(f.source).size[1]=31;},
  f=>{parent(f.source).scale[0]=2;},
  f=>{parent(f.source).picture.material=2;},
  f=>{parent(f.source).picture.colors[0][3]=254;},
  f=>{parent(f.source).picture.uvSets[0][2]=1;},
  f=>{f.source.materials[2].bufferColor[0]=1;},
  f=>{f.source.materials[2].constantColors[5][3]=254;},
  f=>{f.source.materials[2].textureMaps=[{}];},
  f=>{f.source.materials[2].unknown=0;},
  f=>{f.source.materials[1].textureMaps[0].magFilter=0;},
  f=>{f.source.materials[1].textureMatrices[0].translation[0]=1;},
  f=>{f.source.materials[1].coordinateGenerators[0].reserved=1;},
  f=>{f.source.materials[1].bufferColor[0]=1;},
  f=>{f.source.textures[2]='replacement.bclim';},
 ];
 for(const [index,edit] of edits.entries()){
  const f=fixture();edit(f);assert.throws(f.paint,/Unsupported Manual Contents TextBox_Num source/,`number mutation ${index}`);
  assert.equal(f.calls.length,0);f.renderer.dispose();
 }
});

test('cached centered number parents and Wait pose revalidate on every paint',()=>{
 const edits=[
  f=>{nativePaneParentPath(f.renderer.packs['manual-row'].layouts.ManualRowImportant,'TextBox_Num').at(-1).text.alignment=0;},
  f=>{f.renderer.packs['manual-row'].layouts.ManualRowGettingStarted.materials[1].bufferColor[0]=0;},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.find(track=>track.target==='PageTitleNumBase'&&track.property==='translation.x').keys[0].value=-119;},
  f=>{f.renderer.packs['manual-row'].animations.BtnHeadLineTxt_Wait.tracks.find(track=>track.target==='PageTitleNumBase'&&track.property==='alpha').keys[0].value=254;},
 ];
 for(const edit of edits){const f=fixture();assert.equal(f.paint(),true);f.calls.length=0;edit(f);assert.throws(f.paint,/Unsupported Manual Contents TextBox_Num source/);assert.equal(f.calls.length,0);f.renderer.dispose();}
});

const sourceRoot=process.env.MANUAL_ROW_SOURCE_ROOT;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('optional pinned original Manual NCCH links row constructor, plain writer and flags-zero render path',{skip:!sourceRoot},()=>{
 const provenance=JSON.parse(readFileSync(join(sourceRoot,'recovery-provenance.json'),'utf8'));
 const original=readFileSync(provenance.original),compressed=readFileSync(join(sourceRoot,'code-compressed.bin')),code=readFileSync(join(sourceRoot,'code.bin'));
 assert.deepEqual([provenance.titleId,provenance.version,provenance.contentIndex,provenance.contentId],['0004003000009b02',5120,0,'0000000a']);
 assert.equal(sha(original),'c493384988edd28b723b69b77f8406eaca4cf54e55446f4f5977a40e0d70c92a');
 assert.equal(compressed.length,498224);assert.equal(sha(compressed),'6845e51675c92959641494eff1f68d2aadfd78096777bebe6eff0e246489a5a8');
 assert.deepEqual(original.subarray(0x2e00,0x2e00+498224),compressed);
 const supplement=JSON.parse(readFileSync(join(sourceRoot,'recovery-provenance-ncch-relation-supplement.json'),'utf8'));
 assert.deepEqual([supplement.ncchMember.memberAbsoluteOffset,supplement.ncchMember.compressedBytes,supplement.ncchMember.embeddedSliceEqualsRecoveredCompressed],[0x2e00,498224,true]);
 assert.equal(supplement.previousProvenance.sha256,sha(readFileSync(join(sourceRoot,'recovery-provenance.json'))));
 assert.deepEqual(supplement.proofBoundary.unicornAttempt,{exitCode:132,signal:'SIGILL',originalArmExecutionEstablished:false});
 assert.equal(code.length,847872);assert.equal(sha(code),'cf4658f9f618a41f8d32ff7aed40d0ea565da78a2ace349cb93698ff5f7df5d8');
 const word=address=>code.readUInt32LE(address-0x100000),cstring=address=>code.subarray(address-0x100000).toString('utf8').split('\0')[0];
 const branch=(address)=>{const instruction=word(address);assert.equal(instruction>>>24,0xeb);return address+8+((instruction<<8)>>6);};
 assert.equal(branch(0x13d0f8),0x1700f4);assert.equal(word(0x1b8284),0x170220);
 const hideInstructions=[
  [0x17016c,0xe5940008],[0x170170,0xe28f102c],[0x170174,0xebffb429],
  [0x170178,0xe5d010b7],[0x17017c,0xe20110fe],[0x170180,0xe5c010b7],
  [0x17c0a0,0xe5d50008],[0x17c0a4,0xe5c400b7],
 ];
 const assertOriginalHide=bytes=>{
  const read=address=>bytes.readUInt32LE(address-0x100000);
  for(const [address,instruction]of hideInstructions)assert.equal(read(address),instruction);
  const call=read(0x170174);assert.equal(0x170174+8+((call<<8)>>6),0x15d220);
  const literal=0x170170+8+(read(0x170170)&0xfff);assert.equal(literal,0x1701a4);
  assert.equal(bytes.subarray(literal-0x100000).toString('utf8').split('\0')[0],'PageTitleNumB02');
 };
 assertOriginalHide(code);
 for(const [address]of hideInstructions){const mutation=Buffer.from(code);mutation.writeUInt32LE((word(address)^1)>>>0,address-0x100000);assert.throws(()=>assertOriginalHide(mutation),assert.AssertionError);}
 for(const instruction of [0xe3811001,0xe1a00000]){
  const mutation=Buffer.from(code);mutation.writeUInt32LE(instruction,0x17017c-0x100000);assert.throws(()=>assertOriginalHide(mutation),assert.AssertionError,'show/no-op is not the original visibility clear');
 }
 const wrongName=Buffer.from(code);wrongName[0x1701a4-0x100000]=0x52;assert.throws(()=>assertOriginalHide(wrongName),assert.AssertionError);
 for(const [lo,hi,hash]of [[0x17016c,0x170184,'be62a1e979ad30595d5daf0ec65ba3dab039bc720a7302e9cf7ef5fabb0b7e01'],[0x1700f4,0x170188,'0aea0a14d89b1979c43ffdc3ba05315971a902fe50afb4cd19bf67d8a17411fe'],[0x17c094,0x17c0b0,'25e4bad1ee8ed81d3a265a8310df28700aa117d7cd60b3461a16adcb23fc2f65']])assert.equal(sha(code.subarray(lo-0x100000,hi-0x100000)),hash);
 assert.equal(word(0x17030c),0x1c180c);assert.equal(cstring(word(0x1c180c)),'TextBox_Txt');
 assert.equal(cstring(word(0x1c1810)),'TextBox_Num');assert.equal(branch(0x1702c8),0x14a2c4);assert.equal(branch(0x1702f0),0x14a1cc);
 assert.equal(sha(code.subarray(0x170220-0x100000,0x170308-0x100000)),'2365a1dd2d222ffc76b764f078dc94656c80fc3a3d48716dde6cbdc99245eabd');
 assert.equal(sha(code.subarray(0x14a1cc-0x100000,0x14a24c-0x100000)),'c03367c37fa8cf732ebbceb4a7a4ebce5b177da7cadaa6bfea42ab98b2fab30b');
 assert.equal(word(0x1702cc),0xe594004c);assert.equal(word(0x1702d8),0xe2803001,'the original number is page + 1');
 assert.equal(word(0x1702d0),0xe28f2038);assert.equal(code.subarray(0x170310-0x100000,0x170316-0x100000).toString('utf16le'),'%d\0');
 assert.equal(branch(0x1702e0),0x157f38);assert.equal(branch(0x14a1d4),0x15d398);assert.equal(branch(0x14a210),0x165728);
 assert.equal(nativeTextWriterFlags(4,2),0x111,'the plain number retains the original centered writer');
 assert.equal(word(0x1b6d80),0x1a5090);assert.equal(word(0x19aa10),0xe585005c,'original str r0,[r5,#0x5c]');
 assert.equal(nativeTextWriterFlags(0,0),0);assert.notEqual(nativeTextWriterFlags(4,2),0);
 const constructorInstructions=[
  [0x17c6bc,0xe1c506d4,'ldrd r0,r1,[r5,#0x64]: source font size'],
  [0x17c6c0,0xe1c40ef4,'strd r0,r1,[r4,#0xe4]: retained TextBox font size'],
  [0x17c6c4,0xe5d50054,'ldrb r0,[r5,#0x54]: source alignment'],
  [0x17c6c8,0xe5c400fc,'strb r0,[r4,#0xfc]: retained alignment'],
  [0x17c6cc,0xe5d400fd,'ldrb r0,[r4,#0xfd]: original TextBox flags'],
  [0x17c6d0,0xe5d51055,'ldrb r1,[r5,#0x55]: source line alignment'],
  [0x17c6d4,0xe3c00003,'bic r0,r0,#3: replace only line-alignment bits'],
  [0x17c6d8,0xe2011003,'and r1,r1,#3: original line-alignment mask'],
  [0x17c6dc,0xe1800001,'orr r0,r0,r1'],
  [0x17c6e0,0xe5c400fd,'strb r0,[r4,#0xfd]: retained line alignment'],
  [0x17c6e4,0xe595006c,'ldr r0,[r5,#0x6c]: source character spacing'],
  [0x17c6e8,0xe58400f0,'str r0,[r4,#0xf0]: retained character spacing'],
  [0x17c6ec,0xe5950070,'ldr r0,[r5,#0x70]: source line spacing'],
  [0x17c6f0,0xe58400ec,'str r0,[r4,#0xec]: retained line spacing'],
 ];
 const renderBranches=[[0x1a5100,0x19aacc],[0x19aaf4,0x19a910],[0x19ab18,0x1ab71c],[0x1ab750,0x1ab778],[0x1ab7dc,0x1ab4d0]];
 const assertConstructorAndRender=bytes=>{
  const read=address=>bytes.readUInt32LE(address-0x100000);
  for(const [address,expected,meaning] of constructorInstructions)assert.equal(read(address),expected,meaning);
  for(const [address,target] of renderBranches){
   const instruction=read(address);assert.equal(instruction>>>24,0xeb,'original unconditional BL');
   assert.equal(address+8+((instruction<<8)>>6),target,`render edge ${address.toString(16)}`);
  }
 };
 assertConstructorAndRender(code);
 for(const [address] of [...constructorInstructions,...renderBranches]){
  const mutation=Buffer.from(code);mutation.writeUInt32LE((word(address)^1)>>>0,address-0x100000);
  assert.throws(()=>assertConstructorAndRender(mutation),assert.AssertionError,`changed original instruction ${address.toString(16)} is rejected`);
 }
 for(const [lo,hi,expected] of [[0x17c604,0x17c71c,'c9e435177a1e8403a3dc058737cc3fde62209ad87db1e9392ba2c5dda590a94a'],[0x1a5090,0x1a5120,'30608f28451cc5b16772dc1ea79e0de84bee2ab859ba3ab332299ea6d6a9c865'],[0x19aacc,0x19ab64,'06cfe62575c1617cf23ea2ff1843966225c67cc3b2550c1a1043944210653e8b'],[0x1ab71c,0x1ab7e0,'984ee09b26a600d44770d9e5a2afe71ba24d0d75b8b4b9b650b96b748c452b5a']])assert.equal(sha(code.subarray(lo-0x100000,hi-0x100000)),expected);
 for(const [lo,hi,expected] of [[0x13cec0,0x13d120,'b34c1e480e23c1e25a6e3186c4c633722e742bfc81539f25130eddac5dc6a333'],[0x170080,0x170250,'ced7925fdafba5653d1b40519d49f6655cc0e943ab065b14e014c696aa0d5ae1'],[0x14a180,0x14a384,'acdcc3520ba19007c57b6200c69306ba56701589105dae9e0609d18fc891c2e5'],[0x19a910,0x19aa8c,'82f30d892d3e896687b9ce30369a04f378cee5fbae0543056d8c4b093bc5589a'],[0x1ab4d0,0x1ab71c,'a506c8147a77e2d9f76cd15d05f10eadc402add13730090f13e70ae2cdc9d694'],[0x1a1e0c,0x1a1edc,'78101f5f004acf8fff69dc65475278dd23ab1c039e9b083c7e61df2d3e64a773'],[0x1a1980,0x1a1c68,'da01b23039fa9c8f1be65be5152487d8cf544111eed0e0cfaa97ce0267f603e8']])assert.equal(sha(code.subarray(lo-0x100000,hi-0x100000)),expected);
 // Byte/branch decoding and mutation checks only, not original ARM execution.
 // The historical Unicorn attempt exited SIGILL; native/GPU fidelity remains open.
});
