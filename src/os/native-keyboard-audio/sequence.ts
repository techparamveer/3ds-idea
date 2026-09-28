import {
  attackCoefficient, decayReleaseStep, decodeGain, decodePan, decodePitch,
  encodeGain, fromWord, gainAttenuation,
} from './math.ts';

export type KeyboardSequenceCue = 6 | 7;
type Stamp = Readonly<{ update: number; quantum: number }>;
type Owner = Readonly<{ noteSlot: number; waveSlot: number }>;
/** Play prepares a loop; wavePass is the separate native wave-service boundary. */
export type KeyboardSequenceControl = Stamp & (
  | (Owner & Readonly<{ type: 'play'; resource: 13 | 14; gain: number; pitch: number; pan: number }>)
  | (Owner & Readonly<{ type: 'gain' | 'pitch' | 'pan'; value: number }>)
  | (Owner & Readonly<{ type: 'stop' }>)
  | Readonly<{ type: 'wavePass' }>
);
export type KeyboardSequenceStatus = Readonly<{
  update: number;
  quantum: number;
  sequenceActive: boolean;
  /** Includes pending starts/stops and detached envelope tails. */
  silent: boolean;
  owners: readonly Readonly<Owner>[];
}>;

type Step = Readonly<{ tick: number; velocity?: number; pan?: number }>;
type Track = {
  active: boolean; volume: number; pan: number; key: number; root: number;
  resource: 13 | 14; attack: 123 | 110; decay: number; release: number;
  end: number; steps: readonly Step[];
};
type Note = {
  active: boolean; fresh: boolean; pending: number; priority: number;
  track: number | null; phase: number; attenuation: number; duration: number;
  velocity: number; gainInput: number; panOffset: number;
  attack: number; decay: number; release: number; key: number; root: number;
  resource: 13 | 14; encodedGain: number; encodedPitch: number; encodedPan: number;
};
type Voice = { waveSlot: number; gain: number; pitch: number; pan: number };
const START = 8, STOP = 16, PITCH = 32, GAIN = 64, PAN = 128;

function tracks(): Track[] {
  // Source-bound common_back track plan, not a general SSEQ parser. Track 3 is unopened.
  return [
    { active: true, volume: 110, pan: 0, key: 73, root: 69, resource: 14,
      attack: 123, decay: 112, release: 127, end: 60,
      steps: [{ tick: 0, velocity: 116 }, { tick: 20, pan: 32, velocity: 20 },
        { tick: 40, velocity: 10 }] },
    { active: true, volume: 82, pan: 0, key: 66, root: 69, resource: 14,
      attack: 123, decay: 112, release: 127, end: 63,
      steps: [{ tick: 0, velocity: 116 }, { tick: 20, pan: -32 },
        { tick: 23, velocity: 20 }, { tick: 43, velocity: 10 }] },
    { active: true, volume: 110, pan: 0, key: 66, root: 72, resource: 13,
      attack: 110, decay: 100, release: 108, end: 80,
      steps: [{ tick: 0, pan: -32, velocity: 60 }, { tick: 20, pan: -8, velocity: 50 },
        { tick: 40, pan: 8, velocity: 30 }, { tick: 60, pan: 36, velocity: 20 }] },
  ];
}

/** One isolated source sequence, eight note slots and seventeen exclusive wave slots.
 * The host supplies native player updates; this module does not assume milliseconds.
 * Separate instances must not share a physical wave pool without an adapter.
 */
export class KeyboardSequence {
  readonly cue: KeyboardSequenceCue;
  #tracks = tracks();
  #notes: (Note | null)[] = Array.from({ length: 8 }, () => null);
  #voices: (Voice | null)[] = Array.from({ length: 8 }, () => null);
  #freeWaves = Array.from({ length: 17 }, (_, i) => i);
  #update = 0;
  #quantum = 0;
  #accumulator = 0;
  #tick = 0;
  #tempo = 240;
  #active = true;

