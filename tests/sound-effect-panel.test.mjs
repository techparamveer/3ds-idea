import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const layout=url(compile('stock-screen-layout').replace("'./camera-browse.ts'",JSON.stringify(new URL('../src/os/camera-browse.ts',import.meta.url).href)));
const source=compile('stock-native-sound').replace("'./stock-screen-layout'",JSON.stringify(layout)).replace("'./native-layout'",JSON.stringify(url(compile('native-layout')))).replace("'./stock-sound-record'",JSON.stringify(url(compile('stock-sound-record'))));
const {soundScreenPacks,drawNativeSoundFrame}=await import(url(source));
const {stockScreenActionAt:hit}=await import(layout);
const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const playPack=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_Play_D-arc-LZ.json',firmware),'utf8'));

const panes=(pane,out={})=>{out[pane.name]=pane;for(const child of pane.children)panes(child,out);return out;};
const draws=view=>{
  const calls=[],top={},bottom={};
  drawNativeSoundFrame({packs:{'sound-messages':{messages:{}}},draw:(ctx,pack,layout,options={})=>{calls.push({screen:ctx===bottom?'bottom':'top',pack,layout,bindings:options.bindings??[]});return true;}},top,bottom,view,{});
  return calls;
};
const playback={appId:'sound',screen:'playback',heading:'',rows:[],selection:0,footer:{left:{label:'Back',action:'back'},right:{label:'OK',action:'play'}},data:{track:{id:'probe',title:'Probe'},playing:true,position:10,duration:100}};

test('published S_Play_D-Effect keeps its source panes, icons and resting clip',()=>{
  const layout=playPack.layouts['S_Play_D-Effect'],p=panes(layout.roots[0]);
  assert.deepEqual(layout.canvas,{height:240,origin:1,width:320});
  assert.deepEqual([p['-B-EjyP0'].translation,p['-B-EjyP1'].translation],[[-54,27,0],[54,27,0]]);
  for(const side of ['P0','P1']){
    assert.deepEqual(p['GrpEjy'+side].size,[72,74]);assert.deepEqual(p['IconEjyI_'+side].size,[64,64]);assert.deepEqual(p['BB-Ejy'+side].size,[70,70]);
  }
  const texture=name=>layout.textures[layout.materials[p[name].picture.material].textureMaps[0].texture];
  assert.deepEqual(['GrpEjyP0','GrpEjyP1','IconEjyI_P0','IconEjyI_P1'].map(texture),['BtnPlay.bclim','BtnPlay.bclim','IconGraph.bclim','IconFilter.bclim']);
  for(const name of ['BtnPlay.bclim','IconGraph.bclim','IconFilter.bclim']){
    const entry=playPack.textures[name];
    assert.equal(createHash('sha256').update(readFileSync(new URL(entry.url,firmware))).digest('hex'),entry.sha256,name);
  }
  const clip=playPack.animations['S_Play_D-Effect_Default'];
  assert.equal(clip.loop,true);assert.equal(clip.frames,20);
});

test('resting playback draws the Effect panel after the transport and beneath the error dialog',()=>{
  assert.deepEqual(soundScreenPacks.find(pack=>pack.alias==='sound-player'),{url:'packs/sound/contents/0000-0000000b/lyt-S_Play_D-arc-LZ.json',alias:'sound-player',layouts:['S_Play_D-CtrPanel3','S_Play_D-Effect'],animations:['S_Play_D-CtrPanel3_Default','S_Play_D-Effect_Default']});
  for(const playing of [true,false]){
    const layouts=draws({...playback,data:{...playback.data,playing}}).map(c=>c.layout),effect=layouts.indexOf('S_Play_D-Effect');
    assert.ok(effect>layouts.indexOf('S_Play_D-CtrPanel3'),'Effect follows CtrPanel3 as in the source constructor');
  }
  const effect=draws(playback).find(c=>c.layout==='S_Play_D-Effect');
  assert.deepEqual(effect,{screen:'bottom',pack:'sound-player',layout:'S_Play_D-Effect',bindings:[{name:'S_Play_D-Effect_Default',frame:0}]});
  const failed=draws({...playback,data:{...playback.data,mediaError:true}}).map(c=>c.layout);
  assert.ok(failed.indexOf('S_Play_D-Effect')<failed.indexOf('C_Dlg'),'the Could-not-play dialog covers the Effect panel');
  const library=draws({...playback,screen:'main',data:{tracks:[]}}).map(c=>c.layout);
  assert.equal(library.includes('S_Play_D-Effect'),false);
});

test('Effect buttons are visible but inert because they open audio-altering surfaces',()=>{
  for(const [x,y] of [[106,93],[214,93],[71,57],[248,128]])assert.equal(hit({...playback,rows:[{id:'play',label:'Pause'}]},x,y),null);
});
