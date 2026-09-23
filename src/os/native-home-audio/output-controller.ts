import { PcmStereoRing } from './pcm-ring.ts';
import { MUSIC_PROTOCOL, OUTPUT_CHUNK_FRAMES, stamp, stamped, validateBufferConfig } from './transport-protocol.ts';
import type { BufferConfig, PortLike, WorkletControl, StreamMessage } from './transport-protocol.ts';
type Mode = 'idle' | 'priming' | 'running' | 'paused' | 'starved' | 'stopped' | 'failed' | 'disposed';
/** Testable worklet state machine. All positions count stereo sample frames, never channel samples. */
export class MusicOutputController {
  private outputRate: number; private notify: (message: unknown) => void;
  private epoch = 0; private mode: Mode = 'idle'; private stream?: PortLike; private ring?: PcmStereoRing;
  private modeBeforePause?: Mode;
  private config?: BufferConfig; private granted = 0; private ready = false; private paused = false;
  private firstContextFrame?: number; private when = 0; private underrunFrames = 0; private underrunEvents = 0;
  private staleMessages = 0; private discontinuities = 0; private minimumBuffered = 0; private failure?: string;
  private nextDiagnostic = 0; private acks: string[] = [];
  constructor(outputRate: number, notify: (message: unknown) => void) { this.outputRate = outputRate; this.notify = notify; }
  private message(type: string, details: object = {}) { this.notify({ ...stamp(this.epoch), type, ...details }); }
  private fail(error: unknown) {
    if (this.mode === 'disposed') return;
    this.mode = 'failed'; this.failure = String(error); this.discontinuities++;
    this.message('error', { source: 'worklet', error: this.failure });
  }
  control(value: unknown, contextFrame = 0) {
    try {
      if (!stamped(value)) throw new Error('Invalid music control protocol');
      const m = value as WorkletControl;
      if (this.mode === 'disposed') return;
      if (m.epoch < this.epoch) { this.staleMessages++; return; }
      if (m.type === 'attach') {
        if (this.stream || m.epoch !== this.epoch || !m.port || typeof m.port.postMessage !== 'function') throw new Error('Invalid music stream attachment');
        this.stream = m.port; this.stream.onmessage = event => this.receive(event.data); this.stream.start?.(); this.message('attached', { source: 'worklet' }); return;
      }
      if (m.type === 'begin') {
        if (m.epoch <= this.epoch || !this.stream) throw new Error('Music begin requires a fresh epoch and attached port');
        const config = validateBufferConfig(m.config);
        if (config.outputRate !== this.outputRate) throw new Error('Music output rate does not match AudioContext');
        if (m.whenContextFrame !== undefined && (!Number.isSafeInteger(m.whenContextFrame) || m.whenContextFrame < 0)) throw new Error('Invalid scheduled music frame');
        this.epoch = m.epoch; this.config = config; this.ring = new PcmStereoRing(config.capacityFrames); this.ring.reset(this.epoch);
        this.granted = 0; this.ready = false; this.paused = false; this.modeBeforePause = undefined; this.firstContextFrame = undefined; this.when = m.whenContextFrame ?? 0;
        this.underrunFrames = 0; this.underrunEvents = 0; this.minimumBuffered = config.capacityFrames; this.failure = undefined; this.acks = [];
        this.mode = 'priming'; this.nextDiagnostic = contextFrame + this.outputRate;
        this.message('begun', { contextFrame, config }); return;
      }
      if (m.type === 'stop' || m.type === 'dispose') {
        this.epoch = m.epoch; this.ring = undefined; this.config = undefined; this.ready = false; this.granted = 0; this.paused = false; this.modeBeforePause = undefined;
        this.mode = m.type === 'dispose' ? 'disposed' : 'stopped'; this.acks = [];
        this.message(m.type === 'dispose' ? 'disposed' : 'stopped', { source: 'worklet', contextFrame });
        if (m.type === 'dispose') { if (this.stream) { this.stream.onmessage = null; this.stream.close(); } this.stream = undefined; }
        return;
      }
      if (m.epoch !== this.epoch) throw new Error('Unexpected future music control epoch');
      if (m.type === 'status') { this.message('status', this.status()); return; }
      if (m.type === 'pause' || m.type === 'resume') {
        if (!this.ring || this.mode === 'failed') throw new Error('No music stream to pause or resume');
        if (m.type === 'pause' && !this.paused) { this.modeBeforePause = this.mode; this.paused = true; this.mode = 'paused'; }
        else if (m.type === 'resume' && this.paused) { this.paused = false; this.mode = this.modeBeforePause!; this.modeBeforePause = undefined; }
        if (!this.paused) this.credit();
        if (this.acks.length >= 32) throw new Error('Music control backlog'); this.acks.push(m.type === 'pause' ? 'paused' : 'resumed'); return;
      }
      throw new Error('Unknown music worklet control');
    } catch (error) { this.fail(error); }
  }
  private receive(value: unknown) {
    try {
      if (!stamped(value)) throw new Error('Invalid music stream protocol');
      const m = value as StreamMessage;
      if (this.mode === 'disposed') return;
      if (m.epoch !== this.epoch) { this.staleMessages++; this.recycle(m); return; }
      if (!this.ring || !this.config || this.mode === 'failed') { this.recycle(m); return; }
      if (m.type === 'producer-ready') { this.ready = true; this.credit(); return; }
      if (m.type !== 'pcm') throw new Error('Unexpected producer message');
      if (!this.ready || m.frames !== OUTPUT_CHUNK_FRAMES || !(m.buffer instanceof ArrayBuffer) || m.buffer.byteLength !== OUTPUT_CHUNK_FRAMES * 8 ||
          !Number.isSafeInteger(m.startOutputFrame) || m.startOutputFrame + m.frames > this.granted) throw new Error('Uncredited or malformed music PCM');
      this.ring.enqueue(m.epoch, m.startOutputFrame, new Float32Array(m.buffer)); this.recycle(m);
    } catch (error) { this.fail(error); }
  }
  private recycle(m: StreamMessage) {
    if (m.type === 'pcm' && m.buffer instanceof ArrayBuffer && this.stream) this.stream.postMessage({ ...stamp(m.epoch), type: 'recycle', buffer: m.buffer }, [m.buffer]);
  }
  private credit() {
    if (!this.ready || !this.ring || !this.config || !this.stream || this.paused) return;
    if (this.granted - this.ring.consumedFrames > this.config.lowWaterFrames) return;
    const end = Math.floor((this.ring.consumedFrames + this.config.targetFrames) / OUTPUT_CHUNK_FRAMES) * OUTPUT_CHUNK_FRAMES;
    if (end <= this.granted) return;
    if (end > this.ring.consumedFrames + this.config.capacityFrames) throw new Error('Music credit exceeds ring capacity');
    this.granted = end; this.stream.postMessage({ ...stamp(this.epoch), type: 'credit', creditEnd: end });
  }
  unavailableOutput() {
    if (this.mode !== 'failed' && this.mode !== 'disposed') this.fail('Music output requires one stereo output with equal channel lengths');
    return this.mode !== 'disposed';
  }
  process(left: Float32Array, right: Float32Array, contextFrame: number) {
    left.fill(0); right.fill(0);
    if (this.mode === 'disposed') return false;
    for (const type of this.acks) this.message(type, { contextFrame, outputConsumed: this.ring?.consumedFrames ?? 0 });
    this.acks.length = 0;
    if (this.ring && this.config && !this.paused && this.mode !== 'failed' && this.mode !== 'stopped') {
      let offset = 0;
      if (this.mode === 'priming') {
        if (this.ring.bufferedFrames < this.config.lowWaterFrames || contextFrame + left.length <= this.when) return true;
        offset = Math.max(0, this.when - contextFrame); this.firstContextFrame = contextFrame + offset; this.mode = 'running';
        this.message('started', { firstContextFrame: this.firstContextFrame, missedByFrames: this.when ? Math.max(0, this.firstContextFrame - this.when) : 0 });
      } else if (this.mode === 'starved') {
        if (this.ring.bufferedFrames < this.config.lowWaterFrames) {
          this.underrunFrames += left.length; this.credit(); this.diagnostic(contextFrame); return true;
        }
        this.mode = 'running'; this.message('rebuffered', { contextFrame, outputConsumed: this.ring.consumedFrames, underrunFrames: this.underrunFrames });
      }
      const wanted = left.length - offset, read = this.ring.readInto(left, right, offset, wanted);
      this.minimumBuffered = Math.min(this.minimumBuffered, this.ring.bufferedFrames);
      if (read < wanted) {
        this.underrunFrames += wanted - read; this.underrunEvents++; this.mode = 'starved';
        this.message('underrun', { contextFrame: contextFrame + offset + read, missingFrames: wanted - read, ...this.status() });
      }
      this.credit();
    }
    this.diagnostic(contextFrame); return true;
  }
  private diagnostic(frame: number) { if (frame >= this.nextDiagnostic) { this.nextDiagnostic = frame + this.outputRate; this.message('status', this.status()); } }
  status() { return { source: 'worklet', state: this.mode, outputRate: this.outputRate, firstContextFrame: this.firstContextFrame,
    outputConsumed: this.ring?.consumedFrames ?? 0, outputAccepted: this.ring?.acceptedFrames ?? 0, bufferedFrames: this.ring?.bufferedFrames ?? 0,
    creditEnd: this.granted, minimumBufferedFrames: this.minimumBuffered, underrunFrames: this.underrunFrames, underrunEvents: this.underrunEvents,
    staleMessages: this.staleMessages, discontinuities: this.discontinuities, failure: this.failure, protocol: MUSIC_PROTOCOL }; }
}
