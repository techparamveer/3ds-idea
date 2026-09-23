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
for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','stock-native-helpers']){
 const text=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
 writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
}
const [{BitmapFont},{loadNativeTitleAssets},{nativeHelperView,nativeHelperTargets,drawNativeHelperFrame}]=await Promise.all(['bitmap-font','native-title-assets','stock-native-helpers'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs')))));
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://helper.invalid/manifest.json'}};globalThis.Image=Image;
const bytesForBlob=new WeakMap();URL.createObjectURL=blob=>'data:image/png;base64,'+bytesForBlob.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
globalThis.fetch=async value=>{const url=new URL(value);assert.equal(url.origin,'https://helper.invalid');const file=resolve(assetRoot,url.pathname.slice(1));assert.ok(file.startsWith(assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);bytesForBlob.set(blob,bytes);return blob;};return response;};
const fontPath=values['font-manifest'],manifest=JSON.parse(readFileSync(fontPath,'utf8'));
const font=new BitmapFont(manifest,await Promise.all(manifest.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
const views=['nnid-settings','system-updater','system-transfer','extrapad'].map(appId=>({appId,screen:'main',heading:appId,rows:[],selection:0,footer:{left:{action:'back',label:'Back'}}}));
views.find(v=>v.appId==='system-transfer').rows=[{id:'3ds',label:'Nintendo 3DS'},{id:'dsi',label:'Nintendo DSi'}];
views.find(v=>v.appId==='extrapad').rows=[{id:'information',label:'Circle Pad Pro'}];
views.push({...views.find(v=>v.appId==='system-transfer'),screen:'detail',rows:[],data:{field:'3ds'},text:['No console data is connected.']});
views.push({...views.find(v=>v.appId==='extrapad'),screen:'detail',rows:[],text:['Accessory calibration is unavailable.']});
views.push({...views.find(v=>v.appId==='system-transfer'&&v.screen==='main'),selection:1,verificationId:'transfer-second-choice'});
const reports=[];
try{
 for(const view of views){
  const spec=nativeHelperView(view),assets=await loadNativeTitleAssets('https://helper.invalid/manifest.json',spec.titleId,spec.packs,new Map([['cbf_std.bcfnt',font]]));
  const originalPacks=Object.values(assets.renderer.packs),before=JSON.stringify(originalPacks),top=createCanvas(400,240),bottom=createCanvas(320,240);
  assert.equal(drawNativeHelperFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{font}),true);
  assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')),[]);
  assert.equal(JSON.stringify(originalPacks),before,'source resources remain immutable');
  const targets=nativeHelperTargets(view);assert.equal(targets.filter(target=>target.action==='back').length,1);
  if(view.appId==='system-transfer'&&view.screen==='main')assert.deepEqual(targets.map(target=>target.action),['back','3ds','dsi']);
  else if(view.appId==='extrapad'&&view.screen==='main')assert.deepEqual(targets.map(target=>target.action),['back','information']);
  else assert.equal(targets.length,1);
  for(const target of targets){assert.ok(target.x>=0&&target.y>=0&&target.x+target.width<=320&&target.y+target.height<=240,'targets remain inside lower LCD');}
  for(const [name,canvas]of [['top',top],['bottom',bottom]]){writeFileSync(join(out,(view.verificationId??view.appId+'-'+view.screen)+'-'+name+'.png'),canvas.toBuffer('image/png'));reports.push({id:(view.verificationId??view.appId+'-'+view.screen)+'-'+name,sha256:createHash('sha256').update(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data).digest('hex')});}
  assets.dispose();
 }
 assert.equal(nativeHelperView({...views[0],appId:'browser'}),null);assert.equal(nativeHelperTargets({...views[0],appId:'browser'}),null);
 writeFileSync(join(out,'verification.json'),JSON.stringify({passed:true,reports},null,2)+'\n');console.log(views.length+' native helper pairs passed; immutable resources, bounded targets, no diagnostics.');
}finally{font.dispose();}
