"""Run in Blender via MCP with ROOT and OUTPUT set to absolute paths.
The SVG contours preserve the repository's original NVIDIA artwork.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

root = Path(ROOT)
output = Path(OUTPUT)
output.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes.new('NVIDIA box to logo')
bpy.context.window.scene = scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 180
scene.render.resolution_y = 148
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 96
scene.world = bpy.data.worlds.new('NVIDIA studio')
scene.world.use_nodes = True
background = next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND')
background.inputs['Color'].default_value = (0.7, 0.75, 0.8, 1)
background.inputs['Strength'].default_value = 0.5
try:
    scene.view_settings.view_transform = 'Standard'
except TypeError:
    pass
scene.render.image_settings.color_depth = '8'


def material(name, color, metallic=0.0, roughness=0.38):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    mat.diffuse_color = (*color, 1)
    return mat


def srgb(v):
    return ((v / 255 + 0.055) / 1.055) ** 2.4 if v > 10 else v / 3294.6


green = material('NVIDIA green enamel', tuple(srgb(v) for v in (118,185,0)), 0.08)
dark = material('Graphite wordmark', tuple(srgb(v) for v in (49,55,63)), 0.04)
contours = json.loads((root / 'scripts/blender/nvidia-logo-contours.json').read_text())['paths']


def logo(name, paths, bounds, x, width, mat, depth):
    xmin, xmax, ymin, ymax = bounds
    scale = width / (xmax - xmin)
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '2D'
    curve.fill_mode = 'BOTH'
    curve.resolution_u = 1
    curve.extrude = depth
    curve.bevel_depth = 0.006
    curve.bevel_resolution = 1
    for points in paths:
        spline = curve.splines.new('POLY')
        spline.points.add(len(points) - 1)
        for p, (px, py) in zip(spline.points, points):
            p.co = ((px - xmin) * scale, ((ymin + ymax) / 2 - py) * scale, 0, 1)
        spline.use_cyclic_u = True
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    obj.location.x = x
    obj.data.materials.append(mat)
    return obj


eye = logo('Extruded original eye', contours['Eye_Mark'], (722.36974,1641.28177,243.70607,852.87366), -2.15, 1.45, green, 0.075)
word = logo('Extruded original wordmark', contours['NVIDIA'], (642.64727,1864.07388,960.3779,1189.31953), -0.46, 2.60, dark, 0.045)

# A green cube turns face-on, flattens, and wipes into the eye from left to right.
bpy.ops.mesh.primitive_cube_add(size=1)
cube = bpy.context.object
cube.name = 'Transforming green box'
cube.data.materials.append(green)
bevel = cube.modifiers.new('Small machined edge', 'BEVEL')
bevel.width = 0.025
bevel.segments = 1

poses = [
    (1, (0,0,0), (1.38,1.38,1.38), (0.24,-0.46,-0.025)),
    (10, (0,0,0), (1.38,1.38,1.38), (0.08,-0.16,0)),
    (18, (0,0,0.10), (1.15,1.15,0.35), (0,0,0)),
    (30, (-0.82,0,0.14), (0.91,0.96,0.16), (0,0,0)),
    (36, (-1.155,0,0.15), (0.91,0.96,0.12), (0,0,0)),
    (47, (-0.70,0,0.15), (0.001,0.96,0.06), (0,0,0)),
    (68, (-0.70,0,0.15), (0.001,0.96,0.06), (0,0,0)),
    (78, (-1.155,0,0.15), (0.91,0.96,0.12), (0,0,0)),
    (86, (0,0,0.10), (1.15,1.15,0.35), (0,0,0)),
    (97, (0,0,0), (1.38,1.38,1.38), (0.24,-0.46,-0.025)),
]
for f, loc, scale, rot in poses:
    cube.location, cube.scale, cube.rotation_euler = loc, scale, rot
    for path in ('location', 'scale', 'rotation_euler'):
        cube.keyframe_insert(data_path=path, frame=f)

# Geometry stays extruded while a transparent material reveals the lettering.
def reveal(mat, values, operation):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    out = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
    pos = nodes.new('ShaderNodeNewGeometry')
    xyz = nodes.new('ShaderNodeSeparateXYZ')
    threshold = nodes.new('ShaderNodeValue')
    threshold.label = 'Animated horizontal reveal'
    compare = nodes.new('ShaderNodeMath')
    compare.operation = operation
    clear = nodes.new('ShaderNodeBsdfTransparent')
    mix = nodes.new('ShaderNodeMixShader')
    links.new(pos.outputs['Position'], xyz.inputs[0])
    links.new(xyz.outputs['X'], compare.inputs[0])
    links.new(threshold.outputs[0], compare.inputs[1])
    links.new(compare.outputs[0], mix.inputs[0])
    links.new(bsdf.outputs[0], mix.inputs[1])
    links.new(clear.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], out.inputs['Surface'])
    for frame, value in values:
        threshold.outputs[0].default_value = value
        threshold.outputs[0].keyframe_insert('default_value', frame=frame)

# Eye uses its own green so the cube remains solid.
eye_mat = green.copy()
eye_mat.name = 'Eye enamel reveal'
eye.data.materials[0] = eye_mat
reveal(dark, [(1,0.70),(18,0.70),(30,-0.365),(36,-0.70),(68,-0.70),(78,-0.70),(86,0.70),(97,0.70)], 'LESS_THAN')
# The word emerges directly beside the moving box, preserving the reference's spacing.
for frame, x in [(1,-2.2),(18,-2.2),(30,-1.0),(38,-0.46),(68,-0.46),(78,-1.0),(86,-2.2),(97,-2.2)]:
    word.location.x = x
    word.keyframe_insert('location', frame=frame)
reveal(eye_mat, [(1,-2.3),(32,-2.3),(47,-0.6),(68,-0.6),(78,-2.3),(97,-2.3)], 'GREATER_THAN')

camera_data = bpy.data.cameras.new('Banner orthographic camera')
camera = bpy.data.objects.new('Banner orthographic camera', camera_data)
scene.collection.objects.link(camera)
camera.location = (0,0,8)
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 5.0
scene.camera = camera

for name, loc, energy, size in [
    ('Large soft key', (-3,4,6), 280, 4),
    ('Cool fill', (3,1,4), 90, 3),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.shape, data.size = energy, 'DISK', size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (Vector((0,0,0)) - obj.location).to_track_quat('-Z','Y').to_euler()

for frame, name in [(1,'Box'),(18,'Face on'),(36,'Word reveal'),(52,'Logo hold'),(78,'Return')]:
    scene.timeline_markers.new(name, frame=frame)
scene['adaptation'] = 'User-requested portfolio artwork. Not native Nintendo firmware.'
scene['reference'] = 'User video.mp4: green box turns face-on, slides left, reveals NVIDIA eye and wordmark.'
scene['delivery'] = '96 transparent 180x148 frames at 24fps; frame 97 equals frame 1.'
scene.render.filepath = str(output / 'frame-')
scene.frame_set(52)
# Leave a camera view available for opening the editable source.
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        area.spaces.active.region_3d.view_perspective = 'CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'assets/blender/nvidia-transform.blend'))
print('NVIDIA scene ready:', bpy.data.filepath)
