import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeLayout } from '../src/os/layout.ts';

// These byte buffers are deliberately synthetic, not original HOME Menu assets.
function section(tag,size=8){const b=Buffer.alloc(size);b.write(tag);b.writeUInt32LE(size,4);return b;}
function pane(tag,name){const b=section(tag,tag==='pic1'?128:76);b[8]=3;b[9]=1;b[10]=128;b.write(name,12,16);
 [10,20,0,0,0,30,2,3,40,50].forEach((v,i)=>b.writeFloatLE(v,36+i*4));
 if(tag==='pic1'){b.fill(255,76,92);b.writeUInt16LE(2,92);b.writeUInt16LE(1,94);[0,0,1,0,0,1,1,1].forEach((v,i)=>b.writeFloatLE(v,96+i*4));}return b;}
function file(sections){const h=Buffer.alloc(20);h.write('CLYT');h.writeUInt16LE(0xfeff,4);h.writeUInt16LE(20,6);h.writeUInt32LE(0x2020000,8);h.writeUInt32LE(20+sections.reduce((n,s)=>n+s.length,0),12);h.writeUInt16LE(sections.length,16);return Buffer.concat([h,...sections]);}
test('Decode pane hierarchy, transforms, pictures and preserve unknown sections',()=>{
 const unknown=section('usd1',12);unknown.writeUInt32LE(0,8);
 const decoded=decodeLayout(file([pane('pan1','root'),section('pas1'),pane('pic1','image'),unknown,section('pae1')]));
 assert.equal(decoded.roots.length,1);const child=decoded.roots[0].children[0];
 assert.equal(child.name,'image');assert.deepEqual(child.translation,[10,20,0]);assert.deepEqual(child.rotation,[0,0,30]);
 assert.deepEqual(child.scale,[2,3]);assert.deepEqual(child.size,[40,50]);assert.equal(child.alpha,128);
 assert.deepEqual(child.picture.uvSets,[[0,0,1,0,0,1,1,1]]);assert.equal(child.picture.material,2);
 assert.deepEqual(Buffer.from(decoded.unsupported[0].bytes),unknown);
});
test('Decode canvas and offset-relative font and texture lists',()=>{
 const lyt=section('lyt1',20);lyt.writeUInt32LE(1,8);lyt.writeFloatLE(320,12);lyt.writeFloatLE(240,16);
 const list=section('fnl1',24);list.writeUInt32LE(1,8);list.writeUInt32LE(4,12);list.write('font\0',16);
 const layout=decodeLayout(file([lyt,list]));assert.deepEqual(layout.canvas,{origin:1,width:320,height:240});assert.deepEqual(layout.fonts,['font']);
 list.writeUInt32LE(0,12);assert.throws(()=>decodeLayout(file([list])),/offset table/);
});
test('Reject malformed hierarchy, truncated picture data and nonfinite transforms',()=>{
 for(const s of [[section('pas1')],[section('pae1')],[pane('pan1','root'),section('pas1')]])assert.throws(()=>decodeLayout(file(s)));
 const bad=pane('pic1','bad');bad.writeUInt16LE(2,94);assert.throws(()=>decodeLayout(file([bad])),/outside section/);
 const nan=pane('pan1','nan');nan.writeFloatLE(NaN,36);assert.throws(()=>decodeLayout(file([nan])),/Non-finite/);
});
test('Honor subarray byte offsets without reading neighboring bytes',()=>{
 const actual=file([pane('pan1','only')]);const padded=Buffer.concat([Buffer.alloc(7),actual,Buffer.alloc(9)]);
 assert.equal(decodeLayout(padded.subarray(7,7+actual.length)).roots[0].name,'only');
});
