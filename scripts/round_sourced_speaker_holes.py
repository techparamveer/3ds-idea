"""Round the sourced speaker openings; start from silver-slider.blend."""
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

def find_centres(points):
    q=np.unique(np.round(points[(np.abs(points[:,0])>58)&(np.abs(points[:,0])<75)&(points[:,1]>-49)&(points[:,1]<-39)&(np.abs(points[:,2]+.51638)<.0001)],5),axis=0)
    remaining=set(range(len(q)));centres=[];radii=[]
    while remaining:
        pending=[remaining.pop()];ids=[]
        while pending:
            i=pending.pop();ids.append(i)
            near=[j for j in remaining if np.linalg.norm(q[i,:2]-q[j,:2])<.8]
            remaining.difference_update(near);pending+=near
        group=q[ids,:2]
        assert len(group)==8, len(group)
        mean=group.mean(0);group=group[np.argsort(np.arctan2(group[:,1]-mean[1],group[:,0]-mean[0]))]
        centre=np.median((group[:4]+group[4:])/2,axis=0)
        centres.append(centre);radii.append(np.median(np.linalg.norm(group-centre,axis=1)))
    assert len(centres)==18
    assert np.ptp(radii)<.02  # Two aperture-adjacent openings were slightly distorted.
    return np.array(centres),float(np.median(radii))

def move(points,outline,centres):
    result=points.copy()
    for centre in centres:
        q=points[:,:2]-centre;radius=np.linalg.norm(q,axis=1);theta=np.arctan2(q[:,1],q[:,0])
        half=np.pi/8;sector=np.mod(theta,2*half)-half
        factor=np.cos(half)/np.cos(sector)
        weight=1-smooth(radius,.8,1.15)
        result[:,:2]+=q*((1/factor-1)*weight)[:,None]
    return result

def refine_speaker_patch(positions, normals, tangents, uvs, faces, kind, *, edge_filter=None):
    """Conforming shared-edge bisection; no Catmull-Clark shrink or UV re-unwrap."""
    values = [np.r_[p, n, t, uv] for p, n, t, uv in zip(positions, normals, tangents, uvs)]
    faces = [tuple(map(int, f)) for f in faces]
    for _ in range(12):
        edges = set()
        for a, b, c in faces:
            for i, j in [(a, b), (b, c), (c, a)]:
                p, q = values[i][:3], values[j][:3]
                affected = edge_filter(p, q) if edge_filter is not None else (
                    kind == 'lid' or min(p[2], q[2]) < PARAMETERS['base']['z_gate'][1])
                if affected and np.linalg.norm(p-q) > .18:
                    edges.add(tuple(sorted((i, j))))
        if not edges:
            break
        middle = {}
        for i, j in sorted(edges):
            value = (values[i]+values[j])/2
            if value[9] == 0: value[9] = values[i][9]  # Retain discrete source sign; never emit a zero handedness.
            value[3:6] /= np.linalg.norm(value[3:6])
            value[6:9] -= value[3:6]*np.dot(value[3:6], value[6:9])
            value[6:9] /= np.linalg.norm(value[6:9])
            middle[(i, j)] = len(values)
            values.append(value)
        output = []
        for a, b, c in faces:
            ab, bc, ca = (middle.get(tuple(sorted(pair))) for pair in [(a, b), (b, c), (c, a)])
            marked = sum(x is not None for x in (ab, bc, ca))
            if marked == 0: output.append((a, b, c))
            elif marked == 3: output.extend([(a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)])
            elif marked == 1:
                if ab is not None: output.extend([(a, ab, c), (ab, b, c)])
                elif bc is not None: output.extend([(a, b, bc), (a, bc, c)])
                else: output.extend([(a, b, ca), (ca, b, c)])
            else:
                if ab is None: output.extend([(c, ca, bc), (a, b, ca), (b, bc, ca)])
                elif bc is None: output.extend([(a, ab, ca), (b, c, ab), (c, ca, ab)])
                else: output.extend([(b, bc, ab), (c, a, bc), (a, ab, bc)])
        faces = output
    else:
        raise RuntimeError('Refinement did not converge')
    data = np.asarray(values)
    return data[:, :3], data[:, 3:6], data[:, 6:10], data[:, 10:12], np.asarray(faces)


