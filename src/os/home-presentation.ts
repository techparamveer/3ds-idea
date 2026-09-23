import { getHomeGestureView, homeSlotAppId } from './system.ts';
import { getHomeCursorSlot } from './home-cursor-visibility.ts';
import { hasEmptyHomeFolderSelection, isFolder, menuTiles, rowCount, type MenuState } from './state.ts';
import { getHomeNavigationView, homeGridMetrics, type HomeDensity } from './home-navigation.ts';

/** CLYT Scale clips consume density, which is distinct from folder row count. */
export const nativeHomeDensityFrame=(density:number)=>Math.max(0,Math.min(5,density));

/** Original 0x1d8424 table interpolation, preserving separate float32 operations. */
export function nativeHomeDensityMetric(values:readonly number[],density:number){
 const f=Math.fround,d=f(nativeHomeDensityFrame(density)),i=Math.floor(d),j=Math.min(5,i+1);
 return f(values[i]+f(f(values[j]-values[i])*f(d-i)));
}

/** Original 0x1d5740 folder extent update. Endpoints are unscrolled layout coordinates. */
type HomePanelInput={density:number;currentDensity:HomeDensity;targetDensity:HomeDensity;currentLeftSlot:number;targetLeftSlot:number;scrollPixels:number;firstNativeX:number;lastNativeX:number};
export function nativeHomePanelGeometry(input:HomePanelInput,folder:boolean,extent:number){
 const f=Math.fround,padding=f(nativeHomeDensityMetric([76,76,52,40,32,34],input.density)-10);
 const left=Math.floor(f(input.firstNativeX-padding)),right=Math.ceil(f(input.lastNativeX+padding));
 const width=f(2*Math.ceil(f(f(right-left)*.5)));
 const current=homeGridMetrics(folder,input.currentDensity),target=homeGridMetrics(folder,input.targetDensity);
 const c0=input.currentLeftSlot+current.rows*(current.columns-1),c1=input.targetLeftSlot+target.rows*(target.columns-1);
 const last=extent-1,anchored=input.currentDensity!==input.targetDensity&&c0<=last&&last<c0+current.rows&&c1<=last&&last<c1+target.rows;
 const x=anchored?f(150-f(width*.5)):f(f(left+f(width*.5))-input.scrollPixels);
 return {x,width,shadowWidth:f(width+20)};
}
export const nativeFolderPanelGeometry=(input:HomePanelInput)=>nativeHomePanelGeometry(input,true,60);
export function getNativeHomePanel(state:MenuState){
 const view=getHomeNavigationView(state);
 return nativeHomePanelGeometry({...view,firstNativeX:Math.fround(view.unscrolledSlots[0].x-160),lastNativeX:Math.fround(view.unscrolledSlots[view.capacity-1].x-160)},state.opened,view.capacity);
}
export const getNativeFolderPanel=(state:MenuState)=>state.opened?getNativeHomePanel(state):null;


/** A derived view, never a second recognizer or a speculative mutation of icon maps. */
export function getHomePresentation(state:MenuState){
 const folder=state.opened?state.selected:null,gesture=getHomeGestureView(state),cursorSlot=getHomeCursorSlot(state);
 const pickup=state.system?.homeControls?.tilePickup??null;
 const matches=(location:{folder:number|null;slot:number}|null|undefined,slot:number)=>!!location&&location.folder===folder&&location.slot===slot;
 const tiles=menuTiles(state).map(tile=>{
  const source=matches(pickup?.source??gesture?.dragged?.source,tile.index),pressed=matches(gesture?.pressed,tile.index);
  const folderLabel=folder===null&&isFolder(tile.index,state)?state.folders[tile.index]:null;
  const drop=!!gesture?.dragged&&gesture.canDrop&&matches(gesture.target,tile.index)&&!source;
  return {...tile,appId:homeSlotAppId(state,tile.index),folderLabel,source,pressed,drop,
   cursor:tile.index===cursorSlot};
 });
 const navigation=getHomeNavigationView(state);
 return {tiles,rows:rowCount(state),density:navigation.density,currentDensity:navigation.currentDensity,targetDensity:navigation.targetDensity,mode:pickup?14:navigation.mode,folder,gesture,pickup,ghost:gesture?.dragged?{
  x:pickup?.center.x??gesture.x,y:pickup?.center.y??gesture.y,item:gesture.dragged.item,canDrop:gesture.canDrop,
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
 if(state.opened||state.panel||view.gesture||view.currentDensity!==0||view.targetDensity!==0||view.mode===2)return null;
 const tile=view.tiles.find(tile=>tile.index===state.selected);
 if(tile?.folderLabel===null||tile?.folderLabel===undefined)return null;
 return {label:tile.folderLabel,...nativeFolderBalloonPosition(tile.x+tile.size/2-160)};
}

/** Footer actions follow the runtime's currently selected container. */
export function getHomeFooter(state:MenuState){
 const appId=homeSlotAppId(state,state.opened?state.folderSelected:state.selected);
 // Native 0x29af68 → 0x1e0cb4 hides both actions for an empty selected child.
 if(hasEmptyHomeFolderSelection(state))return null;
 const folder=!state.opened&&isFolder(state.selected,state);
 return {
  two:!!appId||folder,
  left:state.opened&&appId?'close-folder':folder?'folder-settings':appId&&state.system?.app?'close-software':null,
  right:appId?(state.system?.app===appId?'resume':'open'):state.opened?'close-folder':folder?'open':'create-folder'
 } as const;
}
