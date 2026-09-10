"""Reversible lower-cover seam refinement with verified local frame repair."""
from pathlib import Path
import json
import numpy as np
import bpy
import analyze_sourced_rig as reader
import curve_sourced_shell as refiner
import render_sourced_dimensions as render

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
ARC=np.array([[64.4049,-46.3835],[68.2704,-45.7758],[71.7542,-44.0031],
              [74.5180,-41.2392],[76.2902,-37.7550],[76.8976,-33.8891]])
ARC[:,0]+=.210388
CENTER=np.array([ARC[0,0],ARC[-1,1]])
SCALE=np.array([ARC[-1,0]-ARC[0,0],ARC[-1,1]-ARC[0,1]])


def smooth(x,a,b):
    t=np.clip((x-a)/(b-a),0,1)
    return t*t*(3-2*t)


def shift(p):
    q=p[:,:2].copy();sign=np.sign(q[:,0]+.210388);q[:,0]=abs(q[:,0]+.210388)
    v=(q-CENTER)/SCALE;r=np.linalg.norm(v,axis=1);direction=v/np.maximum(r[:,None],1e-10)
    theta=np.arctan2(direction[:,1],direction[:,0]);poly=(ARC-CENTER)/SCALE
    distance=np.ones(len(p))
    for a,b in zip(poly[:-1],poly[1:]):
        e=b-a;det=direction[:,0]*e[1]-direction[:,1]*e[0];good=abs(det)>1e-8
        along=np.divide(a[0]*e[1]-a[1]*e[0],det,out=np.zeros(len(p)),where=good)
        edge=np.divide(a[0]*direction[:,1]-a[1]*direction[:,0],det,out=np.zeros(len(p)),where=good)
        hit=good&(along>0)&(edge>=0)&(edge<=1);distance[hit]=along[hit]
    weight=smooth(theta,-np.pi/2,-np.pi/2+.05)*(1-smooth(theta,-.05,0))
    weight*=smooth(r,.65,.9)*(1-smooth(r,1.1,1.4))
    weight*=smooth(p[:,2],5.3,5.55)*(1-smooth(p[:,2],5.65,5.95))
    result=np.zeros_like(p);result[:,:2]=direction*SCALE*((1-distance)*weight)[:,None]
    result[:,0]*=sign
    return result


def repair_handedness(p,n,t,uv,faces):
    # p/n/t are glTF coordinates here. Only repair inconsistent corner frames
    # whose sign is independently supported by every incident UV triangle.
    q=p[faces]
    selected=(np.ptp(t[faces,3],axis=1)>0)&np.all((q[:,:,0]<-62)&(q[:,:,2]>32)&
                  (q[:,:,1]>5.55)&(q[:,:,1]<5.65),axis=1)
    updates={}
    for tri in faces[selected]:
        e1,e2=p[tri[1]]-p[tri[0]],p[tri[2]]-p[tri[0]]
        u1,u2=uv[tri[1]]-uv[tri[0]],uv[tri[2]]-uv[tri[0]]
        det=u1[0]*u2[1]-u1[1]*u2[0];assert abs(det)>1e-8
        bitangent=(-u2[0]*e1+u1[0]*e2)/det
        expected=np.sign(np.cross(n[tri],t[tri,:3])@bitangent)
        assert np.all(expected==expected[0])
        for index,w in zip(tri,expected):
            if t[index,3]!=w:
                assert index not in updates or updates[index]==w
                updates[int(index)]=float(w)
    assert len(updates)==4
    for index,w in updates.items():
        for tri in faces[np.any(faces==index,axis=1)]:
            e1,e2=p[tri[1]]-p[tri[0]],p[tri[2]]-p[tri[0]]
            u1,u2=uv[tri[1]]-uv[tri[0]],uv[tri[2]]-uv[tri[0]]
            det=u1[0]*u2[1]-u1[1]*u2[0]
            bitangent=(-u2[0]*e1+u1[0]*e2)/det
            assert np.sign(np.dot(np.cross(n[index],t[index,:3]),bitangent))==w
        t[index,3]=w
    return updates


