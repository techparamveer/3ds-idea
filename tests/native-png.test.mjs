import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {deflateSync} from 'node:zlib';
import ts from 'typescript';
import sharp from 'sharp';
const source=readFileSync(new URL('../src/os/native-png.ts',import.meta.url),'utf8');
const {decodeNativePng}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
function chunk(kind,data){
 const result=Buffer.alloc(data.length+12);result.writeUInt32BE(data.length);result.write(kind,4);data.copy(result,8);
 let crc=0xffffffff;for(const byte of result.subarray(4,-4)){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 result.writeUInt32BE((crc^0xffffffff)>>>0,result.length-4);return result;
}
function png(width,height,scanlines){
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const compressed=deflateSync(scanlines),split=Math.floor(compressed.length/2);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',compressed.subarray(0,split)),chunk('IDAT',compressed.subarray(split)),chunk('IEND',Buffer.alloc(0))]);
}
test('straight PNG decoding retains independent RGB under zero and partial alpha for all filters',async()=>{
 // Two texels per row. Filters None, Sub, Up, Average and Paeth each recover
 // the same bytes, including hidden white and low-alpha non-grey channels.
 const row=[255,255,255,0,33,97,201,17],scanlines=Buffer.from([
  0,...row,
  1,255,255,255,0,34,98,202,17,
  2,0,0,0,0,0,0,0,0,
  3,128,128,128,0,145,177,229,9,
  4,0,0,0,0,0,0,0,0,
 ]);
 const image=await decodeNativePng(png(2,5,scanlines),{width:2,height:5});
 assert.deepEqual([...image.data],Array.from({length:5},()=>row).flat());
});
test('decoder rejects wrong formats, dimensions, truncation, over-expansion and aborts',async()=>{
 const valid=png(1,1,Buffer.from([0,255,255,255,0]));
 await assert.rejects(decodeNativePng(valid,{width:2,height:1}),/dimensions differ/);
 await assert.rejects(decodeNativePng(valid,{width:1025,height:1025}),/budget/);
 await assert.rejects(decodeNativePng(valid.subarray(0,-4),{width:1,height:1}),/Incomplete|Truncated/);
 await assert.rejects(decodeNativePng(png(1,1,Buffer.alloc(50)),{width:1,height:1}),/exceeds dimensions/);
 await assert.rejects(decodeNativePng(png(1,1,Buffer.alloc(4)),{width:1,height:1}),/Truncated.*scanlines/);
 await assert.rejects(decodeNativePng(png(1,1,Buffer.from([5,0,0,0,0])),{width:1,height:1}),/filter/);
 const interlaced=Buffer.from(valid);interlaced[28]=1;await assert.rejects(decodeNativePng(interlaced,{width:1,height:1}),/non-interlaced/);
 const controller=new AbortController();controller.abort();await assert.rejects(decodeNativePng(valid,{width:1,height:1},controller.signal),{name:'AbortError'});
});
const root=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E'),packPath=resolve(root,'packs/home/launcher.json');
test('real upper hints and balloon delivery PNGs decode byte-for-byte like the reference decoder',{skip:!existsSync(packPath)},async()=>{
 const pack=JSON.parse(readFileSync(packPath)),names=new Set(['LncBase_U_00','LncBlln_00'].flatMap(name=>pack.layouts[name].textures));
 for(const name of names){const record=pack.textures[name],path=resolve(root,record.url),pixels=await decodeNativePng(readFileSync(path),record),reference=await sharp(path).ensureAlpha().raw().toBuffer();assert.deepEqual(Buffer.from(pixels.data),reference,name);}
 const record=pack.textures['PictBtnY.bclim'];assert.ok(record);
 const pixels=await decodeNativePng(readFileSync(resolve(root,record.url)),record);assert.deepEqual([...pixels.data.slice((5*8+5)*4,(5*8+5)*4+4)],[255,255,255,0]);
});
