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
const slidebar=JSON.parse(readFileSync(new URL('packs/notifications/slidebar.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const requested=painter.match(/alias:'notification-slidebar',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
const requestedLayouts=requested[1]??'';
const requestedAnims=requested[2]??'';

test('already-bound SlideBar Select 0; unused Invalid and Select 1 do not own the thumb', ()=>{
  assert.equal(slidebar.titleId, '000400300000a002');
  assert.equal(slidebar.sourceSha256, '53f89c1107837d289c83c06783b5ffa0ddabc4298a622dbc3725990b483ffbbd');
  assert.equal(sha(new URL('packs/notifications/slidebar.json', firmware)),
    '4de274d4eded27e71af003c406fa3490473a73df8230199f35277c19963acf3c');
  assert.equal(slidebar.resourceSources.layouts.SlideBar.sha256,
    '95b8f85852202c608a0b7579777a6643bc577d2820a5eef1c55555c6841a2c6d');
  assert.equal(slidebar.resourceSources.animations.SlideBar_Select.sha256,
    'da211dd02ab53477e33716e36993e2d6f39254f0bb5749702350a7d98b28a7d9');
  assert.equal(slidebar.resourceSources.animations.SlideBar_Invalid.sha256,
    '6f889db658277dbe6e150f5638628777d51ec7d79784f7cb6998d706e7c981f8');
  assert.deepEqual(Object.keys(slidebar.layouts), ['SlideBar']);
  assert.deepEqual(Object.keys(slidebar.animations).sort(), ['SlideBar_Invalid', 'SlideBar_Select']);
  const bar=Object.fromEntries(flatten(slidebar.layouts.SlideBar.roots).map(pane=>[pane.name, pane]));
  assert.deepEqual(bar.N_Slider_00.translation, [0, 0, 0]);
  assert.deepEqual(bar.N_Slide_00.translation, [-0, -0, 0]);
  assert.deepEqual(bar.SBBtn.size, [22, 22]);
  assert.deepEqual(bar.SBBaseWndw.size, [16, 132]);
  const list=Object.fromEntries(flatten(news.layouts.NewsTopUI_D_00.roots).map(pane=>[pane.name, pane]));
  assert.deepEqual(list.N_SlideBar_00.translation, [141, 14, 0]);
  assert.deepEqual(list.N_SlideBar_00.size, [8, 184]);
  assert.equal(news.resourceSources.layouts.NewsTopUI_D_00.sha256,
    'd11a58036237a9051b34a05a1bebdc0dae84c366fbc11e6d2f1c556fee00e66b');
  const select=slidebar.animations.SlideBar_Select;
  assert.equal(select.tracks.some(track=>track.property==='translation'||track.property==='size'), false);
  assert.deepEqual(
    select.tracks.filter(track=>track.property==='visible').map(track=>[track.target, track.keys[0].frame, track.keys[0].value]),
    [['SBBaseLine_00', 60, 1], ['N_Slide_00', 60, 1]],
  );
  const invalid=slidebar.animations.SlideBar_Invalid;
  assert.equal(invalid.tracks.some(track=>track.property==='translation'||track.property==='size'), false);
  assert.deepEqual(
    invalid.tracks.filter(track=>track.property==='visible').map(track=>[track.target, track.keys.at(-1).frame, track.keys.at(-1).value]),
    [['SBBaseLine_00', 1, 0], ['N_Slide_00', 1, 0]],
  );
  assert.match(requestedLayouts, /'SlideBar'/);
  assert.match(requestedAnims, /'SlideBar_Select'/);
  assert.equal(requestedAnims.includes('SlideBar_Invalid'), false);
  assert.equal(selection.titles['000400300000a002'].packs['packs/notifications/slidebar.json'].animations.includes('SlideBar_Invalid'), true);
  const newsRequested=painter.match(/alias:'notifications',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
  for(const unused of ['NewsWndwNews_U_00', 'NewsDetailUI_00', 'NewsElemCnt_00']){
    assert.equal((newsRequested[1]??'').includes(unused), false, unused);
  }
  assert.equal(flatten(news.layouts.NewsWndwNews_U_00.roots).some(pane=>pane.name==='N_SlideBar_00'||pane.name==='N_Slide_00'), false);
  assert.equal(flatten(news.layouts.NewsElemCnt_00.roots).some(pane=>pane.name==='N_SlideBar_00'||pane.name==='N_Slide_00'), false);
  const detailBar=flatten(news.layouts.NewsDetailUI_00.roots).find(pane=>pane.name==='N_SlideBar_00');
  assert.deepEqual(detailBar.size, [8, 132]);
  assert.deepEqual(detailBar.translation, [300, -124, 0]);
  assert.notDeepEqual(detailBar.translation, list.N_SlideBar_00.translation);
  assert.notDeepEqual(detailBar.size, list.N_SlideBar_00.size);
});

test('painter keeps Select frame 0 plus the unsupported [0,55] thumb; no Invalid or fit', ()=>{
  assert.match(painter, /alias:'notification-slidebar',layouts:\['SlideBar'\],animations:\['SlideBar_Select'\]/);
  assert.match(painter, /renderer\.draw\(bottom,'notification-slidebar','SlideBar',\{bindings:\[\{name:'SlideBar_Select',frame:0\}\],overrides:\{N_Slider_00:\{translation:\[141,14,0\]\},N_Slide_00:\{translation:\[0,55,0\]\}\}\}/);
  assert.equal(painter.includes('SlideBar_Invalid'), false);
  assert.equal(painter.includes("packs/home/slidebar.json"), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.equal(painter.includes('colorFit'), false);
});

test('the reused unread-dot pair keeps hashed lower 3876 / scrollbar 2479', async t=>{
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
  const scrollbar20=count(nativeLower, browserLower, 291, 0, 311, 210);
  const body=count(nativeLower, browserLower, 0, 0, 291, 210);
  const footer=count(nativeLower, browserLower, 0, 210, 320, 240);
  assert.equal(whole.n, 3876);
  assert.equal(whole.max, 140);
  assert.deepEqual(whole.at, [165, 227]);
  assert.equal(scrollbar.n, 2479);
  assert.equal(scrollbar.max, 117);
  assert.deepEqual(scrollbar.at, [300, 63]);
  assert.equal(scrollbar20.n, 2479);
  assert.equal(body.n, 820);
  assert.equal(footer.n, 577);
  assert.equal(scrollbar.n+body.n+footer.n, whole.n);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 3876);
  assert.equal(report.screens.upper.pixelsOverThreshold, 6239);
  assert.deepEqual(report.screens.lower.regions[0], {x:291, y:56, width:20, height:69, pixelCount:1336});
  assert.deepEqual(report.screens.lower.regions[1], {x:291, y:5, width:20, height:41, pixelCount:727});
  assert.deepEqual(report.screens.lower.regions[2], {x:297, y:162, width:8, height:44, pixelCount:308});
  assert.deepEqual(report.screens.lower.regions[9], {x:294, y:46, width:14, height:4, pixelCount:54});
  assert.deepEqual(report.screens.lower.regions[10], {x:294, y:52, width:14, height:4, pixelCount:54});
  assert.equal(
    report.screens.lower.regions[0].pixelCount
    +report.screens.lower.regions[1].pixelCount
    +report.screens.lower.regions[2].pixelCount
    +report.screens.lower.regions[9].pixelCount
    +report.screens.lower.regions[10].pixelCount,
    2479,
  );
  const dumpBar='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/romfs/slidebar_LZ.bin';
  if(existsSync(dumpBar)){
    assert.equal(sha(dumpBar), '53f89c1107837d289c83c06783b5ffa0ddabc4298a622dbc3725990b483ffbbd');
  }
});
