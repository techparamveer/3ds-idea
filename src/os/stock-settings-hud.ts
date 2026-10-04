import { chargingBatteryFrame, hudColonVisible } from './device-status-profile.ts';

/** Settings HUD update 0x2389b8, constructor 0x23986c, EUR 10.7.0-32E.
 * Calendar dates are injected by presentation; elapsed updates belong to the
 * Settings instance. Hardware status remains the declared charging adaptation. */
export const SETTINGS_HUD_HZ=268111856/4481136;
export type SettingsHudPose={dateMs:number;colonVisible:boolean;batteryFrame:4|5};
export type SettingsHudSample=SettingsHudPose&{updates:number;counter:number;displayedDateMs:number};
export function settingsHudUpdate(state:SettingsHudSample,dateMs:number):SettingsHudSample{
  const counter=state.counter,next={...state,updates:state.updates+1};
  if(counter<=0){
    next.dateMs=dateMs;
    next.colonVisible=hudColonVisible(new Date(state.displayedDateMs).getSeconds());
    next.displayedDateMs=dateMs;
  }
  if(counter===2||counter<0)next.batteryFrame=chargingBatteryFrame(new Date(next.dateMs).getSeconds());
  next.counter=counter<=0?29:counter-1;
  return next;
}
/** Replays missed source updates between paints. Linear wall-time interpolation
 * is the browser adapter; already sampled values survive repaint, suspension
 * and wall-clock changes until their source refresh branch executes. */
export function sampleSettingsHud(previous:SettingsHudSample|null,elapsedMs:number,dateMs:number):SettingsHudSample{
  if(!Number.isFinite(dateMs))throw new Error('Invalid Settings HUD calendar sample');
  const elapsed=Math.max(0,Number.isFinite(elapsedMs)?elapsedMs:0);
  const updates=Math.floor(elapsed*SETTINGS_HUD_HZ/1000),origin=dateMs-elapsed;
  let state=previous;
  if(!state||updates<state.updates){
    // Constructor proves counter=-1. Its prior date's seconds are not proven;
    // zero is an explicit first-update adaptation, overwritten on that update.
    const initialDate=origin;
    state=settingsHudUpdate({updates:-1,counter:-1,dateMs:initialDate,displayedDateMs:0,colonVisible:true,batteryFrame:4},initialDate);
  }
  for(let i=state.updates+1;i<=updates;i++)state=settingsHudUpdate(state,origin+i*1000/SETTINGS_HUD_HZ);
  return state;
}
