import {nativeMessageOverride} from './native-layout';
import type {NativeLayoutRenderer} from './native-renderer';
import type {NativeTitlePackRequest} from './native-title-assets';

const source=[
 ['bg','layout-Body-Common-CommonBg-CommonBg-arc-cmp','CommonBg',[]],
 ['bg-up','layout-Body-Common-CommonBgUp-CommonBgUp-arc-cmp','CommonBgUp',[]],
 ['upper','layout-Body-Portal-PortalSceneUp-arc-cmp','PortalSceneUp',[]],
 ['header','layout-Body-Common-Header-Header-arc-cmp','Header',[]],
 ['portal','layout-Body-Portal-PortalSceneCTR-arc-cmp','PortalSceneCTR',[]],
 ['button','layout-Parts-Portal-PortalBtn-arc-cmp','PortalBtn',['PortalBtn_Select']],
 ['sub','layout-Parts-Portal-PortalBtnSub-arc-cmp','PortalBtnSub',['PortalBtnSub_Select']],
 ['close','layout-Parts-Common-BtnBtm_03-BtnBtm_03-arc-cmp','BtnBtm_03',['BtnBtm_03_SceneIn']],
] as const;
export const amiiboScreenPacks:readonly NativeTitlePackRequest[]=[
 ...source.map(([alias,file,layout,animations])=>({url:`packs/amiibo-settings/${file}.json`,alias:'amiibo-'+alias,layouts:[layout],animations:[...animations]})),
 {url:'packs/amiibo-settings/messages-and-loose.json',alias:'amiibo-messages',layouts:[],animations:[]},
];
/** Source opening layout, settled and read-only. The four device-operation
 * buttons remain visible but inert; Close is handled by the shared Back path. */
export function drawNativeAmiibo(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D):boolean{
 const pack=renderer.packs['amiibo-messages'],bank=pack.messages.cabinet;
 const textByCallName=Object.fromEntries(Object.entries(bank.labels).map(([label,index])=>[label,bank.messages[index].text]));
 // 17dea8 -> 17d6e4 resolves amiiboSettings, then assigns both named panes;
 // IGN_Header is an authoring placeholder, not a message-bank label.
 const title=nativeMessageOverride(pack,'cabinet','amiiboSettings','');
 let okay=true;
 const draw=(ctx:CanvasRenderingContext2D,alias:string,layout:string,options:Parameters<NativeLayoutRenderer['draw']>[3]={})=>{okay=renderer.draw(ctx,'amiibo-'+alias,layout,{textByCallName,...options})&&okay;};
 draw(top,'bg-up','CommonBgUp');draw(top,'upper','PortalSceneUp');
 draw(top,'header','Header',{overrides:{T_HeaderTitle_00:title,T_HeaderTitle_01:title}});
 draw(bottom,'bg','CommonBg');
 draw(bottom,'portal','PortalSceneCTR',{
  parts:{PortalBtn:{pack:'amiibo-button',layout:'PortalBtn'},PortalBtnSub:{pack:'amiibo-sub',layout:'PortalBtnSub'},BtnBtm_03:{pack:'amiibo-close',layout:'BtnBtm_03'}},
  partBindings:{
   L_EditBtn:{bindings:[{name:'PortalBtn_Select',frame:0}]},
   L_DeleteBtn:{bindings:[{name:'PortalBtn_Select',frame:0}]},
   L_InitializeBtn:{bindings:[{name:'PortalBtn_Select',frame:0}]},
   L_UpdateBtn:{bindings:[{name:'PortalBtnSub_Select',frame:0}]},
   L_StopBtn:{bindings:[{name:'BtnBtm_03_SceneIn',frame:renderer.packs['amiibo-close'].animations.BtnBtm_03_SceneIn.frames}]},
  },
 });
 return okay;
}
