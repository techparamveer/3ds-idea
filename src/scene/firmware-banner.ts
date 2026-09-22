import * as THREE from 'three';
import { createFirmwareModel, loadFirmwareModel } from './firmware-model';
import { homeBannerYaw } from '../os/banner-motion';

/** Reuses the console renderer and one native-resolution offscreen target. */
export function createFirmwareBanner(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const backgroundScene = new THREE.Scene();
  // Native folder capture places the ~12-unit mesh across ~120 pixels. Ten
  // pixels per unit also matches its vertical center without a model offset.
  // This is measured framing, not recovered native camera/projection metadata.
  const camera = new THREE.OrthographicCamera(-20, 20, 12, -12, .1, 200);
  camera.position.set(0, 0, 100); camera.lookAt(0, 0, 0);
  const target = new THREE.WebGLRenderTarget(400, 240, { depthBuffer: true, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  // PICA shaders write native numeric color channels. Readback must keep those
  // bytes unchanged; an sRGB attachment encodes them again and washes out cyan.
  target.texture.colorSpace = THREE.NoColorSpace;
  const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 240;
  const context = canvas.getContext('2d')!, pixels = new Uint8Array(400 * 240 * 4), image = context.createImageData(400, 240);
  let model: ReturnType<typeof createFirmwareModel> | undefined, background: ReturnType<typeof createFirmwareModel> | undefined, disposed = false, failure: string | undefined, backgroundFailure:string|undefined;
  const folderReady = loadFirmwareModel('/os/firmware/10.7.0-32E/models/folder/model.json').then(asset => {
    if (disposed) return;
    model = createFirmwareModel(asset); scene.add(model.group);
  }).catch(error => { if (!disposed) failure = String(error); });
  const backgroundReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/home-background/model.json').then(asset=>{
    if(disposed)return;
    background=createFirmwareModel(asset,{skeletal:[{name:'BannerBG_SceneIn',frame:20}],material:[{name:'BannerBG_Loop'}]});
    backgroundScene.add(background.group);
  }).catch(error=>{if(!disposed)backgroundFailure=String(error);});
  const ready=Promise.all([folderReady,backgroundReady]);
  function render(ctx:CanvasRenderingContext2D,source:THREE.Scene) {
    const previous = renderer.getRenderTarget(), color = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
    const toneMapping = renderer.toneMapping, autoClear = renderer.autoClear;
    const viewport = renderer.getViewport(new THREE.Vector4()), scissor = renderer.getScissor(new THREE.Vector4()), scissorTest = renderer.getScissorTest();
    try {
      renderer.setRenderTarget(target); renderer.setViewport(0, 0, 400, 240); renderer.setScissorTest(false);
      renderer.setClearColor(0, 0); renderer.autoClear = true; renderer.toneMapping = THREE.NoToneMapping;
      renderer.render(source, camera); renderer.readRenderTargetPixels(target, 0, 0, 400, 240, pixels);
      for (let row = 0; row < 240; row++) image.data.set(pixels.subarray((239 - row) * 1600, (240 - row) * 1600), row * 1600);
      context.putImageData(image, 0, 0); ctx.drawImage(canvas, 0, 0); return true;
    }
    finally {
      renderer.setRenderTarget(previous); renderer.setViewport(viewport); renderer.setScissor(scissor); renderer.setScissorTest(scissorTest);
      renderer.setClearColor(color, alpha); renderer.toneMapping = toneMapping; renderer.autoClear = autoClear;
    }
  }
  function draw(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean){
    if(disposed||!model||failure)return false;
    try{model.update(reduced?0:elapsedMs);model.group.rotation.y=homeBannerYaw(reduced?0:elapsedMs);return render(ctx,scene);}
    catch(error){failure=String(error);return false;}
  }
  function drawBackground(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean){
    if(disposed||!background||backgroundFailure)return false;
    try{background.update(reduced?0:elapsedMs);return render(ctx,backgroundScene);}
    catch(error){backgroundFailure=String(error);return false;}
  }
  return { ready, draw, drawBackground, status: () => ({ ready: !!model, failure, backgroundReady:!!background, backgroundFailure }), dispose() { disposed = true; model?.dispose();background?.dispose(); target.dispose(); } };
}
