/** Decoded NintendoWare CLYT/CLAN data. Format types contain no renderer state. */
export type NativePicture={material:number;colors:number[][];uvSets:number[][]};
export type NativeMessageStyle={fontScale:number[];lineSpacing:number;characterSpacing:number;unresolvedWords?:Record<string,number>};
export type NativeText={font:number;material:number;value:string;size:number[];alignment:number;lineAlignment:number;characterSpacing:number;lineSpacing:number;topColor:number[];bottomColor:number[];messageStyle?:NativeMessageStyle};
export type NativePane={kind:string;name:string;flags:number;origin:number;alpha:number;translation:number[];rotation:number[];scale:number[];size:number[];children:NativePane[];picture?:NativePicture;text?:NativeText;window?:{content:NativePicture;frames:{material:number;flip:number}[];inflation?:number[];frameSize?:number[];flags:number}};
export type NativeMaterial={name:string;bufferColor:number[];constantColors:number[][];textureOnly:boolean;textureMaps:{texture:number;wrapS:number;wrapT:number;minFilter:number;magFilter:number}[];textureMatrices:{translation:number[];rotation:number;scale:number[]}[];coordinateGenerators:{type:number;source:number}[];tevStages:{constantSelectors:number;color:NativeCombiner;alpha:NativeCombiner}[];alphaCompare?:{function:number;reference:number};colorBlend?:{operation:number;sourceFactor:number;destinationFactor:number};unsupported:unknown[]};
export type NativeCombiner={sources:number[];operands:number[];mode:number;scale:number;savePrevious:boolean};
export type NativeTrack={target:string;binding:string;property:string;index:number;component:number;interpolation:string;keys:{frame:number;value:number;slope?:number}[]};
export type NativeAnimation={frames:number;loop:boolean;groups:string[];tracks:NativeTrack[];childBinding?:boolean;textures:string[]};
export type NativeGroup={name:string;panes:string[];children:NativeGroup[]};
export type NativeLayout={canvas:{width:number;height:number;origin:number};roots:NativePane[];materials:NativeMaterial[];textures:string[];fonts:string[];groups:NativeGroup[];unsupported:unknown[]};
export type NativePack={schema:1;name:string;layouts:Record<string,NativeLayout>;animations:Record<string,NativeAnimation>;textures:Record<string,{url:string;width:number;height:number}>;messages:Record<string,{labels:Record<string,number>;styleTable?:string;messages:{text:string;tokens:unknown[];styleIndex?:number|null}[]}>;styles?:Record<string,{styles:NativeMessageStyle[]}>};
export type PaneOverrides=Record<string,{text?:string;messageStyle?:NativeMessageStyle;visible?:boolean;alpha?:number;translation?:number[];scale?:number[];size?:number[];texture?:string;frame?:number}>;
export type AnimationBinding={name:string;frame:number;groups?:string[]};
/** HOME RI_mstl changes font metrics and spacing only; unresolved words stay uninterpreted. */
export function nativeTextMetrics(text:NativeText,font:{width?:number;height:number}){
 const style=text.messageStyle;
 return style?{size:[(font.width??font.height)*style.fontScale[0],font.height*style.fontScale[1]],characterSpacing:style.characterSpacing,lineSpacing:style.lineSpacing}
  :{size:text.size,characterSpacing:text.characterSpacing,lineSpacing:text.lineSpacing};
}
export function nativeMessageOverride(pack:NativePack,bank:string,label:string,fallback:string):PaneOverrides[string]{
 const data=pack.messages[bank],message=data?.messages[data.labels[label]];
 if(!message)return {text:fallback};
 if(message.styleIndex===undefined||message.styleIndex===null)return {text:message.text};
 const style=data.styleTable?pack.styles?.[data.styleTable]?.styles[message.styleIndex]:undefined;
 if(!style)throw new Error(`Missing native message style ${bank}/${label}[${message.styleIndex}]`);
 return {text:message.text,messageStyle:style};
}
/** Equal-frame keys are intentional discontinuities: incoming uses first, outgoing uses last. */
export function sampleNativeTrack(track:NativeTrack,frame:number){
 const keys=track.keys;if(!keys.length)return 0;if(frame<keys[0].frame)return keys[0].value;
 let left=0;while(left+1<keys.length&&keys[left+1].frame<=frame)left++;
 const a=keys[left],b=keys[left+1];if(!b||track.interpolation==='step')return a.value;
 const duration=b.frame-a.frame,t=(frame-a.frame)/duration,t2=t*t,t3=t2*t;
 return (2*t3-3*t2+1)*a.value+(t3-2*t2+t)*duration*(a.slope??0)+(-2*t3+3*t2)*b.value+(t3-t2)*duration*(b.slope??0);
}
/** CLAN stores unrelated channels too; its binding groups select the active panes/materials. */
export function boundAnimationTracks(layout:NativeLayout,animation:NativeAnimation){
 if(!animation.groups.length)return animation.tracks;
 const selected=new Set<string>();const visit=(groups:NativeGroup[])=>groups.forEach(g=>{if(animation.groups.includes(g.name))g.panes.forEach(n=>selected.add(n));visit(g.children);});visit(layout.groups);
 const materials=new Set<string>();const panes=(items:NativePane[],inherited=false)=>items.forEach(p=>{const included=selected.has(p.name)||(!!animation.childBinding&&inherited);if(included){selected.add(p.name);for(const id of [p.picture?.material,p.text?.material,p.window?.content.material,...(p.window?.frames.map(f=>f.material)??[])])if(id!==undefined&&layout.materials[id])materials.add(layout.materials[id].name);}panes(p.children,included);});panes(layout.roots);
 return animation.tracks.filter(t=>t.binding==='material'?materials.has(t.target):selected.has(t.target));
}

