/** Resource objects are opaque handles; decoding owns all mutable binary buffers. */
export type MusicEntry = 'music' | 'music-resume';
export interface NativeHomeMusicResources { readonly kind: 'native-home-music'; readonly schema: 1 }
export interface Region {
  war_slot: number; wav_index: number; org_key: number; volume: number; pan: number;
  pitch: number; interp: number; attack: number; decay: number; sustain: number;
  hold: number; release: number; ignore_note_off: boolean;
}
export type BankNode = null | Region | ['direct', BankNode] |
  ['range', number, number, BankNode[]] | ['index', number[], BankNode[]];
export interface Wave { samples: Int16Array; rate: number; loop: boolean; loop_start: number; sha256: string }
export interface Entry { blob: Uint8Array; start: number; banks: number[]; volume: number; priority: number }
export interface Tables { pan: number[]; attack: number[]; pitchSemitone: number[]; pitchFraction: number[];
  gain: number[]; sustain: number[]; sine: number[] }
export interface DecodedResources { entries: Record<MusicEntry, Entry>; banks: Record<string, BankNode[]>;
  waves: Record<string, Wave>; tables: Tables }
export interface MusicFrame { startSample: number; pcm: Int16Array }
