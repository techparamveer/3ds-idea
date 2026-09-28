/** Ordered output-rate stereo storage. No allocation or copying of unread samples while draining. */
export class PcmStereoRing {
    samples;
    capacityFrames;
    epoch = 0;
    read = 0;
    write = 0;
    constructor(capacityFrames) {
        if (!Number.isSafeInteger(capacityFrames) || capacityFrames < 1 || capacityFrames > 131072)
            throw new Error('Invalid music ring capacity');
        this.capacityFrames = capacityFrames;
        this.samples = new Float32Array(capacityFrames * 2);
    }
    get consumedFrames() { return this.read; }
    get acceptedFrames() { return this.write; }
    get bufferedFrames() { return this.write - this.read; }
    reset(epoch) {
        if (!Number.isSafeInteger(epoch) || epoch < this.epoch)
            throw new Error('Invalid music ring epoch');
        this.epoch = epoch;
        this.read = 0;
        this.write = 0;
    }
    enqueue(epoch, startOutputFrame, pcm) {
        if (epoch !== this.epoch)
            throw new Error('Stale music ring epoch');
        if (!(pcm instanceof Float32Array) || !pcm.length || pcm.length % 2 || startOutputFrame !== this.write)
            throw new Error('Discontinuous music PCM');
        const frames = pcm.length / 2;
        if (frames > this.capacityFrames - (this.write - this.read))
            throw new Error('Music ring overflow');
        for (const sample of pcm)
            if (!Number.isFinite(sample))
                throw new Error('Nonfinite music PCM');
        for (let i = 0; i < frames; i++) {
            const at = ((this.write + i) % this.capacityFrames) * 2;
            this.samples[at] = pcm[i * 2];
            this.samples[at + 1] = pcm[i * 2 + 1];
        }
        this.write += frames;
    }
    readInto(left, right, offset = 0, frames = left.length - offset) {
        if (left.length !== right.length || !Number.isSafeInteger(offset) || !Number.isSafeInteger(frames) || offset < 0 || frames < 0 || offset + frames > left.length)
            throw new Error('Invalid music ring destination');
        const count = Math.min(frames, this.write - this.read);
        for (let i = 0; i < count; i++) {
            const at = ((this.read + i) % this.capacityFrames) * 2;
            left[offset + i] = this.samples[at];
            right[offset + i] = this.samples[at + 1];
        }
        left.fill(0, offset + count, offset + frames);
        right.fill(0, offset + count, offset + frames);
        this.read += count;
        return count;
    }
    status() {
        return { epoch: this.epoch, consumedFrames: this.read, acceptedFrames: this.write,
            bufferedFrames: this.write - this.read, capacityFrames: this.capacityFrames };
    }
}
