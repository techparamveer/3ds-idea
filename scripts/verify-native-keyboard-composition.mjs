#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import ts from 'typescript';
const sha=v=>createHash('sha256').update(v).digest('hex'),json=p=>JSON.parse(readFileSync(p,'utf8'));
const flat=ps=>ps.flatMap(p=>[p,...flat(p.children)]),pane=(l,n)=>flat(l.roots).find(p=>p.name===n);
const same=(a,b,label)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),label);
const pixels=c=>c.getContext('2d').getImageData(0,0,320,240).data;
const difference=(a,b)=>{let count=0;for(let i=0;i<a.length;i+=4)if(a.subarray(i,i+4).some((v,j)=>v!==b[i+j]))count++;return count;};

export async function verifyNativeKeyboardComposition(options){
 for(const name of ['artifactDir','referenceRoot','fontManifest','canvasModule','fieldEvidence'])assert.ok(isAbsolute(options[name]??''),`Supply absolute ${name}`);
 const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.artifactDir;mkdirSync(out,{recursive:true});
 const packDir=join(out,'pack'),prepared=spawnSync('python3',[join(repo,'scripts/prepare-native-keyboard-composition.py'),'--reference-root',options.referenceRoot,'--artifact-dir',packDir],{encoding:'utf8'});assert.equal(prepared.status,0,prepared.stderr);
 const pack=json(join(packDir,'pack.json')),caller=json(join(packDir,'caller.json')),fontData=json(options.fontManifest),before=JSON.stringify(pack);
 const nativeRoot=join(options.referenceRoot,'settings-nickname/global-first-paint'),contract=json(join(nativeRoot,'global-first-paint-contract.json')),journal=json(join(nativeRoot,'global-schedule.json'));
 const nativeHashes={'global-first-paint-contract.json':'469bcfd540448437c5ec6e4d0da72a9c702d864cb59b08e551b40b67227293c0','global-schedule.json':'596cfd4fa317e10706adff71cff7074d781ab72d1ed47af18e69768e80b4a094'};
 for(const [name,hash] of Object.entries(nativeHashes))assert.equal(sha(readFileSync(join(nativeRoot,name))),hash,name);
 const compiled=mkdtempSync(join(out,'compiled-')),sourceHashes={};
 for(const name of ['bitmap-font','native-layout','native-renderer','native-png','native-keyboard-keys','native-keyboard-text','native-keyboard-composition']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');sourceHashes[name]=sha(source);
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,p)=>`from '${p}.mjs'`));
 }
 const [{createCanvas,loadImage},{BitmapFont},{NativeLayoutRenderer},{decodeNativePng},{nativeTextureSamplePixels,evaluateNativeMaterial},{nativeNicknameComposition:compose,drawNativeNicknameComposition:draw}]=await Promise.all([
  import(pathToFileURL(options.canvasModule).href),...['bitmap-font','native-renderer','native-png','native-layout','native-keyboard-composition'].map(n=>import(pathToFileURL(join(compiled,n+'.mjs')).href)),
 ]);
 const fieldEvidence=json(options.fieldEvidence);
 assert.equal(fieldEvidence.passed,true);assert.equal(fieldEvidence.fixtureSha256,sha(readFileSync(join(repo,'scripts/verify-native-keyboard-composition-fields.py'))));
 assert.equal(fieldEvidence.fontManifestSha256,sha(readFileSync(options.fontManifest)));
 for(const [name,hash] of Object.entries(fieldEvidence.sourceHashes))assert.equal(sha(readFileSync(join(options.referenceRoot,name))),hash,'Field evidence source '+name);
 for(const [name,hash] of Object.entries(fieldEvidence.dependencies))assert.equal(sha(readFileSync(join(options.referenceRoot,'settings-nickname/lower-first-paint',name))),hash,'Field evidence dependency '+name);
 assert.equal(fieldEvidence.codeSha256,fieldEvidence.sourceHashes['extracted/exefs/code.bin']);
 const fontMetrics={width:fontData.width,height:fontData.height,glyphs:fontData.glyphs};
 for(const nativeCase of fieldEvidence.selectorCases){
  const probe=structuredClone(pack);
  for(const p of flat(probe.layouts.KeytopModeSelect.roots).filter(p=>p.text)){
   if(nativeCase.widthProbe!==null)p.size[0]=nativeCase.widthProbe;
   if(nativeCase.metricProbe){p.text.size=[11.25,12.5];p.text.lineSpacing=-3.25;p.text.characterSpacing=2.75;}
  }
  const state=compose(probe,'Ada','capture',caller,fontMetrics);
  for(const row of nativeCase.panes){const t=pane(state.pack.layouts.KeytopModeSelect,row.name).text;same({fontSize:t.size,lineSpacing:t.lineSpacing,characterSpacing:t.characterSpacing},{fontSize:row.fontSize,lineSpacing:row.lineSpacing,characterSpacing:row.characterSpacing},'Original selector metric/fit writes '+row.name);}
 }
 const compositions=[];
 const nativeSubmission=s=>({layout:s.pane.split(':')[0].replace('.bclyt',''),pane:s.pane.split(':')[1],clip:s.clip.replace('.bclan',''),frame:s.frame});
 const lowerSubmission=s=>!s.pane.startsWith('ApltFade_');
 for(const nativeCase of contract.cases)for(const phase of ['capture','settled']){
  const composition=compose(pack,nativeCase.input,phase,caller,fontMetrics),id=`${nativeCase.input||'empty'}-${phase}`;
  same(composition.drawOrder,contract.drawOrder.map(n=>n.replace('.bclyt','')),'Painter order');
  same(composition.submissions.initial,nativeCase.initialImmediateSubmissions.map(nativeSubmission),'Immediate submission order');
  same(composition.submissions.capture,nativeCase.captureSubmissions.filter(lowerSubmission).map(nativeSubmission),'Capture submission order');
  same(composition.submissions.settled,phase==='settled'?nativeCase.firstLiveSettledSubmissions.map(nativeSubmission):[],'Settled submission order');
  assert.equal(composition.footerEnabled,nativeCase.footerStates[2]===0);
  const sourceJournal=journal.find(c=>c.input===nativeCase.input),checkpoint=phase==='capture'?sourceJournal.captureAfterRootUpdate:sourceJournal.frames[16].checkpoint;
  for(const row of checkpoint.panes){
   const name=row.layout.replace('.bclyt',''),actual=pane(composition.pack.layouts[name],row.name);assert.ok(actual,row.name);
   // This journal records submissions, not channel application. Arrow positions
   // and alpha are animated; compare their native flags and actual transparency below.
   if(name!=='LncArw_00'){same(actual.translation,row.position,row.name+' position');assert.equal(actual.alpha,row.alpha,row.name+' alpha');}
   assert.equal(actual.flags,row.flags,row.name+' flags');
  }
  for(const write of sourceJournal.propertyWrites){
   if(write.op==='text'){
    const [layoutFile,rest]=write.pane.split(':'),name=layoutFile.replace('.bclyt',''),p=rest.split('@')[0];
    if(!composition.pack.layouts[name])continue;
    const value=pane(composition.pack.layouts[name],p)?.text?.value;
    assert.equal(value,write.text,`${name}/${p} native text write`);
   }else if(write.op==='namedTextBoundary'){
    const name=write.pane.startsWith('T_ktpMode')?'KeytopModeSelect':'Keytop_qwerty';
    assert.equal(pane(composition.pack.layouts[name],write.pane).text.value,write.text,'Named message text boundary');
   }
  }
  const decorations=composition.attachments;
  assert.equal(decorations.length,14);assert.equal(decorations.filter(a=>a.parent==='N_decor').length,4);
  assert.ok(decorations.filter(a=>a.layout!=='DecorCursor').every(a=>a.overrides.RootPane.visible===false));
  assert.equal(pane(composition.pack.layouts.DecorCursor,'RootPane').flags&2,2);
  assert.equal(pane(composition.pack.layouts.DecorCursor,'N_decorCursor').flags&1,1);
  assert.equal(pane(composition.pack.layouts.DecorCursor,'P_decorCursor').flags&1,0);
  assert.equal(pane(composition.pack.layouts.DecorCursor,'P_decorCursorMS').flags&1,1);
  for(const suffix of ['L','R'])assert.equal(pane(composition.pack.layouts.LncArw_00,`N_arw${suffix}_00`).alpha,0);
  assert.equal(pane(composition.pack.layouts.WaitIcon,'WaitIcon_00').alpha,0);
  // The three unselected mode groups keep their source picture/material state.
  for(let i=1;i<4;i++){
   const name=`P_ktpMode_0${i}`,actual=pane(composition.pack.layouts.KeytopModeSelect,name),original=pane(pack.layouts.KeytopModeSelect,name);
   same({...actual,children:[]},{...original,children:[]},name);same(composition.pack.layouts.KeytopModeSelect.materials[actual.picture.material],pack.layouts.KeytopModeSelect.materials[original.picture.material],name+' material');
  }
  compositions.push({id,composition,input:nativeCase.input});
 }
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');let renderer,font;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(options.fontManifest),name)))));
  const requiredText='1234567890-qwertyuiopasdfghjkl\'=/zxcvbnm,.?!@EnglishABCËαЯSymbolMobileCancelOK';
  for(const c of requiredText)assert.ok(fontData.glyphs[String(c.charCodeAt(0))],`Required font glyph ${c}`);
  const textures=new Map();
  for(const [name,record] of Object.entries(pack.textures))textures.set(name,nativeTextureSamplePixels(await decodeNativePng(readFileSync(join(packDir,record.url)),record),record.picaFormat));
  renderer=new NativeLayoutRenderer(Object.fromEntries(compositions.map(c=>[c.id,c.composition.pack])),Object.fromEntries(compositions.map(c=>[c.id,new Map(textures)])),new Map([['cbf_std.bcfnt',font]]));
  const overlayLayout=pack.layouts.TextArea_02,overlayPane=pane(overlayLayout,'T_trans'),materialIndex=overlayPane.text.material;
  const appliedMaterial=compositions[0].composition.pack.layouts.TextArea_02.materials[materialIndex];
  same(appliedMaterial.constantColors[0],fieldEvidence.materialMapping.value,'Original English constant-color write');
  same(evaluateNativeMaterial(appliedMaterial,[],[1,1,1,1]),[0,0,0,0],'Cleared constant makes covered text transparent');
  const probePacks={};
  for(const [id,value,cleared] of [['sourceSpace',' ',false],['clearedSpace',' ',true],['sourceGlyph','A',false],['clearedGlyph','A',true]]){
   const layout=structuredClone(overlayLayout);layout.roots=[structuredClone(overlayPane)];layout.roots[0].text.value=value;
   if(cleared)layout.materials[materialIndex].constantColors[0]=[0,0,0,0];
   probePacks[id]={...pack,layouts:{Overlay:layout}};
  }
  const probeRenderer=new NativeLayoutRenderer(probePacks,Object.fromEntries(Object.keys(probePacks).map(id=>[id,new Map(textures)])),new Map([['cbf_std.bcfnt',font]]));
  const overlayProbe={spaceGlyphWidth:fontData.glyphs['32'].width,pixels:{}};
  try{
   for(const id of Object.keys(probePacks)){
    const canvas=createCanvas(320,240);probeRenderer.draw(canvas.getContext('2d'),id,'Overlay');
    const rgba=pixels(canvas);overlayProbe.pixels[id]=Array.from(rgba).filter((v,i)=>i%4===3&&v>0).length;
    writeFileSync(join(out,'overlay-'+id+'.png'),canvas.toBuffer('image/png'));
   }
   assert.equal(overlayProbe.pixels.sourceSpace,0);assert.equal(overlayProbe.pixels.clearedSpace,0);
   assert.ok(overlayProbe.pixels.sourceGlyph>0);assert.equal(overlayProbe.pixels.clearedGlyph,0);
   assert.deepEqual(probeRenderer.diagnostics,[]);
  }finally{probeRenderer.dispose();}
  const snapshots=new Map(),results=[];
  function paint(c,variant){
   const canvas=createCanvas(320,240),ctx=canvas.getContext('2d');
   const state=variant==='noCursor'?{...c.composition,attachments:c.composition.attachments.filter(a=>a.layout!=='DecorCursor')}:variant==='noInvisibleRoots'?{...c.composition,drawOrder:c.composition.drawOrder.filter(n=>!['LncArw_00','WaitIcon'].includes(n))}:c.composition;
   const order=draw(ctx,renderer,c.id,state);return {canvas,pixels:pixels(canvas),order};
  }
  for(const c of compositions){
   const result=paint(c),noCursor=paint(c,'noCursor');
   const cursorPixels=difference(result.pixels,noCursor.pixels);assert.ok(cursorPixels>0,'Visible cursor reaches complete LCD component');
   assert.equal(difference(result.pixels,paint(c,'noInvisibleRoots').pixels),0,'Arrows and WaitIcon draw transparently');
   same(result.order.filter(n=>!n.includes('/')),c.composition.drawOrder,'Actual ordered painter calls');
   assert.equal(result.order.filter(n=>n.startsWith('N_decor/')).length,4);assert.equal(result.order.filter(n=>n.startsWith('N_transDecor/')).length,10);
   const file=c.id+'.png';writeFileSync(join(out,file),result.canvas.toBuffer('image/png'));snapshots.set(c.id,result.pixels.slice());
   results.push({id:c.id,input:c.input,phase:c.composition.phase,file,rgbaSha256:sha(result.pixels),cursorPixels,cursorFrame:c.composition.cursorFrame,footerEnabled:c.composition.footerEnabled,drawCalls:result.order});
  }
  for(const c of compositions.toReversed())assert.deepEqual(paint(c).pixels,snapshots.get(c.id),'Reverse repaint isolation');
  const emptyDifference=difference(snapshots.get('empty-capture'),snapshots.get('empty-settled'));
  // Exact native frame values matter even when these source clip endpoints have
  // identical pixels; do not require an invented visual change between phases.
  for(const input of ['Ada','ABCDEFGHIJ'])assert.deepEqual(snapshots.get(input+'-capture'),snapshots.get(input+'-settled'));
  assert.deepEqual(renderer.diagnostics,[]);assert.equal(JSON.stringify(pack),before,'Shared source pack immutable');
  const report={schema:1,passed:true,scope:'Lower nickname captured texture contents and first live settled CPU component. No Fade_D/caller underlay, native LCD, browser or input acceptance.',sourceHashes,nativeHashes,provenance:json(join(packDir,'provenance.json')),fontSourceSha256:fontData.sourceSha256,fieldEvidenceSha256:sha(readFileSync(options.fieldEvidence)),overlayProbe,emptyCaptureSettledPixelDifference:emptyDifference,results,gaps:compositions[0].composition.gaps};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{renderer?.dispose();font?.dispose();if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete globalThis.document;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','reference-root','font-manifest','canvas-module','field-evidence'].map(name=>[name,{type:'string'}]))});
 const report=await verifyNativeKeyboardComposition(Object.fromEntries(Object.entries(values).map(([key,value])=>[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),value])));console.log(JSON.stringify({passed:report.passed,results:report.results,gaps:report.gaps},null,2));
}
