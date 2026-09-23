import type {AppEffect,AppEvent} from './app-types.ts';
type MusicEffect=Extract<AppEffect,{type:'music'}>;
export type PortfolioAudio=Pick<HTMLAudioElement,'src'|'preload'|'currentTime'|'duration'|'volume'|'muted'|'onloadedmetadata'|'ontimeupdate'|'onended'|'onerror'|'play'|'pause'|'load'|'removeAttribute'>;

/** One foreground music owner. Replaced audio objects and old play promises
 * cannot report into a newer track or app instance. */
export function createPortfolioMusic(options:{createAudio?:()=>PortfolioAudio;isCurrent:(owner:string,effect:MusicEffect)=>boolean;onEvent:(owner:string,event:AppEvent)=>void}){
 let audio:PortfolioAudio|undefined,owner='',effect:MusicEffect|undefined,generation=0,disposed=false,volume=.35,muted=false,pendingPosition:number|undefined;
 const clear=()=>{generation++;if(audio){audio.onloadedmetadata=audio.ontimeupdate=audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();}audio=undefined;effect=undefined;owner='';pendingPosition=undefined;};
 function handlers(){
  if(!audio||!effect)return;
  const target=audio,selected=effect,identity=owner,ticket=generation;
  const current=()=>!disposed&&ticket===generation&&target===audio&&selected===effect&&options.isCurrent(identity,selected);
  const emit=(id:string)=>{if(current())options.onEvent(identity,{type:'action',id,value:{trackId:selected.trackId,revision:selected.revision,position:Number.isFinite(target.currentTime)?target.currentTime:0,...(Number.isFinite(target.duration)?{duration:target.duration}:{})}});};
  target.ontimeupdate=()=>emit('music-time');target.onended=()=>emit('music-ended');target.onerror=()=>emit('music-error');
  target.onloadedmetadata=()=>{if(!current())return;if(pendingPosition!==undefined){target.currentTime=pendingPosition;pendingPosition=undefined;}emit('music-time');};
 }
 return {
  execute(nextOwner:string,next:MusicEffect){
   if(disposed)return;
   if(next.command==='pause'){
    if(nextOwner!==owner)return;
    effect={...next};handlers();audio?.pause();return;
   }
   if(!options.isCurrent(nextOwner,next))return;
   if(next.command==='load'||(next.command==='play'&&(!audio||owner!==nextOwner||effect?.trackId!==next.trackId))){
    clear();if(!next.src)return;
    owner=nextOwner;effect={...next};audio=(options.createAudio??(()=>new Audio()))();
    audio.preload='metadata';audio.volume=volume;audio.muted=muted;pendingPosition=Math.max(0,next.position??0);handlers();audio.src=next.src;audio.load();if(next.command==='load')return;
   }
   if(nextOwner!==owner||!audio||next.trackId!==effect?.trackId)return;
   effect={...next};handlers();
   if(next.command==='seek'){
    const position=Math.max(0,Number.isFinite(next.position)?next.position!:0);
    try{audio.currentTime=position;pendingPosition=undefined;}catch{pendingPosition=position;}
   }else if(next.command==='play'){
    const target=audio,selected=effect,ticket=generation,identity=owner;
    void target.play().catch(()=>{if(!disposed&&generation===ticket&&effect===selected&&options.isCurrent(identity,selected))options.onEvent(identity,{type:'action',id:'music-error',value:{trackId:selected.trackId,revision:selected.revision}});});
   }
  },
  release(releasedOwner?:string){if(releasedOwner===undefined||releasedOwner===owner)clear();},
  setVolume(nextVolume:number,nextMuted:boolean){volume=Math.max(0,Math.min(1,Number.isFinite(nextVolume)?nextVolume:.35));muted=nextMuted;if(audio){audio.volume=volume;audio.muted=muted;}},
  dispose(){if(disposed)return;disposed=true;clear();},
 };
}
