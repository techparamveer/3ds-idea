import * as THREE from 'three';
import { sampleCgfxCurve, selectCgfxClips, cgfxClipFrame, type CgfxCurve, type CgfxClipChoice } from '../os/cgfx-animation';
import { cgfxLightingShader, decodeCgfxLutWord, type CgfxLightingData } from './cgfx-lighting';
import { decodeNativePng } from '../os/native-png';
import { nativeCameraDirectionBone, nativeYAxialBone } from './cgfx-billboard';
import type { NativePixels } from '../os/native-layout';
type Color={R:number;G:number;B:number;A:number};
type Vec={X:number;Y:number;Z:number;W?:number};
type Coord={Flags?:string;MappingType:string;TransformType:string;ReferenceCameraIndex?:number;Scale:Vec;Rotation:number;Translation:Vec};
type Stage={Source:{Color:string[];Alpha:string[]};Operand:{Color:string[];Alpha:string[]};Combiner:{Color:string;Alpha:string};Scale:{Color:string;Alpha:string};UpdateColorBuffer:boolean;UpdateAlphaBuffer:boolean};
export type NativeComparison='Never'|'Always'|'Equal'|'NotEqual'|'Less'|'LessOrEqual'|'Greater'|'GreaterOrEqual';
export type NativeStencilOperation='Keep'|'Zero'|'Replace'|'Increment'|'Decrement'|'Invert'|'IncrementWrap'|'DecrementWrap';
export type FirmwareStencilState=Readonly<{
 enabled:boolean;function:NativeComparison;reference:number;compareMask:number;writeMask:number;
 fail:NativeStencilOperation;depthFail:NativeStencilOperation;depthPass:NativeStencilOperation;
}>;
export type FirmwareColorFit=Readonly<{material:string;upperY:number;lowerY:number;upperRgb:readonly [number,number,number];lowerRgb:readonly [number,number,number];opaqueAlpha?:boolean}>;
export type FirmwareModelOptions=Readonly<{nativeMipmaps?:boolean;nativeSphereMapping?:boolean;overlayCoverage?:boolean;drawGroup?:number;runtimeStencil?:Partial<FirmwareStencilState>;colorFit?:FirmwareColorFit}>;
type Params={TexEnvStages:Stage[];TexEnvBufferColor:Color;TextureCoords:Coord[];TextureSources:number[];FaceCulling:string;AmbientColor:Color;DiffuseColor:Color;Specular0Color:Color;AlphaTest:{Enabled:boolean;Function:string;Reference:number};DepthColorMask:{Enabled:boolean;DepthWrite:boolean;DepthFunc:string};StencilTest?:{Enabled:boolean;Function:NativeComparison;Reference:number;Mask:number;BufferMask:number};StencilOperation?:{FailOp:NativeStencilOperation;ZFailOp:NativeStencilOperation;ZPassOp:NativeStencilOperation};BlendFunction:{ColorSrcFunc:string;ColorDstFunc:string;AlphaSrcFunc:string;AlphaDstFunc:string};[key:string]:unknown};
type Material={Name:string;MaterialParams:Params;ConstantAssignments:number[];Texture0Name:string;Texture1Name:string;Texture2Name:string;TextureMappers:{WrapU:string;WrapV:string;MagFilter:string;MinFilter:string;LODBias?:number;MinLOD?:number}[]};
type Bone={Name:string;ParentIndex:number;BillboardMode?:string;NativeBillboardMode?:number;Scale:Vec;Rotation:Vec;Translation:Vec;InverseTransform:Record<string,number>};
type Submesh={indices:number[];bones:number[];skinning:string;primitive:string};
type Mesh={hasVertexColor?:boolean;material:number;node:number;layer:number;priority:number;position:number[][];normal:number[][];color:number[][];uv0:number[][];uv1:number[][];uv2:number[][];joints:number[][];weights:number[][];submeshes:Submesh[]};
type Clip={Name:string;FramesCount:number;AnimationFlags:string;Elements:{Name:string;TargetType:string;PrimitiveType:string;Content:Record<string,CgfxCurve>}[]};
export type FirmwareModelData=CgfxLightingData&{schema:1;sourceSha256:string;models:{name:string;transform:Record<string,number>;skeleton:Bone[];materials:Material[];nodes:boolean[];meshes:Mesh[]}[];textures:{name:string;url:string;width:number;height:number;nativeMipCount?:number;mipmaps?:{level:number;url:string;width:number;height:number}[]}[];skeletalAnimations:Clip[];materialAnimations:Clip[];visibilityAnimations:Clip[]};
export type FirmwareModelAsset={data:FirmwareModelData;images:Map<string,NativePixels>;mipmaps?:Map<string,readonly NativePixels[]>};
export type FirmwareModelPlayback={skeletal?:readonly CgfxClipChoice[];material?:readonly CgfxClipChoice[]};
export async function loadFirmwareModel(url:string):Promise<FirmwareModelAsset>{
 const response=await fetch(url);if(!response.ok)throw new Error(`Model HTTP ${response.status}`);
 const data=await response.json() as FirmwareModelData;
 if(data.schema!==1||!Array.isArray(data.models)||!Array.isArray(data.textures))throw new Error('Invalid firmware model');
 const images=new Map<string,NativePixels>(),mipmaps=new Map<string,readonly NativePixels[]>();
 await Promise.all(data.textures.map(async record=>{const response=await fetch(new URL(record.url,new URL(url,window.location.href)));if(!response.ok)throw new Error(`Model texture HTTP ${response.status}`);images.set(record.name,await decodeNativePng(new Uint8Array(await response.arrayBuffer()),record));
 if(record.mipmaps?.length)mipmaps.set(record.name,await Promise.all(record.mipmaps.map(async mip=>{const response=await fetch(new URL(mip.url,new URL(url,window.location.href)));if(!response.ok)throw new Error(`Model mip HTTP ${response.status}`);return decodeNativePng(new Uint8Array(await response.arrayBuffer()),mip);})));}));
 return {data,images,...(mipmaps.size?{mipmaps}:{})};
}
const rgba=(c:Color)=>new THREE.Vector4(c.R/255,c.G/255,c.B/255,c.A/255);
const glcolor=(c:Color)=>`vec4(${[c.R,c.G,c.B,c.A].map(v=>(v/255).toFixed(8)).join(',')})`;
function argument(source:string,operand:string,constant:number,alpha:boolean){
 const sources:Record<string,string>={PrimaryColor:'vColor',FragmentPrimaryColor:'litPrimary',FragmentSecondaryColor:'litSecondary',Texture0:'t0',Texture1:'t1',Texture2:'t2',Texture3:'vec4(1.0)',Previous:'previous',PreviousBuffer:'buffer',Constant:`constant${constant}`};
 let expression=sources[source];if(!expression)throw new Error(`Unsupported PICA source ${source}`);
 const inverted=operand.startsWith('OneMinus'),op=inverted?operand.slice(8):operand;
 const swizzle:Record<string,string>={Color:'rgb',Alpha:'a',Red:'r',Green:'g',Blue:'b'};
 const component=swizzle[op];if(!component)throw new Error(`Unsupported PICA operand ${operand}`);
 expression+=`.${alpha?(component==='rgb'?'a':component):component==='rgb'?'rgb':component.repeat(3)}`;
 return inverted?`(1.0-${expression})`:expression;
}
function combine(mode:string,args:string[],alpha:boolean){
 const [a,b,c]=args.map(x=>`(${x})`);
 const operations:Record<string,string>={Replace:a,Modulate:`${a}*${b}`,Add:`${a}+${b}`,AddSigned:`${a}+${b}-0.5`,Interpolate:`${a}*${c}+${b}*(1.0-${c})`,Subtract:`${a}-${b}`,MultAdd:`${a}*${b}+${c}`,AddMult:`min(${a}+${b},1.0)*${c}`,Dot3RGB:`vec3(dot(${a}-0.5,${b}-0.5)*4.0)`,Dot3RGBA:`vec3(dot(${a}-0.5,${b}-0.5)*4.0)`};
 if(!operations[mode]||(alpha&&mode.startsWith('Dot')))throw new Error(`Unsupported PICA combiner ${mode}`);
 return operations[mode];
}
export function picaFragmentShader(material:Material,lighting:ReturnType<typeof cgfxLightingShader>=null,colorFit?:FirmwareColorFit):string{
 const p=material.MaterialParams;
 let stages='';
 p.TexEnvStages.forEach((s,i)=>{
  const constant=material.ConstantAssignments?.[i]??i;
  const color=combine(s.Combiner.Color,s.Source.Color.map((v,j)=>argument(v,s.Operand.Color[j],constant,false)),false);
  const alpha=combine(s.Combiner.Alpha,s.Source.Alpha.map((v,j)=>argument(v,s.Operand.Alpha[j],constant,true)),true);
  const scale=(x:string)=>x==='Two'?'2.0':x==='Four'?'4.0':'1.0';
  stages+=`vec4 stage${i}=clamp(vec4((${color})*${scale(s.Scale.Color)},(${alpha})*${scale(s.Scale.Alpha)}),0.0,1.0);\n`;
  if(s.UpdateColorBuffer)stages+='buffer.rgb=previous.rgb;\n';
  if(s.UpdateAlphaBuffer)stages+='buffer.a=previous.a;\n';
  stages+=`previous=stage${i};\n`;
 });
 const comparison:Record<string,string>={Never:'false',Always:'true',Equal:'==',NotEqual:'!=',Less:'<',LessOrEqual:'<=',Greater:'>',GreaterOrEqual:'>='};
 const alpha=p.AlphaTest;const op=comparison[alpha.Function]??'>';
 const test=alpha.Enabled?`if(!(${op==='true'||op==='false'?op:`previous.a ${op} ${(alpha.Reference/255).toFixed(8)}`}))discard;`:'';
 return `varying vec4 vColor;varying vec2 vUv0;varying vec2 vUv1;varying vec2 vUv2;varying vec3 vNormal;varying vec3 vView;\n
 uniform sampler2D tex0;uniform sampler2D tex1;uniform sampler2D tex2;uniform mat3 uvMatrix0;uniform mat3 uvMatrix1;uniform mat3 uvMatrix2;
 uniform vec4 constant0;uniform vec4 constant1;uniform vec4 constant2;uniform vec4 constant3;uniform vec4 constant4;uniform vec4 constant5;
 ${lighting?.declarations??''}
 void main(){
 vec4 t0=texture2D(tex0,(uvMatrix0*vec3(vUv0,1.0)).xy);vec4 t1=texture2D(tex1,(uvMatrix1*vec3(vUv1,1.0)).xy);vec4 t2=texture2D(tex2,(uvMatrix2*vec3(vUv2,1.0)).xy);
 ${lighting?.code??`float illumination=max(dot(normalize(vNormal),normalize(vec3(-0.25,0.45,1.0))),0.0);
 vec4 litPrimary=clamp(${glcolor(p.AmbientColor)}+${glcolor(p.DiffuseColor)}*illumination,0.0,1.0);
 vec4 litSecondary=${glcolor(p.Specular0Color)}*pow(max(dot(normalize(vNormal),normalize(vec3(-0.12,0.22,1.0))),0.0),16.0);`}
 vec4 previous=vColor;vec4 buffer=${glcolor(p.TexEnvBufferColor)};
 ${stages}${test}${colorFit&&material.Name===colorFit.material?`float lcdY=239.5-gl_FragCoord.y;float fitT=clamp((lcdY-${colorFit.upperY.toFixed(3)})/${(colorFit.lowerY-colorFit.upperY).toFixed(3)},0.0,1.0);previous.rgb=mix(vec3(${colorFit.upperRgb.map(v=>(v/255).toFixed(8)).join(',')}),vec3(${colorFit.lowerRgb.map(v=>(v/255).toFixed(8)).join(',')}),fitT);${colorFit.opaqueAlpha?'previous.a=1.0;':''}`:''}gl_FragColor=previous;}`;
}
const vertexShader=`attribute vec4 nativeColor;attribute vec2 nativeUv1;attribute vec2 nativeUv2;
 varying vec4 vColor;varying vec2 vUv0;varying vec2 vUv1;varying vec2 vUv2;varying vec3 vNormal;varying vec3 vView;
 void main(){vColor=nativeColor;vUv0=uv;vUv1=nativeUv1;vUv2=nativeUv2;vNormal=normalMatrix*normal;vec4 view=modelViewMatrix*vec4(position,1.0);vView=-view.xyz;gl_Position=projectionMatrix*view;}`;
