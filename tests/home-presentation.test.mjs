import {settleHomeNavigation} from '../src/os/home-navigation.ts';
import {setHomeDensity as setHomeDensityMotion,selectHomeSlot,enterHomeFolder,homeDensityIndex,writeHomeNavigation} from '../src/os/home-navigation.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {getHomeFooter,getHomePresentation,getNativeFolderBalloon,nativeHomeDensityFrame,nativeHomeDensityMetric,nativeFolderPanelGeometry,getNativeFolderPanel,getNativeHomePanel,nativeFolderBalloonPosition} from '../src/os/home-presentation.ts';
import {createPortfolioState,dispatchSystemEvent,tickSystem,releaseSystemInputs,touchSystem,sampleSystemHomeFolderClose,launchHomeShortcut,reduceSystem} from '../src/os/system.ts';
import {menuTiles} from '../src/os/state.ts';
import {homeTouchLocation} from '../src/os/home-gestures.ts';
import {createHomeTilePickup} from '../src/os/home-tile-pickup.ts';
import {enableHomeControls} from '../src/os/home-controls.ts';
const setHomeDensity=(state,density)=>settleHomeNavigation(setHomeDensityMotion(state,density));
const home=()=>{const state=createPortfolioState();return {...state,system:{...state.system,phase:'home'}};};
const point=(state,index)=>{const tile=menuTiles(state).find(t=>t.index===index);return {x:tile.x+tile.size/2,y:tile.y+tile.size/2};};
const touch=(state,phase,position,time)=>dispatchSystemEvent(state,{type:'touch',phase,...position,pointerId:1},time);

