/** GL source-over RGB is premultiplied; Canvas ImageData needs straight RGBA.
 * The overlay target's alpha must track coverage, not native framebuffer alpha. */
export function copyNativeOverlay(source:Uint8Array,destination:Uint8ClampedArray,width:number,height:number){
 if(source.length!==width*height*4||destination.length!==source.length)throw new Error('Native overlay dimensions differ');
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const from=((height-1-y)*width+x)*4,to=(y*width+x)*4,alpha=source[from+3];
  for(let channel=0;channel<3;channel++)destination[to+channel]=alpha?Math.round(source[from+channel]*255/alpha):0;
  destination[to+3]=alpha;
 }
}
