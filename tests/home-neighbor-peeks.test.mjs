import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {initialAppLayout, retiredHomeTitleIds, getTitle} from '../src/os/app-registry.ts';
import {createHomeNavigation, homeGridMetrics, writeHomeNavigation} from '../src/os/home-navigation.ts';
import {createPortfolioState} from '../src/os/system.ts';
import {menuTiles} from '../src/os/state.ts';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const launcher=JSON.parse(readFileSync(new URL('packs/home/launcher.json', firmware), 'utf8'));
const manifest=JSON.parse(readFileSync(new URL('manifest.json', firmware), 'utf8'));
const presentation=readFileSync(new URL('../src/os/firmware-presentation.ts', import.meta.url), 'utf8');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const pane=(layout, name)=>flatten(layout.roots).find(item=>item.name===name);
const lcd=(translation)=>[160+translation[0], 120-translation[1]];
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

const arrows=launcher.layouts.LncArw_00;
const appear=launcher.animations.LncArw_00_Appear;

test('LncArw_00 is the already-bound settled page-arrow layout, not an unused peek compositor', ()=>{
  assert.equal(launcher.resourceSources.layouts.LncArw_00.sha256,
    'b10fb39ab2c122041512b2b504107c792c40193344c907441acb603895816ed8');
  assert.equal(launcher.resourceSources.layouts.LncArw_00.path,
    'launcher_LZ.bin/blyt/LncArw_00.bclyt');
  assert.equal(launcher.resourceSources.animations.LncArw_00_Appear.sha256,
    'cd26320af0d48b4af048fb58bbe755115fa0cde3e959285519b724bbd65dd11f');
  assert.deepEqual(arrows.textures, [
    'LncArwBtnAlp_10.bclim',
    'LncArwBtnCol_10.bclim',
    'LncArwBtnShdwLT16.bclim',
    'LncArwIconR_11.bclim',
  ]);
  assert.equal(pane(arrows, 'P_arwL_00').kind, 'pic1');
  assert.deepEqual(pane(arrows, 'P_arwL_00').size, [24, 76]);
  assert.equal(pane(arrows, 'P_arwR_00').kind, 'pic1');
  assert.deepEqual(pane(arrows, 'P_arwR_00').size, [24, 76]);
  assert.deepEqual(pane(arrows, 'N_arwL_00').translation, [-162, -3, 0]);
  assert.deepEqual(pane(arrows, 'N_arwR_00').translation, [162, -3, 0]);
  assert.deepEqual(lcd(pane(arrows, 'N_arwL_00').translation), [-2, 123]);
  assert.deepEqual(lcd(pane(arrows, 'N_arwR_00').translation), [322, 123]);
  const xL=appear.tracks.find(track=>track.target==='N_arwL_00'&&track.property==='translation.x');
  const aL=appear.tracks.find(track=>track.target==='N_arwL_00'&&track.property==='alpha');
  const xR=appear.tracks.find(track=>track.target==='N_arwR_00'&&track.property==='translation.x');
  assert.equal(appear.frames, 15);
  assert.equal(xL.keys.at(-1).frame, 14);
  assert.equal(xL.keys.at(-1).value, -162);
  assert.equal(xR.keys.at(-1).value, 162);
  assert.equal(aL.keys.at(-1).value, 255);
  const requested=presentation.match(/launcher:\[([^\]]+)\]/)[1];
  assert.match(requested, /'LncArw_00'/);
  assert.equal(Object.keys(launcher.layouts).filter(name=>name.includes('Arw')).join(), 'LncArw_00');
  assert.ok(launcher.layouts.LncBtmBtn_02.textures.includes('PageArrowIcon.bclim'));
  assert.equal(arrows.textures.includes('PageArrowIcon.bclim'), false);
});

