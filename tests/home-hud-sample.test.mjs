import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import {
  REFERENCE_DEVICE_STATUS,
  chargingBatteryFrame,
  deviceStatusBatteryFrame,
  homeHudReducedMotionParityPaintDue,
  homeHudReducedMotionRepaintDue,
  hudColonVisible,
  hudSecondParity,
} from '../src/os/device-status-profile.ts';
import { HOME_REFERENCE_HUD_STATUS, homeHudColonVisible, validateHomeHudSample } from '../src/os/home-hud-sample.ts';
import { poseNativeLayout } from '../src/os/native-layout.ts';
import { settingsHudUpdate } from '../src/os/stock-settings-hud.ts';

const sourceUrl = new URL('../src/os/firmware-presentation.ts', import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const stub = 'data:text/javascript;base64,' + Buffer.from('export class NativeLayoutRenderer {}').toString('base64');
const source = outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_match, prefix, path, suffix) =>
  prefix + (path === './native-renderer' ? stub : new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href) + suffix);
const { createFirmwareHome } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const compile = name => ts.transpileModule(readFileSync(new URL(`../src/os/${name}.ts`, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const url = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const services = await import(url(compile('stock-native-services')
  .replace("'./native-layout'", JSON.stringify(url(compile('native-layout'))))
  .replace("'./stock-eshop-welcome'", JSON.stringify(url(compile('stock-eshop-welcome'))))
  .replace("'./device-status-profile'", JSON.stringify(url(compile('device-status-profile'))))));

const pack = name => JSON.parse(readFileSync(new URL(`../public/os/firmware/10.7.0-32E/packs/home/${name}.json`, import.meta.url)));
const hud = pack('hud');
const sample = Object.freeze({kind:'source-pose', evidence:'test pose; coins from profile audit; battery/signal/phase unverified', networkMessage:'lau_connect4', netModeFrame:4, netAtnFrame:8, batteryFrame:3, walkCoinFrame:180, coins:0, steps:0});
const odd = new Date(2026,8,26,4,14,35);
const even = new Date(2026,8,26,4,14,34);

test('declared reference profile is the single Internet/42/charging owner', () => {
  assert.equal(REFERENCE_DEVICE_STATUS.kind, 'reference-session-profile');
  assert.equal(REFERENCE_DEVICE_STATUS.networkMessage, 'lau_connect0');
  assert.deepEqual([REFERENCE_DEVICE_STATUS.netModeFrame, REFERENCE_DEVICE_STATUS.netAtnFrame], [0, 3]);
  assert.equal(REFERENCE_DEVICE_STATUS.charging, true);
  assert.equal(REFERENCE_DEVICE_STATUS.lowBattery, false);
  assert.equal(REFERENCE_DEVICE_STATUS.coins, 42);
  assert.equal(REFERENCE_DEVICE_STATUS.steps, 0);
  assert.match(REFERENCE_DEVICE_STATUS.evidence, /adaptation|not live telemetry|Isolated Azahar/i);
  assert.deepEqual(HOME_REFERENCE_HUD_STATUS, {
    networkMessage: REFERENCE_DEVICE_STATUS.networkMessage,
    netModeFrame: REFERENCE_DEVICE_STATUS.netModeFrame,
    netAtnFrame: REFERENCE_DEVICE_STATUS.netAtnFrame,
    batteryFrame: REFERENCE_DEVICE_STATUS.batteryFrame,
    coins: REFERENCE_DEVICE_STATUS.coins,
    steps: REFERENCE_DEVICE_STATUS.steps,
  });
});

test('HOME 0x27c6a8 seconds parity maps colon and charging G_Bat together', () => {
  assert.equal(homeHudColonVisible(34), true);
  assert.equal(homeHudColonVisible(35), false);
  assert.equal(hudColonVisible(0), true);
  assert.equal(homeHudColonVisible(36), true);
  assert.equal(chargingBatteryFrame(35), 4);
  assert.equal(chargingBatteryFrame(34), 5);
  assert.equal(deviceStatusBatteryFrame(REFERENCE_DEVICE_STATUS, 35), 4);
  assert.equal(deviceStatusBatteryFrame(REFERENCE_DEVICE_STATUS, 34), 5);
  assert.equal(deviceStatusBatteryFrame({...REFERENCE_DEVICE_STATUS, charging:false}, 34), 4);
});

test('Settings HUD sampler shares the 4/5 charging map on its cached seconds', () => {
  const oddMs = odd.getTime();
  const evenMs = even.getTime();
  let ctor = settingsHudUpdate({updates:-1, counter:-1, dateMs:oddMs, displayedDateMs:0, colonVisible:true, batteryFrame:4}, oddMs);
  assert.equal(ctor.counter, 29);
  assert.equal(ctor.batteryFrame, chargingBatteryFrame(odd.getSeconds()));
  let state = {updates:0, counter:2, dateMs:oddMs, displayedDateMs:oddMs, colonVisible:false, batteryFrame:5};
  state = settingsHudUpdate(state, evenMs);
  assert.equal(state.batteryFrame, chargingBatteryFrame(odd.getSeconds()));
  assert.equal(state.dateMs, oddMs);
  state = settingsHudUpdate({...state, counter:1, batteryFrame:4}, evenMs);
  assert.equal(state.batteryFrame, 4, 'counter 1 does not refresh battery');
  assert.equal(state.counter, 0);
  state = settingsHudUpdate(state, evenMs);
  assert.equal(state.batteryFrame, 4, 'counter 0 refreshes colon, not battery');
  assert.equal(state.dateMs, evenMs);
});

test('eShop and Zone HUD bindings read the same declared profile', () => {
  assert.deepEqual(services.eshopHudBindings(odd), [
    {name:'HudMenu_00_NetMode', frame:0}, {name:'HudMenu_00_NetAtn', frame:3}, {name:'HudMenu_00_Bat', frame:4},
  ]);
  assert.deepEqual(services.eshopHudBindings(even), [
    {name:'HudMenu_00_NetMode', frame:0}, {name:'HudMenu_00_NetAtn', frame:3}, {name:'HudMenu_00_Bat', frame:5},
  ]);
  assert.deepEqual(services.zoneHudBindings(odd, 0), [
    {name:'Hud_00_Bar_Appear', frame:15}, {name:'Hud_00_Charge_anim', frame:0}, {name:'Hud_00_Signal', frame:3},
  ]);
  assert.deepEqual(services.zoneHudBindings(odd, 1000), [
    {name:'Hud_00_Bar_Appear', frame:15}, {name:'Hud_00_Charge_anim', frame:60}, {name:'Hud_00_Signal', frame:3},
  ]);
  assert.deepEqual(services.eshopHudClock(even), {
    year:2026, month:9, day:26, hour:4, minute:14, colonVisible:true, batteryFrame:5,
  });
  assert.equal(services.eshopHudClock(odd).colonVisible, true);
  assert.deepEqual(services.zoneClock(odd, 0), {hour:'04', minute:'14', frame:0, batteryFrame:0});
  assert.deepEqual(services.zoneClock(odd, 1000), {hour:'04', minute:'14', frame:60, batteryFrame:1});
});

test('eShop and Zone shipped packs pose the charging Internet textures', () => {
  const maps = (posed, name) => posed.materials.find(m => m.name === name).textureMaps.map(map => posed.textures[map.texture]);
  const eshopPack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/eshop/contents/0000-0000006b/cad-Hud-arc-lz.json', import.meta.url)));
  const zonePack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/nintendo-zone/layout-nwcx.json', import.meta.url)));
  const eshopAt = date => poseNativeLayout(eshopPack.layouts.HudMenu_00, eshopPack.animations, services.eshopHudBindings(date));
  assert.equal(maps(eshopAt(odd), 'P_NetAtn_00')[0], 'HudNetAtnInt_00.bclim');
  assert.equal(maps(eshopAt(even), 'P_NetAtn_00')[0], 'HudNetAtnInt_00.bclim');
  assert.deepEqual(maps(eshopAt(odd), 'P_BatF_00'), ['HudBat_01.bclim', 'HudBatMask_00.bclim', 'HudBatLgt_00.bclim']);
  assert.deepEqual(maps(eshopAt(even), 'P_BatF_00'), ['HudBat_01.bclim', 'HudBatMask_00.bclim', 'HudBatPlg.bclim']);
  const zoneAt = elapsed => poseNativeLayout(zonePack.layouts.Hud_00, zonePack.animations, [
    ...services.zoneHudBindings(odd, elapsed), {name:'Hud_00_time_Blinking', frame:services.zoneClock(odd, elapsed).frame},
  ]);
  assert.equal(maps(zoneAt(0), 'P_Bat_00')[0], 'HudBat_04.bclim');
  assert.equal(maps(zoneAt(1000), 'P_Bat_00')[0], 'HudBat_05.bclim');
  assert.equal(maps(zoneAt(0), 'P_NetAtn_00')[0], 'HudNetAtnInt_03.bclim');
  assert.equal(maps(zoneAt(1000), 'P_NetAtn_00')[0], 'HudNetAtnInt_03.bclim');
});

test('live HOME HUD uses the profile and current-second charging frame; capture sample overrides once', () => {
  const calls=[];
  const renderer={packs:{hud, launcher:pack('launcher'), messages:pack('messages-and-loose')}, draw(_ctx, bank, layout, options){calls.push({bank,layout,options});return true;}};
  const painter=createFirmwareHome({renderer});
  painter.hud({},odd,1000);
  painter.hud({},odd,1000,sample);
  painter.hud({},odd,1000);
  assert.deepEqual(calls[0],calls[2]);
  const live=calls[0].options, diagnostic=calls[1].options;
  assert.equal(live.overrides.T_NetMode_00.text,'Internet');
  assert.equal(live.overrides.T_Coin_00.text,'42');
  assert.equal(live.overrides.T_TimeC_00.visible,false);
  assert.deepEqual(live.bindings.slice(2).map(binding=>binding.frame),[0,3,4,60]);
  painter.hud({},even,1000);
  const evenLive=calls.at(-1).options;
  assert.equal(evenLive.overrides.T_TimeC_00.visible,true);
  assert.equal(evenLive.bindings.find(binding=>binding.name==='HudMenu_00_Bat').frame,5);
  assert.equal(diagnostic.overrides.T_NetMode_00.text,'Disabled');
  assert.equal(diagnostic.overrides.T_Coin_00.text,'0');
  assert.equal(diagnostic.overrides.T_Walk_00.text,'0');
  assert.deepEqual(diagnostic.overrides.T_Date_00,live.overrides.T_Date_00);
  assert.deepEqual(diagnostic.bindings.slice(2),[
    {name:'HudMenu_00_NetMode',frame:4},{name:'HudMenu_00_NetAtn',frame:8},
    {name:'HudMenu_00_Bat',frame:3},{name:'HudMenu_00_WalkCoin',frame:180},
  ]);
});

test('reduced-motion HOME repaints only on HUD-visible second-parity change', () => {
  assert.equal(hudSecondParity(34), 0);
  assert.equal(hudSecondParity(35), 1);
  assert.equal(homeHudReducedMotionRepaintDue(null, 35, true), true);
  assert.equal(homeHudReducedMotionRepaintDue(1, 35, true), false);
  assert.equal(homeHudReducedMotionRepaintDue(1, 36, true), true);
  assert.equal(homeHudReducedMotionRepaintDue(0, 36, false), false);
  assert.equal(homeHudReducedMotionParityPaintDue(1, 36, true, false), true);
  assert.equal(homeHudReducedMotionParityPaintDue(1, 36, true, true), false, 'minute paint already published this frame');
});

test('sample rejects out-of-pack poses and missing diagnostic provenance', () => {
  assert.doesNotThrow(()=>validateHomeHudSample(sample,hud));
  for(const replacement of [
    {kind:'telemetry'},{evidence:''},{networkMessage:'Internet'},
    {netModeFrame:5},{netAtnFrame:10},{batteryFrame:7},{walkCoinFrame:360},
    {batteryFrame:4.5},{netModeFrame:NaN},{walkCoinFrame:-1},{coins:-1},{steps:Infinity},{coins:42.5},
  ])assert.throws(()=>validateHomeHudSample({...sample,...replacement},hud),/Invalid HOME HUD diagnostic/);
  assert.doesNotThrow(()=>validateHomeHudSample({...sample,walkCoinFrame:179.5},hud));
});

test('HOME entry selects only the decoded HUD SceneIn frame', () => {
  const calls=[];
  const renderer={packs:{hud,launcher:pack('launcher'),messages:pack('messages-and-loose')},draw(_ctx,_bank,_layout,options){calls.push(options);return true;}};
  const painter=createFirmwareHome({renderer}),date=new Date(2026,9,3,4,23,53);
  for(const frame of [0,20,40])painter.hud({},date,1000,undefined,frame);
  assert.deepEqual(calls.map(call=>call.bindings[0]),[0,20,40].map(frame=>({name:'HudMenu_00_SceneIn',frame})));
  assert.ok(calls.slice(1).every(call=>assert.deepEqual(call.bindings.slice(1),calls[0].bindings.slice(1))===undefined));
  assert.deepEqual(hud.animations.HudMenu_00_SceneIn.sourceFrameRange,[-20,20]);
  assert.equal(hud.animations.HudMenu_00_SceneIn.frames,41);
  assert.equal(hud.resourceSources.animations.HudMenu_00_SceneIn.sha256,'dd44a8b153374128fa7737e1663aafe52fb2d8c45f0bc9f8526e8b48b0c0c7f2');
  for(const frame of [-1,40.5,41,NaN])assert.throws(()=>painter.hud({},date,1000,undefined,frame),/Invalid HOME HUD SceneIn frame/);
});
