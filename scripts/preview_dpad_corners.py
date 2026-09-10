"""Reversible original D-pad outline study; no checkpoint/export saved."""
import bpy
import numpy as np
import importlib
import json
from pathlib import Path
import analyze_sourced_rig as reader
import curve_sourced_shell as refiner
import render_sourced_dimensions as renderer

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
RADIUS=.7


def move(p):
    result=p.copy()
    for swap in [False,True]:
        axes=[1,0] if swap else [0,1]
        for sx in [-1,1]:
            for sy in [-1,1]:
                q=p[:,axes]*[sx,sy]-[9.291265-RADIUS,2.914185-RADIUS]
                selected=(q[:,0]>0)&(q[:,1]>0)
                v=q[selected]
                factor=np.max(v,axis=1)/np.linalg.norm(v,axis=1)
                delta=v*(factor[:,None]-1)*[sx,sy]
                for i,axis in enumerate(axes):result[selected,axis]+=delta[:,i]
    return result


def main():
    obj=bpy.data.objects['Button_Dpad'];old=obj.data
    _,doc,binary=reader.load_glb(FOLDER/'silver-plastic-normals.glb')
    node=next(n for n in doc['nodes'] if n.get('name')==obj.name)
    primitive=doc['meshes'][node['mesh']]['primitives'][0];attrs=primitive['attributes']
    p=reader.accessor(doc,binary,attrs['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1
    n=reader.accessor(doc,binary,attrs['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
    t=reader.accessor(doc,binary,attrs['TANGENT']).astype(float)[:,[0,2,1,3]];t[:,1]*=-1
    uv=reader.accessor(doc,binary,attrs['TEXCOORD_0']).astype(float)
    faces=reader.accessor(doc,binary,primitive['indices']).reshape(-1,3)
    edge=refiner.PARAMETERS['maximum_edge_mm']
    try:
        refiner.PARAMETERS['maximum_edge_mm']=.25
        p,n,t,uv,faces=refiner.refine(p,n,t,uv,faces,'lid',edge_filter=lambda a,b: True)
    finally:refiner.PARAMETERS['maximum_edge_mm']=edge
    changed=move(p);columns=[]
    for axis in range(3):
        delta=np.zeros(3);delta[axis]=.0001
        columns.append((move(p+delta)-move(p-delta))/.0002)
    J=np.stack(columns,axis=2)
    n=np.linalg.solve(np.swapaxes(J,1,2),n[:,:,None])[:,:,0];n/=np.linalg.norm(n,axis=1)[:,None]
    mesh=bpy.data.meshes.new('Inspection rounded D-pad corners')
    mesh.from_pydata(changed.tolist(),[],faces.tolist());mesh.update()
    for poly in mesh.polygons:poly.use_smooth=True
    loops=np.array([loop.vertex_index for loop in mesh.loops]);uv[:,1]=1-uv[:,1]
    mesh.uv_layers.new(name='UVMap').data.foreach_set('uv',uv[loops].astype(np.float32).ravel())
    mesh.normals_split_custom_set_from_vertices(n.tolist())
    for material in old.materials:mesh.materials.append(material)
    report={'source':'silver-plastic-normals.glb','radius_estimate_mm':RADIUS,'triangles':len(faces),'maximum_move_mm':float(np.linalg.norm(changed-p,axis=1).max()),'minimum_jacobian':float(np.linalg.det(J).min()),'extent_delta_mm':(np.ptp(changed,axis=0)-np.ptp(p,axis=0)).tolist()}
    (FOLDER/'dpad-corner-trial.json').write_text(json.dumps(report,indent=2)+'\n')
    obj.data=mesh
    try:
        importlib.reload(renderer)
        renderer.VIEWS=[('dpad',-155,(-62,-50,140),(-62,-9,14),32,0)]
        renderer.main('dpad-corner-trial')
    finally:
        obj.data=old;bpy.data.meshes.remove(mesh)
    print(json.dumps(report))


if __name__=='__main__':main()
