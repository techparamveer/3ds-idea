import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const module=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const layoutUrl=module(readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8'));
const {NativeLayoutRenderer,nativeTextRightOverhang,nativeTextVerticalOverhang}=await import(module(readFileSync(new URL('../src/os/native-renderer.ts',import.meta.url),'utf8').replace("'./native-layout'",JSON.stringify(layoutUrl))));
// The target records actual raster bytes from the renderer's Canvas transport.
// Geometry/compositing fidelity is covered by source/native captures, not this stub.
function canvas(){
 const c={width:1,height:1};c.getContext=()=>ctx;
 const ctx={canvas:c,save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},
  createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},
  putImageData(image){c.image=image;},drawImage(source){c.image=source.image;c.source=source;}};
 return c;
}
const pixels=rgb=>({width:1,height:1,data:new Uint8ClampedArray([...rgb,255])});
const white=Array.from({length:4},()=>[255,255,255,255]);
const material={name:'picture',bufferColor:[0,0,0,0],constantColors:[[255,255,255,255]],textureMaps:[{texture:0,wrapS:0,wrapT:0,minFilter:0,magFilter:0}],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]};
const pane={kind:'pic1',name:'picture',flags:1,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[1,1],children:[],picture:{material:0,colors:white,uvSets:[[0,0,1,0,0,1,1,1]]}};
const layout={canvas:{width:1,height:1,origin:1},roots:[pane],materials:[material],textures:['dynamic'],fonts:[],groups:[],unsupported:[]};

test('per-draw native texture bindings isolate glyphs and renames, restore the source, and reuse cached raster snapshots',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const source=pixels([10,20,30]),first=pixels([255,255,255]),second=pixels([64,128,192]);
  const pack={schema:1,layouts:{test:layout},animations:{},textures:{},messages:{}},textures=new Map([['dynamic',source]]),original=JSON.stringify(pack);
  const renderer=new NativeLayoutRenderer({test:pack},{test:textures},new Map()),target=canvas(),ctx=target.getContext('2d');
  const paint=replacement=>{assert.equal(renderer.draw(ctx,'test','test',replacement?{textures:{dynamic:replacement}}:{}),true);return [...target.image.data];};
  assert.deepEqual(paint(first),[255,255,255,255]);const firstSurface=target.source;
  assert.deepEqual(paint(second),[64,128,192,255]);assert.notEqual(target.source,firstSurface);
  assert.deepEqual(paint(first),[255,255,255,255]);assert.equal(target.source,firstSurface);assert.equal(renderer.cacheBytes,8);
  assert.deepEqual(paint(),[10,20,30,255]);assert.equal(textures.get('dynamic'),source);assert.equal(JSON.stringify(pack),original);
  assert.equal(renderer.draw(ctx,'test','test',{textures:{dynamic:{...first,width:0}}}),false);assert.match(renderer.diagnostics.at(-1),/Invalid dynamic native texture/);
  renderer.dispose();assert.equal(renderer.cacheBytes,0);assert.equal(renderer.draw(ctx,'test','test'),false);assert.equal(firstSurface.width,0);
 }finally{globalThis.document=prior;}
});

test('native child layouts inherit parent alpha before TEV and restore it after nested draws or errors',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const base={...pane,kind:'pan1',picture:undefined,flags:3,name:'outer',alpha:128,children:[{...pane,kind:'pan1',picture:undefined,flags:3,name:'inner',alpha:64}]};
  const parent={...layout,roots:[{...base,name:'root',flags:1,alpha:3,children:[base]}]};
  const pack={schema:1,layouts:{test:layout,parent},animations:{},textures:{},messages:{}};
  const renderer=new NativeLayoutRenderer({test:pack},{test:new Map([['dynamic',pixels([255,255,255])]])},new Map()),target=canvas(),ctx=target.getContext('2d');
  const draw=()=>{assert.equal(renderer.draw(ctx,'test','test'),true);return target.image.data[3];};
  const original=JSON.stringify(pack),alphas=[];
  renderer.withPaneParent(ctx,'test','parent','outer',[],alpha=>{alphas.push(alpha);assert.equal(draw(),128);
   renderer.withPaneParent(ctx,'test','parent','inner',[],inner=>{alphas.push(inner);assert.equal(draw(),16);});
   assert.equal(draw(),128);
  });
  assert.equal(draw(),255);assert.deepEqual(alphas,[128/255,(128/255)*(128/255)*(64/255)]);
  assert.throws(()=>renderer.withPaneParent(ctx,'test','parent','inner',[],()=>{throw new Error('test');}),/test/);
  assert.equal(draw(),255);assert.equal(JSON.stringify(pack),original);
  let invoked=false;assert.equal(renderer.withPaneParent(ctx,'test','parent','absent',[],()=>{invoked=true;}),false);assert.equal(invoked,false);
  renderer.dispose();
 }finally{globalThis.document=prior;}
});