/** Pinned SPICA bd29a782 DefaultVertexShader.txt, procedures at lines 124–129,
 * 301–307 and 381–412: source 4 uses normalized view-normal XY * .5 + .5.
 * Generate this per vertex, before interpolation and the authored UV matrix.
 * https://github.com/gdkchan/SPICA/blob/bd29a7828595d7839cda2ac61c76bb63f9071250/SPICA.Rendering/Resources/DefaultVertexShader.txt
 */
function sphereVertexShader(slots:readonly number[]){
 if(!slots.length)return vertexShader;
 return vertexShader.replace('vec4 view=modelViewMatrix',`${slots.map(i=>`vUv${i}=normalize(vNormal).xy*0.5+vec2(0.5);`).join('')}vec4 view=modelViewMatrix`);
}
function textureMatrix(coord:Coord){
 const {X:sx,Y:sy}=coord.Scale,{X:tx,Y:ty}=coord.Translation,c=Math.cos(coord.Rotation),s=Math.sin(coord.Rotation);
 let x=sx*((.5*s-.5*c)+.5-tx),y=sy*((-.5*s-.5*c)+.5-ty);
 if(coord.TransformType==='DccSoftImage'){x=sx*(-c*tx-s*ty);y=sy*(s*tx-c*ty);}
 if(coord.TransformType==='Dcc3dsMax'){x=sx*c*(-tx-.5)-sx*s*(ty-.5)+.5;y=sy*s*(-tx-.5)+sy*c*(ty-.5)+.5;}
 return new THREE.Matrix3().set(sx*c,-sx*s,x,sy*s,sy*c,y,0,0,1);
}
const depthFunction:Record<string,THREE.DepthModes>={Never:THREE.NeverDepth,Always:THREE.AlwaysDepth,Equal:THREE.EqualDepth,NotEqual:THREE.NotEqualDepth,Less:THREE.LessDepth,LessOrEqual:THREE.LessEqualDepth,Greater:THREE.GreaterDepth,GreaterOrEqual:THREE.GreaterEqualDepth};
function nativeDepthFunction(value:string){
 const result=depthFunction[value];
 if(result===undefined)throw new Error(`Unsupported native depth comparison ${value}`);
 return result;
}
const stencilFunction:Record<NativeComparison,THREE.StencilFunc>={Never:THREE.NeverStencilFunc,Always:THREE.AlwaysStencilFunc,Equal:THREE.EqualStencilFunc,NotEqual:THREE.NotEqualStencilFunc,Less:THREE.LessStencilFunc,LessOrEqual:THREE.LessEqualStencilFunc,Greater:THREE.GreaterStencilFunc,GreaterOrEqual:THREE.GreaterEqualStencilFunc};
const stencilOperation:Record<NativeStencilOperation,THREE.StencilOp>={Keep:THREE.KeepStencilOp,Zero:THREE.ZeroStencilOp,Replace:THREE.ReplaceStencilOp,Increment:THREE.IncrementStencilOp,Decrement:THREE.DecrementStencilOp,Invert:THREE.InvertStencilOp,IncrementWrap:THREE.IncrementWrapStencilOp,DecrementWrap:THREE.DecrementWrapStencilOp};
function stencilMaterialState(state:FirmwareStencilState){
 const comparison=stencilFunction[state.function];
 if(typeof comparison!=='number')throw new Error(`Unsupported native stencil comparison ${state.function}`);
 const operation=(value:NativeStencilOperation)=>{
  const result=stencilOperation[value];
  if(typeof result!=='number')throw new Error(`Unsupported native stencil operation ${value}`);
  return result;
 };
 return {stencilWrite:state.enabled,stencilFunc:comparison,stencilRef:state.reference,stencilFuncMask:state.compareMask,stencilWriteMask:state.writeMask,stencilFail:operation(state.fail),stencilZFail:operation(state.depthFail),stencilZPass:operation(state.depthPass)};
}
function nativeStencilState(params:Params,override:FirmwareModelOptions['runtimeStencil']){
 const test=params.StencilTest,ops=params.StencilOperation;
 const source:FirmwareStencilState={enabled:test?.Enabled??false,function:test?.Function??'Always',reference:test?.Reference??0,compareMask:test?.Mask??0xff,writeMask:test?.BufferMask??0xff,fail:ops?.FailOp??'Keep',depthFail:ops?.ZFailOp??'Keep',depthPass:ops?.ZPassOp??'Keep'};
 // Validate authored enums even when a runtime override replaces them. BufferMask
 // is kept literally: omitted register write lanes are a runtime responsibility.
 const authored=stencilMaterialState(source);
 return override?stencilMaterialState({...source,...override}):authored;
}
const wrap=(value:string)=>value==='Repeat'?THREE.RepeatWrapping:value==='MirroredRepeat'?THREE.MirroredRepeatWrapping:THREE.ClampToEdgeWrapping;
function texturePixels(image:NativePixels){
 const pixels=new Uint8Array(image.data.length),stride=image.width*4;
 for(let row=0;row<image.height;row++)pixels.set(image.data.subarray(row*stride,(row+1)*stride),(image.height-1-row)*stride);
 return pixels;
}
const factor:Record<string,THREE.BlendingDstFactor>={Zero:THREE.ZeroFactor,One:THREE.OneFactor,SourceAlpha:THREE.SrcAlphaFactor,OneMinusSourceAlpha:THREE.OneMinusSrcAlphaFactor,DestinationAlpha:THREE.DstAlphaFactor,OneMinusDestinationAlpha:THREE.OneMinusDstAlphaFactor,SourceColor:THREE.SrcColorFactor,OneMinusSourceColor:THREE.OneMinusSrcColorFactor,DestinationColor:THREE.DstColorFactor,OneMinusDestinationColor:THREE.OneMinusDstColorFactor};
function matrix(source:Record<string,number>){return new THREE.Matrix4().set(source.M11,source.M21,source.M31,source.M41,source.M12,source.M22,source.M32,source.M42,source.M13,source.M23,source.M33,source.M43,0,0,0,1);}

