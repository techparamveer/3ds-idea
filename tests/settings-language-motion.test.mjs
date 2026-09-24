import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createStockModule,initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';
import {languageScroll} from '../src/os/stock-settings-navigation.ts';
import {poseNativeLayout} from '../src/os/native-layout.ts';
const module=createStockModule(getTitle('system-settings'));
const context={now:0,shared:initialSharedData()};
const initial=()=>({screen:'detail',field:'language',parent:'other',page:3,selection:0});
const act=(state,id)=>module.reduce(state,{type:'action',id},context);
const tick=(state,elapsedMs)=>module.reduce(state,{type:'tick',elapsedMs},context);
test('Language commits one row after the source clip and ignores overlapping arrows',()=>{
 const shared=structuredClone(context.shared);let state=act(initial(),'language-down').state;
 assert.deepEqual(languageScroll(state),{from:0,to:1,direction:1,frame:0});
 assert.equal(act(state,'language-down').state,state);assert.equal(act(state,'language-up').state,state);
 state=tick(state,17).state;assert.equal(languageScroll(state).frame,1);assert.equal(state.languageTop,0);
 state=tick(state,17).state;assert.equal(languageScroll(state).frame,2);assert.equal(state.languageTop,0);
 for(const delta of [NaN,Infinity,-1,0])assert.equal(tick(state,delta).state,state);
 const done=tick(state,16);assert.equal(done.state.languageTop,1);assert.equal(languageScroll(done.state),null);assert.equal(done.effects,undefined);
 assert.equal(tick(done.state,1000).state,done.state);
 assert.deepEqual(module.save(done.state),{});assert.deepEqual(context.shared,shared);
 const up=act(done.state,'language-up').state;assert.equal(languageScroll(up).direction,-1);
 assert.equal(tick(up,1000).state.languageTop,0);
});
test('Language Back discards motion and suspend/sleep settle without changing locale',()=>{
 const moving=act(initial(),'language-down').state;
 for(const phase of ['suspend','sleep']){
  const result=module.reduce(moving,{type:'lifecycle',phase},context);assert.equal(result.state.languageTop,1);assert.equal(languageScroll(result.state),null);assert.equal(result.effects,undefined);
 }
 const back=act(moving,'back').state;assert.equal(back.screen,'other');assert.equal(back.page,3);
 const reopened=act(back,'language').state;assert.equal(reopened.languageTop,undefined);assert.equal(languageScroll(reopened),null);
 assert.equal(module.view(reopened,context).data.settings.language,'English');
 // D-pad, row selection, confirmation and thumb dragging remain outside this adapter.
 for(const command of ['up','down','open'])assert.equal(module.reduce(moving,{type:'command',command},context).state,moving);
 for(const id of ['eu_german','ok'])assert.equal(act(moving,id).state,moving);
});
test('Country source clips move exactly one row and bind only the list translation group',()=>{
 const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/settings/contents/0000-0000003d/layout.json',import.meta.url)));
 const find=(roots,name)=>roots.flatMap(p=>[p,...find(p.children,name)]).filter(p=>p.name===name);
 for(const [name,sign]of [['Country_D_00_ScrollDw',-1],['Country_D_00_ScrollUp',1]]){
  const clip=pack.animations[name];assert.equal(clip.frames,4);assert.deepEqual(clip.groups,['Group_01']);
  const ys=[0,1,2,3].map(frame=>find(poseNativeLayout(pack.layouts.Country_D_00,pack.animations,[{name,frame}]).roots,'Null_Slideanim')[0].translation[1]);
  assert.equal(ys[0],0);assert.equal(ys[3],sign*44);assert.ok(ys[1]*sign>0&&ys[1]*sign<ys[2]*sign&&ys[2]*sign<44);
 }
});
