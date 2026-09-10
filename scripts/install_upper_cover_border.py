"""Install the inspected upper cover border with preserved source UVs."""
from pathlib import Path
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main():
    assert Path(bpy.data.filepath).name=='silver-dpad-finish.blend'
    obj=bpy.data.objects['Screen_Top'];obj.data=obj.data.copy();mesh=obj.data
    xs=[v.co.x for v in mesh.vertices];ys=[v.co.y for v in mesh.vertices]
    uv=mesh.uv_layers.new(name='CoverBorder')
    for loop in mesh.loops:
        p=mesh.vertices[loop.vertex_index].co
        uv.data[loop.index].uv=((p.x-min(xs))/(max(xs)-min(xs)),(p.y-min(ys))/(max(ys)-min(ys)))
    mesh.uv_layers.active_index=0;mesh.uv_layers[0].active_render=True
    material=obj.active_material.copy();material.name='Sourced upper cover and LCD edge';obj.active_material=material
    nodes,links=material.node_tree.nodes,material.node_tree.links
    shader=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    mapping=nodes.new('ShaderNodeUVMap');mapping.uv_map='CoverBorder'
    for name in ['colour','metallic-roughness']:
        image=bpy.data.images.load(str(FOLDER/f'derived-textures/upper-cover-{name}.png'),check_existing=False)
        image.colorspace_settings.name='sRGB' if name=='colour' else 'Non-Color';image.pack()
        texture=nodes.new('ShaderNodeTexImage');texture.image=image;links.new(mapping.outputs['UV'],texture.inputs['Vector'])
        if name=='colour':
            shader.inputs['Base Color'].default_value=(1,1,1,1);links.new(texture.outputs['Color'],shader.inputs['Base Color'])
        else:
            separate=nodes.new('ShaderNodeSeparateColor');links.new(texture.outputs['Color'],separate.inputs[0]);links.new(separate.outputs['Green'],shader.inputs['Roughness'])
    root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
    root['upper_cover_border']='Matte cover border within existing aperture; narrow 107x64.6mm black rectangle around 106.2x63.72mm LCD. Photographic fit, no thickness claim. Source UVs retained; added CoverBorder UV.'
    root['source_changes']+=' Separated upper cover border from the narrow dark LCD edge using exportable colour/roughness maps, without changing the opening or geometry.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-upper-cover.blend'))
    output=FOLDER/'silver-upper-cover.glb';exporter.export_static(root,hinge,output,restore_frames=False,export_attributes=True);frames.restore_export_frames(output)

if __name__=='__main__':main()
