import type { NativePixels } from './native-layout';

/** Decode our non-interlaced RGBA8 delivery PNGs without premultiplying alpha.
 * Native LA textures use RGB and alpha as independent TEV inputs, including RGB
 * under alpha zero, which an Image -> Canvas round trip destroys. */
export async function decodeNativePng(bytes:Uint8Array,expected:{width:number;height:number},signal?:AbortSignal):Promise<NativePixels>{
 signal?.throwIfAborted();
 const {width,height}=expected;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>1024*1024)throw new Error('Native PNG dimensions exceed budget');
 if(bytes.length>16*1024*1024||bytes.length<33||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))throw new Error('Invalid native PNG signature or size');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),chunks:Uint8Array[]=[];
 let offset=8,header=false,ended=false,total=0;
 while(offset+12<=bytes.length){
  const size=view.getUint32(offset),end=offset+12+size;
  if(end>bytes.length)throw new Error('Truncated native PNG chunk');
  const kind=String.fromCharCode(...bytes.subarray(offset+4,offset+8)),start=offset+8;
  if(!header&&kind!=='IHDR')throw new Error('Native PNG header must be first');
  if(kind==='IHDR'){
   if(header||size!==13||view.getUint32(start)!==width||view.getUint32(start+4)!==height)throw new Error('Native PNG dimensions differ');
   if(bytes[start+8]!==8||bytes[start+9]!==6||bytes[start+10]!==0||bytes[start+11]!==0||bytes[start+12]!==0)throw new Error('Native PNG requires non-interlaced RGBA8');
   header=true;
  }else if(kind==='IDAT'){chunks.push(bytes.subarray(start,start+size));total+=size;}
  else if(kind==='IEND'){if(size!==0||end!==bytes.length)throw new Error('Invalid native PNG end');ended=true;break;}
  else if(!(bytes[offset+4]&32))throw new Error(`Unsupported native PNG chunk ${kind}`);
  offset=end;
 }
 if(!ended||!total)throw new Error('Incomplete native PNG');
 const compressed=new Uint8Array(total);let at=0;for(const chunk of chunks){compressed.set(chunk,at);at+=chunk.length;}
 const stride=width*4,scanlines=new Uint8Array((stride+1)*height);
 const reader=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
 const abort=()=>{void reader.cancel(signal?.reason).catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
 try{
  signal?.throwIfAborted();at=0;
  for(;;){const {done,value}=await reader.read();signal?.throwIfAborted();if(done)break;
   if(at+value.length>scanlines.length)throw new Error('Native PNG inflated data exceeds dimensions');scanlines.set(value,at);at+=value.length;
  }
  if(at!==scanlines.length)throw new Error('Truncated native PNG scanlines');
 }finally{signal?.removeEventListener('abort',abort);await reader.cancel().catch(()=>{});reader.releaseLock();}
 const data=new Uint8ClampedArray(stride*height);
 for(let y=0;y<height;y++){
  const row=y*(stride+1),filter=scanlines[row];if(filter>4)throw new Error(`Unsupported native PNG filter ${filter}`);
  for(let x=0;x<stride;x++){
   const i=y*stride+x,left=x>=4?data[i-4]:0,up=y?data[i-stride]:0,corner=y&&x>=4?data[i-stride-4]:0;
   let predictor=0;
   if(filter===1)predictor=left;else if(filter===2)predictor=up;else if(filter===3)predictor=Math.floor((left+up)/2);
   else if(filter===4){const p=left+up-corner,a=Math.abs(p-left),b=Math.abs(p-up),c=Math.abs(p-corner);predictor=a<=b&&a<=c?left:b<=c?up:corner;}
   data[i]=(scanlines[row+x+1]+predictor)&255;
  }
 }
 return {width,height,data};
}
