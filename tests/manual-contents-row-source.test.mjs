import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import ts from 'typescript';
import {nativePaneParentPath,poseNativeLayout} from '../src/os/native-layout.ts';
import {nativeTextWriterFlags} from '../src/os/bitmap-font.ts';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const amiibo=moduleUrl('export const drawNativeAmiibo=()=>false;export const amiiboScreenPacks=[];');
const compile=name=>{
 const url=new URL(`../src/os/${name}.ts`,import.meta.url),source=readFileSync(url,'utf8');
 return moduleUrl(source.replace(/(from\s*['"])(\.[^'"]+?)(['"])/g,(_all,prefix,path,suffix)=>prefix+(path==='./stock-native-amiibo'?amiibo:new URL(`${path}.ts`,url).href)+suffix));
};
const {drawNativeHelperFrame,nativeHelperView}=await import(compile('stock-native-helpers'));
const {NativeLayoutRenderer}=await import(compile('native-renderer'));
const settings='0004001000022000',camera='0004001000022400',browser='0004003000009d02';
const row=layout=>nativePaneParentPath(layout,'TextBox_Txt').at(-1);
const body=layout=>nativePaneParentPath(layout,'TextBox_Txt')[1];
const identity=()=>({a:1,b:0,c:0,d:1,e:0,f:0});
function fixture(titleId=camera){
 const view={appId:'manual',screen:'main',heading:'',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},data:{manualTitleId:titleId}};
 const packs=Object.fromEntries(nativeHelperView(view).packs.map(request=>[request.alias,json(request.url)]));
 const font={manifest:json('fonts/shared/font.json')},fonts=new Map([['cbf_std.bcfnt',font]]);
 const renderer=new NativeLayoutRenderer(packs,{},fonts),calls=[];
 // Record the transport only; resource, font binding and preparation are real.
 renderer.draw=(context,pack,layout,options)=>{calls.push({context,pack,layout,options});return true;};
 const context={fillStyle:'',fillRect(){},getTransform:identity};
 return {view,renderer,calls,context,font,fonts,source:packs['manual-row'].layouts.BtnHeadLineTxt,
  paint:()=>drawNativeHelperFrame(renderer,context,context,view)};
}

test('row source identity stays in the existing published Manual pack and shared original font',()=>{
 const bytes=readFileSync(new URL('packs/manual/layout-BtnHeadLineTxt.json',root)),pack=JSON.parse(bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'9c0c0fb055d3b15311c0f0210bf3a89314c64edfab54a7596adc3878e1a3ca7a');
 assert.equal(pack.titleId,'0004003000009b02');assert.equal(pack.sourceSha256,'8c06c951ba9740058c438b69cc52c4b4bf9e2f53102b73dc8b34aad40845a1f6');
 assert.deepEqual(pack.resourceSources.layouts.BtnHeadLineTxt,{path:'layout/BtnHeadLineTxt.arc/blyt/BtnHeadLineTxt.bclyt',sha256:'c41c54be9f004b98714ff8b9dc941b09386de50cd9215894d1ac6fe95181dca2',titleId:pack.titleId});
 assert.deepEqual(pack.resourceSources.animations.BtnHeadLineTxt_Wait,{path:'layout/BtnHeadLineTxt.arc/anim/BtnHeadLineTxt_Wait.bclan',sha256:'048be32112420819a2e8bdd8693a33c3dac618adcb34b6f80c2f86e3311bcff3',titleId:pack.titleId});
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
  assert.deepEqual(Object.keys(call.options.overrides),['TextBox_Num','TextBox_Txt']);
  assert.deepEqual(Object.keys(call.options.overrides.TextBox_Txt),['text']);
  assert.ok(!/[\r\n]/.test(call.options.overrides.TextBox_Txt.text));
  const layout=f.renderer.packs['manual-row'].layouts[call.layout],posed=poseNativeLayout(layout,f.renderer.packs['manual-row'].animations,call.options.bindings,call.options.overrides);
  assert.equal(body(layout).translation[1],2,'existing body fit is unchanged');
  assert.equal(body(posed).translation[1],3,'original Wait track is not fitted or rewritten');
  assert.deepEqual(row(posed).translation,row(f.source).translation);
  assert.deepEqual(row(posed).text.size,[17.5,21]);assert.equal(nativeTextWriterFlags(row(posed).text.alignment,row(posed).text.lineAlignment),0);
  const number=nativePaneParentPath(posed,'TextBox_Num').at(-1).text;
  assert.deepEqual([number.alignment,number.lineAlignment,number.size],[4,2,[15.75,19.5]]);
 }
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

test('real renderer keeps the row title left and the number centered on direct glyph sampling',()=>{
 const f=fixture();assert.equal(f.paint(),true);const selected=f.calls.find(call=>call.pack==='manual-row');
 const layout=structuredClone(f.renderer.packs['manual-row'].layouts[selected.layout]);
 // Isolate glyph transport from unrelated source pictures; keep hierarchy and both text panes.
 const strip=panes=>{for(const pane of panes){delete pane.picture;delete pane.window;strip(pane.children);}};strip(layout.roots);
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
