"""Union flat ink strokes to eliminate coincident polygons and black joins.

Execute through Blender MCP. Requires Shapely 2.1 in the Blender interpreter or
the temporary geometry tool directory. This only changes the authored outlines'
topology; the photographic glyph sizes and placements are preserved.
"""
import sys
import bpy
sys.path.append('/private/tmp/3ds-label-tools')
from shapely import Polygon, unary_union, constrained_delaunay_triangles

names = [letter + ' print' for letter in 'ABXY'] + [
    'SELECT print', 'HOME print', 'START print', 'Home icon',
    'Power print', 'MIC print', '3D print', '3D off print',
    'L shoulder print', 'R shoulder print']
for name in names:
    obj = bpy.data.objects[name]
    old = obj.data
    polygons = [Polygon([(old.vertices[i].co.x, old.vertices[i].co.y)
                         for i in face.vertices]) for face in old.polygons]
    union = unary_union(polygons)
    if not union.is_valid:
        raise ValueError('Invalid ink outline: ' + name)
    triangles = constrained_delaunay_triangles(union)
    vertices, faces, indices = [], [], {}
    for triangle in triangles.geoms:
        points = list(triangle.exterior.coords)[:-1]
        if not triangle.exterior.is_ccw:
            points.reverse()
        face = []
        for x, y in points:
            key = (x, y)
            if key not in indices:
                indices[key] = len(vertices); vertices.append((x, y, 0))
            face.append(indices[key])
        faces.append(face)
    mesh = bpy.data.meshes.new(name + ' unified ink')
    mesh.from_pydata(vertices, [], faces); mesh.update()
    for mat in old.materials: mesh.materials.append(mat)
    obj.data = mesh
    obj['ink_topology'] = 'Unioned, non-overlapping planar triangles'
    if old.users == 0: bpy.data.meshes.remove(old)

# Injection-molded keycaps have a smoother finish than the surrounding case.
smooth = bpy.data.materials.get('Smooth graphite keycaps')
if smooth is None:
    smooth = bpy.data.materials['Graphite ABS'].copy()
    smooth.name = 'Smooth graphite keycaps'
nodes, links = smooth.node_tree.nodes, smooth.node_tree.links
shader = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
for link in list(shader.inputs['Roughness'].links): links.remove(link)
shader.inputs['Roughness'].default_value = .36
for node in nodes:
    if node.type == 'NORMAL_MAP': node.inputs['Strength'].default_value = .18
for name in ['Button_' + letter for letter in 'ABXY'] + ['Button_Dpad', 'Button_POWER', 'Circle pad bearing']:
    obj = bpy.data.objects[name]
    obj.data.materials.clear(); obj.data.materials.append(smooth)
bpy.context.view_layer.update()
print('Unified hardware legends and separated the smoother molded keycap finish.')
