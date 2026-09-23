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
 for(const name of ['bitmap-font','native-layout','native-png','native-renderer','native-title-assets','native-title-session','stock-screen-layout','stock-native-settings','stock-native-sound','stock-native-camera','stock-native-health','stock-health-layout','stock-native-personal-tools','stock-native-web','stock-native-services','stock-native-helpers','stock-screen-presentation']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');sourceHashes[name]=createHash('sha256').update(source).digest('hex');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name}.mjs'`));
 }
 const [{createCanvas,loadImage,Image:CanvasImage},{BitmapFont},{loadNativeTitleAssets},{settingsScreenPacks,settingsDirectButtonClip},{soundScreenPacks},{cameraScreenPacks},{healthScreenPacks},{healthDocumentPageCounts,healthDocumentArticles,healthDocumentLinesPerPage},{browserScreenPacks,miiverseScreenPacks},{drawStockScreenFrame}]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets','stock-native-settings','stock-native-sound','stock-native-camera','stock-native-health','stock-health-layout','stock-native-web','stock-screen-presentation'].map(n=>import(pathToFileURL(join(compiled,n+'.mjs'))))]);
 const previousGlobals=Object.fromEntries(['document','window','Image'].map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)])),oldFetch=globalThis.fetch,oldObjectURL=URL.createObjectURL,oldRevokeURL=URL.revokeObjectURL,blobBytes=new WeakMap();let font,assets,soundAssets,cameraAssets,healthAssets,browserAssets,miiverseAssets;
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
  {appId:'health-safety',screen:'main',heading:'Health and Safety Information',rows:rows([['3d','3D Display Precautions'],['general','General Precautions'],['usage','Usage Precautions']]),selection:0,footer},
 ];
 views.push({appId:'system-settings',screen:'internet',heading:'Internet Settings',rows:rows([['connections','Connection Settings'],['spotpass','SpotPass'],['ds-connections','Nintendo DS Connections'],['internet-info','Other Information']]),selection:0,footer:{left:footer.left}});
 views.push({appId:'system-settings',screen:'parental',heading:'Parental Controls',rows:rows([['next','Next'],['back','Back']]),selection:0,footer:{left:footer.left}});
 for(const [screen,items]of Object.entries({data:[['data-3ds','Nintendo 3DS'],['data-dsi','Nintendo DSiWare'],['streetpass','StreetPass Management'],['blocked-users','Reset blocked-user settings']],profile:[['nickname','User Name'],['birthday','Date of Birth'],['region','Region Settings'],['ds-profile','Nintendo DS Profile']],'data-3ds':[['software','Software'],['extra-data','Extra Data'],['add-on-content','Add-on Content'],['backup','Save Data Backup']],connections:[['connection-1','Connection 1'],['connection-2','Connection 2'],['connection-3','Connection 3'],['new-connection','New Connection']],clock:[['date',"Today's Date"],['time','Current Time']],restrictions:[['rating','Software Rating'],['browser','Internet Browser'],['shopping','Nintendo 3DS Shopping Services'],['3d','Display of 3D Images']]}))views.push({appId:'system-settings',screen,heading:screen,rows:rows(items),selection:0,footer:{left:footer.left}});
 for(const [page,items]of [[0,[['profile','Profile'],['clock','Date & Time'],['touch','Touch Screen']]],[3,[['language','Language'],['update','System Update'],['format','Format System Memory']]]])views.push({appId:'system-settings',screen:'other',verificationId:'settings-other-'+page,heading:'Other Settings',rows:rows(items),selection:1,footer:{left:footer.left},data:{page}});
 views.push({appId:'system-settings',screen:'detail',heading:'User Name',rows:[],selection:0,footer:{left:footer.left},text:['Not set in this portfolio.'],data:{parent:'profile',field:'nickname'}});
 for(const field of ['sound','birthday','date','time','language'])views.push({appId:'system-settings',screen:'detail',verificationId:'settings-detail-'+field,heading:field,rows:[],selection:0,footer:{left:footer.left},text:[field==='sound'?'Stereo':field==='language'?'English':'Not set in this portfolio.'],data:{parent:['date','time'].includes(field)?'clock':'profile',field,settings:{sound:'Stereo',language:'English'}}});
 const playback=views.find(view=>view.appId==='sound'&&view.screen==='playback');
 views.push({...playback,verificationId:'sound-paused',data:{...playback.data,playing:false}});
 views.push({...playback,verificationId:'sound-error',text:['This track could not be played.'],data:{...playback.data,playing:false,mediaError:true}});
 views.push({appId:'camera',screen:'main',verificationId:'camera-empty',heading:'Nintendo 3DS Camera',rows:[],selection:0,footer:{left:footer.left},data:{folders:[]}});
 views.push({appId:'sound',screen:'main',verificationId:'sound-library',heading:'Nintendo 3DS Sound',rows:[{id:'track:renderer-probe',label:'Library controls specimen',value:'Renderer verification'}],selection:0,footer,data:{tracks:[{...playback.data.track,title:'Library controls specimen'}]}});
 for(const [topic,page]of [['3d',0],['general',1],['usage',26]])views.push({appId:'health-safety',screen:'document',verificationId:'health-'+topic+'-'+page,heading:'Health and Safety Information',rows:[],selection:0,footer:{left:page?{label:'Previous',action:'previous'}:footer.left,right:page===26&&topic==='usage'?{label:'Done',action:'back'}:{label:'Next',action:'next'}},data:{topic,page}});
 views.push({appId:'browser',screen:'main',heading:'Internet Browser',rows:rows([['search','Enter search text'],['bookmarks','Bookmarks'],['add-bookmark','Add'],['settings','Settings'],['page-info','Page Info'],['address','Enter URL']]),selection:1,footer});
 views.push({appId:'miiverse',screen:'main',heading:'Miiverse',rows:rows([['communities','Communities'],['activity','Activity Feed'],['profile','My Menu'],['notifications','Notifications']]),selection:0,footer});
 const browserSettings=rows([['auto-wrap','Text Wrap'],['search-engine','Search Engine'],['delete-cookies','Delete Cookies'],['clear-history','Clear History'],['network','Network'],['proxy','Proxy'],['version','Version'],['reset','Reset']]);
 for(const selection of [0,4])views.push({appId:'browser',screen:'settings',verificationId:'browser-settings-'+selection,heading:'Settings',rows:browserSettings,selection,footer,text:['View browser settings.']});
 for(const screen of ['bookmarks','search','address','page-info','add-bookmark'])views.push({appId:'browser',screen,heading:screen,rows:[],selection:0,footer,text:[screen==='bookmarks'?'No bookmarks are saved.':'This action is read-only in this portfolio.'],data:{url:''}});
 views.push({appId:'browser',screen:'detail',heading:'Reset',rows:[],selection:0,footer,text:['Read-only preview. Saved data is unchanged.'],data:{parent:'settings',field:'reset'}});
 views.push({appId:'browser',screen:'bookmarks',verificationId:'browser-bookmarks-specimen',heading:'Bookmarks',rows:rows([['specimen','Renderer verification bookmark']]),selection:0,footer});
 for(const field of ['communities','activity','profile','notifications'])views.push({appId:'miiverse',screen:'detail',verificationId:'miiverse-'+field,heading:'Miiverse',rows:[],selection:0,footer,text:['No content is available in this portfolio.'],data:{field}});
 try{
  globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.window={location:{href:'https://stock-ui.invalid/manifest.json'}};globalThis.Image=CanvasImage;
  URL.createObjectURL=blob=>'data:image/png;base64,'+blobBytes.get(blob).toString('base64');URL.revokeObjectURL=()=>{};
  globalThis.fetch=async value=>{const u=new URL(value);assert.equal(u.origin,'https://stock-ui.invalid');const file=resolve(options.assetRoot,u.pathname.slice(1));assert.ok(file.startsWith(options.assetRoot+'/'));const bytes=readFileSync(file),response=new Response(bytes);response.blob=async()=>{const blob=new Blob([bytes]);blobBytes.set(blob,bytes);return blob;};return response;};
  const manifest=JSON.parse(readFileSync(options.fontManifest,'utf8'));
  font=new BitmapFont(manifest,await Promise.all(manifest.sheets.map(name=>loadImage(join(dirname(options.fontManifest),name)))));
  assets=await loadNativeTitleAssets('https://stock-ui.invalid/manifest.json','0004001000022000',settingsScreenPacks,new Map([['cbf_std.bcfnt',font]]));
  soundAssets=await loadNativeTitleAssets('https://stock-ui.invalid/manifest.json','0004001000022500',soundScreenPacks,new Map([['cbf_std.bcfnt',font]]));
  cameraAssets=await loadNativeTitleAssets('https://stock-ui.invalid/manifest.json','0004001000022400',cameraScreenPacks,new Map([['cbf_std.bcfnt',font]]));
  healthAssets=await loadNativeTitleAssets('https://stock-ui.invalid/manifest.json','0004001000022300',healthScreenPacks,new Map([['cbf_std.bcfnt',font]]));
  browserAssets=await loadNativeTitleAssets('https://stock-ui.invalid/manifest.json','0004003000009d02',browserScreenPacks,new Map());
  miiverseAssets=await loadNativeTitleAssets('https://stock-ui.invalid/manifest.json','000400300000be02',miiverseScreenPacks,new Map());
  const healthMessages=healthAssets.renderer.packs['health-messages'].messages.safe_msbt_LZ;
  for(const [topic,label]of Object.entries(healthDocumentArticles))assert.equal(Math.ceil(healthMessages.messages[healthMessages.labels[label]].text.split('\n').length/healthDocumentLinesPerPage),healthDocumentPageCounts[topic],'runtime and native document page totals agree');
  const sourceButtonPack=assets.renderer.packs.button,sourceButtonJson=JSON.stringify(sourceButtonPack),sourceLayoutPack=assets.renderer.packs.layout,sourceLayoutJson=JSON.stringify(sourceLayoutPack);
  const buttonLayout=sourceButtonPack.layouts.I_TopLTs,buttonClip=sourceButtonPack.animations.I_TopLTs_Select;
  assert.deepEqual(settingsDirectButtonClip(buttonLayout,buttonClip).shares,[]);
  assert.throws(()=>settingsDirectButtonClip({...buttonLayout,groups:[...buttonLayout.groups,{name:'AS_Picture_00',panes:[],children:[]}]},buttonClip),/explicit composition/);
  assert.throws(()=>settingsDirectButtonClip(buttonLayout,{...buttonClip,shares:[{sourcePane:'Unknown',targetGroup:'Unknown'}]}),/explicit composition/);
  const images=new Map();for(const p of photos)images.set(p.src,await loadImage(join(repo,'public',p.src)));
  const requestedImages=[];
  const image=(ctx,url,x,y,w,h)=>{requestedImages.push(url);const im=images.get(url);if(!im)return false;const scale=Math.min(w/im.width,h/im.height);ctx.drawImage(im,x+(w-im.width*scale)/2,y+(h-im.height*scale)/2,im.width*scale,im.height*scale);return true;};
  const reports=[],sheet=createCanvas(400*views.length,480),sheetContext=sheet.getContext('2d');
  for(const [index,view] of views.entries()){
   const top=createCanvas(400,240),bottom=createCanvas(320,240),id=view.verificationId??view.appId+'-'+view.screen;
   requestedImages.length=0;
   drawStockScreenFrame(top.getContext('2d'),bottom.getContext('2d'),view,{font,image,native:view.appId==='system-settings'?assets.renderer:view.appId==='sound'?soundAssets.renderer:view.appId==='camera'?cameraAssets.renderer:view.appId==='health-safety'?healthAssets.renderer:view.appId==='browser'?browserAssets.renderer:view.appId==='miiverse'?miiverseAssets.renderer:undefined});
   if(id==='sound-playback')assert.deepEqual(requestedImages,[photos[0].src],'Sound loads artwork, never the audio URL, as an image');
   writeFileSync(join(out,id+'-top.png'),top.toBuffer('image/png'));writeFileSync(join(out,id+'-bottom.png'),bottom.toBuffer('image/png'));
   sheetContext.drawImage(top,index*400,0);sheetContext.drawImage(bottom,index*400+40,240);
   reports.push({id,topSha256:createHash('sha256').update(top.getContext('2d').getImageData(0,0,400,240).data).digest('hex'),bottomSha256:createHash('sha256').update(bottom.getContext('2d').getImageData(0,0,320,240).data).digest('hex')});
  }
  writeFileSync(join(out,'contact-sheet.png'),sheet.toBuffer('image/png'));
  assert.notEqual(reports.find(r=>r.id==='sound-playback').bottomSha256,reports.find(r=>r.id==='sound-paused').bottomSha256,'native play and pause artwork differ');
  const focusSheet=createCanvas(320*5,240),focusContext=focusSheet.getContext('2d'),focusHashes=[];
  for(let selection=0;selection<5;selection++){
   const top=createCanvas(400,240),bottom=createCanvas(320,240);
   drawStockScreenFrame(top.getContext('2d'),bottom.getContext('2d'),{...views[0],selection},{font,native:assets.renderer});
   focusContext.drawImage(bottom,selection*320,0);focusHashes.push(createHash('sha256').update(bottom.getContext('2d').getImageData(0,0,320,240).data).digest('hex'));
  }
  assert.equal(new Set(focusHashes).size,5,'each Settings selection paints a distinct native focus state');
  assert.equal(JSON.stringify(sourceButtonPack),sourceButtonJson,'derived Settings clips preserve the source pack');
  assert.equal(JSON.stringify(sourceLayoutPack),sourceLayoutJson,'derived Settings read-only fields preserve the source pack');
  writeFileSync(join(out,'settings-focus.png'),focusSheet.toBuffer('image/png'));
  const diagnostics=[...assets.diagnostics,...soundAssets.diagnostics,...cameraAssets.diagnostics,...healthAssets.diagnostics,...browserAssets.diagnostics,...miiverseAssets.diagnostics];
  const failures=diagnostics.filter(d=>!d.includes('unrequested converter omissions'));assert.deepEqual(failures,[]);
  const report={passed:true,sourceHashes,reports,diagnostics,gaps:['Settings native source assembly is not a matched native LCD capture.','Camera and Sound use source artwork with adapted gallery/control placement and portfolio media content.','Health source text is paginated with base styles; rich inline runs and continuous scroll remain adaptations. Remaining stock title layouts are pending.','Browser and Miiverse display local chrome only; website content and remote feeds are not present.','Playback specimen is synthetic validation only; no user track is supplied.']};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{miiverseAssets?.dispose();browserAssets?.dispose();healthAssets?.dispose();cameraAssets?.dispose();soundAssets?.dispose();assets?.dispose();font?.dispose();globalThis.fetch=oldFetch;URL.createObjectURL=oldObjectURL;URL.revokeObjectURL=oldRevokeURL;for(const [name,descriptor]of Object.entries(previousGlobals)){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module','font-manifest'].map(k=>[k,{type:'string'}]))});
 console.log(JSON.stringify(await verifyStockScreens(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]))),null,2));
}