test('pressed tile follows runtime pointer source without changing keyboard selection',()=>{
 const start=home(),pressed=touch(start,'down',point(start,2),100),view=getHomePresentation(pressed);
 assert.equal(pressed.selected,start.selected);assert.equal(view.tiles.find(t=>t.index===2).pressed,true);
 assert.deepEqual(view.tiles.filter(t=>t.cursor).map(t=>t.index),[2]);assert.equal(view.ghost,null);
 const released=releaseSystemInputs(pressed,101);assert.ok(getHomePresentation(released).tiles.every(t=>!t.pressed));
});
test('native Scale binding accepts the density independently from row count',()=>{
 assert.deepEqual([0,1,2,3,4,5,2.5].map(nativeHomeDensityFrame),[0,1,2,3,4,5,2.5]);
});
test('balloon position matches execution of native ARM including the interior branch and boundary discontinuities',()=>{
 // 0x1e6758..0x1e67c8 executed from the pinned HOME code.bin; see provenance doc.
 for(const [anchor,offset] of [[-244,236],[-160,152],[-84,76],[-8.000999450683594,.00099945068359375],[-8,-8],[-4,-4],[0,0],[4,4],[8,8],[8.000999450683594,-.00099945068359375],[84,-76],[160,-152],[244,-236]]){
  assert.deepEqual(nativeFolderBalloonPosition(anchor),{baseX:anchor,bodyOffsetX:offset});
 }
});
test('settled one-row folder balloon follows native placement with conservative gesture suppression',()=>{
 const initial=home(),state=selectHomeSlot(setHomeDensity({...initial,folders:{2:'１ (New Folder)'}},0),2);
 const view=getHomePresentation(state),tile=view.tiles.find(t=>t.index===2);
 assert.deepEqual([tile.x,tile.y,tile.size],[208,125,72]);
 assert.deepEqual(getNativeFolderBalloon(state,view),{label:state.folders[2],baseX:84,bodyOffsetX:-76});
 assert.deepEqual(getNativeFolderBalloon(state,{...view,tiles:[{...tile,x:124}]}),{label:state.folders[2],baseX:0,bodyOffsetX:0});
 assert.deepEqual(getNativeFolderBalloon(state,{...view,tiles:[{...tile,folderLabel:''}]}),{label:'',baseX:84,bodyOffsetX:-76});
 assert.deepEqual(getNativeFolderBalloon(state,{...view,tiles:[{...tile,x:128,y:80}]}),{label:state.folders[2],baseX:4,bodyOffsetX:4},'native updater has no invented tile-Y gate');
 for(const columns of [4,6,8,10,12]){const dense=setHomeDensity(state,homeDensityIndex(columns));assert.equal(getNativeFolderBalloon(dense,getHomePresentation(dense)),null);}
 const pressed=touch(state,'down',point(state,2),100);assert.equal(getNativeFolderBalloon(pressed,getHomePresentation(pressed)),null);
 const vacant=selectHomeSlot(state,1);assert.equal(getNativeFolderBalloon(vacant,getHomePresentation(vacant)),null);
 assert.equal(getNativeFolderBalloon(enterHomeFolder(state,2),view),null);assert.equal(getNativeFolderBalloon({...state,panel:'settings'},view),null);
});
test('one-row lift and drop uses the lower drawn tiles while label space stays untargetable',()=>{
 const start=setHomeDensity(home(),0),a=point(start,0),b=point(start,1);
 assert.equal(homeTouchLocation(start,a.x,118),null);assert.deepEqual(homeTouchLocation(start,a.x,a.y),{folder:null,slot:0});
 let state=touch(start,'down',a,100);state=tickSystem(state,550);assert.equal(getHomePresentation(state).ghost.item.id,start.system.layout[0]);
 state=touch(state,'move',b,560);assert.equal(getHomePresentation(state).tiles.find(t=>t.index===1).drop,true);
 state=touch(state,'up',b,570);assert.equal(state.system.layout[1],start.system.layout[0]);assert.equal(state.system.layout[0],start.system.layout[1]);assert.equal(state.system.phase,'home');
});
test('lifted source stays in the reducer map but paints as vacant until placement',()=>{
 const start=home(),original=start.system.layout[0];let state=touch(start,'down',point(start,0),100);state=tickSystem(state,550);
 const destination=point(state,4);state=touch(state,'move',destination,560);const view=getHomePresentation(state);
 assert.equal(state.system.layout[0],original);assert.equal(view.tiles.find(t=>t.index===0).source,true);
 assert.equal(view.ghost.item.id,original);assert.deepEqual([view.ghost.x,view.ghost.y],[destination.x,destination.y]);
 assert.deepEqual(view.tiles.filter(t=>t.drop).map(t=>t.index),[4]);
 state=touch(state,'up',destination,570);const released=getHomePresentation(state);
 assert.equal(released.ghost,null);assert.equal(state.system.layout[4],original);assert.ok(released.tiles.every(t=>!t.source&&!t.drop));
});
test('folder hover paints receiving folder, then child icons using the same location model',()=>{
 let state=home();const layout={...state.system.layout},child=layout[2];delete layout[2];delete layout[4];
 state={...state,folders:{4:'Projects'},system:{...state.system,layout,folderLayouts:{4:{1:child}}}};
 const before=JSON.stringify(state.system.folderLayouts);
 state=touch(state,'down',point(state,0),100);state=tickSystem(state,550);state=touch(state,'move',point(state,4),560);
 const target=getHomePresentation(state).tiles.find(t=>t.index===4);assert.equal(target.drop,true);assert.equal(target.folderLabel,'Projects');
 state=tickSystem(state,1060);assert.equal(state.opened,true);const children=getHomePresentation(state);
 assert.equal(children.folder,4);assert.equal(children.tiles.find(t=>t.index===1).appId,child);
 assert.ok(children.tiles.every(t=>t.folderLabel===null&&!t.source));assert.equal(children.ghost.item.kind,'app');
 assert.equal(JSON.stringify(state.system.folderLayouts),before,'hover preview does not move items');
 state=releaseSystemInputs(state,1070);assert.equal(state.opened,false);assert.equal(getHomePresentation(state).ghost,null);
});
test('fractional scrolling keeps runtime tile coordinates and hides press/drop state',()=>{
 let state=home();const start=point(state,0);state=touch(state,'down',start,100);state=touch(state,'move',{x:start.x-42,y:start.y},110);
 const view=getHomePresentation(state);assert.equal(view.gesture.mode,'scroll');assert.equal(view.ghost,null);
 assert.equal(view.tiles[0].x,menuTiles(state)[0].x);assert.equal(view.tiles[0].x,-2);
 assert.ok(view.tiles.every(t=>!t.pressed&&!t.drop&&!t.cursor));
});
test('folder child selection is distinct from its parent HOME slot',()=>{
 const initial=home(),childId=initial.system.layout[1],state=selectHomeSlot(enterHomeFolder({...initial,folders:{4:'A'},system:{...initial.system,folderLayouts:{4:{1:childId}}}},4),1);
 const view=getHomePresentation(state);assert.equal(view.tiles.find(t=>t.index===1).appId,childId);assert.deepEqual(view.tiles.filter(t=>t.cursor).map(t=>t.index),[1]);
});
test('captured occupied folder without suspended software exposes one full-width Open action',()=>{
 const initial=home(),childId=initial.system.layout[1];
 const state=selectHomeSlot(enterHomeFolder({...initial,folders:{4:'A'},system:{...initial.system,app:null,folderLayouts:{4:{1:childId}}}},4),1);
 assert.deepEqual(getHomeFooter(state),{two:false,left:null,right:'open'});
 for(const x of [0,50,99,100,160,319]){
  const launched=touchSystem(state,x,226,100);
  assert.equal(launched.system.phase,'launch');assert.equal(launched.system.app,childId);assert.equal(launched.opened,true);
 }
});

