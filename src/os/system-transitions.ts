/** Browser presentation clock. Source clips provide poses; hardware boot latency
 * and native scheduling are not inferred from these elapsed-time durations. */
export const SYSTEM_TRANSITIONS={boot:3000,launch:1750,shutdown:550} as const;
export function systemTransitionDuration(phase:string,reduced=false):number{
 if(phase==='boot')return reduced?300:SYSTEM_TRANSITIONS.boot;
 if(phase==='launch')return reduced?120:SYSTEM_TRANSITIONS.launch;
 if(phase==='shutdown')return reduced?120:SYSTEM_TRANSITIONS.shutdown;
 return Infinity;
}
export function systemTransitionFrame(elapsedMs:number,lastFrame:number,reduced=false):number{
 return reduced?lastFrame:Math.max(0,Math.min(lastFrame,Math.floor(Math.max(0,elapsedMs)*60/1000)));
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

/** HOME `CmnFadeNinLogo` SceneOutA/B/C (60/30/15) run with the matching logo clips.
 * 105 source frames at nominal 60Hz are 1750ms; not measured title-load latency. */
export function appLaunchLogoFrame(elapsedMs:number,reduced=false):{clip:'A'|'B'|'C';frame:number}{
 if(reduced)return {clip:'B',frame:15};
 const frame=Math.floor(Math.max(0,elapsedMs)*60/1000);
 if(frame<60)return {clip:'A',frame};
 if(frame<90)return {clip:'B',frame:frame-60};
 return {clip:'C',frame:Math.min(15,frame-90)};
}
