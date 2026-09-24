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
 for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','stock-native-services','stock-native-helpers','stock-native-amiibo']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
 }
 const [{createCanvas,loadImage,Image:CanvasImage},{BitmapFont},{loadNativeTitleAssets},{nativeServiceView,drawNativeServiceFrame,zoneHudBindings},{nativeHelperView,drawNativeHelperFrame},{poseNativeLayout}]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets','stock-native-services','stock-native-helpers','native-layout'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs'))))]);
 const oldGlobals=Object.fromEntries(['document','window','Image'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)])),oldFetch=globalThis.fetch,oldObjectURL=URL.createObjectURL,oldRevokeURL=URL.revokeObjectURL,blobBytes=new WeakMap();let font,assets;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://service-ui.invalid/manifest.json'}};globalThis.Image=CanvasImage;URL.createObjectURL=blob=>'data:image/png;base64,'+blobBytes.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
  globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://service-ui.invalid');const file=resolve(options.assetRoot,u.pathname.slice(1));assert.ok(file.startsWith(options.assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);blobBytes.set(blob,bytes);return blob;};return response;};
  const manifest=JSON.parse(readFileSync(join(options.assetRoot,'manifest.json'))),fontPath=join(options.assetRoot,manifest.fonts.shared),fontData=JSON.parse(readFileSync(fontPath));
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
  const views=[...['nnid-settings','system-updater'].map(appId=>({appId,screen:'main',heading:appId,rows:[],selection:0,footer:{left:{action:'back',label:'Back'}}})),...['main','detail'].map(screen=>({appId:'nintendo-zone',screen,heading:'Nintendo Zone',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}}})),{appId:'eshop',screen:'main',heading:'Nintendo eShop',rows:[{id:'back',label:'OK'}],selection:0,footer:{left:{action:'back',label:'Back'}}}];
  const reports=[];
  for(const view of views){
   const request=nativeServiceView(view)??nativeHelperView(view);assert.ok(request);assert.equal(nativeServiceView({...view,appId:'work'}),null);
   assets=await loadNativeTitleAssets('https://service-ui.invalid/manifest.json',request.titleId,request.packs,new Map([['cbf_std.bcfnt',font]]));
   const source=JSON.stringify(assets.renderer.packs),top=createCanvas(400,240),bottom=createCanvas(320,240);
   assert.equal((nativeHelperView(view)?drawNativeHelperFrame:drawNativeServiceFrame)(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{font}),true,JSON.stringify(assets.renderer.diagnostics));
   assert.equal(JSON.stringify(assets.renderer.packs),source);assert.deepEqual(assets.renderer.diagnostics,view.appId==='nintendo-zone'?[...(view.screen==='main'?['Unverified 3D pane projection: U_top/BG_grid']:[]),'Unverified 3D pane projection: Hud_00/P_Bat_00']:[]);
   assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')&&!assets.renderer.diagnostics.includes(d)),[]);
   let hud;
   if(view.appId==='nintendo-zone'){
    // The same bindings as the painter: Grp_Bat/Grp_NetAtn select source status textures on map 0.
    const pack=assets.renderer.packs['zone-chrome'],posed=poseNativeLayout(pack.layouts.Hud_00,pack.animations,zoneHudBindings);
    const pane=(items,name)=>{for(const item of items){const found=item.name===name?item:pane(item.children,name);if(found)return found;}},texture=name=>posed.textures[posed.materials.find(m=>m.name===name).textureMaps[0].texture];
    hud={battery:texture('P_Bat_00'),wireless:texture('P_NetAtn_00'),barTop:120-pane(posed.roots,'N_Base_00').translation[1]};
    assert.deepEqual(hud,{battery:'HudBat_03.bclim',wireless:'HudNetAtnOff_00.bclim',barTop:0});
    // The renderer flags P_Bat_00's X rotation, but whole turns without depth are an exact identity.
    const battery=pane(posed.roots,'P_Bat_00');assert.deepEqual([battery.rotation[0]%360,battery.rotation[1],battery.rotation[2]%360,battery.translation[2]],[0,0,0,0]);
    hud.identityProjection=[`Hud_00/P_Bat_00 rotation ${JSON.stringify(battery.rotation)}`];
   }
   for(const [name,canvas]of [['top',top],['bottom',bottom]])writeFileSync(join(out,view.appId+'-'+view.screen+'-'+name+'.png'),canvas.toBuffer('image/png'));
   const pair=createCanvas(400,480),ctx=pair.getContext('2d');ctx.drawImage(top,0,0);ctx.drawImage(bottom,40,240);writeFileSync(join(out,view.appId+'-'+view.screen+'.png'),pair.toBuffer('image/png'));
   reports.push({appId:view.appId,screen:view.screen,diagnostics:[...new Set([...assets.diagnostics,...assets.renderer.diagnostics])],...(hud?{hud}:{})});assets.dispose();assets=undefined;
  }
  const result={passed:true,reports,gaps:['Source component composition is not matched native LCD verification.','Only bundled local service UI is displayed; remote accounts and catalogs are absent.','U_top depth panes need the Zone executable projection; the renderer flattens them orthographically.','The Zone HUD clock stays blank until stock screens repaint on clock changes.']};writeFileSync(join(out,'verification.json'),JSON.stringify(result,null,2)+'\n');return result;
 }finally{assets?.dispose();font?.dispose();globalThis.fetch=oldFetch;URL.createObjectURL=oldObjectURL;URL.revokeObjectURL=oldRevokeURL;for(const[key,value]of Object.entries(oldGlobals)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module'].map(k=>[k,{type:'string'}]))});
 console.log(JSON.stringify(await verifyNativeServices(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]))),null,2));
}
