/** Browser presentation clock. Source clips provide poses; hardware boot latency
 * and native scheduling are not inferred from these elapsed-time durations. */
export const SYSTEM_TRANSITIONS={boot:3000,launch:2100,shutdown:550} as const;
export function systemTransitionDuration(phase:string,reduced=false):number{
 if(phase==='boot')return reduced?300:SYSTEM_TRANSITIONS.boot;
 if(phase==='launch')return reduced?120:SYSTEM_TRANSITIONS.launch;
 if(phase==='shutdown')return reduced?120:SYSTEM_TRANSITIONS.shutdown;
 return Infinity;
}
export function systemTransitionFrame(elapsedMs:number,lastFrame:number,reduced=false):number{
 return reduced?lastFrame:Math.max(0,Math.min(lastFrame,Math.floor(Math.max(0,elapsedMs)*60/1000)));
}

/** Native launch clips A/B/C contain60/30/15 frames, after the HOME20-frame fade. */
export function appLaunchLogoFrame(elapsedMs:number,reduced=false):{clip:'A'|'B'|'C';frame:number}|null{
 if(reduced)return {clip:'B',frame:15};
 const frame=Math.floor(Math.max(0,elapsedMs)*60/1000)-20;
 if(frame<0)return null;
 if(frame<60)return {clip:'A',frame};
 if(frame<90)return {clip:'B',frame:frame-60};
 return {clip:'C',frame:Math.min(15,frame-90)};
}
