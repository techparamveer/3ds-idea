import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {evaluateNativeMaterial,nativeTextureSamplePixels,nativeWindowPatches,rasterNativePicture,sampleNativeTexture,transformNativeUV,interpolateNativeQuad,nativeWhite} from '../src/os/native-layout.ts';
import {decodeNativePng} from '../src/os/native-png.ts';
const m=(color=0,alpha=0)=>({sourceFormat:'FLYT',capability:'amiibo-two-texture-v1',name:'source',bufferColor:[4,110,110,37],constantColors:[[63,190,190,239]],textureOnly:false,textureMaps:[0,1].map(texture=>({texture,wrapS:0,wrapT:0,minFilter:0,magFilter:0})),textureMatrices:[],coordinateGenerators:[0,1].map(source=>({type:0,source})),sourceCombiners:[{color,alpha,reserved:0}],tevStages:[],unsupported:[]});
// Independent equations transcribed from 1ed5bc/1ed5d4/1ed5ec and fixed
// stages 1ecdf8/1ece10/1ece58, including texture-object RGB patches.
function equation(material,samples,primary,formats){
 const rgb=samples.map((s,i)=>formats[i]===8||formats[i]===11?[1,1,1,s[3]]:s),mode=material.sourceCombiners?.[0];
 const combined=mode?[0,1,2].map(i=>mode.color===0?rgb[1][i]*samples[1][3]+rgb[0][i]*(1-samples[1][3]):rgb[1][i]*rgb[0][i]):rgb[0].slice(0,3);
 combined.push(mode?(mode.alpha===0?Math.min(1,samples[0][3]+samples[1][3]):samples[0][3]*samples[1][3]):samples[0][3]);
 return combined.map((c,i)=>(material.bufferColor[i]*(1-c)+material.constantColors[0][i]*c)/255*primary[i]);
}
function close(actual,expected){actual.forEach((x,i)=>assert.ok(Math.abs(x-expected[i])<1e-12,`${i}: ${x} != ${expected[i]}`));}
test('bounded FLYT equations retain alpha-only texture RGB, saturated alpha, register interpolation and vertex tint',()=>{
 for(const color of [0,1])for(const alpha of [0,1])for(const formats of [[8,7],[11,8],[5,5],[7,11]])for(const a of [0,.23,.8,1]){
  const material=m(color,alpha),samples=[[.13,.87,.59,a],[.95,.42,.03,.41]],primary=[.7,.2,.91,.625],before=JSON.stringify(material);
  close(evaluateNativeMaterial(material,samples,primary,formats),equation(material,samples,primary,formats));assert.equal(JSON.stringify(material),before);
 }
 const single=m();single.textureMaps.pop();delete single.capability;delete single.sourceCombiners;
 close(evaluateNativeMaterial(single,[[0,0,0,.37]],[1,1,1,1],[8]),equation(single,[[0,0,0,.37]],[1,1,1,1],[8]));
 const pixels={width:1,height:1,data:Uint8ClampedArray.from([255,255,255,41])};
 for(const format of [8,11]){const p=nativeTextureSamplePixels(pixels,format);assert.equal(p.picaFormat,format);assert.deepEqual([...p.data],[0,0,0,41]);}
 assert.deepEqual([...pixels.data],[255,255,255,41]);assert.equal(nativeTextureSamplePixels(pixels,5),pixels);
});
test('unverified FLYT combinations fail explicitly',()=>{
 for(const alter of [x=>delete x.capability,x=>x.sourceCombiners[0].color=2,x=>x.sourceCombiners[0].alpha=2,x=>x.sourceCombiners[0].reserved=1,x=>x.unsupported.push({kind:'unknown'}),x=>x.textureMaps.push(x.textureMaps[0])]){
  const material=m();alter(material);assert.throws(()=>evaluateNativeMaterial(material,[[1,1,1,1],[1,1,1,1]]),/Unsupported FLYT/);
 }
});
const privateRoot=process.env.FIRMWARE_AMIIBO_CONVERTED;
function readPack(name){return JSON.parse(readFileSync(join(privateRoot,'packs/amiibo-settings',name+'.json')));}
const walk=panes=>panes.flatMap(p=>[p,...walk(p.children)]);
async function pixels(pack){return new Map(await Promise.all(Object.entries(pack.textures).map(async([name,meta])=>[name,nativeTextureSamplePixels(await decodeNativePng(new Uint8Array(readFileSync(join(privateRoot,meta.url))),meta),meta.picaFormat)])));}
function independentRaster(layout,picture,w,h,images,material=layout.materials[picture.material]){
 const maps=material.textureMaps.map(map=>images.get(layout.textures[map.texture])),out=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=(x+.5)/w,v=(y+.5)/h,primary=interpolateNativeQuad(picture.colors.flat(),u,v,4).map(c=>c/255);
  const samples=material.textureMaps.map((map,i)=>{const uv=transformNativeUV(interpolateNativeQuad(picture.uvSets[material.coordinateGenerators[i]?.source??i],u,v),material.textureMatrices[i]);return sampleNativeTexture(maps[i],...uv,map.wrapS,map.wrapT,map.magFilter!==0);});
  out.set(equation(material,samples,primary,maps.map(p=>p.picaFormat)).map(c=>Math.round(c*255)),(y*w+x)*4);
 }
 return out;
}
test('real Header pixels match independently composed native equations',{skip:!privateRoot},async()=>{
 const pack=readPack('layout-Body-Common-Header-Header-arc-cmp'),layout=pack.layouts.Header,images=await pixels(pack);
 assert.equal(pack.resourceSources.layouts.Header.sha256,'680775e63bcdd86fe3e9c1c5687744e1904984215ca1fdc8a1c0f8e75043fd59');
 for(const name of ['P_Header_00','P_Header_01','P_HeaderShdw']){
  const pane=walk(layout.roots).find(p=>p.name.trim()===name);assert.ok(pane,name);
  const [w,h]=pane.size.map(Math.round),actual=rasterNativePicture(layout,pane.picture,w,h,images);
  assert.deepEqual(actual.data,independentRaster(layout,pane.picture,w,h,images),name);
 }
});
test('real projected button patches use whole-window coordinates and preserve source records',{skip:!privateRoot},async()=>{
 const pack=readPack('layout-Parts-Portal-PortalBtnSub-arc-cmp'),layout=pack.layouts.PortalBtnSub,images=await pixels(pack),pane=walk(layout.roots).find(p=>p.name.trim()==='W_BtnShade_00');
 assert.equal(pack.resourceSources.layouts.PortalBtnSub.sha256,'b03445e1ed98efb3389d2c077b77e6f9996cf84064a64f0e57340d92c9ee47b0');
 const before=JSON.stringify(layout),patches=nativeWindowPatches(pane,layout,images);assert.ok(patches.length>=4);
 for(const patch of patches){
  const {x,y,width:w,height:h}=patch;assert.deepEqual(patch.picture.uvSets[1],[x/240,y/32,(x+w)/240,y/32,x/240,(y+h)/32,(x+w)/240,(y+h)/32]);
  const actual=rasterNativePicture(layout,patch.picture,w,h,images,1,patch.material);
  assert.deepEqual(actual.data,independentRaster(layout,patch.picture,w,h,images,patch.material));
 }
 assert.equal(JSON.stringify(layout),before);
 for(const alter of [(p,l)=>p.origin=0,(p,l)=>l.materials[p.window.frames[0].material].sourceProjections[0].option=2,(p,l)=>l.materials[p.window.frames[0].material].textureMatrices[1].translation[0]=.1]){
  const clone=structuredClone(layout),window=walk(clone.roots).find(p=>p.name.trim()==='W_BtnShade_00');alter(window,clone);assert.throws(()=>nativeWindowPatches(window,clone,images),/Unsupported FLYT window projection/);
 }
});
