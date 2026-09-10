"""Reversible coordinated SD-flap/opening outline trial from cover-profile."""
from pathlib import Path
import json
import numpy as np
import bpy
import analyze_sourced_rig as reader
import curve_sourced_shell as refiner
import render_sourced_dimensions as render

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def smooth(x, a, b):
    t = np.clip((x-a)/(b-a), 0, 1)
    return t*t*(3-2*t)


def shift(p):
    x, y, z = p.T
    result = np.zeros_like(p)
    # Rounded ends constrained to existing flap end points. Ellipse shape is an
    # authored interpolation, not a measured Nintendo manufacturing radius.
    for sign, xs, ys in [(-1, [71.2945,71.8456,73.5064], [-30.1338,-31.8596,-32.627]),
                         (1, [71.298,71.8851,73.6091], [-8.0015,-6.1217,-5.6474])]:
        scale = np.array([xs[-1]-xs[0], ys[-1]-ys[0]])
        center = np.array([xs[-1], ys[0]])
        v = (p[:,:2]-center)/scale
        radius = np.linalg.norm(v,axis=1)
        direction = v/np.maximum(radius[:,None],1e-10)
        theta = np.arctan2(direction[:,1],direction[:,0])
        poly = (np.column_stack([xs,ys])-center)/scale
        distance = np.ones(len(p))
        for a,b in zip(poly[:-1],poly[1:]):
            e=b-a
            det=direction[:,0]*e[1]-direction[:,1]*e[0]
            good=abs(det)>1e-8
            along=np.divide(a[0]*e[1]-a[1]*e[0],det,out=np.zeros(len(p)),where=good)
            edge=np.divide(a[0]*direction[:,1]-a[1]*direction[:,0],det,out=np.zeros(len(p)),where=good)
            hit=good&(along>0)&(edge>=0)&(edge<=1)
            distance[hit]=along[hit]
        weight = smooth(theta,np.pi/2,np.pi/2+.06)*(1-smooth(theta,np.pi-.06,np.pi))
        weight *= smooth(radius,.2,.7)*(1-smooth(radius,1.4,2.2))
        weight *= 1-smooth(z, 3.8, 4.6)
        weight *= smooth(y,-32.63,-31.73)*(1-smooth(y,-6.55,-5.65))
        result[:,:2] += direction*scale*((1-distance)*weight)[:,None]
    return result


def main(persist=False):
    assert Path(bpy.data.filepath).name == 'silver-cover-profile.blend'
    _, doc, binary = reader.load_glb(FOLDER/'silver-cover-profile.glb')
    originals = []
    views = render.VIEWS
    render.VIEWS = [('sd',0,(115,-110,-85),(73,-20,3),45,0)]
    report = []
    keep = False
    try:
        render.main('sd-outline-before', resolution=(1200,900))
        for name in ['Source_0_part_32','Sourced graphite chassis']:
            obj = bpy.data.objects[name]
            node = next(n for n in doc['nodes'] if n.get('name') == name)
            primitive = doc['meshes'][node['mesh']]['primitives'][0]
            a = primitive['attributes']
            p = reader.accessor(doc,binary,a['POSITION']).astype(float)[:,[0,2,1]]; p[:,1] *= -1
            n = reader.accessor(doc,binary,a['NORMAL']).astype(float)[:,[0,2,1]]; n[:,1] *= -1
            t = reader.accessor(doc,binary,a['TANGENT']).astype(float)[:,[0,2,1,3]]; t[:,1] *= -1
            uv = reader.accessor(doc,binary,a['TEXCOORD_0']).astype(float)
            faces = reader.accessor(doc,binary,primitive['indices']).reshape(-1,3)
            count = len(faces)
            old_edge = refiner.PARAMETERS['maximum_edge_mm']
            try:
                refiner.PARAMETERS['maximum_edge_mm'] = .45
                p,n,t,uv,faces = refiner.refine(p,n,t,uv,faces,'body',edge_filter=lambda a,b:
                    min(a[0],b[0])>70 and max(a[0],b[0])<75 and max(a[2],b[2])<4.6 and
                    ((min(a[1],b[1])>-35 and max(a[1],b[1])<-28) or
                     (min(a[1],b[1])>-10 and max(a[1],b[1])<-3)))
            finally:
                refiner.PARAMETERS['maximum_edge_mm'] = old_edge
            changed = p + shift(p)
            derivatives = []
            for axis in range(3):
                delta = np.zeros(3); delta[axis] = .0005
                derivatives.append((shift(p+delta)-shift(p-delta))/.001)
            J = np.repeat(np.eye(3)[None,:,:],len(p),axis=0)
            J += np.stack(derivatives,axis=2)
            determinant = np.linalg.det(J)
            assert determinant.min() > .5
            n = np.linalg.solve(np.swapaxes(J,1,2),n[:,:,None])[:,:,0]
            n /= np.linalg.norm(n,axis=1)[:,None]
            t[:,:3] = np.einsum('nij,nj->ni',J,t[:,:3])
            t[:,:3] -= n*np.sum(n*t[:,:3],axis=1)[:,None]
            t[:,:3] /= np.linalg.norm(t[:,:3],axis=1)[:,None]
            mesh = bpy.data.meshes.new(name+' SD outline trial')
            mesh.from_pydata(changed.tolist(),[],faces.tolist());mesh.update()
            for poly in mesh.polygons: poly.use_smooth=True
            loops = np.array([loop.vertex_index for loop in mesh.loops])
            uv[:,1] = 1-uv[:,1]
            mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',uv[loops].astype(np.float32).ravel())
            mesh.normals_split_custom_set_from_vertices(n.tolist())
            gn=n[:,[0,2,1]].copy();gn[:,2]*=-1
            gt=t[:,[0,2,1]].copy();gt[:,2]*=-1
            for attr_name,data in [('_FRAME_N',gn),('_FRAME_T',gt),('_FRAME_W',t[:,3])]:
                vector=data.ndim==2
                attr=mesh.attributes.new(attr_name,'FLOAT_VECTOR' if vector else 'FLOAT','POINT')
                attr.data.foreach_set('vector' if vector else 'value',data.astype(np.float32).ravel())
            for material in obj.data.materials: mesh.materials.append(material)
            originals.append((obj,obj.data,mesh));obj.data=mesh
            report.append({'object':name,'triangles_before':count,'triangles_after':len(faces),
                           'vertices_moved':int((np.linalg.norm(shift(p),axis=1)>1e-7).sum()),
                           'maximum_displacement_mm':float(np.linalg.norm(shift(p),axis=1).max()),
                           'minimum_jacobian_determinant':float(determinant.min())})
        render.main('sd-outline-trial',resolution=(1200,900))
        (FOLDER/'sd-outline-trial.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report))
        if persist:
            import texture_sourced_model as exporter
            root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
            root['sd_outline_refinement']=json.dumps(report)
            root['source_changes']+=' Coordinated radial smoothing of SD flap ends and surrounding opening.'
            render.VIEWS=views
            render.main('sd-outline-final',resolution=(1000,750))
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-sd-outline.blend'))
            keep=True
            exporter.export_static(root,hinge,FOLDER/'silver-sd-outline.glb',restore_frames=False,export_attributes=True)
            refiner.restore_export_frames(FOLDER/'silver-sd-outline.glb')
    finally:
        render.VIEWS = views
        if not keep:
            for obj,original,trial in originals:
                obj.data=original;bpy.data.meshes.remove(trial)


if __name__=='__main__': main()
