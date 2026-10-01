/** Decoded NintendoWare CLYT/CLAN data. Format types contain no renderer state. */
export type NativePicture={material:number;colors:number[][];uvSets:number[][]};
export type NativeMessageStyle={fontScale:number[];lineSpacing:number;characterSpacing:number;unresolvedWords?:Record<string,number>};
export type NativeTextColorSpan={start:number;end:number;color:number[]};
export type NativeText={cursorAdvances?:{index:number;advance:number}[];colorSpans?:NativeTextColorSpan[];callName?:string;font:number;material:number;value:string;size:number[];alignment:number;lineAlignment:number;characterSpacing:number;lineSpacing:number;topColor:number[];bottomColor:number[];messageStyle?:NativeMessageStyle};
export type NativePane={unsupported?:unknown[];sourceFormat?:string;part?:NativePart;kind:string;name:string;flags:number;origin:number;alpha:number;translation:number[];rotation:number[];scale:number[];size:number[];children:NativePane[];picture?:NativePicture;text?:NativeText;window?:{content:NativePicture;frames:{material:number;flip:number}[];inflation?:number[];frameSize?:number[];flags:number}};
export type NativeMaterial={capability?:string;sourceCombiners?:{color:number;alpha:number;reserved:number}[];sourceProjections?:{transform:number[];option:number;padding:string}[];sourceFormat?:string;name:string;bufferColor:number[];constantColors:number[][];textureOnly:boolean;textureMaps:{texture:number;wrapS:number;wrapT:number;minFilter:number;magFilter:number}[];textureMatrices:{translation:number[];rotation:number;scale:number[]}[];coordinateGenerators:{type:number;source:number;sourceExtra?:string}[];tevStages:{constantSelectors:number;color:NativeCombiner;alpha:NativeCombiner}[];alphaCompare?:{function:number;reference:number};colorBlend?:{operation:number;sourceFactor:number;destinationFactor:number};unsupported:unknown[]};
export type NativePart={layout:string;magnify:number[];capability?:string;entries:{name:string;usageFlags:number;basicUsageFlags:number;materialUsageFlags:number;property?:NativePane;userDataBytes?:string;basicInfo?:{translation:number[];rotation:number[];scale:number[];size:number[];alpha:number;userData:string;padding:string}}[]};
export type NativeCombiner={sources:number[];operands:number[];mode:number;scale:number;savePrevious:boolean};
export type NativeTrack={target:string;contentIndex?:number;binding:string;property:string;index:number;component:number;interpolation:string;keys:{frame:number;value:number;slope?:number}[]};
export type NativeAnimationShare={sourcePane:string;targetGroup:string};
export type NativeAnimation={frames:number;loop:boolean;groups:string[];tracks:NativeTrack[];contents?:{target:string;binding:string}[];childBinding?:boolean;textures:string[];shares?:NativeAnimationShare[]};
export type NativeGroup={name:string;panes:string[];children:NativeGroup[]};
export type NativeLayout={sourceFormat?:string;canvas:{width:number;height:number;origin:number};roots:NativePane[];materials:NativeMaterial[];textures:string[];fonts:string[];groups:NativeGroup[];unsupported:unknown[]};
export type NativePack={schema:1;name:string;layouts:Record<string,NativeLayout>;animations:Record<string,NativeAnimation>;textures:Record<string,{url:string;width:number;height:number;picaFormat?:number}>;messages:Record<string,{labels:Record<string,number>;styleTable?:string;messages:{text:string;tokens:unknown[];styleIndex?:number|null}[]}>;styles?:Record<string,{styles:NativeMessageStyle[]}>};
export type PaneOverrides=Record<string,{cursorAdvances?:{index:number;advance:number}[];colorSpans?:NativeTextColorSpan[];text?:string;lineSpacing?:number;vertexColors?:number[][];messageStyle?:NativeMessageStyle;fontSize?:number[];visible?:boolean;alpha?:number;translation?:number[];scale?:number[];size?:number[];texture?:string;frame?:number;textureBindings?:Record<number,string>}>;
export type AnimationBinding={name:string;frame:number;groups?:string[];childBinding?:boolean};
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
/** Explicit opt-in for MSBT group 0/type 3 RGBA switches. Offsets are UTF-16. */
export function nativeMessageColorSpans(pack:NativePack,bank:string,label:string):NativeTextColorSpan[]{
 const message=pack.messages[bank]?.messages[pack.messages[bank]?.labels[label]];
 if(!message)return [];
 const spans:NativeTextColorSpan[]=[];let offset=0,color:number[]|undefined;
 for(const raw of message.tokens){
  const token=raw as {text?:string;control?:number;group?:number;type?:number;arguments?:string};
  if(typeof token.text==='string'){
   if(color&&token.text.length)spans.push({start:offset,end:offset+token.text.length,color:[...color]});
   offset+=token.text.length;
  }else if(token.control===14&&token.group===0&&token.type===3){
   if(!/^[0-9a-f]{8}$/i.test(token.arguments??''))throw new Error('Invalid native message RGBA token');
   color=token.arguments!.match(/../g)!.map(byte=>parseInt(byte,16));
  }
 }
 if(offset!==message.text.length)throw new Error('Native message token/text length mismatch');
 return spans;
}
/** Native child layouts inherit the named parent's world transform and only
 * InfluenceAlpha panes contribute to the alpha passed to the child's root.
 * Return source panes without changing their hierarchy or animation sample.
 */
export function nativePaneParentPath(layout: NativeLayout, name: string): readonly NativePane[] | null {
 const find=(panes:NativePane[],parents:NativePane[]):NativePane[]|null=>{
  for(const pane of panes){const path=[...parents,pane];if(pane.name===name)return path;const child=find(pane.children,path);if(child)return child;}return null;
 };
 return find(layout.roots,[]);
}

/** Instantiate the observed CTR portal part overrides in a separate child layout.
 * LayoutExporterU corroborates the 52-byte basic record; the source portal uses
 * only size(0x10), translation+size(0x18), translation+scale(0x28), and text(1).
 * Keep child pane/material names scoped to this instance so source clips bind
 * independently. No source pane is flattened into its parent's name table.
 */
