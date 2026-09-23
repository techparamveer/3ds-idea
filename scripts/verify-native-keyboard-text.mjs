#!/usr/bin/env node
// Private real-resource component check. This does not drive a browser or keyboard lifecycle.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import ts from 'typescript';

const sha=value=>createHash('sha256').update(value).digest('hex');
const readJSON=path=>JSON.parse(readFileSync(path,'utf8'));
const flatten=panes=>panes.flatMap(pane=>[pane,...flatten(pane.children)]);
const equivalent=(actual,expected,label)=>assert.equal(JSON.stringify(actual),JSON.stringify(expected),label);
const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
function difference(a,b,width=320){
 let count=0,x0=width,y0=a.length/4/width,x1=-1,y1=-1;
 for(let at=0;at<a.length;at+=4)if(a.subarray(at,at+4).some((v,i)=>v!==b[at+i])){
  const x=at/4%width,y=Math.floor(at/4/width);count++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
 }
 return {pixels:count,bounds:count?[x0,y0,x1+1,y1+1]:null};
}
// Independent projection of the frozen local values, deliberately separate from
// withPaneParent. This catches omitted parent overrides; it is not a native
// CalcMtx replay or a native LCD pixel oracle.
function cursorRectangle(capture,textArea,cursorLayout){
 const path=(panes,name,parents=[])=>{for(const pane of panes){const chain=[...parents,pane];if(pane.name===name)return chain;const child=path(pane.children,name,chain);if(child)return child;}return null;};
 const chain=[...path(textArea.roots,'N_transDecor').map(p=>[p,'TextArea_02']),...path(cursorLayout.roots,'P_decorCursorMS').map(p=>[p,'DecorCursor'])];
 let x=160,y=120,sx=1,sy=1;
 for(const [pane,layout] of chain){
  let frozen=capture.panes.find(p=>p.id===`${layout}.bclyt:${pane.name}`);
  if(!frozen){assert.equal(`${layout}/${pane.name}`,'TextArea_02/P_textArea_00');frozen={position:pane.translation,scale:pane.scale};} // Unwritten authored container.
  assert.ok(pane.rotation.every(v=>v===0),'Projection check only covers the original unrotated text/cursor path');
  x+=sx*frozen.position[0];y-=sy*frozen.position[1];sx*=frozen.scale[0];sy*=frozen.scale[1];
 }
 const [pane]=chain.at(-1),frozen=capture.panes.find(p=>p.id==='DecorCursor.bclyt:P_decorCursorMS');
 const left=x-sx*frozen.size[0]*(pane.origin%3)/2,top=y-sy*frozen.size[1]*Math.floor(pane.origin/3)/2;
 return [left,top,left+sx*frozen.size[0],top+sy*frozen.size[1]];
}
function frozenOverrides(capture,layoutName,layout){
 const result={},panes=new Map(flatten(layout.roots).map(p=>[p.name,p]));
 for(const row of capture.panes.filter(p=>p.id.startsWith(layoutName+'.bclyt:'))){
  const pane=panes.get(row.name);assert.ok(pane,`Frozen pane ${row.id} exists`);
  result[row.name]={translation:row.position,scale:row.scale,size:row.size,visible:row.visible};
  if(pane.picture||pane.window)result[row.name].vertexColors=row.colors;
  if(pane.text){if(Object.hasOwn(row,'paintText'))result[row.name].text=row.paintText;if(row.lineSpacing!==null)result[row.name].lineSpacing=row.lineSpacing;}
 }
 return result;
}
function verifyPose(posed,capture,layoutName){
 const panes=new Map(flatten(posed.roots).map(p=>[p.name,p]));
 for(const row of capture.panes.filter(p=>p.id.startsWith(layoutName+'.bclyt:'))){
  const pane=panes.get(row.name);assert.ok(pane,row.id);
  for(const [field,nativeField] of [['translation','position'],['scale','scale'],['size','size']])equivalent(pane[field],row[nativeField],`${capture.input}/${row.id}/${field}`);
  assert.equal(!!(pane.flags&1),row.visible,`${row.id}/visible`);
  const picture=pane.picture??pane.window?.content;
  if(picture)equivalent(picture.colors,row.colors,`${row.id}/colors`);
  if(pane.text){if(Object.hasOwn(row,'paintText'))assert.equal(pane.text.value,row.paintText,`${row.id}/text`);assert.equal(pane.text.lineSpacing,row.lineSpacing,`${row.id}/lineSpacing`);}
 }
}

