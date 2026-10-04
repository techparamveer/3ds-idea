import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,reduceSystem,launchHomeShortcut,touchSystem,dispatchSystemEvent,setSystemSleeping,sampleSystemHomeApplicationTransition} from '../src/os/system.ts';
import {selectHomeSlot,settleHomeNavigation} from '../src/os/home-navigation.ts';
const home=()=>tickSystem(createPortfolioState(),3001);
const suspended=(title='health-safety')=>reduceSystem(tickSystem(launchHomeShortcut(home(),title,4000),6500),'home',6600);
const closeActions={command:s=>reduceSystem(s,'back',6700),touch:s=>touchSystem(s,50,225,6700),physical:s=>dispatchSystemEvent(s,{type:'button',source:'physical:X',phase:'down',command:'x'},6700),keyboard:s=>dispatchSystemEvent(s,{type:'button',source:'keyboard:KeyX',phase:'down',command:'x'},6700)};
const finish=(state,now=6700)=>{for(let i=0;i<8;i++)state=tickSystem(state,now+i*1000);return tickSystem(state,state.system.homeClock.lastNow+1000/60);};

for(const [name,close] of Object.entries(closeActions))test(`Health HOME ${name} close retains its owner through terminal then removes it without confirmation`,()=>{
 const before=suspended(),owner=before.system.runtime.application,closing=close(before);
 assert.equal(sampleSystemHomeApplicationTransition(closing).identity.owner,owner);
 assert.equal(closing.system.runtime.application,owner);
 const closed=finish(closing);
 assert.equal(closed.system.phase,'home');assert.equal(closed.system.dialog,null);assert.equal(closed.system.app,null);
 assert.equal(closed.system.runtime.application,null);assert.equal(closed.system.runtime.homeReturn,null);
 assert.equal(closed.system.runtime.instances[owner],undefined);assert.equal(closed.system.input.touch,null);
 const releases=s=>s.system.runtime.effects.filter(e=>e.owner===owner&&e.effect.type==='release-capabilities');
 const count=releases(before).length+1;
 assert.equal(releases(closed).length,count);assert.equal(releases(reduceSystem(closed,'back',6800)).length,count);
 assert.equal(before.system.runtime.instances[owner].appId,'health-safety');
 const reopened=tickSystem(launchHomeShortcut(closed,'health-safety',6900),9100);
 assert.notEqual(reopened.system.runtime.application,owner);assert.equal(reopened.system.phase,'app');
});

test('an unselected Health owner does not inherit the selected-title direct-close policy',()=>{
 const state=suspended(),other=settleHomeNavigation(selectHomeSlot(state,0));
 assert.equal(other.system.layout[other.selected],'work');
 const next=reduceSystem(other,'back',6700);
 assert.equal(next.system.dialog,'close');assert.equal(next.system.runtime.application,state.system.runtime.application);
 const opened=touchSystem(other,50,225,6700);
 assert.equal(opened.system.dialog,'switch');assert.equal(opened.system.pending,'work');
});

test('other applications and Health switching retain their existing confirmation policy',()=>{
 for(const title of ['work','system-settings','camera','sound','eshop','nintendo-zone']){
  const state=suspended(title),closed=reduceSystem(state,'back',6700);
  assert.equal(closed.system.dialog,'close',title);assert.equal(closed.system.runtime.application,state.system.runtime.application);
  assert.equal(reduceSystem(state,'x',6700).system.dialog,'close',title);
 }
 const state=suspended(),next=launchHomeShortcut(state,'camera',6700);
 assert.equal(next.system.dialog,'switch');assert.equal(next.system.pending,'camera');
 assert.equal(next.system.runtime.application,state.system.runtime.application);
});

test('sleeping or mismatched/closing retained owners cannot take the direct Health path',()=>{
 const state=suspended();assert.equal(reduceSystem(setSystemSleeping(state,true,6650),'back',6700).system.app,'health-safety');
 for(const mutate of [s=>s.system.runtime.homeReturn=null,s=>s.system.runtime.instances[s.system.runtime.application].closing=true,s=>s.system.runtime.instances[s.system.runtime.application].appId='work']){
  const copy=structuredClone(state);mutate(copy);const next=reduceSystem(copy,'back',6700);
  assert.equal(next.system.dialog,'close');assert.equal(next.system.runtime.application,copy.system.runtime.application);
 }
});

test('HOME resumes Health without closing and in-app Back is not a HOME close command',()=>{
 const state=suspended(),owner=state.system.runtime.application,resumed=reduceSystem(state,'home',6700);
 assert.equal(resumed.system.phase,'app');assert.equal(resumed.system.runtime.active,owner);
 const returned=reduceSystem(resumed,'back',6800);
 assert.equal(returned.system.runtime.application,owner);assert.equal(returned.system.dialog,null);
});
