"""Run through Blender MCP with absolute ROOT and OUTPUT paths.
The wordmark's triangle spins down like a flywheel and glides left until its tip
points right like a play button. O x H A C K then fire out of that tip, K first,
and spring into their slots; 2 and 6 pop in last, a faint navy glow fades up behind
the letters and one sheen crosses the logo. Frames 121-216 sway seamlessly.
Colour comes from oxhack_rig's SVG gradients. Unlike the rig's defaults, emission
carries most of each colour so it survives the light LCD, and side walls are
darker by object-space normal so the extrusion still reads at 340x160.
"""
import bpy, importlib, json, math, sys
from pathlib import Path
from mathutils import Vector

root, output = Path(ROOT), Path(OUTPUT)
output.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(root / 'scripts/blender'))
import oxhack_rig
importlib.reload(oxhack_rig)

SCENE = 'OxHack Wordmark'
WIDTH, HEIGHT = 340, 160
INTRO, IDLE = 120, 96
FRAMES = INTRO + IDLE

# Replace only this script's own data; another agent shares this Blender.
previous = bpy.data.scenes.get(SCENE)
if previous:
    previous.name = 'Wordmark replaced'
scene = bpy.data.scenes.new(SCENE)
bpy.context.window.scene = scene
if previous:
    bpy.data.scenes.remove(previous)
for blocks in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.node_groups, bpy.data.cameras,
               bpy.data.lights, bpy.data.images, bpy.data.worlds, bpy.data.actions):
    for block in [b for b in blocks if b.name.startswith(('Wordmark', SCENE))]:
        blocks.remove(block)

scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x, scene.render.resolution_y = WIDTH, HEIGHT
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.filter_size = .7
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.render.fps, scene.render.fps_base = 30, 1.001
scene.frame_start, scene.frame_end = 1, FRAMES
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.eevee.taa_render_samples = 64
scene.eevee.use_raytracing = False
scene.render.use_motion_blur = True
scene.render.motion_blur_position = 'CENTER'
scene.eevee.motion_blur_steps = 16
scene.world = bpy.data.worlds.new('Wordmark soft fill')
scene.world.use_nodes = True
background = next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND')
background.inputs['Color'].default_value = (1, 1, 1, 1)
background.inputs['Strength'].default_value = .1

logo = oxhack_rig.load_logo(root / 'scripts/blender/oxhack-logo-contours.json', 'wordmark')
canvas = logo['canvas']
# Same unit as the compact logo's triangle stack, centred on the logo bounds.
UNIT = 5 / 4000
space = oxhack_rig.LogoSpace(canvas, (1755, 1001), UNIT)
REST_WIDTH_PX = 288
VIEW_WIDTH = WIDTH * (3121 - 390) * UNIT / REST_WIDTH_PX
LENS = 85
TIP = space.point(1475, 1247)
PIVOT = space.point(801, 1001)  # The triangle's centroid column at the logo's mid height.


def smooth(t):
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


# ---- Materials ----

def value_node(tree, name, value=0.):
    node = tree.nodes.new('ShaderNodeValue')
    node.name = node.label = name
    node.outputs[0].default_value = value
    return node


