"""Measure visible glass, not its hidden backing, and render the live LCD footprint.

Run through Blender MCP with a sourced rig checkpoint open. Inspection only:
the temporary 180-degree pose is not an animation-range change. No blend/export
is saved and all temporary geometry, visibility and animation state is restored.
"""
from pathlib import Path
import json
import math
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import render_sourced_dimensions as render_views

FOLDER = Path(__file__).resolve().parents[1] / 'model/candidates/joshua-xl'


def tree_for(obj):
    mesh = obj.data
    mesh.calc_loop_triangles()
    return BVHTree.FromPolygons(
        [obj.matrix_world @ v.co for v in mesh.vertices],
        [tuple(t.vertices) for t in mesh.loop_triangles], all_triangles=True)


def runs(samples):
    result = []
    for position, name in samples:
        if not result or result[-1]['surface'] != name:
            result.append({'surface': name, 'start_mm': position, 'end_mm': position})
        else:
            result[-1]['end_mm'] = position
    return result


def main(prefix='front-audit'):
    scene = bpy.context.scene
    root, hinge = scene.objects['3DS_XL'], scene.objects['Hinge']
    assert root.get('console_layout'), 'This diagnostic requires sourced display anchors.'
    assert all(scene.objects.get(name) for name in ['Screen_Top', 'Screen_Bottom', 'DisplayAnchor_Top', 'DisplayAnchor_Bottom'])
    frame = scene.frame_current
    actions = [(o, o.animation_data.action) for o in (root, hinge)]
    matrices = [(o, o.matrix_basis.copy()) for o in (root, hinge)]
    limits = [(c, c.mute) for c in hinge.constraints if c.type == 'LIMIT_ROTATION']
    replaced = [(o, o.hide_render) for o in scene.objects
                if o.get('console_replace_with_display')]
    temporary = []
    material = None
    old_views = render_views.VIEWS
    try:
        for obj, _ in actions:
            obj.animation_data.action = None
        root.rotation_euler = (0, 0, 0)
        hinge.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        report = {'source': bpy.data.filepath, 'step_mm': .05,
                  'method': 'Closest triangle intersection at glass centre lines; hidden backing excluded.',
                  'screens': {}}
        for suffix, parent, direction, origin_z in [
                ('Top', hinge, Vector((0, 0, 1)), 13),
                ('Bottom', scene.objects['Base'], Vector((0, 0, -1)), 30)]:
            glass = scene.objects['Screen_' + suffix]
            anchor = scene.objects['DisplayAnchor_' + suffix]
            center = anchor.matrix_world.translation.copy()
            trees = [(o.name, tree_for(o)) for o in parent.children_recursive
                     if o.type == 'MESH' and not o.get('console_replace_with_display')]
            cuts = {}
            for axis, label, radius in [(0, 'horizontal', 65), (1, 'vertical', 41)]:
                samples = []
                for n in range(round(2 * radius / .05) + 1):
                    offset = -radius + n * .05
                    start = center.copy()
                    start[axis] += offset
                    start.z = origin_z
                    hits = []
                    for name, tree in trees:
                        location, _, _, distance = tree.ray_cast(start, direction, 30)
                        if location is not None:
                            hits.append((distance, name))
                    samples.append((round(offset, 4), min(hits)[1] if hits else None))
                cuts[label] = runs(samples)
            vertices = [glass.matrix_world @ v.co for v in glass.data.vertices]
            report['screens'][suffix.lower()] = {
                'anchor_closed_mm': list(center),
                'active_mm': list(anchor['active_display_mm']),
                'backing_glass_mm': [max(v[i] for v in vertices) - min(v[i] for v in vertices) for i in (0, 1)],
                'visible_surface_runs': cuts}
        report_name = 'front-aperture-audit' if prefix == 'front-audit' else prefix+'-aperture'
        (FOLDER / (report_name+'.json')).write_text(json.dumps(report, indent=2) + '\n')
        for obj, _ in replaced:
            obj.hide_render = True
        material = bpy.data.materials.new('Inspection white active LCD')
        material.use_nodes = True
        nodes = material.node_tree.nodes
        nodes.clear()
        output = nodes.new('ShaderNodeOutputMaterial')
        emission = nodes.new('ShaderNodeEmission')
        emission.inputs['Color'].default_value = (.8, .8, .8, 1)
        material.node_tree.links.new(emission.outputs[0], output.inputs['Surface'])
        for suffix in ('Top', 'Bottom'):
            anchor = scene.objects['DisplayAnchor_' + suffix]
            width, height = anchor['active_display_mm']
            mesh = bpy.data.meshes.new('Inspection LCD footprint')
            mesh.from_pydata([(-width/2, -height/2, 0), (width/2, -height/2, 0),
                              (width/2, height/2, 0), (-width/2, height/2, 0)], [], [(0, 1, 2, 3)])
            obj = bpy.data.objects.new('Inspection LCD ' + suffix, mesh)
            scene.collection.objects.link(obj)
            obj.parent = anchor
            # The source pipeline authors these empty rotations for glTF's
            # Y-up convention. A native Blender XY mesh needs the inverse
            # quarter turn to lie on the physical glass in this Z-up scene.
            obj.rotation_euler.x = math.pi / 2 if suffix == 'Bottom' else -math.pi / 2
            obj.data.materials.append(material)
            temporary.append(obj)
        # render_views temporarily clears and restores actions itself.
        for obj, action in actions:
            obj.animation_data.action = action
        render_views.VIEWS = [
            ('planar', -180, (0, 38, 300), (0, 38, 0), 280, 0),
            ('live-front', -155, (0, -260, 250), (0, 8, 35), 235, 0),
        ]
        for constraint, _ in limits:
            constraint.mute = True
        render_views.main(prefix)
        print(json.dumps(report))
    finally:
        render_views.VIEWS = old_views
        for constraint, muted in limits:
            constraint.mute = muted
        for obj in temporary:
            mesh = obj.data
            bpy.data.objects.remove(obj, do_unlink=True)
            bpy.data.meshes.remove(mesh)
        if material:
            bpy.data.materials.remove(material)
        for obj, hidden in replaced:
            obj.hide_render = hidden
        for obj, action in actions:
            obj.animation_data.action = action
        scene.frame_set(frame)
        for obj, matrix in matrices:
            obj.matrix_basis = matrix
        bpy.context.view_layer.update()


if __name__ == '__main__':
    main()
