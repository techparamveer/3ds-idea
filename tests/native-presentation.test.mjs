import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
import sharp from 'sharp';
const source=readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8');
const api=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const {sampleNativeTrack,poseNativeLayout,boundAnimationTracks,evaluateNativeMaterial,sampleNativeTexture,rasterNativePicture,nativeWindowPatches,transformNativeUV,interpolateNativeQuad,nativeWhite}=api;
const combiner=(mode=0,sources=[0,0,0],operands=[0,0,0])=>({mode,sources,operands,scale:1,savePrevious:false});
const material=()=>({name:'test',bufferColor:[0,0,0,0],constantColors:Array.from({length:6},()=>[255,255,255,255]),textureMaps:[],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]});
const pane=(name,children=[])=>({kind:'pan1',name,flags:1,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[20,20],children});
const layout=()=>({canvas:{width:320,height:240,origin:1},roots:[pane('root',[pane('selected',[pane('child')]),pane('unrelated')])],materials:[],textures:[],fonts:[],groups:[{name:'selection',panes:['selected'],children:[]}],unsupported:[]});
test('native picture corners interpolate across the LT–RB triangle diagonal',()=>{
 const corners=[10,90,20,30];
 assert.equal(interpolateNativeQuad(corners,.25,.75,1)[0],20,'lower triangle excludes the bright upper-right corner');
 assert.equal(interpolateNativeQuad(corners,.75,.25,1)[0],55,'upper triangle includes the bright upper-right corner');
 assert.equal(interpolateNativeQuad(corners,.5,.5,1)[0],20,'the shared diagonal contains only LT and RB');
});
const track=(target,value)=>({target,binding:'pane',property:'translation.x',index:0,component:0,interpolation:'step',keys:[{frame:0,value}]});
test('native folder glyph compositor retains RGBA4444 coverage, ordered outline distances and hidden RGB',()=>{
 const mask={width:32,height:32,data:new Uint8ClampedArray(4096)};
 const at=(x,y)=>(y*32+x)*4,pixel=(image,x,y)=>[...image.data.slice(at(x,y),at(x,y)+4)];
 mask.data[at(16,16)+2]=255;
 const original=mask.data.slice(),glyph=api.nativeFolderGlyphPixels(mask);
 assert.deepEqual(pixel(glyph,16,16),[85,85,85,221]);
 assert.deepEqual(pixel(glyph,15,16),[255,255,255,204]);
 assert.deepEqual(pixel(glyph,14,15),[255,255,255,153]);
 assert.deepEqual(pixel(glyph,14,14),[255,255,255,34]);
 assert.deepEqual(pixel(glyph,13,16),[204,221,238,0]);
 assert.deepEqual(mask.data,original);
 mask.data.fill(0);mask.data[at(0,0)+2]=8;
 const edge=api.nativeFolderGlyphPixels(mask);
 assert.deepEqual(pixel(edge,0,0),[238,238,238,221]);
 assert.deepEqual(pixel(edge,1,0),[255,255,255,204]);
 assert.deepEqual(pixel(edge,2,0),[255,255,255,17]);
 assert.deepEqual(pixel(edge,2,2),[204,221,238,0]);
 mask.data.fill(0);mask.data[at(16,16)+2]=7;
 assert.ok(api.nativeFolderGlyphPixels(mask).data.every((v,i)=>v===[204,221,238,0][i%4]));
 assert.throws(()=>api.nativeFolderGlyphPixels({...mask,width:31}),/Invalid native folder glyph mask/);
});
test('per-pane texture sampler bindings keep shared materials independent and preserve native UV sets',()=>{
 const l=layout(),a=l.roots[0].children[0],b=l.roots[0].children[1],m=material();
 l.textures=['dummy'];m.textureMaps=[{texture:0},{texture:0}];l.materials=[m];
 a.picture={material:0,colors:nativeWhite,uvSets:[[0,0,1,0,0,1,1,1]]};b.picture=structuredClone(a.picture);
 const before=JSON.stringify(l);
 const posed=poseNativeLayout(l,{},[],{selected:{textureBindings:{0:'glyph',1:'mask'}}}),p=posed.roots[0].children[0];
 assert.deepEqual(posed.materials[p.picture.material].textureMaps.map(t=>posed.textures[t.texture]),['glyph','mask']);
 assert.equal(posed.roots[0].children[1].picture.material,0);assert.deepEqual(posed.materials[0].textureMaps.map(t=>t.texture),[0,0]);
 assert.deepEqual(p.picture.uvSets,a.picture.uvSets);assert.equal(JSON.stringify(l),before);
 assert.throws(()=>poseNativeLayout(l,{},[],{selected:{textureBindings:{2:'missing'}}}),/Missing native texture sampler/);
});
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
test('four-frame window geometry and UVs match original ARM execution, including unequal corner sizes',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/native-four-frame-window.json',import.meta.url)));
 for(const sample of fixture.cases){
  const l=layout(),textures=new Map();l.materials=[material()];l.textures=[];
  sample.textureSizes.forEach(([width,height],i)=>{const m=material();m.name=`frame${i}`;m.textureMaps=[{texture:i,wrapS:0,wrapT:0,magFilter:0}];l.materials.push(m);l.textures.push(m.name);textures.set(m.name,{width,height,data:new Uint8ClampedArray(width*height*4)});});
  const w={...pane('four'),size:sample.size,window:{content:{material:0,colors:nativeWhite,uvSets:[]},frames:[1,2,3,4].map(material=>({material,flip:0})),flags:0}};
  const before=JSON.stringify(l),patches=nativeWindowPatches(w,l,textures);
  assert.equal(patches.length,sample.draws.length);
  patches.forEach((p,i)=>{const native=sample.draws[i];assert.deepEqual([p.width,p.height],native.size);assert.deepEqual([p.x,p.y],native.position.map((v,j)=>j===1?Math.abs(v):v));if(i){assert.equal(p.picture.material,native.material+1);assert.deepEqual(p.picture.uvSets[0],native.uv);}});
  assert.equal(JSON.stringify(l),before);
 }
});
test('four-frame TextureOnly corners retain the preceding full material state while binding their own textures',()=>{
 const l=layout(),content=material(),full=material(),texture=material(),textures=new Map([['frame',{width:8,height:8,data:new Uint8ClampedArray(256).fill(255)}]]);
 full.name='full';full.constantColors[0]=[20,40,60,255];full.textureMaps=[{texture:0,wrapS:0,wrapT:0,magFilter:0}];full.colorBlend={operation:1,sourceFactor:4,destinationFactor:5};
 texture.name='texture-only';texture.textureOnly=true;texture.textureMaps=[...full.textureMaps];texture.textureMatrices=[{translation:[.25,.25],scale:[-1.5,1.5],rotation:0}];
 l.materials=[content,full,texture];l.textures=['frame'];
 const w={...pane('four'),size:[40,30],window:{content:{material:0,colors:nativeWhite,uvSets:[]},frames:[1,2,2,2].map(material=>({material,flip:0})),flags:0}};
 const patches=nativeWindowPatches(w,l,textures),effective=patches[2].material;
 assert.deepEqual(effective.constantColors,full.constantColors);assert.equal(effective.colorBlend,full.colorBlend);assert.equal(effective.textureMatrices,texture.textureMatrices);
 assert.deepEqual([...rasterNativePicture(l,patches[2].picture,1,1,textures,1,effective).data],[20,40,60,255]);assert.deepEqual(texture.constantColors[0],[255,255,255,255]);
});
const resourceRoot=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E');
const available=existsSync(resolve(resourceRoot,'packs/home/launcher.json'));
test('real balloon preserves parent/child positioning, pointer anchors and authored fade resources',{skip:!available},()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/launcher.json'))),original=pack.layouts.LncBlln_00;
 const base=original.roots[0].children[0],body=base.children[0];
 assert.equal(base.name,'N_Base_00');assert.equal(base.flags&2,2);
 assert.deepEqual([body.name,body.translation],['N_LR_00',[-0,-6,0]]);
 assert.deepEqual(base.children.slice(1).map(p=>[p.name,p.translation,p.size]),[
  ['P_PntShdw_00',[0,9,0],[16,26]],['P_Pnt_00',[0,9,0],[16,21]]
 ]);
 const text=body.children.find(p=>p.name==='T_Blln_00');
 assert.deepEqual([text.translation,text.size],[[0,46,0],[248,56]]);
 for(const [name,frames,values] of [['Appear',6,[0,255]],['DisAppear',6,[255,0]],['SceneIn',11,[0,255]],['SceneOut',11,[255,0]]]){
  const clip=pack.animations['LncBlln_00_'+name];
  assert.deepEqual([clip.frames,clip.loop,clip.childBinding,clip.groups],[frames,false,true,['G_Scene_00']]);
  assert.equal(clip.tracks.length,1);const track=clip.tracks[0];
  assert.deepEqual([track.target,track.property,track.interpolation],['N_Base_00','alpha','hermite']);
  assert.deepEqual(track.keys,[{frame:0,slope:0,value:values[0]},{frame:frames-1,slope:0,value:values[1]}]);
  assert.equal(sampleNativeTrack(track,(frames-1)/2),127.5);
 }
 for(const [anchor,offset,worldBody] of [[-84,76,-8],[0,0,0],[4,4,8],[84,-76,8]]){
  const posed=poseNativeLayout(original,pack.animations,[{name:'LncBlln_00_Appear',frame:5}],{
   N_Base_00:{translation:[anchor,0,0]},N_LR_00:{translation:[offset,-6,0]}
  }),base=posed.roots[0].children[0],body=base.children[0];
  assert.equal(base.alpha,255);assert.equal(base.translation[0]+body.translation[0],worldBody);
  assert.equal(base.translation[1]+body.translation[1]+text.translation[1],40);
  assert.ok(base.children.slice(1).every(p=>p.translation[0]===0&&p.translation[1]===9));
  assert.deepEqual(body.children,original.roots[0].children[0].children[0].children);
 }
 assert.deepEqual(base.translation,[0,0,0]);assert.deepEqual(body.translation,[-0,-6,0]);
});
test('real folder glyph target and stationary/pickup materials retain native metrics and RGBA under an alpha-only mask',{skip:!available},()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/launcher.json'))),target=pack.layouts.LncIconFolderText_00;
 const text=target.roots[0].children.find(p=>p.name==='T_Icon_00');
 assert.deepEqual([target.canvas.width,target.canvas.height,text.size,text.text.size,text.text.alignment,text.text.lineAlignment],[32,32,[30,30],[25,30],4,2]);
 assert.equal(pack.textures['IconMask.bclim'].picaFormat,11);
 const glyph=[85/255,85/255,85/255,221/255],mask=[0,0,0,1];
 for(const name of ['LncIconDist_01','LncIconFolderPickUp_00']){
  const material=pack.layouts[name].materials.find(m=>m.name==='P_Icon_00');
  const result=evaluateNativeMaterial(material,[glyph,mask,[.1,.2,.3,.4]]);
  result.forEach((value,i)=>assert.ok(Math.abs(value-glyph[i])<1e-12,`${name}/${i}`));
  assert.equal(evaluateNativeMaterial(material,[[.8,.8,.8,0],mask,[1,1,1,1]])[3],0);
 }
});
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
 assert.deepEqual(api.blendNativePixel([.2,.4,.6,0],[.5,.5,.5,1],{operation:1,sourceFactor:2,destinationFactor:0}),[.1,.2,.3,0]);
 assert.deepEqual(api.blendNativePixel([1,0,0,.5],[0,0,1,1],{operation:1,sourceFactor:4,destinationFactor:5}),[.5,0,.5,.75]);
 assert.deepEqual(api.blendNativePixel([.25,.25,.25,1],[.5,.5,.5,1],{operation:2,sourceFactor:1,destinationFactor:1}),[0,0,0,0]);
 assert.deepEqual(api.blendNativePixel([.25,.25,.25,1],[.5,.5,.5,1],{operation:3,sourceFactor:1,destinationFactor:1}),[.25,.25,.25,0]);
 assert.equal(api.nativeMultiplyBlend({operation:1,sourceFactor:2,destinationFactor:0}),true);
 assert.equal(api.nativeMultiplyBlend({operation:1,sourceFactor:4,destinationFactor:5}),false);
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
test('HOME Power newline advances come from the exact group-1/type-0 scale spans',()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/messages-and-loose.json'))),bank=pack.messages.menu_msbt_LZ;
 const message=bank.messages[bank.labels.lau_press_pow_u1];
 assert.deepEqual(message.tokens.filter(token=>token.control).map(token=>[token.control,token.group,token.type,token.arguments]),[
  [14,1,0,'1400'],[15,1,0,undefined],[14,1,0,'1400'],[15,1,0,undefined],
 ]);
 assert.deepEqual(api.nativeMessageLineAdvanceScales(pack,'menu_msbt_LZ','lau_press_pow_u1'),[1,.2,1,.2,1,1]);

 const invalid=structuredClone(pack);invalid.messages.menu_msbt_LZ.messages[bank.labels.lau_press_pow_u1].tokens[1].arguments='zzzz';
 assert.throws(()=>api.nativeMessageLineAdvanceScales(invalid,'menu_msbt_LZ','lau_press_pow_u1'),/Invalid native line scale/);
 const unbalanced=structuredClone(pack);unbalanced.messages.menu_msbt_LZ.messages[bank.labels.lau_press_pow_u1].tokens.push({control:14,group:1,type:0,arguments:'1400'});
 assert.throws(()=>api.nativeMessageLineAdvanceScales(unbalanced,'menu_msbt_LZ','lau_press_pow_u1'),/Unbalanced native line scale/);
 const glyph=structuredClone(pack),scaled=glyph.messages.menu_msbt_LZ.messages[bank.labels.lau_press_pow_u1];scaled.tokens[2].text='\n x';scaled.text=scaled.tokens.map(token=>token.text??'').join('');
 assert.throws(()=>api.nativeMessageLineAdvanceScales(glyph,'menu_msbt_LZ','lau_press_pow_u1'),/Unsupported native scaled glyph/);
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

test('CLMC samples round and clamp to native bytes in buffer and all six constants',()=>{
 const l=layout(),m=material();m.name='animated';l.materials=[m];const before=structuredClone(m);
 const samples=[-.75,.49,.5,127.49,127.5,254.5,255.75],expected=[0,0,1,127,128,255,255];
 const tracks=samples.map((value,index)=>({target:'animated',binding:'material',property:`materialColor.${index}.${index%4}`,index:0,component:index*4+index%4,interpolation:'step',keys:[{frame:0,value}]}));
 const posed=poseNativeLayout(l,{clip:{frames:1,loop:false,groups:[],textures:[],tracks}},[{name:'clip',frame:0}]);
 const colors=[posed.materials[0].bufferColor,...posed.materials[0].constantColors];
 assert.deepEqual(colors.map((color,index)=>color[index%4]),expected);
 assert.deepEqual(l.materials[0],before);
});
test('CLMC quantizes after interpolation and preserves float32 half-step boundaries',()=>{
 const l=layout(),m=material();m.name='animated';l.materials=[m];
 const animation={frames:1,loop:false,groups:[],textures:[],tracks:[{target:'animated',binding:'material',property:'materialColor.1.0',index:0,component:4,interpolation:'hermite',keys:[{frame:0,value:10,slope:1},{frame:1,value:11,slope:1}]}]};
 const channel=frame=>poseNativeLayout(l,{clip:animation},[{name:'clip',frame}]).materials[0].constantColors[0][0];
 assert.equal(channel(.49),10);assert.equal(channel(.5),11);
 animation.tracks[0].interpolation='step';animation.tracks[0].keys=[{frame:0,value:.4999999701976776}];
 assert.equal(channel(0),1,'the float32 addition rounds this boundary to 1 before truncation');
});

test('TEV uses one composed RGBA constant even when operands cross output channels',()=>{
 const m=material();m.constantColors[0]=[51,102,153,204];m.constantColors[4]=[230,25,50,64];
 m.tevStages=[{constantSelectors:0x51,color:combiner(0,[4,4,4],[2,0,0]),alpha:combiner(0,[4,4,4],[2,0,0])}];
 assert.deepEqual(evaluateNativeMaterial(m,[]),[64/255,64/255,64/255,51/255]);
 m.tevStages[0].color.operands[0]=3;m.tevStages[0].alpha.operands[0]=3;
 assert.deepEqual(evaluateNativeMaterial(m,[]),[1-64/255,1-64/255,1-64/255,1-51/255]);
});
test('constant selector zero references the material buffer independently of TEV feedback',()=>{
 const m=material();m.bufferColor=[25,50,75,100];m.constantColors[0]=[0,0,0,200];
 m.tevStages=[{constantSelectors:0x10,color:combiner(0,[4,4,4]),alpha:combiner(0,[4,4,4])}];
 assert.deepEqual(evaluateNativeMaterial(m,[]),[25/255,50/255,75/255,200/255]);
 m.tevStages.unshift({constantSelectors:0,color:{...combiner(0,[0,0,0]),savePrevious:true},alpha:{...combiner(0,[0,0,0]),savePrevious:true}});
 assert.deepEqual(evaluateNativeMaterial(m,[[1,1,1,1]]),[25/255,50/255,75/255,200/255]);
});
test('real HOME ordinary source and arrow retain rounded alpha and native green',{skip:!available},async()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/launcher.json'))),name='LncIconSetSrc_00';
 const l=poseNativeLayout(pack.layouts[name],pack.animations,[{name:name+'_Scale',frame:1}]);
 const panes=[];const walk=ps=>ps.forEach(p=>{panes.push(p);walk(p.children);});walk(l.roots);
 const plate=panes.find(p=>p.name==='N_IconRoot_00');assert.ok(Math.abs(plate.scale[0]*100-72)<.0001);assert.equal(plate.translation[0],32);
 const pixels=new Map();for(const key of new Set([...l.textures,...pack.layouts.LncArw_00.textures])){const {data,info}=await sharp(resolve(resourceRoot,pack.textures[key].url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});pixels.set(key,{width:info.width,height:info.height,data:new Uint8ClampedArray(data)});}
 const body=panes.find(p=>p.name==='P_Btn_01'),raster=rasterNativePicture(l,body.picture,72,72,pixels);
 assert.equal(raster.data[3],0,'ordinary plate corner must not produce an opaque gray square');
 assert.ok(raster.data[(36*72+36)*4+3]>240,'ordinary plate centre is opaque');
 const arrows=pack.layouts.LncArw_00;panes.length=0;walk(arrows.roots);const arrow=panes.find(p=>p.name==='P_arwIconR_00'),ink=rasterNativePicture(arrows,arrow.picture,16,16,pixels);
 assert.ok(Array.from({length:256},(_,i)=>i*4).some(i=>ink.data[i+3]>250&&ink.data[i+1]>ink.data[i]+20&&ink.data[i+2]>ink.data[i]+15),'native arrow tint must remain green rather than saturate to white');
});

