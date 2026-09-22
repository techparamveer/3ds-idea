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
