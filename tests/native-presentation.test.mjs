import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
import sharp from 'sharp';
const source=readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8');
const api=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
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

test('per-control animation binding cannot animate unrelated groups',()=>{
 const l=layout();l.groups.push({name:'other',panes:['unrelated'],children:[]});
 const animation={frames:2,loop:false,childBinding:true,groups:['selection','other'],textures:[],tracks:[track('selected',2),track('unrelated',4)]};
 const posed=poseNativeLayout(l,{clip:animation},[{name:'clip',frame:1,groups:['selection']}]);
 assert.equal(posed.roots[0].children[0].translation[0],2);assert.equal(posed.roots[0].children[1].translation[0],0);
 const unbound=poseNativeLayout(l,{clip:animation},[{name:'clip',frame:1,groups:['missing']}]);assert.equal(unbound.roots[0].children[0].translation[0],0);
});
test('real HOME toolbar presses bind only the selected control', {skip:!available},()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/launcher.json'))),original=pack.layouts.LncBase_D_01;
 const posed=poseNativeLayout(original,pack.animations,[{name:'LncBase_D_01_Select',frame:1,groups:['G_Memo_00']}]);
 const panes=[];const visit=items=>items.forEach(p=>{panes.push(p);visit(p.children);});visit(posed.roots);
 assert.equal(panes.find(p=>p.name==='P_Memo_10').translation[1],-2);assert.equal(panes.find(p=>p.name==='P_Frd_10').translation[1],0);
});

test('message styles replace font metrics and spacing without interpreting unresolved words',()=>{
 const l=layout(),text={font:0,material:0,value:'original',size:[17,21],alignment:4,lineAlignment:0,characterSpacing:2,lineSpacing:3,topColor:[1,2,3,255],bottomColor:[4,5,6,255]};
 l.roots[0].children[0].text=text;
 const style={fontScale:[.6,.8],characterSpacing:4,lineSpacing:-5,unresolvedWords:{0:999,12:2}};
 const posed=poseNativeLayout(l,{},[],{selected:{text:'styled',messageStyle:style}}),result=posed.roots[0].children[0].text;
 assert.deepEqual(api.nativeTextMetrics(result,{width:20,height:30}),{size:[12,24],characterSpacing:4,lineSpacing:-5});
 assert.equal(result.alignment,4);assert.equal(result.lineAlignment,0);assert.deepEqual(result.topColor,text.topColor);assert.equal(result.font,0);
 assert.equal(l.roots[0].children[0].text.value,'original');assert.equal(l.roots[0].children[0].text.messageStyle,undefined);
 result.messageStyle.fontScale[0]=9;assert.equal(style.fontScale[0],.6);
 assert.deepEqual(api.nativeTextMetrics(text,{width:20,height:30}),{size:[17,21],characterSpacing:2,lineSpacing:3});
});
test('message style lookup uses the bank full path and leaves null styles untouched',()=>{
 const hudStyle={fontScale:[1,1],characterSpacing:0,lineSpacing:0},homeStyle={fontScale:[.7,.7],characterSpacing:1,lineSpacing:2};
 const pack={messages:{hud:{labels:{date:0,day:1},styleTable:'message_hud/EU_English/RI_mstl_LZ.bin',messages:[{text:'%d',styleIndex:0},{text:'22',styleIndex:null}]},home:{labels:{open:0},styleTable:'message/EU_English/RI_mstl_LZ.bin',messages:[{text:'Open',styleIndex:0}]}},styles:{'message_hud/EU_English/RI_mstl_LZ.bin':{styles:[hudStyle]},'message/EU_English/RI_mstl_LZ.bin':{styles:[homeStyle]}}};
 assert.deepEqual(api.nativeMessageOverride(pack,'hud','date',''),{text:'%d',messageStyle:hudStyle});
 assert.deepEqual(api.nativeMessageOverride(pack,'home','open',''),{text:'Open',messageStyle:homeStyle});
 assert.deepEqual(api.nativeMessageOverride(pack,'hud','day',''),{text:'22'});
 assert.deepEqual(api.nativeMessageOverride(pack,'hud','missing','fallback'),{text:'fallback'});
 delete pack.styles['message_hud/EU_English/RI_mstl_LZ.bin'];assert.throws(()=>api.nativeMessageOverride(pack,'hud','date',''),/Missing native message style/);
});
test('native CLTS bounds skip an unallocated matrix without remapping to matrix zero',()=>{
 const l=layout(),m=material();m.name='animated';m.textureMatrices=[{translation:[.25,.5],rotation:0,scale:[1,1]}];l.materials=[m];
 const animation={frames:1,loop:false,groups:[],textures:[],tracks:[{target:'animated',binding:'material',property:'texture.translation.x',index:1,interpolation:'hermite',keys:[{frame:0,value:0},{frame:1,value:9}]}]};
 const posed=poseNativeLayout(l,{clip:animation},[{name:'clip',frame:1}]);assert.deepEqual(posed.materials[0].textureMatrices,m.textureMatrices);
 assert.deepEqual(api.nativeAnimationDiagnostics(l,animation),['Native CLTS skip: unallocated texture matrix animated[1] texture.translation.x']);
});
test('real HOME message styles use the actual HUD and shared font metrics',{skip:!available},()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/messages-and-loose.json')));
 const shared=JSON.parse(readFileSync(resolve(resourceRoot,'fonts/shared/font.json'))),hud=JSON.parse(readFileSync(resolve(resourceRoot,'fonts/hud/font.json')));
 const original={size:[99,99],characterSpacing:9,lineSpacing:9};
 for(const [bank,label,font,size] of [['hud_msbt_LZ','lau_connect4',shared,[12.5,15]],['hud_msbt_LZ','lau_date',hud,[16,16]],['menu_msbt_LZ','lau_2b_folder_open',shared,[17.5,21]],['menu_msbt_LZ','lau_2b_close',shared,[17.5,21]]]){
  const override=api.nativeMessageOverride(pack,bank,label,''),metrics=api.nativeTextMetrics({...original,...override},font);
  assert.ok(metrics.size.every((v,i)=>Math.abs(v-size[i])<.00001));assert.equal(metrics.characterSpacing,0);assert.equal(metrics.lineSpacing,0);
 }
 const resume=api.nativeMessageOverride(pack,'menu_msbt_LZ','lau_2b_restart','');assert.equal(resume.text,'\ue073 Resume');assert.ok(shared.glyphs[String(0xe073)]);
 assert.equal(api.nativeMessageOverride(pack,'hud_msbt_LZ','day_22','').messageStyle,undefined);
});
