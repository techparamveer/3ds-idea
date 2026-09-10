"""Probe every upper ABXY vertex against the closed sourced lid with a BVH."""
from pathlib import Path
import json
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def main():
    scene=bpy.context.scene;root=scene.objects['3DS_XL'];hinge=scene.objects['Hinge']
    frame=scene.frame_current
    saved=[(o,o.animation_data.action,o.matrix_basis.copy()) for o in (root,hinge)]
    try:
        for obj,_,_ in saved:obj.animation_data.action=None;obj.rotation_euler=(0,0,0)
        bpy.context.view_layer.update()
        points=[];faces=[]
        for obj in hinge.children_recursive:
            if obj.type!='MESH' or obj.get('console_replace_with_display'):continue
            start=len(points);points.extend(obj.matrix_world@v.co for v in obj.data.vertices)
            faces.extend(tuple(start+i for i in p.vertices) for p in obj.data.polygons)
        tree=BVHTree.FromPolygons(points,faces)
        report={}
        for name in ['Button_A','Button_B','Button_X','Button_Y']:
            obj=scene.objects[name];vertices=[obj.matrix_world@v.co for v in obj.data.vertices]
            top=max(v.z for v in vertices);gaps=[]
            for v in vertices:
                if v.z<top-.5:continue
                hit,_,_,_=tree.ray_cast(Vector((v.x,v.y,0)),Vector((0,0,1)),40)
                if hit is not None:gaps.append(hit.z-v.z)
            assert gaps and min(gaps)>.1,(name,min(gaps))
            report[name]={'upper_vertex_probes':len(gaps),'minimum_clearance_mm':min(gaps)}
        (Path(bpy.data.filepath).parent/'abxy-clearance-report.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report))
    finally:
        for obj,action,_ in saved:obj.animation_data.action=action
        scene.frame_set(frame)
        for obj,_,matrix in saved:obj.matrix_basis=matrix
        bpy.context.view_layer.update()

if __name__=='__main__':main()
