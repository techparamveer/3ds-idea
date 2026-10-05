import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import ts from 'typescript';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const transpile=name=>{
  const url=new URL(`../src/os/${name}.ts`,import.meta.url);
  const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href+suffix));
};
const {cameraScreenPacks,drawNativeCameraLower}=await import(transpile('stock-native-camera'));
const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json',import.meta.url),'utf8'));
const CODE='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';
const BASE=0x100000;

test('large photo cells bind PicL_SD frame 0, the white Pho2x3 frame',()=>{
  const request=cameraScreenPacks.find(item=>item.alias==='camera-gallery');
  assert.ok(request.animations.includes('P_BrwsPic_PicL_SD'));
  assert.equal(request.animations.includes('P_BrwsPic_PicL'),false);
  const clip=pack.animations.P_BrwsPic_PicL_SD;
  assert.deepEqual(clip.textures,['P_Thmb_Mov5x7.bclim','P_Thmb_Pho2x3.bclim']);
  const pattern=clip.tracks.find(track=>track.target==='ThmbMask'&&track.property==='texture.pattern');
  assert.equal(pattern.interpolation,'step');
  assert.deepEqual(pattern.keys[0],{frame:0,value:1});
  assert.equal(pack.textures['P_Thmb_Pho2x3.bclim'].sha256,'bc28916bb9143be082eb7e4df900dd1a2d1b6dcfe30cf7ce06941576593c23d7');
  assert.deepEqual(pack.animations.P_BrwsPic_PicL.textures,['P_Thmb_Pho2x3_SD.bclim','P_Thmb_Pho5x7.bclim']);
  const rows=[{id:'camera-date-group',label:'2026-09-25'},{id:'photo:HNI_0001',label:'HNI_0001'},{id:'photo:HNI_0002',label:'HNI_0002'}];
  const draws=[];
  const renderer={
    packs:{'camera-gallery':pack,'camera-messages':{messages:{}}},
    draw(_c,_p,layout,opts){draws.push({layout,opts});return true;},
    drawLayout(_c,_p,layout,_source,opts){draws.push({layout,opts});return true;},
  };
  const view={appId:'camera',screen:'gallery',heading:'Nintendo 3DS Camera',rows,selection:1,footer:{left:{action:'back',label:'Back'}},data:{photos:[1,2].map(number=>({id:`HNI_000${number}`,src:`/fixture/${number}.jpg`}))}};
  assert.equal(drawNativeCameraLower(renderer,{save(){},restore(){},beginPath(){},rect(){},clip(){}},view,{image:()=>true}),true);
  const photos=draws.filter(draw=>draw.layout==='P_BrwsPic');
  assert.equal(photos.length,2);
  for(const photo of photos)assert.deepEqual(photo.opts.bindings,[{name:'P_BrwsPic_Default',frame:0},{name:'P_BrwsPic_PicL_SD',frame:0}]);
  assert.deepEqual(draws.find(draw=>draw.layout==='P_BrwsFld').opts.bindings,[{name:'P_BrwsFld_PicL_Op',frame:0}]);
});

test('code.bin kind 5 selects the large PicL_SD name',t=>{
  if(!existsSync(CODE))return t.skip('private Camera code.bin is absent');
  const code=readFileSync(CODE);
  assert.equal(createHash('sha256').update(code).digest('hex'),'3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  const word=va=>code.readUInt32LE(va-BASE);
  const text=va=>code.subarray(va-BASE,code.indexOf(0,va-BASE)).toString('ascii');
  // Storage class is bits 0–1 of the image word. Value 1 takes the _SD clips.
  assert.equal(word(0x2556e4),0xe5900004);
  assert.equal(word(0x2556e8),0xe2000003);
  // Not a movie (attribute bits 2–4 != 3): r6 = 5. A movie sets r6 = 7.
  assert.equal(word(0x2da60c),0xe3180008);
  assert.equal(word(0x2da610),0x13a06007);
  assert.equal(word(0x2da614),0x03a06005);
  assert.equal(word(0x2da644),0xe1a03006);
  assert.deepEqual([...code.subarray(0x347fac-BASE,0x347fac-BASE+3)],[8,9,10]);
  assert.equal(word(0x44038c),0x421c3b);
  assert.equal(text(0x421c3b),'PicL_SD');
  assert.equal(text(word(0x440374)),'PicL');
});
