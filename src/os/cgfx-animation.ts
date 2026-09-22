/** Native CGFX curves. Incoming/outgoing slopes are value per native animation frame. */
export type CgfxKey = {Frame:number;Value:number;InSlope:number;OutSlope:number};
export type CgfxCurve = {KeyFrames:CgfxKey[];StartFrame:number;EndFrame:number;PreRepeat:string;PostRepeat:string;InterpolationType:string};
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
