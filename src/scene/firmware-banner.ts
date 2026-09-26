import * as THREE from 'three';
import { createStockTitleBannerResourceHost, type StockTitleBannerTicket } from './stock-title-banner';
import { createFirmwareModel, loadFirmwareModel, type FirmwareModelAsset, type FirmwareModelOptions } from './firmware-model';
import { homeBannerYaw } from '../os/banner-motion';
import { loadFirmwareCamera } from './firmware-camera';
import type { NativePixels } from '../os/native-layout';
import { copyNativeOverlay } from './native-overlay';

/** A sampled lifecycle state; painting never advances these source-frame clocks. */
export type PrimaryBannerRenderFrame=Readonly<{
  visible:boolean;scale:number;yawRadians:number;skeletalFrame:number;materialFrame:number;
  nativeDisplacementY:number;offsetX:number;offsetY:number;
}>;
export type FolderBannerRenderFrame=PrimaryBannerRenderFrame;

const primaryOptions:FirmwareModelOptions={overlayCoverage:true,drawGroup:2,runtimeStencil:{enabled:true,function:'Equal',reference:1,compareMask:1,writeMask:0xff,fail:'Keep',depthFail:'Keep',depthPass:'Keep'}};
const defaultSkeletalClip='BannerDef_anim00',defaultMaterialClip='BannerDef';
const defaultTextures=['DefBnrFrd64x64','DefBnrHome64x64','DefBnrMemo64x64','DefBnrNews64x64','DefBnrOlv64x64','DefBnrWeb64x64'];
function validateDefaultBanner(asset:FirmwareModelAsset){
  const {data,images}=asset;
  if(data.models.length!==1||data.models[0].name!=='BannerDef'||!data.models[0].meshes.length)throw new Error('Expected native BannerDef model');
  // The generic model renderer permits unbound samplers. This primary requires
  // all six actual images, so incomplete packs must not become white fallbacks.
  if(data.textures.length!==defaultTextures.length)throw new Error('Incomplete native BannerDef texture set');
  for(const name of defaultTextures){
    const records=data.textures.filter(texture=>texture.name===name),image=images.get(name);
    if(records.length!==1||records[0].width!==64||records[0].height!==64||!image||image.width!==64||image.height!==64||image.data.length!==64*64*4)throw new Error(`Missing native BannerDef texture ${name}`);
  }
  for(const material of data.models[0].materials)for(const name of [material.Texture0Name,material.Texture1Name,material.Texture2Name]){
    if(name&&!defaultTextures.includes(name))throw new Error(`Unsupported native BannerDef texture binding ${name}`);
  }
  const skeletal=data.skeletalAnimations.filter(clip=>clip.Name===defaultSkeletalClip),material=data.materialAnimations.filter(clip=>clip.Name===defaultMaterialClip);
  if(skeletal.length!==1||skeletal[0].FramesCount!==300||!skeletal[0].AnimationFlags.includes('IsLooping'))throw new Error(`Invalid native BannerDef clip ${defaultSkeletalClip}`);
  if(material.length!==1||material[0].FramesCount!==60||material[0].AnimationFlags.includes('IsLooping'))throw new Error(`Invalid native BannerDef EUR clip ${defaultMaterialClip}`);
}

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
  let model: ReturnType<typeof createFirmwareModel> | undefined, defaultModel: ReturnType<typeof createFirmwareModel> | undefined, settingsModel: ReturnType<typeof createFirmwareModel> | undefined, background: ReturnType<typeof createFirmwareModel> | undefined, mask: ReturnType<typeof createFirmwareModel> | undefined;
  let disposed = false, failure: string | undefined, defaultFailure:string|undefined, settingsFailure:string|undefined, backgroundFailure:string|undefined, frameFailure:string|undefined;
  const stockOwner = createStockTitleBannerResourceHost();
  let stockTicket: StockTitleBannerTicket | null = null;
  let stockModel: ReturnType<typeof createFirmwareModel> | null = null;
  let stockDrawFailure: string | null = null;
  function syncCamera(ticket: StockTitleBannerTicket | null) {
    if (disposed || ticket && stockTicket?.generation === ticket.generation && stockTicket.requestEpoch === ticket.requestEpoch) return;
    if (stockModel) scene.remove(stockModel.group);
    stockModel = null; stockDrawFailure = null; stockTicket = ticket && { ...ticket };
    stockOwner.release();
    if (!ticket) return;
    return stockOwner.request(ticket).then(() => {
      if (disposed || stockTicket?.generation !== ticket.generation || stockTicket.requestEpoch !== ticket.requestEpoch) return;
      stockModel = stockOwner.status(ticket).model;
      if (stockModel) { stockModel.group.visible = false; scene.add(stockModel.group); }
    });
  }
  function cameraStatus(ticket: StockTitleBannerTicket) {
    const prepared = stockOwner.status(ticket);
    return { ready: !disposed && prepared.ready && !!mask && !!camera && !frameFailure && !stockDrawFailure,
      failure: prepared.failure ?? frameFailure ?? stockDrawFailure };
  }
  function drawCameraFrame(ctx: CanvasRenderingContext2D, frame: PrimaryBannerRenderFrame, ticket: StockTitleBannerTicket) {
    const prepared = stockOwner.status(ticket);
    if (!cameraStatus(ticket).ready || !prepared.model || !camera || !mask) return false;
    if (!frame.visible) return true;
    try {
      const primary = prepared.model;
      primary.group.rotation.y = frame.yawRadians; primary.group.scale.setScalar(frame.scale);
      primary.group.position.set(frame.offsetX, frame.nativeDisplacementY + frame.offsetY, 0);
      mask.group.position.set(0, frame.nativeDisplacementY, 0);
      primary.setPlayback({ skeletal: [{ name: 'COMMON', frame: frame.skeletalFrame }] });
      primary.update(0, camera); mask.update(0, camera); selectPrimary(primary);
      return render(ctx, scene, true);
    } catch (error) { stockDrawFailure = String(error); return false; }
  }
  const folderReady = loadFirmwareModel('/os/firmware/10.7.0-32E/models/folder/model.json').then(asset => {
    if (disposed) return;
    model = createFirmwareModel(asset,{},primaryOptions);model.group.visible=false;scene.add(model.group);
  }).catch(error => { if (!disposed) failure = String(error); });
  const defaultReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/banner-default/model.json').then(asset=>{
    if(disposed)return;
    validateDefaultBanner(asset);
    defaultModel=createFirmwareModel(asset,{skeletal:[{name:defaultSkeletalClip,frame:0}],material:[{name:defaultMaterialClip,frame:0}]},primaryOptions);
    defaultModel.group.visible=false;scene.add(defaultModel.group);
  }).catch(error=>{if(!disposed)defaultFailure=String(error);});
  const settingsReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/settings-banner/model.json').then(asset=>{
    if(disposed)return;
    const common=asset.data.models.find(value=>value.name==='COMMON');
    const clip=asset.data.skeletalAnimations.find(value=>value.Name==='COMMON');
    if(asset.data.models.length!==1||!common||common.meshes.length!==12||!clip||clip.FramesCount!==600||!clip.AnimationFlags.includes('IsLooping')||asset.data.materialAnimations.length)throw new Error('Incomplete native Settings COMMON banner');
    for(const material of common.materials)for(const name of [material.Texture0Name,material.Texture1Name,material.Texture2Name]){
      if(name&&!asset.images.has(name))throw new Error(`Missing native Settings texture ${name}`);
    }
    settingsModel=createFirmwareModel(asset,{skeletal:[{name:'COMMON',frame:0}]},primaryOptions);
    settingsModel.group.visible=false;scene.add(settingsModel.group);
  }).catch(error=>{if(!disposed)settingsFailure=String(error);});
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
  const ready=Promise.all([folderReady,defaultReady,settingsReady,frameReady,backgroundReady,cameraReady]);
  function render(ctx:CanvasRenderingContext2D,source:THREE.Scene,overlay=false) {
    if(!camera)return false;
    const previous = renderer.getRenderTarget(), color = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
    const toneMapping = renderer.toneMapping, autoClear = renderer.autoClear;
    const viewport = renderer.getViewport(new THREE.Vector4()), scissor = renderer.getScissor(new THREE.Vector4()), scissorTest = renderer.getScissorTest();
    const gl=renderer.getContext(),stencilClear=gl.getParameter(gl.STENCIL_CLEAR_VALUE) as number;
    try {
      // setRenderTarget installs target.viewport in physical target pixels.
      // setViewport would multiply it by the page DPR, shrinking the native
      // scene into the target's lower-left corner when DPR is below one.
      renderer.setRenderTarget(target); renderer.setScissorTest(false);
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
  function selectPrimary(primary:ReturnType<typeof createFirmwareModel>){
    if(model)model.group.visible=primary===model;
    if(defaultModel)defaultModel.group.visible=primary===defaultModel;
    if(settingsModel)settingsModel.group.visible=primary===settingsModel;
    if(stockModel)stockModel.group.visible=primary===stockModel;
  }
  function renderPrimaryFrame(ctx:CanvasRenderingContext2D,primary:ReturnType<typeof createFirmwareModel>,frame:PrimaryBannerRenderFrame,skeletalClip:string,materialClip:string){
    if(!mask||!camera)return false;
    primary.group.rotation.y=frame.yawRadians;primary.group.scale.setScalar(frame.scale);
    primary.group.position.set(frame.offsetX,frame.nativeDisplacementY+frame.offsetY,0);
    // Frame is a sibling: primary yaw, scale, extra offsets and skeletal bob
    // cannot affect the mask. Hidden samples retain the last copied native Y.
    mask.group.position.set(0,frame.nativeDisplacementY,0);
    primary.setPlayback({skeletal:[{name:skeletalClip,frame:frame.skeletalFrame}],material:[{name:materialClip,frame:frame.materialFrame}]});
    primary.update(0,camera);mask.update(0,camera);selectPrimary(primary);return render(ctx,scene,true);
  }
  function draw(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean,label?:NativePixels){
    if(disposed||!model||!mask||!camera||failure||frameFailure)return false;
    try{
      const labelReady=!!label&&model.setTexture('DmyText_00',label);model.setMaterialVisible('mt_Text',labelReady);
      model.group.position.set(0,0,0);model.group.scale.setScalar(1);model.group.rotation.y=homeBannerYaw(reduced?0:elapsedMs);
      model.setPlayback({});model.update(reduced?0:elapsedMs,camera);
      mask.group.position.set(0,0,0);mask.update(0,camera);selectPrimary(model);return render(ctx,scene,true);
    }
    catch(error){failure=String(error);return false;}
  }
  function drawFrame(ctx:CanvasRenderingContext2D,frame:FolderBannerRenderFrame,label?:NativePixels){
    if(disposed||!model||!mask||!camera||failure||frameFailure)return false;
    if(!frame.visible)return true;
    try{
      const labelReady=!!label&&model.setTexture('DmyText_00',label);model.setMaterialVisible('mt_Text',labelReady);
      return renderPrimaryFrame(ctx,model,frame,'BannerFolder','BannerFolder');
    }
    catch(error){failure=String(error);return false;}
  }
  function drawDefaultFrame(ctx:CanvasRenderingContext2D,frame:PrimaryBannerRenderFrame){
    if(disposed||!defaultModel||!mask||!camera||defaultFailure||frameFailure)return false;
    if(!frame.visible)return true;
    try{return renderPrimaryFrame(ctx,defaultModel,frame,defaultSkeletalClip,defaultMaterialClip);}
    catch(error){defaultFailure=String(error);return false;}
  }
  function drawSettingsFrame(ctx:CanvasRenderingContext2D,frame:PrimaryBannerRenderFrame){
    if(disposed||!settingsModel||!mask||!camera||settingsFailure||frameFailure)return false;
    if(!frame.visible)return true;
    try{
      settingsModel.group.rotation.y=frame.yawRadians;settingsModel.group.scale.setScalar(frame.scale);
      settingsModel.group.position.set(frame.offsetX,frame.nativeDisplacementY+frame.offsetY,0);
      mask.group.position.set(0,frame.nativeDisplacementY,0);
      settingsModel.setPlayback({skeletal:[{name:'COMMON',frame:frame.skeletalFrame}]});
      settingsModel.update(0,camera);mask.update(0,camera);selectPrimary(settingsModel);
      return render(ctx,scene,true);
    }catch(error){settingsFailure=String(error);return false;}
  }
  function drawBackground(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean){
    if(disposed||!background||backgroundFailure)return false;
    try{background.update(reduced?0:elapsedMs,camera);return render(ctx,backgroundScene);}
    catch(error){backgroundFailure=String(error);return false;}
  }
  return { ready, syncCamera, cameraStatus, drawCameraFrame, draw, drawFrame, drawDefaultFrame, drawSettingsFrame, drawBackground, status: () => ({ ready: !disposed&&!!model&&!!mask&&!!camera, failure:failure??frameFailure, defaultReady:!disposed&&!!defaultModel&&!!mask&&!!camera&&!defaultFailure&&!frameFailure, defaultFailure:defaultFailure??frameFailure, settingsReady:!disposed&&!!settingsModel&&!!mask&&!!camera&&!settingsFailure&&!frameFailure, settingsFailure:settingsFailure??frameFailure, frameReady:!disposed&&!!mask&&!!camera, frameFailure, backgroundReady:!disposed&&!!background&&!!camera, backgroundFailure }), dispose() { if(disposed)return;disposed = true; if(stockModel)scene.remove(stockModel.group);stockOwner.dispose();stockModel=null;stockTicket=null; model?.dispose();defaultModel?.dispose();settingsModel?.dispose();mask?.dispose();background?.dispose();target.dispose(); } };
}