test('Game Notes fitted missing-UV adaptation is scoped and preserves full-raster alpha',{skip:!available},async()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/launcher.json'))),name='LncBase_D_01';
 const l=poseNativeLayout(pack.layouts[name],pack.animations,[{name:name+'_PaletteOut',frame:12},{name:name+'_MvsToggle',frame:0}]);
 const panes=[];const walk=ps=>ps.forEach(p=>{panes.push(p);walk(p.children);});walk(l.roots);
 const memo=panes.find(p=>p.name==='P_Memo_10'),m=l.materials[memo.picture.material];
 assert.equal(m.coordinateGenerators[2].source,1);assert.equal(memo.picture.uvSets.length,1);
 const pixels=new Map();for(const map of m.textureMaps){const texture=l.textures[map.texture],record=pack.textures[texture],{data,info}=await sharp(resolve(resourceRoot,record.url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});pixels.set(texture,api.nativeTextureSamplePixels({width:info.width,height:info.height,data:new Uint8ClampedArray(data)},record.picaFormat));}
 const source=rasterNativePicture(l,memo.picture,36,36,pixels),at=(4*36+20)*4;
 assert.deepEqual([...source.data.slice(at,at+4)],[225,190,0,255]);
 const unit={...memo.picture,uvSets:[...memo.picture.uvSets,[0,0,1,0,0,1,1,1]]},explicit=rasterNativePicture(l,unit,36,36,pixels);
 assert.deepEqual([...explicit.data.slice(at,at+4)],[235,193,0,255]);
 assert.deepEqual(Array.from({length:36*36},(_,i)=>source.data[i*4+3]),Array.from({length:36*36},(_,i)=>explicit.data[i*4+3]));
 assert.ok(Array.from({length:36*36},(_,i)=>i*4).some(i=>source.data[i]!==explicit.data[i]||source.data[i+1]!==explicit.data[i+1]||source.data[i+2]!==explicit.data[i+2]));
 const near={...m,name:'P_Memo_10_copy'};
 assert.throws(()=>rasterNativePicture(l,memo.picture,36,36,pixels,1,near),/Unsupported missing native UV P_Memo_10_copy\/2\/source1/);
 assert.equal(memo.picture.uvSets.length,1,'sampling does not mutate the decoded source');
});

