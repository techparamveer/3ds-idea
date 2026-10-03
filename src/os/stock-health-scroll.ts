/**
 * EUR Health and Safety article input, one update per LCD VBlank, as replayed by
 * scripts/replay_health_touch_scroll.py: HID sampler 0x13a5d0, manager 0x1015d4
 * (Down, Up, G_Touch, SlideBar), controller 0x153868 and SlideBar_Select. State
 * is JSON so the reducer stays pure. See docs/health-touch-scroll-source-audit.md.
 */
export type HealthScrollKey='up'|'down';
type Vec=[number,number];
type Owner={state:number;owns:boolean};
export type HealthScrollState={
  maxRow:number;extent:number;row:number;residual:number;armed:boolean;
  stylus:Vec|null;latched:Vec|null;keys:number;taps:number;
  held:boolean;prevHeld:boolean;filtered:Vec;point:Vec;prevKeys:number;
  touch:Owner&{last:Vec;v:Vec};bar:Owner&{thumbY:number;grab:number;target:number};
  down:Owner;up:Owner;busy:boolean;
  select:{frame:number;state:number;done:boolean;direction:number;display:number;plays:number};
  remainderMs:number;
};
export type HealthScrollView={paneY:number;thumbY:number;selectFrame:number};

const f=Math.fround;
/** 268111856 / 4481136: the LCD refresh the render loop waits on (0x110b40). */
export const HEALTH_VBLANK_HZ=268111856/4481136;
/** common_LZ.bin/CmnFade_U_00_SceneIn is a non-looping 21-frame upper-screen
 * black overlay. Health's own foreground clock starts at application entry,
 * so HOME's launch clock and paired readiness remain independent. The exact
 * native dispatch epoch is untraced; frame 0 on the first complete app pair is
 * the bounded adaptation supported by the captured upper-only reveal. */
export const HEALTH_ENTRY_LAST_FRAME=20;
export function healthEntrySceneInFrame(elapsedMs:number,reducedMotion=false):number{
  if(reducedMotion)return HEALTH_ENTRY_LAST_FRAME;
  const elapsed=Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):0;
  return Math.min(HEALTH_ENTRY_LAST_FRAME,Math.floor(elapsed*HEALTH_VBLANK_HZ/1000));
}
/** Source Bg_U_00_TopLoop has 720 frames. The 18-frame origin is a
 * capture-fitted adaptation: local elapsed 12000ms samples source frame 15.
 * The capture has no measured entry interval; this is a source-render fit.
 * It does not establish native launch timing (see the Health TopLoop audit). */
export function healthTopLoopFrame(elapsedMs:number,reducedMotion=false):number{
  if(reducedMotion)return 0;
  const elapsed=Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):0;
  return (Math.floor(elapsed*HEALTH_VBLANK_HZ/1000)+18)%720;
}
/** Bounded catch-up for one browser tick; longer gaps settle over later ticks. */
const MAX_UPDATES_PER_ADVANCE=12;
const PITCH=21,VIEWPORT=8;
const KEY_MASK={up:0x40,down:0x80} as const;
/** G_Touch descriptor at 0x1576a8: release ×1.0, inertia ×0.95, stop below 4.5, Y axis only. */
const DECAY=f(0.95),STOP_SQUARED=f(4.5*4.5);
/** SlideBar after controller 0x12894c: groove 16×176, thumb 24×22, travel 154 about groove Y 0. */
const TRAVEL=154,HALF_TRAVEL=f(TRAVEL*.5),GROOVE_STEP=8,SLIDE_X=148;

export function healthScrollCreate(rows:number):HealthScrollState{
  const maxRow=Math.max(rows-VIEWPORT,0);
  return {maxRow,extent:maxRow*PITCH,row:0,residual:0,armed:true,stylus:null,latched:null,keys:0,taps:0,held:false,prevHeld:false,filtered:[0,0],point:[0,0],prevKeys:0,
    touch:{state:0,owns:false,last:[0,0],v:[0,0]},bar:{state:0,owns:false,thumbY:HALF_TRAVEL,grab:0,target:0},down:{state:0,owns:false},up:{state:0,owns:false},busy:false,
    select:{frame:0,state:0,done:false,direction:0,display:0,plays:0},remainderMs:0};
}

/** Raw lower-LCD pixel, or null when lifted. A press and lift between updates is sampled once. */
export function healthScrollStylus(state:HealthScrollState,point:{x:number;y:number}|null):HealthScrollState{
  if(!point)return {...state,stylus:null};
  const raw:Vec=[Math.max(0,Math.min(319,Math.floor(point.x))),Math.max(0,Math.min(239,Math.floor(point.y)))];
  return {...state,stylus:raw,latched:state.stylus||state.held?state.latched:raw};
}
export function healthScrollKey(state:HealthScrollState,key:HealthScrollKey,down:boolean):HealthScrollState{
  return {...state,keys:down?state.keys|KEY_MASK[key]:state.keys&~KEY_MASK[key]};
}
/** A discrete command (accessible control) holds the key for exactly one update. */
export function healthScrollKeyTap(state:HealthScrollState,key:HealthScrollKey):HealthScrollState{return {...state,taps:state.taps|KEY_MASK[key]};}
/** Lifecycle or pointer cancellation: the next sample sees no stylus and no keys. */
export function healthScrollRelease(state:HealthScrollState):HealthScrollState{return {...state,stylus:null,latched:null,keys:0,taps:0};}