/** Applies only explicitly bound clips, without mutating the shared asset pack. */
export function poseNativeLayout(layout:NativeLayout, animations:Record<string,NativeAnimation>, bindings:AnimationBinding[]=[], overrides:PaneOverrides={}) {
 const posed=structuredClone(layout), panes=new Map<string,NativePane>();
 const visit=(items:NativePane[])=>items.forEach(p=>{panes.set(p.name,p);visit(p.children);});visit(posed.roots);
 for(const binding of bindings){
  const source=animations[binding.name];if(!source)throw new Error(`Missing native animation ${binding.name}`);
  const groups=binding.groups?.filter(name=>source.groups.includes(name));if(groups&&!groups.length)continue;
  const animation=groups?{...source,groups}:source;
  const frame=animation.loop&&animation.frames>0?((binding.frame%animation.frames)+animation.frames)%animation.frames:Math.max(0,Math.min(animation.frames,binding.frame));
  for(const track of boundAnimationTracks(layout,animation)){
   const value=sampleNativeTrack(track,frame), parts=track.property.split('.');
   if(track.binding==='material'){
    const material=posed.materials.find(m=>m.name===track.target);if(!material)continue;
    if(parts[0]==='materialColor'){
     // Native CLMC adds 0.5f, clamps to a byte and truncates before the register write.
     const byte=Math.floor(Math.max(0,Math.min(255,Math.fround(Math.fround(value)+0.5))));
     const index=Number(parts[1]),colors=index===0?material.bufferColor:material.constantColors[index-1];if(colors)colors[Number(parts[2])]=byte;
    }else if(parts[0]==='texture'){
     const matrix=material.textureMatrices[track.index];
     if(parts[1]==='pattern'){
      const texture=animation.textures[Math.round(value)];if(texture&&material.textureMaps[track.index]){
       let index=posed.textures.indexOf(texture);if(index<0){index=posed.textures.length;posed.textures.push(texture);}material.textureMaps[track.index].texture=index;
      }
     }else if(matrix){if(parts[1]==='rotation')matrix.rotation=value;else if(parts[1]==='translation'||parts[1]==='scale')matrix[parts[1]][parts[2]==='x'?0:1]=value;}
    }
   }else{
    const pane=panes.get(track.target);if(!pane)continue;
    if(parts[0]==='visible')pane.flags=value?pane.flags|1:pane.flags&~1;
    else if(parts[0]==='alpha')pane.alpha=value;
    else if(parts[0]==='translation'||parts[0]==='rotation'||parts[0]==='scale'||parts[0]==='size')pane[parts[0]][parts[1]==='x'||parts[1]==='width'?0:parts[1]==='y'||parts[1]==='height'?1:2]=value;
    else if(parts[0]==='vertexColor'){
     const colors=pane.picture?.colors??pane.window?.content.colors;if(colors?.[Number(parts[1])])colors[Number(parts[1])][Number(parts[2])]=value;
    }
   }
  }
 }
 for(const [name,value] of Object.entries(overrides)){
  const pane=panes.get(name);if(!pane)continue;
  if(value.text!==undefined&&pane.text)pane.text.value=value.text;
  if(value.messageStyle&&pane.text)pane.text.messageStyle=structuredClone(value.messageStyle);
  if(value.visible!==undefined)pane.flags=value.visible?pane.flags|1:pane.flags&~1;
  if(value.alpha!==undefined)pane.alpha=value.alpha;
  if(value.translation)pane.translation=[...value.translation];if(value.scale)pane.scale=[...value.scale];if(value.size)pane.size=[...value.size];
 }
 return posed;
}

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const white=[1,1,1,1];
/** Evaluate NintendoWare TEV in normalized channel space, before framebuffer blending. */
export function evaluateNativeMaterial(material:NativeMaterial, textures:number[][], primary:number[]=white):number[] {
 const constants=material.constantColors.map(c=>c.map(v=>v/255)),baseBuffer=material.bufferColor.map(v=>v/255);let buffer=[...baseBuffer],previous=[...primary];
 if(!material.tevStages.length){
  // NintendoWare's implicit material interpolates black/white registers using the texture.
  const tex=textures[0]??white,constant=constants[0]??white;
  previous=tex.map((v,i)=>(buffer[i]+(constant[i]-buffer[i])*v)*primary[i]);
 }
 for(const stage of material.tevStages){
  // The stage has one RGBA constant: its RGB and alpha selectors may name different registers.
  const registers=[baseBuffer,...constants],rgb=registers[stage.constantSelectors&15],a=registers[(stage.constantSelectors>>4)&15];
  const stageConstant=[rgb?.[0],rgb?.[1],rgb?.[2],a?.[3]];
  const channel=(combiner:NativeCombiner,index:number)=>{
   const args=combiner.sources.map((source,i)=>{
    const color=source<4?textures[source]??white:source===4?stageConstant:source===5?primary:source===6?previous:source===7?buffer:undefined;
    if(!color)throw new Error(`Unsupported native TEV source ${source}`);
    const operand=combiner.operands[i],part=Math.floor(operand/2),component=index===3?[3,0,1,2][part]:part===0?index:[3,0,1,2][part-1];
    if(component===undefined)throw new Error(`Unsupported native TEV operand ${operand}`);
    const value=color[component];if(value===undefined)throw new Error(`Unsupported native TEV constant selector ${stage.constantSelectors}`);
    return operand%2?1-value:value;
   });
   const [a,b,c]=args;let result:number;
   switch(combiner.mode){case 0:result=a;break;case 1:result=a*b;break;case 2:result=a+b;break;case 3:result=a+b-.5;break;case 4:result=a*c+b*(1-c);break;case 5:result=a-b;break;case 6:result=clamp(a+b)*c;break;case 7:result=a*b+c;break;default:throw new Error(`Unsupported native TEV mode ${combiner.mode}`);}
   return clamp(result*combiner.scale);
  };
  const result=[0,1,2].map(i=>channel(stage.color,i));result.push(channel(stage.alpha,3));
  if(stage.color.savePrevious)buffer=[...previous.slice(0,3),buffer[3]];
  if(stage.alpha.savePrevious)buffer[3]=previous[3];previous=result;
 }
 const compare=material.alphaCompare;
 if(compare){const a=previous[3],r=compare.reference,pass=[false,a<r,a<=r,a===r,a!==r,a>=r,a>r,true][compare.function];if(!pass)previous[3]=0;}
 return previous;
}
export type NativePixels={width:number;height:number;data:Uint8ClampedArray};
const wrapPixel=(n:number,length:number,wrap:number)=>wrap===1?((n%length)+length)%length:wrap===2?((n%(length*2)+length*2)%(length*2)<length?((n%(length*2))+length*2)%(length*2):length*2-1-((n%(length*2)+length*2)%(length*2))):Math.min(length-1,Math.max(0,n));
/** Sampling addresses texel centres and applies wrapping to each bilinear neighbour. */
export function sampleNativeTexture(image:NativePixels,u:number,v:number,wrapS=0,wrapT=0,linear=true):number[]{
 const x=u*image.width-.5,y=v*image.height-.5;
 const pixel=(x:number,y:number)=>{const at=(wrapPixel(y,image.height,wrapT)*image.width+wrapPixel(x,image.width,wrapS))*4;return Array.from(image.data.subarray(at,at+4),v=>v/255);};
 if(!linear)return pixel(Math.floor(x+.5),Math.floor(y+.5));
 const x0=Math.floor(x),y0=Math.floor(y),tx=x-x0,ty=y-y0,a=pixel(x0,y0),b=pixel(x0+1,y0),c=pixel(x0,y0+1),d=pixel(x0+1,y0+1);
 return a.map((n,i)=>(n*(1-tx)+b[i]*tx)*(1-ty)+(c[i]*(1-tx)+d[i]*tx)*ty);
}

