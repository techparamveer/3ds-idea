/** Narrow BCLYT decoder. Unknown sections and pane extensions are retained. */
export type LayoutPane = {
  kind: string; name: string; flags: number; origin: number; alpha: number;
  userData: Uint8Array; translation: number[]; rotation: number[]; scale: number[]; size: number[];
  children: LayoutPane[]; extension: Uint8Array;
  picture?: { colors: number[][]; material: number; uvSets: number[][] };
};
export type DecodedLayout = {
  version: number; canvas: { origin: number; width: number; height: number } | null;
  textures: string[]; fonts: string[]; roots: LayoutPane[];
  unsupported: { tag: string; offset: number; bytes: Uint8Array }[];
};

export function decodeLayout(bytes: Uint8Array): DecodedLayout {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const range = (at: number, size: number, end = bytes.length) => {
    if (!Number.isSafeInteger(at) || !Number.isSafeInteger(size) || at < 0 || size < 0 || at + size > end)
      throw new Error('Layout read outside section');
  };
  const ascii = (at: number, length: number) => {
    range(at, length);
    const text = bytes.subarray(at, at + length);
    const end = text.indexOf(0);
    return new TextDecoder('utf-8', { fatal: true }).decode(end < 0 ? text : text.subarray(0, end));
  };
  const floats = (at: number, count: number) => Array.from({ length: count }, (_, i) => {
    const number = view.getFloat32(at + i * 4, true);
    if (!Number.isFinite(number)) throw new Error('Non-finite pane value');
    return number;
  });
  range(0, 20);
  if (bytes.length > 64 * 1024 * 1024 || ascii(0, 4) !== 'CLYT' || view.getUint16(4, true) !== 0xfeff || view.getUint32(12, true) !== bytes.length)
    throw new Error('Expected little-endian CLYT');
  const result: DecodedLayout = { version: view.getUint32(8, true), canvas: null, textures: [], fonts: [], roots: [], unsupported: [] };
  let at = view.getUint16(6, true), previous: LayoutPane | null = null;
  if (at < 20 || at > bytes.length) throw new Error('Invalid CLYT header size');
  const parents: LayoutPane[] = [], entered = new Set<LayoutPane>();
  const seenLists = new Set<string>();
  const paneKinds = new Set(['pan1', 'pic1', 'bnd1', 'txt1', 'wnd1']);
  const count = view.getUint16(16, true);
  for (let i = 0; i < count; i++) {
    range(at, 8);
    const tag = ascii(at, 4), length = view.getUint32(at + 4, true), end = at + length;
    if (length < 8) throw new Error('Invalid layout section length');
    range(at, length);
    if (tag === 'lyt1') {
      range(at, 20, end);
      if (result.canvas) throw new Error('Duplicate canvas section');
      const [width, height] = floats(at + 12, 2);
      if (width <= 0 || height <= 0) throw new Error('Invalid layout dimensions');
      result.canvas = { origin: view.getUint32(at + 8, true), width, height };
    } else if (tag === 'txl1' || tag === 'fnl1') {
      range(at, 12, end);
      if (seenLists.has(tag)) throw new Error('Duplicate resource list');
      seenLists.add(tag);
      const n = view.getUint32(at + 8, true), base = at + 12;
      range(base, n * 4, end);
      const names = Array.from({ length: n }, (_, j) => {
        const start = base + view.getUint32(base + j * 4, true);
        if (start < base + n * 4) throw new Error('Name points into offset table');
        range(start, 1, end);
        const stop = bytes.indexOf(0, start);
        if (stop < start || stop >= end) throw new Error('Unterminated resource name');
        return ascii(start, stop - start);
      });
      if (tag === 'txl1') result.textures = names;
      else result.fonts = names;
    } else if (paneKinds.has(tag)) {
      range(at, 0x4c, end);
      const pane: LayoutPane = {
        kind: tag, name: ascii(at + 12, 16), flags: bytes[at + 8], origin: bytes[at + 9], alpha: bytes[at + 10],
        userData: bytes.slice(at + 28, at + 36), translation: floats(at + 36, 3), rotation: floats(at + 48, 3),
        scale: floats(at + 60, 2), size: floats(at + 68, 2), children: [], extension: bytes.slice(at + 76, end),
      };
      if (tag === 'pic1') {
        range(at, 0x60, end);
        const n = view.getUint16(at + 0x5e, true);
        range(at + 0x60, n * 32, end);
        pane.picture = {
          colors: Array.from({ length: 4 }, (_, j) => Array.from(bytes.subarray(at + 0x4c + j * 4, at + 0x50 + j * 4))),
          material: view.getUint16(at + 0x5c, true),
          uvSets: Array.from({ length: n }, (_, j) => floats(at + 0x60 + j * 32, 8)),
        };
      }
      if (parents.length) parents[parents.length - 1].children.push(pane);
      else result.roots.push(pane);
      previous = pane;
    } else if (tag === 'pas1') {
      if (length !== 8 || !previous || entered.has(previous) || parents.length >= 64) throw new Error('Invalid pane hierarchy start');
      entered.add(previous);
      parents.push(previous);
      previous = null;
    } else if (tag === 'pae1') {
      if (length !== 8 || !parents.length) throw new Error('Invalid pane hierarchy end');
      parents.pop();
      previous = null;
    } else {
      result.unsupported.push({ tag, offset: at, bytes: bytes.slice(at, end) });
    }
    at = end;
  }
  if (at !== bytes.length || parents.length) throw new Error('Incomplete layout sections/hierarchy');
  return result;
}
