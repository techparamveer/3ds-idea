"""Round the sourced outer-camera housings, inserts and adjacent shell openings."""
from pathlib import Path
import json
import numpy as np
import bpy
import analyze_sourced_rig as reader
import round_sourced_speaker_holes as refinement
import curve_sourced_shell as frames
import texture_sourced_model as exporter

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def one_field(p,centre,segments,full,zero):
    q=p[:,:2]-centre;r=np.linalg.norm(q,axis=1)
    angle=np.arctan2(q[:,1],q[:,0]);half=np.pi/segments
    sector=np.mod(angle,2*half)-half
    factor=np.cos(half)/np.cos(sector)
    weight=1-refinement.smooth(r,full,zero)
    out=p.copy();out[:,:2]+=q*((1/factor-1)*weight)[:,None]
    return out

def field(p,centres,segments,full,zero):
    out=p.copy()
    for centre in centres:
        out += one_field(p,centre,segments,full,zero)-p
    return out

def main():
    assert Path(bpy.data.filepath).name=='silver-outer-optics.blend'
    _,doc,binary=reader.load_glb(FOLDER/'silver-outer-optics.glb')
    reports=[]
    for name,centre,segments,full,zero in [
        ('Sourced outer lid',np.array([[-17.75168,-80.82915],[17.75168,-80.82915]]),16,4.5,5.3),
        ('Source_0_part_13',np.array([[17.75168,-80.82915]]),16,4.5,5.3),
        ('Source_0_part_14',np.array([[-17.75168,-80.82915]]),16,4.5,5.3),
        ('Source_2_part_00',np.array([[-17.76724,-80.249187]]),20,2.5,2.7),
        ('Source_2_part_01',np.array([[17.76724,-80.249187]]),20,2.5,2.7)]:
        obj=bpy.data.objects[name];old=obj.data
        node=next(n for n in doc['nodes'] if n.get('name')==name)
        prim=doc['meshes'][node['mesh']]['primitives'][0];a=prim['attributes']
        p=reader.accessor(doc,binary,a['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1
        n=reader.accessor(doc,binary,a['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
        t=reader.accessor(doc,binary,a['TANGENT']).astype(float)[:,[0,2,1,3]];t[:,1]*=-1
        uvkeys=sorted(k for k in a if k.startswith('TEXCOORD_'))
        uv=np.concatenate([reader.accessor(doc,binary,a[k]).astype(float) for k in uvkeys],axis=1)
        faces=reader.accessor(doc,binary,prim['indices']).reshape(-1,3)
        original=p.copy();before=len(faces)
        correction=float(np.linalg.norm(p-original,axis=1).max())
        p,n,t,uv,faces=refinement.refine_speaker_patch(p,n,t,uv,faces,'lid',edge_filter=lambda a,b: bool(np.any((np.linalg.norm(a[:2]-centre,axis=1)<zero)&(np.linalg.norm(b[:2]-centre,axis=1)<zero))))
        changed=field(p,centre,segments,full,zero)
        cols=[]
        for axis in range(3):
            step=np.zeros(3);step[axis]=.0005
            cols.append((field(p+step,centre,segments,full,zero)-field(p-step,centre,segments,full,zero))/.001)
        J=np.stack(cols,axis=2);det=np.linalg.det(J)
        assert det.min()>.7
        # Keep the silver shell's interpolated source shading frame: transporting
        # its baked normal-map frame produced visible radial patches in the trial.
        # This is a shading approximation for the small in-plane displacement.
        if name!='Sourced outer lid':
            n=np.linalg.solve(np.swapaxes(J,1,2),n[:,:,None])[:,:,0];n/=np.linalg.norm(n,axis=1)[:,None]
            t[:,:3]=np.einsum('nij,nj->ni',J,t[:,:3]);t[:,:3]-=n*np.sum(n*t[:,:3],axis=1)[:,None];t[:,:3]/=np.linalg.norm(t[:,:3],axis=1)[:,None]
        assert np.isfinite(n).all() and np.isfinite(t).all()
        mesh=bpy.data.meshes.new(name+' rounded outer camera');mesh.from_pydata(changed.tolist(),[],faces.tolist());mesh.update()
        for poly in mesh.polygons:poly.use_smooth=True
        loops=np.array([l.vertex_index for l in mesh.loops])
        for i,key in enumerate(uvkeys):
            values=uv[:,i*2:i*2+2].copy();values[:,1]=1-values[:,1]
            mesh.uv_layers.new(name=old.uv_layers[i].name).data.foreach_set('uv',values[loops].astype(np.float32).ravel())
        mesh.normals_split_custom_set_from_vertices(n.tolist())
        for key,value in [('_FRAME_N',n[:,[0,2,1]].copy()),('_FRAME_T',t[:,[0,2,1]].copy()),('_FRAME_W',t[:,3])]:
            vector=value.ndim==2
            if vector:value[:,2]*=-1
            attr=mesh.attributes.new(key,'FLOAT_VECTOR' if vector else 'FLOAT','POINT')
            attr.data.foreach_set('vector' if vector else 'value',value.astype(np.float32).ravel())
        for mat in old.materials:mesh.materials.append(mat)
        obj.data=mesh
        reports.append(dict(object=name,centre=centre.tolist(),segments_before=segments,triangles_before=before,triangles_after=len(faces),initial_correction_mm=correction,maximum_refinement_displacement_mm=float(np.linalg.norm(changed-p,axis=1).max()),minimum_jacobian=float(det.min()),uv_layers=len(uvkeys)))
    root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
    root['outer_camera_rounding']=json.dumps(reports)
    root['source_changes']+=' Rounded sourced outer-camera housings, inserts and shell openings locally; retained textures and depth coordinates.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-outer-round.blend'))
    exporter.export_static(root,hinge,FOLDER/'silver-outer-round.glb',restore_frames=False,export_attributes=True)
    frames.restore_export_frames(FOLDER/'silver-outer-round.glb')
    (FOLDER/'outer-rounding-report.json').write_text(json.dumps(reports,indent=2)+'\n')
    print(json.dumps(reports))

if __name__=='__main__':main()
