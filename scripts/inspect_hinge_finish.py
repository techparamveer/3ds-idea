"""Compare the source hinge roughness without altering the inner screen surround."""
from pathlib import Path
import bpy
import importlib
import render_sourced_dimensions as renderer

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def export_uv():
    import numpy as np
    mesh=bpy.data.objects['Sourced inner lid'].data;mesh.calc_loop_triangles()
    np.savez(FOLDER.parents[2]/'.local/hinge-uv-data.npz',
             points=np.array([v.co[:] for v in mesh.vertices]),
             faces=np.array([t.vertices[:] for t in mesh.loop_triangles]),
             uv=np.array([[mesh.uv_layers[0].data[i].uv[:] for i in t.loops] for t in mesh.loop_triangles]))

def main():
    obj=bpy.data.objects['Sourced inner lid'];mesh=obj.data
    indices=[p.material_index for p in mesh.polygons]
    original=obj.active_material;trial=original.copy();trial.name='Hinge source roughness trial'
    image=None
    try:
        for node in trial.node_tree.nodes:
            if node.type=='TEX_IMAGE' and node.image and Path(node.image.filepath).name=='body-graphite-metallic-roughness.png':
                image=bpy.data.images.load(str(FOLDER/'derived-textures/body-legends-metallic-roughness.png'),check_existing=False)
                image.colorspace_settings.name='Non-Color';node.image=image
        assert image is not None
        slot=len(mesh.materials);mesh.materials.append(trial)
        selected=0
        for p in mesh.polygons:
            if all(mesh.vertices[i].co.y>-6.4 for i in p.vertices):p.material_index=slot;selected+=1
        print('Trial faces',selected)
        importlib.reload(renderer)
        renderer.main('hinge-source-roughness-trial',only={'front','rear','top'})
    finally:
        for p,index in zip(mesh.polygons,indices):p.material_index=index
        if trial.name in mesh.materials:mesh.materials.pop(index=len(mesh.materials)-1)
        bpy.data.materials.remove(trial)
        if image:bpy.data.images.remove(image)

if __name__=='__main__':main()
