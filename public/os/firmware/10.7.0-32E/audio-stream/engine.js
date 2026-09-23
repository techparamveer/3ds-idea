import { resourcesForEngine, selectRegion } from "./resources.js";
import { archiveGain, capturePan, clamp, dbGain, Envelope, f, FRAME, Lfo, livePan, noteGain, panGains, pitchBend, pitchRatio, RATE, sendGain, SequenceClock, span, Sweep, trackGain } from "./arithmetic.js";
import { CaptureDsp } from "./dsp.js";
const NONE = 0, START = 1, ATTACK = 2, DECAY = 3, SUSTAIN = 4, RELEASE = 5;
class Voice {
    state = NONE;
    trackId = -1;
    prio = 0;
    vol = 0;
    noteLength = -1;
    key = 0;
    org_key = 0;
    velocity = 0;
    pan = 0;
    span = 0;
    ext_ampl = 0;
    ext_pan = 0;
    ext_tune = 0;
    envelope;
    sweep;
    lfo;
    dsp;
    wave;
    ignore_note_off = false;
    base_rate = 0;
    pitch_mul = 0;
    loop = false;
    loop_start = 0;
    inc = 0;
    vol_l = 0;
    vol_r = 0;
    modType = 0;
    flags = null;
    region_vol = 0;
    send_main = 0;
    send_a = 0;
    send_b = 0;
    release() { this.prio = 1; this.state = RELEASE; this.envelope.state = 4; }
    kill() { this.state = NONE; this.trackId = -1; this.prio = 0; this.vol = 0; this.noteLength = -1; }
    snapshot() {
        if (this.state === NONE)
            return { state: this.state, trackId: this.trackId, prio: this.prio, vol: this.vol, noteLength: this.noteLength };
        const { wave, dsp, ...state } = this;
        return { ...state, envelope: { ...this.envelope }, sweep: { ...this.sweep }, lfo: { ...this.lfo },
            dsp: dsp.snapshot(), waveSha256: wave.sha256, waveSamples: wave.samples.length };
    }
}
class Track {
    player;
    num;
    alive = false;
    state = [false, false, false, false];
    pos = 0;
    wait = 0;
    stack = [];
    prio = 0;
    patch = 0;
    bank_no = 0;
    vol = 127;
    expr = 127;
    velocity_range = 127;
    pan = 0;
    initial_pan = 64;
    span = 0;
    pitchBend = 0;
    pitchBendRange = 2;
    transpose = 0;
    portaKey = 60;
    portaTime = 0;
    sweepPitch = 0;
    a = 255;
    h = 255;
    d = 255;
    s = 255;
    r = 255;
    modType = 0;
    modDepth = 0;
    modSpeed = 16;
    modRange = 1;
    modDelay = 0;
    mainsend = 127;
    fxsend_a = 0;
    fxsend_b = 0;
    lastCmp = true;
    waitChn = false;
    stuck = false;
    over_active = false;
    over_cmd = 0;
    over_sub = null;
    over_value = 0;
    over_extra = 0;
    pending_skip = null;
    constructor(player, num) { this.player = player; this.num = num; }
    init(pos) { this.alive = true; this.state[0] = true; this.pos = pos; this.prio = this.player.channel_prio + 64; }
    read8() { if (this.pos >= this.player.blob.length)
        throw new Error('Sequence read overflow'); return this.player.blob[this.pos++]; }
    read16() { return this.read8() * 256 + this.read8(); }
    read24() { return this.read8() * 65536 + this.read16(); }
    readVl() { let n = 0, b; do {
        b = this.read8();
        n = n * 128 + (b & 127);
    } while (b & 128); return n; }
    apply(v) {
        const p = this.player;
        v.ext_ampl = trackGain(this.vol, this.expr, p.masterVol, p.base_gain);
        v.ext_pan = livePan(this.pan);
        v.span = span(this.span);
        v.ext_tune = pitchBend(this.pitchBend, this.pitchBendRange);
        v.modType = this.modType;
        v.lfo.parameters(this.modDepth, this.modSpeed, this.modDelay, this.modRange);
        v.send_main = sendGain(this.mainsend);
        v.send_a = sendGain(this.fxsend_a);
        v.send_b = sendGain(this.fxsend_b);
    }
    push() { for (const v of this.player.voices)
        if (v.state !== NONE && v.trackId === this.num)
            this.apply(v); }
    note(key, velocity, length) {
        const p = this.player, region = selectRegion(p.resources.banks[p.entry.banks[this.bank_no]], this.patch, key, velocity);
        const wave = p.resources.waves[`${region.war_slot}:${region.wav_index}`], v = p.allocate(this.prio);
        if (!v)
            return;
        v.state = START;
        v.trackId = this.num;
        v.flags = null;
        v.prio = this.prio;
        v.key = key;
        v.org_key = region.org_key;
        v.velocity = noteGain(velocity, region.volume);
        v.region_vol = region.volume;
        v.ignore_note_off = region.ignore_note_off;
        v.pan = capturePan(region.pan, this.initial_pan);
        v.lfo = new Lfo();
        v.noteLength = length > 0 ? length : -1;
        v.wave = wave;
        v.dsp = new CaptureDsp(wave);
        v.base_rate = wave.rate;
        v.pitch_mul = region.pitch;
        v.loop = wave.loop;
        v.loop_start = wave.loop_start;
        v.inc = 0;
        v.envelope = new Envelope(p.tables, this.a === 255 ? region.attack : this.a, this.h === 255 ? region.hold : this.h, this.d === 255 ? region.decay : this.d, this.s === 255 ? region.sustain : this.s, this.r === 255 ? region.release : this.r);
        this.apply(v);
        v.sweep = new Sweep(v.noteLength);
        this.portaKey = key;
    }
    run() {
        if (!this.alive)
            return;
        for (const v of this.player.voices) {
            if (v.state === NONE || v.trackId !== this.num)
                continue;
            if (v.noteLength > 0)
                v.noteLength--;
            if (v.noteLength === 0 && v.state !== RELEASE && !v.ignore_note_off)
                v.release();
            v.sweep.advance(true);
        }
        if (this.wait) {
            this.wait--;
            if (this.wait)
                return;
        }
        let guard = 0;
        while (!this.wait) {
            if (++guard > 100000)
                throw new Error('Music command budget exceeded');
            const cmd = this.read8();
            if (cmd < 128) {
                const velocity = Math.trunc(this.read8() * this.velocity_range / 127), length = this.readVl();
                if (this.state[0])
                    this.wait = length;
                this.note(clamp(cmd + this.transpose, 0, 127), velocity, length);
                continue;
            }
            switch (cmd) {
                case 0x80:
                    this.wait = this.readVl();
                    break;
                case 0x81: {
                    const program = this.readVl();
                    if (![5, 6, 11, 14].includes(program))
                        throw new Error('Unavailable music program');
                    this.patch = program;
                    break;
                }
                case 0x88: {
                    const num = this.read8(), pos = this.read24();
                    this.player.open(num, pos);
                    break;
                }
                case 0x89:
                    this.pos = this.read24();
                    break;
                case 0x8a: {
                    const pos = this.read24();
                    if (this.stack.length < 3) {
                        this.stack.push(['call', this.pos]);
                        this.pos = pos;
                    }
                    break;
                }
                case 0xfd: {
                    const call = this.stack.pop();
                    if (call)
                        this.pos = call[1];
                    break;
                }
                case 0xb0:
                    this.player.timebase = this.read8() || 48;
                    break;
                case 0xb6:
                    this.bank_no = this.read8();
                    if (this.bank_no !== 0)
                        throw new Error('Unavailable music bank slot');
                    break;
                case 0xc0:
                    this.pan = this.read8() - 64;
                    this.push();
                    break;
                case 0xc1:
                    this.vol = this.read8();
                    this.push();
                    break;
                case 0xc4:
                    this.pitchBend = ((this.read8() + 128) & 255) - 128;
                    this.push();
                    break;
                case 0xc5:
                    this.pitchBendRange = this.read8();
                    this.push();
                    break;
                case 0xc6:
                    this.prio = (this.player.channel_prio + this.read8()) & 255;
                    break;
                case 0xc7:
                    this.state[0] = Boolean(this.read8());
                    break;
                case 0xca:
                    this.modDepth = this.read8();
                    this.push();
                    break;
                case 0xcb:
                    this.modSpeed = this.read8();
                    this.push();
                    break;
                case 0xcc:
                    this.modType = this.read8();
                    this.push();
                    break;
                case 0xcd:
                    this.modRange = this.read8();
                    this.push();
                    break;
                case 0xd0:
                    this.a = this.read8();
                    break;
                case 0xd1:
                    this.d = this.read8();
                    break;
                case 0xd2:
                    this.s = this.read8();
                    break;
                case 0xd3:
                    this.r = this.read8();
                    break;
                case 0xd5:
                    this.expr = this.read8();
                    this.push();
                    break;
                case 0xd7:
                    this.span = this.read8();
                    this.push();
                    break;
                case 0xd9:
                    this.fxsend_a = this.read8();
                    this.push();
                    break;
                case 0xe0:
                    this.modDelay = this.read16();
                    this.push();
                    break;
                case 0xe1:
                    this.player.tempo = this.read16();
                    break;
                default: throw new Error(`Unsupported music command ${cmd.toString(16)}`);
            }
        }
    }
    snapshot() {
        if (!this.alive)
            return { num: this.num, alive: false, state: [...this.state] };
        const { player: _player, ...state } = this;
        return { ...state, state: [...this.state], stack: this.stack.map(x => [...x]) };
    }
}
class Player {
    resources;
    entry;
    tables;
    blob;
    channel_prio;
    base_gain;
    tempo = 120;
    tempo_ratio = 1;
    timebase = 48;
    masterVol = 127;
    active = [0];
    variables = Array(32).fill(-1);
    clock = new SequenceClock();
    tracks;
    voices = Array.from({ length: 24 }, () => new Voice());
    now_sample = 0;
    buses = new Float64Array(3 * FRAME * 2);
    constructor(resources, entry) {
        this.resources = resources;
        this.entry = entry;
        this.tables = resources.tables;
        this.blob = entry.blob;
        this.channel_prio = entry.priority;
        this.base_gain = archiveGain(entry.volume);
        this.tracks = Array.from({ length: 16 }, (_, num) => new Track(this, num));
        this.tracks[0].init(entry.start);
    }
    open(num, pos) { if (num > 0 && num < 16 && !this.active.includes(num)) {
        this.tracks[num].init(pos);
        this.active.push(num);
    } }
    allocate(priority) {
        let best = this.voices[0];
        for (const v of this.voices)
            if (v.prio < best.prio || (v.prio === best.prio && v.vol < best.vol))
                best = v;
        if (priority < best.prio)
            return null;
        best.noteLength = -1;
        best.vol = 1 << 30;
        return best;
    }
    update(v) {
        if (v.state === NONE)
            return;
        if (v.envelope.expired()) {
            v.kill();
            return;
        }
        const modulation = v.lfo.value(this.tables);
        let pitch = f(f(v.sweep.value() + f(v.key - v.org_key)) + v.ext_tune);
        if (v.modType === 0)
            pitch = f(pitch + modulation);
        const ratio = f(f(v.pitch_mul) * pitchRatio(this.tables, pitch));
        v.inc = f(v.base_rate * ratio / RATE);
        const [left, right] = panGains(this.tables, v.pan, v.ext_pan, v.modType === 2 ? modulation : 0);
        v.sweep.advance();
        v.lfo.update();
        v.envelope.update();
        v.state = [ATTACK, DECAY, DECAY, SUSTAIN, RELEASE][v.envelope.state];
        let amp = f(dbGain(this.tables, v.envelope.db()) * f(v.velocity * v.ext_ampl));
        if (v.modType === 1)
            amp = f(amp * dbGain(this.tables, f(v.lfo.value(this.tables) * 6)));
        v.vol = Math.trunc(amp * (1 << 20));
        v.vol_l = f(amp * left);
        v.vol_r = f(amp * right);
    }
    renderFrame() {
        const startSample = this.now_sample;
        this.clock.advance(() => [this.tempo, this.timebase, this.tempo_ratio], () => {
            for (let i = 0; i < this.active.length; i++)
                this.tracks[this.active[i]].run();
        });
        for (const i of this.active)
            this.tracks[i].push();
        for (const v of this.voices)
            this.update(v);
        this.buses.fill(0);
        for (const v of this.voices) {
            if (v.state === NONE || v.inc <= 0)
                continue;
            const gains = [v.send_main, v.send_a, v.send_b].map(send => [f(v.vol_l * send), f(v.vol_r * send)]);
            v.dsp.mix(v.inc, gains, this.buses);
            if (!v.dsp.enabled)
                v.kill();
        }
        const pcm = new Int16Array(FRAME * 2);
        for (let i = 0; i < pcm.length; i++)
            pcm[i] = clamp(this.buses[i] + this.buses[FRAME * 2 + i] + this.buses[FRAME * 4 + i], -32768, 32767);
        this.now_sample += FRAME;
        return { startSample, pcm };
    }
    snapshot() {
        const bytes = new Uint8Array(4);
        new DataView(bytes.buffer).setFloat32(0, this.clock.remaining_fraction, true);
        return { sample: this.now_sample, state: {
                player: { rate: RATE, channel_prio: this.channel_prio, base_gain: this.base_gain, tempo: this.tempo,
                    tempo_ratio: this.tempo_ratio, timebase: this.timebase, masterVol: this.masterVol, active: [...this.active], variables: [...this.variables] },
                clock: { fraction: this.clock.remaining_fraction, fractionBits: Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('') },
                rng: { state: 0x12345678 }, tracks: this.tracks.map(t => t.snapshot()), voices: this.voices.map(v => v.snapshot()), auxReturns: { a: 1, b: 1 },
            } };
    }
}
export function createNativeHomeMusic(resources, entry) {
    const decoded = resourcesForEngine(resources);
    if (entry !== 'music' && entry !== 'music-resume')
        throw new Error('Unsupported HOME music entry');
    const player = new Player(decoded, decoded.entries[entry]);
    return Object.freeze({ renderFrame: () => player.renderFrame(), snapshot: () => player.snapshot() });
}
