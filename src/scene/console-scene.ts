import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createScreens } from '@/os/screens';
import { initialState, reduceMenu, touchMenu, type Input } from '@/os/state';

const RAD = Math.PI / 180;
const smooth = (t:number) => { t=THREE.MathUtils.clamp(t,0,1); return t*t*(3-2*t); };
export async function createConsoleScene(host:HTMLDivElement):Promise<()=>void> {
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
  try{gltf=await new GLTFLoader().loadAsync('/models/silver-3ds-xl.glb');}catch(e){renderer.dispose();renderer.domElement.remove();env.dispose();throw e;}
  const model=gltf.scene;model.scale.setScalar(10);pivot.add(model);
  const hinge=model.getObjectByName('Hinge')!;const base=model.getObjectByName('Base')!;
  if(!hinge||!base)throw new Error('The model is missing its hinge/base hierarchy.');
  model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  const screens=createScreens();let state={...initialState};screens.paint(state);
  const topTexture=new THREE.CanvasTexture(screens.top),bottomTexture=new THREE.CanvasTexture(screens.bottom);
  for(const tx of [topTexture,bottomTexture]){tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.magFilter=THREE.LinearFilter;tx.generateMipmaps=false;tx.anisotropy=renderer.capabilities.getMaxAnisotropy();}
  // All locations below are the same millimetre coordinates as the Blender file.
  // Screen planes have dedicated UVs, separate from the shell's paint unwrap.
  const topMat=new THREE.MeshBasicMaterial({map:topTexture,toneMapped:false});
  const bottomMat=new THREE.MeshBasicMaterial({map:bottomTexture,toneMapped:false});
  const topScreen=new THREE.Mesh(new THREE.PlaneGeometry(106.28796,63.77278),topMat);
  topScreen.name='Display_Top';topScreen.rotation.x=Math.PI/2;topScreen.position.set(0,-1.95,43.5);hinge.add(topScreen);
  const touchScreen=new THREE.Mesh(new THREE.PlaneGeometry(84.9376,63.7032),bottomMat);
  touchScreen.name='Display_Touch';touchScreen.rotation.x=-Math.PI/2;touchScreen.position.set(0,13.83,1);base.add(touchScreen);
  let surfaceDisposed=false;
  host.dataset.vgpu='initializing';
  import('./silver-surface').then(({createSilverSurface})=>createSilverSurface()).then(texture=>{
    if(surfaceDisposed){texture?.dispose();return;}
    if(!texture){host.dataset.vgpu='webgl-fallback';return;}
    model.traverse(o=>{if(o instanceof THREE.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m instanceof THREE.MeshStandardMaterial&&m.name.includes('Satin silver')){m.roughnessMap=texture;m.roughness=1;m.bumpMap=texture;m.bumpScale=.0008;m.needsUpdate=true;}}}});host.dataset.vgpu='ready';
  }).catch(e=>{host.dataset.vgpu='webgl-fallback';console.warn('VGPU surface unavailable; using the baked Blender surface.',e);});
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame=0,disposed=false,last=performance.now(),start=last,intro=!reduced,angle=reduced?155:0,targetAngle=155,yaw=reduced?-.16:.66,targetYaw=-.16,pitch=0,targetPitch=0,scale=1,targetScale=1,lastMinute=-1;
  let drag:{x:number;y:number;startX:number;startY:number;moved:boolean;control?:THREE.Object3D}|null=null;
  const pressed=new Map<THREE.Object3D,{y:number;until:number}>();
  let lastInput='none';
  const writeState=()=>{
    host.dataset.ready='true';host.dataset.menu=state.opened?'folder':'home';host.dataset.selected=String(state.selected);host.dataset.powered=String(state.powered);host.dataset.lastInput=lastInput;
  };
  function paint(){model.traverse(o=>{if(o instanceof THREE.Mesh&&/Blue.?power.?LED/i.test(o.name)){const m=o.material as THREE.MeshStandardMaterial;m.emissive.set(state.powered?0x0060ff:0x000000);m.emissiveIntensity=state.powered?2:0;m.color.set(state.powered?0x0055bb:0x151c1d);}});screens.paint(state);topTexture.needsUpdate=true;bottomTexture.needsUpdate=true;topMat.color.setScalar(state.brightness);bottomMat.color.setScalar(state.brightness);writeState();}
  function send(input:Input){state=reduceMenu(state,input);lastInput=input;paint();}
  function press(o:THREE.Object3D){if(!pressed.has(o)){pressed.set(o,{y:o.position.y,until:performance.now()+110});o.position.y-=.25;}}
  function hit(event:PointerEvent){const rect=host.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObject(model,true)[0];}
  function controlName(o:THREE.Object3D){const n=o.name;if(n.startsWith('Button_'))return n.slice(7);if(/^[ABXY]_?print/.test(n))return n[0];if(n.startsWith('HOME')||n.startsWith('Homeicon'))return 'HOME';if(n.startsWith('SELECT'))return 'SELECT';if(n.startsWith('START'))return 'START';if(n.startsWith('Power'))return 'POWER';return '';}
  function toggleLid(){intro=false;targetAngle=targetAngle>70?0:155;if(targetAngle===155){targetYaw=-.16;targetPitch=0;}lastInput='hinge';}
  function pointerDown(e:PointerEvent){host.focus({preventScroll:true});host.setPointerCapture(e.pointerId);const h=hit(e);drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,control:h?.object};}
  function pointerMove(e:PointerEvent){
    if(!drag){const h=hit(e);host.style.cursor=h?(controlName(h.object)||h.object===touchScreen?'pointer':'grab'):'default';return;}
    if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;
    if(drag.moved){intro=false;targetYaw+=(e.clientX-drag.x)*.007;targetPitch=THREE.MathUtils.clamp(targetPitch+(e.clientY-drag.y)*.003,-.45,.3);host.style.cursor='grabbing';}
    drag.x=e.clientX;drag.y=e.clientY;
  }
  function pointerUp(e:PointerEvent){
    if(!drag)return;const was=drag;drag=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);host.style.cursor='grab';if(was.moved)return;
    const h=hit(e);if(!h)return;
    if(angle<90){toggleLid();return;}
    if(h.object===touchScreen&&h.uv){state=touchMenu(state,h.uv.x*320,(1-h.uv.y)*240);lastInput='touch';paint();return;}
    const name=controlName(h.object);
    if(name){const cap=model.getObjectByName('Button_'+name);if(cap)press(cap);
      const mapping:Record<string,Input>={A:'open',B:'back',X:'zoom',Y:'brightness',HOME:'home',START:'open',SELECT:'zoom',POWER:'power',L:'left',R:'right'};
      if(name==='Dpad'||name==='Circle'){
        const p=base.worldToLocal(h.point.clone());const dx=p.x+61,dz=p.z-(name==='Dpad'?13:-15);send(Math.abs(dx)>Math.abs(dz)?(dx<0?'left':'right'):(dz<0?'up':'down'));
      }else if(mapping[name])send(mapping[name]);
      return;
    }
    if(h.object.parent===hinge||h.object.name.includes('Hinge'))toggleLid();
  }
  function pointerCancel(){drag=null;host.style.cursor='grab';}
  function keydown(e:KeyboardEvent){
    const map:Record<string,Input>={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'open',a:'open',b:'back',Escape:'back',h:'home',p:'power',x:'zoom',y:'brightness',q:'left',e:'right'};
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)toggleLid();return;}
    const action=map[e.key];if(!action)return;e.preventDefault();if(angle>90)send(action);
  }
  function wheel(e:WheelEvent){e.preventDefault();targetScale=THREE.MathUtils.clamp(targetScale-e.deltaY*.0005,.7,1.3);}
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=2*Math.atan(Math.tan(33*RAD/2)*Math.max(1,1.04/(w/h)))/RAD;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  host.addEventListener('pointerdown',pointerDown);host.addEventListener('pointermove',pointerMove);host.addEventListener('pointerup',pointerUp);host.addEventListener('pointercancel',pointerCancel);host.addEventListener('keydown',keydown);host.addEventListener('wheel',wheel,{passive:false});
  function animate(now:number){
    if(disposed)return;const dt=Math.min((now-last)/1000,.05);last=now;const elapsed=(now-start)/1000;
    if(intro){yaw=.66-((Math.PI*2)+.82)*smooth(elapsed/4.4);angle=155*smooth((elapsed-2.1)/2.3);if(elapsed>4.4){intro=false;targetYaw=yaw;angle=155;}}
    else{angle=THREE.MathUtils.damp(angle,targetAngle,5,dt);yaw=THREE.MathUtils.damp(yaw,targetYaw,6,dt);}
    pitch=THREE.MathUtils.damp(pitch,targetPitch,6,dt);scale=THREE.MathUtils.damp(scale,targetScale,6,dt);
    hinge.rotation.x=-THREE.MathUtils.clamp(angle,0,155)*RAD;pivot.rotation.set(pitch,yaw,0);pivot.scale.setScalar(scale);pivot.position.y=reduced?0:.018*Math.sin(elapsed*.7);
    topScreen.visible=touchScreen.visible=angle>12;
    for(const [o,p]of pressed){if(now>p.until){o.position.y=p.y;pressed.delete(o);}}
    const minute=Math.floor(Date.now()/60000);if(minute!==lastMinute){lastMinute=minute;paint();}
    if(host.dataset.hinge!==angle.toFixed(1))host.dataset.hinge=angle.toFixed(1);if(host.dataset.intro!==String(intro))host.dataset.intro=String(intro);
    scene.updateMatrixWorld(true);
    // Project controls into DOM data for repeatable browser QA without fake inputs.
    if(!intro&&frame%120===0){
      const targets:Record<string,number[]>={};for(const name of ['Button_A','Button_B','Button_HOME','Button_POWER','Button_Dpad','Display_Touch']){
        const o=model.getObjectByName(name);if(o){const v=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(camera);targets[name]=[(v.x+1)*host.clientWidth/2,(1-v.y)*host.clientHeight/2];}
      }host.dataset.targets=JSON.stringify(targets);
    }
    renderer.render(scene,camera);frame++;request=requestAnimationFrame(animate);
  }
  let request=requestAnimationFrame(animate);writeState();
  return ()=>{surfaceDisposed=true;disposed=true;cancelAnimationFrame(request);observer.disconnect();host.removeEventListener('pointerdown',pointerDown);host.removeEventListener('pointermove',pointerMove);host.removeEventListener('pointerup',pointerUp);host.removeEventListener('pointercancel',pointerCancel);host.removeEventListener('keydown',keydown);host.removeEventListener('wheel',wheel);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v instanceof THREE.Texture)v.dispose();m.dispose();}}});env.dispose();topTexture.dispose();bottomTexture.dispose();renderer.dispose();renderer.domElement.remove();};
}
