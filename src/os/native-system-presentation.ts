import {drawNativeSystemFade} from './native-system-fade';
import {nativeMessageLineAdvanceScales,nativeMessageOverride,type PaneOverrides} from './native-layout';
import type {FirmwarePresentationAssets} from './firmware-presentation';
import type {MenuState} from './state';
import {appLaunchLogoFrame,bootRevealFrame,systemTransitionFrame} from './system-transitions';

type SystemFadeClip='SceneIn'|'SceneOut'|'SceneOutA'|'SceneOutB'|'SceneOutC';

/** Source HOME power layouts and common black fades. Browser clock is explicit;
 * this does not claim measured hardware cold-boot or title-loading latency. */
export function drawNativeSystemOverlay(top:CanvasRenderingContext2D,bottom:CanvasRenderingContext2D,state:MenuState,now:number,reduced:boolean,assets:FirmwarePresentationAssets):boolean{
 const s=state.system;if(!s||s.sleeping||!['boot','launch','power','shutdown'].includes(s.phase))return false;
 const elapsed=Math.max(0,now-s.since),renderer=assets.renderer;
 const message=(key:string,fallback:string)=>nativeMessageOverride(renderer.packs.messages,'menu_msbt_LZ',key,fallback);
 const fade=(clip:SystemFadeClip,frame:number)=>{
  let ok=true;
  for(const [ctx,suffix]of [[top,'U'],[bottom,'D']] as const){
   const name=`CmnFadeNinLogo_${suffix}_00`;
   ok=(drawNativeSystemFade(ctx,renderer.packs.common,name,`${name}_${clip}`,frame)||renderer.draw(ctx,'common',name,{bindings:[{name:`${name}_${clip}`,frame}]}))&&ok;
  }
  return ok;
 };
 if(s.phase==='boot'){
  return fade('SceneIn',bootRevealFrame(elapsed,reduced));
 }
 if(s.phase==='launch'){
  const pose=appLaunchLogoFrame(elapsed,reduced);
  if(!renderer.packs.launch)return fade('SceneOut',systemTransitionFrame(elapsed,20,reduced));
  // SceneOutA/B/C darken HOME in place with the logo; do not erase HOME first.
  let okay=fade(`SceneOut${pose.clip}`,pose.frame);
  for(const [ctx,suffix]of [[top,'U'],[bottom,'D']] as const){const name=`NintendoLogo_${suffix}_00`;okay=renderer.draw(ctx,'launch',name,{bindings:[{name:`${name}_SceneOut${pose.clip}`,frame:pose.frame}]})&&okay;}
  return okay;
 }
 top.fillStyle=bottom.fillStyle='#fff';top.fillRect(0,0,400,240);bottom.fillRect(0,0,320,240);
 const clip=s.returnPhase==='app'?'SceneInApp':'SceneIn',last=s.returnPhase==='app'?30:20;
 const frame=s.phase==='shutdown'?last:systemTransitionFrame(elapsed,last,reduced);
 const main=message('lau_press_pow_u1','');
 const upper:PaneOverrides={T_Top_00:message('lau_press_pow_u0','In Sleep Mode, the system can...'),T_Main_00:{...main,lineAdvanceScales:nativeMessageLineAdvanceScales(renderer.packs.messages,'menu_msbt_LZ','lau_press_pow_u1')},T_Btm_00:message('lau_press_pow5','Close the system to enter Sleep Mode.')};
 const lower:PaneOverrides={T_Top_00:{...message('lau_press_pow0','Software closed.'),visible:s.returnPhase==='app'},T_Btm_00:message('lau_press_pow1','Return to HOME Menu'),T_BtnB_01:message('lau_b_shutdown','Power Off'),T_BtnF_01:message('lau_b_shutdown','Power Off')};
 const lowerBindings=[{name:`Slp_D_00_${clip}`,frame}];
 if(s.phase==='shutdown')lowerBindings.push({name:'Slp_D_00_Decide',frame:systemTransitionFrame(elapsed,10,reduced)});
 const upperDrawn=renderer.draw(top,'sleep','Slp_U_00',{bindings:[{name:`Slp_U_00_${clip}`,frame}],overrides:upper,textSampling:'lcd-spacer-lines',textSamplingPanes:['T_Main_00']});
 const lowerDrawn=renderer.draw(bottom,'sleep','Slp_D_00',{bindings:lowerBindings,overrides:lower,textSampling:'lcd',textSamplingPanes:['T_BtnB_01','T_BtnF_01']});
 if(s.phase==='shutdown')return fade('SceneOut',systemTransitionFrame(elapsed-180,20,reduced))&&upperDrawn&&lowerDrawn;
 return upperDrawn&&lowerDrawn;
}
