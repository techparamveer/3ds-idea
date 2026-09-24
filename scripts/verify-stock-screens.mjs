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
 for(const name of ['native-screen-input','bitmap-font','native-layout','native-png','native-renderer','native-title-assets','native-title-session','stock-screen-layout','stock-native-settings','stock-settings-navigation','app-types','stock-sound-record','stock-native-sound','stock-native-camera','stock-native-health','stock-health-layout','stock-health-article','stock-health-scroll','stock-native-personal-tools','stock-native-web','stock-eshop-welcome','stock-native-services','stock-native-helpers','stock-native-amiibo','stock-native-selectors','stock-screen-presentation']){
  const source=readFileSync(join(repo,'src/os',name+'.ts'),'utf8');sourceHashes[name]=createHash('sha256').update(source).digest('hex');
  writeFileSync(join(compiled,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['"](\.\/[^'"]+)['"]/g,(_,name)=>`from '${name.replace(/\.ts$/,'')}.mjs'`));
 }
 const [{createCanvas,loadImage,Image:CanvasImage},{BitmapFont},{loadNativeTitleAssets},{settingsScreenPacks,settingsDirectButtonClip},{soundScreenPacks},{cameraScreenPacks},{healthScreenPacks},{healthDocumentRows,healthDocumentArticles},{browserScreenPacks,miiverseScreenPacks},{drawStockScreenFrame},{healthArticleMetrics},health]=await Promise.all([import(pathToFileURL(options.canvasModule)),...['bitmap-font','native-title-assets','stock-native-settings','stock-native-sound','stock-native-camera','stock-native-health','stock-health-layout','stock-native-web','stock-screen-presentation','stock-health-article','stock-health-scroll'].map(n=>import(pathToFileURL(join(compiled,n+'.mjs'))))]);
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
  {appId:'sound',screen:'playback',heading:'Nintendo 3DS Sound',rows:rows([['play','Pause'],['previous','Previous'],['next','Next'],['mode','Playback mode']]),selection:0,footer:{left:footer.left,right:{label:'OK',action:'play'}},data:{track:{id:'renderer-probe',title:'Playback controls specimen',src:'/renderer-probe.mp3',artwork:photos[0].src},playing:true,position:45,duration:180,repeat:'all',shuffle:false}},
  {appId:'health-safety',screen:'main',heading:'Health and Safety Information',rows:rows([['3d','3D Display Precautions'],['general','General Precautions'],['usage','Usage Precautions']]),selection:0,footer,data:{selectionActive:false}},
 ];
 views.push({appId:'system-settings',screen:'internet',heading:'Internet Settings',rows:rows([['connections','Connection Settings'],['spotpass','SpotPass'],['ds-connections','Nintendo DS Connections'],['internet-info','Other Information']]),selection:0,footer:{left:footer.left}});
 views.push({appId:'system-settings',screen:'parental',heading:'Parental Controls',rows:rows([['next','Next'],['back','Back']]),selection:0,footer:{left:footer.left}});
 for(const [screen,items]of Object.entries({data:[['data-3ds','Nintendo 3DS'],['data-dsi','Nintendo DSiWare'],['streetpass','StreetPass Management'],['blocked-users','Reset blocked-user settings']],profile:[['nickname','User Name'],['birthday','Date of Birth'],['region','Region Settings'],['ds-profile','Nintendo DS Profile']],'data-3ds':[['software','Software'],['extra-data','Extra Data'],['add-on-content','Add-on Content'],['backup','Save Data Backup']],connections:[['connection-1','Connection 1'],['connection-2','Connection 2'],['connection-3','Connection 3'],['new-connection','New Connection']],clock:[['date',"Today's Date"],['time','Current Time']],restrictions:[['rating','Software Rating'],['browser','Internet Browser'],['shopping','Nintendo 3DS Shopping Services'],['3d','Display of 3D Images']]}))views.push({appId:'system-settings',screen,heading:screen,rows:rows(items),selection:0,footer:{left:footer.left}});
 for(const [page,items]of [[0,[['profile','Profile'],['clock','Date & Time'],['touch','Touch Screen']]],[3,[['language','Language'],['update','System Update'],['format','Format System Memory']]]])views.push({appId:'system-settings',screen:'other',verificationId:'settings-other-'+page,heading:'Other Settings',rows:rows(items),selection:1,footer:{left:footer.left},data:{page}});
 views.push({appId:'system-settings',screen:'detail',heading:'User Name',rows:[],selection:0,footer:{left:footer.left},text:['Not set in this portfolio.'],data:{parent:'profile',field:'nickname'}});
 for(const field of ['sound','birthday','date','time','language'])views.push({appId:'system-settings',screen:'detail',verificationId:'settings-detail-'+field,heading:field,rows:[],selection:0,footer:{left:footer.left},text:[field==='sound'?'Stereo':field==='language'?'English':'Not set in this portfolio.'],data:{parent:['date','time'].includes(field)?'clock':'profile',field,settings:{sound:'Stereo',language:'English'}}});
 const playback=views.find(view=>view.appId==='sound'&&view.screen==='playback');
 views.push({...playback,verificationId:'sound-paused',data:{...playback.data,playing:false}});
 views.push({...playback,verificationId:'sound-error',text:['Could not play.'],footer:{left:footer.left,right:{label:'OK',action:'error-ok'}},data:{...playback.data,playing:false,mediaError:true}});
 // Source loop icons for the three remaining supported modes; the base playback view shows repeat-all (Folder).
 for(const [id,patch]of [['sound-mode-no-loop',{repeat:'off',shuffle:false}],['sound-mode-single',{repeat:'one',shuffle:false}],['sound-mode-random',{repeat:'off',shuffle:true}]])views.push({...playback,verificationId:id,data:{...playback.data,...patch}});
 for(const [id,position]of [['sound-seek-start',0],['sound-seek-end',180]])views.push({...playback,verificationId:id,data:{...playback.data,position}});
 const gridPhotos=Array.from({length:8},(_,i)=>({...photos[i%photos.length],id:'grid-probe-'+i}));
 for(const selection of [5,6])views.push({appId:'camera',screen:'gallery',verificationId:'camera-grid-'+selection,heading:'Grid geometry specimen',rows:gridPhotos.map(p=>({id:'photo:'+p.id,label:p.title})),selection,footer,data:{photos:gridPhotos}});
 views.push({appId:'camera',screen:'main',verificationId:'camera-empty',heading:'Nintendo 3DS Camera',rows:[],selection:0,footer:{left:footer.left},data:{folders:[]}});
 const specimenTracks=[1,2,3,4].map(i=>({...playback.data.track,id:'renderer-probe-'+i,title:'Library controls specimen '+i}));
 views.push({appId:'sound',screen:'main',verificationId:'sound-library',heading:'Nintendo 3DS Sound',rows:[{id:'track:renderer-probe',label:'Library controls specimen',value:'Renderer verification'}],selection:0,footer:{left:footer.left,right:{label:'OK',action:'track:renderer-probe'}},data:{tracks:[{...playback.data.track,title:'Library controls specimen'}]}});
 views.push({appId:'sound',screen:'main',verificationId:'sound-library-page2',heading:'Nintendo 3DS Sound',rows:specimenTracks.map(t=>({id:'track:'+t.id,label:t.title,value:'Renderer verification'})),selection:3,footer:{left:footer.left,right:{label:'OK',action:'track:renderer-probe-4'}},data:{tracks:specimenTracks}});
 // Continuous article specimens come from the replay-verified input model, not hand-picked offsets.
 const healthRun=(topic,inputs)=>{let state=health.healthScrollCreate(healthDocumentRows[topic]);for(const [stylus,keys]of inputs)state=health.healthScrollUpdate(health.healthScrollKey(health.healthScrollStylus(state,stylus),'down',keys));return health.healthScrollView(state);};
 const hold=(stylus,count,keys=false)=>Array(count).fill([stylus,keys]),idle=(count,keys=false)=>hold(null,count,keys);
 const healthSpecimens={
  '3d-top':['3d',[]],'3d-interior':['3d',idle(40,true)],'3d-end':['3d',[...hold({x:308,y:43},2),...hold({x:308,y:239},1),...idle(3)]],
  'general-thumb-pressed':['general',[...hold({x:308,y:43},2),...hold({x:308,y:120},3)]],'general-thumb-released':['general',[...hold({x:308,y:43},2),...hold({x:308,y:120},3),...idle(3)]],
  'usage-second-warning':['usage',idle(236,true)],
  'usage-end':['usage',[...hold({x:308,y:43},2),...hold({x:308,y:239},1),...idle(3)]],
 };
 for(const [id,[topic,inputs]]of Object.entries(healthSpecimens))views.push({appId:'health-safety',screen:'document',verificationId:'health-'+id,heading:'Health and Safety Information',rows:[],selection:0,footer:{left:footer.left},data:{topic,article:healthRun(topic,inputs)}});
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
  const healthMetrics={};
  for(const [topic,label]of Object.entries(healthDocumentArticles)){healthMetrics[topic]=healthArticleMetrics(healthMessages.messages[healthMessages.labels[label]].tokens);assert.equal(healthMetrics[topic].rows,healthDocumentRows[topic],'runtime rows equal parser rows of the delivered message');}
  const sourceButtonPack=assets.renderer.packs.button,sourceButtonJson=JSON.stringify(sourceButtonPack),sourceLayoutPack=assets.renderer.packs.layout,sourceLayoutJson=JSON.stringify(sourceLayoutPack);
  const buttonLayout=sourceButtonPack.layouts.I_TopLTs,buttonClip=sourceButtonPack.animations.I_TopLTs_Select;
  assert.deepEqual(settingsDirectButtonClip(buttonLayout,buttonClip).shares,[]);
  assert.throws(()=>settingsDirectButtonClip({...buttonLayout,groups:[...buttonLayout.groups,{name:'AS_Picture_00',panes:[],children:[]}]},buttonClip),/explicit composition/);
  assert.throws(()=>settingsDirectButtonClip(buttonLayout,{...buttonClip,shares:[{sourcePane:'Unknown',targetGroup:'Unknown'}]}),/explicit composition/);
  const images=new Map();for(const p of photos)images.set(p.src,await loadImage(join(repo,'public',p.src)));
  const requestedImages=[];
  const image=(ctx,url,x,y,w,h)=>{requestedImages.push(url);const im=images.get(url);if(!im)return false;const scale=Math.min(w/im.width,h/im.height);ctx.drawImage(im,x+(w-im.width*scale)/2,y+(h-im.height*scale)/2,im.width*scale,im.height*scale);return true;};
  const reports=[],soundBottoms=new Map(),healthBottoms=new Map(),sheet=createCanvas(400*views.length,480),sheetContext=sheet.getContext('2d');
  for(const [index,view] of views.entries()){
   const top=createCanvas(400,240),bottom=createCanvas(320,240),id=view.verificationId??view.appId+'-'+view.screen;
   requestedImages.length=0;
   drawStockScreenFrame(top.getContext('2d'),bottom.getContext('2d'),view,{font,image,...(view.appId==='sound'&&view.screen==='main'?{date:new Date(2026,8,24,10,52)}:{}),native:view.appId==='system-settings'?assets.renderer:view.appId==='sound'?soundAssets.renderer:view.appId==='camera'?cameraAssets.renderer:view.appId==='health-safety'?healthAssets.renderer:view.appId==='browser'?browserAssets.renderer:view.appId==='miiverse'?miiverseAssets.renderer:undefined});
   if(id==='sound-playback')assert.deepEqual(requestedImages,[photos[0].src],'Sound loads artwork, never the audio URL, as an image');
   if(view.appId==='sound')soundBottoms.set(id,bottom.getContext('2d').getImageData(0,0,320,240).data);
   if(view.appId==='health-safety'&&view.screen==='document')healthBottoms.set(id,{pixels:bottom.getContext('2d').getImageData(0,0,320,240).data,article:view.data.article});
   writeFileSync(join(out,id+'-top.png'),top.toBuffer('image/png'));writeFileSync(join(out,id+'-bottom.png'),bottom.toBuffer('image/png'));
   sheetContext.drawImage(top,index*400,0);sheetContext.drawImage(bottom,index*400+40,240);
   reports.push({id,topSha256:createHash('sha256').update(top.getContext('2d').getImageData(0,0,400,240).data).digest('hex'),bottomSha256:createHash('sha256').update(bottom.getContext('2d').getImageData(0,0,320,240).data).digest('hex')});
  }
  writeFileSync(join(out,'contact-sheet.png'),sheet.toBuffer('image/png'));
  assert.notEqual(reports.find(r=>r.id==='sound-playback').bottomSha256,reports.find(r=>r.id==='sound-paused').bottomSha256,'native play and pause artwork differ');
  const soundBottom=id=>reports.find(r=>r.id===id).bottomSha256;
  // Unclipped article text is covered by the later title and BtmBtn_White artwork; SlideBar_Select recolours only the thumb.
  const healthDiff=(a,b)=>{const out=[];for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])out.push([(i/4)%320,Math.floor(i/1280)]);return out;};
  for(const [a,b]of [['health-3d-top','health-3d-interior'],['health-3d-top','health-3d-end'],['health-usage-second-warning','health-usage-end']]){
   const changed=healthDiff(healthBottoms.get(a).pixels,healthBottoms.get(b).pixels);
   assert.ok(changed.length&&changed.every(([,y])=>y>=28&&y<212),`${a}/${b} scrolling leaves the title and Back bar untouched`);
  }
  const pressed=healthBottoms.get('health-general-thumb-pressed'),released=healthBottoms.get('health-general-thumb-released'),thumbCentre=120-pressed.article.thumbY;
  assert.equal(pressed.article.thumbY,released.article.thumbY);assert.deepEqual([pressed.article.selectFrame,released.article.selectFrame],[1,0]);
  const thumbChanges=healthDiff(pressed.pixels,released.pixels);
  assert.ok(thumbChanges.length&&thumbChanges.every(([x,y])=>x>=296&&Math.abs(y-thumbCentre)<=11),'SlideBar_Select changes only the 22px thumb');
  assert.deepEqual(Object.fromEntries(Object.entries(healthMetrics).map(([k,v])=>[k,v.maxScroll])),{'3d':1827,general:6846,usage:4200});
  assert.equal(new Set(['sound-playback','sound-mode-no-loop','sound-mode-single','sound-mode-random'].map(soundBottom)).size,4,'each supported playback mode paints a distinct source loop icon');
  assert.equal(new Set(['sound-seek-start','sound-playback','sound-seek-end'].map(soundBottom)).size,3,'the source C_SldT handle follows the playback position');
  assert.notEqual(soundBottom('sound-error'),soundBottom('sound-paused'),'the source Could-not-play dialog is visible over the paused player');
  assert.equal(reports.find(r=>r.id==='sound-main').topSha256===reports.find(r=>r.id==='sound-library').topSha256,false,'an empty library shows no track panels');
  assert.notEqual(reports.find(r=>r.id==='camera-main').topSha256,reports.find(r=>r.id==='camera-empty').topSha256,'folder and empty Camera uppers differ');
  assert.notEqual(reports.find(r=>r.id==='camera-gallery').topSha256,reports.find(r=>r.id==='camera-main').topSha256,'gallery Camera upper is not the folder summary');
  // S_Play_D-Effect -B-EjyP0/-B-EjyP1 sit at (∓54, 27) from the lower-screen centre with 72 × 74 GrpEjy frames.
  const effect=createCanvas(320,240),effectContext=effect.getContext('2d');
  assert.ok(soundAssets.renderer.draw(effectContext,'sound-player','S_Play_D-Effect',{bindings:[{name:'S_Play_D-Effect_Default',frame:0}]}),'the source Effect layout renders');
  const effectPixels=effectContext.getImageData(0,0,320,240).data,effectPanes=[[70,56,142,130],[178,56,250,130]],effectBounds=effectPanes.map(()=>null),opaque=[];
  for(let y=0;y<240;y++)for(let x=0;x<320;x++){
   const i=(y*320+x)*4;if(!effectPixels[i+3])continue;
   const pane=effectPanes.findIndex(([x0,y0,x1,y1])=>x>=x0&&x<x1&&y>=y0&&y<y1);assert.notEqual(pane,-1,`Effect pixel ${x},${y} lies outside its source panes`);
   const b=effectBounds[pane]??={x0:x,y0:y,x1:x,y1:y};b.x0=Math.min(b.x0,x);b.y0=Math.min(b.y0,y);b.x1=Math.max(b.x1,x);b.y1=Math.max(b.y1,y);
   if(effectPixels[i+3]===255)opaque.push(i);
  }
  assert.ok(effectBounds.every(Boolean)&&effectBounds[0].x0+effectBounds[1].x1===319&&effectBounds[0].y0===effectBounds[1].y0,'both Effect buttons render symmetrically about the screen centre');
  const restingPlayback=['sound-playback','sound-paused','sound-mode-no-loop','sound-mode-single','sound-mode-random','sound-seek-start','sound-seek-end'];
  for(const id of restingPlayback){const frame=soundBottoms.get(id);assert.ok(opaque.every(i=>frame[i]===effectPixels[i]&&frame[i+1]===effectPixels[i+1]&&frame[i+2]===effectPixels[i+2]),`${id} shows the resting Effect panel unmodified`);}
  const libraryBottom=soundBottoms.get('sound-main');assert.ok(opaque.some(i=>libraryBottom[i]!==effectPixels[i]||libraryBottom[i+1]!==effectPixels[i+1]||libraryBottom[i+2]!==effectPixels[i+2]),'the library does not draw the playback Effect panel');
  writeFileSync(join(out,'sound-effect-panel.png'),effect.toBuffer('image/png'));
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
  const report={passed:true,sourceHashes,reports,soundEffectPanel:{bounds:effectBounds,opaquePixels:opaque.length,restingPlayback},diagnostics,gaps:['Settings native source assembly is not a matched native LCD capture.','Camera folder upper uses source P_FinderVS_U; gallery/photo replace the native viewfinder framebuffer with portfolio pixels. Settled six-cell centres follow the source; page motion and the Back/Open footer remain adapters.','Sound transport, playback-mode panel, C_SldT slider, resting Effect panel, Open, Back and the Could-not-play dialog sit at source mounts; the Effect buttons are inert, and list row pitch, the mode cycle order and the absent pull cord, speed/pitch plate, filters, percussion and upper-screen visualisers are adaptations.','Health articles scroll continuously with the replayed glyph layout, warning icons, SlideBar and input model; boundary/row-tick sounds are unpublished and no native frame comparison is claimed. Remaining stock title layouts are pending.','Browser and Miiverse display local chrome only; website content and remote feeds are not present.','Playback specimen is synthetic validation only; no user track is supplied.']};
  writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{miiverseAssets?.dispose();browserAssets?.dispose();healthAssets?.dispose();cameraAssets?.dispose();soundAssets?.dispose();assets?.dispose();font?.dispose();globalThis.fetch=oldFetch;URL.createObjectURL=oldObjectURL;URL.revokeObjectURL=oldRevokeURL;for(const [name,descriptor]of Object.entries(previousGlobals)){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values}=parseArgs({options:Object.fromEntries(['artifact-dir','asset-root','canvas-module','font-manifest'].map(k=>[k,{type:'string'}]))});
 console.log(JSON.stringify(await verifyStockScreens(Object.fromEntries(Object.entries(values).map(([k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]))),null,2));
}
