import { createNativeHomeMusic } from "./engine.js";
import { decodeNativeHomeMusicResources } from "./resources.js";
import { createContinuousMusicResampler } from "./continuous-resampler.js";
import { musicBufferConfig, OUTPUT_CHUNK_FRAMES, stamp, stamped } from "./transport-protocol.js";
/** No worker globals in this controller: protocol races and yielding are tested with deterministic ports. */
export class MusicSynthesisController {
    notify;
    scheduler;
    decode;
    epoch = 0;
    disposed = false;
    stream;
    resources;
    engine;
    resampler;
    preparing = false;
    paused = false;
    creditEnd = 0;
    outputProduced = 0;
    task;
    scheduled = false;
    generation = 0;
    scheduleTicket = 0;
    buffers = [];
    outputRate = 0;
    failure;
    staleMessages = 0;
    entry;
    now;
    maxScheduleDelayMs = 0;
    maxChunkMs = 0;
    chunksProcessed = 0;
    constructor(notify, scheduler, decode = decodeNativeHomeMusicResources, now = () => performance.now()) {
        this.notify = notify;
        this.scheduler = scheduler;
        this.decode = decode;
        this.now = now;
    }
    message(type, details = {}) { this.notify({ ...stamp(this.epoch), type, source: 'worker', ...details }); }
    cancel() { this.scheduleTicket++; if (this.scheduled)
        this.scheduler.cancel(this.task); this.scheduled = false; }
    clear() {
        this.cancel();
        this.engine = undefined;
        this.resampler = undefined;
        this.creditEnd = 0;
        this.outputProduced = 0;
        this.paused = false;
        this.entry = undefined;
        this.maxScheduleDelayMs = this.maxChunkMs = this.chunksProcessed = 0;
    }
    fail(error) { if (!this.disposed) {
        this.clear();
        this.failure = String(error);
        this.message('error', { error: this.failure });
    } }
    async control(value) {
        try {
            if (!stamped(value))
                throw new Error('Invalid music worker protocol');
            const m = value;
            if (this.disposed)
                return;
            if (m.epoch < this.epoch) {
                this.staleMessages++;
                return;
            }
            if (m.type === 'attach') {
                if (this.stream || m.epoch !== this.epoch || !m.port || typeof m.port.postMessage !== 'function')
                    throw new Error('Invalid producer port');
                this.stream = m.port;
                this.stream.onmessage = event => this.receive(event.data);
                this.stream.start?.();
                this.message('attached');
                return;
            }
            if (m.type === 'prepare') {
                this.epoch = m.epoch;
                this.clear();
                this.preparing = true;
                this.failure = undefined;
                const generation = ++this.generation;
                if (!Array.isArray(m.files) || m.files.some(file => !file || typeof file.name !== 'string' || !(file.buffer instanceof ArrayBuffer)))
                    throw new Error('Invalid raw music resources');
                const files = new Map(m.files.map(file => [file.name, new Uint8Array(file.buffer)]));
                if (files.size !== m.files.length)
                    throw new Error('Duplicate music resource name');
                let resources;
                try {
                    resources = await this.decode(m.manifest, files);
                }
                catch (error) {
                    if (this.disposed || generation !== this.generation || m.epoch !== this.epoch)
                        return;
                    throw error;
                }
                if (this.disposed || generation !== this.generation || m.epoch !== this.epoch)
                    return;
                this.resources = resources;
                this.preparing = false;
                this.message('prepared');
                return;
            }
            if (m.type === 'stop' || m.type === 'dispose') {
                this.epoch = m.epoch;
                this.generation++;
                this.preparing = false;
                this.clear();
                this.message(m.type === 'stop' ? 'stopped' : 'disposed');
                if (m.type === 'dispose') {
                    this.disposed = true;
                    this.resources = undefined;
                    this.buffers = [];
                    if (this.stream) {
                        this.stream.onmessage = null;
                        this.stream.close();
                    }
                    this.stream = undefined;
                }
                return;
            }
            if (m.type === 'start') {
                if (!this.resources || this.preparing || !this.stream || (m.epoch === this.epoch && this.engine))
                    throw new Error('Music producer is not ready for start');
                musicBufferConfig(m.outputRate);
                this.epoch = m.epoch;
                this.generation++;
                this.clear();
                this.failure = undefined;
                this.engine = createNativeHomeMusic(this.resources, m.entry);
                this.resampler = createContinuousMusicResampler(m.outputRate);
                this.outputRate = m.outputRate;
                this.entry = m.entry;
                this.stream.postMessage({ ...stamp(this.epoch), type: 'producer-ready' });
                this.message('producer-started', { entry: this.entry, ...this.resampler.status() });
                return;
            }
            if (m.epoch !== this.epoch)
                throw new Error('Unexpected future producer epoch');
            if (m.type === 'pause' || m.type === 'resume') {
                this.paused = m.type === 'pause';
                if (this.paused)
                    this.cancel();
                else
                    this.schedule();
                this.message(this.paused ? 'paused' : 'resumed');
                return;
            }
            if (m.type === 'status') {
                this.message('status', this.status());
                return;
            }
            throw new Error('Unknown music producer control');
        }
        catch (error) {
            this.preparing = false;
            this.fail(error);
        }
    }
    receive(value) {
        try {
            if (!stamped(value))
                throw new Error('Invalid producer stream protocol');
            const m = value;
            if (this.disposed)
                return;
            if (m.type === 'recycle') {
                if (m.buffer instanceof ArrayBuffer && m.buffer.byteLength === OUTPUT_CHUNK_FRAMES * 8 && this.buffers.length < 4)
                    this.buffers.push(m.buffer);
                if (m.epoch !== this.epoch)
                    this.staleMessages++;
                return;
            }
            if (m.epoch !== this.epoch) {
                this.staleMessages++;
                return;
            }
            if (m.type !== 'credit' || !this.engine || !Number.isSafeInteger(m.creditEnd) || m.creditEnd < 0 || m.creditEnd % OUTPUT_CHUNK_FRAMES ||
                m.creditEnd > this.outputProduced + musicBufferConfig(this.outputRate).capacityFrames)
                throw new Error('Invalid music output credit');
            this.creditEnd = Math.max(this.creditEnd, m.creditEnd);
            this.schedule();
        }
        catch (error) {
            this.fail(error);
        }
    }
    schedule() {
        if (this.scheduled || this.disposed || this.paused || !this.engine || this.outputProduced + OUTPUT_CHUNK_FRAMES > this.creditEnd)
            return;
        const queuedAt = this.now();
        this.scheduled = true;
        const ticket = ++this.scheduleTicket;
        this.task = this.scheduler.schedule(() => {
            if (ticket !== this.scheduleTicket)
                return;
            this.scheduled = false;
            try {
                if (!this.engine || !this.resampler || this.paused || this.disposed)
                    return;
                const startedAt = this.now();
                this.maxScheduleDelayMs = Math.max(this.maxScheduleDelayMs, startedAt - queuedAt);
                const buffer = this.buffers.pop() ?? new ArrayBuffer(OUTPUT_CHUNK_FRAMES * 8), pcm = new Float32Array(buffer);
                let written = 0, guard = 0;
                while (written < OUTPUT_CHUNK_FRAMES) {
                    if (++guard > 128)
                        throw new Error('Music synthesis did not progress');
                    const result = this.resampler.readInto(pcm, written);
                    written += result.frames;
                    if (written < OUTPUT_CHUNK_FRAMES)
                        this.resampler.push(this.engine.renderFrame());
                }
                const startOutputFrame = this.outputProduced;
                this.outputProduced += OUTPUT_CHUNK_FRAMES;
                this.stream.postMessage({ ...stamp(this.epoch), type: 'pcm', startOutputFrame, frames: OUTPUT_CHUNK_FRAMES, buffer }, [buffer]);
                this.maxChunkMs = Math.max(this.maxChunkMs, this.now() - startedAt);
                this.chunksProcessed++;
                this.schedule(); // A separate task gives cancellation/control messages a turn between chunks.
            }
            catch (error) {
                this.fail(error);
            }
        });
    }
    status() {
        return { state: this.disposed ? 'disposed' : this.failure ? 'failed' : this.preparing ? 'loading' : this.engine ? this.paused ? 'paused' : 'running' : this.resources ? 'prepared' : 'idle',
            entry: this.entry, outputRate: this.outputRate, creditEnd: this.creditEnd, outputProduced: this.outputProduced,
            maxScheduleDelayMs: this.maxScheduleDelayMs, maxChunkMs: this.maxChunkMs, chunksProcessed: this.chunksProcessed,
            staleMessages: this.staleMessages, failure: this.failure, resampler: this.resampler?.status() };
    }
}
