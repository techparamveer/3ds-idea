import * as THREE from 'three';

/** SPICA's ScreenViewpoint bone rule, translated from row-vector matrices.
 * This bounded port is source-renderer evidence, not a native runtime trace.
 * worldView includes the complete model parent transform, including HOME yaw. */
export function screenViewpointBone(bone:THREE.Matrix4,rotation:{X:number;Y:number;Z:number},worldView:THREE.Matrix4):THREE.Matrix4{
 const scale=new THREE.Vector3().setFromMatrixScale(bone);
 const rotationMatrix=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rotation.X,rotation.Y,rotation.Z,'ZYX'));
 const y=new THREE.Vector3().setFromMatrixColumn(rotationMatrix,1).normalize();
 const z=new THREE.Vector3().setFromMatrixPosition(worldView).negate().normalize();
 const x=new THREE.Vector3().crossVectors(y,z).normalize();
 if(z.lengthSq()===0||x.lengthSq()===0)throw new Error('Degenerate native ScreenViewpoint billboard');
 y.crossVectors(z,x).normalize();
 // SPICA assigns the basis into columns of its row-vector matrix, then uploads
 // matrix columns to shader dot products. Three therefore needs basis rows.
 const billboard=new THREE.Matrix4().makeBasis(x,y,z).transpose();
 billboard.setPosition(new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(worldView,bone)));
 const unscaled=worldView.clone(),worldScale=new THREE.Vector3().setFromMatrixScale(worldView);
 if(Math.min(worldScale.x,worldScale.y,worldScale.z)<=0)throw new Error('Degenerate native billboard parent scale');
 unscaled.scale(new THREE.Vector3(1/worldScale.x,1/worldScale.y,1/worldScale.z));
 return unscaled.invert().multiply(billboard).scale(scale);
}
