import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {createPortfolioState,dispatchSystemEvent,launchHomeShortcut,reduceSystem,tickSystem} from '../src/os/system.ts';
import {selectHomeSlot,settleHomeNavigation,writeHomeNavigation} from '../src/os/home-navigation.ts';
import {enableHomeControls} from '../src/os/home-controls.ts';
import {decodeNativePng} from '../src/os/native-png.ts';
import {nativeTextureSamplePixels} from '../src/os/native-layout.ts';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const launcher=JSON.parse(readFileSync(new URL('packs/home/launcher.json',root))),messages=JSON.parse(readFileSync(new URL('packs/home/messages-and-loose.json',root)));
const data=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText+'\n//# sourceURL=manual-entry-footer-renderer.js').toString('base64');
const rendererUrl=new URL('../src/os/native-renderer.ts',import.meta.url),presentationUrl=new URL('../src/os/firmware-presentation.ts',import.meta.url);
const resolve=(source,url,renderer)=>source.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(path==='./native-renderer'&&renderer?renderer:new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href)+suffix);
const rendererModule=data(resolve(readFileSync(rendererUrl,'utf8'),rendererUrl));
const {NativeLayoutRenderer}=await import(rendererModule);
const {createFirmwareHome}=await import(data(resolve(readFileSync(presentationUrl,'utf8'),presentationUrl,rendererModule)));
const names=new Set(launcher.layouts.LncBtmBtn_02.textures);
for(const [name,clip]of Object.entries(launcher.animations))if(name.startsWith('LncBtmBtn_02_'))for(const texture of clip.textures)names.add(texture);
const textures=new Map();for(const name of names){const r=launcher.textures[name];textures.set(name,nativeTextureSamplePixels(await decodeNativePng(readFileSync(new URL(r.url,root)),r),r.picaFormat));}
const sha=b=>createHash('sha256').update(b).digest('hex');
const boot=()=>tickSystem(createPortfolioState(),3001),selected=(s,id)=>settleHomeNavigation(selectHomeSlot(s,Number(Object.entries(s.system.layout).find(([,v])=>v===id)[0])));
const touch=(s,phase,x=50,y=226)=>dispatchSystemEvent(s,{type:'touch',phase,pointerId:7,x,y},phase==='down'?6400:6900);
const suspended=()=>reduceSystem(tickSystem(launchHomeShortcut(boot(),'camera',3010),6200),'home',6300);
const browser=()=>{const s=boot(),n=s.system.homeNavigation;return enableHomeControls(writeHomeNavigation(s,{...n,focus:{...n.focus,toolbarActive:true,currentFocus:4}}));};

// Records the real renderer's prepared pixels and Canvas publication calls.
// This transport does not emulate browser rasterization or text ink.
function canvas(){
 const result={width:320,height:240,draws:[]},stack=[];
 const ctx={canvas:result,globalAlpha:1,globalCompositeOperation:'source-over',
  save(){stack.push([this.globalAlpha,this.globalCompositeOperation]);},restore(){[this.globalAlpha,this.globalCompositeOperation]=stack.pop();},
  translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},
  createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},
  getImageData(){return result.image?{...result.image,data:result.image.data.slice()}:this.createImageData(result.width,result.height);},
  putImageData(image){result.image={...image,data:image.data.slice()};},
  drawImage(source,...rect){result.draws.push({width:source.width,height:source.height,rgba:sha(source.image.data),rect,alpha:this.globalAlpha,blend:this.globalCompositeOperation});},
 };result.getContext=()=>ctx;return result;
}
function fixture(run,pack=launcher){
 const previous=globalThis.document;globalThis.document={createElement:canvas};
 const renderer=new NativeLayoutRenderer({launcher:pack,messages},{launcher:new Map(textures)},new Map([['cbf_std.bcfnt',{manifest:{height:32},drawNative(){}}]]));
 const draws=[],draw=renderer.draw.bind(renderer);renderer.draw=(ctx,bank,name,options)=>{draws.push({bank,name,options});return draw(ctx,bank,name,options);};
 try{run({home:createFirmwareHome({renderer}),renderer,draws});}finally{renderer.dispose();globalThis.document=previous;}
}

