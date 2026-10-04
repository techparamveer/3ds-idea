import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const model=JSON.parse(readFileSync(new URL('models/settings-banner/model.json', firmware), 'utf8'));
const banner=readFileSync(new URL('../src/scene/firmware-banner.ts', import.meta.url), 'utf8');
const common=model.models[0];
const bones=common.skeleton;
const material=name=>common.materials.find(item=>item.Name===name);
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const meshOwners=common.meshes.map((mesh, index)=>{
  const mat=common.materials[mesh.material];
  return {
    index,
    material:mat.Name,
    texture:mat.Texture0Name,
    bone:bones[mesh.submeshes[0].bones[0]].Name,
    layer:mesh.layer,
  };
});

test('mt_pict and mt_spanner already bind COMMON2 / COMMON4; Texture1/2 stay unused dummies', ()=>{
  assert.equal(sha(new URL('models/settings-banner/model.json', firmware)),
    '908b4dbe6ef22bbf3c47d37e9ed512ea6a37654afd0f1db611f3d4f68c5e93e1');
  assert.equal(sha(new URL('models/settings-banner/texture-1.png', firmware)),
    '30210ac601a78d152ceb438cb3b9c1681cd75c156fb5bfd2d4a3ac19015e69a3');
  assert.equal(sha(new URL('models/settings-banner/texture-3.png', firmware)),
    '65f62f8b11a988f70b7ffc923a283e63110782e0a4a270e0f1964948cd51e1dc');
  assert.equal(model.sourceSha256, '96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d');
  assert.equal(model.cbmd.cbmdSha256, '5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac');
  assert.equal(common.name, 'COMMON');
  assert.equal(common.meshes.length, 12);
  assert.deepEqual(model.textures.map(texture=>texture.name),
    ['COMMON1', 'COMMON2', 'COMMON3', 'COMMON4', 'COMMON5']);
  const pict=material('mt_pict');
  const wrench=material('mt_spanner');
  assert.equal(pict.Texture0Name, 'COMMON2');
  assert.equal(pict.Texture1Name, null);
  assert.equal(pict.Texture2Name, null);
  assert.equal(pict.MaterialParams.Flags, '0');
  assert.equal(pict.MaterialParams.FragmentFlags, '0');
  assert.equal(pict.MaterialParams.BumpMode, 'NotUsed');
  assert.deepEqual(pict.MaterialParams.TextureCoords.slice(1).map(coord=>coord.Scale),
    [{X:0, Y:0}, {X:0, Y:0}]);
  assert.deepEqual(pict.MaterialParams.TexEnvStages[0].Source, {
    Color:['PrimaryColor', 'PrimaryColor', 'Constant'],
    Alpha:['Texture0', 'Texture0', 'Constant'],
  });
  assert.equal(wrench.Texture0Name, 'COMMON4');
  assert.equal(wrench.Texture1Name, null);
  assert.equal(wrench.Texture2Name, null);
  assert.equal(wrench.MaterialParams.TextureSources[0], 4);
  assert.equal(wrench.MaterialParams.TextureCoords[0].MappingType, 'CameraSphereEnvMap');
  assert.deepEqual(wrench.MaterialParams.BlendFunction.ColorSrcFunc, 'One');
  assert.deepEqual(wrench.MaterialParams.BlendFunction.ColorDstFunc, 'Zero');
  for(const mat of common.materials){
    assert.equal(mat.Texture1Name, null, `${mat.Name} has no unused Texture1 artwork`);
    assert.equal(mat.Texture2Name, null, `${mat.Name} has no unused Texture2 artwork`);
  }
  assert.deepEqual(model.materialAnimations, []);
  assert.deepEqual(model.visibilityAnimations, []);
});

test('the 190 leftover already sits on bound outer mt_pict meshes and the wrench', ()=>{
  assert.deepEqual(meshOwners.filter(item=>item.material==='mt_pict'), [
    {index:2, material:'mt_pict', texture:'COMMON2', bone:'p_inner_b', layer:1},
    {index:4, material:'mt_pict', texture:'COMMON2', bone:'p_inner_f', layer:1},
    {index:7, material:'mt_pict', texture:'COMMON2', bone:'p_nn_f', layer:1},
    {index:10, material:'mt_pict', texture:'COMMON2', bone:'p_outer', layer:1},
  ]);
  assert.deepEqual(meshOwners[11], {
    index:11, material:'mt_spanner', texture:'COMMON4', bone:'polySurface1', layer:0,
  });
  const used=new Set(common.materials.map(item=>item.Texture0Name));
  assert.deepEqual([...used].sort(), ['COMMON1', 'COMMON2', 'COMMON3', 'COMMON4', 'COMMON5']);
});

