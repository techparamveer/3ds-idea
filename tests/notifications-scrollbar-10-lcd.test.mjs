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
const slidebar=JSON.parse(readFileSync(new URL('packs/notifications/slidebar.json', firmware), 'utf8'));
const healthSlidebar=JSON.parse(readFileSync(new URL('packs/health-and-safety/slidebar.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const moduleFrom=source=>`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`;
const layoutUrl=moduleFrom(layoutSource);
const {poseNativeLayout, nativeWindowPatches, rasterNativePicture, nativeTextureSamplePixels}=await import(layoutUrl);
const {NativeLayoutRenderer}=await import(moduleFrom(readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8').replace("'./native-layout'", JSON.stringify(layoutUrl))));
const f32=Math.fround;
const guard=/!lcd\|\|Number\.isInteger\(m\.e\)&&Number\.isInteger\(m\.f\)&&Number\.isInteger\(w\)&&Number\.isInteger\(h\)/;

function offscreen(){
  const canvas={width:1,height:1};
  const ctx={canvas,save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},resetTransform(){},drawImage(){},
    createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},
    putImageData(image){canvas.image=image;}};
  canvas.getContext=()=>ctx;
  return canvas;
}

test('lcd opt-in samples a non-integer dest size and skips only an all-integer pane', ()=>{
  assert.match(rendererSource, guard, 'axis-aligned lcd skip requires integer translation and integer size');
  assert.equal(rendererSource.includes('!lcd||Number.isInteger(m.e)&&Number.isInteger(m.f))'), false);
  assert.match(rendererSource, /framePixels\?\.picaFormat!==8/);
  assert.equal(rendererSource.includes('vcvt'), false);
  const prior=globalThis.document;
  globalThis.document={createElement:offscreen};
  try{
    const material={name:'picture',bufferColor:[0,0,0,0],constantColors:[[255,255,255,255]],textureMaps:[{texture:0,wrapS:0,wrapT:0,minFilter:0,magFilter:0}],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]};
    const picture={material:0,colors:Array.from({length:4},()=>[255,255,255,255]),uvSets:[[0,0,1,0,0,1,1,1]]};
    const layout={canvas:{width:320,height:240,origin:1},roots:[],materials:[material],textures:['tex'],fonts:[],groups:[],unsupported:[]};
    const textures=new Map([['tex',{width:1,height:1,data:new Uint8ClampedArray([239,239,237,255])}]]);
    const renderer=new NativeLayoutRenderer({},{},new Map());
    const target=offscreen();target.width=320;target.height=240;
    const ctx=target.getContext('2d');
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:4,f:4});
    ctx.getImageData=(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(255)});
    assert.equal(renderer.projectedPicture(ctx,layout,picture,22,22,1,textures,true), false, 'Health 22×22 integer size stays on the Canvas path');
    assert.equal(renderer.projectedPicture(ctx,layout,picture,16,16,1,textures,true), false, 'integer emboss stays on the Canvas path');
    assert.equal(renderer.projectedPicture(ctx,layout,picture,11,108.6,1,textures,true), true, 'fractional height samples even when translation is integral');
    assert.equal(renderer.projectedPicture(ctx,layout,picture,10.5,22,1,textures,true), true, 'fractional width samples even when translation is integral');
    assert.equal(renderer.projectedPicture(ctx,layout,picture,11,108.6,1,textures,false), false, 'fractional size still requires the lcd opt-in');
    renderer.dispose();
  }finally{globalThis.document=prior;}
});

test('A8 window frames stay on Canvas; an LA8 fractional strip samples', ()=>{
  const prior=globalThis.document;
  globalThis.document={createElement:offscreen};
  try{
    const white=Array.from({length:4},()=>[255,255,255,255]);
    const mat=(name,texture)=>({name,bufferColor:[0,0,0,0],constantColors:[[255,255,255,255]],textureOnly:false,textureMaps:texture===undefined?[]:[{texture,wrapS:0,wrapT:0,minFilter:1,magFilter:1}],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]});
    const pane={kind:'wnd1',name:'frame',flags:1,origin:0,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[22,108.6],children:[],
      window:{flags:0,frameSize:[0,0,0,0],inflation:[0,0,0,0],content:{material:0,colors:white,uvSets:[]},frames:[{flip:0,material:1}]}};
    const layout={canvas:{width:320,height:240,origin:1},roots:[pane],materials:[mat('content'),mat('frame',1)],textures:['unused','frame'],fonts:[],groups:[],unsupported:[]};
    const bytes=()=>new Uint8ClampedArray(11*11*4).fill(255);
    const draw=(pixels)=>{
      const reads=[];
      const target=offscreen();target.width=320;target.height=240;
      const ctx=target.getContext('2d');
      ctx.globalAlpha=1;
      ctx.getTransform=()=>({a:1,b:0,c:0,d:1,e:10,f:20});
      ctx.getImageData=(x,y,w,h)=>{reads.push({x,y,w,h});return {width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(255)};};
      const pack={schema:1,layouts:{bar:layout},animations:{},textures:{},messages:{}};
      const renderer=new NativeLayoutRenderer({pack},{pack:new Map([['frame',pixels]])},new Map());
      assert.equal(renderer.draw(ctx,'pack','bar',{pictureSampling:'lcd',center:[0,0]}), true, renderer.diagnostics.at(-1));
      renderer.dispose();
      return reads.length;
    };
    const a8=bytes();
    for(let at=0;at<a8.length;at+=4)a8[at]=a8[at+1]=a8[at+2]=0;
    assert.equal(draw({width:11,height:11,data:a8,picaFormat:8}), 0, 'A8 fractional frame is not LCD-sampled');
    assert.ok(draw({width:11,height:11,data:bytes()})>0, 'LA8 fractional strip is LCD-sampled');
  }finally{globalThis.document=prior;}
});

