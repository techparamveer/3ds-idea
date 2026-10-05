import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const rendererSource=readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8');
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const healthPainter=readFileSync(new URL('../src/os/stock-native-health.ts', import.meta.url), 'utf8');
const layoutSource=readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8');
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const moduleFrom=source=>`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`;
const layoutUrl=moduleFrom(layoutSource);
const {poseNativeLayout, nativeWindowPatches}=await import(layoutUrl);
const {NativeLayoutRenderer}=await import(moduleFrom(rendererSource.replace("'./native-layout'", JSON.stringify(layoutUrl))));
const f32=Math.fround;
const stripH=119.60000610351562-11;

function pixelCanvas(){
  let width=1,height=1,pixels=new Uint8ClampedArray(4);
  const canvas={
    get width(){return width;},set width(v){width=v;pixels=new Uint8ClampedArray(width*height*4);},
    get height(){return height;},set height(v){height=v;pixels=new Uint8ClampedArray(width*height*4);},
    get pixels(){return pixels;},
  };
  const ctx={
    canvas,
    getImageData(x,y,w,h){
      const data=new Uint8ClampedArray(w*h*4);
      for(let row=0;row<h;row++)data.set(pixels.subarray(((y+row)*width+x)*4,((y+row)*width+x+w)*4),row*w*4);
      return {width:w,height:h,data};
    },
    createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},
    putImageData(image,dx,dy){for(let row=0;row<image.height;row++)pixels.set(image.data.subarray(row*image.width*4,(row+1)*image.width*4),((dy+row)*width+dx)*4);},
  };
  canvas.getContext=()=>ctx;
  return canvas;
}
const row=(canvas,y)=>[...canvas.pixels.subarray(y*canvas.width*4,(y+1)*canvas.width*4)];
const unit=(e,f)=>({a:1,b:0,c:0,d:1,e,f});

function frameLayout(width,height){
  const white=Array.from({length:4},()=>[255,255,255,255]);
  const mat=(name,texture)=>({name,bufferColor:[0,0,0,0],constantColors:[[255,255,255,255]],textureOnly:false,textureMaps:texture===undefined?[]:[{texture,wrapS:0,wrapT:0,minFilter:1,magFilter:1}],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]});
  const pane={kind:'wnd1',name:'frame',flags:1,origin:0,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[width,height],children:[],
    window:{flags:0,frameSize:[0,0,0,0],inflation:[0,0,0,0],content:{material:0,colors:white,uvSets:[]},frames:[{flip:0,material:1}]}};
  const layout={canvas:{width:320,height:240,origin:1},roots:[pane],materials:[mat('content'),mat('frame',1)],textures:['unused','frame'],fonts:[],groups:[],unsupported:[]};
  return {pane,layout};
}

