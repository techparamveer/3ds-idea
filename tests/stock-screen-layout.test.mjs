import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../src/os/stock-screen-layout.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {stockScreenTargets:targets,stockScreenActionAt:hit,stockScreenSeekAt:seek}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const view=(appId,screen,ids,selection=0)=>({appId,screen,heading:'',rows:ids.map(id=>({id,label:id})),selection,footer:{left:{label:'Back',action:'back'}}});
test('Settings targets follow the native top bar and four tiles regardless of row order',()=>{
 const v=view('system-settings','main',['internet','parental','data','other','nnid']);
 for(const r of targets(v))assert.equal(hit(v,r.x+r.width/2,r.y+r.height/2),r.action);
 assert.equal(hit(v,160,15),'nnid');assert.equal(hit(v,159,80),null);assert.equal(hit(v,35,230),'back');
});
test('Data Management empty lists expose only the Base_D_00 Back control',()=>{
 for(const field of ['software','extra-data']){
  const v={...view('system-settings','detail',[]),data:{field,parent:'data-3ds'}};
  assert.deepEqual(targets(v),[{action:'back',x:0,y:208,width:120,height:32}]);
  assert.equal(hit(v,160,120),null);assert.equal(hit(v,190,225),null);
 }
});
test('gallery paging uses six visible cells and leaves gaps without accidental activation',()=>{
 const v=view('camera','gallery',Array.from({length:9},(_,i)=>'photo:'+i),7);
 assert.deepEqual(targets(v).filter(r=>r.row!==undefined).map(r=>r.action),['photo:6','photo:7','photo:8']);
 assert.equal(hit(v,50,70),'photo:6');assert.equal(hit(v,108,70),null);assert.equal(hit(v,50,170),null);
});
test('Health touch regions follow the three native precaution buttons and their gaps',()=>{
 const v=view('health-safety','main',['3d','general','usage']);
 assert.equal(hit(v,160,45),'3d');assert.equal(hit(v,160,109),'general');assert.equal(hit(v,160,173),'usage');
 assert.equal(hit(v,160,77),null);assert.equal(hit(v,35,109),null);assert.equal(hit(v,284,109),null);
});
test('music controls follow the source CtrPanel3, mode panel, Back and C_SldT bounds',()=>{
 const v=view('sound','playback',['play','previous','next','mode']);v.footer.right={label:'OK',action:'play'};
 assert.equal(hit(v,160,208),'play');assert.equal(hit(v,114,208),'previous');assert.equal(hit(v,205,208),'next');assert.equal(hit(v,275,224),'mode');assert.equal(hit(v,45,225),'back');
 assert.equal(hit(v,132,208),null);assert.equal(hit(v,188,208),null);assert.equal(hit(v,225,224),null);assert.equal(hit(v,160,100),null);assert.equal(hit(v,95,225),null);
 assert.equal(seek(v,20,159),0);assert.equal(seek(v,160,159),.5);assert.equal(seek(v,300,159),1);assert.equal(hit(v,160,159),null);
 assert.equal(seek(v,301,159),null);assert.equal(seek(v,160,149),null);assert.equal(seek(v,NaN,159),null);assert.equal(seek(view('camera','photo',[]),160,159),null);
 assert.deepEqual(targets(v).map(r=>r.action),['previous','play','next','mode','back']);
});
test('the source Could-not-play dialog leaves OK as the only Sound control',()=>{
 const v={...view('sound','playback',['play']),footer:{left:{label:'Back',action:'back'},right:{label:'OK',action:'error-ok'}},data:{mediaError:true}};
 assert.deepEqual(targets(v).map(r=>r.action),['error-ok']);
 assert.equal(hit(v,160,204),'error-ok');assert.equal(hit(v,160,208),'error-ok');assert.equal(hit(v,45,225),null);assert.equal(hit(v,160,225),null);assert.equal(seek(v,160,159),null);
});
test('Sound library pages three rows above the source Open button and keeps Back at its native width',()=>{
 const v=view('sound','main',['track:a','track:b','track:c','track:d'],3);v.footer.right={label:'OK',action:'track:d'};
 assert.deepEqual(targets(v).filter(r=>r.row!==undefined).map(r=>r.action),['track:d']);
 assert.equal(hit(v,160,49),'track:d');assert.equal(hit(v,160,208),'track:d');assert.equal(hit(v,45,225),'back');assert.equal(hit(v,97,208),null);assert.equal(hit(v,160,165),null);
 const first=view('sound','main',['track:a','track:b','track:c','track:d']);first.footer.right={label:'OK',action:'track:a'};
 assert.equal(hit(first,160,49),'track:a');assert.equal(hit(first,160,88),'track:b');assert.equal(hit(first,160,127),'track:c');
 const empty=view('sound','main',[]);assert.deepEqual(targets(empty).map(r=>r.action),['back']);
});

