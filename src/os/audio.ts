export type Sound='select'|'open'|'back'|'home'|'power'|'touch'|'grab'|'drop';
/** Original HOME effects, loaded locally. Never queue sounds before a gesture. */
export function createMenuAudio(){
 let context:AudioContext|undefined,disposed=false,lastPlayed:Sound|undefined;
 const buffers=new Map<Sound,AudioBuffer>();const active=new Set<AudioBufferSourceNode>();
 const names:Sound[]=['select','open','back','home','power','touch','grab','drop'];
 const bytes=Promise.all(names.map(async name=>{try{return [name,await (await fetch(`/os/audio/${name}.wav`)).arrayBuffer()] as const;}catch{return null;}}));
 async function unlock(){if(disposed)return;if(!context){context=new AudioContext();const ctx=context;void bytes.then(async items=>{for(const item of items)if(item&&!disposed){try{buffers.set(item[0],await ctx.decodeAudioData(item[1]));}catch{}}});}if(context.state==='suspended')await context.resume().catch(()=>{});}
 function stop(){for(const source of active)source.stop();active.clear();}
 function play(name:Sound,muted:boolean,volume:number){if(disposed||muted||!context||context.state!=='running')return;const buffer=buffers.get(name);if(!buffer)return;stop();const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=volume;source.connect(gain);gain.connect(context.destination);active.add(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};source.start();lastPlayed=name;}
 return {unlock,play,stop,status(){return {state:context?.state??'locked',decoded:buffers.size,lastPlayed};},dispose(){disposed=true;stop();void context?.close();}};
}
