import {settleHomeNavigation} from '../src/os/home-navigation.ts';
import {setHomeDensity as setHomeDensityMotion,selectHomeSlot,enterHomeFolder,homeDensityIndex} from '../src/os/home-navigation.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {getHomeFooter,getHomePresentation,getNativeFolderBalloon,nativeHomeDensityFrame,nativeFolderBalloonPosition} from '../src/os/home-presentation.ts';
import {createPortfolioState,dispatchSystemEvent,tickSystem,releaseSystemInputs,touchSystem} from '../src/os/system.ts';
import {menuTiles} from '../src/os/state.ts';
import {homeTouchLocation} from '../src/os/home-gestures.ts';
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
test('native density shares the first size across one/two rows then selects smaller keys',()=>{
 assert.deepEqual([1,2,3,4,5,6].map(nativeHomeDensityFrame),[1,1,2,3,4,5]);
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
test('occupied folder footer closes the folder even when software is suspended',()=>{
 const initial=home(),childId=initial.system.layout[1];
 for(const active of [null,childId]){
  const state=selectHomeSlot(enterHomeFolder({...initial,folders:{4:'A'},system:{...initial.system,app:active,folderLayouts:{4:{1:childId}}}},4),1);
  assert.deepEqual(getHomeFooter(state),{two:true,left:'close-folder',right:active?'resume':'open'});
  const closed=touchSystem(state,50,226,100);assert.equal(closed.opened,false);assert.equal(closed.system.app,active);assert.equal(closed.system.dialog,null);
 }
});