test('real closing folder parents carry source shrink, separate blank alpha, and native origin transforms',()=>{
 const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json',import.meta.url)));
 const renderer=new NativeLayoutRenderer({launcher:pack},{launcher:new Map()},new Map());
 const ctx=canvas().getContext('2d'),calls=[];for(const name of ['translate','rotate','scale'])ctx[name]=(...values)=>calls.push([name,...values]);
 const before=JSON.stringify(pack.layouts.LncFolder_00),samples=[];
 for(const frame of [16,8,6,0]){
  const sample={frame};for(const name of ['N_Dlg_00','N_BlankAnime_00']){
   calls.length=0;assert.equal(renderer.withPaneParent(ctx,'launcher','LncFolder_00',name,[{name:'LncFolder_00_FadeIn',frame}],alpha=>{sample[name]={alpha,calls:[...calls]};}),true);
  }samples.push(sample);
 }
 assert.equal(samples[0].N_Dlg_00.alpha,1);assert.equal(samples[0].N_BlankAnime_00.alpha,1);
 // Original HOME submissions round these pane bytes to159 and59.
 assert.equal(samples[1].N_Dlg_00.alpha,159/255);assert.equal(samples[1].N_BlankAnime_00.alpha,(159/255)*(59/255));
 assert.equal(samples[2].N_BlankAnime_00.alpha,0);assert.equal(samples[3].N_Dlg_00.alpha,0);
 for(const sample of samples)for(const value of [sample.N_Dlg_00,sample.N_BlankAnime_00]){
  assert.deepEqual(value.calls[0],['translate',160,120]);assert.deepEqual(value.calls.at(-1),['translate',-160,-120]);
 }
 assert.ok(samples[1].N_Dlg_00.calls.some(([name,x,y])=>name==='scale'&&Math.abs(x-.745)<1e-7&&Math.abs(y-.745)<1e-7));
 assert.equal(JSON.stringify(pack.layouts.LncFolder_00),before);renderer.dispose();
});

test('child attachment follows runtime parent overrides and does not reuse an earlier position or hidden pose',()=>{
 const parent={...layout,roots:[{...pane,kind:'pan1',picture:undefined,name:'parent',flags:3,translation:[1,2,0],children:[]}]};
 const pack={schema:1,layouts:{parent},animations:{},textures:{},messages:{}};
 const renderer=new NativeLayoutRenderer({test:pack},{test:new Map()},new Map()),ctx=canvas().getContext('2d');
 const before=JSON.stringify(pack),calls=[];
 for(const name of ['translate','rotate','scale'])ctx[name]=(...values)=>calls.push([name,...values]);
 let drawn=0;
 const overrides={parent:{translation:[-85.00001525878906,8.96296501159668,0],scale:[1.5882350206375122,1.5882350206375122],alpha:128}};
 const draw=()=>renderer.withPaneParent(ctx,'test','parent','parent',[],alpha=>{drawn++;assert.equal(alpha,128/255);},overrides);
 assert.equal(draw(),true);assert.equal(drawn,1);
 assert.ok(calls.some(call=>JSON.stringify(call)===JSON.stringify(['translate',-85.00001525878906,-8.96296501159668])));
 assert.ok(calls.some(call=>JSON.stringify(call)===JSON.stringify(['scale',1.5882350206375122,1.5882350206375122])));
 overrides.parent.translation=[10,20,0];calls.length=0;assert.equal(draw(),true);assert.equal(drawn,2);
 assert.ok(calls.some(call=>JSON.stringify(call)===JSON.stringify(['translate',10,-20])));
 overrides.parent.visible=false;assert.equal(draw(),true);assert.equal(drawn,2);
 overrides.parent.visible=true;assert.equal(draw(),true);assert.equal(drawn,3);
 calls.length=0;renderer.withPaneParent(ctx,'test','parent','parent',[],alpha=>{assert.equal(alpha,1);});
 assert.ok(calls.some(call=>JSON.stringify(call)===JSON.stringify(['translate',1,-2])));
 assert.equal(JSON.stringify(pack),before);renderer.dispose();
});

test('parent attachment cache does not bypass animation diagnostics in a subsequent draw',()=>{
 const parent={...layout,roots:[{...pane,kind:'pan1',picture:undefined,name:'parent',children:[]}]};
 const animation={frames:1,loop:false,groups:[],textures:[],tracks:[{target:'picture',binding:'material',property:'texture.translation.x',index:0,component:0,interpolation:'hermite',keys:[{frame:0,value:0},{frame:1,value:1}]}]};
 const pack={schema:1,layouts:{parent},animations:{move:animation},textures:{},messages:{}};
 const renderer=new NativeLayoutRenderer({test:pack},{test:new Map()},new Map()),ctx=canvas().getContext('2d'),bindings=[{name:'move',frame:0}];
 renderer.withPaneParent(ctx,'test','parent','parent',bindings,()=>{},{});
 renderer.draw(ctx,'test','parent',{bindings,overrides:{}});
 assert.ok(renderer.diagnostics.some(message=>message.includes('unallocated texture matrix')));
 renderer.dispose();
});