test('linear edge clamp repeats the ceil-raster edge and leaves an integer dest unread', ()=>{
  const prior=globalThis.document;
  globalThis.document={createElement:pixelCanvas};
  try{
    const renderer=new NativeLayoutRenderer({},{},new Map());
    const ctx={getTransform:()=>unit(4,4)};
    const integer=pixelCanvas();integer.width=22;integer.height=22;
    integer.getContext('2d').getImageData=()=>{throw new Error('integer dest must not read');};
    assert.equal(renderer.linearEdgeClamp(ctx,integer,0,0,22,22), undefined);
    const scaled={getTransform:()=>({a:2,b:0,c:0,d:1,e:4,f:4})};
    const blocked=pixelCanvas();blocked.width=11;blocked.height=109;
    blocked.getContext('2d').getImageData=()=>{throw new Error('non-unit scale must not pad');};
    assert.equal(renderer.linearEdgeClamp(scaled,blocked,0,0,11,stripH), undefined);

    const source=pixelCanvas();source.width=11;source.height=109;
    for(let y=0;y<109;y++)for(let x=0;x<11;x++)source.pixels.set(y===108?[200,200,198,255]:[10,20,30,255],(y*11+x)*4);
    const clamped=renderer.linearEdgeClamp(ctx,source,0,0,11,stripH);
    assert.equal(clamped.canvas.width, 11);
    assert.equal(clamped.canvas.height, 110);
    assert.equal(clamped.w, 11);
    assert.equal(clamped.h, stripH*110/109);
    assert.deepEqual([clamped.clipW, clamped.clipH], [11, 109]);
    assert.deepEqual(row(clamped.canvas, 109), row(source, 108));
    assert.deepEqual(row(clamped.canvas, 108), row(source, 108));
    assert.deepEqual(row(clamped.canvas, 107), row(source, 107));
    assert.notDeepEqual(row(source, 107), row(source, 108));
    const map=(local,srcH,destH)=>local*srcH/destH;
    const before=map(108.5,109,stripH),after=map(108.5,110,clamped.h);
    assert.equal(before, after);
    assert.ok(before>108&&before<109);
    const interior=map(107.5,109,stripH);
    assert.equal(interior, map(107.5,110,clamped.h));
    assert.ok(interior<108);

    const wide=pixelCanvas();wide.width=11;wide.height=4;
    for(let y=0;y<4;y++)for(let x=0;x<11;x++)wide.pixels.set(x===10?[7,8,9,255]:[1,2,3,255],(y*11+x)*4);
    const across=renderer.linearEdgeClamp(ctx,wide,0,0,10.5,4);
    assert.equal(across.canvas.width, 12);
    assert.equal(across.canvas.height, 4);
    assert.equal(across.h, 4);
    assert.equal(across.w, 10.5*12/11);
    assert.deepEqual([across.clipW, across.clipH], [11, 4]);
    for(let y=0;y<4;y++)assert.deepEqual(across.canvas.pixels.subarray((y*12+11)*4,(y*12+12)*4), across.canvas.pixels.subarray((y*12+10)*4,(y*12+11)*4));
    renderer.dispose();
  }finally{globalThis.document=prior;}
});

test('integer-origin A8 pads a fractional strip, Health 22×22 does not, and a fractional translation still samples', ()=>{
  const prior=globalThis.document;
  globalThis.document={createElement:pixelCanvas};
  try{
    const a8Bytes=()=>{const data=new Uint8ClampedArray(11*11*4);for(let at=0;at<data.length;at+=4)data[at]=data[at+1]=data[at+2]=0,data[at+3]=255;return data;};
    const draw=(size,origin,format=8)=>{
      const {pane,layout}=frameLayout(size[0],size[1]);
      const events=[],reads=[];
      const target={width:320,height:240};
      const ctx={canvas:target,globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},clip(){},resetTransform(){},
        rect(...args){events.push({op:'rect',args});},
        drawImage(image,...args){events.push({op:'image',image,args,sw:image.width,sh:image.height});},
        getTransform:()=>unit(origin[0],origin[1]),
        getImageData(x,y,w,h){reads.push({x,y,w,h});return {width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(255)};},
        createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},
        putImageData(){}};
      let smoothing=true;
      Object.defineProperty(ctx,'imageSmoothingEnabled',{get(){return smoothing;},set(v){assert.notEqual(v,false);smoothing=v;}});
      const pack={schema:1,layouts:{bar:layout},animations:{},textures:{},messages:{}};
      const renderer=new NativeLayoutRenderer({pack},{pack:new Map([['frame',{width:11,height:11,data:a8Bytes(),picaFormat:format}]])},new Map());
      assert.equal(renderer.draw(ctx,'pack','bar',{pictureSampling:'lcd',center:[0,0]}), true, renderer.diagnostics.at(-1));
      renderer.dispose();
      return {events,reads,pane,layout};
    };
    const fractional=draw([22,108.6],[10,20]);
    assert.equal(fractional.reads.length, 0, 'integer-origin A8 is not lcd-sampled');
    const images=fractional.events.filter(event=>event.op==='image'&&event.args.length===4);
    const right=images.find(event=>event.args[0]===11&&event.args[1]===0&&!Number.isInteger(event.args[3]));
    assert.ok(right);
    const strip=108.6-11,raster=Math.ceil(strip);
    assert.equal(right.sw, 11);
    assert.equal(right.sh, raster+1);
    assert.equal(right.args[2], 11);
    assert.equal(right.args[3], strip*(raster+1)/raster);
    assert.deepEqual(row(right.image, raster), row(right.image, raster-1));
    const clip=fractional.events[fractional.events.indexOf(right)-1];
    assert.deepEqual(clip.args, [11,0,11,Math.ceil(strip)]);
    const health=draw([22,22],[10,20]);
    assert.equal(health.reads.length, 0);
    assert.equal(health.events.some(event=>event.op==='rect'), false);
    for(const event of health.events.filter(item=>item.op==='image')){
      assert.equal(event.args.length, 4);
      assert.equal(event.sw, event.args[2]);
      assert.equal(event.sh, event.args[3]);
      assert.equal(Number.isInteger(event.args[2])&&Number.isInteger(event.args[3]), true);
    }
    const scrolled=draw([22,22],[10,20.3]);
    assert.ok(scrolled.reads.length>0, 'fractional translation still lcd-samples A8');
    assert.equal(scrolled.events.some(event=>event.op==='rect'), false);
  }finally{globalThis.document=prior;}
});

