"""Install inspected dark-plastic normal maps; preserve the source checkpoint."""
from pathlib import Path
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    assert Path(bpy.data.filepath).name == 'silver-screen-backings.blend'
    for name, part in [('Sourced graphite chassis', 'deck'), ('Sourced inner lid', 'lid')]:
        obj = bpy.data.objects[name]
        material = obj.active_material.copy()
        material.name = 'Sourced refined plastic '+part
        normal = next(n for n in material.node_tree.nodes if n.type == 'NORMAL_MAP')
        texture = normal.inputs['Color'].links[0].from_node
        image = bpy.data.images.load(str(FOLDER/f'derived-textures/plastic-normal-study-{part}.png'), check_existing=False)
        image.colorspace_settings.name = 'Non-Color'
        image.pack()
        texture.image = image
        obj.active_material = material
    root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
    root['plastic_normal_revision'] = 'Retain fine normal-map detail while attenuating broad variations on dark matte unpainted pixels. Radius 12px and retained broad fraction .25 are appearance estimates. Fully painted texels unchanged.'
    root['source_changes'] += ' Reduced broad normal-map undulations on dark matte inner lid and chassis; retained silver paint, geometry, controls and rig.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-plastic-normals.blend'))
    output = FOLDER/'silver-plastic-normals.glb'
    exporter.export_static(root, hinge, output, restore_frames=False, export_attributes=True)
    frames.restore_export_frames(output)


if __name__ == '__main__': main()
