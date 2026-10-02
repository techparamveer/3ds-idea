import { homeTitleBannerKind } from '@/os/home-title-banner';
import type { StockTitleBannerTicket } from './stock-title-banner';
import { createSoundRoom } from './sound-room';
import { createCameraShootBackground } from './camera-shoot-background';
import { createNativeScreenInputGate } from '@/os/native-screen-input';
import { escapeUnreadyNativeScreen, releaseUnreadyNativeInput } from '@/os/native-screen-system';
import { getMenuActionSound } from '../os/menu-action-sound';
import { sampleSystemHomeFolderClose } from '../os/home-folder-close-system';
import { getHomeCursorLoopFrame } from '../os/home-cursor-loop';
import { getHomeCursorSlot } from '../os/home-cursor-visibility';
import { apps, getApp } from '@/os/apps';
import { homeTitles, getTitle } from '@/os/app-registry';
import { currentEntry, getActiveAppView, invokeSystemApplet, launchHomeShortcut, selectedTitle } from '@/os/system';
import { createMenuAudio, type Sound } from '@/os/audio';
import { createPortfolioState, reduceSystem, tickSystem, tickHomeNavigationClockObserved, restoreSettings, restoreRuntimeData, dispatchSystemEvent, releaseSystemInputs, setSystemSleeping, STORAGE_KEY } from '@/os/system';
import { enableHomeControls, reconcileHomeControls, isHomeSwitchPresentationActive } from '@/os/home-controls';
import { openFirmwareStorage, type FirmwareStorage } from '@/os/app-persistence';
import { createRuntimeEffects } from '@/os/runtime-effects';
import { createHomeBannerHost, crossHomeBannerBoundary, stepHomeBannerHost, skipHomeBannerHostPass, getHomeBannerHostView, getHomeBannerHostBackgroundFrame, getHomeBannerCloseReadyUpdate, resolveHomeBannerHostSelection, resolveHomeBannerHostObservation, type HomeBannerHostSelection } from '@/os/home-banner-host';
import type { AppCommand, AppEvent } from '@/os/app-types';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createScreens, loadFirmwarePresentationAssets } from '@/os/screens';
import { rowCount, type MenuState, type Input } from '@/os/state';
import { createFirmwareBanner, type PrimaryBannerRenderFrame } from './firmware-banner';
import { settingsBannerPhase } from './banner-verification';
import { MAX_LID_DEGREES, REST_YAW, sampleIntroPose } from './motion';
import { controlBoundsInBase, controlFromObject, isSilverPaintMaterial, resolveModelLayout, type ScreenPlacement, type DirectionalControlName, type ControlDirection } from './model-layout';
import { installSourcePaintSurface } from './source-paint-surface';
import { createConsoleFraming } from './framing';
import { ButtonMotion, buttonTravel } from './button-motion';
import { createDirectionalRig, DirectionalMotion, DIRECTION_VECTOR, clampPad, padDirection, type PadVector } from './directional-motion';
import { applicationCloseNeedsPaint, bootRevealNeedsPaint, browserRenderQuality, pixelRatioForViewport, screenPaintFps } from './render-quality';
import { bootRevealFrame } from '@/os/system-transitions';
import { applicationCloseAllowsInput, applicationCloseNeedsReadyScreen } from './application-close-input';
import { PACKED_MODEL_URL } from './model-delivery';
import { createRenderSchedule } from './render-schedule';
import { healthTopLoopFrame } from '@/os/stock-health-scroll';
import { captureAtHealthFrame, encodeNativeLcdPair, lcdCaptureEnabled, lcdHomeHudSample, lcdDownloadPayload, lcdDownloadRequest } from './lcd-capture';

