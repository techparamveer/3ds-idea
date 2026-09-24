import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createStockModule,initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';

test('amiibo opening exposes Close and keeps every device action inert',()=>{
 const shared=initialSharedData(),before=structuredClone(shared),context={now:0,shared};
 const module=createStockModule(getTitle('amiibo-settings')),state=module.create({},null,context),view=module.view(state,context);
 assert.deepEqual(view.rows,[]);assert.equal(view.footer.right,undefined);assert.equal(view.data.readOnly,true);
 assert.deepEqual(view.footer.left,{label:'Close',action:'back'});
 for(const id of ['register','delete-data','reset','update','scan','connect','confirm'])assert.deepEqual(module.reduce(state,{type:'action',id},context),{state});
 for(const command of ['open','up','down','left','right'])assert.deepEqual(module.reduce(state,{type:'command',command},context),{state});
 for(const y of [33,85,137,185])assert.deepEqual(module.reduce(state,{type:'touch',phase:'up',x:160,y},context),{state});
 for(const event of [{type:'command',command:'back'},{type:'touch',phase:'up',x:160,y:226}])assert.deepEqual(module.reduce(state,event,context).effects,[{type:'close'}]);
 assert.deepEqual(shared,before);
});

test('published opening retains source parts, material capabilities and the original English header message',()=>{
 const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url),read=file=>JSON.parse(readFileSync(new URL(file,root))),prefix='packs/amiibo-settings/';
 const manifest=read('manifest.json'),title=manifest.titles['000400300000b902'];
 const portal=read(prefix+'layout-Body-Portal-PortalSceneCTR-arc-cmp.json'),header=read(prefix+'layout-Body-Common-Header-Header-arc-cmp.json'),sub=read(prefix+'layout-Parts-Portal-PortalBtnSub-arc-cmp.json');
 for(const file of ['layout-Body-Portal-PortalSceneCTR-arc-cmp','layout-Body-Common-Header-Header-arc-cmp','layout-Parts-Portal-PortalBtnSub-arc-cmp'])assert.ok(title.packs.includes(prefix+file+'.json'));
 const walk=panes=>panes.flatMap(p=>[p,...walk(p.children)]);
 assert.deepEqual(walk(portal.layouts.PortalSceneCTR.roots).filter(p=>p.part).map(p=>p.part.layout),['PortalBtn','PortalBtn','PortalBtn','PortalBtnSub','BtnBtm_03']);
 for(const layout of [header.layouts.Header,sub.layouts.PortalBtnSub]){
  const mats=layout.materials.filter(m=>m.textureMaps.length===2);assert.equal(mats.length,2);
  for(const material of mats){assert.equal(material.capability,'amiibo-two-texture-v1');assert.deepEqual(material.unsupported,[]);}
 }
 const bank=read(prefix+'messages-and-loose.json').messages.cabinet;
 assert.equal(bank.messages[bank.labels.amiiboSettings].text,'amiibo Settings');
 assert.equal(header.resourceSources.layouts.Header.sha256,'680775e63bcdd86fe3e9c1c5687744e1904984215ca1fdc8a1c0f8e75043fd59');
});