test('inline child layouts draw after authored children and before later siblings, with inherited transform and alpha',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const parent={...layout,canvas:{width:320,height:240,origin:1},roots:[{...pane,name:'parent',kind:'pan1',picture:undefined,flags:3,alpha:128,translation:[10,20,0],scale:[2,3],children:[{...pane,name:'authored'}]}, {...pane,name:'later'}]};
  const pack={schema:1,layouts:{parent,child:layout},animations:{},textures:{},messages:{}};
  const renderer=new NativeLayoutRenderer({test:pack},{test:new Map([['dynamic',pixels([0,0,255])]])},new Map()),target=canvas(),ctx=target.getContext('2d'),events=[];
  let depth=0;ctx.save=()=>{depth++;};ctx.restore=()=>{depth--;};
  ctx.translate=(...args)=>events.push(['translate',...args]);ctx.scale=(...args)=>events.push(['scale',...args]);
  ctx.drawImage=source=>events.push(['pixel',...source.image.data]);
  const attach=color=>alpha=>{
   assert.equal(alpha,128/255);events.push(['attached']);
   // A child with a different canvas size needs its center supplied explicitly.
   assert.equal(renderer.draw(ctx,'test','child',{center:[160,120],textures:{dynamic:pixels(color)}}),true);
  };
  const before=JSON.stringify(pack);
  assert.equal(renderer.draw(ctx,'test','parent',{attachments:{parent:attach([255,0,0])}}),true);
  assert.deepEqual(events.filter(e=>e[0]==='pixel'),[['pixel',0,0,255,128],['pixel',255,0,0,128],['pixel',0,0,255,255]]);
  const at=events.findIndex(e=>e[0]==='attached');assert.deepEqual(events[at-1],['translate',-160,-120]);
  assert.ok(events.some(e=>JSON.stringify(e)===JSON.stringify(['translate',10,-20])));assert.ok(events.some(e=>JSON.stringify(e)===JSON.stringify(['scale',2,3])));assert.equal(depth,0);
  events.length=0;
  assert.equal(renderer.draw(ctx,'test','parent',{attachments:{parent:attach([0,255,0])}}),true);
  assert.deepEqual(events.filter(e=>e[0]==='pixel')[1],['pixel',0,255,0,128],'Pose cache must not retain an earlier callback');
  assert.equal(renderer.draw(ctx,'test','parent',{attachments:{parent:()=>{throw new Error('attachment failure');}}}),false);assert.equal(depth,0);
  events.length=0;assert.equal(renderer.draw(ctx,'test','child'),true);assert.deepEqual(events.find(e=>e[0]==='pixel'),['pixel',0,0,255,255],'Error cleanup restores inherited alpha');
  let hiddenCalls=0;renderer.draw(ctx,'test','parent',{overrides:{parent:{visible:false}},attachments:{parent:()=>hiddenCalls++}});assert.equal(hiddenCalls,0);
  assert.equal(JSON.stringify(pack),before);renderer.dispose();
 }finally{globalThis.document=prior;}
});

test('an unflagged zero-alpha attachment parent still transmits the inherited chain',()=>{
 const parent={...layout,roots:[{...pane,name:'parent',kind:'pan1',picture:undefined,flags:1,alpha:0}]};
 const pack={schema:1,layouts:{parent},animations:{},textures:{},messages:{}};
 const renderer=new NativeLayoutRenderer({test:pack},{test:new Map()},new Map()),ctx=canvas().getContext('2d');
 const values=[];assert.equal(renderer.draw(ctx,'test','parent',{attachments:{parent:alpha=>values.push(alpha)}}),true);assert.deepEqual(values,[1]);renderer.dispose();
});

test('FLYT part draws preserve independent source textures, clip bindings, alpha and parent transform scopes',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const child={...layout,sourceFormat:'FLYT'},parentMaterial={...material,name:'picture'};
  const part=(name,texture,alpha)=>({...pane,sourceFormat:'FLYT',kind:'prt1',name,picture:undefined,flags:3,alpha,translation:[10+texture*30,20,0],part:{layout:'Button',capability:'amiibo-portal-v1',magnify:[1,1],entries:[{name:'picture',usageFlags:0,basicUsageFlags:0,materialUsageFlags:0,property:{...pane,picture:{...pane.picture,material:texture}}}]}});
  const parent={...layout,sourceFormat:'FLYT',roots:[part('first',0,128),part('second',1,255)],textures:['red','blue'],materials:[parentMaterial,{...parentMaterial,textureMaps:[{...parentMaterial.textureMaps[0],texture:1}]}]};
  const pack=l=>({schema:1,layouts:l,animations:{},textures:{},messages:{}});
  const packs={parent:pack({parent}),child:pack({child})},before=JSON.stringify(packs);
  const renderer=new NativeLayoutRenderer(packs,{parent:new Map([['red',pixels([255,0,0])],['blue',pixels([0,0,255])]]),child:new Map([['dynamic',pixels([0,255,0])]])},new Map());
  const target=canvas(),ctx=target.getContext('2d'),draws=[],translates=[];ctx.drawImage=c=>draws.push([...c.image.data]);ctx.translate=(...v)=>translates.push(v);
  const options={parts:{Button:{pack:'child',layout:'child'}},partBindings:{first:{overrides:{picture:{alpha:64}}}}};
  assert.equal(renderer.draw(ctx,'parent','parent',options),true);
  assert.deepEqual(draws,[[255,0,0,32],[0,0,255,255]]);
  assert.deepEqual(translates.slice(0,3),[[.5,.5],[10,-20],[-.5,-.5]]);
  assert.ok(translates.some(v=>v[0]===0&&v[1]===0));
  assert.equal(JSON.stringify(packs),before);
  draws.length=0;assert.equal(renderer.draw(ctx,'parent','parent',options),true);assert.deepEqual(draws,[[255,0,0,32],[0,0,255,255]]);
  assert.equal(renderer.draw(ctx,'parent','parent'),false);assert.match(renderer.diagnostics.at(-1),/Missing native part layout/);
  renderer.dispose();
 }finally{globalThis.document=prior;}
});