def main():
    assert Path(bpy.data.filepath).resolve()==(FOLDER/'silver-slider.blend').resolve()
    scene=bpy.context.scene;root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
    obj=bpy.data.objects['Sourced inner lid'];old=obj.data
    frame=scene.frame_current;actions=[(o,o.animation_data.action) for o in (root,hinge)]
    source,doc,binary=reader.load_glb(FOLDER/'silver-slider.glb')
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
        centres,radius=find_centres(p-offset);centres+=offset[:2];outline=None
        original_positions=p.copy()
        for centre in centres:
            q=p[:,:2]-centre;r=np.linalg.norm(q,axis=1)
            wall=(r>.60)&(r<.76)&((np.abs(p[:,2]-offset[2]+1.2092)<.0001)|(np.abs(p[:,2]-offset[2]+.51638)<.0001))
            angle=np.rint(np.arctan2(q[wall,1],q[wall,0])/(np.pi/4))*(np.pi/4)
            p[wall,:2]=centre+radius*np.column_stack([np.cos(angle),np.sin(angle)])
        correction=float(np.linalg.norm(p-original_positions,axis=1).max())
        old_faces=len(faces);edge=refiner.PARAMETERS['maximum_edge_mm']
        try:
            refiner.PARAMETERS['maximum_edge_mm']=.18
            p,n,t,uv,faces=refine_speaker_patch(p,n,t,uv,faces,'lid',edge_filter=lambda a,b: bool(np.any((np.linalg.norm(centres-a[:2],axis=1)<1.15)&(np.linalg.norm(centres-b[:2],axis=1)<1.15))))
        finally:refiner.PARAMETERS['maximum_edge_mm']=edge
        changed=move(p,outline,centres);columns=[]
        for axis in range(3):
            delta=np.zeros(3);delta[axis]=.0005
            columns.append((move(p+delta,outline,centres)-move(p-delta,outline,centres))/.001)
        J=np.stack(columns,axis=2);det=np.linalg.det(J)
        assert det.min()>.6
        n=np.linalg.solve(np.swapaxes(J,1,2),n[:,:,None])[:,:,0];n/=np.linalg.norm(n,axis=1)[:,None]
        t[:,:3]=np.einsum('nij,nj->ni',J,t[:,:3]);t[:,:3]-=n*np.sum(n*t[:,:3],axis=1)[:,None];t[:,:3]/=np.linalg.norm(t[:,:3],axis=1)[:,None]
        displacement=np.linalg.norm(changed-p,axis=1)
        assert displacement.max()<.4
        mesh=bpy.data.meshes.new('Sourced inner lid rounded speaker openings');mesh.from_pydata((changed-offset).tolist(),[],faces.tolist());mesh.update()
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
        report={'source_sha256':hashlib.sha256(source).hexdigest(),'centres_local_xy':(centres-offset[:2]).tolist(),'source_segments':8,'mixed_frame_midpoint_policy':'Preserve source endpoints; midpoint uses first endpoint sign at an exact tie','radius_mm':radius,'initial_wall_correction_mm':correction,
            'triangles_before':old_faces,'triangles_after':len(faces),'maximum_displacement_mm':float(displacement.max()),
            'minimum_jacobian_determinant':float(det.min()),'vertices_moved':int(np.count_nonzero(displacement>1e-7)),
            'interpretation':'Eighteen source speaker openings rounded to their fitted radius with original depths and layout retained. Local wall correction repairs an earlier aperture adjustment. No factory CAD claim.'}
        root['speaker_smoothing']=json.dumps(report);root['source_changes']+=' Rounded eighteen speaker openings with fitted circular geometry; texture maps and other parts retained.'
        success=True
    finally:
        if not success and obj.data!=old:
            failed=obj.data;obj.data=old;bpy.data.meshes.remove(failed)
        for o,action in actions:o.animation_data.action=action
        scene.frame_set(frame);bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-speakers.blend'))
    exporter.export_static(root,hinge,FOLDER/'silver-speakers.glb',restore_frames=False,export_attributes=True)
    refiner.restore_export_frames(FOLDER/'silver-speakers.glb')
    (FOLDER/'speaker-smoothing-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
