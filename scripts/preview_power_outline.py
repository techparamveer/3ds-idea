"""Reversible power-cap outline refinement, preserving its molded symbol."""
from pathlib import Path
import json
import numpy as np
import bpy
import analyze_sourced_rig as reader
import curve_sourced_shell as frames
import render_sourced_dimensions as renderer
import importlib
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
CENTER=np.array([-.09250450134277344,-.000011444091796875])

def field(p):
    q=p[:,:2]-CENTER;r=np.linalg.norm(q,axis=1)
    angle=np.arctan2(q[:,1],q[:,0]);half=np.pi/16
    sector=np.mod(angle,2*half)-half
    factor=np.cos(half)/np.cos(sector)
    weight=np.clip((r-2.0)/.5,0,1);weight=weight*weight*(3-2*weight)
    result=p.copy();result[:,:2]+=q*((1/factor-1)*weight)[:,None]
    return result

def main():
    assert Path(bpy.data.filepath).name=='silver-upper-cover.blend'
    obj=bpy.data.objects['Button_POWER'];old=obj.data
    _,doc,binary=reader.load_glb(FOLDER/'silver-upper-cover.glb')
    node=next(n for n in doc['nodes'] if n.get('name')==obj.name);prim=doc['meshes'][node['mesh']]['primitives'][0];a=prim['attributes']
    p=reader.accessor(doc,binary,a['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1
    n=reader.accessor(doc,binary,a['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
    t=reader.accessor(doc,binary,a['TANGENT']).astype(float)[:,[0,2,1,3]];t[:,1]*=-1
    uv=reader.accessor(doc,binary,a['TEXCOORD_0']).astype(float);faces=reader.accessor(doc,binary,prim['indices']).reshape(-1,3)
    before=len(faces);edge=frames.PARAMETERS['maximum_edge_mm']
    try:
        frames.PARAMETERS['maximum_edge_mm']=.3
        p,n,t,uv,faces=frames.refine(p,n,t,uv,faces,'lid',edge_filter=lambda a,b:True)
    finally:frames.PARAMETERS['maximum_edge_mm']=edge
    changed=field(p)
    mesh=bpy.data.meshes.new('Inspection rounded power cap');mesh.from_pydata(changed.tolist(),[],faces.tolist());mesh.update()
    for poly in mesh.polygons:poly.use_smooth=True
    loops=np.array([l.vertex_index for l in mesh.loops]);uv[:,1]=1-uv[:,1]
    mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',uv[loops].astype(np.float32).ravel())
    mesh.normals_split_custom_set_from_vertices(n.tolist())
    for key,value in [('_FRAME_N',n[:,[0,2,1]].copy()),('_FRAME_T',t[:,[0,2,1]].copy()),('_FRAME_W',t[:,3])]:
        vector=value.ndim==2
        if vector:value[:,2]*=-1
        attr=mesh.attributes.new(key,'FLOAT_VECTOR' if vector else 'FLOAT','POINT');attr.data.foreach_set('vector' if vector else 'value',value.astype(np.float32).ravel())
    for mat in old.materials:mesh.materials.append(mat)
    obj.data=mesh
    try:
        importlib.reload(renderer);c=obj.location
        renderer.VIEWS=[('power',-155,(c.x,c.y-30,145),(c.x,c.y,14),26,0)]
        renderer.main('power-outline-trial')
        report={'source':'silver-upper-cover.glb','centre_local_xy_mm':CENTER.tolist(),'triangles_before':before,'triangles_after':len(faces),'maximum_move_mm':float(np.linalg.norm(changed-p,axis=1).max()),'extent_delta_mm':(np.ptp(changed,axis=0)-np.ptp(p,axis=0)).tolist(),'symbol_protection_radius_mm':2.0,'symbol_region_max_move_mm':float(np.linalg.norm(changed-p,axis=1)[np.linalg.norm(p[:,:2]-CENTER,axis=1)<=2].max())}
        (FOLDER/'power-outline-trial.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
    finally:obj.data=old;bpy.data.meshes.remove(mesh)

if __name__=='__main__':main()
