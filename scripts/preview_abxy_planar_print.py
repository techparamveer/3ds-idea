"""Apply the print atlas to planar cap faces; retain source UVs for other maps."""
from pathlib import Path
import importlib
import bpy
import numpy as np
import render_sourced_dimensions as renderer

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
KEYS = 'ABXY'
SPAN = 7.2


def apply():
    originals = [(bpy.data.objects['Button_'+key], bpy.data.objects['Button_'+key].data) for key in KEYS]
    source = originals[0][0].active_material
    material = source.copy(); material.name = 'Sourced planar ABXY print'
    image = bpy.data.images.load(str(FOLDER/'derived-textures/abxy-planar-print.png'), check_existing=False)
    image.colorspace_settings.name = 'sRGB'
    node = next(n for n in material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and Path(n.image.filepath).name == 'abxy-fitted-basecolor.png')
    node.image = image
    uvnode = material.node_tree.nodes.new('ShaderNodeUVMap'); uvnode.uv_map = 'CapPrint'
    material.node_tree.links.new(uvnode.outputs['UV'], node.inputs['Vector'])
    for index, (obj, old) in enumerate(originals):
        mesh = old.copy(); obj.data = mesh
        mesh.materials.append(material)
        p = np.array([v.co[:] for v in mesh.vertices]); centre = (p[:, :2].min(axis=0)+p[:, :2].max(axis=0))/2
        coords = (p[:, :2]-centre)/SPAN+.5
        row, column = divmod(index, 2)
        coords = (coords+[column, 1-row])/2
        loops = np.array([l.vertex_index for l in mesh.loops])
        layer = mesh.uv_layers.new(name='CapPrint')
        layer.data.foreach_set('uv', coords[loops].astype(np.float32).ravel())
        mesh.uv_layers.active_index = 0; mesh.uv_layers[0].active_render = True
        top = p[:, 2].max()
        for poly in mesh.polygons:
            if all(p[i, 2]>top-1e-5 for i in poly.vertices): poly.material_index = len(mesh.materials)-1
    return originals, material, image


def main():
    originals, material, image = apply()
    try:
        importlib.reload(renderer)
        renderer.VIEWS = [('abxy', -155, (61, -45, 150), (61, 9, 14), 33, 0)]
        renderer.main('abxy-planar-print-trial')
    finally:
        for obj, original in originals:
            trial = obj.data; obj.data = original; bpy.data.meshes.remove(trial)
        bpy.data.materials.remove(material); bpy.data.images.remove(image)


if __name__ == '__main__': main()
