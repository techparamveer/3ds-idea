#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import ts from 'typescript';

const sha=value=>createHash('sha256').update(value).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const flat=panes=>panes.flatMap(p=>[p,...flat(p.children)]);
const map=layout=>new Map(flat(layout.roots).map(p=>[p.name,p]));
const same=(a,b,label)=>assert.equal(JSON.stringify(a),JSON.stringify(b),label);
const clipHashes={Keytop_qwerty_i0:'418c3ecba17934b3c13a0c9dca5a6a980c6b4e4c1ae48e41b1fd325c955c7d17',Keytop_qwerty_n0s1:'a7a2bc7d2140ad81a66dede3edfad14f3bf3ff0918f0fd30541bbf8d8018b625',Keytop_qwerty_s1t0:'96d7aa0762c52e169a670ba30f3fe1d6c769f115529ee2460192a585100c2f68'};

export async function verifyNativeKeyboardKeys(options){
 for(const name of ['artifactDir','referenceRoot','pack','messages','fontManifest','canvasModule'])assert.ok(options[name]&&isAbsolute(options[name]),`Supply absolute ${name}`);
 const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.artifactDir;
 mkdirSync(out,{recursive:true});const compiled=mkdtempSync(join(out,'compiled-')),sourceHashes={};
 for(const name of ['bitmap-font','native-layout','native-renderer','native-png','native-keyboard-keys']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');sourceHashes[name]=sha(source);
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,p)=>`from '${p.replace(/\.ts$/,'')}.mjs'`);
  writeFileSync(join(compiled,name+'.mjs'),code);
 }
 const [{createCanvas,loadImage},{BitmapFont},{NativeLayoutRenderer},{decodeNativePng},layoutModule,keysModule]=await Promise.all([
  import(pathToFileURL(options.canvasModule).href),...['bitmap-font','native-renderer','native-png','native-layout','native-keyboard-keys'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs')).href)),
 ]);
 const {poseNativeLayout,nativeTextureSamplePixels}=layoutModule,{nativeNicknameQwertyPresentation:initialize,applyNativeQwertyPaneSubmissions:submit}=keysModule;
 const pack=json(options.pack),layout=pack.layouts.Keytop_qwerty,messages=json(options.messages),before=JSON.stringify({pack,messages}),reference=join(options.referenceRoot,'settings-nickname/lower-first-paint');
 const journalPath=join(reference,'qwerty-first-paint.json'),journal=json(journalPath),index=json(join(reference,'evidence-index.json'));
 for(const file of ['qwerty-first-paint.py','qwerty-first-paint.json','controller-constructor-check.py','controller-constructor-check.json']){
  const path=join(reference,file),identity=Object.entries(index).find(([name])=>name.endsWith('/'+file))?.[1];assert.ok(identity,file);assert.equal(sha(readFileSync(path)),identity.sha256,file);
 }
 assert.equal(sha(readFileSync(journalPath)),'73c70973467dfd5dd1a0e5dc034baa0d46da210bed64d7b336ea4c4e8481fec2','Corrected, frozen English journal');
 const decode=(file,kind)=>{
  const result=spawnSync('python3',['-c',`import json,sys;sys.path.insert(0,sys.argv[1]);from firmware.native import decode_${kind};print(json.dumps(decode_${kind}(open(sys.argv[2],'rb').read())))`,join(repo,'scripts'),file],{encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
 };
 const members=join(options.referenceRoot,'members/swkbd_qwerty_LZ.bin');
 const rawLayout=join(members,'blyt/Keytop_qwerty.bclyt');assert.equal(sha(readFileSync(rawLayout)),'f3efa2fd457c65b5bf9aefe6ba350fabd8d63edf0edef82a77ae14ed17252569');same(layout,decode(rawLayout,'layout'),'Original decoded layout');
 for(const [name,hash] of Object.entries(clipHashes)){const path=join(members,'anim',name+'.bclan');assert.equal(sha(readFileSync(path)),hash);same(pack.animations[name],decode(path,'animation'),name);}
 const state=initialize(layout,pack.animations,messages),propertyLayout=poseNativeLayout(layout,{},[],state.initializationOverrides),properties=map(propertyLayout);
 for(const row of journal.panes){const pane=properties.get(row.name);assert.ok(pane,row.name);assert.equal(pane.alpha,row.alpha,row.name);assert.equal(!!(pane.flags&1),row.visible,row.name);if(row.text!==null)assert.equal(pane.text?.value,row.text,row.name);}
 const nativeSubmissions=journal.events.filter(e=>e.op==='paneAnimationSubmission').map(e=>({pane:e.pane,clip:e.clip.replace(/\.bclan$/,''),frame:e.frame}));
 same([...state.immediateSubmissions,...state.firstLocalControllerSubmissions],nativeSubmissions,'13 exact native submissions in order');
 assert.equal(journal.events.filter(e=>e.op==='paneAnimationSubmission'&&e.stage==='qwertyInit').length,state.immediateSubmissions.length);
 const after=submit(state.layout,pack.animations,state.firstLocalControllerSubmissions);
 // Independent target restriction oracle: sample each complete native clip, then
 // copy only the recorded pane's own channels/materials. Do not copy descendants.
 function referenceApply(input,submissions){
  let retained=structuredClone(input);
  for(const s of submissions){
   const sampled=poseNativeLayout(retained,pack.animations,[{name:s.clip,frame:s.frame}]),destination=map(retained).get(s.pane),source=map(sampled).get(s.pane);
   const children=destination.children;Object.assign(destination,structuredClone(source));destination.children=children;
   for(const id of [destination.picture?.material,destination.text?.material].filter(i=>i!==undefined))retained.materials[id]=structuredClone(sampled.materials[id]);
   retained.textures=[...sampled.textures];
  }
  return retained;
 }
 same(state.layout,referenceApply(propertyLayout,state.immediateSubmissions),'Immediate retained source property application');
 same(after,referenceApply(state.layout,state.firstLocalControllerSubmissions),'Later pane/material target scope');
 const original=map(layout),result=map(after);
 // No disabled-state animation may spill onto ordinary character key cells.
 for(let i=0;i<45;i++){
  const suffix=String(i).padStart(2,'0');const picture=result.get('P_key_'+suffix),source=original.get('P_key_'+suffix);same(picture,source,'Unsubmitted character picture '+suffix);
  const text=result.get('T_key_'+suffix),authored=original.get('T_key_'+suffix);same({...text,text:{...text.text,value:authored.text.value}},authored,'Only character label changes '+suffix);
  for(const id of [picture.picture.material,text.text.material])same(after.materials[id],layout.materials[id],'Unsubmitted character material '+suffix);
 }
 const fontData=json(options.fontManifest),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');let renderer,font;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(options.fontManifest),name)))));
  for(const char of messages.messages[messages.labels.qwerty_keytop].text+'English')assert.ok(fontData.glyphs[String(char.charCodeAt(0))],char);
  const textureMap=new Map(),textureHashes={};
  const needed=new Set([...layout.textures,...Object.keys(clipHashes).flatMap(name=>pack.animations[name].textures)]);
  for(const name of needed){const record=pack.textures[name];assert.ok(record,name);const bytes=readFileSync(resolve(dirname(options.pack),record.url));textureHashes[name]=sha(bytes);textureMap.set(name,nativeTextureSamplePixels(await decodeNativePng(bytes,record),record.picaFormat));}
  const changedMessages=structuredClone(messages);changedMessages.messages[changedMessages.labels.qwerty_keytop].text='X'.repeat(45);
  const changedState=initialize(layout,pack.animations,changedMessages),changed=submit(changedState.layout,pack.animations,changedState.firstLocalControllerSubmissions);
  const layouts={properties:propertyLayout,initialized:state.layout,submitted:after,changedLabelProbe:changed};
  const banks=Object.fromEntries(Object.entries(layouts).map(([name,posed])=>[name,{...pack,layouts:{Keytop_qwerty:posed}}]));
  renderer=new NativeLayoutRenderer(banks,Object.fromEntries(Object.keys(banks).map(name=>[name,new Map(textureMap)])),new Map([['cbf_std.bcfnt',font]]));
  const snapshots={},renders=[];
  function paint(name){const canvas=createCanvas(320,240);assert.equal(renderer.draw(canvas.getContext('2d'),name,'Keytop_qwerty'),true);return {canvas,pixels:canvas.getContext('2d').getImageData(0,0,320,240).data};}
  for(const name of Object.keys(layouts)){
   const drawn=paint(name);snapshots[name]=drawn.pixels.slice();writeFileSync(join(out,name+'.png'),drawn.canvas.toBuffer('image/png'));renders.push({name,file:name+'.png',rgbaSha256:sha(drawn.pixels)});
  }
  assert.notDeepEqual(snapshots.initialized,snapshots.submitted,'Disabled Enter/dictionary channels reach pixels');
  assert.notDeepEqual(snapshots.changedLabelProbe,snapshots.submitted,'Changed resource labels reach pixels');
  for(const name of ['submitted','initialized','changedLabelProbe','submitted'])assert.deepEqual(paint(name).pixels,snapshots[name],`Stable state bank cache ${name}`);
  assert.deepEqual(renderer.diagnostics,[]);assert.equal(JSON.stringify({pack,messages}),before,'Source resources remain immutable');
  const report={schema:1,passed:true,scope:'Corrected English QWERTY local property writes, eight immediate retained submissions and five explicitly applied local controller submissions. No global pass count, first-frame clock, native LCD or complete keyboard acceptance.',sourceHashes,journalSha256:sha(readFileSync(journalPath)),layoutSha256:sha(readFileSync(rawLayout)),clipHashes,messagesSha256:sha(readFileSync(options.messages)),fontSourceSha256:fontData.sourceSha256,textureHashes,submissions:{immediate:state.immediateSubmissions,firstLocalController:state.firstLocalControllerSubmissions},unresolvedMessageStyles:state.unresolvedMessageStyles,renders,diagnostics:renderer.diagnostics,limits:['Named-message/style boundary remains unresolved; authored native text styles are preserved.','Separate immutable layout banks validate cache isolation; replacing a renderer bank in place is not supported by this check.','changedLabelProbe deliberately tests resource input changes; it is not a native keyboard mode.']};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{renderer?.dispose();font?.dispose();if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete globalThis.document;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','reference-root','pack','messages','font-manifest','canvas-module'].map(name=>[name,{type:'string'}]))});
 const report=await verifyNativeKeyboardKeys(Object.fromEntries(Object.entries(values).map(([key,value])=>[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),value])));
 console.log(JSON.stringify({passed:report.passed,submissions:report.submissions,textureCount:Object.keys(report.textureHashes).length,renders:report.renders,unresolvedMessageStyles:report.unresolvedMessageStyles},null,2));
}