export function instantiateNativePart(parent:NativeLayout,part:NativePart,template:NativeLayout){
 if(parent.sourceFormat!=='FLYT'||template.sourceFormat!=='FLYT'||part.capability!=='amiibo-portal-v1'||part.magnify.length!==2||part.magnify.some(v=>v!==1))throw new Error('Unsupported native part composition');
 const layout=structuredClone(template),panes=new Map<string,NativePane>(),parentTextures:Record<string,string>={};
 const visit=(items:NativePane[])=>items.forEach(p=>{if(panes.has(p.name))throw new Error(`Ambiguous part pane ${p.name}`);panes.set(p.name,p);visit(p.children);});visit(layout.roots);
 const material=(sourceIndex:number,destinationIndex:number)=>{
  const source=parent.materials[sourceIndex],destination=layout.materials[destinationIndex];
  if(!source||!destination||source.name!==destination.name)throw new Error('Missing or mismatched part material');
  const value=structuredClone(source);
  value.textureMaps=value.textureMaps.map(map=>{
   const name=parent.textures[map.texture];if(!name)throw new Error('Missing part texture reference');
   const alias=`__parent_texture_${map.texture}`;parentTextures[alias]=name;
   let index=layout.textures.indexOf(alias);if(index<0){index=layout.textures.length;layout.textures.push(alias);}
   return {...map,texture:index};
  });
  layout.materials[destinationIndex]=value;return destinationIndex;
 };
 const used=new Set<string>();
 for(const entry of part.entries){
  const pane=panes.get(entry.name);if(!pane||used.has(entry.name))throw new Error(`Missing or duplicate part target ${entry.name}`);used.add(entry.name);
  if(![0,1].includes(entry.usageFlags)||entry.materialUsageFlags!==0||entry.userDataBytes||![0,0x10,0x18,0x28].includes(entry.basicUsageFlags))throw new Error('Unsupported part override flags');
  if(entry.basicUsageFlags){
   const basic=entry.basicInfo;if(!basic||basic.padding!=='000000')throw new Error('Missing part basic information');
   if(entry.basicUsageFlags&8)pane.translation=[...basic.translation];
   if(entry.basicUsageFlags&16)pane.size=[...basic.size];
   if(entry.basicUsageFlags&32)pane.scale=[...basic.scale];
  }else if(entry.basicInfo)throw new Error('Unbound part basic information');
  const property=entry.property;if(!property){if(entry.usageFlags)throw new Error('Missing part text property');continue;}
  if(property.kind!==pane.kind)throw new Error('Mismatched part property kind');
  if(property.picture&&pane.picture){
   pane.picture={...structuredClone(property.picture),material:material(property.picture.material,pane.picture.material)};
  }else if(property.text&&pane.text){
   const source=property.text,original=pane.text;
   let font=original.font;
   if(source.font!==0xffff){const name=parent.fonts[source.font];if(!name)throw new Error('Missing part font reference');font=layout.fonts.indexOf(name);if(font<0){font=layout.fonts.length;layout.fonts.push(name);}}
   pane.text={...structuredClone(source),font,material:material(source.material,original.material),value:entry.usageFlags&1?source.value:original.value};
  }else throw new Error('Unsupported part property body');
 }
 return {layout,parentTextures};
}

/** Original HOME209cd0 / keyboard141f2c sampler: float32 VFP order and
 * a strict +/-0.001 key snap. Duplicate keys preserve the outgoing value.
 */
export function sampleNativeTrack(track:NativeTrack,frame:number){
 const keys=track.keys;if(!keys.length)return 0;
 if(track.interpolation==='step'){
  let left=0;while(left+1<keys.length&&keys[left+1].frame<=frame)left++;return keys[left].value;
 }
 const f=Math.fround;frame=f(frame);
 if(keys.length===1||frame<=keys[0].frame)return keys[0].value;
 if(frame>=keys.at(-1)!.frame)return keys.at(-1)!.value;
 let low=0,high=keys.length-1;
 while(low!==high-1&&low!==high){const middle=(low+high)>>>1;if(frame<=keys[middle].frame)high=middle;else low=middle;}
 const a=keys[low],b=keys[high],distance=f(frame-b.frame),epsilon=f(.001);
 if(distance>-epsilon&&distance<epsilon)return high<keys.length-1&&b.frame===keys[high+1].frame?keys[high+1].value:b.value;
 // VMLA/VMLS round the product before addition; these are not fused FMA.
 const delta=f(frame-a.frame),inverse=f(1/f(b.frame-a.frame));
 const square=f(delta*delta),scaledSquare=f(square*inverse),t2=f(scaledSquare*inverse);
 const scaledCube=f(delta*t2),t3=f(scaledCube*inverse);
 const tangentA=f(f(scaledCube-f(scaledSquare*2))+delta),tangentB=f(scaledCube-scaledSquare);
 const weightA=f(f(f(t3*2)-f(t2*3))+1),weightB=f(f(t3*-2)+f(t2*3));
 let value=f(weightA*a.value);value=f(value+f(b.value*weightB));
 value=f(value+f((a.slope??0)*tangentA));return f(value+f((b.slope??0)*tangentB));
}
/** Native CLVC adds0.5f, saturates to u32, then writes the low byte. */
function nativeVertexColorByte(value:number){return Math.trunc(Math.max(0,Math.min(0xffffffff,Math.fround(value+.5))))&255;}
/** CLAN stores unrelated channels too; its binding groups select the active panes/materials. */
export function boundAnimationTracks(layout:NativeLayout,animation:NativeAnimation){
 if(!animation.groups.length&&!animation.shares?.length)return animation.tracks;
 const selected=new Set<string>();const visit=(groups:NativeGroup[])=>groups.forEach(g=>{if(animation.groups.includes(g.name))g.panes.forEach(n=>selected.add(n));visit(g.children);});visit(layout.groups);
 const materials=new Set<string>();const panes=(items:NativePane[],inherited=false)=>items.forEach(p=>{const included=selected.has(p.name)||(!!animation.childBinding&&inherited);if(included){selected.add(p.name);for(const id of [p.picture?.material,p.text?.material,p.window?.content.material,...(p.window?.frames.map(f=>f.material)??[])])if(id!==undefined&&layout.materials[id])materials.add(layout.materials[id].name);}panes(p.children,included);});panes(layout.roots);
 const tracks=animation.groups.length?animation.tracks.filter(t=>t.binding==='material'?materials.has(t.target):selected.has(t.target)):animation.tracks;
 if(!animation.shares?.length)return tracks;
 const shared=sharedAnimationTracks(layout,animation,selected);
 // Competing controllers need their native update-order contract before support.
 const key=(t:NativeTrack)=>JSON.stringify([t.binding,t.target,t.property,t.index,t.component]);
 const occupied=new Set(tracks.map(key));
 for(const track of shared){const id=key(track);if(occupied.has(id))throw new Error(`Unsupported overlapping animation-share channel ${track.target}/${track.property}`);occupied.add(id);}
 return [...tracks,...shared];
}

/** pah1 shares the source pane's own animation content and its material slots.
 * Native 0x177c2c / 0x1795f8 / 0x197358: no source descendants, no reparenting,
 * source itself skipped, destination group members filtered by pat1 selection.
 */
