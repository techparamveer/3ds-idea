import test from 'node:test';
import assert from 'node:assert/strict';
import { measureBitmapText, validateBitmapFont, BitmapFont, loadBitmapFont } from '../src/os/bitmap-font.ts';
const glyph={sheet:0,x:1,y:1,width:2,height:3,left:-1,advance:3};
const fixture=()=>({schema:1,sourceSha256:'0'.repeat(64),height:3,baseline:2,lineFeed:5,sheets:['sheet-0.png'],glyphs:{65:{...glyph},32:{...glyph,width:0,advance:2}},fallback:{...glyph,advance:4}});
test('Baseline layout distinguishes advance from ink and aligns each line',()=>{
 const run=measureBitmapText(fixture(),'A A\n?',6,'center');
 assert.deepEqual(run.lineWidths,[16,8]);assert.equal(run.width,16);assert.equal(run.height,16);
 assert.deepEqual(run.placed.map(p=>[p.x,p.y,p.width,p.height]),[[-10,-4,4,6],[-4,-4,0,6],[0,-4,4,6],[-6,6,4,6]]);
});
test('Missing supplementary codepoint uses one fallback; absent fallback skips glyph',()=>{
 assert.equal(measureBitmapText(fixture(),'😀',3).width,4);
 const m=fixture();m.fallback=null;assert.equal(measureBitmapText(m,'?',3).placed.length,0);
 assert.deepEqual(measureBitmapText(m,'A\r\nA',3).lineWidths,[3,3]);
});
test('Manifest validation rejects invalid codepoints, metrics and atlas rectangles',()=>{
 for(const change of [m=>m.glyphs['65536']=glyph,m=>m.glyphs[65].left=-129,m=>m.baseline=NaN,m=>delete m.glyphs[65].x,m=>m.sheets=['../font.png']]){
  const m=fixture();change(m);assert.throws(()=>validateBitmapFont(m));
 }
 assert.throws(()=>validateBitmapFont(fixture(),[{width:2,height:2}]),/outside bitmap/);
});
test('Drawing preserves middle alignment and reuses bounded text-run tints',()=>{
 const old=globalThis.document;let created=0;
 globalThis.document={createElement(){created++;return {getContext:()=>({drawImage(){},fillRect(){}})};}};
 try{
  const m=fixture();const font=new BitmapFont(m,[{naturalWidth:8,naturalHeight:8}]);m.glyphs[65].advance=90;
  const calls=[];const context={drawImage:(...args)=>calls.push(args)};
  font.draw(context,'A',10,20,6,'#555','center');font.draw(context,'A',10,20,6,'#555','center');
  assert.deepEqual(calls[0].slice(1),[5,17]);assert.equal(calls[0][0].width,5);assert.equal(calls[0][0].height,6);assert.equal(created,1);
 }finally{globalThis.document=old;}
});
test('Font loader resolves sheets and validates their decoded dimensions',async()=>{
 const old={fetch:globalThis.fetch,Image:globalThis.Image,window:globalThis.window};const paths=[],requests=[];
 globalThis.fetch=async(url)=>{requests.push(String(url));return new Response(JSON.stringify(fixture()));};
 globalThis.window={location:{href:'https://example.test/'}};
 globalThis.Image=class{naturalWidth=8;naturalHeight=8;set src(value){paths.push(value);}async decode(){}};
 try{
  const font=await loadBitmapFont('/os/font/font.json');assert.ok(font instanceof BitmapFont);
  assert.deepEqual(requests,['/os/font/font.json','https://example.test/os/font/sheet-0.png']);assert.ok(paths[0].startsWith('blob:'));
  globalThis.Image=class{naturalWidth=1;naturalHeight=1;async decode(){}};
  await assert.rejects(()=>loadBitmapFont('/os/font/font.json'),/outside bitmap/);
 }finally{Object.assign(globalThis,old);}
});
