import { getHomeGestureView, homeSlotAppId } from './system.ts';
import { isFolder, menuTiles, rowCount, type MenuState } from './state.ts';

/** One and two native rows share key 1's 72px plate; denser modes use smaller keys. */
export const nativeHomeDensityFrame=(rows:number)=>Math.max(1,Math.min(5,rows-1));

/** A derived view, never a second recognizer or a speculative mutation of icon maps. */
export function getHomePresentation(state:MenuState){
 const folder=state.opened?state.selected:null,gesture=getHomeGestureView(state),selected=state.opened?state.folderSelected:state.selected;
 const matches=(location:{folder:number|null;slot:number}|null|undefined,slot:number)=>!!location&&location.folder===folder&&location.slot===slot;
 const tiles=menuTiles(state).map(tile=>{
  const source=matches(gesture?.dragged?.source,tile.index),pressed=matches(gesture?.pressed,tile.index);
  const folderLabel=folder===null&&isFolder(tile.index,state)?state.folders[tile.index]:null;
  const drop=!!gesture?.dragged&&gesture.canDrop&&matches(gesture.target,tile.index)&&!source;
  return {...tile,appId:homeSlotAppId(state,tile.index),folderLabel,source,pressed,drop,
   cursor:gesture?.mode==='drag'?drop:gesture?.mode==='scroll'?false:gesture?.pressed?pressed:tile.index===selected};
 });
 return {tiles,rows:rowCount(state),folder,gesture,ghost:gesture?.dragged?{
  x:gesture.x,y:gesture.y,item:gesture.dragged.item,canDrop:gesture.canDrop,
  size:tiles[0]?.size??(rowCount(state)<=2?72:168/rowCount(state)-8)
 }:null};
}
export type HomePresentation=ReturnType<typeof getHomePresentation>;

/** HOME 0x1e6758..0x1e67c8, width initialized to 256 at 0x2b4920.
 * Preserve the native interior branch: it retains the anchor as child offset,
 * so this is not equivalent to clamping the final body center near zero.
 */
export function nativeFolderBalloonPosition(anchor:number){
 const baseX=Math.fround(anchor),halfWidth=128,bound=136;
 let bodyOffsetX=baseX;
 if(Math.fround(baseX-halfWidth)<-bound)bodyOffsetX=Math.fround(-bound+halfWidth-baseX);
 else if(Math.fround(baseX+halfWidth)>bound)bodyOffsetX=Math.fround(bound-halfWidth-baseX);
 return {baseX,bodyOffsetX};
}

/** Settled folder subset of the native lower balloon; transition state is owned
 * by the runtime. See docs/native-folder-balloon.md for the source predicate. */
export function getNativeFolderBalloon(state:MenuState,view:HomePresentation){
 // Gesture suppression is the existing conservative adapter, not the full native
 // mode predicate. Exact fade/target-density state must come from the runtime.
 if(state.opened||state.panel||view.gesture||view.rows!==1)return null;
 const tile=view.tiles.find(tile=>tile.index===state.selected);
 if(tile?.folderLabel===null||tile?.folderLabel===undefined)return null;
 return {label:tile.folderLabel,...nativeFolderBalloonPosition(tile.x+tile.size/2-160)};
}

/** Footer actions follow the runtime's currently selected container. */
export function getHomeFooter(state:MenuState){
 const appId=homeSlotAppId(state,state.opened?state.folderSelected:state.selected);
 const folder=!state.opened&&isFolder(state.selected,state);
 return {
  two:!!appId||folder,
  left:state.opened&&appId?'close-folder':folder?'folder-settings':appId&&state.system?.app?'close-software':null,
  right:appId?(state.system?.app===appId?'resume':'open'):state.opened?'close-folder':folder?'open':'create-folder'
 } as const;
}