test('FLYT unresolved material fields are rejected instead of using the CLYT implicit single texture',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const unsupported={...material,sourceFormat:'FLYT',unsupported:[{kind:'flytTextureCombiner'}]};
  const pack={schema:1,layouts:{test:{...layout,sourceFormat:'FLYT',materials:[unsupported]}},animations:{},textures:{},messages:{}};
  const renderer=new NativeLayoutRenderer({test:pack},{test:new Map([['dynamic',pixels([255,255,255])]])},new Map());
  assert.equal(renderer.draw(canvas().getContext('2d'),'test','test'),false);assert.match(renderer.diagnostics.at(-1),/Unsupported FLYT material/);renderer.dispose();
 }finally{globalThis.document=prior;}
});

test('part pose cache includes the parent material animation state',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const part={...pane,sourceFormat:'FLYT',kind:'prt1',name:'instance',picture:undefined,part:{layout:'Button',capability:'amiibo-portal-v1',magnify:[1,1],entries:[{name:'picture',usageFlags:0,basicUsageFlags:0,materialUsageFlags:0,property:pane}]}};
  const parent={...layout,sourceFormat:'FLYT',roots:[part]},child={...layout,sourceFormat:'FLYT'};
  const animation={frames:2,loop:false,groups:[],textures:[],tracks:[{target:'picture',binding:'material',property:'materialColor.1.0',index:0,component:4,interpolation:'step',keys:[{frame:0,value:255},{frame:1,value:0}]}]};
  const packs={parent:{schema:1,layouts:{parent},animations:{shade:animation},textures:{},messages:{}},child:{schema:1,layouts:{child},animations:{},textures:{},messages:{}}};
  const renderer=new NativeLayoutRenderer(packs,{parent:new Map([['dynamic',pixels([255,255,255])]]),child:new Map([['dynamic',pixels([255,255,255])]])},new Map()),target=canvas();
  const draw=frame=>{assert.equal(renderer.draw(target.getContext('2d'),'parent','parent',{parts:{Button:{pack:'child',layout:'child'}},bindings:[{name:'shade',frame}]}),true);return [...target.image.data];};
  assert.deepEqual(draw(0),[255,255,255,255]);assert.deepEqual(draw(1),[0,255,255,255]);assert.deepEqual(draw(0),[255,255,255,255]);renderer.dispose();
 }finally{globalThis.document=prior;}
});


test('source HUD outlined glyphs retain ink beyond their right-aligned advance rectangle',()=>{
 const font=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/hud/font.json',import.meta.url),'utf8'));
 assert.equal(font.sourceSha256,'172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8');
 for(const [value,last] of [['26/09 (Sat)',')'],['04','4'],['10','0']]){
  const glyph=font.glyphs[last.charCodeAt(0)];assert.equal(glyph.width-glyph.advance,1);
  assert.equal(nativeTextRightOverhang(font,value,[16,16],5,0,0),1);
 }
 assert.equal(nativeTextRightOverhang(font,'04',[8,8],5,0,0),1,'half a source texel needs one backing pixel');
 assert.equal(nativeTextRightOverhang(font,'04',[16,16],4,0,0),0,'centered path retains its existing contract');
 assert.equal(nativeTextRightOverhang(font,'04\n10',[16,16],5,0,0),0,'multiline path is outside this bounded correction');
 const shared=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
 assert.equal(nativeTextRightOverhang(shared,'Health and Safety',[16,16],5,0,0),0,'shared alpha glyph raster remains unchanged');
});

test('overhang backing preserves pane alignment arguments and reaches composition',()=>{
 const previous=globalThis.document,calls=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/hud/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(ctx,value,w,h){calls.push({value,w,h,backingWidth:ctx.canvas.width});}};
  const text={value:'04',font:0,material:0,size:[16,16],alignment:5,lineAlignment:0,lineSpacing:0,characterSpacing:0,topColor:[255,255,255,255],bottomColor:[255,255,255,255]};
  const source={...layout,fonts:['hud'],roots:[{...pane,kind:'txt1',size:[20,20],picture:undefined,text}]};
  const pack={schema:1,layouts:{test:source},animations:{},textures:{},messages:{}};
  const renderer=new NativeLayoutRenderer({test:pack},{test:new Map()},new Map([['hud',font]]));
  const ctx=canvas().getContext(),compositions=[];ctx.drawImage=(image,...args)=>compositions.push([image.width,...args]);
  assert.equal(renderer.draw(ctx,'test','test'),true);
  assert.deepEqual(calls,[{value:'04',w:20,h:20,backingWidth:21}]);
  assert.deepEqual(compositions,[[21,0,0,21,20]],'source overhang survives final composition without stretching the original20 pixels');
  assert.deepEqual(source.roots[0].size,[20,20],'source alignment pane stays unchanged');
  renderer.dispose();
 }finally{globalThis.document=previous;}
});


