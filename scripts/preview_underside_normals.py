"""Reversible underside normal-map diagnostic; never saves the production rig."""
from pathlib import Path
import bpy
import render_sourced_dimensions as render


def main():
    assert Path(bpy.data.filepath).name == 'silver-lower-labels.blend'
    material = bpy.data.objects['Sourced graphite chassis'].data.materials[0]
    normals = [n for n in material.node_tree.nodes if n.type == 'NORMAL_MAP']
    strengths = [(n, n.inputs['Strength'].default_value) for n in normals]
    chassis = bpy.data.objects['Sourced graphite chassis']
    original_mesh = chassis.data
    trial_mesh = None
    clay = None
    try:
        render.main('underside-normal-current', only=['underside'], resolution=(1200, 900))
        for node, _ in strengths:
            node.inputs['Strength'].default_value = 0
        render.main('underside-normal-disabled', only=['underside'], resolution=(1200, 900))
        trial_mesh = original_mesh.copy()
        chassis.data = trial_mesh
        trial_mesh.normals_split_custom_set([(0, 0, 0)] * len(trial_mesh.loops))
        render.main('underside-normal-geometric', only=['underside'], resolution=(1200, 900))
        clay = bpy.data.materials.new('Temporary underside geometry diagnostic')
        clay.use_nodes = True
        bsdf = clay.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.35, 0.35, 0.35, 1)
        bsdf.inputs['Roughness'].default_value = 0.4
        trial_mesh.materials[0] = clay
        render.main('underside-untextured-geometry', only=['underside'], resolution=(1200, 900))
    finally:
        chassis.data = original_mesh
        if trial_mesh is not None:
            bpy.data.meshes.remove(trial_mesh)
        if clay is not None:
            bpy.data.materials.remove(clay)
        for node, strength in strengths:
            node.inputs['Strength'].default_value = strength


if __name__ == '__main__':
    main()
