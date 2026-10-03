import {writeHomeNavigation,type HomeNavigation} from './home-navigation.ts';
import {getHomeFooter,type HomeFooterAction} from './home-presentation.ts';
import type {MenuState} from './state.ts';

type HomeFooterSegment='left'|'middle'|'right';
type HomeFooterSegmentGeometry=Readonly<{offset:number;width:number}>;
export type HomeFooterGeometry=Readonly<{x:number;y:number;width:number;height:number;leftWidth:number;three:Readonly<Record<HomeFooterSegment,HomeFooterSegmentGeometry>>}>;
export type HomeFooterContact=Readonly<{
 mode:'press'|'scroll'|'drag';x:number;y:number;startX:number;startY:number;
 panel:MenuState['panel'];origin:Readonly<{navigation:HomeNavigation;panelChoice:number}>;
}>;
export type HomeFooterHit=Readonly<{action:HomeFooterAction;side:HomeFooterSegment}>;

const available=(state:MenuState)=>{
 const system=state.system;
 return !!system&&system.phase==='home'&&!system.sleeping&&!system.preferences&&!system.dialog&&!state.panel;
};
const validGeometry=(geometry:HomeFooterGeometry)=>Number.isFinite(geometry.x)&&Number.isFinite(geometry.y)
 &&Number.isFinite(geometry.width)&&geometry.width>0&&Number.isFinite(geometry.height)&&geometry.height>0
 &&Number.isFinite(geometry.leftWidth)&&geometry.leftWidth>=0&&geometry.leftWidth<=geometry.width
 &&(['left','middle','right'] as const).every(side=>{
  const segment=geometry.three[side];
  return Number.isFinite(segment.offset)&&Number.isFinite(segment.width)&&segment.width>0&&segment.offset>=0&&segment.offset+segment.width<=geometry.width;
 });

/** Project source footer identity through caller-owned shared LCD geometry. */
export function homeFooterHit(state:MenuState,geometry:HomeFooterGeometry,x:number,y:number):HomeFooterHit|null{
 if(!validGeometry(geometry))throw new RangeError('Invalid HOME footer geometry');
 if(!available(state)||!Number.isFinite(x)||!Number.isFinite(y)||x<geometry.x||x>=geometry.x+geometry.width||y<geometry.y||y>=geometry.y+geometry.height)return null;
 const footer=getHomeFooter(state);if(!footer)return null;
 if(footer.middle){
  const localX=x-geometry.x;
  const side=(['left','middle','right'] as const).find(candidate=>{
   const segment=geometry.three[candidate];return localX>=segment.offset&&localX<segment.offset+segment.width;
  });
  const action=side?footer[side]:null;return action&&side?{action,side}:null;
 }
 const side=footer.two&&x<geometry.x+geometry.leftWidth?'left':'right';
 const action=footer[side];return action?{action,side}:null;
}

/** A source Select/release belongs to the footer only while the same semantic
 * button owns both endpoints. The gesture's immutable navigation origin keeps
 * selection or toolbar changes from transferring an in-flight contact. */
export function ownedHomeFooterContact(state:MenuState,geometry:HomeFooterGeometry,contact:HomeFooterContact|null|undefined,endX=contact?.x,endY=contact?.y):HomeFooterHit|null{
 if(!contact||contact.mode!=='press'||endX===undefined||endY===undefined)return null;
 const current=state.system?.homeNavigation,origin=contact.origin.navigation;
 if(!current||current.selectionRevision!==origin.selectionRevision||current.activeFolderSlot!==origin.activeFolderSlot
  ||current.focus.toolbarActive!==origin.focus.toolbarActive||current.focus.currentFocus!==origin.focus.currentFocus)return null;
 const originNavigation={...contact.origin.navigation,gesture:null};
 const originState=writeHomeNavigation({...state,panel:contact.panel,panelChoice:contact.origin.panelChoice},originNavigation);
 const start=homeFooterHit(originState,geometry,contact.startX,contact.startY);
 const end=homeFooterHit(state,geometry,endX,endY);
 return start&&end&&start.action===end.action&&start.side===end.side?end:null;
}
