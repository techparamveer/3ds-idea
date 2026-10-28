import * as THREE from 'three';
import { createStockTitleBannerResourceHost, type StockTitleBannerTicket } from './stock-title-banner';
import { createFirmwareModel, loadFirmwareModel, type FirmwareModelAsset, type FirmwareModelOptions } from './firmware-model';
import { homeBannerYaw } from '../os/banner-motion';
import { loadFirmwareCamera } from './firmware-camera';
import type { NativePixels } from '../os/native-layout';
import type { HomeSuspendedBackgroundPresentation } from '../os/home-entry-motion';
import { copyNativeOverlay } from './native-overlay';
import { paddedHomeCapture, suspendedBackgroundAsset, suspendedBackgroundPlayback } from './home-suspended-background';
import type { SuspendedCapture } from '../os/notes-suspended-capture';
import { HOME_TOOLBAR_BANNERS, type HomeToolbarBannerKind } from '../os/home-banner-host';

/** A sampled lifecycle state; painting never advances these source-frame clocks. */
export type PrimaryBannerRenderFrame=Readonly<{
  visible:boolean;scale:number;yawRadians:number;skeletalFrame:number;materialFrame:number;
  nativeDisplacementY:number;offsetX:number;offsetY:number;
}>;
export type FolderBannerRenderFrame=PrimaryBannerRenderFrame;
export type HomeBackgroundRenderFrame=Readonly<{
  attached:boolean;sceneInFrame:number;loopFrame:number;
}>;

const primaryOptions:FirmwareModelOptions={overlayCoverage:true,drawGroup:2,runtimeStencil:{enabled:true,function:'Equal',reference:1,compareMask:1,writeMask:0xff,fail:'Keep',depthFail:'Keep',depthPass:'Keep'}};
/** Native toolbar applet banners, in load order. Each is validated against its
 * pinned source and drawn through the one shared primary path. */
