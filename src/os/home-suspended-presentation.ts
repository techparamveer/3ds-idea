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

export type HomeSuspendedScaleIdentity = Readonly<{owner:string;captureGeneration:number;resourceGeneration:number;sequence:number}>;
export type HomeSuspendedScalePose = Readonly<{identity:HomeSuspendedScaleIdentity;origin:string;target:0|15;frame:number;update:number}>;
const sameScaleIdentity=(a:HomeSuspendedScaleIdentity|null,b:HomeSuspendedScaleIdentity|null)=>!!a&&!!b
 &&a.owner===b.owner&&a.captureGeneration===b.captureGeneration&&a.resourceGeneration===b.resourceGeneration&&a.sequence===b.sequence;

/** One source step per accepted pair and changed HOME update is a host schedule,
 * not a recovered native ScaleUpDown activation epoch or duration. */
export function createHomeSuspendedScalePresentation(){
 let identity:HomeSuspendedScaleIdentity|null=null,accepted:HomeSuspendedScalePose|undefined,pending:HomeSuspendedScalePose|undefined;
 const reset=()=>{identity=null;accepted=pending=undefined;};
 return {
  sample(next:HomeSuspendedScaleIdentity|null,origin:string,target:0|15,update:number,eligible:boolean,reduced=false):HomeSuspendedScalePose|undefined {
   if(!next){reset();return undefined;}
   if(!next.owner||![next.captureGeneration,next.resourceGeneration,next.sequence,update].every(value=>Number.isSafeInteger(value)&&value>=0))throw new RangeError('Invalid suspended scale identity/update');
   if(!sameScaleIdentity(identity,next)){reset();identity=Object.freeze({...next});}
   if(!eligible){pending=undefined;return undefined;}
   if(pending?.target===target&&pending.origin===origin)return pending;
   const frame=!accepted||reduced?target:accepted.frame+(update>accepted.update?Math.sign(target-accepted.frame):0);
   return pending=Object.freeze({identity:Object.freeze({...next}),origin,target,frame,update:Math.max(update,accepted?.update??update)});
  },
  present(pose:HomeSuspendedScalePose,next:HomeSuspendedScaleIdentity|null,origin:string,target:0|15,eligible:boolean):boolean {
   if(pose!==pending)return false;
   if(!eligible||!sameScaleIdentity(pose.identity,next)||pose.origin!==origin||pose.target!==target){pending=undefined;return false;}
   accepted=pose;pending=undefined;return true;
  },
  ready(next:HomeSuspendedScaleIdentity|null,origin:string,target:0|15){return !!accepted&&sameScaleIdentity(accepted.identity,next)&&accepted.origin===origin&&accepted.target===target&&accepted.frame===target;},
  frame(){return accepted?.frame;},
  revoke(){pending=undefined;},reset,
 };
}
