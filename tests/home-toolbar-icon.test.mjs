import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const launcher=JSON.parse(readFileSync(new URL('packs/home/launcher.json', firmware), 'utf8'));
const presentation=readFileSync(new URL('../src/os/firmware-presentation.ts', import.meta.url), 'utf8');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const pane=(layout, name)=>flatten(layout.roots).find(item=>item.name===name);
const group=(layout, name)=>{
  const walk=nodes=>nodes.flatMap(node=>[node, ...walk(node.children??[])]);
  return walk(layout.groups??[]).find(item=>item.name===name);
};
const lcd=(translation)=>[160+translation[0], 120-translation[1]];
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

const base=launcher.layouts.LncBase_D_01;
const newsRcv=pane(base, 'N_NewsRcv_00');
const lamp=launcher.layouts.LncRcvLampSrc_01;

test('the 162-pixel toolbar cluster sits on empty N_NewsRcv_00, not the house', ()=>{
  assert.equal(newsRcv.kind, 'pan1');
  assert.deepEqual(newsRcv.children, []);
  assert.deepEqual(newsRcv.size, [4, 4]);
  assert.equal(newsRcv.origin, 4);
  assert.deepEqual(newsRcv.translation, [11, 113, 0]);
  assert.deepEqual(lcd(newsRcv.translation), [171, 7]);
  const box=[161, 0, 178, 16];
  assert.ok(box[0]<=171 && 171<box[2] && box[1]<=7 && 7<box[3]);
  assert.deepEqual(lcd(pane(base, 'N_CPos_Lgt_00').translation), [26, 16]);
  assert.ok(26<50, 'house cursor stays in the left toolbar, outside the 162-pixel bbox');
  const newsGroup=group(base, 'G_News_00');
  assert.deepEqual(newsGroup.panes, ['B_News_00', 'P_News_10']);
  assert.ok(!newsGroup.panes.includes('N_NewsRcv_00'));
  const toggle=group(base, 'G_MvsToggle_00');
  assert.ok(toggle.panes.includes('N_NewsRcv_00'));
  assert.deepEqual(['N_FrdRcv_00', 'N_NewsRcv_00', 'N_WebRcv_00', 'N_MvsRcv_00', 'N_LgtRcv_00'].map(name=>{
    const item=pane(base, name);
    return [name, item.children.length, item.size];
  }), [
    ['N_FrdRcv_00', 0, [4, 4]],
    ['N_NewsRcv_00', 0, [4, 4]],
    ['N_WebRcv_00', 0, [4, 4]],
    ['N_MvsRcv_00', 0, [4, 4]],
    ['N_LgtRcv_00', 0, [4, 4]],
  ]);
});

test('delivered LncRcvLampSrc_01 is a 22×22 child layout, not a live toolbar request', ()=>{
  assert.equal(launcher.resourceSources.layouts.LncBase_D_01.sha256,
    '787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf');
  assert.equal(launcher.resourceSources.layouts.LncRcvLampSrc_01.sha256,
    '799596bcb744ea79ed9a59ab3fc716b7a6fa2760a2ba2174410d928003a56a6d');
  assert.equal(launcher.resourceSources.layouts.LncRcvLampSrc_01.path,
    'launcher_LZ.bin/blyt/LncRcvLampSrc_01.bclyt');
  assert.equal(launcher.resourceSources.animations.LncRcvLampSrc_01_ReceiveBlue.sha256,
    '76e02042798431cd7c52565b2eb995b8fb35e3a357292669c93e8deb72671b77');
  const picture=pane(lamp, 'P_Rcv_00');
  assert.equal(picture.kind, 'pic1');
  assert.deepEqual(picture.size, [22, 22]);
  assert.deepEqual(lamp.textures, ['RL_01.bclim', 'RL_03.bclim']);
  const requested=presentation.match(/launcher:\[([^\]]+)\]/)[1];
  for(const name of ['LncRcvLampSrc_00', 'LncRcvLampSrc_01', 'LncRcvLampDist_00']){
    assert.ok(!requested.includes(`'${name}'`), `${name} stays off the live launcher request list`);
    assert.ok(launcher.layouts[name], `${name} remains in the delivered pack`);
  }
});

test('toolbar() has no N_NewsRcv attachment and does not bind a receive clip', ()=>{
  const start=presentation.indexOf('function toolbar(');
  const end=presentation.indexOf('function homePlate(');
  const toolbar=presentation.slice(start, end);
  assert.match(toolbar, /LncBase_D_01_PaletteOut/);
  assert.match(toolbar, /LncBase_D_01_MvsToggle/);
  assert.equal(toolbar.includes('attachments'), false);
  assert.equal(toolbar.includes('N_NewsRcv_00'), false);
  assert.equal(toolbar.includes('LncRcvLamp'), false);
  assert.equal(toolbar.includes('ReceiveBlue'), false);
});

test('the after-walk pair keeps the hashed News-lamp residual and a matching house', async t=>{
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
  const over=(x, y)=>{
    const i=(y*320+x)*4;
    return Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]))>2;
  };
  const count=(x0, y0, x1, y1)=>{
    let n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(over(x, y))n++;
    return n;
  };
  assert.equal(count(0, 0, 320, 33), 164);
  assert.equal(count(161, 0, 178, 16), 164, 'both toolbar leftovers sit in the News-lamp bbox');
  assert.equal(count(10, 0, 42, 33), 0);
  assert.equal(count(0, 0, 52, 33), 0, 'G_Light_00 / house stays inside threshold');
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 5426);
  const lamp=report.screens.lower.regions.find(region=>region.pixelCount===162);
  assert.deepEqual({x:lamp.x, y:lamp.y, width:lamp.width, height:lamp.height}, {x:161, y:0, width:17, height:16});
});
