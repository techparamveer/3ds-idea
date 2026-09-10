"""Preview the two existing gold contact meshes with corrected reflectance."""
from pathlib import Path
import importlib
import bpy
import render_sourced_dimensions as renderer

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    objects = [bpy.data.objects[name] for name in ['Source_0_part_55', 'Source_0_part_56']]
    source = objects[0].active_material
    assert all(o.active_material == source for o in objects)
    material = source.copy(); material.name = 'Sourced gold contact trial'
    image = bpy.data.images.load(str(FOLDER/'derived-textures/dock-contact-basecolor.png'), check_existing=False)
    image.colorspace_settings.name = 'sRGB'
    try:
        node = next(n for n in material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and Path(n.image.filepath).name == 'body-etched-basecolor.png')
        node.image = image
        for obj in objects: obj.active_material = material
        importlib.reload(renderer)
        renderer.VIEWS = [('charging', 0, (35, 200, 65), (35, 46, 9), 45, 0)]
        renderer.main('rear-contact-textured-trial')
    finally:
        for obj in objects: obj.active_material = source
        bpy.data.materials.remove(material); bpy.data.images.remove(image)


if __name__ == '__main__': main()
