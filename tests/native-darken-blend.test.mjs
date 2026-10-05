import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

const module=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const layoutUrl=module(readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8'));
const {blendNativePixel,evaluateNativeMaterial,rasterNativePicture,nativeTextureSamplePixels}=await import(layoutUrl);
const fontUrl=new URL('../src/os/bitmap-font.ts',import.meta.url).href;
const {NativeLayoutRenderer}=await import(module(readFileSync(new URL('../src/os/native-renderer.ts',import.meta.url),'utf8').replace("'./native-layout'",JSON.stringify(layoutUrl)).replace("'./bitmap-font'",JSON.stringify(fontUrl))));
const {decodeNativePng}=await import(module(readFileSync(new URL('../src/os/native-png.ts',import.meta.url),'utf8')));
const blend={operation:1,sourceFactor:0,destinationFactor:5};
const white=Array.from({length:4},()=>[255,255,255,255]);
const pixels=(alpha=173)=>({width:1,height:1,data:new Uint8ClampedArray([79,137,219,alpha])});
const material=()=>({name:'arbitrary-name',bufferColor:[0,0,0,0],constantColors:[[255,255,255,255]],textureOnly:false,
 textureMaps:[{texture:0,wrapS:0,wrapT:0,minFilter:0,magFilter:0}],textureMatrices:[],coordinateGenerators:[],tevStages:[],
 alphaCompare:{function:7,reference:0},colorBlend:{...blend},unsupported:[]});
const picture={material:0,colors:white,uvSets:[[0,0,1,0,0,1,1,1]]};
function fixture(m=material(),size=[1,1]){
 const pane={kind:'pic1',name:'picture',flags:1,origin:0,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size,children:[],picture};
 const layout={canvas:{width:16,height:12,origin:1},roots:[pane],materials:[m],textures:['dynamic'],fonts:[],groups:[],unsupported:[]};
 const pack={schema:1,name:'test',layouts:{test:layout},animations:{},textures:{},messages:{}};
 return {pane,layout,pack};
}

// Records transport/state only. It deliberately does not pretend to implement
// Canvas rasterization. Optional real-Canvas tests below measure that separately.
function recordingCanvas(){
 const canvas={width:1,height:1,image:null,draws:[],reads:0};
 let state={matrix:[1,0,0,1,0,0],clips:[],globalCompositeOperation:'source-over',globalAlpha:1},path=[],stack=[];
 const multiply=([a,b,c,d,e,f])=>{const [A,B,C,D,E,F]=state.matrix;state.matrix=[A*a+C*b,B*a+D*b,A*c+C*d,B*c+D*d,A*e+C*f+E,B*e+D*f+F];};
 const ctx={canvas,save(){stack.push(structuredClone(state));},restore(){assert.ok(stack.length);state=stack.pop();},
  translate(x,y){multiply([1,0,0,1,x,y]);},scale(x,y){multiply([x,0,0,y,0,0]);},rotate(r){multiply([Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0]);},
  getTransform(){const [a,b,c,d,e,f]=state.matrix;return {a,b,c,d,e,f};},
  setTransform(...args){state.matrix=args.length===1?['a','b','c','d','e','f'].map(k=>args[0][k]):args;},resetTransform(){state.matrix=[1,0,0,1,0,0];},
  beginPath(){path=[];},rect(...rect){path.push({rect,matrix:[...state.matrix]});},clip(){state.clips.push(structuredClone(path));},clearRect(){canvas.image=null;},
  createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},
  putImageData(image){canvas.image={...image,data:image.data.slice()};},
  getImageData(x,y,w,h){canvas.reads++;return canvas.image?{...canvas.image,data:canvas.image.data.slice()}:ctx.createImageData(w,h);},
  drawImage(source,...rect){canvas.draws.push({source,rect,state:structuredClone(state)});},snapshot(){return structuredClone(state);}};
 for(const key of ['globalCompositeOperation','globalAlpha'])Object.defineProperty(ctx,key,{get:()=>state[key],set:value=>{state[key]=value;}});
 canvas.getContext=()=>ctx;return canvas;
}
function withDocument(createCanvas,run){const previous=globalThis.document;globalThis.document={createElement:()=>createCanvas()};try{return run();}finally{globalThis.document=previous;}}
const channels=(data,channel)=>Array.from(data).filter((_,i)=>i%4===channel);
const assertBlack=data=>{for(let i=0;i<data.length;i+=4)assert.deepEqual([...data.slice(i,i+3)],[0,0,0]);};
const byte=value=>new Uint8ClampedArray([value])[0];

