"""Reviewed, font-independent reconstruction of the ORIGINAL 3DS XL legends.

Run through Blender MCP only after the hardware modeling pass is stable. This
script is deliberately not a scene rebuild and does not save or export anything.
It replaces named legend meshes and derives their positions from the current
button caps, so a geometry pass may move controls before this pass is applied.

The outlines and millimetre targets are photographic estimates, NOT Nintendo's
font assets. See docs/lettering-audit.md for sources, measurements and limits.
"""
import math
import bpy
from mathutils import Vector


def cubic(a, b, c, d, steps=10):
    return [tuple((1-t)**3*a[j] + 3*(1-t)**2*t*b[j] +
                  3*(1-t)*t*t*c[j] + t**3*d[j] for j in range(2))
            for t in [i / steps for i in range(steps + 1)]]


# Centerlines are authored as geometric hardware strokes, with separate bowls
# and crossbars. Filled ribbons below produce flat ink, not round raised tubing.
GLYPHS = {
    'A': [[(0, 0), (.36, 1), (.72, 0)], [(.14, .36), (.58, .36)]],
    'B': [[(0, 0), (0, 1)], [(0, 1), (.38, 1)] + cubic((.38, 1), (.76, 1), (.76, .52), (.36, .52)) + [(0, .52)],
          [(0, .52), (.39, .52)] + cubic((.39, .52), (.82, .52), (.82, 0), (.39, 0)) + [(0, 0)]],
    'C': [cubic((.70, .85), (.49, 1.16), (0, 1.00), (0, .50)) + cubic((0, .50), (0, 0), (.49, -.16), (.70, .15))[1:]],
    'D': [[(0, 0), (0, 1), (.28, 1)] + cubic((.28, 1), (.91, 1), (.91, 0), (.28, 0))[1:] + [(0, 0)]],
    'E': [[(.68, 1), (0, 1), (0, 0), (.68, 0)], [(0, .5), (.56, .5)]],
    'F': [[(.68, 1), (0, 1), (0, 0)], [(0, .5), (.56, .5)]],
    'H': [[(0, 0), (0, 1)], [(.70, 0), (.70, 1)], [(0, .5), (.70, .5)]],
    'I': [[(.06, 0), (.06, 1)]],
    'L': [[(0, 1), (0, 0), (.64, 0)]],
    'M': [[(0, 0), (0, 1), (.43, .32), (.86, 1), (.86, 0)]],
    'O': [cubic((.37, 1), (-.13, 1), (-.13, 0), (.37, 0)) + cubic((.37, 0), (.87, 0), (.87, 1), (.37, 1))[1:]],
    'P': [[(0, 0), (0, 1), (.37, 1)] + cubic((.37, 1), (.81, 1), (.81, .5), (.37, .5))[1:] + [(0, .5)]],
    'R': [[(0, 0), (0, 1), (.37, 1)] + cubic((.37, 1), (.81, 1), (.81, .5), (.37, .5))[1:] + [(0, .5)], [(.36, .5), (.73, 0)]],
    'S': [cubic((.70, .86), (.53, 1.13), (0, 1.01), (0, .76)) + cubic((0, .76), (0, .43), (.73, .62), (.73, .25))[1:] + cubic((.73, .25), (.73, -.05), (.17, -.12), (0, .16))[1:]],
    'T': [[(0, 1), (.76, 1)], [(.38, 1), (.38, 0)]],
    'W': [[(0, 1), (.20, 0), (.48, .68), (.76, 0), (.96, 1)]],
    'X': [[(0, 1), (.72, 0)], [(0, 0), (.72, 1)]],
    'Y': [[(0, 1), (.36, .53), (.72, 1)], [(.36, .53), (.36, 0)]],
    '3': [cubic((0, .86), (.27, 1.14), (.74, 1.01), (.74, .76)) + cubic((.74, .76), (.74, .61), (.54, .50), (.29, .51))[1:],
          cubic((.29, .51), (.59, .52), (.79, .38), (.74, .18)) + cubic((.74, .18), (.66, -.09), (.20, -.08), (0, .13))[1:]],
}


def paths_for(text, tracking=.25):
    paths, x = [], 0.0
    for char in text:
        glyph = GLYPHS[char]
        lo = min(p[0] for path in glyph for p in path)
        hi = max(p[0] for path in glyph for p in path)
        paths.extend([[(px-lo+x, py) for px, py in path] for path in glyph])
        x += max(hi-lo, .22) + tracking
    return paths


def material(name, color, roughness):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = 0
    p.inputs['Roughness'].default_value = roughness
    m.diffuse_color = (*color, 1)
    return m


