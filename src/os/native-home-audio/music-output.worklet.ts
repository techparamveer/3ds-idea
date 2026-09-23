/// <reference path="./worklet-globals.d.ts" />
import { MusicOutputController } from './output-controller.ts';
import { MUSIC_PROCESSOR } from './transport-protocol.ts';
class NativeMusicOutput extends AudioWorkletProcessor {
  private controller: MusicOutputController;
  constructor(options?: { processorOptions?: unknown }) {
    super(options); this.controller = new MusicOutputController(sampleRate, message => this.port.postMessage(message));
    this.port.onmessage = event => { this.controller.control(event.data, currentFrame); };
  }
  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const output = outputs[0];
    if (!output || outputs.length !== 1 || output.length !== 2 || output[0].length !== output[1].length) {
      for (const channels of outputs) for (const channel of channels) channel.fill(0);
      return this.controller.unavailableOutput();
    }
    return this.controller.process(output[0], output[1], currentFrame);
  }
}
registerProcessor(MUSIC_PROCESSOR, NativeMusicOutput);
