import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {
  REFERENCE_DEVICE_STATUS,
  chargingBatteryFrame,
  deviceStatusBatteryFrame,
  homeHudReducedMotionParityPaintDue,
} from '../src/os/device-status-profile.ts';
import {poseNativeLayout} from '../src/os/native-layout.ts';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const presentation=readFileSync(new URL('../src/os/stock-screen-presentation.ts', import.meta.url), 'utf8');
const services=readFileSync(new URL('../src/os/stock-native-services.ts', import.meta.url), 'utf8');
const hud=JSON.parse(readFileSync(new URL('packs/notifications/hud.json', firmware), 'utf8'));
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const compile=name=>ts.transpileModule(readFileSync(new URL(`../src/os/${name}.ts`, import.meta.url), 'utf8'), {
  compilerOptions:{module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022},
}).outputText;
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const tools=await import(url(compile('stock-native-personal-tools')
  .replace("'./device-status-profile'", JSON.stringify(url(compile('device-status-profile'))))
  .replace("'./native-layout'", JSON.stringify(url(compile('native-layout'))))
  .replace("'./stock-screen-layout'", JSON.stringify(url('export const notesCaptureView=()=>null;export const NOTES_SWITCH_LAST_FRAME=0;')))));

const odd=new Date('2026-09-27T12:16:53.105Z');
const even=new Date('2026-09-27T12:16:52.105Z');
const maps=(posed, name)=>posed.materials.find(material=>material.name===name)
  .textureMaps.map(map=>posed.textures[map.texture]);

test('0x181018 / 0x27c6a8 charging map: odd second -> frame 4, even -> frame 5', ()=>{
  assert.equal(odd.getSeconds(), 53);
  assert.equal(even.getSeconds(), 52);
  assert.equal(chargingBatteryFrame(53), 4);
  assert.equal(chargingBatteryFrame(52), 5);
  assert.equal(deviceStatusBatteryFrame(REFERENCE_DEVICE_STATUS, 53), 4);
  assert.equal(deviceStatusBatteryFrame(REFERENCE_DEVICE_STATUS, 52), 5);
  assert.equal(tools.notificationsHudBatteryFrame(odd), 4);
  assert.equal(tools.notificationsHudBatteryFrame(even), 5);
  assert.equal(tools.notificationsHudBatteryFrame(odd), chargingBatteryFrame(odd.getSeconds()));
  assert.equal(tools.notificationsHudBatteryFrame(even), chargingBatteryFrame(even.getSeconds()));
  assert.equal(tools.notificationsHudClock(odd).batteryFrame, 4);
  assert.equal(tools.notificationsHudClock(even).batteryFrame, 5);
  assert.notEqual(tools.notificationsHudClock(odd).batteryFrame, tools.notificationsHudClock(even).batteryFrame);
  assert.equal(tools.notificationsHudClock(odd).minute, 16);
  assert.equal('colonVisible' in tools.notificationsHudClock(odd), false);
});

test('this title Bat clip puts HudBatPlg on even frame 5 and full orange on odd frame 4', ()=>{
  assert.equal(hud.resourceSources.animations.HudMenu_00_Bat.sha256,
    '1c58e6ea560703e92fdf40ff8e34a1a78fabcef776284a6f2eb1b7e6c6d2006e');
  assert.equal(hud.resourceSources.textures['HudBatPlg.bclim'].sha256,
    'f8f77ecd9959e7830d30eaeee9abf5caea951e895f92f38bcc41d7afb2c8764c');
  const pose=frame=>poseNativeLayout(hud.layouts.HudMenu_00, hud.animations, [{name:'HudMenu_00_Bat', frame}]);
  assert.deepEqual(maps(pose(4), 'P_BatF_00'),
    ['HudBat_01.bclim', 'HudBatMask_00.bclim', 'HudBatLgt_00.bclim']);
  assert.deepEqual(maps(pose(5), 'P_BatF_00'),
    ['HudBat_01.bclim', 'HudBatMask_00.bclim', 'HudBatPlg.bclim']);
  const oddPose=pose(tools.notificationsHudBatteryFrame(odd));
  const evenPose=pose(tools.notificationsHudBatteryFrame(even));
  assert.equal(maps(oddPose, 'P_BatF_00')[2], 'HudBatLgt_00.bclim');
  assert.equal(maps(evenPose, 'P_BatF_00')[2], 'HudBatPlg.bclim');
});

