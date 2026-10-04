import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import ts from 'typescript';
import {PNG} from 'pngjs';

// Notifications lower Close 240 after the T_EndF_00 writer-0x110 bind (browser f132dc8d…,
// native 58fff714…). Evidence for T_EndB_00 single atlas sampling; tests never pass the scenario.
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
const manifest=JSON.parse(readFileSync(new URL('fonts/shared/font.json', firmware), 'utf8'));
const compiled=ts.transpileModule(readFileSync(new URL('../src/os/bitmap-font.ts', import.meta.url), 'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {nativeCenteredGlyphQuads,rasterNativeAlphaGlyph}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const panes=Object.fromEntries(flatten(news.layouts.NewsTopBtn_D_00.roots).map(pane=>[pane.name, pane]));
const bank=messages.messages.newslist_msbt_LZ;
const newBack=bank.messages[bank.labels.new_back].text;
const artifacts='/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/';
const nativePath=artifacts+'native-reference/screenshots/_27.09.26_13.16.53.105.png';
const browserPath=artifacts+'notifications-close-list-recapture-20261004/browser/lower.png';
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

// Screen rows: P_Btn_00 (origin 7, y -120) puts its children's frame at LCD y 240.
// Text origin 1 keeps the pane top at 240 - translation.y.
const paneTop=name=>240-panes[name].translation[1];
const quads=nativeCenteredGlyphQuads(manifest, newBack, 312, 21, [17.5, 21]);
const sheets=new Map();
const mask=glyph=>{
  const sheet=sheets.get(glyph.sheet)??PNG.sync.read(readFileSync(new URL('fonts/shared/'+manifest.sheets[glyph.sheet], firmware)));sheets.set(glyph.sheet, sheet);
  const width=glyph.width+2, height=glyph.height+2, data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sx=Math.max(0, Math.min(sheet.width-1, glyph.x+x-1)), sy=Math.max(0, Math.min(sheet.height-1, glyph.y+y-1));
    data[(y*width+x)*4+3]=sheet.data[(sy*sheet.width+sx)*4+3];
  }
  return {width, height, data};
};
// Coverage of the traced 0x111/0x110 one-line quads drawn at pane-left 4 and the given top.
const coverage=top=>{
  const surface={width:320, height:240, data:new Uint8ClampedArray(320*240*4)};
  for(const q of quads)rasterNativeAlphaGlyph(surface, mask(q.glyph), {...q, x:q.x+4, y:q.y+top, right:q.right+4, bottom:q.bottom+top});
  return Float64Array.from({length:320*240}, (_, i)=>surface.data[i*4+3]/255);
};
// Canvas drawImage of an integer-row pane raster moved down by half a row.
const halfRowDown=source=>Float64Array.from(source, (value, i)=>i<320?value/2:(value+source[i-320])/2);
const glyphBox=[118, 214, 200, 236];
// Background rows come from column 5 of the lower LCD (native offset 40,240).
const compose=(lcd, shadow, front)=>{
  const out=[0, 1, 2].map(()=>new Float64Array(320*240));
  for(let y=glyphBox[1];y<glyphBox[3];y++)for(let x=glyphBox[0];x<glyphBox[2];x++)for(let k=0;k<3;k++){
    const i=y*320+x;let c=lcd.data[((y+240)*lcd.width+45)*4+k];
    c=50*shadow[i]+c*(1-shadow[i]);c=255*front[i]+c*(1-front[i]);out[k][i]=c;
  }
  return out;
};
const over=(model, lcd, offset)=>{
  let count=0;
  for(let y=glyphBox[1];y<glyphBox[3];y++)for(let x=glyphBox[0];x<glyphBox[2];x++){
    const at=((y+offset[1])*lcd.width+x+offset[0])*4;
    if(Math.max(...[0, 1, 2].map(k=>Math.abs(Math.round(model[k][y*320+x])-lcd.data[at+k])))>2)count++;
  }
  return count;
};

test('T_EndB_00 sits on a half row and T_EndF_00 on a whole row; both use the same one-line quads', ()=>{
  assert.deepEqual(panes.T_EndB_00.translation.slice(1), [26.5, 0]);
  assert.deepEqual(panes.T_EndF_00.translation.slice(1), [25, 0]);
  assert.equal(panes.T_EndB_00.translation[0]+panes.T_EndF_00.translation[0], 0);
  assert.deepEqual([panes.T_EndB_00.origin, panes.T_EndF_00.origin, panes.P_Btn_00.origin, panes.P_Btn_00.translation[1]], [1, 1, 7, -120]);
  assert.equal(newBack, '\uE071 Close');
  assert.equal(quads[0].y, -0.5, 'writer block y is a half row inside the pane');
  // So the front lands at 214.5 in one sample; the shadow's final rows are whole (213).
  assert.equal(paneTop('T_EndF_00')+quads[0].y, 214.5);
  assert.equal(paneTop('T_EndB_00')+quads[0].y, 213);
  const material=news.layouts.NewsTopBtn_D_00.materials[panes.T_EndB_00.text.material];
  assert.deepEqual(material.constantColors[0], [50, 50, 50, 255]);
});

test('painter samples only T_EndB_00 at final LCD rows', ()=>{
  assert.match(painter, /\{bindings:\[\{name:'NewsTopBtn_D_00_SceneIn',frame:20\}\],textSampling:'lcd',textSamplingPanes:\['T_EndB_00'\],overrides:\{T_EndB_00:message\('new_back'\),T_EndF_00:\{\.\.\.message\('new_back'\),singleLineBlockOrigin:'writer-0x110'\}\}\}/);
  // T_EndF_00 stays on the pane-raster writer-0x110 route, which rejects LCD sampling.
  assert.equal(/textSamplingPanes:\[[^\]]*T_EndF_00/.test(painter), false);
});

test('frozen pair: native equals one atlas sample at row 213; browser equals the pane raster moved half a row', t=>{
  if(!existsSync(nativePath)||!existsSync(browserPath))return t.skip('private frozen Close pair is absent');
  assert.equal(sha(nativePath), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(browserPath), 'f132dc8d0ba3eaf5aa10c58c5cf952c13e89bfe18b902a6eb886a16e6311b0e0');
  const native=PNG.sync.read(readFileSync(nativePath)), browser=PNG.sync.read(readFileSync(browserPath));
  const front=coverage(paneTop('T_EndF_00'));
  const single=compose(native, coverage(paneTop('T_EndB_00')), front);
  const twice=compose(native, halfRowDown(coverage(Math.floor(paneTop('T_EndB_00')))), front);
  assert.equal(over(single, native, [40, 240]), 0, 'single sample reproduces native glyphs within 2/255');
  assert.equal(over(twice, browser, [0, 0]), 0, 'double filter reproduces the frozen browser glyphs within 2/255');
  assert.ok(over(twice, native, [40, 240])>=150, 'the double filter is the glyph residual');
});
