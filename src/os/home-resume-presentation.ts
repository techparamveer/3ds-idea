export const HOME_RESUME_LAST_FRAME = 40;
export type HomeResumeIdentity = Readonly<{ owner: string; captureGeneration: number; resourceGeneration: number }>;
export type HomeResumePose = Readonly<{ identity: HomeResumeIdentity; frame: number; observedMs: number; destination: object | null }>;
export type HomeResumeBackgroundPresentation = Readonly<{
 skeletal: readonly [Readonly<{ clip: 'BannerBG_SceneOut'; frame: number }>];
 material: readonly [Readonly<{ clip: 'BannerBG_AppPause'; frame: 20 }>, Readonly<{ clip: 'BannerBG_AppRestart'; frame: number }>];
}>;

export function sameHomeResumeIdentity(a:HomeResumeIdentity|null,b:HomeResumeIdentity|null):boolean {
 return !!a&&!!b&&a.owner===b.owner&&a.captureGeneration===b.captureGeneration&&a.resourceGeneration===b.resourceGeneration;
}

export function homeResumeBackground(frame:number):HomeResumeBackgroundPresentation {
 if(!Number.isSafeInteger(frame)||frame<0||frame>HOME_RESUME_LAST_FRAME)throw new RangeError('Invalid HOME resume frame');
 // AppRestart's decoded keys are local to its authored StartFrame 20.
 return {skeletal:[{clip:'BannerBG_SceneOut',frame}],material:[{clip:'BannerBG_AppPause',frame:20},{clip:'BannerBG_AppRestart',frame:Math.max(0,frame-20)}]};
}

/** Source frames advance once per successful visible pair, not by wall-clock
 * duration. This host cadence and the shared source epoch are adaptations. */
export function createHomeResumePresentation(){
 let identity:HomeResumeIdentity|null=null,frame=-1,observedMs=-Infinity,complete=false,pending:HomeResumePose|undefined;
 return {
  sample(next:HomeResumeIdentity,now:number,eligible:boolean,destination:object|null,reduced=false):HomeResumePose|undefined {
   if(!next.owner||!Number.isSafeInteger(next.captureGeneration)||next.captureGeneration<0
    ||!Number.isSafeInteger(next.resourceGeneration)||next.resourceGeneration<0||!Number.isFinite(now))throw new RangeError('Invalid HOME resume identity');
   if(!sameHomeResumeIdentity(identity,next)){identity=Object.freeze({...next});frame=-1;observedMs=-Infinity;complete=false;pending=undefined;}
   if(!identity||!eligible||complete)return undefined;
   return pending??=Object.freeze({identity,frame:reduced?HOME_RESUME_LAST_FRAME:Math.min(HOME_RESUME_LAST_FRAME,Math.max(0,frame+(now>observedMs?1:0))),observedMs:now,destination});
  },
  present(pose:HomeResumePose,next:HomeResumeIdentity|null,eligible:boolean,destination:object|null):boolean {
   if(pose!==pending)return false;
   if(!eligible||!sameHomeResumeIdentity(identity,next)||pose.destination!==destination){pending=undefined;return false;}
   frame=pose.frame;observedMs=pose.observedMs;pending=undefined;
   if(frame===HOME_RESUME_LAST_FRAME&&destination!==null)complete=true;
   return true;
  },
  active(next:HomeResumeIdentity|null){return sameHomeResumeIdentity(identity,next)&&!complete;},
  ready(next:HomeResumeIdentity|null){return sameHomeResumeIdentity(identity,next)&&complete;},
  revoke(){pending=undefined;},
  reset(){identity=null;frame=-1;observedMs=-Infinity;complete=false;pending=undefined;},
 };
}
