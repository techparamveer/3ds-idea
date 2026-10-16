import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem} from '../src/os/system.ts';
import {selectHomeSlot,settleHomeNavigation} from '../src/os/home-navigation.ts';
import {HEALTH_VBLANK_HZ} from '../src/os/stock-health-scroll.ts';
import {HOME_RETURN_REVEAL_LCD_HZ,HOME_TOOLBAR_RETURN_FIRST_GROUP_FRAME,HOME_TOOLBAR_RETURN_SECOND_GROUP_FRAME,createHomeToolbarReturnReveal,
 homeReturnFirstGroupIndex,homeReturnRevealKey,homeToolbarReturnRevealFrame,homeToolbarReturnRevealStage} from '../src/os/home-return-reveal.ts';

const frameMs=1000/HOME_RETURN_REVEAL_LCD_HZ;
const home=()=>tickSystem(createPortfolioState(),3001);

test('measured schedule uses source LCD frames: group 1 at frame 6, group 2 and banner at frame 19',()=>{
 assert.equal(HOME_RETURN_REVEAL_LCD_HZ,268111856/4481136);assert.equal(HOME_RETURN_REVEAL_LCD_HZ,HEALTH_VBLANK_HZ);
 assert.equal(HOME_TOOLBAR_RETURN_FIRST_GROUP_FRAME,6);assert.equal(HOME_TOOLBAR_RETURN_SECOND_GROUP_FRAME,19);
 // Native runs: first group +0.094..0.124 s, second group/banner +0.309..0.375 s.
 assert.ok(Math.abs(6*frameMs-100)<1.5);assert.ok(Math.abs(19*frameMs-318)<1.5);
 assert.equal(homeToolbarReturnRevealFrame(0),0);
 assert.equal(homeToolbarReturnRevealStage(homeToolbarReturnRevealFrame(6*frameMs-.01)),0);
 assert.equal(homeToolbarReturnRevealStage(homeToolbarReturnRevealFrame(6*frameMs+.01)),1);
 assert.equal(homeToolbarReturnRevealStage(homeToolbarReturnRevealFrame(19*frameMs-.01)),1);
 assert.equal(homeToolbarReturnRevealStage(homeToolbarReturnRevealFrame(19*frameMs+.01)),2);
});

test('first group is the visible ordinary tile earliest in reading order, excluding retained selection',()=>{
 // Native Notifications fixture: row 1 Health, Camera, Mii Maker, partial column; row 2 empty, Sound, Plaza.
 const tile=(index,col,row,appId,extra={})=>({index,x:40+84*col,y:46+84*row,size:72,appId,folderLabel:null,source:false,...extra});
 const fixture=[tile(0,0,0,'health-safety'),tile(1,0,1,null),tile(2,1,0,'camera'),tile(3,1,1,'sound'),tile(4,2,0,'mii-maker'),tile(5,2,1,'mii-plaza'),tile(6,3,0,'eshop'),tile(7,3,1,'zone')];
 assert.equal(homeReturnFirstGroupIndex(fixture,-1),0,'no grid selection: Health');
 assert.equal(homeReturnFirstGroupIndex(fixture,0),2,'retained selection stays in its own group');
 assert.equal(homeReturnFirstGroupIndex(fixture.map(t=>t.index===0?{...t,folderLabel:'A'}:t),-1),2,'folders are not ordinary titles');
 assert.equal(homeReturnFirstGroupIndex(fixture.map(t=>({...t,x:t.x-124})),-1),2,'offscreen column is not visible');
 assert.equal(homeReturnFirstGroupIndex(fixture.map(t=>t.index===0?{...t,source:true}:t),-1),2,'lifted source is excluded');
 assert.equal(homeReturnFirstGroupIndex([tile(1,0,1,'sound'),tile(2,1,0,'camera')],-1),2,'row precedes column');
 assert.equal(homeReturnFirstGroupIndex([],-1),null);
});

test('controller advances by elapsed time from the base and requires an accepted stage-2 receipt',()=>{
 const state=home(),reveal=createHomeToolbarReturnReveal();
 assert.equal(reveal.active(state),false);
 assert.equal(reveal.begin(state,1000,false),true);assert.equal(reveal.active(state),true);
 const stages=[];
 for(let frame=0;frame<=20;frame++){
  const pose=reveal.sample(state,1000+frame*frameMs+.01,true,false);assert.equal(pose.frame,frame);stages.push(pose.stage);
  if(frame===19){assert.equal(reveal.active(state),true,'painted stage 2 is not acceptance');assert.equal(reveal.present(pose,state),true);break;}
  assert.equal(reveal.present(pose,state),true);
 }
 assert.deepEqual(stages,[0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,2]);
 assert.equal(reveal.active(state),false);assert.equal(reveal.sample(state,2000,true,false),undefined);
});

test('controller cancels on reduced motion, new input or transition and rejects stale receipts',()=>{
 const state=home(),reveal=createHomeToolbarReturnReveal();
 assert.equal(reveal.begin(state,0,true),false,'reduced motion keeps all-at-handoff');assert.equal(reveal.active(state),false);
 reveal.begin(state,0,false);assert.equal(reveal.sample(state,10,true,true),undefined);assert.equal(reveal.active(state),false);
 reveal.begin(state,0,false);const moved=settleHomeNavigation(selectHomeSlot(state,2));
 assert.notEqual(homeReturnRevealKey(moved),homeReturnRevealKey(state));
 assert.equal(reveal.sample(moved,10,true,false),undefined);assert.equal(reveal.active(state),false,'input cancels to the full grid');
 reveal.begin(state,0,false);assert.equal(reveal.active({...state,system:{...state.system,phase:'app'}}),false,'transition is inactive');
 const stale=reveal.sample(state,20*frameMs,true,false);reveal.revoke();assert.equal(reveal.present(stale,state),false);assert.equal(reveal.active(state),true);
 assert.equal(reveal.sample(state,20*frameMs,false,false),undefined,'ineligible paint revokes without completing');assert.equal(reveal.active(state),true);
 assert.equal(reveal.sample(state,-1,true,false),undefined,'clock regression cancels');assert.equal(reveal.active(state),false);
 reveal.begin(state,0,false);reveal.dispose();assert.equal(reveal.active(state),false);assert.equal(reveal.begin(state,0,false),false);
 assert.equal(homeReturnRevealKey({...state,powered:false}),null);
});
