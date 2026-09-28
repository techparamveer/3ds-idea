import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSequence } from '../src/os/native-home-audio/resources.ts';
import { createNativeHomeMusic, decodeNativeHomeMusicResources } from '../src/os/native-home-audio/index.ts';
import { CaptureDsp } from '../src/os/native-home-audio/dsp.ts';
import { SequenceClock } from '../src/os/native-home-audio/arithmetic.ts';

test('music grammar follows opened tracks/calls and rejects unknown, truncated and operand targets', () => {
  assert.equal(validateSequence(Uint8Array.from([0x80,1,0x89,0,0,0]),0).size,2);
  for (const bytes of [[0xc8,1], [0x80,0x80,0x80,0x80,0x80,0], [0x89,0,0], [0x80,1,0x89,0,0,1], [60,127,0]])
    assert.throws(() => validateSequence(Uint8Array.from(bytes),0));
});
test('engine accepts only decoder-owned resource handles', () => {
  assert.throws(() => createNativeHomeMusic({kind:'native-home-music',schema:1},'music'), /unvalidated/);
});
test('decoder rejects wrong schema/source before interpreting resources', async () => {
  await assert.rejects(decodeNativeHomeMusicResources({schema:1,title:{},profile:{},archive:{}},new Map()), /schema/);
});
test('DSP initial dequeue preserves zero history, then source loop and negative floor carry', () => {
  const wave = {samples:Int16Array.from([100,-100,200,-200]),rate:44100,loop:true,loop_start:1,sha256:''};
  const dsp = new CaptureDsp(wave);
  assert.ok(dsp.frame(1).every(x=>x===0)); assert.equal(dsp.cursor,0); assert.equal(dsp.loaded,true);
  const second = dsp.frame(1); assert.deepEqual([...second.slice(0,9)],[0,0,100,-100,200,-200,-100,200,-200]);
  const snapshot = dsp.snapshot(); snapshot.history[0] = 999; snapshot.gains[0][0] = 999;
  assert.notEqual(dsp.history[0],999); assert.equal(dsp.gains[0][0],0);
  const fractional = new CaptureDsp(wave); fractional.frame(.5);
  assert.deepEqual([...fractional.frame(.5).slice(0,8)],[0,0,0,50,100,0,-100,50]);
  const negative = new CaptureDsp({ ...wave, samples: Int16Array.from([-1,0]), loop_start: 0 });
  negative.frame(.5);
  assert.equal(negative.frame(.5)[3], -1, 'negative half-step floors instead of truncating toward zero');
});
test('native clock retains float32 phase across frame groups', () => {
  const a=new SequenceClock(),b=new SequenceClock(); let ta=0,tb=0;
  for(let i=0;i<1000;i++)a.advance(()=>[149,96,1],()=>ta++);
  for(const n of [3,137,11,849])for(let i=0;i<n;i++)b.advance(()=>[149,96,1],()=>tb++);
  assert.equal(ta,tb);assert.equal(a.remaining_fraction,b.remaining_fraction);assert.notEqual(a.remaining_fraction,0);
});
