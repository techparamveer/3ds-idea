import type { AppView } from './app-types';
import { nativeMessageOverride, type AnimationBinding } from './native-layout';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import type { StockScreenPaintOptions } from './stock-screen-presentation';

const eshopPrefix='packs/eshop/contents/0000-0000006b/';
export const eshopScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:eshopPrefix+'cad-Common-arc-lz.json',alias:'shop-background',layouts:['BG_U_00','BG_D_00'],animations:[]},
  {url:eshopPrefix+'cad-Boot-arc-lz.json',alias:'shop-welcome',layouts:['welcome_U_00','welcome_D_00'],animations:['welcome_U_00_in_00','welcome_U_00_balloonIn_00']},
  {url:eshopPrefix+'cad-CommonBtn-arc-lz.json',alias:'shop-buttons',layouts:['OKBtn_D_00'],animations:['OKBtn_D_00_touchOff_00']},
  {url:eshopPrefix+'messages-and-loose.json',alias:'shop-messages',layouts:[],animations:[]},
];

const zonePrefix='packs/nintendo-zone/';
export const zoneScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:zonePrefix+'local-html-images.json',alias:'zone-pages',layouts:[],animations:[],textures:['offline','no-content','info-top-frame-0']},
  {url:zonePrefix+'www-included_html-3dbanner_EU-nwcla.json',alias:'zone-banner',layouts:['U_top'],animations:['U_top_Loop_anim']},
  {url:zonePrefix+'layout-nwcx.json',alias:'zone-chrome',layouts:['Hud_00','bottommenu_l'],animations:['Hud_00_Bar_Appear','Hud_00_Battery','Hud_00_Signal']},
  {url:zonePrefix+'messages-and-loose.json',alias:'zone-messages',layouts:[],animations:[]},
];

/** Settled Hud_00 bar plus its source status clips. Unbound, P_Bat_00 and
 * P_NetAtn_00 keep material defaults HudBat_00 (low) and HudNetAtnInt_00
 * (signal). Grp_Bat frame 3 is HudBat_03, a representative sufficient-charge
 * state, not a live battery measurement; Grp_NetAtn frame 5 is
 * HudNetAtnOff_00, matching HOME's disabled wireless. See
 * native-service-screen-trace.md. */
export const zoneHudBindings:AnimationBinding[]=[{name:'Hud_00_Bar_Appear',frame:15},{name:'Hud_00_Battery',frame:3},{name:'Hud_00_Signal',frame:5}];

export function nativeServiceView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.appId==='eshop'&&(view.screen==='main'||view.screen==='detail'))return {view:'eshop-welcome',titleId:'0004001000022900',packs:eshopScreenPacks};
  if(view.appId==='nintendo-zone')return {view:'zone-offline',titleId:'0004001000022b00',packs:zoneScreenPacks};
  return null;
}

/** The bundled welcome is a read-only screen, without account or purchase operations. */
export function drawNativeServiceFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,_options:StockScreenPaintOptions):boolean{
  if(view.appId==='nintendo-zone')return drawZone(renderer,top,bottom,view);
  if(view.appId!=='eshop'||!['main','detail'].includes(view.screen))return false;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['shop-messages'],'tiger.msbt',label,'');
  let okay=renderer.draw(top,'shop-background','BG_U_00');
  okay=renderer.draw(bottom,'shop-background','BG_D_00')&&okay;
  okay=renderer.draw(top,'shop-welcome','welcome_U_00',{
    bindings:[{name:'welcome_U_00_in_00',frame:10},{name:'welcome_U_00_balloonIn_00',frame:58}],
    overrides:{T_decide_00:message('BootWelcome_txt01_01')},
  })&&okay;
  okay=renderer.draw(bottom,'shop-welcome','welcome_D_00',{
    overrides:{T_message_00:message('BootWelcome_txt01_02')},
    attachments:{OKBtn_D_00:()=>{
      const label=message(view.screen==='main'?'CommonBtn_01_02':'CommonBtn_01_01');
      okay=renderer.draw(bottom,'shop-buttons','OKBtn_D_00',{
        bindings:[{name:'OKBtn_D_00_touchOff_00',frame:1}],overrides:{T_OK_00:label,T_OK_01:label},
      })&&okay;
    }},
  })&&okay;
  return okay;
}

function drawZone(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView):boolean{
  const main=view.screen==='main';
  top.fillStyle='#000';top.fillRect(0,0,400,240);bottom.fillStyle='#fff';bottom.fillRect(0,0,320,240);
  let okay=renderer.drawBitmap(bottom,'zone-pages',main?'offline':'no-content',0,0);
  if(main){top.save();top.translate(0,20);okay=renderer.draw(top,'zone-banner','U_top',{bindings:[{name:'U_top_Loop_anim',frame:120}]})&&okay;top.restore();}
  else okay=renderer.drawBitmap(top,'zone-pages','info-top-frame-0',0,20)&&okay;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['zone-messages'],'mars',label,'');
  okay=renderer.draw(top,'zone-chrome','Hud_00',{
    bindings:zoneHudBindings,overrides:{
      T_Title_00:{text:'Nintendo Zone'},T_TimeL_00:{text:''},T_TimeC_00:{text:''},T_TimeR_00:{text:''},
      WHITE_01:{visible:false},P_Debug_Rotate:{visible:false},N_ReadIcon:{visible:false},Timer_Icon:{visible:false},
    },
  })&&okay;
  okay=renderer.draw(bottom,'zone-chrome','bottommenu_l',{overrides:{
    N_AltMenu_UI:{visible:false},N_Cancel_UI:{visible:false},N_UP_btn:{visible:false},N_win:{visible:false},
    N_Btn_menu:{visible:false},N_Btn_save:{visible:false},
    T_return:message('App_Button_Back_Dlg3'),T_return_emb:message('App_Button_Back_Dlg3'),
  }})&&okay;
  return okay;
}
