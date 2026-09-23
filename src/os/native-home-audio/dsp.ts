import { f, FRAME, clamp } from './arithmetic.ts';
import type { Wave } from './types.ts';
const SCALE = 2 ** 24;
const RAMP = Float32Array.from({ length: FRAME }, (_, i) => f(i * f(1 / 159)));
/** Pinned Azahar v8 source model. Integer products stay within exact JS integer range. */
export class CaptureDsp {
  cursor = 0; fraction = 0; history = [0, 0]; loaded = false; enabled = true;
  gains = [[0, 0], [0, 0], [0, 0]];
  private wave: Wave;
  private pcm = new Int16Array(FRAME);
  constructor(wave: Wave) { this.wave = wave; }
  frame(rate: number) {
    this.pcm.fill(0);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid source rate');
    if (!this.loaded) { this.loaded = true; return this.pcm; }
    const samples = this.wave.samples, length = samples.length;
    if (this.cursor === length) {
      if (!this.wave.loop) { this.enabled = false; return this.pcm; }
      this.cursor = this.wave.loop_start;
    }
    const step = Math.trunc(f(f(rate) * SCALE));
    if (step <= 0 || step > 2 ** 40) throw new Error('Unsupported source rate');
    let written = 0;
    while (written < FRAME) {
      const available = length - this.cursor, remaining = FRAME - written;
      const fetch = (index: number) => index < 2 ? this.history[index] : samples[index - 2 + this.cursor];
      let count = 0, lastIndex = 0;
      for (; count < remaining; count++) {
        const position = this.fraction + count * step, index = Math.floor(position / SCALE);
        if (index >= available) break;
        lastIndex = index;
        const first = fetch(index), delta = clamp(fetch(index + 1) - first, -32768, 32767);
        this.pcm[written + count] = first + Math.floor((position % SCALE) * delta / SCALE);
      }
      const consumed = count < remaining ? available : lastIndex;
      const h0 = fetch(consumed), h1 = fetch(consumed + 1);
      this.history[0] = h0; this.history[1] = h1;
      this.fraction += count * step - consumed * SCALE; this.cursor += consumed; written += count;
      if (this.cursor === length) {
        if (!this.wave.loop) break;
        this.cursor = this.wave.loop_start;
      }
    }
    return this.pcm;
  }
  mix(rate: number, target: number[][], buses: Float64Array) {
    const pcm = this.frame(rate);
    if (this.enabled) {
      for (let bus = 0; bus < 3; bus++) for (let channel = 0; channel < 2; channel++) {
        const previous = this.gains[bus][channel], delta = f(target[bus][channel] - previous);
        for (let i = 0; i < FRAME; i++) {
          const ramp = f(previous + f(delta * RAMP[i]));
          buses[bus * FRAME * 2 + i * 2 + channel] += Math.trunc(f(ramp * pcm[i]));
        }
      }
    }
    this.gains = target;
  }
  snapshot() {
    return { loop: this.wave.loop, loop_start: this.wave.loop_start, cursor: this.cursor,
      fraction: this.fraction, history: [...this.history], loaded: this.loaded, enabled: this.enabled,
      gains: this.gains.map(x => [...x]) };
  }
}