const toolbarBannerSources:readonly Readonly<{kind:HomeToolbarBannerKind;model:string;sha256:string;clip:string}>[]=[
  {kind:'news',model:'banner-applet-news',sha256:'c91a037f6462c2aef79fb5944225e8a4c36e7116de804e86cc780a233805a1bc',clip:'BannerAppletNews'},
  {kind:'friend',model:'banner-applet-friend',sha256:'3a611b0356075dad06294f99e0ad45163d273707ecf42c46b0cc5f12942ca7bd',clip:'BannerAppletFriend'},
  {kind:'memo',model:'banner-applet-memo',sha256:'1edaff090f935049048e6cd7d97256b355affe4d4688efb9257831cf7d7a9830',clip:'BannerAppletMemo'},
  {kind:'web',model:'banner-applet-web',sha256:'0c69aaf1cdb35a8e54519e45af9008ad1b10c8ce28e64460be2d1e3c85a299be',clip:'BannerAppletWeb'},
  {kind:'miiverse',model:'banner-applet-miiverse',sha256:'6ce7a4525fbada9b48f5a3dc846bb7a064f08b40af56f53e46b16e63866f46ea',clip:'BannerAppletMvs'},
];
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
  const toolbar=new Map<HomeToolbarBannerKind,{model?:ReturnType<typeof createFirmwareModel>;failure?:string}>(toolbarBannerSources.map(source=>[source.kind,{}]));
  let suspendedBackground: ReturnType<typeof createFirmwareModel> | undefined;
  let suspendedBackgroundFailure: string | undefined;
  let suspendedPlaceholder: NativePixels | undefined;
  const suspendedScene = new THREE.Scene();
  let suspendedCaptureBinding: { owner: string; generation: number } | undefined;
  let suspendedSample: { owner: string; generation: number; playbackKey: string; data: Uint8ClampedArray } | undefined;
  type StockSlot = { ticket: StockTitleBannerTicket; owner: ReturnType<typeof createStockTitleBannerResourceHost>;
    model: ReturnType<typeof createFirmwareModel> | null; failure: string | null; pending: Promise<void> };
  const stockSlots = new Map<string, StockSlot>();
  const stockKey = (ticket: StockTitleBannerTicket) => JSON.stringify([ticket.generation, ticket.requestEpoch, ticket.kind]);
  function syncStockTitles(tickets: readonly StockTitleBannerTicket[]) {
    if (disposed) return Promise.resolve();
    const retained = new Map(tickets.map(ticket => [stockKey(ticket), ticket]));
    if (retained.size > 2) throw new RangeError('HOME retains only its outgoing and incoming stock primary');
    for (const [key, slot] of stockSlots) if (!retained.has(key)) {
      if (slot.model) scene.remove(slot.model.group);
      slot.owner.dispose(); stockSlots.delete(key);
    }
    for (const [key, ticket] of retained) if (!stockSlots.has(key)) {
      const slot: StockSlot = { ticket: { ...ticket }, owner: createStockTitleBannerResourceHost(), model: null, failure: null, pending: Promise.resolve() };
      stockSlots.set(key, slot);
      slot.pending = slot.owner.request(ticket).then(() => {
        if (disposed || stockSlots.get(key) !== slot) return;
        slot.model = slot.owner.status(ticket).model;
        if (slot.model) { slot.model.group.visible = false; scene.add(slot.model.group); }
      });
    }
    return Promise.all([...stockSlots.values()].map(slot => slot.pending)).then(() => {});
  }
  function stockTitleStatus(ticket: StockTitleBannerTicket) {
    const slot = stockSlots.get(stockKey(ticket)), prepared = slot?.owner.status(ticket);
    return { ready: !disposed && !!prepared?.ready && !!mask && !!camera && !frameFailure && !slot?.failure,
      failure: prepared?.failure ?? frameFailure ?? slot?.failure ?? null };
  }
  function drawStockTitleFrame(ctx: CanvasRenderingContext2D, frame: PrimaryBannerRenderFrame, ticket: StockTitleBannerTicket) {
    const slot = stockSlots.get(stockKey(ticket)), primary = slot?.owner.status(ticket).model;
    if (!stockTitleStatus(ticket).ready || !slot || !primary || !camera || !mask) return false;
    if (!frame.visible) return true;
    try {
      primary.group.rotation.y = frame.yawRadians; primary.group.scale.setScalar(frame.scale);
      primary.group.position.set(frame.offsetX, frame.nativeDisplacementY + frame.offsetY, 0);
      mask.group.position.set(0, frame.nativeDisplacementY, 0);
      primary.setPlayback({ skeletal: [{ name: 'COMMON', frame: frame.skeletalFrame }],
        material: ticket.kind === 'sound' ? [{ name: 'COMMON', frame: frame.materialFrame }] : [] });
      primary.update(0, camera); mask.update(0, camera); selectPrimary(primary);
      return render(ctx, scene, true);
    } catch (error) { slot.failure = String(error); return false; }
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
    settingsModel=createFirmwareModel(asset,{skeletal:[{name:'COMMON',frame:0}]},{...primaryOptions,nativeSphereMapping:true});
    settingsModel.group.visible=false;scene.add(settingsModel.group);
  }).catch(error=>{if(!disposed)settingsFailure=String(error);});
  const toolbarReady=toolbarBannerSources.map(source=>loadFirmwareModel(`/os/firmware/10.7.0-32E/models/${source.model}/model.json`).then(asset=>{
    if(disposed)return;
    const native=asset.data.models[0],title=HOME_TOOLBAR_BANNERS.find(banner=>banner.kind===source.kind)!.title;
    if(asset.data.sourceSha256!==source.sha256||asset.data.models.length!==1||native.name!==source.clip||native.meshes.length!==3||asset.data.textures.length!==6||!asset.data.skeletalAnimations.some(clip=>clip.Name===source.clip&&clip.FramesCount===600)||!asset.data.materialAnimations.some(clip=>clip.Name===source.clip&&clip.FramesCount===300))throw new Error(`Incomplete native HOME ${title} banner`);
    const primary=createFirmwareModel(asset,{},primaryOptions);toolbar.get(source.kind)!.model=primary;primary.group.visible=false;scene.add(primary.group);
  }).catch(error=>{if(!disposed)toolbar.get(source.kind)!.failure=String(error);}));
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
    try {
      suspendedPlaceholder = asset.images.get('BG_DmyApp_00');
      suspendedBackground = createFirmwareModel(suspendedBackgroundAsset(asset), suspendedBackgroundPlayback(), { drawGroup: 0, nativeBorderSampling: true });
      suspendedScene.add(suspendedBackground.group);
    } catch (error) { suspendedBackgroundFailure = String(error); }
  }).catch(error=>{if(!disposed)backgroundFailure=String(error);});
  const cameraReady=loadFirmwareCamera('/os/firmware/10.7.0-32E/models/home-camera/camera.json').then(value=>{if(!disposed)camera=value;}).catch(error=>{if(!disposed){failure=String(error);backgroundFailure=String(error);frameFailure=String(error);}});
  const ready=Promise.all([folderReady,defaultReady,settingsReady,...toolbarReady,frameReady,backgroundReady,cameraReady]);
  /** Renders `source` into the native target and runs `read` while it is
   * bound, then restores the console renderer's own state. */
  let stencilClear:number|undefined;
  function renderTarget<T>(source:THREE.Scene,sourceCamera:THREE.Camera,read:()=>T):T {
    const previous = renderer.getRenderTarget(), color = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
    const toneMapping = renderer.toneMapping, autoClear = renderer.autoClear;
    const viewport = renderer.getViewport(new THREE.Vector4()), scissor = renderer.getScissor(new THREE.Vector4()), scissorTest = renderer.getScissorTest();
    // Only this module changes the stencil clear value, and it always restores
    // it, so one read stays current. A per-render query is a synchronous GPU
    // round trip that waits on all queued work.
    const gl=renderer.getContext();stencilClear??=gl.getParameter(gl.STENCIL_CLEAR_VALUE) as number;
    try {
      // setRenderTarget installs target.viewport in physical target pixels.
      // setViewport would multiply it by the page DPR, shrinking the native
      // scene into the target's lower-left corner when DPR is below one.
      renderer.setRenderTarget(target); renderer.setScissorTest(false);
      renderer.setClearColor(0, 0); renderer.autoClear = false; renderer.toneMapping = THREE.NoToneMapping;
      renderer.state.buffers.stencil.setClear(0);renderer.clear(true,true,true);
      // One traversal sorts Frame1 before primary2, including their internal
      // Groups. No target switch, clear or readback separates the stencil pair.
      renderer.render(source, sourceCamera); return read();
    }
    finally {
      renderer.setRenderTarget(previous); renderer.setViewport(viewport); renderer.setScissor(scissor); renderer.setScissorTest(scissorTest);
      renderer.setClearColor(color, alpha); renderer.toneMapping = toneMapping; renderer.autoClear = autoClear;
      renderer.state.buffers.stencil.setClear(stencilClear!);
    }
  }
  /** Copies a bottom-up target readback into top-down LCD rows. */
  function flipRows(from:Uint8Array,to:Uint8ClampedArray){
    for (let row = 0; row < 240; row++) to.set(from.subarray((239 - row) * 1600, (240 - row) * 1600), row * 1600);
  }
  function render(ctx:CanvasRenderingContext2D,source:THREE.Scene,overlay=false) {
    if(!camera)return false;
    renderTarget(source,camera,()=>renderer.readRenderTargetPixels(target, 0, 0, 400, 240, pixels));
    if(overlay)copyNativeOverlay(pixels,image.data,400,240);
    else flipRows(pixels,image.data);
    context.putImageData(image, 0, 0); ctx.drawImage(canvas, 0, 0); return true;
  }
  function selectPrimary(primary:ReturnType<typeof createFirmwareModel>){
    if(model)model.group.visible=primary===model;
    if(defaultModel)defaultModel.group.visible=primary===defaultModel;
    if(settingsModel)settingsModel.group.visible=primary===settingsModel;
    for(const entry of toolbar.values())if(entry.model)entry.model.group.visible=primary===entry.model;
    for(const slot of stockSlots.values())if(slot.model)slot.model.group.visible=primary===slot.model;
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
  function toolbarStatus(kind:HomeToolbarBannerKind){
    const entry=toolbar.get(kind)!;
    return {ready:!disposed&&!!entry.model&&!!mask&&!!camera&&!entry.failure&&!frameFailure,failure:entry.failure??frameFailure};
  }
  function drawToolbarFrame(ctx:CanvasRenderingContext2D,kind:HomeToolbarBannerKind,frame:PrimaryBannerRenderFrame,label?:NativePixels){
    const entry=toolbar.get(kind)!,primary=entry.model;
    if(disposed||!primary||!mask||!camera||entry.failure||frameFailure)return false;
    if(!frame.visible)return true;
    try{
      const labelReady=!!label&&primary.setTexture('DmyText_00',label);
      primary.setMaterialVisible('mt_Text',labelReady);
      const clip=toolbarBannerSources.find(source=>source.kind===kind)!.clip;
      return renderPrimaryFrame(ctx,primary,frame,clip,clip);
    }catch(error){entry.failure=String(error);return false;}
  }
  // The last rendered background sample. Replaying it goes through the same
  // putImageData/drawImage path, so the output bytes are identical.
  let backgroundLifecycleSample:{data:Uint8ClampedArray;key:string}|undefined;
  function drawSuspendedBackground(ctx: CanvasRenderingContext2D, capture: SuspendedCapture,
    presentation: HomeSuspendedBackgroundPresentation | null = null) {
    if (capture.status !== 'ready') {
      if (suspendedCaptureBinding && suspendedPlaceholder) suspendedBackground?.setTexture('BG_DmyApp_00', suspendedPlaceholder, { allowSizeChange: true });
      suspendedCaptureBinding = undefined; suspendedSample = undefined; return false;
    }
    if (disposed || !suspendedBackground || suspendedBackgroundFailure || !camera) return false;
    try {
      const playback = suspendedBackgroundPlayback(presentation), playbackKey = JSON.stringify(playback);
      if (suspendedSample?.owner === capture.owner && suspendedSample.generation === capture.generation
        && suspendedSample.playbackKey === playbackKey) {
        image.data.set(suspendedSample.data); context.putImageData(image, 0, 0); ctx.drawImage(canvas, 0, 0); return true;
      }
      if (suspendedCaptureBinding?.owner !== capture.owner || suspendedCaptureBinding.generation !== capture.generation) {
        if (!suspendedBackground.setTexture('BG_DmyApp_00', paddedHomeCapture(capture.upper), { allowSizeChange: true })) {
          throw new Error('Missing native suspended capture binding');
        }
        suspendedCaptureBinding = { owner: capture.owner, generation: capture.generation };
      }
      suspendedBackground.setPlayback(playback);
      suspendedBackground.update(0, camera);
      const drawn = render(ctx, suspendedScene);
      if (drawn) suspendedSample = { owner: capture.owner, generation: capture.generation, playbackKey, data: image.data.slice() };
      return drawn;
    } catch (error) { suspendedSample = undefined; suspendedBackgroundFailure = String(error); return false; }
  }
  function drawBackgroundFrame(ctx:CanvasRenderingContext2D,frame:number){
    if(disposed||!background||backgroundFailure||!Number.isInteger(frame)||frame<0||frame>599)return false;
    try{background.setPlayback({skeletal:[{name:'BannerBG_SceneIn',frame:20}],material:[{name:'BannerBG_Loop',frame}]});background.update(0,camera);return render(ctx,backgroundScene);}
    catch(error){backgroundFailure=String(error);return false;}
    finally{background.setPlayback({skeletal:[{name:'BannerBG_SceneIn',frame:20}],material:[{name:'BannerBG_Loop'}]});}
  }
  // Once scene-in settles, the loop advances a steady number of source frames
  // between LCD paints (three at 60 Hz with the 24 fps cadence). After each
  // paint, render the frames the next paint is likely to request and queue
  // their readback into a pixel buffer. A paint that requests one copies it
  // out if the GPU has finished, instead of rendering and reading back
  // synchronously; any other frame renders as before. Same scene, playback,
  // camera and target, so the bytes are identical. The copy happens at the
  // start of the next background paint, when little GPU work is queued ahead
  // of it; a WebGL read waits for everything issued before it.
  type BackgroundRead={buffer:WebGLBuffer;sync:WebGLSync};
  const backgroundAhead=new Map<string,BackgroundRead>();
  // The last two observed advances; both are rendered ahead when they differ.
  let backgroundAdvances:number[]=[],steadyLoopFrame:number|undefined;
  function setBackgroundPlayback(sceneInFrame:number,loopFrame:number){
    background!.setPlayback({skeletal:[{name:'BannerBG_SceneIn',frame:sceneInFrame}],material:[{name:'BannerBG_Loop',frame:loopFrame}]});
    background!.update(0,camera);
  }
  function releaseBackgroundRead(read:BackgroundRead){
    const gl=renderer.getContext() as WebGL2RenderingContext;gl.deleteBuffer(read.buffer);gl.deleteSync(read.sync);
  }
  function takeBackgroundAhead(key:string,into:Uint8ClampedArray){
    const read=backgroundAhead.get(key),gl=renderer.getContext() as WebGL2RenderingContext;
    // Reads queued before a context loss belong to the lost context.
    if(gl.isContextLost()){clearBackgroundAhead();return false;}
    if(!read||gl.getSyncParameter(read.sync,gl.SYNC_STATUS)!==gl.SIGNALED)return false;
    backgroundAhead.delete(key);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER,read.buffer);gl.getBufferSubData(gl.PIXEL_PACK_BUFFER,0,pixels);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
    releaseBackgroundRead(read);flipRows(pixels,into);return true;
  }
  function renderBackgroundAhead(loopFrame:number){
    const sourceCamera=camera,gl=renderer.getContext() as WebGL2RenderingContext;
    if(!sourceCamera||gl.isContextLost())return;
    try{
      for(const advance of new Set(backgroundAdvances)){
        const key=`20:${(loopFrame+advance)%600}`;
        if(backgroundAhead.has(key))continue;
        setBackgroundPlayback(20,(loopFrame+advance)%600);
        backgroundAhead.set(key,renderTarget(backgroundScene,sourceCamera,()=>{
          const buffer=gl.createBuffer()!;
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER,buffer);gl.bufferData(gl.PIXEL_PACK_BUFFER,pixels.byteLength,gl.STREAM_READ);
          gl.readPixels(0,0,400,240,gl.RGBA,gl.UNSIGNED_BYTE,0);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
          const sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0)!;gl.flush();return {buffer,sync};
        }));
        while(backgroundAhead.size>6){const [oldest,read]=backgroundAhead.entries().next().value!;backgroundAhead.delete(oldest);releaseBackgroundRead(read);}
      }
    }catch{clearBackgroundAhead();}
    finally{setBackgroundPlayback(20,loopFrame);}
  }
  function clearBackgroundAhead(){
    const lost=renderer.getContext().isContextLost();
    for(const read of backgroundAhead.values())if(!lost)releaseBackgroundRead(read);
    backgroundAhead.clear();
  }
  function drawBackgroundLifecycleFrame(ctx:CanvasRenderingContext2D,frame:HomeBackgroundRenderFrame){
    if(disposed||!background||backgroundFailure)return false;
    if(!frame.attached)return true;
    if(!Number.isInteger(frame.sceneInFrame)||frame.sceneInFrame<0||frame.sceneInFrame>20||
      !Number.isInteger(frame.loopFrame)||frame.loopFrame<0||frame.loopFrame>599)return false;
    const key=`${frame.sceneInFrame}:${frame.loopFrame}`;
    if(backgroundLifecycleSample?.key===key){
      image.data.set(backgroundLifecycleSample.data);context.putImageData(image,0,0);ctx.drawImage(canvas,0,0);return true;
    }
    const steady=frame.sceneInFrame===20;
    if(steady&&steadyLoopFrame!==undefined){
      const advance=(frame.loopFrame-steadyLoopFrame+600)%600;
      if(advance>0&&advance<=8)backgroundAdvances=[advance,...backgroundAdvances].slice(0,2);
    }
    steadyLoopFrame=steady?frame.loopFrame:undefined;
    try{
      if(takeBackgroundAhead(key,image.data)){
        context.putImageData(image,0,0);ctx.drawImage(canvas,0,0);
        backgroundLifecycleSample??={data:new Uint8ClampedArray(image.data.length),key};backgroundLifecycleSample.data.set(image.data);backgroundLifecycleSample.key=key;
        renderBackgroundAhead(frame.loopFrame);
        return true;
      }
      setBackgroundPlayback(frame.sceneInFrame,frame.loopFrame);const drawn=render(ctx,backgroundScene);
      if(drawn){backgroundLifecycleSample??={data:new Uint8ClampedArray(image.data.length),key};backgroundLifecycleSample.data.set(image.data);backgroundLifecycleSample.key=key;}
      if(drawn&&steady)renderBackgroundAhead(frame.loopFrame);
      return drawn;
    }catch(error){backgroundLifecycleSample=undefined;backgroundFailure=String(error);return false;}
  }
  return { ready, drawSuspendedBackground, syncStockTitles, stockTitleStatus, drawStockTitleFrame, draw, drawFrame, drawDefaultFrame, drawSettingsFrame, toolbarStatus, drawToolbarFrame, drawBackgroundFrame, drawBackgroundLifecycleFrame, status: () => ({ ready: !disposed&&!!model&&!!mask&&!!camera, failure:failure??frameFailure, defaultReady:!disposed&&!!defaultModel&&!!mask&&!!camera&&!defaultFailure&&!frameFailure, defaultFailure:defaultFailure??frameFailure, settingsReady:!disposed&&!!settingsModel&&!!mask&&!!camera&&!settingsFailure&&!frameFailure, settingsFailure:settingsFailure??frameFailure, ...Object.fromEntries(toolbarBannerSources.flatMap(({kind})=>{const value=toolbarStatus(kind);return [[`${kind}Ready`,value.ready],[`${kind}Failure`,value.failure]];})), frameReady:!disposed&&!!mask&&!!camera, frameFailure, backgroundReady:!disposed&&!!background&&!!camera, backgroundFailure, suspendedBackgroundReady:!disposed&&!!suspendedBackground&&!!camera&&!suspendedBackgroundFailure, suspendedBackgroundFailure }), dispose() { if(disposed)return;disposed = true; for(const slot of stockSlots.values()){if(slot.model)scene.remove(slot.model.group);slot.owner.dispose();}stockSlots.clear(); model?.dispose();defaultModel?.dispose();settingsModel?.dispose();for(const entry of toolbar.values())entry.model?.dispose();mask?.dispose();background?.dispose();suspendedBackground?.dispose();suspendedCaptureBinding=undefined;suspendedSample=undefined;clearBackgroundAhead();target.dispose(); } };
}
