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
scene.render.fps_base = 1.001
scene.frame_start = 1
scene.frame_end = 80
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

# The original green cube spins, faces the screen and is carved into the eye.
bpy.ops.mesh.primitive_cube_add(size=1)
cube = bpy.context.object
cube.name = 'Transforming green box'
cube.data.materials.append(green)
bevel = cube.modifiers.new('Small machined edge', 'BEVEL')
bevel.width = 0.025
bevel.segments = 1

turn = -2 * math.pi
poses = [
    (1,(0,0,0),(1.38,1.38,1.38),(.24,-.46,-.025)),
    (7,(0,0,0),(1.38,1.38,1.38),(.24,turn*.25-.46,-.025)),
    (13,(0,0,0),(1.38,1.38,1.38),(.24,turn*.5-.46,-.025)),
    (19,(0,0,0),(1.38,1.38,1.38),(.24,turn*.75-.46,-.025)),
    (25,(0,0,0),(1.38,1.38,1.38),(.24,turn-.46,-.025)),
    (34,(0,0,0),(.91,.96,.15),(0,turn,0)),
    (40,(0,0,0),(.91,.96,.15),(0,turn,0)),
    (43,(0,0,0),(.91,.96,.15),(0,turn,0)),
    (46,(-.102,0,0),(.91,.96,.15),(0,turn,0)),
    (49,(-.276,0,0),(.91,.96,.15),(0,turn,0)),
    (52,(-.662,0,0),(.91,.96,.15),(0,turn,0)),
    (55,(-1.013,0,0),(.91,.96,.15),(0,turn,0)),
    (58,(-1.137,0,0),(.91,.96,.15),(0,turn,0)),
    (61,(-1.155,0,0),(.91,.96,.15),(0,turn,0)),
    (80,(-1.155,0,0),(.91,.96,.15),(0,turn,0)),
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

# Preserve the first artwork, materials and final framing. The square moves
# left while the word emerges to the right, as in the supplied clip.
word_poses = [(1,.455),(40,.455),(43,.80),(46,1.18),(49,1.51),(52,1.80),(55,2.0),(58,2.12),(61,2.14),(80,2.14)]
for frame,right in word_poses:
    word.location.x = right-2.60
    word.keyframe_insert('location',frame=frame)
reveal(dark,[(f,loc[0]+.455) for f,loc,scale,rot in poses], 'LESS_THAN')
# The eye follows the square while its spiral eats through the face.
for f,loc,scale,rot in poses:
    eye.location = (-2.15+loc[0]+1.155,0,.001 if f<80 else 0)
    eye.keyframe_insert('location',frame=f)
for frame,hidden in [(1,True),(52,False)]:
    eye.hide_render=hidden;eye.hide_viewport=hidden
    eye.keyframe_insert('hide_render',frame=frame)
    eye.keyframe_insert('hide_viewport',frame=frame)
for frame,hidden in [(1,False),(72,True)]:
    cube.hide_render=hidden;cube.hide_viewport=hidden
    cube.keyframe_insert('hide_render',frame=frame)
    cube.keyframe_insert('hide_viewport',frame=frame)
field = bpy.data.images.load(str(root/'scripts/blender/nvidia-carve-field.png'),check_existing=False)
field.colorspace_settings.name='Non-Color'
field.pack()
eye_mat = green.copy()
eye_mat.name = 'Original eye enamel with spiral reveal'
eye.data.materials[0]=eye_mat
# R is distance along the spiral, G marks cuts in the box, B marks the stroke
# outside the box. Both objects use the eye's local coordinates, so the carve
# stays attached while the square slides. The final eye mesh is unchanged.
def carve(mat, outer):
    nodes,links=mat.node_tree.nodes,mat.node_tree.links
    bsdf=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    out=next(n for n in nodes if n.type=='OUTPUT_MATERIAL')
    coords=nodes.new('ShaderNodeTexCoord');coords.object=eye
    mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY_ADD'
    mapping.inputs[1].default_value=(1/1.45,1/(1.45*(852.87366-243.70607)/(1641.28177-722.36974)),0)
    mapping.inputs[2].default_value=(0,.5,0)
    texture=nodes.new('ShaderNodeTexImage');texture.image=field;texture.interpolation='Closest'
    channels=nodes.new('ShaderNodeSeparateColor')
    progress=nodes.new('ShaderNodeValue');progress.label='Reference outer sweep then inward curl'
    compare=nodes.new('ShaderNodeMath');compare.operation='GREATER_THAN' if outer else 'LESS_THAN'
    region=nodes.new('ShaderNodeMath');region.operation='MULTIPLY'
    clear=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader')
    links.new(coords.outputs['Object'],mapping.inputs[0]);links.new(mapping.outputs[0],texture.inputs['Vector'])
    links.new(texture.outputs['Color'],channels.inputs[0])
    links.new(channels.outputs['Red'],compare.inputs[0]);links.new(progress.outputs[0],compare.inputs[1])
    links.new(compare.outputs[0],region.inputs[0]);links.new(channels.outputs['Blue' if outer else 'Green'],region.inputs[1])
    if outer:
        # The box supplies the uncut face until completion. Showing the full eye
        # on top early would emboss its bevels into the still-solid square.
        inside=nodes.new('ShaderNodeMath');inside.operation='SUBTRACT';inside.inputs[0].default_value=1
        unfinished=nodes.new('ShaderNodeMath');unfinished.operation='LESS_THAN';unfinished.inputs[1].default_value=1
        hide_inside=nodes.new('ShaderNodeMath');hide_inside.operation='MULTIPLY'
        combined=nodes.new('ShaderNodeMath');combined.operation='ADD'
        links.new(channels.outputs['Blue'],inside.inputs[1]);links.new(progress.outputs[0],unfinished.inputs[0])
        links.new(inside.outputs[0],hide_inside.inputs[0]);links.new(unfinished.outputs[0],hide_inside.inputs[1])
        links.new(region.outputs[0],combined.inputs[0]);links.new(hide_inside.outputs[0],combined.inputs[1])
        links.new(combined.outputs[0],mix.inputs[0])
    else:
        links.new(region.outputs[0],mix.inputs[0])
    links.new(bsdf.outputs[0],mix.inputs[1]);links.new(clear.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
    for frame,value in [(1,-.01),(52,-.01),(53,.015),(54,.215),(55,.31),(56,.39),(57,.51),(58,.56),(59,.62),(60,.68),(61,.75),(62,.79),(63,.815),(64,.84),(65,.87),(66,.90),(67,.925),(68,.945),(69,.97),(70,.985),(72,1.01),(80,1.01)]:
        progress.outputs[0].default_value=value
        progress.outputs[0].keyframe_insert('default_value',frame=frame)
carve(green,False)
carve(eye_mat,True)

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

for frame,name in [(1,'Full cube spin'),(34,'Face on'),(43,'Slide and word reveal'),(53,'Cut starts lower right'),(61,'Outer sweep'),(68,'Inner curl'),(74,'Original logo hold')]:
    scene.timeline_markers.new(name,frame=frame)
scene['adaptation'] = 'User-requested portfolio artwork. Not native Nintendo firmware.'
scene['reference'] = 'User video.mp4: green box turns face-on, slides left, reveals NVIDIA eye and wordmark.'
scene['delivery'] = '80 transparent 180x148 frames at 30000/1001fps; one opening spin, spiral carve, original logo hold.'
scene.render.filepath = str(output / 'frame-')
scene.frame_set(80)
# Leave a camera view available for opening the editable source.
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        area.spaces.active.region_3d.view_perspective = 'CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'assets/blender/nvidia-transform.blend'))
print('NVIDIA scene ready:', bpy.data.filepath)
