import type { InputLatch } from './app-input';
import type { AppEvent } from './app-types';
import type { NativeScreenStatus } from './stock-screen-presentation';

/** Authored browser recovery controls, in lower LCD pixels. */
export const NATIVE_RECOVERY_TARGETS=[
  {action:'home',x:20,y:170,width:130,height:38},
  {action:'retry',x:170,y:170,width:130,height:38},
] as const;
type Decision='pass'|'block'|'home'|'retry';
function target(x:number,y:number){return NATIVE_RECOVERY_TARGETS.find(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height)?.action;}
/** Controls started against an unavailable frame cannot activate a later frame.
 * This gate owns only browser input eligibility; reducers remain resource-free. */
export function createNativeScreenInputGate(){
  const buttons=new Set<string>(),analogs=new Set<string>();
  const touches=new Map<number,'home'|'retry'|undefined>();
  function decide(event:AppEvent,status:NativeScreenStatus):Decision{
    const blocked=status==='loading'||status==='error';
    if(event.type==='button'){
      if(buttons.has(event.source)){if(event.phase==='up')buttons.delete(event.source);return 'block';}
      if(!blocked||event.command==='power')return 'pass';
      if(event.phase!=='down')return 'block';
      buttons.add(event.source);
      return event.command==='back'||event.command==='home'?'home':event.command==='open'&&status==='error'?'retry':'block';
    }
    if(event.type==='analog'){
      if(analogs.has(event.source)){if(Math.hypot(event.x,event.y)<.28)analogs.delete(event.source);return 'block';}
      if(blocked){if(Math.hypot(event.x,event.y)>=.28)analogs.add(event.source);return 'block';}
      return 'pass';
    }
    if(event.type==='touch'){
      const id=event.pointerId??0;
      if(touches.has(id)){
        const started=touches.get(id);
        if(event.phase==='up'||event.phase==='cancel')touches.delete(id);
        return event.phase==='up'&&status==='error'&&started&&started===target(event.x,event.y)?started:'block';
      }
      if(!blocked)return 'pass';
      if(event.phase==='down')touches.set(id,status==='error'?target(event.x,event.y):undefined);
      return 'block';
    }
    if(!blocked)return 'pass';
    if(event.type==='command')return event.command==='power'?'pass':event.command==='back'||event.command==='home'?'home':event.command==='open'&&status==='error'?'retry':'block';
    return 'block';
  }
  decide.cancelHeld=(latch:InputLatch)=>{
    for(const source of Object.keys(latch.held))buttons.add(source);
    for(const source of Object.keys(latch.analog))analogs.add(source);
    if(latch.touch)touches.set(latch.touch.pointerId,undefined);
  };
  return decide;
}
