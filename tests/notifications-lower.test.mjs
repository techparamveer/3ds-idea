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
const sample=(track, frame)=>{
  const keys=track.keys; if(!keys.length)return 0;
  if(keys.length===1||frame<=keys[0].frame)return keys[0].value;
  if(frame>=keys.at(-1).frame)return keys.at(-1).value;
  throw new Error(`unexpected interpolation ${track.target} ${track.property} @ ${frame}`);
};
const requested=painter.match(/alias:'notifications',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
const requestedLayouts=requested[1]??'';
const requestedAnims=requested[2]??'';

test('already-bound Close SceneIn 20 + new_back and row SceneIn 10 / Select 0; unused clips do not own the leftovers', ()=>{
  assert.equal(news.titleId, '000400300000a002');
  assert.equal(news.sourceSha256, '4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366');
  assert.equal(sha(new URL('packs/notifications/news.json', firmware)),
    '9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375');
  assert.equal(news.resourceSources.layouts.NewsTopBtn_D_00.sha256,
    '3d2c34fc60e178c92903f5306412a718fc2b7d8358e269101db4e0e8e10a4836');
  assert.equal(news.resourceSources.animations.NewsTopBtn_D_00_SceneIn.sha256,
    '753d11b86290446d9343fb516dec083dc48647e32c7700281ab3c06ea29a1ee5');
  assert.equal(news.resourceSources.layouts.NewsWndwNews_D_00.sha256,
    'dfa42ef3e245a0abd77afba4653352aaf685fbdda65a91550b163421cf91ce80');
  assert.equal(news.resourceSources.animations.NewsWndwNews_D_00_SceneIn.sha256,
    'fb3f2bbbf31ea8cb590ef67f56b1017f967984d798292a702eb8cb169a3fa785');
  assert.equal(news.resourceSources.animations.NewsWndwNews_D_00_Select.sha256,
    '7202e8c8807c5954b676c2af3efde9c8c12cfcd8de14cf2af2cc552ae0e9c78d');
  assert.match(requestedLayouts, /'NewsTopBtn_D_00'/);
  assert.match(requestedLayouts, /'NewsWndwNews_D_00'/);
  assert.match(requestedAnims, /'NewsTopBtn_D_00_SceneIn'/);
  assert.match(requestedAnims, /'NewsWndwNews_D_00_SceneIn'/);
  assert.match(requestedAnims, /'NewsWndwNews_D_00_Select'/);
  assert.match(requestedAnims, /'NewsTopBtn_D_00_Decide'/);
  for(const unused of ['NewsTopBtn_D_00_Select', 'NewsTopBtn_D_00_SceneOut',
    'NewsWndwNews_D_00_Decide', 'NewsWndwNews_D_00_SceneOut']){
    assert.equal(requestedAnims.includes(unused), false, unused);
    assert.ok(news.animations[unused], unused);
  }
  for(const missing of ['NewsTopBtn_D_00_Default', 'NewsTopBtn_D_00_Disable', 'NewsWndwNews_01']){
    assert.equal(Object.hasOwn(news.layouts, missing), false, missing);
    assert.equal(Object.hasOwn(news.animations, missing), false, missing);
    assert.equal(requestedLayouts.includes(missing), false, missing);
    assert.equal(JSON.stringify(news).includes(missing), false, missing);
  }
  const btn=Object.fromEntries(flatten(news.layouts.NewsTopBtn_D_00.roots).map(pane=>[pane.name, pane]));
  assert.equal(btn.P_Btn_00.kind, 'pic1');
  assert.deepEqual(btn.P_Btn_00.size, [320, 28]);
  assert.deepEqual(btn.P_Btn_00.translation, [0, -120, 0]);
  assert.equal(btn.T_EndF_00.kind, 'txt1');
  assert.equal(btn.T_EndB_00.kind, 'txt1');
  assert.equal(news.layouts.NewsTopBtn_D_00.fonts[0], 'cbf_std.bcfnt');
  const sceneIn=news.animations.NewsTopBtn_D_00_SceneIn;
  const select=news.animations.NewsTopBtn_D_00_Select;
  const key=track=>`${track.target}|${track.property}`;
  const sceneIn20=Object.fromEntries(sceneIn.tracks.map(track=>[key(track), sample(track, 20)]));
  const select0=Object.fromEntries(select.tracks.map(track=>[key(track), sample(track, 0)]));
  assert.deepEqual(sceneIn20, select0);
  assert.equal(select.tracks.find(track=>track.target==='P_Btn_00'&&track.property==='translation.y').keys.at(-1).value, -121);
  const sceneOut=news.animations.NewsTopBtn_D_00_SceneOut;
  assert.deepEqual(
    sceneOut.tracks.filter(track=>track.target==='P_Btn_00'&&track.property==='alpha').map(track=>track.keys.map(item=>[item.frame, item.value])),
    [[[0, 255], [20, 0]]],
  );
  const rowSelect=news.animations.NewsWndwNews_D_00_Select;
  assert.equal(rowSelect.tracks.some(track=>track.target.startsWith('T_NewsTitle')), false);
  for(const clip of ['NewsWndwNews_D_00_Decide', 'NewsWndwNews_D_00_SceneOut']){
    assert.equal(news.animations[clip].tracks.some(track=>track.target.startsWith('T_NewsTitle')), false, clip);
    assert.deepEqual([...new Set(news.animations[clip].tracks.map(track=>track.target))].sort(),
      ['N_News_00', 'P_BllnDir_00', 'P_Blln_00']);
  }
  const upperRow=flatten(news.layouts.NewsWndwNews_U_00.roots);
  assert.equal(upperRow.some(pane=>pane.name==='P_Blln_00'||pane.name==='T_EndF_00'), false);
  assert.equal(flatten(news.layouts.NewsDetailUI_00.roots).some(pane=>pane.name==='T_CloseF_00'), true);
  assert.equal(flatten(news.layouts.NewsElemCnt_00.roots).some(pane=>pane.name.startsWith('T_NewsTitle')||pane.name==='T_EndF_00'), false);
  const bank=messages.messages.newslist_msbt_LZ;
  assert.equal(bank.messages[bank.labels.new_back].text, ' Close');
  assert.equal(bank.messages[bank.labels.new_close].text, 'Close');
  assert.equal(bank.messages[bank.labels.new_close_big].text, 'Close');
  assert.equal(messages.resourceSources.messages.newslist_msbt_LZ.sha256,
    '72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62');
  assert.equal(selection.titles['000400300000a002'].packs['packs/notifications/news.json'].animations.includes('NewsTopBtn_D_00_Select'), true);
  assert.equal(selection.titles['000400300000a002'].packs['packs/notifications/news.json'].layouts.includes('NewsWndwNews_01'), false);
});

test('painter retains list bindings and native footer sampling, with Decide 5 only for requested footer close', ()=>{
  assert.match(painter, /renderer\.draw\(bottom,'notifications','NewsTopBtn_D_00',\{bindings:\[\{name:'NewsTopBtn_D_00_SceneIn',frame:20\}\],textSampling:'lcd',textSamplingPanes:\['T_EndB_00'\],overrides:\{T_EndB_00:message\('new_back'\),T_EndF_00:\{\.\.\.message\('new_back'\),singleLineBlockOrigin:'writer-0x110'\}\}\}/);
  assert.match(painter, /renderer\.draw\(bottom,'notifications','NewsWndwNews_D_00',\{textSampling:'lcd',textSamplingPanes:\['T_NewsTitleB_00','T_NewsTitleF_00'\],bindings:\[\s*\{name:'NewsWndwNews_D_00_SceneIn',frame:10\}/);
  assert.match(painter, /\{name:'NewsWndwNews_D_00_Select',frame:view\.data\?\.selectionActive===true&&index===view\.selection\?1:0\}/);
  assert.equal(painter.includes('NewsTopBtn_D_00_Select'), false);
  assert.match(painter, /if\(options\.notificationsFooterClose\)okay=renderer\.draw\(bottom,'notifications','NewsTopBtn_D_00',\{\s*bindings:\[\{name:'NewsTopBtn_D_00_SceneIn',frame:20\},\{name:'NewsTopBtn_D_00_Decide',frame:5,groups:\['G_BtnEnd_00'\]\}\]/);
  assert.equal(painter.includes('NewsTopBtn_D_00_SceneOut'), false);
  assert.equal(painter.includes('NewsWndwNews_D_00_Decide'), false);
  assert.equal(painter.includes('NewsWndwNews_D_00_SceneOut'), false);
  assert.equal(painter.includes('NewsWndwNews_01'), false);
  assert.equal(painter.includes("message('new_close')"), false);
  assert.equal(painter.includes('NewsTopBtn_D_00_Default'), false);
  assert.equal(painter.includes('NewsTopBtn_D_00_Disable'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.equal(painter.includes('colorFit'), false);
  assert.equal(painter.match(/textSampling:'lcd/g).length, 3, 'the row-title and both normal/closing T_EndB_00 allowlists');
  assert.match(painter, /'NewsWndwNews_D_00',\{textSampling:'lcd',textSamplingPanes:\['T_NewsTitleB_00','T_NewsTitleF_00'\],bindings:/);
});

test('the reused unread-dot pair keeps hashed lower 3876 / Close 577 / list 820', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:`${root}/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`,
    lower:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/captures/notifications-unread-dot-f073581/browser/lower.png`,
    report:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/report.json`,
    contact:`${root}/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/lower-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.lower, files.report, files.contact].every(existsSync)){
    return t.skip('private Notifications unread-dot pair is absent');
  }
  assert.equal(sha(files.native), '58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389');
  assert.equal(sha(files.lower), 'bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce');
  assert.equal(sha(files.report), 'f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6');
  assert.equal(sha(files.contact), 'b1913774dfa9578cf9865acdafff7391534948a83eecbf62120cb4c01281edda');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const nativeLower=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const browserLower=await sharp(files.lower).ensureAlpha().raw().toBuffer();
  const count=(native, browser, x0, y0, x1, y1)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*320+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  const whole=count(nativeLower, browserLower, 0, 0, 320, 240);
  const scrollbar=count(nativeLower, browserLower, 291, 0, 320, 210);
  const body=count(nativeLower, browserLower, 0, 0, 291, 210);
  const titles=count(nativeLower, browserLower, 50, 0, 280, 210);
  const icons=count(nativeLower, browserLower, 0, 0, 50, 210);
  const first=count(nativeLower, browserLower, 0, 0, 291, 48);
  const footer=count(nativeLower, browserLower, 0, 210, 320, 240);
  const glyphs=count(nativeLower, browserLower, 125, 216, 195, 234);
  const seam=count(nativeLower, browserLower, 0, 210, 320, 214);
  assert.equal(whole.n, 3876);
  assert.equal(whole.max, 140);
  assert.deepEqual(whole.at, [165, 227]);
  assert.equal(scrollbar.n, 2479);
  assert.equal(body.n, 820);
  assert.equal(body.max, 18);
  assert.deepEqual(body.at, [124, 111]);
  assert.equal(titles.n, 820);
  assert.equal(icons.n, 0);
  assert.equal(first.n, 0);
  assert.equal(footer.n, 577);
  assert.equal(footer.max, 140);
  assert.deepEqual(footer.at, [165, 227]);
  assert.equal(glyphs.n, 521);
  assert.equal(seam.n, 56);
  assert.equal(glyphs.n+seam.n, footer.n);
  assert.equal(scrollbar.n+body.n+footer.n, whole.n);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 3876);
  assert.equal(report.screens.upper.pixelsOverThreshold, 6239);
  assert.deepEqual(report.screens.lower.regions[3], {x:148, y:216, width:11, height:17, pixelCount:91});
  assert.deepEqual(report.screens.lower.regions[13], {x:75, y:57, width:9, height:4, pixelCount:19});
  const dumpNews='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/romfs/news_LZ.bin';
  if(existsSync(dumpNews)){
    assert.equal(sha(dumpNews), '4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366');
  }
});