test('empty Notifications full-width native Close button returns HOME across its full width',()=>{
 const view={appId:'notifications',screen:'main',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}}};
 for(const x of [0,160,319])assert.equal(hit(view,x,226),'back');
 assert.equal(hit(view,160,211),null);
});
test('Game Notes uses the source four-by-four grid and a single full-width Close footer',()=>{
 const v=view('game-notes','main',Array.from({length:16},(_,i)=>String(i)));
 v.footer.right={label:'OK',action:'0'};
 assert.equal(hit(v,42,30),'0');assert.equal(hit(v,279,183),'15');assert.equal(hit(v,80,30),null);
 assert.equal(hit(v,250,226),'back');assert.equal(targets(v).length,17);
 assert.equal(hit(view('memo','main',['0']),42,30),null);
});
test('Browser source menu mounts and Miiverse toolbar map to their visible destinations',()=>{
 const browser=view('browser','main',['search','bookmarks','add-bookmark','settings','page-info','address']);
 for(const r of targets(browser))assert.equal(hit(browser,r.x+r.width/2,r.y+r.height/2),r.action);
 assert.equal(hit(browser,160,106),null);assert.equal(hit(browser,109,181),null);assert.equal(hit(browser,200,226),null);
 const miiverse=view('miiverse','main',['communities','activity','profile','notifications']);
 assert.equal(hit(miiverse,32,226),'communities');assert.equal(hit(miiverse,224,226),'notifications');assert.equal(hit(miiverse,288,226),'back');
 assert.equal(hit(view('miiverse','detail',[]),32,226),null);
});

test('Friend List touches follow the source card and curved Close button',()=>{
 const v=view('friends','main',['profile']);
 assert.equal(hit(v,160,147),'profile');assert.equal(hit(v,20,57),null);
 assert.equal(hit(v,160,210),'back');assert.equal(hit(v,26,236),'back');
 assert.equal(hit(v,26,210),null);assert.equal(hit(v,295,236),null);
 assert.equal(hit(view('friends','detail',[]),160,147),null);
});
test('Settings Internet and introductory Parental Controls use source child buttons and gaps',()=>{
 const internet=view('system-settings','internet',['connections','spotpass','ds-connections','internet-info']);
 assert.equal(hit(internet,160,56),'connections');assert.equal(hit(internet,160,119),'spotpass');assert.equal(hit(internet,160,152),'ds-connections');assert.equal(hit(internet,160,185),'internet-info');
 assert.equal(hit(internet,160,99),null);assert.equal(hit(internet,80,226),'back');assert.equal(hit(internet,200,226),null);
 const parental=view('system-settings','parental',['next','back']);
 assert.equal(hit(parental,260,226),'next');assert.equal(hit(parental,60,226),'back');assert.equal(hit(parental,160,226),null);assert.equal(hit(parental,260,207),null);assert.equal(hit(parental,160,138),null);
});
test('Settings submenus retain native geometry and bounded page arrows',()=>{
 const data=view('system-settings','data',['data-3ds','data-dsi','streetpass','blocked-users']);
 assert.equal(hit(data,92,56),'data-3ds');assert.equal(hit(data,240,56),'data-dsi');assert.equal(hit(data,171,56),null);assert.equal(hit(data,160,128),'streetpass');
 const connections=view('system-settings','connections',['connection-1','connection-2','connection-3','new-connection']);
 assert.equal(hit(connections,160,52),'new-connection');assert.equal(hit(connections,58,150),'connection-1');assert.equal(hit(connections,262,150),'connection-3');
 const other=view('system-settings','other',['profile','clock','touch']);other.data={page:0};
 assert.equal(hit(other,160,70),'profile');assert.equal(hit(other,160,119),'clock');assert.equal(hit(other,160,167),'touch');assert.equal(hit(other,306,115),'settings-next');assert.equal(hit(other,14,115),null);
 other.data.page=3;assert.equal(hit(other,14,115),'settings-previous');assert.equal(hit(other,306,115),null);
 const detail=view('system-settings','detail',[]);assert.equal(hit(detail,80,225),'back');assert.equal(hit(detail,220,225),null);
});

