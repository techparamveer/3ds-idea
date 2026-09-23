import { FRAME, RATE } from "./arithmetic.js";
const PHASES = 1024;
export class RationalMusicClock {
    nativePosition = 0;
    phaseNumerator = 0;
    outputProduced = 0;
    outputRate;
    constructor(outputRate) {
        if (!Number.isSafeInteger(outputRate) || outputRate < 8000 || outputRate > 192000)
            throw new Error('Unsupported resampler rate');
        this.outputRate = outputRate;
    }
    advance(frames = 1) {
        const units = this.phaseNumerator + frames * RATE;
        if (!Number.isSafeInteger(frames) || frames < 0 || !Number.isSafeInteger(units) || !Number.isSafeInteger(this.outputProduced + frames))
            throw new Error('Invalid rational clock advance');
        this.nativePosition += Math.floor(units / this.outputRate);
        this.phaseNumerator = units % this.outputRate;
        this.outputProduced += frames;
    }
}
/** 96-tap minimum, scaled for downsampling. Blackman-Harris window; unity DC per phase. */
export function createWindowedSincKernel(outputRate) {
    if (!Number.isSafeInteger(outputRate) || outputRate < 8000 || outputRate > 192000)
        throw new Error('Unsupported resampler rate');
    const half = Math.ceil(48 * Math.max(1, RATE / outputRate)), taps = half * 2;
    const cutoff = .45 * Math.min(1, outputRate / RATE), coefficients = new Float64Array((PHASES + 1) * taps);
    for (let phase = 0; phase <= PHASES; phase++) {
        const fraction = phase / PHASES;
        let sum = 0;
        for (let tap = 0; tap < taps; tap++) {
            const distance = tap - half + 1 - fraction;
            const angle = Math.PI * distance / half;
            const window = Math.abs(distance) >= half ? 0 : .35875 + .48829 * Math.cos(angle) + .14128 * Math.cos(2 * angle) + .01168 * Math.cos(3 * angle);
            const x = 2 * cutoff * distance;
            const weight = 2 * cutoff * (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)) * window;
            coefficients[phase * taps + tap] = weight;
            sum += weight;
        }
        for (let tap = 0; tap < taps; tap++)
            coefficients[phase * taps + tap] /= sum;
    }
    return { half, taps, phases: PHASES, cutoff, coefficients };
}
/** Exact integer rational clock, with a causal FIR delay and zero history only at stream startup. */
export function createContinuousMusicResampler(outputRate) {
    const kernel = createWindowedSincKernel(outputRate);
    const capacity = 2 ** Math.ceil(Math.log2(Math.max(1024, kernel.taps * 4)));
    const input = new Int16Array(capacity * 2);
    let accepted = 0, retained = 0;
    const clock = new RationalMusicClock(outputRate);
    return {
        push(packet) {
            if (packet.startSample !== accepted || !(packet.pcm instanceof Int16Array) || packet.pcm.length !== FRAME * 2)
                throw new Error('Noncontiguous native music packet');
            if (accepted + FRAME - retained > capacity)
                throw new Error('Resampler input capacity exceeded');
            for (let i = 0; i < FRAME; i++) {
                const at = ((accepted + i) % capacity) * 2;
                input[at] = packet.pcm[i * 2];
                input[at + 1] = packet.pcm[i * 2 + 1];
            }
            accepted += FRAME;
        },
        /** Fill as much as available; no end padding or state changes for unavailable samples. */
        readInto(output, offsetFrames = 0, frames = output.length / 2 - offsetFrames) {
            if (!(output instanceof Float32Array) || output.length % 2 || !Number.isSafeInteger(offsetFrames) || !Number.isSafeInteger(frames) || offsetFrames < 0 || frames < 0 || (offsetFrames + frames) * 2 > output.length)
                throw new Error('Invalid resampler destination');
            const startOutputFrame = clock.outputProduced;
            let written = 0;
            for (; written < frames && clock.nativePosition < accepted; written++) {
                const phase = clock.phaseNumerator / outputRate * kernel.phases, firstPhase = Math.floor(phase), blend = phase - firstPhase;
                const base = firstPhase * kernel.taps, next = base + kernel.taps, firstInput = clock.nativePosition - kernel.taps + 1;
                let left = 0, right = 0;
                for (let tap = 0; tap < kernel.taps; tap++) {
                    const index = firstInput + tap;
                    if (index < 0)
                        continue;
                    if (index < retained)
                        throw new Error('Resampler history was overwritten');
                    const c0 = kernel.coefficients[base + tap], weight = c0 + (kernel.coefficients[next + tap] - c0) * blend;
                    const at = (index % capacity) * 2;
                    left += input[at] * weight;
                    right += input[at + 1] * weight;
                }
                output[(offsetFrames + written) * 2] = left / 32768;
                output[(offsetFrames + written) * 2 + 1] = right / 32768;
                clock.advance();
                retained = Math.max(0, Math.min(accepted, clock.nativePosition - kernel.taps + 1));
            }
            return { startOutputFrame, frames: written };
        },
        status() {
            return { nativeAccepted: accepted, nativePosition: clock.nativePosition, phaseNumerator: clock.phaseNumerator,
                phaseDenominator: outputRate, outputProduced: clock.outputProduced, retainedNativeStart: retained,
                bufferedNativeFrames: accepted - retained, capacityNativeFrames: capacity, taps: kernel.taps,
                delayNativeFrames: kernel.half, delaySeconds: kernel.half / RATE, delayOutputFrames: kernel.half * outputRate / RATE };
        },
    };
}
