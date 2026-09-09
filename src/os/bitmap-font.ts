/** Bitmap glyphs keep the CFNT bearings and advances instead of tracing to WOFF. */
export type Glyph = { sheet: number; x: number; y: number; width: number; height: number; left: number; advance: number };
export type FontManifest = {
  schema: 1;
  sourceSha256: string;
  height: number;
  baseline: number;
  sheets: string[];
  glyphs: Record<string, Glyph>;
  fallback: Glyph | null;
};

export class BitmapFont {
  private tinted = new Map<string, HTMLCanvasElement[]>();
  constructor(readonly manifest: FontManifest, private sheets: HTMLImageElement[]) {}

  draw(c: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign) {
    const scale = size / this.manifest.height;
    const glyphs = Array.from(value, char => this.manifest.glyphs[String(char.codePointAt(0))] ?? this.manifest.fallback);
    const width = glyphs.reduce((sum, glyph) => sum + (glyph?.advance ?? 0), 0) * scale;
    let cursor = x - (align === 'center' ? width / 2 : align === 'right' || align === 'end' ? width : 0);
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
    for (const glyph of glyphs) {
      if (!glyph) continue;
      if (glyph.width) c.drawImage(sheets[glyph.sheet], glyph.x, glyph.y, glyph.width, glyph.height,
        cursor + glyph.left * scale, y - size / 2, glyph.width * scale, glyph.height * scale);
      cursor += glyph.advance * scale;
    }
  }
}

/** Explicit opt-in: absent firmware assets must not cause a silent authenticity claim. */
export async function loadBitmapFont(url: string): Promise<BitmapFont> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font manifest: HTTP ${response.status}`);
  const manifest = await response.json() as FontManifest;
  if (manifest.schema !== 1 || !/^[a-f0-9]{64}$/.test(manifest.sourceSha256) ||
      !Number.isFinite(manifest.height) || manifest.height <= 0 || !Array.isArray(manifest.sheets) ||
      manifest.sheets.length < 1 || manifest.sheets.length > 64 || !manifest.glyphs) throw new Error('Invalid bitmap font manifest');
  const sheets = await Promise.all(manifest.sheets.map(async name => {
    if (!/^sheet-\d+\.png$/.test(name)) throw new Error('Invalid font sheet name');
    const image = new Image();
    image.src = new URL(name, new URL(url, window.location.href)).href;
    await image.decode();
    return image;
  }));
  for (const glyph of [...Object.values(manifest.glyphs), ...(manifest.fallback ? [manifest.fallback] : [])]) {
    const sheet = sheets[glyph.sheet];
    if (!sheet || !Object.values(glyph).every(Number.isFinite) ||
        !Number.isInteger(glyph.sheet) || glyph.x < 0 || glyph.y < 0 || glyph.width < 0 || glyph.height < 0 ||
        glyph.advance < 0 || glyph.x + glyph.width > sheet.naturalWidth || glyph.y + glyph.height > sheet.naturalHeight)
      throw new Error('Glyph outside bitmap sheet');
  }
  return new BitmapFont(manifest, sheets);
}
