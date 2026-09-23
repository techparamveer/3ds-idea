import { evaluateNativeMaterial, nativeAnimationDiagnostics, poseNativeLayout, type NativePack, type NativePane } from './native-layout';

/** The HOME common fade is a single uniform, untextured pane. Evaluate its
 * original animation/material once instead of rasterizing every LCD pixel.
 * Unexpected source structure or fractional edges retain the regular renderer. */
export function drawNativeSystemFade(ctx:CanvasRenderingContext2D,pack:NativePack|undefined,name:string,clip:string,frame:number):boolean{
 const original=pack?.layouts[name],animation=pack?.animations[clip];
 if(!original||!animation||original.unsupported.length||nativeAnimationDiagnostics(original,animation).length||original.textures.length||original.roots.length!==1)return false;
 const layout=poseNativeLayout(original,pack!.animations,[{name:clip,frame}]);
 const root=layout.roots[0],pane=root.children[0],width=layout.canvas.width,height=layout.canvas.height;
 const plain=(p:NativePane)=>p.origin===4&&p.translation.every(v=>v===0)&&p.rotation.every(v=>v===0)&&p.scale.every(v=>v===1)&&p.size[0]===width&&p.size[1]===height;
 if(root.children.length!==1||root.picture||root.text||root.window||!plain(root)||!pane||!plain(pane)||pane.children.length||pane.text||pane.window||!pane.picture)return false;
 const material=layout.materials[pane.picture.material],blend=material?.colorBlend,colors=pane.picture.colors;
 if(!material||material.unsupported.length||material.textureMaps.length||material.alphaCompare?.function!==7||blend?.operation!==1||blend.sourceFactor!==4||blend.destinationFactor!==5||colors.length!==4||colors.some(c=>c.length!==4||c.some((v,i)=>v!==colors[0][i])))return false;
 const m=ctx.getTransform();
 if(ctx.globalAlpha!==1||m.b!==0||m.c!==0||![m.e,m.f,m.e+m.a*width,m.f+m.d*height].every(Number.isInteger))return false;
 if(!(root.flags&1)||!(pane.flags&1))return true;
 const alpha=pane.alpha/255*(root.flags&2?root.alpha/255:1),primary=colors[0].map(v=>v/255);primary[3]*=alpha;
 const bytes=new Uint8ClampedArray(evaluateNativeMaterial(material,[],primary).map(v=>v*255));
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(${bytes[0]},${bytes[1]},${bytes[2]},${bytes[3]/255})`;ctx.fillRect(0,0,width,height);ctx.restore();
 return true;
}