test('SBBtnRT LCD centres at y=112 are the face; the A8 frame centre is the black stroke', async ()=>{
  const sharp=require('sharp');
  const textures=new Map();
  for(const [name, meta] of Object.entries(slidebar.textures)){
    const png=await sharp(fileURLToPath(new URL(meta.url, firmware))).ensureAlpha().raw().toBuffer();
    textures.set(name, nativeTextureSamplePixels({width:meta.width,height:meta.height,data:png}, meta.picaFormat));
  }
  const compiled=ts.transpileModule(painter,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replaceAll("'./native-layout'", JSON.stringify(new URL('../src/os/native-layout.ts', import.meta.url).href))
    .replaceAll("'./stock-screen-layout'", JSON.stringify(new URL('../src/os/stock-screen-layout.ts', import.meta.url).href))
    .replaceAll("'./device-status-profile'", JSON.stringify(new URL('../src/os/device-status-profile.ts', import.meta.url).href));
  const {notificationSlideBarPose}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  const idle=notificationSlideBarPose(0, 9);
  assert.equal(idle.thumbHeight, f32(f32(f32(184)*f32(0.95))-f32(f32(f32(184)*f32(0.05))*f32(6))));
  assert.equal(idle.thumbY, f32(f32(204-idle.thumbHeight)*f32(0.5)));
  const groove=f32(184+132-112);
  const posed=poseNativeLayout(slidebar.layouts.SlideBar, slidebar.animations, [{name:'SlideBar_Select',frame:0}], {
    N_Slider_00:{translation:[141,14,0]},
    SBBaseLine_00:{size:[8,184]},
    SBBaseWndw:{size:[16,groove]},
    B_Groove_00:{size:[16,groove]},
    SBBtn:{size:[22,idle.thumbHeight]},
    SBBtnShdw:{size:[22,idle.thumbHeight]},
    SBBtnFrame:{size:[22,idle.thumbHeight]},
    B_Slide_00:{size:[24,idle.thumbHeight],translation:[0,idle.thumbY,0]},
    N_Slide_00:{translation:[0,idle.thumbY,0]},
  });
  const pane=name=>{
    const walk=panes=>{for(const item of panes){if(item.name===name)return item;const child=walk(item.children??[]);if(child)return child;}};
    return walk(posed.roots);
  };
  const origin=name=>{
    const path=[];
    const walk=(panes,acc)=>{
      for(const item of panes){
        const next=acc.concat(item);
        if(item.name===name){path.push(...next);return true;}
        if(walk(item.children??[], next))return true;
      }
      return false;
    };
    walk(posed.roots, []);
    let e=160,f=120;
    for(const item of path){e+=item.translation[0];f-=item.translation[1];}
    const leaf=path.at(-1);
    return {e:e-leaf.size[0]/2,f:f-leaf.size[1]/2};
  };
  const button=origin('SBBtn');
  const strip=nativeWindowPatches(pane('SBBtn'), posed, textures).find(patch=>patch.material?.name==='SBBtnRT');
  const frame=nativeWindowPatches(pane('SBBtnFrame'), posed, textures).find(patch=>patch.x===11&&patch.y===0);
  const shadow=nativeWindowPatches(pane('SBBtnShdw'), posed, textures).find(patch=>patch.x===11&&patch.y===0);
  const format=patch=>{
    const material=patch.material??posed.materials[patch.picture.material];
    return textures.get(posed.textures[material.textureMaps[0].texture]).picaFormat;
  };
  assert.equal(button.e+strip.x, 301);
  assert.equal(button.f+strip.y, 4);
  assert.equal(Number.isInteger(button.e+strip.x)&&Number.isInteger(button.f+strip.y), true);
  assert.equal(Number.isInteger(strip.height), false);
  assert.equal(strip.height, idle.thumbHeight-11);
  assert.equal(format(strip), undefined, 'LA8 strip is not an A8 frame');
  assert.equal(format(frame), 8);
  assert.equal(format(shadow), 8);
  assert.equal(Number.isInteger(frame.height), false);
  const sample=(patch,e,f,x,y)=>{
    const pixels=rasterNativePicture(posed, patch.picture, 1, 1, textures, 1, patch.material, {
      x:0,y:0,fullWidth:patch.width,fullHeight:patch.height,
      localTransform:[1,0,0,1,x+.5-e-.5,y+.5-f-.5],
    });
    return [...pixels.data];
  };
  for(let x=301;x<=308;x++)assert.deepEqual(sample(strip, 301, 4, x, 112).slice(0, 3), [239,239,237], `x=${x} is the face`);
  assert.deepEqual(sample(strip, 301, 4, 309, 112).slice(0, 3), [236,236,234]);
  const stroke=sample(frame, button.e+frame.x, button.f+frame.y, 310, 112);
  assert.deepEqual(stroke.slice(0, 3), [0,0,0], 'frame A8 stroke centre is black; it stays off the lcd path');
  assert.ok(stroke[3]>250);
  const health=name=>{
    const walk=panes=>{for(const item of panes){if(item.name===name)return item;const child=walk(item.children??[]);if(child)return child;}};
    return walk(healthSlidebar.layouts.SlideBar.roots);
  };
  assert.deepEqual(health('SBBtn').size, [22,22]);
  assert.deepEqual(health('SBBtnFrame').size, [22,22]);
  assert.deepEqual(health('SBBtnShdw').size, [22,22]);
  assert.match(healthPainter, /B_Slide_00:\{size:\[24,22\]/);
  assert.equal(/SBBtn(?:Shdw|Frame)?:\{size:/.test(healthPainter), false);
});

test('Close, list titles, and the HUD do not take picture sampling', ()=>{
  const section=painter.slice(painter.indexOf("renderer.packs['notification-messages']"), painter.indexOf('options.font?.draw(bottom,view.text'));
  assert.match(section, /'notification-slidebar','SlideBar',\{pictureSampling:'lcd'/);
  assert.equal(/'NewsWndwNews_D_00',[^{]*\{[^}]*pictureSampling/.test(section), false);
  assert.equal(/'NewsTopBtn_D_00',[^{]*\{[^}]*pictureSampling/.test(section), false);
  const hudStart=painter.indexOf("'notification-hud','HudMenu_00'");
  const hud=painter.slice(hudStart, painter.indexOf("'notifications','NewsTopUI_D_00'", hudStart));
  assert.equal(hud.includes('pictureSampling'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
});

test('frozen lcd recapture scrollbar is still the 10-pixel strip end', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const native=`${root}/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`;
  const lower=`${root}/home-fidelity-20261001/notifications-scrollbar-34-lcd-recapture-20261005/browser/lower.png`;
  const report=`${root}/home-fidelity-20261001/notifications-scrollbar-34-lcd-recapture-20261005/report.json`;
  const code=`${root}/assets/stock-ui/extracted/notifications/exefs/code.bin`;
  if(![native, lower, report].every(existsSync))return t.skip('private Notifications recapture is absent');
  assert.equal(sha(native), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(lower), '6536e8eb3222b7bfab55ae070f00bedc2ca72c86313a7db448cdac91e0f21c56');
  assert.equal(sha(report), '2639cbb2672ecc26cb814feffe1741779180595c39754058d60cc78efe57f350');
  if(existsSync(code))assert.equal(sha(code), 'b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228');
  const sharp=require('sharp');
  const nativeLower=await sharp(native).extract({left:40,top:240,width:320,height:240}).ensureAlpha().raw().toBuffer();
  const browserLower=await sharp(lower).ensureAlpha().raw().toBuffer();
  const rows=new Map();
  let n=0,max=0;
  for(let y=0;y<210;y++)for(let x=291;x<320;x++){
    const i=(y*320+x)*4;
    const e=Math.max(Math.abs(nativeLower[i]-browserLower[i]), Math.abs(nativeLower[i+1]-browserLower[i+1]), Math.abs(nativeLower[i+2]-browserLower[i+2]));
    if(e>2){
      n++;max=Math.max(max, e);
      const row=rows.get(y)??{n:0,x0:x,x1:x};
      row.n++;row.x0=Math.min(row.x0, x);row.x1=Math.max(row.x1, x);
      rows.set(y, row);
    }
  }
  assert.equal(n, 10);
  assert.equal(max, 39);
  assert.deepEqual([...rows.keys()], [112]);
  assert.equal(rows.get(112).n, 10);
  assert.deepEqual([rows.get(112).x0, rows.get(112).x1], [301, 310]);
  const at=(buf,x,y)=>[buf[(y*320+x)*4], buf[(y*320+x)*4+1], buf[(y*320+x)*4+2]];
  assert.deepEqual(at(nativeLower, 305, 112), [238,238,237]);
  assert.deepEqual(at(nativeLower, 309, 112), [236,236,234]);
  assert.deepEqual(at(nativeLower, 310, 112), [200,200,198]);
  assert.deepEqual(at(browserLower, 310, 111), [200,200,198]);
  assert.ok(Math.max(...at(browserLower, 301, 112).map((v,i)=>Math.abs(v-at(nativeLower, 301, 112)[i])))>2);
});