def ribbons(paths, stroke=.105):
    verts, faces = [], []
    # Overlapping coplanar facets have identical ink shading and are joined into
    # one named mesh. Flat ink sits 0.012 mm above the cap, without raised tubing.
    for path in paths:
        for a, b in zip(path, path[1:]):
            dx, dy = b[0]-a[0], b[1]-a[1]
            length = math.hypot(dx, dy)
            if length < 1e-9:
                continue
            nx, ny = -dy / length * stroke/2, dx / length * stroke/2
            offset = len(verts)
            verts.extend([(a[0]+nx, a[1]+ny), (a[0]-nx, a[1]-ny),
                          (b[0]-nx, b[1]-ny), (b[0]+nx, b[1]+ny)])
            faces.append(tuple(range(offset, offset+4)))
        # Rounded joins avoid square, stencil-like elbows at small print scale.
        for x, y in path:
            offset = len(verts)
            verts.extend([(x + stroke/2*math.cos(i*math.tau/12),
                           y + stroke/2*math.sin(i*math.tau/12)) for i in range(12)])
            faces.append(tuple(range(offset, offset+12)))
    return verts, faces


def replace_legend(name, paths, width, height, mat, location=None, parent=None,
                   rotation=None, stroke=.105):
    old = bpy.data.objects.get(name)
    if location is None:
        if old is None:
            raise KeyError('Missing legend transform: ' + name)
        location = old.location.copy()
    if parent is None:
        parent = old.parent
    if rotation is None:
        rotation = old.rotation_euler.copy() if old else (0, 0, 0)
    verts, faces = ribbons(paths, stroke)
    xmin, xmax = min(v[0] for v in verts), max(v[0] for v in verts)
    ymin, ymax = min(v[1] for v in verts), max(v[1] for v in verts)
    verts = [((x-(xmin+xmax)/2)/(xmax-xmin)*width,
              (y-(ymin+ymax)/2)/(ymax-ymin)*height, 0) for x, y in verts]
    mesh = bpy.data.meshes.new(name + ' geometric strokes')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.materials.append(mat)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj['lettering_source'] = 'Photographic reconstruction; docs/lettering-audit.md'
    obj['target_width_mm'] = width
    obj['target_cap_height_mm'] = height
    return obj


def cap_surface(name):
    obj = bpy.data.objects[name]
    corners = [obj.matrix_local @ Vector(c) for c in obj.bound_box]
    return ((min(p.x for p in corners)+max(p.x for p in corners))/2,
            (min(p.y for p in corners)+max(p.y for p in corners))/2,
            max(p.z for p in corners)+.012)


def apply_hardware_lettering():
    required = ['Base', '3DS_XL'] + ['Button_'+n for n in ['A', 'B', 'X', 'Y', 'SELECT', 'HOME', 'START']]
    required += ['SELECT print', 'HOME print', 'START print', 'Power print', 'MIC print', '3D print', '3D off print']
    missing = [n for n in required if n not in bpy.data.objects]
    if missing:
        raise RuntimeError('No edits made; required objects missing: ' + ', '.join(missing))
    if abs(bpy.data.objects['3DS_XL'].scale.x-1) > 1e-5:
        raise RuntimeError('No edits made; expected native millimetre scene before export scaling.')
    base = bpy.data.objects['Base']
    bright = material('Silver grey control legends', (.40, .43, .44), .51)
    dark = material('Dark molded hardware legends', (.009, .011, .012), .59)
    for letter, width in [('A', 2.50), ('B', 2.25), ('X', 2.45), ('Y', 2.45)]:
        replace_legend(letter+' print', paths_for(letter), width, 2.70, bright,
                       location=cap_surface('Button_'+letter), parent=base, rotation=(0, 0, 0))
    for word, width in [('SELECT', 11.1), ('HOME', 8.8), ('START', 9.0)]:
        x, y, z = cap_surface('Button_'+word)
        if word == 'HOME':
            x += 1.6
        replace_legend(word+' print', paths_for(word), width, 2.0, dark,
                       location=(x, y, z), parent=base, rotation=(0, 0, 0), stroke=.085)
    x, y, z = cap_surface('Button_HOME')
    house = [[(0, .44), (.5, .93), (1, .44)], [(.18, .60), (.18, 0), (.82, 0), (.82, .60)],
             [(.40, 0), (.40, .32), (.60, .32), (.60, 0)]]
    replace_legend('Home icon', house, 2.8, 2.6, dark,
                   location=(x-5.0, y, z), parent=base, rotation=(0, 0, 0), stroke=.11)
    for name, word, width, height in [('Power print', 'POWER', 9.5, 1.65),
                                       ('MIC print', 'MIC', 3.1, 1.5),
                                       ('3D print', '3D', 3.6, 2.35),
                                       ('3D off print', 'OFF', 4.6, 1.85)]:
        replace_legend(name, paths_for(word), width, height, dark, stroke=.085)
    for obj in bpy.data.objects:
        if obj.name.startswith('Dpad direction mark'):
            obj.data.materials.clear()
            obj.data.materials.append(bright)
    bpy.context.view_layer.update()
    print('Hardware lettering replaced with explicit-size meshes. Save/export after visual review; no save was performed.')


if __name__ == '__main__':
    apply_hardware_lettering()
