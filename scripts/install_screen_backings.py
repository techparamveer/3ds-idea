"""Replace the unrelated shell atlas bindings on the two screen backings."""
from pathlib import Path
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    assert Path(bpy.data.filepath).name == 'silver-abxy-print.blend'
    for name, roughness in [('Screen_Top', .18), ('Screen_Bottom', .26)]:
        material = bpy.data.materials.new('Sourced '+name.replace('_', ' ').lower()+' backing')
        material.use_nodes = True
        material.diffuse_color = (0, 0, 0, 1)
        shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        shader.inputs['Base Color'].default_value = (0, 0, 0, 1)
        shader.inputs['Roughness'].default_value = roughness
        shader.inputs['Metallic'].default_value = 0
        shader.inputs['Specular IOR Level'].default_value = .3338637053966522
        shader.inputs['Alpha'].default_value = 1
        material['console_material_role'] = 'screen-backing'
        bpy.data.objects[name].active_material = material
    root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
    root['screen_backing_revision'] = 'Opaque black dielectric backing; removed mismatched shell-atlas AO/roughness. Upper roughness .18 and lower .26 are authored appearance estimates, not measured optics.'
    root['source_changes'] += ' Removed unrelated shell-atlas patterns from both screen backings and made their backing opaque. Retained display anchors, geometry and all non-screen materials.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-screen-backings.blend'))
    output = FOLDER/'silver-screen-backings.glb'
    exporter.export_static(root, hinge, output, restore_frames=False, export_attributes=True)
    frames.restore_export_frames(output)


if __name__ == '__main__': main()