test('native A8/A4 sampling projects preview RGB to zero without changing PNG bytes, alpha or luminance-alpha formats',()=>{
 const original={width:2,height:1,data:new Uint8ClampedArray([255,255,255,0,255,255,255,153])};
 for(const format of [8,11]){
  const sample=api.nativeTextureSamplePixels(original,format);
  assert.deepEqual([...sample.data],[0,0,0,0,0,0,0,153]);assert.notEqual(sample.data,original.data);
 }
 assert.deepEqual([...original.data],[255,255,255,0,255,255,255,153]);
 for(const format of [undefined,0,5,9,10])assert.equal(api.nativeTextureSamplePixels(original,format),original);
});
test('real camera and capture hints use authored charcoal after native alpha-only sampling',{skip:!available},async()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/launcher.json')));
 const l=poseNativeLayout(pack.layouts.LncBase_U_00,pack.animations,[{name:'LncBase_U_00_WhiteBlack',frame:0}]);
 for(const [material,texture] of [['P_PictCam_00','PictCam.bclim'],['P_PictCam_01','PictCapture_05.bclim']]){
  const record=pack.textures[texture],{data,info}=await sharp(resolve(resourceRoot,record.url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(record.picaFormat,11);
  const delivery={width:info.width,height:info.height,data:new Uint8ClampedArray(data)},sample=api.nativeTextureSamplePixels(delivery,record.picaFormat);
  const at=sample.data.findIndex((n,i)=>i%4===3&&n===255)-3;assert.ok(at>=0);
  const m=l.materials.find(m=>m.name===material),result=evaluateNativeMaterial(m,[Array.from(sample.data.slice(at,at+4),n=>n/255)]).map(n=>Math.round(n*255));
  assert.deepEqual(result,[73,77,80,255]);assert.deepEqual(m.constantColors[0],[200,200,200,255],'source constants are retained');
 }
});

test('visible window raster preserves full-pane UV and corner-color sampling without allocating the offscreen span',()=>{
 const l=layout(),m=material();m.textureMaps=[{texture:0,wrapS:1,wrapT:2,minFilter:1,magFilter:1}];l.materials=[m];l.textures=['pattern'];
 const image={width:3,height:2,data:new Uint8ClampedArray([255,0,0,128,0,255,0,255,0,0,255,64,40,50,60,255,70,80,90,128,100,110,120,255])};
 const picture={material:0,colors:[[10,20,30,40],[250,240,230,220],[90,80,70,60],[190,180,170,160]],uvSets:[[-3,-1,9,-1,-3,3,9,3]]};
 const textures=new Map([['pattern',image]]),full=rasterNativePicture(l,picture,1024,24,textures);
 const rect=api.nativeVisibleRasterRect(0,0,1024,24,{a:1,b:0,c:0,d:1,e:-300.25,f:0},320,240);
 assert.equal(rect.rasterWidth,323);assert.equal(rect.rasterHeight,24);assert.equal(rect.sampling.x,299);
 const clipped=rasterNativePicture(l,picture,rect.rasterWidth,rect.rasterHeight,textures,1,m,rect.sampling);
 for(let row=0;row<24;row++)assert.deepEqual(clipped.data.slice(row*rect.rasterWidth*4,(row+1)*rect.rasterWidth*4),full.data.slice((row*1024+299)*4,(row*1024+622)*4));
 const huge=api.nativeVisibleRasterRect(0,0,25308,175,{a:1,b:0,c:0,d:1,e:10,f:37},320,240);
 assert.ok(huge.rasterWidth<=321);assert.equal(huge.sampling.fullWidth,25308);
 const reflected=api.nativeVisibleRasterRect(0,0,1024,24,{a:-1,b:0,c:0,d:1,e:620,f:0},320,240);
 assert.equal(reflected.sampling.x,299);assert.equal(reflected.rasterWidth,322);
 assert.equal(api.nativeVisibleRasterRect(0,0,32,16,{a:1,b:0,c:0,d:1,e:1000,f:0},320,240),null);
});

test('real Notes four-frame thumbnails mirror only the right source frames',()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/game-notes/memo-MemoListDown-arc-l.json')));
 const l=pack.layouts.MemoListDown,flatten=ps=>ps.flatMap(p=>[p,...flatten(p.children)]),w=flatten(l.roots).find(p=>p.name==='W_BtnMemoThum00');
 assert.deepEqual(w.window.frames.map(f=>f.flip),[0,1,0,1]);
 const textures=new Map(Object.entries(pack.textures).map(([name,t])=>[name,{width:t.width,height:t.height,data:new Uint8ClampedArray(t.width*t.height*4)}]));
 const source=JSON.stringify(w),unflipped=structuredClone(w);unflipped.window.frames.forEach(f=>f.flip=0);
 const original=nativeWindowPatches(unflipped,l,textures),mirrored=nativeWindowPatches(w,l,textures);
 assert.equal(JSON.stringify(w),source);assert.equal(mirrored.length,original.length);
 for(let i=0;i<mirrored.length;i++){
  assert.deepEqual([mirrored[i].x,mirrored[i].y,mirrored[i].width,mirrored[i].height],[original[i].x,original[i].y,original[i].width,original[i].height]);
  if(i!==2&&i!==3)assert.deepEqual(mirrored[i].picture.uvSets,original[i].picture.uvSets);
 }
 // A right strip now starts at the texture's right edge and ends at its left;
 // its vertical span and tiling remain unchanged.
 const uv=mirrored[2].picture.uvSets[0],base=original[2].picture.uvSets[0];
 assert.deepEqual([uv[0],uv[2],uv[4],uv[6]],[1,0,1,0]);assert.deepEqual([uv[1],uv[3],uv[5],uv[7]],[base[1],base[3],base[5],base[7]]);
 const rotated=structuredClone(w);rotated.window.frames[1].flip=3;assert.throws(()=>nativeWindowPatches(rotated,l,textures),/Unsupported window frame flip 3/);
});

