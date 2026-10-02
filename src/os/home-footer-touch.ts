import {writeHomeNavigation,type HomeNavigation} from './home-navigation.ts';
import {getHomeFooter} from './home-presentation.ts';
import type {MenuState} from './state.ts';

type Footer=NonNullable<ReturnType<typeof getHomeFooter>>;
export type HomeFooterAction=Exclude<Footer['left']|Footer['right'],null>;
export type HomeFooterGeometry=Readonly<{x:number;y:number;width:number;height:number;leftWidth:number}>;
export type HomeFooterContact=Readonly<{
 mode:'press'|'scroll'|'drag';x:number;y:number;startX:number;startY:number;
 panel:MenuState['panel'];origin:Readonly<{navigation:HomeNavigation;panelChoice:number}>;
}>;
export type HomeFooterHit=Readonly<{action:HomeFooterAction;side:'left'|'right'}>;

const available=(state:MenuState)=>{
 const system=state.system;
 return !!system&&system.phase==='home'&&!system.sleeping&&!system.preferences&&!system.dialog&&!state.panel;
};
const validGeometry=(geometry:HomeFooterGeometry)=>Number.isFinite(geometry.x)&&Number.isFinite(geometry.y)
 &&Number.isFinite(geometry.width)&&geometry.width>0&&Number.isFinite(geometry.height)&&geometry.height>0
 &&Number.isFinite(geometry.leftWidth)&&geometry.leftWidth>=0&&geometry.leftWidth<=geometry.width;

/** Project source footer identity through caller-owned shared LCD geometry. */
export function homeFooterHit(state:MenuState,geometry:HomeFooterGeometry,x:number,y:number):HomeFooterHit|null{
 if(!validGeometry(geometry))throw new RangeError('Invalid HOME footer geometry');
 if(!available(state)||!Number.isFinite(x)||!Number.isFinite(y)||x<geometry.x||x>=geometry.x+geometry.width||y<geometry.y||y>=geometry.y+geometry.height)return null;
 const footer=getHomeFooter(state);if(!footer)return null;
 const side=footer.two&&x<geometry.x+geometry.leftWidth?'left':'right';
 const action=footer[side];return action?{action,side}:null;
}

/** A source Select/release belongs to the footer only while the same semantic
 * button owns both endpoints. The gesture's immutable navigation origin keeps
 * selection or toolbar changes from transferring an in-flight contact. */
export function ownedHomeFooterContact(state:MenuState,geometry:HomeFooterGeometry,contact:HomeFooterContact|null|undefined,endX=contact?.x,endY=contact?.y):HomeFooterHit|null{
 if(!contact||contact.mode!=='press'||endX===undefined||endY===undefined)return null;
 const originNavigation={...contact.origin.navigation,gesture:null};
 const originState=writeHomeNavigation({...state,panel:contact.panel,panelChoice:contact.origin.panelChoice},originNavigation);
 const start=homeFooterHit(originState,geometry,contact.startX,contact.startY);
 const end=homeFooterHit(state,geometry,endX,endY);
 return start&&end&&start.action===end.action&&start.side===end.side?end:null;
}
