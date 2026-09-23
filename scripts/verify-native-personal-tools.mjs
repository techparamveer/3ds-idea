import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,dirname,join,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import ts from 'typescript';
export async function verifyPersonalTools(options){
 options.title??='notifications';assert.ok(['notifications','notes','friends','friends-profile'].includes(options.title));
 for(const key of ['artifactDir','assetRoot','canvasModule','interfaceRoot'])assert.ok(isAbsolute(options[key]??''),key);
 const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.artifactDir;mkdirSync(out,{recursive:true});
 const compiled=mkdtempSync(join(out,'compiled-')),sourceHashes={};
 const sourceName='stock-native-personal-tools',source=readFileSync(join(repo,'src/os',sourceName+'.ts'),'utf8');
 // Type-check the new module against the coordinator's read-only interfaces.
 const virtual=join(options.interfaceRoot,'src/os',sourceName+'.ts');
 const compilerOptions={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,allowImportingTsExtensions:true,jsx:ts.JsxEmit.ReactJSX};
 const host=ts.createCompilerHost(compilerOptions),read=host.readFile.bind(host),exists=host.fileExists.bind(host);
 host.readFile=path=>resolve(path)===virtual?source:read(path);host.fileExists=path=>resolve(path)===virtual||exists(path);
 const program=ts.createProgram([virtual],compilerOptions,host),diagnostics=ts.getPreEmitDiagnostics(program);
 assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:p=>p,getCurrentDirectory:()=>options.interfaceRoot,getNewLine:()=> '\n'}));
 for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets',sourceName]){
  const code=name===sourceName?source:readFileSync(join(options.interfaceRoot,'src/os',name+'.ts'),'utf8');sourceHashes[name]=createHash('sha256').update(code).digest('hex');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
 }
 const [{createCanvas,loadImage},{BitmapFont},{loadNativeTitleAssets},{nativePersonalToolView,drawNativePersonalToolFrame}]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets',sourceName].map(n=>import(pathToFileURL(join(compiled,n+'.mjs'))))]);
 const previousDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldFetch=globalThis.fetch;let font,assets;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};
  globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://personal-tools.invalid');const file=resolve(options.assetRoot,u.pathname.slice(1));assert.ok(file.startsWith(options.assetRoot+'/'));return new Response(readFileSync(file));};
  const manifest=JSON.parse(readFileSync(join(options.assetRoot,'manifest.json'))),fontPath=join(options.assetRoot,manifest.fonts.shared),fontData=JSON.parse(readFileSync(fontPath));
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
  const notes={appId:'game-notes',screen:'main',heading:'Game Notes',rows:Array.from({length:16},(_,i)=>({id:String(i),label:'Note '+(i+1)})),selection:0,footer:{left:{action:'back',label:'Back'}}};
  const base=options.title==='notifications'?{...notes,appId:'notifications',heading:'Notifications',rows:[],text:['There are no notifications.']}:options.title.startsWith('friends')?{...notes,appId:'friends',screen:options.title==='friends-profile'?'profile':'main',heading:'Friend List',rows:options.title==='friends-profile'?[]:[{id:'profile',label:'Your friend card'}],data:{settings:{nickname:'Player'},message:''}}:notes;
  const contract=nativePersonalToolView(base);assert.ok(contract);assert.equal(nativePersonalToolView({...base,screen:'unrecognized'}),null);assert.equal(nativePersonalToolView({...base,appId:'work'}),null);
  assets=await loadNativeTitleAssets('https://personal-tools.invalid/manifest.json',contract.titleId,contract.packs,new Map([['cbf_std.bcfnt',font]]));
  if(options.title==='friends'){assert.equal(nativePersonalToolView({...base,rows:[...base.rows,{id:'saved-friend',label:'Saved'}]}),null);assert.equal(nativePersonalToolView({...base,rows:[]}),null);}
  const views=options.title==='friends-profile'?[base,{...base,data:{settings:{nickname:'Ada'},message:'Existing saved message'}}]:options.title==='notes'?[0,1,4,15].map(selection=>({...base,selection})):[base];
  const sourceJson=JSON.stringify(assets.renderer.packs),viewJson=JSON.stringify(views),reports=[],sheet=createCanvas(400*views.length,480),sheetContext=sheet.getContext('2d');
  for(const [index,view] of views.entries()){
   const top=createCanvas(400,240),bottom=createCanvas(320,240);
   assert.equal(drawNativePersonalToolFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{font}),true,JSON.stringify(assets.renderer.diagnostics));
   const id=base.appId+'-'+(base.screen==='main'?view.selection:base.screen+'-'+index);writeFileSync(join(out,id+'-top.png'),top.toBuffer('image/png'));writeFileSync(join(out,id+'-bottom.png'),bottom.toBuffer('image/png'));
   sheetContext.drawImage(top,index*400,0);sheetContext.drawImage(bottom,index*400+40,240);
   const bytes=bottom.getContext('2d').getImageData(0,0,320,240).data;assert.ok(bytes.some((v,i)=>i%4===3&&v>0));
   reports.push({id,bottomSha256:createHash('sha256').update(bytes).digest('hex')});
  }
  assert.equal(new Set(reports.map(r=>r.bottomSha256)).size,views.length,'distinct source states');
  assert.equal(JSON.stringify(views),viewJson,'views remain immutable');
  assert.equal(JSON.stringify(assets.renderer.packs),sourceJson,'source packs remain immutable');
  assert.deepEqual(assets.renderer.diagnostics,[]);
  assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')),[]);
  writeFileSync(join(out,'contact-sheet.png'),sheet.toBuffer('image/png'));
  const report={passed:true,sourceHashes,reports,diagnostics:assets.diagnostics,gaps:['Native components are composed for read-only portfolio navigation; no game capture or note editing.','Source resource renders are not matched native LCD captures.']};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{assets?.dispose();font?.dispose();globalThis.fetch=oldFetch;if(previousDocument)Object.defineProperty(globalThis,'document',previousDocument);else delete globalThis.document;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module','interface-root','title'].map(k=>[k,{type:'string'}]))});
 console.log(JSON.stringify(await verifyPersonalTools(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]))),null,2));
}