test('captured Manual contacts use source Decide5 for only their semantic button with the actual renderer',()=>{
 for(const [state,x,group]of [[selected(boot(),'camera'),50,'G_BtnW_L_03'],[selected(boot(),'system-settings'),50,'G_BtnW_L_03'],[browser(),50,'G_BtnW_L_03'],[suspended(),160,'G_BtnW_C_03']])fixture(({home,renderer,draws})=>{
  const held=touch(state,'down',x),before=JSON.stringify(held),sourceBefore=JSON.stringify(launcher),pressed=canvas(),released=canvas();
  assert.equal(home.footer(pressed.getContext('2d'),held),true,renderer.diagnostics.join('\n'));
  assert.equal(home.manualEntryFooter(released.getContext('2d'),held),true,renderer.diagnostics.join('\n'));
  const options=draws.at(-1).options;
  assert.deepEqual(options.bindings,[{name:'LncBtmBtn_02_SceneIn',frame:15},{name:'LncBtmBtn_02_Decide',frame:5,groups:[group]}]);
  assert.deepEqual(options.clip,[0,210,320,30]);assert.equal(options.textSampling,'lcd');
  assert.ok(released.draws.length>0);assert.notDeepEqual(released.draws,pressed.draws,'delivered release pixels differ from held Select');
  const expected=canvas();assert.equal(renderer.draw(expected.getContext('2d'),'launcher','LncBtmBtn_02',{...options,bindings:[{name:'LncBtmBtn_02_SceneIn',frame:15},{name:'LncBtmBtn_02_Decide',frame:5,groups:[group]}]}),true);
  assert.deepEqual(released.draws,expected.draws,'exact prepared picture bytes and Canvas calls equal the source terminal binding');
  const repeated=canvas();assert.equal(home.manualEntryFooter(repeated.getContext('2d'),held),true);assert.deepEqual(repeated.draws,released.draws);
  assert.equal(JSON.stringify(held),before);assert.equal(JSON.stringify(launcher),sourceBefore);
 });
});

test('idle, foreign, outside, cancelled, changed selection and app-origin contacts do not repaint a Manual footer',()=>fixture(({home,draws})=>{
 const state=selected(boot(),'camera'),held=touch(state,'down');
 for(const source of [state,touch(state,'down',160),touch(held,'move',160),touch(held,'cancel'),selected(held,'work'),tickSystem(launchHomeShortcut(boot(),'camera',3010),6200)]){
  const count=draws.length;assert.equal(home.manualEntryFooter(canvas().getContext('2d'),source),true);assert.equal(draws.length,count);
 }
}));

test('selected Manual entry Decide rejects unsupported source fields before drawing',()=>{
 const pack=structuredClone(launcher);pack.animations.LncBtmBtn_02_Decide.unsupported.push('unsupported source field');
 fixture(({home,draws})=>{
  assert.throws(()=>home.manualEntryFooter(canvas().getContext('2d'),touch(selected(boot(),'camera'),'down')),/Manual entry footer Decide source unavailable/);
  assert.equal(draws.length,0);
 },pack);
});

test('selected Decide source and binding groups fail explicitly instead of keeping held pixels',()=>{
 const mutations=[
  p=>delete p.animations.LncBtmBtn_02_Decide,
  p=>p.animations.LncBtmBtn_02_Decide.groups=[],
  p=>p.animations.LncBtmBtn_02_Decide.frames=5,
  p=>p.resourceSources.animations.LncBtmBtn_02_Decide.sha256='invalid',
  p=>p.layouts.LncBtmBtn_02.groups[0].children.find(g=>g.name==='G_BtnW_L_03').panes=[],
  p=>p.animations.LncBtmBtn_02_Decide.tracks=p.animations.LncBtmBtn_02_Decide.tracks.filter(t=>t.target!=='P_BtnW_L_03'),
 ];
 for(const mutate of mutations){const pack=structuredClone(launcher);mutate(pack);fixture(({home})=>assert.throws(()=>home.manualEntryFooter(canvas().getContext('2d'),touch(selected(boot(),'camera'),'down')),/Manual entry footer Decide/),pack);}
 fixture(({home,renderer})=>{renderer.dispose();assert.equal(home.manualEntryFooter(canvas().getContext('2d'),touch(selected(boot(),'camera'),'down')),false);});
});