test('selected suspended folder child exposes software Close instead of folder Back',()=>{
 const initial=home(),childId=initial.system.layout[1];
 const state=selectHomeSlot(enterHomeFolder({...initial,folders:{4:'A'},system:{...initial.system,app:childId,folderLayouts:{4:{1:childId}}}},4),1);
 assert.deepEqual(getHomeFooter(state),{two:true,left:'close-software',right:'resume'});
 const closing=touchSystem(state,50,226,100);
 assert.equal(closing.opened,true);assert.equal(closing.system.dialog,'close');
 assert.equal(closing.system.app,childId);
});

test('uncaptured other suspended-software folder selection retains its existing Close-folder split',()=>{
 const initial=home(),childId=initial.system.layout[1];
 for(const active of [initial.system.layout[2]]){
  const state=selectHomeSlot(enterHomeFolder({...initial,folders:{4:'A'},system:{...initial.system,app:active,folderLayouts:{4:{1:childId}}}},4),1);
  assert.deepEqual(getHomeFooter(state),{two:true,left:'close-folder',right:active===childId?'resume':'open'});
  const closing=touchSystem(state,50,226,100);
  assert.equal(closing.opened,true);assert.equal(sampleSystemHomeFolderClose(closing).controller.phase,'closing');
  assert.equal(closing.system.app,active);assert.equal(closing.system.dialog,null);
 }
});

test('empty folder selection hides the footer even when another child is occupied',()=>{
 const initial=home(),childId=initial.system.layout[1];
 const opened=enterHomeFolder({...initial,folders:{20:'A'},system:{...initial.system,folderLayouts:{20:{1:childId}}}},20);
 for(const index of [0,2])assert.equal(getHomeFooter(selectHomeSlot(opened,index)),null);
 assert.equal(getHomeFooter(selectHomeSlot(opened,1)).right,'open');
 assert.deepEqual(getHomeFooter(selectHomeSlot(initial,20)),{two:false,left:null,right:'create-folder'});
});

test('held pickup owns no footer action in either container and clearing it restores the prior action',()=>{
 const initial=enableHomeControls(home()),pickup=(source,density)=>createHomeTilePickup(source,density,{x:59,y:54},{x:244,y:137},{x:0,y:0});
 const rootHeld={...initial,system:{...initial.system,homeControls:{...initial.system.homeControls,tilePickup:pickup({folder:null,slot:0},0)}}};
 assert.equal(getHomeFooter(rootHeld),null);
 const rootRestored={...rootHeld,system:{...rootHeld.system,homeControls:{...rootHeld.system.homeControls,tilePickup:null}}};
 assert.equal(getHomeFooter(rootRestored).right,'open');
 const childId=initial.system.layout[1];
 let folder=selectHomeSlot(enterHomeFolder({...initial,folders:{20:'A'},system:{...initial.system,folderLayouts:{20:{1:childId}}}},20),1);
 folder={...folder,system:{...folder.system,homeControls:{...folder.system.homeControls,tilePickup:pickup({folder:20,slot:1},1)}}};
 assert.equal(getHomeFooter(folder),null);
 const folderRestored={...folder,system:{...folder.system,homeControls:{...folder.system.homeControls,tilePickup:null}}};
 assert.equal(getHomeFooter(folderRestored).right,'open');
});

test('Settings HOME shows native Manual and opens the Settings-owned applet from its left footer',()=>{
 const initial=home(),slot=Number(Object.entries(initial.system.layout).find(([,id])=>id==='system-settings')[0]);
 const selected=selectHomeSlot(initial,slot);
 assert.deepEqual(getHomeFooter(selected),{two:true,left:'manual',right:'open'});
 const opened=touchSystem(selected,50,226,100),active=opened.system.runtime.instances[opened.system.runtime.active];
 assert.equal(opened.system.phase,'app');
 assert.equal(active.appId,'manual');
 assert.equal(active.state.manualTitleId,'0004001000022000');
 const down=touch(selected,'down',{x:50,y:226},100),up=touch(down,'up',{x:50,y:226},150);
 assert.equal(up.system.runtime.instances[up.system.runtime.active].state.manualTitleId,'0004001000022000','live touch phases use the same route');
 assert.equal(getHomeFooter(selectHomeSlot(initial,0)).left,null,'portfolio slot does not inherit Manual');
});

test('Browser toolbar HOME routes Manual to Browser content and Open to Browser',()=>{
 const initial=enableHomeControls(home()),nav=initial.system.homeNavigation;
 const browser=writeHomeNavigation(initial,{...nav,focus:{...nav.focus,toolbarActive:true,currentFocus:4}});
 assert.deepEqual(getHomeFooter(browser),{two:true,left:'manual',right:'open'});
 const manual=touchSystem(browser,50,226,100),manualInstance=manual.system.runtime.instances[manual.system.runtime.active];
 assert.equal(manualInstance.appId,'manual');assert.equal(manualInstance.state.manualTitleId,'0004003000009d02');
 const opened=touchSystem(browser,160,226,100);
 assert.equal(opened.system.runtime.instances[opened.system.runtime.active].appId,'browser');
});