test('painter binds shared deviceStatusBatteryFrame; pair key includes seconds via notificationsHudClock', ()=>{
  assert.match(painter, /deviceStatusBatteryFrame\(REFERENCE_DEVICE_STATUS,date\.getSeconds\(\)\)/);
  assert.match(painter, /\{name:'HudMenu_00_Bat',frame:notificationsHudBatteryFrame\(now\)\}/);
  assert.equal(painter.includes("{name:'HudMenu_00_Bat',frame:4}"), false);
  assert.equal(painter.includes('soundHudBatteryPatternFrame'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.match(presentation, /notificationsHudKey=view\.appId==='notifications'\?notificationsHudClock\(date\)/);
  assert.equal(presentation.includes("notificationsHudKey=view.appId==='notifications'?eshopHudClock(date)"), false);
  assert.match(services, /\{name:'HudMenu_00_Bat',frame:4\}/);
  assert.match(services, /batteryFrame:4/);
  const calls=[];
  const renderer={
    packs:{notifications:news, 'notification-hud':hud, 'notification-messages':messages},
    draw(_ctx, alias, layout, options){calls.push({alias, layout, options}); return true;},
  };
  const view={appId:'notifications', screen:'main', heading:'', rows:[{id:'n1', label:'one', value:'New'}], selection:0, footer:{}};
  const bat=date=>{
    calls.length=0;
    assert.equal(tools.drawNativePersonalToolFrame(renderer, {}, {}, view, {date}), true);
    const hudDraw=calls.find(call=>call.alias==='notification-hud'&&call.layout==='HudMenu_00');
    return hudDraw.options.bindings.find(binding=>binding.name==='HudMenu_00_Bat').frame;
  };
  assert.equal(bat(odd), 4);
  assert.equal(bat(even), 5);
  assert.equal(bat(odd), chargingBatteryFrame(53));
  assert.equal(bat(even), chargingBatteryFrame(52));
});

test('reduced-motion HOME still 1 Hz blinks; Notifications app paints via the seconds key', ()=>{
  assert.equal(homeHudReducedMotionParityPaintDue(0, 53, true, false), true);
  assert.equal(homeHudReducedMotionParityPaintDue(1, 53, true, false), false);
  assert.notDeepEqual(tools.notificationsHudClock(odd), tools.notificationsHudClock(even));
});

test('matched-clock recapture keeps HUD battery 182 until coordinator reruns capture-notifications-hud.mjs', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-hud-recapture-matched-clock-20261004';
  const files={
    native:'/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png',
    upper:`${root}/browser/upper.png`,
    report:`${root}/report.json`,
  };
  if(![files.native, files.upper, files.report].every(existsSync)) return t.skip('private matched-clock recapture is absent');
  assert.equal(sha(files.native), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(files.upper), 'e08ad93a64d49d2acf783dd8a89c816452c4abc996206a85398a691e357812bc');
  assert.equal(sha(files.report), 'ea356921332a8229fe80176569fe800a1215f11116669af875325432762b8f81');
  const sharp=require('sharp');
  const native=await sharp(files.native).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const browser=await sharp(files.upper).ensureAlpha().raw().toBuffer();
  const count=(x0, y0, x1, y1)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){
      const i=(y*400+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2) n++;
    }
    return {n, max, at};
  };
  const hudStrip=count(0, 0, 400, 28);
  const battery=count(370, 0, 400, 28);
  const colon=count(248, 0, 270, 28);
  assert.equal(hudStrip.n, 182);
  assert.equal(battery.n, 182);
  assert.equal(colon.n, 0);
  assert.equal(hudStrip.max, 255);
  assert.deepEqual(hudStrip.at, [381, 7]);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 3074);
  assert.deepEqual(report.screens.upper.regions[0], {x:376, y:5, width:19, height:10, pixelCount:182});
});
