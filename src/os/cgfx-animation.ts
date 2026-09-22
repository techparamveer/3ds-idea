/** Native CGFX curves. Incoming/outgoing slopes are value per native animation frame. */
export type CgfxKey = {Frame:number;Value:number;InSlope:number;OutSlope:number};
export type CgfxCurve = {KeyFrames:CgfxKey[];StartFrame:number;EndFrame:number;PreRepeat:string;PostRepeat:string;InterpolationType:string};
export type CgfxClip = {Name:string;FramesCount:number;AnimationFlags:string};
export type CgfxClipChoice = {name:string;frame?:number};
/** Multiple clips are alternatives controlled by HOME, never an implicit blend. */
export function selectCgfxClips<T extends CgfxClip>(clips:readonly T[], choices?:readonly CgfxClipChoice[]) {
 if(choices===undefined){
  if(clips.length>1)throw new Error('Native model requires explicit animation selection');
  choices=clips.map(clip=>({name:clip.Name}));
 }
 const seen=new Set<string>();
 return choices.map(choice=>{
  const matches=clips.filter(clip=>clip.Name===choice.name);
  if(matches.length!==1||seen.has(choice.name))throw new Error(`Invalid native animation selection ${choice.name}`);
  if(choice.frame!==undefined&&(!Number.isFinite(choice.frame)||choice.frame<0))throw new Error('Invalid native animation checkpoint');
  seen.add(choice.name);return {clip:matches[0],frame:choice.frame};
 });
}
export function cgfxClipFrame(clip:CgfxClip, frame:number):number {
 if(!Number.isFinite(frame))throw new Error('Invalid animation frame');
 const duration=clip.FramesCount;
 return duration>0&&clip.AnimationFlags.includes('IsLooping')?((frame%duration)+duration)%duration:Math.max(0,Math.min(duration,frame));
}
export function sampleCgfxCurve(curve:CgfxCurve|undefined, frame:number, fallback:number):number {
 if(!curve?.KeyFrames.length)return fallback;
 if(!Number.isFinite(frame))throw new Error('Invalid animation frame');
 const keys=curve.KeyFrames,duration=curve.EndFrame-curve.StartFrame;
 const repeat=frame>curve.EndFrame?curve.PostRepeat:frame<curve.StartFrame?curve.PreRepeat:'None';
 if(duration>0&&(repeat==='Repeat'||repeat==='MirroredRepeat')){
  let local=((frame-curve.StartFrame)%duration+duration)%duration;
  if(repeat==='MirroredRepeat'&&Math.abs(Math.floor((frame-curve.StartFrame)/duration))%2)local=duration-local;
  frame=curve.StartFrame+local;
 }
 if(frame<=keys[0].Frame)return keys[0].Value;
 if(frame>=keys[keys.length-1].Frame)return keys[keys.length-1].Value;
 let a=keys[0],b=keys[1];
 for(let i=1;i<keys.length;i++){b=keys[i];if(frame<=b.Frame)break;a=b;}
 const span=b.Frame-a.Frame,t=(frame-a.Frame)/span;
 if(curve.InterpolationType==='Step')return a.Value;
 if(curve.InterpolationType==='Linear')return a.Value+(b.Value-a.Value)*t;
 return (2*t*t*t-3*t*t+1)*a.Value+(t*t*t-2*t*t+t)*span*a.OutSlope+(-2*t*t*t+3*t*t)*b.Value+(t*t*t-t*t)*span*b.InSlope;
}