test('native single-line width retains source style and float32 advance accumulation',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
 const renderer=new NativeLayoutRenderer({}, {},new Map([['cbf_std.bcfnt',{manifest}]]));
 const text={value:'Other Settings',size:[21.25,25.5],characterSpacing:0,lineSpacing:0,messageStyle:{fontScale:[0.8500000238418579,0.8500000238418579],characterSpacing:0,lineSpacing:0}};
 assert.equal(renderer.measureSingleLineText('cbf_std.bcfnt',text),149.60000610351562);
 assert.equal(renderer.measureSingleLineText('cbf_std.bcfnt',{...text,value:'',messageStyle:undefined}),0);
 assert.throws(()=>renderer.measureSingleLineText('cbf_std.bcfnt',{...text,value:'two\nlines'}),/Unsupported/);
});

for(const alignment of [3,4])test(`LCD text phase for alignment ${alignment} participates in cache identity and composes at whole pixels`,()=>{
 const previous=globalThis.document,calls=[],coverage=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(...args){calls.push(args[9]);coverage.push(args[11]);}};
  const text={value:'Other Settings',font:0,material:0,size:[21.25,25.5],alignment,lineAlignment:0,lineSpacing:0,characterSpacing:0,topColor:[255,255,255,255],bottomColor:[255,255,255,255]};
  const source={...layout,fonts:['shared'],roots:[{...pane,kind:'txt1',size:[340,26],picture:undefined,text}]};
  const pack={schema:1,layouts:{test:source},animations:{},textures:{},messages:{}};
  const renderer=new NativeLayoutRenderer({test:pack},{test:new Map()},new Map([['shared',font]]));
  let matrix={a:1,b:0,c:0,d:1,e:10.25,f:20.5};
  const ctx=canvas().getContext(),compositions=[];ctx.getTransform=()=>matrix;ctx.drawImage=(image,...args)=>compositions.push([image.width,image.height,...args]);
  const paint=()=>assert.equal(renderer.draw(ctx,'test','test',{textSampling:'lcd'}),true);
  paint();assert.deepEqual(calls,[[.25,.5]]);assert.deepEqual(compositions[0],[341,27,-.25,-.5,341,27]);
  matrix={...matrix,e:11.25};paint();assert.equal(calls.length,1,'whole pixel translation reuses identical samples');
  matrix={...matrix,e:11.5};paint();assert.deepEqual(calls[1],[.5,.5]);
  matrix={...matrix,a:2};paint();assert.deepEqual(calls[2],[0,0],'scaled panes retain their prior path');
  matrix={...matrix,a:1};assert.equal(renderer.draw(ctx,'test','test'),true);assert.deepEqual(calls.at(-1),[0,0],'default text sampling retains its prior path');
  matrix={...matrix,a:1};
  renderer.draw(ctx,'test','test',{textSampling:'lcd',textCoverageAdaptation:'azahar-12p4-fit'});
  assert.equal(coverage.at(-1),'azahar-12p4-fit','explicit adaptation has a distinct cache entry');
  const count=calls.length;renderer.draw(ctx,'test','test',{textSampling:'lcd',textCoverageAdaptation:'azahar-12p4-fit'});assert.equal(calls.length,count);
  matrix={...matrix,a:2};renderer.draw(ctx,'test','test',{textSampling:'lcd',textCoverageAdaptation:'azahar-12p4-fit'});
  assert.equal(calls.length,count,'unsupported transform reuses unadapted cache');
  renderer.dispose();
 }finally{globalThis.document=previous;}
});

test('opted-in fractional window pictures sample original texture once and honor patch material',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const linear={...material,textureMaps:[{...material.textureMaps[0],texture:1,minFilter:1,magFilter:1}]};
  const source={...layout,textures:['unused','gradient'],materials:[material]};
  const textures=new Map([['unused',pixels([255,0,0])],['gradient',{width:2,height:1,data:new Uint8ClampedArray([0,0,0,255,255,255,255,255])}]]);
  const renderer=new NativeLayoutRenderer({}, {},new Map()),target=canvas();target.width=3;target.height=2;
  const ctx=target.getContext();ctx.globalAlpha=1;ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:.25,f:0});ctx.resetTransform=()=>{};
  ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(Array.from({length:w*h},()=>[99,99,99,255]).flat())});
  assert.equal(renderer.projectedPicture(ctx,source,pane.picture,2,1,1,textures),false,'fractional axis-aligned path requires opt-in');
  assert.equal(renderer.projectedPicture(ctx,source,pane.picture,2,1,1,textures,true,linear),true);
  assert.deepEqual([...target.image.data],[0,0,0,255,191,191,191,255,99,99,99,255],'LCD centers sample patch material gradient once; uncovered pixel retains destination');
  ctx.globalAlpha=.5;assert.equal(renderer.projectedPicture(ctx,source,pane.picture,2,1,1,textures,true,linear),false,'unsupported Canvas alpha retains existing path');
  renderer.dispose();
 }finally{globalThis.document=prior;}
});