test('all 256 evaluated alpha bytes survive raster preparation; source RGB is discarded without LCD readback',()=>withDocument(recordingCanvas,()=>{
 const f=fixture(material(),[256,1]),texture={width:256,height:1,data:new Uint8ClampedArray(Array.from({length:256},(_,a)=>[79,137,219,a]).flat())};
 const textures=new Map([['dynamic',texture]]),renderer=new NativeLayoutRenderer({test:f.pack},{test:textures},new Map()),target=recordingCanvas();
 assert.equal(renderer.draw(target.getContext('2d'),'test','test',{allowOpaqueDarken:true}),true);
 assert.equal(target.draws.length,1);const draw=target.draws[0];
 assert.equal(draw.state.globalCompositeOperation,'source-over');assertBlack(draw.source.image.data);
 assert.deepEqual(channels(draw.source.image.data,3),Array.from({length:256},(_,a)=>a));
 assert.equal(target.reads,0);assert.equal(draw.source.reads,0);assert.equal(renderer.cacheBytes,256*4);
}));

test('opaque destination RGB algebra is exact for every byte pair, with at most one byte between usual rounding rules',()=>{
 let maximum=0;
 for(let a=0;a<256;a++)for(let d=0;d<256;d++){
  const native=blendNativePixel([.9,.3,.7,a/255],[d/255,d/255,d/255,1],blend)[0]*255;
  const sourceOver=d*(1-a/255);
  assert.ok(Math.abs(native-sourceOver)<1e-12);
  maximum=Math.max(maximum,Math.abs(byte(native)-Math.round(d*(255-a)/255)));
 }
 assert.ok(maximum<=1);
 // Opaque LCD projection is required: source-over retains alpha 1 here, while
 // the native color blend's alpha channel itself would be 1-As.
 assert.equal(blendNativePixel([0,0,0,1],[1,1,1,1],blend)[3],0);
});

test('the material guard rejects other equations and every non-Always or missing alpha comparison',()=>withDocument(recordingCanvas,()=>{
 const cases=[
  ['subtract',{colorBlend:{...blend,operation:2}},true],
  ['reverse-subtract',{colorBlend:{...blend,operation:3}},true],
  ['source-one',{colorBlend:{...blend,sourceFactor:1}},true],
  ['destination-source-alpha',{colorBlend:{...blend,destinationFactor:4}},true],
  ...Array.from({length:7},(_,value)=>[`alpha-compare-${value}`,{alphaCompare:{function:value,reference:.5}},true]),
  ['missing-compare',{alphaCompare:undefined},true],
  ['ordinary-alpha',{colorBlend:{operation:1,sourceFactor:4,destinationFactor:5}},false],
  ['implicit-blend',{colorBlend:undefined},false],
  ['no-blend',{colorBlend:{operation:0,sourceFactor:0,destinationFactor:0}},false],
  ['multiply',{colorBlend:{operation:1,sourceFactor:0,destinationFactor:2}},false],
 ];
 for(const [name,change,readback] of cases){
  const f=fixture({...material(),...change}),renderer=new NativeLayoutRenderer({test:f.pack},{test:new Map([['dynamic',pixels()]])},new Map()),target=recordingCanvas();
  assert.equal(renderer.draw(target.getContext('2d'),'test','test',{allowOpaqueDarken:true}),true,name);
  const cached=[...renderer.cache.values()][0];assert.deepEqual([...cached.image.data.slice(0,3)],[79,137,219],name);
  assert.equal(target.reads,readback?1:0,name);
  assert.equal(target.draws.at(-1).state.globalCompositeOperation,name==='multiply'?'multiply':readback?'copy':'source-over',name);
 }
}));