function sharedAnimationTracks(layout:NativeLayout,animation:NativeAnimation,selected:Set<string>):NativeTrack[]{
 const panes=new Map<string,NativePane>(),groups=new Map<string,NativeGroup>();
 const indexPanes=(items:NativePane[])=>items.forEach(p=>{if(panes.has(p.name))throw new Error(`Ambiguous animation-share pane ${p.name}`);panes.set(p.name,p);indexPanes(p.children);});indexPanes(layout.roots);
 const indexGroups=(items:NativeGroup[])=>items.forEach(g=>{if(groups.has(g.name))throw new Error(`Ambiguous animation-share group ${g.name}`);groups.set(g.name,g);indexGroups(g.children);});indexGroups(layout.groups);
 const materialSlots=(pane:NativePane)=>{
  // Window material enumeration has not been verified for animation sharing.
  if(!['pan1','bnd1','pic1','txt1'].includes(pane.kind))throw new Error(`Unsupported animation-share pane kind ${pane.kind}`);
  const ids=pane.picture?[pane.picture.material]:pane.text?[pane.text.material]:[];
  return ids.map(id=>{const material=layout.materials[id];if(!material)throw new Error(`Missing animation-share material ${pane.name}/${id}`);if(layout.materials.filter(m=>m.name===material.name).length!==1)throw new Error(`Ambiguous animation-share material ${material.name}`);return material.name;});
 };
 const content=(target:string,binding:string)=>{
  const matching=animation.tracks.filter(t=>t.target===target&&t.binding===binding);
  // The native share descriptor chooses the first matching pai1 content entry.
  const first=animation.contents?animation.contents.findIndex(c=>c.target===target&&c.binding===binding):matching[0]?.contentIndex;
  return first===undefined?matching:matching.filter(t=>t.contentIndex===first);
 };
 const result:NativeTrack[]=[];
 for(const share of animation.shares??[]){
  const source=panes.get(share.sourcePane),group=groups.get(share.targetGroup);
  if(!source)throw new Error(`Missing animation-share source ${share.sourcePane}`);
  if(!group)throw new Error(`Missing animation-share group ${share.targetGroup}`);
  const paneTracks=content(source.name,'pane'),sourceMaterials=materialSlots(source);
  for(const name of group.panes){
   const target=panes.get(name);if(!target)throw new Error(`Missing animation-share target ${name}`);
   if(target===source||(animation.groups.length&&!selected.has(name)))continue;
   result.push(...paneTracks.map(t=>({...t,target:name})));
   const targetMaterials=materialSlots(target);
   for(let i=0;i<Math.min(sourceMaterials.length,targetMaterials.length);i++)result.push(...content(sourceMaterials[i],'material').map(t=>({...t,target:targetMaterials[i]})));
  }
 }
 return result;
}

/** Applies only explicitly bound clips, without mutating the shared asset pack. */
export function poseNativeLayout(layout:NativeLayout, animations:Record<string,NativeAnimation>, bindings:AnimationBinding[]=[], overrides:PaneOverrides={}) {
 const posed=structuredClone(layout), panes=new Map<string,NativePane>();
 const visit=(items:NativePane[])=>items.forEach(p=>{panes.set(p.name,p);visit(p.children);});visit(posed.roots);
 for(const binding of bindings){
  const source=animations[binding.name];if(!source)throw new Error(`Missing native animation ${binding.name}`);
  const groups=binding.groups?.filter(name=>source.groups.includes(name));if(groups&&!groups.length)continue;
  // Native call sites can bind direct group members despite the resource's descendant flag.
  const animation={...source,groups:groups??source.groups,childBinding:binding.childBinding??source.childBinding};
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
    else if(parts[0]==='alpha')pane.alpha=nativeVertexColorByte(value);
    else if(parts[0]==='translation'||parts[0]==='rotation'||parts[0]==='scale'||parts[0]==='size')pane[parts[0]][parts[1]==='x'||parts[1]==='width'?0:parts[1]==='y'||parts[1]==='height'?1:2]=value;
    else if(parts[0]==='vertexColor'){
     const colors=pane.picture?.colors??pane.window?.content.colors;if(colors?.[Number(parts[1])])colors[Number(parts[1])][Number(parts[2])]=nativeVertexColorByte(value);
    }
   }
  }
 }
 for(const [name,value] of Object.entries(overrides)){
  const pane=panes.get(name);if(!pane)continue;
  if(value.text!==undefined&&pane.text){pane.text.value=value.text;delete pane.text.colorSpans;delete pane.text.cursorAdvances;}
  if(value.cursorAdvances&&pane.text)pane.text.cursorAdvances=structuredClone(value.cursorAdvances);
  if(value.colorSpans&&pane.text)pane.text.colorSpans=structuredClone(value.colorSpans);
  if(value.lineSpacing!==undefined&&pane.text)pane.text.lineSpacing=value.lineSpacing;
  if(value.vertexColors){const picture=pane.picture??pane.window?.content;if(picture)picture.colors=value.vertexColors.map(color=>[...color]);}
  if(value.messageStyle&&pane.text)pane.text.messageStyle=structuredClone(value.messageStyle);
  if(value.fontSize&&pane.text)pane.text.size=[...value.fontSize];
  if(value.visible!==undefined)pane.flags=value.visible?pane.flags|1:pane.flags&~1;
  if(value.alpha!==undefined)pane.alpha=value.alpha;
  if(value.translation)pane.translation=[...value.translation];if(value.scale)pane.scale=[...value.scale];if(value.size)pane.size=[...value.size];
  if(value.textureBindings&&pane.picture){
   const material=structuredClone(posed.materials[pane.picture.material]);
   for(const [slot,texture] of Object.entries(value.textureBindings)){
    const map=material.textureMaps[Number(slot)];if(!map)throw new Error(`Missing native texture sampler ${name}/${slot}`);
    let index=posed.textures.indexOf(texture);if(index<0){index=posed.textures.length;posed.textures.push(texture);}map.texture=index;
   }
   pane.picture.material=posed.materials.length;posed.materials.push(material);
  }
 }
 return posed;
}

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const white=[1,1,1,1];
/** Lower the bounded amiibo FLYT material into the existing TEV evaluator.
 * Native 1cb42c / 1ecdf8: combine textures, interpolate black/white, multiply
 * vertex color. Native format codes 1/13 map to PICA A8/A4 and replace RGB
 * with constant white while retaining sampled alpha. See the command audit.
 */
