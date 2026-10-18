import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,dirname,join,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import ts from 'typescript';

export async function verifyNativeServices(options){
 for(const key of ['artifactDir','assetRoot','canvasModule'])assert.ok(isAbsolute(options[key]??''),key);
 const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.artifactDir;mkdirSync(out,{recursive:true});
 const compiled=mkdtempSync(join(out,'compiled-'));
 for(const name of ['bitmap-font','camera-browse','device-status-profile','native-layout','native-png','native-renderer','native-title-assets','stock-eshop-welcome','stock-native-services','stock-manual-index','stock-native-helpers','stock-native-amiibo','stock-screen-layout']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+?)(?:\.ts)?['"]/g,(_,name)=>`from '${name}.mjs'`));
 }
 const [{createCanvas,loadImage,Image:CanvasImage},{BitmapFont},{loadNativeTitleAssets},{nativeServiceView,drawNativeServiceFrame},{nativeHelperView,drawNativeHelperFrame},{poseNativeLayout}]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets','stock-native-services','stock-native-helpers','native-layout'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs'))))]);
 const oldGlobals=Object.fromEntries(['document','window','Image'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)])),oldFetch=globalThis.fetch,oldObjectURL=URL.createObjectURL,oldRevokeURL=URL.revokeObjectURL,blobBytes=new WeakMap();let font,assets;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://service-ui.invalid/manifest.json'}};globalThis.Image=CanvasImage;URL.createObjectURL=blob=>'data:image/png;base64,'+blobBytes.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
  globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://service-ui.invalid');const file=resolve(options.assetRoot,u.pathname.slice(1));assert.ok(file.startsWith(options.assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);blobBytes.set(blob,bytes);return blob;};return response;};
  const manifest=JSON.parse(readFileSync(join(options.assetRoot,'manifest.json'))),fontPath=join(options.assetRoot,manifest.fonts.shared),fontData=JSON.parse(readFileSync(fontPath));
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
  const views=[...['nnid-settings','system-updater'].map(appId=>({appId,screen:'main',heading:appId,rows:[],selection:0,footer:{left:{action:'back',label:'Back'}}})),{appId:'eshop',screen:'main',heading:'Nintendo eShop',rows:[{id:'back',label:'OK'}],selection:0,footer:{left:{action:'back',label:'Back'}}},{appId:'manual',screen:'main',heading:'System Settings',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},data:{manualTitleId:'0004001000022000'}}];
  const reports=[];
  for(const view of views){
   const request=nativeServiceView(view)??nativeHelperView(view);assert.ok(request);assert.equal(nativeServiceView({...view,appId:'work'}),null);
   assets=await loadNativeTitleAssets('https://service-ui.invalid/manifest.json',request.titleId,request.packs,new Map([['cbf_std.bcfnt',font]]));
   const source=JSON.stringify(assets.renderer.packs),top=createCanvas(400,240),bottom=createCanvas(320,240);
   const sampleDate=new Date(2026,8,24,9,5,0);
   assert.equal((nativeHelperView(view)?drawNativeHelperFrame:drawNativeServiceFrame)(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{font,date:sampleDate,elapsedMs:0}),true,JSON.stringify(assets.renderer.diagnostics));
   if(view.appId!=='manual')assert.equal(JSON.stringify(assets.renderer.packs),source);
   else assert.equal(JSON.stringify(assets.renderer.packs['manual-index']),JSON.stringify(JSON.parse(source)['manual-index']),'the application-owned Index remains immutable while applet layouts gain derived paint variants');
   assert.deepEqual(assets.renderer.diagnostics,[]);
   assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')&&!assets.renderer.diagnostics.includes(d)),[]);
   for(const [name,canvas]of [['top',top],['bottom',bottom]])writeFileSync(join(out,view.appId+'-'+view.screen+'-'+name+'.png'),canvas.toBuffer('image/png'));
   const pair=createCanvas(400,480),ctx=pair.getContext('2d');ctx.drawImage(top,0,0);ctx.drawImage(bottom,40,240);writeFileSync(join(out,view.appId+'-'+view.screen+'.png'),pair.toBuffer('image/png'));
   reports.push({appId:view.appId,screen:view.screen,diagnostics:[...new Set([...assets.diagnostics,...assets.renderer.diagnostics])]});assets.dispose();assets=undefined;
  }
  const result={passed:true,reports,gaps:['Source component composition is not matched native LCD verification.','Only bundled local service UI is displayed; remote accounts and catalogs are absent.']};writeFileSync(join(out,'verification.json'),JSON.stringify(result,null,2)+'\n');return result;
 }finally{assets?.dispose();font?.dispose();globalThis.fetch=oldFetch;URL.createObjectURL=oldObjectURL;URL.revokeObjectURL=oldRevokeURL;for(const[key,value]of Object.entries(oldGlobals)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module'].map(k=>[k,{type:'string'}]))});
 console.log(JSON.stringify(await verifyNativeServices(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]))),null,2));
}
