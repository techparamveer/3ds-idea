import type { AppView } from './app-types';
import { REFERENCE_DEVICE_STATUS } from './device-status-profile';
import { nativeMessageOverride, type AnimationBinding } from './native-layout';
import type { NativeLayoutRenderer } from './native-renderer';
import type { NativeTitlePackRequest } from './native-title-assets';
import { eshopWelcomePose } from './stock-eshop-welcome';
import type { StockScreenPaintOptions } from './stock-screen-presentation';

const eshopPrefix='packs/eshop/contents/0000-0000006b/';
export const eshopScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:eshopPrefix+'cad-Common-arc-lz.json',alias:'shop-background',layouts:['BG_U_00','BG_D_00','info_U_00'],animations:['BG_U_00_inOut_00','BG_D_00_inOut_00']},
  {url:eshopPrefix+'cad-Boot-arc-lz.json',alias:'shop-welcome',layouts:['welcome_U_00','welcome_D_00'],animations:['welcome_U_00_in_00','welcome_U_00_balloonIn_00','welcome_U_00_wait_00','welcome_U_00_out_00','welcome_U_00_out_01']},
  {url:eshopPrefix+'cad-CommonBtn-arc-lz.json',alias:'shop-buttons',layouts:['OKBtn_D_00'],animations:['OKBtn_D_00_touchOff_00']},
  {url:eshopPrefix+'cad-Hud-arc-lz.json',alias:'shop-hud',layouts:['HudMenu_00'],animations:['HudMenu_00_NetMode','HudMenu_00_NetAtn','HudMenu_00_Bat']},
  {url:eshopPrefix+'messages-and-loose.json',alias:'shop-messages',layouts:[],animations:[]},
];

const zonePrefix='packs/nintendo-zone/';
export const zoneScreenPacks:readonly NativeTitlePackRequest[]=[
  {url:zonePrefix+'local-html-images.json',alias:'zone-pages',layouts:[],animations:[],textures:['offline','no-content','info-top-frame-0']},
  {url:zonePrefix+'www-included_html-3dbanner_EU-nwcla.json',alias:'zone-banner',layouts:['U_top'],animations:['U_top_Loop_anim']},
  {url:zonePrefix+'layout-nwcx.json',alias:'zone-chrome',layouts:['Hud_00','bottommenu_l'],animations:['Hud_00_Bar_Appear','Hud_00_Battery','Hud_00_Charge_anim','Hud_00_Signal','Hud_00_time_Blinking']},
  {url:zonePrefix+'messages-and-loose.json',alias:'zone-messages',layouts:[],animations:[]},
];

/** Settled Hud_00 bar plus the shared reference-profile status clips.
 * Charging drives `Hud_00_Charge_anim` on the same 119-step clip clock as
 * `Hud_00_time_Blinking` (pattern 0 on frames 0–59, 1 from 60). Grp_NetAtn 3
 * is HudNetAtnInt_03. See native-service-screen-trace.md. */
export function zoneHudBindings(date:Date=new Date(),elapsedMs=0):AnimationBinding[]{
  const status=REFERENCE_DEVICE_STATUS,clock=zoneClock(date,elapsedMs);
  return [
    {name:'Hud_00_Bar_Appear',frame:15},
    status.charging
      ?{name:'Hud_00_Charge_anim',frame:clock.frame}
      :{name:'Hud_00_Battery',frame:status.batteryFrame},
    {name:'Hud_00_Signal',frame:status.netAtnFrame},
  ];
}

/** HUD update 0x36a7fc Internet branch (r7==2): lau_connect0, NetMode 0.
 * NetAtn frame is the 0x1e9aa8 `ldrb 0x1FF81066` stand-in (profile 3).
 * Charging `+0x438==5` writes Bat 4 (`+0x43e!=0`) or 5 on the ctor-relative
 * +0x410 1 Hz tick. Until an eShop HUD elapsed owner exists, bind Bat 4
 * (ctor stores +0x43e=1) and do not follow HOME `0x27c6a8` seconds.
 * Bind NetMode, NetAtn, then Bat. Appear is not started;
 * N_Scene_00 stays at its default alpha 255. */
export function eshopHudBindings():AnimationBinding[]{
  const status=REFERENCE_DEVICE_STATUS;
  return [
    {name:'HudMenu_00_NetMode',frame:status.netModeFrame},
    {name:'HudMenu_00_NetAtn',frame:status.netAtnFrame},
    {name:'HudMenu_00_Bat',frame:4},
  ];
}
const WEEKDAYS=['sun','mon','tue','wed','thu','fri','sat'] as const;
/** Injected local clock for HudMenu_00 T_Date/T_Time. Colon stays at the
 * layout default: 0x36a7fc toggles T_TimeC_00 on a ctor-relative 1000 ms
 * timer (`+0x43e`, initial 1), not HOME `0x27c6a8` seconds. Bat stays on
 * that same ctor flag (frame 4) until an eShop HUD elapsed owner exists.
 * Pair cache keys date fields plus that frozen Bat frame; seconds are omitted. */
export function eshopHudClock(date:Date){
  return {
    year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate(),
    hour:date.getHours(),minute:date.getMinutes(),
    colonVisible:true,
    batteryFrame:4,
  };
}

export { eshopWelcomePose };

export function nativeServiceView(view:AppView):{view:string;titleId:string;packs:readonly NativeTitlePackRequest[]}|null{
  if(view.appId==='eshop'&&(view.screen==='main'||view.screen==='detail'))return {view:'eshop-welcome',titleId:'0004001000022900',packs:eshopScreenPacks};
  if(view.appId==='nintendo-zone')return {view:'zone-offline',titleId:'0004001000022b00',packs:zoneScreenPacks};
  return null;
}