function prepareFlytMaterial(material:NativeMaterial,formats:readonly (number|undefined)[]):NativeMaterial {
 if(material.sourceFormat!=='FLYT')return material;
 if(material.unsupported.length)throw new Error('Unsupported FLYT material fields');
 const count=material.textureMaps.length,source=material.sourceCombiners?.[0];
 if(count<2&&!source&&!formats.some(format=>format===8||format===11))return material;
 if(count!==1&&(count!==2||material.capability!=='amiibo-two-texture-v1'||material.sourceCombiners?.length!==1||!source||![0,1].includes(source.color)||![0,1].includes(source.alpha)||source.reserved!==0))throw new Error('Unsupported FLYT texture combination');
 if(material.tevStages.length||material.constantColors.length!==1)throw new Error('Unsupported FLYT register composition');
 const combiner=(sources:number[],mode:number,operands=[0,0,0],savePrevious=false):NativeCombiner=>({sources,mode,operands,scale:1,savePrevious});
 const rgba=(sources:number[],mode:number,constantSelectors:number,operands=[0,0,0],savePrevious=false)=>({constantSelectors,color:combiner(sources,mode,operands,savePrevious),alpha:combiner(sources,mode,operands,savePrevious)});
 const rgb=(index:number)=>formats[index]===8||formats[index]===11?4:index;
 const stages=[{constantSelectors:0x22,color:combiner([rgb(0),0,0],0),alpha:combiner([0,0,0],0)}];
 if(count===2)stages.push({constantSelectors:0x22,color:source!.color===0?combiner([rgb(1),6,1],4,[0,0,2]):combiner([rgb(1),6,0],1),alpha:combiner([1,6,0],source!.alpha===1?1:2)});
 // Save the combined sample before splitting the black/white interpolation.
 stages.push(rgba([6,4,0],1,0x11,[0,0,0],true),rgba([4,7,6],7,0,[0,1,0]),rgba([6,5,0],1,0));
 return {...material,constantColors:[...material.constantColors,[255,255,255,255]],tevStages:stages};
}
/** Evaluate NintendoWare TEV in normalized channel space, before framebuffer blending. */
export function evaluateNativeMaterial(material:NativeMaterial, textures:number[][], primary:number[]=white,textureFormats:readonly (number|undefined)[]=[]):number[] {
 material=prepareFlytMaterial(material,textureFormats);
 if(material.sourceFormat==='FLYT'&&material.unsupported.length)throw new Error('Unsupported FLYT material fields');
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
export type NativePixels={width:number;height:number;data:Uint8ClampedArray;picaFormat?:number};
/** HOME 10.7's 0x202940 first-character outline pass. Input is the decoded
 * 32×32 RGB565 target; output is one decoded RGBA4444 atlas cell. Badge mode
 * uses different tables and is deliberately outside this path.
 */
export function nativeFolderGlyphPixels(mask:NativePixels):NativePixels {
 if(mask.width!==32||mask.height!==32||mask.data.length!==4096)throw new Error('Invalid native folder glyph mask');
 const fill=[0xeeed,0xeeed,0xeeed,0xdddd,0xdddd,0xdddd,0xdddd,0xcccd,0xcccd,0xcccd,0xbbbd,0xbbbd,0xbbbd,0xaaad,0xaaad,0xaaad,0x999d,0x999d,0x999d,0x888d,0x888d,0x888d,0x777d,0x777d,0x777d,0x666d,0x666d,0x666d,0x555d,0x555d,0x555d,0x555d];
 const edge=[0xfffc,0xfffc,0xfffc,0xfffb,0xfffb,0xfffb,0xfffa,0xfffa,0xfff9,0xfff9,0xfff9,0xfff8,0xfff8,0xfff7,0xfff7,0xfff7,0xfff6,0xfff6,0xfff6,0xfff5,0xfff5,0xfff4,0xfff4,0xfff4,0xfff3,0xfff3,0xfff2,0xfff2,0xfff2,0xfff1,0xfff1,0xfff1];
 // Ordered distance records at 0x3137b4; the four boundary-row tables omit
 // neighbours outside Y before the native X clamp and early exit.
 const neighbours=[[-1,0,32],[1,0,32],[0,-1,32],[0,1,32],[1,1,45],[1,-1,45],[-1,1,45],[-1,-1,45],[-2,0,64],[2,0,64],[0,-2,64],[0,2,64],[2,1,72],[2,-1,72],[-1,2,72],[1,2,72],[-2,1,72],[-2,-1,72],[-1,-2,72],[1,-2,72],[2,2,90],[2,-2,90],[-2,2,90],[-2,-2,90]];
 const coverage=(x:number,y:number)=>mask.data[(y*32+x)*4+2]>>3,data=new Uint8ClampedArray(4096);
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const level=coverage(x,y);let packed=fill[level];
  if(!level){
   let nearest=0x7fffffff;
   for(const [dx,dy,distance] of neighbours){
    if(y+dy<0||y+dy>=32||distance>nearest)continue;
    const value=coverage(Math.min(31,Math.max(0,x+dx)),y+dy);if(!value)continue;
    const candidate=distance+31-value;if(candidate<nearest){nearest=candidate;if(nearest<64)break;}
   }
   packed=nearest>=96?0xcde0:nearest<64?0xfffc:edge[nearest-64];
  }
  const at=(y*32+x)*4;data[at]=(packed>>12)*17;data[at+1]=(packed>>8&15)*17;data[at+2]=(packed>>4&15)*17;data[at+3]=(packed&15)*17;
 }
 return {width:32,height:32,data};
}
/** BCLIM delivery uses white preview masks; PICA A8/A4 sample zero RGB.
 * Keep PNG decoding lossless and font atlas tinting separate from GPU sampling.
 */
export function nativeTextureSamplePixels(pixels:NativePixels,picaFormat?:number):NativePixels {
 if(picaFormat!==8&&picaFormat!==11)return pixels;
 const data=new Uint8ClampedArray(pixels.data);
 for(let at=0;at<data.length;at+=4)data[at]=data[at+1]=data[at+2]=0;
 return {...pixels,data,picaFormat};
}
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
/** Native panes rasterize as LT-RT-RB and LT-RB-LB triangles. The diagonal
 * matters for unequal corner colors such as Settings' wrench and icons. */
export function interpolateNativeQuad(values:number[],u:number,v:number,components=2) {
 return Array.from({length:components},(_,i)=>u>=v
  ?values[i]*(1-u)+values[components+i]*(u-v)+values[components*3+i]*v
  :values[i]*(1-v)+values[components*2+i]*(v-u)+values[components*3+i]*u);
}
export function transformNativeUV(uv:number[],matrix?:NativeMaterial['textureMatrices'][number]) {
 if(!matrix)return uv;
 const angle=matrix.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const x=(uv[0]-.5)*matrix.scale[0]+matrix.translation[0],y=(uv[1]-.5)*matrix.scale[1]+matrix.translation[1];
 return [.5+c*x-s*y,.5+s*x+c*y];
}
export type NativeRasterRegion={x:number;y:number;fullWidth:number;fullHeight:number;
 /** Inverse destination-to-pane affine transform, applied to raster pixel centres.
  * When supplied, pixels outside the pane have no fragment coverage. */
 localTransform?:readonly [number,number,number,number,number,number]};
/** Keep the original sampling grid when an axis-aligned pane extends beyond the LCD.
 * One neighboring raster pixel preserves Canvas filtering at the visible boundary.
 * Rotated panes retain the existing full-surface path and its raster budget.
 */
export function nativeVisibleRasterRect(x:number,y:number,width:number,height:number,m:{a:number;b:number;c:number;d:number;e:number;f:number},targetWidth:number,targetHeight:number){
 const fullWidth=Math.ceil(width),fullHeight=Math.ceil(height);
 let left=0,top=0,right=fullWidth,bottom=fullHeight;
 if(m.b===0&&m.c===0&&m.a!==0&&m.d!==0){
  const xs=[-m.e/m.a,(targetWidth-m.e)/m.a],ys=[-m.f/m.d,(targetHeight-m.f)/m.d];
  left=Math.max(0,Math.floor((Math.min(...xs)-x)/width*fullWidth)-1);
  right=Math.min(fullWidth,Math.ceil((Math.max(...xs)-x)/width*fullWidth)+1);
  top=Math.max(0,Math.floor((Math.min(...ys)-y)/height*fullHeight)-1);
  bottom=Math.min(fullHeight,Math.ceil((Math.max(...ys)-y)/height*fullHeight)+1);
 }
 if(right<=left||bottom<=top)return null;
 return {x:x+left/fullWidth*width,y:y+top/fullHeight*height,width:(right-left)/fullWidth*width,height:(bottom-top)/fullHeight*height,
  rasterWidth:right-left,rasterHeight:bottom-top,sampling:{x:left,y:top,fullWidth,fullHeight}};
}
type RasterChannel={a:number;b:number;c:number;mode:number;scale:number};
type RasterStage={constant:(number|undefined)[];channels:RasterChannel[];previous:number;output:number;saveColor:boolean;saveAlpha:boolean};
/** Textures occupy offsets 0..15, primary 20..23 and feedback 28..31.
 * Stage outputs alternate between 24..27 and 36..39. Constants have permanent
 * per-stage slots from 40 onward; slot 32 supplies NaN for absent combiner args.
 * A selector packs the channel offset and complement bit, without functions in
 * the pixel loop. Validate even unused args, as the scalar evaluator does.
 */