export function healthScrollView(state:HealthScrollState):HealthScrollView{
  return {paneY:f(state.residual+f(PITCH*state.row)),thumbY:state.bar.thumbY,selectFrame:state.select.display};
}

export function healthScrollAdvance(state:HealthScrollState,elapsedMs:number):HealthScrollState{
  if(!Number.isFinite(elapsedMs)||elapsedMs<=0)return state;
  const total=state.remainderMs+elapsedMs,period=1000/HEALTH_VBLANK_HZ;
  const count=Math.floor(total/period+1e-9),run=Math.min(count,MAX_UPDATES_PER_ADVANCE);
  let next=state;for(let i=0;i<run;i++)next=healthScrollUpdate(next);
  return {...next,remainderMs:run<count?0:total-count*period};
}

/** One VBlank: sample, manager, scene update, then layout animation pass. */
export function healthScrollUpdate(input:HealthScrollState):HealthScrollState{
  const s:HealthScrollState=structuredClone(input);
  const keys=s.keys;s.keys|=s.taps;s.taps=0;
  sample(s);
  const requests:string[]=[];
  s.busy=s.touch.owns||s.bar.owns||s.down.owns||s.up.owns;
  keyUpdate(s,'down',requests);keyUpdate(s,'up',requests);touchUpdate(s,requests);barUpdate(s,requests);
  controller(s,requests.at(-1));
  selectAnimation(s);
  s.prevKeys=s.keys;s.keys=keys;
  return s;
}

function sample(s:HealthScrollState){
  const raw=s.stylus??s.latched;s.latched=null;
  s.prevHeld=s.held;
  if(!raw){s.held=false;return;}
  const x=f(raw[0]-160),y=f(-(raw[1]-120));
  if(s.prevHeld){
    const [fx,fy]=s.filtered,dx=f(fx-x),dy=f(fy-y),d=f(f(dx*dx)+f(dy*dy));
    // 0x13a744: movement under 1.5px from the filtered point creeps by 10%.
    s.filtered=d<2.25?[f(fx+f(f(x-fx)*f(.1))),f(fy+f(f(y-fy)*f(.1)))]:[x,y];
  }else s.filtered=[x,y];
  s.point=[Math.trunc(s.filtered[0]),Math.trunc(s.filtered[1])];
  s.held=true;
}
const pressed=(s:HealthScrollState)=>s.held&&!s.prevHeld;
const released=(s:HealthScrollState)=>!s.held&&s.prevHeld;
const own=(s:HealthScrollState,owner:Owner,value:boolean)=>{owner.owns=value;s.busy=value;};
/** 0x128278: a control that does not own skips its update while any control owns. */
const blocked=(s:HealthScrollState,owner:Owner)=>!owner.owns&&s.busy;
/** 0x128378/0x158ef0: centred bounding rect in pane-local coordinates, inclusive edges. */
const inside=(x:number,y:number,width:number,height:number)=>x>=-width/2&&x<=width/2&&y>=-height/2&&y<=height/2;
/** B_Touch 294×180 at [-12,0]. */
const inArticle=([x,y]:Vec)=>inside(x+12,y,294,180);
/** G_Slide member order: B_Slide_00 (1), then B_Groove_00 (2); 0 for a miss. */
function slideHit(s:HealthScrollState,[x,y]:Vec){
  if(inside(x-SLIDE_X,f(y-s.bar.thumbY),24,22))return 1;
  return inside(x-SLIDE_X,y,16,176)?2:0;
}

function keyUpdate(s:HealthScrollState,key:HealthScrollKey,requests:string[]){
  const k=s[key],mask=KEY_MASK[key];
  if(blocked(s,k))return;
  const held=(s.keys&mask)!==0,edge=held&&!(s.prevKeys&mask);
  if(k.state===0){
    if(k.owns)k.owns=false;
    // 0x1546d8 returns before its digital path on a stylus press edge.
    if(edge&&!pressed(s)){own(s,k,true);k.state=1;requests.push(key);}
    return;
  }
  // 0x15482c pauses, keeping ownership, while the stylus is held.
  if(s.held)return;
  if(held)requests.push(key);
  else{own(s,k,false);k.state=0;}
}

