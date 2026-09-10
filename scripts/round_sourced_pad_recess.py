"""Round the circle-pad recess; start from silver-pad.blend."""
from pathlib import Path
import json,hashlib
import numpy as np
import bpy
import analyze_sourced_rig as reader
import curve_sourced_shell as refiner
import texture_sourced_model as exporter

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def smooth(x,a,b):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)

def move(points,outline,center):
    result=points.copy();q=points[:,:2]-center
    radius=np.linalg.norm(q,axis=1);theta=np.arctan2(q[:,1],q[:,0])
    half=np.pi/16
    sector=np.mod(theta,2*half)-half
    polygon_factor=np.cos(half)/np.cos(sector)
    weight=smooth(radius,7,9)*(1-smooth(radius,11.5,14))*smooth(points[:,2],10,12)
    result[:,:2]+=q*((1/polygon_factor-1)*weight)[:,None]
    return result

def main():
    assert Path(bpy.data.filepath).resolve()==(FOLDER/'silver-pad.blend').resolve()
    scene=bpy.context.scene;root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
    obj=bpy.data.objects['Sourced graphite chassis'];old=obj.data
    frame=scene.frame_current;actions=[(o,o.animation_data.action) for o in (root,hinge)]
    source,doc,binary=reader.load_glb(FOLDER/'silver-pad.glb')
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
        center=np.array([-62.2249641459375,15.174867628173828]);outline=None
        old_faces=len(faces);edge=refiner.PARAMETERS['maximum_edge_mm']
        try:
            refiner.PARAMETERS['maximum_edge_mm']=.6
            p,n,t,uv,faces=refiner.refine(p,n,t,uv,faces,'lid',edge_filter=lambda a,b: max(np.linalg.norm(a[:2]-center),np.linalg.norm(b[:2]-center))<14 and min(a[2],b[2])>10)
        finally:refiner.PARAMETERS['maximum_edge_mm']=edge
        changed=move(p,outline,center);columns=[]
        for axis in range(3):
            delta=np.zeros(3);delta[axis]=.0005
            columns.append((move(p+delta,outline,center)-move(p-delta,outline,center))/.001)
        J=np.stack(columns,axis=2);det=np.linalg.det(J)
        assert det.min()>.6
        # The source already supplies smooth radial shading across the socket.
        # Retain those interpolated frames while rounding its faceted silhouette.
        displacement=np.linalg.norm(changed-p,axis=1)
        assert displacement.max()<.4
        mesh=bpy.data.meshes.new('Sourced chassis rounded circle pad recess');mesh.from_pydata((changed-offset).tolist(),[],faces.tolist());mesh.update()
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
        report={'source_sha256':hashlib.sha256(source).hexdigest(),'pad_center_world_xy':center.tolist(),'source_segments':16,
            'triangles_before':old_faces,'triangles_after':len(faces),'maximum_displacement_mm':float(displacement.max()),
            'minimum_jacobian_determinant':float(det.min()),'vertices_moved':int(np.count_nonzero(displacement>1e-7)),
            'interpretation':'Circle-pad recess rounded with original heights and remote chassis retained. No factory CAD claim.'}
        root['pad_recess_smoothing']=json.dumps(report);root['source_changes']+=' Rounded the circle pad recess with fitted arc geometry; texture maps and other parts retained.'
        success=True
    finally:
        if not success and obj.data!=old:
            failed=obj.data;obj.data=old;bpy.data.meshes.remove(failed)
        for o,action in actions:o.animation_data.action=action
        scene.frame_set(frame);bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-socket.blend'))
    exporter.export_static(root,hinge,FOLDER/'silver-socket.glb',restore_frames=False,export_attributes=True)
    refiner.restore_export_frames(FOLDER/'silver-socket.glb')
    (FOLDER/'socket-smoothing-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
