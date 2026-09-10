"""Coordinated D-pad/aperture fit. Default is reversible; persist=True saves a checkpoint."""
import bpy
import numpy as np
import importlib
import json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import analyze_sourced_rig as reader
import curve_sourced_shell as refiner
import render_sourced_dimensions as renderer

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
RADIUS=.7
CENTRES=np.array([(sx*a,sy*b) for a,b in [(9.291265-RADIUS,2.914185-RADIUS),(2.914185-RADIUS,9.291265-RADIUS)] for sx in [-1,1] for sy in [-1,1]])


def smooth(t):
    t=np.clip(t,0,1);return t*t*(3-2*t)


def move(p, chassis):
    result=p.copy()
    for center in CENTRES:
        signs=np.sign(center)
        q=(p[:,:2]-center)*signs
        selected=(q[:,0]>0)&(q[:,1]>0)
        v=q[selected]
        if not len(v):continue
        length=np.linalg.norm(v,axis=1);radial=np.max(v,axis=1)
        factor=radial/length
        weight=(1-smooth((radial-1.10)/1.50)) if chassis else np.ones(len(v))
        if chassis:weight*=smooth((p[selected,2]+2)/2)
        result[selected,:2]+=v*(factor[:,None]-1)*signs*weight[:,None]
    return result


def affected(a,b,chassis):
    # Most chassis edges are remote. This conservative rejection avoids a
    # NumPy allocation per edge without changing the corner-box predicate.
    if max(a[0],b[0]) < -12 or min(a[0],b[0]) > 12 or max(a[1],b[1]) < -12 or min(a[1],b[1]) > 12:
        return False
    lo=np.minimum(a[:2],b[:2]);hi=np.maximum(a[:2],b[:2])
    return bool(np.any(np.all(hi>=CENTRES-2.7,axis=1)&np.all(lo<=CENTRES+2.7,axis=1)))


def main(persist=False):
    assert Path(bpy.data.filepath).name == 'silver-plastic-normals.blend'
    _,doc,binary=reader.load_glb(FOLDER/'silver-plastic-normals.glb')
    origin=np.array(bpy.data.objects['Button_Dpad'].location)
    originals=[];reports={};points={};triangles={};saved=False
    prefix="dpad-fit-final" if persist else "dpad-fit-trial"
    try:
        for name in ['Button_Dpad','Sourced graphite chassis']:
            obj=bpy.data.objects[name];old=obj.data
            assert np.allclose(np.array(obj.matrix_basis)[:3,:3],np.eye(3))
            offset=np.array(obj.location)-origin
            node=next(n for n in doc['nodes'] if n.get('name')==name)
            primitive=doc['meshes'][node['mesh']]['primitives'][0];attrs=primitive['attributes']
            p=reader.accessor(doc,binary,attrs['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1;p+=offset
            n=reader.accessor(doc,binary,attrs['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
            t=reader.accessor(doc,binary,attrs['TANGENT']).astype(float)[:,[0,2,1,3]];t[:,1]*=-1
            uv=reader.accessor(doc,binary,attrs['TEXCOORD_0']).astype(float)
            faces=reader.accessor(doc,binary,primitive['indices']).reshape(-1,3)
            count=len(faces);edge=refiner.PARAMETERS['maximum_edge_mm']
            chassis=name!='Button_Dpad'
            try:
                refiner.PARAMETERS['maximum_edge_mm']=.25
                p,n,t,uv,faces=refiner.refine(p,n,t,uv,faces,'lid',edge_filter=lambda a,b: affected(a,b,chassis),max_iterations=20)
            finally:refiner.PARAMETERS['maximum_edge_mm']=edge
            chassis=name!='Button_Dpad';changed=move(p,chassis);columns=[]
            for axis in range(3):
                delta=np.zeros(3);delta[axis]=.0001
                columns.append((move(p+delta,chassis)-move(p-delta,chassis))/.0002)
            J=np.stack(columns,axis=2)
            assert np.linalg.det(J).min()>.4
            n=np.linalg.solve(np.swapaxes(J,1,2),n[:,:,None])[:,:,0];n/=np.linalg.norm(n,axis=1)[:,None]
            t[:,:3]=np.einsum('nij,nj->ni',J,t[:,:3]);t[:,:3]-=n*np.sum(n*t[:,:3],axis=1)[:,None];t[:,:3]/=np.linalg.norm(t[:,:3],axis=1)[:,None]
            mesh=bpy.data.meshes.new('Inspection D-pad fit '+name)
            mesh.from_pydata((changed-offset).tolist(),[],faces.tolist());mesh.update()
            for poly in mesh.polygons:poly.use_smooth=True
            loops=np.array([loop.vertex_index for loop in mesh.loops]);uv[:,1]=1-uv[:,1]
            mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',uv[loops].astype(np.float32).ravel())
            mesh.normals_split_custom_set_from_vertices(n.tolist())
            for key,values in [('_FRAME_N',n),('_FRAME_T',t[:,:3])]:
                values=values[:,[0,2,1]].copy();values[:,2]*=-1
                mesh.attributes.new(key,'FLOAT_VECTOR','POINT').data.foreach_set('vector',values.astype(np.float32).ravel())
            mesh.attributes.new('_FRAME_W','FLOAT','POINT').data.foreach_set('value',t[:,3].astype(np.float32))
            for material in old.materials:mesh.materials.append(material)
            obj.data=mesh;originals.append((obj,old,mesh));points[name]=changed;triangles[name]=faces
            reports[name]={'triangles_before':count,'triangles_after':len(faces),'maximum_move_mm':float(np.linalg.norm(changed-p,axis=1).max()),'minimum_jacobian':float(np.linalg.det(J).min()),'extent_delta_mm':(np.ptp(changed,axis=0)-np.ptp(p,axis=0)).tolist()}
        tree=BVHTree.FromPolygons(points['Sourced graphite chassis'].tolist(),triangles['Sourced graphite chassis'].tolist(),all_triangles=True)
        probes=points['Button_Dpad'][points['Button_Dpad'][:,2]>0]
        distances=[tree.find_nearest(Vector(p))[3] for p in probes]
        reports['upper_cap_vertex_to_chassis_min_mm']=min(distances)
        reports['clearance_scope']='Nearest surface distance at upper cap vertices only, not a signed swept-solid collision test.'
        (FOLDER/(prefix+'.json')).write_text(json.dumps(reports,indent=2)+'\n')
        importlib.reload(renderer)
        renderer.VIEWS=[('dpad',-155,(-62,-50,140),(-62,-9,14),32,0),('front',-155,(0,-260,250),(0,8,35),235,0)]
        renderer.main(prefix)
        if persist:
            import texture_sourced_model as exporter
            root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
            root['dpad_corner_fit']=json.dumps(reports)
            root['source_changes']+=' Rounded D-pad outer corners and matching chassis aperture using a photographic .7mm cap radius estimate; source dish, UV artwork, placement and heights retained.'
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-dpad-fit.blend'))
            output=FOLDER/'silver-dpad-fit.glb'
            exporter.export_static(root,hinge,output,restore_frames=False,export_attributes=True)
            refiner.restore_export_frames(output)
            saved=True
        print(json.dumps(reports))
    finally:
        if not saved:
            for obj,old,mesh in originals:
                obj.data=old;bpy.data.meshes.remove(mesh)


if __name__=='__main__':main()