export const nativeWhite = [[255,255,255,255],[255,255,255,255],[255,255,255,255],[255,255,255,255]];
const unitUV=[0,0,1,0,0,1,1,1];
export function interpolateNativeQuad(values:number[],u:number,v:number,components=2) {
 return Array.from({length:components},(_,i)=>(values[i]*(1-u)+values[components+i]*u)*(1-v)+(values[components*2+i]*(1-u)+values[components*3+i]*u)*v);
}
export function transformNativeUV(uv:number[],matrix?:NativeMaterial['textureMatrices'][number]) {
 if(!matrix)return uv;
 const angle=matrix.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const x=(uv[0]-.5)*matrix.scale[0]+matrix.translation[0],y=(uv[1]-.5)*matrix.scale[1]+matrix.translation[1];
 return [.5+c*x-s*y,.5+s*x+c*y];
}
/** Native material sampling is independent of Canvas, making real texture/TEV tests possible. */
export function rasterNativePicture(layout:NativeLayout,picture:NativePicture,width:number,height:number,textures:ReadonlyMap<string,NativePixels>,alpha=1):NativePixels {
 const material=layout.materials[picture.material];if(!material)throw new Error(`Missing material ${picture.material}`);
 const sources=material.textureMaps.map(map=>{const name=layout.textures[map.texture],pixels=textures.get(name);if(!pixels)throw new Error(`Missing native texture ${name}`);return pixels;});
 const data=new Uint8ClampedArray(width*height*4),colors=picture.colors.flat();
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=(x+.5)/width,v=(y+.5)/height,primary=interpolateNativeQuad(colors,u,v,4).map(c=>c/255);primary[3]*=alpha;
  const samples=material.textureMaps.map((map,index)=>{
   const generator=material.coordinateGenerators[index];if(generator&&(generator.type!==0||generator.source>2))throw new Error(`Unsupported coordinate generator ${generator.type}/${generator.source}`);
   const uv=transformNativeUV(interpolateNativeQuad(picture.uvSets[generator?.source??index]??unitUV,u,v),material.textureMatrices[index]);
   return sampleNativeTexture(sources[index],uv[0],uv[1],map.wrapS,map.wrapT,map.magFilter!==0);
  });
  data.set(evaluateNativeMaterial(material,samples,primary).map(c=>Math.round(c*255)),(y*width+x)*4);
 }
 return {width,height,data};
}
export type NativeWindowPatch={x:number;y:number;width:number;height:number;picture:NativePicture};
/** A single around-frame is four mirrored strips, not a stretched corner bitmap. */
export function nativeWindowPatches(pane:NativePane,layout:NativeLayout,textures:ReadonlyMap<string,NativePixels>):NativeWindowPatch[] {
 const win=pane.window;if(!win)return [];
 if(win.inflation?.some(v=>v!==0)||win.frameSize?.some(v=>v!==0))throw new Error(`Unsupported window inflation/frame size ${pane.name}`);
 if(win.frames.length!==1||(win.flags&12)!==0)throw new Error(`Unsupported window frame arrangement ${pane.name}`);
 const frame=win.frames[0],material=layout.materials[frame.material];
 if(frame.flip!==0)throw new Error(`Unsupported window frame flip ${frame.flip}`);
 const map=material?.textureMaps[0],image=map&&textures.get(layout.textures[map.texture]);
 const [w,h]=pane.size;if(!image)return [{x:0,y:0,width:w,height:h,picture:win.content}];
 const tw=Math.min(image.width,w/2),th=Math.min(image.height,h/2),uw=(w-tw)/image.width,vh=(h-th)/image.height;
 const picture=(uv:number[]):NativePicture=>({material:frame.material,colors:win.flags&2?win.content.colors:nativeWhite,uvSets:material.textureMaps.map(()=>uv)});
 const result:NativeWindowPatch[]=[];
 if(!(win.flags&16))result.push({x:tw,y:th,width:w-tw*2,height:h-th*2,picture:win.content});
 result.push({x:0,y:0,width:w-tw,height:th,picture:picture([0,0,uw,0,0,1,uw,1])},
  {x:w-tw,y:0,width:tw,height:h-th,picture:picture([1,0,0,0,1,vh,0,vh])},
  {x:tw,y:h-th,width:w-tw,height:th,picture:picture([uw,1,0,1,uw,0,0,0])},
  {x:0,y:th,width:tw,height:h-th,picture:picture([0,vh,1,vh,0,0,1,0])});
 return result;
}