export async function verifyNativeKeyboardText(options){
 for(const key of ['artifactDir','referenceRoot','pack','fontManifest','canvasModule'])assert.ok(options[key]&&isAbsolute(options[key]),`Supply an absolute ${key}`);
 const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.artifactDir;
 mkdirSync(out,{recursive:true});const compiled=mkdtempSync(join(out,'compiled-'));
 const moduleNames=['bitmap-font','native-layout','native-renderer','native-png','native-title-assets','native-keyboard-text'],sourceHashes={};
 for(const name of moduleNames){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');sourceHashes[name]=sha(source);
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,p)=>`from '${p.replace(/\.ts$/,'')}.mjs'`);
  writeFileSync(join(compiled,name+'.mjs'),code);
 }
 const [{createCanvas,loadImage},{BitmapFont},{poseNativeLayout},{loadNativeTitleAssets},{nativeNicknameInitialTextPose}]=await Promise.all([
  import(pathToFileURL(options.canvasModule).href),import(pathToFileURL(join(compiled,'bitmap-font.mjs')).href),
  import(pathToFileURL(join(compiled,'native-layout.mjs')).href),import(pathToFileURL(join(compiled,'native-title-assets.mjs')).href),import(pathToFileURL(join(compiled,'native-keyboard-text.mjs')).href),
 ]);
 const reference=join(options.referenceRoot,'settings-nickname/lower-first-paint'),contractPath=join(reference,'text-pane-contract-frozen.json'),contract=readJSON(contractPath);
 for(const [file,expected] of [['text-pane-fixture-frozen.py',contract.fixtureSha256],['text-pane-result-frozen.json',contract.resultSha256]])assert.equal(sha(readFileSync(join(reference,file))),expected,file);
 assert.equal(contract.sourceSha256,'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0');
 equivalent(contract.cases.map(c=>c.input),['','Ada','ABCDEFGHIJ'],'Frozen ASCII cases');
 const pack=readJSON(options.pack),fontData=readJSON(options.fontManifest),resources={};
 for(const [name,expected] of [['TextArea_02','5294e1b38cb1a02c2b039a71a387877b7d0ef06ca1cd54140d311f1a2133ff51'],['DecorCursor','1d37dc2ccce206abe6e2aaaf5123d2983ab9634e2a5266d490f71eb5f548502c']]){
  const raw=join(options.referenceRoot,'members/swkbd_common_LZ.bin/blyt',name+'.bclyt');assert.equal(sha(readFileSync(raw)),expected,name);
  const decoded=readJSON(join(options.referenceRoot,'decoded/members/swkbd_common_LZ.bin/blyt',name+'.json'));
  equivalent(pack.layouts[name],decoded,`${name} decoded resource`);resources[name]={sha256:expected};
 }
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldFetch=globalThis.fetch,requests=[];
 let loaded,font;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(options.fontManifest),name)))));
  for(const char of ' AdaABCDEFGHIJ')assert.ok(fontData.glyphs[String(char.charCodeAt(0))],`Real font glyph ${char}`);
  const url='component.json',titleId=pack.titleId,manifest={schema:1,titles:{[titleId]:{titleId,packs:[url],fonts:{}}}};
  globalThis.fetch=async input=>{
   const url=new URL(input);assert.equal(url.origin,'https://keyboard-component.invalid');const path=url.pathname.slice(1);requests.push(path);
   return new Response(path==='manifest.json'?JSON.stringify(manifest):path==='component.json'?JSON.stringify(pack):readFileSync(resolve(dirname(options.pack),path)));
  };
  loaded=await loadNativeTitleAssets('https://keyboard-component.invalid/manifest.json',titleId,[{url,alias:'text',layouts:['TextArea_02','DecorCursor'],animations:[]}],new Map([['cbf_std.bcfnt',font]]));
  const renderer=loaded.renderer,sourceBefore=JSON.stringify(renderer.packs),results=[],captures=new Map();
  function paint(pose,withCursor=true){
   const canvas=createCanvas(320,240),ctx=canvas.getContext('2d'),order=[];
   order.push('TextArea_02');assert.equal(renderer.draw(ctx,'text','TextArea_02',{overrides:pose.textArea}),true);
   if(withCursor){
    let child=false;
    // Parent overrides must be consumed by the public renderer API. Do not
    // pre-pose/replace the pack to conceal a parent-cache or ordering defect.
    assert.equal(renderer.withPaneParent(ctx,'text','TextArea_02','N_transDecor',[],()=>{
     order.push('DecorCursor');child=true;assert.equal(renderer.draw(ctx,'text','DecorCursor',{overrides:pose.cursorLayout}),true);
    },pose.textArea),true);
    assert.equal(child,true,'Visible native parent submits cursor');
   }
   return {canvas,order};
  }
  for(const [index,capture] of contract.cases.entries()){
   const pose=nativeNicknameInitialTextPose(capture.input,pack.layouts.TextArea_02);
   const cursorRoot=capture.panes.find(p=>p.id==='DecorCursor.bclyt:RootPane');assert.equal(cursorRoot.parent,'TextArea_02.bclyt:N_transDecor');
   verifyPose(poseNativeLayout(pack.layouts.TextArea_02,{},[],pose.textArea),capture,'TextArea_02');
   verifyPose(poseNativeLayout(pack.layouts.DecorCursor,{},[],pose.cursorLayout),capture,'DecorCursor');
   const frozen={textArea:frozenOverrides(capture,'TextArea_02',pack.layouts.TextArea_02),cursorLayout:frozenOverrides(capture,'DecorCursor',pack.layouts.DecorCursor)};
   const actual=paint(pose),expected=paint(frozen),without=paint(pose,false),rgba=pixels(actual.canvas);
   assert.deepEqual(rgba,pixels(expected.canvas),'Module pose renders the frozen native pane writes');
   const cursorDifference=difference(rgba,pixels(without.canvas));assert.ok(cursorDifference.pixels>0,'Cursor contributes actual pixels');
   const cursorProjectedRectangle=cursorRectangle(capture,pack.layouts.TextArea_02,pack.layouts.DecorCursor);
   cursorDifference.bounds.forEach((value,i)=>assert.ok(Math.abs(value-cursorProjectedRectangle[i])<=1,`Cursor projected edge ${i}: ${value} versus ${cursorProjectedRectangle[i]}`));
   equivalent(actual.order,['TextArea_02','DecorCursor'],'Component submission order');
   const noText=structuredClone(pose);for(let i=1;i<=10;i++)noText.textArea['T_textAreaMSC'+String(i).padStart(2,'0')].text=' ';
   const textDifference=difference(pixels(without.canvas),pixels(paint(noText,false).canvas));
   assert.equal(textDifference.pixels>0,capture.input.length>0,'Glyph pixels match empty/nonempty content');
   const name=['empty','ada','ten-characters'][index];writeFileSync(join(out,name+'.png'),actual.canvas.toBuffer('image/png'));
   writeFileSync(join(out,name+'-without-cursor.png'),without.canvas.toBuffer('image/png'));
   captures.set(capture.input,{pose,rgba:rgba.slice(),without:pixels(without.canvas).slice()});
   results.push({input:capture.input,file:name+'.png',rgbaSha256:sha(rgba),order:actual.order,cursorDifference,cursorProjectedRectangle,textDifference,cursor:pose.cursor,diagnostics:[...renderer.diagnostics]});
  }
  // Reverse repaint catches stale text/material and parent-pose cache state.
  for(const input of ['Ada','','ABCDEFGHIJ',''])assert.deepEqual(pixels(paint(captures.get(input).pose).canvas),captures.get(input).rgba,`Retained renderer repaint ${input}`);
  const colorOnly=structuredClone(captures.get('ABCDEFGHIJ').pose);for(let i=1;i<=10;i++)colorOnly.textArea['T_textAreaMSC'+String(i).padStart(2,'0')].text=' ';
  const cellColorDifference=difference(pixels(paint(colorOnly,false).canvas),captures.get('').without);assert.ok(cellColorDifference.pixels>0,'Occupied cell colors reach actual pixels');
  assert.equal(JSON.stringify(renderer.packs),sourceBefore,'Shared source resources remain immutable');assert.deepEqual(renderer.diagnostics,[]);assert.deepEqual(loaded.diagnostics,[]);
  const report={schema:1,passed:true,scope:'TextArea_02 + attached DecorCursor component after frozen local first-text-update writes; no blink advance, native world-matrix/glyph reference, whole-keyboard composition or first-frame acceptance.',contractSha256:sha(readFileSync(contractPath)),contractScope:contract.scope,limits:['Runtime corrected English language-family replay preserves every frozen local pane field; blank T_trans material+0x14 is excluded and still uninterpreted.','Only local pane writes and their renderer consumption are checked; native world matrices and glyph pixel matching are separate.'],sourceHashes,resources,fontSourceSha256:fontData.sourceSha256,requests,results,cellColorDifference};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{loaded?.dispose();font?.dispose();globalThis.fetch=oldFetch;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete globalThis.document;}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','reference-root','pack','font-manifest','canvas-module'].map(name=>[name,{type:'string'}]))});
 const report=await verifyNativeKeyboardText(Object.fromEntries(Object.entries(values).map(([key,value])=>[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),value])));
 console.log(JSON.stringify({passed:report.passed,cases:report.results.map(({input,file,cursorDifference,textDifference})=>({input,file,cursorDifference,textDifference})),scope:report.scope},null,2));
}
