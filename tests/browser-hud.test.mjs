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
  hudColonVisible,
} from '../src/os/device-status-profile.ts';
import {poseNativeLayout} from '../src/os/native-layout.ts';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-web.ts', import.meta.url), 'utf8');
const presentation=readFileSync(new URL('../src/os/stock-screen-presentation.ts', import.meta.url), 'utf8');
const selection=JSON.parse(readFileSync(new URL('../scripts/firmware/stock-ui-browser.json', import.meta.url), 'utf8'));
const systemInfo=JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-SystemInfo.json', firmware), 'utf8'));
const netMode=JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-NetMode.json', firmware), 'utf8'));
const netAtn=JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-NetAntenna.json', firmware), 'utf8'));
const battery=JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-Battery.json', firmware), 'utf8'));
const calendar=JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/layout-sysinfo-Calendar.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/browser/contents/0000-0000001f/messages-and-loose.json', firmware), 'utf8'));
const homeHud=JSON.parse(readFileSync(new URL('packs/home/hud.json', firmware), 'utf8'));
const manifest=JSON.parse(readFileSync(new URL('manifest.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const compile=name=>ts.transpileModule(readFileSync(new URL(`../src/os/${name}.ts`, import.meta.url), 'utf8'), {
  compilerOptions:{module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022},
}).outputText;
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const web=await import(url(compile('stock-native-web')
  .replace("'./device-status-profile'", JSON.stringify(url(compile('device-status-profile'))))
  .replace("'./native-layout'", JSON.stringify(url(compile('native-layout'))))));
const title=selection.titles['0004003000009d02'];
const prefix='packs/browser/contents/0000-0000001f/';
const odd=new Date('2026-10-04T18:20:59.347Z');
const even=new Date('2026-10-04T18:20:58.347Z');
const maps=(posed, name)=>posed.materials.find(material=>material.name===name)
  .textureMaps.map(map=>posed.textures[map.texture]);

test('title-local sysinfo HUD is published from Browser arcs; no hud_LZ.bin / HudMenu_00', ()=>{
  assert.equal(systemInfo.titleId, '0004003000009d02');
  assert.equal(systemInfo.version ?? manifest.titles['0004003000009d02'].version, 9232);
  assert.equal(systemInfo.sourceSha256, '2c6742768f6829d3b2f857e165872baf5a923ed152edf0dea74bed1f20278bc5');
  assert.equal(systemInfo.contentIndex, 0);
  assert.equal(systemInfo.contentId, '0000001f');
  assert.equal(sha(new URL(prefix+'layout-sysinfo-SystemInfo.json', firmware)),
    '31e8be409065363b3fa9164d535fb9037f476e3419193614277754d247599ac2');
  assert.equal(systemInfo.resourceSources.layouts.SystemInfo.sha256,
    'a07dfc3efb374634ba31c0424bf3f6771611056827c0ff2aca3095aa997d3e79');
  assert.equal(systemInfo.resourceSources.layouts.SystemInfo.path,
    'layout/sysinfo/SystemInfo.arc/blyt/SystemInfo.bclyt');
  assert.deepEqual(Object.keys(systemInfo.layouts), ['SystemInfo']);
  assert.deepEqual(Object.keys(systemInfo.animations), []);
  assert.equal('SystemInfo_ApltFade' in systemInfo.animations, false);
  const base=flatten(systemInfo.layouts.SystemInfo.roots).find(pane=>pane.name==='BasePct');
  assert.equal(base.kind, 'pic1');
  assert.deepEqual(base.size, [400, 28]);
  assert.deepEqual(base.translation, [-200, 240, 0]);
  assert.equal(base.origin, 0);
  assert.equal(base.flags & 1, 1);
  assert.equal(systemInfo.resourceSources.textures['HudBase_00.bclim'].sha256,
    'aaaef78fa5e1a428da66c319202f123c8c52eaf798490423f3f9daf3413f843f');

  assert.equal(netMode.sourceSha256, '6c665eceeade7a3a235a6cbb2676309b4fbd81c378d02a8bec4bca64d0a25536');
  assert.equal(sha(new URL(prefix+'layout-sysinfo-NetMode.json', firmware)),
    'b4a4b78af96c9587e9a92aca66733585ec3592d39f3bf72fe96d9b93107c527b');
  assert.equal(netMode.resourceSources.layouts.NetMode.sha256,
    '4ef7e632c442d8dcc73b5df235fc31c4061914779f1be33122b2ccacca914a25');
  assert.equal(netMode.resourceSources.animations.NetMode_NetMode.sha256,
    '620d4db6f137892d74ff313514d3956994796a8c591ce2b506aceeae6943fa1d');
  assert.equal(netMode.animations.NetMode_NetMode.frames, 5);

  assert.equal(netAtn.sourceSha256, '8f7fc60cde9ed70d901a8e16713fb65d283805faec27047e400bdca53f1c633f');
  assert.equal(sha(new URL(prefix+'layout-sysinfo-NetAntenna.json', firmware)),
    '98127575ad68441cb0d03fab17bea971af8b3f9e6c40069e51570821382b6f40');
  assert.equal(netAtn.resourceSources.layouts.NetAntenna.sha256,
    '067675d54c185ea7b63404f9306a1176b9e294c4cc5b7121bae1703ae0b634fe');
  assert.equal(netAtn.resourceSources.animations.NetAntenna_NetAtn.sha256,
    'b0b1047621f7501ad9502f6243d36aacbf8d78ab8bb36ca38a532403defd7da6');
  assert.equal('NetAntenna_NetAtnCnt' in netAtn.animations, false);
  assert.equal(netAtn.animations.NetAntenna_NetAtn.frames, 10);

  assert.equal(battery.sourceSha256, '97f3c0b0cc9dcc1aa352bc9ca6b10be876427ebc567ed066bf50f0f4fa354a56');
  assert.equal(sha(new URL(prefix+'layout-sysinfo-Battery.json', firmware)),
    '22d8e358f7e349b1f8a60d190e4297d50e9578287c76229dfa51e4046f4ee219');
  assert.equal(battery.resourceSources.layouts.Battery.sha256,
    '8b060fe5a037dcf83ba892888020b9f12829124ada08a99ec482a79bcbc073ab');
  assert.equal(battery.resourceSources.animations.Battery_Bat.sha256,
    'f1a4f627b27e73ed3a002831d5a3d618a98f2a4a5a1aca834e451bbc9dadec47');
  assert.equal(battery.resourceSources.textures['HudBatPlg.bclim'].sha256,
    'f8f77ecd9959e7830d30eaeee9abf5caea951e895f92f38bcc41d7afb2c8764c');
  assert.equal(battery.resourceSources.textures['HudBat_01.bclim'].sha256,
    '1be98fca4be7666d19e50c87617f2eda1d20c6de36c92883a4efc6f82cb581af');
  assert.equal(battery.resourceSources.textures['HudBatLgt_00.bclim'].sha256,
    '7b3108b54e1b0dfc119b28cc278606c4c7dd07ba5cb0e2050bdd6b97be980657');
  assert.equal(battery.animations.Battery_Bat.frames, 7);

  assert.equal(calendar.sourceSha256, 'f253137dfe5363fa845b0120fd1e637a5e73cd82b1122876b6eab0ebb3317f63');
  assert.equal(sha(new URL(prefix+'layout-sysinfo-Calendar.json', firmware)),
    'b136aead3630bd7a3c4d2a601a870b504b805300f8af89a5a9cad34f511311d9');
  assert.equal(calendar.resourceSources.layouts.Calendar.sha256,
    '7ecf140a802c6485b069bee0d10a53d0af05257b7bad875767951c8368a8243d');
  assert.deepEqual(calendar.layouts.Calendar.fonts, ['Hud.bcfnt']);
  const datePane=flatten(calendar.layouts.Calendar.roots).find(pane=>pane.name==='DateTxb');
  const colon=flatten(calendar.layouts.Calendar.roots).find(pane=>pane.name==='TimeCTxb');
  assert.equal(datePane.text.value, '12/12 (Sun)');
  assert.equal(colon.text.value, ':');

  assert.equal(sha(new URL(prefix+'messages-and-loose.json', firmware)),
    'ea2a15ee805fc80070e3e68f81a9c6a11e3453ce0534041e87ce060c1b52c7e2');
  const bank=messages.messages.hud;
  assert.equal(bank.messages[bank.labels.lau_connect0].text, 'Internet');
  assert.equal(bank.messages[bank.labels.lau_date].text, '%d/%M (%w)');
  assert.equal(bank.messages[bank.labels.day_4].text, '04');
  assert.equal(bank.messages[bank.labels.month_10].text, '10');
  assert.equal(bank.messages[bank.labels.week_sun].text, 'Sun');
  assert.equal(messages.resourceSources.messages.hud.sha256,
    'a8860fb731e1a2065d28809c1184617db7f24f907531333c2bf1b0a4fa3a9c6d');
  assert.equal(messages.resourceSources.messages.hud.path,
    'RomFS/message/EU_English/hud.msbt');
  assert.ok(messages.messages.spider);
  assert.equal(messages.messages.spider.messages[messages.messages.spider.labels.lau_title_web].text,
    'Internet Browser');

  const delivered=manifest.titles['0004003000009d02'];
  assert.equal(delivered.titleId, '0004003000009d02');
  assert.equal(delivered.version, 9232);
  assert.equal(delivered.sourceSha256, '6e299b9acb2afdea864a60d9d9b3a48d60efc66146a87bfc9ed12cee3fc80c95');
  assert.equal(delivered.fonts['Hud.bcfnt'], 'fonts/hud/font.json');
  assert.equal(delivered.fonts['contents/0000-0000001f/Hud.bcfnt'], 'fonts/hud/font.json');
  assert.equal(delivered.fonts['contents/0000-0000001f/font.bcfnt'], 'fonts/shared/font.json');
  assert.equal(delivered.uiSelection.sourceConverter.version, '1.3.1');
  assert.equal(delivered.uiSelection.sourceConverter.name, 'ctr-native-web');
  assert.equal(title.fontBindings['Hud.bcfnt'], 'hud');
  assert.equal(title.fontBindings['font.bcfnt'], 'shared');
  for(const pack of [
    'layout-sysinfo-SystemInfo.json', 'layout-sysinfo-NetMode.json', 'layout-sysinfo-NetAntenna.json',
    'layout-sysinfo-Battery.json', 'layout-sysinfo-Calendar.json',
  ]){
    assert.ok(delivered.packs.includes(prefix+pack), pack);
    assert.ok(title.packs[prefix+pack], pack);
  }
  assert.equal(homeHud.titleId, '0004003000009802');
  assert.notEqual(homeHud.titleId, systemInfo.titleId);
  const hudJson=new URL('packs/home/hud.json', firmware);
  const newsHud=new URL('packs/notifications/hud.json', firmware);
  if(existsSync(newsHud)){
    assert.notEqual(sha(hudJson), sha(newsHud));
    assert.notEqual(sha(new URL(prefix+'layout-sysinfo-SystemInfo.json', firmware)), sha(newsHud));
  }

  const dumpRoot='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/browser/contents/0000-0000001f';
  const dumpFiles={
    systemInfo:`${dumpRoot}/romfs/layout/sysinfo/SystemInfo.arc`,
    netMode:`${dumpRoot}/romfs/layout/sysinfo/NetMode.arc`,
    netAtn:`${dumpRoot}/romfs/layout/sysinfo/NetAntenna.arc`,
    battery:`${dumpRoot}/romfs/layout/sysinfo/Battery.arc`,
    calendar:`${dumpRoot}/romfs/layout/sysinfo/Calendar.arc`,
    hudMsbt:`${dumpRoot}/romfs/message/EU_English/hud.msbt`,
    hudFont:`${dumpRoot}/romfs/font/Hud.bcfnt`,
    code:`${dumpRoot}/exefs/code.bin`,
  };
  if(Object.values(dumpFiles).every(existsSync)){
    assert.equal(sha(dumpFiles.systemInfo), '2c6742768f6829d3b2f857e165872baf5a923ed152edf0dea74bed1f20278bc5');
    assert.equal(sha(dumpFiles.netMode), '6c665eceeade7a3a235a6cbb2676309b4fbd81c378d02a8bec4bca64d0a25536');
    assert.equal(sha(dumpFiles.netAtn), '8f7fc60cde9ed70d901a8e16713fb65d283805faec27047e400bdca53f1c633f');
    assert.equal(sha(dumpFiles.battery), '97f3c0b0cc9dcc1aa352bc9ca6b10be876427ebc567ed066bf50f0f4fa354a56');
    assert.equal(sha(dumpFiles.calendar), 'f253137dfe5363fa845b0120fd1e637a5e73cd82b1122876b6eab0ebb3317f63');
    assert.equal(sha(dumpFiles.hudMsbt), 'a8860fb731e1a2065d28809c1184617db7f24f907531333c2bf1b0a4fa3a9c6d');
    assert.equal(sha(dumpFiles.hudFont), '172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8');
    assert.equal(sha(dumpFiles.code), 'a246a71a86c5b8b41b687a97afb5f8198b9189263abe0f1496d90c6edcfc3993');
    const code=readFileSync(dumpFiles.code);
    assert.equal(code.includes('hud_LZ.bin'), false);
    assert.equal(code.includes('HudMenu_00'), false);
    assert.equal(code.includes('layout/sysinfo/SystemInfo'), true);
  }
  assert.equal(existsSync(new URL('packs/browser/hud.json', firmware)), false);
});

test('painter draws title-local SystemInfo HUD with REFERENCE_DEVICE_STATUS; no SceneIn, HOME hud, or Browser title', ()=>{
  assert.match(painter, /alias:'web-hud',layouts:\['SystemInfo'\],animations:\[\]/);
  assert.match(painter, /alias:'web-hud-netmode',layouts:\['NetMode'\],animations:\['NetMode_NetMode'\]/);
  assert.match(painter, /alias:'web-hud-netatn',layouts:\['NetAntenna'\],animations:\['NetAntenna_NetAtn'\]/);
  assert.match(painter, /alias:'web-hud-battery',layouts:\['Battery'\],animations:\['Battery_Bat'\]/);
  assert.match(painter, /alias:'web-hud-calendar',layouts:\['Calendar'\],animations:\[\]/);
  assert.equal(painter.includes('NetAntenna_NetAtnCnt'), false);
  assert.equal(painter.includes('HudMenu_00'), false);
  assert.equal(painter.includes('packs/home/hud.json'), false);
  assert.equal(painter.includes('packs/notifications/hud.json'), false);
  assert.match(painter, /draw\(top,'web-hud','SystemInfo'/);
  assert.match(painter, /NetAtnPos:child\('web-hud-netatn','NetAntenna',\{bindings:\[\{name:'NetAntenna_NetAtn',frame:status\.netAtnFrame\}\]\}\)/);
  assert.match(painter, /NetModePos:child\('web-hud-netmode','NetMode',\{bindings:\[\{name:'NetMode_NetMode',frame:status\.netModeFrame\}\]/);
  assert.match(painter, /NetModeIntTxb:hud\(status\.networkMessage,'Internet'\)/);
  assert.match(painter, /ButPos:child\('web-hud-battery','Battery',\{bindings:\[\{name:'Battery_Bat',frame:clock\.batteryFrame\}\]\}\)/);
  assert.match(painter, /DateTxb:dateText/);
  assert.match(painter, /TimeLTxb:\{text:String\(clock\.hour\)/);
  assert.match(painter, /TimeCTxb:\{visible:clock\.colonVisible\}/);
  assert.match(painter, /TimeRTxb:\{text:String\(clock\.minute\)/);
  assert.match(painter, /deviceStatusBatteryFrame\(REFERENCE_DEVICE_STATUS,date\.getSeconds\(\)\)/);
  assert.match(painter, /colonVisible:hudColonVisible\(date\.getSeconds\(\)\)/);
  assert.equal(painter.includes("{name:'Battery_Bat',frame:4}"), false);
  assert.equal(painter.includes('soundHudBatteryPatternFrame'), false);
  assert.equal(painter.includes("message(browser?'lau_title_web'"), false);
  assert.equal(painter.includes("message('lau_title_web')"), false);
  assert.match(painter, /if\(!browser\)text\(top,message\('lau_title_olive'\)/);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.equal(painter.includes('colorFit'), false);
  assert.match(presentation, /browserHudKey=view\.appId==='browser'\?browserHudClock\(date\)/);
  assert.equal(odd.getSeconds(), 59);
  assert.equal(even.getSeconds(), 58);
  assert.equal(hudColonVisible(59), false);
  assert.equal(hudColonVisible(58), true);
  assert.equal(chargingBatteryFrame(59), 4);
  assert.equal(chargingBatteryFrame(58), 5);
  assert.equal(deviceStatusBatteryFrame(REFERENCE_DEVICE_STATUS, 59), 4);
  assert.equal(deviceStatusBatteryFrame(REFERENCE_DEVICE_STATUS, 52), 5);
  assert.equal(web.browserHudBatteryFrame(odd), 4);
  assert.equal(web.browserHudBatteryFrame(even), 5);
  assert.equal(web.browserHudClock(odd).batteryFrame, 4);
  assert.equal(web.browserHudClock(even).batteryFrame, 5);
  assert.equal(web.browserHudClock(odd).colonVisible, false);
  assert.equal(web.browserHudClock(even).colonVisible, true);
  assert.equal(web.browserHudClock(odd).hour, odd.getHours());
  assert.equal(web.browserHudClock(odd).minute, odd.getMinutes());
  assert.equal(odd.getMinutes(), 20);
  const pose=frame=>poseNativeLayout(battery.layouts.Battery, battery.animations, [{name:'Battery_Bat', frame}]);
  assert.deepEqual(maps(pose(4), 'BatFPct'),
    ['HudBat_01.bclim', 'HudBatMask_00.bclim', 'HudBatLgt_00.bclim']);
  assert.deepEqual(maps(pose(5), 'BatFPct'),
    ['HudBat_01.bclim', 'HudBatMask_00.bclim', 'HudBatPlg.bclim']);
  assert.equal(maps(pose(web.browserHudBatteryFrame(odd)), 'BatFPct')[2], 'HudBatLgt_00.bclim');
  assert.equal(maps(pose(web.browserHudBatteryFrame(even)), 'BatFPct')[2], 'HudBatPlg.bclim');
});

test('the hashed browser-start-menu-local pair keeps upper 95571 / HUD 10787 until coordinator recapture', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001';
  const files={
    native:`${root}/native-new-apps-20261004/screenshots/new-apps-20261004/_04.10.26_19.20.59.347.png`,
    upper:`${root}/native-new-apps-captures-20261004/browser-start-menu-local/browser/upper.png`,
    lower:`${root}/native-new-apps-captures-20261004/browser-start-menu-local/browser/lower.png`,
    report:`${root}/native-new-apps-captures-20261004/browser-start-menu-local/diff/report.json`,
    contact:`${root}/native-new-apps-captures-20261004/browser-start-menu-local/diff/upper-contact-sheet.png`,
    contactLower:`${root}/native-new-apps-captures-20261004/browser-start-menu-local/diff/lower-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.upper, files.lower, files.report, files.contact, files.contactLower].every(existsSync)){
    return t.skip('private Browser start-menu pair is absent');
  }
  assert.equal(sha(files.native), '4bfffefeee3ee291e478e7c8db39d5d31ce1293478acfcbc138caf2561c6e80a');
  assert.equal(sha(files.upper), '8fef95ac4a7f2f7330cdbc108d2c7101670d1e6b58268f6894be03d2e54effb2');
  assert.equal(sha(files.lower), 'a2b12cde2e886b2de7ad09b208ad88a9417d205d320f0f7f3c80e22d80352a91');
  assert.equal(sha(files.report), 'b211bf30b2030635f07c0a129d95bb4da04731f88ae5060122f585c0f641ed64');
  assert.equal(sha(files.contact), '2481c4b145f16f67b385977a8d016e2dc495d8816025576aac75adf387818de5');
  assert.equal(sha(files.contactLower), '0d32c8be3c2c9253db5326ba44c188f4c565ad191bb3a5d213fd38c00e651cbe');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const nativeUpper=await sharp(files.native).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const browserUpper=await sharp(files.upper).ensureAlpha().raw().toBuffer();
  const count=(native, browser, x0, y0, x1, y1, width=400)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*width+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  const whole=count(nativeUpper, browserUpper, 0, 0, 400, 240);
  const hudStrip=count(nativeUpper, browserUpper, 0, 0, 400, 28);
  const hud20=count(nativeUpper, browserUpper, 0, 0, 400, 20);
  const body=count(nativeUpper, browserUpper, 0, 28, 400, 240);
  assert.equal(whole.n, 95571);
  assert.equal(whole.max, 245);
  assert.deepEqual(whole.at, [375, 2]);
  assert.equal(hudStrip.n, 10787);
  assert.equal(hudStrip.max, 245);
  assert.deepEqual(hudStrip.at, [375, 2]);
  assert.equal(hud20.n, 7998);
  assert.equal(body.n, 84784);
  assert.equal(whole.n-hudStrip.n, 84784);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.scenarioId, 'browser-start-menu-local');
  assert.equal(report.screens.upper.pixelsOverThreshold, 95571);
  assert.equal(report.screens.lower.pixelsOverThreshold, 76728);
  assert.deepEqual(report.screens.upper.regions[1], {x:0, y:0, width:400, height:20, pixelCount:7998});
});
