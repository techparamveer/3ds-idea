import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {poseNativeLayout} from '../src/os/native-layout.ts';
import {HOME_SETTINGS_MAX_SCROLL, homeSettingsActionAt, homeSettingsChoiceScroll} from '../src/os/stock-screen-layout.ts';
import {initialState, reduceMenu, touchMenu} from '../src/os/state.ts';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json', firmware)));
const petit=JSON.parse(readFileSync(new URL(manifest.home.petit, firmware)));
const messages=JSON.parse(readFileSync(new URL(manifest.home.messages, firmware)));
const presentation=readFileSync(new URL('../src/os/firmware-presentation.ts', import.meta.url), 'utf8');
const layout=readFileSync(new URL('../src/os/stock-screen-layout.ts', import.meta.url), 'utf8');
const stateSource=readFileSync(new URL('../src/os/state.ts', import.meta.url), 'utf8');
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const pane=(roots, name)=>flatten(roots).find(item=>item.name===name);
const settings=()=>reduceMenu({...initialState}, 'settings');
const bank=messages.messages.menu_msbt_LZ;
const message=label=>bank.messages[bank.labels[label]].text;

test('HOME petit already delivers dump-owned Image Share and StreetPass rows', ()=>{
  assert.equal(manifest.firmware, '10.7.0-32E');
  assert.equal(manifest.converter.name, 'ctr-native-web');
  assert.equal(manifest.converter.version, '1.2.0');
  assert.equal(manifest.converter.extractor.name, 'CTRTool');
  assert.equal(manifest.converter.extractor.version, '1.3.0');
  assert.equal(petit.schema, 1);
  assert.equal(petit.titleId, '0004003000009802');
  assert.equal(petit.sourceSha256, 'ea46084c50d4b3b5238bc8bd8937c71061a723dc1266b8edc34231740091f473');
  assert.equal(sha(new URL(manifest.home.petit, firmware)),
    'fefab482afa488f4b76d2d9e1839e9bb63d2202354d815f36921940f0c77eef3');
  assert.equal(sha(new URL(manifest.home.messages, firmware)),
    '3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2');
  assert.equal(messages.titleId, '0004003000009802');
  assert.equal(messages.resourceSources.messages.menu_msbt_LZ.path,
    'RomFS/message/EU_English/menu_msbt_LZ.bin');
  assert.equal(messages.resourceSources.messages.menu_msbt_LZ.sha256,
    '1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350');
  assert.equal(petit.resourceSources.layouts.PtDlgCnt_CTR.path, 'petit_LZ.bin/blyt/PtDlgCnt_CTR.bclyt');
  assert.equal(petit.resourceSources.layouts.PtDlgCnt_CTR.sha256,
    '539655c85596ac590ca08b3cf7bc497d4813010a3ec0c40a897e606ca783e995');
  assert.equal(petit.resourceSources.layouts.PtBtnM_Shr_00.sha256,
    '70b6af28f402042153916df5187e8814a08894bc00b7e4bba4fa19a489622959');
  assert.equal(petit.resourceSources.layouts.PtBtn_Sft_00.sha256,
    '606d6829e2fd08a95b926f59f5fd6fc5683f10b07e5ff073c3bd3d8bc9a0254d');
  assert.equal(petit.resourceSources.layouts.PtLine_00.sha256,
    'd70592c73d4c66f42233a82b7d3f468a1b7ef44075d5cd68b8009dcdd8916ac4');
  assert.equal(message('ptt_menu_upload'), 'Nintendo 3DS\nImage Share');
  assert.equal(message('ptt_mset'), 'System Settings');
  assert.equal(message('ptt_tiger'), 'Nintendo eShop');
});

test('Theme pose already shows Share/StreetPass/lines and keeps Prize/Cbnt/Info off', ()=>{
  const posed=poseNativeLayout(petit.layouts.PtDlgCnt_CTR, petit.animations, [
    {name:'PtDlgCnt_CTR_Theme', frame:1},
    {name:'PtDlgCnt_CTR_Prize', frame:0},
    {name:'PtDlgCnt_CTR_Cbnt', frame:0},
    {name:'PtDlgCnt_CTR_Info', frame:0},
  ]);
  const panes=Object.fromEntries(flatten(posed.roots).map(item=>[item.name, item]));
  assert.deepEqual([1,2,3,4,5].map(i=>panes[`N_Wrp_0${i}`].translation[1]+0), [0, 72, 0, 56, 64]);
  for(const name of ['N_BtnTheme_00','N_BtnMyMenu_00','N_BtnLgt_00','N_BtnAbl_00','N_BtnImgShr_00','N_BtnSft_00','N_Line_00','N_Line_01','N_Line_02','N_Line_03']){
    assert.equal(panes[name].flags&1, 1, name);
  }
  for(const name of ['N_BtnPrize_00','N_BtnCbnt_00','N_BtnInfo_00','N_Line_04']){
    assert.equal(panes[name].flags&1, 0, name);
  }
  assert.deepEqual(pane(petit.layouts.PtBtnM_Shr_00.roots, 'B_Btn_00').size, [202, 38]);
  assert.deepEqual(pane(petit.layouts.PtBtn_Sft_00.roots, 'B_Btn_00').translation, [-48, 2, 0]);
  assert.deepEqual(pane(petit.layouts.PtBtn_Sft_00.roots, 'B_Btn_01').translation, [48, 2, 0]);
  assert.equal(pane(petit.layouts.PtBtn_Sft_00.roots, 'N_BllnPos_00').alpha, 0);
});

