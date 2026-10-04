import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const selection=JSON.parse(readFileSync(new URL('../scripts/firmware/stock-ui-notifications.json', import.meta.url), 'utf8'));
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const requested=painter.match(/alias:'notifications',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
const requestedLayouts=requested[1]??'';
const requestedAnims=requested[2]??'';

test('already-bound unread P_HudBase; unused row/detail clips and omitted hud archive do not own the strip', ()=>{
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
  const hud=unread.find(pane=>pane.name==='P_HudBase_00');
  assert.equal(hud.kind, 'pic1');
  assert.deepEqual(hud.size, [400, 28]);
  assert.deepEqual(hud.translation, [-200, 120, 0]);
  assert.equal(hud.origin, 0);
  const sceneIn=news.animations.NewsUnread_U_00_SceneIn;
  assert.equal(sceneIn.tracks.some(track=>track.target==='P_HudBase_00'), false);
  assert.equal(sceneIn.tracks.some(track=>['T_NetMode_00', 'T_Date_00', 'P_Bat_00'].includes(track.target)), false);
  assert.deepEqual([...new Set(sceneIn.tracks.map(track=>track.target))].sort(),
    ['P_BG_00', 'P_NumPos001_00', 'P_NumPos010_00', 'P_NumPos100_00']);
  assert.deepEqual(
    sceneIn.tracks.filter(track=>track.property==='visible').map(track=>[track.target, track.keys[0].frame, track.keys[0].value]),
    [['P_NumPos010_00', 20, 0], ['P_NumPos100_00', 20, 0]],
  );
  assert.match(requestedLayouts, /'NewsUnread_U_00'/);
  assert.match(requestedAnims, /'NewsUnread_U_00_SceneIn'/);
  for(const unused of ['NewsWndwNews_U_00', 'NewsDetailUI_00', 'NewsElemCnt_00']){
    assert.equal(requestedLayouts.includes(unused), false, unused);
    assert.ok(news.layouts[unused]);
  }
  const upperRow=flatten(news.layouts.NewsWndwNews_U_00.roots);
  assert.equal(upperRow.some(pane=>['T_NetMode_00', 'T_Date_00', 'P_Bat_00', 'P_HudBase_00'].includes(pane.name)), false);
  assert.equal(news.layouts.NewsWndwNews_U_00.canvas.width, 320);
  assert.equal(requestedAnims.includes('NewsUnread_U_00_SceneOut'), false);
  assert.equal(JSON.stringify(news).includes('HudMenu_00'), false);
  assert.equal(Object.keys(selection.titles['000400300000a002'].packs).some(path=>path.includes('hud')), false);
  assert.equal(existsSync(new URL('packs/notifications/hud.json', firmware)), false);
  const bank=messages.messages.newslist_msbt_LZ;
  assert.equal(bank.messages[bank.labels.new_title_new].text, 'Notifications');
});

test('painter keeps unread SceneIn 20 plus the labelled title adapter; no HOME or title-local HudMenu bind', ()=>{
  assert.match(painter, /renderer\.draw\(top,'notifications','NewsTopUI_U_00'\)/);
  assert.match(painter, /renderer\.draw\(top,'notifications','NewsUnread_U_00',\{bindings:\[\{name:'NewsUnread_U_00_SceneIn',frame:20\}/);
  assert.match(painter, /options\.font\?\.draw\(top,message\('new_title_new'\)\.text\?\?view\.heading,200,14,14,'#555','center'\)/);
  assert.equal(painter.includes("alias:'notification-hud'"), false);
  assert.equal(painter.includes('HudMenu_00'), false);
  assert.equal(painter.includes("packs/home/hud.json"), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.equal(painter.includes('colorFit'), false);
});

test('the reused unread-dot pair keeps hashed upper 6239 / HUD 3347 / balloon 0', async t=>{
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
  const hud=count(nativeUpper, browserUpper, 0, 0, 400, 28);
  const body=count(nativeUpper, browserUpper, 0, 28, 400, 240);
  const balloon=count(nativeUpper, browserUpper, 100, 40, 300, 160);
  assert.equal(whole.n, 6239);
  assert.equal(whole.max, 255);
  assert.deepEqual(whole.at, [375, 2]);
  assert.equal(hud.n, 3347);
  assert.equal(hud.max, 255);
  assert.deepEqual(hud.at, [375, 2]);
  assert.equal(body.n, 2892);
  assert.equal(whole.n-hud.n, 2892);
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
});