  constructor(cue: KeyboardSequenceCue) {
    if (cue !== 6 && cue !== 7) throw new RangeError('Only keyboard sequence cues 6 and 7 are supported');
    this.cue = cue;
  }

  get status(): KeyboardSequenceStatus {
    const owners = this.#voices.flatMap((voice, noteSlot) => voice
      ? [Object.freeze({ noteSlot, waveSlot: voice.waveSlot })] : []);
    return Object.freeze({ update: this.#update, quantum: this.#quantum,
      sequenceActive: this.#active,
      silent: !this.#active && owners.length === 0 && this.#notes.every(note => !note?.active && !note?.pending),
      owners: Object.freeze(owners) });
  }

  /** Native sequence stop: detach/release tracks, retaining all envelope tails. */
  stop(): void {
    if (!this.#active) return;
    for (let i = 0; i < this.#tracks.length; i++) this.#endTrack(i);
    this.#active = false;
  }

  /** Exactly one original player update, including its final wave pass. */
  advance(): readonly KeyboardSequenceControl[] {
    const result: KeyboardSequenceControl[] = [];
    this.#update++;
    this.#accumulator = Math.fround(this.#accumulator + fromWord(0x41855555));
    while (this.#accumulator >= 5) {
      this.#quantum++;
      this.#flush(result);
      if (this.#active) {
        if (this.#tempo >= 240) {
          this.#tempo -= 240;
          this.#sequenceTick();
        }
        this.#tempo += 120;
        this.#propagate();
      }
      this.#envelopes();
      this.#accumulator = Math.fround(this.#accumulator - 5);
    }
    result.push(Object.freeze({ ...this.#stamp(), type: 'wavePass' }));
    return Object.freeze(result);
  }

  #stamp(): Stamp { return { update: this.#update, quantum: this.#quantum }; }

  #sequenceTick(): void {
    for (let trackId = 0; trackId < this.#tracks.length; trackId++) {
      const track = this.#tracks[trackId];
      if (!track.active) continue;
      for (const note of this.#notes) {
        if (note?.track === trackId && note.duration > 0) note.duration--;
      }
      for (const step of track.steps) {
        if (step.tick !== this.#tick) continue;
        if (step.pan !== undefined) track.pan = step.pan;
        if (step.velocity !== undefined) this.#allocate(trackId, step.velocity);
      }
      if (this.#tick === track.end) this.#endTrack(trackId);
    }
    this.#tick++;
    this.#active = this.#tracks.some(track => track.active);
  }

  #allocate(trackId: number, velocity: number): void {
    const track = this.#tracks[trackId];
    // Original allocator chooses the first minimum-priority slot, even for release tails.
    let slot = 0;
    for (let i = 1; i < this.#notes.length; i++) {
      if ((this.#notes[i]?.priority ?? 0) < (this.#notes[slot]?.priority ?? 0)) slot = i;
    }
    this.#notes[slot] = { active: true, fresh: true, pending: STOP, priority: 128,
      track: trackId, phase: 0, attenuation: -723 * 128, duration: 20, velocity,
      gainInput: 0, panOffset: 0, attack: attackCoefficient(track.attack),
      decay: decayReleaseStep(track.decay), release: decayReleaseStep(track.release),
      key: track.key, root: track.root, resource: track.resource,
      encodedGain: 127, encodedPitch: 0, encodedPan: 0 };
  }

  #applyTrack(note: Note, track: Track): void {
    if (note.phase === 3) return;
    note.gainInput = Math.max(-32768, gainAttenuation(track.volume) + gainAttenuation(127) + gainAttenuation(110));
    note.panOffset = track.pan;
  }

  #endTrack(id: number): void {
    const track = this.#tracks[id];
    track.active = false;
    for (const note of this.#notes) {
      if (note?.track !== id) continue;
      this.#applyTrack(note, track);
      if (note.active) { note.priority = 1; note.phase = 3; }
      note.track = null;
    }
  }

  #propagate(): void {
    for (const note of this.#notes) {
      if (!note?.active || note.track === null) continue;
      this.#applyTrack(note, this.#tracks[note.track]);
      if (note.duration === 0) { note.priority = 1; note.phase = 3; }
    }
  }

  #envelopes(): void {
    for (const note of this.#notes) {
      if (!note?.active) continue;
      if (note.fresh) { note.fresh = false; note.pending |= START; }
      switch (note.phase) {
        case 0:
          note.attenuation = -((-note.attenuation * note.attack) >> 8);
          if (note.attenuation === 0) note.phase = 1;
          break;
        case 1:
          note.attenuation -= note.decay;
          if (note.attenuation <= (gainAttenuation(0) << 7)) {
            note.attenuation = gainAttenuation(0) << 7;
            note.phase = 2;
          }
          break;
        case 3: note.attenuation -= note.release; break;
      }
      const attenuation = gainAttenuation(note.velocity) + (note.attenuation >> 7) + note.gainInput;
      if (note.phase === 3 && attenuation <= -723) {
        note.pending |= STOP;
        note.active = false;
        note.priority = 0;
        note.track = null;
        note.encodedGain = 0;
        continue;
      }
      const gain = encodeGain(attenuation), pitch = (note.key - note.root) * 64;
      const pan = Math.max(0, Math.min(127, 64 + note.panOffset));
      if (gain !== note.encodedGain) { note.encodedGain = gain; note.pending |= GAIN; }
      if (pitch !== note.encodedPitch) { note.encodedPitch = pitch; note.pending |= PITCH; }
      if (pan !== note.encodedPan) { note.encodedPan = pan; note.pending |= PAN; }
    }
  }

  #flush(result: KeyboardSequenceControl[]): void {
    // All stops/changes precede all starts in the native two-pass flush.
    for (let noteSlot = 0; noteSlot < this.#notes.length; noteSlot++) {
      const note = this.#notes[noteSlot];
      if (!note) continue;
      let voice = this.#voices[noteSlot];
      if ((note.pending & STOP) && voice) {
        result.push(Object.freeze({ ...this.#stamp(), type: 'stop', noteSlot, waveSlot: voice.waveSlot }));
        this.#freeWaves.push(voice.waveSlot);
        this.#voices[noteSlot] = voice = null;
      }
      if (note.pending & START || !voice) continue;
      for (const [flag, type, value] of [
        [PITCH, 'pitch', () => decodePitch(note.encodedPitch)],
        [GAIN, 'gain', () => decodeGain(note.encodedGain)],
        [PAN, 'pan', () => decodePan(note.encodedPan)],
      ] as const) {
        if (!(note.pending & flag)) continue;
        const converted = value();
        if (converted === voice[type]) continue;
        voice[type] = converted;
        result.push(Object.freeze({ ...this.#stamp(), type, noteSlot, waveSlot: voice.waveSlot, value: converted }));
      }
    }
    for (let noteSlot = 0; noteSlot < this.#notes.length; noteSlot++) {
      const note = this.#notes[noteSlot];
      if (!note) continue;
      if (note.pending & START) {
        const waveSlot = this.#freeWaves.shift();
        if (waveSlot === undefined) throw new Error('Isolated sequence wave pool exhausted');
        const voice = { waveSlot, gain: decodeGain(note.encodedGain),
          pitch: decodePitch(note.encodedPitch), pan: decodePan(note.encodedPan) };
        this.#voices[noteSlot] = voice;
        result.push(Object.freeze({ ...this.#stamp(), type: 'play', noteSlot, resource: note.resource, ...voice }));
      }
      note.pending = 0;
    }
  }
}

export function createKeyboardSequence(cue: KeyboardSequenceCue): KeyboardSequence {
  return new KeyboardSequence(cue);
}
