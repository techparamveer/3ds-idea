/** Browser presentation clock. Source clips provide poses; hardware boot latency
 * and native scheduling are not inferred from these elapsed-time durations. */
export const SYSTEM_TRANSITIONS={boot:3000,launch:2100,shutdown:1200} as const;
export function systemTransitionDuration(phase:string,reduced=false):number{
 if(phase==='boot')return reduced?300:SYSTEM_TRANSITIONS.boot;
 if(phase==='launch')return reduced?120:SYSTEM_TRANSITIONS.launch;
 if(phase==='shutdown')return reduced?120:SYSTEM_TRANSITIONS.shutdown;
 return Infinity;
}
export function systemTransitionFrame(elapsedMs:number,lastFrame:number,reduced=false):number{
 return reduced?lastFrame:Math.max(0,Math.min(lastFrame,Math.floor(Math.max(0,elapsedMs)*60/1000)));
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
const LAUNCH_FADE_MS=350;

/** NintendoLogo SceneOutA/B/C (60/30/15) from the start of the logo stage.
 * 105 source frames at nominal 60Hz are 1750ms; not measured title-load latency. */
export function appLaunchLogoFrame(logoElapsedMs:number,reduced=false):AppLaunchLogoPose{
 if(reduced)return {clip:'B',frame:15};
 const frame=Math.floor(Math.max(0,logoElapsedMs)*60/1000);
 if(frame<60)return {clip:'A',frame};
 if(frame<90)return {clip:'B',frame:frame-60};
 return {clip:'C',frame:Math.min(14,frame-90)};
}

/** Native captures fade HOME to exact black before the first logo pixel. The
 * paired `CmnFadeNinLogo_*_SceneOut` fade (21 poses, 350ms at nominal 60Hz
 * including its terminal pose) therefore runs first; the complete logo clips
 * then play over its terminal black, 2100ms in total. The captures establish
 * only this order, so the browser clock remains an adaptation. Reduced motion
 * keeps terminal black under the existing B15 logo endpoint. */
export function appLaunchPose(elapsedMs:number,reduced=false):AppLaunchPose{
 if(reduced)return {fadeFrame:LAUNCH_FADE_LAST_FRAME,logo:appLaunchLogoFrame(0,true)};
 const elapsed=Math.max(0,elapsedMs);
 if(elapsed<LAUNCH_FADE_MS)return {fadeFrame:Math.min(LAUNCH_FADE_LAST_FRAME,Math.floor(elapsed*60/1000)),logo:null};
 return {fadeFrame:LAUNCH_FADE_LAST_FRAME,logo:appLaunchLogoFrame(elapsed-LAUNCH_FADE_MS)};
}
