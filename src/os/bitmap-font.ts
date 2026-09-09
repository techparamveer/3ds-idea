/** Bitmap glyphs keep the CFNT bearings and advances instead of tracing to WOFF. */
export type Glyph = { sheet: number; x: number; y: number; width: number; height: number; left: number; advance: number };
export type FontManifest = {
  schema: 1;
  sourceSha256: string;
  height: number;
  baseline: number;
  lineFeed?: number;
  sheets: string[];
  glyphs: Record<string, Glyph>;
  fallback: Glyph | null;
};

/** Positions use native font units scaled to size; baseline is first-line baseline. */
export function measureBitmapText(manifest: FontManifest, value: string, size: number, align: CanvasTextAlign = 'left') {
  if (!Number.isFinite(size) || size <= 0) throw new Error('Invalid font size');
  const scale = size / manifest.height;
  const lineFeed = (manifest.lineFeed ?? manifest.height) * scale;
  const lines = value.replace(/\r\n?/g, '\n').split('\n').map(line => {
    const glyphs = Array.from(line, char => manifest.glyphs[String(char.codePointAt(0))] ?? manifest.fallback);
    return { glyphs, width: glyphs.reduce((sum, glyph) => sum + (glyph?.advance ?? 0), 0) * scale };
  });
  const placed: { glyph: Glyph; x: number; y: number; width: number; height: number }[] = [];
  lines.forEach((line, row) => {
    let cursor = align === 'center' ? -line.width / 2 : align === 'right' || align === 'end' ? -line.width : 0;
    for (const glyph of line.glyphs) {
      if (!glyph) continue;
      placed.push({ glyph, x: cursor + glyph.left * scale, y: row * lineFeed - manifest.baseline * scale,
        width: glyph.width * scale, height: glyph.height * scale });
      cursor += glyph.advance * scale;
    }
  });
  return { width: lines.reduce((maximum, line) => Math.max(maximum, line.width), 0), lineWidths: lines.map(line => line.width),
    height: size + (lines.length - 1) * lineFeed, placed };
}

export function validateBitmapFont(value: unknown, dimensions?: { width: number; height: number }[]): FontManifest {
  if (!value || typeof value !== 'object') throw new Error('Invalid bitmap font manifest');
  const m = value as FontManifest;
  if (m.schema !== 1 || !/^[a-f0-9]{64}$/.test(m.sourceSha256) || !Number.isInteger(m.height) || m.height < 1 || m.height > 255 ||
      !Number.isInteger(m.baseline) || m.baseline < 0 || m.baseline > 255 ||
      (m.lineFeed !== undefined && (!Number.isInteger(m.lineFeed) || m.lineFeed < 0 || m.lineFeed > 255)) ||
      !Array.isArray(m.sheets) || !m.sheets.length || m.sheets.length > 64 ||
      m.sheets.some(name => typeof name !== 'string' || !/^sheet-\d+\.png$/.test(name)) ||
      new Set(m.sheets).size !== m.sheets.length || !m.glyphs || typeof m.glyphs !== 'object' || Array.isArray(m.glyphs))
    throw new Error('Invalid bitmap font manifest');
  const entries = Object.entries(m.glyphs);
  if (entries.length > 65536 || entries.some(([code]) => !/^(0|[1-9]\d*)$/.test(code) || Number(code) > 65535))
    throw new Error('Invalid CFNT character map');
  if (m.fallback === undefined) throw new Error('Missing fallback declaration');
  for (const glyph of [...entries.map(([, glyph]) => glyph), ...(m.fallback === null ? [] : [m.fallback])]) {
    if (!glyph || !['sheet', 'x', 'y', 'width', 'height', 'left', 'advance'].every(key => Number.isInteger(glyph[key as keyof Glyph])) ||
        glyph.sheet < 0 || glyph.sheet >= m.sheets.length || glyph.x < 0 || glyph.y < 0 || glyph.width < 0 || glyph.width > 255 ||
        glyph.height < 1 || glyph.height > 255 || glyph.left < -128 || glyph.left > 127 || glyph.advance < 0 || glyph.advance > 255)
      throw new Error('Invalid glyph metrics');
    if (dimensions) {
      const sheet = dimensions[glyph.sheet];
      if (!sheet || glyph.x + glyph.width > sheet.width || glyph.y + glyph.height > sheet.height)
        throw new Error('Glyph outside bitmap sheet');
    }
  }
  return m;
}

export class BitmapFont {
  private tinted = new Map<string, HTMLCanvasElement[]>();
  readonly manifest: FontManifest;
  private sheets: HTMLImageElement[];
  constructor(manifest: FontManifest, sheets: HTMLImageElement[]) {
    if (sheets.length !== manifest.sheets.length) throw new Error('Font sheet count mismatch');
    this.manifest = structuredClone(validateBitmapFont(manifest, sheets.map(sheet => ({ width: sheet.naturalWidth, height: sheet.naturalHeight }))));
    this.sheets = [...sheets];
  }

  draw(c: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign) {
    const run = measureBitmapText(this.manifest, value, size, align);
    // Preserve existing single-line middle positioning; baseline-aware clients can
    // use measureBitmapText directly without losing the original baseline metric.
    const baselineY = y - size / 2 + this.manifest.baseline * size / this.manifest.height;
    let sheets = this.tinted.get(color);
    if (!sheets) {
      sheets = this.sheets.map(image => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        return canvas;
      });
      // Palette is small; bound memory if a caller supplies arbitrary colours.
      if (this.tinted.size >= 16) this.tinted.clear();
      this.tinted.set(color, sheets);
    }
    for (const placed of run.placed) {
      const glyph = placed.glyph;
      if (glyph.width) c.drawImage(sheets[glyph.sheet], glyph.x, glyph.y, glyph.width, glyph.height,
        x + placed.x, baselineY + placed.y, placed.width, placed.height);
    }
  }
}

/** Explicit opt-in: absent firmware assets must not cause a silent authenticity claim. */
export async function loadBitmapFont(url: string): Promise<BitmapFont> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font manifest: HTTP ${response.status}`);
  const manifest = validateBitmapFont(await response.json());
  const sheets = await Promise.all(manifest.sheets.map(async name => {
    if (!/^sheet-\d+\.png$/.test(name)) throw new Error('Invalid font sheet name');
    const image = new Image();
    image.src = new URL(name, new URL(url, window.location.href)).href;
    await image.decode();
    return image;
  }));
  return new BitmapFont(manifest, sheets);
}
