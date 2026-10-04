/** Browser presentation clock. Source clips provide poses; hardware boot latency
 * and native scheduling are not inferred from these elapsed-time durations. */
/** Launch is 191 nominal 60Hz frames: see `appLaunchPose`. */
export const SYSTEM_TRANSITIONS={boot:3000,launch:191*1000/60,shutdown:1200} as const;
export function systemTransitionDuration(phase:string,reduced=false):number{
 if(phase==='boot')return reduced?300:SYSTEM_TRANSITIONS.boot;
 if(phase==='launch')return reduced?120:SYSTEM_TRANSITIONS.launch;
 if(phase==='shutdown')return reduced?120:SYSTEM_TRANSITIONS.shutdown;
 return Infinity;
}
export function systemTransitionFrame(elapsedMs:number,lastFrame:number,reduced=false):number{
 // The epsilon keeps exact 60Hz grid samples on their frame despite fractional stage origins.
 return reduced?lastFrame:Math.max(0,Math.min(lastFrame,Math.floor(Math.max(0,elapsedMs)*60/1000+1e-9)));
}

const SHUTDOWN_DECIDE_LAST_FRAME=10;
const SHUTDOWN_SLEEP_LAST_FRAME=60;
const SHUTDOWN_SOURCE_LAST_FRAME=SHUTDOWN_DECIDE_LAST_FRAME+SHUTDOWN_SLEEP_LAST_FRAME;

export type ShutdownTransitionPose={decideFrame:number;sleepSceneOutFrame:number};

/** Browser-adapted nominal-60Hz shutdown composition. Native captures identify
 * Decide followed by the paired sleep SceneOut poses, but do not establish a
 * wall clock. The 1200ms host duration leaves the terminal sleep pose selected
 * for roughly one 30Hz LCD interval before logical power-off. Reduced motion
 * suppresses movement and holds the same terminal source pair for its 120ms
 * shutdown phase. */
export function shutdownTransitionPose(elapsedMs:number,reduced=false):ShutdownTransitionPose{
 if(reduced)return {decideFrame:SHUTDOWN_DECIDE_LAST_FRAME,sleepSceneOutFrame:SHUTDOWN_SLEEP_LAST_FRAME};
 const sourceFrame=Math.max(0,Math.min(SHUTDOWN_SOURCE_LAST_FRAME,Math.floor(Math.max(0,elapsedMs)*60/1000)));
 return {
  decideFrame:Math.min(SHUTDOWN_DECIDE_LAST_FRAME,sourceFrame),
  sleepSceneOutFrame:Math.max(0,sourceFrame-SHUTDOWN_DECIDE_LAST_FRAME),
 };
}

const BOOT_REVEAL_LAST_FRAME=20;
const BOOT_REVEAL_MS=350;
const REDUCED_BOOT_REVEAL_MS=120;

/** Schedule every authored SceneIn pose inside the browser boot window. The
 * normal 350ms window is exactly 21 source poses at 60Hz, including a final
 * transparent-pose dwell; neither this clock nor the reduced clock is native
 * cold-boot timing evidence. */
export function bootRevealFrame(elapsedMs:number,reduced=false):number{
 const duration=systemTransitionDuration('boot',reduced);
 const revealMs=reduced?REDUCED_BOOT_REVEAL_MS:BOOT_REVEAL_MS;
 const revealElapsed=Math.max(0,elapsedMs-(duration-revealMs));
 return Math.min(BOOT_REVEAL_LAST_FRAME,Math.floor(revealElapsed*(BOOT_REVEAL_LAST_FRAME+1)/revealMs));
}

export type AppLaunchLogoPose={clip:'A'|'B'|'C';frame:number};
export type AppLaunchPose=Readonly<{fadeFrame:number;logo:AppLaunchLogoPose|null}>;

const LAUNCH_FADE_LAST_FRAME=20;
const LAUNCH_FRAME_MS=1000/60;
/** Native shows the launching Open's LncBtmBtn_02_Decide (pressed, then its
 * released highlight) on intact HOME before any fade (N065..N073). Its six
 * source frames are followed by a four-frame hold of Decide5, fitted to the
 * native fade grid (N074..N086 match SceneOut poses 1..20 at a steady rate,
 * placing pose 0 five or six frames after Decide5 first shows). The fade,
 * footer SceneOut and decide ring start after these ten frames. */
export const LAUNCH_FADE_START_MS=10*LAUNCH_FRAME_MS;
/** The 21-pose fade holds its terminal black for ten further frames before
 * logo pose 0, fitted to the native fade and logo grids (N086..N092 black;
 * logo pose 0 about 10.7 frames after fade pose 20). */
const LAUNCH_LOGO_START_MS=31*LAUNCH_FRAME_MS;

/** Native loops the 30-frame SceneOutB while the title loads. The Health
 * capture shows two complete B passes between A and C (N052..N092), so the
 * browser plays two; the count is a fitted adaptation of Azahar's load wait. */
const LAUNCH_LOGO_B_PASSES=2;
const LAUNCH_LOGO_C_START=60+30*LAUNCH_LOGO_B_PASSES;

/** NintendoLogo SceneOutA (60), looping SceneOutB and SceneOutC (15) from the
 * start of the logo stage; C14 is black and holds until the deadline. */
export function appLaunchLogoFrame(logoElapsedMs:number,reduced=false):AppLaunchLogoPose{
 if(reduced)return {clip:'B',frame:15};
 const frame=Math.floor(Math.max(0,logoElapsedMs)*60/1000+1e-9);
 if(frame<60)return {clip:'A',frame};
 if(frame<LAUNCH_LOGO_C_START)return {clip:'B',frame:(frame-60)%30};
 return {clip:'C',frame:Math.min(14,frame-LAUNCH_LOGO_C_START)};
}

/** Native captures fade HOME to exact black before the first logo pixel. After
 * the Open Decide stage, the paired `CmnFadeNinLogo_*_SceneOut` fade (21
 * poses) runs and holds black; the logo clips then play over its terminal
 * black, and C14's black holds sixteen frames before the application (native
 * N101/N102..N111, 15.3-17.7 frames on the 5% playback grid): 10 + 31 +
 * (60 + 60 + 15) + 15 = 191 frames. The decide hold, black dwell, B passes
 * and C14 hold are fitted to Azahar's frame grid, not traced dispatch, so the
 * browser clock remains an adaptation. Reduced motion keeps terminal black under the
 * existing B15 logo endpoint. */
export function appLaunchPose(elapsedMs:number,reduced=false):AppLaunchPose{
 if(reduced)return {fadeFrame:LAUNCH_FADE_LAST_FRAME,logo:appLaunchLogoFrame(0,true)};
 const elapsed=Math.max(0,elapsedMs-LAUNCH_FADE_START_MS);
 if(elapsed<LAUNCH_LOGO_START_MS)return {fadeFrame:Math.min(LAUNCH_FADE_LAST_FRAME,Math.floor(elapsed*60/1000+1e-9)),logo:null};
 return {fadeFrame:LAUNCH_FADE_LAST_FRAME,logo:appLaunchLogoFrame(elapsed-LAUNCH_LOGO_START_MS)};
}
