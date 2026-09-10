"""Reversible close-up of the source power LED with a blue emission map."""
from pathlib import Path
import importlib
import bpy
import render_sourced_dimensions as renderer

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    obj = bpy.data.objects['Source_0_part_51']
    source = obj.active_material
    material = source.copy(); material.name = 'Sourced blue power indicator trial'
    image = bpy.data.images.load(str(FOLDER/'derived-textures/indicator-blue-emissive.png'), check_existing=False)
    image.colorspace_settings.name = 'sRGB'
    try:
        material.node_tree.nodes['Image Texture'].image = image
        next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Emission Strength'].default_value = .8
        obj.active_material = material
        importlib.reload(renderer)
        renderer.VIEWS = [('indicators', -155, (57, -150, 85), (57, -44, 12), 30, 0)]
        renderer.main('indicator-blue-trial', resolution=(1000, 750))
    finally:
        obj.active_material = source
        bpy.data.materials.remove(material); bpy.data.images.remove(image)


if __name__ == '__main__': main()
