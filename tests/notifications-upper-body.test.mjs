import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const news=JSON.parse(readFileSync(new URL('packs/notifications/news.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/notifications/messages-and-loose.json', firmware), 'utf8'));
const font=JSON.parse(readFileSync(new URL('fonts/shared/font.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const requested=painter.match(/alias:'notifications',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
const requestedLayouts=requested[1]??'';
const requestedAnims=requested[2]??'';

test('already-bound NewsUnread_U_00 cards own SpotPass/StreetPass; unused NewsWndwNews_U_00 is a 320x240 row', ()=>{
  assert.equal(news.titleId, '000400300000a002');
  assert.equal(news.sourceSha256, '4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366');
  assert.equal(sha(new URL('packs/notifications/news.json', firmware)),
    '9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375');
  assert.equal(news.resourceSources.layouts.NewsUnread_U_00.sha256,
    '0362c72dc421800a3e91647bc04800810ae35a589be4f92cbc4e8a478cb0751d');
  assert.equal(news.resourceSources.layouts.NewsTopUI_U_00.sha256,
    'dfe4583dab0a9c212380921957b673d6d435b42d84f9125919322f79bc09c547');
  assert.equal(news.resourceSources.layouts.NewsWndwNews_U_00.sha256,
    'ccbbe37375c89762995ce7720702b1446e20a6f94c15716e9a8de388a9625ab8');
  assert.equal(news.resourceSources.animations.NewsUnread_U_00_SceneIn.sha256,
    'e46adce67ac0b229bcc45ad6232693f526b4cb28f540176a785b52f401ff4d15');
  assert.equal(news.resourceSources.animations.NewsUnread_U_00_NumAnim.sha256,
    'f92a10375d493ec4a6c4dbcfe62a86b78a1f19fa4e2f0470083faf0aad15ca6b');
  assert.match(requestedLayouts, /'NewsTopUI_U_00'/);
  assert.match(requestedLayouts, /'NewsUnread_U_00'/);
  assert.match(requestedAnims, /'NewsUnread_U_00_SceneIn'/);
  assert.match(requestedAnims, /'NewsUnread_U_00_NumAnim'/);
  assert.equal(requestedLayouts.includes('NewsWndwNews_U_00'), false);
  assert.equal(requestedAnims.includes('NewsWndwNews_U_00_SceneIn'), false);
  assert.equal(requestedAnims.includes('NewsUnread_U_00_SceneOut'), false);

  const top=flatten(news.layouts.NewsTopUI_U_00.roots);
  assert.deepEqual(top.map(pane=>pane.name), ['RootPane', 'P_Bg_U_00', 'N_Scroll_00', 'N_ElemPos_00']);
  assert.deepEqual(news.layouts.NewsTopUI_U_00.textures, ['BgLgt.bclim', 'BgLine.bclim']);
  assert.equal(Object.keys(news.animations).some(name=>name.startsWith('NewsTopUI_U_00')), false);
  const slot=top.find(pane=>pane.name==='N_ElemPos_00');
  assert.deepEqual(slot.size, [264, 54]);
  assert.deepEqual(slot.translation, [-160, -140, 0]);
  assert.equal(slot.children.length, 0);

  const unread=Object.fromEntries(flatten(news.layouts.NewsUnread_U_00.roots).map(pane=>[pane.name, pane]));
  assert.equal(news.layouts.NewsUnread_U_00.fonts[0], 'cbf_std.bcfnt');
  for(const name of ['T_News_00', 'T_Cnt_00', 'T_NewsUnread_00', 'T_CntUnread_00']){
    assert.equal(unread[name].kind, 'txt1', name);
    assert.equal(unread[name].origin, 7, name);
    assert.equal(unread[name].text.alignment, 4, name);
    assert.equal(unread[name].text.lineAlignment, 2, name);
    assert.equal(unread[name].text.flags, 0, name);
    assert.deepEqual(unread[name].text.size, [15.000000953674316, 18], name);
  }
  assert.deepEqual(news.layouts.NewsUnread_U_00.materials[8].constantColors[0], [0, 151, 221, 255]);
  assert.deepEqual(news.layouts.NewsUnread_U_00.materials[10].constantColors[0], [0, 166, 5, 255]);
  assert.deepEqual(unread.T_Unread_00.text.size, [18.75, 22.5]);
  assert.equal(unread.T_Unread_00.origin, 1);
  assert.equal(unread.T_Unread_00.text.lineAlignment, 1);

  const row=news.layouts.NewsWndwNews_U_00;
  assert.deepEqual(row.roots[0].size, [320, 240]);
  const rowPanes=Object.fromEntries(flatten(row.roots).map(pane=>[pane.name, pane]));
  assert.equal(rowPanes.T_NewsTitleF_00.kind, 'txt1');
  assert.equal(rowPanes.P_Icon_00.kind, 'pic1');
  assert.equal(rowPanes.T_News_00, undefined);
  assert.equal(rowPanes.T_Cnt_00, undefined);
  assert.equal(rowPanes.P_BllnN_L_00, undefined);

  const list=messages.messages.newslist_msbt_LZ;
  assert.equal(list.messages[list.labels.new_news_u1].text, 'SpotPass\nNotifications');
  assert.equal(list.messages[list.labels.new_ce_u1].text, 'StreetPass\nNotifications');
  assert.equal(list.messages[list.labels.new_news_u0].text, 'Unread: %d');
  assert.equal(list.messages[list.labels.new_ce_u0].text, 'Unread: %d');
  const styles=messages.styles[list.styleTable].styles;
  for(const index of [104, 105, 106, 107]){
    assert.deepEqual(styles[index].fontScale, [0.6000000238418579, 0.6000000238418579], index);
  }
  assert.equal(font.height, 30);
  assert.equal(font.lineFeed, 30);
  assert.equal(font.width, 25);
  assert.deepEqual([font.width*0.6, font.height*0.6], [15, 18]);
  assert.equal(messages.resourceSources.messages.newslist_msbt_LZ.sha256,
    '72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62');
  assert.equal(messages.resourceSources.styles['message/EU_English/RI_mstl_LZ.bin'].sha256,
    '23833acc620efbf4f5119ce7c0dace5ac68e9055f79eb54cc3489c60b6d65834');
});

test('painter keeps already-bound upper cards; no HUD/SlideBar/snap/lcd guess on this slice', ()=>{
  assert.match(painter, /renderer\.draw\(top,'notifications','NewsTopUI_U_00'\)/);
  assert.match(painter, /renderer\.draw\(top,'notifications','NewsUnread_U_00',\{bindings:\[\{name:'NewsUnread_U_00_SceneIn',frame:20\}/);
  assert.match(painter, /T_News_00:message\('new_news_u1'\)/);
  assert.match(painter, /T_Cnt_00:message\('new_ce_u1'\)/);
  assert.match(painter, /T_NewsUnread_00:count\('new_news_u0',unread\)/);
  assert.match(painter, /T_CntUnread_00:count\('new_ce_u0',0\)/);
  assert.equal(painter.includes("layouts:['NewsTopUI_U_00'"), true);
  assert.equal(painter.includes("'NewsWndwNews_U_00'"), false);
  assert.equal(painter.includes('T_News_00:{translation'), false);
  assert.equal(painter.includes('T_Cnt_00:{translation'), false);
  // Lower row titles and Close shadow T_EndB_00 only; no upper-card LCD sampling.
  assert.deepEqual(painter.match(/textSampling[^,]*/g), ["textSampling:'lcd'", "textSamplingPanes:['T_NewsTitleB_00'", "textSampling:'lcd'", "textSamplingPanes:['T_EndB_00']"]);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('multilineBlockOrigin'), false);
  assert.match(painter, /renderer\.draw\(top,'notification-hud','HudMenu_00'/);
  assert.match(painter, /\{name:'HudMenu_00_SceneIn',frame:NOTIFICATION_HUD_SCENE_IN\}/);
});

test('the reused unread-dot pair keeps body 2892 as 1px-low official card glyphs', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:`${root}/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`,
    upper:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/captures/notifications-unread-dot-f073581/browser/upper.png`,
    report:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/report.json`,
    contact:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/upper-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.upper, files.report, files.contact].every(existsSync)){
    return t.skip('private Notifications unread-dot pair is absent');
  }
  assert.equal(sha(files.native), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(files.upper), '78ff0a5ac9db09ebcb85799d23292a5c26f698c414851d46738e79dc51a16d02');
  assert.equal(sha(files.report), 'f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6');
  assert.equal(sha(files.contact), '4ba3d2da61e9bbf508bdc7de12513ed451e072bb007485a353aa274ee38c935c');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const nativeFull=await sharp(files.native).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const browser=await sharp(files.upper).ensureAlpha().raw().toBuffer();
  const width=400, height=240;
  const native=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++){
    native.set(nativeFull.data.subarray(y*nativeFull.info.width*4, (y*nativeFull.info.width+width)*4), y*width*4);
  }
  const rgb=(buf,x,y)=>{
    if(x<0||y<0||x>=width||y>=height)return [0, 0, 0];
    const i=(y*width+x)*4;
    return [buf[i], buf[i+1], buf[i+2]];
  };
  const count=(x0, y0, x1, y1, dx=0, dy=0)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const a=rgb(native, x, y), b=rgb(browser, x+dx, y+dy);
      const e=Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]), Math.abs(a[2]-b[2]));
      if(e>max){max=e; at=[x, y, a, b];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  assert.equal(count(0, 0, 400, 240).n, 6239);
  assert.equal(count(0, 0, 400, 28).n, 3347);
  const body=count(0, 28, 400, 240);
  assert.equal(body.n, 2892);
  assert.equal(body.max, 211);
  assert.deepEqual(body.at[0], 106);
  assert.deepEqual(body.at[1], 187);
  assert.deepEqual(body.at[2], [211, 233, 232]);
  assert.deepEqual(body.at[3], [0, 151, 221]);
  assert.equal(count(100, 40, 300, 160).n, 0);
  assert.equal(count(0, 28, 400, 155).n, 0);
  assert.equal(count(196, 155, 204, 232).n, 0);
  assert.equal(count(8, 155, 196, 232).n, 1421);
  assert.equal(count(204, 155, 392, 232).n, 1471);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  const bodyRegions=report.screens.upper.regions.filter(region=>region.y>=28);
  assert.equal(bodyRegions.length, 97);
  assert.equal(bodyRegions.reduce((sum, region)=>sum+region.pixelCount, 0), 2892);
  assert.deepEqual(bodyRegions[0], {x:87, y:183, width:15, height:11, pixelCount:136});
  let shifted=0;
  for(const region of bodyRegions){
    const box=count(region.x, region.y, region.x+region.width, region.y+region.height, 0, -1);
    assert.equal(box.n, 0, JSON.stringify({region, box}));
    shifted+=box.n;
  }
  assert.equal(shifted, 0);
  assert.ok(count(0, 28, 400, 240, 0, -1).n>2892);
  const dumpNews='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/romfs/news_LZ.bin';
  if(existsSync(dumpNews)){
    assert.equal(sha(dumpNews), '4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366');
  }
});