/** Straight framebuffer channels, as used by the native fixed-function blend unit. */
export function blendNativePixel(source:number[],destination:number[],blend:NonNullable<NativeMaterial['colorBlend']>):number[]{
 if(blend.operation===0)return source;
 // CLYT's compact enums are role-specific: source 2/3 use destination RGB;
 // destination 2/3 use source RGB. They are not the PICA register enum.
 const factor=(kind:number,component:number,other:number[])=>{
  switch(kind){case 0:return 0;case 1:return 1;case 2:return other[component];case 3:return 1-other[component];case 4:return source[3];case 5:return 1-source[3];case 6:return destination[3];case 7:return 1-destination[3];default:throw new Error(`Unsupported native blend factor ${kind}`);}
 };
 return source.map((value,i)=>{const s=value*factor(blend.sourceFactor,i,destination),d=destination[i]*factor(blend.destinationFactor,i,source);if(blend.operation===1)return clamp(s+d);if(blend.operation===2)return clamp(s-d);if(blend.operation===3)return clamp(d-s);throw new Error(`Unsupported native blend operation ${blend.operation}`);});
}

/** Both native multiplication forms affect LCD RGB independently of alpha. */
export const nativeMultiplyBlend=(blend:NativeMaterial['colorBlend'])=>blend?.operation===1&&((blend.sourceFactor===2&&blend.destinationFactor===0)||(blend.sourceFactor===0&&blend.destinationFactor===2));

/** Preserve native skips as information, without assigning an absent matrix to a guessed register. */
export function nativeAnimationDiagnostics(layout:NativeLayout,animation:NativeAnimation):string[]{
 const diagnostics:string[]=[];
 for(const track of boundAnimationTracks(layout,animation))if(track.binding==='material'&&track.property.startsWith('texture.')){
  const material=layout.materials.find(m=>m.name===track.target);
  const available=track.property==='texture.pattern'?material?.textureMaps[track.index]:material?.textureMatrices[track.index];
  if(!available&&track.keys.some(k=>k.value!==track.keys[0]?.value))diagnostics.push(`${track.property==='texture.pattern'?'Unallocated animated texture channel':'Native CLTS skip: unallocated texture matrix'} ${track.target}[${track.index}] ${track.property}`);
 }
 return [...new Set(diagnostics)];
}
