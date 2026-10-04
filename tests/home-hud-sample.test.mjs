import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { HOME_REFERENCE_HUD_STATUS, validateHomeHudSample } from '../src/os/home-hud-sample.ts';

const sourceUrl = new URL('../src/os/firmware-presentation.ts', import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const stub = 'data:text/javascript;base64,' + Buffer.from('export class NativeLayoutRenderer {}').toString('base64');
const source = outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_match, prefix, path, suffix) =>
  prefix + (path === './native-renderer' ? stub : new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href) + suffix);
const { createFirmwareHome } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));


const pack = name => JSON.parse(readFileSync(new URL(`../public/os/firmware/10.7.0-32E/packs/home/${name}.json`, import.meta.url)));
const hud = pack('hud');
// Explicit pose probe, not an asserted service-to-frame mapping or native phase.
const sample = Object.freeze({kind:'source-pose', evidence:'test pose; coins from profile audit; battery/signal/phase unverified', networkMessage:'lau_connect4', netModeFrame:4, netAtnFrame:8, batteryFrame:3, walkCoinFrame:180, coins:0, steps:0});

test('live HOME HUD uses the isolated reference-profile pose, not Disabled/0/blue', () => {
  assert.deepEqual(HOME_REFERENCE_HUD_STATUS,{
    networkMessage:'lau_connect0',netModeFrame:0,netAtnFrame:3,batteryFrame:4,coins:42,steps:0,
  });
});

test('diagnostic sample selects delivered source messages and clips without changing later live HUD painting', () => {
  const calls=[];
  const renderer={packs:{hud, launcher:pack('launcher'), messages:pack('messages-and-loose')}, draw(_ctx, bank, layout, options){calls.push({bank,layout,options});return true;}};
  const painter=createFirmwareHome({renderer});
  const date=new Date(2026,8,26,4,14,35);
  painter.hud({},date,1000);
  painter.hud({},date,1000,sample);
  painter.hud({},date,1000);
  assert.deepEqual(calls[0],calls[2]);
  const live=calls[0].options, diagnostic=calls[1].options;
  assert.equal(live.overrides.T_NetMode_00.text,'Internet');
  assert.equal(live.overrides.T_Coin_00.text,'42');
  assert.equal(diagnostic.overrides.T_NetMode_00.text,'Disabled');
  assert.equal(diagnostic.overrides.T_Coin_00.text,'0');
  assert.equal(diagnostic.overrides.T_Walk_00.text,'0');
  assert.deepEqual(diagnostic.overrides.T_Date_00,live.overrides.T_Date_00);
  assert.deepEqual(diagnostic.bindings.slice(2),[
    {name:'HudMenu_00_NetMode',frame:4},{name:'HudMenu_00_NetAtn',frame:8},
    {name:'HudMenu_00_Bat',frame:3},{name:'HudMenu_00_WalkCoin',frame:180},
  ]);
  assert.deepEqual(live.bindings.slice(2).map(binding=>binding.frame),[0,3,4,60]);
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
