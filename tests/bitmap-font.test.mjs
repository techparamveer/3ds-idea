import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/os/bitmap-font.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {BitmapFont,nativeCenteredGlyphQuads,rasterNativeAlphaGlyph}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('Bitmap text uses signed bearings, advances, fallback, scaling and alignment',()=>{
 const previous=globalThis.document;
 let canvases=0;const glyphCalls=[];
 globalThis.document={createElement(){canvases++;return {getContext:()=>({drawImage(...args){glyphCalls.push(args);},fillRect(){}})};}};
 try {
  const glyph={sheet:0,x:1,y:1,width:2,height:3,left:-1,advance:3};
  const font=new BitmapFont({schema:1,sourceSha256:'0'.repeat(64),height:3,baseline:2,sheets:['sheet-0.png'],glyphs:{65:glyph},fallback:{...glyph,advance:4}},[{naturalWidth:8,naturalHeight:8}]);
  const calls=[];
  const context={drawImage:(...args)=>calls.push(args)};
  font.draw(context,'A?',10,20,6,'#555','center');
  // Text width = (3 + 4) * 2 = 14; center at 10; bearing = -2.
  assert.deepEqual(glyphCalls.map(args=>[args[5]+calls[0][1],args[6]+calls[0][2],args[7],args[8]]),[[1,17,4,6],[7,17,4,6]]);
  font.draw(context,'A?',10,20,6,'#555','center');
  assert.equal(canvases,1,'same text run reuses its small tinted surface');
 } finally {globalThis.document=previous;}
});

test('native centered text rounds the measured centre and retains distinct ascent, baseline and line feed',()=>{
 const glyph={sheet:0,x:1,y:1,width:7,height:17,left:-1,advance:17};
 const font=new BitmapFont({schema:1,sourceSha256:'0'.repeat(64),width:25,height:30,ascent:24,baseline:25,lineFeed:32,
  sheets:['sheet-0.png'],glyphs:{65:glyph},fallback:null},[{naturalWidth:32,naturalHeight:32}]);
 const quads=nativeCenteredGlyphQuads(font.manifest,'AA',256,64,[15.5,18.600000381469727]);
 const f=Math.fround,s=f(.62),origin=-11,baseline=f(f(-10+f(24*s))-f(25*s));
 assert.deepEqual(quads.map(q=>[q.x,q.y,q.width,q.height]),[
  [128+f(origin+f(-s)),32+baseline,f(7*s),f(17*s)],
  [128+f(f(origin+f(17*s))+f(-s)),32+baseline,f(7*s),f(17*s)]
 ]);
});

test('original shared font follows traced BnrDsTitle and folder-initial centred origins',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
 const font=new BitmapFont(manifest,manifest.sheets.map(()=>({naturalWidth:4096,naturalHeight:4096})));
 for(const [value,origin] of [['1',122],['１',120],['Folder',103]]){
  const quads=nativeCenteredGlyphQuads(font.manifest,value,256,64,[15.5,18.600000381469727]);
  const glyph=manifest.glyphs[value.charCodeAt(0)],f=Math.fround;
  assert.equal(quads[0].x,128+f(origin-128+f(glyph.left*f(.62))));
  assert.equal(quads[0].y,22);assert.equal(quads[0].height,18.600000381469727);
 }
 const [q]=nativeCenteredGlyphQuads(font.manifest,'１',30,30,[25,30]);
 assert.deepEqual([q.x,q.y,q.width,q.height],[9,0,8,30],'the already matched 32px folder initial keeps its source position');
});

test('native alpha glyph raster uses hard pixel-centre coverage and the atlas border for linear filtering',()=>{
 const surface=(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});
 const glyph={width:1,height:1},source=surface(3,3),target=surface(3,3),quad={glyph,x:.4,y:.4,width:1.2,height:1.2};
 source.data.fill(255);rasterNativeAlphaGlyph(target,source,quad);
 assert.deepEqual(Array.from({length:9},(_,i)=>target.data[i*4+3]),[255,255,0,255,255,0,0,0,0]);
 // Only the glyph's own texel is opaque. Native bilinear filtering sees its
 // transparent atlas border, without multiplying RGB by that alpha twice.
 source.data.fill(0);source.data[19]=255;const filtered=surface(2,2),scaled={glyph,x:0,y:0,width:2,height:2};
 rasterNativeAlphaGlyph(filtered,source,scaled);
 assert.deepEqual([...filtered.data],Array(4).fill([255,255,255,143]).flat());
 rasterNativeAlphaGlyph(filtered,source,scaled);
 assert.deepEqual([...filtered.data],Array(4).fill([255,255,255,206]).flat());
 const clipped=surface(2,2);rasterNativeAlphaGlyph(clipped,source,{...scaled,x:-1,y:-1,width:1,height:1});
 assert.ok(clipped.data.every(v=>v===0));
});
