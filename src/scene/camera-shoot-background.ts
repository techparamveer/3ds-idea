import * as THREE from 'three';
import { createFirmwareModel, loadFirmwareModel, type FirmwareModelAsset } from './firmware-model';
import { createFirmwareCamera } from './firmware-camera';
import type { StockModelBackground } from '../os/stock-model-background';

type SourceCamera={Name:string;ViewType:string;ProjectionType:string;TransformTranslation:{X:number;Y:number;Z:number};TransformRotation:{X:number;Y:number;Z:number};TransformScale:{X:number;Y:number;Z:number};View:{Target:{X:number;Y:number;Z:number};Twist:number};Projection:{FOVY:number;AspectRatio:number;ZNear:number;ZFar:number}};
export const CAMERA_SHOOT_MODEL='/os/firmware/10.7.0-32E/models/camera-shoot-background/model.json';
/** Capture-scoped adaptation: retain source Aim/FOV/pose, fit only the lower
 * LCD's 4:3 projection. Runtime controller phases remain unbound; see evidence. */
export function cameraShootCamera(asset:FirmwareModelAsset){
  const data=asset.data as FirmwareModelAsset['data']&{cameras?:SourceCamera[]};
  if(data.sourceSha256!=='728ff7412764350ab15fd978236e29dfc0a5bd850803b7a2f343ad82ca0294a1'||data.models.map(m=>m.name).join(',')!=='P_Shoot_D,X_Arw,Z_Arw,A_stick'||data.cameras?.length!==1)throw new Error('Invalid native Camera shoot background');
  for(const [name,width,height] of [['grid',32,32],['Btn',32,64],['Arrow1',64,128],['Arrow2',32,64]] as const){
    const texture=data.textures.find(t=>t.name===name),pixels=asset.images.get(name);
    if(!texture||texture.width!==width||texture.height!==height||pixels?.width!==width||pixels.height!==height||pixels.data.length!==width*height*4)throw new Error('Incomplete native Camera texture '+name);
  }
  const c=data.cameras[0],vec=(v:{X:number;Y:number;Z:number})=>[v.X,v.Y,v.Z];
  return createFirmwareCamera({schema:1,cameras:[{name:c.Name,position:vec(c.TransformTranslation),rotation:vec(c.TransformRotation),scale:vec(c.TransformScale),viewType:c.ViewType,aimTarget:vec(c.View.Target),aimTwist:c.View.Twist,projectionType:c.ProjectionType,perspectiveFovRadians:c.Projection.FOVY,aspect:320/240,near:c.Projection.ZNear,far:c.Projection.ZFar}]});
}

/** One foreground owner's lazy static Camera shoot underlay; no second WebGL context or render loop. */
export function createCameraShootBackground(renderer:THREE.WebGLRenderer,load=loadFirmwareModel):StockModelBackground&{dispose():void}{
  let owner:string|null=null,generation=0,disposed=false,state:ReturnType<StockModelBackground['prepare']>={status:'inactive'};
  let model:ReturnType<typeof createFirmwareModel>|undefined,camera:THREE.PerspectiveCamera|undefined,target:THREE.WebGLRenderTarget|undefined;
  let canvas:HTMLCanvasElement|undefined,rendered=false;
  const scene=new THREE.Scene();
  const release=()=>{model?.dispose();if(model)scene.remove(model.group);model=undefined;camera=undefined;target?.dispose();target=undefined;if(canvas)canvas.width=canvas.height=0;canvas=undefined;rendered=false;};
  const prepare:StockModelBackground['prepare']=(next,onChange)=>{
    if(disposed)return {status:'inactive'};
    if(next===owner)return state;
    owner=next;const ticket=++generation;release();state={status:next?'loading':'inactive'};
    if(next)void load(CAMERA_SHOOT_MODEL).then(asset=>{
      if(disposed||ticket!==generation)return;
      try{
        camera=cameraShootCamera(asset);model=createFirmwareModel(asset);
        // Welcome controller visibility/pose for the interactive arrows/stick is
        // unresolved. Retain their source data, but publish only P_Shoot_D.
        model.group.children.forEach((child,index)=>{child.visible=index===0;});
        model.update(0,camera);scene.add(model.group);
        target=new THREE.WebGLRenderTarget(320,240,{depthBuffer:true,stencilBuffer:false,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});target.texture.colorSpace=THREE.NoColorSpace;
        canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;state={status:'ready'};
      }catch(error){release();state={status:'error',error};}
      onChange();
    }).catch(error=>{if(!disposed&&ticket===generation){release();state={status:'error',error};onChange();}});
    return state;
  };
  function draw(context:CanvasRenderingContext2D){
    if(disposed||state.status!=='ready'||!camera||!model||!target||!canvas)return false;
    if(!rendered){
      const oldTarget=renderer.getRenderTarget(),color=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),toneMapping=renderer.toneMapping,autoClear=renderer.autoClear;
      const viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),scissorTest=renderer.getScissorTest();
      try{
        // The target installs its own 320×240 viewport. setViewport applies
        // the page DPR even here, so it must not be called while bound.
        renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.setClearColor(0x000000,1);renderer.toneMapping=THREE.NoToneMapping;renderer.autoClear=false;renderer.clear(true,true,false);
        renderer.render(scene,camera);
        const pixels=new Uint8Array(320*240*4);renderer.readRenderTargetPixels(target,0,0,320,240,pixels);
        const output=canvas.getContext('2d')!,image=output.createImageData(320,240);
        for(let y=0;y<240;y++)for(let x=0;x<320;x++){
          const from=((239-y)*320+x)*4,to=(y*320+x)*4;
          image.data[to]=pixels[from];image.data[to+1]=pixels[from+1];image.data[to+2]=pixels[from+2];image.data[to+3]=255;
        }
        // Transfer the already-composited RGB once; source vertex/material alpha
        // has already blended into the black LCD clear in the GPU target.
        output.putImageData(image,0,0);rendered=true;
      }finally{
        renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.setClearColor(color,alpha);renderer.toneMapping=toneMapping;renderer.autoClear=autoClear;
      }
    }
    context.drawImage(canvas,0,0);return true;
  }
  return {prepare,draw,dispose(){if(disposed)return;disposed=true;++generation;owner=null;state={status:'inactive'};release();}};
}
