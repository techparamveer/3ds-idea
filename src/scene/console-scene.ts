import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createScreens } from '@/os/screens';
import { initialState, reduceMenu, touchMenu, type Input } from '@/os/state';
import { MAX_LID_DEGREES, REST_YAW, sampleIntroPose } from './motion';
import { DEFAULT_MODEL_URL, controlBoundsInBase, controlFromObject, directionFromControlHit, isSilverPaintMaterial, resolveModelLayout, type ScreenPlacement, type DirectionalControlName, type ControlDirection } from './model-layout';
import { installSourcePaintSurface } from './source-paint-surface';
import { createConsoleFraming } from './framing';
import { ButtonMotion, buttonTravel } from './button-motion';
import { createDirectionalRig, DirectionalMotion, DIRECTION_VECTOR, clampPad, padDirection, type PadVector } from './directional-motion';

const RAD = Math.PI / 180;
export async function createConsoleScene(host:HTMLDivElement,modelUrl=DEFAULT_MODEL_URL):Promise<()=>void> {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0xeae8e4,1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(33,1,.01,100);
  camera.position.set(.08,2.45,2.65);camera.lookAt(0,.28,-.15);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.025);scene.environment=env.texture;scene.environmentIntensity=.5;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf5f7ff,0xaaa59e,.45));
  const key=new THREE.DirectionalLight(0xf7f9ff,2.3);key.position.set(-2,4,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=2;key.shadow.camera.bottom=-2;key.shadow.normalBias=.012;key.shadow.bias=-.0002;key.shadow.radius=5;scene.add(key);
  const rim=new THREE.DirectionalLight(0xfff8eb,1.1);rim.position.set(2,2,-3);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x625d55,opacity:.16}));floor.rotation.x=-Math.PI/2;floor.position.y=-.15;floor.receiveShadow=true;scene.add(floor);
  const pivot=new THREE.Group();scene.add(pivot);
  let gltf;
  try{gltf=await new GLTFLoader().loadAsync(modelUrl);}catch(e){renderer.dispose();renderer.domElement.remove();env.dispose();throw e;}
  const model=gltf.scene;model.scale.setScalar(10);pivot.add(model);
  const layout=resolveModelLayout(model);const {hinge}=layout;
  host.dataset.model=modelUrl;host.dataset.layout=layout.source;
  model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(o.userData.console_replace_with_display===true)o.visible=false;}});
  const screens=createScreens();let state={...initialState};screens.paint(state);
  const topTexture=new THREE.CanvasTexture(screens.top),bottomTexture=new THREE.CanvasTexture(screens.bottom);
  for(const tx of [topTexture,bottomTexture]){tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.magFilter=THREE.LinearFilter;tx.generateMipmaps=false;tx.anisotropy=renderer.capabilities.getMaxAnisotropy();}
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
  host.dataset.vgpu=silverMaterials.size+sourceMaterials.size?'initializing':'not-applicable';
  if(silverMaterials.size+sourceMaterials.size)import('./silver-surface').then(({createSilverSurface})=>createSilverSurface()).then(async texture=>{
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
    host.dataset.vgpu='ready';
  }).catch(e=>{if(surfaceDisposed)return;host.dataset.vgpu='webgl-fallback';console.warn('VGPU surface unavailable; using the baked Blender surface.',e);});
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');let reduced=motionPreference.matches;
  let frame=0,disposed=false,last=performance.now(),intro=!reduced,angle=reduced?MAX_LID_DEGREES:0,targetAngle=MAX_LID_DEGREES,yaw=reduced?REST_YAW:sampleIntroPose(0).yaw,targetYaw=REST_YAW,pitch=0,targetPitch=0,scale=1,targetScale=1,lastMinute=-1;
  let start=last;
  let drag:{x:number;y:number;startX:number;startY:number;moved:boolean;pointerId:number;control?:THREE.Object3D;pad?:DirectionalControlName;padOrigin?:THREE.Vector3;padDirection?:ControlDirection;repeatAt?:number}|null=null;
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
    if(drag){
      if(direction&&direction!==drag.padDirection){send(direction);drag.repeatAt=performance.now()+420;}
      drag.padDirection=direction;
    }
  }
  let lastInput='none';
  const writeState=()=>{
    host.dataset.ready='true';host.dataset.menu=state.opened?'folder':'home';host.dataset.selected=String(state.selected);host.dataset.powered=String(state.powered);host.dataset.lastInput=lastInput;
  };
  function paint(){model.traverse(o=>{if(o instanceof THREE.Mesh&&/Blue.?power.?LED/i.test(o.name)){const m=o.material as THREE.MeshStandardMaterial;m.emissive.set(state.powered?0x0060ff:0x000000);m.emissiveIntensity=state.powered?2:0;m.color.set(state.powered?0x0055bb:0x151c1d);}});for(const [material,intensity] of sourceIndicatorIntensity)material.emissiveIntensity=state.powered?intensity:0;screens.paint(state);topTexture.needsUpdate=true;bottomTexture.needsUpdate=true;topMat.emissiveIntensity=bottomMat.emissiveIntensity=state.powered?state.brightness*.97:0;writeState();}
  function send(input:Input){state=reduceMenu(state,input);lastInput=input;paint();}
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
    lastInput='hinge';writeState();
  }
  function pointerDown(e:PointerEvent){
    if(!e.isPrimary||e.button!==0||drag)return;
    host.focus({preventScroll:true});host.setPointerCapture(e.pointerId);interruptIntro();
    const h=hit(e);drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,pointerId:e.pointerId,control:h?.object};
    if(h&&angle>90){
      const name=controlName(h.object);
      if(name==='DPAD'||name==='CIRCLE'){
        drag.pad=name;pointerPad(name,e);
      }else press(name,'pointer');
    }
  }
  function pointerMove(e:PointerEvent){
    if(!drag){const h=hit(e);host.style.cursor=h?(controlName(h.object)||h.object===touchScreen?'pointer':'grab'):'default';return;}
    if(e.pointerId!==drag.pointerId)return;
    if(drag.pad){pointerPad(drag.pad,e);return;}
    if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5){drag.moved=true;targetYaw=yaw;targetPitch=pitch;release('pointer');}
    if(drag.moved){targetYaw+=(e.clientX-drag.x)*.007;targetPitch=THREE.MathUtils.clamp(targetPitch+(e.clientY-drag.y)*.003,-1.65,1.3);host.style.cursor='grabbing';}
    drag.x=e.clientX;drag.y=e.clientY;
  }
  function pointerUp(e:PointerEvent){
    if(!drag||e.pointerId!==drag.pointerId)return;const was=drag;drag=null;release('pointer');if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);host.style.cursor='grab';if(was.moved||was.pad)return;
    const h=hit(e);if(!h)return;
    if(angle<90){toggleLid(true);return;}
    if(h.object===touchScreen&&h.uv){state=touchMenu(state,h.uv.x*320,(1-h.uv.y)*240);lastInput='touch';paint();return;}
    const name=controlName(h.object);
    if(name&&(!was.control||controlName(was.control)!==name))return;
    if(name){
      const mapping:Record<string,Input>={A:'open',B:'back',X:'zoom',Y:'brightness',HOME:'home',START:'open',SELECT:'zoom',POWER:'power',L:'left',R:'right'};
      if(name==='DPAD'||name==='CIRCLE'){
        send(directionFromControlHit(layout,name,h.point));
      }else if(mapping[name])send(mapping[name]);
      return;
    }
    if(h.object.parent===hinge||h.object.name.includes('Hinge'))toggleLid();
  }
  function pointerCancel(){if(drag&&host.hasPointerCapture(drag.pointerId))host.releasePointerCapture(drag.pointerId);drag=null;release('pointer');host.style.cursor='grab';}
  function keydown(e:KeyboardEvent){
    const map:Record<string,Input>={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'open',a:'open',b:'back',Escape:'back',h:'home',p:'power',x:'zoom',y:'brightness',q:'left',e:'right'};
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)toggleLid();return;}
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    const action=map[key];if(!action)return;e.preventDefault();if(angle<=90)return;
    interruptIntro();
    const physical:Record<string,string>={ArrowLeft:'DPAD',ArrowRight:'DPAD',ArrowUp:'DPAD',ArrowDown:'DPAD',Enter:'A',a:'A',b:'B',Escape:'B',h:'HOME',p:'POWER',x:'X',y:'Y',q:'L',e:'R'};
    if(physical[key]==='DPAD')setPad('DPAD',DIRECTION_VECTOR[action as ControlDirection],`key:${e.code}`);
    else press(physical[key],`key:${e.code}`);
    if(!e.repeat||key.startsWith('Arrow'))send(action);
  }
  function keyup(e:KeyboardEvent){release(`key:${e.code}`);}
  function blur(){pointerCancel();releaseAll();}
  function motionChanged(e:MediaQueryListEvent){reduced=e.matches;if(reduced){interruptIntro();angle=targetAngle;yaw=targetYaw;pitch=targetPitch;scale=targetScale;}}
  function wheel(e:WheelEvent){e.preventDefault();interruptIntro();targetScale=THREE.MathUtils.clamp(targetScale-e.deltaY*.0005,.7,1.3);}
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=2*Math.atan(Math.tan(33*RAD/2)*Math.max(1,1.04/(w/h)))/RAD;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  host.addEventListener('pointerdown',pointerDown);host.addEventListener('pointermove',pointerMove);host.addEventListener('pointerup',pointerUp);host.addEventListener('pointercancel',pointerCancel);host.addEventListener('lostpointercapture',pointerCancel);host.addEventListener('keydown',keydown);host.addEventListener('keyup',keyup);host.addEventListener('blur',blur);host.addEventListener('wheel',wheel,{passive:false});motionPreference.addEventListener('change',motionChanged);
  // Enable keyboard play on first load without taking focus from another control.
  if(document.activeElement===document.body)host.focus({preventScroll:true});
  function animate(now:number){
    if(disposed)return;const dt=Math.min((now-last)/1000,.05);last=now;const elapsed=(now-start)/1000;
    if(intro){const pose=sampleIntroPose(elapsed);yaw=pose.yaw;angle=pose.angle;if(pose.done){intro=false;targetYaw=REST_YAW;angle=targetAngle=MAX_LID_DEGREES;}}
    else{angle=reduced?targetAngle:THREE.MathUtils.damp(angle,targetAngle,6,dt);yaw=reduced?targetYaw:THREE.MathUtils.damp(yaw,targetYaw,drag?.moved?18:7,dt);}
    angle=THREE.MathUtils.clamp(angle,0,MAX_LID_DEGREES);
    if(Math.abs(angle-targetAngle)<.01)angle=targetAngle;
    pitch=reduced?targetPitch:THREE.MathUtils.damp(pitch,targetPitch,drag?.moved?18:7,dt);scale=reduced?targetScale:THREE.MathUtils.damp(scale,targetScale,7,dt);
    hinge.rotation.x=-angle*RAD;pivot.rotation.set(pitch,yaw,0);pivot.scale.setScalar(scale);
    topScreen.visible=touchScreen.visible=angle>12;
    if(drag?.pad&&drag.padDirection&&now>=(drag.repeatAt??Infinity)){
      send(drag.padDirection);drag.repeatAt=now+150;
    }
    const padPoses:Record<string,unknown>={};
    for(const [name,pad]of directional){
      const vector=pad.motion.step(now,dt,reduced);pad.rig.apply(name,vector);
      padPoses[name]={...vector,rotation:pad.rig.pivot.rotation.toArray().slice(0,3),position:pad.rig.pivot.position.toArray()};
    }
    host.dataset.padPoses=JSON.stringify(padPoses);
    for(const [cap,feedback]of pressed){
      const depth=feedback.motion.step(now,dt,reduced);
      if(depth===0){for(const part of feedback.parts)part.object.position.y=part.y;pressed.delete(cap);}
      else for(const part of feedback.parts)part.object.position.y=part.y-depth;
      if(lastPress?.name===cap.name){
        lastPress.maxTravelMm=Math.max(lastPress.maxTravelMm,feedback.parts[0].y-cap.position.y);
        host.dataset.lastButtonPress=JSON.stringify(lastPress);
      }
    }
    host.dataset.buttonDepths=JSON.stringify(Object.fromEntries([...pressed].map(([cap,feedback])=>[cap.name,Number(feedback.motion.depth.toFixed(3))])));
    const minute=Math.floor(Date.now()/60000);if(minute!==lastMinute){lastMinute=minute;paint();}
    if(host.dataset.hinge!==angle.toFixed(1))host.dataset.hinge=angle.toFixed(1);if(host.dataset.intro!==String(intro))host.dataset.intro=String(intro);
    scene.updateMatrixWorld(true);
    fitConsole();
    // Project controls into DOM data for repeatable browser QA without fake inputs.
    if(!intro&&frame%120===0){
      const targets:Record<string,number[]>={};for(const name of ['Button_A','Button_B','Button_HOME','Button_POWER','Button_Dpad','Display_Touch']){
        const o=model.getObjectByName(name);if(o){const v=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(camera);targets[name]=[(v.x+1)*host.clientWidth/2,(1-v.y)*host.clientHeight/2];}
      }
      for(const name of ['DPAD','CIRCLE'] as const){
        const control=layout.controls.get(name);if(!control)continue;
        for(const [direction,offset]of Object.entries(DIRECTION_VECTOR)){
          const v=layout.base.localToWorld(control.centerInBase.clone().add(new THREE.Vector3(offset.x*6,2,offset.y*6))).project(camera);
          targets[`${name}_${direction}`]=[(v.x+1)*host.clientWidth/2,(1-v.y)*host.clientHeight/2];
        }
      }
      host.dataset.targets=JSON.stringify(targets);
    }
    renderer.render(scene,camera);frame++;request=requestAnimationFrame(animate);
  }
  // Upload the real model and compile its materials before starting the clock.
  // Otherwise a first-frame GPU stall skips the left turn and jumps into opening.
  hinge.rotation.x=-angle*RAD;pivot.rotation.set(pitch,yaw,0);
  topScreen.visible=touchScreen.visible=angle>12;
  scene.updateMatrixWorld(true);
  fitConsole();
  renderer.initTexture(topTexture);renderer.initTexture(bottomTexture);
  await renderer.compileAsync(scene,camera);
  renderer.render(scene,camera);
  start=last=performance.now();
  let request=requestAnimationFrame(animate);writeState();
  return ()=>{surfaceDisposed=true;disposed=true;for(const remove of removeSurfaceHooks)remove();for(const texture of surfaceTextures)texture.dispose();cancelAnimationFrame(request);observer.disconnect();host.removeEventListener('pointerdown',pointerDown);host.removeEventListener('pointermove',pointerMove);host.removeEventListener('pointerup',pointerUp);host.removeEventListener('pointercancel',pointerCancel);host.removeEventListener('lostpointercapture',pointerCancel);host.removeEventListener('keydown',keydown);host.removeEventListener('keyup',keyup);host.removeEventListener('blur',blur);host.removeEventListener('wheel',wheel);motionPreference.removeEventListener('change',motionChanged);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v instanceof THREE.Texture)v.dispose();m.dispose();}}});env.dispose();topTexture.dispose();bottomTexture.dispose();renderer.dispose();renderer.domElement.remove();};
}