const RAD = Math.PI / 180;
let nextBannerSession=0;
export async function createConsoleScene(host:HTMLDivElement,modelUrl=PACKED_MODEL_URL):Promise<()=>void> {
  const quality=browserRenderQuality(host);const diagnostics=process.env.NODE_ENV==='development'||lcdCaptureEnabled(window.location,false);const lcdCapture=lcdCaptureEnabled(window.location,diagnostics);host.dataset.quality=quality.tier;
  const renderer=new THREE.WebGLRenderer({antialias:quality.antialias,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(quality.pixelRatio);renderer.setClearColor(0xeae8e4,1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  // The render schedule requests shadow updates; LCD-only frames reuse the map.
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(33,1,.01,100);
  camera.position.set(.08,2.45,2.65);camera.lookAt(0,.28,-.15);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.025);scene.environment=env.texture;scene.environmentIntensity=.5;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf5f7ff,0xaaa59e,.45));
  const key=new THREE.DirectionalLight(0xf7f9ff,2.3);key.position.set(-2,4,3);key.castShadow=true;key.shadow.mapSize.set(quality.shadowMapSize,quality.shadowMapSize);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=2;key.shadow.camera.bottom=-2;key.shadow.normalBias=.012;key.shadow.bias=-.0002;key.shadow.radius=5;scene.add(key);
  const rim=new THREE.DirectionalLight(0xfff8eb,1.1);rim.position.set(2,2,-3);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x625d55,opacity:.16}));floor.rotation.x=-Math.PI/2;floor.position.y=-.15;floor.receiveShadow=true;scene.add(floor);
  const pivot=new THREE.Group();scene.add(pivot);
  // Firmware presentation assets and native banner models need only the
  // renderer; fetch and decode them while the console model loads.
  const firmwareAbort=new AbortController();
  const folderBanner=createFirmwareBanner(renderer);
  const nativeAssets=loadFirmwarePresentationAssets(undefined,firmwareAbort.signal).catch(error=>{host.dataset.firmwareFailure=String(error);return undefined;});
  let gltf;
  try{gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl);}catch(e){firmwareAbort.abort();folderBanner.dispose();renderer.dispose();renderer.domElement.remove();env.dispose();throw e;}
  const model=gltf.scene;model.scale.setScalar(10);pivot.add(model);
  const layout=resolveModelLayout(model);const {hinge}=layout;
  host.dataset.model=modelUrl;host.dataset.layout=layout.source;
  const powerLeds:THREE.Mesh[]=[];
  model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(o.userData.console_replace_with_display===true)o.visible=false;if(/Blue.?power.?LED/i.test(o.name))powerLeds.push(o);}});
  let runtimeNotice:string|null=null,storage:FirmwareStorage|undefined,state=createPortfolioState();
  let legacyPreferences:string|null=null;try{legacyPreferences=localStorage.getItem(STORAGE_KEY);}catch{}
  const soundRoom=createSoundRoom(renderer);
  const cameraShoot=createCameraShootBackground(renderer);
  try{storage=await openFirmwareStorage({legacyPreferences});const saved=await storage.load();state=restoreRuntimeData(restoreSettings(state,saved.preferences),saved.shared,saved.saves);if(saved.issues.length)runtimeNotice='Some saved data could not be read.';}
  catch(error){state=restoreSettings(state,legacyPreferences);runtimeNotice='Local saving is unavailable.';host.dataset.storageFailure=String(error);}
  const firmwareAssets=await nativeAssets;
  if(firmwareAssets)state=enableHomeControls(state);
  // Restore is complete before the host is created. A later System restore must
  // allocate a new session as well; individual folder scopes are owned by the host.
  const bannerGeneration=`console-session:${++nextBannerSession}`;
  let verificationBannerFrame:number|undefined,verificationBannerSkeletalFrame:number|undefined,verificationHealthBannerFrame:number|undefined;
  const bannerClock=()=>({generation:bannerGeneration,updateCount:state.system!.homeClock.updateCount});
  let bannerHost=createHomeBannerHost(bannerClock(),{managerInhibited:true,sceneInhibited:true,loadInhibited:false,nativeWorkerReady:true,resourceReady:null});
  let bannerLabelFailure=false;
  const nativeFolderAvailable=()=>{const value=folderBanner.status();return !!firmwareAssets&&value.ready&&!value.failure;};
  const nativePrimaryAvailable=(selection:HomeBannerHostSelection)=>{const value=folderBanner.status();return selection.kind==='default'?value.defaultReady&&!value.defaultFailure:selection.kind==='app'?value.settingsReady&&!value.settingsFailure:selection.kind==='toolbar'?selection.focus===2?value.friendReady&&!value.friendFailure:selection.focus===3&&value.newsReady&&!value.newsFailure:selection.kind==='clear'||nativeFolderAvailable();};
  const screens=createScreens({soundRoom,cameraShoot,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches,firmwareAssets,
    drawSuspendedBackground:(ctx,capture,presentation)=>folderBanner.drawSuspendedBackground(ctx,capture,presentation),
    getHomeBanner:()=>{const view=getHomeBannerHostView(bannerHost);return view.status==='pending'&&view.selection.kind!=='app'&&view.selection.kind!=='toolbar'&&(!nativePrimaryAvailable(view.selection)||bannerLabelFailure)?undefined:view;},
    getFriendBannerFailure:()=>folderBanner.status().friendFailure??null,
    getNewsBannerFailure:()=>folderBanner.status().newsFailure??null,
    // Idle-only native translation sample. Reactive +0x90 motion is not yet hosted.
    drawFolderBannerFrame:(ctx,motion,label)=>folderBanner.drawFrame(ctx,{visible:motion.visible,scale:reduced?1:motion.scale,yawRadians:reduced?0:motion.yawRadians,skeletalFrame:reduced?0:motion.skeletal.frame,materialFrame:reduced?0:motion.material.frame,nativeDisplacementY:0,offsetX:0,offsetY:0},label),
    drawDefaultBannerFrame:(ctx,motion)=>folderBanner.drawDefaultFrame(ctx,{visible:motion.visible,scale:reduced?1:motion.scale,yawRadians:reduced?0:motion.yawRadians,skeletalFrame:reduced?0:motion.skeletal.frame,materialFrame:reduced?0:motion.material.frame,nativeDisplacementY:0,offsetX:0,offsetY:0}),
    drawSettingsBannerFrame:(ctx,motion)=>{const phase=settingsBannerPhase(motion,reduced,verificationBannerFrame,verificationBannerSkeletalFrame);return folderBanner.drawSettingsFrame(ctx,{visible:motion.visible,scale:reduced?1:motion.scale,yawRadians:phase.yawRadians,skeletalFrame:phase.skeletalFrame,materialFrame:0,nativeDisplacementY:0,offsetX:0,offsetY:0});},
    drawFriendBannerFrame:(ctx,motion,label)=>folderBanner.drawFriendFrame(ctx,{visible:motion.visible,scale:reduced?1:motion.scale,yawRadians:reduced?0:motion.yawRadians,skeletalFrame:reduced?0:motion.skeletal.frame,materialFrame:reduced?0:motion.material.frame,nativeDisplacementY:0,offsetX:0,offsetY:0},label),
    drawNewsBannerFrame:(ctx,motion,label)=>folderBanner.drawNewsFrame(ctx,{visible:motion.visible,scale:reduced?1:motion.scale,yawRadians:reduced?0:motion.yawRadians,skeletalFrame:reduced?0:motion.skeletal.frame,materialFrame:reduced?0:motion.material.frame,nativeDisplacementY:0,offsetX:0,offsetY:0},label),
    drawMemoBanner:(ctx,time,isReduced,label)=>folderBanner.drawMemoFrame(ctx,time,isReduced,label),
    drawWebBanner:(ctx,time,isReduced,label)=>folderBanner.drawWebFrame(ctx,time,isReduced,label),
    drawMiiverseBanner:(ctx,time,isReduced,label)=>folderBanner.drawMiiverseFrame(ctx,time,isReduced,label),
    drawStockTitleBannerFrame:(ctx,motion,ticket,kind)=>folderBanner.drawStockTitleFrame(ctx,{visible:motion.visible,scale:reduced?1:motion.scale,yawRadians:reduced?0:motion.yawRadians,skeletalFrame:kind==='health'&&verificationHealthBannerFrame!==undefined?verificationHealthBannerFrame:reduced?0:motion.skeletal.frame,materialFrame:reduced?0:motion.material.frame,nativeDisplacementY:0,offsetX:0,offsetY:0},{...ticket,kind}),
    drawHomeBackground:(ctx,_time,isReduced,frame)=>{
      if(frame!==undefined)return folderBanner.drawBackgroundFrame(ctx,frame);
      const sampled=getHomeBannerHostBackgroundFrame(bannerHost);
      return folderBanner.drawBackgroundLifecycleFrame(ctx,isReduced
        ? {...sampled,sceneInFrame:20,loopFrame:0}
        : sampled);
    },runtimeNotice:()=>runtimeNotice});
  await Promise.all([screens.ready,folderBanner.ready]);
  if(diagnostics)host.dataset.banner=JSON.stringify(folderBanner.status());
  host.dataset.firmware=firmwareAssets?'native-home':'fallback';
  const audio=createMenuAudio();screens.paint(state);
  const accessible=document.createElement('section');accessible.className='sr-only';accessible.setAttribute('aria-label','Console controls');host.appendChild(accessible);
  const announcement=document.createElement('p');announcement.setAttribute('aria-live','polite');accessible.appendChild(announcement);
  const addControl=(title:string,action:()=>void)=>{const button=document.createElement('button');button.textContent=title;button.addEventListener('click',action);button.addEventListener('keydown',event=>event.stopPropagation());accessible.appendChild(button);return button;};
  for(const [title,input]of [['Up','up'],['Down','down'],['Left','left'],['Right','right'],['A: Open or visit','open'],['B: Back','back'],['HOME: Suspend or resume','home'],['Power','power'],['Sound and layout','preferences']] as [string,Input][])addControl(title,()=>send(input));
  for(const app of homeTitles)addControl(`Open ${app.title}`,()=>{if(state.system?.phase==='home')commit((current,now)=>launchHomeShortcut(current,app.id,now),'open',true);});
  for(const id of ['game-notes','friends','notifications','browser','miiverse'])addControl(`Open ${getTitle(id)!.title}`,()=>{if(state.system?.phase==='home')commit((current,now)=>invokeSystemApplet(current,id,now),'open',true);});
  let announced='';
  const topTexture=new THREE.CanvasTexture(screens.top),bottomTexture=new THREE.CanvasTexture(screens.bottom);
  for(const tx of [topTexture,bottomTexture]){tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.magFilter=THREE.NearestFilter;tx.generateMipmaps=false;tx.anisotropy=renderer.capabilities.getMaxAnisotropy();}
  // All locations below are the same millimetre coordinates as the Blender file.
  // Screen planes have dedicated UVs, separate from the shell's paint unwrap.
  // Keep LCD artwork self-lit while the dark front surface catches restrained
  // glass reflections, including when the backlight is off.
  const displayMaterial=(texture:THREE.Texture,roughness:number)=>new THREE.MeshPhysicalMaterial({
    color:0x080b0e,metalness:0,roughness,ior:1.46,specularIntensity:.35,envMapIntensity:.65,
    emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.97,toneMapped:false,
    // The live panel is only .02 mm ahead of the source glass. Bias raster depth
    // so that precision at oblique views cannot make the two surfaces flicker.
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,
  });
  const topMat=displayMaterial(topTexture,.18);
  const bottomMat=displayMaterial(bottomTexture,.26);
  function addDisplay(name:string,placement:ScreenPlacement,material:THREE.Material){
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(placement.widthMm,placement.heightMm),material);
    screen.name=name;screen.position.copy(placement.position);screen.quaternion.copy(placement.quaternion);placement.parent.add(screen);return screen;
  }
  const topScreen=addDisplay('Display_Top',layout.screens.top,topMat);
  const touchScreen=addDisplay('Display_Touch',layout.screens.bottom,bottomMat);
  const fitConsole=createConsoleFraming(model,camera);
  let surfaceDisposed=false;
  const surfaceTextures=new Set<THREE.Texture>();
  const removeSurfaceHooks:(()=>void)[]=[];
  const silverMaterials=new Set<THREE.MeshStandardMaterial>();
  const sourceMaterials=new Map<THREE.MeshStandardMaterial,string>();
  model.traverse(o=>{if(o instanceof THREE.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material]){
    if(!(material instanceof THREE.MeshStandardMaterial))continue;
    if(isSilverPaintMaterial(material))silverMaterials.add(material);
    if(material.userData.console_material_role==='sourced-body'&&typeof material.userData.console_paint_mask==='string')sourceMaterials.set(material,material.userData.console_paint_mask);
  }});
  const sourceIndicatorIntensity=new Map([...sourceMaterials.keys()].map(material=>[material,material.emissiveIntensity]));
  const hasPaintSurface=Boolean(silverMaterials.size+sourceMaterials.size);
  host.dataset.vgpu=hasPaintSurface?(quality.useVgpu?'scheduled':'baked-quality-fallback'):'not-applicable';
  const initializeSurface=()=>import('./silver-surface').then(({createSilverSurface})=>createSilverSurface(quality.surfaceSize)).then(async texture=>{
    if(surfaceDisposed){texture?.dispose();return;}
    if(!texture){host.dataset.vgpu='webgl-fallback';return;}
    surfaceTextures.add(texture);
    const masks=new Map<string,THREE.Texture>();
    await Promise.all([...new Set(sourceMaterials.values())].map(async url=>{
      const mask=await new THREE.TextureLoader().loadAsync(url);
      if(surfaceDisposed){mask.dispose();return;}
      mask.flipY=false;mask.colorSpace=THREE.NoColorSpace;mask.wrapS=mask.wrapT=THREE.RepeatWrapping;mask.needsUpdate=true;
      surfaceTextures.add(mask);masks.set(url,mask);
    }));
    if(surfaceDisposed)return;
    for(const material of silverMaterials){material.roughnessMap=texture;material.roughness=1;material.needsUpdate=true;}
    for(const [material,url] of sourceMaterials)removeSurfaceHooks.push(installSourcePaintSurface(material,texture,masks.get(url)!));
    host.dataset.vgpu='ready';schedule.invalidate();
  }).catch(e=>{if(surfaceDisposed)return;host.dataset.vgpu='webgl-fallback';console.warn('VGPU surface unavailable; using the baked Blender surface.',e);});
  let surfaceSchedule:number|undefined;
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');let reduced=motionPreference.matches;
  const schedule=createRenderSchedule();
  let started=false;
  let frame=0,disposed=false,last=performance.now(),lastRender=0,lastScreenPaint=0,intro=!reduced,angle=reduced?MAX_LID_DEGREES:0,targetAngle=MAX_LID_DEGREES,yaw=reduced?REST_YAW:sampleIntroPose(0).yaw,targetYaw=REST_YAW,pitch=0,targetPitch=0,scale=1,targetScale=1,lastMinute=-1;
  let start=last;
  let homeClockSuspended=document.hidden;
  const touches=new Map<number,{x:number;y:number}>();let pinchDistance=0,pinchZoom=1,viewZoom=1;
  let drag:{x:number;y:number;startX:number;startY:number;moved:boolean;pointerId:number;control?:THREE.Object3D;command?:AppCommand;pad?:DirectionalControlName;padOrigin?:THREE.Vector3;padDirection?:ControlDirection;screen?:boolean;touch?:{x:number;y:number}}|null=null;
  type PressedCap={parts:{object:THREE.Object3D;y:number}[];motion:ButtonMotion};
  const pressed=new Map<THREE.Object3D,PressedCap>();
  let lastPress:{name:string;maxTravelMm:number}|undefined;
  const caps=new Map<string,THREE.Object3D>();
  const capParts=new Map<THREE.Object3D,{object:THREE.Object3D;y:number}[]>();
  model.updateMatrixWorld(true);
  for(const [name,control] of layout.controls)caps.set(name,control.object);
  for(const [name,cap]of caps){
    const parts=[{object:cap,y:cap.position.y}];
    const capBounds=new THREE.Box3().setFromObject(cap).expandByScalar(.005);
    // Printed meshes may be siblings of their cap after glTF export. The spatial
    // check excludes nearby deck labels such as POWER, which must remain still.
    model.traverse(o=>{
      if(o===cap||o.parent!==cap.parent||controlName(o)!==name)return;
      const center=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      if(center.x>=capBounds.min.x&&center.x<=capBounds.max.x&&center.z>=capBounds.min.z&&center.z<=capBounds.max.z)parts.push({object:o,y:o.position.y});
    });capParts.set(cap,parts);
  }
  const directional=new Map<DirectionalControlName,{motion:DirectionalMotion;rig:ReturnType<typeof createDirectionalRig>;surfaceY:number}>();
  for(const name of ['DPAD','CIRCLE'] as const){
    const control=layout.controls.get(name);
    if(control){
      const surfaceY=controlBoundsInBase(layout.base,control.object).max.y;
      directional.set(name,{motion:new DirectionalMotion(),surfaceY,rig:createDirectionalRig(layout.base,control.centerInBase,capParts.get(control.object)!.map(part=>part.object))});
    }
  }
  function setPad(name:DirectionalControlName,vector:PadVector,source:string){
    directional.get(name)?.motion.press(source,vector,performance.now());
    host.dataset.lastPadInput=JSON.stringify({name,...vector});
  }
  function pointerPad(name:DirectionalControlName,event:PointerEvent){
    const control=layout.controls.get(name)!;
    const rect=host.getBoundingClientRect();
    mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
    const point=layout.base.localToWorld(new THREE.Vector3(control.centerInBase.x,directional.get(name)!.surfaceY,control.centerInBase.z));
    const normal=new THREE.Vector3(0,1,0).transformDirection(layout.base.matrixWorld);
    const projected=ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(normal,point),new THREE.Vector3());
    if(!projected)return;
    const local=layout.base.worldToLocal(projected).sub(control.centerInBase);
    if(name==='CIRCLE'&&drag){
      drag.padOrigin??=local.clone();
      local.sub(drag.padOrigin);
    }
    const vector=clampPad({x:local.x/6,y:local.z/6});
    const direction=padDirection(vector);
    setPad(name,name==='DPAD'&&direction?DIRECTION_VECTOR[direction]:vector,'pointer');
    if(name==='CIRCLE')dispatch({type:'analog',x:vector.x,y:vector.y,source:'pointer:CIRCLE'},true);
    else if(drag&&direction!==drag.padDirection){
      if(drag.padDirection)button(drag.padDirection,'up','pointer:DPAD',true);
      if(direction)button(direction,'down','pointer:DPAD',true);
    }
    if(drag)drag.padDirection=direction;
  }
  let lastInput='none';
  function cursorDiagnostic(){const controls=state.system!.homeControls;return {...state.system!.homeCursorLoop,visibleSlot:getHomeCursorSlot(state),selectedSlot:state.opened?state.folderSelected:state.selected,sampledFrame:getHomeCursorLoopFrame(state,reduced),...(controls?{primary:controls.primary,presentation:controls.presentation,producer:controls.producer,tileTouch:controls.tileTouch,tilePoses:controls.tilePoses,tileCandidate:controls.tileCandidate,tilePickup:controls.tilePickup,focus:state.system!.homeNavigation.focus,mode3:state.system!.homeNavigation.mode3,mode:controls.tilePickup?14:state.system!.homeNavigation.motion?.mode??0}: {})};}
  const writeState=()=>{
    if(diagnostics){host.dataset.homeCursor=JSON.stringify(cursorDiagnostic());host.dataset.nativeScreen=screens.stockStatus(state);host.dataset.nativeScreenFailure=String(screens.stockFailure()??'');}
    const s=state.system!;if(diagnostics){host.dataset.applicationClose=JSON.stringify(s.homeApplicationTransition);host.dataset.folderBanner=JSON.stringify({...getHomeBannerHostView(bannerHost),background:getHomeBannerHostBackgroundFrame(bannerHost)});host.dataset.homeUpdates=String(s.homeClock.updateCount);host.dataset.folderClose=JSON.stringify(sampleSystemHomeFolderClose(state));host.dataset.folderBannerFallback=String(!nativePrimaryAvailable(resolveHomeBannerHostSelection(state)));}const entry=currentEntry(state),appView=getActiveAppView(state);const nativeStatus=screens.stockStatus(state);const portfolioForeground=getApp(s.app)&&(!appView||appView.appId===s.app);const description=s.sleeping?'Sleep Mode. Open the lid to resume.':s.dialog?'Close software? A to close'+(s.dialog==='switch'?' and open the selected software.':'.')+' B to cancel.':nativeStatus==='error'?'Website display unavailable. A to retry. B or HOME to return to HOME Menu.':nativeStatus==='loading'?'Loading software screen. B or HOME to return to HOME Menu.':s.phase==='app'?(portfolioForeground?`${getApp(s.app)?.title}. ${entry?.title??''}. ${s.detail?entry?.pages[s.page]??'':entry?.subtitle??''}`:[appView?.heading,appView?.subheading,appView?.rows[appView.selection]?.label,...(appView?.text??[])].filter(Boolean).join('. ')):s.phase==='home'?`HOME Menu. ${selectedTitle(state)?.title??'Empty slot'}.${s.app?' Software suspended.':''}`:s.phase==='power'?'Power options. A to power off. B or HOME to return to HOME Menu.':s.phase==='off'?'Powered off. Press Power to turn on.':s.phase==='boot'?'Powering on.':s.phase==='shutdown'?'Powering off.':s.phase==='launch'?'Opening software.':s.phase; if(description!==announced){announced=description;announcement.textContent=description;}
    host.dataset.audio=JSON.stringify(audio.status());host.dataset.preferences=String(state.system?.preferences??false);host.dataset.photo=String(state.system?.photo??0);host.dataset.page=String(state.system?.page??0);host.dataset.muted=String(state.system?.muted??false);host.dataset.ready='true';host.dataset.menu=state.panel??(state.system?.phase==='home'?(state.opened?'folder':'home'):state.system?.phase??'home');host.dataset.app=state.system?.app??'';host.dataset.item=String(state.system?.item??0);host.dataset.detail=String(state.system?.detail??false);host.dataset.sleeping=String(state.system?.sleeping??false);host.dataset.dialog=state.system?.dialog??'';host.dataset.rows=String(rowCount(state));host.dataset.theme=state.theme;host.dataset.selected=String(state.selected);host.dataset.powered=String(state.powered);host.dataset.lastInput=lastInput;
  };
  function updateAudio(){const system=state.system!;audio.update({home:system.phase==='home',powered:state.powered,sleeping:system.sleeping,muted:system.muted,volume:system.volume,homeUpdates:system.homeClock.updateCount,elapsedMs:performance.now()-start});}
  let lastBootPaintFrame:number|null=null,lastBootPresentedFrame:number|null=null;
  function recordScreenPaint(elapsedMs:number){
    const system=state.system!;lastBootPaintFrame=system.phase==='boot'?bootRevealFrame(elapsedMs-system.since,reduced):null;
    if(diagnostics){const close=sampleSystemHomeFolderClose(state);host.dataset.screenPaint=JSON.stringify({at:performance.now(),phase:system.phase,phaseElapsedMs:elapsedMs-system.since,bootRevealFrame:lastBootPaintFrame,homeUpdates:system.homeClock.updateCount,cursor:cursorDiagnostic(),applicationClose:system.homeApplicationTransition,closePhase:close?.controller.phase??null,closeFrame:close?.controller.folder.appliedFrame??null});}
  }
  function paint(){updateAudio();for(const o of powerLeds){const m=o.material as THREE.MeshStandardMaterial;m.emissive.set(state.powered?0x0060ff:0x000000);m.emissiveIntensity=state.powered?2:0;m.color.set(state.powered?0x0055bb:0x151c1d);}for(const [material,intensity] of sourceIndicatorIntensity)material.emissiveIntensity=state.powered?intensity:0;paintScreens(performance.now(),true);topMat.emissiveIntensity=bottomMat.emissiveIntensity=state.powered?state.brightness*(state.powerSaving ? .85 : 1)*.97:0;writeState();}
  // State-driven paints (input, saves, minute) reuse the cadence's HOME background
  // sample instead of a synchronous GPU readback in the event handler, and leave
  // the cadence clock alone, so the background is sampled on the same LCD
  // cadence as without input.
  function paintScreens(now:number,stateDriven=false){if(!stateDriven)lastScreenPaint=now;screens.paint(state,new Date(),now-start,stateDriven?{reuseHomeBackgroundMs:1000/quality.screenFps}:undefined);recordScreenPaint(now-start);topTexture.needsUpdate=true;bottomTexture.needsUpdate=true;schedule.invalidate();}
  const soundNames=new Set<string>(['select','open','back','home','power','touch','grab','drop','folder-open','folder-close','scroll-invalid','toolbar-select']);
  function observeFolderBanner(clock=bannerClock(),selection?:HomeBannerHostSelection){
    const system=state.system!,switchPresentation=isHomeSwitchPresentationActive(state),inhibited=!state.powered||system.phase!=='home'||system.sleeping||!!system.dialog&&!switchPresentation||system.preferences||!!state.panel||homeClockSuspended;
    const inputs={managerInhibited:inhibited,sceneInhibited:inhibited,loadInhibited:false,nativeWorkerReady:true,resourceReady:bannerHost.inputs.resourceReady};
    bannerHost=crossHomeBannerBoundary(bannerHost,clock,{selection:selection??(switchPresentation?{kind:'app',id:system.pending!}:system.homeControls?undefined:resolveHomeBannerHostSelection(state)),inputs});
    let view=getHomeBannerHostView(bannerHost);bannerLabelFailure=false;
    // Retain both outgoing and incoming requests until the manager retires
    // the old primary. Each title has its own resource owner and ticket.
    const stockTickets: StockTitleBannerTicket[]=[];
    if(view.status!=='unsupported'&&view.selection.kind==='app'&&view.resourceTicket){
      const kind=homeTitleBannerKind(view.selection.id);if(kind)stockTickets.push({...view.resourceTicket,kind});
    }
    if(view.status==='active'&&view.primary.selection.kind==='app'){
      const kind=homeTitleBannerKind(view.primary.selection.id);if(kind)stockTickets.push({generation:view.primary.generation,requestEpoch:view.primary.requestEpoch,kind});
    }
    void folderBanner.syncStockTitles(stockTickets);
    if(view.status!=='unsupported'){
      const status=folderBanner.status(),selection=view.selection;
      const label=selection.kind==='folder'?screens.prepareFolderBannerLabel(selection.label):undefined;
      bannerLabelFailure=selection.kind==='folder'&&!label;
      const ready=selection.kind==='folder'?status.ready&&!status.failure&&!!label:selection.kind==='default'?status.defaultReady&&!status.defaultFailure:selection.kind==='toolbar'?selection.focus===2?status.friendReady&&!status.friendFailure:status.newsReady&&!status.newsFailure:selection.kind==='app'&&selection.id==='system-settings'?status.settingsReady&&!status.settingsFailure:selection.kind==='app'&&homeTitleBannerKind(selection.id)&&view.resourceTicket?folderBanner.stockTitleStatus({...view.resourceTicket,kind:homeTitleBannerKind(selection.id)!}).ready:false;
      const resourceReady=ready?view.resourceTicket:null;
      bannerHost=crossHomeBannerBoundary(bannerHost,clock,{inputs:{...inputs,resourceReady}});
      view=getHomeBannerHostView(bannerHost);
      if(view.status==='active'&&view.stage==='active'&&view.selection.kind==='folder'&&view.primary.selection.kind==='folder'&&view.selection.key===view.primary.selection.key&&view.selection.nativeType===view.primary.selection.nativeType&&view.selection.label!==view.primary.selection.label&&screens.prepareFolderBannerLabel(view.selection.label)){
        bannerHost=crossHomeBannerBoundary(bannerHost,clock,{refreshActiveLabel:{generation:view.primary.generation,activationEpoch:view.primary.activationEpoch,key:view.selection.key,label:view.selection.label}});
      }
    }
  }
  function advanceBeforeMutation(now:number){
    const previous=state;
    const closeNeedsReadyScreen=applicationCloseNeedsReadyScreen(state.system!.homeApplicationTransition,screens.stockStatus(state));
    if(homeClockSuspended||closeNeedsReadyScreen){const system=state.system!;if(system.homeClock.lastNow!==null||system.homeClock.remainderMs!==0)state={...state,system:{...system,homeClock:{...system.homeClock,lastNow:null,remainderMs:0}}};}
    else {
      const advanced=tickHomeNavigationClockObserved(state,now,reduced);
      for(const pass of advanced.passes){
        state=pass.state;
        let beforeManager:HomeBannerHostSelection|undefined,afterManager:HomeBannerHostSelection|undefined;
        for(const entry of pass.observations)if(entry.observation.kind==='banner-resolve'){
          const selection=resolveHomeBannerHostObservation(pass.state,entry.observation);
          if(entry.phase==='input')beforeManager=selection;else afterManager=selection;
        }
        bannerHost=pass.completed?stepHomeBannerHost(bannerHost,bannerClock(),{
          beforeManager:beforeManager?{selection:beforeManager}:undefined,
          afterManager:afterManager?{selection:afterManager}:undefined,
        }):skipHomeBannerHostPass(bannerHost,bannerClock());
        // A lower request's resource ticket is acknowledged after this pass;
        // it cannot retroactively make the preceding upper manager eligible.
        observeFolderBanner();
        for(const entry of pass.observations)if(entry.observation.kind==='cue'){
          const name=entry.observation.cue==='selection'?'select':entry.observation.cue==='invalid'?'scroll-invalid':'toolbar-select';
          audio.play(name,state.system!.muted,state.system!.volume);
        }
        for(const sound of pass.sounds)audio.play(sound,state.system!.muted,state.system!.volume);
      }
      state=advanced.state;
    }
    const readyAt=getHomeBannerCloseReadyUpdate(previous,state);
    if(!state.system!.homeControls&&readyAt!==null)observeFolderBanner({...bannerClock(),updateCount:readyAt});
    bannerHost=crossHomeBannerBoundary(bannerHost,bannerClock());
  }
  const effects=createRuntimeEffects({getState:()=>state,setState:next=>{state=next;observeFolderBanner();},now:()=>performance.now()-start,beforeMutation:advanceBeforeMutation,storage,
    onChange:()=>{if(!disposed)paint();},
    onFailure:error=>{runtimeNotice='Your changes could not be saved locally.';host.dataset.storageFailure=String(error);if(!disposed)paint();},
    onSound:name=>{if(soundNames.has(name))audio.play(name as Sound,state.system!.muted,state.system!.volume);},
    onLink:url=>{window.open(url,'_blank','noopener,noreferrer');},
  });
  function reducedBannerKey(){const view=getHomeBannerHostView(bannerHost);return view.status==='active'?JSON.stringify([view.status,view.primary.generation,view.primary.activationEpoch,view.primary.selection.kind,view.primary.selection.kind==='folder'?view.primary.selection.label:null,view.primary.motion.visible]):view.status;}
  const nativeScreenInput=createNativeScreenInputGate();
  function commit(reduce:(current:MenuState,now:number)=>MenuState,input:string,userGesture=false,now=performance.now()-start){
    const previous=state,previousBanner=reduced?reducedBannerKey():undefined;
    const allowInput=applicationCloseAllowsInput(previous.system!.homeApplicationTransition,input,screens.stockStatus(previous));
    advanceBeforeMutation(now);const readiness=screens.stockStatus(state);if(readiness==='loading'||readiness==='error')nativeScreenInput.cancelHeld(state.system!.input);state=releaseUnreadyNativeInput(state,readiness,now);const beforeAction=state;state=reconcileHomeControls(beforeAction,allowInput?reduce(state,now):state);
    const close=sampleSystemHomeFolderClose(state),previousClose=sampleSystemHomeFolderClose(beforeAction);
    observeFolderBanner(bannerClock(),close&&close.controller.phase!=='complete'&&close.controller.identity.transitionId!==previousClose?.controller.identity.transitionId?{kind:'clear'}:undefined);
    const before=previous.system!,after=state.system!;
    const resumedApplicationClose=previous.system!.sleeping&&!after.sleeping||input==='visibility'&&!document.hidden;
    const mustPaintApplicationClose=applicationCloseNeedsPaint(before.homeApplicationTransition,after.homeApplicationTransition,reduced,resumedApplicationClose);
    if(state===previous){
      if(mustPaintApplicationClose){paint();if(started&&!document.hidden&&!after.sleeping)renderFrame();}
      return;
    }
    lastInput=input;updateAudio();
    const sound=getMenuActionSound(beforeAction,state,input);
    if(sound&&!after.runtime.effects.some(item=>item.effect.type==='sound'))audio.play(sound,after.muted,after.volume);
    effects.drain(userGesture);
    // Ordinary clock updates keep the quality cadence; terminal close pairs must publish.
    const reducedChanged=reduced&&(previousBanner!==reducedBannerKey()||before.homeNavigation!==after.homeNavigation
      ||before.homeControls?.tilePoses!==after.homeControls?.tilePoses||before.homeControls?.tilePickup!==after.homeControls?.tilePickup);
    if(input!=='tick'||mustPaintApplicationClose||reducedChanged||before.phase!==after.phase||previous.powered!==state.powered||previous.panel!==state.panel)paint();else writeState();
    // Upload the terminal pair now, before another update can retire its owner.
    // Offscreen painting alone cannot cross the outer 30/45fps render gate.
    if(mustPaintApplicationClose&&started&&!document.hidden&&!after.sleeping)renderFrame();
  }
  function dispatch(event:AppEvent,userGesture=false){if(userGesture)void audio.unlock();const label=event.type==='button'||event.type==='command'?event.command:event.type;commit((current,now)=>{
    const decision=nativeScreenInput(event,screens.stockStatus(current));
    if(decision==='home')return escapeUnreadyNativeScreen(current,now);
    if(decision==='retry'){screens.retryStockScreen();return releaseSystemInputs(current,now);}
    return decision==='pass'?dispatchSystemEvent(current,event,now):current;
  },label,userGesture);}
  function button(command:AppCommand,phase:'down'|'up',source:string,userGesture=false){dispatch({type:'button',command,phase,source},userGesture);}
  function send(input:Input){void audio.unlock();if(['left','right','up','down','open','back','home','power','x','y','start','select','l','r'].includes(input)){button(input as AppCommand,'down',`accessible:${input}`,true);button(input as AppCommand,'up',`accessible:${input}`,true);}else commit((current,now)=>reduceSystem(current,input,now),input,true);}
  function press(name:string,source?:string){
    if(name==='DPAD'||name==='CIRCLE')return;
    const cap=caps.get(name);if(!cap)return;
    let feedback=pressed.get(cap);
    if(!feedback){const control=[...layout.controls.values()].find(value=>value.object===cap);feedback={parts:capParts.get(cap)!,motion:new ButtonMotion(buttonTravel(name,control?.pressTravelMm??.25))};pressed.set(cap,feedback);}
    feedback.motion.press(performance.now(),source);
    lastPress={name:cap.name,maxTravelMm:0};
  }
  function release(source:string){for(const feedback of pressed.values())feedback.motion.release(source);for(const pad of directional.values())pad.motion.release(source);}
  function releaseAll(){for(const feedback of pressed.values())feedback.motion.cancel();for(const pad of directional.values())pad.motion.cancel();}
  function hit(event:PointerEvent){
    const rect=host.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
    // Raycaster includes invisible meshes. Baked screen artwork and displays
    // hidden while closed must not intercept the visible controls beneath them.
    return ray.intersectObject(model,true).find(hit=>{for(let node:THREE.Object3D|null=hit.object;node;node=node.parent)if(!node.visible)return false;return true;});
  }
  function controlName(o:THREE.Object3D){
    const physical=controlFromObject(layout,o);if(physical)return physical;
    const name=o.name.replace(/[\s_.-]+/g,'').toUpperCase();
    if(name.startsWith('BUTTON'))return name.slice(6);
    if(/^[ABXY]PRINT/.test(name))return name[0];
    if(name.startsWith('HOME'))return 'HOME';
    if(name.startsWith('SELECT'))return 'SELECT';
    if(name.startsWith('START'))return 'START';
    if(name.startsWith('POWER'))return 'POWER';
    if(name.startsWith('DPADDIRECTIONMARK'))return 'DPAD';
    if(/^[LR]SHOULDERPRINT/.test(name))return name[0];
    return '';
  }
  function interruptIntro(){
    if(!intro)return;
    intro=false;targetYaw=yaw;targetPitch=pitch;
    // Keep the current pose as the interaction origin; finish opening gently.
    targetAngle=MAX_LID_DEGREES;
  }
  function toggleLid(open=false){
    const interrupted=intro;interruptIntro();
    targetAngle=open?MAX_LID_DEGREES:(interrupted?angle:targetAngle)>70?0:MAX_LID_DEGREES;
    if(targetAngle===0){pointerCancel();releaseAll();}
    commit((current,now)=>setSystemSleeping(current,targetAngle===0,now),'hinge');
  }
  const controlCommands:Record<string,AppCommand>={A:'open',B:'back',X:'x',Y:'y',HOME:'home',START:'start',SELECT:'select',POWER:'power',L:'l',R:'r'};
  function touchPosition(e:PointerEvent){
    const rect=host.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);
    const origin=touchScreen.getWorldPosition(new THREE.Vector3()),normal=new THREE.Vector3(0,0,1).transformDirection(touchScreen.matrixWorld);
    const point=ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(normal,origin),new THREE.Vector3());if(!point)return;
    const local=touchScreen.worldToLocal(point);return{x:(local.x/layout.screens.bottom.widthMm+.5)*320,y:(.5-local.y/layout.screens.bottom.heightMm)*240};
  }
  function pointerDown(e:PointerEvent){
    if(e.pointerType==='touch'){
      touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(touches.size===2){const [a,b]=[...touches.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);pinchZoom=viewZoom;pointerCancel();host.setPointerCapture(e.pointerId);return;}
    }
    if(!e.isPrimary||e.button!==0||drag)return;
    void audio.unlock();host.focus({preventScroll:true});host.setPointerCapture(e.pointerId);interruptIntro();
    const h=hit(e);drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,pointerId:e.pointerId,control:h?.object,screen:angle>90&&h?.object===touchScreen};
    if(drag.screen&&h?.uv){drag.touch={x:h.uv.x*320,y:(1-h.uv.y)*240};dispatch({type:'touch',phase:'down',...drag.touch,pointerId:e.pointerId},true);return;}
    if(h&&angle>90){const name=controlName(h.object);if(name==='DPAD'||name==='CIRCLE'){drag.pad=name;pointerPad(name,e);}else{press(name,'pointer');drag.command=controlCommands[name];if(drag.command)button(drag.command,'down',`pointer:${e.pointerId}`,true);}}
  }
  function pointerMove(e:PointerEvent){
    if(touches.has(e.pointerId))touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(touches.size===2&&pinchDistance>0){const [a,b]=[...touches.values()];viewZoom=THREE.MathUtils.clamp(pinchZoom*Math.hypot(a.x-b.x,a.y-b.y)/pinchDistance,1,3);return;}
    if(!drag){const h=hit(e);host.style.cursor=h?(controlName(h.object)||h.object===touchScreen?'pointer':'grab'):'default';return;}
    if(e.pointerId!==drag.pointerId)return;
    if(drag.pad){pointerPad(drag.pad,e);return;}
    if(drag.screen){const point=touchPosition(e);if(point){drag.touch=point;dispatch({type:'touch',phase:'move',...point,pointerId:e.pointerId},true);}return;}
    if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5){drag.moved=true;targetYaw=yaw;targetPitch=pitch;release('pointer');if(drag.command){button(drag.command,'up',`pointer:${e.pointerId}`);drag.command=undefined;}}
    if(drag.moved){targetYaw+=(e.clientX-drag.x)*.007;targetPitch=THREE.MathUtils.clamp(targetPitch+(e.clientY-drag.y)*.003,-1.65,1.3);host.style.cursor='grabbing';}
    drag.x=e.clientX;drag.y=e.clientY;
  }
  function endPointer(was:NonNullable<typeof drag>,cancelled:boolean,e?:PointerEvent){
    if(was.screen&&was.touch){const point=e?touchPosition(e)??was.touch:was.touch;const inside=point.x>=0&&point.x<320&&point.y>=0&&point.y<240;dispatch({type:'touch',phase:cancelled||!inside?'cancel':'up',...point,pointerId:was.pointerId},!cancelled);}
    if(was.command)button(was.command,'up',`pointer:${was.pointerId}`,!cancelled);
    if(was.pad==='CIRCLE')dispatch({type:'analog',x:0,y:0,source:'pointer:CIRCLE'});
    if(was.pad==='DPAD'&&was.padDirection)button(was.padDirection,'up','pointer:DPAD');
    release('pointer');
  }
  function pointerUp(e:PointerEvent){
    const wasPinching=pinchDistance>0;touches.delete(e.pointerId);
    if(wasPinching){if(touches.size===0)pinchDistance=0;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);return;}
    if(!drag||e.pointerId!==drag.pointerId)return;const was=drag;drag=null;endPointer(was,false,e);if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);host.style.cursor='grab';
    if(was.screen||was.moved||was.pad||was.command)return;
    const h=hit(e);if(!h)return;if(angle<90){toggleLid(true);return;}
    if(!controlName(h.object)&&(h.object.parent===hinge||h.object.name.includes('Hinge')))toggleLid();
  }
  function pointerCancel(){const was=drag;drag=null;if(was){endPointer(was,true);if(host.hasPointerCapture(was.pointerId))host.releasePointerCapture(was.pointerId);}host.style.cursor='grab';}
  function pointerAbort(){touches.clear();pinchDistance=0;pointerCancel();}
  const keyCommands:Record<string,Input>={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'open',a:'open',b:'back',Escape:'back',h:'home',p:'power',x:'x',y:'y',q:'l',e:'r',m:'mute','+':'volume-up','-':'volume-down'};
  const heldKeys=new Map<string,AppCommand>();
  function keydown(e:KeyboardEvent){
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)toggleLid();return;}
    const key=e.key.length===1?e.key.toLowerCase():e.key,action=keyCommands[key];if(!action)return;e.preventDefault();if(angle<=90||e.repeat)return;
    interruptIntro();
    const physical:Record<string,string>={ArrowLeft:'DPAD',ArrowRight:'DPAD',ArrowUp:'DPAD',ArrowDown:'DPAD',Enter:'A',a:'A',b:'B',Escape:'B',h:'HOME',p:'POWER',x:'X',y:'Y',q:'L',e:'R'};
    if(physical[key]==='DPAD')setPad('DPAD',DIRECTION_VECTOR[action as ControlDirection],`key:${e.code}`);else press(physical[key],`key:${e.code}`);
    if(['mute','volume-up','volume-down'].includes(action))send(action);else{heldKeys.set(e.code,action as AppCommand);button(action as AppCommand,'down',`key:${e.code}`,true);}
  }
  function keyup(e:KeyboardEvent){release(`key:${e.code}`);const command=heldKeys.get(e.code);heldKeys.delete(e.code);if(command)button(command,'up',`key:${e.code}`,true);}
  function blur(){touches.clear();pinchDistance=0;pointerCancel();releaseAll();heldKeys.clear();commit((current,now)=>releaseSystemInputs(current,now),'blur');}
  function visibilityChanged(){if(document.hidden){homeClockSuspended=true;blur();observeFolderBanner();}else{homeClockSuspended=false;commit(current=>current,'visibility');}}
  function motionChanged(e:MediaQueryListEvent){advanceBeforeMutation(performance.now()-start);reduced=e.matches;screens.setReducedMotion(reduced);observeFolderBanner();if(reduced){interruptIntro();angle=targetAngle;yaw=targetYaw;pitch=targetPitch;scale=targetScale;}paint();}
  function wheel(e:WheelEvent){e.preventDefault();interruptIntro();viewZoom=THREE.MathUtils.clamp(viewZoom-e.deltaY*.001,1,3);}
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const ratio=pixelRatioForViewport(quality.tier,window.devicePixelRatio,w,h),size=renderer.getSize(new THREE.Vector2());
    if(size.x===w&&size.y===h&&renderer.getPixelRatio()===ratio)return;
    // One allocation for size and ratio; setPixelRatio followed by setSize reallocates twice.
    renderer.setDrawingBufferSize(w,h,ratio);camera.aspect=w/h;camera.fov=2*Math.atan(Math.tan(33*RAD/2)*Math.max(1,1.04/(w/h)))/RAD;camera.updateProjectionMatrix();
    // Resizing clears the drawing buffer after this frame's animation callback.
    // Draw now so a blank canvas is never composited between frames.
    schedule.invalidate();if(started&&!disposed)renderFrame();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  // A restored context has lost the presented frame and every upload.
  const contextRestored=()=>{schedule.invalidate();renderer.shadowMap.needsUpdate=true;};renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
  host.addEventListener('pointerdown',pointerDown);host.addEventListener('pointermove',pointerMove);host.addEventListener('pointerup',pointerUp);host.addEventListener('pointercancel',pointerAbort);host.addEventListener('lostpointercapture',pointerCancel);host.addEventListener('keydown',keydown);host.addEventListener('keyup',keyup);host.addEventListener('blur',blur);host.addEventListener('wheel',wheel,{passive:false});motionPreference.addEventListener('change',motionChanged);document.addEventListener('visibilitychange',visibilityChanged);
  // Enable keyboard play on first load without taking focus from another control.
  if(document.activeElement===document.body)host.focus({preventScroll:true});
  // Every transform the loop animates. An unchanged sample, with no invalidation,
  // would reproduce the previous frame exactly.
  function poseSample(){
    const sample=[angle,yaw,pitch,scale,camera.zoom,camera.aspect];
    for(const pad of directional.values())sample.push(pad.motion.vector.x,pad.motion.vector.y);
    for(const [cap,feedback] of pressed)sample.push(cap.id,feedback.motion.depth);
    return sample;
  }
  let projectedTargetWidth=0,projectedTargetHeight=0;
  function publishProjectedTargets(geometryMoved:boolean){
    if(!diagnostics||intro)return;
    const width=host.clientWidth,height=host.clientHeight;
    if(!geometryMoved&&host.dataset.targets&&width===projectedTargetWidth&&height===projectedTargetHeight)return;
    const targets:Record<string,number[]>={};for(const name of ['Button_A','Button_B','Button_HOME','Button_POWER','Button_Dpad','Display_Touch']){
      const o=model.getObjectByName(name);if(o){const v=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(camera);targets[name]=[(v.x+1)*width/2,(1-v.y)*height/2];}
    }
    for(const name of ['DPAD','CIRCLE'] as const){
      const control=layout.controls.get(name);if(!control)continue;
      for(const [direction,offset]of Object.entries(DIRECTION_VECTOR)){
        const v=layout.base.localToWorld(control.centerInBase.clone().add(new THREE.Vector3(offset.x*6,2,offset.y*6))).project(camera);
        targets[`${name}_${direction}`]=[(v.x+1)*width/2,(1-v.y)*height/2];
      }
    }
    for(const [x,y]of [[59,54],[76,137],[160,137],[20,16],[70,16],[105,16],[145,16],[190,16],[235,16],[277,16],[307,16],[52,76],[136,76],[52,160],[136,160],[50,226],[210,226],[150,65],[70,170],[230,170],[100,110],[100,90],[100,150],[200,180],[160,226]]){
      const v=touchScreen.localToWorld(new THREE.Vector3((x/320-.5)*layout.screens.bottom.widthMm,(.5-y/240)*layout.screens.bottom.heightMm,0)).project(camera);
      targets[`Touch_${x}_${y}`]=[(v.x+1)*width/2,(1-v.y)*height/2];
    }
    host.dataset.targets=JSON.stringify(targets);projectedTargetWidth=width;projectedTargetHeight=height;
  }
  function renderFrame(){
    const sample=poseSample(),plan=schedule.plan(sample);
    if(plan.shadows)renderer.shadowMap.needsUpdate=true;
    scene.updateMatrixWorld(true);fitConsole();camera.updateProjectionMatrix();publishProjectedTargets(plan.shadows);
    renderer.render(scene,camera);frame++;schedule.presented(sample);lastBootPresentedFrame=lastBootPaintFrame;
    if(diagnostics)host.dataset.screenPresented=JSON.stringify({at:performance.now(),frame,paint:JSON.parse(host.dataset.screenPaint??'null')});
  }
  function animate(now:number){
    if(disposed)return;const dt=Math.min((now-last)/1000,.05);last=now;const elapsed=(now-start)/1000;
    if(intro){const pose=sampleIntroPose(elapsed);yaw=pose.yaw;angle=pose.angle;if(pose.done){intro=false;targetYaw=REST_YAW;angle=targetAngle=MAX_LID_DEGREES;prepareAudioWhenIdle();}}
    else{angle=reduced?targetAngle:THREE.MathUtils.damp(angle,targetAngle,6,dt);yaw=reduced?targetYaw:THREE.MathUtils.damp(yaw,targetYaw,drag?.moved?18:7,dt);}
    angle=THREE.MathUtils.clamp(angle,0,MAX_LID_DEGREES);
    if(Math.abs(angle-targetAngle)<.01)angle=targetAngle;
    pitch=reduced?targetPitch:THREE.MathUtils.damp(pitch,targetPitch,drag?.moved?18:7,dt);scale=reduced?targetScale:THREE.MathUtils.damp(scale,targetScale,7,dt);
    hinge.rotation.x=-angle*RAD;pivot.rotation.set(pitch,yaw,0);pivot.scale.setScalar(scale);
    topScreen.visible=touchScreen.visible=angle>12;
    const padPoses:Record<string,unknown>={};
    for(const [name,pad]of directional){
      const vector=pad.motion.step(now,dt,reduced);pad.rig.apply(name,vector);
      padPoses[name]={...vector,rotation:pad.rig.pivot.rotation.toArray().slice(0,3),position:pad.rig.pivot.position.toArray()};
    }
    if(diagnostics)host.dataset.padPoses=JSON.stringify(padPoses);
    for(const [cap,feedback]of pressed){
      const depth=feedback.motion.step(now,dt,reduced);
      if(depth===0){for(const part of feedback.parts)part.object.position.y=part.y;pressed.delete(cap);}
      else for(const part of feedback.parts)part.object.position.y=part.y-depth;
      if(lastPress?.name===cap.name){
        lastPress.maxTravelMm=Math.max(lastPress.maxTravelMm,feedback.parts[0].y-cap.position.y);
        if(diagnostics)host.dataset.lastButtonPress=JSON.stringify(lastPress);
      }
    }
    if(diagnostics)host.dataset.buttonDepths=JSON.stringify(Object.fromEntries([...pressed].map(([cap,feedback])=>[cap.name,Number(feedback.motion.depth.toFixed(3))])));
    const applicationCloseBeforeTick=state.system!.homeApplicationTransition;
    const closeBeforeTick=sampleSystemHomeFolderClose(state),updatesBeforeTick=state.system!.homeClock.updateCount;
    if(!homeClockSuspended)commit((current,time)=>tickSystem(current,time,reduced),'tick',false,now-start);updateAudio();
    const minute=Math.floor(Date.now()/60000);if(minute!==lastMinute){lastMinute=minute;paint();}
    // Native UI motion must be uploaded continuously, independent of input.
    // Include the final restored-root update. Frozen clocks do not boost the
    // cadence, and a high-refresh monitor cannot paint extra close updates.
    const closeAdvanced=(!!applicationCloseBeforeTick||!!closeBeforeTick&&closeBeforeTick.controller.phase!=='complete')&&state.system!.homeClock.updateCount!==updatesBeforeTick;
    const lcdFps=screenPaintFps(quality,closeAdvanced);
    const bootFrame=state.system!.phase==='boot'?bootRevealFrame(now-start-state.system!.since,reduced):null;
    const bootPaintDue=state.powered&&angle>12&&!document.hidden&&!state.system!.sleeping&&bootRevealNeedsPaint(bootFrame,lastBootPaintFrame,reduced);
    if(bootPaintDue||state.powered&&angle>12&&!document.hidden&&(!reduced||state.system?.phase==='app')&&(lcdFps>=60||now-lastScreenPaint>=1000/lcdFps))paintScreens(now);
    if(host.dataset.hinge!==angle.toFixed(1))host.dataset.hinge=angle.toFixed(1);if(host.dataset.intro!==String(intro))host.dataset.intro=String(intro);
    camera.zoom=reduced?viewZoom:THREE.MathUtils.damp(camera.zoom,viewZoom,10,dt);
    const bootPublishDue=state.powered&&angle>12&&!document.hidden&&!state.system!.sleeping&&bootRevealNeedsPaint(lastBootPaintFrame,lastBootPresentedFrame,reduced);
    const renderDue=bootPublishDue||quality.renderFps>=60||now-lastRender>=1000/quality.renderFps;
    const plan=renderDue?schedule.plan(poseSample()):undefined;
    if(plan?.render){
     lastRender=now;if(diagnostics)host.dataset.zoom=camera.zoom.toFixed(2);
     // Publish repeatable browser-QA coordinates from the exact frame being drawn.
     renderFrame();
    }
    request=requestAnimationFrame(animate);
  }
  // Upload the real model and compile its materials before starting the clock.
  // Otherwise a first-frame GPU stall skips the left turn and jumps into opening.
  hinge.rotation.x=-angle*RAD;pivot.rotation.set(pitch,yaw,0);
  topScreen.visible=touchScreen.visible=angle>12;
  scene.updateMatrixWorld(true);
  fitConsole();
  renderer.initTexture(topTexture);renderer.initTexture(bottomTexture);
  // compileAsync skips invisible objects. The LCD planes appear as the lid opens,
  // so compile their programs now rather than stalling the opening.
  topScreen.visible=touchScreen.visible=true;
  await renderer.compileAsync(scene,camera);
  topScreen.visible=touchScreen.visible=angle>12;
  renderFrame();started=true;
  start=last=performance.now();
  // Starting the audio device costs ~70-90 ms on the main thread. Do it after
  // the opening, while idle, rather than inside the first key or pointer event.
  // Playback still begins only from a user gesture (unlock).
  function prepareAudioWhenIdle(){const run=()=>{if(!disposed)audio.prepare();};if(window.requestIdleCallback)window.requestIdleCallback(run,{timeout:2000});else setTimeout(run,0);}
  if(!intro)prepareAudioWhenIdle();
  let request=requestAnimationFrame(animate);writeState();
  if(hasPaintSurface&&quality.useVgpu){
    const idle=window.requestIdleCallback?.bind(window);
    surfaceSchedule=idle?idle(()=>void initializeSurface(),{timeout:3500}):window.setTimeout(()=>void initializeSurface(),3000);
  }
  if(diagnostics){Object.assign(host,{screenCanvases:{top:screens.nativeTop,bottom:screens.bottom},captureNativeBanner(kind:'folder'|'default',frame:PrimaryBannerRenderFrame){
    if(disposed||!['folder','default'].includes(kind)||typeof frame.visible!=='boolean'||(['scale','yawRadians','skeletalFrame','materialFrame','nativeDisplacementY','offsetX','offsetY'] as const).some(key=>!Number.isFinite(frame[key])))throw new Error('Invalid diagnostic banner sample');
    const canvas=document.createElement('canvas');canvas.width=400;canvas.height=240;const ctx=canvas.getContext('2d')!;
    try{
      const view=getHomeBannerHostView(bannerHost),label=view.status==='active'&&view.primary.selection.kind==='folder'?screens.prepareFolderBannerLabel(view.primary.selection.label):undefined;
      const drawn=kind==='default'?folderBanner.drawDefaultFrame(ctx,frame):folderBanner.drawFrame(ctx,frame,label);
      if(!drawn)throw new Error('Native diagnostic banner unavailable');
      return canvas.toDataURL();
    }finally{screens.paint(state,new Date(),performance.now()-start);topTexture.needsUpdate=true;bottomTexture.needsUpdate=true;schedule.invalidate();canvas.width=canvas.height=0;}
  }});}
  let removeLcdDownload=()=>{};
  if(lcdCapture){const captureScreensAt=(elapsedMs:number,isoDate?:string,bannerFrame?:number,hudSample?:unknown,bannerSkeletalFrame?:number,healthHomeFrames?:{healthBannerFrame:number;homeWallpaperFrame:number})=>{
    if(disposed||!Number.isFinite(elapsedMs)||elapsedMs<0)throw new Error('Invalid diagnostic capture time');
    const date=isoDate===undefined?new Date():new Date(isoDate);
    if(!Number.isFinite(date.getTime()))throw new Error('Invalid diagnostic capture date');
    if(bannerSkeletalFrame!==undefined){
      if(!['localhost','127.0.0.1','::1','[::1]'].includes(window.location.hostname)||bannerFrame===undefined)throw new Error('Independent skeletal sampling requires localhost and a banner frame');
    }
    if(bannerFrame!==undefined){
      const view=getHomeBannerHostView(bannerHost);
      if(view.status!=='active'||view.primary.selection.kind!=='app'||view.primary.selection.id!=='system-settings')throw new Error('Settings banner frame sampling requires an active Settings HOME selection');
      settingsBannerPhase(view.primary.motion,reduced,bannerFrame,bannerSkeletalFrame);
    }
    if(healthHomeFrames!==undefined){
      const view=getHomeBannerHostView(bannerHost);
      if(!['localhost','127.0.0.1','::1','[::1]'].includes(window.location.hostname))throw new Error('Health HOME frame sampling requires localhost');
      if(!state.powered||state.system?.phase!=='home'||state.system.sleeping||state.system.dialog||state.panel||state.system.preferences||state.theme!=='white'
        ||view.status!=='active'||view.primary.selection.kind!=='app'||view.primary.selection.id!=='health-safety')throw new Error('Health HOME frame sampling requires active Health HOME selection on the white theme');
    }
    const homeHudSample=hudSample===undefined?undefined:lcdHomeHudSample(hudSample,window.location.hostname);
    if(homeHudSample&&(!firmwareAssets||!state.powered||state.system?.phase!=='home'||state.system.sleeping||state.system.dialog||state.panel||state.system.preferences))throw new Error('HOME HUD sampling requires an active HOME Menu');
    // Sample presentation only. Inputs, software state, effects and the shared
    // runtime clock continue normally; the next paint restores current time.
    verificationBannerFrame=bannerFrame;verificationBannerSkeletalFrame=bannerSkeletalFrame;
    verificationHealthBannerFrame=healthHomeFrames?.healthBannerFrame;
    try{const painted=screens.paint(state,date,elapsedMs,{sampleCalendar:isoDate!==undefined,homeHudSample,...(healthHomeFrames?{homeWallpaperFrame:healthHomeFrames.homeWallpaperFrame}:{})});if(healthHomeFrames&&(!painted?.homeWallpaper||!painted.healthBanner))throw new Error('Health HOME source-frame capture could not render both firmware models');const view=getHomeBannerHostView(bannerHost);return {elapsedMs,date:date.toISOString(),homeHudSample:homeHudSample??null,homeHudSampling:homeHudSample?'verification-source-pose':'live-default',calendarSampling:isoDate===undefined?'live-retained':'verification-settings-local-replay',homeUpdates:state.system!.homeClock.updateCount,homeCursor:cursorDiagnostic(),applicationClose:state.system!.homeApplicationTransition,folderBanner:{...view,background:getHomeBannerHostBackgroundFrame(bannerHost)},bannerSample:healthHomeFrames?{selectedTitle:'health-safety',skeletalFrame:healthHomeFrames.healthBannerFrame,materialFrame:view.status==='active'?view.primary.motion.material.frame:null}:view.status==='active'?settingsBannerPhase(view.primary.motion,reduced,bannerFrame,bannerSkeletalFrame).sample:null,...(healthHomeFrames?{selectedTitle:'health-safety',forcedFrames:{healthBannerSkeletalFrame:healthHomeFrames.healthBannerFrame,homeWallpaperSceneInSkeletalFrame:20,homeWallpaperMaterialFrame:healthHomeFrames.homeWallpaperFrame},synthetic:true}:{synthetic:false}),...encodeNativeLcdPair(screens.nativeTop,screens.bottom)};}
    finally{verificationBannerFrame=undefined;verificationBannerSkeletalFrame=undefined;verificationHealthBannerFrame=undefined;screens.paint(state,new Date(),performance.now()-start);topTexture.needsUpdate=true;bottomTexture.needsUpdate=true;}
  };
    Object.assign(host,{captureScreensAt});
    const captureAbort=new AbortController();
    let downloading=false;
    const download=async()=>{
      if(downloading)return;
      downloading=true;
      try{
        const {elapsedMs,isoDate,scenario,bannerFrame,healthFrame,homeHudSample,bannerSkeletalFrame,healthBannerFrame,homeWallpaperFrame,liveHealthHomeClock}=lcdDownloadRequest(window.location.search,window.location.hostname);
        if(healthFrame!==undefined)host.dataset.lcdCaptureStatus='waiting';
        const capture=healthFrame===undefined?captureScreensAt(liveHealthHomeClock?performance.now()-start:elapsedMs,liveHealthHomeClock?undefined:isoDate,bannerFrame,homeHudSample,bannerSkeletalFrame,healthBannerFrame===undefined?undefined:{healthBannerFrame,homeWallpaperFrame:homeWallpaperFrame!}):await captureAtHealthFrame(healthFrame,{
          signal:captureAbort.signal,
          requestFrame:callback=>requestAnimationFrame(callback),cancelFrame:id=>cancelAnimationFrame(id),
          read:()=>{
            const view=getActiveAppView(state),healthElapsedMs=view?.data?.healthElapsedMs;
            if(disposed||!state.powered||state.system?.phase!=='app'||state.system.sleeping||state.system.dialog||view?.appId!=='health-safety'||screens.stockStatus(state)!=='ready'||typeof healthElapsedMs!=='number')throw new Error('Active Health LCD unavailable');
            return {healthTopLoopFrame:healthTopLoopFrame(healthElapsedMs,reduced),healthElapsedMs,reducedMotion:reduced};
          },
          // Encode both freshly painted LCDs in this same callback. The supplied
          // lcdElapsedMs is intentionally ignored: Health uses its live local clock.
          capture:(sample,timestamp)=>({...captureScreensAt(timestamp-start,isoDate),...sample,requestedHealthFrame:healthFrame}),
        });
        const payload=lcdDownloadPayload(scenario,capture);
        host.dataset.lcdCaptureStatus='saving';
        const response=await fetch('/api/verification/lcd-capture?lcdCapture=1',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,cache:'no-store',credentials:'same-origin'});
        if(!response.ok)throw new Error(`LCD export rejected (${response.status}): ${await response.text()}`);
        const result=await response.json() as {directory:string};
        host.dataset.lcdCapturePath=result.directory;
        host.dataset.lcdCaptureStatus='saved';
        announcement.textContent=`LCD capture saved to ${result.directory}`;
        Reflect.deleteProperty(host.dataset,'lcdCaptureError');
      }catch(error){host.dataset.lcdCaptureStatus='error';host.dataset.lcdCaptureError=String(error);announcement.textContent=`LCD capture failed: ${String(error)}`;}
      finally{downloading=false;}
    };
    addControl('Download LCD capture',download);
    const shortcut=(event:KeyboardEvent)=>{if(event.ctrlKey&&event.shiftKey&&!event.metaKey&&!event.altKey&&event.code==='KeyL'){event.preventDefault();event.stopPropagation();if(!event.repeat)download();}};
    window.addEventListener('keydown',shortcut,true);
    removeLcdDownload=()=>{captureAbort.abort();window.removeEventListener('keydown',shortcut,true);};
  }
  return ()=>{removeLcdDownload();if(diagnostics){Reflect.deleteProperty(host,'screenCanvases');Reflect.deleteProperty(host,'captureNativeBanner');}if(lcdCapture)Reflect.deleteProperty(host,'captureScreensAt');state=releaseSystemInputs(state,performance.now()-start);effects.drain(false);effects.dispose();accessible.remove();audio.dispose();screens.dispose();soundRoom.dispose();cameraShoot.dispose();folderBanner.dispose();surfaceDisposed=true;disposed=true;if(surfaceSchedule!==undefined){if(window.cancelIdleCallback)window.cancelIdleCallback(surfaceSchedule);else clearTimeout(surfaceSchedule);}for(const remove of removeSurfaceHooks)remove();for(const texture of surfaceTextures)texture.dispose();cancelAnimationFrame(request);observer.disconnect();renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);host.removeEventListener('pointerdown',pointerDown);host.removeEventListener('pointermove',pointerMove);host.removeEventListener('pointerup',pointerUp);host.removeEventListener('pointercancel',pointerAbort);host.removeEventListener('lostpointercapture',pointerCancel);host.removeEventListener('keydown',keydown);host.removeEventListener('keyup',keyup);host.removeEventListener('blur',blur);host.removeEventListener('wheel',wheel);motionPreference.removeEventListener('change',motionChanged);document.removeEventListener('visibilitychange',visibilityChanged);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v instanceof THREE.Texture)v.dispose();m.dispose();}}});env.dispose();topTexture.dispose();bottomTexture.dispose();renderer.dispose();renderer.domElement.remove();};
}
