import type { AppReduction, AppState, AppView } from './app-types.ts';
import type { AnimationBinding } from './native-layout.ts';

/** eShop welcome controller 0x2e4498 and its task passes
 * (eshop-welcome-lifecycle-source-audit.md). App init 0x2e4e00 sets the swap
 * interval to two VSyncs (0x2eb2fc(2)), so one pass is 1/30 s at a nominal
 * 60 Hz VSync. Pass n shows in_00 frame n; the constructor also starts the
 * BG curtain reveal, so both animators share that epoch. */
export const ESHOP_WELCOME_PASS_HZ=30;
/** Longest host step credited to the welcome; native animation is pass-locked. */
export const ESHOP_WELCOME_STEP_LIMIT_MS=250;
export const ESHOP_WELCOME_BALLOON_PASS=11,ESHOP_WELCOME_WAIT_PASS=69,ESHOP_WELCOME_WAIT_FRAMES=75;
/** 0x2e4380 first runs the pass after balloonIn starts; BG is idle from pass 4. */
export const ESHOP_WELCOME_OK_PASS=12;
export const ESHOP_CURTAIN_LAST_FRAME=4,ESHOP_OUT_00_LAST_FRAME=15,ESHOP_OUT_01_LAST_FRAME=4;
/** out_00 start to out_01 start (0x2e415c), and to 0x2e4248 removing its task. */
const OUT_01_AFTER=15,EXIT_AFTER=20;

export function eshopWelcomePass(foregroundMs:number){return Math.floor(Math.max(0,foregroundMs)*ESHOP_WELCOME_PASS_HZ/1000);}
/** 0x2e4058 waits while task +0x3b0 is active; that task removes itself at pass 69. */
export function eshopExitStartPass(decided:number){return Math.max(decided+1,ESHOP_WELCOME_WAIT_PASS+1);}
export function eshopExitEndPass(decided:number){return eshopExitStartPass(decided)+EXIT_AFTER;}

function entrance(n:number):AnimationBinding[]{
  const entered={name:'welcome_U_00_in_00',frame:10},balloon={name:'welcome_U_00_balloonIn_00',frame:58};
  // The pass that starts a clip also ticks it, so balloonIn and wait first show frame 1.
  if(n<ESHOP_WELCOME_BALLOON_PASS)return [{name:entered.name,frame:n}];
  if(n<ESHOP_WELCOME_WAIT_PASS)return [entered,{name:balloon.name,frame:n-ESHOP_WELCOME_BALLOON_PASS+1}];
  return [entered,balloon,{name:'welcome_U_00_wait_00',frame:(n-ESHOP_WELCOME_WAIT_PASS+1)%ESHOP_WELCOME_WAIT_FRAMES}];
}
/** One welcome_U_00 animator: each replaced clip persists only through its last
 * applied pose, so earlier clips are listed first. Without a pass (reduced
 * motion or no clock) the settled entrance pose is held. */
export function eshopWelcomeBindings(pass?:number,decided?:number):AnimationBinding[]{
  if(pass===undefined||!Number.isFinite(pass))return entrance(ESHOP_WELCOME_WAIT_PASS-1);
  const n=Math.max(0,Math.floor(pass));
  if(decided===undefined||!Number.isFinite(decided))return entrance(n);
  const start=eshopExitStartPass(decided);
  if(n<start)return entrance(n);
  const held=entrance(start-1),out00=Math.min(ESHOP_OUT_00_LAST_FRAME,n-start+1);
  if(n<start+OUT_01_AFTER)return [...held,{name:'welcome_U_00_out_00',frame:out00}];
  return [...held,{name:'welcome_U_00_out_00',frame:ESHOP_OUT_00_LAST_FRAME},{name:'welcome_U_00_out_01',frame:Math.min(ESHOP_OUT_01_LAST_FRAME,n-start-OUT_01_AFTER+1)}];
}
/** BG_U/D_00_inOut_00 frame of the priority-1.0 curtain, or null at frame 4
 * (N_root_00 alpha 0). The splash leaves it covered at frame 0; the
 * constructor plays it forward and 0x2e415c plays it back with out_01. */
export function eshopCurtainFrame(pass?:number,decided?:number):number|null{
  if(pass===undefined||!Number.isFinite(pass))return null;
  const n=Math.max(0,Math.floor(pass));
  if(decided!==undefined&&Number.isFinite(decided)){
    const cover=eshopExitStartPass(decided)+OUT_01_AFTER;
    // The covering pass ticks the reversed clip once: 4 → 3.
    if(n>=cover)return Math.max(0,ESHOP_CURTAIN_LAST_FRAME-1-(n-cover));
  }
  return n<ESHOP_CURTAIN_LAST_FRAME?n:null;
}

const decidedPass=(state:AppState)=>typeof state.welcomeDecidedPass==='number'&&Number.isFinite(state.welcomeDecidedPass)?state.welcomeDecidedPass:undefined;
const elapsed=(state:AppState)=>typeof state.welcomeElapsed==='number'&&Number.isFinite(state.welcomeElapsed)?state.welcomeElapsed:0;
export function eshopWelcomeOkEnabled(state:AppState){return decidedPass(state)===undefined&&eshopWelcomePass(elapsed(state))>=ESHOP_WELCOME_OK_PASS;}
/** OK decide 0x2e3f90: accepted only while 0x291450 has the button enabled;
 * it then disables the button and schedules 0x2e4058. */
export function eshopWelcomeDecide(state:AppState):AppState{
  return eshopWelcomeOkEnabled(state)?{...state,welcomeDecidedPass:eshopWelcomePass(elapsed(state))}:state;
}
/** Ticks advance only the active owner. Adaptation: native proceeds to the
 * excluded network step when 0x2e4248 removes its task; the browser returns
 * HOME there and resets, so a resumed title restarts the welcome covered. */
export function eshopWelcomeTick(state:AppState,elapsedMs:number):AppReduction{
  if(!Number.isFinite(elapsedMs)||elapsedMs<=0)return {state};
  const ms=elapsed(state)+Math.min(ESHOP_WELCOME_STEP_LIMIT_MS,elapsedMs),decided=decidedPass(state);
  if(decided!==undefined&&eshopWelcomePass(ms)>=eshopExitEndPass(decided)){
    const next:AppState={...state,welcomeElapsed:0};delete next.welcomeDecidedPass;
    return {state:next,effects:[{type:'home'}]};
  }
  return {state:{...state,welcomeElapsed:ms}};
}
/** View data carries passes, not milliseconds, so paints key once per pass. */
export function eshopWelcomeData(state:AppState):AppState{
  const decided=decidedPass(state);
  return {welcomePass:eshopWelcomePass(elapsed(state)),...(decided===undefined?{}:{welcomeDecidedPass:decided})};
}
export type EshopWelcomePose={upper:AnimationBinding[];curtain:number|null};
export function eshopWelcomePose(view:AppView,reducedMotion=false):EshopWelcomePose{
  const pass=reducedMotion?undefined:view.data?.welcomePass,decided=view.data?.welcomeDecidedPass;
  const n=typeof pass==='number'?pass:undefined,d=typeof decided==='number'?decided:undefined;
  return {upper:eshopWelcomeBindings(n,d),curtain:eshopCurtainFrame(n,d)};
}
