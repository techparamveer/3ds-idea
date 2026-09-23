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
test('music controls and seek surface are separate, bounded, finite targets',()=>{
 const v=view('sound','playback',[]);
 assert.equal(hit(v,160,150),'play');assert.equal(hit(v,60,195),'repeat');assert.equal(hit(v,250,195),'shuffle');
 assert.equal(seek(v,30,106),0);assert.equal(seek(v,160,106),.5);assert.equal(seek(v,290,106),1);
 assert.equal(seek(v,291,106),null);assert.equal(seek(v,NaN,106),null);assert.equal(seek(view('camera','photo',[]),160,106),null);
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
 assert.equal(hit(parental,160,138),'next');assert.equal(hit(parental,160,178),'back');assert.equal(hit(parental,160,158),null);
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
