#!/usr/bin/env node
/** Offline real-resource render; does not launch a browser or claim native acceptance. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2)options[args[i].replace(/^--/,'')]=args[i+1];
for(const key of ['artifact-dir','asset-root','canvas-module'])assert.ok(isAbsolute(options[key]??''),key+' must be absolute');
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options['artifact-dir'];mkdirSync(out,{recursive:true});
const compiled=mkdtempSync(join(out,'compiled-')),previous=Object.getOwnPropertyDescriptor(globalThis,'document');
let renderer;
try{
  for(const name of ['bitmap-font','native-layout','native-renderer','stock-sound-record']){
    const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
    writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
  }
  const {createCanvas,loadImage}=await import(pathToFileURL(options['canvas-module']));
  const {NativeLayoutRenderer}=await import(pathToFileURL(join(compiled,'native-renderer.mjs')));
  const {drawNativeSoundRecordBackground}=await import(pathToFileURL(join(compiled,'stock-sound-record.mjs')));
  globalThis.document={createElement:()=>createCanvas(1,1)};
  const pack=JSON.parse(readFileSync(join(options['asset-root'],'packs/sound/contents/0000-0000000b/lyt-S_BG-arc-LZ.json')));
  const texture=pack.textures['BG_Record_01.bclim'],source=await loadImage(join(options['asset-root'],texture.url)),scratch=createCanvas(source.width,source.height),sc=scratch.getContext('2d');sc.drawImage(source,0,0);
  renderer=new NativeLayoutRenderer({'sound-bg':pack},{'sound-bg':new Map([['BG_Record_01.bclim',{width:source.width,height:source.height,data:sc.getImageData(0,0,source.width,source.height).data}]])},new Map());
  const sheet=createCanvas(400,480),reports=[];
  for(const [screen,width] of [['top',400],['bottom',320]]){
    const canvas=createCanvas(width,240),ctx=canvas.getContext('2d');
    assert.equal(drawNativeSoundRecordBackground(renderer,ctx,screen),true);
    const pixels=ctx.getImageData(0,0,width,240).data,visible=[];
    for(let i=0;i<pixels.length;i+=4)if(pixels[i+3])visible.push([(i/4)%width,Math.floor(i/4/width)]);
    assert.ok(visible.length>1000,screen+' has record pixels');
    const bounds=[Math.min(...visible.map(p=>p[0])),Math.min(...visible.map(p=>p[1])),Math.max(...visible.map(p=>p[0])),Math.max(...visible.map(p=>p[1]))];
    assert.ok(screen==='top'?bounds[1]>=188:bounds[3]<=143,'native rest crop');
    reports.push({screen,width,height:240,visibleBounds:bounds,rgbaSha256:createHash('sha256').update(pixels).digest('hex')});
    writeFileSync(join(out,'record-'+screen+'.png'),canvas.toBuffer('image/png'));
    sheet.getContext('2d').drawImage(canvas,(400-width)/2,screen==='top'?0:240);
  }
  assert.deepEqual(renderer.diagnostics,[]);
  writeFileSync(join(out,'record-paired.png'),sheet.toBuffer('image/png'));
  writeFileSync(join(out,'report.json'),JSON.stringify({schema:1,kind:'isolated-source-render',reports,diagnostics:renderer.diagnostics},null,2)+'\n');
  console.log(JSON.stringify({reports,diagnostics:renderer.diagnostics}));
}finally{
  renderer?.dispose();if(previous)Object.defineProperty(globalThis,'document',previous);else delete globalThis.document;
  rmSync(compiled,{recursive:true,force:true});
}
