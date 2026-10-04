import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const presentation=readFileSync(new URL('../src/os/stock-screen-presentation.ts', import.meta.url), 'utf8');
const selection=JSON.parse(readFileSync(new URL('../scripts/firmware/stock-ui-notifications.json', import.meta.url), 'utf8'));
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const hud=JSON.parse(readFileSync(new URL('packs/notifications/hud.json', firmware), 'utf8'));
const homeHud=JSON.parse(readFileSync(new URL('packs/home/hud.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
const manifest=JSON.parse(readFileSync(new URL('manifest.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const requested=painter.match(/alias:'notifications',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
const requestedLayouts=requested[1]??'';
const requestedAnims=requested[2]??'';
const title=selection.titles['000400300000a002'];

test('title-local HudMenu_00 is published from hud_LZ.bin; unused row/detail clips still do not own the strip', ()=>{
  assert.equal(news.titleId, '000400300000a002');
  assert.equal(news.sourceSha256, '4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366');
  assert.equal(sha(new URL('packs/notifications/news.json', firmware)),
    '9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375');
  assert.equal(news.resourceSources.layouts.NewsUnread_U_00.sha256,
    '0362c72dc421800a3e91647bc04800810ae35a589be4f92cbc4e8a478cb0751d');
  assert.equal(news.resourceSources.layouts.NewsTopUI_U_00.sha256,
    'dfe4583dab0a9c212380921957b673d6d435b42d84f9125919322f79bc09c547');
  assert.equal(news.resourceSources.animations.NewsUnread_U_00_SceneIn.sha256,
    'e46adce67ac0b229bcc45ad6232693f526b4cb28f540176a785b52f401ff4d15');
  assert.equal(news.resourceSources.textures['HudBase_00.bclim'].sha256,
    'aaaef78fa5e1a428da66c319202f123c8c52eaf798490423f3f9daf3413f843f');
  const unread=flatten(news.layouts.NewsUnread_U_00.roots);
  const hudBase=unread.find(pane=>pane.name==='P_HudBase_00');
  assert.equal(hudBase.kind, 'pic1');
  assert.deepEqual(hudBase.size, [400, 28]);
  assert.deepEqual(hudBase.translation, [-200, 120, 0]);
  assert.equal(hudBase.origin, 0);
  const sceneIn=news.animations.NewsUnread_U_00_SceneIn;
  assert.equal(sceneIn.tracks.some(track=>track.target==='P_HudBase_00'), false);
  assert.equal(sceneIn.tracks.some(track=>['T_NetMode_00', 'T_Date_00', 'P_Bat_00'].includes(track.target)), false);
  assert.match(requestedLayouts, /'NewsUnread_U_00'/);
  assert.match(requestedAnims, /'NewsUnread_U_00_SceneIn'/);
  for(const unused of ['NewsWndwNews_U_00', 'NewsDetailUI_00', 'NewsElemCnt_00']){
    assert.equal(requestedLayouts.includes(unused), false, unused);
    assert.ok(news.layouts[unused]);
  }
  assert.equal(JSON.stringify(news).includes('HudMenu_00'), false);

  assert.equal(hud.titleId, '000400300000a002');
  assert.equal(hud.sourceSha256, '8463b1e9a67a6a78760699aba751a225b03b54be6911e97e50d256fdf4dcf144');
  assert.equal(sha(new URL('packs/notifications/hud.json', firmware)),
    '84d76eb05eae7f0d471b671bbf4aef8d4805bcdb57ea23f0d9f2489f5181cf6f');
  assert.equal(hud.resourceSources.layouts.HudMenu_00.sha256,
    '5a95579d59c8a92ddce79b95900e061835c84626543b403667be7239c77d30f7');
  assert.equal(hud.resourceSources.layouts.HudMenu_00.path, 'hud_LZ.bin/blyt/HudMenu_00.bclyt');
  assert.deepEqual(Object.keys(hud.layouts), ['HudMenu_00']);
  assert.deepEqual(Object.keys(hud.animations).sort(),
    ['HudMenu_00_Bat', 'HudMenu_00_NetAtn', 'HudMenu_00_NetMode', 'HudMenu_00_SceneIn', 'HudMenu_00_WhiteBlack']);
  assert.equal('HudMenu_00_WalkCoin' in hud.animations, false);
  const scene=flatten(hud.layouts.HudMenu_00.roots).find(pane=>pane.name==='N_Scene_00');
  assert.equal(scene.alpha, 0);
  const hudSceneIn=hud.animations.HudMenu_00_SceneIn;
  assert.equal(hudSceneIn.frames, 41);
  assert.deepEqual(hudSceneIn.sourceFrameRange, [-20, 20]);
  const alpha=hudSceneIn.tracks.find(track=>track.target==='N_Scene_00'&&track.property==='alpha');
  assert.equal(alpha.keys.at(-1).frame, 40);
  assert.equal(alpha.keys.at(-1).value, 255);
  assert.equal(homeHud.titleId, '0004003000009802');
  assert.equal(homeHud.resourceSources.layouts.HudMenu_00.sha256,
    'c27b927db06ec234601e3fc1bfa3f55f1c9570353ac8016c5ad9812ebaab28de');
  assert.notEqual(sha(new URL('packs/home/hud.json', firmware)),
    sha(new URL('packs/notifications/hud.json', firmware)));
  assert.ok(title.packs['packs/notifications/hud.json']);
  assert.equal(title.fontBindings['Hud.bcfnt'], 'hud');
  assert.equal(manifest.titles['000400300000a002'].fonts['Hud.bcfnt'], 'fonts/hud/font.json');
  assert.ok(manifest.titles['000400300000a002'].packs.includes('packs/notifications/hud.json'));
  assert.equal(manifest.titles['000400300000a002'].uiSelection.sourceConverter.version, '1.3.1');
  assert.equal(manifest.titles['000400300000a002'].uiSelection.sourceConverter.name, 'ctr-native-web');
  assert.ok(hud.layouts.HudMenu_00.fonts.includes('Hud.bcfnt'));
  const bank=messages.messages.hud_msbt_LZ;
  assert.equal(bank.messages[bank.labels.lau_connect0].text, 'Internet');
  assert.equal(bank.messages[bank.labels.lau_date].text, '%d/%M (%w)');
  assert.equal(bank.messages[bank.labels.day_27].text, '27');
  assert.equal(bank.messages[bank.labels.month_9].text, '09');
  assert.equal(bank.messages[bank.labels.week_sun].text, 'Sun');
  assert.equal(messages.resourceSources.messages.hud_msbt_LZ.sha256,
    'a8860fb731e1a2065d28809c1184617db7f24f907531333c2bf1b0a4fa3a9c6d');
  assert.equal(messages.resourceSources.messages.hud_msbt_LZ.path,
    'RomFS/message_hud/EU_English/hud_msbt_LZ.bin');
  const list=messages.messages.newslist_msbt_LZ;
  assert.equal(list.messages[list.labels.new_title_new].text, 'Notifications');
  const convertedHud='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/notifications-converted-english/packs/notifications/hud.json';
  if(existsSync(convertedHud)){
    assert.equal(sha(convertedHud), 'e10685be0a302cf36db3bf05fe83ff221ec1c90f33f1e5a0ab331b905ddd9d1a');
  }
});

test('painter draws title-local HudMenu_00 with SceneIn 40 and REFERENCE_DEVICE_STATUS; no WalkCoin or HOME hud or title adapter', ()=>{
  assert.match(painter, /renderer\.draw\(top,'notifications','NewsTopUI_U_00'\)/);
  assert.match(painter, /renderer\.draw\(top,'notifications','NewsUnread_U_00',\{bindings:\[\{name:'NewsUnread_U_00_SceneIn',frame:20\}/);
  assert.match(painter, /alias:'notification-hud',layouts:\['HudMenu_00'\]/);
  assert.match(painter, /renderer\.draw\(top,'notification-hud','HudMenu_00'/);
  assert.match(painter, /\{name:'HudMenu_00_SceneIn',frame:NOTIFICATION_HUD_SCENE_IN\}/);
  assert.match(painter, /const NOTIFICATION_HUD_SCENE_IN=40/);
  assert.match(painter, /\{name:'HudMenu_00_WhiteBlack',frame:status\.whiteBlackFrame\}/);
  assert.match(painter, /\{name:'HudMenu_00_NetMode',frame:status\.netModeFrame\}/);
  assert.match(painter, /\{name:'HudMenu_00_NetAtn',frame:status\.netAtnFrame\}/);
  assert.match(painter, /\{name:'HudMenu_00_Bat',frame:4\}/);
  assert.match(painter, /T_NetMode_00:hud\(status\.networkMessage,'Internet'\)/);
  assert.match(painter, /from '\.\/device-status-profile'/);
  assert.match(painter, /P_Walk_00:\{visible:false\}/);
  assert.match(painter, /P_Coin_00:\{visible:false\}/);
  assert.equal(painter.includes('HudMenu_00_WalkCoin'), false);
  assert.equal(painter.includes("packs/home/hud.json"), false);
  assert.equal(painter.includes("options.font?.draw(top,message('new_title_new')"), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.equal(painter.includes('colorFit'), false);
  assert.match(presentation, /notificationsHudKey=view\.appId==='notifications'\?eshopHudClock\(date\)/);
});

test('the reused unread-dot pair keeps hashed upper 6239 / HUD 3347 / balloon 0 until coordinator recapture', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:`${root}/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`,
    upper:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/captures/notifications-unread-dot-f073581/browser/upper.png`,
    lower:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/captures/notifications-unread-dot-f073581/browser/lower.png`,
    report:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/report.json`,
    contact:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/upper-contact-sheet.png`,
    contactLower:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/lower-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.upper, files.lower, files.report, files.contact, files.contactLower].every(existsSync)){
    return t.skip('private Notifications unread-dot pair is absent');
  }
  assert.equal(sha(files.native), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(files.upper), '78ff0a5ac9db09ebcb85799d23292a5c26f698c414851d46738e79dc51a16d02');
  assert.equal(sha(files.lower), 'bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce');
  assert.equal(sha(files.report), 'f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6');
  assert.equal(sha(files.contact), '4ba3d2da61e9bbf508bdc7de12513ed451e072bb007485a353aa274ee38c935c');
  assert.equal(sha(files.contactLower), 'b1913774dfa9578cf9865acdafff7391534948a83eecbf62120cb4c01281edda');
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
  const body=count(nativeUpper, browserUpper, 0, 28, 400, 240);
  const balloon=count(nativeUpper, browserUpper, 100, 40, 300, 160);
  assert.equal(whole.n, 6239);
  assert.equal(whole.max, 255);
  assert.deepEqual(whole.at, [375, 2]);
  assert.equal(hudStrip.n, 3347);
  assert.equal(hudStrip.max, 255);
  assert.deepEqual(hudStrip.at, [375, 2]);
  assert.equal(body.n, 2892);
  assert.equal(whole.n-hudStrip.n, 2892);
  assert.equal(balloon.n, 0);
  assert.equal(count(nativeUpper, browserUpper, 26, 2, 134, 18).n, 1719);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 6239);
  assert.equal(report.screens.lower.pixelsOverThreshold, 3876);
  assert.deepEqual(report.screens.upper.regions[0], {x:26, y:2, width:108, height:16, pixelCount:1719});
  const dumpHud='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/romfs/hud_LZ.bin';
  if(existsSync(dumpHud)){
    assert.equal(sha(dumpHud), '8463b1e9a67a6a78760699aba751a225b03b54be6911e97e50d256fdf4dcf144');
  }
  const dumpMsbt='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/romfs/message_hud/EU_English/hud_msbt_LZ.bin';
  if(existsSync(dumpMsbt)){
    assert.equal(sha(dumpMsbt), '563f5d0c630bf0b51807596558df31500b9526e3f467e026a8a77d52cd0225d5');
  }
});