/** The bundled welcome is a read-only screen, without account or purchase operations.
 * Per screen, source draw priorities paint the app BG (0.01), welcome (0.5),
 * the OK button (0.9), Common info_U_00 (0.91; N_info_00 hidden, P_bg_01 shown),
 * HudMenu_00 (~0.911) and the BG curtain (1.0, the 0x3dfddc instance). */
export function drawNativeServiceFrame(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  if(view.appId==='nintendo-zone')return drawZone(renderer,top,bottom,view,options);
  if(view.appId!=='eshop'||!['main','detail'].includes(view.screen))return false;
  const tiger=(label:string)=>nativeMessageOverride(renderer.packs['shop-messages'],'tiger.msbt',label,'');
  const hud=(label:string,fallback:string)=>nativeMessageOverride(renderer.packs['shop-messages'],'hud.msbt',label,fallback);
  const pose=eshopWelcomePose(view,options.reducedMotion);
  const now=options.date??new Date(),clock=eshopHudClock(now),status=REFERENCE_DEVICE_STATUS;
  const day=hud(`day_${clock.day}`,String(clock.day).padStart(2,'0')).text??'';
  const month=hud(`month_${clock.month}`,String(clock.month).padStart(2,'0')).text??'';
  const weekday=hud(`week_${WEEKDAYS[now.getDay()]}`,'').text??'';
  const dateText=hud('lau_date','%d/%M (%w)');
  dateText.text=(dateText.text??'').replace('%d',day).replace('%M',month).replace('%w',weekday);
  let okay=renderer.draw(top,'shop-background','BG_U_00');
  okay=renderer.draw(bottom,'shop-background','BG_D_00')&&okay;
  okay=renderer.draw(top,'shop-welcome','welcome_U_00',{
    bindings:pose.upper,
    overrides:{T_decide_00:tiger('BootWelcome_txt01_01')},
  })&&okay;
  okay=renderer.draw(bottom,'shop-welcome','welcome_D_00',{
    overrides:{T_message_00:tiger('BootWelcome_txt01_02')},
    attachments:{OKBtn_D_00:()=>{
      const label=tiger(view.screen==='main'?'CommonBtn_01_02':'CommonBtn_01_01');
      okay=renderer.draw(bottom,'shop-buttons','OKBtn_D_00',{
        bindings:[{name:'OKBtn_D_00_touchOff_00',frame:1}],overrides:{T_OK_00:label,T_OK_01:label},
      })&&okay;
    }},
  })&&okay;
  okay=renderer.draw(top,'shop-background','info_U_00',{overrides:{N_info_00:{visible:false}}})&&okay;
  okay=renderer.draw(top,'shop-hud','HudMenu_00',{
    bindings:eshopHudBindings(),
    overrides:{
      T_NetMode_00:hud(status.networkMessage,'Internet'),
      T_Date_00:dateText,
      T_TimeL_00:{text:String(clock.hour).padStart(2,'0')},
      T_TimeC_00:{visible:clock.colonVisible},
      T_TimeR_00:{text:String(clock.minute).padStart(2,'0')},
    },
  })&&okay;
  if(pose.curtain!==null){
    okay=renderer.draw(top,'shop-background','BG_U_00',{bindings:[{name:'BG_U_00_inOut_00',frame:pose.curtain}]})&&okay;
    okay=renderer.draw(bottom,'shop-background','BG_D_00',{bindings:[{name:'BG_D_00_inOut_00',frame:pose.curtain}]})&&okay;
  }
  return okay;
}

/** The delivered Hud_00 text panes split HH:MM into three source fields.
 * `frame` is the 119-step colon / charge clip clock, not wall-clock seconds. */
export function zoneClock(date:Date,elapsedMs:number){
  const frame=Math.floor(Math.max(0,elapsedMs)*60/1000)%119;
  const status=REFERENCE_DEVICE_STATUS;
  return {
    hour:String(date.getHours()).padStart(2,'0'),
    minute:String(date.getMinutes()).padStart(2,'0'),
    frame,
    batteryFrame:status.charging?(frame<60?0:1):status.batteryFrame,
  };
}

function drawZone(renderer:NativeLayoutRenderer,top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,view:AppView,options:StockScreenPaintOptions):boolean{
  const main=view.screen==='main';
  const clockDate=options.date??new Date();
  const clock=zoneClock(clockDate,options.elapsedMs??0);
  top.fillStyle='#000';top.fillRect(0,0,400,240);bottom.fillStyle='#fff';bottom.fillRect(0,0,320,240);
  let okay=renderer.drawBitmap(bottom,'zone-pages',main?'offline':'no-content',0,0);
  if(main){top.save();top.translate(0,20);okay=renderer.draw(top,'zone-banner','U_top',{bindings:[{name:'U_top_Loop_anim',frame:120}]})&&okay;top.restore();}
  else okay=renderer.drawBitmap(top,'zone-pages','info-top-frame-0',0,20)&&okay;
  const message=(label:string)=>nativeMessageOverride(renderer.packs['zone-messages'],'mars',label,'');
  okay=renderer.draw(top,'zone-chrome','Hud_00',{
    bindings:[...zoneHudBindings(clockDate,options.elapsedMs??0),{name:'Hud_00_time_Blinking',frame:clock.frame}],overrides:{
      T_Title_00:{text:'Nintendo Zone'},T_TimeL_00:{text:clock.hour},T_TimeC_00:{text:':'},T_TimeR_00:{text:clock.minute},
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
