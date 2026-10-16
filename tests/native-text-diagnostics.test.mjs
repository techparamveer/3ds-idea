import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createNativeTextDiagnostic,immutableTextDiagnostic,textInkFingerprint} from '../src/os/native-text-diagnostics.ts';
const module=name=>{
 const file=new URL('../src/os/'+name+'.ts',import.meta.url);
 return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+new URL(n.endsWith('.ts')?n:n+'.ts',file).href+s)).toString('base64');
};
const {NativeLayoutRenderer}=await import(module('native-renderer'));
const manifest=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/fonts/shared/font.json',import.meta.url)));
const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json',import.meta.url)));
const find=(panes,name)=>{for(const p of panes){if(p.name===name)return p;const found=find(p.children,name);if(found)return found;}};
const source=pack.layouts.P_FinderVS_U;
const originalPane=find(source.roots,'Txt_total');
assert.ok(originalPane?.text);

// Real Camera pane, font manifest, cache and renderer; synthetic ink/Canvas
// transport isolates instrumentation behavior, not native pixel fidelity.
function fixture(enabled){
 let reads=0,draws=0,attributes=0;
 const canvas=()=>{const c={width:1,height:1},ctx={canvas:c,globalAlpha:1,globalCompositeOperation:'source-over',imageSmoothingEnabled:true,
  save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},
  getTransform:()=>({a:1,b:0,c:0,d:1,e:0.5,f:0.25}),getContextAttributes(){attributes++;return {alpha:true,willReadFrequently:false};},
  getImageData(x,y,w,h){reads++;return {width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(127)};},
  putImageData(image){c.image=image;},drawImage(image){draws++;c.image=image.image;}};c.getContext=()=>ctx;return c;};
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 const pane=structuredClone(originalPane);pane.children=[];pane.text.value='12';pane.text.font=0;
 const layout={...source,fonts:['shared'],roots:[pane]};
 const renderer=new NativeLayoutRenderer({camera:{layouts:{main:layout},animations:{}}},{camera:new Map()},new Map([['shared',{manifest,drawNative(){}}]]));
 const target=canvas(),ctx=target.getContext();
 return {renderer,ctx,counts:()=>({reads,draws,attributes}),
  paint(){if(enabled)renderer.beginTextDiagnostic();assert.equal(renderer.draw(ctx,'camera','main'),true,renderer.diagnostics.join('\n'));return renderer.endTextDiagnostic();},
  close(){renderer.dispose();globalThis.document=prior;}};
}

test('fill/hit provenance, actual destination state and immutable relevant resource identity without extra pixel reads',()=>{
 const off=fixture(false);let offCounts;
 try{assert.equal(off.paint(),null);assert.equal(off.paint(),null);offCounts=off.counts();assert.equal(offCounts.attributes,0);}finally{off.close();}
 const on=fixture(true);
 try{
  const first=on.paint(),second=on.paint();assert.equal(first.draws.length,1);assert.equal(first.draws[0].cache,'fill');assert.equal(second.draws[0].cache,'hit');
  assert.equal(second.draws[0].fill,first.draws[0].fill,'hits reuse the immutable fill, not a fresh readback');
  assert.equal(first.draws[0].fill.font.sourceSha256,manifest.sourceSha256);assert.ok(first.draws[0].fill.font.glyphs.length);
  assert.equal(first.hashCount,2);assert.ok(first.hashBytes>0);assert.equal(second.hashCount,0);
  assert.ok(first.hashMs>=0&&first.metadataMs>=0);assert.equal(first.draws[0].destination.composition,'source-over');
  assert.equal(first.draws[0].destination.contextAttributes.willReadFrequently,false);
  assert.deepEqual({reads:on.counts().reads,draws:on.counts().draws},{reads:offCounts.reads,draws:offCounts.draws});
  assert.throws(()=>{first.draws[0].fill.runs[0].before.bytes=0;},TypeError);
  on.renderer.dispose();assert.equal(on.renderer.endTextDiagnostic(),null);on.renderer.beginTextDiagnostic();assert.equal(on.renderer.endTextDiagnostic(),null);
 }finally{on.close();}
});

test('a cache populated before collection is explicitly unobserved, not reconstructed',()=>{
 const f=fixture(false);try{f.paint();f.renderer.beginTextDiagnostic();f.paint();const sample=f.renderer.endTextDiagnostic();assert.equal(sample,null);
  f.renderer.beginTextDiagnostic();assert.equal(f.renderer.draw(f.ctx,'camera','main'),true);const hit=f.renderer.endTextDiagnostic();
  assert.equal(hit.draws[0].cache,'fill-not-observed');assert.equal(hit.draws[0].fill,null);assert.equal(hit.hashCount,0);
 }finally{f.close();}
});

test('bounded discriminator records explicit overload and does not retain input arrays',()=>{
 const p=createNativeTextDiagnostic(),bytes=new Uint8ClampedArray([0,1,2,255]);p.begin();const hash=p.fingerprint(bytes);bytes[0]=10;
 assert.notDeepEqual(textInkFingerprint(bytes),hash);assert.equal(hash.bytes,4);assert.equal(hash.algorithm,'fnv1a32+adler32');
 assert.equal(p.fingerprint(new Uint8ClampedArray(2*1024*1024)),null);
 const ctx={canvas:{width:1,height:1}},surface={width:1,height:1};
 for(let i=0;i<35;i++)p.draw(surface,'key','pack','layout','pane',ctx,{});
 p.fill(surface,'key','shared',manifest,'A',[{before:null,colored:null}]);
 const sample=p.end();assert.equal(sample.draws.length,32);assert.equal(sample.dropped,3);assert.equal(sample.hashSkipped,1);assert.equal(sample.fillSkipped,1);
 assert.equal(sample.draws[0].destination.contextAttributes,null);
 const nested=immutableTextDiagnostic({fill:sample});assert.equal(nested.fill,sample);
 assert.equal(p.end(),null);
});
