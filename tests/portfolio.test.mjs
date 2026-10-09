import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,reduceSystem,touchSystem,moveApp,restoreSettings,saveSettings,currentEntry,launchHomeShortcut,selectedTitle} from '../src/os/system.ts';
import {apps} from '../src/os/apps.ts';
const home=()=>tickSystem(createPortfolioState(),3001);
const send=(s,input)=>reduceSystem(s,input,4000);
const finishClose=s=>{s=tickSystem(s,4000);s=tickSystem(s,5000);return tickSystem(s,s.system.homeClock.lastNow+1000/60);};
test('accessibility title shortcut focuses its HOME tile before software opens',()=>{
 let s=home(),slot=Number(Object.entries(s.system.layout).find(([,id])=>id==='sound')[0]);
 s=launchHomeShortcut(s,'sound',3300);
 assert.equal(s.selected,slot);
 assert.equal(s.system.phase,'launch');
 s=tickSystem(s,6500);s=reduceSystem(s,'home',6600);
 assert.equal(s.system.phase,'home');
 assert.equal(selectedTitle(s)?.id,'sound');
});
test('hardware boot gates input, launches software, and never cold-boots into a logo app',()=>{
 const boot=createPortfolioState();assert.equal(boot.system.phase,'boot');assert.equal(send(boot,'open'),boot);
 let s=send(home(),'open');assert.equal(s.system.phase,'launch');assert.equal(s.system.app,'work');
 s=tickSystem(s,7201);assert.equal(s.system.phase,'app');assert.equal(s.system.detail,false);
});
test('every installed app is reachable by touch and physical A, with real entries',()=>{
 for(let i=0;i<apps.length;i++){
  const base=home(),slot=Number(Object.entries(base.system.layout).find(([,id])=>id===apps[i].id)[0]);
  let s=send({...base,selected:slot},'open');s=tickSystem(s,7200);
  assert.equal(s.system.app,apps[i].id);assert.ok(currentEntry(s).pages[0]);
  s=touchSystem(s,100,50,6200);assert.equal(s.system.detail,true);
  s=send(s,'back');assert.equal(s.system.detail,false);
 }
});
test('HOME suspends and resumes exact position; switching requires confirmation',()=>{
 let s=tickSystem(send(home(),'open'),7200);s=send(s,'down');s=send(s,'open');s=send(s,'home');
 assert.equal(s.system.phase,'home');assert.equal(s.system.item,1);assert.equal(s.system.detail,true);
 const resumed=send(s,'home');assert.equal(resumed.system.phase,'app');assert.equal(resumed.system.item,1);
 s=send({...s,selected:5},'open');assert.equal(s.system.dialog,'switch');assert.equal(s.system.app,'work');
 assert.equal(send(s,'back').system.app,'work');s=send(s,'open');assert.equal(s.system.app,'work');s=finishClose(s);assert.equal(s.system.app,'nvidia');assert.equal(s.system.phase,'launch');
});
test('power requires confirmation, off is inert, sleep preserves application',()=>{
 let s=send(home(),'power');assert.equal(s.system.phase,'power');assert.equal(s.powered,true);
 assert.equal(send(s,'back').system.phase,'home');s=send(s,'open');assert.equal(s.system.phase,'shutdown');assert.equal(s.powered,true);assert.equal(send(s,'open'),s);
 s=tickSystem(s,5199);assert.equal(s.system.phase,'shutdown');s=tickSystem(s,5200);assert.equal(s.powered,false);assert.equal(s.system.phase,'off');
 s=send(s,'power');assert.equal(s.system.phase,'boot');assert.equal(s.powered,true);
 s={...home(),system:{...home().system,sleeping:true}};assert.equal(send(s,'open'),s);assert.equal(touchSystem(s,200,225,6200),s);
});
test('power menu uses the native central power-off button and leaves HOME return available',()=>{
 const s=reduceSystem(home(),'power',5000);assert.equal(s.system.since,5000);
 assert.equal(touchSystem(s,20,180,5001),s);
 assert.equal(touchSystem(s,160,185,5001).system.phase,'shutdown');
 assert.equal(touchSystem(s,160,228,5001),s);
 assert.equal(reduceSystem(s,'home',5001).system.phase,'home');
 const shutdown=touchSystem(s,160,185,5001);
 assert.equal(tickSystem(shutdown,5120,true).system.phase,'shutdown');
 assert.equal(tickSystem(shutdown,5121,true).system.phase,'off');
});
test('external links are explicit effects, and details/page/image navigation stays bounded',()=>{
 let s=tickSystem(send({...home(),selected:2},'open'),7200);s=send(s,'open');
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
test('installing Hack LDN preserves the existing layout, folders and preferences',()=>{
 let before=moveApp(home(),0,20);before.theme='blue';before.system.muted=true;
 before.folders[30]='My folder';
 const saved=JSON.parse(saveSettings(before));
 const hackSlot=Object.keys(saved.layout).find(slot=>saved.layout[slot]==='hack-ldn-2025');
 delete saved.layout[hackSlot];
 const restored=restoreSettings(createPortfolioState(),JSON.stringify(saved));
 assert.equal(restored.theme,'blue');assert.equal(restored.system.muted,true);
 assert.equal(restored.folders[30],'My folder');
 for(const [slot,id]of Object.entries(saved.layout))assert.equal(restored.system.layout[slot],id);
 assert.equal(Object.values(restored.system.layout).filter(id=>id==='hack-ldn-2025').length,1);
 assert.equal(restored.system.layout[5],'nvidia');assert.equal(restored.system.layout[9],'system-settings');
});
test('sound preferences support physical navigation and preserve power-saving settings',()=>{
 let s=send(home(),'preferences');s=send(s,'down');s=send(s,'right');assert.ok(s.system.volume>.35);
 s=send(s,'down');s=moveApp(s,0,8);s=send(s,'open');assert.equal(s.system.layout[0],'work');
 s=send(s,'mute');assert.equal(s.system.muted,true);s={...s,powerSaving:true};
 const restored=restoreSettings(createPortfolioState(),saveSettings(s));assert.equal(restored.powerSaving,true);assert.equal(restored.system.muted,true);
});
test('a detail without a link has a working Done action',()=>{
 let s=tickSystem(send({...home(),selected:3},'open'),7200);s=send(s,'open');assert.equal(s.system.detail,true);s=send(s,'open');assert.equal(s.system.detail,false);
});
