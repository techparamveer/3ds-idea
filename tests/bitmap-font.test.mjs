import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/os/bitmap-font.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {BitmapFont,nativeCenteredGlyphQuads,nativeLeftGlyphQuads,rasterNativeAlphaGlyph}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

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

test('Settings single-line MSBT spacing retains the native centered alpha raster',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/shared/font.json',root),'utf8'));
 const pack=JSON.parse(fs.readFileSync(new URL('packs/settings/contents/0000-0000003d/message_EU.json',root),'utf8'));
 const bank=pack.messages.mset,font=new BitmapFont(manifest,manifest.sheets.map(()=>({naturalWidth:4096,naturalHeight:4096})));
 font.glyphMask=g=>({width:g.width+2,height:g.height+2,data:new Uint8ClampedArray((g.width+2)*(g.height+2)*4).fill(255)});
 for(const [label,width,height] of [['top_nnid',236,30],['top_settings',134,42]]){
  const message=bank.messages[bank.labels[label]],style=pack.styles[bank.styleTable].styles[message.styleIndex];
  assert.notEqual(style.lineSpacing,0,'the original Settings style exercises this case');
  assert.equal(message.text.includes('\n'),false);
  const size=[(manifest.width??manifest.height)*style.fontScale[0],manifest.height*style.fontScale[1]];
  const render=lineSpacing=>{
   let result,drawCalls=0;
   const context={createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>{result=image.data;},drawImage:()=>{drawCalls++;}};
   font.drawNative(context,message.text,width,height,size,4,style.characterSpacing,lineSpacing,0);
   assert.equal(drawCalls,0,'alpha glyphs use pixel-centre rasterization');
   assert.ok(result.some((value,index)=>index%4===3&&value>0));
   return result;
  };
  assert.deepEqual(render(style.lineSpacing),render(0),`${label}: unused line spacing cannot change a single line`);
 }
});

test('Settings Other title uses the source middle-left single-line glyph origin and alpha raster',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/shared/font.json',root),'utf8'));
 const messages=JSON.parse(fs.readFileSync(new URL('packs/settings/contents/0000-0000003d/message_EU.json',root),'utf8'));
 const layout=JSON.parse(fs.readFileSync(new URL('packs/settings/contents/0000-0000003d/up.json',root),'utf8')).layouts.CommonBG_U_00;
 const walk=panes=>panes.flatMap(pane=>[pane,...walk(pane.children)]);
 const title=walk(layout.roots).find(pane=>pane.name==='TextBoxTitle_00');
 const bank=messages.messages.mset,message=bank.messages[bank.labels.settings_title];
 const style=messages.styles[bank.styleTable].styles[message.styleIndex];
 assert.equal(title.text.alignment,3);assert.equal(title.text.lineAlignment,0);
 assert.equal(message.text,'Other Settings');assert.equal(message.text.includes('\n'),false);
 assert.equal(style.characterSpacing,0);assert.equal(manifest.colorMode,'alpha');
 const size=[manifest.width*style.fontScale[0],manifest.height*style.fontScale[1]];
 const quads=nativeLeftGlyphQuads(manifest,message.text,...title.size,size);
 const f=Math.fround,first=manifest.glyphs[String(message.text.codePointAt(0))],sx=f(size[0]/manifest.width),sy=f(size[1]/manifest.height);
 assert.equal(quads[0].x,f(first.left*sx),'left alignment has no half-width subtraction');
 assert.equal(quads[0].y,title.size[1]/2+f(f(-Math.ceil(f(f(manifest.lineFeed*sy)*.5))+f(manifest.ascent*sy))-f(manifest.baseline*sy)));
 const font=new BitmapFont(manifest,manifest.sheets.map(()=>({naturalWidth:4096,naturalHeight:4096})));
 font.glyphMask=g=>({width:g.width+2,height:g.height+2,data:new Uint8ClampedArray((g.width+2)*(g.height+2)*4).fill(255)});
 let image,drawCalls=0;
 font.drawNative({createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData:value=>{image=value;},drawImage:()=>{drawCalls++;}},message.text,...title.size,size,3,style.characterSpacing,style.lineSpacing,0);
 assert.equal(drawCalls,0,'source A4 font uses pixel-centre alpha raster');
 assert.ok(image.data.some((value,index)=>index%4===3&&value>0));
});

