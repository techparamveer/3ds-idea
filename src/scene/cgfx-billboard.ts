import * as THREE from 'three';

/** Native HOME raw CGFX mode 5, traced through 0x2e19bc / 0x1cce54.
 * Preserve bone world Y, face the inverse-view Z direction, then restore world
 * column scales and translation. SPICA's numeric enum names differ here.
 * Bounded to the rigid, nondegenerate transforms used by the folder Text bone. */
export function nativeYAxialBone(bone:THREE.Matrix4,modelWorld:THREE.Matrix4,cameraWorld:THREE.Matrix4):THREE.Matrix4{
 const world=new THREE.Matrix4().multiplyMatrices(modelWorld,bone),scale=new THREE.Vector3().setFromMatrixScale(world);
 const direction=new THREE.Vector3().setFromMatrixColumn(cameraWorld,2).normalize();
 const y=new THREE.Vector3().setFromMatrixColumn(world,1).normalize();
 const x=new THREE.Vector3().crossVectors(y,direction);
 if(!Number.isFinite(modelWorld.determinant())||modelWorld.determinant()===0||Math.min(scale.x,scale.y,scale.z)<=0||direction.lengthSq()===0||x.lengthSq()===0)
  throw new Error('Degenerate native axial billboard');
 x.normalize();const z=new THREE.Vector3().crossVectors(x,y);
 const billboard=new THREE.Matrix4().makeBasis(x,y,z).scale(scale).setPosition(new THREE.Vector3().setFromMatrixPosition(world));
 return modelWorld.clone().invert().multiply(billboard);
}

/** Native HOME raw CGFX mode 1 (0x2e1854 -> 0x1cce54, flag 1).
 * The inverse-view Z column supplies direction. Native X is world Y crossed
 * with that direction; native Y is then direction crossed with X. Unlike mode
 * 5, this recomputes Y, so camera pitch can tilt the Settings p_title bone.
 * Return the local transform because the caller applies modelWorld separately.
 */
export function nativeCameraDirectionBone(bone:THREE.Matrix4,modelWorld:THREE.Matrix4,cameraWorld:THREE.Matrix4):THREE.Matrix4{
 const world=new THREE.Matrix4().multiplyMatrices(modelWorld,bone),scale=new THREE.Vector3().setFromMatrixScale(world);
 const direction=new THREE.Vector3().setFromMatrixColumn(cameraWorld,2);
 const oldY=new THREE.Vector3().setFromMatrixColumn(world,1);
 if(!Number.isFinite(modelWorld.determinant())||modelWorld.determinant()===0||
    ![scale.x,scale.y,scale.z,direction.x,direction.y,direction.z].every(Number.isFinite)||
    Math.min(scale.x,scale.y,scale.z)<=0||direction.lengthSq()===0||oldY.lengthSq()===0)
  throw new Error('Degenerate native camera-direction billboard');
 direction.normalize();oldY.normalize();
 const x=new THREE.Vector3().crossVectors(oldY,direction);
 if(x.lengthSq()===0)throw new Error('Degenerate native camera-direction billboard');
 x.normalize();const y=new THREE.Vector3().crossVectors(direction,x);
 const billboard=new THREE.Matrix4().makeBasis(x,y,direction).scale(scale).setPosition(new THREE.Vector3().setFromMatrixPosition(world));
 return modelWorld.clone().invert().multiply(billboard);
}
