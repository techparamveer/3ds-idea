import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,dirname,join,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import ts from 'typescript';
export async function verifyPersonalTools(options){
 options.title??='notifications';assert.ok(['notifications','notes','friends','friends-profile','notes-selected','notes-suspended'].includes(options.title));
 const selectedNote=options.title==='notes-selected'||options.title==='notes-suspended';
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
 for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','notes-suspended-capture',sourceName]){
  const code=name===sourceName?source:readFileSync(join(options.interfaceRoot,'src/os',name+'.ts'),'utf8');sourceHashes[name]=createHash('sha256').update(code).digest('hex');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
 }
 const [{createCanvas,loadImage},{BitmapFont},{loadNativeTitleAssets},{rotateCaptureForNativeUV},{nativePersonalToolView,drawNativePersonalToolFrame}]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets','notes-suspended-capture',sourceName].map(n=>import(pathToFileURL(join(compiled,n+'.mjs'))))]);
 // Synthetic upright quadrants (red, green / blue, white): orientation evidence, not an application frame.
 const quadrants=(width,height)=>{const data=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set([[255,0,0],[0,255,0],[0,0,255],[255,255,255]][(y<height/2?0:2)+(x<width/2?0:1)].concat(255),(y*width+x)*4);return data;};
 const suspendedCapture=options.title==='notes-suspended'?{status:'ready',owner:'health-safety:1',generation:1,upper:rotateCaptureForNativeUV(400,240,quadrants(400,240)),lower:rotateCaptureForNativeUV(320,240,quadrants(320,240))}:undefined;
 const previousDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldFetch=globalThis.fetch;let font,assets;
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};
  globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://personal-tools.invalid');const file=resolve(options.assetRoot,u.pathname.slice(1));assert.ok(file.startsWith(options.assetRoot+'/'));return new Response(readFileSync(file));};
  const manifest=JSON.parse(readFileSync(join(options.assetRoot,'manifest.json'))),fontPath=join(options.assetRoot,manifest.fonts.shared),fontData=JSON.parse(readFileSync(fontPath));
  font=new BitmapFont(fontData,await Promise.all(fontData.sheets.map(name=>loadImage(join(dirname(fontPath),name)))));
  const notes={appId:'game-notes',screen:'main',heading:'Game Notes',rows:Array.from({length:16},(_,i)=>({id:String(i),label:'Note '+(i+1)})),selection:0,footer:{left:{action:'back',label:'Back'}}};
  const base=options.title==='notifications'?{...notes,appId:'notifications',heading:'Notifications',rows:[],text:['There are no notifications.']}:options.title.startsWith('friends')?{...notes,appId:'friends',screen:options.title==='friends-profile'?'profile':'main',heading:'Friend List',rows:options.title==='friends-profile'?[]:[{id:'profile',label:'Your friend card'}],data:{settings:{nickname:'Player'},message:''}}:selectedNote?{...notes,screen:'drawing',rows:[],data:{slot:0,strokes:[]}}:notes;
  const contract=nativePersonalToolView(base);assert.ok(contract);assert.equal(nativePersonalToolView({...base,screen:'unrecognized'}),null);assert.equal(nativePersonalToolView({...base,appId:'work'}),null);
  assets=await loadNativeTitleAssets('https://personal-tools.invalid/manifest.json',contract.titleId,contract.packs,new Map([['cbf_std.bcfnt',font]]));
  if(options.title==='friends'){assert.equal(nativePersonalToolView({...base,rows:[...base.rows,{id:'saved-friend',label:'Saved'}]}),null);assert.equal(nativePersonalToolView({...base,rows:[]}),null);}
  const views=options.title==='notes-selected'?[base,{...base,data:{slot:15,strokes:[{color:'black',points:[[35,45],[120,130],[205,45]]},{color:'red',points:[[38,150],[200,150]]},{color:'blue',points:[[240,40],[240,180]]},{color:'eraser',points:[[90,140],[90,160]]},{color:'red',points:[[-20,225],[340,225]]}]}}]:options.title==='friends-profile'?[base,{...base,data:{settings:{nickname:'Ada'},message:'Existing saved message'}}]:options.title==='notes'?[0,1,4,15].map(selection=>({...base,selection})):[base];
  const sourceJson=JSON.stringify(assets.renderer.packs),viewJson=JSON.stringify(views),reports=[],sheet=createCanvas(400*views.length,480),sheetContext=sheet.getContext('2d');
  for(const [index,view] of views.entries()){
   const top=createCanvas(400,240),bottom=createCanvas(320,240);
   assert.equal(drawNativePersonalToolFrame(assets.renderer,top.getContext('2d'),bottom.getContext('2d'),view,{font,suspendedCapture}),true,JSON.stringify(assets.renderer.diagnostics));
   if(suspendedCapture){
    // SwitchDouble frame 25: upper pane x105-295,y5-119; lower pane x124-276,y121-235.
    const upper=top.getContext('2d').getImageData(0,0,400,240).data,pixel=(x,y)=>Array.from(upper.slice((y*400+x)*4,(y*400+x)*4+3));
    for(const [x,y,rgb] of [[152,33,[255,0,0]],[247,33,[0,255,0]],[152,90,[0,0,255]],[247,90,[255,255,255]],[162,149,[255,0,0]],[238,149,[0,255,0]],[162,206,[0,0,255]],[238,206,[255,255,255]]])assert.deepEqual(pixel(x,y),rgb,`suspended capture orientation at ${x},${y}`);
   }
   const id=base.appId+'-'+(base.screen==='main'?view.selection:base.screen+'-'+index);writeFileSync(join(out,id+'-top.png'),top.toBuffer('image/png'));writeFileSync(join(out,id+'-bottom.png'),bottom.toBuffer('image/png'));
   sheetContext.drawImage(top,index*400,0);sheetContext.drawImage(bottom,index*400+40,240);
   const bytes=bottom.getContext('2d').getImageData(0,0,320,240).data;assert.ok(bytes.some((v,i)=>i%4===3&&v>0));
   reports.push({id,bottomSha256:createHash('sha256').update(bytes).digest('hex'),footerSha256:createHash('sha256').update(bytes.slice(212*320*4)).digest('hex')});
   if(options.title==='notes-selected'&&index===1){const pixel=(x,y)=>Array.from(bytes.slice((y*320+x)*4,(y*320+x)*4+3));assert.deepEqual(pixel(60,150),[255,0,0]);assert.deepEqual(pixel(90,150),[255,255,255]);assert.deepEqual(pixel(240,100),[0,0,255]);}
  }
  assert.equal(new Set(reports.map(r=>r.bottomSha256)).size,views.length,'distinct source states');
  if(options.title==='notes-selected')assert.equal(new Set(reports.map(report=>report.footerSha256)).size,1,'saved strokes cannot paint over native toolbar');
  assert.equal(JSON.stringify(views),viewJson,'views remain immutable');
  assert.equal(JSON.stringify(assets.renderer.packs),sourceJson,'source packs remain immutable');
  assert.deepEqual(assets.renderer.diagnostics,[]);
  assert.deepEqual(assets.diagnostics.filter(d=>!d.includes('unrequested converter omissions')),[]);
  writeFileSync(join(out,'contact-sheet.png'),sheet.toBuffer('image/png'));
  const report={passed:true,sourceHashes,reports,diagnostics:assets.diagnostics,gaps:['Native components are composed for read-only portfolio navigation; no note editing.',suspendedCapture?'Suspended-screen pixels are a synthetic quadrant pattern, not an application frame; SwitchDouble as the initial mode is untraced.':'No suspended application capture is supplied in this render.','Source resource renders are not matched native LCD captures.']};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{assets?.dispose();font?.dispose();globalThis.fetch=oldFetch;if(previousDocument)Object.defineProperty(globalThis,'document',previousDocument);else delete globalThis.document;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module','interface-root','title'].map(k=>[k,{type:'string'}]))});
 console.log(JSON.stringify(await verifyPersonalTools(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]))),null,2));
}
