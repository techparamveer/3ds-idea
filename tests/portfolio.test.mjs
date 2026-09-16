import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,reduceSystem,touchSystem,moveApp,restoreSettings,saveSettings,currentEntry} from '../src/os/system.ts';
import {apps} from '../src/os/apps.ts';
const home=()=>tickSystem(createPortfolioState(),3001);
const send=(s,input)=>reduceSystem(s,input,4000);
test('hardware boot gates input, launches software, and never cold-boots into a logo app',()=>{
 const boot=createPortfolioState();assert.equal(boot.system.phase,'boot');assert.equal(send(boot,'open'),boot);
 let s=send(home(),'open');assert.equal(s.system.phase,'launch');assert.equal(s.system.app,'work');
 s=tickSystem(s,5101);assert.equal(s.system.phase,'app');assert.equal(s.system.detail,false);
});
test('every installed app is reachable by touch and physical A, with real entries',()=>{
 for(let i=0;i<apps.length;i++){
  let s=send({...home(),selected:i},'open');s=tickSystem(s,6000);
  assert.equal(s.system.app,apps[i].id);assert.ok(currentEntry(s).pages[0]);
  s=touchSystem(s,100,50,6000);assert.equal(s.system.detail,true);
  s=send(s,'back');assert.equal(s.system.detail,false);
 }
});
test('HOME suspends and resumes exact position; switching requires confirmation',()=>{
 let s=tickSystem(send(home(),'open'),6000);s=send(s,'down');s=send(s,'open');s=send(s,'home');
 assert.equal(s.system.phase,'home');assert.equal(s.system.item,1);assert.equal(s.system.detail,true);
 const resumed=send(s,'home');assert.equal(resumed.system.phase,'app');assert.equal(resumed.system.item,1);
 s=send({...s,selected:5},'open');assert.equal(s.system.dialog,'switch');assert.equal(s.system.app,'work');
 assert.equal(send(s,'back').system.app,'work');s=send(s,'open');assert.equal(s.system.app,'nvidia');assert.equal(s.system.phase,'launch');
});
test('power requires confirmation, off is inert, sleep preserves application',()=>{
 let s=send(home(),'power');assert.equal(s.system.phase,'power');assert.equal(s.powered,true);
 assert.equal(send(s,'back').system.phase,'home');s=send(s,'open');assert.equal(s.powered,false);assert.equal(send(s,'open'),s);
 s=send(s,'power');assert.equal(s.system.phase,'boot');assert.equal(s.powered,true);
 s={...home(),system:{...home().system,sleeping:true}};assert.equal(send(s,'open'),s);assert.equal(touchSystem(s,200,225,6000),s);
});
test('external links are explicit effects, and details/page/image navigation stays bounded',()=>{
 let s=tickSystem(send({...home(),selected:2},'open'),6000);s=send(s,'open');
 for(let i=0;i<20;i++){s=send(s,'down');s=send(s,'right');}assert.equal(s.system.page,1);assert.equal(s.system.photo,2);
 s=send(s,'open');assert.equal(s.system.link,'https://pmvrsi.gumroad.com/');
});
test('reordering persists all apps; corrupt storage cannot hide portfolio content',()=>{
 let s=moveApp(home(),0,5);assert.equal(s.system.layout[5],'work');assert.equal(s.system.layout[0],'nvidia');
 s=moveApp(s,5,20);assert.equal(s.system.layout[20],'work');assert.equal(s.system.layout[5],undefined);
 const restored=restoreSettings(createPortfolioState(),saveSettings(s));assert.deepEqual(restored.system.layout,s.system.layout);assert.equal(restored.system.phase,'boot');
 assert.deepEqual(restoreSettings(home(),'{bad'),home());
 assert.deepEqual(restoreSettings(home(),JSON.stringify({layout:{0:'work'}})),home());
});
test('sound preferences support physical navigation and preserve power-saving settings',()=>{
 let s=send(home(),'preferences');s=send(s,'down');s=send(s,'right');assert.ok(s.system.volume>.35);
 s=send(s,'down');s=moveApp(s,0,8);s=send(s,'open');assert.equal(s.system.layout[0],'work');
 s=send(s,'mute');assert.equal(s.system.muted,true);s={...s,powerSaving:true};
 const restored=restoreSettings(createPortfolioState(),saveSettings(s));assert.equal(restored.powerSaving,true);assert.equal(restored.system.muted,true);
});
test('a detail without a link has a working Done action',()=>{
 let s=tickSystem(send({...home(),selected:3},'open'),6000);s=send(s,'open');assert.equal(s.system.detail,true);s=send(s,'open');assert.equal(s.system.detail,false);
});