test('Settings multiline labels round each centred line and the text block independently',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/shared/font.json',root),'utf8'));
 const pack=JSON.parse(fs.readFileSync(new URL('packs/settings/contents/0000-0000003d/message_EU.json',root),'utf8'));
 const bank=pack.messages.mset,font=new BitmapFont(manifest,manifest.sheets.map(()=>({naturalWidth:4096,naturalHeight:4096})));
 for(const label of ['top_internet','top_parental','top_software']){
  const message=bank.messages[bank.labels[label]],style=pack.styles[bank.styleTable].styles[message.styleIndex];
  const size=[manifest.width*style.fontScale[0],manifest.height*style.fontScale[1]],sx=size[0]/manifest.width;
  const lines=message.text.split('\n'),calls=[];
  font.drawNative({drawImage:(...args)=>calls.push(args)},message.text,134,42,size,4,style.characterSpacing,style.lineSpacing,0);
  const lineHeight=manifest.lineFeed*size[1]/manifest.height+style.lineSpacing;
  const blockHeight=size[1]+lineHeight;
  for(const [row,line] of lines.entries()){
   const first=manifest.glyphs[String(line.codePointAt(0))],runWidth=Array.from(line).reduce((sum,char)=>sum+manifest.glyphs[String(char.codePointAt(0))].advance*sx,0);
   const expectedX=67-Math.ceil(runWidth/2)+first.left*sx;
   const expectedY=21-Math.ceil(blockHeight/2)+row*lineHeight;
   const call=calls.find(args=>args[1]===first.x&&args[2]===first.y&&Math.abs(args[6]-expectedY)<.01);
   assert.ok(call,`${label} line ${row} glyph exists at centred block row`);
   assert.ok(Math.abs(call[5]-expectedX)<.01,`${label} line ${row} uses its own rounded width`);
  }
 }
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


test('native alpha glyph horizontal boundary ties belong to the right-hand edge',()=>{
 const surface=(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});
 const glyph={width:1,height:1},source=surface(3,3);source.data.fill(255);
 const alpha=target=>Array.from({length:target.width},(_,x)=>target.data[x*4+3]);
 const tied=surface(4,1);
 rasterNativeAlphaGlyph(tied,source,{glyph,x:.5,y:0,width:2,height:1});
 assert.deepEqual(alpha(tied),[0,255,255,0]);
 // Neighboring quads own the shared centre exactly once, including clipping.
 const neighbor=surface(4,1);
 rasterNativeAlphaGlyph(neighbor,source,{glyph,x:-1.5,y:0,width:2,height:1});
 assert.deepEqual(alpha(neighbor),[255,0,0,0]);
 // Only exact ties change; an arbitrarily nearby edge retains centre coverage.
 const before=surface(4,1),after=surface(4,1);
 rasterNativeAlphaGlyph(before,source,{glyph,x:.5-1e-6,y:0,width:2,height:1});
 rasterNativeAlphaGlyph(after,source,{glyph,x:.5+1e-6,y:0,width:2,height:1});
 assert.deepEqual(alpha(before),[255,255,0,0]);
 assert.deepEqual(alpha(after),[0,255,255,0]);
});

test('source Touch Screen glyph retains its float32 right endpoint at the pixel centre',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/shared/font.json',root),'utf8'));
 const pack=JSON.parse(fs.readFileSync(new URL('packs/settings/contents/0000-0000003d/message_EU.json',root),'utf8'));
 const bank=pack.messages.mset,message=bank.messages[bank.labels.touch],style=pack.styles[bank.styleTable].styles[message.styleIndex];
 const size=[manifest.width*style.fontScale[0],manifest.height*style.fontScale[1]];
 const quad=nativeCenteredGlyphQuads(manifest,message.text,200,38,size)[1];
 assert.equal(quad.glyph,manifest.glyphs['111']); // original 'o'
 // Deliberate precondition: recomputing the stored endpoint as a double
 // would exclude the target column even though the writer includes it.
 assert.equal(quad.x+quad.width,53.499999046325684);
 assert.equal(quad.right,53.5);
 assert.equal(Math.fround(quad.x+quad.width),53.5);
 const mask={width:quad.glyph.width+2,height:quad.glyph.height+2,data:new Uint8ClampedArray((quad.glyph.width+2)*(quad.glyph.height+2)*4).fill(255)};
 const target={width:200,height:38,data:new Uint8ClampedArray(200*38*4)};
 rasterNativeAlphaGlyph(target,mask,quad);
 assert.equal(target.data[(19*200+53)*4+3],255,'the emitted right vertex owns this pixel centre');
 assert.equal(target.data[(19*200+54)*4+3],0,'the following pixel remains outside');
});

