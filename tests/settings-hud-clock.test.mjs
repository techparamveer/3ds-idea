import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleSettingsHud,settingsHudUpdate,SETTINGS_HUD_HZ} from '../src/os/stock-settings-hud.ts';
import {createStockModule,initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';
const start=new Date(2026,8,26,3,32,20).getTime();

test('source sampled counter reproduces genuine 25 → 26 → 27 settled HUD alternation',()=>{
 let state=null;
 // These fractional seconds are the three genuine Azahar screenshot stamps.
 // The expected phase is independently visible: odd screenshots are identical,
 // and each adjacent pair differs by colon32 + battery137 pixels.
 for(const [elapsed,battery,colon] of [[5868,4,false],[6856,5,true],[7825,4,false]]){
  state=sampleSettingsHud(state,elapsed,start+elapsed);
  assert.deepEqual([state.batteryFrame,state.colonVisible],[battery,colon]);
 }
});
test('date/colon and battery retain their distinct source refresh branches',()=>{
 const odd=new Date(2026,8,26,3,32,25).getTime(),even=odd+1000;
 let state={updates:0,counter:2,dateMs:odd,displayedDateMs:odd,colonVisible:false,batteryFrame:5};
 state=settingsHudUpdate(state,even);assert.equal(state.batteryFrame,4,'counter2 uses retained odd sample');assert.equal(state.dateMs,odd);
 state=settingsHudUpdate(state,even);assert.equal(state.counter,0);assert.equal(state.dateMs,odd);
 state=settingsHudUpdate(state,even);assert.equal(state.counter,29);assert.equal(state.dateMs,even);assert.equal(state.batteryFrame,4,'counter0 does not refresh battery');assert.equal(state.colonVisible,false,'counter0 colon uses previous displayed odd seconds');
 for(let i=0;i<28;i++)state=settingsHudUpdate(state,even);
 assert.equal(state.batteryFrame,5);assert.equal(state.colonVisible,false,'battery refresh cannot alter colon');
 for(let i=0;i<2;i++)state=settingsHudUpdate(state,even);
 assert.equal(state.colonVisible,true,'following date refresh observes previous even displayed seconds');
});
test('repaint and clock changes do not bypass retained samples; local reset initializes a new sampler',()=>{
 const first=sampleSettingsHud(null,1000,start+1000);
 assert.equal(sampleSettingsHud(first,1000,start+61000),first);
 const reset=sampleSettingsHud(first,0,start+120000);assert.equal(reset.updates,0);assert.equal(reset.counter,29);
 assert.throws(()=>sampleSettingsHud(null,0,NaN),/calendar/);
 const split=sampleSettingsHud(sampleSettingsHud(null,517,start+517),1000,start+1000);
 assert.deepEqual(split,first,'intermediate paints cannot change the sampled sequence');
 assert.equal(sampleSettingsHud(null,1000,start+1000).updates,Math.floor(SETTINGS_HUD_HZ));
});
test('Settings-local elapsed survives navigation and resets on creation',()=>{
 const module=createStockModule(getTitle('system-settings')),context={now:900000,shared:initialSharedData()};
 let state=module.create({},null,context);assert.equal(state.settingsHudElapsedMs,0);
 state=module.reduce(state,{type:'tick',elapsedMs:1000},context).state;
 state=module.reduce(state,{type:'action',id:'other'},context).state;
 state=module.reduce(state,{type:'tick',elapsedMs:500},context).state;
 assert.equal(state.settingsHudElapsedMs,1500);assert.equal(module.view(state,context).data.settingsHudElapsedMs,1500);
 assert.equal(module.create({},state,{...context,now:2000000}).settingsHudElapsedMs,0);
});
