import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, join} from 'node:path';
import ts from 'typescript';
import {poseNativeLayout, rasterNativePicture} from '../src/os/native-layout.ts';
import {decodeNativePng} from '../src/os/native-png.ts';
import {createStockModule, initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';

const firmware=resolve('public/os/firmware/10.7.0-32E');
const json=path=>JSON.parse(readFileSync(join(firmware,path),'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const pack=json('packs/manual/layout-BtnHeadLineTxt.json');
const pageBg=json('packs/manual/layout-PageBg00.json');
const manifest=json('manifest.json');
const painter=readFileSync(new URL('../src/os/stock-native-helpers.ts',import.meta.url),'utf8');
const flatten=panes=>panes.flatMap(pane=>[pane,...flatten(pane.children??[])]);
const white=(r,g,b,a)=>[r,g,b].map(channel=>Math.round(channel*a/255+255*(1-a/255)));
const settings='0004001000022000';
const ctx={now:0,shared:initialSharedData()};
const moduleUrl=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const transpile=(name,overrides={})=>{
  const url=new URL(`../src/os/${name}.ts`,import.meta.url);
  const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+?)(\.ts)?(['"])/g,(_all,prefix,path,_ext,suffix)=>prefix+(overrides[path]??new URL(`${path}.ts`,url).href)+suffix));
};
const empty=moduleUrl('export const drawNativeAmiibo=()=>false;export const amiiboScreenPacks=[];');
const helpers=await import(transpile('stock-native-helpers',{
  './stock-native-amiibo':empty,
  './native-layout':new URL('../src/os/native-layout.ts',import.meta.url).href,
}));

test('page-0 title rule is BtnShdw01 from Manual applet BtnHeadLineTxt ChangeWait', ()=>{
  assert.equal(pack.titleId,'0004003000009b02');
  assert.equal(manifest.titles['0004003000009b02'].version,5120);
  assert.equal(pack.sourceSha256,'8c06c951ba9740058c438b69cc52c4b4bf9e2f53102b73dc8b34aad40845a1f6');
  assert.equal(sha(join(firmware,'packs/manual/layout-BtnHeadLineTxt.json')),
    '9c0c0fb055d3b15311c0f0210bf3a89314c64edfab54a7596adc3878e1a3ca7a');
  assert.equal(pack.resourceSources.layouts.BtnHeadLineTxt.path,
    'layout/BtnHeadLineTxt.arc/blyt/BtnHeadLineTxt.bclyt');
  assert.equal(pack.resourceSources.layouts.BtnHeadLineTxt.sha256,
    'c41c54be9f004b98714ff8b9dc941b09386de50cd9215894d1ac6fe95181dca2');
  assert.equal(pack.resourceSources.animations.BtnHeadLineTxt_ChangeWait.path,
    'layout/BtnHeadLineTxt.arc/anim/BtnHeadLineTxt_ChangeWait.bclan');
  assert.equal(pack.resourceSources.animations.BtnHeadLineTxt_ChangeWait.sha256,
    'e97f49909d10f624ddd5003bcf3ab96c58da3aef93fc36dd76674c669a6e2a58');
  assert.equal(pack.resourceSources.textures['BtnShdw01.bclim'].path,
    'layout/BtnHeadLineTxt.arc/timg/BtnShdw01.bclim');
  assert.equal(pack.resourceSources.textures['BtnShdw01.bclim'].sha256,
    '02f515645a01baaec666f0582b17d724113c184b3a271b44b5d0b89341accc6e');
  const texture=pack.textures['BtnShdw01.bclim'];
  assert.equal(texture.formatName,'LA8');
  assert.equal(texture.picaFormat,5);
  assert.deepEqual([texture.width,texture.height],[256,64]);
  assert.equal(texture.sha256,'9e287e3f72f9a888f0d7e0d0bb36343f85ad7f857b000510da9b8d72f1616955');
  assert.equal(texture.sourceSha256,'02f515645a01baaec666f0582b17d724113c184b3a271b44b5d0b89341accc6e');
  assert.equal(sha(join(firmware,texture.url)),texture.sha256);
  assert.equal(manifest.converter.name,'ctr-native-web');
  assert.equal(manifest.converter.version,'1.2.0');
  assert.equal(manifest.titles['0004003000009b02'].uiSelection.sourceConverter.version,'1.4.0');
  assert.equal(manifest.converter.scripts['scripts/firmware/texture.py'],
    '399be43d43fc6d92363386c0a5347135e875ec35edca8d1a1e36145366aed38f');
});

test('ChangeWait frame 0 shows the L-rule; Wait and PageBg00 do not own the 168 hairline', ()=>{
  const layout=pack.layouts.BtnHeadLineTxt;
  const change=poseNativeLayout(layout,pack.animations,[{name:'BtnHeadLineTxt_ChangeWait',frame:0}]);
  const wait=poseNativeLayout(layout,pack.animations,[{name:'BtnHeadLineTxt_Wait',frame:1}]);
  const changePanes=flatten(change.roots);
  const waitPanes=flatten(wait.roots);
  const shadow=name=>flatten(name.roots).find(pane=>pane.name==='BtnShdw01');
  const body=changePanes.find(pane=>pane.name==='BtnHeadLineBody');
  const plate=changePanes.find(pane=>pane.name==='BtnPageTitleP_01');
  assert.equal(body.translation[1],0.5);
  assert.deepEqual(shadow(change).size,[512,64]);
  assert.equal(shadow(change).alpha,255);
  assert.equal(shadow(wait).alpha,0);
  assert.equal(plate.flags&1,0,'BtnPageTitleP_01 stays hidden on ChangeWait frame 0');
  const line=flatten(pageBg.layouts.PageBg00.roots).find(pane=>pane.name==='PageBg02_00');
  assert.deepEqual(line.size,[305,2]);
  assert.equal(line.alpha,110);
  assert.deepEqual(pageBg.layouts.PageBg00.materials[line.picture.material].constantColors[0],[0,0,0,255]);
  assert.deepEqual(white(0,0,0,110),[145,145,145],'PageBg00 on white is 145, not the native 168 rule');
  assert.equal(painter.includes("draw(bottom,'manual-PageBg00'"),true,'portfolio guide still owns PageBg00');
  assert.equal(painter.includes("draw(top,'manual-PageBg00'"),false);
  assert.equal(/drawApplicationManualPage[\s\S]*manual-PageBg00/.test(painter),false);
});

test('LCD-centre sampling of the posed BtnShdw01 rule matches native 168 at y=38 and y=39', async ()=>{
  const rec=pack.textures['BtnShdw01.bclim'];
  const pixels=await decodeNativePng(new Uint8Array(readFileSync(join(firmware,rec.url))),rec);
  const textures=new Map([['BtnShdw01.bclim',pixels]]);
  const posed=poseNativeLayout(pack.layouts.BtnHeadLineTxt,pack.animations,[{name:'BtnHeadLineTxt_ChangeWait',frame:0}]);
  const body=flatten(posed.roots).find(pane=>pane.name==='BtnHeadLineBody');
  const shadow=flatten(posed.roots).find(pane=>pane.name==='BtnShdw01');
  const [w,h]=shadow.size;
  const header=[200,20];
  const bodyScreen=[header[0]+body.translation[0],header[1]-body.translation[1]];
  const topLeft=[bodyScreen[0]-w*(shadow.origin%3)/2,bodyScreen[1]-h*Math.floor(shadow.origin/3)/2];
  assert.deepEqual(topLeft,[-56,-12.5]);
  const localTransform=[1,0,0,1,-topLeft[0],-topLeft[1]];
  const strip=rasterNativePicture(posed,shadow.picture,1,9,textures,shadow.alpha/255,posed.materials[shadow.picture.material],{
    x:200,y:36,fullWidth:w,fullHeight:h,localTransform,
  });
  const row=y=>{
    const at=(y-36)*4;
    return white(strip.data[at],strip.data[at+1],strip.data[at+2],strip.data[at+3]);
  };
  assert.deepEqual(row(37),[255,255,255]);
  assert.deepEqual(row(38),[168,168,168]);
  assert.deepEqual(row(39),[168,168,168]);
  assert.deepEqual(row(40),[189,189,189]);
});

test('page compositor LCD-samples both title draws and does not reopen ScrollIndicator', ()=>{
  const module=createStockModule(getTitle('manual'));
  const state=module.create({manualTitleId:settings},null,ctx);
  const page=module.reduce(state,{type:'command',command:'open'},ctx).state;
  const view=module.view(page,ctx),calls=[];
  const renderer={
    packs:Object.fromEntries(helpers.nativeHelperView(view).packs.map(item=>[item.alias,json(item.url)])),
    draw(_context,packName,layout,options){calls.push({pack:packName,layout,options});return true;},
  };
  assert.equal(helpers.drawNativeHelperFrame(renderer,{},{},view),true);
  const titles=calls.filter(call=>call.layout==='ManualRowImportant'||call.layout==='ManualRowGettingStarted');
  assert.equal(titles.length,2);
  for(const title of titles){
    assert.equal(title.options.pictureSampling,'lcd');
    assert.deepEqual(title.options.bindings,[{name:'BtnHeadLineTxt_ChangeWait',frame:0}]);
    assert.equal(title.options.textCoverageAdaptation,undefined);
    assert.equal(title.options.textSampling,undefined);
  }
  assert.equal(calls.some(call=>call.layout==='ScrollIndicator'),false);
  assert.equal(painter.includes('azahar-12p4-fit'),false);
  assert.match(painter,/draw\(top,'manual-row','ManualRowImportant',\{center:\[200,20\],pictureSampling:'lcd'/);
});