test('native writer rounds endpoints before the pane translation, on both axes',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/shared/font.json',root),'utf8'));
 const f=Math.fround,size=[f(25*.85),f(30*.85)];
 const [base]=nativeCenteredGlyphQuads(manifest,'o',200,38,size);
 // Deliberately choose a translation that crosses a pixel centre only if the
 // renderer incorrectly rounds again after adding the pane origin.
 const width=200+2*(53.5-base.right)-1e-6;
 const height=38+2*(29.5-base.bottom)+1e-6;
 const [q]=nativeCenteredGlyphQuads(manifest,'o',width,height,size);
 assert.ok(q.right<53.5);assert.equal(f(q.right),53.5);
 assert.ok(q.bottom>29.5);assert.equal(f(q.bottom),29.5);
 const mask={width:q.glyph.width+2,height:q.glyph.height+2,data:new Uint8ClampedArray((q.glyph.width+2)*(q.glyph.height+2)*4).fill(255)};
 const target={width:200,height:38,data:new Uint8ClampedArray(200*38*4)};
 rasterNativeAlphaGlyph(target,mask,q);
 assert.equal(target.data[(20*200+53)*4+3],0,'translated right endpoint stays below the centre');
 assert.equal(target.data[(29*200+50)*4+3],255,'translated bottom endpoint stays above the centre');
 assert.equal(target.data[(30*200+50)*4+3],0,'following row is outside');
});

test('transformed article-style quads preserve caller precision without native writer endpoints',()=>{
 const glyph={width:1,height:1},source={width:3,height:3,data:new Uint8ClampedArray(36).fill(255)};
 const render=(x,y)=>{const target={width:4,height:4,data:new Uint8ClampedArray(64)};rasterNativeAlphaGlyph(target,source,{glyph,x,y,width:2,height:2});return target.data;};
 const before=render(.5-1e-8,.5+1e-8),after=render(.5+1e-8,.5-1e-8);
 assert.equal(before[(2*4+1)*4+3],255,'bottom row survives a transformed edge above its centre');
 assert.equal(before[(1*4+2)*4+3],0,'right column stays excluded below its centre');
 assert.equal(after[(2*4+1)*4+3],0,'scrolling the bottom edge below its centre excludes the row');
 assert.equal(after[(1*4+2)*4+3],255,'right column is covered above its centre');
});

for(const alignment of [3,4])test(`fractional LCD phase samples original glyph coverage for alignment ${alignment}`,()=>{
 const glyph={sheet:0,x:1,y:1,width:2,height:2,left:0,advance:2};
 const manifest={schema:1,sourceSha256:'0'.repeat(64),width:2,height:2,ascent:2,baseline:2,lineFeed:2,colorMode:'alpha',sheets:['sheet-0.png'],glyphs:{65:glyph},fallback:null};
 const font=new BitmapFont(manifest,[{naturalWidth:4,naturalHeight:4}]);
 const mask={width:4,height:4,data:new Uint8ClampedArray(64)};
 for(const [x,y] of [[1,1],[2,1],[1,2],[2,2]])mask.data[(y*4+x)*4+3]=255;
 font.glyphMask=()=>mask;
 let result;const ctx={createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),putImageData:image=>{result=image;}};
 font.drawNative(ctx,'A',4,4,[2,2],alignment,0,0,0,[.25,.25]);
 assert.deepEqual([result.width,result.height],[5,5]);
 const alpha=(x,y)=>result.data[(y*result.width+x+(alignment===4?1:0))*4+3];
 assert.equal(alpha(0,1),143,'source bilinear coverage is 255 × .75 × .75');
 assert.equal(alpha(1,1),191);assert.equal(alpha(1,2),255);
 assert.equal(alpha(2,2),0,'right quad coverage remains exclusive of centers beyond its endpoint');
});
