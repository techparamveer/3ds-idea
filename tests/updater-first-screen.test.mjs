import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createStockModule,initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';

test('updater source prompt exposes Cancel while OK and operation events remain inert',()=>{
 const shared=initialSharedData(),before=structuredClone(shared),context={now:0,shared};
 const module=createStockModule(getTitle('system-updater')),state=module.create({},null,context),view=module.view(state,context);
 assert.deepEqual(view.text,['Connect to the internet\nand update the system?']);
 assert.deepEqual(view.footer.left,{label:'Cancel',action:'back'});
 assert.equal(view.footer.right,undefined);assert.deepEqual(view.rows,[]);assert.equal(view.data.readOnly,true);
 for(const id of ['ok','confirm','update','connect','submit'])assert.deepEqual(module.reduce(state,{type:'action',id},context),{state});
 assert.deepEqual(shared,before);
});

test('updater publishes the native two-button footer and original question labels',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/packs/system-updater/',import.meta.url);
 const base=JSON.parse(readFileSync(new URL('base.json',root))),bank=JSON.parse(readFileSync(new URL('message_EU.json',root))).messages.mset;
 assert.ok(base.layouts.Base_D_01);assert.equal(base.resourceSources.layouts.Base_D_01.path,'base_LZ.bin/blyt/Base_D_01.bclyt');
 for(const [label,text]of [['base_2b_cancel','Cancel'],['base_2b_ok','OK'],['update_comm','Connect to the internet\nand update the system?']])assert.equal(bank.messages[bank.labels[label]].text,text);
});