function prepareRasterStages(material:NativeMaterial,base:number[],constants:number[][]):RasterStage[]{
 const registers=[base,...constants];
 return material.tevStages.map((stage,stageIndex)=>{
  const rgb=registers[stage.constantSelectors&15],alpha=registers[(stage.constantSelectors>>4)&15];
  const constant=[rgb?.[0],rgb?.[1],rgb?.[2],alpha?.[3]];
  const previous=stageIndex===0?20:stageIndex%2===1?24:36,output=stageIndex%2===0?24:36;
  const channels=Array.from({length:4},(_,index)=>{
   const combiner=index===3?stage.alpha:stage.color;
   const selectors=combiner.sources.map((source,i)=>{
    if(!Number.isInteger(source)||source<0||source>7)throw new Error(`Unsupported native TEV source ${source}`);
    const operand=combiner.operands[i],part=Math.floor(operand/2),component=index===3?[3,0,1,2][part]:part===0?index:[3,0,1,2][part-1];
    if(component===undefined)throw new Error(`Unsupported native TEV operand ${operand}`);
    if(source===4&&constant[component]===undefined)throw new Error(`Unsupported native TEV constant selector ${stage.constantSelectors}`);
    const offset=source===4?40+stageIndex*4:source===6?previous:source*4;
    return (offset+component)*2+Number(!!(operand%2));
   });
   if(!Number.isInteger(combiner.mode)||combiner.mode<0||combiner.mode>7)throw new Error(`Unsupported native TEV mode ${combiner.mode}`);
   return {a:selectors[0]??64,b:selectors[1]??64,c:selectors[2]??64,mode:combiner.mode,scale:combiner.scale};
  });
  return {constant,channels,previous,output,saveColor:stage.color.savePrevious,saveAlpha:stage.alpha.savePrevious};
 });
}
/** Specialized pixel loops for rasterNativePicture.
 *
 * The generic loop reads every TEV selector, mode and scale from arrays for
 * every pixel. This module emits one straight-line loop per material
 * *structure* (sampler filters/wraps/matrices, stage selectors, modes, save
 * flags, alpha-compare function) with TEV registers held in local variables.
 * Every value-bearing input (constants, scales, colors, UVs, matrices,
 * compare reference) is still passed in at run time.
 *
 * Exactness: each emitted expression is the generic loop's expression with the
 * same operands, operators and evaluation order, so every double and every
 * output byte is identical. tests/native-raster-kernel.test.mjs compares the
 * result with the independent scalar reference.
 */
export type KernelChannel = { a: number; b: number; c: number; mode: number; scale: number };
export type KernelStage = { channels: readonly KernelChannel[]; previous: number; output: number; saveColor: boolean; saveAlpha: boolean };
export type KernelSampler = {
  image: { width: number; height: number; data: ArrayLike<number> };
  uv: readonly number[]; wrapS: number; wrapT: number; linear: boolean;
  matrix: { c: number; s: number; sx: number; sy: number; tx: number; ty: number } | null;
};
export type KernelInput = {
  data: Uint8ClampedArray; width: number; height: number;
  offsetX: number; offsetY: number; fullWidth: number; fullHeight: number;
  transform: readonly number[] | undefined; colors: readonly number[]; alpha: number;
  samplers: readonly KernelSampler[]; stages: readonly KernelStage[]; bank: Float64Array;
  base: readonly number[]; implicit: readonly number[]; output: number;
  compare: { function: number; reference: number } | null | undefined;
  wrapPixel: (n: number, length: number, wrap: number) => number;
};
type Kernel = (input: KernelInput) => void;

const kernels = new Map<string, Kernel | null>();
const MAX_KERNELS = 64;
let generationAvailable = true;
/** Generating and first-running a kernel costs more than the generic loop on
 * small, one-off panes (most HOME chrome): measured cold, 269 HOME panes took
 * 1.8x longer compiled. Full-screen panes (launch logo, 76,800-96,000 px)
 * amortize it on their first raster. */
let compiledRasterMinPixels = 65536;

function structureKey(input: KernelInput): string {
  return JSON.stringify([
    input.bank.length, input.output, !!input.transform, input.compare?.function ?? null,
    input.samplers.map(sampler => [sampler.linear, sampler.wrapS, sampler.wrapT, !!sampler.matrix]),
    input.stages.map(stage => [stage.previous, stage.output, stage.saveColor, stage.saveAlpha, stage.channels.map(channel => [channel.a, channel.b, channel.c, channel.mode])]),
  ]);
}