test('the fast path carries the caller clip, pane transform, opacity and saved context through a single draw',()=>withDocument(recordingCanvas,()=>{
 const f=fixture(material(),[2,3]);f.pane.translation=[2,3,0];f.pane.scale=[.5,.5];
 const renderer=new NativeLayoutRenderer({test:f.pack},{test:new Map([['dynamic',pixels()]])},new Map()),target=recordingCanvas(),ctx=target.getContext('2d');
 ctx.translate(4,5);ctx.globalCompositeOperation='screen';ctx.beginPath();ctx.rect(0,0,30,30);ctx.clip();const before=ctx.snapshot();
 assert.equal(renderer.draw(ctx,'test','test',{center:[8,6],scale:2,clip:[1,2,9,10],allowOpaqueDarken:true}),true);
 const draw=target.draws[0];
 assert.deepEqual(draw.rect,[0,0,2,3]);assert.equal(draw.state.globalAlpha,1);assert.equal(draw.state.clips.length,2);
 assert.deepEqual(draw.state.clips[1],[{rect:[1,2,9,10],matrix:[1,0,0,1,4,5]}]);
 const expected=[1,0,0,1,16,5];
 draw.state.matrix.forEach((value,i)=>assert.ok(Math.abs(value-expected[i])<1e-12));
 assert.deepEqual(ctx.snapshot(),before);assert.equal(target.reads,0);
}));

test('rotation, shear and nonunit Canvas alpha preserve the uncommon readback path',()=>withDocument(recordingCanvas,()=>{
 for(const [b,c,alpha] of [[.5,-.5,1],[.25,0,1],[0,.25,1],[0,0,.65],[0,0,0]]){
  const f=fixture(),renderer=new NativeLayoutRenderer({test:f.pack},{test:new Map([['dynamic',pixels()]])},new Map()),target=recordingCanvas(),ctx=target.getContext('2d');
  ctx.setTransform(1,b,c,1,0,0);ctx.globalAlpha=alpha;const before=ctx.snapshot();
  assert.equal(renderer.draw(ctx,'test','test',{allowOpaqueDarken:true}),true);
  assert.equal(target.reads,1);assert.equal(target.draws.at(-1).state.globalCompositeOperation,'copy');
  assertBlack([...renderer.cache.values()][0].image.data);assert.deepEqual(ctx.snapshot(),before);
 }
}));

test('opt-in, device-aligned clip bounds, integer placement and one-to-one texels guard the fast path',()=>withDocument(recordingCanvas,()=>{
 const cases=[
  ['default',{},[1,0,0,1,0,0],[1,1],[0,0,0],1],
  ['explicit',{allowOpaqueDarken:true},[1,0,0,1,0,0],[1,1],[0,0,0],0],
  ['integer clip',{allowOpaqueDarken:true,clip:[0,0,16,12]},[1,0,0,1,0,0],[1,1],[0,0,0],0],
  ['fractional clip',{allowOpaqueDarken:true,clip:[.25,0,16,12]},[1,0,0,1,0,0],[1,1],[0,0,0],1],
  ['pre-clip transform',{allowOpaqueDarken:true,clip:[0,0,16,12]},[1,0,0,1,.5,0],[1,1],[-.5,0,0],1],
  ['local fractional clip maps to device integers',{allowOpaqueDarken:true,clip:[.5,.5,8,6]},[2,0,0,2,0,0],[.5,.5],[0,0,0],0],
  ['half-pixel placement',{allowOpaqueDarken:true},[1,0,0,1,.5,0],[1,1],[0,0,0],1],
  ['resampled texels',{allowOpaqueDarken:true},[2,0,0,2,0,0],[1,1],[0,0,0],1],
 ];
 for(const [name,options,matrix,scale,translation,reads] of cases){
  const f=fixture();f.pane.scale=scale;f.pane.translation=translation;
  const renderer=new NativeLayoutRenderer({test:f.pack},{test:new Map([['dynamic',pixels()]])},new Map()),target=recordingCanvas(),ctx=target.getContext('2d');
  ctx.setTransform(...matrix);const before=ctx.snapshot();
  assert.equal(renderer.draw(ctx,'test','test',{center:[0,0],...options}),true,name);
  assert.equal(target.reads,reads,name);assert.equal(target.draws.at(-1).state.globalCompositeOperation,reads?'copy':'source-over',name);assert.deepEqual(ctx.snapshot(),before,name);
 }
}));

