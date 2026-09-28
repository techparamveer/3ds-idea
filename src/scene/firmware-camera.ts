import * as THREE from 'three';

export type FirmwareCameraData={schema:1;cameras:{name:string;position:number[];rotation:number[];scale:number[];viewType:string;aimTarget:number[];aimTwist:number;projectionType:string;perspectiveFovRadians:number;aspect:number;near:number;far:number}[]};

/** Bounded native Aim/Perspective camera used by the HOME banner scene. */
export function createFirmwareCamera(data:FirmwareCameraData):THREE.PerspectiveCamera {
 if(data.schema!==1||data.cameras?.length!==1)throw new Error('Expected one native HOME camera');
 const source=data.cameras[0];
 const vec=(value:number[])=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
 if(![source.position,source.aimTarget,source.rotation,source.scale].every(vec))throw new Error('Invalid native camera vector');
 if(source.viewType!=='Aim'||source.projectionType!=='Perspective'||source.aimTwist!==0||source.rotation.some(v=>v!==0)||source.scale.some(v=>v!==1))throw new Error('Unsupported native camera transform');
 const {perspectiveFovRadians:fov,aspect,near,far}=source;
 if(![fov,aspect,near,far].every(Number.isFinite)||!(fov>0&&fov<Math.PI&&aspect>0&&near>0&&far>near))throw new Error('Invalid native camera projection');
 if(source.position.every((value,i)=>value===source.aimTarget[i]))throw new Error('Native camera target equals its position');
 const camera=new THREE.PerspectiveCamera(fov*180/Math.PI,aspect,near,far);
 camera.position.fromArray(source.position);camera.lookAt(new THREE.Vector3().fromArray(source.aimTarget));camera.updateMatrixWorld(true);
 return camera;
}

export async function loadFirmwareCamera(url:string):Promise<THREE.PerspectiveCamera>{
 const response=await fetch(url);if(!response.ok)throw new Error(`Camera HTTP ${response.status}`);
 return createFirmwareCamera(await response.json());
}
