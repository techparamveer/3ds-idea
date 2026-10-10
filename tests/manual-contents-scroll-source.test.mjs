import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import ts from 'typescript';
import {nativePaneParentPath,poseNativeLayout} from '../src/os/native-layout.ts';
import {manualContents,manualSources} from '../src/os/stock-manual-index.ts';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const amiibo=moduleUrl('export const drawNativeAmiibo=()=>false;export const amiiboScreenPacks=[];');
const compile=name=>{
 const url=new URL(`../src/os/${name}.ts`,import.meta.url);
 return moduleUrl(readFileSync(url,'utf8').replace(/(from\s*['"])(\.[^'"]+?)(['"])/g,(_all,prefix,path,suffix)=>prefix+(path==='./stock-native-amiibo'?amiibo:new URL(`${path}.ts`,url).href)+suffix));
};
const {drawNativeHelperFrame,nativeHelperView}=await import(compile('stock-native-helpers'));
const {NativeLayoutRenderer}=await import(compile('native-renderer'));
const settings='0004001000022000',camera='0004001000022400',browser='0004003000009d02';
const tail=layout=>nativePaneParentPath(layout,'EndPic').at(-1);
function fixture(titleId=camera,screen='main'){
 const view={appId:'manual',screen,heading:'',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},data:{manualTitleId:titleId,page:0}};
 const packs=Object.fromEntries(nativeHelperView(view).packs.map(request=>[request.alias,json(request.url)]));
 const renderer=new NativeLayoutRenderer(packs,{},new Map([['cbf_std.bcfnt',{manifest:json('fonts/shared/font.json')}]])),calls=[];
 renderer.draw=(context,pack,layout,options)=>{calls.push({pack,layout,options});return true;};
 const context={fillStyle:'',fillRect(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 return {view,renderer,calls,pack:packs['manual-scroll'],index:packs['manual-index'].layouts.Index,
  paint:()=>drawNativeHelperFrame(renderer,context,context,view)};
}
const drawn=f=>{
 const call=f.calls.find(call=>call.pack==='manual-scroll');assert.ok(call);
 const pack=f.renderer.packs[call.pack],layout=pack.layouts[call.layout];
 return {call,layout,posed:poseNativeLayout(layout,pack.animations,call.options.bindings)};
};

test('Contents indicator retains the original applet resource and texture provenance',()=>{
 const bytes=readFileSync(new URL('packs/manual/layout-ScrollIndicator.json',root)),pack=JSON.parse(bytes);
 assert.equal(sha(bytes),'6d22776a9057851605ae3500363d90c4ac0d124030002d758ae7334b6249d8f6');
 assert.equal(pack.titleId,'0004003000009b02');assert.equal(pack.sourceSha256,'158be4271728ea787981b92c127156ccf9410d8960f4cff99c96543bf1ac3847');
 for(const [kind,name,path,hash]of [
  ['layouts','ScrollIndicator','blyt/ScrollIndicator.bclyt','d508c831776ae121b3f91166f27c5ac1f4513ee1c34a8e2df9c60868e8fb4e47'],
  ['animations','ScrollIndicator_Wait','anim/ScrollIndicator_Wait.bclan','c1030ac9657210997695266726fdbd0554f93d5cd4987894437c3bc47e879daa'],
  ['textures','ScrollIndicator.bclim','timg/ScrollIndicator.bclim','ac5d93bb2c12de3f43c4b339bd6900cb87cdfbef03a6cbb68823c1fd9177e4ae'],
 ])assert.deepEqual(pack.resourceSources[kind][name],{path:'layout/ScrollIndicator.arc/'+path,sha256:hash,titleId:pack.titleId});
 assert.equal(sha(readFileSync(new URL(pack.textures['ScrollIndicator.bclim'].url,root))),'72befbf9ad075df80a05a54fdbb448db960a26f171fe923c2ad73c4f69099623');
});

for(const [titleId,count,height]of [[camera,19,39],[settings,39,32],[browser,16,67]])test(`Contents ${titleId} derives its source indicator from all ${count} controls`,()=>{
 const f=fixture(titleId),before=JSON.stringify(f.pack),entries=manualContents(f.index);
 assert.equal(entries.length+1,count,'Contents contributes one control before valid category/page controls');
 assert.equal(f.paint(),true);const {call,layout,posed}=drawn(f);
 assert.deepEqual(call.options,{center:[392,32],pictureSampling:'lcd',bindings:[{name:'ScrollIndicator_Wait',frame:5}]});
 assert.deepEqual(tail(layout).size,[height-8,8]);assert.deepEqual(tail(posed).size,[height-8,8]);
 assert.deepEqual(layout.materials[1].textureMatrices[0],{rotation:0,scale:[(height-8)/8,1],translation:[((height-8)/8-1)/2,0]});
 const expected=structuredClone(f.pack.layouts.ScrollIndicator);
 tail(expected).size[0]=height-8;expected.materials[1].textureMatrices[0]=structuredClone(layout.materials[1].textureMatrices[0]);
 assert.deepEqual(layout,expected,'only native EndPic width and its two source matrix fields change');
 assert.equal(JSON.stringify(f.pack),before,'the published source pack stays immutable');
 f.calls.length=0;assert.equal(f.paint(),true);assert.equal(drawn(f).layout,layout,'repeat paints reuse the bounded derived layout');f.renderer.dispose();
});

test('the source upper clamp applies to a valid empty index, and a new caller replaces the cached count',()=>{
 const f=fixture(),meta=f.index.roots[0].children.find(pane=>pane.name==='MetaData');
 for(const field of meta.metadata.filter(field=>field.name==='PageNum'||field.name==='CategoryNum'))field.value=[0];
 f.index.roots[0].children=[meta];assert.equal(f.paint(),true);
 assert.deepEqual(tail(drawn(f).layout).size,[172,8],'one Contents control clamps 208.125 to 180');
 f.view.data.manualTitleId=browser;f.renderer.packs['manual-index']=json(manualSources[browser].url);f.calls.length=0;
 assert.equal(f.paint(),true);assert.deepEqual(tail(drawn(f).layout).size,[59,8]);f.renderer.dispose();
});

test('unsupported selected source geometry, materials, texture or Wait cannot fall back to a fixed indicator',()=>{
 const edits=[
  f=>{delete f.renderer.packs['manual-scroll'];},f=>{delete f.pack.layouts.ScrollIndicator;},
  f=>{f.pack.layouts.ScrollIndicator.unsupported.push('unknown');},
  f=>{tail(f.pack.layouts.ScrollIndicator).size[0]=25;},f=>{tail(f.pack.layouts.ScrollIndicator).origin=4;},
  f=>{tail(f.pack.layouts.ScrollIndicator).alpha=151;},f=>{tail(f.pack.layouts.ScrollIndicator).rotation[2]=0;},
  f=>{tail(f.pack.layouts.ScrollIndicator).picture.uvSets[0][0]=.5;},
  f=>{f.pack.layouts.ScrollIndicator.materials[1].textureMatrices[0].translation[0]=0;},
  f=>{f.pack.layouts.ScrollIndicator.materials[1].textureMaps[0].wrapS=1;},
  f=>{f.pack.layouts.ScrollIndicator.materials[1].bufferColor[0]=26;},
  f=>{f.pack.textures['ScrollIndicator.bclim'].width=9;},f=>{f.pack.textures['ScrollIndicator.bclim'].url='another.png';},
  f=>{delete f.pack.animations.ScrollIndicator_Wait;},
  f=>{f.pack.animations.ScrollIndicator_Wait.tracks[0].keys[0].value=26;},
  f=>{f.pack.animations.ScrollIndicator_Wait.tracks[0].property='translation.x';},
  f=>{f.pack.animations.ScrollIndicator_Wait.unsupported.push('unknown');},
 ];
 for(const [index,edit]of edits.entries()){
  const f=fixture();edit(f);assert.throws(f.paint,/Unsupported Manual Contents ScrollIndicator source/,`mutation ${index}`);assert.equal(f.calls.length,0);f.renderer.dispose();
 }
});

test('cached derived geometry is revalidated while document pages keep their separate indicator scope',()=>{
 const f=fixture();assert.equal(f.paint(),true);tail(drawn(f).layout).size[0]=32;f.calls.length=0;
 assert.throws(f.paint,/Unsupported Manual Contents ScrollIndicator source/);assert.equal(f.calls.length,0);f.renderer.dispose();
 const page=fixture(settings,'document');delete page.renderer.packs['manual-scroll'];assert.equal(page.paint(),true);
 assert.equal(page.calls.some(call=>call.pack==='manual-scroll'),false);page.renderer.dispose();
});

const sourceRoot=process.env.MANUAL_SCROLL_SOURCE_ROOT;
test('optional pinned executable connects IndexNull HeadLineAll controls to the indicator writer',{skip:!sourceRoot},()=>{
 const code=readFileSync(join(sourceRoot,'code.bin'));
 assert.equal(sha(code),'cf4658f9f618a41f8d32ff7aed40d0ea565da78a2ace349cb93698ff5f7df5d8');
 const word=address=>code.readUInt32LE(address-0x100000);
 const string=address=>code.subarray(address-0x100000,code.indexOf(0,address-0x100000)).toString();
 assert.equal(string(word(0x1c1964)),'layout/IndexNull');
 assert.equal(string(0x1596d0),'HeadLineAll');assert.equal(string(0x1596dc),'IndexBase');assert.equal(string(0x159700),'ScrollIndicator');
 assert.equal(word(word(0x13d424)+12),0x13ceb0,'the built control dispatches its row builder before indicator construction');
 for(const [from,to]of [[0x1592f4,0x1653a8],[0x15935c,0x13cdc0],[0x159448,0x139e78],[0x139ed4,0x139de4],[0x139df0,0x144ff0],[0x139e48,0x143074]]){
  const instruction=word(from);assert.equal(instruction>>>24,0xeb);assert.equal(from+8+((instruction<<8)>>6),to);
 }
 for(const [address,value]of [[0x139e84,0xe1c400f0],[0x144ff0,0xe1c000dc],[0x144ff4,0xe0410000],[0x144ff8,0xe1a00140],[0x143074,0xeebd0ac0]])assert.equal(word(address),value);
 for(const [address,value]of [[0x139e64,-9.375],[0x139e68,217.5],[0x1ae710,30],[0x1ae714,180],[0x143118,32],[0x143070,8],[0x14311c,.125],[0x143120,.5]])assert.equal(code.readFloatLE(address-0x100000),value);
 const keyTable=word(0x15361c);
 assert.deepEqual(Array.from({length:10},(_,index)=>string(word(keyTable+index*4))),['MetaData','IsValid','PageNum','CategoryNum','CategoryPageNum','PageID_','SplitNumL','SplitNumS','PageTitle_','Category_']);
});
