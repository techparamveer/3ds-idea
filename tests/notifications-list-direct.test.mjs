import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Notifications list 820 / seam 56: bounded writer-0x101 direct sampling for the
// row titles (notifications-list-direct-2026-10-04.md). Tests never pass the scenario.
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const camera=readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
const manifest=JSON.parse(readFileSync(new URL('fonts/shared/font.json', firmware), 'utf8'));
const compiled=ts.transpileModule(readFileSync(new URL('../src/os/bitmap-font.ts', import.meta.url), 'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {BitmapFont}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const layoutUrl=`data:text/javascript;base64,`+Buffer.from(ts.transpileModule(readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const {NativeLayoutRenderer}=await import(`data:text/javascript;base64,`+Buffer.from(ts.transpileModule(readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8').replace("'./native-layout'", JSON.stringify(layoutUrl)).replace("'./bitmap-font'", JSON.stringify(new URL('../src/os/bitmap-font.ts', import.meta.url).href)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const bank=messages.messages.newslist_msbt_LZ;
const newBack=bank.messages[bank.labels.new_back].text;

function trackingCanvas(width=320, height=240){
  const stack=[];
  let a=1, b=0, c=0, d=1, e=0, f=0;
  const ctx={
    canvas:{width, height},
    imageSmoothingEnabled:true,
    save(){stack.push([a, b, c, d, e, f]);},
    restore(){[a, b, c, d, e, f]=stack.pop();},
    translate(x, y){e+=a*x+c*y; f+=b*x+d*y;},
    rotate(){},
    scale(sx, sy){a*=sx; b*=sx; c*=sy; d*=sy;},
    beginPath(){}, rect(){}, clip(){}, clearRect(){},
    getTransform(){return {a, b, c, d, e, f};},
    createImageData(w, h){return {width:w, height:h, data:new Uint8ClampedArray(w*h*4)};},
    putImageData(){},
    getImageData(x, y, w, h){return {width:w, height:h, data:new Uint8ClampedArray(w*h*4)};},
    drawImage(){},
  };
  ctx.canvas.getContext=()=>ctx;
  return ctx.canvas;
}
const stripped=name=>{
  const layout=JSON.parse(JSON.stringify(news.layouts[name]));
  const strip=panes=>{for(const pane of panes){delete pane.picture; delete pane.window; strip(pane.children??[]);}};
  strip(layout.roots);
  return layout;
};
// Draw one source layout through the real renderer with a recording font.
function record(name, options, animations){
  const layout=stripped(name), calls=[];
  const font={manifest, drawNative(...args){calls.push({value:args[1], phase:args[9], lcd:args[10], origin:args[20]});}};
  const previous=globalThis.document;
  globalThis.document={createElement:()=>trackingCanvas(1, 1)};
  try{
    const renderer=new NativeLayoutRenderer(
      {notifications:{schema:1, layouts:{[name]:layout}, animations:Object.fromEntries(animations.map(clip=>[clip, news.animations[clip]])), textures:{}, messages:{}}},
      {notifications:new Map()},
      new Map([[layout.fonts[0], font]]),
    );
    assert.equal(renderer.draw(trackingCanvas().getContext(), 'notifications', name, options), true, renderer.diagnostics.join('\n'));
    renderer.dispose();
  }finally{globalThis.document=previous;}
  return calls;
}
const rowOptions=(slot, sampling)=>({...sampling, bindings:[{name:'NewsWndwNews_D_00_SceneIn', frame:10}, {name:'NewsWndwNews_D_00_Select', frame:0}],
  overrides:{N_News_00:{translation:[-150, 85-slot*53, -10]}, T_NewsTitleB_00:{text:'Back Sleep Mode'}, T_NewsTitleF_00:{text:'Front Sleep Mode'}, N_IconNew_00:{visible:false}}});
const titles=calls=>({back:calls.find(call=>call.value.startsWith('Back')), front:calls.find(call=>call.value.startsWith('Front'))});
const allowlist={textSampling:'lcd', textSamplingPanes:['T_NewsTitleB_00', 'T_NewsTitleF_00']};

test('painter allowlists both row titles; Close keeps only T_EndB_00', ()=>{
  assert.match(painter, /renderer\.draw\(bottom,'notifications','NewsWndwNews_D_00',\{textSampling:'lcd',textSamplingPanes:\['T_NewsTitleB_00','T_NewsTitleF_00'\],bindings:/);
  assert.match(painter, /'NewsTopBtn_D_00',\{bindings:\[\{name:'NewsTopBtn_D_00_SceneIn',frame:20\}\],textSampling:'lcd',textSamplingPanes:\['T_EndB_00'\],/);
  assert.equal(/textSamplingPanes:\[[^\]]*T_EndF_00/.test(painter), false);
  assert.equal(/textSamplingPanes:\['T_EndB_00'[^\]]*T_NewsTitle/.test(painter), false);
  assert.equal(/azahar-12p4-fit|textCoverageAdaptation/.test(painter), false);
});

test('renderer.draw samples the row titles once at final LCD rows', ()=>{
  for(const slot of [0, 1, 2, 3]){
    const {back, front}=titles(record('NewsWndwNews_D_00', rowOptions(slot, allowlist), ['NewsWndwNews_D_00_SceneIn', 'NewsWndwNews_D_00_Select']));
    // B sits at layout y -9.5: its final rows are half a pixel into the LCD.
    assert.deepEqual(back, {value:'Back Sleep Mode', phase:[0, 0.5], lcd:true, origin:undefined}, `slot ${slot}`);
    assert.equal(front.lcd, true, `slot ${slot}`);
    assert.equal(front.phase[0], 0);
    assert.ok(Math.abs(front.phase[1]-0.000740051269531)<1e-6, `F keeps y -8.00074 (slot ${slot})`);
  }
});

test('writer-0x101 is opt-in: no allowlist, source-size sampling or a negative bearing keeps the pane raster', ()=>{
  // A whole-layout 'lcd' call (as Camera/Settings-style callers do) does not retarget 3/2 panes.
  for(const sampling of [{textSampling:'lcd'}, {textSampling:'lcd-source-size', textSamplingPanes:['T_NewsTitleB_00', 'T_NewsTitleF_00']}, {}]){
    const {back, front}=titles(record('NewsWndwNews_D_00', rowOptions(0, sampling), ['NewsWndwNews_D_00_SceneIn', 'NewsWndwNews_D_00_Select']));
    for(const call of [back, front])assert.deepEqual([call.phase, call.lcd], [[0, 0], false], JSON.stringify(sampling));
  }
  const negative=Object.entries(manifest.glyphs).find(([, glyph])=>glyph.left<0)[0];
  const options=rowOptions(0, allowlist);options.overrides.T_NewsTitleB_00={text:'Back '+String.fromCodePoint(Number(negative))};
  const {back}=titles(record('NewsWndwNews_D_00', options, ['NewsWndwNews_D_00_SceneIn', 'NewsWndwNews_D_00_Select']));
  assert.deepEqual([back.phase, back.lcd], [[0, 0], false], 'measured left must be 0');
  // Camera's 3/2 TxtNumber0 dialogs use whole-layout lcd-source-size, so they stay on the raster path.
  assert.match(camera, /drawLayout\(bottom,'camera-dialog',layout,cameraMessageColors\(source,overrides\),\{textSampling:'lcd-source-size',bindings/);
});

test('Close is unchanged: T_EndB_00 still LCD at phase 0.5, T_EndF_00 still rejects LCD', ()=>{
  const calls=record('NewsTopBtn_D_00', {bindings:[{name:'NewsTopBtn_D_00_SceneIn', frame:20}], textSampling:'lcd', textSamplingPanes:['T_EndB_00'],
    overrides:{T_EndB_00:{text:newBack}, T_EndF_00:{text:newBack, singleLineBlockOrigin:'writer-0x110'}}}, ['NewsTopBtn_D_00_SceneIn']);
  assert.deepEqual(calls.find(call=>call.origin===undefined), {value:newBack, phase:[0, 0.5], lcd:true, origin:undefined});
  assert.deepEqual(calls.find(call=>call.origin==='writer-0x110'), {value:newBack, phase:[0, 0], lcd:false, origin:'writer-0x110'});
});

test('nativeAlignedLine: direct 3/2 uses the 3/0 one-line origin; raster 3/2 and negative bearings are unchanged', ()=>{
  const font=new BitmapFont(manifest, manifest.sheets.map(()=>({naturalWidth:4096, naturalHeight:4096})));
  font.glyphMask=g=>({width:g.width+2, height:g.height+2, data:new Uint8ClampedArray((g.width+2)*(g.height+2)*4).fill(255)});
  const render=(lineAlignment, lcd, value='Sleep Mode', phase=[0, 0.5])=>{
    let image, draws=[];
    font.drawNative({createImageData:(w, h)=>({width:w, height:h, data:new Uint8ClampedArray(w*h*4)}), putImageData:value=>{image=value;}, drawImage:(...args)=>draws.push(args)},
      value, 216, 18, [15.000000953674316, 18], 3, 0, 0, lineAlignment, lcd?phase:[0, 0], lcd);
    return {image, draws};
  };
  const line2=render(2, true), line0=render(0, true);
  assert.equal(line2.draws.length, 0, 'direct 3/2 uses the alpha sampler');
  assert.ok(line2.image.data.some(value=>value>0));
  assert.deepEqual(line2.image.data, line0.image.data, '0x101 one line equals 0x100');
  const raster=render(2, false);
  assert.ok(raster.draws.length>0, 'without the direct sampler 3/2 keeps the generic pane raster');
  const negative=String.fromCodePoint(Number(Object.entries(manifest.glyphs).find(([, glyph])=>glyph.left<0)[0]));
  assert.throws(()=>render(2, true, 'Sleep '+negative), /Unsupported native writer-0x101 line/);
  assert.doesNotThrow(()=>render(2, false, 'Sleep '+negative));
});
