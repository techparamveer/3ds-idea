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
for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','stock-native-helpers','stock-native-amiibo','stock-manual-index','stock-screen-layout','camera-browse']){
 const text=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');
 writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+?)(\.ts)?['"]/g,(_,name)=>`from '${name}.mjs'`));
}
const [{BitmapFont},{loadNativeTitleAssets},{nativeHelperView,nativeHelperTargets,drawNativeHelperFrame}]=await Promise.all(['bitmap-font','native-title-assets','stock-native-helpers'].map(name=>import(pathToFileURL(join(compiled,name+'.mjs')))));
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://helper.invalid/manifest.json'}};globalThis.Image=Image;
const bytesForBlob=new WeakMap();URL.createObjectURL=blob=>'data:image/png;base64,'+bytesForBlob.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
globalThis.fetch=async value=>{const url=new URL(value);assert.equal(url.origin,'https://helper.invalid');const file=resolve(assetRoot,url.pathname.slice(1));assert.ok(file.startsWith(assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);bytesForBlob.set(blob,bytes);return blob;};return response;};
const fontPath=values['font-manifest'],manifest=JSON.parse(readFileSync(fontPath,'utf8'));
const font=new BitmapFont(manifest,await Promise.all(manifest.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
const views=['amiibo-settings','nnid-settings','system-updater','system-transfer','extrapad'].map(appId=>({appId,screen:'main',heading:appId,rows:[],selection:0,footer:{left:{action:'back',label:'Back'}}}));
views.find(v=>v.appId==='system-transfer').rows=[{id:'3ds',label:'Nintendo 3DS'},{id:'dsi',label:'Nintendo DSi'}];
views.find(v=>v.appId==='extrapad').rows=[{id:'information',label:'Circle Pad Pro'}];
views.push({...views.find(v=>v.appId==='system-transfer'),screen:'detail',rows:[],data:{field:'3ds'},text:['No console data is connected.']});
views.push({...views.find(v=>v.appId==='extrapad'),screen:'detail',rows:[],text:['Accessory calibration is unavailable.']});
views.push({...views.find(v=>v.appId==='system-transfer'&&v.screen==='main'),selection:1,verificationId:'transfer-second-choice'});
const manual={appId:'manual',screen:'main',heading:'Manual',rows:[{id:'contents',label:'Contents'},{id:'controls',label:'Controls'},{id:'support',label:'Support Information'}],selection:1,footer:{left:{action:'back',label:'Back'}},text:['Choose a section of the local guide.']};
views.push(manual);
for(const [topic,heading,text] of [['contents','Contents',['Browse the portfolio from HOME.','Select a title to open it.','B returns to the previous screen.']],['controls','Controls',['A: open the selected item.','B: go back.','HOME: return to HOME Menu.','Touch the lower screen to select.']],['support','Support Information',['No application manual was supplied.','This guide covers portfolio controls.']]])views.push({...manual,screen:'document',verificationId:'manual-'+topic,rows:[],heading,text,data:{topic}});
// Settings electronic manual Contents: applet chrome plus Settings content-1 Index.
views.push({appId:'manual',screen:'main',heading:'System Settings',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},text:[],data:{manualTitleId:'0004001000022000'},verificationId:'manual-settings-contents'});
views.push({appId:'manual',screen:'document',heading:'System Settings',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},text:[],data:{page:0,manualTitleId:'0004001000022000'},verificationId:'manual-settings-page-1'});
const reports=[];
try{
 for(const view of views){
  const spec=nativeHelperView(view),assets=await loadNativeTitleAssets('https://helper.invalid/manifest.json',spec.titleId,spec.packs,new Map([['cbf_std.bcfnt',font]]));
  const originalPacks=Object.values(assets.renderer.packs),before=JSON.stringify(originalPacks),top=createCanvas(400,240),bottom=createCanvas(320,240);
  const calls=[],draw=assets.renderer.draw.bind(assets.renderer);
  assets.renderer.draw=(ctx,pack,layout,options)=>{calls.push({screen:ctx.canvas===top?'top':'bottom',pack,layout,options});return draw(ctx,pack,layout,options);};
  assert.equal(drawNativeHelperFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{font}),true);
  if(view.appId==='amiibo-settings'){
   const header=calls.find(c=>c.layout==='Header');assert.ok(header);
   for(const pane of ['T_HeaderTitle_00','T_HeaderTitle_01'])assert.equal(header.options.overrides[pane].text,'amiibo Settings');
   const portal=calls.find(c=>c.layout==='PortalSceneCTR');assert.deepEqual(portal.options.parts.PortalBtnSub,{pack:'amiibo-sub',layout:'PortalBtnSub'});assert.equal(portal.options.overrides,undefined,'no source part is hidden');
   assert.equal(portal.options.textByCallName.SelectMenu,'Please choose the following\noptions to configure your amiibo.');
  }
  if(view.appId==='system-updater'){
   for(const name of ['Bg_U_00','Bg_D_00'])assert.equal(calls.find(c=>c.layout===name).options.bindings,undefined,'ordinary update state preserves source white background');
   const title=calls.find(c=>c.layout==='CommonBG_U_00');
   assert.equal(title.options.bindings[0].name,'CommonBG_U_00_SceneIn_01','source update record uses state 1');
   const body=calls.find(c=>c.layout==='MessageOnly_D_00');
   assert.equal(body.options.overrides.TextBoxTitle_00.text,'Connect to the internet\nand update the system?');
   assert.ok(body.options.overrides.TextBoxTitle_00.messageStyle);
   assert.equal(body.options.overrides.TextBoxTitle_00.fontSize,undefined);
   assert.equal(body.options.overrides.TextBoxTitle_00.translation,undefined);
   assert.equal(body.options.overrides.TextBoxTitle_00.size,undefined);
   assert.equal(calls.filter(c=>c.screen==='bottom'&&c.layout==='TextBG_U_00').length,0,'no authored upper-panel backdrop on lower LCD');
   const footer=calls.find(c=>c.layout==='Base_D_01');assert.ok(footer);
   for(const pane of ['TextBox_00','TextBoxShdw_00'])assert.equal(footer.options.overrides[pane].text,'Cancel');
   for(const pane of ['TextBox_01','TextBoxShdw_01'])assert.equal(footer.options.overrides[pane].text,'OK');
  }
  assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')),[]);
  assert.equal(JSON.stringify(originalPacks),before,'source resources remain immutable');
  if(view.data?.manualTitleId&&view.screen==='main'){
   assert.equal(assets.renderer.packs['manual-index'].titleId,'0004001000022000');
   const backgrounds=calls.filter(c=>c.layout==='AllNull');
   assert.deepEqual(backgrounds.map(c=>[c.screen,c.pack,c.options.center]),[['top','manual-all-root',[200,240]],['bottom','manual-all-root',[160,0]]]);
   for(const background of backgrounds)assert.deepEqual(background.options.bindings,[{name:'AllNull_Wait',frame:1}]);
   const rows=calls.filter(c=>c.layout==='ManualRowImportant'||c.layout==='ManualRowGettingStarted').map(c=>[c.options.overrides.TextBox_Num.text,c.options.overrides.TextBox_Txt.text,c.options.center[1]]);
   assert.deepEqual(rows,[['1','Important Information',86],['2','Using the System Settin...',174]]);
   assert.equal(calls.find(c=>c.layout==='SoftTitleHeader').options.overrides.TextBoxTxt_00.text,'System Settings');
  }
  const targets=nativeHelperTargets(view);
  if(view.data?.manualTitleId)assert.deepEqual(targets.map(t=>t.action),view.screen==='main'?['manual-page-0','back']:['manual-close','back']);
  else{
   assert.equal(targets.filter(target=>target.action==='back').length,1);
   if(view.appId==='system-transfer'&&view.screen==='main')assert.deepEqual(targets.map(target=>target.action),['back','3ds','dsi']);
   else if(view.appId==='extrapad'&&view.screen==='main')assert.deepEqual(targets.map(target=>target.action),['back','information']);
   else if(view.appId==='manual'&&view.screen==='main')assert.deepEqual(targets.map(target=>target.action),['contents','controls','support','back']);
   else assert.equal(targets.length,1);
  }
  for(const target of targets){assert.ok(target.x>=0&&target.y>=0&&target.x+target.width<=320&&target.y+target.height<=240,'targets remain inside lower LCD');}
  for(const [name,canvas]of [['top',top],['bottom',bottom]]){writeFileSync(join(out,(view.verificationId??view.appId+'-'+view.screen)+'-'+name+'.png'),canvas.toBuffer('image/png'));reports.push({id:(view.verificationId??view.appId+'-'+view.screen)+'-'+name,sha256:createHash('sha256').update(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data).digest('hex')});}
  assets.dispose();
 }
 assert.equal(nativeHelperView({...views[0],appId:'browser'}),null);assert.equal(nativeHelperTargets({...views[0],appId:'browser'}),null);
 writeFileSync(join(out,'verification.json'),JSON.stringify({passed:true,reports},null,2)+'\n');console.log(views.length+' native helper pairs passed; immutable resources, bounded targets, no diagnostics.');
}finally{font.dispose();}
