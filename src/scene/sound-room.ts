import * as THREE from 'three';
import { createFirmwareModel, loadFirmwareModel, type FirmwareModelAsset } from './firmware-model';
import { createFirmwareCamera, type FirmwareCameraData } from './firmware-camera';
import type { StockModelBackground } from '../os/stock-model-background';

type SourceCamera={Name:string;ViewType:string;ProjectionType:string;TransformTranslation:{X:number;Y:number;Z:number};TransformRotation:{X:number;Y:number;Z:number};TransformScale:{X:number;Y:number;Z:number};View:{Target:{X:number;Y:number;Z:number};Twist:number};Projection:{FOVY:number;AspectRatio:number;ZNear:number;ZFar:number}};
export const SOUND_ROOM_MODEL='/os/firmware/10.7.0-32E/models/sound-room/model.json';
/** The source uses camera index 0. Stereo offsets are omitted for the mono LCD. */
export function soundRoomCamera(asset:FirmwareModelAsset){
  const data=asset.data as FirmwareModelAsset['data']&{cameras?:SourceCamera[]};
  if(data.sourceSha256!=='134099e5050c465200be110ed53258c2d81c6bfc43456496bb60b53d69fd27bd'||data.models.length!==1||data.models[0].name!=='S_Back_U'||data.models[0].meshes.length!==5||data.cameras?.length!==1)throw new Error('Invalid native Sound room');
  for(const [name,width,height] of [['S_BG_U_Tx_A',128,128],['S_BG_U_Tx_BC',256,128]] as const){
    const texture=data.textures.find(t=>t.name===name),pixels=asset.images.get(name);
    if(!texture||texture.width!==width||texture.height!==height||pixels?.width!==width||pixels.height!==height||pixels.data.length!==width*height*4)throw new Error('Incomplete native Sound room texture '+name);
  }
  const c=data.cameras[0],vec=(v:{X:number;Y:number;Z:number})=>[v.X,v.Y,v.Z];
  const source:FirmwareCameraData={schema:1,cameras:[{name:c.Name,position:vec(c.TransformTranslation),rotation:vec(c.TransformRotation),scale:vec(c.TransformScale),viewType:c.ViewType,aimTarget:vec(c.View.Target),aimTwist:c.View.Twist,projectionType:c.ProjectionType,perspectiveFovRadians:c.Projection.FOVY,aspect:c.Projection.AspectRatio,near:c.Projection.ZNear,far:c.Projection.ZFar}]};
  return createFirmwareCamera(source);
}

/** One foreground owner's lazy static room; no second WebGL context or render loop. */
export function createSoundRoom(renderer:THREE.WebGLRenderer,load=loadFirmwareModel):StockModelBackground&{dispose():void}{
  let owner:string|null=null,generation=0,disposed=false,state:ReturnType<StockModelBackground['prepare']>={status:'inactive'};
  let model:ReturnType<typeof createFirmwareModel>|undefined,camera:THREE.PerspectiveCamera|undefined,target:THREE.WebGLRenderTarget|undefined;
  let canvas:HTMLCanvasElement|undefined,rendered=false;
  const scene=new THREE.Scene();
  const release=()=>{model?.dispose();if(model)scene.remove(model.group);model=undefined;camera=undefined;target?.dispose();target=undefined;if(canvas)canvas.width=canvas.height=0;canvas=undefined;rendered=false;};
  const prepare:StockModelBackground['prepare']=(next,onChange)=>{
    if(disposed)return {status:'inactive'};
    if(next===owner)return state;
    owner=next;const ticket=++generation;release();state={status:next?'loading':'inactive'};
    if(next)void load(SOUND_ROOM_MODEL).then(asset=>{
      if(disposed||ticket!==generation)return;
      try{
        camera=soundRoomCamera(asset);model=createFirmwareModel(asset);model.update(0,camera);scene.add(model.group);
        target=new THREE.WebGLRenderTarget(400,240,{depthBuffer:true,stencilBuffer:false,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});target.texture.colorSpace=THREE.NoColorSpace;
        canvas=document.createElement('canvas');canvas.width=400;canvas.height=240;state={status:'ready'};
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
        renderer.setRenderTarget(target);renderer.setViewport(0,0,400,240);renderer.setScissorTest(false);renderer.setClearColor(0xffffff,1);renderer.toneMapping=THREE.NoToneMapping;renderer.autoClear=false;renderer.clear(true,true,false);
        renderer.render(scene,camera);
        const pixels=new Uint8Array(400*240*4);renderer.readRenderTargetPixels(target,0,0,400,240,pixels);
        const output=canvas.getContext('2d')!,image=output.createImageData(400,240);
        for(let y=0;y<240;y++)for(let x=0;x<400;x++){
          const from=((239-y)*400+x)*4,to=(y*400+x)*4;
          image.data[to]=pixels[from];image.data[to+1]=pixels[from+1];image.data[to+2]=pixels[from+2];image.data[to+3]=255;
        }
        // This is the opaque background of an LCD, not an alpha overlay.
        // lambert2 replaces RGB (One/Zero); its fragment-lighting alpha cannot
        // attenuate the LCD colour again during the Canvas transfer.
        output.putImageData(image,0,0);rendered=true;
      }finally{
        renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.setClearColor(color,alpha);renderer.toneMapping=toneMapping;renderer.autoClear=autoClear;
      }
    }
    context.drawImage(canvas,0,0);return true;
  }
  return {prepare,draw,dispose(){if(disposed)return;disposed=true;++generation;owner=null;state={status:'inactive'};release();}};
}
