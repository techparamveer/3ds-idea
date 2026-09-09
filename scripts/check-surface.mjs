import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { init, effect, target } from 'vgpu/node';
const gpu=await init();
try {
 const out=target(gpu,{size:[128,128],format:'rgba8unorm'});
 effect(gpu,readFileSync(new URL('../src/shaders/silver.wgsl',import.meta.url),'utf8')).draw(out);
 const pixels=await out.read();let min=255,max=0,sum=0;
 for(let i=0;i<pixels.length;i+=4){assert.equal(pixels[i],pixels[i+1]);assert.equal(pixels[i+1],pixels[i+2]);assert.equal(pixels[i+3],255);min=Math.min(min,pixels[i]);max=Math.max(max,pixels[i]);sum+=pixels[i];}
 const mean=sum/(pixels.length/4);assert.ok(min>=68&&max<=113);assert.ok(mean>84&&mean<92);assert.ok(max-min>15,'Microtexture must contain material variation');
 const report={shader:'src/shaders/silver.wgsl',deviceRendered:true,size:[128,128],rgbaBytes:pixels.length,min,max,mean,passed:true};
 writeFileSync(new URL('../docs/surface-validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{gpu.dispose();}
