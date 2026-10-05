import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import ts from 'typescript';

// List 17 scissor: writer 0x18fe2c emits no pane scissor. Tests never pass the scenario.
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const rendererSource=readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8');
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
const codePath='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/exefs/code.bin';

test('host pane clip stays for every text path except direct writer 0x18fe2c', ()=>{
  assert.match(rendererSource, /writer0101:direct&&writer0101/);
  assert.match(rendererSource, /if\(!raster\.writer0101\)\{ctx\.beginPath\(\);ctx\.rect\(0,-raster\.above,w\*\(Math\.ceil\(w\)\+raster\.extra\)\/Math\.ceil\(w\),h\+raster\.above\+raster\.below\);ctx\.clip\(\);\}/);
  assert.match(rendererSource, /this\.composite\(ctx,textCanvas,0-raster\.phase\[0\],0-raster\.above-raster\.phase\[1\],raster\.direct&&sourceSize\?textCanvas\.width:w\*textCanvas\.width\/Math\.ceil\(w\),raster\.direct&&sourceSize\?textCanvas\.height:h\*textCanvas\.height\/Math\.ceil\(h\)/);
  assert.equal(rendererSource.includes('nativeWriter0101TextClip'), false);
  assert.match(painter, /textSamplingPanes:\['T_NewsTitleB_00','T_NewsTitleF_00'\]/);
  assert.match(painter, /textSamplingPanes:\['T_EndB_00'\]/);
  assert.equal(/textSamplingPanes:\[[^\]]*T_EndF_00/.test(painter), false);
  assert.equal(/azahar-12p4-fit|textCoverageAdaptation/.test(painter), false);
});

function blCallers(code, dest){
  const hits=[];
  for(let off=0; off+4<=code.length; off+=4){
    const instruction=code.readUInt32LE(off);
    if((instruction>>>28)===0xf||(instruction>>>24&0xf)!==0xb)continue;
    let imm=instruction&0xffffff;
    if(imm&0x800000)imm-=0x1000000;
    const at=0x100000+off;
    if(((at+8+(imm<<2))>>>0)===dest)hits.push(at);
  }
  return hits;
}
function blsIn(code, start, end){
  const hits=[];
  for(let addr=start; addr<end; addr+=4){
    const instruction=code.readUInt32LE(addr-0x100000);
    if((instruction>>>28)===0xf||(instruction>>>24&0xf)!==0xb)continue;
    let imm=instruction&0xffffff;
    if(imm&0x800000)imm-=0x1000000;
    hits.push([addr, (addr+8+(imm<<2))>>>0]);
  }
  return hits;
}

test('title writer does not reach the scissor register writer', t=>{
  if(!existsSync(codePath))return t.skip('private Notifications code.bin is absent');
  const code=readFileSync(codePath);
  assert.equal(createHash('sha256').update(code).digest('hex'), 'b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228');
  const word=address=>code.readUInt32LE(address-0x100000);
  assert.equal(word(0x18fe2c), 0xe92d43f0);
  assert.equal(word(0x1900d4), 0xe92d4ff0);
  assert.equal(word(0x190138), 0xebffff3b);
  assert.equal(word(0x166544), 0xe92d4fff);
  assert.equal(word(0x16668c), 0xe3a01065);
  assert.equal(word(0x1666b0), 0xe3a01065);
  assert.equal(word(0x17329c), 0xe92d47f0);
  assert.equal(word(0x173348), 0xebffcc7d);
  assert.deepEqual(blCallers(code, 0x18fe2c), [0x190138]);
  assert.deepEqual(blCallers(code, 0x1900d4), [0x1900ac]);
  assert.deepEqual(blCallers(code, 0x166544), [0x173348]);
  assert.deepEqual(blCallers(code, 0x17329c), [0x173bb0]);
  assert.deepEqual(blCallers(code, 0x188088), [0x166644, 0x166690]);
  const titleBls=blsIn(code, 0x18fe2c, 0x18ff88).map(([, dest])=>dest);
  const drawBls=blsIn(code, 0x1900d4, 0x1905b0).map(([, dest])=>dest);
  for(const dest of [0x166544, 0x17329c, 0x173348, 0x13cf38, 0x188088]){
    assert.equal(titleBls.includes(dest), false, `0x18fe2c bl ${dest.toString(16)}`);
    assert.equal(drawBls.includes(dest), false, `0x1900d4 bl ${dest.toString(16)}`);
  }
  assert.equal(drawBls.includes(0x18fe2c), true);
  // The other GPU helper sites write 0x8c/0x8e, not scissor 0x65.
  assert.equal(word(0x166f04), 0xe3a0108c);
  assert.equal(word(0x166f2c), 0xe3a0108e);
});

function clipCanvas(){
  const stack=[];
  let a=1, b=0, c=0, d=1, e=0, f=0, clips=0;
  const ctx={
    canvas:{width:320, height:240},
    imageSmoothingEnabled:true,
    save(){stack.push([a, b, c, d, e, f]);},
    restore(){[a, b, c, d, e, f]=stack.pop();},
    translate(x, y){e+=a*x+c*y; f+=b*x+d*y;},
    rotate(){},
    scale(sx, sy){a*=sx; b*=sx; c*=sy; d*=sy;},
    beginPath(){}, rect(){}, clip(){clips+=1;}, clearRect(){},
    getTransform(){return {a, b, c, d, e, f};},
    createImageData(w, h){return {width:w, height:h, data:new Uint8ClampedArray(w*h*4)};},
    putImageData(){},
    getImageData(x, y, w, h){return {width:w, height:h, data:new Uint8ClampedArray(w*h*4)};},
    drawImage(){},
    get clips(){return clips;},
  };
  ctx.canvas.getContext=()=>ctx;
  return ctx;
}
const layoutUrl=`data:text/javascript;base64,`+Buffer.from(ts.transpileModule(readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const {NativeLayoutRenderer}=await import(`data:text/javascript;base64,`+Buffer.from(ts.transpileModule(rendererSource.replace("'./native-layout'", JSON.stringify(layoutUrl)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const manifest=JSON.parse(readFileSync(new URL('fonts/shared/font.json', firmware), 'utf8'));
const bank=messages.messages.newslist_msbt_LZ;
const newBack=bank.messages[bank.labels.new_back].text;
const stripped=name=>{
  const layout=JSON.parse(JSON.stringify(news.layouts[name]));
  const strip=panes=>{for(const pane of panes){delete pane.picture; delete pane.window; strip(pane.children??[]);}};
  strip(layout.roots);
  return layout;
};
function clipCount(name, options, animations){
  const layout=stripped(name);
  const font={manifest, drawNative(){}};
  const previous=globalThis.document;
  const scratch=clipCanvas();
  globalThis.document={createElement:()=>scratch.canvas};
  const ctx=clipCanvas();
  try{
    const renderer=new NativeLayoutRenderer(
      {notifications:{schema:1, layouts:{[name]:layout}, animations:Object.fromEntries(animations.map(clip=>[clip, news.animations[clip]])), textures:{}, messages:{}}},
      {notifications:new Map()},
      new Map([[layout.fonts[0], font]]),
    );
    assert.equal(renderer.draw(ctx, 'notifications', name, options), true, renderer.diagnostics.join('\n'));
    renderer.dispose();
  }finally{globalThis.document=previous;}
  return ctx.clips;
}
const row=(sampling)=>({...sampling, bindings:[{name:'NewsWndwNews_D_00_SceneIn', frame:10}, {name:'NewsWndwNews_D_00_Select', frame:0}],
  overrides:{N_News_00:{translation:[-150, 85, -10]}, T_NewsTitleB_00:{text:'Back Sleep Mode'}, T_NewsTitleF_00:{text:'Front Sleep Mode'}, N_IconNew_00:{visible:false}}});

test('direct row titles skip the host pane clip; Close, source-size and ungated 3/2 still clip', ()=>{
  const rowClips=['NewsWndwNews_D_00_SceneIn', 'NewsWndwNews_D_00_Select'];
  assert.equal(clipCount('NewsWndwNews_D_00', row({textSampling:'lcd', textSamplingPanes:['T_NewsTitleB_00', 'T_NewsTitleF_00']}), rowClips), 0);
  assert.equal(clipCount('NewsWndwNews_D_00', row({textSampling:'lcd'}), rowClips), 2);
  assert.equal(clipCount('NewsWndwNews_D_00', row({textSampling:'lcd-source-size', textSamplingPanes:['T_NewsTitleB_00', 'T_NewsTitleF_00']}), rowClips), 2);
  assert.equal(clipCount('NewsWndwNews_D_00', row({}), rowClips), 2);
  assert.equal(clipCount('NewsTopBtn_D_00', {bindings:[{name:'NewsTopBtn_D_00_SceneIn', frame:20}], textSampling:'lcd', textSamplingPanes:['T_EndB_00'],
    overrides:{T_EndB_00:{text:newBack}, T_EndF_00:{text:newBack, singleLineBlockOrigin:'writer-0x110'}}}, ['NewsTopBtn_D_00_SceneIn']), 2);
});
