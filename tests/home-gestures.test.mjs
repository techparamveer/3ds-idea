import {settleHomeNavigation} from '../src/os/home-navigation.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { apps } from '../src/os/apps.ts';
import { homeTitles } from '../src/os/app-registry.ts';
import { menuTiles, pageStart, rowCount, densities, reduceMenu } from '../src/os/state.ts';
import { createPortfolioState, dispatchSystemEvent, tickSystem, tickHomeNavigationClockObserved, reduceSystem, releaseSystemInputs, setSystemSleeping, launch, invokeSystemApplet, saveSettings, restoreSettings, selectedTitle, homeSlotAppId, moveHomeItem, getHomeGestureView } from '../src/os/system.ts';
import { HOME_GESTURE_TIMING as T, homeTouchLocation } from '../src/os/home-gestures.ts';
import { resolveHomeDrop, restoreHomeLayout } from '../src/os/home-layout.ts';
import { enableHomeControls, reconcileHomeControls } from '../src/os/home-controls.ts';
import { openFirmwareStorage } from '../src/os/app-persistence.ts';
import {setHomeDensity as setHomeDensityMotion,homeDensityIndex,commitHomeScroll,getHomeNavigationView,writeHomeNavigation} from '../src/os/home-navigation.ts';
const setHomeDensity=(state,density)=>settleHomeNavigation(setHomeDensityMotion(state,density));
const home=()=>tickSystem(createPortfolioState(),3001);
const root=slot=>({folder:null,slot});
const child=(folder,slot)=>({folder,slot});
const touch=(s,phase,x,y,now=4000,pointerId=1)=>dispatchSystemEvent(s,{type:'touch',phase,x,y,pointerId},now);
const center=(s,slot)=>{const t=menuTiles(s).find(t=>t.index===slot);assert.ok(t,`slot ${slot} visible`);return[t.x+Math.min(t.size,300-t.x)/2,Math.max(t.y,s.opened?49:34)+Math.min(t.size,204-t.y)/2];};
const withFolder=(s,slot=4,name='Folder')=>{
 const layout={...s.system.layout};if(layout[slot]){layout[40+slot]=layout[slot];delete layout[slot];}
 return {...s,folders:{...s.folders,[slot]:name},system:{...s.system,layout}};
};
const lift=(s,slot=0,now=4000)=>{s=touch(s,'down',...center(s,slot),now);return tickSystem(s,now+T.liftMs);};
const placeInFolder=(source=1,slot=2,now=4000)=>{let s=lift(withFolder(home()),source,now);s=touch(s,'move',...center(s,4),now+500);s=tickSystem(s,now+500+T.folderHoverMs);s=touch(s,'move',...center(s,slot),now+1010);return touch(s,'up',...center(s,slot),now+1020);};
const allIds=s=>[...Object.values(s.system.layout),...Object.values(s.system.folderLayouts).flatMap(Object.values)].sort();
const expected=homeTitles.map(t=>t.id).sort();
const noLoss=s=>{assert.deepEqual(allIds(s),expected);assert.equal(new Set(allIds(s)).size,expected.length);};
test('default layout retains eight portfolio titles and touch press/up shares normal launch path',()=>{
 let s=home();assert.deepEqual(new Set(Object.values(s.system.layout).filter(id=>apps.some(a=>a.id===id))),new Set(apps.map(a=>a.id)));
 const point=center(s,2);s=touch(s,'down',...point);assert.deepEqual(getHomeGestureView(s).pressed,root(2));assert.equal(s.selected,0);
 s=touch(s,'up',...point,4100);assert.equal(s.selected,2);assert.equal(s.system.phase,'home');assert.equal(getHomeGestureView(s),null);
 s=touch(s,'down',...center(s,2),4200);s=touch(s,'up',...center(s,2),4250);assert.equal(s.system.phase,'launch');assert.equal(s.system.app,'hobbies');
});
test('quick swipe scrolls continuously and never moves or launches the touched icon',()=>{
 let s=home(),before=saveSettings(s);const [x,y]=center(s,4);s=touch(s,'down',x,y,4000);s=touch(s,'move',x-100,y,4100);
 assert.equal(getHomeGestureView(s).mode,'scroll');assert.ok(pageStart(s)>1&&pageStart(s)<2);assert.equal(saveSettings(s),before);
 s=tickSystem(s,4800);assert.equal(getHomeGestureView(s).mode,'scroll');s=touch(s,'up',x-100,y,4900);assert.equal(s.system.phase,'home');assert.equal(pageStart(s),1);assert.equal(getHomeGestureView(s),null);assert.deepEqual(JSON.parse(saveSettings(s)).homeView.rootView,{selectedSlot:2,currentLeftSlot:2,targetLeftSlot:2,density:1});assert.deepEqual(s.system.layout,JSON.parse(before).layout);
});
test('holding lifts from the shared clock and commits a swap only at up',()=>{
 const initial=home(),before=saveSettings(initial);let s=touch(initial,'down',...center(initial,0),4000);
 s=tickSystem(s,4000+T.liftMs-1);assert.equal(getHomeGestureView(s).mode,'press');s=tickSystem(s,4000+T.liftMs);assert.equal(getHomeGestureView(s).mode,'drag');
 s=touch(s,'move',...center(s,2),4500);assert.equal(getHomeGestureView(s).canDrop,true);assert.equal(saveSettings(s),before);
 s=touch(s,'up',...center(s,2),4501);assert.equal(s.system.layout[2],'work');assert.equal(s.system.layout[0],'hobbies');assert.equal(s.system.phase,'home');noLoss(s);
});
test('second pointers, cancelled drags and stale pointer-up cannot commit or launch',()=>{
 let s=lift(home()),before=saveSettings(s);const other=touch(s,'cancel',0,0,4451,2);assert.equal(other,s);
 s=touch(s,'move',...center(s,2),4452,2);assert.equal(getHomeGestureView(s).target.slot,0);
 s=touch(s,'move',...center(s,2),4453);s=touch(s,'cancel',NaN,NaN,4454);assert.equal(getHomeGestureView(s),null);assert.equal(s.system.input.touch,null);assert.equal(saveSettings(s),before);
 const after=touch(s,'up',...center(s,0),4500);assert.equal(after,s);
});
test('release outside the display and stale source identity abort placement',()=>{
 let s=lift(home()),before=saveSettings(s);s=touch(s,'up',-3,80,4500);assert.equal(saveSettings(s),before);assert.equal(getHomeGestureView(s),null);
 s=lift(home());s={...s,system:{...s.system,layout:{...s.system.layout,0:'projects',1:'work'}}};const changed=saveSettings(s);s=touch(s,'up',...center(s,2),4500);assert.equal(saveSettings(s),changed);assert.equal(getHomeGestureView(s),null);noLoss(s);
});
test('clock reversal aborts contact and nonfinite move cannot mutate a preview',()=>{
 let s=lift(home()),before=saveSettings(s);assert.equal(touch(s,'move',NaN,80,4500),s);s=touch(s,'up',...center(s,2),4300);assert.equal(saveSettings(s),before);assert.equal(getHomeGestureView(s),null);
});
test('lifecycle, physical navigation and input loss cancel without a later ghost tap',()=>{
 for(const transition of [s=>releaseSystemInputs(s,4500),s=>setSystemSleeping(s,true,4500),s=>reduceSystem(s,'power',4500),s=>reduceSystem(s,'preferences',4500),s=>reduceSystem(s,'right',4500),s=>launch(s,'projects',4500),s=>invokeSystemApplet(s,'game-notes',4500)]){
  let s=lift(home()),layout=s.system.layout;s=transition(s);assert.equal(getHomeGestureView(s),null);assert.equal(s.system.input.touch,null);assert.deepEqual(s.system.layout,layout);const phase=s.system.phase;
  s=touch(s,'up',76,82,4700);assert.equal(s.system.phase,phase);assert.deepEqual(s.system.layout,layout);
 }
});
test('folder hover opens its view without committing, cancel restores the starting view',()=>{
 const initial=withFolder(home()),before=saveSettings(initial);let s=lift(initial);s=touch(s,'move',...center(s,4),4500);
 s=tickSystem(s,4500+T.folderHoverMs-1);assert.equal(s.opened,false);s=tickSystem(s,4500+T.folderHoverMs);assert.equal(s.opened,true);assert.equal(s.selected,4);assert.equal(saveSettings(s),before);
 s=touch(s,'cancel',0,0,5100);assert.equal(s.opened,false);assert.equal(s.selected,initial.selected);assert.equal(saveSettings(s),before);
});
test('folder placement, child launching, and drag back out share one touch stream',()=>{
 let s=lift(withFolder(home()));s=touch(s,'move',...center(s,4),4500);s=tickSystem(s,5000);s=touch(s,'move',...center(s,3),5010);s=touch(s,'up',...center(s,3),5020);
 assert.equal(homeSlotAppId(s,3),'work');assert.equal(s.system.layout[0],undefined);assert.equal(selectedTitle(s).id,'work');noLoss(s);
 const restored=restoreSettings(home(),saveSettings(s));assert.equal(restored.system.folderLayouts[4][3],'work');
 const launched=reduceSystem(s,'open',5100);assert.equal(launched.system.app,'work');
 s=lift(s,3,5200);s=touch(s,'move',20,40,5700);assert.equal(s.opened,false);s=touch(s,'move',5,120,5710);s=tickSystem(s,5710+T.edgeDelayMs);s=touch(s,'move',...center(s,0),6070);s=touch(s,'up',...center(s,0),6080);
 assert.equal(s.system.layout[0],'work');assert.equal(s.system.folderLayouts[4][3],undefined);noLoss(s);
});
test('holding a folder child over Back carries the same pickup to retained root and swaps on release',()=>{
 let s=enableHomeControls(placeInFolder());assert.equal(s.opened,true);assert.equal(s.system.layout[0],'work');assert.equal(s.system.folderLayouts[4][2],'projects');
 s=lift(s,2,5200);const origin=s.system.homeNavigation.gesture.origin.navigation,source=child(4,2),before=saveSettings(s),back=[59,54];
 assert.deepEqual(getHomeGestureView(s).dragged.source,source);assert.deepEqual(s.system.homeControls.tilePickup.source,source);
 s=touch(s,'move',...back,5700);s=tickSystem(s,5700+T.folderHoverMs-1);assert.equal(s.opened,true);
 s=tickSystem(s,5700+T.folderHoverMs);const held=getHomeGestureView(s);
 assert.equal(s.opened,false);assert.deepEqual(s.system.homeNavigation.rootView,origin.rootView);assert.deepEqual(held.dragged.source,source);
 assert.deepEqual([held.pointerId,held.x,held.y],[1,...back]);assert.deepEqual(held.target,root(0));assert.equal(held.canDrop,true);
 assert.deepEqual(s.system.homeControls.tilePickup.source,source);assert.equal(s.system.homeControls.primary.request,2);
 assert.equal(s.system.homeControls.tileTouch.strokeOwned,true);assert.deepEqual(s.system.homeControls.tileTouch.widgets,{});
 s=touch(s,'up',...back,5700+T.folderHoverMs+1);
 assert.equal(s.opened,false);assert.equal(s.system.layout[0],'projects');assert.equal(s.system.folderLayouts[4][2],'work');assert.equal(getHomeGestureView(s),null);noLoss(s);
 assert.equal(s.system.homeControls.tilePickup,null);assert.equal(s.system.homeControls.tileCandidate,null);
 assert.equal(Object.values(s.system.homeControls.tileTouch.widgets).some(widget=>widget.capture),false);
 s=tickSystem(s,5700+T.folderHoverMs+20);assert.equal(s.system.homeControls.primary.request,0);assert.equal(s.system.homeControls.primary.shown,true);
 assert.notEqual(saveSettings(s),before);
});
test('the production context wrapper retains pickup while rebasing departed folder controls',()=>{
 let s=enableHomeControls(placeInFolder());s=lift(s,2,5200);const source=child(4,2),back=[59,54];
 s=touch(s,'move',...back,5700);const before=s;
 s=reconcileHomeControls(before,tickSystem(s,5700+T.folderHoverMs));
 assert.equal(s.opened,false);assert.deepEqual(getHomeGestureView(s).dragged.source,source);
 assert.deepEqual(s.system.homeControls.tilePickup.source,source);assert.equal(s.system.homeControls.tileTouch.strokeOwned,true);
 assert.deepEqual(s.system.homeControls.tileTouch.latest,{x:back[0],y:back[1],down:true});
 assert.deepEqual(s.system.homeControls.tileTouch.widgets,{});assert.deepEqual(s.system.homeControls.tilePoses,{});
 const selectedPoint=center(s,s.selected);
 assert.deepEqual(s.system.homeControls.primary,{request:2,shown:false,layoutVisible:false,center:{x:selectedPoint[0],y:selectedPoint[1]}});
 for(const now of [5700+T.folderHoverMs+100,5700+T.folderHoverMs+300])s=reconcileHomeControls(s,tickSystem(s,now));
 assert.deepEqual(s.system.homeControls.tilePickup.source,source);assert.equal(s.system.homeControls.tileTouch.latest.down,true);
 s=touch(s,'up',...back,5700+T.folderHoverMs+301);
 assert.equal(s.system.layout[0],'projects');assert.equal(s.system.folderLayouts[4][2],'work');assert.equal(s.system.homeControls.tilePickup,null);noLoss(s);
});
test('timed Back carry submits restored root Scale5 and fitted lift without retargeting the source blank',()=>{
 let s=placeInFolder();s=writeHomeNavigation(s,{...s.system.homeNavigation,rootView:{...s.system.homeNavigation.rootView,density:5}});
 s=enableHomeControls(s);s=lift(s,2,5200);const source=child(4,2),back=[59,54];
 assert.deepEqual(s.system.homeControls.tilePickup.scale,{currentFrame:1,appliedFrame:1});
 assert.deepEqual(s.system.homeControls.tilePickup.blankScale,{currentFrame:1,appliedFrame:1});
 s=touch(s,'move',...back,5700);const before=s;
 s=reconcileHomeControls(before,tickSystem(s,5700+T.folderHoverMs));
 assert.equal(s.opened,false);assert.deepEqual(getHomeGestureView(s).dragged.source,source);
 assert.deepEqual(s.system.homeControls.tilePickup.source,source);assert.equal(s.system.homeControls.tileTouch.strokeOwned,true);
 assert.deepEqual(s.system.homeControls.tilePickup.scale,{currentFrame:5,appliedFrame:5});
 assert.deepEqual(s.system.homeControls.tilePickup.blankScale,{currentFrame:1,appliedFrame:1});
 assert.deepEqual(s.system.homeControls.tilePickup.anchor,{x:0,y:-4.25});
 assert.deepEqual(s.system.homeControls.tilePickup.center,{x:back[0],y:back[1]-4.25});
 for(const now of [5700+T.folderHoverMs+100,5700+T.folderHoverMs+300])s=reconcileHomeControls(s,tickSystem(s,now));
 assert.deepEqual(s.system.homeControls.tilePickup.scale,{currentFrame:5,appliedFrame:5});
 assert.deepEqual(s.system.homeControls.tilePickup.center,{x:back[0],y:back[1]-4.25});
 s=touch(s,'cancel',...back,5700+T.folderHoverMs+301);
 assert.equal(s.system.layout[0],'work');assert.equal(s.system.folderLayouts[4][2],'projects');assert.equal(s.system.homeControls.tilePickup,null);noLoss(s);
});
test('scene advance-before-mutation retargets when a counted pass crosses the Back deadline',()=>{
 let s=placeInFolder();s=writeHomeNavigation(s,{...s.system.homeNavigation,rootView:{...s.system.homeNavigation.rootView,density:5}});
 s=enableHomeControls(s);s=lift(s,2,5200);const source=child(4,2),back=[59,54],deadline=5700+T.folderHoverMs+1,frame=1000/60;
 s=touch(s,'move',...back,5700);
 s={...s,system:{...s.system,homeClock:{...s.system.homeClock,lastNow:deadline-frame,remainderMs:0}}};
 const advanced=tickHomeNavigationClockObserved(s,deadline);assert.equal(advanced.passes.length,1);s=advanced.state;
 assert.equal(s.opened,false);assert.deepEqual(getHomeGestureView(s).dragged.source,source);
 assert.deepEqual(s.system.homeControls.tilePickup.source,source);
 assert.deepEqual(s.system.homeControls.tilePickup.scale,{currentFrame:5,appliedFrame:5});
 assert.deepEqual(s.system.homeControls.tilePickup.blankScale,{currentFrame:1,appliedFrame:1});
 assert.deepEqual(s.system.homeControls.tilePickup.anchor,{x:0,y:-4.25});
 const beforeAction=s;s=reconcileHomeControls(beforeAction,tickSystem(beforeAction,deadline));
 assert.deepEqual(s.system.homeControls.tilePickup.scale,{currentFrame:5,appliedFrame:5});
 assert.deepEqual(s.system.homeControls.tilePickup.source,source);
 assert.equal(s.system.homeControls.tileTouch.strokeOwned,true);
});
test('the pre-existing immediate folder-band exit keeps its generic control reset',()=>{
 let s=enableHomeControls(placeInFolder());s=lift(s,2,5200);assert.ok(s.system.homeControls.tilePickup);
 s=touch(s,'move',59,40,5700);
 assert.equal(s.opened,false);assert.deepEqual(getHomeGestureView(s).dragged.source,child(4,2));
 assert.equal(s.system.homeControls.tilePickup,null);assert.equal(s.system.homeControls.tileTouch.strokeOwned,false);
 assert.equal(s.system.homeControls.primary.request,0);noLoss(s);
});
test('Back hover restarts after departure and the last folder child can move to an empty root cell',()=>{
 let s=enableHomeControls(placeInFolder(0));assert.equal(s.system.layout[0],undefined);assert.deepEqual(s.system.folderLayouts[4],{2:'work'});
 s=lift(s,2,5200);const back=[59,54];s=touch(s,'move',...back,5700);s=tickSystem(s,5700+T.folderHoverMs-1);assert.equal(s.opened,true);
 s=touch(s,'move',160,80,5700+T.folderHoverMs-1);s=touch(s,'move',...back,5710+T.folderHoverMs);
 s=tickSystem(s,5710+2*T.folderHoverMs-1);assert.equal(s.opened,true);
 s=tickSystem(s,5710+2*T.folderHoverMs);assert.equal(s.opened,false);s=touch(s,'up',...back,5711+2*T.folderHoverMs);
 assert.equal(s.system.layout[0],'work');assert.equal(s.system.folderLayouts[4][2],undefined);assert.equal(s.folders[4],'Folder');noLoss(s);
 assert.equal(getHomeGestureView(s),null);assert.equal(s.system.homeControls.tilePickup,null);
});
test('cancel and stale-source exits after Back hover restore folder navigation and clear native pickup ownership',()=>{
 for(const stale of [false,true]){
  let s=enableHomeControls(placeInFolder()),layout=structuredClone(s.system.layout),folders=structuredClone(s.system.folderLayouts);
  s=lift(s,2,5200);const origin=s.system.homeNavigation.gesture.origin.navigation,back=[59,54];s=touch(s,'move',...back,5700);s=tickSystem(s,5700+T.folderHoverMs);
  assert.equal(s.opened,false);assert.ok(s.system.homeControls.tilePickup);
  if(stale){
   const rootId=s.system.layout[0],sourceId=s.system.folderLayouts[4][2];
   s={...s,system:{...s.system,layout:{...s.system.layout,0:sourceId},folderLayouts:{...s.system.folderLayouts,4:{...s.system.folderLayouts[4],2:rootId}}}};
   s=tickSystem(s,5700+T.folderHoverMs+20);
  }else s=touch(s,'cancel',...back,5700+T.folderHoverMs+1);
  assert.equal(s.opened,true);assert.deepEqual(s.system.homeNavigation,origin);assert.equal(getHomeGestureView(s),null);
  assert.equal(s.system.input.touch,null);assert.equal(s.system.homeControls.tilePickup,null);assert.equal(s.system.homeControls.tileCandidate,null);
  assert.equal(Object.values(s.system.homeControls.tileTouch.widgets).some(widget=>widget.capture||widget.longPressFlag),false);
  s=tickSystem(s,5700+T.folderHoverMs+40);assert.equal(s.system.homeControls.primary.request,0);assert.equal(s.system.homeControls.primary.shown,true);noLoss(s);
  if(!stale){assert.deepEqual(s.system.layout,layout);assert.deepEqual(s.system.folderLayouts,folders);}
 }
});
test('apps swap across folders and full or protected placements cannot lose anything',()=>{
 let s=withFolder(withFolder(home(),4),6);s=moveHomeItem(s,root(0),child(4,0));s=moveHomeItem(s,root(1),child(6,0));
 s=moveHomeItem(s,child(4,0),child(6,0));assert.equal(s.system.folderLayouts[4][0],'projects');assert.equal(s.system.folderLayouts[6][0],'work');noLoss(s);
 for(const id of ['system-settings','eshop']){const slot=Number(Object.entries(s.system.layout).find(([,value])=>value===id)[0]);assert.equal(moveHomeItem(s,root(slot),root(4)),s);assert.equal(moveHomeItem(s,child(4,0),root(slot)),s);}
 const full={...s,system:{...s.system,folderLayouts:{...s.system.folderLayouts,4:Object.fromEntries(Array.from({length:60},(_,i)=>[i,`occupied-${i}`]))}}};assert.equal(resolveHomeDrop(full,root(2),root(4)),null);
});
test('folder icons carry labels and children through moves/swaps and cannot nest',()=>{
 let s=withFolder(withFolder(home(),4,'One'),6,'Two');s=moveHomeItem(s,root(0),child(4,0));s=moveHomeItem(s,root(1),child(6,0));
 assert.equal(moveHomeItem(s,root(4),child(6,1)),s);
 s=moveHomeItem(s,root(4),root(6));assert.equal(s.folders[6],'One');assert.equal(s.system.folderLayouts[6][0],'work');assert.equal(s.folders[4],'Two');noLoss(s);
 s=moveHomeItem(s,root(6),root(2));assert.equal(s.folders[2],'One');assert.equal(s.system.layout[6],'hobbies');assert.equal(s.system.folderLayouts[2][0],'work');assert.equal(s.system.folderLayouts[6],undefined);noLoss(s);
});
test('populated folder deletion presents and dismisses a notice while empty cleanup preserves software',()=>{
 let s=withFolder(home());s=moveHomeItem(s,root(0),child(4,0));s={...s,panel:'folder-settings',panelChoice:1,selected:4};s=reduceMenu(s,'open');
 assert.equal(s.panel,'folder-not-empty');const dismissed=reduceMenu(s,'open');assert.equal(dismissed.panel,null);assert.equal(dismissed.folders[4],'Folder');assert.equal(dismissed.system.folderLayouts[4][0],'work');
 s=moveHomeItem(dismissed,child(4,0),root(0));s={...s,panel:'folder-settings',panelChoice:1,selected:4};s=reduceMenu(s,'open');assert.equal(s.folders[4],undefined);assert.equal(s.system.folderLayouts[4],undefined);noLoss(s);
});
test('edge scrolling advances on clock deadlines, stays bounded and never persists preview data',()=>{
 let s=lift(home()),before=saveSettings(s);s=touch(s,'move',315,120,4500);s=tickSystem(s,4500+T.edgeDelayMs-1);assert.equal(pageStart(s),0);s=tickSystem(s,4500+T.edgeDelayMs);assert.equal(pageStart(s),1);
 s=tickSystem(s,4500+T.edgeDelayMs+T.edgeIntervalMs);assert.equal(pageStart(s),2);assert.equal(saveSettings(s),before);s=releaseSystemInputs(s,5300);assert.equal(pageStart(s),0);assert.equal(saveSettings(s),before);
});
test('hit testing and fractional scrolling agree at every density without selecting gap pixels',()=>{
 for(const columns of densities){let s=commitHomeScroll(setHomeDensity(home(),homeDensityIndex(columns)),2);
  const [sx,sy]=center(s,s.selected);s=touch(s,'down',sx,sy);s=touch(s,'move',sx-0.4*getHomeNavigationView(s).pitchX,sy,4100);
  for(const t of menuTiles(s).filter(t=>t.x>=20&&t.x+t.size<300&&t.y>=34&&t.y+t.size<204)){const [x,y]=center(s,t.index);assert.deepEqual(homeTouchLocation(s,x,y),root(t.index));}
  assert.equal(homeTouchLocation(s,0,100),null);assert.equal(homeTouchLocation(s,319,100),null);assert.ok(pageStart(s)>=0);assert.ok(rowCount(s)>0);
 }
});
test('preferences round-trip folders via IndexedDB and reject duplicates, hidden apps or unsupported schemas',async()=>{
 let s=withFolder(home());s=moveHomeItem(s,root(0),child(4,59));s=moveHomeItem(s,root(1),child(4,3));
 const raw=saveSettings(s),storage=await openFirmwareStorage({indexedDB:new IDBFactory(),databaseName:'home-layout'});await storage.savePreferences(raw);const loaded=await storage.load();storage.dispose();
 let restored=restoreSettings(home(),loaded.preferences);assert.deepEqual(restored.system.layout,s.system.layout);assert.deepEqual(restored.system.folderLayouts,s.system.folderLayouts);noLoss(restored);
 for(const edit of [v=>v.layout[0]='work',v=>v.folderLayouts[4][60]='work',v=>delete v.folderLayouts[4][59],v=>v.folderLayouts[999]={0:'work'},v=>v.version=99,v=>{delete v.layout[8];v.folderLayouts[4][5]='system-settings';}]){const v=JSON.parse(raw);edit(v);assert.equal(restoreHomeLayout(v),null);assert.equal(restoreSettings(restored,JSON.stringify(v)),restored);}
 const legacy=JSON.parse(saveSettings(home()));delete legacy.version;delete legacy.folderLayouts;assert.ok(restoreHomeLayout(legacy));
});

test('physical START launches selected software without creating an overlapping folder',()=>{
 const s=reduceSystem(home(),'start',4000);assert.equal(s.system.phase,'launch');assert.equal(s.system.app,'work');assert.equal(s.folders[0],undefined);noLoss(s);
});
test('many mixed container swaps preserve all installed IDs and are reloadable at each step',()=>{
 let s=withFolder(withFolder(withFolder(home(),4),6),20),seed=321;
 const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<180;i++){
  const sources=[...Object.keys(s.system.layout).map(k=>root(+k)),...Object.keys(s.folders).map(k=>root(+k)),...Object.entries(s.system.folderLayouts).flatMap(([f,slots])=>Object.keys(slots).map(k=>child(+f,+k)))];
  const folders=Object.keys(s.folders);const from=sources[random(sources.length)],to=random(3)?root(random(60)):child(+folders[random(folders.length)],random(60));
  s=moveHomeItem(s,from,to);noLoss(s);assert.ok(restoreHomeLayout(JSON.parse(saveSettings(s))));
 }
});
