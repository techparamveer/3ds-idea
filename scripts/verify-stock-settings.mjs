import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import ts from 'typescript';
const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module','font-manifest'].map(key=>[key,{type:'string'}]))});
for(const key of ['artifact-dir','asset-root','canvas-module','font-manifest'])assert.ok(values[key]?.startsWith('/'),'Expected absolute '+key);
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),assetRoot=values['asset-root'],out=values['artifact-dir'];mkdirSync(out,{recursive:true});
const {createCanvas,loadImage,Image}=await import(pathToFileURL(values['canvas-module']));
const compiled=mkdtempSync(join(out,'compiled-'));
for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','stock-native-settings']){
 const text=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
 writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
}
const [{BitmapFont},{loadNativeTitleAssets},{settingsScreenPacks,drawNativeSettingsMain}]=await Promise.all(['bitmap-font','native-title-assets','stock-native-settings'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs')))));
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://helper.invalid/manifest.json'}};globalThis.Image=Image;
const bytesForBlob=new WeakMap();URL.createObjectURL=blob=>'data:image/png;base64,'+bytesForBlob.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
globalThis.fetch=async value=>{const url=new URL(value);assert.equal(url.origin,'https://helper.invalid');const file=resolve(assetRoot,url.pathname.slice(1));assert.ok(file.startsWith(assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);bytesForBlob.set(blob,bytes);return blob;};return response;};
const fontPath=values['font-manifest'],manifest=JSON.parse(readFileSync(fontPath,'utf8'));
const font=new BitmapFont(manifest,await Promise.all(manifest.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
const view={appId:'system-settings',screen:'main',heading:'System Settings',rows:['internet','parental','data','other','nnid'].map(id=>({id,label:id})),selection:0,footer:{left:{action:'back',label:'Back'}}};
const assets=await loadNativeTitleAssets('https://helper.invalid/manifest.json','0004001000022000',settingsScreenPacks,new Map([['cbf_std.bcfnt',font]]));
const renderer=assets.renderer,originalDraw=renderer.draw.bind(renderer),sourcePacks=Object.values(renderer.packs),before=JSON.stringify(sourcePacks),reports=[];
try{
 const focusHashes=[];
 for(let selection=0;selection<5;selection++){
  const top=createCanvas(400,240),bottom=createCanvas(320,240),calls=[];
  renderer.draw=(ctx,pack,layout,options)=>{calls.push({pack,layout,options});return originalDraw(ctx,pack,layout,options);};
  assert.equal(drawNativeSettingsMain(renderer,top.getContext('2d'),bottom.getContext('2d'),{...view,selection}),true);
  for(const name of ['Bg_U_00','Bg_D_00']){
   const call=calls.find(c=>c.layout===name);assert.ok(call);
   assert.equal(call.options?.bindings?.length??0,0,'main keeps the source default background');
   const source=renderer.packs.base.layouts[name];
   const flat=panes=>panes.flatMap(p=>[p,...flat(p.children)]),panes=flat(source.roots);
   assert.equal(panes.find(p=>p.name==='P_BG_Legacy').flags&1,0);
   assert.equal(panes.find(p=>p.name==='P_BG_White').flags&1,1);
  }
  const title=calls.find(c=>c.layout==='TopText_U_00');assert.equal(title.options.overrides.TextBoxTitle_00.text,'System Settings');
  assert.ok(title.options.overrides.TextBoxTitle_00.messageStyle,'title keeps the English source style');
  assert.equal(title.options.overrides.TextBoxTitle_00.fontSize,undefined,'no guessed title font override');
  const parent=calls.find(c=>c.layout==='Top_D_02');assert.equal(Object.keys(parent.options.attachments).length,5);
  for(const [name,canvas]of [['top',top],['bottom',bottom]]){
   const id='main-'+selection+'-'+name,rgba=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
   const sha256=createHash('sha256').update(rgba).digest('hex');reports.push({id,sha256});if(name==='bottom')focusHashes.push(sha256);
   writeFileSync(join(out,id+'.png'),canvas.toBuffer('image/png'));
  }
  // Compare an unobstructed upper pixel against a separately rendered source BG.
  const source=createCanvas(400,240);originalDraw(source.getContext('2d'),'base','Bg_U_00');
  assert.deepEqual(top.getContext('2d').getImageData(2,2,1,1).data,source.getContext('2d').getImageData(2,2,1,1).data);
 }
 assert.equal(new Set(focusHashes).size,5,'five distinct source selection states');
 assert.equal(JSON.stringify(sourcePacks),before,'source packs remain immutable');
 assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')),[]);
 writeFileSync(join(out,'verification.json'),JSON.stringify({passed:true,reports,diagnostics:assets.diagnostics,limits:['Static main-screen assembly; native LCD and browser comparison remain separate.','Subpage background states are not inferred from main.']},null,2)+'\n');
 console.log('Settings main: five paired renders, source default background, English styles, immutable packs and diagnostics passed.');
}finally{assets.dispose();font.dispose();}
