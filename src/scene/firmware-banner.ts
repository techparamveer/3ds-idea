import * as THREE from 'three';
import { createStockTitleBannerResourceHost, type StockTitleBannerTicket } from './stock-title-banner';
import { createFirmwareModel, loadFirmwareModel, type FirmwareModelAsset, type FirmwareModelOptions } from './firmware-model';
import { homeBannerYaw } from '../os/banner-motion';
import { loadFirmwareCamera } from './firmware-camera';
import type { NativePixels } from '../os/native-layout';
import { copyNativeOverlay } from './native-overlay';
import { paddedHomeCapture, suspendedBackgroundAsset } from './home-suspended-background';
import type { SuspendedCapture } from '../os/notes-suspended-capture';

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
  let model: ReturnType<typeof createFirmwareModel> | undefined, defaultModel: ReturnType<typeof createFirmwareModel> | undefined, settingsModel: ReturnType<typeof createFirmwareModel> | undefined, newsModel: ReturnType<typeof createFirmwareModel> | undefined, friendModel: ReturnType<typeof createFirmwareModel> | undefined, memoModel: ReturnType<typeof createFirmwareModel> | undefined, webModel: ReturnType<typeof createFirmwareModel> | undefined, miiverseModel: ReturnType<typeof createFirmwareModel> | undefined, background: ReturnType<typeof createFirmwareModel> | undefined, mask: ReturnType<typeof createFirmwareModel> | undefined;
  let disposed = false, failure: string | undefined, defaultFailure:string|undefined, settingsFailure:string|undefined, newsFailure:string|undefined, friendFailure:string|undefined, memoFailure:string|undefined, webFailure:string|undefined, miiverseFailure:string|undefined, backgroundFailure:string|undefined, frameFailure:string|undefined;
  let suspendedBackground: ReturnType<typeof createFirmwareModel> | undefined;
  let suspendedBackgroundFailure: string | undefined;
  let suspendedPlaceholder: NativePixels | undefined;
  const suspendedScene = new THREE.Scene();
  let suspendedSample: { owner: string; generation: number; data: Uint8ClampedArray } | undefined;
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
  const newsReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/banner-applet-news/model.json').then(asset=>{
    if(disposed)return;
    const source=asset.data.models[0];
    if(asset.data.sourceSha256!=='c91a037f6462c2aef79fb5944225e8a4c36e7116de804e86cc780a233805a1bc'||asset.data.models.length!==1||source.name!=='BannerAppletNews'||source.meshes.length!==3||asset.data.textures.length!==6||!asset.data.skeletalAnimations.some(clip=>clip.Name==='BannerAppletNews'&&clip.FramesCount===600)||!asset.data.materialAnimations.some(clip=>clip.Name==='BannerAppletNews'&&clip.FramesCount===300))throw new Error('Incomplete native HOME Notifications banner');
    newsModel=createFirmwareModel(asset,{},primaryOptions);newsModel.group.visible=false;scene.add(newsModel.group);
  }).catch(error=>{if(!disposed)newsFailure=String(error);});
  const friendReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/banner-applet-friend/model.json').then(asset=>{
    if(disposed)return;
    const source=asset.data.models[0];
    if(asset.data.sourceSha256!=='3a611b0356075dad06294f99e0ad45163d273707ecf42c46b0cc5f12942ca7bd'||asset.data.models.length!==1||source.name!=='BannerAppletFriend'||source.meshes.length!==3||asset.data.textures.length!==6||!asset.data.skeletalAnimations.some(clip=>clip.Name==='BannerAppletFriend'&&clip.FramesCount===600)||!asset.data.materialAnimations.some(clip=>clip.Name==='BannerAppletFriend'&&clip.FramesCount===300))throw new Error('Incomplete native HOME Friend List banner');
    friendModel=createFirmwareModel(asset,{},primaryOptions);friendModel.group.visible=false;scene.add(friendModel.group);
  }).catch(error=>{if(!disposed)friendFailure=String(error);});
  const memoReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/banner-applet-memo/model.json').then(asset=>{
    if(disposed)return;
    const source=asset.data.models[0];
    if(asset.data.sourceSha256!=='1edaff090f935049048e6cd7d97256b355affe4d4688efb9257831cf7d7a9830'||asset.data.models.length!==1||source.name!=='BannerAppletMemo'||source.meshes.length!==3||asset.data.textures.length!==6||!asset.data.skeletalAnimations.some(clip=>clip.Name==='BannerAppletMemo'&&clip.FramesCount===600)||!asset.data.materialAnimations.some(clip=>clip.Name==='BannerAppletMemo'&&clip.FramesCount===300))throw new Error('Incomplete native HOME Game Notes banner');
    memoModel=createFirmwareModel(asset,{},primaryOptions);memoModel.group.visible=false;scene.add(memoModel.group);
  }).catch(error=>{if(!disposed)memoFailure=String(error);});
  const webReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/banner-applet-web/model.json').then(asset=>{
    if(disposed)return;
    const source=asset.data.models[0];
    if(asset.data.sourceSha256!=='0c69aaf1cdb35a8e54519e45af9008ad1b10c8ce28e64460be2d1e3c85a299be'||asset.data.models.length!==1||source.name!=='BannerAppletWeb'||source.meshes.length!==3||asset.data.textures.length!==6||!asset.data.skeletalAnimations.some(clip=>clip.Name==='BannerAppletWeb'&&clip.FramesCount===600)||!asset.data.materialAnimations.some(clip=>clip.Name==='BannerAppletWeb'&&clip.FramesCount===300))throw new Error('Incomplete native HOME Internet Browser banner');
    webModel=createFirmwareModel(asset,{},primaryOptions);webModel.group.visible=false;scene.add(webModel.group);
  }).catch(error=>{if(!disposed)webFailure=String(error);});
  const miiverseReady=loadFirmwareModel('/os/firmware/10.7.0-32E/models/banner-applet-miiverse/model.json').then(asset=>{
    if(disposed)return;
    const source=asset.data.models[0];
    if(asset.data.sourceSha256!=='6ce7a4525fbada9b48f5a3dc846bb7a064f08b40af56f53e46b16e63866f46ea'||asset.data.models.length!==1||source.name!=='BannerAppletMvs'||source.meshes.length!==3||asset.data.textures.length!==6||!asset.data.skeletalAnimations.some(clip=>clip.Name==='BannerAppletMvs'&&clip.FramesCount===600)||!asset.data.materialAnimations.some(clip=>clip.Name==='BannerAppletMvs'&&clip.FramesCount===300))throw new Error('Incomplete native HOME Miiverse banner');
    miiverseModel=createFirmwareModel(asset,{},primaryOptions);miiverseModel.group.visible=false;scene.add(miiverseModel.group);
  }).catch(error=>{if(!disposed)miiverseFailure=String(error);});
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
      suspendedBackground = createFirmwareModel(suspendedBackgroundAsset(asset), {
        skeletal: [{ name: 'BannerBG_SceneIn', frame: 20 }], material: [{ name: 'BannerBG_AppPause', frame: 20 }],
      }, { drawGroup: 0 });
      suspendedScene.add(suspendedBackground.group);
    } catch (error) { suspendedBackgroundFailure = String(error); }
  }).catch(error=>{if(!disposed)backgroundFailure=String(error);});
  const cameraReady=loadFirmwareCamera('/os/firmware/10.7.0-32E/models/home-camera/camera.json').then(value=>{if(!disposed)camera=value;}).catch(error=>{if(!disposed){failure=String(error);backgroundFailure=String(error);frameFailure=String(error);}});
  const ready=Promise.all([folderReady,defaultReady,settingsReady,newsReady,friendReady,memoReady,webReady,miiverseReady,frameReady,backgroundReady,cameraReady]);
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
    if(newsModel)newsModel.group.visible=primary===newsModel;
    if(friendModel)friendModel.group.visible=primary===friendModel;
    if(memoModel)memoModel.group.visible=primary===memoModel;
    if(webModel)webModel.group.visible=primary===webModel;
    if(miiverseModel)miiverseModel.group.visible=primary===miiverseModel;
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
  function drawNewsFrame(ctx:CanvasRenderingContext2D,frame:PrimaryBannerRenderFrame,label?:NativePixels){
    if(disposed||!newsModel||!mask||!camera||newsFailure||frameFailure)return false;
    if(!frame.visible)return true;
    try{
      const labelReady=!!label&&newsModel.setTexture('DmyText_00',label);
      newsModel.setMaterialVisible('mt_Text',labelReady);
      return renderPrimaryFrame(ctx,newsModel,frame,'BannerAppletNews','BannerAppletNews');
    }catch(error){newsFailure=String(error);return false;}
  }
  function drawFriendFrame(ctx:CanvasRenderingContext2D,frame:PrimaryBannerRenderFrame,label?:NativePixels){
    if(disposed||!friendModel||!mask||!camera||friendFailure||frameFailure)return false;
    if(!frame.visible)return true;
    try{
      const labelReady=!!label&&friendModel.setTexture('DmyText_00',label);
      friendModel.setMaterialVisible('mt_Text',labelReady);
      return renderPrimaryFrame(ctx,friendModel,frame,'BannerAppletFriend','BannerAppletFriend');
    }catch(error){friendFailure=String(error);return false;}
  }
  function drawMemoFrame(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean,label?:NativePixels){
    if(disposed||!memoModel||!mask||!camera||memoFailure||frameFailure)return false;
    try{
      const labelReady=!!label&&memoModel.setTexture('DmyText_00',label);
      memoModel.setMaterialVisible('mt_Text',labelReady);
      // The captured native Notes pose is edge-on; its source phase is unknown.
      // Keep the authored front yaw and advance only the decoded source clips.
      memoModel.group.rotation.y=0;
      memoModel.group.scale.setScalar(1);memoModel.group.position.set(0,0,0);
      memoModel.setPlayback({skeletal:[{name:'BannerAppletMemo',frame:reduced?0:Math.floor(elapsedMs/16.6667)%600}],material:[{name:'BannerAppletMemo',frame:reduced?0:Math.floor(elapsedMs/16.6667)%300}]});
      memoModel.update(0,camera);mask.group.position.set(0,0,0);mask.update(0,camera);
      selectPrimary(memoModel);return render(ctx,scene,true);
    }catch(error){memoFailure=String(error);return false;}
  }
  function drawWebFrame(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean,label?:NativePixels){
    if(disposed||!webModel||!mask||!camera||webFailure||frameFailure)return false;
    try{
      const labelReady=!!label&&webModel.setTexture('DmyText_00',label);
      webModel.setMaterialVisible('mt_Text',labelReady);
      // Source-owned front pose and clips; toolbar host motion is not yet traced.
      webModel.group.rotation.y=0;
      webModel.group.scale.setScalar(1);webModel.group.position.set(0,0,0);
      webModel.setPlayback({skeletal:[{name:'BannerAppletWeb',frame:reduced?0:Math.floor(elapsedMs/16.6667)%600}],material:[{name:'BannerAppletWeb',frame:reduced?0:Math.floor(elapsedMs/16.6667)%300}]});
      webModel.update(0,camera);mask.group.position.set(0,0,0);mask.update(0,camera);
      selectPrimary(webModel);return render(ctx,scene,true);
    }catch(error){webFailure=String(error);return false;}
  }
  function drawMiiverseFrame(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean,label?:NativePixels){
    if(disposed||!miiverseModel||!mask||!camera||miiverseFailure||frameFailure)return false;
    try{
      const labelReady=!!label&&miiverseModel.setTexture('DmyText_00',label);
      miiverseModel.setMaterialVisible('mt_Text',labelReady);
      // Source-owned front pose and clips; toolbar host motion is not yet traced.
      miiverseModel.group.rotation.y=0;
      miiverseModel.group.scale.setScalar(1);miiverseModel.group.position.set(0,0,0);
      miiverseModel.setPlayback({skeletal:[{name:'BannerAppletMvs',frame:reduced?0:Math.floor(elapsedMs/16.6667)%600}],material:[{name:'BannerAppletMvs',frame:reduced?0:Math.floor(elapsedMs/16.6667)%300}]});
      miiverseModel.update(0,camera);mask.group.position.set(0,0,0);mask.update(0,camera);
      selectPrimary(miiverseModel);return render(ctx,scene,true);
    }catch(error){miiverseFailure=String(error);return false;}
  }
  // The last rendered background sample. Replaying it goes through the same
  // putImageData/drawImage path, so the output bytes are identical.
  let backgroundSample:{data:Uint8ClampedArray;time:number}|undefined;
  let backgroundLifecycleSample:{data:Uint8ClampedArray;key:string}|undefined;
  function drawSuspendedBackground(ctx: CanvasRenderingContext2D, capture: SuspendedCapture) {
    if (capture.status !== 'ready') {
      if (suspendedSample && suspendedPlaceholder) suspendedBackground?.setTexture('BG_DmyApp_00', suspendedPlaceholder, { allowSizeChange: true });
      suspendedSample = undefined; return false;
    }
    if (disposed || !suspendedBackground || suspendedBackgroundFailure || !camera) return false;
    if (suspendedSample?.owner === capture.owner && suspendedSample.generation === capture.generation) {
      image.data.set(suspendedSample.data); context.putImageData(image, 0, 0); ctx.drawImage(canvas, 0, 0); return true;
    }
    try {
      suspendedBackground.setTexture('BG_DmyApp_00', paddedHomeCapture(capture.upper), { allowSizeChange: true });
      suspendedBackground.update(0, camera);
      const drawn = render(ctx, suspendedScene);
      if (drawn) suspendedSample = { owner: capture.owner, generation: capture.generation, data: image.data.slice() };
      return drawn;
    } catch (error) { suspendedSample = undefined; suspendedBackgroundFailure = String(error); return false; }
  }
  function drawBackground(ctx:CanvasRenderingContext2D,elapsedMs:number,reduced:boolean,reuseWithinMs?:number){
    if(disposed||!background||backgroundFailure)return false;
    const time=reduced?0:elapsedMs;
    if(reuseWithinMs!==undefined&&backgroundSample&&time>=backgroundSample.time&&time-backgroundSample.time<=reuseWithinMs){
      image.data.set(backgroundSample.data);context.putImageData(image,0,0);ctx.drawImage(canvas,0,0);return true;
    }
    try{
      background.update(time,camera);const drawn=render(ctx,backgroundScene);
      if(drawn){backgroundSample??={data:new Uint8ClampedArray(image.data.length),time};backgroundSample.data.set(image.data);backgroundSample.time=time;}
      return drawn;
    }
    catch(error){backgroundSample=undefined;backgroundFailure=String(error);return false;}
  }
  function drawBackgroundFrame(ctx:CanvasRenderingContext2D,frame:number){
    if(disposed||!background||backgroundFailure||!Number.isInteger(frame)||frame<0||frame>599)return false;
    try{background.setPlayback({skeletal:[{name:'BannerBG_SceneIn',frame:20}],material:[{name:'BannerBG_Loop',frame}]});background.update(0,camera);return render(ctx,backgroundScene);}
    catch(error){backgroundFailure=String(error);return false;}
    finally{background.setPlayback({skeletal:[{name:'BannerBG_SceneIn',frame:20}],material:[{name:'BannerBG_Loop'}]});}
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
    try{
      background.setPlayback({skeletal:[{name:'BannerBG_SceneIn',frame:frame.sceneInFrame}],material:[{name:'BannerBG_Loop',frame:frame.loopFrame}]});
      background.update(0,camera);const drawn=render(ctx,backgroundScene);
      if(drawn){backgroundLifecycleSample??={data:new Uint8ClampedArray(image.data.length),key};backgroundLifecycleSample.data.set(image.data);backgroundLifecycleSample.key=key;}
      return drawn;
    }catch(error){backgroundLifecycleSample=undefined;backgroundFailure=String(error);return false;}
  }
  return { ready, drawSuspendedBackground, syncStockTitles, stockTitleStatus, drawStockTitleFrame, draw, drawFrame, drawDefaultFrame, drawSettingsFrame, drawNewsFrame, drawFriendFrame, drawMemoFrame, drawWebFrame, drawMiiverseFrame, drawBackground, drawBackgroundFrame, drawBackgroundLifecycleFrame, status: () => ({ ready: !disposed&&!!model&&!!mask&&!!camera, failure:failure??frameFailure, defaultReady:!disposed&&!!defaultModel&&!!mask&&!!camera&&!defaultFailure&&!frameFailure, defaultFailure:defaultFailure??frameFailure, settingsReady:!disposed&&!!settingsModel&&!!mask&&!!camera&&!settingsFailure&&!frameFailure, settingsFailure:settingsFailure??frameFailure, newsReady:!disposed&&!!newsModel&&!!mask&&!!camera&&!newsFailure&&!frameFailure, newsFailure:newsFailure??frameFailure, friendReady:!disposed&&!!friendModel&&!!mask&&!!camera&&!friendFailure&&!frameFailure, friendFailure:friendFailure??frameFailure, memoReady:!disposed&&!!memoModel&&!!mask&&!!camera&&!memoFailure&&!frameFailure, memoFailure:memoFailure??frameFailure, webReady:!disposed&&!!webModel&&!!mask&&!!camera&&!webFailure&&!frameFailure, webFailure:webFailure??frameFailure, miiverseReady:!disposed&&!!miiverseModel&&!!mask&&!!camera&&!miiverseFailure&&!frameFailure, miiverseFailure:miiverseFailure??frameFailure, frameReady:!disposed&&!!mask&&!!camera, frameFailure, backgroundReady:!disposed&&!!background&&!!camera, backgroundFailure }), dispose() { if(disposed)return;disposed = true; for(const slot of stockSlots.values()){if(slot.model)scene.remove(slot.model.group);slot.owner.dispose();}stockSlots.clear(); model?.dispose();defaultModel?.dispose();settingsModel?.dispose();newsModel?.dispose();friendModel?.dispose();memoModel?.dispose();webModel?.dispose();miiverseModel?.dispose();mask?.dispose();background?.dispose();suspendedBackground?.dispose();suspendedSample=undefined;target.dispose(); } };
}
