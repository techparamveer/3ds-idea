/** Bitmap glyphs keep the CFNT bearings and advances instead of tracing to WOFF. */
export type Glyph = { sheet: number; x: number; y: number; width: number; height: number; left: number; advance: number };
export type FontManifest = {
  schema: 1;
  sourceSha256: string;
  height: number;
  width?: number;
  baseline: number;
  ascent?: number;
  lineFeed?: number;
  colorMode?: 'alpha' | 'luminance-alpha';
  sheets: string[];
  glyphs: Record<string, Glyph>;
  fallback: Glyph | null;
};

export type NativeGlyphQuad={glyph:Glyph;x:number;y:number;width:number;height:number;right?:number;bottom?:number};
/** Bounded NW writer flags 0x100 (middle-left) and 0x111 (middle-center):
 * one line, automatic line alignment and no added character spacing. */
function nativeSingleLineGlyphQuads(manifest:FontManifest,value:string,width:number,height:number,size:number[],alignment:3|4):NativeGlyphQuad[]{
  const f=Math.fround,sx=f(size[0]/(manifest.width??manifest.height)),sy=f(size[1]/manifest.height);
  const glyphs=Array.from(value,char=>manifest.glyphs[String(char.codePointAt(0))]??manifest.fallback);
  const runWidth=glyphs.reduce((n,g)=>f(n+f((g?.advance??0)*sx)),0);
  const rectHeight=f((manifest.lineFeed??manifest.height)*sy);
  let x=alignment===4?-Math.ceil(f(runWidth*.5)):0;
  const y=f(f(-Math.ceil(f(rectHeight*.5))+f((manifest.ascent??manifest.baseline)*sy))-f(manifest.baseline*sy));
  const quads:NativeGlyphQuad[]=[];
  for(const glyph of glyphs){if(!glyph)continue;
    if(glyph.width){
      const left=f(x+f(glyph.left*sx)),glyphWidth=f(glyph.width*sx),glyphHeight=f(glyph.height*sy),offsetX=alignment===4?width/2:0,offsetY=height/2;
      // The writer emits float32 endpoints before the pane-origin translation.
      // Keep those vertices; screen-space rounding would also affect callers
      // such as Health whose coordinates already include a transform/scroll.
      quads.push({glyph,x:offsetX+left,y:offsetY+y,width:glyphWidth,height:glyphHeight,
        right:offsetX+f(left+glyphWidth),bottom:offsetY+f(y+glyphHeight)});
    }
    x=f(x+f(glyph.advance*sx));
  }
  return quads;
}
export function nativeCenteredGlyphQuads(manifest:FontManifest,value:string,width:number,height:number,size:number[]):NativeGlyphQuad[]{
  return nativeSingleLineGlyphQuads(manifest,value,width,height,size,4);
}
export function nativeLeftGlyphQuads(manifest:FontManifest,value:string,width:number,height:number,size:number[]):NativeGlyphQuad[]{
  return nativeSingleLineGlyphQuads(manifest,value,width,height,size,3);
}
export type AlphaSurface={width:number;height:number;data:Uint8ClampedArray};
/** Bilinear font coverage at pixel centres; fractional quad edges are not
 * antialiased. In upright LCD coordinates horizontal ties belong to the
 * right edge, not the left (see settings-footer-glyph-edge-2026-09-26.md).
 * Source includes one unscaled atlas texel around every edge. */