test('MSBT RGBA switches become UTF-16 color spans on the delivered Camera guide messages',async()=>{
 const {nativeMessageColorSpans}=await import(layoutUrl);
 const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/msg-EU_English.json',import.meta.url),'utf8'));
 const text=label=>pack.messages.P_tips.messages[pack.messages.P_tips.labels[label]].text;
 assert.deepEqual(nativeMessageColorSpans(pack,'P_tips','D_003_1'),[],'uncoloured pages keep the pane vertex colours');
 const spans=nativeMessageColorSpans(pack,'P_tips','D_003_3');
 assert.deepEqual(spans.map(s=>[s.start,s.end,s.color]),[[27,48,[255,50,0,255]],[48,65,[69,64,57,255]]]);
 assert.equal(text('D_003_3').slice(spans[0].start,spans[0].end),'at least 30cm (12in)\n');
 assert.deepEqual(nativeMessageColorSpans(pack,'P_tips','missing'),[]);
});

test('color spans draw every run against the complete message and reject invalid spans',()=>{
 const previous=globalThis.document,ranges=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.clearRect=()=>{};ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(_ctx,value,...args){ranges.push([value,args[10]]);}};
  const text={value:'abcdef',font:0,material:0,size:[16,16],alignment:4,lineAlignment:0,lineSpacing:0,characterSpacing:0,topColor:[1,2,3,255],bottomColor:[1,2,3,255]};
  const make=spans=>{const source={...layout,fonts:['shared'],roots:[{...pane,kind:'txt1',size:[40,20],picture:undefined,text:{...text,colorSpans:spans}}]};
   return new NativeLayoutRenderer({test:{schema:1,layouts:{test:source},animations:{},textures:{},messages:{}}},{test:new Map()},new Map([['shared',font]]));};
  const ctx=canvas().getContext();ctx.drawImage=()=>{};
  let renderer=make(undefined);assert.equal(renderer.draw(ctx,'test','test'),true);
  assert.deepEqual(ranges,[['abcdef',undefined]],'uncoloured text keeps the single-pass path');renderer.dispose();
  ranges.length=0;renderer=make([{start:2,end:4,color:[255,50,0,255]}]);assert.equal(renderer.draw(ctx,'test','test'),true);
  assert.deepEqual(ranges,[['abcdef',[0,2]],['abcdef',[2,4]],['abcdef',[4,6]]],'each run measures the whole message');renderer.dispose();
  for(const bad of [[{start:4,end:2,color:[0,0,0,255]}],[{start:0,end:9,color:[0,0,0,255]}],[{start:0,end:2,color:[0,0,256,255]}]]){
   renderer=make(bad);assert.equal(renderer.draw(ctx,'test','test'),false);assert.match(renderer.diagnostics.at(-1),/Invalid native text color span/);renderer.dispose();
  }
 }finally{globalThis.document=previous;}
});

test('glyph scale spans share full-message color masks, isolate cache keys and reject malformed ranges',()=>{
 const previous=globalThis.document,calls=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.clearRect=()=>{};ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(_ctx,value,...args){const scales=args[16];if(scales?.some(span=>span.end>value.length))throw Error('Invalid native text scale span');calls.push({value,range:args[10],scales});}};
  const text={value:'A\nBC',font:0,material:0,size:[16,16],alignment:4,lineAlignment:0,lineSpacing:0,characterSpacing:0,topColor:[1,2,3,255],bottomColor:[1,2,3,255]};
  const source={...layout,fonts:['shared'],roots:[{...pane,name:'copy',kind:'txt1',size:[40,40],picture:undefined,text}]};
  const renderer=new NativeLayoutRenderer({test:{schema:1,layouts:{test:source},animations:{},textures:{},messages:{}}},{test:new Map()},new Map([['shared',font]])),ctx=canvas().getContext();ctx.drawImage=()=>{};
  const spans=[{start:2,end:4,scale:.85}],colours=[{start:2,end:4,color:[60,60,60,255]}];
  assert.equal(renderer.draw(ctx,'test','test',{overrides:{copy:{glyphScaleSpans:spans,colorSpans:colours}}}),true);
  assert.deepEqual(calls,[{value:'A\nBC',range:[0,2],scales:spans},{value:'A\nBC',range:[2,4],scales:spans}]);
  calls.length=0;
  assert.equal(renderer.draw(ctx,'test','test',{overrides:{copy:{glyphScaleSpans:spans,colorSpans:colours}}}),true);
  assert.deepEqual(calls,[],'identical scaled text reuses its cached raster');
  assert.equal(renderer.draw(ctx,'test','test',{overrides:{copy:{colorSpans:colours}}}),true);
  assert.deepEqual(calls,[{value:'A\nBC',range:[0,2],scales:undefined},{value:'A\nBC',range:[2,4],scales:undefined}]);
  assert.equal(renderer.draw(ctx,'test','test',{overrides:{copy:{glyphScaleSpans:[{start:2,end:5,scale:.85}]}}}),false);
  assert.match(renderer.diagnostics.at(-1),/Invalid native text scale span/);
  renderer.dispose();
 }finally{globalThis.document=previous;}
});