test('Health and Camera HOME footers follow the selected title, not an unrelated retained owner',()=>{
 const initial=tickSystem(createPortfolioState(),3001);
 const selected=(state,id)=>settleHomeNavigation(selectHomeSlot(state,Number(Object.entries(state.system.layout).find(([,value])=>value===id)[0])));
 const idle=selected(initial,'health-safety');
 assert.deepEqual(getHomeFooter(idle),{two:false,left:null,right:'open'});
 assert.equal(touchSystem(idle,50,226,4000).system.app,'health-safety','left of centered Open launches');
 const health=reduceSystem(tickSystem(launchHomeShortcut(initial,'health-safety',4000),6500),'home',6600);
 assert.deepEqual(getHomeFooter(health),{two:true,left:'close-software',right:'resume'});
 const camera=selected(health,'camera');
 assert.deepEqual(getHomeFooter(camera),{two:true,left:'manual',right:'open'});
 for(const input of [s=>touchSystem(s,50,226,6700),s=>touch(touch(s,'down',{x:50,y:226},6700),'up',{x:50,y:226},6900)]){
  const opened=input(camera),runtime=opened.system.runtime;
  assert.equal(opened.system.dialog,null);
  assert.equal(runtime.application,health.system.runtime.application);
  assert.equal(runtime.instances[runtime.active].appId,'manual');
  assert.equal(runtime.instances[runtime.active].state.manualTitleId,'0004001000022400');
  assert.ok(!runtime.instances[runtime.application].closing);
 }
 const switched=touchSystem(camera,210,226,6700);
 assert.equal(switched.system.dialog,'switch');assert.equal(switched.system.pending,'camera');
});

test('folder plate and shadow geometry match original ARM fixtures at every density and transition anchor',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/native-folder-panel.json',import.meta.url)));
 for(const v of fixture.fixtures){
  const input={...v,currentLeftSlot:v.currentLeft,targetLeftSlot:v.targetLeft};
  assert.deepEqual(nativeFolderPanelGeometry(input),{x:v.plate.x,width:v.plate.width,shadowWidth:v.shadow.width},v.label);
 }
 for(const v of fixture.glyphInterpolation){
  assert.equal(nativeHomeDensityMetric([32,32,24,20,18,16],v.density),v.width);
  assert.equal(nativeHomeDensityMetric([-6,-6,-3,-3,-2,-1],v.density),v.yOffset);
 }
 const opened=enterHomeFolder({...home(),folders:{20:'A'}},20);
 for(const v of fixture.fixtures.filter(v=>v.label.startsWith('settled-'))){
  const state=setHomeDensity(opened,v.currentDensity),before=JSON.stringify(state);
  assert.deepEqual(getNativeFolderPanel(state),{x:v.plate.x,width:v.plate.width,shadowWidth:v.shadow.width});
  assert.equal(JSON.stringify(state),before);
 }
 assert.equal(getNativeFolderPanel(home()),null);
});
test('captured root extent drives source plate geometry without shrinking 300-slot storage',()=>{
 let state=selectHomeSlot(setHomeDensity(home(),5),33),nav=state.system.homeNavigation;
 nav={...nav,rootView:{...nav.rootView,currentLeftSlot:0,targetLeftSlot:0}};state={...state,system:{...state.system,homeNavigation:nav}};
 assert.deepEqual(getNativeHomePanel(state),{x:0,width:300,shadowWidth:320},'six rows fit the captured60 extent');
 state=setHomeDensity(state,4);nav=state.system.homeNavigation;
 nav={...nav,motion:null,rootView:{...nav.rootView,density:4,currentLeftSlot:0,targetLeftSlot:0}};state={...state,columns:10,system:{...state.system,homeNavigation:nav}};
 assert.deepEqual(getNativeHomePanel(state),{x:48,width:396,shadowWidth:416},'five-row origin extends beyond the right LCD');
 nav={...nav,rootView:{...nav.rootView,currentLeftSlot:15,targetLeftSlot:15}};state={...state,system:{...state.system,homeNavigation:nav}};
 assert.deepEqual(getNativeHomePanel(state),{x:-48,width:396,shadowWidth:416},'five-row endpoint closes at the right edge');
 const layout={...state.system.layout,299:'compatibility-record'};
 state={...state,system:{...state.system,layout}};
 assert.ok(getNativeHomePanel(state).width>396,'an existing high slot remains exposed by the labelled browser adaptation');
 assert.equal(Object.hasOwn(state.system.layout,299),true);
});
