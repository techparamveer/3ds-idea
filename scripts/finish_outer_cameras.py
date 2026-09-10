"""Independent optical finish on the two sourced outer-camera inserts."""
from pathlib import Path
import bpy
import importlib
import render_sourced_dimensions as renderer
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main(trial=True, render=True):
    assert Path(bpy.data.filepath).name=='silver-camera-round.blend'
    objects=[bpy.data.objects[name] for name in ('Source_2_part_00','Source_2_part_01')]
    originals=[o.active_material for o in objects]
    mat=bpy.data.materials['Sourced inner camera optics'].copy()
    mat.name='Sourced outer camera optics'
    shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    link=shader.inputs['Base Color'].links[0];output=link.from_socket
    mat.node_tree.links.remove(link)
    multiply=mat.node_tree.nodes.new('ShaderNodeMix')
    multiply.data_type='RGBA';multiply.blend_type='MULTIPLY'
    multiply.inputs[0].default_value=1
    multiply.inputs[7].default_value=(.6,.6,.6,1)
    mat.node_tree.links.new(output,multiply.inputs[6])
    mat.node_tree.links.new(multiply.outputs[2],shader.inputs['Base Color'])
    layers=[]
    try:
        for obj in objects:
            p=[v.co for v in obj.data.vertices]
            cx=(min(v.x for v in p)+max(v.x for v in p))/2
            cy=(min(v.y for v in p)+max(v.y for v in p))/2
            radius=(max(v.x for v in p)-min(v.x for v in p))/2
            uv=obj.data.uv_layers.new(name='CameraOptics');layers.append((obj,uv))
            for loop in obj.data.loops:
                co=obj.data.vertices[loop.vertex_index].co
                uv.data[loop.index].uv=((co.x-cx)/(2*radius)+.5,(co.y-cy)/(2*radius)+.5)
            obj.active_material=mat
        importlib.reload(renderer)
        renderer.VIEWS=[('camera-left',0,(-18,-90,180),(-18,-40,21),18,0),('camera-right',0,(18,-90,180),(18,-40,21),18,0),('top',0,(0,0,300),(0,0,10),180,0),('rear',0,(35,250,135),(0,0,10),180,0)]
        if render:
            renderer.main('outer-camera-trial' if trial else 'outer-camera-after')
        if not trial:
            root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
            root['source_changes']+=' Separate opaque outer-camera optics with reference-fitted dark optical centres; source geometry preserved.'
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-outer-optics.blend'))
            exporter.export_static(root,hinge,FOLDER/'silver-outer-optics.glb',restore_frames=False,export_attributes=True)
            frames.restore_export_frames(FOLDER/'silver-outer-optics.glb')
    finally:
        if trial:
            for obj,original in zip(objects,originals):obj.active_material=original
            for obj,uv in layers:obj.data.uv_layers.remove(uv)
            bpy.data.materials.remove(mat)

if __name__=='__main__':main()
