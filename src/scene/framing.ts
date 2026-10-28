import { Matrix4, Mesh, Vector3, type Object3D, type PerspectiveCamera } from 'three';

/** Fit the animated mesh bounds without moving the viewing direction or hinge. */
export function createConsoleFraming(model:Object3D,camera:PerspectiveCamera){
  const bounds:{object:Mesh;corners:Vector3[]}[]=[];
  model.traverse(object=>{
    if(!(object instanceof Mesh))return;
    object.geometry.computeBoundingBox();
    const box=object.geometry.boundingBox;
    if(!box||box.isEmpty())return;
    const corners:Vector3[]=[];
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new Vector3(x,y,z));
    bounds.push({object,corners});
  });
  const transform=new Matrix4(),point=new Vector3();
  /** `margin` is the fraction of each half-extent the console may fill.
   * `bottomAnchor` (0-1) lowers the framed console towards the bottom margin. */
  return function fit({margin=.88,bottomAnchor=0}:{margin?:number;bottomAnchor?:number}={}){
    camera.updateMatrixWorld();
    // Preserve the original presentation when it fits. Keep a 6% margin at
    // each edge when an oblique/open pose needs a wider field of view.
    let tangent=Math.tan(33*Math.PI/360)*Math.max(1,1.04/camera.aspect),lowest=Infinity;
    for(const {object,corners} of bounds){
      transform.multiplyMatrices(camera.matrixWorldInverse,object.matrixWorld);
      for(const corner of corners){
        point.copy(corner).applyMatrix4(transform);
        const depth=-point.z;
        if(depth<=camera.near)continue;
        tangent=Math.max(tangent,Math.abs(point.x)/(depth*camera.aspect*margin),Math.abs(point.y)/(depth*margin));
        lowest=Math.min(lowest,point.y/depth);
      }
    }
    const fov=2*Math.atan(tangent)*180/Math.PI;
    if(Math.abs(camera.fov-fov)>1e-7){camera.fov=fov;camera.updateProjectionMatrix();}
    // Shift the projection, not the camera, so the viewing direction is kept.
    // NDC drop that puts the lowest corner on the bottom margin:
    const drop=bottomAnchor>0&&Number.isFinite(lowest)?bottomAnchor*Math.max(0,lowest/tangent+margin):0;
    if(drop>1e-6)camera.setViewOffset(1,1,0,-drop/2,1,1);
    else if(camera.view?.enabled)camera.clearViewOffset();
  };
}