test('service source buttons and readonly profile footer have no generic row targets',()=>{
 const shop=view('eshop','main',['back']);assert.equal(hit(shop,160,209),'back');assert.equal(hit(shop,84,209),null);assert.equal(hit(shop,250,226),null);
 const zone=view('nintendo-zone','main',['scan','information']);assert.equal(hit(zone,160,73),'scan');assert.equal(hit(zone,160,154),'information');assert.equal(hit(zone,160,125),null);assert.equal(hit(zone,50,226),'back');assert.equal(hit(zone,160,226),null);
 const profile=view('friends','profile',[]);assert.equal(hit(profile,160,226),'back');assert.equal(hit(profile,160,146),null);
});

test('selected Notes exposes only its native Back and Switch controls',()=>{
 const v=view('game-notes','drawing',[]);assert.equal(hit(v,22,226),'back');assert.equal(hit(v,70,226),null);assert.equal(hit(v,160,110),null);assert.equal(hit(v,252,226),'switch');assert.equal(hit(v,298,226),null);
});

test('readonly helper entry screens expose only their source Back button',()=>{
 for(const [id,width,y]of [['nnid-settings',64,212],['system-updater',120,208]]){const v=view(id,'main',[]);assert.equal(hit(v,width-1,226),'back');assert.equal(hit(v,width,226),null);assert.equal(hit(v,35,y-1),null);assert.equal(hit(v,160,80),null);}
});

test('Transfer and Circle Pad targets follow native choice mounts and Back bars',()=>{
 const transfer=view('system-transfer','main',['3ds','dsi']);
 assert.equal(hit(transfer,160,40),'3ds');assert.equal(hit(transfer,160,140),'dsi');
 assert.equal(hit(transfer,160,90),null);assert.equal(hit(transfer,30,225),'back');
 assert.equal(hit(view('system-transfer','detail',[]),160,40),null);
 const circle=view('extrapad','main',['information']);
 assert.equal(hit(circle,159,226),'back');assert.equal(hit(circle,160,226),'information');
 assert.equal(hit(circle,160,180),null);assert.equal(hit(view('extrapad','detail',[]),300,226),'back');
});

test('Manual and selectors expose only their visible native controls',()=>{
 const manual=view('manual','main',['intro','controls','about']);
 assert.equal(hit(manual,160,70),'intro');assert.equal(hit(manual,160,115),'controls');assert.equal(hit(manual,300,226),'back');
 const page=view('manual','document',[]);assert.equal(hit(page,100,226),'back');assert.equal(hit(page,200,226),null);
 for(const id of ['mii-selector','photo-selector','sound-selector']){
  const v=view(id,'main',['saved']);assert.equal(hit(v,50,226),'back');assert.equal(hit(v,240,226),null);assert.equal(hit(v,160,75),null);
 }
});

test('Date and Time targets match the original large B_L buttons',()=>{
 const clock=view('system-settings','clock',['date','time']);
 assert.equal(hit(clock,160,27),'date');assert.equal(hit(clock,291,92),'date');
 assert.equal(hit(clock,160,93),null);assert.equal(hit(clock,160,122),null);
 assert.equal(hit(clock,28,123),'time');assert.equal(hit(clock,291,188),'time');
 assert.equal(hit(clock,160,189),null);assert.equal(hit(clock,27,60),null);
});

test('DS Profile uses its full-width legacy Back footer while its read-only rows remain inert',()=>{
 const v={...view('system-settings','detail',[]),data:{field:'ds-profile'}};
 for(const x of [0,160,319])assert.equal(hit(v,x,226),'back');
 assert.equal(hit(v,160,88),null);assert.equal(hit(v,160,148),null);assert.equal(hit(v,160,207),null);
});

test('read-only native date time and birthday keep Cancel active and editing controls inert',()=>{
 for(const field of ['date','time','birthday']){
  const v={...view('system-settings','detail',[]),data:{field}};
  assert.equal(hit(v,60,224),'back',field);
  for(const [x,y] of [[260,224],[116,55],[203,55],[116,150],[203,150]])assert.equal(hit(v,x,y),null,field);
 }
});

test('parental explanation and modal targets follow source footer and isolate the obscured page',()=>{
 const explanation=view('system-settings','parental-explain',['next','back']);
 assert.equal(hit(explanation,260,224),'next');assert.equal(hit(explanation,60,224),'back');
 assert.equal(hit(explanation,160,224),null);assert.equal(hit(explanation,160,120),null);
 const notice=view('system-settings','parental-pin-notice',['back']);
 for(const x of [10,160,309])assert.equal(hit(notice,x,208),'back');
 for(const [x,y] of [[9,208],[310,208],[160,187],[160,228],[260,234],[60,234]])assert.equal(hit(notice,x,y),null);
});
