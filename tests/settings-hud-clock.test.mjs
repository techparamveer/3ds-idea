import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleSettingsHud,settingsHudUpdate,SETTINGS_HUD_HZ} from '../src/os/stock-settings-hud.ts';
import {chargingBatteryFrame,hudColonVisible} from '../src/os/device-status-profile.ts';
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
test('constructor first update has no proven previous-seconds owner; Date(0) does not follow lcdDate',()=>{
 const odd=new Date(2026,8,26,21,45,41).getTime(),even=odd+1000;
 const fromOdd=sampleSettingsHud(null,0,odd),fromEven=sampleSettingsHud(null,0,even);
 assert.equal(new Date(0).getSeconds(),0);
 assert.equal(fromOdd.colonVisible,true,'+e5 is unwritten; first colon uses the Date(0) even adaptation');
 assert.equal(fromEven.colonVisible,true);
 assert.notEqual(fromOdd.colonVisible,hudColonVisible(new Date(odd).getSeconds()));
 assert.equal(fromOdd.batteryFrame,chargingBatteryFrame(new Date(odd).getSeconds()));
 assert.equal(fromEven.batteryFrame,chargingBatteryFrame(new Date(even).getSeconds()));
 assert.equal(fromOdd.counter,29);
 assert.notEqual(fromOdd.batteryFrame,fromEven.batteryFrame,'Bat on counter -1 uses the new sample, not previous seconds');
});
test('HudMset previous-seconds colon and counter-2 Bat do not follow injected lcdDate even/odd',()=>{
 const page3=new Date(2026,8,26,21,45,42,533).getTime(),page4=new Date(2026,8,26,21,46,7,466).getTime();
 const hud3=sampleSettingsHud(null,12000,page3),hud4=sampleSettingsHud(null,12000,page4);
 const sec3=new Date(page3).getSeconds(),sec4=new Date(page4).getSeconds();
 assert.equal(sec3,42);assert.equal(sec4,7);
 assert.equal(hudColonVisible(sec3),true);assert.equal(chargingBatteryFrame(sec3),5);
 assert.equal(hudColonVisible(sec4),false);assert.equal(chargingBatteryFrame(sec4),4);
 assert.notEqual(hud3.colonVisible,hudColonVisible(sec3),'page 3 colon is previous displayed seconds, not 42');
 assert.notEqual(hud3.batteryFrame,chargingBatteryFrame(sec3),'page 3 Bat is the counter-2 cached sample, not 42');
 assert.notEqual(hud4.colonVisible,hudColonVisible(sec4),'page 4 colon is previous displayed seconds, not 07');
 assert.notEqual(hud4.batteryFrame,chargingBatteryFrame(sec4),'page 4 Bat is the counter-2 cached sample, not 07');
 assert.equal(hud3.updates,Math.floor(12000*SETTINGS_HUD_HZ/1000));
 assert.equal(hud3.colonVisible,false);assert.equal(hud3.batteryFrame,4);
 assert.equal(hud4.colonVisible,true);assert.equal(hud4.batteryFrame,5);
});
