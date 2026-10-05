import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import ts from 'typescript';

// Notifications lower Close 577 / list 820 (unread-dot f073581, native 58fff714…).
// Source-identified writer binding for T_EndF_00 only. Tests never pass the scenario.
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const layoutSource=readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8');
const rendererSource=readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8');
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
const manifest=JSON.parse(readFileSync(new URL('fonts/shared/font.json', firmware), 'utf8'));
const compiled=ts.transpileModule(readFileSync(new URL('../src/os/bitmap-font.ts', import.meta.url), 'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {BitmapFont,nativeCenteredGlyphQuads}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const pane=(layout, name)=>flatten(news.layouts[layout].roots).find(p=>p.name===name);
const bank=messages.messages.newslist_msbt_LZ;
const newBack=bank.messages[bank.labels.new_back].text;

test('source Close/title text panes: F is explicit-left 0x110, B is 0x111, titles are 0x101', ()=>{
  const endF=pane('NewsTopBtn_D_00', 'T_EndF_00'), endB=pane('NewsTopBtn_D_00', 'T_EndB_00');
  assert.deepEqual([endF.text.alignment, endF.text.lineAlignment, endF.size, endF.text.size], [4, 1, [312, 21], [17.5, 21]]);
  assert.deepEqual([endB.text.alignment, endB.text.lineAlignment, endB.size, endB.text.size], [4, 0, [312, 21], [17.5, 21]]);
  for(const name of ['T_NewsTitleB_00', 'T_NewsTitleF_00']){
    const title=pane('NewsWndwNews_D_00', name);
    assert.deepEqual([title.text.alignment, title.text.lineAlignment], [3, 2], name);
  }
  assert.equal(newBack, ' Close');
  assert.equal(manifest.colorMode, 'alpha');
  for(const char of newBack)assert.ok(manifest.glyphs[String(char.codePointAt(0))].left>=0, `bearing of U+${char.codePointAt(0).toString(16)} keeps measured left at 0`);
});

test('writer-0x110 single line reuses the 0x111 ceil-half origin and pixel-centre alpha raster', ()=>{
  const font=new BitmapFont(manifest, manifest.sheets.map(()=>({naturalWidth:4096, naturalHeight:4096})));
  font.glyphMask=g=>({width:g.width+2, height:g.height+2, data:new Uint8ClampedArray((g.width+2)*(g.height+2)*4).fill(255)});
  const render=(lineAlignment, origin, value=newBack, alignment=4)=>{
    let image, draws=[];
    font.drawNative({createImageData:(w, h)=>({width:w, height:h, data:new Uint8ClampedArray(w*h*4)}), putImageData:value=>{image=value;}, drawImage:(...args)=>draws.push(args)},
      value, 312, 21, [17.5, 21], alignment, 0, 0, lineAlignment, [0, 0], false, undefined, undefined, [], false, false, undefined, undefined, undefined, undefined, origin);
    return {image, draws};
  };
  const generic=render(1), bound=render(1, 'writer-0x110'), centred=render(0);
  assert.equal(bound.draws.length, 0, 'bound F uses the original alpha sampler');
  assert.deepEqual(bound.image.data, centred.image.data, 'single-line 0x110 equals 0x111 (T_EndB_00 path)');
  const sx=17.5/manifest.width, width=Array.from(newBack, c=>manifest.glyphs[String(c.codePointAt(0))].advance*sx).reduce((a, b)=>a+b);
  const first=manifest.glyphs['57457'];
  assert.equal(generic.draws[0][5], (312-width)/2+first.left*sx, 'unbound generic path keeps a fractional (312-w)/2 origin');
  assert.ok(Math.abs((312-width)/2-120.3)<1e-9, 'generic origin 120.3; traced writer origin 120');
  const quads=nativeCenteredGlyphQuads(manifest, newBack, 312, 21, [17.5, 21]);
  assert.equal(156-Math.ceil(Math.fround(Math.fround(width)*.5)), 120);
  assert.ok(Math.abs(quads[0].x-Math.fround(first.left*Math.fround(sx))-120)<1e-5, '156 - ceil(f32(w/2)) block origin');
  assert.throws(()=>render(1, 'writer-0x110', '\nClose'), /Unsupported native single-line block origin/);
  assert.throws(()=>render(2, 'writer-0x110'), /Unsupported native single-line block origin/);
  assert.throws(()=>render(1, 'writer-0x110', newBack, 3), /Unsupported native single-line block origin/);
  assert.throws(()=>render(1, 'writer-0x111'), /Unsupported native single-line block origin/);
  assert.throws(()=>font.drawNative({createImageData:(w, h)=>({width:w, height:h, data:new Uint8ClampedArray(w*h*4)}), putImageData(){}, drawImage(){}},
    newBack, 312, 21, [17.5, 21], 4, 0, 0, 1, [0, 0], true, undefined, undefined, [], false, false, undefined, undefined, undefined, undefined, 'writer-0x110'), /Unsupported native single-line block origin/);
  assert.throws(()=>font.drawNative({createImageData:(w, h)=>({width:w, height:h, data:new Uint8ClampedArray(w*h*4)}), putImageData(){}, drawImage(){}},
    newBack, 312, 21, [17.5, 21], 4, 0, 0, 1, [0.5, 0], false, undefined, undefined, [], false, false, undefined, undefined, undefined, undefined, 'writer-0x110'), /Unsupported native single-line block origin/);
  assert.throws(()=>font.drawNative({createImageData:(w, h)=>({width:w, height:h, data:new Uint8ClampedArray(w*h*4)}), putImageData(){}, drawImage(){}},
    newBack, 312, 21, [17.5, 21], 4, 0, 0, 1, [0, 0], false, 'azahar-12p4-fit', undefined, [], false, false, undefined, undefined, undefined, undefined, 'writer-0x110'), /Unsupported native single-line block origin/);
  const overhang=new BitmapFont({...manifest, glyphs:{...manifest.glyphs, 67:{...manifest.glyphs['67'], left:0, width:20, advance:10}}}, manifest.sheets.map(()=>({})));
  overhang.glyphMask=font.glyphMask;
  assert.throws(()=>overhang.drawNative({createImageData:(w, h)=>({width:w, height:h, data:new Uint8ClampedArray(w*h*4)}), putImageData(){}, drawImage(){}},
    newBack, 312, 21, [17.5, 21], 4, 0, 0, 1, [0, 0], false, undefined, undefined, [], false, false, undefined, undefined, undefined, undefined, 'writer-0x110'), /Unsupported native single-line block origin/);
  const negative=new BitmapFont({...manifest, glyphs:{...manifest.glyphs, 67:{...manifest.glyphs['67'], left:-1}}}, manifest.sheets.map(()=>({})));
  negative.glyphMask=font.glyphMask;
  assert.throws(()=>negative.drawNative({createImageData:(w, h)=>({width:w, height:h, data:new Uint8ClampedArray(w*h*4)}), putImageData(){}, drawImage(){}},
    newBack, 312, 21, [17.5, 21], 4, 0, 0, 1, [0, 0], false, undefined, undefined, [], false, false, undefined, undefined, undefined, undefined, 'writer-0x110'), /Unsupported native single-line block origin/);
});

test('painter binds writer-0x110 on T_EndF_00 and LCD sampling on T_EndB_00; row titles sample separately; new_back and SceneIn stay as before', ()=>{
  assert.match(painter, /renderer\.draw\(bottom,'notifications','NewsTopBtn_D_00',\{bindings:\[\{name:'NewsTopBtn_D_00_SceneIn',frame:20\}\],textSampling:'lcd',textSamplingPanes:\['T_EndB_00'\],overrides:\{T_EndB_00:message\('new_back'\),T_EndF_00:\{\.\.\.message\('new_back'\),singleLineBlockOrigin:'writer-0x110'\}\}\}\)/);
  assert.equal(painter.match(/singleLineBlockOrigin/g).length, 1);
  assert.match(painter, /T_NewsTitleB_00:\{text:row\.label\},T_NewsTitleF_00:\{text:row\.label\}/);
  assert.equal(/new_close/.test(painter), false);
  const section=painter.slice(painter.indexOf("renderer.packs['notification-messages']"), painter.indexOf("options.font?.draw(bottom,view.text"));
  assert.ok(section.includes("'NewsTopBtn_D_00'"));
  // Close: only the y-26.5 shadow (notifications-close-240-2026-10-04.md). Row titles:
  // writer-0x101 allowlist (notifications-list-direct-2026-10-04.md).
  assert.deepEqual(section.match(/textSampling[^,]*/g), ["textSampling:'lcd'", "textSamplingPanes:['T_NewsTitleB_00'", "textSampling:'lcd'", "textSamplingPanes:['T_EndB_00']"]);
  assert.equal(/azahar-12p4-fit|textCoverageAdaptation/.test(section), false);
  assert.match(section, /'notification-slidebar','SlideBar',\{pictureSampling:'lcd'/);
  assert.equal(/'NewsWndwNews_D_00',[^{]*\{[^}]*pictureSampling/.test(section), false);
  assert.equal(/'NewsTopBtn_D_00',[^{]*\{[^}]*pictureSampling/.test(section), false);
  assert.match(layoutSource, /if\(value\.singleLineBlockOrigin&&pane\.text\)pane\.text\.singleLineBlockOrigin=value\.singleLineBlockOrigin;/);
  assert.match(rendererSource, /text\.fixedWidthSpans,text\.singleLineBlockOrigin\);/);
});

test('news code.bin carries the same NW writer flag setup and alignment branches', t=>{
  const path='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/exefs/code.bin';
  if(!existsSync(path))return t.skip('private Notifications code.bin is absent');
  const code=readFileSync(path);
  assert.equal(createHash('sha256').update(code).digest('hex'), 'b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228');
  const word=address=>code.readUInt32LE(address-0x100000);
  // 0x16b080 (HOME 0x1a3e24): ldrb r1,[r4,#0xfd]; mov r0,#0; and r1,r1,#3; cmp r1,#1 -> explicit left leaves low bits 0.
  assert.deepEqual([0x16b0d8, 0x16b0dc, 0x16b0e0, 0x16b0e4].map(word), [0xe5d410fd, 0xe3a00000, 0xe2011003, 0xe3510001]);
  // 0x18fe2c (HOME 0x2ffc90): push; vadd s16,s0,s2 / s17,s1,s3; and r0,r0,#3; cmp r0,#1 per-line branch.
  assert.deepEqual([0x18fe2c, 0x18feb4, 0x18feb8, 0x18ff34, 0x18ff38].map(word), [0xe92d43f0, 0xee308a01, 0xee708aa1, 0xe2000003, 0xe3500001]);
  // 0x18fffc line measure returns right-left (vsub.f32 s16,s0,s1).
  assert.equal(word(0x190058), 0xee308a60);
});