test('immutable dynamic textures retain distinct alpha rasters, LRU accounting, and disposal',()=>withDocument(recordingCanvas,()=>{
 const f=fixture(),textures=new Map([['dynamic',pixels(17)]]),renderer=new NativeLayoutRenderer({test:f.pack},{test:textures},new Map(),8),target=recordingCanvas(),ctx=target.getContext('2d');
 const first=pixels(64),second=pixels(192),paint=texture=>{assert.equal(renderer.draw(ctx,'test','test',texture?{textures:{dynamic:texture},allowOpaqueDarken:true}:{allowOpaqueDarken:true}),true);return target.draws.at(-1).source;};
 const a=paint(first),b=paint(second);assert.notEqual(a,b);assert.equal(a.image.data[3],64);assert.equal(b.image.data[3],192);
 assert.equal(paint(first),a);assert.equal(renderer.cacheBytes,8);
 const original=paint();assert.equal(original.image.data[3],17);assert.equal(b.width,0);assert.equal(b.height,0);assert.equal(renderer.cacheBytes,8);
 assert.equal(textures.get('dynamic').data[3],17);assert.equal(f.layout.materials[0].constantColors[0][0],255);
 renderer.dispose();assert.equal(a.width,0);assert.equal(original.width,0);assert.equal(renderer.cacheBytes,0);
}));

test('effective window materials and crop sampling remain part of the raster cache contract',()=>withDocument(recordingCanvas,()=>{
 const ordinary={...material(),colorBlend:{operation:1,sourceFactor:4,destinationFactor:5}},f=fixture(ordinary),textures=new Map([['dynamic',pixels()]]);
 const renderer=new NativeLayoutRenderer({test:f.pack},{test:textures},new Map()),darken=material(),crop={fullWidth:4,fullHeight:4,x:1,y:1};
 const a=renderer.picture('test',f.layout,picture,1,1,1,textures,darken,crop),b=renderer.picture('test',f.layout,picture,1,1,1,textures,undefined,crop);
 assertBlack(a.image.data);assert.deepEqual([...b.image.data.slice(0,3)],[79,137,219]);assert.notEqual(a,b);
 assert.equal(renderer.picture('test',f.layout,picture,1,1,1,textures,darken,crop),a);
 assert.notEqual(renderer.picture('test',f.layout,picture,1,1,1,textures,darken,{...crop,x:2}),a);
 const target=recordingCanvas();renderer.composite(target.getContext('2d'),a,0,0,1,1,f.layout,0,darken,true);
 assert.equal(target.reads,0);assert.equal(target.draws[0].state.globalCompositeOperation,'source-over');
}));

test('text preserves evaluated alpha and always uses readback for its additional pane clip',()=>withDocument(recordingCanvas,()=>{
 const f=fixture();delete f.pane.picture;f.layout.fonts=['font'];
 f.pane.text={font:0,material:0,value:'A',size:[1,1],alignment:0,lineAlignment:0,characterSpacing:0,lineSpacing:0,topColor:[40,80,120,200],bottomColor:[40,80,120,200]};
 const font={manifest:{height:1},drawNative(ctx){ctx.putImageData(pixels(),0,0);}};
 const renderer=new NativeLayoutRenderer({test:f.pack},{test:new Map()},new Map([['font',font]])),target=recordingCanvas();
 assert.equal(renderer.draw(target.getContext('2d'),'test','test',{allowOpaqueDarken:true}),true);
 const source=[...renderer.cache.values()][0],expected=new Uint8ClampedArray(evaluateNativeMaterial(f.layout.materials[0],[[79/255,137/255,219/255,173/255]],[40/255,80/255,120/255,200/255]).map(v=>v*255));
 assertBlack(source.image.data);assert.equal(source.image.data[3],expected[3]);assert.equal(source.reads,1);assert.equal(target.reads,1);
}));