test('Power multiline metrics reach the font writer only through explicit pane overrides',()=>{
 const previous=globalThis.document,calls=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.clearRect=()=>{};ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(...args){calls.push({scales:args[16],origin:args[17]});}};
  const text={value:'A\n \nA',font:0,material:0,size:[16.25,19.5],alignment:4,lineAlignment:1,lineSpacing:1,characterSpacing:0,topColor:[1,2,3,255],bottomColor:[1,2,3,255]};
  const source={...layout,fonts:['shared'],roots:[{...pane,name:'copy',kind:'txt1',size:[380,136],picture:undefined,text}]};
  const renderer=new NativeLayoutRenderer({test:{schema:1,layouts:{test:source},animations:{},textures:{},messages:{}}},{test:new Map()},new Map([['shared',font]])),ctx=canvas().getContext();ctx.drawImage=()=>{};
  assert.equal(renderer.draw(ctx,'test','test'),true);
  assert.equal(renderer.draw(ctx,'test','test',{overrides:{copy:{lineAdvanceScales:[.2,1]}}}),true);
  assert.equal(renderer.draw(ctx,'test','test',{overrides:{copy:{lineAdvanceScales:[.2,1],multilineBlockOrigin:'writer-0x110'}}}),true);
  assert.deepEqual(calls,[{scales:undefined,origin:undefined},{scales:[.2,1],origin:undefined},{scales:[.2,1],origin:'writer-0x110'}]);renderer.dispose();
 }finally{globalThis.document=previous;}
});

test('Power footer writer 0x111 samples only its selected multiline pane at LCD centres',()=>{
 const previous=globalThis.document,calls=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.clearRect=()=>{};ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(...args){calls.push({value:args[1],phase:args[9],lcd:args[10],origin:args[17]});}};
  const text={value:'A\nB',font:0,material:0,size:[17.5,21],alignment:4,lineAlignment:0,lineSpacing:0,characterSpacing:0,topColor:[1,2,3,255],bottomColor:[1,2,3,255]};
  const source={...layout,canvas:{width:400,height:240,origin:1},fonts:['shared'],roots:[{...pane,name:'footer',kind:'txt1',size:[380,63],picture:undefined,text},{...pane,name:'sibling',kind:'txt1',size:[380,63],picture:undefined,text:{...text,value:'C\nD'}}]};
  const renderer=new NativeLayoutRenderer({test:{schema:1,layouts:{test:source},animations:{},textures:{},messages:{}}},{test:new Map()},new Map([['shared',font]])),ctx=canvas().getContext();
  ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:10.25,f:20.5});ctx.drawImage=()=>{};
  assert.equal(renderer.draw(ctx,'test','test',{overrides:{footer:{multilineBlockOrigin:'writer-0x111'}},textSampling:'lcd',textSamplingPanes:['footer']}),true);
  assert.deepEqual(calls,[{value:'A\nB',phase:[.25,.5],lcd:true,origin:'writer-0x111'},{value:'C\nD',phase:[0,0],lcd:false,origin:undefined}]);renderer.dispose();
 }finally{globalThis.document=previous;}
});

test('pane-scoped LCD sampling reaches selected single-line text without changing sibling text',()=>{
 const previous=globalThis.document,calls=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.clearRect=()=>{};ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(...args){calls.push({value:args[1],phase:args[9],lcd:args[10],scales:args[16]});}};
  const power={value:'Power Off',font:0,material:0,size:[16.25,19.5],alignment:4,lineAlignment:0,lineSpacing:0,characterSpacing:0,topColor:[1,2,3,255],bottomColor:[1,2,3,255]};
  const exact={...power,value:'Software closed.',size:[25,30]};
  const source={...layout,canvas:{width:320,height:240,origin:1},fonts:['shared'],roots:[{...pane,name:'button',kind:'txt1',size:[236,27],picture:undefined,text:power},{...pane,name:'exact',kind:'txt1',size:[312,60],picture:undefined,text:exact}]};
  const renderer=new NativeLayoutRenderer({test:{schema:1,layouts:{test:source},animations:{},textures:{},messages:{}}},{test:new Map()},new Map([['shared',font]])),ctx=canvas().getContext();
  ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:10.25,f:20.5});ctx.drawImage=()=>{};
  assert.equal(renderer.draw(ctx,'test','test',{textSampling:'lcd',textSamplingPanes:['button']}),true);
  assert.deepEqual(calls,[{value:'Power Off',phase:[.25,.5],lcd:true,scales:undefined},{value:'Software closed.',phase:[0,0],lcd:false,scales:undefined}]);
  assert.equal(renderer.draw(ctx,'test','test',{textSampling:'lcd',textSamplingPanes:['button','button']}),false);
  assert.match(renderer.diagnostics.at(-1),/sampling pane allowlist/);
  assert.equal(renderer.draw(ctx,'test','test',{textSampling:'lcd',textSamplingPanes:['missing']}),false);
  assert.match(renderer.diagnostics.at(-1),/Missing native text sampling pane missing/);renderer.dispose();
 }finally{globalThis.document=previous;}
});

test('Camera source capacity glyph cell overhangs its 16px alignment pane vertically',()=>{
 const font=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/camera/contents/0000-0000001a/HudNOTES-bcfnt/font.json',import.meta.url),'utf8'));
 assert.equal(font.sourceSha256,'7b115deda29adce0faccb352d412a3ef9e10247850be6ded7856ba2714d32932');
 assert.deepEqual(nativeTextVerticalOverhang(font,'\ue01e3000',[23,23],16,3,1,0),[5,3]);
 assert.deepEqual(nativeTextVerticalOverhang(font,'\ue01e3000',[23,23],16,3,0,0),[0,0]);
 assert.deepEqual(nativeTextVerticalOverhang(font,'two\nlines',[23,23],16,3,1,0),[0,0]);
});