/** Uses original meshes/combiners/curves and directional LUT lighting; other lighting remains approximate. */
export function createFirmwareModel(asset:FirmwareModelAsset,initialPlayback:FirmwareModelPlayback={},options:FirmwareModelOptions={}){
 if(options.colorFit){const f=options.colorFit;if(!f.material||![f.upperY,f.lowerY,...f.upperRgb,...f.lowerRgb].every(Number.isFinite)||f.lowerY<=f.upperY||![...f.upperRgb,...f.lowerRgb].every(v=>v>=0&&v<=255))throw new Error('Invalid firmware colour fit');}
 // Mip sampling is opt-in for source-audited titles; HOME keeps its existing path.
 if(options.nativeMipmaps)for(const model of asset.data.models)for(const material of model.materials)for(let i=0;i<3;i++){
  const name=material[`Texture${i}Name` as 'Texture0Name'];if(!name)continue;
  const sampler=material.TextureMappers[i],record=asset.data.textures.find(t=>t.name===name),levels=asset.mipmaps?.get(name)??[],count=record?.nativeMipCount??0;
  if(sampler.MinFilter!=='LinearMipmapNearest'||sampler.MagFilter!=='Linear'||sampler.LODBias!==0||sampler.MinLOD!==0)throw new Error('Unsupported native mip sampler '+name);
  if(!record||!Number.isInteger(count)||count<1||count>12||levels.length!==count-1||record.mipmaps?.length!==levels.length)throw new Error('Incomplete native mip chain '+name);
  for(let n=0;n<levels.length;n++){const level=levels[n],source=record.mipmaps![n],width=record.width>>(n+1),height=record.height>>(n+1);if(source.level!==n+1||source.width!==width||source.height!==height||level.width!==width||level.height!==height||level.data.length!==width*height*4)throw new Error('Invalid native mip level '+name);}
 }
 // Validate opt-in mapping and stencil state before allocating GPU resources.
 const sphereSlots=asset.data.models.map(model=>model.materials.map(m=>{
  const slots:number[]=[];
  if(options.nativeSphereMapping)for(let i=0;i<3;i++){
   if(!m[`Texture${i}Name` as 'Texture0Name'])continue;
   const coord=m.MaterialParams.TextureCoords[i],source=m.MaterialParams.TextureSources[i]??0;
   if(coord.MappingType==='CameraSphereEnvMap'&&source===4&&coord.ReferenceCameraIndex===0&&coord.Flags==='0')slots.push(i);
   else if(coord.MappingType!=='UvCoordinateMap'||source<0||source>2||!Number.isInteger(source))throw new Error(`Unsupported native texture mapping ${coord.MappingType}/${source}`);
  }
  return slots;
 }));
 const stencilStates=asset.data.models.map(model=>model.materials.map(m=>nativeStencilState(m.MaterialParams,options.runtimeStencil)));
 const group=new THREE.Group(),textures:THREE.Texture[]=[],materials:THREE.ShaderMaterial[]=[],geometries:THREE.BufferGeometry[]=[];
 group.renderOrder=options.drawGroup??0;
 const updaters:((frame:number,camera?:THREE.Camera)=>void)[]=[];
 const textureBindings=new Map<string,THREE.DataTexture[]>(),materialMeshes=new Map<string,THREE.Mesh[]>();
 const replacementPixels=new Map<string,NativePixels>();
 const select=(playback:FirmwareModelPlayback)=>({skeletal:selectCgfxClips(asset.data.skeletalAnimations,playback.skeletal),material:selectCgfxClips(asset.data.materialAnimations,playback.material)});
 let playback=select(initialPlayback);
 const white=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);white.needsUpdate=true;textures.push(white);
 for(const [modelIndex,model] of asset.data.models.entries()){
  const modelGroup=new THREE.Group();modelGroup.renderOrder=group.renderOrder;modelGroup.matrixAutoUpdate=false;modelGroup.matrix.copy(matrix(model.transform));group.add(modelGroup);
  const materialCopies=model.materials.map(m=>structuredClone(m));
  const mats=materialCopies.map((m,materialIndex)=>{
   const p=m.MaterialParams,uniforms:Record<string,THREE.IUniform>={};
   const lighting=cgfxLightingShader(p,asset.data);
   for(const [index,sampler] of lighting?.samplers.entries()??[]){
    const pixels=new Float32Array(256*4);sampler.RawWords.forEach((word,i)=>{const [value,difference]=decodeCgfxLutWord(word);pixels[i*4]=value;pixels[i*4+1]=difference;pixels[i*4+3]=1;});
    const texture=new THREE.DataTexture(pixels,256,1,THREE.RGBAFormat,THREE.FloatType);texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.needsUpdate=true;textures.push(texture);uniforms[`nativeLut${index}`]={value:texture};
   }
   for(let i=0;i<6;i++)uniforms[`constant${i}`]={value:rgba(p[`Constant${i}Color`] as Color)};
   for(let i=0;i<3;i++){
    const image=asset.images.get(m[`Texture${i}Name` as 'Texture0Name']);let texture:THREE.Texture=white;
    if(image){
     // PNG rows are top-down; raw GL data starts at the bottom. Preserve RGB
     // under zero alpha while flipping explicitly instead of using a DOM image.
     const nativeTexture=new THREE.DataTexture(texturePixels(image),image.width,image.height);texture=nativeTexture;texture.colorSpace=THREE.NoColorSpace;texture.wrapS=wrap(m.TextureMappers[i].WrapU);texture.wrapT=wrap(m.TextureMappers[i].WrapV);texture.magFilter=m.TextureMappers[i].MagFilter==='Nearest'?THREE.NearestFilter:THREE.LinearFilter;texture.minFilter=texture.magFilter;texture.generateMipmaps=false;
     if(options.nativeMipmaps){nativeTexture.minFilter=THREE.LinearMipmapNearestFilter;nativeTexture.mipmaps=[image,...(asset.mipmaps?.get(m[`Texture${i}Name` as 'Texture0Name'])??[])].map(level=>({width:level.width,height:level.height,data:texturePixels(level)}));}
     texture.needsUpdate=true;textures.push(texture);
     const name=m[`Texture${i}Name` as 'Texture0Name'];textureBindings.set(name,[...(textureBindings.get(name)??[]),nativeTexture]);
    }
    uniforms[`tex${i}`]={value:texture};uniforms[`uvMatrix${i}`]={value:textureMatrix(p.TextureCoords[i])};
   }
   const blend=p.BlendFunction;
   const stencil=stencilStates[modelIndex][materialIndex];
   const material=new THREE.ShaderMaterial({uniforms,vertexShader:sphereVertexShader(sphereSlots[modelIndex][materialIndex]),fragmentShader:picaFragmentShader(m,lighting,options.colorFit),transparent:true,depthTest:p.DepthColorMask.Enabled,depthWrite:p.DepthColorMask.DepthWrite,depthFunc:nativeDepthFunction(p.DepthColorMask.DepthFunc),side:p.FaceCulling==='BackFace'?THREE.FrontSide:p.FaceCulling==='FrontFace'?THREE.BackSide:THREE.DoubleSide,blending:THREE.CustomBlending,blendSrc:(factor[blend.ColorSrcFunc]??THREE.SrcAlphaFactor) as THREE.BlendingSrcFactor,blendDst:factor[blend.ColorDstFunc]??THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:(factor[blend.AlphaSrcFunc]??THREE.OneFactor) as THREE.BlendingSrcFactor,blendDstAlpha:factor[blend.AlphaDstFunc]??THREE.OneMinusSrcAlphaFactor,toneMapped:false});
   Object.assign(material,stencil);
   // The transparent Canvas bridge needs geometric blend coverage. Preserve
   // native RGB blending, but do not square alpha as native mt_Text's otherwise
   // invisible framebuffer-alpha equation does. Other blend families are kept.
   if(options.overlayCoverage&&blend.ColorSrcFunc==='SourceAlpha'&&blend.ColorDstFunc==='OneMinusSourceAlpha'){
    material.blendSrcAlpha=THREE.OneFactor;material.blendDstAlpha=THREE.OneMinusSrcAlphaFactor;
   }
   materials.push(material);return material;
  });
  const bones=model.skeleton.map(()=>new THREE.Matrix4()),inverse=model.skeleton.map(b=>matrix(b.InverseTransform));
  const drawMeshes:{geometry:THREE.BufferGeometry;source:Mesh;sub:Submesh}[]=[];
  for(const source of model.meshes)for(const sub of source.submeshes){
   if(sub.primitive!=='Triangles')throw new Error(`Unsupported native primitive ${sub.primitive}`);
   const geometry=new THREE.BufferGeometry();geometries.push(geometry);
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(source.position.flat(),3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(source.normal.flat(),3));
   // An explicitly absent color attribute is not authored transparent black.
   // The source-material binding follows the reference default vertex shader;
   // its exact native shader parity remains provisional. Older packs without
   // the presence metadata and authored zero colors keep their existing data.
   const diffuse=model.materials[source.material].MaterialParams.DiffuseColor;
   const colors=source.hasVertexColor===false?source.position.flatMap(()=>[diffuse.R/255,diffuse.G/255,diffuse.B/255,diffuse.A/255]):source.color.flat();
   geometry.setAttribute('nativeColor',new THREE.Float32BufferAttribute(colors,4));
   for(let i=0;i<3;i++){const sourceIndex=materialCopies[source.material].MaterialParams.TextureSources[i]??0;geometry.setAttribute(i===0?'uv':`nativeUv${i}`,new THREE.Float32BufferAttribute(source[`uv${Math.min(2,sourceIndex)}` as 'uv0'].flat(),2));}
   geometry.setIndex(sub.indices);const mesh=new THREE.Mesh(geometry,mats[source.material]);mesh.frustumCulled=false;mesh.renderOrder=source.layer*100+source.priority;
   // Empty-folder content slots and text are populated by HOME code, not intrinsic banner artwork.
   if(model.name==='BannerFolder'&&(model.materials[source.material].Name.startsWith('Prize_')||model.materials[source.material].Name==='mt_Text'))mesh.visible=false;
   const materialName=model.materials[source.material].Name;materialMeshes.set(materialName,[...(materialMeshes.get(materialName)??[]),mesh]);
   modelGroup.add(mesh);drawMeshes.push({geometry,source,sub});
  }
  const position=new THREE.Vector3(),normal=new THREE.Vector3(),transformed=new THREE.Vector3(),rot=new THREE.Quaternion(),scale=new THREE.Vector3(),translation=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
  updaters.push((frame,camera)=>{
   const values=model.skeleton.map(b=>({scale:{...b.Scale},rotation:{...b.Rotation},translation:{...b.Translation}}));
   for(const selection of playback.skeletal){const {clip}=selection,at=cgfxClipFrame(clip,selection.frame??frame);
    for(const element of clip.Elements){const index=model.skeleton.findIndex(b=>b.Name===element.Name);if(index<0||element.PrimitiveType!=='Transform')continue;const value=values[index];
     for(const [property,target] of [['Scale','scale'],['Rotation','rotation'],['Translation','translation']] as const)for(const axis of ['X','Y','Z'] as const)value[target][axis]=sampleCgfxCurve(element.Content[`${property}${axis}`],at,value[target][axis]);
    }
   }
   values.forEach((v,i)=>{translation.set(v.translation.X,v.translation.Y,v.translation.Z);scale.set(v.scale.X,v.scale.Y,v.scale.Z);rot.setFromEuler(new THREE.Euler(v.rotation.X,v.rotation.Y,v.rotation.Z,'ZYX'));bones[i].compose(translation,rot,scale);const parent=model.skeleton[i].ParentIndex;if(parent>=0)bones[i].premultiply(bones[parent]);});
   for(const {geometry,source,sub} of drawMeshes){const dst=geometry.getAttribute('position'),normals=geometry.getAttribute('normal');
    const matrices=sub.bones.map(index=>{
     let transform=sub.skinning==='Smooth'?bones[index].clone().multiply(inverse[index]):bones[index];
     const bone=model.skeleton[index],mode=bone.NativeBillboardMode??((bone.BillboardMode??'Off')==='Off'?0:undefined);
     if(mode!==0&&camera){
      if((mode!==1&&mode!==5)||sub.skinning==='Smooth')throw new Error(`Unsupported native billboard mode ${mode}`);
      transform=mode===1?nativeCameraDirectionBone(transform,modelGroup.matrixWorld,camera.matrixWorld):nativeYAxialBone(transform,modelGroup.matrixWorld,camera.matrixWorld);
     }
     return transform;
    });
    for(let i=0;i<source.position.length;i++){
     position.set(0,0,0);normal.set(0,0,0);const count=sub.skinning==='Smooth'?4:1;
     for(let j=0;j<count;j++){const weight=count===1?1:source.weights[i][j];if(!weight)continue;const bone=matrices[source.joints[i][j]??0]??matrices[0]??new THREE.Matrix4();position.addScaledVector(transformed.fromArray(source.position[i]).applyMatrix4(bone),weight);normalMatrix.getNormalMatrix(bone);normal.addScaledVector(transformed.fromArray(source.normal[i]).applyMatrix3(normalMatrix),weight);}
     dst.setXYZ(i,position.x,position.y,position.z);normal.normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);
    }dst.needsUpdate=true;normals.needsUpdate=true;
   }
   // Reset authored state before applying the selected clips so switching clips
   // cannot retain a previous animation's color or texture transform.
   materialCopies.forEach((m,index)=>{
    const original=model.materials[index].MaterialParams;
    m.MaterialParams.TextureCoords=structuredClone(original.TextureCoords);
    for(let i=0;i<6;i++){const c=original[`Constant${i}Color`] as Color;mats[index].uniforms[`constant${i}`].value.set(c.R/255,c.G/255,c.B/255,c.A/255);}
   });
   for(const selection of playback.material){const {clip}=selection,at=cgfxClipFrame(clip,selection.frame??frame);
    for(const element of clip.Elements){const index=materialCopies.findIndex(m=>m.Name===element.Name);if(index<0)continue;
     const constant=/^MaterialConstant([0-5])$/.exec(element.TargetType);
     if(constant&&element.PrimitiveType==='RGBA'){
      const value=mats[index].uniforms[`constant${constant[1]}`].value as THREE.Vector4;
      for(const [channel,axis] of [['R','x'],['G','y'],['B','z'],['A','w']] as const)value[axis]=Math.max(0,Math.min(1,sampleCgfxCurve(element.Content[channel],at,value[axis])));
      continue;
     }
     const match=/^MaterialTexCoord([0-2])(Trans|Scale|Rot)$/.exec(element.TargetType);if(!match)continue;const coord=materialCopies[index].MaterialParams.TextureCoords[Number(match[1])];
     if(match[2]==='Rot')coord.Rotation=sampleCgfxCurve(element.Content.Value,at,coord.Rotation);
     else{const vec=match[2]==='Scale'?coord.Scale:coord.Translation;vec.X=sampleCgfxCurve(element.Content.X,at,vec.X);vec.Y=sampleCgfxCurve(element.Content.Y,at,vec.Y);}
    }
   }
   materialCopies.forEach((m,index)=>m.MaterialParams.TextureCoords.forEach((coord,i)=>{mats[index].uniforms[`uvMatrix${i}`].value=textureMatrix(coord);}));
  });
 }
 return {group,setPlayback(next:FirmwareModelPlayback){playback=select(next);},
  setTexture(name:string,image:NativePixels,replacement?:{allowSizeChange?:boolean}){
   const targets=textureBindings.get(name),record=asset.data.textures.find(t=>t.name===name);
   if(!targets?.length||!record)return false;
   const sizeChanged=image.width!==record.width||image.height!==record.height;
   if(sizeChanged&&!replacement?.allowSizeChange)throw new Error(`Native replacement texture dimensions differ: ${name}`);
   if(!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1||image.data.length!==image.width*image.height*4)throw new Error(`Invalid native replacement pixels: ${name}`);
   if(sizeChanged&&options.nativeMipmaps)throw new Error(`Native replacement mip chain is required: ${name}`);
   if(replacementPixels.get(name)===image)return true;
   const pixels=texturePixels(image);for(const texture of targets){texture.image={data:pixels,width:image.width,height:image.height};texture.needsUpdate=true;}replacementPixels.set(name,image);return true;
  },
  setMaterialVisible(name:string,visible:boolean){const meshes=materialMeshes.get(name);meshes?.forEach(mesh=>{mesh.visible=visible;});return !!meshes?.length;},
  update(elapsedMs:number,camera?:THREE.Camera){group.updateWorldMatrix(true,true);camera?.updateWorldMatrix(true,false);for(const update of updaters)update(elapsedMs*60/1000,camera);},
  dispose(){replacementPixels.clear();textureBindings.clear();materialMeshes.clear();textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}};
}