const resourceRoot=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E'),packPath=resolve(resourceRoot,'packs/home/launcher.json');
async function cameraFixture(){
 const pack=JSON.parse(readFileSync(packPath)),source=pack.layouts.LncBase_U_00;
 const walk=panes=>panes.flatMap(p=>[p,...walk(p.children)]),pane=walk(source.roots).find(p=>p.name==='CameraBaseS_00'),m=source.materials[pane.picture.material];
 const textures=new Map();
 for(const map of m.textureMaps){const name=source.textures[map.texture],meta=pack.textures[name];if(!textures.has(name))textures.set(name,nativeTextureSamplePixels(await decodeNativePng(readFileSync(resolve(resourceRoot,meta.url)),meta),meta.picaFormat));}
 const project=p=>{const children=p.children.map(project).filter(Boolean);return p===pane||children.length?{...p,children}:null;};
 return {pane,layout:{...source,roots:[pane]},pathLayout:{...source,roots:source.roots.map(project).filter(Boolean)},animations:pack.animations,textures};
}
const upperBindings=[{name:'LncBase_U_00_SceneIn',frame:40},{name:'LncBase_U_00_Appear',frame:10},{name:'LncBase_U_00_WhiteBlack',frame:0}];
test('the settled source camera hierarchy reaches the fast path through the actual upper-base integer clip',{skip:!existsSync(packPath)},async()=>{
 const f=await cameraFixture();
 withDocument(recordingCanvas,()=>{
  const renderer=new NativeLayoutRenderer({test:{layouts:{test:f.pathLayout},animations:f.animations}},{test:f.textures},new Map()),target=recordingCanvas();target.width=400;target.height=240;
  assert.equal(renderer.draw(target.getContext('2d'),'test','test',{bindings:upperBindings,clip:[0,212,400,28],allowOpaqueDarken:true}),true,renderer.diagnostics.join('\n'));
  assert.equal(target.reads,0);assert.equal(target.draws.length,1);assert.equal(target.draws[0].state.globalCompositeOperation,'source-over');
  assert.deepEqual(target.draws[0].state.matrix,[1,0,0,1,0,215]);assert.deepEqual(target.draws[0].rect,[0,0,400,28]);
 });
});
test('actual CameraBaseS_00 keeps every evaluated alpha byte across transparent, inherited, settled and opaque primary alpha',{skip:!existsSync(packPath)},async()=>{
 const f=await cameraFixture(),m=f.layout.materials[f.pane.picture.material];assert.equal(m.name,'CameraBaseS_00');assert.deepEqual([m.colorBlend.operation,m.colorBlend.sourceFactor,m.colorBlend.destinationFactor,m.alphaCompare.function],[1,0,5,7]);
 withDocument(recordingCanvas,()=>{
  const renderer=new NativeLayoutRenderer({}, {},new Map());
  for(const alpha of [0,.125,100/255,1]){
   const expected=rasterNativePicture(f.layout,f.pane.picture,400,28,f.textures,alpha);
   const canvas=renderer.picture('home',f.layout,f.pane.picture,400,28,alpha,f.textures);
   assert.deepEqual(channels(canvas.image.data,3),channels(expected.data,3));assertBlack(canvas.image.data);
  }
 });
});

// Optional CPU Skia measurement, installed outside the repository. It is not
// evidence about the actual browser's Canvas/ANGLE backend or native hardware.
const canvasModule=process.env.NATIVE_CANVAS_MODULE?await import(pathToFileURL(resolve(process.env.NATIVE_CANVAS_MODULE)).href):null;
const createRealCanvas=canvasModule?.createCanvas??canvasModule?.default?.createCanvas;
function legacyDarken(ctx,source,x,y,w,h){
 const target=createRealCanvas(ctx.canvas.width,ctx.canvas.height),tmp=target.getContext('2d'),m=ctx.getTransform();
 tmp.setTransform(m);tmp.drawImage(source,x,y,w,h);tmp.resetTransform();
 const src=tmp.getImageData(0,0,target.width,target.height),dst=ctx.getImageData(0,0,target.width,target.height),det=m.a*m.d-m.b*m.c;
 for(let py=0;py<target.height;py++)for(let px=0;px<target.width;px++){
  const rx=px+.5-m.e,ry=py+.5-m.f,lx=(m.d*rx-m.c*ry)/det,ly=(-m.b*rx+m.a*ry)/det;
  if(lx<x||ly<y||lx>=x+w||ly>=y+h)continue;
  const at=(py*target.width+px)*4;
  dst.data.set(blendNativePixel(Array.from(src.data.slice(at,at+4),v=>v/255),Array.from(dst.data.slice(at,at+4),v=>v/255),blend).map(v=>v*255),at);dst.data[at+3]=255;
 }
 tmp.putImageData(dst,0,0);ctx.save();ctx.resetTransform();ctx.globalCompositeOperation='copy';ctx.drawImage(target,0,0);ctx.restore();
}
test('optional real Canvas: all alpha/destination bytes retain opaque output byte for byte',{skip:!createRealCanvas},t=>withDocument(()=>createRealCanvas(1,1),()=>{
 const f=fixture(),renderer=new NativeLayoutRenderer({}, {},new Map()),source=createRealCanvas(256,256),s=source.getContext('2d'),image=s.createImageData(256,256);
 for(let d=0;d<256;d++)for(let a=0;a<256;a++)image.data.set([0,0,0,a],(d*256+a)*4);s.putImageData(image,0,0);
 const target=createRealCanvas(256,256),ctx=target.getContext('2d'),background=ctx.createImageData(256,256);
 for(let d=0;d<256;d++)for(let a=0;a<256;a++)background.data.set([d,d,d,255],(d*256+a)*4);ctx.putImageData(background,0,0);
 renderer.composite(ctx,source,0,0,256,256,f.layout,0,undefined,true);
 const output=ctx.getImageData(0,0,256,256).data;let maximum=0,different=0;
 for(let d=0;d<256;d++)for(let a=0;a<256;a++){
  const at=(d*256+a)*4,expected=byte(blendNativePixel([0,0,0,a/255],[d/255,d/255,d/255,1],blend)[0]*255),delta=Math.abs(output[at]-expected);
  maximum=Math.max(maximum,delta);if(delta)different++;assert.equal(output[at+3],255);assert.equal(output[at+1],output[at]);assert.equal(output[at+2],output[at]);
 }
 assert.equal(maximum,0);t.diagnostic(JSON.stringify({maximumRgbByteDelta:maximum,differingBytePairs:different,total:65536}));
}));

