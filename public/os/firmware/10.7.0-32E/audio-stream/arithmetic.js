export const f = Math.fround;
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const RATE = 32728;
export const FRAME = 160;
const SEND = f(1 / 127), PAN = f(1 / 63), CUBIC = f(1 / 127 ** 3), FLOOR = f(-90.4);
export const archiveGain = (raw) => Math.max(0, f(raw * SEND));
export const sendGain = (raw) => clamp(f(f(raw * SEND)), 0, 1);
export const livePan = (raw) => clamp(f(raw * PAN), -1, 1);
export const capturePan = (raw, initial) => f((raw - 64 + initial - 64) * PAN);
export const span = (raw) => clamp(f(raw * PAN), 0, 2);
export const noteGain = (velocity, volume) => f(f(velocity * velocity * volume) * CUBIC);
export function trackGain(volume, expression, master, gain) {
    const v = f(f(volume * expression * master) * CUBIC);
    return f(gain * f(v * v));
}
export const pitchBend = (raw, range) => f(f(raw * f(1 / 128)) * f(range));
export const dbGain = (tables, db) => tables.gain[Math.trunc(f(clamp(db, FLOOR, 6) * 10)) + 904];
export function pitchRatio(t, pitch) {
    const units = Math.trunc(f(pitch * 256)), octave = Math.floor(units / 3072), remainder = units - octave * 3072;
    return f(f(f(2 ** octave) * t.pitchSemitone[remainder >> 8]) * t.pitchFraction[remainder & 255]);
}
export function panGains(t, captured, live, modulation) {
    const p = clamp(f(f(captured + live) + modulation), -1, 1);
    return [t.pan[Math.trunc(f(f(f(p + 1) * 128) + .5))], t.pan[Math.trunc(f(f(f(1 - p) * 128) + .5))]];
}
export class SequenceClock {
    remaining_fraction = 0;
    advance(parameters, tick) {
        const rate = (initial) => {
            const [tempo, timebase, ratio] = parameters(), v = f(tempo * timebase);
            return initial ? f(f(v * ratio) * f(1 / 60000)) : f(f(v * f(1 / 60000)) * ratio);
        };
        let r = rate(true);
        if (r === 0)
            return;
        let cost = Math.trunc(f(f(this.remaining_fraction * 268111856) / r)), budget = 0x4e200000;
        if (cost < budget) {
            let guard = 0;
            do {
                if (++guard > 100000)
                    throw new Error('Invalid sequence tick rate');
                budget -= cost;
                tick();
                r = rate(false);
                if (r === 0)
                    return;
                cost = Math.trunc(f(268111856 / r));
            } while (cost < budget);
        }
        this.remaining_fraction = f(f(f(cost - budget) * r) * f(1 / 268111856));
    }
}
export function fallRate(raw) {
    if (raw === 127)
        return 65535;
    if (raw === 126)
        return 24;
    return raw < 50 ? f(f((2 * raw + 1) * f(1 / 128)) * f(.2)) : f(f(60 / f(126 - raw)) * f(.2));
}
export class Envelope {
    state = 0;
    level = f(FLOOR * 10);
    remaining = 0;
    attack;
    hold;
    decay;
    sustain;
    release;
    constructor(t, a, h, d, s, r) {
        this.attack = t.attack[a];
        this.hold = Math.floor((h + 1) ** 2 / 4);
        this.decay = fallRate(d);
        this.sustain = t.sustain[s];
        this.release = fallRate(r);
    }
    db() { return this.state === 0 && this.attack === 0 ? 0 : f(this.level * f(.1)); }
    expired() { return this.state === 4 && this.db() < FLOOR; }
    update() {
        let increment = 5;
        if (this.state === 0) {
            for (let i = 0; i < increment; i++) {
                this.level = f(this.level * this.attack);
                if (this.level > -.03125) {
                    this.level = 0;
                    this.state = 1;
                    this.remaining = this.hold;
                    return;
                }
            }
        }
        else if (this.state === 1) {
            if (this.remaining > increment) {
                this.remaining -= increment;
                return;
            }
            increment -= this.remaining;
            this.remaining = 0;
            this.state = 2;
            this.decayStep(increment);
        }
        else if (this.state === 2)
            this.decayStep(increment);
        else if (this.state === 4)
            this.level = f(this.level - f(this.release * f(increment)));
    }
    decayStep(increment) {
        this.level = f(this.level - f(this.decay * f(increment)));
        if (this.level < this.sustain) {
            this.level = this.sustain;
            this.state = 3;
        }
    }
}
/** Current music has no sweep/portamento command, but its default counter still advances. */
export class Sweep {
    pitch = 0;
    duration;
    counter = 0;
    timed = false;
    constructor(gate) { this.duration = gate > 0 ? gate : -1; }
    value() { return 0; }
    advance(sequenceTick = false) { if (sequenceTick !== this.timed)
        this.counter = Math.min(this.duration, this.counter + (sequenceTick ? 1 : 5)); }
}
export class Lfo {
    phase = 0;
    elapsed = 0;
    depth = 0;
    speed = 6.25;
    delay = 0;
    range = 1;
    parameters(depth, speed, delay, range) {
        this.depth = f(depth / 128);
        this.speed = f(speed * .390625);
        this.delay = delay * 5;
        this.range = range;
    }
    update() {
        let increment = 5;
        if (this.elapsed < this.delay) {
            if (this.elapsed + increment <= this.delay) {
                this.elapsed += increment;
                return;
            }
            increment -= this.delay - this.elapsed;
            this.elapsed = this.delay;
        }
        const phase = f(this.phase + f(this.speed * f(f(increment) * f(.001))));
        this.phase = f(phase - f(Math.trunc(phase)));
    }
    value(t) {
        if (!this.depth || this.elapsed < this.delay)
            return 0;
        const i = Math.trunc(f(this.phase * 128));
        const sine = i < 32 ? t.sine[i] : i < 64 ? t.sine[64 - i] : i < 96 ? -t.sine[i - 64] : -t.sine[128 - i];
        return f(f(this.range) * f(this.depth * f(sine * f(1 / 127))));
    }
}
