type Color={R:number;G:number;B:number;A:number};
type Vec={X:number;Y:number;Z:number};
export type CgfxLutSampler={Name:string;Flags:string;Table:number[];RawWords:number[]};
export type CgfxLut={Name:string;Samplers:CgfxLutSampler[]};
export type CgfxLight={Name:string;IsEnabled:boolean;NativeType?:string;Type:string;TransformRotation:Vec;Content:{Direction:Vec;AmbientColor:Color;DiffuseColor:Color;Specular0Color:Color;Specular1Color:Color}};
export type CgfxLightingData={luts:CgfxLut[];lights:CgfxLight[]};
type Params={AmbientColor:Color;DiffuseColor:Color;Specular0Color:Color;[key:string]:unknown};
const color=(value:Color)=>`vec3(${[value.R,value.G,value.B].map(v=>(v/255).toFixed(8)).join(',')})`;
const black={R:0,G:0,B:0,A:0};

/** PICA stores a 12-bit value and an 11-bit magnitude plus sign for interpolation. */
export function decodeCgfxLutWord(word:number):[number,number]{
 return [(word&4095)/4095,((word>>>12)&2047)/2047*((word&(1<<23))?-1:1)];
}
export function sampleCgfxLut(sampler:CgfxLutSampler,input:number):number{
 const absolute=sampler.Flags.includes('IsAbsolute'),position=(absolute?Math.max(0,input):input)*(absolute?256:128);
 const index=Math.max(absolute?0:-128,Math.min(absolute?255:127,Math.floor(position)));
 const [value,difference]=decodeCgfxLutWord(sampler.RawWords[index<0?index+256:index]);
 return value+difference*(position-index);
}

/** The native CGFX references retained by SPICA name the LUT object in SamplerName. */
export function resolveCgfxLut(params:Params,data:CgfxLightingData,slot:string):CgfxLutSampler{
 const table=params[`LUT${slot}SamplerName`],sampler=params[`LUT${slot}TableName`];
 const result=data.luts.find(l=>l.Name===table)?.Samplers.find(s=>s.Name===sampler);
 if(!result||result.RawWords?.length!==256)throw new Error(`Missing native CGFX LUT ${table}/${sampler}`);
 return result;
}

/** Bounded source lighting for unbumped directional materials; other paths remain explicit. */
export function cgfxLightingShader(params:Params,data:CgfxLightingData){
 const flags=String(params.FragmentFlags??''),fresnel=String(params.FresnelSelector??'No');
 if(params.BumpMode!=='NotUsed'||flags.includes('Reflection')||flags.includes('GeoFactor')||flags.includes('Dist1'))return null;
 const lights=data.lights.filter(l=>l.IsEnabled);
 if(!lights.length||lights.some(l=>l.NativeType!=='Directional'||Object.values(l.TransformRotation).some(v=>v!==0)))return null;
 const samplers:CgfxLutSampler[]=[];
 function lut(slot:string){
  const sampler=resolveCgfxLut(params,data,slot),index=samplers.push(sampler)-1;
  const input=({CosNormalHalf:'dot(N,H)',CosViewHalf:'dot(V,H)',CosNormalView:'dot(N,V)',CosLightNormal:'dot(L,N)'} as Record<string,string>)[(params.LUTInputSelection as Record<string,string>)[slot]];
  const scale=({One:1,Two:2,Four:4,Eight:8,Quarter:.25,Half:.5} as Record<string,number>)[(params.LUTInputScale as Record<string,string>)[slot]];
  if(!input||scale===undefined)throw new Error(`Unsupported native CGFX LUT input/scale ${slot}`);
  return `clamp(nativeLut(nativeLut${index},${input},${sampler.Flags.includes('IsAbsolute')?'true':'false'})*${scale.toFixed(2)},0.0,1.0)`;
 }
 const distribution=flags.includes('IsLUTDist0Enabled')?lut('Dist0'):'1.0';
 const fresnelValue=fresnel!=='No'?lut('Fresnel'):null;
 let code=`vec3 N=normalize(vNormal),V=normalize(vView);vec4 litPrimary=vec4(${color(params.EmissionColor as Color??black)},1.0);vec4 litSecondary=vec4(0.0,0.0,0.0,1.0);\n`;
 for(const light of lights){
  const c=light.Content,d=c.Direction;
  code+=`{vec3 L=normalize(mat3(viewMatrix)*vec3(${d.X.toFixed(8)},${d.Y.toFixed(8)},${d.Z.toFixed(8)}));vec3 H=normalize(V+L);float ln=max(dot(L,N),0.0);\n`;
  code+=`litPrimary.rgb+=${color(params.AmbientColor)}*${color(c.AmbientColor)}+${color(params.DiffuseColor)}*${color(c.DiffuseColor)}*ln;\n`;
  code+=`litSecondary.rgb+=(${color(params.Specular0Color)}*${color(c.Specular0Color)}*${distribution}+${color(params.Specular1Color as Color??black)}*${color(c.Specular1Color)})${flags.includes('ClampHighLight')?'*step(0.0,dot(L,N))':''};\n`;
  if(fresnelValue){if(fresnel.includes('Pri'))code+=`litPrimary.a=${fresnelValue};\n`;if(fresnel.includes('Sec'))code+=`litSecondary.a=${fresnelValue};\n`;}
  code+='}\n';
 }
 code+='litPrimary=clamp(litPrimary,0.0,1.0);litSecondary=clamp(litSecondary,0.0,1.0);\n';
 const declarations=samplers.map((_,i)=>`uniform sampler2D nativeLut${i};`).join('\n')+`
 float nativeLut(sampler2D lut,float inputValue,bool absoluteInput){
  float position=(absoluteInput?max(inputValue,0.0):inputValue)*(absoluteInput?256.0:128.0);
  float index=clamp(floor(position),absoluteInput?0.0:-128.0,absoluteInput?255.0:127.0);
  float address=index<0.0?index+256.0:index;
  vec2 entry=texture2D(lut,vec2((address+0.5)/256.0,0.5)).rg;
  return entry.r+entry.g*(position-index);
 }`;
 return {declarations,code,samplers};
}
