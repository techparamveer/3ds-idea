import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioMusic} from '../src/os/portfolio-music.ts';
function fixture(){
 const audios=[],events=[];let revision=1,active=true;
 const createAudio=()=>{const a={src:'',preload:'',currentTime:0,duration:120,volume:1,muted:false,onloadedmetadata:null,ontimeupdate:null,onended:null,onerror:null,paused:0,loads:0,plays:0,play(){this.plays++;return Promise.resolve();},pause(){this.paused++;},load(){this.loads++;},removeAttribute(){this.src='';}};audios.push(a);return a;};
 const player=createPortfolioMusic({createAudio,isCurrent:(owner,e)=>active&&owner==='sound-1'&&e.revision===revision,onEvent:(owner,event)=>events.push({owner,event})});
 const effect=(command,extra={})=>({type:'music',command,trackId:'track',revision,...extra});
 return {player,audios,events,effect,set revision(v){revision=v;},set active(v){active=v;}};
}
test('music loads, seeks, reports position, and respects console volume',()=>{
 const f=fixture();f.player.setVolume(.6,true);f.player.execute('sound-1',f.effect('load',{src:'/song.mp3',position:12}));const a=f.audios[0];
 assert.equal(a.volume,.6);assert.equal(a.muted,true);a.onloadedmetadata();assert.equal(a.currentTime,12);assert.equal(f.events[0].event.value.duration,120);
 f.player.execute('sound-1',f.effect('play'));assert.equal(a.plays,1);f.revision=2;f.player.execute('sound-1',f.effect('seek',{position:44}));assert.equal(a.currentTime,44);a.ontimeupdate();assert.equal(f.events.at(-1).event.value.revision,2);
 f.player.dispose();assert.equal(a.src,'');assert.equal(a.ontimeupdate,null);
});
test('release invalidates old callbacks and resumed play reloads saved position',()=>{
 const f=fixture();f.player.execute('sound-1',f.effect('load',{src:'/song.mp3'}));const old=f.audios[0],late=old.onended;
 f.player.release('another-owner');assert.equal(old.src,'/song.mp3');f.player.release('sound-1');late();assert.equal(f.events.length,0);
 f.revision=2;f.player.execute('sound-1',f.effect('play',{src:'/song.mp3',position:32}));const resumed=f.audios[1];resumed.onloadedmetadata();assert.equal(resumed.currentTime,32);assert.equal(resumed.plays,1);assert.equal(old.src,'');
 f.active=false;resumed.onended();assert.equal(f.events.length,1);f.player.dispose();
});
test('stale play rejections cannot report into a replacement track',async()=>{
 const f=fixture();f.player.execute('sound-1',f.effect('load',{src:'/first.mp3'}));let reject;f.audios[0].play=()=>new Promise((_,r)=>{reject=r;});f.player.execute('sound-1',f.effect('play'));
 f.revision=2;f.player.execute('sound-1',f.effect('load',{src:'/second.mp3'}));reject(Error('old'));await Promise.resolve();assert.equal(f.events.length,0);f.player.dispose();
});
