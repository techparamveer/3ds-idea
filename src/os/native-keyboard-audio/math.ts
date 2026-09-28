/** Necessary common_back math data; provenance in docs/firmware-keyboard-control-port.md. */
export const KEYBOARD_CODE_SHA256 = 'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0';
export const GAIN_STRENGTH_SHA256 = '23f9a4739634a8efaf331affbd056dc0584e315fa26d31541a107529b3224660';

// Source 0x1a79e7: strength byte for attenuation -723..0 (13107c).
const strengthHex =
  '000101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101' +
  '010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101' +
  '020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202030303' +
  '030303030303030303030303030303030303030303030303030304040404040404040404040404040404040404040404' +
  '050505050505050505050505050505050506060606060606060606060606060607070707070707070707070708080808' +
  '08080808080808090909090909090909090a0a0a0a0a0a0a0a0b0b0b0b0b0b0b0b0c0c0c0c0c0c0c0c0d0d0d0d0d0d0e' +
  '0e0e0e0e0e0e0f0f0f0f0f10101010101011111111111212121212131313131414141414151515151616161617171718' +
  '181818191919191a1a1a1b1b1b1c1c1c1d1d1d1e1e1e1f1f1f2020202121222222232324242425252626272727282829' +
  '292a2a2b2b2c2c2d2d2e2e2f2f303131323233333435353636373838393a3a3b3c3c3d3e3f3f40414242434445454647' +
  '48494a4a4b4c4d4e4f50515252535455565758595a5b5d5e5f6061626364656768696a6b6d6e6f717273757677797a7b' +
  '7d7e7f202121212222232323242425252626262727282829292a2a2b2b2c2c2d2d2e2e2f2f3030313132333334343536' +
  '3637373839393a3b3b3c3d3e3e3f404041424343444546474748494a4b4c4d4d4e4f505152535455565758595a5b5c5d' +
  '5e5f60626364656667696a6b6c6d6f70717374757778797b7c7e7e4041424343444546474748494a4b4c4c4d4e4f5051' +
  '52535455565758595a5b5c5d5e5f6061626465666768696b6c6d6e70717274757678797b7c7d7e404142424344454646' +
  '4748494a4b4b4c4d4e4f505152535455565758595a5b5c5d5e5f6061626365666768696a6c6d6e6f717273757677797a' +
  '7c7d7e7f';
const strengths = Uint8Array.from(strengthHex.match(/../g)!, value => parseInt(value, 16));
const divisors = [0, 1, 2, 4] as const;
const words = new DataView(new ArrayBuffer(4));
export function fromWord(word: number): number {
  words.setUint32(0, word, true);
  return words.getFloat32(0, true);
}

// Only entries used by the two programs, velocities and fixed sequence controls.
const attenuation = new Map([
  [0, -32768], [10, -442], [20, -321], [30, -251], [50, -162],
  [60, -130], [82, -76], [110, -25], [116, -16], [127, 0],
]);
export function gainAttenuation(value: number): number {
  const result = attenuation.get(value);
  if (result === undefined) throw new RangeError('Unsupported common_back gain parameter');
  return result;
}
export function encodeGain(attenuation: number): number {
  const value = Math.max(-723, Math.min(0, attenuation));
  const divisor = value < -240 ? 3 : value < -120 ? 2 : value < -60 ? 1 : 0;
  return strengths[value + 723] | (divisor << 8);
}
export function decodeGain(encoded: number): number {
  const integer = ((encoded & 255) << 4) >> divisors[encoded >> 8];
  return Math.fround(integer * fromWord(0x3a010204));
}

// Native 1357e0 -> 138bf8 results, not host Math.pow approximations.
const pitchWords = new Map([[256, 0x3fa14518], [-192, 0x3f5744fd], [-384, 0x3f3504f3]]);
export function decodePitch(encoded: number): number {
  const word = pitchWords.get(encoded);
  if (word === undefined) throw new RangeError('Unsupported common_back pitch');
  return fromWord(word);
}
export function decodePan(encoded: number): number {
  return encoded >= 64
    ? Math.fround((encoded - 64) * fromWord(0x3c820821))
    : Math.fround(Math.fround(encoded * fromWord(0x3c800000)) - 1);
}
export function attackCoefficient(value: 123 | 110): number {
  return value === 123 ? 26 : 137;
}
export function decayReleaseStep(value: number): number {
  return value === 127 ? 65535 : value === 126 ? 15360
    : value < 50 ? 1 + 2 * value : Math.floor(7680 / (126 - value));
}
