import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/os/bitmap-font.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {BitmapFont,nativeCenteredGlyphQuads,nativeLeftGlyphQuads,nativeTopLeftGlyphQuads,rasterNativeAlphaGlyph,nativeTextWriterFlags}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

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

test('source-sized top-left alpha text preserves fractional BCFNT glyph advances and spacing',()=>{
 const first={sheet:0,x:1,y:2,width:2,height:3,left:-1,advance:3};
 const second={sheet:0,x:4,y:2,width:1,height:3,left:0,advance:2};
 const manifest={schema:1,sourceSha256:'0'.repeat(64),width:6,height:6,baseline:5,sheets:['sheet.png'],glyphs:{65:first,66:second},fallback:null};
 const spacing=.4864870309829712,quads=nativeTopLeftGlyphQuads(manifest,'ABB',[6,6],spacing);
 const f=Math.fround,x1=f(f(3)+spacing),x2=f(x1+f(f(2)+spacing));
 assert.deepEqual(quads.map(({x,y,width,height,right,bottom})=>[x,y,width,height,right,bottom]),[
  [f(-1),0,f(2),f(3),f(1),f(3)],
  [x1,0,f(1),f(3),f(x1+1),f(3)],
  [x2,0,f(1),f(3),f(x2+1),f(3)],
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

test('opt-in newline scales compact and recenter the Power spacer rows without changing the default path',()=>{
 const glyph={sheet:0,x:0,y:0,width:5,height:10,left:0,advance:6};
 const manifest={schema:1,sourceSha256:'0'.repeat(64),width:25,height:30,baseline:25,lineFeed:30,sheets:['sheet-0.png'],glyphs:{65:glyph},fallback:null};
 const font=new BitmapFont(manifest,[{naturalWidth:16,naturalHeight:16}]),value='A\nA\n \nA\n \nA\nA',size=[16.25,19.5];
 const rows=scales=>{const calls=[];font.drawNative({drawImage:(...args)=>calls.push(args)},value,380,136,size,4,0,1,1,[0,0],false,undefined,undefined,[],false,false,scales);return calls.map(args=>args[6]);};
 assert.deepEqual(rows(undefined),[-4,16.5,57.5,98.5,119]);
 assert.deepEqual(rows([1,.2,1,.2,1,1]),[12,32.5,57.9,83.3,103.8]);
 assert.throws(()=>rows([1,.2]),/Invalid native line advance scales/);
 assert.throws(()=>rows([1,.2,1,0,1,1]),/Invalid native line advance scales/);
});

test('Power opts into the source writer 0x110 float32 multiline block origin',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/shared/font.json',root),'utf8'));
 const pack=JSON.parse(fs.readFileSync(new URL('packs/home/messages-and-loose.json',root),'utf8'));
 const bank=pack.messages.menu_msbt_LZ,message=bank.messages[bank.labels.lau_press_pow_u1],style=pack.styles[bank.styleTable].styles[message.styleIndex];
 const size=[manifest.width*style.fontScale[0],manifest.height*style.fontScale[1]],font=new BitmapFont(manifest,manifest.sheets.map(()=>({})));
 const f=Math.fround,sx=f(size[0]/manifest.width),bounds=message.text.split('\n').map(line=>{
  let cursor=0,left=0,right=0;
  for(const char of line){const glyph=manifest.glyphs[String(char.codePointAt(0))]??manifest.fallback;if(!glyph)continue;
   if(glyph.width){const glyphLeft=f(cursor+f(glyph.left*sx)),glyphRight=f(glyphLeft+f(glyph.width*sx));left=Math.min(left,glyphLeft);right=Math.max(right,glyphRight);}
   cursor=f(cursor+f(glyph.advance*sx));left=Math.min(left,cursor);right=Math.max(right,cursor);
  }
  return [left,right,cursor];
 });
 assert.deepEqual(bounds,[[0,193.04998779296875,193.04998779296875],[0,164.44998168945312,164.44998168945312],[0,116.9999771118164,116.9999771118164],[0,142.99998474121094,142.99998474121094],[0,116.9999771118164,116.9999771118164],[0,211.25001525878906,211.25001525878906],[0,122.84998321533203,122.84998321533203]]);
 const scales=[1,.2,1,.2,1,1],render=origin=>{const calls=[];font.drawNative({drawImage:(...args)=>calls.push(args)},message.text,380,136,size,4,style.characterSpacing,style.lineSpacing,1,[0,0],false,undefined,undefined,[],false,false,scales,origin);return calls;};
 const defaults=render(undefined),native=render('writer-0x110'),firstByRow=calls=>{const rows=new Map;for(const call of calls)if(!rows.has(call[6]))rows.set(call[6],call);return [...rows.values()];};
 const defaultRows=firstByRow(defaults),nativeRows=firstByRow(native),blockRight=Math.max(...bounds.map(([,right])=>right));
 assert.equal(190-Math.ceil(f(f(blockRight)*f(.5))),84,'0x110 centres the complete measured rectangle with native ceil');
 assert.equal(defaultRows[0][5],90.87500363588333,'the unchanged generic path retains its fractional block origin');
 assert.equal(nativeRows[0][5],90.5,'the source origin 84 plus the bullet bearing is used');
 assert.ok(Math.abs(defaultRows[0][5]-nativeRows[0][5]-.3750036358833313)<1e-12);
 assert.deepEqual(nativeRows.filter(call=>call[1]===385&&call[2]===641).map(call=>call[5]),[90.5,90.5,90.5],'explicit-left rows share the block origin');
 assert.deepEqual(native.map(call=>call[6]),defaults.map(call=>call[6]),'the horizontal opt-in leaves decoded row advances unchanged');
 assert.throws(()=>font.drawNative({drawImage(){}},message.text,380,136,size,4,0,1,0,[0,0],false,undefined,undefined,[],false,false,scales,'writer-0x110'),/Unsupported native multiline block origin/);
});

test('Power footer writer 0x111 preserves the source float32 s right-edge tie',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/shared/font.json',root),'utf8'));
 const pack=JSON.parse(fs.readFileSync(new URL('packs/home/messages-and-loose.json',root),'utf8'));
 const bank=pack.messages.menu_msbt_LZ,message=bank.messages[bank.labels.lau_press_pow5],style=pack.styles[bank.styleTable].styles[message.styleIndex];
 const size=[manifest.width*style.fontScale[0],manifest.height*style.fontScale[1]],font=new BitmapFont(manifest,manifest.sheets.map(()=>({naturalWidth:1024,naturalHeight:1024})));
 assert.equal(message.styleIndex,503);assert.equal(message.text,'Close the system to enter Sleep Mode.\nThe HOME Menu will appear when\nyou resume use.');
 assert.deepEqual(style.fontScale,[.699999988079071,.699999988079071]);assert.equal(style.characterSpacing,0);assert.equal(style.lineSpacing,0);assert.deepEqual(size,[17.499999701976776,20.99999964237213]);
 const calls=[];font.drawNative({drawImage:(...args)=>calls.push(args)},message.text,380,63,size,4,0,0,0,[0,0],false,undefined,undefined,[],false,false,undefined,'writer-0x111');
 const finalS=calls.find(args=>args[1]===76&&args[2]===65&&args[5]>120&&args[6]===-.5);
 assert.deepEqual([finalS[5],finalS[6],finalS[7],finalS[8]],[128.10000610351562,-.5,8.399999618530273,21]);
 assert.equal(Math.fround(finalS[5]+finalS[7]),136.5,'the source endpoint owns local LCD pixel 136');
 assert.equal(Math.fround(10+Math.fround(finalS[5]+finalS[7])),146.5,'the pane translation places the right-edge tie at screen x=146.5');
 const defaultCalls=[];font.drawNative({drawImage:(...args)=>defaultCalls.push(args)},message.text,380,63,size,4,0,0,0);
 const defaultS=defaultCalls.find(args=>args[1]===76&&args[2]===65&&args[5]>120&&args[5]<140&&args[6]===-.5);
 assert.deepEqual([defaultS[5],defaultS[7],defaultS[5]+defaultS[7]],[128.09999817609787,8.399999856948853,136.49999803304672],'the unflagged generic path remains unchanged');
 font.glyphMask=glyph=>{const image={width:glyph.width+2,height:glyph.height+2,data:new Uint8ClampedArray((glyph.width+2)*(glyph.height+2)*4)};
  for(let y=1;y<=glyph.height;y++)for(let x=1;x<=glyph.width;x++){const at=(y*image.width+x)*4;image.data.set([255,255,255,255],at);}return image;};
 let image,draws=0;const firstLine=message.text.split('\n')[0],target=firstLine.lastIndexOf('s');
 font.drawNative({createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData:value=>{image=value;},drawImage(){draws++;}},message.text,380,63,size,4,0,0,0,[0,0],true,undefined,[target,target+1],[],false,false,undefined,'writer-0x111');
 assert.equal(draws,0);assert.ok(image.data[(14*image.width+136)*4+3]>0);assert.equal(image.data[(14*image.width+137)*4+3],0);
 assert.throws(()=>font.drawNative({drawImage(){}},message.text,380,63,size,4,0,1,0,[0,0],false,undefined,undefined,[],false,false,undefined,'writer-0x111'),/Unsupported native multiline block origin/);
 const centred=[];font.drawNative({drawImage:(...args)=>centred.push(args)},message.text,380,63,size,4,0,0,2,[0,0],false,undefined,undefined,[],false,false,undefined,'writer-0x111');
 assert.deepEqual(centred,calls,'line alignment 2 stores the same 0x111 writer geometry as line alignment 0');
 assert.throws(()=>font.drawNative({drawImage(){}},message.text,380,63,size,4,0,0,1,[0,0],false,undefined,undefined,[],false,false,undefined,'writer-0x111'),/Unsupported native multiline block origin/);
 assert.throws(()=>font.drawNative({drawImage(){}},message.text,380,63,size,4,0,0,3,[0,0],false,undefined,undefined,[],false,false,undefined,'writer-0x111'),/Unsupported native multiline block origin/);
});

test('Camera setter 0x1cdb2c maps alignment 4 line alignments 0 and 2 to writer flags 0x111',()=>{
 const table={
  0:[0x0,0x0,0x1,0x2],
  1:[0x11,0x10,0x11,0x12],
  2:[0x22,0x20,0x21,0x22],
  3:[0x100,0x100,0x101,0x102],
  4:[0x111,0x110,0x111,0x112],
  5:[0x122,0x120,0x121,0x122],
  6:[0x200,0x200,0x201,0x202],
  7:[0x211,0x210,0x211,0x212],
  8:[0x222,0x220,0x221,0x222],
 };
 for(const [alignment,rows] of Object.entries(table))for(let line=0;line<4;line++)assert.equal(nativeTextWriterFlags(Number(alignment),line),rows[line],`${alignment}/${line}`);
 assert.equal(nativeTextWriterFlags(4,4),0x111);
 assert.equal(nativeTextWriterFlags(4,255),0x111);
 assert.equal(nativeTextWriterFlags(4,1),0x110);
 assert.equal(nativeTextWriterFlags(4,3),0x112);
 assert.equal(nativeTextWriterFlags(4.5,2),0);
 assert.equal(nativeTextWriterFlags(4,256),0);
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

test('direct upright LCD glyphs own exact bottom vertical ties once',()=>{
 const surface=(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});
 const glyph={width:1,height:1},source=surface(3,3);source.data.fill(255);
 const alpha=t=>Array.from({length:t.height},(_,y)=>t.data[y*4+3]);
 const tied=surface(1,4),neighbor=surface(1,4);
 rasterNativeAlphaGlyph(tied,source,{glyph,x:0,y:.5,width:1,height:2},'bottom');
 rasterNativeAlphaGlyph(neighbor,source,{glyph,x:0,y:-1.5,width:1,height:2},'bottom');
 assert.deepEqual(alpha(tied),[0,255,255,0]);assert.deepEqual(alpha(neighbor),[255,0,0,0]);
 for(const delta of [-1e-6,1e-6]){
  const old=surface(1,4),lcd=surface(1,4),q={glyph,x:0,y:.5+delta,width:1,height:2};
  rasterNativeAlphaGlyph(old,source,q);rasterNativeAlphaGlyph(lcd,source,q,'bottom');assert.deepEqual(alpha(lcd),alpha(old),'non-ties retain the existing coverage');
 }
});

test('explicit Health coverage adaptation snaps near ties while retaining atlas interpolation',()=>{
 const glyph={width:1,height:1},source={width:3,height:3,data:new Uint8ClampedArray(36).fill(255)};
 const render=(delta,adaptation)=>{
  const target={width:4,height:1,data:new Uint8ClampedArray(16)};
  rasterNativeAlphaGlyph(target,source,{glyph,x:.5+delta,y:0,width:2,height:1},'bottom',adaptation);
  return Array.from({length:4},(_,x)=>target.data[x*4+3]);
 };
 const fit='azahar-12p4-fit',near=-1.9073486328125e-6;
 assert.deepEqual(render(near),[255,255,0,0],'default direct-LCD near ties remain untouched');
 assert.deepEqual(render(near,fit),[0,255,255,0],'Health float32 near tie snaps to exact half');
 assert.deepEqual(render(-.01,fit),[0,255,255,0]);
 assert.deepEqual(render(-.04,fit),[255,255,0,0],'edge beyond half of a 1/16 grid step stays distinct');
 assert.deepEqual(render(.04,fit),[0,255,255,0]);
 // Nonuniform alpha makes an unintended texture-coordinate snap observable.
 source.data.fill(0);source.data[16+3]=255;
 const sample=adaptation=>{const t={width:4,height:1,data:new Uint8ClampedArray(16)};rasterNativeAlphaGlyph(t,source,{glyph,x:.49,y:0,width:2,height:1},'bottom',adaptation);return t.data[7];};
 assert.equal(sample(fit),sample(undefined),'covered interior sample uses the original quad');
});

test('Other title live O right endpoint near tie is included only by explicit coverage adaptation',()=>{
 const source={width:3,height:3,data:new Uint8ClampedArray(36).fill(255)},glyph={width:1,height:1};
 const render=adaptation=>{const t={width:162,height:1,data:new Uint8ClampedArray(162*4)};rasterNativeAlphaGlyph(t,source,{glyph,x:145.19999694824219,y:0,width:15.30000114440918,height:1,right:160.49999809265137},'bottom',adaptation);return t.data;};
 const original=render(),fitted=render('azahar-12p4-fit');
 assert.equal(original[160*4+3],0);assert.equal(fitted[160*4+3],255);
 assert.deepEqual(original.slice(0,160*4),fitted.slice(0,160*4),'preceding columns retain their samples');
});

test('cached luminance-alpha text retains first-use source-sheet batches after atlas compaction',()=>{
 const glyph=(x,sourceSheet)=>({sheet:0,sourceSheet,x,y:0,width:7,height:17,left:0,advance:5});
 const manifest={schema:1,sourceSha256:'0'.repeat(64),height:16,width:16,baseline:13,lineFeed:16,colorMode:'luminance-alpha',sheets:['sheet-0.png'],glyphs:{65:glyph(10,2),66:glyph(20,0),67:glyph(30,3),68:glyph(40,2),69:glyph(50,0)},fallback:null};
 const font=new BitmapFont(manifest,[{}]),draws=[],ctx={drawImage:(...args)=>draws.push(args)};
 font.drawNative(ctx,'ABCDE',30,20,[16,16],5);
 assert.deepEqual(draws.map(d=>d[1]),[10,40,20,50,30],'first-seen texture batches, not numerical sheet sort or reversed text');
 assert.deepEqual(draws.map(d=>d[5]),[5,20,10,25,15],'batching preserves each glyph position and overlapping widths');
 for(const g of Object.values(manifest.glyphs))delete g.sourceSheet;
 draws.length=0;new BitmapFont(manifest,[{}]).drawNative(ctx,'ABCDE',30,20,[16,16],5);
 assert.deepEqual(draws.map(d=>d[1]),[10,20,30,40,50],'legacy single-sheet manifests retain previous order');
});

test('Camera HudNOTES explicit middle-left line retains source ascent and baseline',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/camera/contents/0000-0000001a/HudNOTES-bcfnt/font.json',root),'utf8'));
 const layout=JSON.parse(fs.readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json',root),'utf8')).layouts.P_Finder_U;
 const messages=JSON.parse(fs.readFileSync(new URL('packs/camera/contents/0000-0000001a/msg-EU_English.json',root),'utf8'));
 const walk=panes=>panes.flatMap(pane=>[pane,...walk(pane.children)]);
 const pane=walk(layout.roots).find(pane=>pane.name==='ShootCapa_Pho');
 const bank=messages.messages.P,message=bank.messages[bank.labels.Finder_Pho_00_00];
 const style=messages.styles[bank.styleTable].styles[message.styleIndex];
 assert.equal(layout.fonts[pane.text.font],'HudNOTES.bcfnt');
 assert.equal(manifest.sourceSha256,'7b115deda29adce0faccb352d412a3ef9e10247850be6ded7856ba2714d32932');
 assert.deepEqual([manifest.width,manifest.height,manifest.lineFeed,manifest.ascent,manifest.baseline],[23,23,23,19,20]);
 assert.deepEqual([pane.text.alignment,pane.text.lineAlignment,style.characterSpacing],[3,1,0]);
 const calls=[],font=new BitmapFont(manifest,manifest.sheets.map(()=>({naturalWidth:4096,naturalHeight:4096})));
 const size=[manifest.width*style.fontScale[0],manifest.height*style.fontScale[1]];
 font.drawNative({drawImage:(...args)=>calls.push(args)},message.text+'3000',...pane.size,size,pane.text.alignment,style.characterSpacing,style.lineSpacing,pane.text.lineAlignment);
 assert.equal(calls.length,5);
 // 16/2 - ceil(23/2) + FINF ascent19 - TGLP baseline20 = -5.
 // The previous generic layout returned -4 and lost the final subtraction.
 assert.deepEqual(calls.map(call=>call[6]),[-5,-5,-5,-5,-5]);
 assert.deepEqual(calls.map(call=>call[5]),[0,18,31,44,57]);
 assert.ok(calls.every(call=>call[8]===24),'LA glyph source cell height stays intact');
});

test('Camera guide explicit center alignment uses source glyph quads at the fractional pane size',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/shared/font.json',root),'utf8'));
 const pack=JSON.parse(fs.readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-C-Dlg.json',root),'utf8'));
 const find=(panes,name)=>{for(const pane of panes){if(pane.name===name)return pane;const child=find(pane.children??[],name);if(child)return child;}};
 const font=new BitmapFont(manifest,manifest.sheets.map(()=>({naturalWidth:4096,naturalHeight:4096})));
 font.glyphMask=g=>({width:g.width+2,height:g.height+2,data:new Uint8ClampedArray((g.width+2)*(g.height+2)*4).fill(255)});
 for(const [layout,name,value] of [['C_DlgGuid1BtnW','Guid1TxtW','Next'],['C_DlgGuid2Btn','Guid2TxtB','Back'],['C_DlgGuid2Btn','Guid2TxtW','Next']]){
  const pane=find(pack.layouts[layout].roots,name),text=pane.text;
  assert.equal(text.alignment,4);assert.equal(text.lineAlignment,2);
  const render=lineAlignment=>{let image;const c={createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData:x=>{image=x;},drawImage:()=>assert.fail('no Canvas glyph resampling')};
   font.drawNative(c,value,...pane.size,text.size,text.alignment,0,0,lineAlignment,[0,.4],true);return image;};
  assert.deepEqual(render(2),render(0),`${layout}/${name}: explicit center and automatic center share the original writer origin`);
 }
});


test('Camera width176 and group2 cursor advance retain digit origins while moving only the leading symbol',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/camera/contents/0000-0000001a/HudNOTES-bcfnt/font.json',import.meta.url),'utf8'));
 const calls=[],font=new BitmapFont(manifest,manifest.sheets.map(()=>({naturalWidth:4096,naturalHeight:4096})));
 const draw=controls=>font.drawNative({drawImage:(...args)=>calls.push(args)},'\ue01e3000',176,16,[23,23],3,0,0,1,[0,0],false,undefined,undefined,controls);
 draw([{index:1,advance:2},{index:5,advance:2}]);
 assert.deepEqual(calls.map(call=>call[5]),[0,20,33,46,59]);
 assert.deepEqual(calls.map(call=>call[5]+3),[3,23,36,49,62],'pane left91−176/2 plus original writer positions');
 assert.deepEqual(calls.map(call=>call[6]+6),[1,1,1,1,1]);
 calls.length=0;draw([{index:1,advance:-2}]);assert.deepEqual(calls.map(call=>call[5]),[0,16,29,42,55]);
 calls.length=0;font.drawNative({drawImage:(...args)=>calls.push(args)},'\ue01e3',176,16,[46,46],3,0,0,1,[0,0],false,undefined,undefined,[{index:1,advance:2}]);
 assert.deepEqual(calls.map(call=>call[5]),[0,38],'source cursor advance stays2 even when glyph scale doubles');
 assert.throws(()=>draw([{index:6,advance:2}]),/Invalid native cursor advance/);
 assert.throws(()=>draw([{index:1,advance:32768}]),/Invalid native cursor advance/);
});

test('opt-in UTF-16 glyph-size runs scale mixed lines, measurement and source newline advance together',()=>{
 const glyph={sheet:0,x:1,y:1,width:5,height:8,left:1,advance:6};
 const manifest={schema:1,sourceSha256:'0'.repeat(64),width:10,height:10,baseline:8,lineFeed:10,colorMode:'alpha',sheets:['sheet-0.png'],glyphs:{65:glyph,66:glyph},fallback:glyph};
 const font=new BitmapFont(manifest,[{}]),calls=[],context={drawImage:(...args)=>calls.push(args)};
 const draw=range=>font.drawNative(context,'AA\nBB',100,40,[10,10],4,0,2,0,[0,0],false,undefined,range,[],false,false,undefined,undefined,[{start:3,end:5,scale:.5}]);
 draw();
 assert.deepEqual(calls.map(call=>call.slice(5)),[
  [45,11,5,8],[51,11,5,8],[47.5,27,2.5,4],[50.5,27,2.5,4],
 ]);
 calls.length=0;draw([3,5]);
 assert.deepEqual(calls.map(call=>call.slice(5)),[[47.5,27,2.5,4],[50.5,27,2.5,4]],'colour-mask ink selection retains full-message centering and advances');

 assert.doesNotThrow(()=>font.drawNative(context,'A😀\r\nB',100,40,[10,10],4,0,0,0,[0,0],false,undefined,undefined,[],false,false,undefined,undefined,[{start:1,end:5,scale:.5}]));
 assert.throws(()=>font.drawNative(context,'A😀\r\nB',100,40,[10,10],4,0,0,0,[0,0],false,undefined,undefined,[],false,false,undefined,undefined,[{start:2,end:5,scale:.5}]),/Invalid native text scale span/,'span cannot split a surrogate pair');
 assert.throws(()=>font.drawNative(context,'A😀\r\nB',100,40,[10,10],4,0,0,0,[0,0],false,undefined,undefined,[],false,false,undefined,undefined,[{start:1,end:4,scale:.5}]),/Invalid native text scale span/,'span cannot split CRLF');
});

test('opt-in fixed-width spans centre each glyph advance in its cell and advance by the cell',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url),'utf8'));
 const font=new BitmapFont(manifest,manifest.sheets.map(()=>({})));
 const s=.68,size=[25*s,30*s],spans=[{start:0,end:2,width:12},{start:2,end:3,width:10},{start:3,end:5,width:12}];
 const inkX=value=>{const calls=[];font.drawNative({drawImage:(...args)=>calls.push(args)},value,72,30,size,0,0,0,0,[0,0],false,undefined,undefined,[],false,false,undefined,undefined,undefined,spans);return calls.map(call=>call[5]);};
 const g=c=>manifest.glyphs[c.codePointAt(0)],at=(cell,pitch,c)=>cell+(pitch-g(c).advance*s)/2+g(c).left*s;
 const colon=inkX('22:31'),space=inkX('22 27');
 const expected=[at(0,12,'2'),at(12,12,'2'),at(24,10,':'),at(34,12,'3'),at(46,12,'1')];
 colon.forEach((x,i)=>assert.ok(Math.abs(x-expected[i])<1e-9,`colon run glyph ${i}`));
 // Space has no ink, but its 10 px cell keeps the minute digits on the same pitch.
 assert.equal(space.length,4);
 assert.ok(Math.abs(space[2]-at(34,12,'2'))<1e-9);
 // Native 22:31:31 / 22:27:14 stills: hour ink 12 px apart, first minute ink 22 px after the second hour digit.
 assert.ok(Math.abs(colon[1]-colon[0]-12)<1e-9);assert.ok(Math.abs(space[2]-space[1]-22)<1e-9);
 assert.throws(()=>font.drawNative({drawImage(){}},'22\n31',72,30,size,0,0,0,0,[0,0],false,undefined,undefined,[],false,false,undefined,undefined,undefined,[{start:0,end:2,width:12}]),/Unsupported native fixed-width text run/);
 assert.throws(()=>font.drawNative({drawImage(){}},'2231',72,30,size,0,0,0,0,[0,0],false,undefined,undefined,[],false,false,undefined,undefined,undefined,[{start:0,end:5,width:12}]),/Invalid native fixed-width span/);
});