def build_accent():
    """Shared SVG-space masks: one sheen band, a hot spot on the tip, a trace pulse."""
    tree = bpy.data.node_groups.new('Wordmark Accent', 'ShaderNodeTree')
    for socket in ('Sheen', 'Tip', 'Pulse'):
        tree.interface.new_socket(socket, in_out='OUTPUT', socket_type='NodeSocketFloat')
    nodes, links = tree.nodes, tree.links

    def math_node(op, a, b=None):
        node = nodes.new('ShaderNodeMath')
        node.operation = op
        for socket, value in zip(node.inputs, (a, b)):
            if value is None:
                continue
            if isinstance(value, (int, float)):
                socket.default_value = value
            else:
                links.new(value, socket)
        return node.outputs[0]

    def band(q, center, width, gain):
        fall = math_node('MAXIMUM', math_node('SUBTRACT', 1, math_node('DIVIDE', math_node('ABSOLUTE', math_node('SUBTRACT', q, center)), width)), 0)
        return math_node('MULTIPLY', math_node('MULTIPLY', fall, fall), gain)

    uv = nodes.new('ShaderNodeUVMap')
    uv.uv_map = 'Logo'
    split = nodes.new('ShaderNodeSeparateXYZ')
    links.new(uv.outputs['UV'], split.inputs[0])
    x = math_node('MULTIPLY', split.outputs[0], canvas[0])
    y = math_node('MULTIPLY', math_node('SUBTRACT', 1, split.outputs[1]), canvas[1])
    skewed = math_node('ADD', x, math_node('MULTIPLY', math_node('SUBTRACT', y, 1000), .45))
    out = nodes.new('NodeGroupOutput')
    sheen_at, sheen_gain = value_node(tree, 'Sheen At', -500), value_node(tree, 'Sheen Gain')
    tip_gain = value_node(tree, 'Tip Gain')
    pulse_at, pulse_gain = value_node(tree, 'Pulse At', -500), value_node(tree, 'Pulse Gain')
    links.new(band(skewed, sheen_at.outputs[0], 150, sheen_gain.outputs[0]), out.inputs['Sheen'])
    dx, dy = math_node('SUBTRACT', x, 1475), math_node('SUBTRACT', y, 1247)
    distance = math_node('SQRT', math_node('ADD', math_node('MULTIPLY', dx, dx), math_node('MULTIPLY', dy, dy)))
    links.new(band(distance, 0, 460, tip_gain.outputs[0]), out.inputs['Tip'])
    links.new(band(x, pulse_at.outputs[0], 110, pulse_gain.outputs[0]), out.inputs['Pulse'])
    return tree


ACCENT = build_accent()
TIP_TINT = (1, .46, .05)


