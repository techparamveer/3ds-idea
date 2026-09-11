import test from 'node:test';
import assert from 'node:assert/strict';
import { ButtonMotion, buttonTravel } from '../src/scene/button-motion.ts';

test('a quick tap reaches visible depth and returns exactly to rest', () => {
  const motion=new ButtonMotion(buttonTravel('A',.25));
  motion.press(0,'pointer');motion.release('pointer');
  for(let time=0;time<=100;time+=10)motion.step(time,.01);
  assert.ok(motion.depth>.59);
  for(let time=110;time<=500;time+=10)motion.step(time,.01);
  assert.equal(motion.depth,0);
});

test('holding either input keeps the cap down until both release', () => {
  const motion=new ButtonMotion(.6);
  motion.press(0,'pointer');motion.press(20,'key:KeyA');motion.release('pointer');
  assert.equal(motion.step(1000,1,true),.6);
  motion.release('key:KeyA');assert.equal(motion.step(1001,.01,true),0);
});

test('cancel and repeated use never drift below the saved rest transform', () => {
  const motion=new ButtonMotion(.6);
  for(let cycle=0;cycle<20;cycle++) {
    motion.press(cycle*1000,'pointer');motion.step(cycle*1000+50,.05);
    motion.cancel();
    for(let i=0;i<40;i++)motion.step(cycle*1000+200+i*10,.01);
    assert.equal(motion.depth,0);
  }
  assert.equal(buttonTravel('CIRCLE',.25),0);
});