test('Camera vertical backing keeps source alignment dimensions and restores the native origin',()=>{
 const prior=globalThis.document,calls=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});ctx.translate=(...args)=>calls.push(['translate',...args]);return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/camera/contents/0000-0000001a/HudNOTES-bcfnt/font.json',import.meta.url),'utf8'));
  const controls=[{index:1,advance:2},{index:5,advance:2}];
  const font={manifest,drawNative(ctx,value,w,h,...rest){assert.deepEqual(rest[9],controls);calls.push(['text',value,w,h,ctx.canvas.width,ctx.canvas.height]);}};
  const text={cursorAdvances:controls,value:'\ue01e3000',font:0,material:0,size:[23,23],alignment:3,lineAlignment:1,lineSpacing:0,characterSpacing:0,topColor:[255,255,255,255],bottomColor:[255,255,255,255]};
  const source={...layout,fonts:['hud'],roots:[{...pane,kind:'txt1',size:[172,16],picture:undefined,text}]};
  const renderer=new NativeLayoutRenderer({test:{schema:1,layouts:{test:source},animations:{},textures:{},messages:{}}},{test:new Map()},new Map([['hud',font]]));
  const ctx=canvas().getContext(),compositions=[];ctx.drawImage=(image,...args)=>compositions.push([image.width,image.height,...args]);
  assert.equal(renderer.draw(ctx,'test','test'),true);
  assert.ok(calls.some(call=>JSON.stringify(call)===JSON.stringify(['translate',0,5])));
  assert.ok(calls.some(call=>JSON.stringify(call)===JSON.stringify(['text','\ue01e3000',172,16,172,24])));
  assert.deepEqual(compositions,[[172,24,0,-5,172,24]]);
 renderer.dispose();
 }finally{globalThis.document=prior;}
});

test('Camera fractional centered text preserves source size only in the opted-in LCD path',()=>{
 const previous=globalThis.document,calls=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(...args){calls.push({width:args[2],height:args[3],phase:args[9],direct:args[10]});}};
  const text={value:'Next',font:0,material:0,size:[21,25.2],alignment:4,lineAlignment:2,lineSpacing:0,characterSpacing:0,topColor:[255,255,255,255],bottomColor:[255,255,255,255]};
  const source={...layout,fonts:['shared'],roots:[{...pane,kind:'txt1',size:[120,25.200000762939453],picture:undefined,text}]};
  const pack={schema:1,layouts:{test:source},animations:{},textures:{},messages:{}};
  const renderer=new NativeLayoutRenderer({test:pack},{test:new Map()},new Map([['shared',font]]));
  const ctx=canvas().getContext(),compositions=[];ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:100,f:191.39999961853027});ctx.drawImage=(image,...args)=>compositions.push([image.width,image.height,...args]);
  for(const textSampling of [undefined,'lcd','lcd-source-size'])assert.equal(renderer.draw(ctx,'test','test',{textSampling}),true);
  assert.equal(calls[0].height,26,'default path keeps prior allocation-sized layout');
  assert.equal(calls.at(-1).height,25.200000762939453,'source pane height reaches the glyph writer without rounding');
  assert.equal(calls.at(-1).direct,true);assert.deepEqual(calls.at(-1).phase,[0,.39999961853027344]);
  assert.deepEqual(compositions.at(-1),[120,27,0,-.39999961853027344,120,27],'the raster reaches the LCD without a second rescale');
  assert.equal(compositions[1][5],25.200000762939453,'existing lcd mode retains its fractional-pane fallback');
  renderer.dispose();
 }finally{globalThis.document=previous;}
});

test('source-sized top-left alpha text keeps fractional spacing in the direct LCD path',()=>{
 const previous=globalThis.document,calls=[];
 globalThis.document={createElement(){const c=canvas(),ctx=c.getContext();ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});return c;}};
 try{
  const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
  const font={manifest,drawNative(...args){calls.push({spacing:args[6],phase:args[9],direct:args[10],sourceSize:args[14],sourceTopLeft:args[15]});}};
  const text={value:'Important information about your\n',font:0,material:0,size:[16.66666603088379,20],alignment:0,lineAlignment:0,lineSpacing:0,characterSpacing:.5,topColor:[50,50,50,255],bottomColor:[50,50,50,255]};
  const source={...layout,fonts:['shared'],roots:[{...pane,kind:'txt1',size:[320,20],picture:undefined,text}]};
  const renderer=new NativeLayoutRenderer({test:{schema:1,layouts:{test:source},animations:{},textures:{},messages:{}}},{test:new Map()},new Map([['shared',font]]));
  const ctx=canvas().getContext();ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:40.666666984558105,f:82});
  assert.equal(renderer.draw(ctx,'test','test',{textSampling:'lcd-source-size'}),true);
  assert.equal(renderer.draw(ctx,'test','test',{textSampling:'lcd-source-size-left'}),true);
  assert.deepEqual(calls.map(call=>[call.spacing,call.direct,call.sourceSize,call.sourceTopLeft]),[[.5,false,true,false],[.5,true,true,true]]);
  assert.deepEqual(calls[1].phase,[.6666669845581055,0]);
  renderer.dispose();
 }finally{globalThis.document=previous;}
});