test('optional real Canvas: guarded camera draws match the old readback, including the actual upper-base clip',{skip:!createRealCanvas||!existsSync(packPath)},async t=>{
 const f=await cameraFixture(),reference=rasterNativePicture(f.layout,f.pane.picture,400,28,f.textures,100/255);
 withDocument(()=>createRealCanvas(1,1),()=>{
  const flatPane={...f.pane,origin:0,translation:[0,0,0]},flatLayout={...f.layout,roots:[flatPane]};
  const renderer=new NativeLayoutRenderer({test:{layouts:{flat:flatLayout,settled:f.pathLayout},animations:f.animations}},{test:f.textures},new Map());
  const original=createRealCanvas(400,28),sourceCtx=original.getContext('2d'),data=sourceCtx.createImageData(400,28);data.data.set(reference.data);sourceCtx.putImageData(data,0,0);
  const fractionalClip=[12.25,8.25,370.5,30.5];
  const cases=[['integer',0,1,0],...Array.from([.1,.25,.5,.75,.9],offset=>[`fractional-${offset}`,offset,1,0]),['axis-scaled',.25,1.035,0],['axis-clipped',.25,1,0,fractionalClip],['rotated',.25,1.035,.025],['rotated-clipped',.25,1.035,.025,fractionalClip],['canvas-alpha',0,1,0,undefined,.65],['settled-upper-base',0,1,0,[0,212,400,28]]],results=[];
  for(const [name,offset,scale,rotation,clip,canvasAlpha=1] of cases){
   const settled=name==='settled-upper-base',width=settled?400:420,height=settled?240:64;
   const targets=[createRealCanvas(width,height),createRealCanvas(width,height)];
   for(const target of targets){const ctx=target.getContext('2d');ctx.fillStyle='rgb(173,219,247)';ctx.fillRect(0,0,width,height);if(!settled)ctx.translate(8+offset,10+offset);ctx.rotate(rotation);ctx.scale(scale,scale);ctx.globalAlpha=canvasAlpha;}
   assert.equal(renderer.draw(targets[0].getContext('2d'),'test',settled?'settled':'flat',{allowOpaqueDarken:true,clip,...(settled?{bindings:upperBindings}:{center:[0,0]})}),true,renderer.diagnostics.join('\n'));
   const oldCtx=targets[1].getContext('2d');if(clip){oldCtx.beginPath();oldCtx.rect(...clip);oldCtx.clip();}
   legacyDarken(oldCtx,original,0,settled?215:0,400,28);
   const [a,b]=targets.map(target=>target.getContext('2d').getImageData(0,0,width,height).data);let maximum=0,different=0;
   for(let i=0;i<a.length;i++){const delta=Math.abs(a[i]-b[i]);maximum=Math.max(maximum,delta);if(delta)different++;}
   assert.equal(maximum,0,name);results.push({name,maximumByteDelta:maximum,differingChannels:different});
  }
  t.diagnostic(JSON.stringify(results));
 });
});
