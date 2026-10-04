import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {homeGridMetrics} from '../src/os/home-navigation.ts';
import {createHomeCursorLoop, getHomeCursorLoopFrame} from '../src/os/home-cursor-loop.ts';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const launcher=JSON.parse(readFileSync(new URL('packs/home/launcher.json', firmware), 'utf8'));
const presentation=readFileSync(new URL('../src/os/firmware-presentation.ts', import.meta.url), 'utf8');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const pane=(layout, name)=>flatten(layout.roots).find(item=>item.name===name);
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

const cursor=launcher.layouts.LncCsr_00;
const loop=launcher.animations.LncCsr_00_Loop;
const scale=launcher.animations.LncCsr_00_Scale;
const select=launcher.animations.LncCsr_00_Select;

test('LncCsr_00 is the already-bound 1-row Settings cursor, not an unused layout', ()=>{
  assert.equal(launcher.resourceSources.layouts.LncCsr_00.sha256,
    '72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738');
  assert.equal(launcher.resourceSources.layouts.LncCsr_00.path,
    'launcher_LZ.bin/blyt/LncCsr_00.bclyt');
  assert.equal(launcher.resourceSources.animations.LncCsr_00_Loop.sha256,
    '0bf11061be32b1af39749b8ae8342b8010b65ed9dfd257dbce76e38618b76744');
  assert.equal(launcher.resourceSources.animations.LncCsr_00_Scale.sha256,
    '74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd');
  assert.equal(launcher.resourceSources.animations.LncCsr_00_Select.sha256,
    'ecdf8761f6e0c07c9405dc12f9d4d65f1b97b4c70bb110da4a0afc52fdc46e02');
  assert.deepEqual(cursor.textures, ['LncCsr_41.bclim', 'LncCsrShdw_44.bclim']);
  assert.equal(pane(cursor, 'W_CsrF_00').kind, 'wnd1');
  assert.deepEqual(pane(cursor, 'W_CsrF_00').size, [95, 95]);
  assert.equal(pane(cursor, 'W_CsrLgt_00').kind, 'wnd1');
  assert.deepEqual(pane(cursor, 'W_CsrLgt_00').size, [78, 78]);
  const requested=presentation.match(/launcher:\[([^\]]+)\]/)[1];
  assert.match(requested, /'LncCsr_00'/);
  assert.match(requested, /'LncCsrEfct_00'/);
  assert.match(requested, /'LncCsrEfct_01'/);
});

test('Loop owns highlight alpha and texture translation only; Scale 0 is the 1-row bind', ()=>{
  assert.equal(loop.frames, 60);
  assert.equal(loop.loop, true);
  assert.deepEqual(loop.tracks.map(track=>[track.target, track.property, track.tag]), [
    ['W_CsrLgt_00', 'alpha', 'CLVC'],
    ['W_CsrLgt_00LT', 'texture.translation.x', 'CLTS'],
    ['W_CsrLgt_00LT', 'texture.translation.y', 'CLTS'],
    ['W_CsrF_00LT', 'texture.translation.x', 'CLTS'],
    ['W_CsrF_00LT', 'texture.translation.y', 'CLTS'],
    ['W_CsrF_00LT', 'texture.translation.x', 'CLTS'],
    ['W_CsrF_00LT', 'texture.translation.y', 'CLTS'],
  ]);
  assert.equal(loop.tracks.some(track=>track.property.startsWith('translation.')&&!track.property.startsWith('texture.')), false);
  const width=scale.tracks.find(track=>track.target==='W_CsrF_00'&&track.property==='size.width');
  const highlight=scale.tracks.find(track=>track.target==='W_CsrLgt_00'&&track.property==='scale.x');
  assert.equal(width.keys[0].value, 95);
  assert.equal(highlight.keys[0].value, 1.5);
  assert.equal(select.frames, 6);
  assert.deepEqual(select.groups, ['G_Csr_00']);
  const metrics=homeGridMetrics(false, 0);
  assert.deepEqual({rows:metrics.rows, columns:metrics.columns, baseX:metrics.baseX, baseY:metrics.baseY, pitchX:metrics.pitchX, size:metrics.size},
    {rows:1, columns:3, baseX:76, baseY:161, pitchX:84, size:72});
  assert.deepEqual([metrics.baseX+2*metrics.pitchX, metrics.baseY], [244, 161]);
});

test('cursorAt already binds Select, Scale and Loop without a guessed sampler', ()=>{
  const start=presentation.indexOf('function cursorAt(');
  const end=presentation.indexOf('function cursorEffectAt(');
  const cursorAt=presentation.slice(start, end);
  assert.match(cursorAt, /'LncCsr_00'/);
  assert.match(cursorAt, /LncCsr_00_Select/);
  assert.match(cursorAt, /LncCsr_00_Scale/);
  assert.match(cursorAt, /LncCsr_00_Loop/);
  assert.equal(cursorAt.includes('pictureSampling'), false);
  assert.equal(cursorAt.includes('LncCsrEfct'), false);
  assert.equal(getHomeCursorLoopFrame({system:{homeCursorLoop:createHomeCursorLoop()}}), 0);
  assert.equal(createHomeCursorLoop().appliedFrame, 0);
});

test('the after-walk pair keeps the hashed Settings+cursor halo and a matching face', async t=>{
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
  assert.deepEqual(count(208, 118, 288, 200), {n:1481, max:23});
  assert.deepEqual(count(200, 110, 296, 206), {n:2485, max:37});
  assert.equal(count(232, 142, 264, 174).n, 0, 'Settings face core stays inside threshold');
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 5426);
  const cluster=report.screens.lower.regions.find(region=>region.pixelCount===1656);
  assert.deepEqual({x:cluster.x, y:cluster.y, width:cluster.width, height:cluster.height}, {x:203, y:121, width:82, height:82});
  assert.equal(count(203, 121, 285, 203).n, 1756);
  assert.equal(count(203, 121, 285, 203).max, 23);
});
