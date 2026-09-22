import { getHomeGestureView, homeSlotAppId } from './system.ts';
import { isFolder, menuTiles, rowCount, type MenuState } from './state.ts';

/** Captured two-row HOME uses key 1; larger densities follow the authored size sequence. */
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
