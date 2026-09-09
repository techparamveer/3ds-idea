import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/os/bitmap-font.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {BitmapFont}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('Bitmap text uses signed bearings, advances, fallback, scaling and alignment',()=>{
 const previous=globalThis.document;
 let canvases=0;
 globalThis.document={createElement(){canvases++;return {getContext:()=>({drawImage(){},fillRect(){}})};}};
 try {
  const glyph={sheet:0,x:1,y:1,width:2,height:3,left:-1,advance:3};
  const font=new BitmapFont({height:3,glyphs:{65:glyph},fallback:{...glyph,advance:4}},[{naturalWidth:8,naturalHeight:8}]);
  const calls=[];
  const context={drawImage:(...args)=>calls.push(args)};
  font.draw(context,'A?',10,20,6,'#555','center');
  // Text width = (3 + 4) * 2 = 14; center at 10; bearing = -2.
  assert.deepEqual(calls.map(args=>args.slice(5)),[[1,17,4,6],[7,17,4,6]]);
  font.draw(context,'A',10,20,3,'#555','left');
  assert.equal(canvases,1,'same palette colour reuses the tinted sheets');
 } finally {globalThis.document=previous;}
});
