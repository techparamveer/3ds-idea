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
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 72
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


eye = logo('Extruded original eye', contours['Eye_Mark'], (722.36974,1641.28177,243.70607,852.87366), -2.15, 1.24, green, 0.075)
word = logo('Extruded original wordmark', contours['NVIDIA'], (642.64727,1864.07388,960.3779,1189.31953), -0.70, 2.85, dark, 0.14)
# Bright front caps and dark, deep sides stay legible on the light LCD.
word.data.bevel_depth = 0.015
word_front = material('Silver white wordmark faces', tuple(srgb(v) for v in (245,248,250)), 0.12, 0.30)
bpy.ops.object.select_all(action='DESELECT')
word.select_set(True)
bpy.context.view_layer.objects.active = word
bpy.ops.object.convert(target='MESH')
word.data.materials.append(word_front)
for polygon in word.data.polygons:
    polygon.material_index = 1 if polygon.normal.z > 0.95 else 0
word.rotation_euler = (0.24,-0.14,0)


# The reference square is about one fifth of the completed logo width.
# Prepend a full spin, then replay the measured screen-space reference motion.
bpy.ops.mesh.primitive_cube_add(size=1)
cube = bpy.context.object
cube.name = 'Transforming green box'
cube_mat = green.copy()
cube_mat.name = 'Box green'
cube.data.materials.append(cube_mat)

edge_mat = material('Pale green box edges', tuple(srgb(v) for v in (183,219,106)), 0.0, 0.6)
edge_curve = bpy.data.curves.new('Twelve fine box edges', 'CURVE')
edge_curve.dimensions = '3D'
edge_curve.bevel_depth = 0.008
edge_curve.bevel_resolution = 0
for axis in range(3):
    other = [n for n in range(3) if n != axis]
    for a in (-0.5,0.5):
        for b in (-0.5,0.5):
            spline = edge_curve.splines.new('POLY')
            spline.points.add(1)
            for point, value in zip(spline.points, (-0.5,0.5)):
                coords = [0.0,0.0,0.0]
                coords[axis], coords[other[0]], coords[other[1]] = value,a,b
                point.co = (*coords,1)
edges = bpy.data.objects.new('Fine luminous cube outline',edge_curve)
scene.collection.objects.link(edges)
edges.parent = cube
edge_curve.materials.append(edge_mat)
for frame, size in [(1,1),(25,1),(34,0.001),(72,0.001)]:
    edges.scale = (size,size,size)
    edges.keyframe_insert('scale',frame=frame)

turn = -2 * math.pi
poses = [
    (1,(0.09,0,0),(.86,.86,.86),(.22,-.45,0)),
    (7,(0.09,0,0),(.86,.86,.86),(.22,turn*.25-.45,0)),
    (13,(0.09,0,0),(.86,.86,.86),(.22,turn*.50-.45,0)),
    (19,(0.09,0,0),(.86,.86,.86),(.22,turn*.75-.45,0)),
    (25,(0.09,0,0),(.86,.86,.86),(.16,turn-.35,0)),
    (34,(0.09,0,.1),(.86,.86,.08),(0,turn,0)),
    (40,(0.09,0,.1),(.86,.86,.08),(0,turn,0)),
    (43,(0.09,0,.1),(.86,.86,.08),(0,turn,0)),
    (46,(-.032,0,.1),(.86,.86,.08),(0,turn,0)),
    (49,(-.242,0,.1),(.86,.86,.08),(0,turn,0)),
    (52,(-.706,0,.1),(.86,.86,.08),(0,turn,0)),
    (55,(-1.128,0,.1),(.80,.83,.08),(0,turn,0)),
    (58,(-1.275,0,.1),(.777,.822,.08),(0,turn,0)),
    (61,(-1.298,0,.1),(.777,.822,.08),(0,turn,0)),
    (72,(-1.298,0,.1),(.777,.822,.08),(0,turn,0)),
]
for f, loc, scale, rot in poses:
    cube.location, cube.scale, cube.rotation_euler = loc, scale, rot
    for path in ('location','scale','rotation_euler'):
        cube.keyframe_insert(data_path=path,frame=f)

# Geometry stays extruded while a transparent material reveals the lettering.
def reveal(mat, values, operation, axis="X"):
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
    links.new(xyz.outputs[axis], compare.inputs[0])
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
# The word moves right as the cube moves left. Coordinates follow video frames
# 15..36, shifted by the 24-frame opening spin; no reverse keys exist.
reveal(dark, [(1,.60),(40,.60),(43,.53),(46,.40),(49,.20),(52,-.26),(55,-.59),(58,-.86),(61,-.91),(72,-.91)], 'LESS_THAN')
reveal(word_front, [(1,.60),(40,.60),(43,.53),(46,.40),(49,.20),(52,-.26),(55,-.59),(58,-.86),(61,-.91),(72,-.91)], 'LESS_THAN')
for frame, right in [(1,.60),(40,.61),(43,1.075),(46,1.433),(49,1.707),(52,1.897),(55,2.044),(58,2.129),(61,2.15),(72,2.15)]:
    word.location.x = right - 2.85
    word.keyframe_insert('location',frame=frame)
# The eye opens upward out of the square, starting with the lower sweep.
reveal(eye_mat, [(1,-.7),(51,-.7),(54,-.24),(58,.26),(61,.6),(72,.6)], 'GREATER_THAN', 'Y')
reveal(cube_mat, [(1,-.7),(51,-.7),(54,-.24),(58,.26),(61,.6),(72,.6)], 'LESS_THAN', 'Y')

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

for frame, name in [(1,'Opening full spin'),(25,'Reference begins'),(34,'Face on'),(43,'Word reveal'),(61,'Logo complete'),(72,'Hold indefinitely')]:
    scene.timeline_markers.new(name, frame=frame)
scene['adaptation'] = 'User-requested portfolio artwork. Not native Nintendo firmware.'
scene['reference'] = 'User video.mp4: green box turns face-on, slides left, reveals NVIDIA eye and wordmark.'
scene['delivery'] = '72 transparent 180x148 frames at 30fps; play once, hold frame 72.'
scene.render.filepath = str(output / 'frame-')
scene.frame_set(72)
# Leave a camera view available for opening the editable source.
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        area.spaces.active.region_3d.view_perspective = 'CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'assets/blender/nvidia-transform.blend'))
print('NVIDIA scene ready:', bpy.data.filepath)
