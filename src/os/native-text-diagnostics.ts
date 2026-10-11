import type { FontManifest } from './bitmap-font';

export type TextInkFingerprint = Readonly<{ algorithm:'fnv1a32+adler32'; bytes:number; fnv1a32:string; adler32:string }>;
export type TextInkRun = Readonly<{ before:TextInkFingerprint|null; colored:TextInkFingerprint|null }>;
export type TextFillDiagnostic = Readonly<{
 id:number; key:string; width:number; height:number;
 font:Readonly<{ name:string; sourceSha256:string; colorMode:FontManifest['colorMode']|null; width:number|null; height:number; baseline:number; ascent:number|null; lineFeed:number|null; glyphs:readonly unknown[] }>;
 runs:readonly TextInkRun[];
}>;
const immutableRecords=new WeakSet<object>();
export function immutableTextDiagnostic<T>(value:T):Readonly<T>{
 const copy=(item:unknown):unknown=>{
  if(!item||typeof item!=='object'||immutableRecords.has(item))return item;
  const result=Object.freeze(Array.isArray(item)?item.map(copy):Object.fromEntries(Object.entries(item).map(([key,child])=>[key,copy(child)])));
  immutableRecords.add(result);return result;
 };
 return copy(value) as Readonly<T>;
}

/** Non-cryptographic discriminator only. Equal checksums do not prove equal bytes. */
export function textInkFingerprint(bytes:Uint8ClampedArray):TextInkFingerprint{
 let fnv=0x811c9dc5,a=1,b=0;
 for(const byte of bytes){fnv=Math.imul(fnv^byte,0x01000193);a=(a+byte)%65521;b=(b+a)%65521;}
 return Object.freeze({algorithm:'fnv1a32+adler32',bytes:bytes.byteLength,fnv1a32:(fnv>>>0).toString(16).padStart(8,'0'),adler32:(((b<<16)|a)>>>0).toString(16).padStart(8,'0')});
}

export function textDestinationDiagnostic(ctx:CanvasRenderingContext2D){
 const m=ctx.getTransform?.();
 return immutableTextDiagnostic({width:ctx.canvas.width,height:ctx.canvas.height,
  transform:m?[m.a,m.b,m.c,m.d,m.e,m.f]:null,
  smoothing:ctx.imageSmoothingEnabled??null,smoothingQuality:ctx.imageSmoothingQuality??null,
  alpha:ctx.globalAlpha??null,composition:ctx.globalCompositeOperation??null,filter:ctx.filter??null,
  contextAttributes:ctx.getContextAttributes?.()??null});
}
type DrawDiagnostic=Readonly<{pack:string;layout:string;pane:string;key:string|null;cache:'fill'|'hit'|'fill-not-observed';fill:TextFillDiagnostic|null;destination:ReturnType<typeof textDestinationDiagnostic>;options:unknown}>;
type Sample={draws:DrawDiagnostic[];dropped:number;fillSkipped:number;hashSkipped:number;hashCount:number;hashBytes:number;hashMs:number;metadataMs:number};
export type NativeTextDiagnostic=Readonly<{draws:readonly DrawDiagnostic[];dropped:number;fillSkipped:number;hashSkipped:number;hashCount:number;hashBytes:number;hashMs:number;metadataMs:number;limits:Readonly<{draws:number;fills:number;hashBytes:number;keyLength:number}>;adaptation:true}>;
const limits=Object.freeze({draws:32,fills:256,hashBytes:2*1024*1024,keyLength:65536});

/** Allocated only by the opt-in Camera main collector. No pixels are retained. */
export function createNativeTextDiagnostic(){
 let sample:Sample|null=null,nextFill=0;
 const fills=new WeakMap<HTMLCanvasElement,TextFillDiagnostic>();
 const newFills=new WeakSet<HTMLCanvasElement>();
 return {
  get active(){return sample!==null;},
  begin(){sample={draws:[],dropped:0,fillSkipped:0,hashSkipped:0,hashCount:0,hashBytes:0,hashMs:0,metadataMs:0};},
  fingerprint(data:Uint8ClampedArray):TextInkFingerprint|null{
   if(!sample)return null;
   if(sample.hashBytes+data.byteLength>limits.hashBytes){sample.hashSkipped++;return null;}
   const start=performance.now(),result=textInkFingerprint(data);
   sample.hashMs+=performance.now()-start;sample.hashBytes+=data.byteLength;sample.hashCount++;return result;
  },
  fill(canvas:HTMLCanvasElement,key:string,fontName:string,font:FontManifest,value:string,runs:TextInkRun[]){
   if(!sample)return;
   if(nextFill>=limits.fills||key.length>limits.keyLength||value.length>1024||runs.length>32||runs.some(run=>!run.before||!run.colored)){sample.fillSkipped++;return;}
   const start=performance.now();
   const glyphs=[...new Set(Array.from(value,char=>char.codePointAt(0)!))].map(code=>({code,glyph:font.glyphs[String(code)]??font.fallback}));
   fills.set(canvas,immutableTextDiagnostic({id:++nextFill,key,width:canvas.width,height:canvas.height,
    font:{name:fontName,sourceSha256:font.sourceSha256,colorMode:font.colorMode??null,width:font.width??null,height:font.height,baseline:font.baseline,ascent:font.ascent??null,lineFeed:font.lineFeed??null,glyphs},runs}));
   newFills.add(canvas);sample.metadataMs+=performance.now()-start;
  },
  draw(canvas:HTMLCanvasElement,key:string,pack:string,layout:string,pane:string,ctx:CanvasRenderingContext2D,options:unknown){
   if(!sample)return;
   if(sample.draws.length>=limits.draws){sample.dropped++;return;}
   const start=performance.now(),fill=fills.get(canvas)??null;
   sample.draws.push(immutableTextDiagnostic({pack,layout,pane,key:key.length<=limits.keyLength?key:null,
    cache:fill?(newFills.has(canvas)?'fill':'hit'):'fill-not-observed',fill,destination:textDestinationDiagnostic(ctx),options}));
   newFills.delete(canvas);sample.metadataMs+=performance.now()-start;
  },
  end():NativeTextDiagnostic|null{
   if(!sample)return null;
   const result=immutableTextDiagnostic({...sample,limits,adaptation:true as const});sample=null;return result;
  },
 };
}