function touchUpdate(s:HealthScrollState,requests:string[]){
  const t=s.touch,[px,py]=s.point;
  switch(t.state){
  case 0:
    if(t.owns)t.owns=false;
    if(pressed(s)&&inArticle(s.point)){t.last=[px,py];t.state=1;}
    return;
  case 1:
    if(!s.held){cancelTouch(t);return;}
    // Threshold 0: the first held update after the press starts the drag.
    own(s,t,true);t.v=[0,0];t.last=[px,py];t.state=2;requests.push('touch');return;
  case 2:
    if(s.held){t.v=[f(px-t.last[0]),f(py-t.last[1])];t.last=[px,py];}
    else{t.last=[f(t.last[0]+t.v[0]),f(t.last[1]+t.v[1])];t.state=3;}
    requests.push('touch');return;
  case 3:{
    if(pressed(s)&&inArticle(s.point)){t.v=[0,0];t.last=[px,py];t.state=2;requests.push('touch');return;}
    const vy=f(t.v[1]*DECAY);
    if(f(vy*vy)<STOP_SQUARED)cancelTouch(t);
    else{t.v=[0,vy];t.last=[t.last[0],f(t.last[1]+vy)];}
    requests.push('touch');
  }
  }
}
function cancelTouch(t:HealthScrollState['touch']){t.state=0;t.v=[0,0];t.last=[0,0];}

function playSelect(s:HealthScrollState,direction:number){s.select={...s.select,direction,frame:direction?1:0,state:1,done:false,plays:s.select.plays+1};}

function barUpdate(s:HealthScrollState,requests:string[]){
  const b=s.bar,[,py]=s.point;
  if(blocked(s,b))return;
  if(b.state===0){
    if(b.owns)b.owns=false;
    if(!pressed(s))return;
    const hit=slideHit(s,s.point);
    if(hit===1){b.grab=f(py-b.thumbY);playSelect(s,0);own(s,b,true);b.state=1;}
    else if(hit===2){b.target=py;own(s,b,true);b.state=2;}
    return;
  }
  if(b.state===1){
    if(released(s)){b.grab=0;playSelect(s,1);b.state=0;return;}
    const y=f(py-b.grab);b.thumbY=-HALF_TRAVEL>y?-HALF_TRAVEL:HALF_TRAVEL>=y?y:HALF_TRAVEL;
    requests.push('bar');return;
  }
  const inside=slideHit(s,s.point)!==0;
  if(s.held&&inside)b.target=py;
  const y=b.thumbY,target=b.target;let next:number,reached=false;
  if(target>y){next=f(y+GROOVE_STEP);if(HALF_TRAVEL<next){next=HALF_TRAVEL;reached=true;}else if(next>=target){next=target;reached=true;}}
  else{next=f(y-GROOVE_STEP);if(-HALF_TRAVEL>next){next=-HALF_TRAVEL;reached=true;}else if(!(next>target)){next=target;reached=true;}}
  b.thumbY=next;requests.push('bar');
  if(!reached)return;
  if(s.held&&inside){b.grab=f(py-b.thumbY);playSelect(s,0);b.state=1;}
  else{b.target=0;b.state=0;}
}

function controller(s:HealthScrollState,request:string|undefined){
  if(!request){s.armed=true;return;}
  if(request==='bar'){
    // 0x1555a4 then 0x1532b8: thumb ratio to row and signed residual.
    const ratio=f(1-f(f(s.bar.thumbY-f(0-HALF_TRAVEL))/TRAVEL)),rows=f(f(ratio*s.extent)/PITCH),whole=Math.trunc(rows);
    s.row=whole;s.residual=f(f(rows-whole)*PITCH);
    if(s.residual>=f(PITCH*.5)){s.residual=f(s.residual-PITCH);s.row++;}
    return;
  }
  move(s,request==='touch'?s.touch.v[1]:request==='up'?-4:4);
}

/** 0x1286ec: nearest row plus residual, clamped, then the thumb setter 0x1290dc. */
function move(s:HealthScrollState,delta:number){
  const d=Math.trunc(delta)<<16>>16;
  if(s.row===0&&!(s.residual>0)&&d<0||s.row===s.maxRow&&!(s.residual<0)&&d>0){s.residual=0;s.armed=false;}
  else{
    const n=Math.trunc(d/PITCH);s.row+=n;s.residual=f(s.residual+f(delta-f(n*PITCH)));
    if(s.residual>=f(PITCH*.5)){s.residual=f(s.residual-PITCH);s.row++;}
    else if(s.residual<f(PITCH*-.5)){s.residual=f(s.residual+PITCH);s.row--;}
    if(s.row<0||s.row===0&&s.residual<0){s.row=0;s.residual=0;}
    else if(s.row>s.maxRow||s.row===s.maxRow&&s.residual>0){s.row=s.maxRow;s.residual=0;}
  }
  const ratio=s.extent?f(f(s.residual+f(s.row*PITCH))/s.extent):0;
  s.bar.thumbY=f(f(0-HALF_TRAVEL)+f(TRAVEL*f(1-ratio)));
}

/** Wrapper pass 0x10190c → 0x155ff0/0x1530e4: apply the current frame, then step 1.0. */
function selectAnimation(s:HealthScrollState){
  const a=s.select;
  if(a.state===2){a.state=0;return;}
  if(a.state!==1)return;
  a.display=a.frame;
  if(a.done){a.state=2;return;}
  a.frame=a.direction?Math.max(0,a.frame-1):Math.min(1,a.frame+1);
  if(a.frame===(a.direction?0:1))a.done=true;
}
