import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import ts from 'typescript';
import {nativePaneParentPath,nativeMessageOverride} from '../src/os/native-layout.ts';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const amiibo=moduleUrl('export const drawNativeAmiibo=()=>false;export const amiiboScreenPacks=[];');
const compile=name=>{
 const url=new URL(`../src/os/${name}.ts`,import.meta.url),source=readFileSync(url,'utf8');
 return moduleUrl(source.replace(/(from\s*['"])(\.[^'"]+?)(['"])/g,(_all,prefix,path,suffix)=>prefix+(path==='./stock-native-amiibo'?amiibo:new URL(`${path}.ts`,url).href)+suffix));
};
const {drawNativeHelperFrame,nativeHelperView,APPLICATION_MANUAL_LOWER_FIT}=await import(compile('stock-native-helpers'));
const {NativeLayoutRenderer}=await import(compile('native-renderer'));
const titles=['0004001000022000','0004001000022400','0004003000009d02'];
const names=['T_BtnB_Text','T_BtnF_Text','T_BtnB_Pict','T_BtnF_Pict'];
const pane=(layout,name=names[0])=>nativePaneParentPath(layout,name).at(-1);
function fixture(titleId=titles[1],screen='main'){
 const view={appId:'manual',screen,heading:'',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}},data:{manualTitleId:titleId,page:0}};
 const packs=Object.fromEntries(nativeHelperView(view).packs.map(request=>[request.alias,json(request.url)]));
 const font={manifest:json('fonts/shared/font.json')},renderer=new NativeLayoutRenderer(packs,{},new Map([['cbf_std.bcfnt',font]])),calls=[];
 renderer.draw=(context,pack,layout,options)=>{calls.push({pack,layout,options});return true;};
 const context={fillStyle:'',fillRect(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 const language=packs['manual-footer-language'],messages=packs['helper-messages'],bank=messages.messages.ebird;
 return {view,renderer,font,calls,language,messages,bank,table:messages.styles[bank.styleTable],layout:language?.layouts.BtnLngSel00,
  paint:()=>drawNativeHelperFrame(renderer,context,context,view)};
}

test('language footer keeps the delivered Manual layout, SceneIn and message provenance',()=>{
 const bytes=readFileSync(new URL('packs/manual/layout-BtnLngSel00.json',root)),pack=JSON.parse(bytes);
 assert.equal(sha(bytes),'03d2aa635fd251166dc0d8e91f82423c32cd2bfd3d83483138cf22bd99cf63f4');
 assert.equal(pack.titleId,'0004003000009b02');assert.equal(pack.sourceSha256,'e0c60c2c7f0e7a613344872b366addcbfdabcdfe3e718b2fc08c673873b52187');
 assert.deepEqual(pack.resourceSources.layouts.BtnLngSel00,{path:'layout/BtnLngSel00.arc/blyt/BtnLngSel00.bclyt',sha256:'205dbf2d9b08b06c696975c54d6c6f92d57601f5ba44f368550aa6a7fc992c65',titleId:pack.titleId});
 assert.deepEqual(pack.resourceSources.animations.BtnLngSel00_SceneIn,{path:'layout/BtnLngSel00.arc/anim/BtnLngSel00_SceneIn.bclan',sha256:'28e57a081fc05f721417ffd3da909fa08a8aff3fa014218e6992ebb80f607b49',titleId:pack.titleId});
 const messages=json('packs/manual/messages-and-loose.json');
 assert.deepEqual(messages.resourceSources.messages.ebird,{path:'RomFS/message/EU_English/ebird.msbt',sha256:'e246200f7bc5f07a043a818e8df65e0a7e944c75c4231e34b6d5c75f5200399e',titleId:pack.titleId});
 assert.deepEqual(messages.resourceSources.styles['message/EU_English/RI.mstl'],{path:'RomFS/message/EU_English/RI.mstl',sha256:'e07f56ca88afb0816bca728de1e265f17d629958b984de44177ece4a345f7911',titleId:pack.titleId});
 assert.deepEqual(APPLICATION_MANUAL_LOWER_FIT,{rowBodyY:2,secondCategoryRegister:[118,183,218]},'only preexisting body/register adaptations remain here');
});

for(const titleId of titles)test(`Contents ${titleId} uses original paired float32/truncated footer X only`,()=>{
 const f=fixture(titleId),before=JSON.stringify(f.language),messagesBefore=JSON.stringify(f.messages);
 assert.equal(f.paint(),true);const call=f.calls.find(call=>call.pack==='manual-footer-language');
 assert.deepEqual(call.options.bindings,[{name:'BtnLngSel00_SceneIn',frame:20}]);assert.equal(call.options.textSampling,'lcd-source-size');
 for(const name of names){
  const original=pane(f.layout,name),pictogram=name.endsWith('Pict');
  assert.deepEqual(call.options.overrides[name],{...nativeMessageOverride(f.messages,'ebird',pictogram?'BtnLngSel_Picto':'BtnLngSel',''),translation:[pictogram?-42:13,original.translation[1],original.translation[2]]});
 }
 const close=f.calls.find(call=>call.pack==='manual-footer-close');
 assert.deepEqual(close.options,{textSampling:'lcd-source-size',bindings:[{name:'BtnCloseLng00_SceneIn',frame:20}],overrides:{T_BtnB_01:nativeMessageOverride(f.messages,'ebird','BtnCloseLng',''),T_BtnF_01:nativeMessageOverride(f.messages,'ebird','BtnCloseLng','')}});
 assert.deepEqual(f.calls.find(call=>call.pack==='manual-footer-shadow').options,{bindings:[{name:'BtnShdw00_SceneIn',frame:20}]});
 assert.equal(JSON.stringify(f.language),before);assert.equal(JSON.stringify(f.messages),messagesBefore);
 const calls=structuredClone(f.calls);f.calls.length=0;assert.equal(f.paint(),true);assert.deepEqual(f.calls,calls);f.renderer.dispose();
});

test('selected footer pane, hierarchy, material and terminal pose changes fail before drawing',()=>{
 const edits=[
  f=>{delete f.renderer.packs['manual-footer-language'];},f=>{delete f.language.layouts.BtnLngSel00;},
  f=>{f.layout.unsupported.push('unknown');},f=>{f.layout.fonts[0]='another.bcfnt';},
  f=>{f.layout.canvas.width=321;},f=>{f.layout.canvas.height=241;},f=>{f.layout.canvas.origin=0;},
  f=>{f.layout.roots.push(structuredClone(pane(f.layout)));},f=>{f.layout.roots[0].rotation[2]=1;},
  f=>{nativePaneParentPath(f.layout,names[0])[1].name='OtherParent';},
  f=>{nativePaneParentPath(f.layout,names[0])[2].scale=[2,1];},
  f=>{pane(f.layout).translation[0]=1;},f=>{pane(f.layout).translation[1]=24;},f=>{pane(f.layout).translation[2]=1;},
  f=>{pane(f.layout).size[0]=124;},f=>{pane(f.layout).alpha=254;},f=>{pane(f.layout).origin=4;},
  f=>{pane(f.layout).text.capacity=17;},f=>{pane(f.layout).text.length=17;},f=>{pane(f.layout).text.font=1;},
  f=>{pane(f.layout).text.material=4;},f=>{pane(f.layout).text.alignment=0;},f=>{pane(f.layout).text.lineAlignment=2;},
  f=>{pane(f.layout).text.size[0]=18;},f=>{pane(f.layout).text.characterSpacing=1;},f=>{pane(f.layout).text.lineSpacing=1;},
  f=>{pane(f.layout).text.value='Other';},f=>{pane(f.layout).text.topColor[0]=254;},
  f=>{pane(f.layout).text.cursorAdvances=[];},f=>{pane(f.layout).text.messageStyle={fontScale:[.7,.7]};},
  f=>{f.layout.materials[3].name='Other';},f=>{f.layout.materials[3].flags=1;},f=>{f.layout.materials[3].textureOnly=true;},
  f=>{f.layout.materials[3].bufferColor[0]=1;},f=>{f.layout.materials[3].constantColors[0][0]=254;},
  f=>{f.layout.materials[3].textureMaps.push({texture:0});},f=>{f.layout.materials[3].colorBlend={};},
  f=>{f.layout.materials[3].unsupported.push('unknown');},
  f=>{delete f.language.animations.BtnLngSel00_SceneIn;},f=>{f.language.animations.BtnLngSel00_SceneIn.unsupported.push('unknown');},
  f=>{f.language.animations.BtnLngSel00_SceneIn.frames=22;},
  f=>{f.language.animations.BtnLngSel00_SceneIn.tracks.find(track=>track.target==='BtnLngSel_00'&&track.property==='translation.y').keys.at(-1).value=1;},
  f=>{f.language.animations.BtnLngSel00_SceneIn.tracks.find(track=>track.target===names[0]&&track.property==='materialColor.1.0').keys[0].value=254;},
 ];
 for(const [index,edit] of edits.entries()){const f=fixture();edit(f);assert.throws(f.paint,/Unsupported Manual Contents language footer source/,`mutation ${index}`);assert.equal(f.calls.length,0);f.renderer.dispose();}
});

test('only exact selected message/style records and the actual font advances can drive measurement',()=>{
 const edits=[
  f=>{f.bank.labels.BtnLngSel=5;},f=>{f.bank.messages[4].text='Languages';},f=>{f.bank.messages[4].styleIndex=18;},
  f=>{f.bank.messages[4].tokens.push({text:'extra'});},f=>{f.bank.messages[5].tokens=[{kind:'control',text:'\ue003'}];},
  f=>{f.bank.version=4;},f=>{f.bank.unsupported.push('unknown');},f=>{f.bank.styleTable='Other';},
  f=>{f.table.recordSize=48;},f=>{f.table.unsupported[0].offsets.pop();},f=>{f.table.unsupported.push({kind:'other'});},
  f=>{f.table.styles[19].fontScale[0]=.7;},f=>{f.table.styles[18].lineSpacing=1;},
  f=>{f.table.styles[19].unresolvedWords[0]=124;},f=>{delete f.table.styles[18].unresolvedWords[40];},
  f=>{f.table.styles[19].unresolvedWords[44]=0;},f=>{f.table.styles[18].fontScale[1]=1;},
  f=>{f.font.manifest.glyphs['76'].advance=16;},f=>{f.font.manifest.glyphs['57347'].advance=23;},
  f=>{delete f.font.manifest.glyphs['103'];},f=>{f.font.manifest.sourceSha256='0'.repeat(64);},
 ];
 for(const [index,edit] of edits.entries()){
  const f=fixture();edit(f);
  assert.throws(f.paint,index===20?/Unsupported Manual Contents TextBox_Txt font/:/Unsupported Manual Contents language footer source/,`mutation ${index}`);
  assert.equal(f.calls.length,0);f.renderer.dispose();
 }
});

test('a replacement after an earlier valid paint is revalidated, and Page ignores the Contents footer',()=>{
 const f=fixture();assert.equal(f.paint(),true);f.calls.length=0;
 f.language.layouts.BtnLngSel00=structuredClone(f.layout);pane(f.language.layouts.BtnLngSel00,names[2]).text.length=5;
 assert.throws(f.paint,/Unsupported Manual Contents language footer source/);assert.equal(f.calls.length,0);f.renderer.dispose();
 const page=fixture(titles[0],'document');
 delete page.renderer.packs['manual-footer-language'];assert.equal(page.paint(),true);
 assert.equal(page.calls.some(call=>call.pack==='manual-footer-language'),false);page.renderer.dispose();
});

test('float32 source width and truncation differ from the old capture-fit X without fitting pixels',()=>{
 const font=json('fonts/shared/font.json');
 const width=(text,scale)=>Array.from(text).reduce((sum,char)=>Math.fround(sum+Math.fround(font.glyphs[char.charCodeAt(0)].advance*Math.fround(scale))),0);
 assert.equal(width('Language',.7),84);assert.equal(width('\ue003',.765),18.360000610351562);
 assert.equal(Math.trunc(Math.fround(-Math.fround(width('Language',.7)*.5))),-42);
 assert.equal(Math.trunc(Math.fround(Math.fround(width('\ue003',.765)+8)*.5)),13);
 // Original VCVT.S32.F32 truncates toward zero, not floor or nearest.
 assert.equal(Math.trunc(Math.fround(-42.875)),-42);assert.notEqual(Math.floor(-42.875),-42);
 assert.equal(Math.trunc(Math.fround(13.875)),13);assert.notEqual(Math.round(13.875),13);
});

const sourceRoot=process.env.MANUAL_FOOTER_SOURCE_ROOT;
test('optional pinned original constructor, named writer, measure and truncating placer',{skip:!sourceRoot},()=>{
 const provenance=JSON.parse(readFileSync(join(sourceRoot,'recovery-provenance.json'),'utf8'));
 const original=readFileSync(provenance.original),compressed=readFileSync(join(sourceRoot,'code-compressed.bin')),code=readFileSync(join(sourceRoot,'code.bin'));
 assert.deepEqual([provenance.titleId,provenance.version,provenance.contentIndex,provenance.contentId],['0004003000009b02',5120,0,'0000000a']);
 assert.equal(sha(original),'c493384988edd28b723b69b77f8406eaca4cf54e55446f4f5977a40e0d70c92a');
 assert.equal(sha(compressed),'6845e51675c92959641494eff1f68d2aadfd78096777bebe6eff0e246489a5a8');
 assert.equal(compressed.length,498224);assert.deepEqual(original.subarray(0x2e00,0x2e00+498224),compressed);
 assert.equal(sha(code),'cf4658f9f618a41f8d32ff7aed40d0ea565da78a2ace349cb93698ff5f7df5d8');
 const ranges=[
  [0x13b260,0x13b330,'94a4a9a25e452f1f3b3816d904ff3f5652aaafd0cd8c4d2a802fadbe7b2706b4'],
  [0x15a168,0x15a380,'e3547599872ac705e2599c48d694c61072c3ea6f398a3b496a19be6f44518d0d'],
  [0x16d910,0x16d9a0,'1c834d9e01a4a22728e30a43c5461354e315b5f90685f38b7050a73b6c125032'],
  [0x16da34,0x16db40,'15795d80358550fb07d43c5038b46dc2d8c9ccac675cfd5bdb5d4a311e0f816b'],
  [0x17ee84,0x17eef0,'af7158bf3d0a19591da826bd3e28d403a7533061838899ff8701a89191d95a3e'],
  [0x1837a0,0x183884,'eb64612dbb5cc968a6c170a08a90f28d5358146dd714d5535e6e771b74eef9e4'],
  [0x187410,0x1874c8,'0b649eaa19109a3abe63cd8b9ce4ace925c44bb81b272e1ba40d8d3a2a9aec09'],
  [0x173c80,0x173ca0,'07baed28df43afa855957394c5f156d1a579dda6986b868030bc3bea45e4b944'],
 ];
 for(const [lo,hi,hash] of ranges)assert.equal(sha(code.subarray(lo-0x100000,hi-0x100000)),hash);
 const branches=[[0x13b29c,0x15a168],[0x13b2b0,0x15a168],[0x13b2c4,0x15a168],[0x13b2d8,0x15a168],[0x13b324,0x16da3c],
  [0x15a1f8,0x12d584],[0x15a304,0x12d538],[0x16da58,0x16d910],[0x16da68,0x16d910],[0x16d97c,0x17ee84],[0x17eecc,0x1837a0],[0x1837f4,0x187138]];
 const words=[
  [0x15a234,0xed950a07],[0x15a238,0xed951a06],[0x15a2a0,0xed950a08],[0x15a2cc,0xed950a09],
  [0x16da8c,0xee480a49],[0x16da90,0xeebd0ae0],[0x16da94,0xeeb80ac0],
  [0x16dabc,0xee480a49],[0x16dac0,0xeebd0ae0],[0x16daec,0xee080a89],[0x16daf0,0xeebd0ac0],[0x16daf4,0xeeb80ac0],
  [0x16db1c,0xee080a89],[0x16db20,0xeebd0ac0],[0x16db24,0xeeb80ac0],
  [0x187438,0xe595003c],[0x18743c,0xe5901000],[0x187440,0xe5912038],[0x187444,0xe1a01008],
  [0x187448,0xe12fff32],[0x18744c,0xee000a10],[0x187450,0xedd50a09],[0x187454,0xeeb80ac0],[0x187458,0xee408a20],
  [0x173c80,0xe1c120d0],[0x173c84,0xe5911008],[0x173c88,0xe5801030],[0x173c8c,0xe1c022f8],
 ];
 const verify=bytes=>{
  const word=address=>bytes.readUInt32LE(address-0x100000);
  for(const [address,target] of branches){const instruction=word(address);assert.equal(instruction>>>24,0xeb);assert.equal(address+8+((instruction<<8)>>6),target);}
  for(const [address,instruction] of words)assert.equal(word(address),instruction);
  assert.equal(bytes.readFloatLE(0x16da34-0x100000),8);assert.equal(bytes.readFloatLE(0x16da38-0x100000),.5);
  const string=address=>bytes.subarray(address-0x100000).toString('utf8').split('\0')[0];
  assert.equal(string(0x13b338),'BtnLngSel');assert.equal(string(0x13b344),'BtnLngSel_Picto');
  for(const [address,name] of [[0x1c17a4,names[1]],[0x1c17a8,names[0]],[0x1c17ac,names[3]],[0x1c17b0,names[2]]])assert.equal(string(word(address)),name);
 };
 verify(code);
 for(const [address] of [...branches,...words]){const mutation=Buffer.from(code);mutation.writeUInt32LE((mutation.readUInt32LE(address-0x100000)^1)>>>0,address-0x100000);assert.throws(()=>verify(mutation),assert.AssertionError);}
 // Pinned decoded instructions only. The prior Unicorn SIGILL establishes no
 // original ARM execution, GPU rounding equivalence or native pixel acceptance.
});
