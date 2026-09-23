import type { MusicEntry } from './types.ts';
export const MUSIC_PROTOCOL = 1 as const;
export const MUSIC_PROCESSOR = 'native-home-music-output-v1';
export const OUTPUT_CHUNK_FRAMES = 1024;
export interface Stamp { version: 1; epoch: number }
export interface PortLike {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
  start?(): void;
  close(): void;
}
export interface BufferConfig { outputRate: number; chunkFrames: 1024; lowWaterFrames: number; targetFrames: number; capacityFrames: number }
export function musicBufferConfig(outputRate: number): BufferConfig {
  if (!Number.isSafeInteger(outputRate) || outputRate < 8000 || outputRate > 192000) throw new Error('Unsupported music output rate');
  const round = (seconds: number) => Math.ceil(outputRate * seconds / OUTPUT_CHUNK_FRAMES) * OUTPUT_CHUNK_FRAMES;
  return { outputRate, chunkFrames: OUTPUT_CHUNK_FRAMES, lowWaterFrames: round(.2), targetFrames: round(.3), capacityFrames: 2 ** Math.ceil(Math.log2(round(.5))) };
}
export function validateBufferConfig(value: unknown): BufferConfig {
  if (!value || typeof value !== 'object') throw new Error('Missing music buffer config');
  const v = value as BufferConfig, expected = musicBufferConfig(v.outputRate);
  for (const key of Object.keys(expected) as (keyof BufferConfig)[]) if (v[key] !== expected[key]) throw new Error('Unsupported music buffer config');
  return expected;
}
export function stamped(value: unknown): value is Stamp & { type: string } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Stamp & { type: string };
  return v.version === MUSIC_PROTOCOL && Number.isSafeInteger(v.epoch) && v.epoch >= 0 && typeof v.type === 'string';
}
export const stamp = (epoch: number) => ({ version: MUSIC_PROTOCOL, epoch });
export type Attach = Stamp & { type: 'attach'; port: PortLike };
export type Prepare = Stamp & { type: 'prepare'; manifest: unknown; files: { name: string; buffer: ArrayBuffer }[] };
export type WorkerControl = Attach | Prepare | (Stamp & { type: 'start'; entry: MusicEntry; outputRate: number }) |
  (Stamp & { type: 'pause' | 'resume' | 'stop' | 'dispose' | 'status' });
export type WorkletControl = Attach | (Stamp & { type: 'begin'; config: BufferConfig; whenContextFrame?: number }) |
  (Stamp & { type: 'pause' | 'resume' | 'stop' | 'dispose' | 'status' });
export type StreamMessage = (Stamp & { type: 'producer-ready' }) |
  (Stamp & { type: 'credit'; creditEnd: number }) |
  (Stamp & { type: 'pcm'; startOutputFrame: number; frames: 1024; buffer: ArrayBuffer }) |
  (Stamp & { type: 'recycle'; buffer: ArrayBuffer });
