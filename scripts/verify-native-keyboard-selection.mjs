#!/usr/bin/env node
// Real-resource CPU component check, not a native LCD or full keyboard oracle.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import ts from 'typescript';
const sha=v=>createHash('sha256').update(v).digest('hex'),json=p=>JSON.parse(readFileSync(p,'utf8'));
const rgba=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
const difference=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if(a.subarray(i,i+4).some((v,j)=>v!==b[i+j]))n++;return n;};
export async function verifyNativeKeyboardSelection(options){
 for(const name of ['artifactDir','referenceRoot','pack','fontManifest','canvasModule'])assert.ok(isAbsolute(options[name]??''),`Supply absolute ${name}`);
 const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.artifactDir;mkdirSync(out,{recursive:true});
 const compiled=mkdtempSync(join(out,'compiled-')),sourceHashes={};
 for(const name of ['bitmap-font','native-layout','native-renderer','native-png','native-title-assets','native-keyboard-text']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');sourceHashes[name]=sha(source);
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,p)=>`from '${p}.mjs'`));
 }
 const [{createCanvas,loadImage},{BitmapFont},{loadNativeTitleAssets},{nativeNicknameTextPose}]=await Promise.all([
  import(pathToFileURL(options.canvasModule).href),...['bitmap-font','native-title-assets','native-keyboard-text'].map(n=>import(pathToFileURL(join(compiled,n+'.mjs')).href)),
 ]);
 const pack=json(options.pack),fontData=json(options.fontManifest),goldenPath=join(repo,'tests/fixtures/native-keyboard-selection.json'),golden=json(goldenPath);
 const expectedHashes={TextArea_02:'5294e1b38cb1a02c2b039a71a387877b7d0ef06ca1cd54140d311f1a2133ff51',DecorCursor:'1d37dc2ccce206abe6e2aaaf5123d2983ab9634e2a5266d490f71eb5f548502c',DecorArea_select:'132db2f8a0ccc6b141063e70f49518b493cfe3094c0e6b184c2b502b5bb262cb'};
 for(const [name,hash] of Object.entries(expectedHashes)){
  const relative='members/swkbd_common_LZ.bin/blyt/'+name;
  assert.equal(sha(readFileSync(join(options.referenceRoot,relative+'.bclyt'))),hash);
  assert.deepEqual(pack.layouts[name],json(join(options.referenceRoot,'decoded',relative+'.json')));
 }
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldFetch=globalThis.fetch;let loaded,font;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(n=>loadImage(join(dirname(options.fontManifest),n)))));
  const titleId=pack.titleId,url='common.json',manifest={schema:1,titles:{[titleId]:{titleId,packs:[url],fonts:{}}}};
  globalThis.fetch=async input=>{const u=new URL(input);assert.equal(u.origin,'https://selection.invalid');const p=u.pathname.slice(1);return new Response(p==='manifest.json'?JSON.stringify(manifest):p===url?JSON.stringify(pack):readFileSync(resolve(dirname(options.pack),p)));};
  loaded=await loadNativeTitleAssets('https://selection.invalid/manifest.json',titleId,[{url,alias:'text',layouts:Object.keys(expectedHashes),animations:[]}],new Map([['cbf_std.bcfnt',font]]));
  const renderer=loaded.renderer,before=JSON.stringify(renderer.packs),results=[],snapshots=[];
  function paint(pose,lateSelection=false){
   const canvas=createCanvas(320,240),ctx=canvas.getContext('2d'),order=[];
   const selection=()=>{order.push('select');for(const overrides of pose.selectionLayouts)assert.equal(renderer.draw(ctx,'text','DecorArea_select',{overrides}),true);};
   assert.equal(renderer.draw(ctx,'text','TextArea_02',{overrides:pose.textArea,attachments:{
    ...(!lateSelection?{N_decor:selection}:{}),
    N_transDecor:()=>{order.push('cursor');assert.equal(renderer.draw(ctx,'text','DecorCursor',{overrides:pose.cursorLayout}),true);},
   }}),true);
   if(lateSelection)renderer.withPaneParent(ctx,'text','TextArea_02','N_decor',[],selection,pose.textArea);
   return {canvas,order,pixels:rgba(canvas)};
  }
  // Both selection directions, moved cursor, equal endpoints, and maximum span.
  const cases=[['',0,null],['Ada',0,null],['Ada',1,3],['Ada',3,1],['Ada',2,2],['ABCDEFGHIJ',0,10],['ABCDEFGHIJ',10,0]];
  for(const [text,cursor,anchor] of cases){
   const row=golden.cases.find(r=>r.input.text===text&&r.input.cursor===cursor&&r.input.anchor===anchor);assert.ok(row);
   const state={value:text,cursor,anchor:row.model.anchor,selectionActive:row.model.selection},pose=nativeNicknameTextPose(state,pack.layouts.TextArea_02);
   const native=structuredClone(pose);
   for(const [name,pane] of Object.entries(row.cursor))native.cursorLayout[name]={translation:pane.position,size:pane.size,visible:pane.visible};
   native.selectionLayouts=row.selections.map(s=>({RootPane:{visible:s.root.visible},P_decorArea:{translation:s.picture.position,size:s.picture.size,visible:s.picture.visible}}));
   const actual=paint(pose),expected=paint(native);assert.deepEqual(actual.pixels,expected.pixels,'Original cursor/selection local writes reach pixels');
   assert.deepEqual(actual.order,['select','cursor']);
   const noSelection=structuredClone(pose);noSelection.selectionLayouts.forEach(s=>s.RootPane.visible=false);
   const selected=row.selections.some(s=>s.root.visible),selectionPixels=difference(actual.pixels,paint(noSelection).pixels);
   assert.equal(selectionPixels>0,selected);
   const latePixels=difference(actual.pixels,paint(pose,true).pixels);assert.equal(latePixels>0,selected,'A late overlay incorrectly covers native glyphs');
   const file=`case-${results.length}.png`;writeFileSync(join(out,file),actual.canvas.toBuffer('image/png'));snapshots.push({pose,pixels:actual.pixels.slice()});
   results.push({input:row.input,file,selectionPixels,lateOverlayDifference:latePixels,rgbaSha256:sha(actual.pixels)});
  }
  for(const s of snapshots.toReversed())assert.deepEqual(paint(s.pose).pixels,s.pixels,'Reverse repaint after hidden/visible and changed selections');
  assert.equal(JSON.stringify(renderer.packs),before);assert.deepEqual(renderer.diagnostics,[]);assert.deepEqual(loaded.diagnostics,[]);
  const report={schema:1,passed:true,scope:'Native cursor/selection local writes and real-resource CPU attachment order; no whole-keyboard, native world/glyph/LCD or input acceptance.',sourceHashes,resourceHashes:expectedHashes,goldenSha256:sha(readFileSync(goldenPath)),fontSourceSha256:fontData.sourceSha256,results};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{loaded?.dispose();font?.dispose();globalThis.fetch=oldFetch;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete globalThis.document;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','reference-root','pack','font-manifest','canvas-module'].map(n=>[n,{type:'string'}]))});
 const report=await verifyNativeKeyboardSelection(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])));console.log(JSON.stringify({passed:report.passed,results:report.results},null,2));
}
