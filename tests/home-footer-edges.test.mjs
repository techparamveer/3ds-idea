import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {getHomeFooter} from '../src/os/home-presentation.ts';
import {createPortfolioState} from '../src/os/system.ts';
import {createHomeNavigation, writeHomeNavigation} from '../src/os/home-navigation.ts';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const launcher=JSON.parse(readFileSync(new URL('packs/home/launcher.json', firmware), 'utf8'));
const evidence=JSON.parse(readFileSync(new URL('../docs/evidence/home-footer-theme-runtime.json', import.meta.url), 'utf8'));
const presentation=readFileSync(new URL('../src/os/firmware-presentation.ts', import.meta.url), 'utf8');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const pane=(layout, name)=>flatten(layout.roots).find(item=>item.name===name);
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

const footer=launcher.layouts.LncBtmBtn_02;
const material=name=>footer.materials.find(item=>item.name===name);

test('LncBtmBtn_02 is the already-bound Manual / Open footer, not an unused layout', ()=>{
  assert.equal(launcher.titleId, '0004003000009802');
  assert.equal(launcher.sourceSha256, '826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834');
  assert.equal(sha(new URL('packs/home/launcher.json', firmware)),
    'f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044');
  assert.equal(launcher.resourceSources.layouts.LncBtmBtn_02.path,
    'launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt');
  assert.equal(launcher.resourceSources.layouts.LncBtmBtn_02.sha256,
    '1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44');
  assert.equal(launcher.resourceSources.textures['LncBtmBtn_10.bclim'].sha256,
    '40a5977b8f9da6f5b779bc337de4c6dc19c008b9aebf25f6b38613280b13a15c');
  assert.equal(launcher.resourceSources.textures['LncBtmBtn_11.bclim'].sha256,
    '473ea371837ccdbb4a47bf219cb14f17e7b5178a22fca5a8be1136134b70f191');
  assert.deepEqual(footer.textures, [
    'LncBtmBtn_10.bclim',
    'LncBtmBtn_11.bclim',
    'LncBtmBtnLine_10.bclim',
    'LncBtmBtnLine_11.bclim',
    'LncBtmBtnShdw_01.bclim',
    'PageArrowIcon.bclim',
  ]);
  assert.deepEqual(Object.keys(launcher.layouts).filter(name=>/Btm|Footer/i.test(name)), ['LncBtmBtn_02']);
  const requested=presentation.match(/launcher:\[([^\]]+)\]/)[1];
  assert.match(requested, /'LncBtmBtn_02'/);
});

test('P_BtnW_C_01 and P_EdgeW_C_01 stay identical authored materials; _12 stays unused', ()=>{
  assert.equal(pane(footer, 'P_BtnW_C_01').picture.material, 0);
  assert.equal(pane(footer, 'P_EdgeW_C_01').picture.material, 3);
  assert.deepEqual(evidence.decodedLayout.paneMaterialIndexes, {
    'P_BtnW_C_01': 0,
    'P_EdgeW_C_01': 3,
  });
  const button=material('P_BtnW_C_01');
  const edge=material('P_EdgeW_C_01');
  assert.deepEqual(
    Object.fromEntries(Object.entries(button).filter(([key])=>key!=='name')),
    Object.fromEntries(Object.entries(edge).filter(([key])=>key!=='name')),
  );
  assert.equal(button.flags, 1962);
  assert.deepEqual([0, 2, 1].map(index=>button.constantColors[index].slice(0, 3)), [
    [255, 254, 250],
    [255, 255, 255],
    [223, 219, 215],
  ]);
  assert.equal(footer.textures.includes('LncBtmBtn_12.bclim'), false);
  assert.equal(footer.textures.includes('LncBtmBtnLine_12.bclim'), false);
  assert.equal(presentation.includes('LncBtmBtn_12'), false);
  assert.equal(presentation.includes('LncBtmBtnLine_12'), false);
  assert.equal(evidence.status, 'source-gap');
});

