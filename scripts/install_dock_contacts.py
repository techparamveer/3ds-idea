"""Install the inspected colour map on the two sourced docking contacts only."""
from pathlib import Path
import json
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    assert Path(bpy.data.filepath).name == 'silver-lower-keys.blend'
    objects = [bpy.data.objects[name] for name in ['Source_0_part_55', 'Source_0_part_56']]
    source = objects[0].active_material
    assert all(o.active_material == source for o in objects)
    material = source.copy(); material.name = 'Sourced gold docking contacts'
    image = bpy.data.images.load(str(FOLDER/'derived-textures/dock-contact-basecolor.png'), check_existing=False)
    image.colorspace_settings.name = 'sRGB'; image.pack()
    node = next(n for n in material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and Path(n.image.filepath).name == 'body-etched-basecolor.png')
    node.image = image
    for obj in objects: obj.active_material = material
    root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
    root['dock_contact_colour'] = json.dumps(json.loads((FOLDER/'dock-contact-colour-report.json').read_text()))
    root['source_changes'] += ' Corrected two rear docking-contact reflectance colours using an authored gold reference while retaining normal/roughness maps and geometry.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-dock-contacts.blend'))
    output = FOLDER/'silver-dock-contacts.glb'
    exporter.export_static(root, hinge, output, restore_frames=False, export_attributes=True)
    frames.restore_export_frames(output)


if __name__ == '__main__': main()
