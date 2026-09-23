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