def dress(material, front, side, sheen=1., tip=0., pulse=0.):
    """Emission = logo colour * facing + accents. Front facing reaches the source colour with the lights."""
    tree = material.node_tree
    nodes, links = tree.nodes, tree.links
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    source = bsdf.inputs['Emission Color'].links[0].from_socket if bsdf.inputs['Emission Color'].links else None
    if source is None:
        rgb = nodes.new('ShaderNodeRGB')
        rgb.outputs[0].default_value = bsdf.inputs['Base Color'].default_value
        source = rgb.outputs[0]
    coordinates = nodes.new('ShaderNodeTexCoord')
    normal = nodes.new('ShaderNodeSeparateXYZ')
    links.new(coordinates.outputs['Normal'], normal.inputs[0])
    facing = nodes.new('ShaderNodeMath')
    facing.operation = 'ABSOLUTE'
    links.new(normal.outputs[2], facing.inputs[0])
    strength = nodes.new('ShaderNodeMapRange')
    strength.inputs['To Min'].default_value = side
    strength.inputs['To Max'].default_value = front
    links.new(facing.outputs[0], strength.inputs['Value'])
    scaled = nodes.new('ShaderNodeVectorMath')
    scaled.operation = 'SCALE'
    links.new(source, scaled.inputs[0])
    links.new(strength.outputs[0], scaled.inputs['Scale'])
    accent = nodes.new('ShaderNodeGroup')
    accent.node_tree = ACCENT
    # White masks add evenly; the tip burns orange, since white would erase it on the light LCD.
    tint = nodes.new('ShaderNodeCombineXYZ')
    for axis, weight in zip(tint.inputs, TIP_TINT):
        add = nodes.new('ShaderNodeMath')
        add.operation = 'ADD'
        white = nodes.new('ShaderNodeMath')
        white.operation = 'ADD'
        for index, (socket, gain) in enumerate((('Sheen', sheen), ('Pulse', pulse))):
            scaled_mask = nodes.new('ShaderNodeMath')
            scaled_mask.operation = 'MULTIPLY'
            links.new(accent.outputs[socket], scaled_mask.inputs[0])
            scaled_mask.inputs[1].default_value = gain
            links.new(scaled_mask.outputs[0], white.inputs[index])
        hot = nodes.new('ShaderNodeMath')
        hot.operation = 'MULTIPLY'
        links.new(accent.outputs['Tip'], hot.inputs[0])
        hot.inputs[1].default_value = tip * weight
        links.new(white.outputs[0], add.inputs[0])
        links.new(hot.outputs[0], add.inputs[1])
        links.new(add.outputs[0], axis)
    added = nodes.new('ShaderNodeVectorMath')
    added.operation = 'ADD'
    links.new(scaled.outputs[0], added.inputs[0])
    links.new(tint.outputs[0], added.inputs[1])
    links.new(added.outputs[0], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 1
    return material


gradients = logo['gradients']
FRONT, SIDE = .7, .34
frame_material = dress(oxhack_rig.gradient_material('Wordmark Frame', gradients['shape'], canvas, roughness=.5), .75, .52, sheen=1.1, tip=1.4)
trace_material = dress(oxhack_rig.gradient_material('Wordmark Traces', gradients['shape'], canvas, roughness=.5), .75, .55, sheen=1.1, tip=1.4, pulse=.95)
glass_material = dress(oxhack_rig.gradient_material('Wordmark Glass', gradients['panel'], canvas, alpha=logo['panelOpacity'], roughness=.18), FRONT, FRONT, sheen=.55, tip=1.)
glass_material.use_backface_culling = True
glass_material.use_transparency_overlap = False
text_material = dress(oxhack_rig.gradient_material('Wordmark Letter Rim', gradients['text'], canvas, roughness=.32), FRONT, SIDE, sheen=1.3)
year_material = dress(oxhack_rig.gradient_material('Wordmark Year Rim', gradients['year'], canvas, roughness=.32), FRONT, SIDE, sheen=1.3)
face_material = dress(oxhack_rig.solid_material('Wordmark Letter Face', logo['colors']['face'], roughness=.3), .78, .78, sheen=0)

glow_image = bpy.data.images.load(str(root / 'scripts/blender/oxhack-wordmark-glow.png'))
glow_image.name = 'Wordmark Glow'
glow_image.pack()
glow_material = bpy.data.materials.new('Wordmark Glow')
glow_material.use_nodes = True
glow_material.surface_render_method = 'BLENDED'
glow_nodes, glow_links = glow_material.node_tree.nodes, glow_material.node_tree.links
glow_nodes.remove(next(n for n in glow_nodes if n.type == 'BSDF_PRINCIPLED'))
glow_output = next(n for n in glow_nodes if n.type == 'OUTPUT_MATERIAL')
glow_texture = glow_nodes.new('ShaderNodeTexImage')
glow_texture.image = glow_image
glow_texture.interpolation = 'Cubic'
glow_texture.extension = 'CLIP'
glow_fade = value_node(glow_material.node_tree, 'Glow Fade')
glow_alpha = glow_nodes.new('ShaderNodeMath')
glow_alpha.operation = 'MULTIPLY'
glow_links.new(glow_texture.outputs['Alpha'], glow_alpha.inputs[0])
glow_links.new(glow_fade.outputs[0], glow_alpha.inputs[1])
glow_emission = glow_nodes.new('ShaderNodeEmission')
glow_emission.inputs['Color'].default_value = oxhack_rig.linear(logo['colors']['navy'])
glow_transparent = glow_nodes.new('ShaderNodeBsdfTransparent')
glow_mix = glow_nodes.new('ShaderNodeMixShader')
glow_links.new(glow_alpha.outputs[0], glow_mix.inputs[0])
glow_links.new(glow_transparent.outputs[0], glow_mix.inputs[1])
glow_links.new(glow_emission.outputs[0], glow_mix.inputs[2])
glow_links.new(glow_mix.outputs[0], glow_output.inputs['Surface'])

# ---- Objects ----
collection = scene.collection
layers = logo['layers']


def empty(name, parent=None, location=(0, 0, 0)):
    obj = bpy.data.objects.new('Wordmark ' + name, None)
    collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj


root_pivot = empty('Logo Pivot')
glide = empty('Triangle Glide', root_pivot, (*PIVOT, 0))
spin = empty('Triangle Spin', glide)
triangle_parts = []
for name, contours, back, front, material, bevel in (
    ('Panel', layers['panel'], -.012, .012, glass_material, 0),
    ('Frame', layers['frame'], -.06, .06, frame_material, .006),
    ('Traces', layers['traces'], .012, .05, trace_material, 0),
    ('Label 0x4f', layers['label0x4f'], .012, .04, trace_material, 0),
    ('Label 0x58', layers['label0x58'], .012, .04, trace_material, 0),
):
    part = oxhack_rig.extrude_contours(collection, space, 'Wordmark Triangle ' + name, contours, back, front, material, bevel, origin=PIVOT)
    part.parent = spin
    part.location = (0, 0, 0)
    triangle_parts.append(part)

glow = bpy.data.objects.new('Wordmark Glow', bpy.data.meshes.new('Wordmark Glow'))
half_x, half_y = canvas[0] * UNIT / 2, canvas[1] * UNIT / 2
cx, cy = space.point(canvas[0] / 2, canvas[1] / 2)
# Blended surfaces sort by object origin. A forward origin keeps the glow over the
# glass at every yaw; the plane itself stays just in front of the frame at z .07.
GLOW_ORIGIN_Z, GLOW_PLANE_Z = 1, .07
plane_z = GLOW_PLANE_Z - GLOW_ORIGIN_Z
glow.data.from_pydata([(cx - half_x, cy - half_y, plane_z), (cx + half_x, cy - half_y, plane_z), (cx + half_x, cy + half_y, plane_z), (cx - half_x, cy + half_y, plane_z)], [], [(0, 1, 2, 3)])
glow_uv = glow.data.uv_layers.new(name='Logo')
for loop, uv in zip(glow.data.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
    glow_uv.data[loop.index].uv = uv
glow.data.materials.append(glow_material)
collection.objects.link(glow)
glow.parent = root_pivot
glow.location = (0, 0, GLOW_ORIGIN_Z)

# Letters stand clear of the frame's front at z .06.
LETTER_Z, LETTER_HALF = .15, .07
letters = {}
for char, glyph in logo['glyphs'].items():
    center = oxhack_rig.glyph_center(space, glyph)
    holder = empty('Letter ' + char, root_pivot, (*center, LETTER_Z))
    rim_material = year_material if char in '26' else text_material
    rim = oxhack_rig.extrude_contours(collection, space, f'Wordmark {char} rim', glyph['back'], -LETTER_HALF, LETTER_HALF, rim_material, 0, origin=center)
    face = oxhack_rig.extrude_contours(collection, space, f'Wordmark {char} face', glyph['face'], -LETTER_HALF, LETTER_HALF + .003, face_material, 0, origin=center)
    for mesh in (rim, face):
        mesh.parent = holder
        mesh.location = (0, 0, 0)
    letters[char] = {'holder': holder, 'center': center, 'meshes': (rim, face)}

# ---- Motion ----

def key(obj, frame, **paths):
    for path, value in paths.items():
        setattr(obj, path, value)
        obj.keyframe_insert(path, frame=frame)


def reveal(meshes, start):
    for mesh in meshes:
        for frame, hidden in ((1, True), (start, False)):
            mesh.hide_render = hidden
            mesh.keyframe_insert('hide_render', frame=frame)


# Spin: friction decay from 69 deg/frame (5.8 rev/s), exactly five turns by LAND,
# arriving with a little speed that the damped overshoot then spends.
LAND = 52
TURNS = 5
LAND_RATE = math.radians(7)
POWER = 2.2
SPAN = LAND - 1
START_RATE = LAND_RATE + (TURNS * math.tau - LAND_RATE * SPAN) / SPAN * POWER
SETTLE_PERIOD, SETTLE_DECAY, SETTLE_END = 15, 6.5, 24


def settle(frame, speed):
    """A damped swing from zero that leaves LAND at `speed` and ends at SETTLE_END."""
    u = frame - LAND
    if u <= 0 or u >= SETTLE_END:
        return 0
    omega = math.tau / SETTLE_PERIOD
    return speed / omega * math.exp(-u / SETTLE_DECAY) * math.sin(omega * u) * (1 - (u / SETTLE_END) ** 2) ** 2


def yaw(frame):
    if frame <= LAND:
        t = (frame - 1) / SPAN
        return LAND_RATE * SPAN * t + (START_RATE - LAND_RATE) * SPAN / POWER * (1 - (1 - t) ** POWER)
    return TURNS * math.tau + settle(frame, LAND_RATE)


# K first, O last; every launch kicks the triangle like a recoil.
LAUNCH = {'K': 60, 'C': 65, 'A': 70, 'H': 75, 'x': 80, 'O': 85}


def recoil(frame):
    total = 0
    for start in LAUNCH.values():
        u = frame - start
        if 0 < u < 16:
            total += math.exp(-u / 3.2) * math.sin(math.pi * min(u / 2, 1) / 2) * (1 - u / 16)
    return total


GLIDE_FROM, SPIN_SCALE = 26, 1.03
for frame in range(1, INTRO + 1):
    grow = smooth((frame - 1) / 6)
    glide_t = smooth(smooth((frame - GLIDE_FROM) / (LAND - GLIDE_FROM)))
    x = lerp(0, PIVOT[0], glide_t)
    x += settle(frame, -.055) - .022 * recoil(frame)
    y = lerp(.03, PIVOT[1], glide_t)
    size = lerp(SPIN_SCALE, 1, glide_t) * lerp(.2, 1, grow) * (1 + settle(frame, -.012))
    tilt = 1 - smooth((frame - 30) / (LAND - 30))
    key(glide, frame, location=(x, y, 0), scale=(size, size, size), rotation_euler=(.2 * tilt, 0, -.13 * tilt))
    key(spin, frame, rotation_euler=(0, yaw(frame) + .03 * recoil(frame), 0))

# Motion blur spans the fast turns only, gone well before the first letter.
for frame in range(1, INTRO + 1):
    scene.render.motion_blur_shutter = lerp(.72, 0, smooth((frame - 28) / 20))
    scene.render.keyframe_insert('motion_blur_shutter', frame=frame)


def spring(t):
    """0 to 1 with an eased launch, a small overshoot, and exactly 1 at t=1."""
    t = max(0, min(1, t))
    warped = t ** 1.6
    return 1 - math.exp(-7 * warped) * math.cos(7.5 * warped) * (1 - t ** 4)


def cubic(p0, p1, p2, p3, s):
    r = 1 - s
    return [r * r * r * a + 3 * r * r * s * b + 3 * r * s * s * c + s * s * s * d for a, b, c, d in zip(p0, p1, p2, p3)]


# K C A run straight out along the row. H x O have slots at or behind the tip, so
# they leave the tip, hop up over the row in front of the glass and drop in.
# (first control offset from the tip, second from the slot, duration, flip axis, flips)
FLIGHT = {
    'K': ((.25, .12, .14), (.14, .05, .25), 24, 'y', 1),
    'C': ((.25, .14, .15), (.14, .06, .28), 24, 'x', 1),
    'A': ((.25, .18, .16), (.14, .08, .3), 25, 'y', 1),
    'H': ((.3, .55, .35), (.1, .75, .35), 27, 'x', 1),
    'x': ((.35, .7, .45), (.15, .75, .45), 28, 'y', 1),
    'O': ((.35, .85, .55), (.2, .72, .5), 30, 'y', 2),
}
for char, start in LAUNCH.items():
    info = letters[char]
    holder, (sx, sy) = info['holder'], info['center']
    reveal(info['meshes'], start)
    out_of_tip, into_slot, duration, axis, flips = FLIGHT[char]
    p0 = (*TIP, -.14)
    p1 = (TIP[0] + out_of_tip[0], TIP[1] + out_of_tip[1], out_of_tip[2])
    p2 = (sx + into_slot[0], sy + into_slot[1], LETTER_Z + into_slot[2])
    p3 = (sx, sy, LETTER_Z)
    chord = (Vector(p3) - Vector(p0)).length
    tangent = (Vector(p3) - Vector(p2)).normalized()
    for frame in range(start - 1, start + duration + 1):
        s = spring((frame - start) / duration)
        if s <= 1:
            px, py, pz = cubic(p0, p1, p2, p3, s)
        else:
            # Overshoot along the arrival line, but never back toward the glass.
            px, py, pz = p3[0] + tangent.x * (s - 1) * chord, p3[1] + tangent.y * (s - 1) * chord, LETTER_Z
        size = lerp(.1, 1, smooth(s / .62))
        turn = flips * math.tau * (1 - min(s, 1)) + 1.4 * min(1 - s, 0)
        rotation = (turn, 0, 0) if axis == 'x' else (0, -turn, 0)
        key(holder, frame, location=(px, py, pz), scale=(size, size, size), rotation_euler=rotation)

# 2 and 6 pop in place with a quick spin.
for char, start in (('2', 100), ('6', 104)):
    info = letters[char]
    holder, (sx, sy) = info['holder'], info['center']
    reveal(info['meshes'], start)
    for frame in range(start - 1, min(start + 16, INTRO + 1)):
        s = spring((frame - start) / 15)
        size = max(.001, s + (s - 1) * 1.6 if s > 1 else s)
        key(holder, frame, location=(sx, sy, LETTER_Z), scale=(size, size, size), rotation_euler=(0, -math.tau * (1 - min(s, 1)) - 1.4 * min(1 - s, 0), 0))

# Finale: a charge runs the traces into the tip before the launch; glow and sheen last.
# The source's full glow read too heavy on the LCD; this keeps the white faces legible.
GLOW_STRENGTH = .28
accent_values = {node.name: node for node in ACCENT.nodes if node.type == 'VALUE'}


def key_value(node, frame, value):
    node.outputs[0].default_value = value
    node.outputs[0].keyframe_insert('default_value', frame=frame)


for frame in range(1, INTRO + 1):
    charge = smooth((frame - 48) / 10) * (1 - smooth((frame - 58) / 12))
    launch_flash = sum(math.exp(-(frame - start) / 3) for start in LAUNCH.values() if 0 <= frame - start < 14) * (1 - smooth((frame - 88) / 8))
    key_value(accent_values['Tip Gain'], frame, min(1.4, 1.1 * charge + .9 * launch_flash))
    pulse = (frame - 44) / 16
    second = (frame - 103) / 13
    if 0 <= pulse <= 1:
        at, gain = lerp(420, 1500, pulse), math.sin(math.pi * pulse)
    elif 0 <= second <= 1:
        at, gain = lerp(420, 1500, second), .8 * math.sin(math.pi * second)
    else:
        at, gain = -500, 0
    key_value(accent_values['Pulse At'], frame, at)
    key_value(accent_values['Pulse Gain'], frame, gain)
    sweep = (frame - 106) / 12
    if 0 <= sweep <= 1:
        at, gain = lerp(150, 3500, sweep), .9 * math.sin(math.pi * sweep) ** .5
    else:
        at, gain = -500, 0
    key_value(accent_values['Sheen At'], frame, at)
    key_value(accent_values['Sheen Gain'], frame, gain)
    key_value(glow_fade, frame, GLOW_STRENGTH * smooth((frame - 105) / 13))
glow.hide_render = True
glow.keyframe_insert('hide_render', frame=1)
glow.hide_render = False
glow.keyframe_insert('hide_render', frame=105)

# After the intro the whole logo sways in place, smaller than the narrower
# banners because the wordmark is wide. Frame 216 equals the rest pose.
for frame in [1, INTRO, *range(INTRO + 1, FRAMES + 1)]:
    a = math.tau * max(0, frame - INTRO) / IDLE
    key(root_pivot, frame, rotation_euler=(.04 * math.sin(2 * a), .13 * math.sin(a), 0), location=(0, .022 * math.sin(a), 0))

camera_data = bpy.data.cameras.new('Wordmark banner camera')
camera_data.lens = LENS
camera_data.sensor_width = 36
camera_data.sensor_fit = 'HORIZONTAL'
camera = bpy.data.objects.new(camera_data.name, camera_data)
collection.objects.link(camera)
camera.location = (0, 0, VIEW_WIDTH * LENS / 36)
scene.camera = camera

for name, direction, energy in (('Wordmark key', (-.45, .5, .74), .92), ('Wordmark back rim', (.5, .2, -.84), .9)):
    data = bpy.data.lights.new(name, 'SUN')
    data.energy = energy
    data.angle = math.radians(12)
    data.use_shadow = False
    sun = bpy.data.objects.new(name, data)
    collection.objects.link(sun)
    sun.rotation_euler = Vector(direction).to_track_quat('Z', 'Y').to_euler()

for frame, name in [(1, 'Triangle spins up'), (GLIDE_FROM, 'Glides left'), (LAND, 'Lands, tip right'), (60, 'K leaves the tip'), (85, 'O leaves the tip'), (100, '2 pops'), (104, '6 pops'), (106, 'Glow and sheen'), (INTRO, 'Rest pose'), (INTRO + 1, 'Idle sway loop')]:
    scene.timeline_markers.new(name, frame=frame)
scene['adaptation'] = 'User-requested OxHack portfolio logo animation. Extruded from the supplied wordmark SVG for the light LCD. Not native firmware.'
scene['source_sha256'] = json.loads((root / 'scripts/blender/oxhack-logo-contours.json').read_text())['source']['wordmark']['sha256']
scene['delivery'] = f'{FRAMES} transparent {WIDTH}x{HEIGHT} frames at 30000/1001fps; spin, launch and finale in frames 1-{INTRO}, then a {IDLE}-frame idle sway loop.'
scene.render.filepath = str(output / 'frame-')
scene.frame_set(INTRO)
bpy.data.libraries.write(str(root / 'assets/blender/oxhack-wordmark.blend'), {scene}, fake_user=True)
print('Wordmark scene saved:', scene.name, 'view width', round(VIEW_WIDTH, 3), 'start deg/frame', round(math.degrees(START_RATE), 1))