export function rasterNativeAlphaGlyph(target:AlphaSurface,source:AlphaSurface,quad:NativeGlyphQuad){
  const {x,y,width,height,glyph}=quad;
  if(width<=0||height<=0||source.width!==glyph.width+2||source.height!==glyph.height+2)throw new Error('Invalid native glyph raster bounds');
  // Only the native writer supplies rounded local endpoints. Other callers
  // retain their own coordinate arithmetic, including transformed Health text.
  const right=quad.right??x+width,bottom=quad.bottom??y+height;
  for(let py=Math.max(0,Math.ceil(y-.5));py<Math.min(target.height,Math.ceil(bottom-.5));py++)for(let px=Math.max(0,Math.floor(x-.5)+1);px<Math.min(target.width,Math.floor(right-.5)+1);px++){
    const u=(px+.5-x)/width*glyph.width+.5,v=(py+.5-y)/height*glyph.height+.5,ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy;
    let alpha=0;
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)alpha+=source.data[((iy+dy)*source.width+ix+dx)*4+3]*(dx?fx:1-fx)*(dy?fy:1-fy);
    const at=(py*target.width+px)*4,a=alpha/255,b=target.data[at+3]/255;
    // Alpha fonts are white coverage masks; don't interpolate Canvas's zero RGB
    // under transparent pixels into the material's text color.
    const result=a+b*(1-a);target.data[at]=target.data[at+1]=target.data[at+2]=result?255:0;target.data[at+3]=result*255;
  }
}

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
      (m.ascent !== undefined && (!Number.isInteger(m.ascent) || m.ascent < 0 || m.ascent > 255)) ||
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
  private glyphMasks=new Map<Glyph,AlphaSurface>();
  private glyphMaskBytes=0;
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
    size: number[], alignment: number, spacing=0, lineSpacing=0, lineAlignment=0, rasterPhase:readonly [number,number]=[0,0]) {
    const sx=size[0]/(this.manifest.width??this.manifest.height), sy=size[1]/this.manifest.height;
    const lines=value.replace(/\r\n?/g,'\n').split('\n').map(line=>Array.from(line,char=>this.manifest.glyphs[String(char.codePointAt(0))]??this.manifest.fallback));
    if(lines.length===1&&(alignment===4||alignment===3&&this.manifest.colorMode==='alpha')&&lineAlignment===0&&spacing===0){
      // NW writer flags 0x100/0x111: only the centered axis subtracts ceil
      // half the measured rectangle before FINF ascent and TGLP baseline
      // (0x2ffc90/0x300340). Keep fractional advances. Line
      // spacing cannot change a single line, even when an MSBT style sets it.
      const quads=alignment===3?nativeLeftGlyphQuads(this.manifest,value,width,height,size):nativeCenteredGlyphQuads(this.manifest,value,width,height,size);
      if(this.manifest.colorMode==='luminance-alpha'){
        for(const q of quads){const g=q.glyph;c.drawImage(this.sheets[g.sheet],g.x,g.y,g.width,g.height,q.x,q.y,q.width,q.height);}
      }else{
        const [dx,dy]=rasterPhase;
        const image=c.createImageData(Math.ceil(width)+Math.ceil(dx),Math.ceil(height)+Math.ceil(dy));
        // Sample original atlas coverage at final LCD centers. Moving an
        // already sampled pane image would perform a second linear filter.
        for(const q of quads)rasterNativeAlphaGlyph(image,this.glyphMask(q.glyph),{...q,x:q.x+dx,y:q.y+dy,right:q.right===undefined?undefined:q.right+dx,bottom:q.bottom===undefined?undefined:q.bottom+dy});
        c.putImageData(image,0,0);
      }
      return;
    }
    const lineHeight=(this.manifest.lineFeed??this.manifest.height)*sy+lineSpacing;
    const blockHeight=size[1]+(lines.length-1)*lineHeight;
    const vertical=Math.floor(alignment/3);
    // The centred NW writer rounds the block and each line's half-width up.
    // Keeping fractional half-widths shifts some Settings lines by one pixel.
    const y0=vertical===1?height/2-Math.ceil(blockHeight/2):vertical*(height-blockHeight)/2;
    const widths=lines.map(glyphs=>glyphs.reduce((n,g)=>n+(g?.advance??0)*sx+spacing,0)-(glyphs.length?spacing:0));
    const blockWidth=Math.max(0,...widths);
    lines.forEach((glyphs,row)=>{
      const runWidth=widths[row],horizontal=lineAlignment===0?alignment%3:lineAlignment-1;
      let x=horizontal===1&&alignment%3===1?width/2-Math.ceil(runWidth/2)
        :(alignment%3)*(width-blockWidth)/2+horizontal*(blockWidth-runWidth)/2;
      for(const g of glyphs){if(!g)continue;
        if(g.width)c.drawImage(this.sheets[g.sheet],g.x,g.y,g.width,g.height,x+g.left*sx,y0+row*lineHeight,g.width*sx,g.height*sy);
        x+=g.advance*sx+spacing;
      }
    });
  }

  /** Padded coverage for rasterNativeAlphaGlyph. */
  glyphMask(glyph:Glyph):AlphaSurface{
    const cached=this.glyphMasks.get(glyph);if(cached)return cached;
    const canvas=document.createElement('canvas');canvas.width=glyph.width+2;canvas.height=glyph.height+2;
    try{
      const ctx=canvas.getContext('2d',{willReadFrequently:true})!,sheet=this.sheets[glyph.sheet];
      ctx.drawImage(sheet,glyph.x-1,glyph.y-1,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
      const image=ctx.getImageData(0,0,canvas.width,canvas.height);
      // Native font atlases contain padding. Clamp at the sheet boundary too,
      // so a valid edge glyph never samples an invented transparent texel.
      for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
        const sx=glyph.x+x-1,sy=glyph.y+y-1;
        if(sx>=0&&sx<sheet.naturalWidth&&sy>=0&&sy<sheet.naturalHeight)continue;
        const cx=Math.max(0,Math.min(sheet.naturalWidth-1,sx))-glyph.x+1,cy=Math.max(0,Math.min(sheet.naturalHeight-1,sy))-glyph.y+1;
        image.data[(y*image.width+x)*4+3]=image.data[(cy*image.width+cx)*4+3];
      }
      const bytes=image.data.byteLength;
      while(this.glyphMaskBytes+bytes>1024*1024&&this.glyphMasks.size){const [key,old]=this.glyphMasks.entries().next().value!;this.glyphMasks.delete(key);this.glyphMaskBytes-=old.data.byteLength;}
      if(bytes<=1024*1024){this.glyphMasks.set(glyph,image);this.glyphMaskBytes+=bytes;}return image;
    }finally{canvas.width=canvas.height=0;}
  }

  dispose(){for(const {canvas} of this.tinted.values())canvas.width=canvas.height=0;this.tinted.clear();this.glyphMasks.clear();this.tintedBytes=0;this.glyphMaskBytes=0;this.sheets=[];}
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