test('footer() already clips below y=210 and samples Manual / Open with lcd text', ()=>{
  const start=presentation.indexOf('function footer(');
  const end=presentation.indexOf('function tilePressOffset(');
  const body=presentation.slice(start, end);
  assert.match(body, /'LncBtmBtn_02'/);
  assert.match(body, /clip:\[0,210,320,30\]/);
  assert.match(body, /textSampling:'lcd'/);
  assert.match(body, /manual:'lau_2b_manual'/);
  assert.match(body, /open:'lau_2b_folder_open'/);
  assert.equal(body.includes('colorFit'), false);
  assert.equal(body.includes('cool-edge'), false);
  assert.equal(body.includes('themeRegister'), false);
  const state=writeHomeNavigation(createPortfolioState(), {
    ...createHomeNavigation(0),
    rootView:{selectedSlot:9, currentLeftSlot:7, targetLeftSlot:7, density:0},
  });
  assert.equal(state.selected, 9);
  assert.deepEqual(getHomeFooter(state), {two:true, left:'manual', right:'open'});
});

test('the after-walk footer 30 is the cursor-ring bottom, not Manual / Open', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:`${root}/reference/screenshots/_26.09.26_04.14.35.203.png`,
    upper:`${root}/home-fidelity-20261001/home-row-viewport-20261004/after-origin-right/upper.png`,
    lower:`${root}/home-fidelity-20261001/home-row-viewport-20261004/after-origin-right/lower.png`,
    report:`${root}/home-fidelity-20261001/home-row-viewport-20261004/diff-after-masked/report.json`,
    mask:`${root}/home-fidelity-20261001/home-row-viewport-20261004/adaptation-neighbor-mask.json`,
    empty:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.upper, files.lower, files.report, files.mask].every(existsSync)){
    return t.skip('private 1-row viewport pair is absent');
  }
  assert.equal(sha(files.native), '4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb');
  assert.equal(sha(files.upper), '2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c');
  assert.equal(sha(files.lower), 'cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a');
  assert.equal(sha(files.report), '0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96');
  assert.equal(sha(files.mask), '6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d');
  assert.equal(sha(files.empty), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const native=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const browser=await sharp(files.lower).ensureAlpha().raw().toBuffer();
  const count=(x0, y0, x1, y1)=>{
    let n=0, max=0, sum=0, area=0, rows=new Set();
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*320+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      sum+=(Math.abs(native[i]-browser[i])+Math.abs(native[i+1]-browser[i+1])+Math.abs(native[i+2]-browser[i+2]))/3;
      area++;
      if(e>max)max=e;
      if(e>2){n++; rows.add(y);}
    }
    return {n, max, mae:sum/area, rows:[...rows]};
  };
  const footerRoi=count(0, 204, 320, 240);
  assert.deepEqual({n:footerRoi.n, max:footerRoi.max, rows:footerRoi.rows}, {n:30, max:3, rows:[205]});
  assert.ok(Math.abs(footerRoi.mae-0.156)<0.001);
  assert.equal(count(0, 210, 320, 240).n, 0);
  assert.ok(count(0, 210, 320, 240).max<=2);
  assert.equal(count(0, 212, 320, 214).n, 0);
  assert.equal(count(8, 218, 128, 238).n, 0, 'Manual glyph stays inside threshold');
  assert.equal(count(160, 218, 280, 238).n, 0, 'Open glyph stays inside threshold');
  assert.deepEqual({n:count(210, 205, 225, 206).n, max:count(210, 205, 225, 206).max, rows:count(210, 205, 225, 206).rows},
    {n:15, max:3, rows:[205]});
  assert.deepEqual({n:count(263, 205, 278, 206).n, max:count(263, 205, 278, 206).max, rows:count(263, 205, 278, 206).rows},
    {n:15, max:3, rows:[205]});
  assert.equal(count(200, 110, 296, 206).n, 2485, 'the 30 is already inside the labelled cursor ring');
  assert.equal(count(200, 128, 201, 196).n, 68);
  assert.equal(count(203, 145, 204, 179).n, 34);
  assert.equal(count(284, 145, 285, 179).n, 34);
  assert.equal(count(50, 200, 59, 202).n, 10);
  assert.equal(count(93, 200, 102, 202).n, 10);
  assert.equal(count(134, 200, 143, 202).n, 10);
  assert.equal(count(177, 200, 186, 202).n, 10);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 5426);
  const regions=report.screens.lower.regions;
  assert.deepEqual(regions.find(region=>region.pixelCount===68), {x:200, y:128, width:1, height:68, pixelCount:68});
  assert.deepEqual(regions.filter(region=>region.pixelCount===34).map(region=>({x:region.x, y:region.y})),
    [{x:203, y:145}, {x:284, y:145}]);
  assert.deepEqual(regions.filter(region=>region.pixelCount===10).map(region=>({x:region.x, y:region.y})),
    [{x:50, y:200}, {x:93, y:200}, {x:134, y:200}, {x:177, y:200}]);
});
