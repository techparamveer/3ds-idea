#!/usr/bin/env node
/** CPU projection specimen for S_Back_U; no browser/GPU or guessed material lighting.
 * RGB uses the resource's Replace(Texture0) combiners. lambert2 writes One/Zero;
 * lambert1 blends the texture alpha. Alpha of the finished LCD is opaque.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
import sharp from 'sharp';
import * as THREE from 'three';
const args=process.argv.slice(2),opts={};for(let i=0;i<args.length;i+=2)opts[args[i].slice(2)]=args[i+1];
for(const k of ['output','model'])assert.ok(isAbsolute(opts[k]??''),k+' requires an absolute path');
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),modules=new Map();
function moduleUrl(path){if(modules.has(path))return modules.get(path);let s=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;s=s.replace(/from (['"])([^'"]+)\1/g,(_,q,v)=>'from '+JSON.stringify(v.startsWith('.')?moduleUrl(resolve(dirname(path),v+'.ts')):import.meta.resolve(v)));const u='data:text/javascript;base64,'+Buffer.from(s).toString('base64');modules.set(path,u);return u;}
const {soundRoomCamera}=await import(moduleUrl(join(repo,'src/scene/sound-room.ts'))),{createFirmwareModel}=await import(moduleUrl(join(repo,'src/scene/firmware-model.ts')));
const data=JSON.parse(readFileSync(opts.model)),images=new Map(),mipmaps=new Map();
for(const t of data.textures){const {data:pixels,info}=await sharp(join(dirname(opts.model),t.url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});images.set(t.name,{width:info.width,height:info.height,data:pixels});}
for(const t of data.textures){const levels=[];for(const m of t.mipmaps??[]){const {data:pixels,info}=await sharp(join(dirname(opts.model),m.url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});levels.push({width:info.width,height:info.height,data:pixels});}mipmaps.set(t.name,levels);}
const asset={data,images,mipmaps},camera=soundRoomCamera(asset),model=createFirmwareModel(asset);model.update(0,camera);model.group.updateMatrixWorld(true);
const frame=new Uint8Array(400*240*4).fill(255),meshes=[];model.group.traverse(m=>{if(m.isMesh)meshes.push(m);});
const sources=data.models[0].meshes.flatMap(m=>m.submeshes.map(()=>data.models[0].materials[m.material]));const materialByMesh=new Map(meshes.map((mesh,i)=>[mesh,sources[i]]));meshes.sort((a,b)=>a.renderOrder-b.renderOrder);
const edge=(a,b,x,y)=>(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
let triangles=0;const lodCounts={};const nativeMips=opts.sampling!=='base';
for(const mesh of meshes){
  const material=materialByMesh.get(mesh);
  assert.ok(material);const p=material.MaterialParams;
  assert.equal(p.TexEnvStages[0].Source.Color[0],'Texture0');assert.equal(p.TexEnvStages[0].Combiner.Color,'Replace');
  assert.ok(p.TexEnvStages.slice(1).every(s=>s.Combiner.Color==='Replace'&&s.Source.Color[0]==='Previous'));
  const blend=p.BlendFunction.ColorSrcFunc==='SourceAlpha';assert.ok(blend||p.BlendFunction.ColorSrcFunc==='One');assert.equal(p.BlendFunction.ColorDstFunc,blend?'OneMinusSourceAlpha':'Zero');
  if(blend)assert.equal(p.TexEnvStages[0].Source.Alpha[0],'Texture0');
  const levels=[images.get(material.Texture0Name),...(mipmaps.get(material.Texture0Name)??[])],base=levels[0],g=mesh.geometry,position=g.getAttribute('position'),uv=g.getAttribute('uv'),index=g.index;
  const transform=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,new THREE.Matrix4().multiplyMatrices(camera.matrixWorldInverse,mesh.matrixWorld));
  const vertices=Array.from({length:position.count},(_,i)=>{const v=new THREE.Vector4(position.getX(i),position.getY(i),position.getZ(i),1).applyMatrix4(transform);return [(v.x/v.w+1)*200,(1-v.y/v.w)*120,1/v.w,uv.getX(i),uv.getY(i)];});
  const sample=(u,v,level)=>{const im=levels[level];const x=u*im.width-.5,y=(1-v)*im.height-.5,x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,rgba=[0,0,0,0];for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const xx=((x0+dx)%im.width+im.width)%im.width,yy=((y0+dy)%im.height+im.height)%im.height,w=(dx?fx:1-fx)*(dy?fy:1-fy);for(let c=0;c<4;c++)rgba[c]+=im.data[(yy*im.width+xx)*4+c]*w;}return rgba;};
  for(let i=0;i<index.count;i+=3){const a=vertices[index.getX(i)],b=vertices[index.getX(i+1)],c=vertices[index.getX(i+2)],area=edge(a,b,c[0],c[1]);if(area>=0)continue;triangles++;
    for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));y<Math.min(240,Math.ceil(Math.max(a[1],b[1],c[1])));y++)for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));x<Math.min(400,Math.ceil(Math.max(a[0],b[0],c[0])));x++){
      const wa=edge(b,c,x+.5,y+.5)/area,wb=edge(c,a,x+.5,y+.5)/area,wc=1-wa-wb;if(Math.min(wa,wb,wc)<-1e-9)continue;
      const uvAt=(px,py)=>{const w0=edge(b,c,px,py)/area,w1=edge(c,a,px,py)/area,w2=1-w0-w1,den=w0*a[2]+w1*b[2]+w2*c[2];return [(w0*a[3]*a[2]+w1*b[3]*b[2]+w2*c[3]*c[2])/den,(w0*a[4]*a[2]+w1*b[4]*b[2]+w2*c[4]*c[2])/den];};
      const [u,v]=uvAt(x+.5,y+.5),dx=uvAt(x+1.5,y+.5),dy=uvAt(x+.5,y+1.5),rho=Math.max(Math.hypot((dx[0]-u)*base.width,(dx[1]-v)*base.height),Math.hypot((dy[0]-u)*base.width,(dy[1]-v)*base.height));
      const level=nativeMips?Math.max(0,Math.min(levels.length-1,Math.floor(Math.log2(rho)+.5))):0;lodCounts[level]=(lodCounts[level]??0)+1;
      const tex=sample(u,v,level),alpha=blend?tex[3]/255:1,at=(y*400+x)*4;
      for(let ch=0;ch<3;ch++)frame[at+ch]=Math.round(tex[ch]*alpha+frame[at+ch]*(1-alpha));
    }
  }
}
mkdirSync(opts.output,{recursive:true});await sharp(frame,{raw:{width:400,height:240,channels:4}}).png().toFile(join(opts.output,'room-cpu-source.png'));
let comparison;
if(opts.native){assert.ok(isAbsolute(opts.native));const native=await sharp(opts.native).extract({left:0,top:0,width:400,height:240}).ensureAlpha().raw().toBuffer();
  // Exclude title, blue divider, birds, footer and record. This measures only room.
  let sum=0,max=0,n=0;for(const [y0,y1]of [[34,104],[113,171]])for(let y=y0;y<y1;y++)for(let x=0;x<400;x++)for(let ch=0;ch<3;ch++){const at=(y*400+x)*4+ch,d=Math.abs(native[at]-frame[at]);sum+=d;max=Math.max(max,d);n++;}
  comparison={regions:[[0,34,400,70],[0,113,400,58]],meanAbsoluteRgbError:sum/n,maxAbsoluteRgbError:max,method:'CPU bilinear perspective specimen; not GPU or pixel-equivalence acceptance'};
  await sharp({create:{width:800,height:240,channels:4,background:'#fff'}}).composite([{input:await sharp(frame,{raw:{width:400,height:240,channels:4}}).png().toBuffer(),left:0,top:0},{input:await sharp(native,{raw:{width:400,height:240,channels:4}}).png().toBuffer(),left:400,top:0}]).png().toFile(join(opts.output,'room-source-native.png'));
}
model.dispose();const report={schema:1,triangles,sampling:nativeMips?'authored-mips':'base',lodCounts,camera:camera.toJSON().object,comparison};writeFileSync(join(opts.output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({triangles,lodCounts,comparison}));