test('Browser source window retains its vertical and 180-degree frame orientations',()=>{
 const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/browser/contents/0000-0000001f/layout-start-dialog-StartDialog.json')));
 const l=pack.layouts.StartDialog,flatten=ps=>ps.flatMap(p=>[p,...flatten(p.children)]),w=flatten(l.roots).find(p=>p.name==='Window');
 assert.deepEqual(w.window.frames.map(f=>f.flip),[4,2,1,0]);
 const textures=new Map(Object.entries(pack.textures).map(([name,t])=>[name,{width:t.width,height:t.height,data:new Uint8ClampedArray(t.width*t.height*4)}]));
 const before=JSON.stringify(w),plain=structuredClone(w);plain.window.frames.forEach(f=>f.flip=0);
 const base=nativeWindowPatches(plain,l,textures),oriented=nativeWindowPatches(w,l,textures);
 assert.equal(JSON.stringify(w),before);
 // Native strip order is content, LT, RT, RB, LB. Texture orientation does not resize the geometry.
 for(let i=0;i<oriented.length;i++){
  assert.deepEqual([oriented[i].x,oriented[i].y,oriented[i].width,oriented[i].height],[base[i].x,base[i].y,base[i].width,base[i].height]);
  for(let uv=0;uv<(base[i].picture.uvSets[0]?.length??0);uv++){
   const reflect=i===1||(i===2&&uv%2===1)||(i===4&&uv%2===0);
   assert.equal(oriented[i].picture.uvSets[0][uv],reflect?1-base[i].picture.uvSets[0][uv]:base[i].picture.uvSets[0][uv]);
  }
 }
});
