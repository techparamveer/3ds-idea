"""Round the matching power cap and opening; default is a reversible trial."""
from pathlib import Path
import json
import importlib
import numpy as np
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import analyze_sourced_rig as reader
import curve_sourced_shell as frames
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
CENTER=np.array([-.09250450134277344,-.000011444091796875])

def smooth(t):
    t=np.clip(t,0,1);return t*t*(3-2*t)

def field(p,chassis):
    q=p[:,:2]-CENTER;r=np.linalg.norm(q,axis=1);angle=np.arctan2(q[:,1],q[:,0]);half=np.pi/16
    factor=np.cos(half)/np.cos(np.mod(angle,2*half)-half)
    weight=smooth((r-2)/.5)
    if chassis:weight*= (1-smooth((r-3.3)/1.2))*smooth((p[:,2]+1.5)/1.5)
    result=p.copy();result[:,:2]+=q*((1/factor-1)*weight)[:,None];return result

def main(persist=False):
    assert Path(bpy.data.filepath).name=='silver-upper-cover.blend'
    origin=np.array(bpy.data.objects['Button_POWER'].location)
    _,doc,binary=reader.load_glb(FOLDER/'silver-upper-cover.glb')
    originals=[];reports={};points={};triangles={};saved=False;prefix='power-fit-final' if persist else 'power-fit-trial'
    try:
        for name in ['Button_POWER','Sourced graphite chassis']:
            obj=bpy.data.objects[name];old=obj.data;offset=np.array(obj.location)-origin;chassis=name!='Button_POWER'
            assert np.allclose(np.array(obj.matrix_basis)[:3,:3],np.eye(3))
            node=next(n for n in doc['nodes'] if n.get('name')==name);prim=doc['meshes'][node['mesh']]['primitives'][0];a=prim['attributes']
            p=reader.accessor(doc,binary,a['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1;p+=offset
            n=reader.accessor(doc,binary,a['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
            t=reader.accessor(doc,binary,a['TANGENT']).astype(float)[:,[0,2,1,3]];t[:,1]*=-1
            uv=reader.accessor(doc,binary,a['TEXCOORD_0']).astype(float);faces=reader.accessor(doc,binary,prim['indices']).reshape(-1,3)
            original=p.copy();r=np.linalg.norm(p[:,:2]-CENTER,axis=1)
            for low,high,radius in ([(3.0,3.3,3.125486)] if chassis else [(2.9,3.2,3.052658),(2.5,2.7,2.593228)]):
                selected=(r>low)&(r<high)
                if chassis:selected&=p[:,2]>0
                angle=np.rint(np.arctan2(p[selected,1]-CENTER[1],p[selected,0]-CENTER[0])/(np.pi/8))*np.pi/8
                p[selected,:2]=CENTER+radius*np.stack([np.cos(angle),np.sin(angle)],axis=1)
            correction=float(np.linalg.norm(p-original,axis=1).max());assert correction<.02
            count=len(faces);edge=frames.PARAMETERS['maximum_edge_mm']
            def eligible(a,b):
                if not chassis:return True
                if min(a[2],b[2])<=-1.5:return False
                if abs(a[0]-CENTER[0])>4.5 or abs(b[0]-CENTER[0])>4.5 or abs(a[1]-CENTER[1])>4.5 or abs(b[1]-CENTER[1])>4.5:return False
                return max(np.linalg.norm(a[:2]-CENTER),np.linalg.norm(b[:2]-CENTER))<4.5
            try:
                frames.PARAMETERS['maximum_edge_mm']=.3
                p,n,t,uv,faces=frames.refine(p,n,t,uv,faces,'lid',edge_filter=eligible)
            finally:frames.PARAMETERS['maximum_edge_mm']=edge
            changed=field(p,chassis)
            mesh=bpy.data.meshes.new('Rounded power fit '+name);mesh.from_pydata((changed-offset).tolist(),[],faces.tolist());mesh.update()
            for poly in mesh.polygons:poly.use_smooth=True
            loops=np.array([l.vertex_index for l in mesh.loops]);uv[:,1]=1-uv[:,1]
            mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',uv[loops].astype(np.float32).ravel());mesh.normals_split_custom_set_from_vertices(n.tolist())
            for key,value in [('_FRAME_N',n[:,[0,2,1]].copy()),('_FRAME_T',t[:,[0,2,1]].copy()),('_FRAME_W',t[:,3])]:
                vector=value.ndim==2
                if vector:value[:,2]*=-1
                attr=mesh.attributes.new(key,'FLOAT_VECTOR' if vector else 'FLOAT','POINT');attr.data.foreach_set('vector' if vector else 'value',value.astype(np.float32).ravel())
            for mat in old.materials:mesh.materials.append(mat)
            obj.data=mesh;originals.append((obj,old,mesh));points[name]=changed;triangles[name]=faces
            reports[name]={'triangles_before':count,'triangles_after':len(faces),'initial_regularization_mm':correction,'maximum_refinement_move_mm':float(np.linalg.norm(changed-p,axis=1).max()),'extent_delta_mm':(np.ptp(changed,axis=0)-np.ptp(original,axis=0)).tolist()}
        tree=BVHTree.FromPolygons(points['Sourced graphite chassis'].tolist(),triangles['Sourced graphite chassis'].tolist(),all_triangles=True)
        probes=points['Button_POWER'][points['Button_POWER'][:,2]>=0]
        reports['upper_cap_to_chassis_min_mm']=min(tree.find_nearest(Vector(p))[3] for p in probes)
        reports['clearance_scope']='Unsigned nearest-surface upper-vertex probes, not a complete swept-solid collision test.'
        (FOLDER/(prefix+'.json')).write_text(json.dumps(reports,indent=2)+'\n')
        importlib.reload(renderer);c=bpy.data.objects['Button_POWER'].location
        renderer.VIEWS=[('power',-155,(c.x,c.y-30,145),(c.x,c.y,14),26,0)];renderer.main(prefix)
        if persist:
            import texture_sourced_model as exporter
            root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge'];root['power_outline_fit']=json.dumps(reports)
            root['source_changes']+=' Rounded the power cap and matching chassis aperture, retaining symbol, heights, positions and material maps.'
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-power-fit.blend'))
            output=FOLDER/'silver-power-fit.glb';exporter.export_static(root,hinge,output,restore_frames=False,export_attributes=True);frames.restore_export_frames(output);saved=True
        print(json.dumps(reports))
    finally:
        if not saved:
            for obj,old,mesh in originals:obj.data=old;bpy.data.meshes.remove(mesh)

if __name__=='__main__':main()