function generate(input: KernelInput): string {
  const r = (slot: number) => `r${slot}`;
  const lines: string[] = [];
  const emit = (line: string) => lines.push(line);
  const bankSize = input.bank.length;
  emit('const {data,width,height,offsetX,offsetY,fullWidth,fullHeight,transform,colors,alpha,samplers,stages,bank,base,implicit,compare,wrapPixel}=input;');
  for (let slot = 0; slot < bankSize; slot++) emit(`let ${r(slot)}=bank[${slot}];`);
  for (let i = 0; i < 16; i++) emit(`const k${i}=colors[${i}];`);
  for (let i = 0; i < 4; i++) emit(`const base${i}=base[${i}],implicit${i}=implicit[${i}];`);
  if (input.transform) emit('const t0=transform[0],t1=transform[1],t2=transform[2],t3=transform[3],t4=transform[4],t5=transform[5];');
  if (input.compare) emit('const compareReference=compare.reference;');
  input.samplers.forEach((sampler, index) => {
    emit(`const s${index}=samplers[${index}],d${index}=s${index}.image.data,w${index}=s${index}.image.width,h${index}=s${index}.image.height,uv${index}=s${index}.uv;`);
    for (let i = 0; i < 8; i++) emit(`const uv${index}_${i}=uv${index}[${i}];`);
    if (sampler.matrix) emit(`const mc${index}=s${index}.matrix.c,ms${index}=s${index}.matrix.s,msx${index}=s${index}.matrix.sx,msy${index}=s${index}.matrix.sy,mtx${index}=s${index}.matrix.tx,mty${index}=s${index}.matrix.ty;`);
  });
  input.stages.forEach((stage, stageIndex) => stage.channels.forEach((_, i) => emit(`const scale${stageIndex}_${i}=stages[${stageIndex}].channels[${i}].scale;`)));
  // wrapPixel's clamp branch inline; repeat and mirror call the shared helper.
  const wrap = (n: string, length: string, mode: number) => mode === 1 || mode === 2 ? `wrapPixel(${n},${length},${mode})` : `Math.min(${length}-1,Math.max(0,${n}))`;

  emit('for(let y=0;y<height;y++){');
  emit(' for(let x=0;x<width;x++){');
  emit('  const px=x+offsetX+.5,py=y+offsetY+.5;');
  if (input.transform) {
    emit('  const localX=t0*px+t2*py+t4;');
    emit('  const localY=t1*px+t3*py+t5;');
    emit('  if(localX<0||localY<0||localX>=fullWidth||localY>=fullHeight)continue;');
  } else emit('  const localX=px,localY=py;');
  emit('  const u=localX/fullWidth,v=localY/fullHeight;');
  for (let i = 0; i < 4; i++) emit(`  ${r(20 + i)}=(u>=v?k${i}*(1-u)+k${4 + i}*(u-v)+k${12 + i}*v:k${i}*(1-v)+k${8 + i}*(v-u)+k${12 + i}*u)/255;`);
  emit(`  ${r(23)}*=alpha;`);
  input.samplers.forEach((sampler, index) => {
    if (index >= 4) return; // Extra samplers never reach the four TEV texture slots.
    const slot = index * 4;
    emit('  {');
    emit(`   let tu=u>=v?uv${index}_0*(1-u)+uv${index}_2*(u-v)+uv${index}_6*v:uv${index}_0*(1-v)+uv${index}_4*(v-u)+uv${index}_6*u;`);
    emit(`   let tv=u>=v?uv${index}_1*(1-u)+uv${index}_3*(u-v)+uv${index}_7*v:uv${index}_1*(1-v)+uv${index}_5*(v-u)+uv${index}_7*u;`);
    if (sampler.matrix) {
      emit(`   const mx=(tu-.5)*msx${index}+mtx${index},my=(tv-.5)*msy${index}+mty${index};`);
      emit(`   tu=.5+mc${index}*mx-ms${index}*my;tv=.5+ms${index}*mx+mc${index}*my;`);
    }
    emit(`   const sx=tu*w${index}-.5,sy=tv*h${index}-.5;`);
    if (!sampler.linear) {
      emit(`   const at=(${wrap('Math.floor(sy+.5)', `h${index}`, sampler.wrapT)}*w${index}+${wrap('Math.floor(sx+.5)', `w${index}`, sampler.wrapS)})*4;`);
      for (let i = 0; i < 4; i++) emit(`   ${r(slot + i)}=d${index}[at+${i}]/255;`);
    } else {
      emit('   const x0=Math.floor(sx),y0=Math.floor(sy),tx=sx-x0,ty=sy-y0;');
      emit(`   const left=${wrap('x0', `w${index}`, sampler.wrapS)},right=${wrap('x0+1', `w${index}`, sampler.wrapS)};`);
      emit(`   const top=${wrap('y0', `h${index}`, sampler.wrapT)}*w${index},bottom=${wrap('y0+1', `h${index}`, sampler.wrapT)}*w${index};`);
      emit('   const ia=(top+left)*4,ib=(top+right)*4,ic=(bottom+left)*4,id=(bottom+right)*4;');
      for (let i = 0; i < 4; i++) emit(`   ${r(slot + i)}=(d${index}[ia+${i}]/255*(1-tx)+d${index}[ib+${i}]/255*tx)*(1-ty)+(d${index}[ic+${i}]/255*(1-tx)+d${index}[id+${i}]/255*tx)*ty;`);
    }
    emit('  }');
  });
  for (let i = 0; i < 4; i++) emit(`  ${r(28 + i)}=base${i};`);
  if (!input.stages.length) for (let i = 0; i < 4; i++) emit(`  ${r(24 + i)}=(base${i}+(implicit${i}-base${i})*${r(i)})*${r(20 + i)};`);
  const operand = (selector: number) => { const value = r(selector >> 1); return selector & 1 ? `(1-${value})` : value; };
  input.stages.forEach((stage, stageIndex) => {
    stage.channels.forEach((channel, i) => {
      const a = operand(channel.a), b = operand(channel.b), c = operand(channel.c);
      const value = channel.mode === 0 ? a : channel.mode === 1 ? `${a}*${b}` : channel.mode === 2 ? `${a}+${b}` : channel.mode === 3 ? `${a}+${b}-.5`
        : channel.mode === 4 ? `${a}*${c}+${b}*(1-${c})` : channel.mode === 5 ? `${a}-${b}` : channel.mode === 6 ? `Math.max(0,Math.min(1,${a}+${b}))*${c}` : `${a}*${b}+${c}`;
      emit(`  {const value=${value};${r(stage.output + i)}=Math.max(0,Math.min(1,value*scale${stageIndex}_${i}));}`);
    });
    if (stage.saveColor) emit(`  ${r(28)}=${r(stage.previous)};${r(29)}=${r(stage.previous + 1)};${r(30)}=${r(stage.previous + 2)};`);
    if (stage.saveAlpha) emit(`  ${r(31)}=${r(stage.previous + 3)};`);
  });
  if (input.compare) {
    const fn = input.compare.function, a = r(input.output + 3);
    const pass = fn === 1 ? `${a}<compareReference` : fn === 2 ? `${a}<=compareReference` : fn === 3 ? `${a}===compareReference` : fn === 4 ? `${a}!==compareReference`
      : fn === 5 ? `${a}>=compareReference` : fn === 6 ? `${a}>compareReference` : fn === 7 ? 'true' : 'false';
    emit(`  if(!(${pass}))${a}=0;`);
  }
  emit('  const at=(y*width+x)*4;');
  for (let i = 0; i < 4; i++) emit(`  data[at+${i}]=Math.round(${r(input.output + i)}*255);`);
  emit(' }');
  emit('}');
  return lines.join('\n');
}

/** Test hook: force the generic loop (false) or allow specialized loops (true)
 * for rasters of at least minPixels. */
export function setCompiledRasterEnabled(enabled: boolean, minPixels = 65536) { generationAvailable = enabled; compiledRasterMinPixels = minPixels; }
/** Run the specialized loop. Returns false when code generation is unavailable
 * (for example under a Content-Security-Policy without 'unsafe-eval'); the
 * caller then runs its generic loop. */
export function runCompiledRaster(input: KernelInput): boolean {
  if (!generationAvailable || input.width * input.height < compiledRasterMinPixels) return false;
  const key = structureKey(input);
  let kernel = kernels.get(key);
  if (kernel === undefined) {
    try { kernel = new Function('input', generate(input)) as Kernel; }
    catch { generationAvailable = false; return false; }
    if (kernels.size >= MAX_KERNELS) kernels.delete(kernels.keys().next().value!);
    kernels.set(key, kernel);
  } else { kernels.delete(key); kernels.set(key, kernel); }
  if (!kernel) return false;
  kernel(input);
  return true;
}
/** Native material sampling is independent of Canvas. Per-raster preparation
 * leaves only scalar arithmetic and reusable scratch in the pixel loop. The
 * exported scalar helpers above remain independent reference implementations.
 */
