import test from 'node:test';
import assert from 'node:assert/strict';
import {getHomeFooter,getHomePresentation,getNativeFolderBalloon,nativeHomeDensityFrame} from '../src/os/home-presentation.ts';
import {createPortfolioState,dispatchSystemEvent,tickSystem,releaseSystemInputs,touchSystem} from '../src/os/system.ts';
import {menuTiles} from '../src/os/state.ts';
const home=()=>{const state=createPortfolioState();return {...state,system:{...state.system,phase:'home'}};};
const point=(state,index)=>{const tile=menuTiles(state).find(t=>t.index===index);return {x:tile.x+tile.size/2,y:tile.y+tile.size/2};};
const touch=(state,phase,position,time)=>dispatchSystemEvent(state,{type:'touch',phase,...position,pointerId:1},time);

test('pressed tile follows runtime pointer source without changing keyboard selection',()=>{
 const start=home(),pressed=touch(start,'down',point(start,2),100),view=getHomePresentation(pressed);
 assert.equal(pressed.selected,start.selected);assert.equal(view.tiles.find(t=>t.index===2).pressed,true);
 assert.deepEqual(view.tiles.filter(t=>t.cursor).map(t=>t.index),[2]);assert.equal(view.ghost,null);
 const released=releaseSystemInputs(pressed,101);assert.ok(getHomePresentation(released).tiles.every(t=>!t.pressed));
});
test('native density selects the five authored keys for two through six rows',()=>{
 assert.deepEqual([2,3,4,5,6].map(nativeHomeDensityFrame),[1,2,3,4,5]);
 assert.equal(nativeHomeDensityFrame(1),1,'legacy single-row state retains the largest available native tile');
});
test('native folder balloon keeps body and pointer separate and excludes unverified placements and gestures',()=>{
 const initial=home(),state={...initial,selected:5,folders:{5:'１ (New Folder)'}};
 const view={...getHomePresentation(state),rows:2,gesture:null,tiles:[{index:5,x:208,y:130,size:72,folderLabel:state.folders[5]}]};
 assert.deepEqual(getNativeFolderBalloon(state,view),{label:state.folders[5],bodyX:8,pointerX:84});
 assert.deepEqual(getNativeFolderBalloon(state,{...view,tiles:[{...view.tiles[0],x:124}]}),{label:state.folders[5],bodyX:0,pointerX:0});
 assert.deepEqual(getNativeFolderBalloon(state,{...view,tiles:[{...view.tiles[0],folderLabel:''}]}),{label:'',bodyX:8,pointerX:84});
 for(const variant of [{...view,rows:3},{...view,gesture:{mode:'drag'}},{...view,tiles:[{...view.tiles[0],y:46}]}])assert.equal(getNativeFolderBalloon(state,variant),null);
 assert.equal(getNativeFolderBalloon({...state,opened:true},view),null);assert.equal(getNativeFolderBalloon({...state,panel:'settings'},view),null);
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
 const initial=home(),childId=initial.system.layout[1],state={...initial,selected:4,opened:true,folderSelected:1,folders:{4:'A'},system:{...initial.system,folderLayouts:{4:{1:childId}}}};
 const view=getHomePresentation(state);assert.equal(view.tiles.find(t=>t.index===1).appId,childId);assert.deepEqual(view.tiles.filter(t=>t.cursor).map(t=>t.index),[1]);
});
test('occupied folder footer closes the folder even when software is suspended',()=>{
 const initial=home(),childId=initial.system.layout[1];
 for(const active of [null,childId]){
  const state={...initial,selected:4,opened:true,folderSelected:1,folders:{4:'A'},system:{...initial.system,app:active,folderLayouts:{4:{1:childId}}}};
  assert.deepEqual(getHomeFooter(state),{two:true,left:'close-folder',right:active?'resume':'open'});
  const closed=touchSystem(state,50,226,100);assert.equal(closed.opened,false);assert.equal(closed.system.app,active);assert.equal(closed.system.dialog,null);
 }
});