test('drawSettingsFrame already requires bound TextureNName and sphere-maps the wrench', ()=>{
  const start=banner.indexOf('const settingsReady=');
  const end=banner.indexOf('const newsReady=');
  const body=banner.slice(start, end);
  assert.match(body, /settings-banner\/model\.json/);
  assert.match(body, /Texture0Name,material\.Texture1Name,material\.Texture2Name/);
  assert.match(body, /Missing native Settings texture/);
  assert.match(body, /nativeSphereMapping:true/);
  assert.match(banner, /overlayCoverage:true/);
  assert.equal(body.includes('colorFit'), false);
  assert.equal(body.includes('nativeMipmaps'), false);
});

test('the after-walk pair keeps the hashed 190 mt_pict / wrench-edge residual', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:`${root}/reference/screenshots/_26.09.26_04.14.35.203.png`,
    upper:`${root}/home-fidelity-20261001/home-row-viewport-20261004/after-origin-right/upper.png`,
    lower:`${root}/home-fidelity-20261001/home-row-viewport-20261004/after-origin-right/lower.png`,
    report:`${root}/home-fidelity-20261001/home-row-viewport-20261004/diff-after-unmasked/report.json`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.upper, files.lower, files.report].every(existsSync)){
    return t.skip('private 1-row viewport pair is absent');
  }
  assert.equal(sha(files.native), '4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb');
  assert.equal(sha(files.upper), '2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c');
  assert.equal(sha(files.lower), 'cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a');
  assert.equal(sha(files.report), '9c6f9971740ef56dbf72a97ee1c19fcdd2ea252a0ea50f0c225957967290d6df');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const native=await sharp(files.native).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const browser=await sharp(files.upper).ensureAlpha().raw().toBuffer();
  const count=(x0, y0, x1, y1)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*400+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  assert.deepEqual(count(0, 0, 400, 240).n, 190);
  assert.equal(count(0, 0, 400, 28).n, 0);
  assert.equal(count(80, 176, 325, 212).n, 0);
  assert.deepEqual(count(60, 133, 100, 176), {n:105, max:8, at:[71, 150]});
  assert.deepEqual(count(120, 133, 160, 176).n, 1);
  assert.equal(count(180, 133, 220, 176).n, 0);
  assert.equal(count(240, 133, 280, 176).n, 0);
  assert.deepEqual(count(300, 133, 340, 176).n, 81);
  assert.equal(count(60, 133, 340, 176).n, 187);
  const wrench=count(140, 32, 250, 133);
  assert.equal(wrench.n, 3);
  assert.deepEqual(wrench.at, [164, 63]);
  assert.equal(wrench.max, 54);
  assert.equal(count(163, 46, 164, 47).n, 1);
  assert.equal(count(164, 63, 165, 64).n, 1);
  assert.equal(count(171, 70, 172, 71).n, 1);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 190);
  const regions=report.screens.upper.regions;
  assert.deepEqual(regions[0], {x:71, y:150, width:4, height:10, pixelCount:25});
  assert.deepEqual(regions[1], {x:87, y:147, width:2, height:11, pixelCount:16});
  assert.deepEqual(regions[2], {x:311, y:144, width:1, height:15, pixelCount:15});
  assert.deepEqual(regions.slice(3, 6).map(region=>region.pixelCount), [10, 10, 10]);
  assert.deepEqual(regions.find(region=>region.x===163 && region.y===46),
    {x:163, y:46, width:1, height:1, pixelCount:1});
  assert.deepEqual(regions.find(region=>region.x===164 && region.y===63),
    {x:164, y:63, width:1, height:1, pixelCount:1});
  assert.deepEqual(regions.find(region=>region.x===171 && region.y===70),
    {x:171, y:70, width:1, height:1, pixelCount:1});
});
