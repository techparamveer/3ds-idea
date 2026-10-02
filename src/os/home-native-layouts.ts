import {nativeMessageOverride,type AnimationBinding,type PaneOverrides} from './native-layout.ts';
import type {NativeDrawOptions,NativeLayoutRenderer} from './native-renderer.ts';
import type {MenuState} from './state.ts';

type LayoutState=MenuState&{
 homeSavedLayouts?:readonly unknown[];
 homeLayoutSlot?:number;
 homeLayoutAction?:'save'|'load'|'delete'|null;
 homeLayoutConfirm?:boolean;
};
type Context=CanvasRenderingContext2D;
const layouts=['MyMenu_U_00','MyMenu_D_00','MyMenuBtn_D_00','MyMenuBtmBtn_D_00','MyMenuCsr_00'];
const binding=(name:string,frame:number,groups?:string[]):AnimationBinding=>({name,frame,...(groups?{groups}:{})});

/** home.MyMenu source composition. Local saved arrangements are an adaptation;
 * source sample images are never presented as previews of those arrangements. */
export function createHomeLayoutManager(renderer:NativeLayoutRenderer){
 const note=(message:string)=>{if(!renderer.diagnostics.includes(message))renderer.diagnostics.push(message);};
 function draw(top:Context,bottom:Context,state:LayoutState,drawHud?:()=>void):boolean{
  const action=state.homeLayoutAction??null;
  if(action!==null&&!['save','load','delete'].includes(action))throw new RangeError('Invalid HOME layout action');
  if(action===null&&state.homeLayoutConfirm)throw new Error('Native HOME layout confirmation has no action');
  const selected=state.homeLayoutSlot??0;
  if(!Number.isInteger(selected)||selected<0||selected>=8)throw new RangeError('Invalid HOME layout slot');
  const pack=renderer.packs.MyMenu,bank=renderer.packs.messages?.messages.menu_msbt_LZ;
  for(const name of layouts)if(!pack?.layouts[name])throw new Error(`Native HOME layout manager layout unavailable: ${name}`);
  const occupied=(slot:number)=>state.homeSavedLayouts?.[slot]!=null;
  const saveLabel=occupied(selected)?'mhm_overwrite_4b':'mhm_save_4b';
  const text=(label:string)=>{
   if(bank?.labels[label]===undefined)throw new Error(`Native HOME layout manager message unavailable: ${label}`);
   return nativeMessageOverride(renderer.packs.messages,'menu_msbt_LZ',label,'');
  };
  const current=text('mhm_current_u'),title=text('mhm_title_u'),load=text('mhm_load_4b'),save=text(saveLabel);
  let confirmation:PaneOverrides|undefined;
  if(action){
   if(!occupied(selected))throw new Error('Native HOME layout confirmation requires a saved slot');
   const cancel=text('lau_dlg_2b_canc0'),confirm=text(action==='delete'?'lau_dlg_2b_delete':'lau_dlg_2b_decide');
   confirmation={TextBoxDialog:text(`lau_dlg_mhm_${action}`),TextBox_00:cancel,TextBox_01:cancel,TextBox_02:confirm,TextBox_03:confirm};
   for(const [bank,name,clips] of [['dialog','Dlg_A_D_02',['FadeIn','Select']],['dialogmask','DlgMask_U_00',['FadeIn']],['dialogmask','DlgMask_D_00',['FadeIn']]] as const){
    const source=renderer.packs[bank];
    if(!source?.layouts[name])throw new Error(`Native HOME layout confirmation layout unavailable: ${bank}/${name}`);
    for(const clip of clips)if(!source.animations[`${name}_${clip}`])throw new Error(`Native HOME layout confirmation animation unavailable: ${name}_${clip}`);
   }
   note('HOME layout confirmations reuse native Dlg_A_D_02 and dialog masks as a source-layout assembly adaptation; the original MyMenu dialog composition and thumbnails remain unverified.');
  }
  const requiredClips=['MyMenu_U_00_MyMenuIn','MyMenu_D_00_MyMenuIn','MyMenuBtn_D_00_Invalid','MyMenuBtn_D_00_Valid','MyMenuBtmBtn_D_00_BtnIn','MyMenuBtmBtn_D_00_BtnIn2','MyMenuBtmBtn_D_00_Invalid','MyMenuCsr_00_Loop'];
  for(const name of requiredClips)if(!pack.animations[name])throw new Error(`Native HOME layout manager animation unavailable: ${name}`);
  note('HOME layout manager uses settled native source poses; opening, cursor epoch, input, motion and native comparison remain unverified.');
  note('HOME layout manager current/saved LCD previews are unavailable; native sample thumbnails are hidden. Local layout persistence and disabled preview zoom are adaptations.');
  let okay=true;
  const paint=(ctx:Context,name:string,options:NativeDrawOptions={},bank='MyMenu')=>{okay=renderer.draw(ctx,bank,name,options)&&okay;};
  // Signed source footer widths encode reflection. Preserve the source origin
  // and UVs while presenting positive raster dimensions to the renderer.
  const footerOverrides:PaneOverrides={T_BtnB_00:load,T_BtnF_00:load,T_BtnB_01:save,T_BtnF_01:save};
  const mirror=(panes:typeof pack.layouts.MyMenuBtmBtn_D_00.roots)=>panes.forEach(pane=>{
   if(pane.size[0]<0||pane.size[1]<0)footerOverrides[pane.name]={size:pane.size.map(Math.abs),scale:pane.scale.map((value,i)=>value*(pane.size[i]<0?-1:1))};
   mirror(pane.children);
  });
  mirror(pack.layouts.MyMenuBtmBtn_D_00.roots);
  paint(top,'MyMenu_U_00',{clip:[0,0,400,240],textSampling:'lcd',bindings:[binding('MyMenu_U_00_MyMenuIn',30)],overrides:{TextBox_00:current,TextBox_01:title,N_Thumb:{visible:false},N_Thumb_All:{visible:false},N_Thumb_08:{visible:false}}});
  const attachments:Record<string,()=>void>={};
  for(let slot=0;slot<8;slot++)attachments[`N_Thumb_0${slot}`]=()=>paint(bottom,'MyMenuBtn_D_00',{
   bindings:[binding(occupied(slot)?'MyMenuBtn_D_00_Valid':'MyMenuBtn_D_00_Invalid',1)],
   overrides:{Thumb_00:{visible:false},N_Icon_Random:{visible:false}},
   attachments:slot===selected?{RootPane:()=>paint(bottom,'MyMenuCsr_00',{bindings:[binding('MyMenuCsr_00_Loop',0)]})}:undefined,
  });
  paint(bottom,'MyMenu_D_00',{clip:[0,0,320,240],bindings:[binding('MyMenu_D_00_MyMenuIn',30)],attachments});
  const disabled=['G_Btn_03',...(!occupied(selected)?['G_Btn_01','G_Btn_04']:[])];
  paint(bottom,'MyMenuBtmBtn_D_00',{clip:[0,0,320,240],textSampling:'lcd',bindings:[binding('MyMenuBtmBtn_D_00_BtnIn',20),binding('MyMenuBtmBtn_D_00_BtnIn2',10),binding('MyMenuBtmBtn_D_00_Invalid',1,disabled)],overrides:footerOverrides});
  drawHud?.();
  if(confirmation){
   paint(top,'DlgMask_U_00',{bindings:[binding('DlgMask_U_00_FadeIn',20)]},'dialogmask');
   paint(bottom,'DlgMask_D_00',{bindings:[binding('DlgMask_D_00_FadeIn',20)]},'dialogmask');
   paint(bottom,'Dlg_A_D_02',{textSampling:'lcd',bindings:[binding('Dlg_A_D_02_FadeIn',20),binding('Dlg_A_D_02_Select',1,[state.homeLayoutConfirm?'Group_01':'Group_00'])],overrides:confirmation},'dialog');
  }
  if(!okay)throw new Error('Native HOME layout manager draw failed');
  return true;
 }
 return {draw};
}
