"""Render a temporary reference-matched pose without changing the saved rig."""
from pathlib import Path
import json,math,importlib
import bpy
from mathutils import Vector
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
    assert Path(bpy.data.filepath).name=='silver-upper-width.blend'
    report=json.loads((FOLDER/'reference-camera-fit.json').read_text());scene=bpy.context.scene;cam=scene.camera
    root,hinge=scene.objects['3DS_XL'],scene.objects['Hinge']
    matrices=[(o,o.matrix_basis.copy()) for o in [root,hinge]]
    old=(cam.data.shift_x,cam.data.shift_y,cam.data.sensor_width,cam.data.sensor_fit)
    hidden=[(o,o.hide_render) for o in scene.objects if o.get('console_replace_with_display')]
    temporary=[];mat=None
    try:
        width,height=report['reference_pixels'];cx,cy=report['principal_pixels']
        cam.data.sensor_width=36;cam.data.sensor_fit='HORIZONTAL';cam.data.shift_x=(width/2-cx)/width;cam.data.shift_y=(cy-height/2)/width
        importlib.reload(renderer)
        renderer.VIEWS=[('matched',-report['hinge_open_degrees'],report['camera_mm'],(report['camera_mm'][0],0,0),280,0)]
        renderer.main('reference-dark',resolution=(width,height),perspective_lens=report['lens_mm'])
        for o,_ in hidden:o.hide_render=True
        mat=bpy.data.materials.new('Reference diagnostic white LCD');mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear()
        out=nodes.new('ShaderNodeOutputMaterial');emit=nodes.new('ShaderNodeEmission');emit.inputs['Color'].default_value=(.8,.8,.8,1);mat.node_tree.links.new(emit.outputs[0],out.inputs['Surface'])
        for suffix in ['Top','Bottom']:
            anchor=scene.objects['DisplayAnchor_'+suffix];w,h=anchor['active_display_mm']
            mesh=bpy.data.meshes.new('Reference LCD footprint');mesh.from_pydata([(-w/2,-h/2,0),(w/2,-h/2,0),(w/2,h/2,0),(-w/2,h/2,0)],[],[(0,1,2,3)])
            o=bpy.data.objects.new('Reference LCD '+suffix,mesh);scene.collection.objects.link(o);o.parent=anchor;o.rotation_euler.x=math.pi/2 if suffix=='Bottom' else -math.pi/2;o.data.materials.append(mat);temporary.append(o)
        renderer.main('reference-lit',resolution=(width,height),perspective_lens=report['lens_mm'])
    finally:
        for o,hide in hidden:o.hide_render=hide
        for o in temporary:
            mesh=o.data;bpy.data.objects.remove(o,do_unlink=True);bpy.data.meshes.remove(mesh)
        if mat:bpy.data.materials.remove(mat)
        cam.data.shift_x,cam.data.shift_y,cam.data.sensor_width,cam.data.sensor_fit=old
        for o,m in matrices:o.matrix_basis=m
        importlib.reload(renderer);bpy.context.view_layer.update()
if __name__=='__main__':main()