test('Health integer size still skips projectedPicture; extra-6, Close, list, and the HUD stay put', async ()=>{
  assert.match(rendererSource, /!lcd\|\|Number\.isInteger\(m\.e\)&&Number\.isInteger\(m\.f\)&&Number\.isInteger\(w\)&&Number\.isInteger\(h\)/);
  assert.match(rendererSource, /framePixels\?\.picaFormat===8&&pose&&Number\.isInteger\(pose\.e\)&&Number\.isInteger\(pose\.f\)/);
  assert.match(rendererSource, /Host compositor adaptation of wrapT 0/);
  assert.match(rendererSource, /not a dump scissor/);
  assert.match(rendererSource, /allowOpaqueDarken,framePixels\?\.picaFormat===8\)/);
  assert.equal(rendererSource.includes('imageSmoothingEnabled=false'), false);
  assert.deepEqual([...rendererSource.matchAll(/imageSmoothingEnabled\s*=\s*(?:true|false)/g)].map(match=>match[0]), ['imageSmoothingEnabled=true']);
  const prior=globalThis.document;
  globalThis.document={createElement:pixelCanvas};
  try{
    const material={name:'picture',bufferColor:[0,0,0,0],constantColors:[[255,255,255,255]],textureMaps:[{texture:0,wrapS:0,wrapT:0,minFilter:0,magFilter:0}],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]};
    const picture={material:0,colors:Array.from({length:4},()=>[255,255,255,255]),uvSets:[[0,0,1,0,0,1,1,1]]};
    const layout={canvas:{width:320,height:240,origin:1},roots:[],materials:[material],textures:['tex'],fonts:[],groups:[],unsupported:[]};
    const textures=new Map([['tex',{width:1,height:1,data:new Uint8ClampedArray([239,239,237,255])}]]);
    const renderer=new NativeLayoutRenderer({},{},new Map());
    const target=pixelCanvas();target.width=320;target.height=240;
    const ctx=target.getContext('2d');
    ctx.globalAlpha=1;
    ctx.getTransform=()=>unit(4,4);
    ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(255)});
    assert.equal(renderer.projectedPicture(ctx,layout,picture,22,22,1,textures,true), false);
    renderer.dispose();
  }finally{globalThis.document=prior;}
  const compiled=ts.transpileModule(painter,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replaceAll("'./native-layout'", JSON.stringify(new URL('../src/os/native-layout.ts', import.meta.url).href))
    .replaceAll("'./stock-screen-layout'", JSON.stringify(new URL('../src/os/stock-screen-layout.ts', import.meta.url).href))
    .replaceAll("'./device-status-profile'", JSON.stringify(new URL('../src/os/device-status-profile.ts', import.meta.url).href));
  const {notificationSlideBarPose}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  const idle=notificationSlideBarPose(0, 9);
  assert.equal(idle.extra, 6);
  assert.equal(idle.thumbHeight, f32(f32(f32(184)*f32(0.95))-f32(f32(f32(184)*f32(0.05))*f32(6))));
  assert.equal(idle.thumbHeight, 119.60000610351562);
  assert.equal(idle.thumbHeight-11, stripH);
  const section=painter.slice(painter.indexOf("renderer.packs['notification-messages']"), painter.indexOf('options.font?.draw(bottom,view.text'));
  assert.match(section, /'notification-slidebar','SlideBar',\{pictureSampling:'lcd'/);
  assert.equal(/'NewsWndwNews_D_00',[^{]*\{[^}]*pictureSampling/.test(section), false);
  assert.equal(/'NewsTopBtn_D_00',[^{]*\{[^}]*pictureSampling/.test(section), false);
  const hudStart=painter.indexOf("'notification-hud','HudMenu_00'");
  const hud=painter.slice(hudStart, painter.indexOf("'notifications','NewsTopUI_D_00'", hudStart));
  assert.equal(hud.includes('pictureSampling'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('imageSmoothingEnabled'), false);
  assert.match(healthPainter, /B_Slide_00:\{size:\[24,22\]/);
  assert.equal(/SBBtn(?:Shdw|Frame)?:\{size:/.test(healthPainter), false);
  assert.equal(typeof poseNativeLayout, 'function');
  assert.equal(typeof nativeWindowPatches, 'function');
});

test('Mac-screen clamp recapture is empty-mask 0/0 on this still', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const native=`${root}/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`;
  const lower=`${root}/home-fidelity-20261001/notifications-scrollbar-1-clamp-recapture-20261005/browser/lower.png`;
  const report=`${root}/home-fidelity-20261001/notifications-scrollbar-1-clamp-recapture-20261005/report.json`;
  if(![native, lower, report].every(existsSync))return t.skip('private Notifications recapture is absent');
  assert.equal(sha(native), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(lower), '8a624950ee546fbd35a69111fefa5db2735e311436ce6a4015b4521e10694804');
  assert.equal(sha(report), '34eb7d08aa77f5260f40961b0207184da59897ac268d4d85e9cd353b8f0118c1');
  const parsed=JSON.parse(readFileSync(report, 'utf8'));
  assert.equal(parsed.threshold, 2);
  assert.deepEqual(parsed.mask.regions, []);
  assert.equal(parsed.result, 'pixel-threshold-pass');
  assert.equal(parsed.screens.upper.pixelsOverThreshold, 0);
  assert.equal(parsed.screens.lower.pixelsOverThreshold, 0);
  assert.ok(parsed.screens.upper.maxRgbError<=2);
  assert.ok(parsed.screens.lower.maxRgbError<=2);
  const sharp=require('sharp');
  const nativeLower=await sharp(native).extract({left:40,top:240,width:320,height:240}).ensureAlpha().raw().toBuffer();
  const browserLower=await sharp(lower).ensureAlpha().raw().toBuffer();
  const at=(buf,x,y)=>[buf[(y*320+x)*4],buf[(y*320+x)*4+1],buf[(y*320+x)*4+2]];
  let n=0;
  for(let y=0;y<240;y++)for(let x=0;x<320;x++){
    const e=Math.max(...at(nativeLower,x,y).map((v,i)=>Math.abs(v-at(browserLower,x,y)[i])));
    if(e>2)n++;
  }
  assert.equal(n, 0);
  assert.deepEqual(at(nativeLower, 310, 111), [200,200,198]);
  assert.deepEqual(at(browserLower, 310, 111), [200,200,198]);
  assert.deepEqual(at(nativeLower, 310, 112), [200,200,198]);
  assert.ok(Math.max(...at(browserLower, 310, 112).map((v,i)=>Math.abs(v-at(nativeLower, 310, 112)[i])))<=2);
});