test('painter binds the later CTR mounts, six-row 0..280 range, and labelled 88px thumb', ()=>{
  assert.equal(HOME_SETTINGS_MAX_SCROLL, 280);
  assert.match(presentation, /'PtBtnM_Shr_00'/);
  assert.match(presentation, /'PtBtn_Sft_00'/);
  assert.match(presentation, /N_BtnImgShr_00/);
  assert.match(presentation, /N_BtnSft_00/);
  assert.match(presentation, /N_Line_02/);
  assert.match(presentation, /N_Line_03/);
  assert.match(presentation, /ptt_menu_upload/);
  assert.match(presentation, /ptt_mset/);
  assert.match(presentation, /ptt_tiger/);
  assert.match(presentation, /SBBtn:\{size:\[22,88\]\}/);
  assert.match(presentation, /HOME_SETTINGS_MAX_SCROLL/);
  assert.match(layout, /HOME_SETTINGS_MAX_SCROLL = 280/);
  assert.match(layout, /image-share/);
  assert.match(layout, /streetpass/);
  assert.match(stateSource, /settings' \? 6/);
  assert.match(stateSource, /Image Share and StreetPass/);
  const settingsLower=presentation.slice(presentation.indexOf('function settingsLower'), presentation.indexOf('function folderSettingsLower'));
  assert.equal(settingsLower.includes('azahar-12p4-fit'), false);
  assert.equal(settingsLower.includes('colorFit'), false);
  assert.equal(layout.includes('azahar-12p4-fit'), false);
  assert.deepEqual(homeSettingsChoiceScroll(4, 0), 184);
  assert.deepEqual(homeSettingsChoiceScroll(5, 184), 280);
  assert.equal(homeSettingsActionAt(0, 152, 197), null);
  assert.equal(homeSettingsActionAt(184, 152, 197), 'image-share');
  assert.equal(homeSettingsActionAt(280, 104, 173), 'streetpass');
});

test('Open on Image Share and StreetPass stays on Settings', ()=>{
  let state=settings();
  for(let i=0;i<4;i++)state=reduceMenu(state, 'down');
  assert.equal(state.panelChoice, 4);
  assert.equal(state.panelScroll, 184);
  assert.equal(reduceMenu(state, 'open').panel, 'settings');
  state=reduceMenu(state, 'down');
  assert.equal(state.panelChoice, 5);
  assert.equal(state.panelScroll, HOME_SETTINGS_MAX_SCROLL);
  assert.equal(reduceMenu(state, 'open').panel, 'settings');
  const share=touchMenu({...settings(), panelScroll:184}, 152, 197);
  assert.equal(share.panel, 'settings');
  assert.equal(share.panelChoice, 4);
  const street=touchMenu(state, 104, 173);
  assert.equal(street.panel, 'settings');
  assert.equal(street.panelChoice, 5);
});

test('the hashed scroll-0 pair keeps the assigned lower clusters until a scrolled recapture', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001';
  const files={
    native:`${root}/native-home-design-20261002/screenshots/_02.10.26_02.08.07.154.png`,
    lower:`${root}/home-design-lower/reference/scenario-matrix/v1/captures/settings-lower-integrated/browser/lower.png`,
    upper:`${root}/home-design-lower/reference/scenario-matrix/v1/captures/settings-lower-integrated/browser/upper.png`,
    report:`${root}/home-design-lower/compare-integrated/report.json`,
    contact:`${root}/home-design-lower/compare-integrated/lower-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.lower, files.upper, files.report, files.contact].every(existsSync)){
    return t.skip('private HOME Design integrated pair is absent');
  }
  assert.equal(sha(files.native), 'e9a87578a05c08e428f4c83669501c5744541c37245df1dcd9b135cbde53d839');
  assert.equal(sha(files.lower), 'a81922e7b037eb479b19bf99787928068dde0fdbae70e992ef40bf952cc52511');
  assert.equal(sha(files.upper), '651f314ef4466ccbb0857ad7064816918cc01c860b17ca73f4027f85ebf994ec');
  assert.equal(sha(files.report), 'e70b0852c5404ff50c73aa9434f2366e67df8436cfab8504df540defa612e7f2');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 36195);
  assert.equal(report.screens.lower.pixelsOverThreshold, 9630);
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
  assert.equal(whole.n, 9630);
  assert.equal(count(nativeLower, browserLower, 294, 46, 320, 190).n, 3288);
  assert.equal(count(nativeLower, browserLower, 0, 37, 26, 205).n, 3111);
  assert.equal(count(nativeLower, browserLower, 294, 212, 320, 240).n, 728);
});
