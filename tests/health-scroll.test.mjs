import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { healthScrollCreate, healthScrollStylus, healthScrollKey, healthScrollUpdate, healthScrollView, healthScrollAdvance, healthScrollRelease, HEALTH_VBLANK_HZ } from '../src/os/stock-health-scroll.ts';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle } from '../src/os/app-registry.ts';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/health-scroll-traces.json',import.meta.url),'utf8'));
const withKeys=(state,mask)=>healthScrollKey(healthScrollKey(state,'up',(mask&0x40)!==0),'down',(mask&0x80)!==0);

for(const [name,scenario] of Object.entries(fixture.scenarios)){
  test(`browser model reproduces the replayed Health frames: ${name}`,()=>{
    let state=healthScrollCreate(scenario.rows);
    scenario.frames.forEach((frame,index)=>{
      const plays=state.select.plays;
      state=withKeys(healthScrollStylus(state,frame.stylus&&{x:frame.stylus[0],y:frame.stylus[1]}),frame.keys);
      state=healthScrollUpdate(state);
      const view=healthScrollView(state),at=`${name} frame ${index}`;
      assert.equal(view.paneY,frame.paneY,`${at} pane Y`);
      assert.equal(view.thumbY,frame.thumbY,`${at} thumb Y`);
      assert.equal(state.select.plays-plays,frame.select.length,`${at} SlideBar_Select plays`);
      if(frame.select.length)assert.equal(state.select.direction,frame.select.at(-1)==='reverse'?1:0,`${at} SlideBar_Select direction`);
    });
  });
}

test('SlideBar_Select shows frame 0 for one update after the press and frame 1 for one update after the release',()=>{
  let state=healthScrollCreate(334);const frames=[];
  for(const point of [{x:308,y:43},{x:308,y:43},{x:308,y:43},null,null,null]){state=healthScrollUpdate(healthScrollStylus(state,point));frames.push(healthScrollView(state).selectFrame);}
  assert.deepEqual(frames,[0,1,1,1,0,0]);
});

test('a press and lift between two VBlanks is still sampled once',()=>{
  let state=healthScrollCreate(334);
  state=healthScrollStylus(healthScrollStylus(state,{x:308,y:150}),null);
  state=healthScrollUpdate(state);
  assert.equal(state.bar.state,2,'the groove press starts before the lift is seen');
  for(let i=0;i<20;i++)state=healthScrollUpdate(state);
  assert.equal(healthScrollView(state).thumbY,-30,'the thumb reaches the tapped groove position');
});

test('a quick physical Down click reaches the Health article before the next VBlank',()=>{
  const module=createStockModule(getTitle('health-safety'));
  const context={now:0,shared:initialSharedData()};
  let state=module.reduce(module.create({},null,context),{type:'action',id:'3d'},context).state;
  state=module.reduce(state,{type:'button',command:'down',phase:'down',source:'dpad'},context).state;
  state=module.reduce(state,{type:'button',command:'down',phase:'up',source:'dpad'},context).state;
  state=module.reduce(state,{type:'tick',elapsedMs:1000/HEALTH_VBLANK_HZ},context).state;
  assert.equal(module.view(state,context).data.article.paneY,4);
});

test('ticks run one update per LCD VBlank and bound catch-up after long gaps',()=>{
  let state=withKeys(healthScrollCreate(334),0x80);
  state=healthScrollAdvance(state,1000/HEALTH_VBLANK_HZ*3);
  assert.equal(healthScrollView(state).paneY,12);
  state=healthScrollAdvance(state,60000);
  assert.equal(healthScrollView(state).paneY,12+12*4,'one tick advances at most twelve updates');
  assert.equal(state.remainderMs,0);
});

test('release clears held keys and the stylus, so inertia continues and the key stops',()=>{
  let state=healthScrollCreate(334);
  for(const y of [120,120,100,80])state=healthScrollUpdate(healthScrollStylus(state,{x:150,y}));
  state=healthScrollUpdate(healthScrollRelease(state));
  assert.equal(state.touch.state,3,'a cancelled pointer is a stylus lift, which starts inertia');
});
