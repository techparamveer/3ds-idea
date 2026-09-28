import test from 'node:test';
import assert from 'node:assert/strict';
import {createStockModule,initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';
import {settingsLanguageOffset,settingsLanguageThumbY} from '../src/os/stock-settings-navigation.ts';
import {stockSettingsLanguageThumbAt} from '../src/os/stock-screen-layout.ts';
const module=createStockModule(getTitle('system-settings'));
const ctx={now:0,shared:initialSharedData()};
const leaf=()=>({screen:'detail',field:'language',parent:'other',page:3,selection:0,languageTop:0});
const send=(state,event)=>module.reduce(state,event,ctx);
const touch=(state,phase,y,x=304,pointerId=7)=>send(state,{type:'touch',phase,x,y,pointerId}).state;
const tick=(state,elapsedMs)=>send(state,{type:'tick',elapsedMs}).state;

test('source thumb hit region follows the applied position and rejects groove/arrows',()=>{
 assert.equal(settingsLanguageThumbY(leaf()),20);
 for(const y of [29,80,132.999])assert.equal(stockSettingsLanguageThumbAt(20,304,y),true);
 for(const [x,y]of [[291.999,80],[316,80],[304,28.999],[304,133],[304,17],[304,185]])assert.equal(stockSettingsLanguageThumbAt(20,x,y),false);
 assert.equal(stockSettingsLanguageThumbAt(-20,304,172.999),true);
 assert.equal(stockSettingsLanguageThumbAt(-20,304,173),false);
});
test('captured thumb preserves its grab offset, traverses all rows, and clamps outside the LCD',()=>{
 let state=touch(leaf(),'down',80);assert.equal(settingsLanguageThumbY(state),20);
 state=touch(state,'move',90);assert.equal(state.languageTop,1);assert.equal(settingsLanguageOffset(state),0);
 state=touch(state,'move',120);assert.equal(state.languageTop,4);assert.equal(settingsLanguageThumbY(state),-20);
 state=touch(state,'move',900,-50);assert.equal(state.languageTop,4);
 state=touch(state,'move',-900,400);assert.equal(state.languageTop,0);
 state=touch(state,'up',-900,400);assert.equal(state.languageDragStartY,undefined);
 assert.deepEqual(module.save(state),{});assert.equal(module.view(state,ctx).data.settings.language,'English');
});
test('half-row rounding retains a signed offset and release snaps eight source pixels per update',()=>{
 let state=touch(leaf(),'down',80);state=touch(state,'move',85);
 assert.equal(state.languageTop,1);assert.equal(settingsLanguageOffset(state),-22);
 state=touch(state,'up',500);assert.equal(state.languageTop,1);assert.equal(settingsLanguageOffset(state),-22,'release consumes the last applied sample, never the off-target release position');
 state=tick(state,1000/60);assert.equal(settingsLanguageOffset(state),-14);
 state=tick(state,1000/60);assert.equal(settingsLanguageOffset(state),-6);
 state=tick(state,1000/60);assert.equal(settingsLanguageOffset(state),0);assert.equal(state.languageSnapFrom,undefined);
 const once=tick(touch(touch(touch(leaf(),'down',80),'move',85),'up',85),50);assert.deepEqual(once,state);
});
test('drag ownership excludes other pointers and actions and cannot activate Back at release',()=>{
 let state=touch(leaf(),'down',80);state=touch(state,'move',87.5);
 const before=state;
 for(const event of [{type:'touch',phase:'move',x:304,y:120,pointerId:8},{type:'touch',phase:'up',x:60,y:225,pointerId:8},{type:'action',id:'language-down'}])assert.equal(send(state,event).state,before);
 assert.deepEqual(send(state,{type:'tick',elapsedMs:1000}).state,{...before,settingsHudElapsedMs:1000},'HUD time advances without changing the drag state');
 state=touch(state,'up',225,60);assert.equal(state.screen,'detail');assert.equal(state.languageDragPointer,undefined);
 state=tick(state,50);const back=send(state,{type:'action',id:'back'}).state;
 assert.equal(back.page,3);assert.equal(back.screen,'other');assert.equal(back.languageTop,undefined);
});
test('cancel and lifecycle clear captured input and residual motion without shared writes',()=>{
 const before=structuredClone(ctx.shared);
 const dragged=touch(touch(leaf(),'down',80),'move',85);
 for(const event of [{type:'touch',phase:'cancel',x:NaN,y:NaN,pointerId:7},...['suspend','sleep','close'].map(phase=>({type:'lifecycle',phase}))]){
  const out=send(dragged,event);assert.equal(out.effects,undefined);assert.equal(out.state.languageDragStartY,undefined);assert.equal(settingsLanguageOffset(out.state),0);assert.equal(out.state.languageTop,1);
 }
 assert.deepEqual(ctx.shared,before);
});
test('uncaptured moves, invalid samples, and non-Language screens cannot drag the list',()=>{
 const state=leaf();for(const phase of ['move','up'])assert.equal(touch(state,phase,80),state);
 assert.equal(touch(state,'down',NaN),state);
 const moving=touch(state,'down',80);assert.equal(touch(moving,'move',Infinity),moving);
 for(const elapsedMs of [0,-1,NaN,Infinity])assert.equal(tick(moving,elapsedMs),moving);
 const other={...state,field:'sound'};assert.equal(touch(other,'down',80),other);
});
test('untouched centred entry retains its source layout pose until the first applied drag sample',()=>{
 const {languageTop,...initial}=leaf();assert.equal(settingsLanguageThumbY(initial),0);
 let state=touch(initial,'down',100);assert.equal(settingsLanguageThumbY(state),0);
 state=touch(state,'move',100);assert.equal(state.languageTop,2);assert.equal(settingsLanguageOffset(state),0);
});
