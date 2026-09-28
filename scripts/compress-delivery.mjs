/** Build a compact delivery asset without changing topology, transforms or UV units. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
const input=process.argv[2]??'model/candidates/joshua-xl/silver-audio-contacts-web.glb';
const output=process.argv[3]??'model/candidates/joshua-xl/silver-audio-contacts-compact.glb';
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const source=await fs.readFile(input),jsonLength=source.readUInt32LE(12);
const doc=JSON.parse(source.subarray(20,20+jsonLength));
assert.ok(!doc.extensionsUsed?.includes('EXT_meshopt_compression'),'Use the uncompressed geometry source');
// Remove orphaned export attributes while preserving every referenced stream.
const references=[];
for(const mesh of doc.meshes)for(const p of mesh.primitives){for(const key of Object.keys(p.attributes))references.push([p.attributes,key]);if(p.indices!==undefined)references.push([p,'indices']);for(const target of p.targets??[])for(const key of Object.keys(target))references.push([target,key]);}
for(const skin of doc.skins??[])if(skin.inverseBindMatrices!==undefined)references.push([skin,'inverseBindMatrices']);
for(const animation of doc.animations??[])for(const sampler of animation.samplers)references.push([sampler,'input'],[sampler,'output']);
assert.ok(!doc.accessors.some(a=>a.sparse),'Sparse accessors need explicit packing support');
const usedAccessors=new Set(references.map(([o,k])=>o[k]));const accessorMap=new Map();
doc.accessors=doc.accessors.filter((a,i)=>{if(!usedAccessors.has(i))return false;accessorMap.set(i,accessorMap.size);return true;});
for(const [object,key] of references)object[key]=accessorMap.get(object[key]);
const viewReferences=[...doc.accessors,...doc.images],usedViews=new Set(viewReferences.map(a=>a.bufferView)),viewMap=new Map();
doc.bufferViews=doc.bufferViews.filter((v,i)=>{if(!usedViews.has(i))return false;viewMap.set(i,viewMap.size);return true;});
for(const item of viewReferences)item.bufferView=viewMap.get(item.bufferView);
const binary=source.subarray(28+jsonLength),parts=[];let offset=0;
function append(bytes){const start=offset;parts.push(bytes);offset+=bytes.length;const padding=(4-offset%4)%4;if(padding){parts.push(Buffer.alloc(padding));offset+=padding;}return start;}
const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},sizes={5121:1,5123:2,5125:4,5126:4};
const semantics=new Map();for(const mesh of doc.meshes)for(const p of mesh.primitives)for(const [name,index] of Object.entries(p.attributes))semantics.set(doc.accessors[index].bufferView,name);
const byView=new Map();for(const a of doc.accessors){assert.ok(!byView.has(a.bufferView));byView.set(a.bufferView,a);}
const imageByView=new Map(doc.images.map(i=>[i.bufferView,i]));
const report={source:input,output,sourceBytes:source.length,geometryLossless:false,geometryMaxError:{},textures:[]};
for(let i=0;i<doc.bufferViews.length;i++){
 const v=doc.bufferViews[i],raw=binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength),a=byView.get(i),img=imageByView.get(i);
 if(a){
  const stride=v.byteStride??components[a.type]*sizes[a.componentType];
  assert.equal(a.byteOffset??0,0);assert.equal(raw.length,a.count*stride);
  const mode=v.target===34963?'INDICES':'ATTRIBUTES';
  const semantic=semantics.get(i),initialBits=['NORMAL','TANGENT'].includes(semantic)?12:18;
  const filter=a.componentType===5126?'EXPONENTIAL':undefined;
  let compressed,decoded,error=0;
  const limit=semantic==='POSITION'?0.001:semantic?.startsWith('TEXCOORD')?0.00001:0.001;
  for(const bits of semantic?.startsWith('TEXCOORD')?[initialBits,19,20]:[initialBits]){
   const filtered=filter?MeshoptEncoder.encodeFilterExp(new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),a.count,stride,bits):raw;
   compressed=MeshoptEncoder.encodeGltfBuffer(filtered,a.count,stride,mode);
   decoded=new Uint8Array(raw.length);MeshoptDecoder.decodeGltfBuffer(decoded,a.count,stride,compressed,mode,filter);
   if(!filter){assert.ok(Buffer.from(decoded).equals(raw),`Lossless index view ${i}`);break;}
   const before=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),after=new Float32Array(decoded.buffer);
   error=0;for(let k=0;k<before.length;k++)error=Math.max(error,Math.abs(before[k]-after[k]));
   if(error<=limit)break;
  }
  if(filter){assert.ok(error<=limit,`${semantic} error ${error}`);report.geometryMaxError[semantic]=Math.max(report.geometryMaxError[semantic]??0,error);}
  if(filter&&(a.min||a.max)){const values=new Float32Array(decoded.buffer),width=components[a.type];a.min=Array(width).fill(Infinity);a.max=Array(width).fill(-Infinity);for(let k=0;k<values.length;k++){const c=k%width;a.min[c]=Math.min(a.min[c],values[k]);a.max[c]=Math.max(a.max[c],values[k]);}}
  v.buffer=1;
  v.extensions={...v.extensions,EXT_meshopt_compression:{buffer:0,byteOffset:append(compressed),byteLength:compressed.length,byteStride:stride,count:a.count,mode,...(filter?{filter}:{})}};
 }else if(img){
  const meta=await sharp(raw).metadata();let encoded=raw;
  // Preserve small optical/legend maps exactly. Large colour atlases retain full resolution.
  const large=raw.length>500000;
  const colour=/basecolor/.test(img.name??'');
  if(large)encoded=await sharp(raw).resize({width:colour?4096:2048,height:colour?4096:2048,fit:'inside',withoutEnlargement:true}).webp({quality:colour?95:90,effort:6,alphaQuality:100}).toBuffer();
  const after=await sharp(encoded).metadata();
  report.textures.push({name:img.name,beforeBytes:raw.length,afterBytes:encoded.length,before:[meta.width,meta.height],after:[after.width,after.height],lossless:!large});
  v.buffer=0;v.byteOffset=append(encoded);v.byteLength=encoded.length;
 }else{v.buffer=0;v.byteOffset=append(raw);}
}
doc.buffers=[{byteLength:offset},{byteLength:binary.length,extensions:{EXT_meshopt_compression:{fallback:true}}}];
for(const key of ['extensionsUsed','extensionsRequired'])doc[key]=[...new Set([...(doc[key]??[]),'EXT_meshopt_compression'])];
const text=Buffer.from(JSON.stringify(doc)),json=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]),bin=Buffer.concat(parts),header=Buffer.alloc(20),binHeader=Buffer.alloc(8);
header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);binHeader.writeUInt32LE(bin.length);binHeader.writeUInt32LE(0x004e4942,4);
const result=Buffer.concat([header,json,binHeader,bin]);await fs.writeFile(output,result);report.outputBytes=result.length;report.reductionPercent=100*(1-result.length/source.length);await fs.writeFile(output+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
