import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const compile = async name => import('data:text/javascript;base64,' + Buffer.from(ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts', import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const {poseNativeLayout}=await compile('native-layout');
const {soundRecordLayoutSelection,drawNativeSoundRecordBackground}=await compile('stock-sound-record');
const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const url='packs/sound/contents/0000-0000000b/lyt-S_BG-arc-LZ.json';
const bytes=readFileSync(new URL(url,root)),pack=JSON.parse(bytes),manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const pane=(layout,name)=>{const visit=p=>p.name===name?p:p.children.map(visit).find(Boolean);return layout.roots.map(visit).find(Boolean);};
const pose=name=>poseNativeLayout(pack.layouts['S_BG-Record'],pack.animations,[{name,frame:0}]);

test('record delivery is the source texture and complete 12-clip layout selection',()=>{
  assert.equal(hash(bytes),manifest.resources[url].sha256);
  const texture=pack.textures['BG_Record_01.bclim'],png=readFileSync(new URL(texture.url,root));
  assert.equal(hash(png),'dddc006390df2a4a84fa89a2484e3fae716bbd1b3aa23ca0740c9cda3f919a22');
  assert.equal(hash(png),texture.sha256);assert.equal(hash(png),manifest.resources[texture.url].sha256);
  assert.deepEqual([texture.width,texture.height,texture.formatName],[512,512,'ETC1A4']);
  assert.equal(Object.keys(pack.animations).filter(name=>name.startsWith('S_BG-Record_')).length,12);
  for(const name of soundRecordLayoutSelection.animations)assert.deepEqual(pack.animations[name].unsupported,[]);
  const layout=pack.layouts['S_BG-Record'],record=pane(layout,'BG_Record_01');
  assert.deepEqual(layout.unsupported,[]);assert.deepEqual(layout.fonts,[]);
  assert.deepEqual(record.translation,[26,120,0]);assert.deepEqual(record.size,[368,288]);
  assert.deepEqual(record.picture.uvSets,[[.28125,.21875,1,.21875,.28125,.78125,1,.78125]]);
});

test('independent resting poses preserve the native lower/upper offset and caller-owned visibility',()=>{
  const original=JSON.stringify(pack),lower=pose('S_BG-Record_Default'),upper=pose('S_BG-Record_U_Default');
  assert.deepEqual(pane(lower,'BG_Recd').translation,[0,0,0]);
  assert.deepEqual(pane(upper,'BG_Recd').translation,[0,-332,0]);
  assert.deepEqual(pane(upper,'BG_Recd').scale,[1,1]);
  // Centre plus authored translation, with layout Y inverted for Canvas.
  assert.deepEqual([200+26,120-(-332+120)-144],[226,188]);
  assert.deepEqual([160+26,120-120-144],[186,-144]);
  const calls=[],renderer={draw:(...args)=>{calls.push(args);return true;}},top={},bottom={};
  assert.equal(drawNativeSoundRecordBackground(renderer,top,'top'),true);
  assert.equal(drawNativeSoundRecordBackground(renderer,bottom,'bottom'),true);
  assert.deepEqual(calls,[[top,'sound-bg','S_BG-Record',{center:[200,120],bindings:[{name:'S_BG-Record_U_Default',frame:0}]}],[bottom,'sound-bg','S_BG-Record',{center:[160,120],bindings:[{name:'S_BG-Record_Default',frame:0}]}]]);
  assert.equal(JSON.stringify(pack),original);
});
