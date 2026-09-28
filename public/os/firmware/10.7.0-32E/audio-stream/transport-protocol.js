export const MUSIC_PROTOCOL = 1;
export const MUSIC_PROCESSOR = 'native-home-music-output-v1';
export const OUTPUT_CHUNK_FRAMES = 1024;
export function musicBufferConfig(outputRate) {
    if (!Number.isSafeInteger(outputRate) || outputRate < 8000 || outputRate > 192000)
        throw new Error('Unsupported music output rate');
    const round = (seconds) => Math.ceil(outputRate * seconds / OUTPUT_CHUNK_FRAMES) * OUTPUT_CHUNK_FRAMES;
    return { outputRate, chunkFrames: OUTPUT_CHUNK_FRAMES, lowWaterFrames: round(.2), targetFrames: round(.3), capacityFrames: 2 ** Math.ceil(Math.log2(round(.5))) };
}
export function validateBufferConfig(value) {
    if (!value || typeof value !== 'object')
        throw new Error('Missing music buffer config');
    const v = value, expected = musicBufferConfig(v.outputRate);
    for (const key of Object.keys(expected))
        if (v[key] !== expected[key])
            throw new Error('Unsupported music buffer config');
    return expected;
}
export function stamped(value) {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    return v.version === MUSIC_PROTOCOL && Number.isSafeInteger(v.epoch) && v.epoch >= 0 && typeof v.type === 'string';
}
export const stamp = (epoch) => ({ version: MUSIC_PROTOCOL, epoch });