export function rasterNativePicture(layout:NativeLayout,picture:NativePicture,width:number,height:number,textures:ReadonlyMap<string,NativePixels>,alpha=1,material=layout.materials[picture.material],sampling?:NativeRasterRegion):NativePixels {
 if(!material)throw new Error(`Missing material ${picture.material}`);
 if(material.sourceFormat==='FLYT'&&material.unsupported.length)throw new Error('Unsupported FLYT material fields');
 const sources=material.textureMaps.map(map=>{const name=layout.textures[map.texture],pixels=textures.get(name);if(!pixels)throw new Error(`Missing native texture ${name}`);return pixels;});
 material=prepareFlytMaterial(material,sources.map(source=>source.picaFormat));
 const data=new Uint8ClampedArray(width*height*4),colors=picture.colors.flat();
 // Empty rasters never evaluate generators or materials in the scalar path.
 if(width<=0||height<=0)return {width,height,data};
 const samplers=material.textureMaps.map((map,index)=>{
  const generator=material.coordinateGenerators[index];if(generator&&(generator.type!==0||generator.source>2))throw new Error(`Unsupported coordinate generator ${generator.type}/${generator.source}`);
  const matrix=material.textureMatrices[index],angle=matrix?matrix.rotation*Math.PI/180:0;
  return {image:sources[index],uv:picture.uvSets[generator?.source??index]??unitUV,wrapS:map.wrapS,wrapT:map.wrapT,linear:map.magFilter!==0,
   matrix:matrix?{c:Math.cos(angle),s:Math.sin(angle),sx:matrix.scale[0],sy:matrix.scale[1],tx:matrix.translation[0],ty:matrix.translation[1]}:null};
 });
 const base=material.bufferColor.map(v=>v/255),constants=material.constantColors.map(c=>c.map(v=>v/255)),implicit=constants[0]??white;
 const stages=prepareRasterStages(material,base,constants),compare=material.alphaCompare;
 // Float64 keeps JS number precision; no Float32 or byte rounding occurs here.
 const bank=new Float64Array(40+stages.length*4).fill(1);bank[32]=NaN;
 for(let stageIndex=0;stageIndex<stages.length;stageIndex++)for(let i=0;i<4;i++)bank[40+stageIndex*4+i]=stages[stageIndex].constant[i]!;
 const output=stages.length?stages[stages.length-1].output:24;
 const offsetX=sampling?.x??0,offsetY=sampling?.y??0,fullWidth=sampling?.fullWidth??width,fullHeight=sampling?.fullHeight??height;
 const transform=sampling?.localTransform;
 if(runCompiledRaster({data,width,height,offsetX,offsetY,fullWidth,fullHeight,transform,colors,alpha,samplers,stages,bank,base,implicit,output,compare,wrapPixel}))return {width,height,data};
 for(let y=0;y<height;y++){
  for(let x=0;x<width;x++){
   const px=x+offsetX+.5,py=y+offsetY+.5;
   const localX=transform?transform[0]*px+transform[2]*py+transform[4]:px;
   const localY=transform?transform[1]*px+transform[3]*py+transform[5]:py;
   if(transform&&(localX<0||localY<0||localX>=fullWidth||localY>=fullHeight))continue;
   const u=localX/fullWidth,v=localY/fullHeight;
   for(let i=0;i<4;i++){
    bank[20+i]=(u>=v?colors[i]*(1-u)+colors[4+i]*(u-v)+colors[12+i]*v
     :colors[i]*(1-v)+colors[8+i]*(v-u)+colors[12+i]*u)/255;
   }
   bank[23]*=alpha;
   for(let index=0;index<samplers.length;index++){
    const sampler=samplers[index],uv=sampler.uv,matrix=sampler.matrix,image=sampler.image;
    let tu=u>=v?uv[0]*(1-u)+uv[2]*(u-v)+uv[6]*v:uv[0]*(1-v)+uv[4]*(v-u)+uv[6]*u;
    let tv=u>=v?uv[1]*(1-u)+uv[3]*(u-v)+uv[7]*v:uv[1]*(1-v)+uv[5]*(v-u)+uv[7]*u;
    if(matrix){
     const mx=(tu-.5)*matrix.sx+matrix.tx,my=(tv-.5)*matrix.sy+matrix.ty;
     tu=.5+matrix.c*mx-matrix.s*my;tv=.5+matrix.s*mx+matrix.c*my;
    }
    const px=tu*image.width-.5,py=tv*image.height-.5,slot=index*4;
    if(!sampler.linear){
     const at=(wrapPixel(Math.floor(py+.5),image.height,sampler.wrapT)*image.width+wrapPixel(Math.floor(px+.5),image.width,sampler.wrapS))*4;
     // TEV addresses four texture slots. Extra sampler metadata is validated
     // above, but must not overwrite primary/feedback registers.
     if(index<4)for(let i=0;i<4;i++)bank[slot+i]=image.data[at+i]/255;
    }else{
     const x0=Math.floor(px),y0=Math.floor(py),tx=px-x0,ty=py-y0;
     const left=wrapPixel(x0,image.width,sampler.wrapS),right=wrapPixel(x0+1,image.width,sampler.wrapS);
     const top=wrapPixel(y0,image.height,sampler.wrapT)*image.width,bottom=wrapPixel(y0+1,image.height,sampler.wrapT)*image.width;
     const a=(top+left)*4,b=(top+right)*4,c=(bottom+left)*4,d=(bottom+right)*4;
     if(index<4)for(let i=0;i<4;i++){
      // Normalize each texel BEFORE interpolation, preserving both pair sums.
      bank[slot+i]=(image.data[a+i]/255*(1-tx)+image.data[b+i]/255*tx)*(1-ty)+(image.data[c+i]/255*(1-tx)+image.data[d+i]/255*tx)*ty;
     }
    }
   }
   for(let i=0;i<4;i++)bank[28+i]=base[i];
   if(!stages.length)for(let i=0;i<4;i++)bank[24+i]=(base[i]+(implicit[i]-base[i])*bank[i])*bank[20+i];
   for(let stageIndex=0;stageIndex<stages.length;stageIndex++){
    const stage=stages[stageIndex];
    for(let i=0;i<4;i++){
     const channel=stage.channels[i];
     let a=bank[channel.a>>1],b=bank[channel.b>>1],c=bank[channel.c>>1],value:number;
     if(channel.a&1)a=1-a;if(channel.b&1)b=1-b;if(channel.c&1)c=1-c;
     switch(channel.mode){
      case 0:value=a;break;case 1:value=a*b;break;case 2:value=a+b;break;case 3:value=a+b-.5;break;
      case 4:value=a*c+b*(1-c);break;case 5:value=a-b;break;case 6:value=clamp(a+b)*c;break;
      default:value=a*b+c;
     }
     bank[stage.output+i]=clamp(value*channel.scale);
    }
    // Buffer capture reads the preceding stage, never this stage's result.
    if(stage.saveColor){bank[28]=bank[stage.previous];bank[29]=bank[stage.previous+1];bank[30]=bank[stage.previous+2];}
    if(stage.saveAlpha)bank[31]=bank[stage.previous+3];
   }
   if(compare){
    const a=bank[output+3],r=compare.reference;let pass=false;
    switch(compare.function){case 1:pass=a<r;break;case 2:pass=a<=r;break;case 3:pass=a===r;break;case 4:pass=a!==r;break;case 5:pass=a>=r;break;case 6:pass=a>r;break;case 7:pass=true;}
    if(!pass)bank[output+3]=0;
   }
   const at=(y*width+x)*4;for(let i=0;i<4;i++)data[at+i]=Math.round(bank[output+i]*255);
  }
 }
 return {width,height,data};
}
export type NativeWindowPatch={x:number;y:number;width:number;height:number;picture:NativePicture;material?:NativeMaterial};

