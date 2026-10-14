import type { MenuState } from './state.ts';
import { homeSuspendedApplication } from './home-suspended-window.ts';

export const HOME_SUSPENDED_SLEEP_FRAMES = 120;

export type HomeSuspendedPresentation = Readonly<{
 owner: string | null;
 observedUpdate: number | null;
 sleepFrame: number;
}>;

export function createHomeSuspendedPresentation(): HomeSuspendedPresentation {
 return Object.freeze({owner:null,observedUpdate:null,sleepFrame:0});
}

function bind(owner:string,observedUpdate:number):HomeSuspendedPresentation {
 return Object.freeze({owner,observedUpdate,sleepFrame:0});
}

/**
 * Samples the shared HOME logical update count without advancing it. The source
 * clip is owner-relative: selection and modal changes preserve its phase, while
 * losing presentation eligibility or replacing the suspended application
 * discards the old phase. Starting at frame zero is a host epoch adaptation
 * until the native activation boundary is traced.
 */
export function syncHomeSuspendedPresentation(
 presentation:HomeSuspendedPresentation,
 state:MenuState,
 reducedMotion=false,
):HomeSuspendedPresentation {
 const application=homeSuspendedApplication(state);
 if(!application)return presentation.owner===null?presentation:createHomeSuspendedPresentation();
 const update=state.system!.homeClock.updateCount;
 if(!Number.isSafeInteger(update)||update<0)throw new RangeError('Invalid HOME suspended update count');
 if(presentation.owner!==application.id||presentation.observedUpdate===null||update<presentation.observedUpdate)return bind(application.id,update);
 if(reducedMotion){
  if(presentation.sleepFrame===0&&presentation.observedUpdate===update)return presentation;
  return Object.freeze({owner:application.id,observedUpdate:update,sleepFrame:0});
 }
 const updates=update-presentation.observedUpdate;
 if(updates===0)return presentation;
 return Object.freeze({owner:application.id,observedUpdate:update,sleepFrame:(presentation.sleepFrame+updates)%HOME_SUSPENDED_SLEEP_FRAMES});
}

export function getHomeSuspendedSleepFrame(presentation:HomeSuspendedPresentation):number {
 return presentation.sleepFrame;
}
