"""Reversible coordinated audio-rim/aperture rounding from cover-seam.

The source's regular rear 16-gons constrain radius and center. This is a
sampling correction, not a claim to Nintendo's unpublished mold dimensions.
"""
from pathlib import Path
import json
import numpy as np
import bpy
import analyze_sourced_rig as reader
import curve_sourced_shell as refiner
import render_sourced_dimensions as render

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
CENTER = np.array([-59.50925, 6.3141])  # native X/Z, source rear circles


def smooth(x, a, b):
    t = np.clip((x-a)/(b-a), 0, 1)
    return t*t*(3-2*t)


def shift(p):
    v = p[:,[0,2]]-CENTER
    radius = np.linalg.norm(v, axis=1)
    angle = np.arctan2(v[:,1], v[:,0])
    step = np.pi/8
    local = np.mod(angle,step)-step/2
    polygon_radius = np.cos(step/2)/np.cos(local)
    weight = smooth(radius,.4,1)*(1-smooth(radius,3.05,3.3))
    weight *= 1-smooth(p[:,1],-43.8,-42.3)
    out = np.zeros_like(p)
    # Expand each horizontal polygon chord to its circular counterpart.
    # Keeping Y/Z fixed preserves the front roll and horizontal cover seam.
    circular_radius=radius/polygon_radius
    target_x=np.sign(v[:,0])*np.sqrt(np.maximum(circular_radius**2-v[:,1]**2,0))
    out[:,0]=(target_x-v[:,0])*weight
    return out


def main(persist=False, preview=True, render_before=True):
    assert Path(bpy.data.filepath).name == 'silver-cover-seam.blend'
    _, doc, binary = reader.load_glb(FOLDER/'silver-cover-seam.glb')
    originals=[];views=render.VIEWS;keep=False;report=[]
    render.VIEWS = [('front',0,(-59.5,-160,6.3),(-59.5,-45,6.3),18,0),
                    ('under',0,(-90,-130,-55),(-59.5,-44,5.7),22,0)]
    try:
        if preview and render_before: render.main('audio-socket-before',resolution=(1000,750))
        for name in ['Source_0_part_19','Sourced graphite chassis']:
            obj=bpy.data.objects[name]
            node=next(n for n in doc['nodes'] if n.get('name')==name)
            pr=doc['meshes'][node['mesh']]['primitives'][0];a=pr['attributes']
            p=reader.accessor(doc,binary,a['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1
            n=reader.accessor(doc,binary,a['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
            t=reader.accessor(doc,binary,a['TANGENT']).astype(float)[:,[0,2,1,3]];t[:,1]*=-1
            uv=reader.accessor(doc,binary,a['TEXCOORD_0']).astype(float)
            faces=reader.accessor(doc,binary,pr['indices']).reshape(-1,3)
            before=len(faces);translation=np.array(obj.location);p+=translation
            old_edge=refiner.PARAMETERS['maximum_edge_mm']
            try:
                refiner.PARAMETERS['maximum_edge_mm']=.22
                def nearby(q):
                    return -65<q[0]<-54 and q[1]<-42 and .8<q[2]<11.8
                p,n,t,uv,faces=refiner.refine(p,n,t,uv,faces,'body',edge_filter=lambda a,b:nearby(a) and nearby(b),max_iterations=20)
            finally:refiner.PARAMETERS['maximum_edge_mm']=old_edge
            delta=shift(p);changed=p+delta
            cols=[]
            for axis in range(3):
                h=np.zeros(3);h[axis]=.0005
                cols.append((shift(p+h)-shift(p-h))/.001)
            J=np.repeat(np.eye(3)[None,:,:],len(p),axis=0)+np.stack(cols,axis=2)
            det=np.linalg.det(J);assert det.min()>.25
            # Keep the artist's already smooth molded-surface normals.
            # This deformation slides vertices along the shell's front section.
            n/=np.linalg.norm(n,axis=1)[:,None]
            t[:,:3]=np.einsum('nij,nj->ni',J,t[:,:3]);t[:,:3]-=n*np.sum(n*t[:,:3],axis=1)[:,None]
            t[:,:3]/=np.linalg.norm(t[:,:3],axis=1)[:,None]
            old_cross=np.cross(p[faces[:,1]]-p[faces[:,0]],p[faces[:,2]]-p[faces[:,0]])
            new_cross=np.cross(changed[faces[:,1]]-changed[faces[:,0]],changed[faces[:,2]]-changed[faces[:,0]])
            valid=np.linalg.norm(old_cross,axis=1)>1e-8
            flips=int((np.sum(old_cross[valid]*new_cross[valid],axis=1)<=0).sum())
            assert flips==0, (name,'triangle flips',flips)
            assert np.linalg.norm(changed-p,axis=1).max()<.4
            assert np.array_equal(changed[:,1:],p[:,1:])
            mesh=bpy.data.meshes.new(name+' round audio socket')
            mesh.from_pydata((changed-translation).tolist(),[],faces.tolist());mesh.update()
            for poly in mesh.polygons:poly.use_smooth=True
            loops=np.array([l.vertex_index for l in mesh.loops]);uv[:,1]=1-uv[:,1]
            mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',uv[loops].astype(np.float32).ravel())
            mesh.normals_split_custom_set_from_vertices(n.tolist())
            gn=n[:,[0,2,1]].copy();gn[:,2]*=-1;gt=t[:,[0,2,1]].copy();gt[:,2]*=-1
            for attr_name,data in [('_FRAME_N',gn),('_FRAME_T',gt),('_FRAME_W',t[:,3])]:
                vector=data.ndim==2;attr=mesh.attributes.new(attr_name,'FLOAT_VECTOR' if vector else 'FLOAT','POINT')
                attr.data.foreach_set('vector' if vector else 'value',data.astype(np.float32).ravel())
            for material in obj.data.materials:mesh.materials.append(material)
            originals.append((obj,obj.data,mesh));obj.data=mesh
            report.append({'object':name,'triangles_before':before,'triangles_after':len(faces),
                           'triangle_flips':flips,
                           'vertices_moved':int((np.linalg.norm(delta,axis=1)>1e-7).sum()),
                           'maximum_displacement_mm':float(np.linalg.norm(changed-p,axis=1).max()),
                           'axis_maximum_displacement_mm':np.max(abs(changed-p),axis=0).tolist(),
                           'minimum_jacobian_determinant':float(det.min())})
        if preview:render.main('audio-socket-trial',resolution=(1000,750))
        (FOLDER/'audio-socket-trial.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
        if persist:
            import texture_sourced_model as exporter
            root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
            root['audio_socket_refinement']=json.dumps(report)
            root['source_changes']+=' Coordinated circular interpolation of audio socket rim and shell aperture.'
            render.VIEWS=views;render.main('audio-socket-final',resolution=(1000,750))
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-audio-socket.blend'));keep=True
            exporter.export_static(root,hinge,FOLDER/'silver-audio-socket.glb',restore_frames=False,export_attributes=True)
            refiner.restore_export_frames(FOLDER/'silver-audio-socket.glb')
    finally:
        render.VIEWS=views
        if not keep:
            for obj,old,mesh in originals:obj.data=old;bpy.data.meshes.remove(mesh)

if __name__=='__main__':main()