test('arrows() already binds Appear 15 and does not attach neighbour titles', ()=>{
  const start=presentation.indexOf('function arrows(');
  const end=presentation.indexOf('const pickupSizes=');
  const body=presentation.slice(start, end);
  assert.match(body, /'LncArw_00'/);
  assert.match(body, /LncArw_00_Appear',\s*15/);
  assert.match(body, /N_arwL_00/);
  assert.match(body, /N_arwR_00/);
  assert.match(body, /clip:\[0,33,320,179\]/);
  assert.equal(body.includes('attachments'), false);
  for(const name of ['Decide', 'DisAppear', 'PaletteIn', 'PaletteOut', 'Repeat', 'Select']){
    assert.equal(body.includes(`LncArw_00_${name}`), false, `${name} stays off the idle arrow bind`);
  }
});

test('the matching 1-row walk peeks About and Camera, not excluded titles', ()=>{
  const layout=initialAppLayout();
  assert.deepEqual([6, 7, 8, 9, 10].map(slot=>layout[slot]),
    ['about', 'sound', 'health-safety', 'system-settings', 'camera']);
  assert.equal(getTitle('sound')?.titleId, '0004001000022500');
  assert.equal(getTitle('health-safety')?.titleId, '0004001000022300');
  assert.equal(getTitle('system-settings')?.titleId, '0004001000022000');
  assert.equal(getTitle('camera')?.titleId, '0004001000022400');
  assert.equal(getTitle('about')?.titleId, undefined);
  for(const id of retiredHomeTitleIds) assert.equal(Object.values(layout).includes(id), false);
  assert.ok(manifest.excludedTitles.includes('0004001000022100'));
  assert.ok(manifest.excludedTitles.includes('0004001000022200'));
  const metrics=homeGridMetrics(false, 0);
  assert.deepEqual({rows:metrics.rows, columns:metrics.columns, baseX:metrics.baseX, baseY:metrics.baseY, pitchX:metrics.pitchX, size:metrics.size},
    {rows:1, columns:3, baseX:76, baseY:161, pitchX:84, size:72});
  const state=writeHomeNavigation(createPortfolioState(), {
    ...createHomeNavigation(0),
    rootView:{selectedSlot:9, currentLeftSlot:7, targetLeftSlot:7, density:0},
  });
  const tiles=Object.fromEntries(menuTiles(state).filter(tile=>tile.index>=6&&tile.index<=10)
    .map(tile=>[tile.index, {x:tile.x, y:tile.y, size:tile.size}]));
  assert.deepEqual(tiles, {
    6:{x:-44, y:125, size:72},
    7:{x:40, y:125, size:72},
    8:{x:124, y:125, size:72},
    9:{x:208, y:125, size:72},
    10:{x:292, y:125, size:72},
  });
  assert.ok(tiles[6].x<0 && tiles[6].x+tiles[6].size>0);
  assert.ok(tiles[10].x<320 && tiles[10].x+tiles[10].size>320);
});

test('the after-walk pair keeps the hashed peek residuals', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:`${root}/reference/screenshots/_26.09.26_04.14.35.203.png`,
    upper:`${root}/home-fidelity-20261001/home-row-viewport-20261004/after-origin-right/upper.png`,
    lower:`${root}/home-fidelity-20261001/home-row-viewport-20261004/after-origin-right/lower.png`,
    report:`${root}/home-fidelity-20261001/home-row-viewport-20261004/diff-after-masked/report.json`,
    mask:`${root}/home-fidelity-20261001/home-row-viewport-20261004/adaptation-neighbor-mask.json`,
  };
  if(!Object.values(files).every(existsSync))return t.skip('private 1-row viewport pair is absent');
  assert.equal(sha(files.native), '4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb');
  assert.equal(sha(files.upper), '2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c');
  assert.equal(sha(files.lower), 'cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a');
  assert.equal(sha(files.report), '0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96');
  assert.equal(sha(files.mask), '6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d');
  const sharp=require('sharp');
  const native=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const browser=await sharp(files.lower).ensureAlpha().raw().toBuffer();
  const count=(x0, y0, x1, y1)=>{
    let n=0, max=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*320+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>2){n++; if(e>max)max=e;}
    }
    return {n, max};
  };
  assert.deepEqual(count(0, 118, 32, 200), {n:1090, max:245});
  assert.deepEqual(count(0, 126, 24, 202), {n:843, max:245});
  assert.deepEqual(count(288, 118, 320, 200), {n:2081, max:215});
  assert.deepEqual(count(296, 140, 320, 184), {n:1020, max:215});
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 5426);
  const byCount=pixelCount=>report.screens.lower.regions.find(region=>region.pixelCount===pixelCount);
  assert.deepEqual(byCount(2220), {x:287, y:124, width:33, height:80, pixelCount:2220});
  assert.deepEqual(byCount(561), {x:0, y:139, width:16, height:46, pixelCount:561});
  assert.deepEqual(byCount(391), {x:0, y:126, width:30, height:76, pixelCount:391});
  assert.deepEqual(byCount(145), {x:0, y:137, width:14, height:14, pixelCount:145});
});