def main(persist=False, preview=True):
    assert Path(bpy.data.filepath).name=='silver-sd-outline.blend'
    _,doc,binary=reader.load_glb(FOLDER/'silver-sd-outline.glb')
    node=next(n for n in doc['nodes'] if n.get('name')=='Sourced graphite chassis')
    pr=doc['meshes'][node['mesh']]['primitives'][0];a=pr['attributes']
    p=reader.accessor(doc,binary,a['POSITION']).astype(float)
    n=reader.accessor(doc,binary,a['NORMAL']).astype(float)
    t=reader.accessor(doc,binary,a['TANGENT']).astype(float)
    uv=reader.accessor(doc,binary,a['TEXCOORD_0']).astype(float)
    faces=reader.accessor(doc,binary,pr['indices']).reshape(-1,3)
    fixes=repair_handedness(p,n,t,uv,faces)
    p=p[:,[0,2,1]];p[:,1]*=-1;n=n[:,[0,2,1]];n[:,1]*=-1;t=t[:,[0,2,1,3]];t[:,1]*=-1
    original_count=len(faces);old_edge=refiner.PARAMETERS['maximum_edge_mm']
    try:
        refiner.PARAMETERS['maximum_edge_mm']=.4
        p,n,t,uv,faces=refiner.refine(p,n,t,uv,faces,'body',edge_filter=lambda a,b:
            min(abs(a[0]+.210388),abs(b[0]+.210388))>62 and max(a[1],b[1])<-32 and
            ((5.3<a[2]<5.95) or (5.3<b[2]<5.95)))
    finally:refiner.PARAMETERS['maximum_edge_mm']=old_edge
    changed=p+shift(p);columns=[]
    for axis in range(3):
        delta=np.zeros(3);delta[axis]=.0005
        columns.append((shift(p+delta)-shift(p-delta))/.001)
    J=np.repeat(np.eye(3)[None,:,:],len(p),axis=0)+np.stack(columns,axis=2)
    det=np.linalg.det(J);assert det.min()>.6
    n=np.linalg.solve(np.swapaxes(J,1,2),n[:,:,None])[:,:,0];n/=np.linalg.norm(n,axis=1)[:,None]
    t[:,:3]=np.einsum('nij,nj->ni',J,t[:,:3]);t[:,:3]-=n*np.sum(n*t[:,:3],axis=1)[:,None]
    t[:,:3]/=np.linalg.norm(t[:,:3],axis=1)[:,None]
    obj=bpy.data.objects['Sourced graphite chassis'];old=obj.data;mesh=None;views=render.VIEWS;keep=False
    render.VIEWS=[('right',0,(115,-110,-85),(67,-37,3),40,0),
                  ('left',0,(-115,-110,-85),(-67,-37,3),40,0)]
    try:
        if preview:render.main('cover-seam-before',resolution=(1200,900))
        mesh=bpy.data.meshes.new('Lower-cover seam trial');mesh.from_pydata(changed.tolist(),[],faces.tolist());mesh.update()
        for poly in mesh.polygons:poly.use_smooth=True
        loops=np.array([l.vertex_index for l in mesh.loops]);uv[:,1]=1-uv[:,1]
        mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',uv[loops].astype(np.float32).ravel())
        mesh.normals_split_custom_set_from_vertices(n.tolist())
        gn=n[:,[0,2,1]].copy();gn[:,2]*=-1;gt=t[:,[0,2,1]].copy();gt[:,2]*=-1
        for name,data in [('_FRAME_N',gn),('_FRAME_T',gt),('_FRAME_W',t[:,3])]:
            vector=data.ndim==2;attr=mesh.attributes.new(name,'FLOAT_VECTOR' if vector else 'FLOAT','POINT')
            attr.data.foreach_set('vector' if vector else 'value',data.astype(np.float32).ravel())
        for material in old.materials:mesh.materials.append(material)
        obj.data=mesh
        if preview:render.main('cover-seam-trial',resolution=(1200,900))
        report={'source':'silver-sd-outline.glb','repaired_handedness_vertices':fixes,
                'triangles_before':original_count,'triangles_after':len(faces),
                'maximum_displacement_mm':float(np.linalg.norm(shift(p),axis=1).max()),
                'vertices_moved':int((np.linalg.norm(shift(p),axis=1)>1e-7).sum()),
                'minimum_jacobian_determinant':float(det.min()),'status':'saved candidate' if persist else 'reversible trial, not exported'}
        (FOLDER/'cover-seam-trial.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
        if persist:
            import texture_sourced_model as exporter
            root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
            root['lower_cover_seam']=json.dumps(report)
            root['source_changes']+=' Rounded lower-cover corner seam rings and repaired four UV-inconsistent tangent signs.'
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-cover-seam.blend'));keep=True
            exporter.export_static(root,hinge,FOLDER/'silver-cover-seam.glb',restore_frames=False,export_attributes=True)
            refiner.restore_export_frames(FOLDER/'silver-cover-seam.glb')
    finally:
        render.VIEWS=views
        if not keep:
            obj.data=old
            if mesh is not None:bpy.data.meshes.remove(mesh)


if __name__=='__main__':main()