/** Source 4 / option 6 with identity projection and projected texture matrix:
 * 1c8854 builds pane-fit * inverse(pane matrix); 1c993c supplies that same
 * pane matrix, so the local result is whole-window normalized coordinates.
 * Restrict this to the observed centred window and immutable derived patches.
 */
function projectFlytWindowPatches(pane:NativePane,layout:NativeLayout,patches:NativeWindowPatch[]):NativeWindowPatch[]{
 return patches.map(patch=>{
  const material=patch.material??layout.materials[patch.picture.material];
  if(!material.coordinateGenerators.some(g=>g.source===4))return patch;
  const projection=material.sourceProjections;
  if(material.capability!=='amiibo-two-texture-v1'||pane.origin!==4||projection?.length!==1||projection[0].option!==6||projection[0].padding!=='000000'||projection[0].transform.join(',')!=='0,0,1,1'||material.coordinateGenerators.map(g=>g.source).join(',')!=='0,4'||material.textureMatrices[1]?.translation.join(',')!=='0,0'||material.textureMatrices[1]?.scale.join(',')!=='1,1'||material.textureMatrices[1]?.rotation!==0)throw new Error('Unsupported FLYT window projection');
  const [w,h]=pane.size,u0=patch.x/w,v0=patch.y/h,u1=(patch.x+patch.width)/w,v1=(patch.y+patch.height)/h;
  const uvSets=[patch.picture.uvSets[0]??unitUV,[u0,v0,u1,v0,u0,v1,u1,v1]];
  return {...patch,picture:{...patch.picture,uvSets},material:{...material,sourceProjections:[],coordinateGenerators:[material.coordinateGenerators[0],{...material.coordinateGenerators[1],source:1}]}};
 });
}
/** Native around-windows: one mirrored texture or four independently sampled frames. */
export function nativeWindowPatches(pane:NativePane,layout:NativeLayout,textures:ReadonlyMap<string,NativePixels>):NativeWindowPatch[] {
 const win=pane.window;if(!win)return [];
 if(win.inflation?.some(v=>v!==0)||layout.sourceFormat!=='FLYT'&&win.frameSize?.some(v=>v!==0))throw new Error(`Unsupported window inflation/frame size ${pane.name}`);
 const validateFlytFrameSize=(expected:number[])=>{if(layout.sourceFormat==='FLYT'&&win.frameSize?.some((v,i)=>v!==expected[i]))throw new Error(`Unsupported FLYT custom frame size ${pane.name}`);};
 if((win.flags&12)!==0||![1,4].includes(win.frames.length))throw new Error(`Unsupported window frame arrangement ${pane.name}`);
 if(win.frames.length===4){
  // Native 0x2e3164 returns left/right/top/bottom from frame textures
  // LB.width, RT.width, LT.height, RB.height. Draw order is LT,RT,RB,LB.
  const frames=win.frames.map(frame=>{
   if(![0,1,2,4].includes(frame.flip))throw new Error(`Unsupported window frame flip ${frame.flip}`);
   const material=layout.materials[frame.material],map=material?.textureMaps[0],image=map&&textures.get(layout.textures[map.texture]);
   if(!image)throw new Error(`Missing four-frame window texture ${pane.name}`);
   return {frame,material,image};
  });
  const f=Math.fround,ratio=(value:number,length:number)=>f(value/length),back=(value:number,length:number)=>f(1-ratio(value,length));
  const [w,h]=pane.size,left=frames[2].image.width,right=frames[1].image.width,top=frames[0].image.height,bottom=frames[3].image.height;
  validateFlytFrameSize([left,right,top,bottom]);
  const result:NativeWindowPatch[]=[];
  if(!(win.flags&16))result.push({x:left,y:top,width:w-left-right,height:h-top-bottom,picture:win.content});
  let current=layout.materials[win.content.material];
  const strip=(index:number,x:number,y:number,width:number,height:number,u0:number,v0:number,u1:number,v1:number)=>{
   const {frame,material}=frames[index];
   // 0x1cc998..9d4 skips blend/alpha/combiner writes for TextureOnly.
   // Texture resources and coordinate transforms still come from this frame.
   current=material.textureOnly?{...current,name:material.name,textureOnly:false,textureMaps:material.textureMaps,textureMatrices:material.textureMatrices,coordinateGenerators:material.coordinateGenerators}:material;
   result.push({x,y,width,height,material:current,picture:{material:frame.material,colors:win.flags&2?win.content.colors:nativeWhite,uvSets:material.textureMaps.map(()=>{const flipU=frame.flip===1||frame.flip===4,flipV=frame.flip===2||frame.flip===4;const left=flipU?1-u0:u0,right=flipU?1-u1:u1,top=flipV?1-v0:v0,bottom=flipV?1-v1:v1;return [left,top,right,top,left,bottom,right,bottom];})}});
  };
  // Native UV helpers 0x1cc2e4, 0x1cc1e4, 0x1cc0e4, 0x1cbfe4.
  strip(0,0,0,w-right,top,0,0,ratio(w-right,frames[0].image.width),ratio(top,frames[0].image.height));
  strip(1,w-right,0,right,h-bottom,back(right,frames[1].image.width),0,1,ratio(h-bottom,frames[1].image.height));
  strip(3,left,h-bottom,w-left,bottom,back(w-left,frames[3].image.width),back(bottom,frames[3].image.height),1,1);
  strip(2,0,top,left,h-top,0,back(h-top,frames[2].image.height),ratio(left,frames[2].image.width),1);
  return projectFlytWindowPatches(pane,layout,result);
 }
 const frame=win.frames[0],material=layout.materials[frame.material];
 if(frame.flip!==0)throw new Error(`Unsupported window frame flip ${frame.flip}`);
 const map=material?.textureMaps[0],image=map&&textures.get(layout.textures[map.texture]);
 const [w,h]=pane.size;if(!image)return [{x:0,y:0,width:w,height:h,picture:win.content}];
 validateFlytFrameSize([image.width,image.width,image.height,image.height]);
 const tw=Math.min(image.width,w/2),th=Math.min(image.height,h/2),uw=(w-tw)/image.width,vh=(h-th)/image.height;
 const picture=(uv:number[]):NativePicture=>({material:frame.material,colors:win.flags&2?win.content.colors:nativeWhite,uvSets:material.textureMaps.map(()=>uv)});
 const result:NativeWindowPatch[]=[];
 if(!(win.flags&16))result.push({x:tw,y:th,width:w-tw*2,height:h-th*2,picture:win.content});
 result.push({x:0,y:0,width:w-tw,height:th,picture:picture([0,0,uw,0,0,1,uw,1])},
  {x:w-tw,y:0,width:tw,height:h-th,picture:picture([1,0,0,0,1,vh,0,vh])},
  {x:tw,y:h-th,width:w-tw,height:th,picture:picture([uw,1,0,1,uw,0,0,0])},
  {x:0,y:th,width:tw,height:h-th,picture:picture([0,vh,1,vh,0,0,1,0])});
 return projectFlytWindowPatches(pane,layout,result);
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
