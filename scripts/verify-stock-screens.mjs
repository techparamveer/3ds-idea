import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,dirname,join,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import ts from 'typescript';
export async function verifyStockScreens(options){
 for(const key of ['artifactDir','assetRoot','canvasModule','fontManifest'])assert.ok(isAbsolute(options[key]??''),key);
 const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.artifactDir;mkdirSync(out,{recursive:true});
 const compiled=mkdtempSync(join(out,'compiled-')),sourceHashes={};
 for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','native-title-session','stock-screen-layout','stock-native-settings','stock-screen-presentation']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');sourceHashes[name]=createHash('sha256').update(source).digest('hex');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
 }
 const [{createCanvas,loadImage},{BitmapFont},{loadNativeTitleAssets},{settingsScreenPacks,settingsDirectButtonClip},{drawStockScreenFrame}]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets','stock-native-settings','stock-screen-presentation'].map(n=>import(pathToFileURL(join(compiled,n+'.mjs'))))]);
 const previousDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldFetch=globalThis.fetch;let font,assets;
 const rows=ids=>ids.map(([id,label])=>({id,label})),footer={left:{action:'back',label:'Back'},right:{action:'open',label:'Open'}};
 const photos=[1,2,3].map(i=>({id:'building'+i,title:'Building '+i,src:'/portfolio/building'+i+'.jpg'}));
 const folders=[{id:'building',title:'Building Collection',photos}];
 const views=[
  {appId:'system-settings',screen:'main',heading:'System Settings',rows:rows([['internet','Internet Settings'],['parental','Parental Controls'],['data','Data Management'],['other','Other Settings'],['nnid','Nintendo Network ID Settings']]),selection:0,footer},
  {appId:'camera',screen:'main',heading:'Nintendo 3DS Camera',rows:rows([['folder:building','Building Collection']]),selection:0,footer,data:{folders}},
  {appId:'camera',screen:'gallery',heading:'Building Collection',rows:photos.map(p=>({id:'photo:'+p.id,label:p.title})),selection:1,footer,data:{folders,photos,folderId:'building'}},
  {appId:'camera',screen:'photo',heading:'Building Collection',rows:[],selection:0,footer:{left:footer.left},data:{photo:photos[1],photos}},
  {appId:'sound',screen:'main',heading:'Nintendo 3DS Sound',rows:[],selection:0,footer:{left:footer.left},data:{tracks:[]}},
  // Deliberately labelled renderer specimen, not an invented user's music record.
  {appId:'sound',screen:'playback',heading:'Nintendo 3DS Sound',rows:[],selection:0,footer:{left:footer.left},data:{track:{id:'renderer-probe',title:'Playback controls specimen',src:'/renderer-probe.mp3',artwork:photos[0].src},playing:true,position:45,duration:180,repeat:'all',shuffle:false}},
  {appId:'health-safety',screen:'main',heading:'Health and Safety Information',rows:rows([['health','Health and Safety'],['precautions','Usage Precautions'],['privacy','Privacy Information']]),selection:0,footer},
 ];
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};
  globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://stock-ui.invalid');const file=resolve(options.assetRoot,u.pathname.slice(1));assert.ok(file.startsWith(options.assetRoot+'/'));return new Response(readFileSync(file));};
  const manifest=JSON.parse(readFileSync(options.fontManifest,'utf8'));
  font=new BitmapFont(manifest,await Promise.all(manifest.sheets.map(name=>loadImage(join(dirname(options.fontManifest),name)))));
  assets=await loadNativeTitleAssets('https://stock-ui.invalid/manifest.json','0004001000022000',settingsScreenPacks,new Map([['cbf_std.bcfnt',font]]));
  const sourceButtonPack=assets.renderer.packs.button,sourceButtonJson=JSON.stringify(sourceButtonPack);
  const buttonLayout=sourceButtonPack.layouts.I_TopLTs,buttonClip=sourceButtonPack.animations.I_TopLTs_Select;
  assert.deepEqual(settingsDirectButtonClip(buttonLayout,buttonClip).shares,[]);
  assert.throws(()=>settingsDirectButtonClip({...buttonLayout,groups:[...buttonLayout.groups,{name:'AS_Picture_00',panes:[],children:[]}]},buttonClip),/explicit composition/);
  assert.throws(()=>settingsDirectButtonClip(buttonLayout,{...buttonClip,shares:[{sourcePane:'Unknown',targetGroup:'Unknown'}]}),/explicit composition/);
  const images=new Map();for(const p of photos)images.set(p.src,await loadImage(join(repo,'public',p.src)));
  const requestedImages=[];
  const image=(ctx,url,x,y,w,h)=>{requestedImages.push(url);const im=images.get(url);if(!im)return false;const scale=Math.min(w/im.width,h/im.height);ctx.drawImage(im,x+(w-im.width*scale)/2,y+(h-im.height*scale)/2,im.width*scale,im.height*scale);return true;};
  const reports=[],sheet=createCanvas(400*views.length,480),sheetContext=sheet.getContext('2d');
  for(const [index,view] of views.entries()){
   const top=createCanvas(400,240),bottom=createCanvas(320,240),id=view.appId+'-'+view.screen;
   requestedImages.length=0;
   drawStockScreenFrame(top.getContext('2d'),bottom.getContext('2d'),view,{font,image,native:view.appId==='system-settings'?assets.renderer:undefined});
   if(id==='sound-playback')assert.deepEqual(requestedImages,[photos[0].src],'Sound loads artwork, never the audio URL, as an image');
   writeFileSync(join(out,id+'-top.png'),top.toBuffer('image/png'));writeFileSync(join(out,id+'-bottom.png'),bottom.toBuffer('image/png'));
   sheetContext.drawImage(top,index*400,0);sheetContext.drawImage(bottom,index*400+40,240);
   reports.push({id,topSha256:createHash('sha256').update(top.getContext('2d').getImageData(0,0,400,240).data).digest('hex'),bottomSha256:createHash('sha256').update(bottom.getContext('2d').getImageData(0,0,320,240).data).digest('hex')});
  }
  writeFileSync(join(out,'contact-sheet.png'),sheet.toBuffer('image/png'));
  const focusSheet=createCanvas(320*5,240),focusContext=focusSheet.getContext('2d'),focusHashes=[];
  for(let selection=0;selection<5;selection++){
   const top=createCanvas(400,240),bottom=createCanvas(320,240);
   drawStockScreenFrame(top.getContext('2d'),bottom.getContext('2d'),{...views[0],selection},{font,native:assets.renderer});
   focusContext.drawImage(bottom,selection*320,0);focusHashes.push(createHash('sha256').update(bottom.getContext('2d').getImageData(0,0,320,240).data).digest('hex'));
  }
  assert.equal(new Set(focusHashes).size,5,'each Settings selection paints a distinct native focus state');
  assert.equal(JSON.stringify(sourceButtonPack),sourceButtonJson,'derived Settings clips preserve the source pack');
  writeFileSync(join(out,'settings-focus.png'),focusSheet.toBuffer('image/png'));
  const failures=assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions'));assert.deepEqual(failures,[]);
  const report={passed:true,sourceHashes,reports,diagnostics:assets.diagnostics,gaps:['Settings native source assembly is not a matched native LCD capture.','Camera and Sound are portfolio adaptations; native gallery/player chrome is pending.','Health and remaining stock title native layouts are pending.','Playback specimen is synthetic validation only; no user track is supplied.']};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{assets?.dispose();font?.dispose();globalThis.fetch=oldFetch;if(previousDocument)Object.defineProperty(globalThis,'document',previousDocument);else delete globalThis.document;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module','font-manifest'].map(k=>[k,{type:'string'}]))});
 console.log(JSON.stringify(await verifyStockScreens(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]))),null,2));
}
