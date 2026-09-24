import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const read=path=>readFileSync(new URL(path,root));
const P='packs/settings/contents/0000-0000003d/';
// Decoded member hashes from scripts/audit_settings_language.py against code 1f9351cd….
const members={
 layout:{
  Country_D_00:['layouts','layout_LZ.bin/blyt/Country_D_00.bclyt','c784303517ed52466482fd89e5c4274e2603b36c2e276ce7437988fe1139d0f2'],
  Country_D_00_SceneIn_00:['animations','layout_LZ.bin/anim/Country_D_00_SceneIn_00.bclan','326469de59d1a374e354112e4cfe7c72c23d6477a1c37f1da1ca0e92f90bf1bd'],
  Country_D_00_SceneIn_01:['animations','layout_LZ.bin/anim/Country_D_00_SceneIn_01.bclan','adf6216ab5471b4260348d1fdb77fae9396600739a5086a79e0b553bece57c6d'],
 },
 button:{
  T_SB:['layouts','button_LZ.bin/blyt/T_SB.bclyt','874997526f67c3657cfcaeca00a0410f2159cbd3d352d46918f9f52a773d388d'],
  R_SlideBar:['layouts','button_LZ.bin/blyt/R_SlideBar.bclyt','f8a04ebb6288b90df1b15f50d2bedf91684528b263c6fb655453f08f9b869598'],
  T_SB_Decide:['animations','button_LZ.bin/anim/T_SB_Decide.bclan','7a89146fe2e50564cd8c32e14894b758251bf30ce5279a9312820b90ba14d7b3'],
 },
};
const labels={language:'Language',language_comm_u:'Select the language to use.',base_2b_back:'Back',base_2b_decide:'OK',
 eu_english:'English',eu_french:'Français',eu_german:'Deutsch',eu_spanish:'Español',eu_italian:'Italiano',eu_dutch:'Nederlands',eu_portuguese:'Português',eu_russian:'Русский'};

test('Language list layout, row tab, slide bar and clips are delivered with source member provenance',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 for(const [file,entries] of Object.entries(members)){
  assert.equal(createHash('sha256').update(read(P+file+'.json')).digest('hex'),manifest.resources[P+file+'.json'].sha256);
  const pack=JSON.parse(read(P+file+'.json'));
  for(const [name,[bucket,path,sha256]] of Object.entries(entries)){
   assert.ok(pack[bucket][name],name);assert.deepEqual(pack[bucket][name].unsupported,[]);
   const source=pack.resourceSources[bucket][name];
   assert.equal(source.path,path);assert.equal(source.sha256,sha256,name);
   assert.equal(source.titleId,'0004001000022000');assert.equal(source.contentId,'0000003d');
   if(bucket==='layouts')for(const texture of pack[bucket][name].textures)assert.ok(manifest.resources[pack.textures[texture].url],texture);
  }
 }
});
test('Language page labels keep source text and styles; the confirmation dialog stays unpublished',()=>{
 const bank=JSON.parse(read(P+'message_EU.json')).messages.mset;
 for(const [label,text] of Object.entries(labels)){
  const message=bank.messages[bank.labels[label]];
  assert.equal(message.text,text,label);assert.equal(typeof message.styleIndex,'number',label);
 }
 const dialog=JSON.parse(read(P+'dialog.json'));
 assert.equal(Object.keys(dialog.layouts).some(name=>/lang/i.test(name)),false);
});
test('List selection and scroll clips stay unpublished for the read-only page',()=>{
 const layout=JSON.parse(read(P+'layout.json')),button=JSON.parse(read(P+'button.json'));
 for(const name of ['Country_D_00_ScrollDw','Country_D_00_ScrollUp'])assert.equal(name in layout.animations,false,name);
 for(const name of ['T_SB_Select','T_SB_UnDecide','R_SlideBar_Select','R_SlideBar_Invalid'])assert.equal(name in button.animations,false,name);
});
