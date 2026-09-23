import * as THREE from 'three';
import { createFirmwareModel, loadFirmwareModel } from './firmware-model';
import { homeBannerYaw } from '../os/banner-motion';
import { loadFirmwareCamera } from './firmware-camera';
import type { NativePixels } from '../os/native-layout';
import { copyNativeOverlay } from './native-overlay';

/** A sampled lifecycle state; painting never advances these source-frame clocks. */
export type FolderBannerRenderFrame=Readonly<{
  visible:boolean;scale:number;yawRadians:number;skeletalFrame:number;materialFrame:number;
  nativeDisplacementY:number;offsetX:number;offsetY:number;
}>;

/** Reuses the console renderer and one native-resolution offscreen target. */
export function createFirmwareBanner(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const backgroundScene = new THREE.Scene();
  let camera:THREE.PerspectiveCamera|undefined;
  const target = new THREE.WebGLRenderTarget(400, 240, { depthBuffer: true, stencilBuffer: true, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  // PICA shaders write native numeric color channels. Readback must keep those
  // bytes unchanged; an sRGB attachment encodes them again and washes out cyan.
  target.texture.colorSpace = THREE.NoColorSpace;
  const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 240;
  const context = canvas.getContext('2d')!, pixels = new Uint8Array(400 * 240 * 4), image = context.createImageData(400, 240);
  let model: ReturnType<typeof createFirmwareModel> | undefined, background: ReturnType<typeof createFirmwareModel> | undefined, mask: ReturnType<typeof createFirmwareModel> | undefined;
  let disposed = false, failure: string | undefined, backgroundFailure:string|undefined, frameFailure:string|undefined;
  const folderReady = loadFirmwareModel('/os/firmware/10.7.0-32E/models/folder/model.json').then(asset => {
    if (disposed) return;
    model = createFirmwareModel(asset,{}, {overlayCoverage:true,drawGroup:2,runtimeStencil:{enabled:true,function:'Equal',reference:1,compareMask:1,writeMask:0xff,fail:'Keep',depthFail:'Keep',depthPass:'Keep'}}); scene.add(model.group);
  }).catch(error => { if (!disposed) failure = String(error); });
  const frameReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/banner-frame/model.json').then(asset=>{
    if(disposed)return;
    // Native register headers preserve the global write mask despite JSON's
    // BufferMask=0. Everything else, including Never/Replace, stays authored.
    mask=createFirmwareModel(asset,{}, {drawGroup:1,runtimeStencil:{writeMask:0xff}});scene.add(mask.group);
  }).catch(error=>{if(!disposed)frameFailure=String(error);});
  const backgroundReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/home-background/model.json').then(asset=>{
    if(disposed)return;
    background=createFirmwareModel(asset,{skeletal:[{name:'BannerBG_SceneIn',frame:20}],material:[{name:'BannerBG_Loop'}]},{drawGroup:0});
    backgroundScene.add(background.group);
  }).catch(error=>{if(!disposed)backgroundFailure=String(error);});
  const cameraReady=loadFirmwareCamera('/os/firmware/10.7.0-32E/models/home-camera/camera.json').then(value=>{if(!disposed)camera=value;}).catch(error=>{if(!disposed){failure=String(error);backgroundFailure=String(error);frameFailure=String(error);}});
  const ready=Promise.all([folderReady,frameReady,backgroundReady,cameraReady]);
  function render(ctx:CanvasRenderingContext2D,source:THREE.Scene,overlay=false) {
    if(!camera)return false;
    const previous = renderer.getRenderTarget(), color = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
    const toneMapping = renderer.toneMapping, autoClear = renderer.autoClear;
    const viewport = renderer.getViewport(new THREE.Vector4()), scissor = renderer.getScissor(new THREE.Vector4()), scissorTest = renderer.getScissorTest();
    const gl=renderer.getContext(),stencilClear=gl.getParameter(gl.STENCIL_CLEAR_VALUE) as number;
    try {
      renderer.setRenderTarget(target); renderer.setViewport(0, 0, 400, 240); renderer.setScissorTest(false);
      renderer.setClearColor(0, 0); renderer.autoClear = false; renderer.toneMapping = THREE.NoToneMapping;
      renderer.state.buffers.stencil.setClear(0);renderer.clear(true,true,true);
      // One traversal sorts Frame1 before primary2, including their internal
      // Groups. No target switch, clear or readback separates the stencil pair.
      renderer.render(source, camera); renderer.readRenderTargetPixels(target, 0, 0, 400, 240, pixels);
      if(overlay)copyNativeOverlay(pixels,image.data,400,240);
      else for (let row = 0; row < 240; row++) image.data.set(pixels.subarray((239 - row) * 1600, (240 - row) * 1600), row * 1600);
      context.putImageData(image, 0, 0); ctx.drawImage(canvas, 0, 0); return true;
    }
    finally {
      renderer.setRenderTarget(previous); renderer.setViewport(viewport); renderer.setScissor(scissor); renderer.setScissorTest(scissorTest);
      renderer.setClearColor(color, alpha); renderer.toneMapping = toneMapping; renderer.autoClear = autoClear;
      renderer.state.buffers.stencil.setClear(stencilClear);
    }
  }
  function draw(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean,label?:NativePixels){
    if(disposed||!model||!mask||!camera||failure||frameFailure)return false;
    try{
      const labelReady=!!label&&model.setTexture('DmyText_00',label);model.setMaterialVisible('mt_Text',labelReady);
      model.group.position.set(0,0,0);model.group.scale.setScalar(1);model.group.rotation.y=homeBannerYaw(reduced?0:elapsedMs);
      model.setPlayback({});model.update(reduced?0:elapsedMs,camera);
      mask.group.position.set(0,0,0);mask.update(0,camera);return render(ctx,scene,true);
    }
    catch(error){failure=String(error);return false;}
  }
  function drawFrame(ctx:CanvasRenderingContext2D,frame:FolderBannerRenderFrame,label?:NativePixels){
    if(disposed||!model||!mask||!camera||failure||frameFailure)return false;
    if(!frame.visible)return true;
    try{
      const labelReady=!!label&&model.setTexture('DmyText_00',label);model.setMaterialVisible('mt_Text',labelReady);
      model.group.rotation.y=frame.yawRadians;model.group.scale.setScalar(frame.scale);
      model.group.position.set(frame.offsetX,frame.nativeDisplacementY+frame.offsetY,0);
      // Frame is a sibling: primary yaw, scale, extra offsets and skeletal bob
      // cannot affect the mask. Hidden samples retain the last copied native Y.
      mask.group.position.set(0,frame.nativeDisplacementY,0);
      model.setPlayback({skeletal:[{name:'BannerFolder',frame:frame.skeletalFrame}],material:[{name:'BannerFolder',frame:frame.materialFrame}]});
      model.update(0,camera);mask.update(0,camera);return render(ctx,scene,true);
    }
    catch(error){failure=String(error);return false;}
  }
  function drawBackground(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean){
    if(disposed||!background||backgroundFailure)return false;
    try{background.update(reduced?0:elapsedMs,camera);return render(ctx,backgroundScene);}
    catch(error){backgroundFailure=String(error);return false;}
  }
  return { ready, draw, drawFrame, drawBackground, status: () => ({ ready: !disposed&&!!model&&!!mask&&!!camera, failure:failure??frameFailure, frameReady:!disposed&&!!mask&&!!camera, frameFailure, backgroundReady:!disposed&&!!background&&!!camera, backgroundFailure }), dispose() { if(disposed)return;disposed = true; model?.dispose();mask?.dispose();background?.dispose();target.dispose(); } };
}
