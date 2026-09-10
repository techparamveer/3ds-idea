"""Round the lower cover's faceted front contour without replacing its shell.

Start from silver-corners.blend through Blender MCP. The fitted circle follows
the existing outline; the underside photograph supports a smooth front corner,
not exact manufacturer CAD. The upper chassis and flat extents stay fixed.
"""
from pathlib import Path
import json,hashlib
import numpy as np
import bpy
import analyze_sourced_rig as reader
import curve_sourced_shell as refiner
import texture_sourced_model as exporter
from compare_lid_outline import hull

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
CIRCLE=np.array([64.28580567,-33.54466014])
RADIUS=12.109781456066825

def smooth(x,a,b):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)

def move(points,outline,center):
    result=points.copy()
    for sign in [-1,1]:
        q=points[:,:2]-center
        selected=(sign*q[:,0]>60)&(q[:,1]<-26)&(points[:,2]<5.5)
        xy=q[selected].copy();xy[:,0]*=sign
        delta=xy-CIRCLE;r=np.linalg.norm(delta,axis=1)
        direction=delta/np.maximum(r[:,None],1e-10)
        theta=np.arctan2(delta[:,1],delta[:,0])
        distance=np.full(len(xy),np.inf)
        for a,b in zip(outline,np.roll(outline,-1,axis=0)):
            a=a-CIRCLE;e=b-(a+CIRCLE)
            determinant=direction[:,0]*e[1]-direction[:,1]*e[0]
            valid=abs(determinant)>1e-10
            t=np.divide(a[0]*e[1]-a[1]*e[0],determinant,out=np.full(len(xy),np.inf),where=valid)
            s=np.divide(a[0]*direction[:,1]-a[1]*direction[:,0],determinant,out=np.full(len(xy),np.inf),where=valid)
            distance=np.minimum(distance,np.where((t>0)&(s>=-1e-7)&(s<=1+1e-7),t,np.inf))
        assert np.all(np.isfinite(distance))
        weight=smooth(theta,-np.pi/2,-np.pi/2+.2)*(1-smooth(theta,-.2,0))
        weight*=smooth(r,RADIUS-5,RADIUS-1)*(1-smooth(points[selected,2],4.7,5.5))
        change=direction*((RADIUS-distance)*weight)[:,None];change[:,0]*=sign
        result[selected,:2]+=change
    return result

def main():
    assert Path(bpy.data.filepath).resolve()==(FOLDER/'silver-corners.blend').resolve()
    scene=bpy.context.scene;root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
    obj=bpy.data.objects['Sourced graphite chassis'];old=obj.data
    frame=scene.frame_current;actions=[(o,o.animation_data.action) for o in (root,hinge)]
    source,doc,binary=reader.load_glb(FOLDER/'silver-corners.glb')
    success=False
    try:
        for o,_ in actions:o.animation_data.action=None
        root.rotation_euler=(0,0,0);hinge.rotation_euler=(0,0,0);bpy.context.view_layer.update()
        node=next(n for n in doc['nodes'] if n.get('name')==obj.name)
        primitive=doc['meshes'][node['mesh']]['primitives'][0];attrs=primitive['attributes']
        p=reader.accessor(doc,binary,attrs['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1
        n=reader.accessor(doc,binary,attrs['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
        t=reader.accessor(doc,binary,attrs['TANGENT']).astype(float)[:,[0,2,1,3]];t[:,1]*=-1
        uv=reader.accessor(doc,binary,attrs['TEXCOORD_0']).astype(float)
        faces=reader.accessor(doc,binary,primitive['indices']).reshape(-1,3)
        assert np.allclose(np.array(obj.matrix_world)[:3,:3],np.eye(3),atol=1e-6)
        offset=np.array(obj.matrix_world.translation);p+=offset
        center=np.array([-.210388,0.]);outline=hull(p[p[:,2]<5,:2])-center
        old_faces=len(faces);edge=refiner.PARAMETERS['maximum_edge_mm']
        try:
            refiner.PARAMETERS['maximum_edge_mm']=.6
            p,n,t,uv,faces=refiner.refine(p,n,t,uv,faces,'body',edge_filter=lambda a,b:
                min(abs(a[0]-center[0]),abs(b[0]-center[0]))>60 and max(a[1],b[1])-center[1]<-26 and max(a[2],b[2])<5.5)
        finally:refiner.PARAMETERS['maximum_edge_mm']=edge
        changed=move(p,outline,center);columns=[]
        for axis in range(3):
            delta=np.zeros(3);delta[axis]=.0005
            columns.append((move(p+delta,outline,center)-move(p-delta,outline,center))/.001)
        J=np.stack(columns,axis=2);det=np.linalg.det(J)
        assert det.min()>.6
        n=np.linalg.solve(np.swapaxes(J,1,2),n[:,:,None])[:,:,0];n/=np.linalg.norm(n,axis=1)[:,None]
        t[:,:3]=np.einsum('nij,nj->ni',J,t[:,:3]);t[:,:3]-=n*np.sum(n*t[:,:3],axis=1)[:,None];t[:,:3]/=np.linalg.norm(t[:,:3],axis=1)[:,None]
        displacement=np.linalg.norm(changed-p,axis=1)
        assert displacement.max()<.4
        mesh=bpy.data.meshes.new('Sourced chassis smooth lower corners');mesh.from_pydata((changed-offset).tolist(),[],faces.tolist());mesh.update()
        for poly in mesh.polygons:poly.use_smooth=True
        loops=np.array([loop.vertex_index for loop in mesh.loops]);uv[:,1]=1-uv[:,1]
        mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',uv[loops].astype(np.float32).ravel());mesh.normals_split_custom_set_from_vertices(n.tolist())
        def carry(name,values):
            vector=values.ndim==2;attr=mesh.attributes.new(name,'FLOAT_VECTOR' if vector else 'FLOAT','POINT')
            attr.data.foreach_set('vector' if vector else 'value',values.astype(np.float32).ravel())
        glb_n=n[:,[0,2,1]].copy();glb_n[:,2]*=-1;glb_t=t[:,[0,2,1]].copy();glb_t[:,2]*=-1
        carry('_FRAME_N',glb_n);carry('_FRAME_T',glb_t);carry('_FRAME_W',t[:,3])
        for material in old.materials:mesh.materials.append(material)
        obj.data=mesh
        report={'source_sha256':hashlib.sha256(source).hexdigest(),'circle_center_relative_xy':CIRCLE.tolist(),'radius_mm':RADIUS,
            'triangles_before':old_faces,'triangles_after':len(faces),'maximum_displacement_mm':float(displacement.max()),
            'minimum_jacobian_determinant':float(det.min()),'vertices_moved':int(np.count_nonzero(displacement>1e-7)),
            'interpretation':'Existing lower contour fitted smoothly. Upper chassis at and above 5.5 mm retained. No factory CAD claim.'}
        root['lower_corner_smoothing']=json.dumps(report);root['source_changes']+=' Smoothed the lower cover front contour with fitted arc geometry; texture maps and other parts retained.'
        success=True
    finally:
        if not success and obj.data!=old:
            failed=obj.data;obj.data=old;bpy.data.meshes.remove(failed)
        for o,action in actions:o.animation_data.action=action
        scene.frame_set(frame);bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-cover.blend'))
    exporter.export_static(root,hinge,FOLDER/'silver-cover.glb',restore_frames=False,export_attributes=True)
    refiner.restore_export_frames(FOLDER/'silver-cover.glb')
    (FOLDER/'cover-smoothing-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
