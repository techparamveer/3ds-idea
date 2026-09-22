/** Bitmap glyphs keep the CFNT bearings and advances instead of tracing to WOFF. */
export type Glyph = { sheet: number; x: number; y: number; width: number; height: number; left: number; advance: number };
export type FontManifest = {
  schema: 1;
  sourceSha256: string;
  height: number;
  width?: number;
  baseline: number;
  lineFeed?: number;
  colorMode?: 'alpha' | 'luminance-alpha';
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
      (m.width!==undefined&&(!Number.isInteger(m.width)||m.width<1||m.width>255)) ||
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
  private tinted = new Map<string, {canvas:HTMLCanvasElement;x:number;y:number}>();
  private tintedBytes=0;
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
    const key=JSON.stringify([value,size,color,align]);
    let cached=this.tinted.get(key);
    if(!cached){
      const left=Math.floor(Math.min(0,...run.placed.map(p=>p.x))),top=Math.floor(Math.min(0,...run.placed.map(p=>p.y)));
      const width=Math.max(1,Math.ceil(Math.max(0,...run.placed.map(p=>p.x+p.width))-left));
      const height=Math.max(1,Math.ceil(Math.max(0,...run.placed.map(p=>p.y+p.height))-top));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d')!;
      for(const p of run.placed)if(p.glyph.width)ctx.drawImage(this.sheets[p.glyph.sheet],p.glyph.x,p.glyph.y,p.glyph.width,p.glyph.height,p.x-left,p.y-top,p.width,p.height);
      if(this.manifest.colorMode==='luminance-alpha'){
        const pixels=ctx.getImageData(0,0,width,height);ctx.clearRect(0,0,width,height);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);
        const tint=ctx.getImageData(0,0,1,1).data;
        for(let at=0;at<pixels.data.length;at+=4){for(let i=0;i<3;i++)pixels.data[at+i]*=tint[i]/255;pixels.data[at+3]*=tint[3]/255;}
        ctx.putImageData(pixels,0,0);
      }else{ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,width,height);}
      // Cache short painted text runs, never four full copies of the six shared-font atlases.
      const bytes=width*height*4;
      while(this.tintedBytes+bytes>1024*1024&&this.tinted.size){const [oldKey,old]=this.tinted.entries().next().value!;this.tintedBytes-=old.canvas.width*old.canvas.height*4;old.canvas.width=old.canvas.height=0;this.tinted.delete(oldKey);}
      cached={canvas,x:left,y:top};if(bytes<=1024*1024){this.tinted.set(key,cached);this.tintedBytes+=bytes;}
    }
    c.drawImage(cached.canvas,x+cached.x,baselineY+cached.y);
  }

  /** CLYT font size is a two-axis native cell size, not a CSS font size. */
  drawNative(c: CanvasRenderingContext2D, value: string, width: number, height: number,
    size: number[], alignment: number, spacing=0, lineSpacing=0, lineAlignment=0) {
    const sx=size[0]/(this.manifest.width??this.manifest.height), sy=size[1]/this.manifest.height;
    const lines=value.replace(/\r\n?/g,'\n').split('\n').map(line=>Array.from(line,char=>this.manifest.glyphs[String(char.codePointAt(0))]??this.manifest.fallback));
    const lineHeight=(this.manifest.lineFeed??this.manifest.height)*sy+lineSpacing;
    const blockHeight=size[1]+(lines.length-1)*lineHeight;
    const y0=Math.floor(alignment/3)*(height-blockHeight)/2;
    const widths=lines.map(glyphs=>glyphs.reduce((n,g)=>n+(g?.advance??0)*sx+spacing,0)-(glyphs.length?spacing:0));
    const blockWidth=Math.max(0,...widths);
    lines.forEach((glyphs,row)=>{
      const runWidth=widths[row],horizontal=lineAlignment===0?alignment%3:lineAlignment-1;
      let x=(alignment%3)*(width-blockWidth)/2+horizontal*(blockWidth-runWidth)/2;
      for(const g of glyphs){if(!g)continue;
        if(g.width)c.drawImage(this.sheets[g.sheet],g.x,g.y,g.width,g.height,x+g.left*sx,y0+row*lineHeight,g.width*sx,g.height*sy);
        x+=g.advance*sx+spacing;
      }
    });
  }

  dispose(){for(const {canvas} of this.tinted.values())canvas.width=canvas.height=0;this.tinted.clear();this.tintedBytes=0;this.sheets=[];}
}

/** Explicit opt-in: absent firmware assets must not cause a silent authenticity claim. */
export async function loadBitmapFont(url: string, signal?: AbortSignal): Promise<BitmapFont> {
  const response = await fetch(url,{signal});
  if (!response.ok) throw new Error(`Font manifest: HTTP ${response.status}`);
  const manifest = validateBitmapFont(await response.json());
  const sheets = await Promise.all(manifest.sheets.map(async name => {
    if (!/^sheet-\d+\.png$/.test(name)) throw new Error('Invalid font sheet name');
    return loadNativeImage(new URL(name,new URL(url,window.location.href)).href,signal);
  }));
  return new BitmapFont(manifest, sheets);
}

/** Fetch allows an abandoned title load to cancel its pending image transfers. */
export async function loadNativeImage(url:string,signal?:AbortSignal):Promise<HTMLImageElement>{
 const response=await fetch(url,{signal});if(!response.ok)throw new Error(`Image HTTP ${response.status}: ${url}`);
 const blob=await response.blob();signal?.throwIfAborted();const objectUrl=URL.createObjectURL(blob),image=new Image();
 try{image.src=objectUrl;await image.decode();signal?.throwIfAborted();return image;}finally{URL.revokeObjectURL(objectUrl);}
}
