import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const read=path=>readFileSync(new URL(path,root));
const P='packs/settings/contents/0000-0000003d/';
// Decoded member hashes from scripts/audit_settings_data_lists.py against code 1f9351cd….
const members={
 SMngCTRData_D_00:['layouts','blyt/SMngCTRData_D_00.bclyt','96fb2b9fc1e56551fc09cf43218d402d1c195ffa23c6a350b52ec60497628d1a'],
 SMngCTRData_D_00_SceneIn_00:['animations','anim/SMngCTRData_D_00_SceneIn_00.bclan','3c8865a86ac9bb1717637d77a3c916c1be00fe299a2cee93284696529654e23d'],
 SMngCTRData_D_00_SceneIn_01:['animations','anim/SMngCTRData_D_00_SceneIn_01.bclan','a9859131b660a7effa23f8a528a3f9c936c5aff2aafbd190fa428c595bb3080a'],
 SMngCTRData_D_00_TextIn:['animations','anim/SMngCTRData_D_00_TextIn.bclan','5b8e76a32ae963ea02ffb90e1f66a0f37d8d0b6d5c1d12f33eae7e40d0c554fa'],
 SMngCTRData_D_00_BtnIn:['animations','anim/SMngCTRData_D_00_BtnIn.bclan','32acb1d435fc223d7ca5eb80fabc55586e7963ed646c5752e6f7350b75c590a5'],
};
const labels={dat_sof_title_u:'Software Management',dat_opt_title_u:'Extra Data Management',dat_3ds_comm:'Software title list',dat_sd_u:'SD Card',dat_block_u:'Open Blocks',dat_no_software:'There is no accessible\nsoftware data.',dat_no_option:'There is no extra data.'};

test('Data Management list layout and clips are delivered with source member provenance',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 for(const name of ['layout.json','message_EU.json'])assert.equal(createHash('sha256').update(read(P+name)).digest('hex'),manifest.resources[P+name].sha256);
 const pack=JSON.parse(read(P+'layout.json'));
 for(const [name,[bucket,member,sha256]] of Object.entries(members)){
  assert.ok(pack[bucket][name],name);assert.deepEqual(pack[bucket][name].unsupported,[]);
  assert.deepEqual(pack.resourceSources[bucket][name],{contentId:'0000003d',contentIndex:0,path:'layout_LZ.bin/'+member,sha256,titleId:'0004001000022000'});
 }
 for(const texture of pack.layouts.SMngCTRData_D_00.textures)assert.ok(manifest.resources[pack.textures[texture].url],texture);
});
test('Data Management list labels keep source text and styles; SD-error labels stay unpublished',()=>{
 const bank=JSON.parse(read(P+'message_EU.json')).messages.mset;
 for(const [label,text] of Object.entries(labels)){
  const message=bank.messages[bank.labels[label]];
  assert.equal(message.text,text,label);assert.equal(typeof message.styleIndex,'number',label);
 }
 for(const label of ['dat_no_sd','dat_no_sd_u','dat_ng_sd','dat_ng_sd_u','dat_writeprotect','dat_protect_u'])assert.equal(label in bank.labels,false,label);
});
